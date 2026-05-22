import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { askGPT } from '../lib/openai'
import { Target, Briefcase, Users, Flame, Book, ArrowRight } from 'lucide-react'

const QUOTES_PER_DAY = 3
const CACHE_KEY = 'tuff_daily_quotes'

function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

async function fetchAndCacheQuotes(profile) {
  const firstName = profile?.full_name?.split(' ')[0] || 'you'
  const vision = profile?.vision_statement || 'build great things'
  const raw = await askGPT(
    'You are a motivational coach for ambitious young builders. Be direct, raw, and real. No fluff. Return ONLY a JSON array of 3 short motivational lines, each max 2 sentences. No keys, just a flat array of strings.',
    `Write 3 personalized daily motivation lines for ${firstName} whose vision is: "${vision}". Make each one feel personal and powerful.`,
    { maxTokens: 200, temperature: 0.9 }
  )
  let quotes = []
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    quotes = JSON.parse(cleaned)
  } catch {
    quotes = [
      'Every rep counts. Every day compounds. Keep going.',
      'The vision is clear. The work starts now.',
      'Uncomfortable is just another word for growing.',
    ]
  }
  const cache = { date: getTodayKey(), quotes, index: 0 }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  return cache
}

function getQuoteFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw)
    if (cache.date !== getTodayKey()) return null
    return cache
  } catch {
    return null
  }
}

function advanceCacheIndex() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cache = JSON.parse(raw)
    cache.index = (cache.index + 1) % cache.quotes.length
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    return cache
  } catch {
    return null
  }
}

