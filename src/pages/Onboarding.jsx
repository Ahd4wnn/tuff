import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const STEPS = [
  {
    key: 'full_name',
    label: "What's your name?",
    sub: "We'll use this to personalize everything.",
    placeholder: 'Adon Joseph',
    type: 'text',
    icon: '◑',
  },
  {
    key: 'username',
    label: 'Pick a username.',
    sub: 'Short, clean, yours.',
    placeholder: 'adon_builds',
    type: 'text',
    icon: '◉',
  },
  {
    key: 'tagline',
    label: 'Describe yourself in one line.',
    sub: 'What would someone say about you at your best?',
    placeholder: 'CS student. Builder. Obsessed.',
    type: 'text',
    icon: '◎',
  },
  {
    key: 'vision_statement',
    label: 'What is your vision for your life?',
    sub: "Don't hold back. This is just for you.",
    placeholder: 'I want to build startups that change how people live...',
    type: 'textarea',
    icon: '◧',
  },
]

const RIGHT_CONTENT = [
  {
    heading: 'Your name is your\nfirst commitment.',
    body: 'The people who own their identity own their future. Start here.',
  },
  {
    heading: 'A handle is\na statement.',
    body: 'Every great builder has a name people remember. Make yours count.',
  },
  {
    heading: 'One line.\nInfinite weight.',
    body: 'The clearest people are the most dangerous. Know who you are.',
  },
  {
    heading: 'Vision is the\nonly compass.',
    body: "Without a north star, every direction feels the same. Write yours down — it changes everything.",
  },
]

