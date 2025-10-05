import { supabase, isDemoMode } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, StepsDaily, Workout, StravaTokens, Post } from './supabase'

// Demo data storage (in-memory for demo mode)
const demoData = {
  profiles: new Map<string, UserProfile>(),
  stepsDaily: new Map<string, StepsDaily[]>(),
  workouts: new Map<string, Workout[]>(),
  stravaTokens: new Map<string, StravaTokens>(),
  posts: [] as Post[]
}

// User Profile Operations
export const userProfileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isDemoMode) {
      return demoData.profiles.get(userId) || null
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    return data
  },

  async createProfile(userId: string, profile: Omit<UserProfile, 'user_id' | 'updated_at'>): Promise<UserProfile | null> {
    if (isDemoMode) {
      const newProfile: UserProfile = {
        ...profile,
        user_id: userId,
        updated_at: new Date().toISOString()
      }
      demoData.profiles.set(userId, newProfile)
      return newProfile
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ ...profile, user_id: userId }])
      .select()
      .single()

    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }
    return data
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (isDemoMode) {
      const existing = demoData.profiles.get(userId)
      if (!existing) return null

      const updated = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      }
      demoData.profiles.set(userId, updated)
      return updated
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }
    return data
  }
}

// Steps Daily Operations
export const stepsDailyService = {
  async getStepsDaily(userId: string, date: string): Promise<StepsDaily | null> {
    if (isDemoMode) {
      const userRecords = demoData.stepsDaily.get(userId) || []
      return userRecords.find(record => record.date === date) || null
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('steps_daily')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching steps daily:', error)
      return null
    }
    return data
  },

  async upsertStepsDaily(stepsDaily: Omit<StepsDaily, 'id' | 'created_at'>): Promise<StepsDaily | null> {
    if (isDemoMode) {
      const userRecords = demoData.stepsDaily.get(stepsDaily.user_id) || []
      const existingIndex = userRecords.findIndex(r => r.date === stepsDaily.date)

      const newRecord: StepsDaily = {
        ...stepsDaily,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        userRecords[existingIndex] = newRecord
      } else {
        userRecords.push(newRecord)
      }

      demoData.stepsDaily.set(stepsDaily.user_id, userRecords)
      return newRecord
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('steps_daily')
      .upsert([stepsDaily], {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting steps daily:', error)
      return null
    }
    return data
  },

  async getStepsHistory(userId: string, days: number = 30): Promise<StepsDaily[]> {
    if (isDemoMode) {
      const userRecords = demoData.stepsDaily.get(userId) || []
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      return userRecords
        .filter(record => new Date(record.date) >= startDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    if (!supabase) return []

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('steps_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching steps history:', error)
      return []
    }
    return data || []
  },

  async getWeeklySteps(userId: string): Promise<number> {
    if (isDemoMode) {
      const userRecords = demoData.stepsDaily.get(userId) || []
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      return userRecords
        .filter(record => new Date(record.date) >= startDate)
        .reduce((sum, record) => sum + record.steps, 0)
    }

    if (!supabase) return 0

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const { data, error } = await supabase
      .from('steps_daily')
      .select('steps')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching weekly steps:', error)
      return 0
    }
    return data?.reduce((sum, record) => sum + record.steps, 0) || 0
  }
}

// Workout Operations
export const workoutService = {
  async createWorkout(workout: Omit<Workout, 'id'>): Promise<Workout | null> {
    if (isDemoMode) {
      const newWorkout: Workout = {
        ...workout,
        id: `demo-${Date.now()}`
      }

      const userWorkouts = demoData.workouts.get(workout.user_id) || []
      userWorkouts.push(newWorkout)
      demoData.workouts.set(workout.user_id, userWorkouts)

      return newWorkout
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('workouts')
      .insert([workout])
      .select()
      .single()

    if (error) {
      console.error('Error creating workout:', error)
      return null
    }
    return data
  },

  async getWorkouts(userId: string, limit: number = 20): Promise<Workout[]> {
    if (isDemoMode) {
      const userWorkouts = demoData.workouts.get(userId) || []
      return userWorkouts
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, limit)
    }

    if (!supabase) return []

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching workouts:', error)
      return []
    }
    return data || []
  },

  async getWeeklyWorkouts(userId: string): Promise<number> {
    if (isDemoMode) {
      const userWorkouts = demoData.workouts.get(userId) || []
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      return userWorkouts.filter(workout =>
        new Date(workout.completed_at) >= startDate
      ).length
    }

    if (!supabase) return 0

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const { data, error } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())

    if (error) {
      console.error('Error fetching weekly workouts:', error)
      return 0
    }
    return data?.length || 0
  },

  async updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<Workout | null> {
    if (isDemoMode) {
      // Find workout across all users
      for (const [userId, workouts] of demoData.workouts.entries()) {
        const workoutIndex = workouts.findIndex(w => w.id === workoutId)
        if (workoutIndex >= 0) {
          const updatedWorkout = { ...workouts[workoutIndex], ...updates }
          workouts[workoutIndex] = updatedWorkout
          return updatedWorkout
        }
      }
      return null
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', workoutId)
      .select()
      .single()

    if (error) {
      console.error('Error updating workout:', error)
      return null
    }
    return data
  },

  async deleteWorkout(workoutId: string): Promise<boolean> {
    if (isDemoMode) {
      // Find and delete workout across all users
      for (const [userId, workouts] of demoData.workouts.entries()) {
        const workoutIndex = workouts.findIndex(w => w.id === workoutId)
        if (workoutIndex >= 0) {
          workouts.splice(workoutIndex, 1)
          return true
        }
      }
      return false
    }

    if (!supabase) return false

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)

    if (error) {
      console.error('Error deleting workout:', error)
      return false
    }
    return true
  }
}

