export default function Button({
  children, onClick, variant = 'primary',
  size = 'md', disabled = false, style = {}, type = 'button'
}) {
  const base = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', borderRadius: '0.75rem',
    transition: 'all 0.15s ease', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    letterSpacing: '-0.01em',
  }
  const variants = {
    primary:  { background: '#1A1A1A', color: '#F5F4F0', border: 'none' },
    secondary:{ background: 'transparent', color: '#1A1A1A', border: '1px solid #E0DED8' },
    ghost:    { background: 'transparent', color: '#7A7A7A', border: 'none' },
    accent:   { background: '#C8B89A', color: '#1A1A1A', border: 'none' },
  }
  const sizes = {
    sm: { padding: '0.4rem 0.85rem', fontSize: '0.8rem' },
    md: { padding: '0.65rem 1.25rem', fontSize: '0.875rem' },
    lg: { padding: '0.875rem 1.75rem', fontSize: '0.95rem' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...sizes[size], opacity: disabled ? 0.5 : 1, ...style }}
    >
      {children}
    </button>
  )
}
