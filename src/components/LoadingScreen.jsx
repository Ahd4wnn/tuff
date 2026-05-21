import React, { useState, useEffect } from 'react'

export default function LoadingScreen({ onComplete }) {
  const letters = ['t', 'u', 'f', 'f', '.']
  const [visibleCount, setVisibleCount] = useState(0)
  const [showSubtitle, setShowSubtitle] = useState(false)

  useEffect(() => {
    // 120ms stagger for each letter
    const letterInterval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev < letters.length) {
          return prev + 1
        } else {
          clearInterval(letterInterval)
          return prev
        }
      })
    }, 120)

    // Subtitle fades in after 600ms (when typing finishes)
    const subtitleTimeout = setTimeout(() => {
      setShowSubtitle(true)
    }, 600)

    // Call onComplete after an additional 900ms (1500ms total since mount)
    const completeTimeout = setTimeout(() => {
      if (onComplete) onComplete()
    }, 1500)

    return () => {
      clearInterval(letterInterval)
      clearTimeout(subtitleTimeout)
      clearTimeout(completeTimeout)
    }
  }, [onComplete])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#F5F4F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {/* Word "tuff." with letter-by-letter staggering */}
        <h1
          style={{
            fontSize: 'clamp(4rem, 12vw, 7rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: '#1A1A1A',
            margin: 0,
            lineHeight: 1,
            display: 'flex',
          }}
        >
          {letters.map((char, index) => (
            <span
              key={index}
              style={{
                opacity: index < visibleCount ? 1 : 0,
                transform: index < visibleCount ? 'scale(1)' : 'scale(0.8)',
                transition: 'opacity 200ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'inline-block',
              }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Subtitle "your life. your rules." */}
        <p
          style={{
            fontSize: '1rem',
            fontWeight: 400,
            color: '#7A7A7A',
            margin: 0,
            opacity: showSubtitle ? 1 : 0,
            transform: showSubtitle ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 400ms cubic-bezier(0.25, 1, 0.5, 1), transform 400ms cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          your life. your rules.
        </p>
      </div>
    </div>
  )
}
