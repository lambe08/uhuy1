"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWorkoutSession } from "@/hooks/useWorkoutSession"
import { Play, Pause, Square, SkipForward, CheckCircle, Timer, Target, Flame } from "lucide-react"

interface WorkoutSessionProps {
  userId: string | null
  workout?: {
    id: string
    name: string
    exercises: Array<{
      id: string
      name: string
      sets: number
      reps: number
      duration: number
      rest: number
    }>
  }
  onClose: () => void
}

export function WorkoutSession({ userId, workout, onClose }: WorkoutSessionProps) {
  const {
    session,
    timer,
    progress,
    currentExercise,
    history,
    loading,
    startWorkout,
    togglePause,
    completeSet,
    skipRest,
    endWorkout
  } = useWorkoutSession(userId)

  const [showHistory, setShowHistory] = useState(false)

  // Start workout if not already active
  const handleStartWorkout = () => {
    if (workout && !session.isActive) {
      const exercises = workout.exercises.map(ex => ({
        ...ex,
        completed: false
      }))
      startWorkout(workout.id, workout.name, exercises)
    }
  }

  // Handle workout completion
  const handleEndWorkout = async () => {
    const result = await endWorkout()
    if (result?.success && result.duration && result.calories) {
      alert(`Workout completed! Duration: ${Math.round(result.duration)} minutes, Calories: ${result.calories}`)
      onClose()
    } else {
      alert('Failed to save workout session')
    }
  }

  // Pre-workout state
  if (!session.isActive && workout) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {workout.name}
          </CardTitle>
          <CardDescription>
            {workout.exercises.length} exercises • {workout.exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Workout Overview */}
          <div className="space-y-3">
            <h3 className="font-semibold">Exercises</h3>
            {workout.exercises.map((exercise, index) => (
              <div key={exercise.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps} reps
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>Rest: {exercise.rest}s</p>
                  <p>Duration: {exercise.duration}s</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleStartWorkout} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              History
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* History */}
          {showHistory && (
            <div className="space-y-3">
              <h3 className="font-semibold">Recent Sessions</h3>
              {loading ? (
                <p className="text-gray-600">Loading history...</p>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.slice(0, 5).map((historySession) => (
                    <div key={historySession.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{historySession.workout_name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(historySession.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{historySession.duration_minutes} min</p>
                        <p>{historySession.calories_estimated} cal</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No previous sessions</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Active workout state
  if (session.isActive) {
    const currentIndex = session.currentExerciseIndex
    const totalExercises = session.exercises.length
    const isWorkoutComplete = progress.exerciseProgress >= 100

    if (isWorkoutComplete) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Workout Completed!
            </CardTitle>
            <CardDescription>{session.workoutName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <Timer className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{timer.formattedTotalTime}</p>
                <p className="text-sm text-gray-600">Total Time</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{session.exercises.length}</p>
                <p className="text-sm text-gray-600">Exercises</p>
              </div>
              <div className="p-4 border rounded-lg">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">~{Math.round(timer.totalTime * 0.133)}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleEndWorkout} className="flex-1">
                Save & Finish
              </Button>
              <Button variant="outline" onClick={onClose}>
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{session.workoutName}</span>
            <Badge variant={session.isPaused ? "secondary" : "default"}>
              {session.isPaused ? "Paused" : session.isResting ? "Resting" : "Active"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Exercise {currentIndex + 1} of {totalExercises} • Set {session.currentSet} of {currentExercise?.sets || 0}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Workout Progress</span>
              <span>{Math.round(progress.exerciseProgress)}%</span>
            </div>
            <Progress value={progress.exerciseProgress} />
          </div>

          {/* Current Exercise */}
          {currentExercise && (
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-bold text-lg mb-2">{currentExercise.name}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Current Set</p>
                  <p className="text-xl font-bold">{session.currentSet} / {currentExercise.sets}</p>
                </div>
                <div>
                  <p className="text-gray-600">Reps</p>
                  <p className="text-xl font-bold">{currentExercise.reps}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <Timer className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{timer.formattedTotalTime}</p>
              <p className="text-xs text-gray-600">Total</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{timer.formattedExerciseTime}</p>
              <p className="text-xs text-gray-600">Exercise</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="h-5 w-5 mx-auto mb-1 bg-orange-500 rounded-full"></div>
              <p className="text-lg font-bold">{timer.formattedRestTime}</p>
              <p className="text-xs text-gray-600">Rest</p>
            </div>
          </div>

          {/* Rest Mode */}
          {session.isResting && currentExercise && (
            <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50 text-center">
              <h3 className="font-bold text-lg mb-2">Rest Time</h3>
              <p className="text-3xl font-bold text-orange-600 mb-2">
                {Math.max(0, currentExercise.rest - timer.restTime)}s
              </p>
              <p className="text-sm text-gray-600">Get ready for the next set</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button onClick={togglePause} variant="outline" size="sm">
              {session.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>

            {session.isResting && (
              <Button onClick={skipRest} variant="outline" size="sm">
                <SkipForward className="h-4 w-4" />
                Skip Rest
              </Button>
            )}

            {!session.isResting && (
              <Button onClick={completeSet} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Set
              </Button>
            )}

            <Button onClick={handleEndWorkout} variant="destructive" size="sm">
              <Square className="h-4 w-4" />
              End
            </Button>
          </div>

          {/* Exercise List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Exercises</h3>
            {session.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  index === currentIndex
                    ? "bg-blue-100 border-blue-300 border"
                    : exercise.completed
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-50"
                }`}
              >
                <span className={exercise.completed ? "line-through" : ""}>{exercise.name}</span>
                <div className="flex items-center gap-2">
                  {exercise.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                  <span>{exercise.sets} sets</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