// Strava Tokens Operations
export const stravaTokensService = {
  async getTokens(userId: string): Promise<StravaTokens | null> {
    if (isDemoMode) {
      return demoData.stravaTokens.get(userId) || null
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Strava tokens:', error)
      return null
    }
    return data
  },

  async upsertTokens(tokens: Omit<StravaTokens, 'created_at'>): Promise<StravaTokens | null> {
    if (isDemoMode) {
      const newTokens: StravaTokens = {
        ...tokens,
        created_at: new Date().toISOString()
      }
      demoData.stravaTokens.set(tokens.user_id, newTokens)
      return newTokens
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('strava_tokens')
      .upsert([tokens], {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting Strava tokens:', error)
      return null
    }
    return data
  },

  async deleteTokens(userId: string): Promise<boolean> {
    if (isDemoMode) {
      demoData.stravaTokens.delete(userId)
      return true
    }

    if (!supabase) return false

    const { error } = await supabase
      .from('strava_tokens')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting Strava tokens:', error)
      return false
    }
    return true
  }
}

// Posts Operations (for social features)
export const postService = {
  async createPost(post: Omit<Post, 'id' | 'likes_count' | 'comments_count' | 'created_at'>): Promise<Post | null> {
    if (isDemoMode) {
      const newPost: Post = {
        ...post,
        id: `demo-${Date.now()}`,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString()
      }
      demoData.posts.push(newPost)
      return newPost
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('posts')
      .insert([post])
      .select('*, user_profiles(user_id)')
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return null
    }
    return data
  },

  async getPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    if (isDemoMode) {
      return demoData.posts
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit)
    }

    if (!supabase) return []

    const { data, error } = await supabase
      .from('posts')
      .select('*, user_profiles(user_id)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }
    return data || []
  },

  async getUserPosts(userId: string, limit: number = 20): Promise<Post[]> {
    if (isDemoMode) {
      return demoData.posts
        .filter(post => post.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
    }

    if (!supabase) return []

    const { data, error } = await supabase
      .from('posts')
      .select('*, user_profiles(user_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user posts:', error)
      return []
    }
    return data || []
  }
}

// Auth helpers
export const authService = {
  async signUp(email: string, password: string, metadata: { name: string }) {
    if (isDemoMode) {
      // Demo mode: create fake user
      const demoUser = {
        id: `demo-${Date.now()}`,
        email,
        user_metadata: metadata,
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User
      return { user: demoUser, error: null }
    }

    if (!supabase) return { user: null, error: { message: 'Supabase not configured' } }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) {
      console.error('Error signing up:', error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  },

  async signIn(email: string, password: string) {
    if (isDemoMode) {
      // Demo mode: create fake user for any email/password
      const demoUser = {
        id: `demo-${Date.now()}`,
        email,
        user_metadata: { name: email.split('@')[0] },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as User
      return { user: demoUser, error: null }
    }

    if (!supabase) return { user: null, error: { message: 'Supabase not configured' } }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Error signing in:', error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  },

  async signOut() {
    if (isDemoMode) {
      return { error: null }
    }

    if (!supabase) return { error: { message: 'Supabase not configured' } }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    return { error }
  },

  async getCurrentUser() {
    if (isDemoMode) {
      return null
    }

    if (!supabase) return null

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    return user
  }
}

// Legacy service aliases for backward compatibility
export const stepRecordService = stepsDailyService
export const workoutSessionService = workoutService
export const stravaConnectionService = stravaTokensService
