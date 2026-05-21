import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * CustomSelect — Tuff design-system dropdown
 *
 * Props:
 *   value      – current selected value (string)
 *   onChange   – called with a synthetic { target: { value } } event
 *   options    – string[] OR { value, label, icon? (lucide component) }[]
 *   placeholder – optional placeholder text
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Normalise options to { value, label } objects
  const normalised = options.map(o =>
    typeof o === 'string' ? { value: o, label: o } : o
  )

  const selected = normalised.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Keyboard navigation
  function onKeyDown(e) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o); return }
    if (!open) return
    const idx = normalised.findIndex(o => o.value === value)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = normalised[(idx + 1) % normalised.length]
      onChange({ target: { value: next.value } })
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = normalised[(idx - 1 + normalised.length) % normalised.length]
      onChange({ target: { value: prev.value } })
    }
  }

  function pick(val) {
    onChange({ target: { value: val } })
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }} onKeyDown={onKeyDown}>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '0.7rem 0.875rem',
          background: '#ECEAE4',
          border: `1px solid ${open ? '#1A1A1A' : '#E0DED8'}`,
          borderRadius: open ? '0.75rem 0.75rem 0 0' : '0.75rem',
          fontSize: '0.875rem',
          color: selected ? '#1A1A1A' : '#7A7A7A',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: selected ? 500 : 400,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          textAlign: 'left',
          transition: 'border-color 0.15s ease, border-radius 0.15s ease',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {selected?.icon && (
            <selected.icon size={15} strokeWidth={2.2} style={{ color: '#7A7A7A', flexShrink: 0 }} />
          )}
          <span style={{
            textTransform: 'capitalize',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2.5}
          style={{
            color: '#7A7A7A',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 200,
          background: '#F5F4F0',
          border: '1px solid #1A1A1A',
          borderTop: 'none',
          borderRadius: '0 0 0.75rem 0.75rem',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(26,26,26,0.12)',
          animation: 'selectSlideIn 0.12s ease',
        }}>
          {normalised.map((opt, i) => {
            const isActive = opt.value === value
            const isLast = i === normalised.length - 1
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => pick(opt.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.875rem',
                  background: isActive ? '#1A1A1A' : 'transparent',
                  border: 'none',
                  borderBottom: isLast ? 'none' : '1px solid #E0DED8',
                  fontSize: '0.875rem',
                  color: isActive ? '#F5F4F0' : '#1A1A1A',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  transition: 'background 0.1s ease, color 0.1s ease',
                  textTransform: 'capitalize',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = '#ECEAE4'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {opt.icon && (
                    <opt.icon
                      size={14}
                      strokeWidth={2.2}
                      style={{ color: isActive ? '#F5F4F0' : '#7A7A7A', flexShrink: 0 }}
                    />
                  )}
                  {opt.label}
                </span>
                {isActive && <Check size={13} strokeWidth={2.8} style={{ color: '#F5F4F0', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes selectSlideIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  )
}
