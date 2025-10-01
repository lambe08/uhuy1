import { supabase, isDemoMode } from './supabase'
import type { User } from '@supabase/supabase-js'
import type { UserProfile, StepRecord, WorkoutSession, StravaConnection, Post } from './supabase'

// Demo data storage (in-memory for demo mode)
const demoData = {
  profiles: new Map<string, UserProfile>(),
  stepRecords: new Map<string, StepRecord[]>(),
  workoutSessions: new Map<string, WorkoutSession[]>(),
  stravaConnections: new Map<string, StravaConnection>(),
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
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    return data
  },

  async createProfile(userId: string, profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
    if (isDemoMode) {
      const newProfile: UserProfile = {
        ...profile,
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoData.profiles.set(userId, newProfile)
      return newProfile
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{ ...profile, id: userId }])
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
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }
    return data
  }
}

// Step Records Operations
export const stepRecordService = {
  async getStepRecord(userId: string, date: string): Promise<StepRecord | null> {
    if (isDemoMode) {
      const userRecords = demoData.stepRecords.get(userId) || []
      return userRecords.find(record => record.date === date) || null
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('step_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching step record:', error)
      return null
    }
    return data
  },

  async upsertStepRecord(stepRecord: Omit<StepRecord, 'id' | 'created_at'>): Promise<StepRecord | null> {
    if (isDemoMode) {
      const userRecords = demoData.stepRecords.get(stepRecord.user_id) || []
      const existingIndex = userRecords.findIndex(r => r.date === stepRecord.date)

      const newRecord: StepRecord = {
        ...stepRecord,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        userRecords[existingIndex] = newRecord
      } else {
        userRecords.push(newRecord)
      }

      demoData.stepRecords.set(stepRecord.user_id, userRecords)
      return newRecord
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('step_records')
      .upsert([stepRecord], {
        onConflict: 'user_id,date',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting step record:', error)
      return null
    }
    return data
  },

  async getStepHistory(userId: string, days: number = 30): Promise<StepRecord[]> {
    if (isDemoMode) {
      const userRecords = demoData.stepRecords.get(userId) || []
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
      .from('step_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching step history:', error)
      return []
    }
    return data || []
  },

  async getWeeklySteps(userId: string): Promise<number> {
    if (isDemoMode) {
      const userRecords = demoData.stepRecords.get(userId) || []
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
      .from('step_records')
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

// Workout Session Operations
export const workoutSessionService = {
  async createWorkoutSession(session: Omit<WorkoutSession, 'id' | 'created_at'>): Promise<WorkoutSession | null> {
    if (isDemoMode) {
      const newSession: WorkoutSession = {
        ...session,
        id: `demo-${Date.now()}`
      }

      const userSessions = demoData.workoutSessions.get(session.user_id) || []
      userSessions.push(newSession)
      demoData.workoutSessions.set(session.user_id, userSessions)

      return newSession
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert([session])
      .select()
      .single()

    if (error) {
      console.error('Error creating workout session:', error)
      return null
    }
    return data
  },

  async getWorkoutSessions(userId: string, limit: number = 20): Promise<WorkoutSession[]> {
    if (isDemoMode) {
      const userSessions = demoData.workoutSessions.get(userId) || []
      return userSessions
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .slice(0, limit)
    }

    if (!supabase) return []

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching workout sessions:', error)
      return []
    }
    return data || []
  },

  async getWeeklyWorkouts(userId: string): Promise<number> {
    if (isDemoMode) {
      const userSessions = demoData.workoutSessions.get(userId) || []
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 7)

      return userSessions.filter(session =>
        new Date(session.completed_at) >= startDate
      ).length
    }

    if (!supabase) return 0

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', userId)
      .gte('completed_at', startDate.toISOString())

    if (error) {
      console.error('Error fetching weekly workouts:', error)
      return 0
    }
    return data?.length || 0
  }
}

// Strava Connection Operations
export const stravaConnectionService = {
  async getConnection(userId: string): Promise<StravaConnection | null> {
    if (isDemoMode) {
      return demoData.stravaConnections.get(userId) || null
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('strava_connections')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Strava connection:', error)
      return null
    }
    return data
  },

  async upsertConnection(connection: Omit<StravaConnection, 'id' | 'connected_at' | 'updated_at'>): Promise<StravaConnection | null> {
    if (isDemoMode) {
      const newConnection: StravaConnection = {
        ...connection,
        id: `demo-${Date.now()}`,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      demoData.stravaConnections.set(connection.user_id, newConnection)
      return newConnection
    }

    if (!supabase) return null

    const { data, error } = await supabase
      .from('strava_connections')
      .upsert([connection], {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting Strava connection:', error)
      return null
    }
    return data
  },

  async deleteConnection(userId: string): Promise<boolean> {
    if (isDemoMode) {
      demoData.stravaConnections.delete(userId)
      return true
    }

    if (!supabase) return false

    const { error } = await supabase
      .from('strava_connections')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting Strava connection:', error)
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
      .select('*, user_profiles(name)')
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
      .select('*, user_profiles(name)')
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
      .select('*, user_profiles(name)')
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
