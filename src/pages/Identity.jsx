import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { askGPT } from '../lib/openai'
import toast from 'react-hot-toast'
import {
  Target,
  Compass,
  BatteryCharging,
  ShieldAlert,
  Smartphone,
  Sunrise,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  User,
  Activity
} from 'lucide-react'

const DEFAULT_VALUES = [
  'Discipline', 'Integrity', 'Growth', 'Courage',
  'Focus', 'Consistency', 'Ownership', 'Excellence',
]

const PROCRASTINATION_INTERRUPTS = [
  { trigger: "I'll do it later",        response: "Later is where dreams go to die. 5 seconds. Start now."                          },
  { trigger: "I don't feel like it",    response: "Feelings are passengers. You're the driver. Move."                              },
  { trigger: "I need to be in the mood",response: "Pros don't wait for mood. The mood follows the action."                        },
  { trigger: "It's too hard",           response: "Hard means you're growing. Easy means you're standing still."                   },
  { trigger: "I'll start tomorrow",     response: "Tomorrow you said the same thing. Today is the only day that exists."          },
  { trigger: "I'm not ready",           response: "Nobody is ever ready. Ready is a myth. Start unready."                         },
]

const VISUAL_TRIGGERS = [
  { id: 'broke',    label: 'Remember why you started',   icon: Target, text: "You started because you were tired of the life you had. Don't go back."         },
  { id: 'compare',  label: 'Stop comparing',             icon: Compass, text: "Their chapter 10 is not your chapter 1. Run your own race."                     },
  { id: 'tired',    label: 'When you feel tired',        icon: BatteryCharging, text: "Your future self is watching. Don't let them down."                             },
  { id: 'doubt',    label: 'When you doubt yourself',    icon: ShieldAlert, text: "Every person you look up to felt exactly this. They kept going anyway."         },
  { id: 'distract', label: 'Before opening social media',icon: Smartphone, text: "Is this moving you forward or keeping you comfortable? You already know."       },
  { id: 'morning',  label: 'First thing in the morning', icon: Sunrise, text: "Today is a gift. Most people will waste it. You won't."                         },
]

