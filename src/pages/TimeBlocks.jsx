import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { askGPT } from '../lib/openai'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  Clock,
  Plus,
  Sparkles,
  LayoutGrid,
  Check,
  MoreHorizontal,
  Trash2,
  Calendar
} from 'lucide-react'

const CATEGORIES = {
  deep_work:     { label: 'Deep work',    color: '#1A1A1A', text: '#F5F4F0'  },
  shallow_work:  { label: 'Shallow work', color: '#3D3D3D', text: '#F5F4F0'  },
  meeting:       { label: 'Meeting',      color: '#7A7A7A', text: '#F5F4F0'  },
  health:        { label: 'Health',       color: '#C8B89A', text: '#1A1A1A'  },
  learning:      { label: 'Learning',     color: '#AEACA6', text: '#1A1A1A'  },
  personal:      { label: 'Personal',     color: '#E0DED8', text: '#1A1A1A'  },
  buffer:        { label: 'Buffer',       color: '#ECEAE4', text: '#7A7A7A'  },
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5)

const HOUR_LABELS = {
  5: '5am', 6: '6am', 7: '7am', 8: '8am', 9: '9am',
  10: '10am', 11: '11am', 12: '12pm', 13: '1pm', 14: '2pm',
  15: '3pm', 16: '4pm', 17: '5pm', 18: '6pm', 19: '7pm',
  20: '8pm', 21: '9pm', 22: '10pm', 23: '11pm',
}

const AI_SCHEDULES = {
  deep_focus: {
    label: 'Deep focus day',
    blocks: [
      { start_hour: 5,  end_hour: 6,  label: 'Wake up + no phone',  category: 'personal'     },
      { start_hour: 6,  end_hour: 9,  label: 'Deep work block 1',   category: 'deep_work'    },
      { start_hour: 9,  end_hour: 10, label: 'Break + movement',    category: 'health'        },
      { start_hour: 10, end_hour: 12, label: 'Deep work block 2',   category: 'deep_work'    },
      { start_hour: 12, end_hour: 13, label: 'Lunch + rest',        category: 'personal'     },
      { start_hour: 13, end_hour: 15, label: 'Shallow work + calls',category: 'shallow_work' },
      { start_hour: 15, end_hour: 17, label: 'Learning block',      category: 'learning'     },
      { start_hour: 17, end_hour: 18, label: 'Exercise',            category: 'health'        },
      { start_hour: 20, end_hour: 21, label: 'Journal + plan tomorrow', category: 'personal' },
    ],
  },
  builder: {
    label: 'Builder day',
    blocks: [
      { start_hour: 6,  end_hour: 7,  label: 'Morning routine',     category: 'personal'     },
      { start_hour: 7,  end_hour: 11, label: 'Build — no meetings', category: 'deep_work'    },
      { start_hour: 11, end_hour: 12, label: 'Review + push code',  category: 'shallow_work' },
      { start_hour: 12, end_hour: 13, label: 'Lunch',               category: 'personal'     },
      { start_hour: 13, end_hour: 15, label: 'Build block 2',       category: 'deep_work'    },
      { start_hour: 15, end_hour: 16, label: 'Networking + emails', category: 'shallow_work' },
      { start_hour: 16, end_hour: 17, label: 'Learning',            category: 'learning'     },
      { start_hour: 18, end_hour: 19, label: 'Gym',                 category: 'health'        },
      { start_hour: 21, end_hour: 22, label: 'Plan tomorrow',       category: 'personal'     },
    ],
  },
  recovery: {
    label: 'Recovery day',
    blocks: [
      { start_hour: 7,  end_hour: 8,  label: 'Slow morning',        category: 'personal'     },
      { start_hour: 8,  end_hour: 9,  label: 'Light exercise',      category: 'health'        },
      { start_hour: 9,  end_hour: 11, label: 'Admin + emails',      category: 'shallow_work' },
      { start_hour: 11, end_hour: 12, label: 'One priority task',   category: 'deep_work'    },
      { start_hour: 12, end_hour: 14, label: 'Long lunch + rest',   category: 'personal'     },
      { start_hour: 14, end_hour: 16, label: 'Learning or reading', category: 'learning'     },
      { start_hour: 16, end_hour: 17, label: 'Walk',                category: 'health'        },
      { start_hour: 20, end_hour: 21, label: 'Reflect + journal',   category: 'personal'     },
    ],
  },
}

