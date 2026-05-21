import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { askGPT } from '../lib/openai'
import CustomSelect from '../components/ui/CustomSelect'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  BookOpen,
  Zap,
  Bookmark,
  Book,
  FileText,
  Hexagon,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Pin,
  Sparkles,
  ExternalLink,
  Plus
} from 'lucide-react'

const CATEGORIES = ['learning', 'idea', 'resource', 'book', 'article', 'other']
const CATEGORY_ICONS = {
  learning: BookOpen,
  idea: Zap,
  resource: Bookmark,
  book: Book,
  article: FileText,
  other: Hexagon,
}
const CATEGORY_COLORS = {
  learning: '#1A1A1A',
  idea: '#C8B89A',
  resource: '#7A7A7A',
  book: '#3D3D3D',
  article: '#AEACA6',
  other: '#E0DED8',
}
const CATEGORY_TEXT_COLORS = {
  learning: '#F5F4F0',
  idea: '#1A1A1A',
  resource: '#F5F4F0',
  book: '#F5F4F0',
  article: '#1A1A1A',
  other: '#1A1A1A',
}

const CATEGORY_OPTIONS = [
  { value: 'learning', label: 'Learning', icon: BookOpen },
  { value: 'idea', label: 'Idea', icon: Zap },
  { value: 'resource', label: 'Resource', icon: Bookmark },
  { value: 'book', label: 'Book', icon: Book },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'other', label: 'Other', icon: Hexagon },
]

