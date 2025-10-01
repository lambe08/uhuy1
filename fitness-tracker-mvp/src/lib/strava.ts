import { supabase, isDemoMode } from './supabase'
import { stravaConnectionService } from './database'
import type { StravaConnection } from './supabase'

// Strava API Types
export interface StravaAthlete {
  id: number
  username: string
  firstname: string
  lastname: string
  profile_medium: string
  profile: string
  city: string
  state: string
  country: string
}

export interface StravaActivity {
  id: number
  name: string
  type: string
  sport_type: string
  distance: number
  moving_time: number
  elapsed_time: number
  total_elevation_gain: number
  start_date: string
  start_date_local: string
  timezone: string
  average_speed: number
  max_speed: number
  has_heartrate: boolean
  average_heartrate?: number
  max_heartrate?: number
  calories?: number
  suffer_score?: number
  map: {
    polyline?: string
    summary_polyline?: string
  }
}

export interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
  scope: string
  athlete: StravaAthlete
}

export interface StravaUploadResponse {
  id: number
  external_id: string
  error: string | null
  status: string
  activity_id: number | null
}

// Rate limiting state
interface RateLimit {
  shortTerm: { limit: number; usage: number; resetTime: number }
  daily: { limit: number; usage: number; resetTime: number }
}

let rateLimit: RateLimit = {
  shortTerm: { limit: 600, usage: 0, resetTime: Date.now() + 15 * 60 * 1000 },
  daily: { limit: 30000, usage: 0, resetTime: Date.now() + 24 * 60 * 60 * 1000 }
}

// Strava API Configuration
const STRAVA_API_BASE = 'https://www.strava.com/api/v3'
const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth'

export class StravaAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public rateLimited?: boolean
  ) {
    super(message)
    this.name = 'StravaAPIError'
  }
}

// Rate limiting helpers
const updateRateLimit = (headers: Headers) => {
  const shortTermLimit = headers.get('X-RateLimit-Limit')
  const shortTermUsage = headers.get('X-RateLimit-Usage')
  const dailyLimit = headers.get('X-Daily-RateLimit-Limit')
  const dailyUsage = headers.get('X-Daily-RateLimit-Usage')

  if (shortTermLimit && shortTermUsage) {
    const [shortUsage, shortLimit] = shortTermUsage.split(',').map(Number)
    rateLimit.shortTerm.limit = parseInt(shortTermLimit)
    rateLimit.shortTerm.usage = shortUsage
  }

  if (dailyLimit && dailyUsage) {
    const [dailyUse, dLimit] = dailyUsage.split(',').map(Number)
    rateLimit.daily.limit = parseInt(dailyLimit)
    rateLimit.daily.usage = dailyUse
  }
}

const checkRateLimit = (): boolean => {
  const now = Date.now()

  // Reset counters if time windows have passed
  if (now > rateLimit.shortTerm.resetTime) {
    rateLimit.shortTerm.usage = 0
    rateLimit.shortTerm.resetTime = now + 15 * 60 * 1000
  }

  if (now > rateLimit.daily.resetTime) {
    rateLimit.daily.usage = 0
    rateLimit.daily.resetTime = now + 24 * 60 * 60 * 1000
  }

  // Check if we're approaching limits
  return (
    rateLimit.shortTerm.usage < rateLimit.shortTerm.limit * 0.9 &&
    rateLimit.daily.usage < rateLimit.daily.limit * 0.9
  )
}

// Demo data for testing
const getDemoActivities = (): StravaActivity[] => [
  {
    id: 1001,
    name: "Morning Run",
    type: "Run",
    sport_type: "Run",
    distance: 5200,
    moving_time: 1680,
    elapsed_time: 1800,
    total_elevation_gain: 45,
    start_date: "2024-01-15T06:30:00Z",
    start_date_local: "2024-01-15T07:30:00",
    timezone: "(GMT+01:00) Europe/Berlin",
    average_speed: 3.1,
    max_speed: 4.2,
    has_heartrate: true,
    average_heartrate: 145,
    max_heartrate: 165,
    calories: 320,
    map: {
      polyline: "demo_polyline_run",
      summary_polyline: "demo_summary_run"
    }
  },
  {
    id: 1002,
    name: "Evening Bike Ride",
    type: "Ride",
    sport_type: "Ride",
    distance: 15400,
    moving_time: 2520,
    elapsed_time: 2700,
    total_elevation_gain: 120,
    start_date: "2024-01-14T18:00:00Z",
    start_date_local: "2024-01-14T19:00:00",
    timezone: "(GMT+01:00) Europe/Berlin",
    average_speed: 6.1,
    max_speed: 8.5,
    has_heartrate: false,
    calories: 480,
    map: {
      polyline: "demo_polyline_ride",
      summary_polyline: "demo_summary_ride"
    }
  }
]

