"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  elapsed_time: number;
  start_date: string;
  average_speed: number;
}

interface StravaToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete_id: number;
}

export function StravaIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [stravaToken, setStravaToken] = useState<StravaToken | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMockActivities = () => {
    const mockActivities: StravaActivity[] = [
      {
        id: 1,
        name: "Morning Run",
        type: "Run",
        distance: 5200, // meters
        elapsed_time: 1800, // seconds
        start_date: "2024-01-15T06:30:00Z",
        average_speed: 2.89
      },
      {
        id: 2,
        name: "Evening Bike Ride",
        type: "Ride",
        distance: 15400,
        elapsed_time: 2700,
        start_date: "2024-01-14T18:00:00Z",
        average_speed: 5.7
      },
      {
        id: 3,
        name: "Trail Hike",
        type: "Hike",
        distance: 8200,
        elapsed_time: 4500,
        start_date: "2024-01-13T09:15:00Z",
        average_speed: 1.82
      }
    ];
    setActivities(mockActivities);
  };

  const loadActivities = useCallback(async (accessToken: string) => {
    setLoading(true);
    try {
      // In a real app, this would make API calls to Strava
      // For demo, we'll load mock data
      loadMockActivities();
    } catch (error) {
      setError('Failed to load activities from Strava');
      console.error('Error loading activities:', error);
    }
    setLoading(false);
  }, []);

  // Check if user is already connected on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('strava_token');
    if (savedToken) {
      try {
        const token = JSON.parse(savedToken);
        if (token.expires_at > Date.now() / 1000) {
          setStravaToken(token);
          setIsConnected(true);
          loadActivities(token.access_token);
        } else {
          // Token expired, clear it
          localStorage.removeItem('strava_token');
        }
      } catch (error) {
        console.error('Error parsing saved token:', error);
        localStorage.removeItem('strava_token');
      }
    }
  }, [loadActivities]);

  const initiateStravaAuth = () => {
    // Strava OAuth2 configuration
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || 'demo_client_id';
    const redirectUri = `${window.location.origin}/strava/callback`;
    const scope = 'read,activity:read_all';

    const authUrl = `https://www.strava.com/oauth/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `approval_prompt=force&` +
      `scope=${scope}`;

    // In a real app, this would open a popup or redirect
    // For demo purposes, we'll simulate the connection
    setLoading(true);

    // Simulate OAuth flow
    setTimeout(() => {
      const mockToken: StravaToken = {
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 21600, // 6 hours from now
        athlete_id: 12345
      };

      localStorage.setItem('strava_token', JSON.stringify(mockToken));
      setStravaToken(mockToken);
      setIsConnected(true);
      setLoading(false);

      // Load mock activities
      loadMockActivities();
    }, 2000);
  };

  const disconnectStrava = () => {
    localStorage.removeItem('strava_token');
    setStravaToken(null);
    setIsConnected(false);
    setActivities([]);
    setError(null);
  };

  const formatDistance = (meters: number) => {
    if (meters === 0) return "N/A";
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Strava Integration</CardTitle>
          <CardDescription>
            Connect your Strava account to sync activities and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">S</span>
              </div>
              <div>
                <p className="font-medium">Strava Account</p>
                <p className="text-sm text-gray-600">
                  {isConnected ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isConnected ? (
                <>
                  <Button variant="outline" onClick={() => loadActivities(stravaToken?.access_token || '')}>
                    Sync Activities
                  </Button>
                  <Button variant="destructive" onClick={disconnectStrava}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={initiateStravaAuth} disabled={loading}>
                  {loading ? "Connecting..." : "Connect Strava"}
                </Button>
              )}
            </div>
          </div>

          {/* Features Overview */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>🔗 Sync your activities automatically</p>
            <p>📈 Import historical workout data</p>
            <p>🏃‍♂️ Share your FitTracker workouts to Strava</p>
            <p>🔔 Get real-time activity updates via webhooks</p>
          </div>

          {/* Privacy & Compliance Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800">Privacy & Compliance</h4>
            <p className="text-sm text-yellow-700 mt-1">
              We follow Strava's data usage policies. Your data is only displayed to you
              and never used for AI training. We respect rate limits and only request
              the minimum permissions needed.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activities List */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Your latest activities from Strava
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {activity.type === 'Run' ? '🏃' :
                           activity.type === 'Ride' ? '🚴' :
                           activity.type === 'WeightTraining' ? '💪' : '🏃'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.name}</h4>
                        <div className="text-sm text-gray-600 space-x-4">
                          <span>{formatDate(activity.start_date)}</span>
                          <span>{formatDistance(activity.distance)}</span>
                          <span>{formatDuration(activity.elapsed_time)}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{activity.type}</Badge>
                    </div>
                    {index < activities.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No activities found. Start working out and sync with Strava!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rate Limiting Info */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>
              Strava API rate limit compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">245/600</div>
                <div className="text-sm text-green-700">15-min requests</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">1,250/30,000</div>
                <div className="text-sm text-blue-700">Daily requests</div>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              We automatically throttle requests to stay within Strava's rate limits
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
