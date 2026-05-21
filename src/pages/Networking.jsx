import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  X,
  Plus,
  Trash2,
  MoreHorizontal,
  UserPlus,
  MessageSquare,
  Users,
  Coffee,
  Calendar,
  HelpCircle,
  Pencil
} from 'lucide-react'

const Linkedin = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    stroke="currentColor"
    strokeWidth="2.2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const INTERACTION_TYPES = ['call', 'message', 'meeting', 'email', 'coffee', 'event', 'other']

const INTERACTION_ICONS = {
  call: Phone,
  message: MessageSquare,
  meeting: Users,
  email: Mail,
  coffee: Coffee,
  event: Calendar,
  other: HelpCircle,
}

const STRENGTH_LABELS = { 1: 'Weak', 2: 'Casual', 3: 'Solid', 4: 'Strong', 5: 'Close' }
const STRENGTH_COLORS = {
  1: '#E0DED8', 2: '#C8B89A', 3: '#7A7A7A', 4: '#3D3D3D', 5: '#1A1A1A',
}

export default function Networking() {
  const { profile } = useAuth()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [interactions, setInteractions] = useState([])
  const [search, setSearch] = useState('')
  const [filterTag, setFilterTag] = useState('all')
  const [showInteractionModal, setShowInteractionModal] = useState(false)

  useEffect(() => {
    if (profile?.id) fetchContacts()
  }, [profile])

  async function fetchContacts() {
    setLoading(true)
    const { data } = await supabase
      .from('contacts').select('*')
      .eq('user_id', profile.id)
      .order('full_name', { ascending: true })
    setContacts(data || [])
    setLoading(false)
  }

  async function fetchInteractions(contactId) {
    const { data } = await supabase
      .from('contact_interactions').select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false })
    setInteractions(data || [])
  }

  async function selectContact(contact) {
    setSelectedContact(contact)
    await fetchInteractions(contact.id)
  }

  async function deleteContact(id) {
    await supabase.from('contacts').delete().eq('id', id)
    toast.success('Contact removed.')
    if (selectedContact?.id === id) setSelectedContact(null)
    fetchContacts()
  }

  async function deleteInteraction(id) {
    await supabase.from('contact_interactions').delete().eq('id', id)
    toast.success('Interaction removed.')
    fetchInteractions(selectedContact.id)
  }

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))]
  const filtered = contacts.filter(c => {
    const matchSearch = !search ||
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.role || '').toLowerCase().includes(search.toLowerCase())
    const matchTag = filterTag === 'all' || (c.tags || []).includes(filterTag)
    return matchSearch && matchTag
  })

  const followUpSoon = contacts.filter(c =>
    c.next_followup && dayjs(c.next_followup).diff(dayjs(), 'day') <= 3
  )

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
          }}>Network.</h2>
          <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {contacts.length} connections
          </p>
        </div>
        <button onClick={() => { setEditContact(null); setShowModal(true) }} style={{
          background: '#1A1A1A', color: '#F5F4F0', border: 'none',
          borderRadius: '0.875rem', padding: '0.65rem 1.25rem',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex', alignItems: 'center', gap: '0.35rem'
        }}>
          <Plus size={14} strokeWidth={2.5} />
          <span>Add contact</span>
        </button>
      </div>

      {/* Follow-up nudges */}
      {followUpSoon.length > 0 && (
        <div style={{
          background: '#1A1A1A', borderRadius: '1.1rem',
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
            margin: '0 0 0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Follow up soon</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {followUpSoon.map(c => (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '0.875rem', color: '#F5F4F0', fontWeight: 500 }}>
                  {c.full_name}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'rgba(245,244,240,0.45)' }}>
                  {dayjs(c.next_followup).diff(dayjs(), 'day') === 0
                    ? 'Today'
                    : `In ${dayjs(c.next_followup).diff(dayjs(), 'day')} days`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
        <span style={{
          position: 'absolute', left: '0.9rem', top: '50%',
          transform: 'translateY(-50%)', color: '#7A7A7A',
          display: 'flex', alignItems: 'center'
        }}>
          <Search size={16} />
        </span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, company, role..."
          style={{
            width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '0.875rem', fontSize: '0.875rem', color: '#1A1A1A',
            outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div style={{
          display: 'flex', gap: '0.4rem',
          flexWrap: 'wrap', marginBottom: '1.1rem',
        }}>
          {['all', ...allTags].map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag)} style={{
              padding: '0.3rem 0.75rem', borderRadius: '99px',
              border: `1px solid ${filterTag === tag ? '#1A1A1A' : '#E0DED8'}`,
              background: filterTag === tag ? '#1A1A1A' : 'transparent',
              color: filterTag === tag ? '#F5F4F0' : '#7A7A7A',
              fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease', textTransform: 'capitalize',
            }}>{tag}</button>
          ))}
        </div>
      )}

      {/* Contacts list */}
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
            <UserPlus size={36} strokeWidth={1.5} style={{ color: '#AEACA6' }} />
          </div>
          <p style={{ color: '#1A1A1A', fontWeight: 600, margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
            {search ? 'No contacts found.' : 'No contacts yet.'}
          </p>
          <p style={{ color: '#7A7A7A', fontSize: '0.825rem', margin: '0 0 1.25rem' }}>
            {search ? 'Try a different search.' : 'Your network is your net worth.'}
          </p>
          {!search && (
            <button onClick={() => { setEditContact(null); setShowModal(true) }} style={{
              background: '#1A1A1A', color: '#F5F4F0', border: 'none',
              borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>Add a contact →</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              selected={selectedContact?.id === contact.id}
              interactions={interactions}
              onSelect={() => selectedContact?.id === contact.id
                ? setSelectedContact(null)
                : selectContact(contact)}
              onEdit={() => { setEditContact(contact); setShowModal(true) }}
              onDelete={() => deleteContact(contact.id)}
              onAddInteraction={() => {
                selectContact(contact)
                setShowInteractionModal(true)
              }}
              onDeleteInteraction={deleteInteraction}
            />
          ))}
        </div>
      )}

      {/* Contact modal */}
      {showModal && (
        <ContactModal
          contact={editContact}
          profile={profile}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchContacts() }}
        />
      )}

      {/* Interaction modal */}
      {showInteractionModal && selectedContact && (
        <InteractionModal
          contact={selectedContact}
          profile={profile}
          onClose={() => setShowInteractionModal(false)}
          onSave={() => {
            setShowInteractionModal(false)
            fetchInteractions(selectedContact.id)
            fetchContacts()
          }}
        />
      )}
    </div>
  )
}

