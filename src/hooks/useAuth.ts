import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isDemoMode } from '@/lib/supabase'
import { authService, userProfileService } from '@/lib/database'
import type { UserProfile } from '@/lib/supabase'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

// Demo user for demo mode
let demoUser: User | null = null

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    if (isDemoMode) {
      // Demo mode: no real auth state to check
      setAuthState(prev => ({ ...prev, loading: false }))
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      if (!supabase) {
        setAuthState(prev => ({ ...prev, loading: false, error: 'Supabase not configured' }))
        return
      }

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        await loadUserData(session.user)
      } else {
        setAuthState(prev => ({ ...prev, loading: false }))
      }
    }

    getInitialSession()

    // Listen for auth changes (only in non-demo mode)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            await loadUserData(session.user)
          } else {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: null
            })
          }
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [])

  const loadUserData = async (user: User) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      // Try to get existing profile
      let profile = await userProfileService.getProfile(user.id)

      // Create profile if it doesn't exist
      if (!profile && user.email) {
        profile = await userProfileService.createProfile(user.id, {
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          step_goal: 10000,
          workout_goal: 3,
          fitness_level: 'beginner',
          preferences: []
        })
      }

      setAuthState({
        user,
        profile,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading user data:', error)
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load user data'
      }))
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { user, error } = await authService.signUp(email, password, { name })

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
        return { success: false, error: error.message }
      }

      if (isDemoMode && user) {
        // In demo mode, automatically create and sign in the user
        demoUser = user
        await loadUserData(user)
      }

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { user, error } = await authService.signIn(email, password)

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
        return { success: false, error: error.message }
      }

      if (isDemoMode && user) {
        // In demo mode, automatically load user data
        demoUser = user
        await loadUserData(user)
      }

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))

      const { error } = await authService.signOut()

      if (error) {
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }))
        return { success: false, error: error.message }
      }

      if (isDemoMode) {
        demoUser = null
      }

      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      })

      return { success: true, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) return { success: false, error: 'No user logged in' }

    try {
      const updatedProfile = await userProfileService.updateProfile(authState.user.id, updates)

      if (updatedProfile) {
        setAuthState(prev => ({ ...prev, profile: updatedProfile }))
        return { success: true, error: null }
      }

      return { success: false, error: 'Failed to update profile' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed'
      return { success: false, error: errorMessage }
    }
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!authState.user,
    isDemoMode
  }
}
