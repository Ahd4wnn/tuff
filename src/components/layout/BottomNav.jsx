import { NavLink } from 'react-router-dom'
import { Home, Target, Flame, Users, Briefcase, Book } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',          label: 'Home',     icon: Home },
  { path: '/goals',     label: 'Goals',    icon: Target },
  { path: '/habits',    label: 'Habits',   icon: Flame },
  { path: '/network',   label: 'Network',  icon: Users },
  { path: '/projects',  label: 'Projects', icon: Briefcase },
  { path: '/journal',   label: 'Journal',  icon: Book },
]

export default function BottomNav() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: '72px',
      backgroundColor: 'rgba(245,244,240,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid #E0DED8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '0 0.5rem',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      {NAV_ITEMS.map(({ path, label, icon: IconComponent }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            padding: '0.4rem 0.6rem',
            borderRadius: '0.65rem',
            textDecoration: 'none',
            minWidth: '48px',
            transition: 'all 0.15s ease',
            color: isActive ? '#1A1A1A' : '#7A7A7A',
          })}
        >
          {({ isActive }) => (
            <>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: isActive ? 'none' : 'opacity(0.6)',
                transition: 'filter 0.15s ease',
              }}>
                <IconComponent size={20} strokeWidth={2.2} />
              </span>
              <span style={{
                fontSize: '0.6rem', fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.01em',
              }}>{label}</span>
              {isActive && (
                <div style={{
                  width: '4px', height: '4px',
                  borderRadius: '50%', background: '#1A1A1A',
                  marginTop: '1px',
                }} />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  )
}