function ContactCard({
  contact, selected, interactions,
  onSelect, onEdit, onDelete, onAddInteraction, onDeleteInteraction,
}) {
  const initials = contact.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const strength = contact.relationship_strength || 3

  return (
    <div style={{
      background: '#ECEAE4', border: `1px solid ${selected ? '#1A1A1A' : '#E0DED8'}`,
      borderRadius: '1.1rem', overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      {/* Card row */}
      <div
        onClick={onSelect}
        style={{
          padding: '0.875rem 1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.875rem',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
          background: '#1A1A1A', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: '#F5F4F0', fontSize: '0.8rem', fontWeight: 700,
        }}>{initials}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '0.9rem', fontWeight: 600, color: '#1A1A1A',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{contact.full_name}</span>
            {/* Strength dots */}
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: i <= strength ? STRENGTH_COLORS[strength] : '#E0DED8',
                }} />
              ))}
            </div>
          </div>
          <p style={{
            margin: 0, fontSize: '0.75rem', color: '#7A7A7A',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {[contact.role, contact.company].filter(Boolean).join(' @ ') || 'No role set'}
          </p>
        </div>

        {contact.next_followup && (
          <div style={{
            flexShrink: 0, fontSize: '0.68rem', color: '#C8B89A',
            fontWeight: 600, textAlign: 'right',
          }}>
            <div>Follow up</div>
            <div>{dayjs(contact.next_followup).format('MMM D')}</div>
          </div>
        )}

        <span style={{ color: '#7A7A7A', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'transform 0.25s ease', transform: selected ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={16} />
        </span>
      </div>

      {/* Expanded detail */}
      {selected && (
        <div style={{
          borderTop: '1px solid #E0DED8',
          background: 'rgba(245,244,240,0.6)',
        }}>
          {/* Contact info */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {contact.email && (
              <InfoRow icon={Mail} label={contact.email} />
            )}
            {contact.phone && (
              <InfoRow icon={Phone} label={contact.phone} />
            )}
            {contact.met_at && (
              <InfoRow icon={MapPin} label={`Met at: ${contact.met_at}`} />
            )}
            {contact.linkedin_url && (
              <a href={contact.linkedin_url} target="_blank" rel="noreferrer"
                style={{ textDecoration: 'none' }}>
                <InfoRow icon={Linkedin} label="LinkedIn profile" link />
              </a>
            )}
            {(contact.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                {contact.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '0.2rem 0.6rem', borderRadius: '99px',
                    background: '#E0DED8', fontSize: '0.68rem',
                    color: '#3D3D3D', fontWeight: 500,
                  }}>{tag}</span>
                ))}
              </div>
            )}
            {contact.notes && (
              <p style={{
                margin: '0.5rem 0 0', fontSize: '0.8rem',
                color: '#3D3D3D', lineHeight: 1.5,
                background: '#ECEAE4', borderRadius: '0.65rem',
                padding: '0.65rem 0.875rem',
              }}>{contact.notes}</p>
            )}
          </div>

          {/* Interactions */}
          <div style={{
            borderTop: '1px solid #E0DED8',
            padding: '0.875rem 1rem',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '0.6rem',
            }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1A1A1A' }}>
                Interactions
              </span>
              <button onClick={onAddInteraction} style={{
                background: '#1A1A1A', color: '#F5F4F0', border: 'none',
                borderRadius: '0.5rem', padding: '0.3rem 0.75rem',
                fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
              }}>
                <Plus size={11} strokeWidth={2.5} />
                <span>Log</span>
              </button>
            </div>
            {interactions.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: '#7A7A7A', margin: 0 }}>
                No interactions logged yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {interactions.map(i => {
                  const IconComp = INTERACTION_ICONS[i.interaction_type] || HelpCircle
                  return (
                    <div key={i.id} style={{
                      display: 'flex', alignItems: 'flex-start',
                      justifyContent: 'space-between', gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: '#ECEAE4', borderRadius: '0.65rem',
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span style={{ color: '#7A7A7A', display: 'flex', marginTop: '2px' }}>
                          <IconComp size={15} strokeWidth={2.2} />
                        </span>
                        <div>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#1A1A1A', fontWeight: 500 }}>
                            {i.summary || i.interaction_type}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: '#7A7A7A' }}>
                            {dayjs(i.interaction_date).format('MMM D, YYYY')}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => onDeleteInteraction(i.id)} style={{
                        background: 'none', border: 'none', color: '#AEACA6',
                        cursor: 'pointer', padding: '2px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{
            borderTop: '1px solid #E0DED8',
            padding: '0.75rem 1rem',
            display: 'flex', gap: '0.5rem',
          }}>
            <button onClick={onEdit} style={{
              flex: 1, padding: '0.5rem', background: '#1A1A1A',
              color: '#F5F4F0', border: 'none', borderRadius: '0.65rem',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
            }}>
              <Pencil size={12} />
              <span>Edit</span>
            </button>
            <button onClick={onDelete} style={{
              flex: 1, padding: '0.5rem', background: 'transparent',
              border: '1px solid #E0DED8', borderRadius: '0.65rem',
              color: '#7A7A7A', fontSize: '0.78rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
            }}>
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: IconComponent, label, link }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A7A7A', width: '16px' }}>
        <IconComponent size={14} />
      </span>
      <span style={{
        fontSize: '0.8rem',
        color: link ? '#1A1A1A' : '#3D3D3D',
        textDecoration: link ? 'underline' : 'none',
        fontWeight: link ? 500 : 400
      }}>{label}</span>
    </div>
  )
}

function ContactModal({ contact, profile, onClose, onSave }) {
  const isEdit = !!contact
  const [form, setForm] = useState({
    full_name: contact?.full_name || '',
    role: contact?.role || '',
    company: contact?.company || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    linkedin_url: contact?.linkedin_url || '',
    met_at: contact?.met_at || '',
    notes: contact?.notes || '',
    relationship_strength: contact?.relationship_strength || 3,
    next_followup: contact?.next_followup || '',
    tags: contact?.tags || [],
  })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t || form.tags.includes(t)) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  async function handleSave() {
    if (!form.full_name.trim()) { toast.error('Name is required.'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await supabase.from('contacts').update(form).eq('id', contact.id)
      } else {
        await supabase.from('contacts').insert({ ...form, user_id: profile.id })
      }
      toast.success(isEdit ? 'Contact updated.' : 'Contact added.')
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
        <h3 style={{
          fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: '#1A1A1A', margin: '0 0 1.5rem',
        }}>{isEdit ? 'Edit contact' : 'New contact'}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MF label="Full name">
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Adon Joseph" style={mIS} />
            </MF>
            <MF label="Role">
              <input value={form.role} onChange={e => set('role', e.target.value)}
                placeholder="Founder" style={mIS} />
            </MF>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MF label="Company">
              <input value={form.company} onChange={e => set('company', e.target.value)}
                placeholder="YC S25" style={mIS} />
            </MF>
            <MF label="Met at">
              <input value={form.met_at} onChange={e => set('met_at', e.target.value)}
                placeholder="TechConf 2025" style={mIS} />
            </MF>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MF label="Email">
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="hi@example.com" style={mIS} />
            </MF>
            <MF label="Phone">
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+91 9999999999" style={mIS} />
            </MF>
          </div>
          <MF label="LinkedIn URL">
            <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/..." style={mIS} />
          </MF>
          <MF label={`Relationship strength — ${STRENGTH_LABELS[form.relationship_strength]}`}>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => set('relationship_strength', n)} style={{
                  flex: 1, padding: '0.5rem', borderRadius: '0.6rem',
                  border: `1px solid ${form.relationship_strength >= n ? '#1A1A1A' : '#E0DED8'}`,
                  background: form.relationship_strength >= n ? '#1A1A1A' : 'transparent',
                  color: form.relationship_strength >= n ? '#F5F4F0' : '#7A7A7A',
                  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'all 0.15s ease',
                }}>{n}</button>
              ))}
            </div>
          </MF>
          <MF label="Next follow-up">
            <input type="date" value={form.next_followup}
              onChange={e => set('next_followup', e.target.value)} style={mIS} />
          </MF>
          <MF label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="How you met, what you talked about..." rows={3}
              style={{ ...mIS, resize: 'none', lineHeight: 1.5 }} />
          </MF>
          <MF label="Tags">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="investor, founder, mentor..." style={{ ...mIS, flex: 1 }} />
              <button onClick={addTag} style={{
                background: '#1A1A1A', color: '#F5F4F0', border: 'none',
                borderRadius: '0.65rem', padding: '0 0.875rem',
                fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><Plus size={16} strokeWidth={2.5} /></button>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {form.tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.25rem 0.65rem', borderRadius: '99px',
                  background: '#1A1A1A', color: '#F5F4F0',
                  fontSize: '0.72rem', fontWeight: 500,
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                }}>
                  <span>{tag}</span>
                  <button onClick={() => set('tags', form.tags.filter(t => t !== tag))} style={{
                    background: 'none', border: 'none', color: 'rgba(245,244,240,0.6)',
                    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                  }}>
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          </MF>
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
          }}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add contact'}</button>
        </div>
      </div>
    </div>
  )
}

