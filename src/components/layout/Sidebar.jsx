import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { 
  Home, 
  Target, 
  Flame, 
  Users, 
  Briefcase, 
  BookOpen, 
  Book, 
  User,
  LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/',          label: 'Home',      icon: Home  },
  { path: '/goals',     label: 'Goals',     icon: Target  },
  { path: '/habits',    label: 'Habits',    icon: Flame  },
  { path: '/network',   label: 'Network',   icon: Users  },
  { path: '/projects',  label: 'Projects',  icon: Briefcase  },
  { path: '/knowledge', label: 'Knowledge', icon: BookOpen  },
  { path: '/journal',   label: 'Journal',   icon: Book  },
  { path: '/identity',  label: 'Identity',  icon: User  },
]

export default function Sidebar() {
  const { signOut } = useAuthStore()
  const { profile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#EFEDE7',
      borderRight: '1px solid #E0DED8',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
    }}>
      {/* Logo */}
      <div style={{ paddingLeft: '0.5rem', marginBottom: '2rem' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 900,
          letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
        }}>tuff.</h1>
        {profile?.tagline && (
          <p style={{
            fontSize: '0.7rem', color: '#7A7A7A',
            marginTop: '0.2rem', fontWeight: 400,
          }}>{profile.tagline}</p>
        )}
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map(({ path, label, icon: IconComponent }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.65rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#1A1A1A' : '#7A7A7A',
              background: isActive ? '#E0DED8' : 'transparent',
              transition: 'all 0.15s ease',
            })}
          >
            <IconComponent size={18} strokeWidth={2.2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Profile + sign out */}
      <div style={{
        borderTop: '1px solid #E0DED8',
        paddingTop: '1rem',
        marginTop: '1rem',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: '0.65rem', marginBottom: '0.75rem',
          padding: '0 0.25rem',
        }}>
          <div style={{
            width: '30px', height: '30px',
            borderRadius: '50%', background: '#1A1A1A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#F5F4F0', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
          }}>
            {profile?.full_name?.[0]?.toUpperCase() || 'T'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              margin: 0, fontSize: '0.8rem', fontWeight: 600,
              color: '#1A1A1A', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {profile?.full_name || 'Tuff user'}
            </p>
            <p style={{
              margin: 0, fontSize: '0.7rem', color: '#7A7A7A',
            }}>@{profile?.username || 'you'}</p>
          </div>
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '0.5rem',
          background: 'transparent', border: '1px solid #E0DED8',
          borderRadius: '0.65rem', color: '#7A7A7A',
          fontSize: '0.8rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}>
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  )
}
