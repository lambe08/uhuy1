import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting tracking (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset every 15 minutes as per Strava API limits
    rateLimitMap.set(userId, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }

  if (userLimit.count >= 100) { // 100 requests per 15 minutes for non-upload endpoints
    return false;
  }

  userLimit.count += 1;
  return true;
}

async function refreshStravaToken(userId: string, refreshToken: string) {
  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const tokenData = await response.json();

    // Update tokens in database
    await supabase
      .from('strava_tokens')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
      })
      .eq('user_id', userId);

    return tokenData.access_token;
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') || '10';
    const page = searchParams.get('page') || '1';

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json({
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 });
    }

    // Get user's Strava tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json({
        error: 'Strava not connected. Please authorize first.'
      }, { status: 401 });
    }

    let accessToken = tokenData.access_token;

    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000);
    if (tokenData.expires_at <= now) {
      try {
        accessToken = await refreshStravaToken(userId, tokenData.refresh_token);
      } catch (error) {
        return NextResponse.json({
          error: 'Token refresh failed. Please re-authorize.'
        }, { status: 401 });
      }
    }

    // Fetch activities from Strava
    const activitiesResponse = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${limit}&page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      if (activitiesResponse.status === 401) {
        return NextResponse.json({
          error: 'Strava authorization expired. Please re-authorize.'
        }, { status: 401 });
      }
      throw new Error(`Strava API error: ${activitiesResponse.status}`);
    }

    const activities = await activitiesResponse.json();

    // Transform activities to our format and store in database
    const transformedActivities = activities.map((activity: any) => ({
      id: activity.id,
      user_id: userId,
      type: activity.type,
      name: activity.name,
      distance: activity.distance,
      moving_time: activity.moving_time,
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      start_date: activity.start_date,
      start_latlng: activity.start_latlng,
      end_latlng: activity.end_latlng,
      summary_polyline: activity.map?.summary_polyline,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      calories: activity.calories,
      strava_activity_id: activity.id,
    }));

    // Store new activities in our database
    for (const activity of transformedActivities) {
      try {
        await supabase
          .from('workouts')
          .upsert({
            user_id: userId,
            type: activity.type,
            duration_min: Math.round(activity.moving_time / 60),
            calories_est: activity.calories || 0,
            source: 'strava',
            strava_activity_id: activity.strava_activity_id,
            completed_at: activity.start_date,
          }, {
            onConflict: 'strava_activity_id',
          });
      } catch (error) {
        console.error('Error storing activity:', error);
      }
    }

    return NextResponse.json({
      activities: transformedActivities,
      success: true
    });

  } catch (error) {
    console.error('Strava activities error:', error);
    return NextResponse.json({
      error: 'Failed to fetch activities'
    }, { status: 500 });
  }
}