// Main Strava service
export const stravaService = {
  // OAuth flow initiation
  getAuthorizationUrl: (state?: string): string => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    if (!clientId) {
      throw new Error('Strava Client ID not configured')
    }

    const redirectUri = `${window.location.origin}/strava/callback`
    const scope = 'read,activity:read_all,activity:write'

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      approval_prompt: 'force',
      scope: scope,
      ...(state && { state })
    })

    return `${STRAVA_OAUTH_BASE}/authorize?${params.toString()}`
  },

  // Exchange authorization code for tokens
  exchangeCodeForTokens: async (code: string): Promise<StravaTokenResponse> => {
    if (isDemoMode) {
      // Return demo token response
      return {
        access_token: `demo_access_${Date.now()}`,
        refresh_token: `demo_refresh_${Date.now()}`,
        expires_at: Math.floor(Date.now() / 1000) + 21600, // 6 hours
        scope: 'read,activity:read_all,activity:write',
        athlete: {
          id: 12345,
          username: 'demo_athlete',
          firstname: 'Demo',
          lastname: 'User',
          profile_medium: '',
          profile: '',
          city: 'Demo City',
          state: 'Demo State',
          country: 'Demo Country'
        }
      }
    }

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new StravaAPIError('Strava credentials not configured')
    }

    const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new StravaAPIError(
        `Failed to exchange code for tokens: ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    updateRateLimit(response.headers)

    return data
  },

  // Refresh access token
  refreshAccessToken: async (refreshToken: string): Promise<StravaTokenResponse> => {
    if (isDemoMode) {
      // Return new demo tokens
      return {
        access_token: `demo_access_refreshed_${Date.now()}`,
        refresh_token: refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + 21600,
        scope: 'read,activity:read_all,activity:write',
        athlete: {
          id: 12345,
          username: 'demo_athlete',
          firstname: 'Demo',
          lastname: 'User',
          profile_medium: '',
          profile: '',
          city: 'Demo City',
          state: 'Demo State',
          country: 'Demo Country'
        }
      }
    }

    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new StravaAPIError('Strava credentials not configured')
    }

    const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new StravaAPIError(
        `Failed to refresh token: ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    updateRateLimit(response.headers)

    return data
  },

  // Get athlete's activities
  getActivities: async (
    accessToken: string,
    page = 1,
    perPage = 30
  ): Promise<StravaActivity[]> => {
    if (isDemoMode) {
      return getDemoActivities()
    }

    if (!checkRateLimit()) {
      throw new StravaAPIError('Rate limit exceeded', 429, true)
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    })

    const response = await fetch(
      `${STRAVA_API_BASE}/athlete/activities?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) {
      updateRateLimit(response.headers)

      if (response.status === 429) {
        throw new StravaAPIError('Rate limit exceeded', 429, true)
      }

      throw new StravaAPIError(
        `Failed to fetch activities: ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    updateRateLimit(response.headers)

    return data
  },

  // Upload activity to Strava
  uploadActivity: async (
    accessToken: string,
    file: File,
    dataType: 'fit' | 'tcx' | 'gpx',
    name?: string,
    description?: string
  ): Promise<StravaUploadResponse> => {
    if (isDemoMode) {
      // Return demo upload response
      return {
        id: Date.now(),
        external_id: `demo_upload_${Date.now()}`,
        error: null,
        status: 'Your activity is being processed.',
        activity_id: null
      }
    }

    if (!checkRateLimit()) {
      throw new StravaAPIError('Rate limit exceeded', 429, true)
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('data_type', dataType)

    if (name) formData.append('name', name)
    if (description) formData.append('description', description)

    const response = await fetch(`${STRAVA_API_BASE}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    })

    if (!response.ok) {
      updateRateLimit(response.headers)

      if (response.status === 429) {
        throw new StravaAPIError('Rate limit exceeded', 429, true)
      }

      throw new StravaAPIError(
        `Failed to upload activity: ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    updateRateLimit(response.headers)

    return data
  },

  // Check upload status
  getUploadStatus: async (
    accessToken: string,
    uploadId: number
  ): Promise<StravaUploadResponse> => {
    if (isDemoMode) {
      return {
        id: uploadId,
        external_id: `demo_upload_${uploadId}`,
        error: null,
        status: 'Your activity is ready.',
        activity_id: Date.now()
      }
    }

    const response = await fetch(`${STRAVA_API_BASE}/uploads/${uploadId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (!response.ok) {
      throw new StravaAPIError(
        `Failed to check upload status: ${response.statusText}`,
        response.status
      )
    }

    const data = await response.json()
    updateRateLimit(response.headers)

    return data
  },

  // Deauthorize application (revoke access)
  deauthorize: async (accessToken: string): Promise<void> => {
    if (isDemoMode) {
      return // No actual deauth needed in demo mode
    }

    const response = await fetch(`${STRAVA_API_BASE}/oauth/deauthorize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    })

    if (!response.ok) {
      throw new StravaAPIError(
        `Failed to deauthorize: ${response.statusText}`,
        response.status
      )
    }

    updateRateLimit(response.headers)
  },

  // Get current rate limit status
  getRateLimit: (): RateLimit => rateLimit,

  // Database connection helpers
  saveConnection: async (userId: string, tokenData: StravaTokenResponse): Promise<void> => {
    await stravaConnectionService.upsertStravaConnection({
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: tokenData.expires_at,
      athlete_id: tokenData.athlete.id,
      scope: tokenData.scope
    })
  },

  getConnection: async (userId: string): Promise<StravaConnection | null> => {
    return await stravaConnectionService.getStravaConnection(userId)
  },

  removeConnection: async (userId: string): Promise<void> => {
    await stravaConnectionService.deleteStravaConnection(userId)
  }
}