export default function TimeBlocks() {
  const { profile } = useAuth()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBlock, setEditBlock] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [showTemplates, setShowTemplates] = useState(false)
  const [aiPlanLoading, setAiPlanLoading] = useState(false)
  const [journalMITs, setJournalMITs] = useState(null)
  const currentHour = new Date().getHours()
  const isToday = selectedDate === dayjs().format('YYYY-MM-DD')

  useEffect(() => {
    if (profile?.id) {
      fetchBlocks()
      fetchJournalMITs()
    }
  }, [profile, selectedDate])

  async function fetchBlocks() {
    setLoading(true)
    const { data } = await supabase
      .from('time_blocks').select('*')
      .eq('user_id', profile.id)
      .eq('block_date', selectedDate)
      .order('start_hour', { ascending: true })
    setBlocks(data || [])
    setLoading(false)
  }

  async function fetchJournalMITs() {
    const { data } = await supabase
      .from('journal_entries').select('mit_1, mit_2, mit_3, tomorrow_plan')
      .eq('user_id', profile.id)
      .eq('entry_date', dayjs(selectedDate).subtract(1, 'day').format('YYYY-MM-DD'))
      .maybeSingle()
    setJournalMITs(data)
  }

  async function saveBlock(blockData) {
    try {
      if (blockData.id) {
        await supabase.from('time_blocks').update(blockData).eq('id', blockData.id)
      } else {
        await supabase.from('time_blocks').insert({
          ...blockData,
          user_id: profile.id,
          block_date: selectedDate,
        })
      }
      toast.success('Block saved.')
      fetchBlocks()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function deleteBlock(id) {
    await supabase.from('time_blocks').delete().eq('id', id)
    toast.success('Block removed.')
    fetchBlocks()
  }

  async function toggleBlockDone(block) {
    await supabase.from('time_blocks')
      .update({ is_done: !block.is_done })
      .eq('id', block.id)
    fetchBlocks()
  }

  async function applyTemplate(templateKey) {
    const template = AI_SCHEDULES[templateKey]
    if (!template) return
    try {
      const toInsert = template.blocks.map(b => ({
        ...b,
        user_id: profile.id,
        block_date: selectedDate,
        is_done: false,
      }))
      await supabase.from('time_blocks').delete()
        .eq('user_id', profile.id).eq('block_date', selectedDate)
      await supabase.from('time_blocks').insert(toInsert)
      toast.success(`${template.label} applied.`)
      setShowTemplates(false)
      fetchBlocks()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function generateAiPlan() {
    setAiPlanLoading(true)
    try {
      const mits = journalMITs
        ? [journalMITs.mit_1, journalMITs.mit_2, journalMITs.mit_3].filter(Boolean)
        : []
      const plan = journalMITs?.tomorrow_plan || ''
      const vision = profile?.vision_statement || ''

      const raw = await askGPT(
        `You are a time-blocking assistant. Return ONLY a valid JSON array. 
         No explanation, no markdown, no backticks. Just the raw JSON array.
         Each object must have: start_hour (int 5-23), end_hour (int 6-24), 
         label (string max 30 chars), category (one of: deep_work, shallow_work, 
         meeting, health, learning, personal, buffer).
         end_hour must always be greater than start_hour.
         Create 6-9 time blocks for a productive day.`,
        `Create a time-blocked schedule for tomorrow.
         MITs to accomplish: ${mits.length > 0 ? mits.join(', ') : 'not specified'}
         Tomorrow plan notes: ${plan || 'none'}
         Vision: ${vision || 'build startups'}
         Make deep work blocks 2-3 hours for the MITs. 
         Include health, learning, and personal time.
         Keep it realistic and achievable.`,
        { maxTokens: 400, temperature: 0.7 }
      )

      let parsed = []
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim()
        parsed = JSON.parse(cleaned)
      } catch {
        toast.error('Could not parse AI plan. Try a template instead.')
        return
      }

      const valid = parsed.filter(b =>
        typeof b.start_hour === 'number' &&
        typeof b.end_hour === 'number' &&
        b.end_hour > b.start_hour &&
        b.label && CATEGORIES[b.category]
      )

      if (valid.length === 0) {
        toast.error('AI returned invalid blocks. Try a template.')
        return
      }

      await supabase.from('time_blocks').delete()
        .eq('user_id', profile.id).eq('block_date', selectedDate)
      await supabase.from('time_blocks').insert(
        valid.map(b => ({
          ...b,
          user_id: profile.id,
          block_date: selectedDate,
          is_done: false,
        }))
      )
      toast.success(`${valid.length} blocks planned by AI.`)
      fetchBlocks()
    } catch (err) {
      toast.error('AI planning failed. Try a template.')
    } finally {
      setAiPlanLoading(false)
    }
  }

  const totalHours = blocks.reduce((sum, b) => sum + (b.end_hour - b.start_hour), 0)
  const doneHours = blocks
    .filter(b => b.is_done)
    .reduce((sum, b) => sum + (b.end_hour - b.start_hour), 0)
  const deepWorkHours = blocks
    .filter(b => b.category === 'deep_work')
    .reduce((sum, b) => sum + (b.end_hour - b.start_hour), 0)

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().startOf('week').add(i + 1, 'day')
    return { date: d.format('YYYY-MM-DD'), label: d.format('ddd'), num: d.format('D') }
  })

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '1.25rem',
      }}>
        <div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.2rem)', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
          }}>Time.</h2>
          <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {dayjs(selectedDate).format('dddd, MMMM D')}
            {isToday && ' · Today'}
          </p>
        </div>
        <button onClick={() => { setEditBlock(null); setShowModal(true) }} style={{
          background: '#1A1A1A', color: '#F5F4F0', border: 'none',
          borderRadius: '0.875rem', padding: '0.65rem 1.25rem',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          transition: 'all 0.2s ease',
        }}>
          <Plus size={14} strokeWidth={2.5} />
          <span>Block</span>
        </button>
      </div>

      {/* Week strip */}
      <div style={{
        display: 'flex', gap: '0.35rem',
        marginBottom: '1.25rem', overflowX: 'auto',
        paddingBottom: '4px',
      }}>
        {weekDays.map(d => {
          const isSelected = d.date === selectedDate
          const isCurrentDay = d.date === dayjs().format('YYYY-MM-DD')
          return (
            <button key={d.date} onClick={() => setSelectedDate(d.date)} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px',
              padding: '0.5rem 0.65rem', borderRadius: '0.75rem',
              border: `1px solid ${isSelected ? '#1A1A1A' : '#E0DED8'}`,
              background: isSelected ? '#1A1A1A' : 'transparent',
              cursor: 'pointer', minWidth: '44px',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease',
            }}>
              <span style={{
                fontSize: '0.62rem', fontWeight: 600,
                color: isSelected ? 'rgba(245,244,240,0.5)' : '#7A7A7A',
              }}>{d.label}</span>
              <span style={{
                fontSize: '0.9rem', fontWeight: 700,
                color: isSelected ? '#F5F4F0' : '#1A1A1A',
              }}>{d.num}</span>
              {isCurrentDay && (
                <div style={{
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isSelected ? '#C8B89A' : '#1A1A1A',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Stats row */}
      {blocks.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.6rem', marginBottom: '1.25rem',
        }}>
          {[
            { label: 'Planned',    value: `${totalHours}h`     },
            { label: 'Deep work',  value: `${deepWorkHours}h`  },
            { label: 'Done',       value: `${doneHours}h`      },
          ].map(s => (
            <div key={s.label} style={{
              background: '#ECEAE4', border: '1px solid #E0DED8',
              borderRadius: '0.875rem', padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '1.3rem', fontWeight: 800,
                letterSpacing: '-0.04em', color: '#1A1A1A',
              }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: '#7A7A7A', marginTop: '2px' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MITs from yesterday's plan */}
      {journalMITs && (journalMITs.mit_1 || journalMITs.mit_2 || journalMITs.mit_3) && (
        <div style={{
          background: '#1A1A1A', borderRadius: '1.1rem',
          padding: '1rem 1.25rem', marginBottom: '1.25rem',
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
            margin: '0 0 0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>Today's MITs — from last night's plan</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[journalMITs.mit_1, journalMITs.mit_2, journalMITs.mit_3]
              .filter(Boolean).map((mit, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                  border: '1.5px solid rgba(200,184,154,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', color: '#C8B89A', fontWeight: 700,
                }}>{i + 1}</div>
                <span style={{ fontSize: '0.825rem', color: '#F5F4F0', fontWeight: 500 }}>
                  {mit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI + Templates row */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <button
          onClick={generateAiPlan}
          disabled={aiPlanLoading}
          style={{
            flex: 1, padding: '0.65rem',
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '0.875rem', fontWeight: 600, fontSize: '0.8rem',
            cursor: aiPlanLoading ? 'not-allowed' : 'pointer',
            color: '#1A1A1A', fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          }}
        >
          <Sparkles size={14} strokeWidth={2.5} />
          <span>{aiPlanLoading ? 'Planning...' : 'AI plan my day'}</span>
        </button>
        <button
          onClick={() => setShowTemplates(s => !s)}
          style={{
            flex: 1, padding: '0.65rem',
            background: showTemplates ? '#1A1A1A' : '#ECEAE4',
            border: `1px solid ${showTemplates ? '#1A1A1A' : '#E0DED8'}`,
            borderRadius: '0.875rem', fontWeight: 600, fontSize: '0.8rem',
            cursor: 'pointer',
            color: showTemplates ? '#F5F4F0' : '#1A1A1A',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            transition: 'all 0.15s ease',
          }}
        >
          <LayoutGrid size={14} strokeWidth={2.5} />
          <span>Templates</span>
        </button>
      </div>

      {/* Templates panel */}
      {showTemplates && (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.1rem', padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}>
          <p style={{
            fontSize: '0.72rem', fontWeight: 600, color: '#7A7A7A',
            margin: '0 0 0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>Pick a day template — replaces current blocks</p>
          {Object.entries(AI_SCHEDULES).map(([key, t]) => (
            <button key={key} onClick={() => applyTemplate(key)} style={{
              width: '100%', textAlign: 'left',
              padding: '0.75rem 1rem',
              background: 'rgba(245,244,240,0.7)',
              border: '1px solid #E0DED8', borderRadius: '0.75rem',
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s ease',
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1A1A1A' }}>
                {t.label}
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#7A7A7A' }}>
                {t.blocks.length} blocks · {t.blocks.reduce((s, b) => s + b.end_hour - b.start_hour, 0)}h planned
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#7A7A7A', padding: '3rem 0', fontSize: '0.875rem' }}>
          Loading...
        </div>
      ) : blocks.length === 0 ? (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Clock size={40} strokeWidth={1.5} style={{ color: '#7A7A7A' }} />
          </div>
          <p style={{ color: '#1A1A1A', fontWeight: 600, margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
            No blocks yet.
          </p>
          <p style={{ color: '#7A7A7A', fontSize: '0.825rem', margin: '0 0 1.25rem' }}>
            Unscheduled time is where procrastination lives.
            Plan your day with purpose.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button onClick={generateAiPlan} disabled={aiPlanLoading} style={{
              background: '#1A1A1A', color: '#F5F4F0', border: 'none',
              borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <Sparkles size={14} strokeWidth={2.5} />
              <span>AI plan my day</span>
            </button>
            <button onClick={() => setShowTemplates(true)} style={{
              background: 'transparent', color: '#1A1A1A',
              border: '1px solid #E0DED8', borderRadius: '0.75rem',
              padding: '0.6rem 1.25rem', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <LayoutGrid size={14} strokeWidth={2.5} />
              <span>Use template</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>

          {/* Category legend */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
            marginBottom: '1rem',
          }}>
            {Object.entries(CATEGORIES).map(([k, c]) => (
              <div key={k} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.2rem 0.6rem', borderRadius: '99px',
                background: c.color,
              }}>
                <span style={{ fontSize: '0.65rem', color: c.text, fontWeight: 600 }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>

          {/* Time blocks list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {HOURS.map(hour => {
              const block = blocks.find(b => b.start_hour <= hour && b.end_hour > hour)
              const isBlockStart = block && block.start_hour === hour
              const isPast = isToday && hour < currentHour
              const isCurrent = isToday && hour === currentHour

              if (block && !isBlockStart) return null

              return (
                <div key={hour} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {/* Hour label */}
                  <div style={{
                    width: '36px', flexShrink: 0, textAlign: 'right',
                    paddingTop: block ? '0.75rem' : '0.2rem',
                  }}>
                    <span style={{
                      fontSize: '0.68rem', fontWeight: isCurrent ? 700 : 400,
                      color: isCurrent ? '#1A1A1A' : '#AEACA6',
                    }}>{HOUR_LABELS[hour]}</span>
                  </div>

                  {/* Current time indicator */}
                  <div style={{
                    width: '1px', alignSelf: 'stretch',
                    background: isCurrent ? '#1A1A1A' : '#E0DED8',
                    flexShrink: 0, position: 'relative',
                  }}>
                    {isCurrent && (
                      <div style={{
                        position: 'absolute', top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: '#1A1A1A',
                      }} />
                    )}
                  </div>

                  {/* Block or empty slot */}
                  <div style={{ flex: 1 }}>
                    {block ? (
                      <div style={{
                        background: CATEGORIES[block.category]?.color || '#ECEAE4',
                        borderRadius: '0.875rem',
                        padding: '0.75rem 1rem',
                        opacity: block.is_done ? 0.5 : isPast && !block.is_done ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        minHeight: `${(block.end_hour - block.start_hour) * 40}px`,
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{
                              margin: 0, fontSize: '0.875rem', fontWeight: 700,
                              color: CATEGORIES[block.category]?.text || '#1A1A1A',
                              textDecoration: block.is_done ? 'line-through' : 'none',
                            }}>{block.label}</p>
                            <p style={{
                              margin: '0.2rem 0 0', fontSize: '0.72rem',
                              color: CATEGORIES[block.category]?.text || '#1A1A1A',
                              opacity: 0.6,
                            }}>
                              {HOUR_LABELS[block.start_hour]} — {HOUR_LABELS[block.end_hour] || `${block.end_hour}:00`}
                              {' · '}{block.end_hour - block.start_hour}h
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                              onClick={() => toggleBlockDone(block)}
                              style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                border: `1.5px solid ${CATEGORIES[block.category]?.text || '#1A1A1A'}`,
                                background: block.is_done
                                  ? (CATEGORIES[block.category]?.text || '#1A1A1A')
                                  : 'transparent',
                                color: block.is_done
                                  ? (CATEGORIES[block.category]?.color || '#ECEAE4')
                                  : (CATEGORIES[block.category]?.text || '#1A1A1A'),
                                cursor: 'pointer', fontSize: '0.7rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: 0.8, flexShrink: 0,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {block.is_done && <Check size={12} strokeWidth={3} />}
                            </button>
                            <button
                              onClick={() => { setEditBlock(block); setShowModal(true) }}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: CATEGORIES[block.category]?.text || '#1A1A1A',
                                opacity: 0.5, padding: '0.2rem',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              <MoreHorizontal size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditBlock({ start_hour: hour, end_hour: hour + 1 })
                          setShowModal(true)
                        }}
                        style={{
                          height: '32px', borderRadius: '0.5rem',
                          border: '1px dashed #E0DED8',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer', opacity: 0.4,
                          transition: 'opacity 0.15s ease',
                          gap: '0.25rem',
                        }}
                      >
                        <Plus size={12} strokeWidth={2} style={{ color: '#7A7A7A' }} />
                        <span style={{ fontSize: '0.7rem', color: '#7A7A7A' }}>add block</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Block modal */}
      {showModal && (
        <BlockModal
          block={editBlock}
          onClose={() => { setShowModal(false); setEditBlock(null) }}
          onSave={saveBlock}
          onDelete={editBlock?.id ? () => {
            deleteBlock(editBlock.id)
            setShowModal(false)
            setEditBlock(null)
          } : null}
        />
      )}
    </div>
  )
}

function BlockModal({ block, onClose, onSave, onDelete }) {
  const isEdit = !!block?.id
  const [form, setForm] = useState({
    label:      block?.label      || '',
    category:   block?.category   || 'deep_work',
    start_hour: block?.start_hour ?? 9,
    end_hour:   block?.end_hour   ?? 10,
  })
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.label.trim()) { toast.error('Give this block a label.'); return }
    if (form.end_hour <= form.start_hour) { toast.error('End time must be after start.'); return }
    setSaving(true)
    await onSave(isEdit ? { ...form, id: block.id } : form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#F5F4F0', width: '100%', maxWidth: '480px',
        borderRadius: '1.5rem 1.5rem 0 0', padding: '1.75rem 1.5rem',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div style={{
          width: '36px', height: '4px', borderRadius: '99px',
          background: '#E0DED8', margin: '0 auto 1.5rem',
        }} />
        <h3 style={{
          fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: '#1A1A1A', margin: '0 0 1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
        }}>
          <Calendar size={18} strokeWidth={2.5} style={{ color: '#7A7A7A' }} />
          <span>{isEdit ? 'Edit block' : 'New time block'}</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MF label="What's this block for?">
            <input value={form.label} onChange={e => set('label', e.target.value)}
              placeholder="Deep work — build auth flow" style={mIS} />
          </MF>

          <MF label="Category">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(CATEGORIES).map(([k, c]) => (
                <button key={k} onClick={() => set('category', k)} style={{
                  padding: '0.35rem 0.75rem', borderRadius: '99px',
                  border: `1px solid ${form.category === k ? c.color : '#E0DED8'}`,
                  background: form.category === k ? c.color : 'transparent',
                  color: form.category === k ? c.text : '#7A7A7A',
                  fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'all 0.15s ease',
                }}>{c.label}</button>
              ))}
            </div>
          </MF>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MF label="Start time">
              <select value={form.start_hour} onChange={e => set('start_hour', parseInt(e.target.value))}
                style={mIS}>
                {HOURS.map(h => (
                  <option key={h} value={h}>{HOUR_LABELS[h]}</option>
                ))}
              </select>
            </MF>
            <MF label="End time">
              <select value={form.end_hour} onChange={e => set('end_hour', parseInt(e.target.value))}
                style={mIS}>
                {[...HOURS.slice(1), 24].map(h => (
                  <option key={h} value={h}>{HOUR_LABELS[h] || '12am'}</option>
                ))}
              </select>
            </MF>
          </div>

          {form.end_hour > form.start_hour && (
            <div style={{
              padding: '0.65rem 1rem',
              background: CATEGORIES[form.category]?.color || '#ECEAE4',
              borderRadius: '0.75rem', textAlign: 'center',
            }}>
              <span style={{
                fontSize: '0.825rem', fontWeight: 600,
                color: CATEGORIES[form.category]?.text || '#1A1A1A',
              }}>
                {form.end_hour - form.start_hour} hour{form.end_hour - form.start_hour !== 1 ? 's' : ''} of {CATEGORIES[form.category]?.label}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          {onDelete && (
            <button onClick={onDelete} style={{
              padding: '0.875rem 1rem', background: 'transparent',
              border: '1px solid #E0DED8', borderRadius: '0.875rem',
              color: '#7A7A7A', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.85rem',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            }}>
              <Trash2 size={14} style={{ color: '#7A7A7A' }} />
              <span>Delete</span>
            </button>
          )}
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
          }}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add block'}</button>
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
