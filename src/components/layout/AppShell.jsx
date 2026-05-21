import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAuthStore } from '../../store/authStore'

export default function AppShell() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100dvh',
      backgroundColor: '#F5F4F0',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Sidebar — desktop only */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: '240px',
        zIndex: 100,
      }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 0,
        paddingBottom: '80px',
        minHeight: '100dvh',
        transition: 'margin-left 0.3s ease',
      }} className="main-content">
        <div style={{
          maxWidth: '860px',
          margin: '0 auto',
          padding: '1.5rem 1.25rem',
        }}>
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <div className="mobile-bottom-nav">
        <BottomNav />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          .main-content { margin-left: 240px !important; padding-bottom: 2rem !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </div>
  )
}
