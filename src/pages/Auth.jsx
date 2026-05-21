import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const QUOTES = [
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Obsessed is a word the lazy use to describe the dedicated.", author: "Unknown" },
  { text: "Stay hard.", author: "David Goggins" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
]

const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)]

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        toast.success('Welcome back.')
        navigate('/')
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        toast.success("Account created. Let's go.")
        navigate('/')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: '#F5F4F0',
    }}>

      {/* ── LEFT: Form panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(2rem, 6vw, 4rem)',
        minHeight: '100dvh',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>

          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '2.25rem', fontWeight: 900,
              letterSpacing: '-0.05em', color: '#1A1A1A', margin: 0,
            }}>tuff.</h1>
            <p style={{ color: '#7A7A7A', fontSize: '0.875rem', marginTop: '0.35rem' }}>
              {mode === 'login' ? 'Welcome back. Keep going.' : 'Start your journey.'}
            </p>
          </div>

          <div style={{
            display: 'flex', background: '#ECEAE4',
            borderRadius: '0.875rem', padding: '4px', marginBottom: '2rem',
          }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '0.55rem', borderRadius: '0.65rem',
                border: 'none',
                background: mode === m ? '#1A1A1A' : 'transparent',
                color: mode === m ? '#F5F4F0' : '#7A7A7A',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <Field label="Full name">
                <input
                  type="text" value={fullName} required
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Adon Joseph"
                  style={inputStyle}
                />
              </Field>
            )}

            <Field label="Email">
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.9rem',
                  top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.9rem', color: '#7A7A7A',
                }}>✉</span>
                <input
                  type="email" value={email} required
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                />
              </div>
            </Field>

            <Field label="Password">
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.9rem',
                  top: '50%', transform: 'translateY(-50%)',
                  fontSize: '0.9rem', color: '#7A7A7A',
                }}>⬡</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} required
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingLeft: '2.5rem', paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: '0.9rem',
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#7A7A7A', fontSize: '0.8rem',
                    fontFamily: 'Inter, system-ui, sans-serif', padding: 0,
                  }}
                >{showPassword ? 'hide' : 'show'}</button>
              </div>
            </Field>

            <button type="submit" disabled={loading} style={{
              marginTop: '0.5rem', width: '100%', padding: '0.9rem',
              background: loading ? '#7A7A7A' : '#1A1A1A',
              color: '#F5F4F0', border: 'none', borderRadius: '0.875rem',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '-0.01em',
            }}>
              {loading ? 'Loading...' : mode === 'login' ? 'Log in →' : 'Create account →'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: '2rem',
            fontSize: '0.78rem', color: '#AEACA6',
          }}>
            Built for the ones who mean it.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Motivational panel ── */}
      <div style={{
        width: '48%', background: '#1A1A1A',
        display: 'none', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(2.5rem, 5vw, 4rem)',
        position: 'relative', overflow: 'hidden',
      }} className="auth-right-panel">
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '320px', height: '320px', borderRadius: '50%',
          border: '1px solid rgba(200,184,154,0.15)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '200px', height: '200px', borderRadius: '50%',
          border: '1px solid rgba(200,184,154,0.1)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '360px', height: '360px', borderRadius: '50%',
          border: '1px solid rgba(200,184,154,0.08)', pointerEvents: 'none',
        }} />

        <div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(200,184,154,0.12)',
            border: '1px solid rgba(200,184,154,0.25)',
            borderRadius: '99px', padding: '0.3rem 0.9rem',
            fontSize: '0.75rem', color: '#C8B89A', fontWeight: 500,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            marginBottom: '2rem',
          }}>your personal OS</div>

          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#F5F4F0',
            lineHeight: 1.15, margin: 0,
          }}>
            Everything you need<br />to become the man<br />
            <span style={{ color: '#C8B89A' }}>you're meant to be.</span>
          </h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {['Goals & vision', 'Habit streaks', 'Networking CRM', 'Project tracker', 'Daily journal', 'Knowledge base'].map(f => (
            <div key={f} style={{
              padding: '0.4rem 0.9rem',
              background: 'rgba(245,244,240,0.06)',
              border: '1px solid rgba(245,244,240,0.1)',
              borderRadius: '99px', fontSize: '0.78rem',
              color: 'rgba(245,244,240,0.6)', fontWeight: 400,
            }}>{f}</div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(245,244,240,0.08)', paddingTop: '1.5rem' }}>
          <p style={{
            fontSize: '1rem', color: 'rgba(245,244,240,0.75)',
            fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 1rem', fontWeight: 300,
          }}>"{quote.text}"</p>
          <p style={{ fontSize: '0.8rem', color: '#C8B89A', fontWeight: 500, margin: 0 }}>
            — {quote.author}
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .auth-right-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.78rem', fontWeight: 500,
        color: '#3D3D3D', marginBottom: '0.4rem', letterSpacing: '0.01em',
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#F5F4F0', border: '1px solid #E0DED8',
  borderRadius: '0.75rem', fontSize: '0.9rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box', transition: 'border-color 0.2s ease',
}
