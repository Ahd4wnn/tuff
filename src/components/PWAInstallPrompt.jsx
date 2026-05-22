import { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem('tuff_pwa_dismissed')
    if (alreadyDismissed) return

    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone === true
    setIsIOS(iOS)

    if (iOS && !isStandalone) {
      setTimeout(() => setShowBanner(true), 3000)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowBanner(true), 3000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('tuff_pwa_dismissed', '1')
  }

  async function handleInstall() {
    if (isIOS) { setShowIOSGuide(true); return }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      localStorage.setItem('tuff_pwa_dismissed', '1')
    }
    setDeferredPrompt(null)
  }

  if (!showBanner || dismissed) return null

  return (
    <>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 9998, padding: '0 1rem 1.5rem',
        display: 'flex', justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          width: '100%', maxWidth: '480px',
          background: '#1A1A1A',
          borderRadius: '1.25rem',
          padding: '1.25rem',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: '#F5F4F0', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 900, color: '#1A1A1A',
                }}>t</div>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F5F4F0' }}>
                  Add Tuff to your home screen
                </span>
              </div>
              <p style={{
                margin: 0, fontSize: '0.78rem',
                color: 'rgba(245,244,240,0.5)', lineHeight: 1.5,
              }}>
                Get the full app experience. Works offline. No app store needed.
              </p>
            </div>
            <button onClick={dismiss} style={{
              background: 'none', border: 'none',
              color: 'rgba(245,244,240,0.35)', cursor: 'pointer',
              padding: '0 0 0 0.75rem', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button onClick={dismiss} style={{
              flex: 1, padding: '0.65rem',
              background: 'rgba(245,244,240,0.08)',
              border: '1px solid rgba(245,244,240,0.12)',
              borderRadius: '0.75rem', color: 'rgba(245,244,240,0.5)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>Not now</button>
            <button onClick={handleInstall} style={{
              flex: 2, padding: '0.65rem',
              background: '#F5F4F0', border: 'none',
              borderRadius: '0.75rem', color: '#1A1A1A',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
            }}>
              <span>{isIOS ? 'Show me how' : 'Install app'}</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS guide modal */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(26,26,26,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <div style={{
            background: '#F5F4F0', width: '100%', maxWidth: '480px',
            borderRadius: '1.5rem 1.5rem 0 0',
            padding: '1.75rem 1.5rem 2.5rem',
          }}>
            <div style={{
              width: '36px', height: '4px', borderRadius: '99px',
              background: '#E0DED8', margin: '0 auto 1.5rem',
            }} />
            <h3 style={{
              fontSize: '1.1rem', fontWeight: 800,
              letterSpacing: '-0.03em', color: '#1A1A1A', margin: '0 0 1.25rem',
            }}>Add to Home Screen</h3>
            {[
              { step: '1', text: "Tap the Share button (□↑) at the bottom of Safari" },
              { step: '2', text: 'Scroll down and tap "Add to Home Screen"'          },
              { step: '3', text: 'Tap "Add" in the top right corner'                  },
            ].map(s => (
              <div key={s.step} style={{
                display: 'flex', gap: '0.875rem',
                alignItems: 'flex-start', marginBottom: '1rem',
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#1A1A1A', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.78rem', fontWeight: 700, color: '#F5F4F0',
                }}>{s.step}</div>
                <p style={{
                  margin: 0, fontSize: '0.9rem', color: '#1A1A1A',
                  lineHeight: 1.5, paddingTop: '0.2rem',
                }}>{s.text}</p>
              </div>
            ))}
            <button onClick={() => { setShowIOSGuide(false); dismiss() }} style={{
              width: '100%', padding: '0.875rem',
              background: '#1A1A1A', color: '#F5F4F0',
              border: 'none', borderRadius: '1rem',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif', marginTop: '0.5rem',
            }}>Got it</button>
          </div>
        </div>
      )}
    </>
  )
}
