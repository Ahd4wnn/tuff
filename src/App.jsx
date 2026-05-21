import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import { useAuth } from './hooks/useAuth'
import LoadingScreen from './components/LoadingScreen'
import AppShell from './components/layout/AppShell'
import Auth from './pages/Auth'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import Networking from './pages/Networking'
import Habits from './pages/Habits'
import Projects from './pages/Projects'
import Knowledge from './pages/Knowledge'
import Journal from './pages/Journal'
import Identity from './pages/Identity'

function AppRoutes() {
  const { user, onboardingDone, loading } = useAuth()
  const [onboarded, setOnboarded] = useState(null)

  useEffect(() => {
    if (!loading) setOnboarded(onboardingDone)
  }, [loading, onboardingDone])

  if (loading || onboarded === null) return null

  if (!user) return <Navigate to="/auth" />
  if (!onboarded) return <Onboarding onComplete={() => setOnboarded(true)} />

  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="goals" element={<Goals />} />
        <Route path="network" element={<Networking />} />
        <Route path="habits" element={<Habits />} />
        <Route path="projects" element={<Projects />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="journal" element={<Journal />} />
        <Route path="identity" element={<Identity />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const { setUser, setLoading } = useAuthStore()
  const [showLoading, setShowLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (showLoading) return <LoadingScreen onComplete={() => setShowLoading(false)} />

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1A1A1A', color: '#F5F4F0', borderRadius: '12px', fontSize: '14px' }
      }} />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}
