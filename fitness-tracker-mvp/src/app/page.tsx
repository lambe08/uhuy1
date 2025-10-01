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

interface UserProfile {
  name: string;
  stepGoal: number;
  workoutGoal: number;
  fitnessLevel: "beginner" | "intermediate" | "advanced";
  preferences: string[];
}

interface StepData {
  daily: number;
  weekly: number;
  goal: number;
  lastUpdate: Date;
}

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

interface StepDetector {
  lastAcceleration: number;
  stepThreshold: number;
  stepCount: number;
  lastStepTime: number;
}

export default function Home() {
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stepData, setStepData] = useState<StepData>({
    daily: 0,
    weekly: 0,
    goal: 10000,
    lastUpdate: new Date()
  });
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [stepDetector] = useState<StepDetector>({
    lastAcceleration: 0,
    stepThreshold: 12,
    stepCount: 0,
    lastStepTime: 0
  });

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    stepGoal: "10000",
    workoutGoal: "3",
    fitnessLevel: "beginner" as "beginner" | "intermediate" | "advanced",
    preferences: [] as string[]
  });

  // Enhanced step tracking with device motion API
  useEffect(() => {
    if (!isOnboarding && typeof window !== 'undefined') {
      let permissionGranted = false;

      const handleDeviceMotion = (event: DeviceMotionEvent) => {
        if (!event.accelerationIncludingGravity) return;

        const { x, y, z } = event.accelerationIncludingGravity;
        if (x === null || y === null || z === null) return;
        const acceleration = Math.sqrt(x*x + y*y + z*z);

        // Simple step detection algorithm
        if (acceleration > stepDetector.stepThreshold &&
            acceleration > stepDetector.lastAcceleration + 2 &&
            Date.now() - stepDetector.lastStepTime > 300) { // Minimum 300ms between steps

          stepDetector.stepCount++;
          stepDetector.lastStepTime = Date.now();

          setStepData(prev => ({
            ...prev,
            daily: prev.daily + 1,
            weekly: prev.weekly + 1,
            lastUpdate: new Date()
          }));
        }

        stepDetector.lastAcceleration = acceleration;
      };

      // Request permission for iOS devices
      if ('requestPermission' in DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              permissionGranted = true;
              window.addEventListener('devicemotion', handleDeviceMotion);
            }
          })
          .catch(console.error);
      } else {
        // For Android and other devices
        permissionGranted = true;
        window.addEventListener('devicemotion', handleDeviceMotion);
      }

      // Fallback simulation if device motion isn't available
      const simulationInterval = setInterval(() => {
        if (!permissionGranted) {
          setStepData(prev => ({
            ...prev,
            daily: prev.daily + Math.floor(Math.random() * 3),
            weekly: prev.weekly + Math.floor(Math.random() * 2),
            lastUpdate: new Date()
          }));
        }
      }, 5000);

      return () => {
        window.removeEventListener('devicemotion', handleDeviceMotion);
        clearInterval(simulationInterval);
      };
    }
  }, [isOnboarding, stepDetector]);

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

    if (!isOnboarding) {
      loadWorkouts();
    }
  }, [isOnboarding]);

  const handleOnboardingNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
    } else {
      const profile: UserProfile = {
        name: formData.name,
        stepGoal: parseInt(formData.stepGoal),
        workoutGoal: parseInt(formData.workoutGoal),
        fitnessLevel: formData.fitnessLevel,
        preferences: formData.preferences
      };
      setUserProfile(profile);
      setStepData(prev => ({ ...prev, goal: profile.stepGoal }));
      setIsOnboarding(false);
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

  const requestMotionPermission = async () => {
    if ('requestPermission' in DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          alert('Motion permissions granted! Your steps will now be tracked automatically.');
        }
      } catch (error) {
        console.error('Error requesting motion permission:', error);
      }
    }
  };

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to FitTracker</CardTitle>
            <CardDescription>Let's set up your fitness journey</CardDescription>
            <Progress value={(onboardingStep + 1) * 25} className="w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            {onboardingStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What's your name?</h3>
                <Input
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            )}

            {onboardingStep === 1 && (
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

            {onboardingStep === 2 && (
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

            {onboardingStep === 3 && (
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
              onClick={handleOnboardingNext}
              className="w-full"
              disabled={
                (onboardingStep === 0 && !formData.name) ||
                (onboardingStep === 1 && !formData.stepGoal) ||
                (onboardingStep === 2 && (!formData.workoutGoal || !formData.fitnessLevel))
              }
            >
              {onboardingStep === 3 ? "Complete Setup" : "Next"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stepProgress = (stepData.daily / stepData.goal) * 100;
  const weeklyGoal = userProfile?.workoutGoal ? userProfile.workoutGoal * 7 : 21;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FitTracker</h1>
              <p className="text-sm text-gray-600">Welcome back, {userProfile?.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">🔥 {Math.floor(stepData.daily / 1000)} streak</Badge>
              <Button variant="outline" size="sm" onClick={requestMotionPermission}>
                Enable Step Tracking
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                  <Progress value={Math.min(stepProgress, 100)} className="mt-2" />
                  <p className="text-xs text-green-600 mt-1">
                    {stepProgress >= 100 ? "Goal achieved! 🎉" : `${Math.round(100 - stepProgress)}% to go`}
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
                    Goal: {(userProfile?.stepGoal || 10000 * 7).toLocaleString()}/week
                  </p>
                  <Progress value={(stepData.weekly / (userProfile?.stepGoal || 10000 * 7)) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Workouts</CardTitle>
                  <span className="text-2xl">💪</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2/{userProfile?.workoutGoal}</div>
                  <p className="text-xs text-muted-foreground">
                    This week
                  </p>
                  <Progress value={(2 / (userProfile?.workoutGoal || 3)) * 100} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{Math.round(stepData.daily * 0.0005 * 100) / 100}</div>
                  <div className="text-xs text-gray-600">Miles walked</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{Math.round(stepData.daily * 0.04)}</div>
                  <div className="text-xs text-gray-600">Calories burned</div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{Math.round(stepData.daily * 0.8 / 60)}</div>
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
                      <p className="text-sm font-medium">Step goal progress: {Math.round(stepProgress)}%</p>
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workouts" className="mt-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Workout Library</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Library
                  </Button>
                  <Button>Create Custom Workout</Button>
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
                        <Button className="w-full mt-4">Start Workout</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="strava" className="mt-6">
            <StravaIntegration />
          </TabsContent>

          <TabsContent value="social" className="mt-6">
            <div className="space-y-6">
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
                      <Button>Create Post</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Recent Posts</h3>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{userProfile?.name?.[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium">{userProfile?.name}</p>
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