function InteractionModal({ contact, profile, onClose, onSave }) {
  const [form, setForm] = useState({
    interaction_type: 'meeting',
    summary: '',
    interaction_date: dayjs().format('YYYY-MM-DD'),
  })
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.summary.trim()) { toast.error('Add a quick summary.'); return }
    setSaving(true)
    try {
      await supabase.from('contact_interactions').insert({
        ...form,
        contact_id: contact.id,
        user_id: profile.id,
      })
      await supabase.from('contacts').update({
        last_contacted: form.interaction_date,
      }).eq('id', contact.id)
      toast.success('Interaction logged.')
      onSave()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#F5F4F0', width: '100%', maxWidth: '480px',
        borderRadius: '1.5rem 1.5rem 0 0', padding: '1.75rem 1.5rem',
      }}>
        <div style={{
          width: '36px', height: '4px', borderRadius: '99px',
          background: '#E0DED8', margin: '0 auto 1.5rem',
        }} />
        <h3 style={{
          fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: '#1A1A1A', margin: '0 0 0.3rem',
        }}>Log interaction</h3>
        <p style={{ color: '#7A7A7A', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>
          with {contact.full_name}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MF label="Type">
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {INTERACTION_TYPES.map(t => {
                const IconComp = INTERACTION_ICONS[t] || HelpCircle
                const isActive = form.interaction_type === t
                return (
                  <button key={t} onClick={() => set('interaction_type', t)} style={{
                    padding: '0.35rem 0.75rem', borderRadius: '99px',
                    border: `1px solid ${isActive ? '#1A1A1A' : '#E0DED8'}`,
                    background: isActive ? '#1A1A1A' : 'transparent',
                    color: isActive ? '#F5F4F0' : '#7A7A7A',
                    fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    transition: 'all 0.15s ease',
                  }}>
                    <IconComp size={13} strokeWidth={2.2} />
                    <span style={{ textTransform: 'capitalize' }}>{t}</span>
                  </button>
                )
              })}
            </div>
          </MF>
          <MF label="Summary">
            <textarea value={form.summary} onChange={e => set('summary', e.target.value)}
              placeholder="What did you talk about?" rows={3}
              style={{ ...mIS, resize: 'none', lineHeight: 1.5 }} />
          </MF>
          <MF label="Date">
            <input type="date" value={form.interaction_date}
              onChange={e => set('interaction_date', e.target.value)} style={mIS} />
          </MF>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
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
          }}>{saving ? 'Saving...' : 'Log it'}</button>
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