export default function Identity() {
  const { profile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('identity')
  const [activeTrigger, setActiveTrigger] = useState(null)
  const [activeInterrupt, setActiveInterrupt] = useState(null)
  const [aiManifesto, setAiManifesto] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showManifesto, setShowManifesto] = useState(false)

  const [form, setForm] = useState({
    full_name:         '',
    username:          '',
    tagline:           '',
    vision_statement:  '',
    core_values:       [],
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:        profile.full_name        || '',
        username:         profile.username          || '',
        tagline:          profile.tagline           || '',
        vision_statement: profile.vision_statement  || '',
        core_values:      profile.core_values       || [],
      })
    }
  }, [profile])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleValue(v) {
    if (form.core_values.includes(v)) {
      set('core_values', form.core_values.filter(x => x !== v))
    } else if (form.core_values.length < 5) {
      set('core_values', [...form.core_values, v])
    } else {
      toast.error('Pick max 5 values. Less is more.')
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await supabase.from('profiles').update(form).eq('id', profile.id)
      toast.success('Identity saved.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function generateManifesto() {
    if (!form.vision_statement && !form.tagline) {
      toast.error('Fill in your vision and tagline first.')
      return
    }
    setAiLoading(true)
    setShowManifesto(true)
    try {
      const msg = await askGPT(
        `You are writing a personal manifesto for an ambitious young builder. 
         Be raw, direct, and powerful. No corporate language. No fluff.
         Write in second person (You are...). Max 5 sentences. Make it feel like a battle cry.`,
        `Write a personal manifesto for someone named ${form.full_name?.split(' ')[0] || 'this person'}.
         Their tagline: "${form.tagline}"
         Their vision: "${form.vision_statement}"
         Their core values: ${form.core_values.join(', ') || 'discipline, growth'}
         Make it feel visceral and real.`,
        { maxTokens: 180, temperature: 0.9 }
      )
      setAiManifesto(msg)
    } catch {
      setAiManifesto(
        "You are not here to be average. You are here to build, to create, to make something real. Every day you show up is a vote for the person you're becoming. The world doesn't owe you anything — and that's exactly why you'll earn everything."
      )
    } finally {
      setAiLoading(false)
    }
  }

  const TABS = [
    { key: 'identity',   label: 'Identity'    },
    { key: 'discipline', label: 'Discipline'  },
    { key: 'triggers',   label: 'Triggers'    },
  ]

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 5vw, 2.2rem)', fontWeight: 900,
          letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
        }}>Identity.</h2>
        <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
          Who you are. Who you're becoming.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', background: '#ECEAE4',
        borderRadius: '0.875rem', padding: '4px',
        marginBottom: '1.5rem',
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            flex: 1, padding: '0.5rem',
            borderRadius: '0.65rem', border: 'none',
            background: activeTab === t.key ? '#1A1A1A' : 'transparent',
            color: activeTab === t.key ? '#F5F4F0' : '#7A7A7A',
            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── IDENTITY TAB ── */}
      {activeTab === 'identity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile card */}
          <div style={{
            background: '#1A1A1A', borderRadius: '1.25rem',
            padding: '1.5rem', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              border: '1px solid rgba(200,184,154,0.15)', pointerEvents: 'none',
            }} />
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(200,184,154,0.15)',
              border: '1.5px solid rgba(200,184,154,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#C8B89A',
              marginBottom: '0.875rem',
            }}>
              <User size={24} strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: '1.2rem', fontWeight: 800,
              letterSpacing: '-0.03em', color: '#F5F4F0',
              margin: '0 0 0.25rem',
            }}>{form.full_name || 'Your name'}</h3>
            <p style={{
              fontSize: '0.825rem', color: 'rgba(245,244,240,0.5)',
              margin: '0 0 0.875rem',
            }}>@{form.username || 'username'}</p>
            {form.tagline && (
              <p style={{
                fontSize: '0.875rem', color: '#C8B89A',
                fontStyle: 'italic', margin: 0, fontWeight: 300,
              }}>"{form.tagline}"</p>
            )}
          </div>

          <LF label="Full name">
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              placeholder="Your full name" style={iS} />
          </LF>

          <LF label="Username">
            <input value={form.username} onChange={e => set('username', e.target.value)}
              placeholder="your_handle" style={iS} />
          </LF>

          <LF label="Tagline — who are you in one line?">
            <input value={form.tagline}
              onChange={e => set('tagline', e.target.value)}
              placeholder="Builder. Dreamer. Obsessed." style={iS} />
          </LF>

          <LF label="Vision statement — what is your life about?">
            <textarea
              value={form.vision_statement}
              onChange={e => set('vision_statement', e.target.value)}
              placeholder="Write the future you're building toward. Be specific. Be bold."
              rows={5}
              style={{
                width: '100%', padding: '0.875rem 1rem',
                background: '#ECEAE4', border: '1px solid #E0DED8',
                borderRadius: '1rem', fontSize: '0.875rem', color: '#1A1A1A',
                outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                resize: 'none', boxSizing: 'border-box', lineHeight: 1.7,
              }}
            />
          </LF>

          {/* Core values */}
          <LF label={`Core values — pick up to 5 (${form.core_values.length}/5 selected)`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {DEFAULT_VALUES.map(v => (
                <button key={v} onClick={() => toggleValue(v)} style={{
                  padding: '0.4rem 0.875rem', borderRadius: '99px',
                  border: `1px solid ${form.core_values.includes(v) ? '#1A1A1A' : '#E0DED8'}`,
                  background: form.core_values.includes(v) ? '#1A1A1A' : 'transparent',
                  color: form.core_values.includes(v) ? '#F5F4F0' : '#7A7A7A',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'all 0.15s ease',
                }}>{v}</button>
              ))}
            </div>
            {form.core_values.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {form.core_values.map((v, i) => (
                  <div key={v} style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.3rem 0.75rem', borderRadius: '99px',
                    background: '#1A1A1A',
                  }}>
                    <span style={{ fontSize: '0.68rem', color: '#C8B89A', fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#F5F4F0', fontWeight: 600 }}>
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </LF>

          {/* AI Manifesto */}
          <button onClick={generateManifesto} style={{
            width: '100%', padding: '0.875rem',
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1rem', fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', color: '#1A1A1A',
            fontFamily: 'Inter, system-ui, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          }}>
            <Sparkles size={14} strokeWidth={2.5} />
            <span>Generate my personal manifesto</span>
          </button>

          {showManifesto && (
            <div style={{
              background: '#1A1A1A', borderRadius: '1.25rem',
              padding: '1.5rem', position: 'relative',
            }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
                margin: '0 0 0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Your manifesto</p>
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
                <>
                  <p style={{
                    color: '#F5F4F0', fontSize: '0.95rem', fontWeight: 300,
                    lineHeight: 1.75, margin: '0 0 1rem', fontStyle: 'italic',
                  }}>{aiManifesto}</p>
                  <button onClick={generateManifesto} style={{
                    background: 'none', border: 'none', color: '#C8B89A',
                    fontSize: '0.75rem', cursor: 'pointer', padding: 0,
                    fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  }}>
                    <RefreshCw size={12} strokeWidth={2.5} />
                    <span>Regenerate</span>
                  </button>
                </>
              )}
            </div>
          )}

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', padding: '0.95rem',
            background: saving ? '#7A7A7A' : '#1A1A1A',
            color: '#F5F4F0', border: 'none', borderRadius: '1rem',
            fontWeight: 700, fontSize: '0.95rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.01em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          }}>
            <span>{saving ? 'Saving...' : 'Save identity'}</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ── DISCIPLINE TAB ── */}
      {activeTab === 'discipline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{
            background: '#1A1A1A', borderRadius: '1.25rem',
            padding: '1.25rem',
          }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
              margin: '0 0 0.5rem', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>Procrastination interrupt</p>
            <p style={{
              color: 'rgba(245,244,240,0.6)', fontSize: '0.825rem',
              lineHeight: 1.5, margin: 0,
            }}>
              Tap the thought you're having right now.
              Get the truth back immediately.
            </p>
          </div>

          {PROCRASTINATION_INTERRUPTS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setActiveInterrupt(activeInterrupt === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left',
                  background: activeInterrupt === i ? '#1A1A1A' : '#ECEAE4',
                  border: `1px solid ${activeInterrupt === i ? '#1A1A1A' : '#E0DED8'}`,
                  borderRadius: activeInterrupt === i ? '1rem 1rem 0 0' : '1rem',
                  padding: '0.875rem 1rem',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '0.875rem', fontWeight: 600,
                    color: activeInterrupt === i ? '#F5F4F0' : '#1A1A1A',
                    fontStyle: 'italic',
                  }}>"{item.trigger}"</span>
                  <span style={{
                    color: activeInterrupt === i ? 'rgba(245,244,240,0.4)' : '#7A7A7A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {activeInterrupt === i ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                  </span>
                </div>
              </button>

              {activeInterrupt === i && (
                <div style={{
                  background: '#1A1A1A',
                  borderRadius: '0 0 1rem 1rem',
                  padding: '1rem',
                  borderTop: '1px solid rgba(245,244,240,0.08)',
                }}>
                  <p style={{
                    color: '#C8B89A', fontSize: '1rem',
                    fontWeight: 600, lineHeight: 1.5,
                    margin: 0, letterSpacing: '-0.01em',
                  }}>{item.response}</p>
                </div>
              )}
            </div>
          ))}

          {/* Discipline score */}
          <div style={{
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1.25rem', padding: '1.25rem',
            marginTop: '0.5rem',
          }}>
            <p style={{
              fontSize: '0.8rem', fontWeight: 700, color: '#1A1A1A',
              margin: '0 0 0.5rem',
            }}>The discipline equation</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                { label: 'Do the MIT first thing',                  detail: 'Before email. Before socials. First.'           },
                { label: 'No phone for first 30 min',               detail: 'Protect your morning mind. It sets the tone.'   },
                { label: 'One task at a time',                      detail: 'Multitasking is just doing multiple things badly.'},
                { label: 'Done is better than perfect',             detail: 'Ship. Learn. Iterate. Repeat.'                  },
                { label: 'Plan tomorrow before you sleep',          detail: "Decisions before bed, not after you wake up."    },
                { label: 'Protect your deep work hours',            detail: 'Your best hours are your most valuable asset.'  },
              ].map((rule, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.75rem',
                  padding: '0.65rem 0.875rem',
                  background: 'rgba(245,244,240,0.7)', borderRadius: '0.75rem',
                }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#1A1A1A', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', color: '#F5F4F0',
                    fontWeight: 700, flexShrink: 0, marginTop: '1px',
                  }}>{i + 1}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: '#1A1A1A' }}>
                      {rule.label}
                    </p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#7A7A7A' }}>
                      {rule.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRIGGERS TAB ── */}
      {activeTab === 'triggers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          <div style={{
            background: '#ECEAE4', border: '1px solid #E0DED8',
            borderRadius: '1.1rem', padding: '1rem 1.25rem',
            marginBottom: '0.5rem',
          }}>
            <p style={{
              fontSize: '0.825rem', fontWeight: 600, color: '#1A1A1A',
              margin: '0 0 0.25rem',
            }}>Visual triggers</p>
            <p style={{ fontSize: '0.78rem', color: '#7A7A7A', margin: 0, lineHeight: 1.5 }}>
              Tap a trigger when you need a reset.
              Keep this page bookmarked on your home screen.
            </p>
          </div>

          {VISUAL_TRIGGERS.map(trigger => {
            const TriggerIcon = trigger.icon
            return (
              <div key={trigger.id}>
                <button
                  onClick={() => setActiveTrigger(activeTrigger === trigger.id ? null : trigger.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    background: activeTrigger === trigger.id ? '#1A1A1A' : '#ECEAE4',
                    border: `1px solid ${activeTrigger === trigger.id ? '#1A1A1A' : '#E0DED8'}`,
                    borderRadius: activeTrigger === trigger.id ? '1rem 1rem 0 0' : '1rem',
                    padding: '1rem 1.1rem', cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '0.75rem',
                      background: activeTrigger === trigger.id
                        ? 'rgba(200,184,154,0.15)'
                        : 'rgba(26,26,26,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: activeTrigger === trigger.id ? '#C8B89A' : '#1A1A1A',
                      flexShrink: 0,
                    }}>
                      <TriggerIcon size={18} strokeWidth={2.5} />
                    </div>
                    <span style={{
                      fontSize: '0.875rem', fontWeight: 600,
                      color: activeTrigger === trigger.id ? '#F5F4F0' : '#1A1A1A',
                    }}>{trigger.label}</span>
                  </div>
                  <span style={{
                    color: activeTrigger === trigger.id
                      ? 'rgba(245,244,240,0.4)' : '#7A7A7A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {activeTrigger === trigger.id ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
                  </span>
                </button>

                {activeTrigger === trigger.id && (
                  <div style={{
                    background: '#1A1A1A',
                    borderRadius: '0 0 1rem 1rem',
                    padding: '1.25rem 1.1rem',
                    borderTop: '1px solid rgba(245,244,240,0.06)',
                  }}>
                    <p style={{
                      color: '#F5F4F0', fontSize: '1.05rem',
                      fontWeight: 600, lineHeight: 1.55,
                      margin: '0 0 0.875rem', letterSpacing: '-0.02em',
                    }}>{trigger.text}</p>
                    <div style={{
                      display: 'flex', gap: '0.5rem',
                      borderTop: '1px solid rgba(245,244,240,0.08)',
                      paddingTop: '0.875rem',
                    }}>
                      <button
                        onClick={() => {
                          setActiveTrigger(null)
                          toast.success("Good. Now go execute.")
                        }}
                        style={{
                          flex: 1, padding: '0.6rem',
                          background: '#C8B89A', border: 'none',
                          borderRadius: '0.75rem', color: '#1A1A1A',
                          fontWeight: 700, fontSize: '0.825rem',
                          cursor: 'pointer',
                          fontFamily: 'Inter, system-ui, sans-serif',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                        }}
                      >
                        <span>Got it. Let's go.</span>
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Identity affirmations */}
          {(form.core_values.length > 0 || form.tagline) && (
            <div style={{
              background: '#1A1A1A', borderRadius: '1.25rem',
              padding: '1.25rem', marginTop: '0.5rem',
            }}>
              <p style={{
                fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
                margin: '0 0 0.875rem', letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>Your identity anchors</p>
              {form.tagline && (
                <p style={{
                  color: '#F5F4F0', fontSize: '1rem',
                  fontWeight: 600, margin: '0 0 0.875rem',
                  letterSpacing: '-0.02em',
                }}>"{form.tagline}"</p>
              )}
              {form.core_values.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {form.core_values.map(v => (
                    <span key={v} style={{
                      padding: '0.35rem 0.875rem', borderRadius: '99px',
                      background: 'rgba(200,184,154,0.12)',
                      border: '1px solid rgba(200,184,154,0.25)',
                      fontSize: '0.78rem', color: '#C8B89A', fontWeight: 600,
                    }}>{v}</span>
                  ))}
                </div>
              )}
              {form.vision_statement && (
                <p style={{
                  marginTop: '0.875rem', fontSize: '0.825rem',
                  color: 'rgba(245,244,240,0.45)', lineHeight: 1.65,
                  fontStyle: 'italic', fontWeight: 300,
                }}>{form.vision_statement}</p>
              )}
            </div>
          )}
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

function LF({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.78rem', fontWeight: 600,
        color: '#3D3D3D', marginBottom: '0.4rem',
      }}>{label}</label>
      {children}
    </div>
  )
}

const iS = {
  width: '100%', padding: '0.75rem 1rem',
  background: '#ECEAE4', border: '1px solid #E0DED8',
  borderRadius: '0.875rem', fontSize: '0.9rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
}
