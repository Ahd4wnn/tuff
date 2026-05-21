import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { askGPT } from '../lib/openai'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  Moon,
  Sun,
  RefreshCw,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Check,
  BookOpen,
  Sparkles,
  Frown,
  Meh,
  Smile,
  Laugh,
  Flame,
  Plus
} from 'lucide-react'

const MOOD_OPTIONS = [
  { value: 1, label: 'rough',  icon: Frown },
  { value: 2, label: 'low',    icon: Meh },
  { value: 3, label: 'okay',   icon: Smile },
  { value: 4, label: 'good',   icon: Laugh },
  { value: 5, label: 'great',  icon: Flame },
]

const ENERGY_OPTIONS = [
  { value: 1, label: 'Drained'  },
  { value: 2, label: 'Low'      },
  { value: 3, label: 'Average'  },
  { value: 4, label: 'High'     },
  { value: 5, label: 'On fire'  },
]

const PLAN_PROMPTS = [
  "What's the ONE thing that, if done tomorrow, makes everything else easier?",
  "If tomorrow was your last day to make progress — what would you do?",
  "What have you been avoiding that you know matters?",
]

export default function Journal() {
  const { profile } = useAuth()
  const [mode, setMode] = useState('plan')
  const [todayEntry, setTodayEntry] = useState(null)
  const [yesterdayEntry, setYesterdayEntry] = useState(null)
  const [pastEntries, setPastEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedPast, setExpandedPast] = useState(null)
  const [aiCoach, setAiCoach] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiCoach, setShowAiCoach] = useState(false)
  const [planPrompt] = useState(
    PLAN_PROMPTS[Math.floor(Math.random() * PLAN_PROMPTS.length)]
  )

  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  const hour = new Date().getHours()
  const isEvening = hour >= 17

  const [form, setForm] = useState({
    mit_1: '',
    mit_2: '',
    mit_3: '',
    tomorrow_plan: '',
    content: '',
    mood: 3,
    mood_label: 'okay',
    energy_level: 3,
    one_win: '',
    procrastinated_on: '',
    gratitude: ['', '', ''],
    wins: [],
  })

  useEffect(() => {
    if (profile?.id) {
      fetchEntries()
    }
  }, [profile])

  async function fetchEntries() {
    setLoading(true)
    const [{ data: todayData }, { data: yestData }, { data: pastData }] = await Promise.all([
      supabase.from('journal_entries').select('*')
        .eq('user_id', profile.id).eq('entry_date', today).maybeSingle(),
      supabase.from('journal_entries').select('*')
        .eq('user_id', profile.id).eq('entry_date', yesterday).maybeSingle(),
      supabase.from('journal_entries').select('*')
        .eq('user_id', profile.id)
        .lt('entry_date', today)
        .order('entry_date', { ascending: false })
        .limit(10),
    ])

    setTodayEntry(todayData)
    setYesterdayEntry(yestData)
    setPastEntries(pastData || [])

    if (todayData) {
      setForm({
        mit_1: todayData.mit_1 || '',
        mit_2: todayData.mit_2 || '',
        mit_3: todayData.mit_3 || '',
        tomorrow_plan: todayData.tomorrow_plan || '',
        content: todayData.content || '',
        mood: todayData.mood || 3,
        mood_label: todayData.mood_label || 'okay',
        energy_level: todayData.energy_level || 3,
        one_win: todayData.one_win || '',
        procrastinated_on: todayData.procrastinated_on || '',
        gratitude: todayData.gratitude?.length ? todayData.gratitude : ['', '', ''],
        wins: todayData.wins || [],
      })
      setMode(todayData.mode || (isEvening ? 'reflect' : 'plan'))
    } else {
      setMode(isEvening ? 'reflect' : 'plan')
    }
    setLoading(false)
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function setGratitude(i, v) {
    const g = [...form.gratitude]
    g[i] = v
    setField('gratitude', g)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        ...form,
        mode,
        entry_date: today,
        user_id: profile.id,
        gratitude: form.gratitude.filter(g => g.trim()),
        content: form.content || ' ',
      }
      if (todayEntry) {
        await supabase.from('journal_entries').update(payload).eq('id', todayEntry.id)
      } else {
        await supabase.from('journal_entries').insert(payload)
      }
      toast.success('Saved.')
      fetchEntries()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function getAiCoach() {
    setAiLoading(true)
    setShowAiCoach(true)
    try {
      const firstName = profile?.full_name?.split(' ')[0] || 'you'
      const context = `
        MITs for today: ${[form.mit_1, form.mit_2, form.mit_3].filter(Boolean).join(', ') || 'not set'}
        Procrastinated on: ${form.procrastinated_on || 'nothing mentioned'}
        One win: ${form.one_win || 'none mentioned'}
        Mood: ${MOOD_OPTIONS.find(m => m.value === form.mood)?.label}
        Energy: ${ENERGY_OPTIONS.find(e => e.value === form.energy_level)?.label}
        Tomorrow's plan: ${form.tomorrow_plan || 'not written yet'}
        Vision: ${profile?.vision_statement || 'not set'}
      `
      const msg = await askGPT(
        `You are a ruthless but caring accountability coach for ${firstName}. 
         Be direct, specific, and motivating. No fluff. Call out procrastination. 
         Celebrate wins. Push them forward. Max 3 sentences.`,
        `Based on this journal data, give ${firstName} a sharp coaching message:\n${context}`,
        { maxTokens: 120, temperature: 0.85 }
      )
      setAiCoach(msg)
    } catch {
      setAiCoach("You already know what needs to be done. Stop waiting for the right moment. Start now.")
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', color: '#7A7A7A', padding: '3rem 0', fontSize: '0.875rem' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.2rem)', fontWeight: 900,
          letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
        }}>Journal.</h2>
        <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
          {dayjs().format('dddd, MMMM D')}
          {isEvening ? ' · Evening planning time.' : ' · Good morning. Execute.'}
        </p>
      </div>

      {/* Yesterday's MITs carry-over nudge */}
      {yesterdayEntry?.mit_1 && !todayEntry && (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.1rem', padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
        }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 600, color: '#7A7A7A',
            margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>Yesterday you planned</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {[yesterdayEntry.mit_1, yesterdayEntry.mit_2, yesterdayEntry.mit_3]
              .filter(Boolean).map((mit, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#C8B89A', flexShrink: 0,
                }} />
                <span style={{ fontSize: '0.825rem', color: '#3D3D3D' }}>{mit}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setField('mit_1', yesterdayEntry.mit_1 || '')
              setField('mit_2', yesterdayEntry.mit_2 || '')
              setField('mit_3', yesterdayEntry.mit_3 || '')
              toast.success('Carried over from yesterday.')
            }}
            style={{
              marginTop: '0.75rem', background: 'none', border: 'none',
              color: '#1A1A1A', fontSize: '0.78rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif', padding: 0,
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            }}
          >
            <RefreshCw size={12} strokeWidth={2.5} />
            <span>Carry these over</span>
            <ArrowRight size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{
        display: 'flex', background: '#ECEAE4',
        borderRadius: '0.875rem', padding: '4px',
        marginBottom: '1.5rem',
      }}>
        {[
          { key: 'plan',    label: 'Plan tomorrow', icon: Moon },
          { key: 'reflect', label: 'Reflect today', icon: Sun },
        ].map(m => {
          const ToggleIcon = m.icon
          const isActive = mode === m.key
          return (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              flex: 1, padding: '0.55rem', borderRadius: '0.65rem',
              border: 'none',
              background: isActive ? '#1A1A1A' : 'transparent',
              color: isActive ? '#F5F4F0' : '#7A7A7A',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            }}>
              <ToggleIcon size={14} strokeWidth={2.5} />
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── PLAN MODE ── */}
      {mode === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Planning prompt */}
          <div style={{
            background: '#1A1A1A', borderRadius: '1.1rem',
            padding: '1.1rem 1.25rem',
          }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
              margin: '0 0 0.4rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>Tonight's question</p>
            <p style={{
              color: '#F5F4F0', fontSize: '0.9rem', fontWeight: 300,
              lineHeight: 1.6, margin: 0, fontStyle: 'italic',
            }}>{planPrompt}</p>
          </div>

          {/* MITs */}
          <div style={{
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1.25rem', padding: '1.25rem',
          }}>
            <p style={{
              fontSize: '0.8rem', fontWeight: 700, color: '#1A1A1A',
              margin: '0 0 0.3rem',
            }}>3 Most Important Tasks</p>
            <p style={{
              fontSize: '0.75rem', color: '#7A7A7A',
              margin: '0 0 1rem', lineHeight: 1.4,
            }}>
              These 3 things — if done — make tomorrow a win.
              Everything else is bonus.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { key: 'mit_1', num: 1, placeholder: 'The most critical task...' },
                { key: 'mit_2', num: 2, placeholder: 'Second priority...'        },
                { key: 'mit_3', num: 3, placeholder: 'Third priority...'         },
              ].map(({ key, num, placeholder }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: form[key] ? '#1A1A1A' : '#E0DED8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700,
                    color: form[key] ? '#F5F4F0' : '#7A7A7A',
                    transition: 'all 0.2s ease',
                  }}>{num}</div>
                  <input
                    value={form[key]}
                    onChange={e => setField(key, e.target.value)}
                    placeholder={placeholder}
                    style={{
                      flex: 1, padding: '0.65rem 0.875rem',
                      background: '#F5F4F0', border: '1px solid #E0DED8',
                      borderRadius: '0.75rem', fontSize: '0.875rem',
                      color: '#1A1A1A', outline: 'none',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tomorrow's plan */}
          <div>
            <label style={labelStyle}>
              Tomorrow's plan — what does the day look like?
            </label>
            <textarea
              value={form.tomorrow_plan}
              onChange={e => setField('tomorrow_plan', e.target.value)}
              placeholder={`6am — Wake up, no phone\n7am — Deep work block\n12pm — Lunch\n...`}
              rows={6}
              style={{
                width: '100%', padding: '0.875rem 1rem',
                background: '#ECEAE4', border: '1px solid #E0DED8',
                borderRadius: '1rem', fontSize: '0.875rem', color: '#1A1A1A',
                outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                resize: 'none', boxSizing: 'border-box', lineHeight: 1.7,
              }}
            />
          </div>

          {/* Energy for tomorrow */}
          <div>
            <label style={labelStyle}>Expected energy for tomorrow</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {ENERGY_OPTIONS.map(e => (
                <button key={e.value} onClick={() => setField('energy_level', e.value)} style={{
                  flex: 1, padding: '0.5rem 0.25rem',
                  borderRadius: '0.65rem',
                  border: `1px solid ${form.energy_level === e.value ? '#1A1A1A' : '#E0DED8'}`,
                  background: form.energy_level === e.value ? '#1A1A1A' : 'transparent',
                  color: form.energy_level === e.value ? '#F5F4F0' : '#7A7A7A',
                  fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'all 0.15s ease',
                }}>{e.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── REFLECT MODE ── */}
      {mode === 'reflect' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Today's MITs status */}
          {(form.mit_1 || form.mit_2 || form.mit_3) && (
            <div style={{
              background: '#ECEAE4', border: '1px solid #E0DED8',
              borderRadius: '1.25rem', padding: '1.25rem',
            }}>
              <p style={{
                fontSize: '0.8rem', fontWeight: 700, color: '#1A1A1A',
                margin: '0 0 0.75rem',
              }}>Today's MITs — how did you do?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[form.mit_1, form.mit_2, form.mit_3].filter(Boolean).map((mit, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.875rem',
                    background: 'rgba(245,244,240,0.7)', borderRadius: '0.75rem',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: '#C8B89A', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '0.85rem', color: '#1A1A1A', fontWeight: 500 }}>
                      {mit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood */}
          <div>
            <label style={labelStyle}>How was today?</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {MOOD_OPTIONS.map(m => {
                const MoodIcon = m.icon
                const isSelected = form.mood === m.value
                return (
                  <button key={m.value} onClick={() => {
                    setField('mood', m.value)
                    setField('mood_label', m.label)
                  }} style={{
                    flex: 1, padding: '0.65rem 0.25rem',
                    borderRadius: '0.75rem',
                    border: `1px solid ${isSelected ? '#1A1A1A' : '#E0DED8'}`,
                    background: isSelected ? '#1A1A1A' : '#ECEAE4',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.35rem',
                    outline: 'none',
                  }}>
                    <MoodIcon
                      size={20}
                      strokeWidth={2.5}
                      color={isSelected ? '#F5F4F0' : '#7A7A7A'}
                    />
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 600,
                      color: isSelected ? '#F5F4F0' : '#7A7A7A',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      textTransform: 'capitalize'
                    }}>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* One win */}
          <div>
            <label style={labelStyle}>One win from today</label>
            <input
              value={form.one_win}
              onChange={e => setField('one_win', e.target.value)}
              placeholder="Something you did well, no matter how small..."
              style={inputStyle}
            />
          </div>

          {/* Procrastination */}
          <div>
            <label style={labelStyle}>What did you avoid or procrastinate on?</label>
            <input
              value={form.procrastinated_on}
              onChange={e => setField('procrastinated_on', e.target.value)}
              placeholder="Be honest. No judgment here..."
              style={inputStyle}
            />
            {form.procrastinated_on && (
              <p style={{
                margin: '0.4rem 0 0', fontSize: '0.75rem',
                color: '#C8B89A', fontWeight: 500,
              }}>
                → Add this to tomorrow's MITs so it doesn't slip again.
              </p>
            )}
          </div>

          {/* Gratitude */}
          <div>
            <label style={labelStyle}>3 things you're grateful for</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#C8B89A', fontWeight: 700, width: '16px' }}>
                    {i + 1}.
                  </span>
                  <input
                    value={form.gratitude[i]}
                    onChange={e => setGratitude(i, e.target.value)}
                    placeholder={[
                      'Something that helped you today...',
                      'Someone who showed up for you...',
                      'A small thing you noticed...',
                    ][i]}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Free reflection */}
          <div>
            <label style={labelStyle}>Brain dump — anything else on your mind</label>
            <textarea
              value={form.content}
              onChange={e => setField('content', e.target.value)}
              placeholder="Let it all out. Thoughts, feelings, ideas, frustrations..."
              rows={5}
              style={{
                width: '100%', padding: '0.875rem 1rem',
                background: '#ECEAE4', border: '1px solid #E0DED8',
                borderRadius: '1rem', fontSize: '0.875rem', color: '#1A1A1A',
                outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                resize: 'none', boxSizing: 'border-box', lineHeight: 1.7,
              }}
            />
          </div>

          {/* AI Coach */}
          <button onClick={getAiCoach} style={{
            width: '100%', padding: '0.875rem',
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1rem', fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', color: '#1A1A1A',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          }}>
            <Sparkles size={14} strokeWidth={2.5} />
            <span>Get AI coaching on today</span>
          </button>

          {showAiCoach && (
            <div style={{
              background: '#1A1A1A', borderRadius: '1.1rem',
              padding: '1.1rem 1.25rem',
            }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
                margin: '0 0 0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Your coach says</p>
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
                }}>{aiCoach}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={saving} style={{
        width: '100%', marginTop: '2rem', padding: '0.95rem',
        background: saving ? '#7A7A7A' : '#1A1A1A',
        color: '#F5F4F0', border: 'none', borderRadius: '1rem',
        fontWeight: 700, fontSize: '0.95rem',
        cursor: saving ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.01em', transition: 'all 0.2s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
      }}>
        <span>{saving ? 'Saving...' : mode === 'plan' ? 'Lock in tomorrow' : 'Save reflection'}</span>
        <ArrowRight size={16} strokeWidth={2.5} />
      </button>

      {/* Past entries */}
      {pastEntries.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 600, color: '#7A7A7A',
            margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>Past entries</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pastEntries.map(entry => (
              <div key={entry.id} style={{
                background: '#ECEAE4', border: '1px solid #E0DED8',
                borderRadius: '1rem', overflow: 'hidden',
              }}>
                <div
                  onClick={() => setExpandedPast(expandedPast === entry.id ? null : entry.id)}
                  style={{
                    padding: '0.875rem 1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#E0DED8', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#1A1A1A', flexShrink: 0
                    }}>
                      {(() => {
                        const mOpt = MOOD_OPTIONS.find(m => m.value === entry.mood)
                        const PastMoodIcon = mOpt ? mOpt.icon : BookOpen
                        return <PastMoodIcon size={14} strokeWidth={2.5} />
                      })()}
                    </span>
                    <div>
                      <p style={{
                        margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#1A1A1A',
                      }}>{dayjs(entry.entry_date).format('dddd, MMM D')}</p>
                      {entry.one_win && (
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#7A7A7A', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={10} strokeWidth={3} color="#C8B89A" />
                          <span>{entry.one_win}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ color: '#7A7A7A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {expandedPast === entry.id ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                  </span>
                </div>

                {expandedPast === entry.id && (
                  <div style={{
                    borderTop: '1px solid #E0DED8',
                    padding: '1rem',
                    background: 'rgba(245,244,240,0.5)',
                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                  }}>
                    {(entry.mit_1 || entry.mit_2 || entry.mit_3) && (
                      <div>
                        <p style={pastLabelStyle}>MITs</p>
                        {[entry.mit_1, entry.mit_2, entry.mit_3].filter(Boolean).map((m, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0.2rem 0' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#C8B89A' }}>{i + 1}.</span>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: '#3D3D3D' }}>{m}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.one_win && (
                      <div>
                        <p style={pastLabelStyle}>Win</p>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: '#3D3D3D' }}>{entry.one_win}</p>
                      </div>
                    )}
                    {entry.procrastinated_on && (
                      <div>
                        <p style={pastLabelStyle}>Avoided</p>
                        <p style={{ margin: 0, fontSize: '0.825rem', color: '#3D3D3D' }}>{entry.procrastinated_on}</p>
                      </div>
                    )}
                    {entry.gratitude?.length > 0 && (
                      <div>
                        <p style={pastLabelStyle}>Gratitude</p>
                        {entry.gratitude.map((g, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: '0.2rem 0' }}>
                            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#7A7A7A' }} />
                            <p style={{ margin: 0, fontSize: '0.825rem', color: '#3D3D3D' }}>{g}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {entry.content && entry.content.trim() !== '' && (
                      <div>
                        <p style={pastLabelStyle}>Notes</p>
                        <p style={{
                          margin: 0, fontSize: '0.825rem', color: '#3D3D3D',
                          lineHeight: 1.6, whiteSpace: 'pre-wrap',
                        }}>{entry.content}</p>
                      </div>
                    )}
                    {entry.tomorrow_plan && (
                      <div>
                        <p style={pastLabelStyle}>Plan written</p>
                        <p style={{
                          margin: 0, fontSize: '0.825rem', color: '#3D3D3D',
                          lineHeight: 1.6, whiteSpace: 'pre-wrap',
                        }}>{entry.tomorrow_plan}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 600,
  color: '#1A1A1A', marginBottom: '0.5rem',
}

const pastLabelStyle = {
  fontSize: '0.68rem', fontWeight: 700, color: '#7A7A7A',
  textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.3rem',
}

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#ECEAE4', border: '1px solid #E0DED8',
  borderRadius: '0.875rem', fontSize: '0.875rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
}
