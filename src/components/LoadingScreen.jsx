import { useState, useEffect } from 'react'

export default function LoadingScreen({ onComplete }) {
  const [visibleChars, setVisibleChars] = useState(0)
  const [showSub, setShowSub] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const word = 'tuff.'

  useEffect(() => {
    const timers = []

    word.split('').forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleChars(i + 1)
      }, i * 120))
    })

    timers.push(setTimeout(() => setShowSub(true), word.length * 120 + 200))
    timers.push(setTimeout(() => setFadeOut(true), word.length * 120 + 1200))
    timers.push(setTimeout(() => onComplete(), word.length * 120 + 1700))

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: '#F5F4F0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, fontFamily: 'Inter, system-ui, sans-serif',
      transition: 'opacity 0.5s ease',
      opacity: fadeOut ? 0 : 1,
    }}>
      <h1 style={{
        fontSize: 'clamp(4rem, 14vw, 7rem)',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        color: '#1A1A1A',
        margin: 0,
        lineHeight: 1,
      }}>
        {word.split('').map((char, i) => (
          <span key={i} style={{
            opacity: i < visibleChars ? 1 : 0,
            transition: 'opacity 0.1s ease',
            display: 'inline-block',
          }}>{char}</span>
        ))}
      </h1>
      <p style={{
        marginTop: '1rem',
        fontSize: '0.95rem',
        fontWeight: 400,
        color: '#7A7A7A',
        letterSpacing: '0.02em',
        opacity: showSub ? 1 : 0,
        transform: showSub ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>your life. your rules.</p>
    </div>
  )
}
