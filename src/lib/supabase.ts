import { createClient } from '@supabase/supabase-js'

// Check if we're in demo mode (missing real environment variables)
export const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id') ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-supabase') ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('demo-project') ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('demo-key')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

// Create Supabase client even in demo mode for testing, but it won't work
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types - Updated to match new schema
export interface UserProfile {
  user_id: string
  name?: string // Added name field for user display
  email?: string // Added email field for user info
  step_goal: number
  workout_goal: number
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  preferences: Record<string, any>
  updated_at: string
}

export interface StepsDaily {
  id: string
  user_id: string
  date: string
  steps: number
  calories_est: number
  distance_est: number
  source: 'device_motion' | 'health_connect' | 'healthkit' | 'manual'
  created_at: string
}

export interface Workout {
  id: string
  user_id: string
  type: string
  plan_id?: string
  duration_min: number
  calories_est: number
  source: 'app' | 'strava'
  strava_activity_id?: number
  completed_at: string
}

export interface StravaTokens {
  user_id: string
  access_token: string
  refresh_token: string
  expires_at: number
  scope: string
  created_at: string
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

export interface Route {
  id: string
  user_id: string
  geojson: Record<string, any>
  distance_m: number
  elev_gain_m: number
  created_at: string
}

// Legacy interfaces for backward compatibility (will be phased out)
export interface StepRecord extends StepsDaily {}
export interface WorkoutSession extends Workout {}
export interface StravaConnection extends StravaTokens {}
