"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { StravaIntegration } from "@/components/strava-integration";
import WorkoutSession from "@/components/workout-session";
import StepAnalytics from "@/components/step-analytics";
import WorkoutBuilder from "@/components/workout-builder";
import { DatabaseStatus } from "@/components/database-status";
import { PostCreator } from "@/components/post-creator";
import { useAuth } from "@/hooks/useAuth";
import { useStepTracking } from "@/hooks/useStepTracking";
import { isDemoMode } from "@/lib/supabase";

interface Workout {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  duration: number;
  equipment: string[];
  description: string;
  muscles?: string[];
}

interface SessionWorkout {
  id: string;
  name: string;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    duration: number;
    rest: number;
  }>;
}

export default function Home() {
  const { user, profile, loading: authLoading, signUp, signIn, signOut, updateProfile, isAuthenticated } = useAuth();
  const { stepData, statistics, isTracking, requestPermission, startTracking, stopTracking } = useStepTracking(
    user?.id || null,
    profile?.step_goal || 10000
  );

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<SessionWorkout | null>(null);
  const [showWorkoutSession, setShowWorkoutSession] = useState(false);
  const [showPostCreator, setShowPostCreator] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);

  // Auth form state
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: ""
  });

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [formData, setFormData] = useState({
    stepGoal: "10000",
    workoutGoal: "3",
    fitnessLevel: "beginner" as "beginner" | "intermediate" | "advanced",
    preferences: [] as string[]
  });

  // Check if user needs onboarding
  useEffect(() => {
    if (isAuthenticated && profile && !profile.step_goal) {
      setIsOnboarding(true);
    } else {
      setIsOnboarding(false);
    }
  }, [isAuthenticated, profile]);

  // Load workouts from API
  useEffect(() => {
    const loadWorkouts = async () => {
      setLoadingWorkouts(true);
      try {
        const response = await fetch('/api/workouts');
        const data = await response.json();
        setWorkouts(data.workouts);
      } catch (error) {
        console.error('Failed to load workouts:', error);
        // Fallback to default workouts
        const fallbackWorkouts: Workout[] = [
          {
            id: "1",
            name: "Morning Cardio Blast",
            category: "Cardio",
            difficulty: "Beginner",
            duration: 20,
            equipment: ["None"],
            description: "High-energy cardio workout to start your day"
          },
          {
            id: "2",
            name: "Bodyweight Strength",
            category: "Strength",
            difficulty: "Intermediate",
            duration: 30,
            equipment: ["None"],
            description: "Build muscle with bodyweight exercises"
          }
        ];
        setWorkouts(fallbackWorkouts);
      }
      setLoadingWorkouts(false);
    };

    if (isAuthenticated && !isOnboarding) {
      loadWorkouts();
    }
  }, [isAuthenticated, isOnboarding]);

  // Demo Mode Notice Component
  const DemoModeNotice = () => {
    if (!isDemoMode) return null;

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-amber-600 text-lg">⚠️</span>
          <div className="flex-1">
            <h3 className="text-amber-800 font-semibold">Demo Mode Active</h3>
            <p className="text-amber-700 text-sm">
              You're running in demo mode. Data is stored in memory and will be lost on refresh.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/new', '_blank')}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            Setup Supabase
          </Button>
        </div>
        <details className="mt-3">
          <summary className="text-amber-700 cursor-pointer text-sm font-medium">
            Click to see setup instructions
          </summary>
          <div className="mt-2 text-amber-700 text-sm space-y-2">
            <p><strong>To enable full functionality:</strong></p>
            <ol className="list-decimal list-inside space-y-1 pl-4">
              <li>Create a new project at <a href="https://supabase.com/dashboard/new" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
              <li>Copy your project URL and anon key from Project Settings → API</li>
              <li>Update the environment variables in <code className="bg-amber-100 px-1 rounded">.env.local</code></li>
              <li>Run the database schema from <code className="bg-amber-100 px-1 rounded">.same/database-schema.sql</code> in your Supabase SQL Editor</li>
              <li>Restart the development server</li>
            </ol>
            <p className="text-xs mt-2">
              Check the <code className="bg-amber-100 px-1 rounded">.same/database-schema.sql</code> file for the complete database setup.
            </p>
          </div>
        </details>
      </div>
    );
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'signup') {
      if (authForm.password !== authForm.confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      const result = await signUp(authForm.email, authForm.password, authForm.name);
      if (result.success) {
        setShowAuth(false);
        alert('Check your email for verification link');
      } else {
        alert(result.error);
      }
    } else {
      const result = await signIn(authForm.email, authForm.password);
      if (result.success) {
        setShowAuth(false);
      } else {
        alert(result.error);
      }
    }
  };

  const handleOnboardingNext = async () => {
    if (onboardingStep < 2) {
      setOnboardingStep(prev => prev + 1);
    } else {
      // Save profile updates
      const result = await updateProfile({
        step_goal: parseInt(formData.stepGoal),
        workout_goal: parseInt(formData.workoutGoal),
        fitness_level: formData.fitnessLevel,
        preferences: formData.preferences
      });

      if (result.success) {
        setIsOnboarding(false);
      } else {
        alert('Failed to save profile');
      }
    }
  };

  const togglePreference = (pref: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(pref)
        ? prev.preferences.filter(p => p !== pref)
        : [...prev.preferences, pref]
    }));
  };

  const handleStartWorkout = (workout: Workout) => {
    // Convert workout to the format expected by WorkoutSession
    const sessionWorkout = {
      id: workout.id,
      name: workout.name,
      exercises: [
        {
          id: `${workout.id}-1`,
          name: `${workout.name} - Main Exercise`,
          sets: 3,
          reps: 12,
          duration: workout.duration * 60, // Convert minutes to seconds
          rest: 60 // 1 minute rest between sets
        },
        {
          id: `${workout.id}-2`,
          name: `${workout.name} - Secondary Exercise`,
          sets: 2,
          reps: 15,
          duration: Math.round(workout.duration * 60 * 0.4),
          rest: 45
        }
      ]
    };

    setSelectedWorkout(sessionWorkout);
    setShowWorkoutSession(true);
  };

  const handleCloseWorkoutSession = () => {
    setShowWorkoutSession(false);
    setSelectedWorkout(null);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading FitTracker...</p>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated || showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{authMode === 'signin' ? 'Sign In' : 'Sign Up'} to FitTracker</CardTitle>
            <CardDescription>Your personal fitness companion</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'signup' && (
                <Input
                  placeholder="Full Name"
                  value={authForm.name}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              {authMode === 'signup' && (
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              )}
              <Button type="submit" className="w-full">
                {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
              >
                {authMode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Onboarding screen
  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to FitTracker, {profile?.name}!</CardTitle>
            <CardDescription>Let's set up your fitness journey</CardDescription>
            <Progress value={(onboardingStep + 1) * 33.33} className="w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Set your daily step goal</h3>
                <Input
                  type="number"
                  placeholder="10000"
                  value={formData.stepGoal}
                  onChange={(e) => setFormData(prev => ({ ...prev, stepGoal: e.target.value }))}
                />
                <p className="text-sm text-gray-600">Recommended: 8,000-12,000 steps per day</p>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Fitness level & weekly workout goal</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Fitness Level</label>
                    <div className="flex gap-2 mt-1">
                      {["beginner", "intermediate", "advanced"].map((level) => (
                        <Button
                          key={level}
                          variant={formData.fitnessLevel === level ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, fitnessLevel: level as typeof prev.fitnessLevel }))}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Weekly Workouts</label>
                    <Input
                      type="number"
                      placeholder="3"
                      value={formData.workoutGoal}
                      onChange={(e) => setFormData(prev => ({ ...prev, workoutGoal: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Workout preferences</h3>
                <div className="grid grid-cols-2 gap-2">
                  {["Cardio", "Strength", "HIIT", "Yoga", "Flexibility", "Endurance"].map((pref) => (
                    <Button
                      key={pref}
                      variant={formData.preferences.includes(pref) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePreference(pref)}
                    >
                      {pref}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="fitness"
              size="lg"
              onClick={handleOnboardingNext}
              className="w-full"
              disabled={
                (onboardingStep === 0 && !formData.stepGoal) ||
                (onboardingStep === 1 && (!formData.workoutGoal || !formData.fitnessLevel))
              }
            >
              {onboardingStep === 2 ? "🎯 Complete Setup" : "➡️ Next"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show workout session overlay
  if (showWorkoutSession && selectedWorkout) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <WorkoutSession
          userId={user?.id || null}
          workout={{
            ...selectedWorkout,
            exercises: selectedWorkout.exercises.map(ex => ({
              ...ex,
              rest_time: ex.rest,
              reps: ex.reps.toString(),
              target_muscles: [],
              instructions: `Perform ${ex.reps} reps with ${ex.rest}s rest`
            }))
          }}
          onComplete={handleCloseWorkoutSession}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FitTracker</h1>
              <p className="text-sm text-gray-600">
                Welcome back, {profile?.name}! {isDemoMode && <span className="text-amber-600">(Demo Mode)</span>}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">🔥 {Math.floor(stepData.daily / 1000)} streak</Badge>
              <Button
                variant={isTracking ? "destructive" : "fitness"}
                size="sm"
                onClick={isTracking ? stopTracking : startTracking}
              >
                {isTracking ? "⏹️ Stop Tracking" : "👟 Start Step Tracking"}
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DemoModeNotice />

        {/* Database Status */}
        <div className="mb-6">
          <DatabaseStatus />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="strava">Strava</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            {/* Step Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Steps</CardTitle>
                  <span className="text-2xl">👟</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stepData.daily.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Goal: {stepData.goal.toLocaleString()}
                  </p>
                  <Progress value={Math.min(statistics.progress, 100)} className="mt-2" />
                  <p className="text-xs text-green-600 mt-1">
                    {statistics.progress >= 100 ? "Goal achieved! 🎉" : `${Math.round(100 - statistics.progress)}% to go`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Steps</CardTitle>
                  <span className="text-2xl">📊</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stepData.weekly.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Goal: {((profile?.step_goal || 10000) * 7).toLocaleString()}/week
                  </p>
                  <Progress value={Math.min(statistics.weeklyProgress, 100)} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Workouts</CardTitle>
                  <span className="text-2xl">💪</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2/{profile?.workout_goal || 3}</div>
                  <p className="text-xs text-muted-foreground">This week</p>
                  <Progress value={(2 / (profile?.workout_goal || 3)) * 100} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{statistics.distance}</div>
                  <div className="text-xs text-gray-600">Kilometers walked</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{statistics.calories}</div>
                  <div className="text-xs text-gray-600">Calories burned</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{statistics.activeMinutes}</div>
                  <div className="text-xs text-gray-600">Active minutes</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">7</div>
                  <div className="text-xs text-gray-600">Day streak</div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Step goal progress: {Math.round(statistics.progress)}%</p>
                      <p className="text-xs text-gray-600">Last updated: {stepData.lastUpdate.toLocaleTimeString()}</p>
                    </div>
                    <Badge variant="secondary">{stepData.daily} steps</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Workout library updated</p>
                      <p className="text-xs text-gray-600">From wger.de API</p>
                    </div>
                    <Badge variant="secondary">{workouts.length} exercises</Badge>
                  </div>
                  {isTracking && (
                    <>
                      <Separator />
                      <div className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Step tracking active</p>
                          <p className="text-xs text-gray-600">Device motion sensor enabled</p>
                        </div>
                        <Badge variant="secondary">Live</Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <StepAnalytics
              userId={user?.id || null}
              stepGoal={profile?.step_goal || 10000}
              currentSteps={stepData.daily}

            />
          </TabsContent>

          <TabsContent value="workouts" className="mt-6">
            <Tabs defaultValue="library" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="library">Exercise Library</TabsTrigger>
                <TabsTrigger value="builder">Custom Builder</TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="space-y-6 mt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Workout Library</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                      Refresh Library
                    </Button>
                  </div>
                </div>

              {loadingWorkouts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-200 rounded"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {workouts.map((workout) => (
                    <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{workout.name}</CardTitle>
                          <Badge variant="outline">{workout.difficulty}</Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{workout.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Duration:</span>
                            <span>{workout.duration} min</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Category:</span>
                            <span>{workout.category}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Equipment:</span>
                            <span className="truncate ml-2">{workout.equipment.join(", ")}</span>
                          </div>
                          {workout.muscles && workout.muscles.length > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Muscles:</span>
                              <span className="truncate ml-2">{workout.muscles.slice(0, 2).join(", ")}</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="workout"
                          size="lg"
                          className="w-full mt-4"
                          onClick={() => handleStartWorkout(workout)}
                        >
                          🏋️ Start Workout
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </TabsContent>

              <TabsContent value="builder" className="mt-6">
                <WorkoutBuilder
                  userId={user?.id || null}
                  onSaveProgram={(program) => {
                    console.log('Program saved:', program)
                    // Could integrate with database here
                  }}
                  onStartWorkout={(workout) => {
                    const sessionWorkout = {
                      id: workout.id,
                      name: workout.name,
                      exercises: workout.exercises.map(ex => ({
                        id: ex.id,
                        name: ex.name,
                        sets: ex.sets,
                        reps: parseInt(ex.reps.split('-')[0]) || 10, // Extract first number from range
                        duration: workout.estimated_duration * 60, // Convert minutes to seconds
                        rest: ex.rest_time
                      }))
                    }
                    setSelectedWorkout(sessionWorkout)
                    setShowWorkoutSession(true)
                  }}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="strava" className="mt-6">
            <StravaIntegration />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <div className="space-y-6">
              {/* Post Creator Modal */}
              {showPostCreator && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <PostCreator
                    onPostCreated={(post) => {
                      setPosts(prev => [post, ...prev]);
                      setShowPostCreator(false);
                    }}
                    onClose={() => setShowPostCreator(false)}
                  />
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Share Your Progress</CardTitle>
                  <CardDescription>Post your workouts and motivate others</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="space-y-2">
                      <div className="text-4xl">📸</div>
                      <p className="text-lg font-medium">Share your workout</p>
                      <p className="text-sm text-gray-600">Upload a photo or video of your latest session</p>
                      <Button
                        variant="premium"
                        size="lg"
                        onClick={() => setShowPostCreator(true)}
                      >
                        📸 Create Post
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Recent Posts</h3>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{profile?.name?.[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium">{profile?.name}</p>
                            <p className="text-xs text-gray-600">2 hours ago</p>
                          </div>
                        </div>
                        <p className="text-sm mb-2">
                          Just hit {stepData.daily.toLocaleString()} steps today! 💪 On track to reach my {stepData.goal.toLocaleString()} step goal.
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <button className="hover:text-red-500">❤️ 12</button>
                          <button className="hover:text-blue-500">💬 3</button>
                          <button className="hover:text-green-500">🔄 Share</button>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">F</span>
                          </div>
                          <div>
                            <p className="font-medium">FitTracker Community</p>
                            <p className="text-xs text-gray-600">1 day ago</p>
                          </div>
                        </div>
                        <p className="text-sm mb-2">
                          New workouts added from wger.de! Check out the updated library with {workouts.length} exercises.
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <button className="hover:text-red-500">❤️ 8</button>
                          <button className="hover:text-blue-500">💬 5</button>
                          <button className="hover:text-green-500">🔄 Share</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
