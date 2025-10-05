"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { stravaService } from '@/lib/strava'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function StravaCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [athleteInfo, setAthleteInfo] = useState<any>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const state = searchParams.get('state')

        // Check for authorization errors
        if (error) {
          setStatus('error')
          setMessage(`Authorization failed: ${error}`)
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          return
        }

        if (!user) {
          setStatus('error')
          setMessage('You must be logged in to connect Strava')
          return
        }

        setMessage('Exchanging authorization code for access token...')

        // Exchange code for tokens
        const tokenResponse = await stravaService.exchangeCodeForTokens(code)

        setMessage('Saving connection to your account...')

        // Save connection to database
        await stravaService.saveConnection(user.id, tokenResponse)

        // Store in localStorage for immediate use
        localStorage.setItem('strava_token', JSON.stringify({
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          expires_at: tokenResponse.expires_at,
          athlete_id: tokenResponse.athlete.id
        }))

        setAthleteInfo(tokenResponse.athlete)
        setStatus('success')
        setMessage('Successfully connected to Strava!')

      } catch (error) {
        console.error('Strava callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Failed to connect to Strava')
      }
    }

    handleCallback()
  }, [searchParams, user])

  const handleContinue = () => {
    // Redirect back to main app with Strava tab active
    router.push('/?tab=strava')
  }

  const handleRetry = () => {
    // Redirect back to main app to try connection again
    router.push('/?tab=strava')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>

          <CardTitle>
            {status === 'loading' && 'Connecting to Strava...'}
            {status === 'success' && 'Connected Successfully!'}
            {status === 'error' && 'Connection Failed'}
          </CardTitle>

          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && athleteInfo && (
            <div className="text-center space-y-3">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Welcome, {athleteInfo.firstname}!</h3>
                <p className="text-sm text-green-700">
                  @{athleteInfo.username} • {athleteInfo.city}, {athleteInfo.country}
                </p>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>✅ Activities will sync automatically</p>
                <p>✅ Real-time updates via webhooks</p>
                <p>✅ Upload workouts to Strava</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-3">
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-800">Something went wrong</h3>
                <p className="text-sm text-red-700">
                  Don't worry, you can try connecting again.
                </p>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Common issues:</strong></p>
                <ul className="text-left list-disc list-inside space-y-1">
                  <li>Make sure you're logged in to FitTracker</li>
                  <li>Check your internet connection</li>
                  <li>Try authorizing Strava again</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {status === 'success' && (
              <Button onClick={handleContinue} className="w-full">
                Continue to FitTracker
              </Button>
            )}

            {status === 'error' && (
              <>
                <Button onClick={handleRetry} className="flex-1">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                  Back to App
                </Button>
              </>
            )}

            {status === 'loading' && (
              <div className="w-full text-center text-sm text-gray-600">
                <p>This may take a few seconds...</p>
              </div>
            )}
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && status === 'error' && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500">Debug Info</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify({
                  searchParams: Object.fromEntries(searchParams.entries()),
                  user: user ? { id: user.id, email: user.email } : null,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
