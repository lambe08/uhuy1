import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/strava?error=${error}`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();

    // Get user information from Strava
    const userResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user information');
    }

    const userData = await userResponse.json();

    // Store tokens in Supabase (encrypt in production)
    const { error: dbError } = await supabase
      .from('strava_tokens')
      .upsert({
        user_id: state, // We pass user_id as state parameter
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: tokenData.expires_at,
        scope: tokenData.scope,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store tokens');
    }

    // Redirect back to app with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/strava?success=true`);

  } catch (error) {
    console.error('Strava OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/strava?error=auth_failed`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Generate authorization URL
    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID!);
    authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/strava/auth`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read,activity:read_all'); // Minimal required scopes for 2024 compliance
    authUrl.searchParams.set('state', userId); // Pass user ID as state

    return NextResponse.json({ authUrl: authUrl.toString() });

  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
