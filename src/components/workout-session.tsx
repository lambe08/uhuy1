"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Play, Pause, Square, SkipForward, RotateCcw, Clock, Flame, Heart, Save } from "lucide-react";
import { workoutSessionService } from "@/lib/database";
import { isDemoMode } from "@/lib/supabase";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  duration: number;
  rest_time: number;
  target_muscles: string[];
  instructions: string;
}

interface WorkoutSessionProps {
  userId: string | null;
  workout: {
    id: string;
    name: string;
    exercises: Exercise[];
  };
  onComplete: () => void;
}

interface ExerciseProgress {
  exerciseId: string;
  currentSet: number;
  completed: boolean;
  startTime?: Date;
  endTime?: Date;
  actualReps?: number[];
  restStartTime?: Date;
}

interface SessionState {
  status: 'ready' | 'active' | 'resting' | 'completed' | 'paused';
  currentExerciseIndex: number;
  sessionStartTime: Date | null;
  sessionEndTime: Date | null;
  totalPausedTime: number;
  lastPauseStart: Date | null;
}

interface SessionStats {
  totalDuration: number;
  activeTime: number;
  restTime: number;
  caloriesEstimated: number;
  exercisesCompleted: number;
  setsCompleted: number;
}

export default function WorkoutSession({ userId, workout, onComplete }: WorkoutSessionProps) {
  // Session state
  const [sessionState, setSessionState] = useState<SessionState>({
    status: 'ready',
    currentExerciseIndex: 0,
    sessionStartTime: null,
    sessionEndTime: null,
    totalPausedTime: 0,
    lastPauseStart: null
  });

  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>(
    workout.exercises.map(exercise => ({
      exerciseId: exercise.id,
      currentSet: 0,
      completed: false,
      actualReps: []
    }))
  );

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalDuration: 0,
    activeTime: 0,
    restTime: 0,
    caloriesEstimated: 0,
    exercisesCompleted: 0,
    setsCompleted: 0
  });

  // Timers
  const [currentTimer, setCurrentTimer] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  // Refs for intervals
  const timerIntervalRef = useRef<NodeJS.Timeout>();
  const autoSaveIntervalRef = useRef<NodeJS.Timeout>();
  const sessionIdRef = useRef<string | null>(null);

  // Current exercise and progress
  const currentExercise = workout.exercises[sessionState.currentExerciseIndex];
  const currentProgress = exerciseProgress[sessionState.currentExerciseIndex];
  const totalExercises = workout.exercises.length;
  const overallProgress = ((sessionState.currentExerciseIndex + (currentProgress?.currentSet || 0) / (currentExercise?.sets || 1)) / totalExercises) * 100;

  // Enhanced calorie calculation based on exercise type and intensity
  const calculateCalories = useCallback(() => {
    const baseRate = 8; // calories per minute (average for moderate intensity)
    const durationMinutes = sessionStats.activeTime / 60;

    // Adjust based on exercise intensity (strength training typically burns more)
    const intensityMultiplier = 1.2;

    return Math.round(durationMinutes * baseRate * intensityMultiplier);
  }, [sessionStats.activeTime]);

  // Auto-save workout session to database
  const autoSaveSession = useCallback(async () => {
    if (!userId || !sessionState.sessionStartTime) return;

    setSaveStatus('saving');

    try {
      const sessionData = {
        user_id: userId,
        type: workout.name,
        duration_min: Math.floor(sessionStats.totalDuration / 60),
        calories_est: calculateCalories(),
        completed_at: sessionState.sessionStartTime.toISOString(),
        source: 'app' as const
      };

      let result;
      if (sessionIdRef.current) {
        // Update existing session
        result = await workoutSessionService.updateWorkoutSession(sessionIdRef.current, sessionData);
      } else {
        // Create new session
        result = await workoutSessionService.createWorkoutSession(sessionData);
        if (result) {
          sessionIdRef.current = result.id;
        }
      }

      if (result) {
        setLastSaved(new Date());
        setSaveStatus('saved');

        // Auto-hide save status after 3 seconds
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('error');
    }
  }, [userId, workout.name, sessionStats, calculateCalories, sessionState.sessionStartTime]);

  // Timer management
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) return;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();

      setSessionStats(prev => {
        const newStats = { ...prev };

        if (sessionState.status === 'active') {
          newStats.activeTime += 1;
          newStats.totalDuration += 1;
        } else if (sessionState.status === 'resting') {
          newStats.restTime += 1;
          newStats.totalDuration += 1;
        }

        newStats.caloriesEstimated = calculateCalories();
        return newStats;
      });

      // Update timers based on current state
      if (sessionState.status === 'active') {
        setExerciseTimer(prev => prev + 1);
      } else if (sessionState.status === 'resting') {
        setRestTimer(prev => prev + 1);
      }

      setCurrentTimer(prev => prev + 1);
    }, 1000);
  }, [sessionState.status, calculateCalories]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = undefined;
    }
  }, []);

  // Session controls
  const startWorkout = useCallback(() => {
    const now = new Date();

    setSessionState(prev => ({
      ...prev,
      status: 'active',
      sessionStartTime: now
    }));

    setExerciseTimer(0);
    startTimer();

    // Start auto-save every 30 seconds
    autoSaveIntervalRef.current = setInterval(autoSaveSession, 30000);
  }, [startTimer, autoSaveSession]);

  const pauseWorkout = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      status: 'paused',
      lastPauseStart: new Date()
    }));

    stopTimer();
  }, [stopTimer]);

  const resumeWorkout = useCallback(() => {
    setSessionState(prev => {
      const pauseDuration = prev.lastPauseStart
        ? Date.now() - prev.lastPauseStart.getTime()
        : 0;

      return {
        ...prev,
        status: 'active',
        totalPausedTime: prev.totalPausedTime + pauseDuration,
        lastPauseStart: null
      };
    });

    startTimer();
  }, [startTimer]);

  const completeSet = useCallback(() => {
    const newProgress = [...exerciseProgress];
    const current = newProgress[sessionState.currentExerciseIndex];

    current.currentSet += 1;
    current.actualReps = current.actualReps || [];
    current.actualReps.push(parseInt(currentExercise.reps) || 12);

    // Check if exercise is complete
    if (current.currentSet >= currentExercise.sets) {
      current.completed = true;
      current.endTime = new Date();

      setSessionStats(prev => ({
        ...prev,
        exercisesCompleted: prev.exercisesCompleted + 1
      }));

      // Move to next exercise or complete workout
      if (sessionState.currentExerciseIndex < totalExercises - 1) {
        setSessionState(prev => ({
          ...prev,
          currentExerciseIndex: prev.currentExerciseIndex + 1
        }));
        setExerciseTimer(0);
      } else {
        // Workout complete
        completeWorkout();
        return;
      }
    } else {
      // Start rest period
      setSessionState(prev => ({ ...prev, status: 'resting' }));
      setRestTimer(0);

      // Auto-advance after rest time
      setTimeout(() => {
        setSessionState(prev => ({ ...prev, status: 'active' }));
      }, currentExercise.rest_time * 1000);
    }

    setSessionStats(prev => ({
      ...prev,
      setsCompleted: prev.setsCompleted + 1
    }));

    setExerciseProgress(newProgress);
  }, [exerciseProgress, sessionState.currentExerciseIndex, currentExercise, totalExercises]);

  const skipExercise = useCallback(() => {
    if (sessionState.currentExerciseIndex < totalExercises - 1) {
      setSessionState(prev => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        status: 'active'
      }));
      setExerciseTimer(0);
      setRestTimer(0);
    } else {
      completeWorkout();
    }
  }, [sessionState.currentExerciseIndex, totalExercises]);

  const completeWorkout = useCallback(async () => {
    const endTime = new Date();

    setSessionState(prev => ({
      ...prev,
      status: 'completed',
      sessionEndTime: endTime
    }));

    stopTimer();

    // Final save
    await autoSaveSession();

    // Clean up intervals
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    // Show completion for a moment before calling onComplete
    setTimeout(() => {
      onComplete();
    }, 3000);
  }, [stopTimer, autoSaveSession, onComplete]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Auto-save when significant changes occur
  useEffect(() => {
    if (sessionState.sessionStartTime && sessionStats.setsCompleted > 0) {
      const saveTimeout = setTimeout(autoSaveSession, 2000);
      return () => clearTimeout(saveTimeout);
    }
  }, [sessionStats.setsCompleted, autoSaveSession, sessionState.sessionStartTime]);

  if (sessionState.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">🎉 Workout Complete!</CardTitle>
            <CardDescription>Great job on completing your workout</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold">Duration</div>
                <div>{formatTime(sessionStats.totalDuration)}</div>
              </div>
              <div>
                <div className="font-semibold">Calories</div>
                <div>{sessionStats.caloriesEstimated}</div>
              </div>
              <div>
                <div className="font-semibold">Exercises</div>
                <div>{sessionStats.exercisesCompleted}/{totalExercises}</div>
              </div>
              <div>
                <div className="font-semibold">Sets</div>
                <div>{sessionStats.setsCompleted}</div>
              </div>
            </div>

            {saveStatus === 'saved' && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Save className="h-3 w-3 mr-1" />
                Workout Saved
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{workout.name}</CardTitle>
                <CardDescription>
                  Exercise {sessionState.currentExerciseIndex + 1} of {totalExercises}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(currentTimer)}</div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={overallProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(overallProgress)}% Complete</span>
                <span>{sessionStats.caloriesEstimated} calories</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Current Exercise */}
        {currentExercise && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentExercise.name}
                <Badge variant={sessionState.status === 'active' ? 'default' : 'secondary'}>
                  {sessionState.status === 'resting' ? 'Rest' : sessionState.status}
                </Badge>
              </CardTitle>
              <CardDescription>{currentExercise.instructions}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Set Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Set {currentProgress.currentSet + 1} of {currentExercise.sets}</span>
                  <span>{currentExercise.reps} reps</span>
                </div>
                <Progress
                  value={(currentProgress.currentSet / currentExercise.sets) * 100}
                  className="h-2"
                />
              </div>

              {/* Timers */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Exercise Time</div>
                      <div className="font-mono text-lg">{formatTime(exerciseTimer)}</div>
                    </div>
                  </div>
                </Card>

                {sessionState.status === 'resting' && (
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div>
                        <div className="text-sm text-muted-foreground">Rest Time</div>
                        <div className="font-mono text-lg">{formatTime(restTimer)}</div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>

              {/* Target Muscles */}
              {currentExercise.target_muscles.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Target Muscles</div>
                  <div className="flex flex-wrap gap-1">
                    {currentExercise.target_muscles.map((muscle, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-center">
              {sessionState.status === 'ready' && (
                <Button onClick={startWorkout} size="lg" className="flex-1 max-w-xs">
                  <Play className="h-4 w-4 mr-2" />
                  Start Workout
                </Button>
              )}

              {sessionState.status === 'active' && (
                <>
                  <Button onClick={pauseWorkout} variant="outline" size="lg">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                  <Button onClick={completeSet} size="lg" className="flex-1 max-w-xs">
                    Complete Set
                  </Button>
                </>
              )}

              {sessionState.status === 'paused' && (
                <Button onClick={resumeWorkout} size="lg" className="flex-1 max-w-xs">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}

              {sessionState.status === 'resting' && (
                <Button onClick={() => setSessionState(prev => ({ ...prev, status: 'active' }))} size="lg">
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip Rest
                </Button>
              )}

              {(sessionState.status === 'active' || sessionState.status === 'paused' || sessionState.status === 'resting') && (
                <>
                  <Button onClick={skipExercise} variant="outline">
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip Exercise
                  </Button>
                  <Button onClick={completeWorkout} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    End Workout
                  </Button>
                </>
              )}
            </div>

            {/* Save Status */}
            <div className="flex justify-center mt-4">
              {saveStatus === 'saving' && (
                <Badge variant="secondary">
                  <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </Badge>
              )}
              {saveStatus === 'saved' && lastSaved && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <Save className="h-3 w-3 mr-1" />
                  Saved {formatTime(Math.floor((Date.now() - lastSaved.getTime()) / 1000))} ago
                </Badge>
              )}
              {saveStatus === 'error' && (
                <Badge variant="destructive">
                  Save failed - will retry
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Session Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{formatTime(sessionStats.activeTime)}</div>
                <div className="text-xs text-muted-foreground">Active Time</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">{sessionStats.caloriesEstimated}</div>
                <div className="text-xs text-muted-foreground">Calories</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{sessionStats.exercisesCompleted}</div>
                <div className="text-xs text-muted-foreground">Exercises Done</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">{sessionStats.setsCompleted}</div>
                <div className="text-xs text-muted-foreground">Sets Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
