'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Play, Pause, Square, SkipForward, Timer, Zap, Target } from 'lucide-react'
import { workoutSessionService } from '@/lib/database'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest_time: number // in seconds
  instructions?: string
  target_muscles?: string[]
}

interface WorkoutSessionProps {
  workout: {
    id: string
    name: string
    exercises: Exercise[]
    total_duration?: number
  }
  userId: string | null
  onComplete: (sessionData: {
    workout_id: string
    workout_name: string
    duration_minutes: number
    calories_estimated: number
  }) => void
}

type SessionState = 'not-started' | 'active' | 'resting' | 'paused' | 'completed'

export default function WorkoutSession({ workout, userId, onComplete }: WorkoutSessionProps) {
  const [sessionState, setSessionState] = useState<SessionState>('not-started')
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [sessionTime, setSessionTime] = useState(0) // total session time in seconds
  const [restTime, setRestTime] = useState(0) // current rest countdown
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const restIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)

  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const progress = ((currentExerciseIndex) / totalExercises) * 100

  // Auto-save session every 30 seconds when active
  useEffect(() => {
    if (sessionState === 'active' && userId && sessionId) {
      const autoSave = () => {
        workoutSessionService.updateWorkoutSession(sessionId, {
          duration_minutes: Math.floor(sessionTime / 60),
          calories_estimated: calculateCalories()
        })
      }

      autoSaveRef.current = setInterval(autoSave, 30000) // Every 30 seconds

      return () => {
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current)
        }
      }
    }
  }, [sessionState, userId, sessionId, sessionTime])

  // Session timer
  useEffect(() => {
    if (sessionState === 'active') {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sessionState])

  // Rest timer
  useEffect(() => {
    if (sessionState === 'resting' && restTime > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            setSessionState('active')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }
  }, [sessionState, restTime])

  const calculateCalories = () => {
    // Simple calorie estimation: ~5 calories per minute for strength training
    const minutes = sessionTime / 60
    return Math.round(minutes * 5)
  }

  const startSession = async () => {
    if (!userId) return

    try {
      // Create initial session record
      const newSession = await workoutSessionService.createWorkoutSession({
        user_id: userId,
        workout_id: workout.id,
        workout_name: workout.name,
        duration_minutes: 0,
        calories_estimated: 0,
        completed_at: new Date().toISOString(),
        source: 'app'
      })

      if (newSession) {
        setSessionId(newSession.id)
        setSessionState('active')
      }
    } catch (error) {
      console.error('Failed to start session:', error)
      // Continue in demo mode
      setSessionState('active')
    }
  }

  const pauseSession = () => {
    setSessionState('paused')
  }

  const resumeSession = () => {
    setSessionState('active')
  }

  const completeSet = () => {
    const exerciseId = currentExercise.id
    const newCompletedSets = { ...completedSets }
    newCompletedSets[exerciseId] = (newCompletedSets[exerciseId] || 0) + 1

    setCompletedSets(newCompletedSets)

    if (currentSet < currentExercise.sets) {
      // More sets to do - start rest
      setCurrentSet(prev => prev + 1)
      setRestTime(currentExercise.rest_time)
      setSessionState('resting')
    } else {
      // Move to next exercise
      if (currentExerciseIndex < totalExercises - 1) {
        setCurrentExerciseIndex(prev => prev + 1)
        setCurrentSet(1)
        setSessionState('active')
      } else {
        // Workout complete
        completeWorkout()
      }
    }
  }

  const skipRest = () => {
    setRestTime(0)
    setSessionState('active')
  }

  const skipExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSet(1)
      setSessionState('active')
    } else {
      completeWorkout()
    }
  }

  const completeWorkout = async () => {
    setSessionState('completed')

    const sessionData = {
      workout_id: workout.id,
      workout_name: workout.name,
      duration_minutes: Math.floor(sessionTime / 60),
      calories_estimated: calculateCalories()
    }

    // Final save if we have a session ID
    if (sessionId) {
      try {
        await workoutSessionService.updateWorkoutSession(sessionId, {
          duration_minutes: sessionData.duration_minutes,
          calories_estimated: sessionData.calories_estimated
        })
      } catch (error) {
        console.error('Failed to save final session:', error)
      }
    }

    onComplete(sessionData)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (sessionState === 'not-started') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Ready to Start: {workout.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Exercises</div>
              <div className="text-muted-foreground">{totalExercises} exercises</div>
            </div>
            <div>
              <div className="font-medium">Est. Duration</div>
              <div className="text-muted-foreground">
                {workout.total_duration ? `${workout.total_duration} min` : '30-45 min'}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="font-medium">Exercises Preview:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {workout.exercises.slice(0, 3).map((exercise, index) => (
                <div key={exercise.id} className="flex justify-between text-sm">
                  <span>{exercise.name}</span>
                  <span className="text-muted-foreground">
                    {exercise.sets} × {exercise.reps}
                  </span>
                </div>
              ))}
              {workout.exercises.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  +{workout.exercises.length - 3} more exercises
                </div>
              )}
            </div>
          </div>

          <Button onClick={startSession} className="w-full" size="lg">
            <Play className="h-4 w-4 mr-2" />
            Start Workout
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (sessionState === 'completed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Zap className="h-5 w-5" />
            Workout Completed!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatTime(sessionTime)}</div>
              <div className="text-sm text-muted-foreground">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateCalories()}</div>
              <div className="text-sm text-muted-foreground">Calories Burned</div>
            </div>
          </div>

          <div className="text-center">
            <Badge variant="default" className="text-base px-4 py-2">
              Great Job! 🎉
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            {workout.name}
          </CardTitle>
          <Badge variant="outline">
            {currentExerciseIndex + 1} / {totalExercises}
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Session Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">{formatTime(sessionTime)}</div>
            <div className="text-xs text-muted-foreground">Total Time</div>
          </div>
          <div>
            <div className="text-lg font-bold">{calculateCalories()}</div>
            <div className="text-xs text-muted-foreground">Calories</div>
          </div>
          <div>
            <div className="text-lg font-bold">
              {Object.values(completedSets).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Sets Done</div>
          </div>
        </div>

        <Separator />

        {/* Current Exercise */}
        {sessionState === 'resting' ? (
          <div className="text-center space-y-4">
            <div>
              <div className="text-lg font-semibold">Rest Time</div>
              <div className="text-3xl font-bold text-blue-600">{formatTime(restTime)}</div>
            </div>

            <div className="text-sm text-muted-foreground">
              Next: Set {currentSet} of {currentExercise.name}
            </div>

            <Button onClick={skipRest} variant="outline">
              <SkipForward className="h-4 w-4 mr-2" />
              Skip Rest
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{currentExercise.name}</h3>
                <Badge variant="secondary">
                  Set {currentSet} / {currentExercise.sets}
                </Badge>
              </div>

              <div className="text-muted-foreground">
                Target: {currentExercise.reps} reps
              </div>

              {currentExercise.target_muscles && (
                <div className="flex gap-1 mt-2">
                  {currentExercise.target_muscles.map(muscle => (
                    <Badge key={muscle} variant="outline" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {currentExercise.instructions && (
              <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                {currentExercise.instructions}
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {sessionState === 'active' ? (
            <>
              <Button onClick={pauseSession} variant="outline" className="flex-1">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button onClick={completeSet} className="flex-1">
                Complete Set
              </Button>
            </>
          ) : sessionState === 'paused' ? (
            <>
              <Button onClick={resumeSession} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button onClick={skipExercise} variant="outline">
                Skip Exercise
              </Button>
            </>
          ) : null}
        </div>

        {sessionState !== 'resting' && (
          <div className="flex justify-center">
            <Button
              onClick={completeWorkout}
              variant="destructive"
              size="sm"
            >
              <Square className="h-4 w-4 mr-2" />
              End Workout
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
