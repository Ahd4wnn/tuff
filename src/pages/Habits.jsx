import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import {
  Zap,
  Dumbbell,
  BookOpen,
  Brain,
  Activity,
  Droplet,
  Apple,
  Moon,
  Pencil,
  Target,
  Flame,
  Hexagon,
  Check,
  Plus,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  X
} from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const COLORS = ['#1A1A1A', '#C8B89A', '#7A7A7A', '#3D3D3D', '#AEACA6']

const HABIT_ICONS = {
  Zap,
  Dumbbell,
  BookOpen,
  Brain,
  Activity,
  Droplet,
  Apple,
  Moon,
  Pencil,
  Target,
  Flame,
  Hexagon,
}

const ICONS = Object.keys(HABIT_ICONS)
const FREQUENCY_LABELS = { daily: 'Every day', weekdays: 'Weekdays', weekends: 'Weekends', custom: 'Custom' }

export default function Habits() {
  const { profile } = useAuth()
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editHabit, setEditHabit] = useState(null)
  const [todayLogs, setTodayLogs] = useState(new Set())
  const [checking, setChecking] = useState(null)
  const [weekLogs, setWeekLogs] = useState({})
  const [view, setView] = useState('today')

  const today = dayjs().format('YYYY-MM-DD')
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD')
  )

  useEffect(() => {
    if (profile?.id) { fetchHabits(); fetchWeekLogs() }
  }, [profile])

  async function fetchHabits() {
    setLoading(true)
    const { data } = await supabase
      .from('habits').select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
    setHabits(data || [])

    const { data: logs } = await supabase
      .from('habit_logs').select('habit_id')
      .eq('user_id', profile.id).eq('logged_date', today)
    setTodayLogs(new Set((logs || []).map(l => l.habit_id)))
    setLoading(false)
  }

  async function fetchWeekLogs() {
    const { data } = await supabase
      .from('habit_logs').select('habit_id, logged_date')
      .eq('user_id', profile.id)
      .gte('logged_date', weekDates[0])
      .lte('logged_date', weekDates[6])
    const map = {}
    ;(data || []).forEach(l => {
      if (!map[l.habit_id]) map[l.habit_id] = new Set()
      map[l.habit_id].add(l.logged_date)
    })
    setWeekLogs(map)
  }

  async function toggleHabit(habit) {
    setChecking(habit.id)
    const done = todayLogs.has(habit.id)
    try {
      if (done) {
        await supabase.from('habit_logs').delete()
          .eq('habit_id', habit.id).eq('user_id', profile.id).eq('logged_date', today)
        setTodayLogs(s => { const n = new Set(s); n.delete(habit.id); return n })
      } else {
        await supabase.from('habit_logs')
          .insert({ habit_id: habit.id, user_id: profile.id, logged_date: today })
        setTodayLogs(s => new Set(s).add(habit.id))
        if (habit.current_streak !== undefined) {
          await supabase.from('habits').update({
            current_streak: (habit.current_streak || 0) + 1,
            longest_streak: Math.max(habit.longest_streak || 0, (habit.current_streak || 0) + 1),
          }).eq('id', habit.id)
        }
      }
      fetchHabits()
      fetchWeekLogs()
    } finally {
      setChecking(null)
    }
  }

  async function deleteHabit(id) {
    await supabase.from('habits').delete().eq('id', id)
    toast.success('Habit removed.')
    fetchHabits()
  }

  const activeHabits = habits.filter(h => h.is_active)
  const doneToday = activeHabits.filter(h => todayLogs.has(h.id)).length
  const completionPct = activeHabits.length > 0
    ? Math.round((doneToday / activeHabits.length) * 100) : 0

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
          }}>Habits.</h2>
          <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {doneToday}/{activeHabits.length} done today
          </p>
        </div>
        <button onClick={() => { setEditHabit(null); setShowModal(true) }} style={{
          background: '#1A1A1A', color: '#F5F4F0', border: 'none',
          borderRadius: '0.875rem', padding: '0.65rem 1.25rem',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex', alignItems: 'center', gap: '0.35rem'
        }}>
          <Plus size={14} strokeWidth={2.5} />
          <span>New habit</span>
        </button>
      </div>

      {/* Daily progress bar */}
      {activeHabits.length > 0 && (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.1rem', padding: '1.1rem 1.25rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '0.6rem',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1A1A1A' }}>
              Today's progress
            </span>
            <span style={{
              fontSize: '1.1rem', fontWeight: 800,
              letterSpacing: '-0.04em', color: '#1A1A1A',
            }}>{completionPct}%</span>
          </div>
          <div style={{
            height: '6px', background: '#E0DED8',
            borderRadius: '99px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: '#1A1A1A',
              width: `${completionPct}%`,
              borderRadius: '99px', transition: 'width 0.4s ease',
            }} />
          </div>
          {completionPct === 100 && (
            <p style={{
              margin: '0.6rem 0 0', fontSize: '0.8rem',
              color: '#C8B89A', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
              <Flame size={13} fill="#C8B89A" stroke="none" />
              <span>Perfect day. Keep the streak alive.</span>
            </p>
          )}
        </div>
      )}

      {/* View toggle */}
      <div style={{
        display: 'flex', background: '#ECEAE4',
        borderRadius: '0.875rem', padding: '4px',
        marginBottom: '1.25rem',
      }}>
        {['today', 'week', 'all'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: '0.45rem',
            borderRadius: '0.65rem', border: 'none',
            background: view === v ? '#1A1A1A' : 'transparent',
            color: view === v ? '#F5F4F0' : '#7A7A7A',
            fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'capitalize',
          }}>{v}</button>
        ))}
      </div>

      {/* Habits list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#7A7A7A', padding: '3rem 0', fontSize: '0.875rem' }}>
          Loading...
        </div>
      ) : activeHabits.length === 0 ? (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Hexagon size={32} strokeWidth={1.5} style={{ color: '#AEACA6' }} />
          </div>
          <p style={{ color: '#1A1A1A', fontWeight: 600, margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
            No habits yet.
          </p>
          <p style={{ color: '#7A7A7A', fontSize: '0.825rem', margin: '0 0 1.25rem' }}>
            Start small. One habit changes everything.
          </p>
          <button onClick={() => { setEditHabit(null); setShowModal(true) }} style={{
            background: '#1A1A1A', color: '#F5F4F0', border: 'none',
            borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
          }}>
            <span>Add a habit</span>
            <ChevronRight size={14} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {activeHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              done={todayLogs.has(habit.id)}
              checking={checking === habit.id}
              view={view}
              weekDates={weekDates}
              weekLog={weekLogs[habit.id] || new Set()}
              onToggle={() => toggleHabit(habit)}
              onEdit={() => { setEditHabit(habit); setShowModal(true) }}
              onDelete={() => deleteHabit(habit.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <HabitModal
          habit={editHabit}
          profile={profile}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchHabits(); fetchWeekLogs() }}
        />
      )}
    </div>
  )
}

function HabitCard({ habit, done, checking, view, weekDates, weekLog, onToggle, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false)
  const IconComp = HABIT_ICONS[habit.icon] || Zap

  return (
    <div style={{
      background: done && view === 'today' ? '#1A1A1A' : '#ECEAE4',
      border: `1px solid ${done && view === 'today' ? '#1A1A1A' : '#E0DED8'}`,
      borderRadius: '1.1rem', overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      <div style={{
        padding: '0.875rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        {/* Check button */}
        <button
          onClick={onToggle}
          disabled={checking}
          style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            border: `1.5px solid ${done ? 'rgba(245,244,240,0.3)' : habit.color || '#C8B89A'}`,
            background: done ? 'rgba(245,244,240,0.15)' : 'transparent',
            color: done ? '#F5F4F0' : habit.color || '#C8B89A',
            cursor: checking ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          {done ? <Check size={14} strokeWidth={3} /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: habit.color || '#C8B89A' }} />}
        </button>

        {/* Icon + title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              color: done && view === 'today' ? '#F5F4F0' : habit.color || '#1A1A1A',
            }}>
              <IconComp size={16} strokeWidth={2.2} />
            </span>
            <span style={{
              fontSize: '0.9rem', fontWeight: 600,
              color: done && view === 'today' ? '#F5F4F0' : '#1A1A1A',
              textDecoration: done && view === 'today' ? 'line-through' : 'none',
              opacity: done && view === 'today' ? 0.7 : 1,
            }}>{habit.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
            <span style={{
              fontSize: '0.68rem',
              color: done && view === 'today' ? 'rgba(245,244,240,0.4)' : '#7A7A7A',
            }}>
              {FREQUENCY_LABELS[habit.frequency]}
            </span>
            {habit.current_streak > 0 && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600,
                color: '#C8B89A',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Flame size={12} fill="#C8B89A" stroke="none" />
                <span>{habit.current_streak} day streak</span>
              </span>
            )}
          </div>
        </div>

        {/* Week heatmap (week view) */}
        {view === 'week' && (
          <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
            {weekDates.map(d => (
              <div key={d} title={d} style={{
                width: '10px', height: '10px', borderRadius: '3px',
                background: weekLog.has(d) ? '#1A1A1A' : '#E0DED8',
                transition: 'background 0.2s ease',
              }} />
            ))}
          </div>
        )}

        {/* Actions toggle */}
        <button
          onClick={() => setShowActions(s => !s)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: done && view === 'today' ? 'rgba(245,244,240,0.4)' : '#7A7A7A',
            padding: '0.25rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* Action row */}
      {showActions && (
        <div style={{
          borderTop: `1px solid ${done && view === 'today' ? 'rgba(245,244,240,0.1)' : '#E0DED8'}`,
          padding: '0.6rem 1rem',
          display: 'flex', gap: '0.5rem',
          background: done && view === 'today' ? 'rgba(245,244,240,0.05)' : 'rgba(245,244,240,0.5)',
        }}>
          <button onClick={onEdit} style={{
            flex: 1, padding: '0.45rem',
            background: done && view === 'today' ? 'rgba(245,244,240,0.1)' : '#1A1A1A',
            color: '#F5F4F0', border: 'none',
            borderRadius: '0.6rem', fontSize: '0.78rem',
            fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
          }}>
            <Pencil size={12} />
            <span>Edit</span>
          </button>
          <button onClick={onDelete} style={{
            flex: 1, padding: '0.45rem', background: 'transparent',
            border: '1px solid #E0DED8', borderRadius: '0.6rem',
            color: '#7A7A7A', fontSize: '0.78rem',
            fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
          }}>
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

function HabitModal({ habit, profile, onClose, onSave }) {
  const isEdit = !!habit
  const [form, setForm] = useState({
    title: habit?.title || '',
    description: habit?.description || '',
    icon: habit?.icon || 'Zap',
    color: habit?.color || '#1A1A1A',
    frequency: habit?.frequency || 'daily',
    is_active: habit?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Give your habit a name.'); return }
    setSaving(true)
    try {
      if (isEdit) {
        await supabase.from('habits').update(form).eq('id', habit.id)
      } else {
        await supabase.from('habits').insert({ ...form, user_id: profile.id })
      }
      toast.success(isEdit ? 'Habit updated.' : 'Habit created.')
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
      background: 'rgba(26,26,26,0.5)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#F5F4F0', width: '100%', maxWidth: '520px',
        borderRadius: '1.5rem 1.5rem 0 0', padding: '1.75rem 1.5rem',
        maxHeight: '90dvh', overflowY: 'auto',
      }}>
        <div style={{
          width: '36px', height: '4px', borderRadius: '99px',
          background: '#E0DED8', margin: '0 auto 1.5rem',
        }} />

        <h3 style={{
          fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: '#1A1A1A', margin: '0 0 1.5rem',
        }}>{isEdit ? 'Edit habit' : 'New habit'}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Icon picker */}
          <div>
            <label style={labelStyle}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {ICONS.map(ic => {
                const IconComp = HABIT_ICONS[ic]
                return (
                  <button key={ic} onClick={() => set('icon', ic)} style={{
                    width: '38px', height: '38px',
                    borderRadius: '0.6rem', border: `1.5px solid ${form.icon === ic ? '#1A1A1A' : '#E0DED8'}`,
                    background: form.icon === ic ? '#1A1A1A' : '#ECEAE4',
                    color: form.icon === ic ? '#F5F4F0' : '#1A1A1A',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}>
                    <IconComp size={16} strokeWidth={2.2} />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Title</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Read 30 minutes"
              style={mInputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Frequency</label>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                <button key={k} onClick={() => set('frequency', k)} style={{
                  padding: '0.4rem 0.875rem', borderRadius: '99px',
                  border: `1px solid ${form.frequency === k ? '#1A1A1A' : '#E0DED8'}`,
                  background: form.frequency === k ? '#1A1A1A' : 'transparent',
                  color: form.frequency === k ? '#F5F4F0' : '#7A7A7A',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'all 0.15s ease',
                }}>{v}</button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: c, border: `2px solid ${form.color === c ? '#C8B89A' : 'transparent'}`,
                  cursor: 'pointer', outline: 'none',
                  transition: 'all 0.15s ease',
                }} />
              ))}
            </div>
          </div>

          {isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ ...labelStyle, margin: 0 }}>Active</label>
              <button onClick={() => set('is_active', !form.is_active)} style={{
                width: '44px', height: '24px', borderRadius: '99px',
                background: form.is_active ? '#1A1A1A' : '#E0DED8',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.2s ease',
              }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: form.is_active ? '22px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#F5F4F0', transition: 'left 0.2s ease',
                }} />
              </button>
            </div>
          )}
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
          }}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create habit'}</button>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '0.75rem',
  fontWeight: 500, color: '#3D3D3D', marginBottom: '0.4rem',
}

const mInputStyle = {
  width: '100%', padding: '0.7rem 0.875rem',
  background: '#ECEAE4', border: '1px solid #E0DED8',
  borderRadius: '0.75rem', fontSize: '0.875rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
}
