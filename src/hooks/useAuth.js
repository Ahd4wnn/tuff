import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
        setOnboardingDone(!!(data?.username && data?.full_name))
        setLoading(false)
      })
  }, [user])

  return { user, profile, onboardingDone, loading }
}
