import { NextRequest, NextResponse } from 'next/server'
import { workoutSessionService } from '@/lib/database'
import { stravaService } from '@/lib/strava'

// Webhook event types from Strava
interface StravaWebhookEvent {
  object_type: 'activity' | 'athlete'
  object_id: number
  aspect_type: 'create' | 'update' | 'delete'
  updates: Record<string, any>
  owner_id: number
  subscription_id: number
  event_time: number
}

interface StravaWebhookChallenge {
  'hub.mode': string
  'hub.challenge': string
  'hub.verify_token': string
}

// Webhook verification (required by Strava)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Extract webhook challenge parameters
  const mode = searchParams.get('hub.mode')
  const challenge = searchParams.get('hub.challenge')
  const verifyToken = searchParams.get('hub.verify_token')

  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'demo_verify_token'

  console.log('Webhook verification request:', { mode, challenge, verifyToken })

  // Verify the subscription (as required by Strava)
  if (mode === 'subscribe' && verifyToken === expectedToken) {
    console.log('Webhook verified successfully')

    return new NextResponse(JSON.stringify({ 'hub.challenge': challenge }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  console.log('Webhook verification failed')
  return new NextResponse('Verification failed', { status: 403 })
}

// Handle webhook events from Strava
export async function POST(request: NextRequest) {
  try {
    const event: StravaWebhookEvent = await request.json()

    console.log('Received Strava webhook event:', event)

    // Verify webhook signature (in production, you should verify the signature)
    // const signature = request.headers.get('strava-signature')
    // if (!verifyWebhookSignature(body, signature)) {
    //   return new NextResponse('Invalid signature', { status: 401 })
    // }

    // Process different event types
    switch (event.object_type) {
      case 'activity':
        await handleActivityEvent(event)
        break

      case 'athlete':
        await handleAthleteEvent(event)
        break

      default:
        console.log('Unknown object type:', event.object_type)
    }

    // Acknowledge the webhook (must respond within 2 seconds)
    return new NextResponse('EVENT_RECEIVED', { status: 200 })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new NextResponse('Error processing webhook', { status: 500 })
  }
}

// Handle activity-related webhook events
async function handleActivityEvent(event: StravaWebhookEvent) {
  const { object_id: activityId, aspect_type, owner_id: athleteId } = event

  console.log(`Processing activity ${aspect_type} for activity ${activityId}, athlete ${athleteId}`)

  try {
    // Find user by Strava athlete ID
    const connection = await stravaService.getConnection(`strava_${athleteId}`)
    if (!connection) {
      console.log(`No connection found for athlete ${athleteId}`)
      return
    }

    switch (aspect_type) {
      case 'create':
        await handleNewActivity(activityId, connection.user_id, connection.access_token)
        break

      case 'update':
        await handleActivityUpdate(activityId, connection.user_id, connection.access_token)
        break

      case 'delete':
        await handleActivityDeletion(activityId, connection.user_id)
        break
    }
  } catch (error) {
    console.error(`Error handling activity ${aspect_type}:`, error)
  }
}

// Handle athlete-related webhook events (e.g., deauthorization)
async function handleAthleteEvent(event: StravaWebhookEvent) {
  const { aspect_type, owner_id: athleteId } = event

  console.log(`Processing athlete ${aspect_type} for athlete ${athleteId}`)

  if (aspect_type === 'update' && event.updates?.authorized === 'false') {
    // User has deauthorized the application
    console.log(`Athlete ${athleteId} deauthorized the application`)

    try {
      // Remove the connection from our database
      await stravaService.removeConnection(`strava_${athleteId}`)
      console.log(`Removed connection for athlete ${athleteId}`)
    } catch (error) {
      console.error(`Error removing connection for athlete ${athleteId}:`, error)
    }
  }
}

// Handle new activity creation
async function handleNewActivity(activityId: number, userId: string, accessToken: string) {
  try {
    // Fetch activity details from Strava API
    const activities = await stravaService.getActivities(accessToken, 1, 1)
    const activity = activities.find(a => a.id === activityId)

    if (!activity) {
      console.log(`Activity ${activityId} not found in recent activities`)
      return
    }

    // Convert Strava activity to our workout session format
    const workoutSession = {
      user_id: userId,
      type: activity.type || 'Workout',
      duration_min: Math.round(activity.moving_time / 60),
      calories_est: activity.calories || estimateCalories(activity),
      completed_at: activity.start_date,
      source: 'strava' as const,
      strava_activity_id: activityId
    }

    // Save to database
    await workoutSessionService.createWorkoutSession(workoutSession)

    console.log(`Saved new Strava activity ${activityId} as workout session`)

    // Optionally, trigger notifications or other side effects here
    // await notifyUserOfNewActivity(userId, activity)

  } catch (error) {
    console.error(`Error processing new activity ${activityId}:`, error)

    // If it's a rate limit error, we might want to retry later
    if (error instanceof Error && error.message.includes('Rate limit')) {
      console.log('Rate limited, activity will be synced on next manual sync')
    }
  }
}

// Handle activity updates
async function handleActivityUpdate(activityId: number, userId: string, accessToken: string) {
  try {
    // Fetch updated activity details
    const activities = await stravaService.getActivities(accessToken, 1, 30)
    const activity = activities.find(a => a.id === activityId)

    if (!activity) {
      console.log(`Updated activity ${activityId} not found`)
      return
    }

    // Find existing workout session
    const sessions = await workoutSessionService.getWorkoutSessions(userId)
    const existingSession = sessions.find(s => s.strava_activity_id === activityId)

    if (existingSession) {
      // Update existing session
      await workoutSessionService.updateWorkoutSession(existingSession.id, {
        type: activity.type || 'Workout',
        duration_min: Math.round(activity.moving_time / 60),
        calories_est: activity.calories || estimateCalories(activity),
        completed_at: activity.start_date
      })

      console.log(`Updated workout session for Strava activity ${activityId}`)
    } else {
      // Activity was updated but we don't have it yet, treat as new
      await handleNewActivity(activityId, userId, accessToken)
    }

  } catch (error) {
    console.error(`Error updating activity ${activityId}:`, error)
  }
}

// Handle activity deletion
async function handleActivityDeletion(activityId: number, userId: string) {
  try {
    // Find and delete corresponding workout session
    const sessions = await workoutSessionService.getWorkoutSessions(userId)
    const sessionToDelete = sessions.find(s => s.strava_activity_id === activityId)

    if (sessionToDelete) {
      await workoutSessionService.deleteWorkoutSession(sessionToDelete.id)
      console.log(`Deleted workout session for Strava activity ${activityId}`)
    }

  } catch (error) {
    console.error(`Error deleting activity ${activityId}:`, error)
  }
}

// Estimate calories if not provided by Strava
function estimateCalories(activity: any): number {
  const durationHours = activity.moving_time / 3600
  const distanceKm = activity.distance / 1000

  // Basic calorie estimation based on activity type
  const calorieRates: Record<string, number> = {
    'Run': 600, // cal/hour
    'Ride': 400,
    'Walk': 300,
    'Hike': 400,
    'WeightTraining': 350,
    'Yoga': 200,
    'Swim': 500
  }

  const rate = calorieRates[activity.type] || 350
  return Math.round(rate * durationHours)
}

// Webhook subscription management endpoint
export async function PUT(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'subscribe') {
      // In a real implementation, you would call Strava's webhook subscription API
      console.log('Webhook subscription requested')
      return NextResponse.json({ success: true, message: 'Webhook subscription created' })
    }

    if (action === 'unsubscribe') {
      console.log('Webhook unsubscription requested')
      return NextResponse.json({ success: true, message: 'Webhook subscription removed' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error managing webhook subscription:', error)
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 })
  }
}