export default function Knowledge() {
  const { profile } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editNote, setEditNote] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTag, setFilterTag] = useState('all')
  const [aiSummary, setAiSummary] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)

  useEffect(() => {
    if (profile?.id) fetchNotes()
  }, [profile])

  async function fetchNotes() {
    setLoading(true)
    const { data } = await supabase
      .from('notes').select('*')
      .eq('user_id', profile.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }

  async function togglePin(note) {
    await supabase.from('notes')
      .update({ is_pinned: !note.is_pinned })
      .eq('id', note.id)
    fetchNotes()
  }

  async function deleteNote(id) {
    await supabase.from('notes').delete().eq('id', id)
    toast.success('Note removed.')
    if (expandedId === id) setExpandedId(null)
    fetchNotes()
  }

  async function generateAiSummary() {
    if (notes.length === 0) {
      toast.error('Add some notes first.')
      return
    }
    setAiLoading(true)
    setShowAiPanel(true)
    try {
      const noteTitles = notes.slice(0, 20).map(n =>
        `[${n.category}] ${n.title}: ${n.content?.slice(0, 100) || ''}`
      ).join('\n')
      const summary = await askGPT(
        'You are a personal knowledge assistant. Be concise, insightful, and direct. Max 4 sentences.',
        `Based on these notes from my knowledge base, give me a sharp insight about what I am currently focused on learning and building:\n\n${noteTitles}`,
        { maxTokens: 150, temperature: 0.7 }
      )
      setAiSummary(summary)
    } catch {
      setAiSummary('Could not generate summary. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))]

  const filtered = notes.filter(n => {
    const matchSearch = !search ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchCat = filterCategory === 'all' || n.category === filterCategory
    const matchTag = filterTag === 'all' || (n.tags || []).includes(filterTag)
    return matchSearch && matchCat && matchTag
  })

  const pinned = filtered.filter(n => n.is_pinned)
  const unpinned = filtered.filter(n => !n.is_pinned)

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.2rem)', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
          }}>Knowledge.</h2>
          <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {notes.length} notes · {notes.filter(n => n.is_pinned).length} pinned
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={generateAiSummary} style={{
            background: '#ECEAE4', color: '#1A1A1A',
            border: '1px solid #E0DED8', borderRadius: '0.875rem',
            padding: '0.65rem 1rem', fontWeight: 600,
            fontSize: '0.8rem', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <Sparkles size={13} strokeWidth={2.5} />
            Insight
          </button>
          <button onClick={() => { setEditNote(null); setShowModal(true) }} style={{
            background: '#1A1A1A', color: '#F5F4F0', border: 'none',
            borderRadius: '0.875rem', padding: '0.65rem 1.25rem',
            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <Plus size={15} strokeWidth={2.5} />
            Add note
          </button>
        </div>
      </div>

      {/* AI Insight panel */}
      {showAiPanel && (
        <div style={{
          background: '#1A1A1A', borderRadius: '1.1rem',
          padding: '1.1rem 1.25rem', marginBottom: '1.25rem',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '0.6rem',
          }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
              margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>AI insight — what you're focused on</p>
            <button onClick={() => setShowAiPanel(false)} style={{
              background: 'none', border: 'none', color: 'rgba(245,244,240,0.4)',
              cursor: 'pointer', padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={15} strokeWidth={2.5} />
            </button>
          </div>
          {aiLoading ? (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'rgba(245,244,240,0.3)',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          ) : (
            <p style={{
              color: '#F5F4F0', fontSize: '0.9rem', fontWeight: 300,
              lineHeight: 1.65, margin: 0, fontStyle: 'italic',
            }}>{aiSummary}</p>
          )}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <span style={{
          position: 'absolute', left: '0.9rem', top: '50%',
          transform: 'translateY(-50%)', color: '#7A7A7A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Search size={16} strokeWidth={2.5} />
        </span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search notes, ideas, resources..."
          style={{
            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '0.875rem', fontSize: '0.875rem', color: '#1A1A1A',
            outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
        {['all', ...CATEGORIES].map(c => {
          const Icon = CATEGORY_ICONS[c]
          const isSelected = filterCategory === c
          return (
            <button key={c} onClick={() => setFilterCategory(c)} style={{
              padding: '0.35rem 0.75rem', borderRadius: '99px',
              border: `1px solid ${isSelected ? '#1A1A1A' : '#E0DED8'}`,
              background: isSelected ? '#1A1A1A' : 'transparent',
              color: isSelected ? '#F5F4F0' : '#7A7A7A',
              fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease', textTransform: 'capitalize',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              {Icon && <Icon size={12} strokeWidth={2.5} />}
              <span>{c}</span>
            </button>
          )
        })}
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {['all', ...allTags].map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag)} style={{
              padding: '0.25rem 0.65rem', borderRadius: '99px',
              border: `1px solid ${filterTag === tag ? '#C8B89A' : '#E0DED8'}`,
              background: filterTag === tag ? '#C8B89A' : 'transparent',
              color: filterTag === tag ? '#1A1A1A' : '#7A7A7A',
              fontSize: '0.72rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease',
            }}>{tag}</button>
          ))}
        </div>
      )}

      {/* Notes */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#7A7A7A', padding: '3rem 0', fontSize: '0.875rem' }}>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Bookmark size={36} strokeWidth={1.5} color="#7A7A7A" />
          </div>
          <p style={{ color: '#1A1A1A', fontWeight: 600, margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
            {search ? 'Nothing found.' : 'No notes yet.'}
          </p>
          <p style={{ color: '#7A7A7A', fontSize: '0.825rem', margin: '0 0 1.25rem' }}>
            {search ? 'Try different keywords.' : 'Capture what you learn. It compounds.'}
          </p>
          {!search && (
            <button onClick={() => { setEditNote(null); setShowModal(true) }} style={{
              background: '#1A1A1A', color: '#F5F4F0', border: 'none',
              borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              Add a note
              <Plus size={15} strokeWidth={2.5} />
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Pinned section */}
          {pinned.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600, color: '#7A7A7A',
                margin: '0 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Pinned</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pinned.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    expanded={expandedId === note.id}
                    onExpand={() => setExpandedId(expandedId === note.id ? null : note.id)}
                    onEdit={() => { setEditNote(note); setShowModal(true) }}
                    onDelete={() => deleteNote(note.id)}
                    onTogglePin={() => togglePin(note)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All notes */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <p style={{
                  fontSize: '0.7rem', fontWeight: 600, color: '#7A7A7A',
                  margin: '0 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>All notes</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {unpinned.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    expanded={expandedId === note.id}
                    onExpand={() => setExpandedId(expandedId === note.id ? null : note.id)}
                    onEdit={() => { setEditNote(note); setShowModal(true) }}
                    onDelete={() => deleteNote(note.id)}
                    onTogglePin={() => togglePin(note)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <NoteModal
          note={editNote}
          profile={profile}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchNotes() }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .note-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26,26,26,0.06);
          border-color: #1A1A1A !important;
        }
      `}</style>
    </div>
  )
}

function NoteCard({ note, expanded, onExpand, onEdit, onDelete, onTogglePin }) {
  const IconComponent = CATEGORY_ICONS[note.category] || Hexagon
  const color = CATEGORY_COLORS[note.category] || '#1A1A1A'
  const textColor = CATEGORY_TEXT_COLORS[note.category] || '#F5F4F0'

  return (
    <div className="note-card" style={{
      background: '#ECEAE4', border: `1px solid ${expanded ? '#1A1A1A' : '#E0DED8'}`,
      borderRadius: '1.1rem', overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      <div onClick={onExpand} style={{
        padding: '1rem 1.1rem', cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
      }}>
        {/* Category icon badge */}
        <div style={{
          width: '34px', height: '34px', borderRadius: '0.6rem',
          background: color, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: textColor, flexShrink: 0,
        }}>
          <IconComponent size={16} strokeWidth={2.5} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{
              fontSize: '0.9rem', fontWeight: 700, color: '#1A1A1A',
              margin: 0, letterSpacing: '-0.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{note.title}</h3>
            {note.is_pinned && (
              <Pin size={11} strokeWidth={2.5} style={{ fill: '#C8B89A', color: '#C8B89A', transform: 'rotate(45deg)' }} />
            )}
          </div>
          {note.content && !expanded && (
            <p style={{
              fontSize: '0.78rem', color: '#7A7A7A', margin: 0,
              lineHeight: 1.4, overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>{note.content}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span style={{
              fontSize: '0.65rem', color: '#AEACA6',
            }}>{dayjs(note.created_at).format('MMM D')}</span>
            {(note.tags || []).slice(0, 2).map(tag => (
              <span key={tag} style={{
                padding: '0.1rem 0.5rem', borderRadius: '99px',
                background: '#E0DED8', fontSize: '0.65rem', color: '#3D3D3D',
              }}>{tag}</span>
            ))}
            {(note.tags || []).length > 2 && (
              <span style={{ fontSize: '0.65rem', color: '#AEACA6' }}>
                +{note.tags.length - 2}
              </span>
            )}
          </div>
        </div>

        <span style={{ color: '#7A7A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
        </span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #E0DED8',
          padding: '1rem 1.1rem',
          background: 'rgba(245,244,240,0.5)',
        }}>
          {note.content && (
            <p style={{
              fontSize: '0.875rem', color: '#3D3D3D',
              lineHeight: 1.7, margin: '0 0 0.875rem',
              whiteSpace: 'pre-wrap',
            }}>{note.content}</p>
          )}
          {note.source_url && (
            <a href={note.source_url} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontSize: '0.78rem', color: '#1A1A1A', fontWeight: 600,
              textDecoration: 'none', marginBottom: '0.875rem',
            }}>
              <ExternalLink size={13} strokeWidth={2.5} />
              Source link
            </a>
          )}
          {(note.tags || []).length > 0 && (
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
              {note.tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.2rem 0.6rem', borderRadius: '99px',
                  background: '#E0DED8', fontSize: '0.68rem', color: '#3D3D3D', fontWeight: 500,
                }}>{tag}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onTogglePin} style={{
              padding: '0.45rem 0.875rem',
              background: note.is_pinned ? '#C8B89A' : 'transparent',
              border: `1px solid ${note.is_pinned ? '#C8B89A' : '#E0DED8'}`,
              borderRadius: '0.6rem', color: note.is_pinned ? '#1A1A1A' : '#7A7A7A',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <Pin size={13} strokeWidth={2.5} style={{ fill: note.is_pinned ? '#1A1A1A' : 'none' }} />
              {note.is_pinned ? 'Pinned' : 'Pin'}
            </button>
            <button onClick={onEdit} style={{
              flex: 1, padding: '0.45rem',
              background: '#1A1A1A', color: '#F5F4F0',
              border: 'none', borderRadius: '0.6rem',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>Edit</button>
            <button onClick={onDelete} style={{
              padding: '0.45rem 0.875rem', background: 'transparent',
              border: '1px solid #E0DED8', borderRadius: '0.6rem',
              color: '#7A7A7A', fontSize: '0.78rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
            }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

function NoteModal({ note, profile, onClose, onSave }) {
  const isEdit = !!note
  const [form, setForm] = useState({
    title: note?.title || '',
    content: note?.content || '',
    category: note?.category || 'learning',
    source_url: note?.source_url || '',
    tags: note?.tags || [],
    is_pinned: note?.is_pinned || false,
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiExpanding, setAiExpanding] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  async function aiExpand() {
    if (!form.title.trim() && !form.content.trim()) {
      toast.error('Add a title or some content first.')
      return
    }
    setAiExpanding(true)
    try {
      const expanded = await askGPT(
        'You are a personal knowledge assistant. Expand and enrich notes concisely. Be practical and dense with value. Max 150 words.',
        `Expand this note with key insights, context, or action points:\nTitle: ${form.title}\nContent: ${form.content}`,
        { maxTokens: 200, temperature: 0.7 }
      )
      set('content', form.content ? form.content + '\n\n— AI expansion:\n' + expanded : expanded)
      toast.success('Note expanded.')
    } catch {
      toast.error('Could not expand note.')
    } finally {
      setAiExpanding(false)
    }
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required.'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await supabase.from('notes').update(form).eq('id', note.id)
      } else {
        await supabase.from('notes').insert({ ...form, user_id: profile.id })
      }
      toast.success(isEdit ? 'Note updated.' : 'Note saved.')
      onSave()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#F5F4F0', width: '100%', maxWidth: '560px',
        borderRadius: '1.5rem 1.5rem 0 0', padding: '1.75rem 1.5rem',
        maxHeight: '92dvh', overflowY: 'auto',
      }}>
        <div style={{
          width: '36px', height: '4px', borderRadius: '99px',
          background: '#E0DED8', margin: '0 auto 1.5rem',
        }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '1.5rem',
        }}>
          <h3 style={{
            fontSize: '1.2rem', fontWeight: 800,
            letterSpacing: '-0.03em', color: '#1A1A1A', margin: 0,
          }}>{isEdit ? 'Edit note' : 'New note'}</h3>
          <button onClick={aiExpand} disabled={aiExpanding} style={{
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '0.65rem', padding: '0.4rem 0.875rem',
            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            color: '#1A1A1A', fontFamily: 'Inter, system-ui, sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <Sparkles size={13} strokeWidth={2.5} />
            {aiExpanding ? 'Expanding...' : 'Expand with AI'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MF label="Title">
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="What did you learn?" style={mIS} />
          </MF>

          {/* Category Selector with CustomSelect */}
          <MF label="Category">
            <CustomSelect
              value={form.category}
              onChange={e => set('category', e.target.value)}
              options={CATEGORY_OPTIONS}
            />
          </MF>

          <MF label="Content">
            <textarea
              value={form.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Your notes, thoughts, learnings..."
              rows={6}
              style={{ ...mIS, resize: 'vertical', lineHeight: 1.6 }}
            />
          </MF>

          <MF label="Source URL">
            <input value={form.source_url} onChange={e => set('source_url', e.target.value)}
              placeholder="https://..." style={mIS} />
          </MF>

          <MF label="Tags">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="react, system-design, startup..." style={{ ...mIS, flex: 1 }} />
              <button onClick={addTag} style={{
                background: '#1A1A1A', color: '#F5F4F0', border: 'none',
                borderRadius: '0.65rem', padding: '0 0.875rem',
                fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {form.tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.25rem 0.65rem', borderRadius: '99px',
                  background: '#1A1A1A', color: '#F5F4F0',
                  fontSize: '0.72rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                  {tag}
                  <button onClick={() => set('tags', form.tags.filter(t => t !== tag))} style={{
                    background: 'none', border: 'none', color: 'rgba(245,244,240,0.6)',
                    cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          </MF>

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', padding: '0.5rem 0',
          }}>
            <label style={{
              fontSize: '0.75rem', fontWeight: 500, color: '#3D3D3D',
            }}>Pin this note</label>
            <button onClick={() => set('is_pinned', !form.is_pinned)} style={{
              width: '44px', height: '24px', borderRadius: '99px',
              background: form.is_pinned ? '#1A1A1A' : '#E0DED8',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s ease',
            }}>
              <div style={{
                position: 'absolute', top: '3px',
                left: form.is_pinned ? '22px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#F5F4F0', transition: 'left 0.2s ease',
              }} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.875rem', background: 'transparent',
            border: '1px solid #E0DED8', borderRadius: '0.875rem',
            color: '#7A7A7A', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '0.875rem',
            background: saving ? '#7A7A7A' : '#1A1A1A',
            color: '#F5F4F0', border: 'none', borderRadius: '0.875rem',
            fontWeight: 700, fontSize: '0.9rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Save note'}</button>
        </div>
      </div>
    </div>
  )
}

function MF({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 500,
        color: '#3D3D3D', marginBottom: '0.35rem',
      }}>{label}</label>
      {children}
    </div>
  )
}

const mIS = {
  width: '100%', padding: '0.7rem 0.875rem',
  background: '#ECEAE4', border: '1px solid #E0DED8',
  borderRadius: '0.75rem', fontSize: '0.875rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
}
