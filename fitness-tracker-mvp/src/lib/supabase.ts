import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

// Check if we're in demo mode (missing real environment variables)
export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface UserProfile {
  id: string
  email: string
  name: string
  step_goal: number
  workout_goal: number
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  preferences: string[]
  created_at: string
  updated_at: string
}

export interface StepRecord {
  id: string
  user_id: string
  date: string
  steps: number
  calories_estimated: number
  distance_estimated: number
  source: 'device_motion' | 'health_connect' | 'healthkit' | 'manual'
  created_at: string
}

export interface WorkoutSession {
  id: string
  user_id: string
  workout_id: string
  workout_name: string
  duration_minutes: number
  calories_estimated: number
  completed_at: string
  source: 'app' | 'strava'
  strava_activity_id?: number
}

export interface StravaConnection {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: number
  athlete_id: number
  scope: string
  connected_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_url?: string
  media_type?: 'image' | 'video'
  workout_session_id?: string
  likes_count: number
  comments_count: number
  created_at: string
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}