export default function Onboarding({ onComplete }) {
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({
    full_name: '', username: '', tagline: '', vision_statement: '',
  })
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  const current = STEPS[step]
  const right = RIGHT_CONTENT[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step) / STEPS.length) * 100

  async function handleNext() {
    if (!values[current.key].trim()) {
      toast.error('Fill this in first.')
      return
    }
    if (!isLast) {
      setDirection(1)
      setStep(s => s + 1)
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(values)
        .eq('id', user.id)
      if (error) throw error
      toast.success("You're all set. Let's go.")
      onComplete()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleBack() {
    setDirection(-1)
    setStep(s => s - 1)
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: '#F5F4F0',
    }}>

      {/* ── LEFT: Form panel ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(2rem, 6vw, 4rem)', minHeight: '100dvh',
        position: 'relative',
      }}>

        {/* Top bar */}
        <div style={{
          position: 'absolute', top: '1.75rem', left: '1.75rem',
          right: '1.75rem', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h1 style={{
            fontSize: '1.35rem', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
          }}>tuff.</h1>
          <span style={{ fontSize: '0.78rem', color: '#7A7A7A', fontWeight: 500 }}>
            {step + 1} of {STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px', background: '#E0DED8',
        }}>
          <div style={{
            height: '100%', background: '#1A1A1A',
            width: `${progress + (100 / STEPS.length)}%`,
            transition: 'width 0.4s ease',
            borderRadius: '0 99px 99px 0',
          }} />
        </div>

        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Step icon */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#1A1A1A', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', color: '#F5F4F0', marginBottom: '1.5rem',
          }}>{current.icon}</div>

          {/* Heading */}
          <h2 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 800,
            letterSpacing: '-0.03em', color: '#1A1A1A',
            lineHeight: 1.15, margin: '0 0 0.5rem',
          }}>{current.label}</h2>
          <p style={{
            color: '#7A7A7A', fontSize: '0.875rem',
            margin: '0 0 1.75rem', lineHeight: 1.5,
          }}>{current.sub}</p>

          {/* Input */}
          {current.type === 'textarea' ? (
            <textarea
              rows={4}
              value={values[current.key]}
              onChange={e => setValues(v => ({ ...v, [current.key]: e.target.value }))}
              placeholder={current.placeholder}
              autoFocus
              style={{
                width: '100%', padding: '1rem',
                background: '#F5F4F0', border: '1px solid #E0DED8',
                borderRadius: '1rem', fontSize: '0.95rem',
                color: '#1A1A1A', outline: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                resize: 'none', boxSizing: 'border-box', lineHeight: 1.6,
                transition: 'border-color 0.2s ease',
              }}
            />
          ) : (
            <input
              type="text"
              value={values[current.key]}
              onChange={e => setValues(v => ({ ...v, [current.key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder={current.placeholder}
              autoFocus
              style={{
                width: '100%', padding: '0.875rem 1rem',
                background: '#F5F4F0', border: '1px solid #E0DED8',
                borderRadius: '0.875rem', fontSize: '1rem',
                color: '#1A1A1A', outline: 'none',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
            />
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            {step > 0 && (
              <button onClick={handleBack} style={{
                padding: '0.875rem 1.25rem',
                background: 'transparent', border: '1px solid #E0DED8',
                borderRadius: '0.875rem', color: '#7A7A7A',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'all 0.15s ease',
              }}>←</button>
            )}
            <button onClick={handleNext} disabled={loading} style={{
              flex: 1, padding: '0.875rem',
              background: loading ? '#7A7A7A' : '#1A1A1A',
              color: '#F5F4F0', border: 'none',
              borderRadius: '0.875rem', fontWeight: 700,
              fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '-0.01em', transition: 'all 0.2s ease',
            }}>
              {loading ? 'Saving...' : isLast ? 'Enter Tuff →' : 'Continue →'}
            </button>
          </div>

          {/* Step dots */}
          <div style={{
            display: 'flex', gap: '6px',
            justifyContent: 'center', marginTop: '2rem',
          }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? '20px' : '6px', height: '6px',
                borderRadius: '99px', background: i <= step ? '#1A1A1A' : '#E0DED8',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Contextual panel — hidden on mobile ── */}
      <div style={{
        width: '46%', background: '#1A1A1A',
        display: 'none', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(2.5rem, 5vw, 4rem)',
        position: 'relative', overflow: 'hidden',
      }} className="onboarding-right-panel">

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '280px', height: '280px', borderRadius: '50%',
          border: '1px solid rgba(200,184,154,0.15)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-40px',
          width: '320px', height: '320px', borderRadius: '50%',
          border: '1px solid rgba(200,184,154,0.08)', pointerEvents: 'none',
        }} />

        {/* Step indicator pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              opacity: i === step ? 1 : i < step ? 0.4 : 0.2,
              transition: 'opacity 0.3s ease',
            }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                border: `1.5px solid ${i <= step ? '#C8B89A' : 'rgba(245,244,240,0.2)'}`,
                background: i < step ? '#C8B89A' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', color: i < step ? '#1A1A1A' : '#C8B89A',
                fontWeight: 700, flexShrink: 0, transition: 'all 0.3s ease',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '0.8rem', color: i === step ? '#F5F4F0' : 'rgba(245,244,240,0.5)',
                fontWeight: i === step ? 600 : 400,
                transition: 'all 0.3s ease',
              }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Main quote for current step */}
        <div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#F5F4F0',
            lineHeight: 1.2, margin: '0 0 1rem',
            whiteSpace: 'pre-line',
          }}>{right.heading}</h2>
          <p style={{
            fontSize: '0.95rem', color: 'rgba(245,244,240,0.55)',
            lineHeight: 1.65, margin: 0, fontWeight: 300,
          }}>{right.body}</p>
        </div>

        {/* Bottom accent */}
        <div style={{
          borderTop: '1px solid rgba(245,244,240,0.08)',
          paddingTop: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(200,184,154,0.15)',
            border: '1px solid rgba(200,184,154,0.3)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1rem',
          }}>◑</div>
          <div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#C8B89A', fontWeight: 600 }}>
              tuff. personal OS
            </p>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(245,244,240,0.35)' }}>
              Setting up your profile
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .onboarding-right-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