export default function Dashboard() {
  const { profile } = useAuth()
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' : 'Good evening'

  const [aiQuote, setAiQuote] = useState('')
  const [aiLoading, setAiLoading] = useState(true)
  const [stats, setStats] = useState({
    goalsActive: 0,
    habitsToday: 0,
    habitsTotal: 0,
    projectsActive: 0,
    contactsCount: 0,
    journalToday: false,
    streak: 0,
  })
  const [todayHabits, setTodayHabits] = useState([])
  const [checkingHabit, setCheckingHabit] = useState(null)
  const [todayMITs, setTodayMITs] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  useEffect(() => {
    if (!profile) return
    fetchStats()
    loadQuote()
  }, [profile])

  async function loadQuote() {
    setAiLoading(true)
    try {
      let cache = getQuoteFromCache()
      if (!cache) {
        cache = await fetchAndCacheQuotes(profile)
      }
      setAiQuote(cache.quotes[cache.index])
    } catch {
      setAiQuote('Every rep counts. Every day compounds. Keep going.')
    } finally {
      setAiLoading(false)
    }
  }

  function handleNextQuote() {
    const cache = advanceCacheIndex()
    if (cache) setAiQuote(cache.quotes[cache.index])
  }

  async function fetchStats() {
    if (!profile?.id) return
    const [
      { count: goalsActive },
      { count: projectsActive },
      { count: contactsCount },
      { data: habitsData },
      { data: journalData },
      { data: habitLogsData },
      { data: mitData },
    ] = await Promise.all([
      supabase.from('goals').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).eq('status', 'active'),
      supabase.from('projects').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).eq('status', 'active'),
      supabase.from('contacts').select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id),
      supabase.from('habits').select('*')
        .eq('user_id', profile.id).eq('is_active', true),
      supabase.from('journal_entries').select('id')
        .eq('user_id', profile.id).eq('entry_date', today).maybeSingle(),
      supabase.from('habit_logs').select('habit_id')
        .eq('user_id', profile.id).eq('logged_date', today),
      supabase.from('journal_entries').select('mit_1, mit_2, mit_3')
        .eq('user_id', profile.id).eq('entry_date', today).maybeSingle(),
    ])

    const loggedIds = new Set((habitLogsData || []).map(l => l.habit_id))
    const habits = (habitsData || []).map(h => ({
      ...h, doneToday: loggedIds.has(h.id)
    }))

    setTodayHabits(habits)
    setTodayMITs(mitData)
    setStats({
      goalsActive: goalsActive || 0,
      habitsToday: loggedIds.size,
      habitsTotal: habits.length,
      projectsActive: projectsActive || 0,
      contactsCount: contactsCount || 0,
      journalToday: !!journalData,
      streak: habits.length > 0
        ? Math.max(...habits.map(h => h.current_streak || 0))
        : 0,
    })
  }

  async function toggleHabit(habit) {
    setCheckingHabit(habit.id)
    try {
      if (habit.doneToday) {
        await supabase.from('habit_logs')
          .delete()
          .eq('habit_id', habit.id)
          .eq('user_id', profile.id)
          .eq('logged_date', today)
      } else {
        await supabase.from('habit_logs')
          .insert({ habit_id: habit.id, user_id: profile.id, logged_date: today })
      }
      await fetchStats()
    } finally {
      setCheckingHabit(null)
    }
  }

  const statCards = [
    { label: 'Active goals',   value: stats.goalsActive,    icon: Target },
    { label: 'Live projects',  value: stats.projectsActive, icon: Briefcase },
    { label: 'Connections',    value: stats.contactsCount,  icon: Users },
    { label: 'Best streak',    value: `${stats.streak}d`,   icon: Flame },
  ]

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header with time-aware context */}
      <div style={{ marginBottom: '1.75rem' }}>
        <p style={{
          color: '#7A7A7A', fontSize: '0.8rem',
          margin: '0 0 0.25rem', fontWeight: 500,
        }}>
          {dayName}, {dateStr}
        </p>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.4rem)', fontWeight: 900,
          letterSpacing: '-0.04em', color: '#1A1A1A',
          margin: 0, lineHeight: 1.1,
        }}>
          {greeting},<br />{profile?.full_name?.split(' ')[0] || 'you'}.
        </h2>
        {hour < 9 && (
          <p style={{
            marginTop: '0.5rem', fontSize: '0.825rem',
            color: '#C8B89A', fontWeight: 600,
          }}>
            🌅 Morning window. Best time for deep work.
          </p>
        )}
        {hour >= 9 && hour < 12 && (
          <p style={{
            marginTop: '0.5rem', fontSize: '0.825rem',
            color: '#C8B89A', fontWeight: 600,
          }}>
            ⚡ Peak hours. Protect this time.
          </p>
        )}
        {hour >= 12 && hour < 14 && (
          <p style={{
            marginTop: '0.5rem', fontSize: '0.825rem',
            color: '#7A7A7A', fontWeight: 500,
          }}>
            🍱 Midday. Recharge. Then back at it.
          </p>
        )}
        {hour >= 14 && hour < 17 && (
          <p style={{
            marginTop: '0.5rem', fontSize: '0.825rem',
            color: '#C8B89A', fontWeight: 600,
          }}>
            📬 Afternoon. Good for shallow work + calls.
          </p>
        )}
        {hour >= 17 && hour < 20 && (
          <p style={{
            marginTop: '0.5rem', fontSize: '0.825rem',
            color: '#7A7A7A', fontWeight: 500,
          }}>
            🌇 Evening. Wind down. Plan tomorrow.
          </p>
        )}
        {hour >= 20 && (
          <p style={{
            marginTop: '0.5rem', fontSize: '0.825rem',
            color: '#C8B89A', fontWeight: 600,
          }}>
            🌙 Night. Journal and lock in tomorrow.
          </p>
        )}
      </div>

      {/* AI Quote card */}
      <div style={{
        background: '#1A1A1A', borderRadius: '1.25rem',
        padding: '1.5rem', marginBottom: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          border: '1px solid rgba(200,184,154,0.2)', pointerEvents: 'none',
        }} />
        <p style={{
          fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
          margin: '0 0 0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>Today's fuel</p>
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
            color: '#F5F4F0', fontSize: '1rem', fontWeight: 400,
            lineHeight: 1.6, margin: 0, fontStyle: 'italic',
          }}>{aiQuote}</p>
        )}
        <button onClick={handleNextQuote} style={{
          marginTop: '1rem', background: 'none', border: 'none',
          color: '#C8B89A', fontSize: '0.75rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif', padding: 0, fontWeight: 500,
        }}>↻ next quote</button>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        {statCards.map(({ label, value, icon: IconComponent }) => (
          <div key={label} style={{
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1.1rem', padding: '1.1rem',
          }}>
            <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <IconComponent size={20} strokeWidth={2.2} style={{ color: '#1A1A1A' }} />
            </div>
            <div style={{
              fontSize: '1.75rem', fontWeight: 800,
              letterSpacing: '-0.04em', color: '#1A1A1A', lineHeight: 1,
            }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#7A7A7A', marginTop: '0.25rem' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* MIT preview */}
      {todayMITs && (todayMITs.mit_1 || todayMITs.mit_2 || todayMITs.mit_3) && (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.1rem', padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '0.65rem',
          }}>
            <p style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#1A1A1A',
              margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Today's MITs</p>
            <a href="/journal" style={{
              fontSize: '0.72rem', color: '#7A7A7A',
              textDecoration: 'none', fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
            }}>
              <span>Edit</span>
              <ArrowRight size={12} strokeWidth={2.5} />
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[todayMITs.mit_1, todayMITs.mit_2, todayMITs.mit_3]
              .filter(Boolean).map((mit, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.75rem',
                background: 'rgba(245,244,240,0.7)', borderRadius: '0.65rem',
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                  background: '#1A1A1A', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.62rem', color: '#F5F4F0', fontWeight: 700,
                }}>{i + 1}</div>
                <span style={{
                  fontSize: '0.825rem', color: '#1A1A1A', fontWeight: 500,
                }}>{mit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's habits */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '0.875rem',
        }}>
          <h3 style={{
            fontSize: '1rem', fontWeight: 700,
            letterSpacing: '-0.02em', color: '#1A1A1A', margin: 0,
          }}>Today's habits</h3>
          <span style={{ fontSize: '0.78rem', color: '#7A7A7A' }}>
            {stats.habitsToday}/{stats.habitsTotal} done
          </span>
        </div>

        {todayHabits.length === 0 ? (
          <div style={{
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1rem', padding: '1.25rem',
            textAlign: 'center', color: '#7A7A7A', fontSize: '0.875rem',
          }}>
            No habits yet.{' '}
            <a href="/habits" style={{ color: '#1A1A1A', fontWeight: 600 }}>
              Add your first →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {todayHabits.map(habit => (
              <div key={habit.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                background: habit.doneToday ? '#1A1A1A' : '#ECEAE4',
                border: `1px solid ${habit.doneToday ? '#1A1A1A' : '#E0DED8'}`,
                borderRadius: '1rem', padding: '0.875rem 1rem',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{habit.icon}</span>
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 500,
                    color: habit.doneToday ? '#F5F4F0' : '#1A1A1A',
                    textDecoration: habit.doneToday ? 'line-through' : 'none',
                    opacity: habit.doneToday ? 0.7 : 1,
                  }}>{habit.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {habit.current_streak > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#C8B89A', fontWeight: 600 }}>
                      🔥 {habit.current_streak}
                    </span>
                  )}
                  <button
                    onClick={() => toggleHabit(habit)}
                    disabled={checkingHabit === habit.id}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: `1.5px solid ${habit.doneToday ? 'rgba(245,244,240,0.3)' : '#C8B89A'}`,
                      background: habit.doneToday ? 'rgba(245,244,240,0.15)' : 'transparent',
                      color: habit.doneToday ? '#F5F4F0' : '#C8B89A',
                      cursor: 'pointer', fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s ease', flexShrink: 0,
                    }}
                  >{habit.doneToday ? '✓' : '○'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Journal nudge */}
      {!stats.journalToday && (
        <a href="/journal" style={{ textDecoration: 'none' }}>
          <div style={{
            border: '1px dashed #C8B89A', borderRadius: '1.1rem',
            padding: '1.1rem 1.25rem', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1A1A1A' }}>
                Write today's entry
              </p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#7A7A7A' }}>
                You haven't journaled yet today.
              </p>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#C8B89A' }}>
              <Book size={18} strokeWidth={2.2} />
              <ArrowRight size={16} strokeWidth={2.2} />
            </span>
          </div>
        </a>
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
