"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWorkoutSession } from "@/hooks/useWorkoutSession"
import {
  Play,
  Pause,
  Square,
  SkipForward,
  CheckCircle,
  Timer,
  Target,
  Flame,
  TrendingUp,
  Clock,
  Zap,
  Heart,
  RotateCcw
} from "lucide-react"

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
  const [restProgress, setRestProgress] = useState(0)
  const [motivationMsg, setMotivationMsg] = useState("")

  // Calculate enhanced metrics
  const totalSets = workout?.exercises.reduce((total, ex) => total + ex.sets, 0) || 0
  const completedSets = session.exercises.reduce((total, ex) => {
    const setsCompleted = Math.min(ex.sets, session.currentExerciseIndex > session.exercises.indexOf(ex) ? ex.sets : (session.currentExerciseIndex === session.exercises.indexOf(ex) ? session.currentSet - 1 : 0))
    return total + Math.max(0, setsCompleted)
  }, 0)
  const setProgress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  // Enhanced rest timer with progress
  useEffect(() => {
    if (session.isResting && currentExercise) {
      const restTotal = currentExercise.rest
      const restRemaining = Math.max(0, restTotal - timer.restTime)
      const progress = ((restTotal - restRemaining) / restTotal) * 100
      setRestProgress(progress)

      // Motivational messages based on progress
      if (restRemaining <= 5 && restRemaining > 0) {
        setMotivationMsg("Get ready! Almost time!")
      } else if (restRemaining <= 10) {
        setMotivationMsg("Prepare for next set")
      } else {
        setMotivationMsg("Take a breather")
      }
    }
  }, [session.isResting, timer.restTime, currentExercise])

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

  // Handle workout completion with enhanced stats
  const handleEndWorkout = async () => {
    const result = await endWorkout()
    if (result?.success && result.duration && result.calories) {
      alert(`🎉 Workout completed!\n⏱️ Duration: ${Math.round(result.duration)} minutes\n🔥 Calories: ${result.calories}\n💪 Sets completed: ${completedSets}/${totalSets}`)
      onClose()
    } else {
      alert('Failed to save workout session')
    }
  }

  // Pre-workout state with enhanced preview
  if (!session.isActive && workout) {
    const estimatedDuration = workout.exercises.reduce((total, ex) =>
      total + (ex.duration * ex.sets) + (ex.rest * (ex.sets - 1)), 0
    )
    const estimatedCalories = Math.round(estimatedDuration * 0.133)

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            {workout.name}
          </CardTitle>
          <CardDescription>
            {workout.exercises.length} exercises • {totalSets} total sets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Workout Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{Math.round(estimatedDuration / 60)}m</p>
              <p className="text-xs text-gray-600">Est. Duration</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-orange-50">
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold">{estimatedCalories}</p>
              <p className="text-xs text-gray-600">Est. Calories</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{totalSets}</p>
              <p className="text-xs text-gray-600">Total Sets</p>
            </div>
          </div>

          {/* Exercise List with Enhanced Info */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Exercises Breakdown
            </h3>
            {workout.exercises.map((exercise, index) => (
              <div key={exercise.id} className="flex justify-between items-center p-3 border rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps} reps
                  </p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    {exercise.rest}s rest
                  </p>
                  <p className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {exercise.duration}s work
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleStartWorkout} className="flex-1 h-12">
              <Play className="h-5 w-5 mr-2" />
              Start Workout
            </Button>
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Enhanced History */}
          {showHistory && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Recent Sessions
              </h3>
              {loading ? (
                <p className="text-gray-600">Loading history...</p>
              ) : history.length > 0 ? (
                <div className="space-y-2">
                  {history.slice(0, 5).map((historySession, index) => (
                    <div key={historySession.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Latest" : `${index + 1}`}
                        </Badge>
                        <div>
                          <p className="font-medium">{historySession.workout_name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(historySession.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {historySession.duration_minutes}m
                        </p>
                        <p className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {historySession.calories_estimated} cal
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No previous sessions</p>
                  <p className="text-sm">Complete your first workout!</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Active workout state with enhanced UI
  if (session.isActive) {
    const currentIndex = session.currentExerciseIndex
    const totalExercises = session.exercises.length
    const isWorkoutComplete = progress.exerciseProgress >= 100

    if (isWorkoutComplete) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Workout Completed! 🎉
            </CardTitle>
            <CardDescription>{session.workoutName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <Timer className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{timer.formattedTotalTime}</p>
                <p className="text-sm text-gray-600">Total Time</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{completedSets}/{totalSets}</p>
                <p className="text-sm text-gray-600">Sets Done</p>
              </div>
              <div className="p-4 border rounded-lg bg-orange-50">
                <Flame className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-2xl font-bold">~{Math.round(timer.totalTime * 0.133)}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <Heart className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{session.exercises.length}</p>
                <p className="text-sm text-gray-600">Exercises</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-lg font-semibold text-green-800 mb-2">🏆 Amazing Work!</p>
              <p className="text-sm text-green-700">
                You completed {Math.round(setProgress)}% of your planned sets. Keep up the great work!
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleEndWorkout} className="flex-1 h-12">
                <CheckCircle className="h-5 w-5 mr-2" />
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
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {session.workoutName}
            </span>
            <Badge variant={session.isPaused ? "secondary" : session.isResting ? "outline" : "default"}>
              {session.isPaused ? "⏸️ Paused" : session.isResting ? "😮‍💨 Resting" : "💪 Active"}
            </Badge>
          </CardTitle>
          <CardDescription className="flex items-center gap-4">
            <span>Exercise {currentIndex + 1} of {totalExercises}</span>
            <span>•</span>
            <span>Set {session.currentSet} of {currentExercise?.sets || 0}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enhanced Progress Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Workout Progress
                </span>
                <span className="font-semibold">{Math.round(progress.exerciseProgress)}%</span>
              </div>
              <Progress value={progress.exerciseProgress} className="h-3" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Sets Progress
                </span>
                <span className="font-semibold">{completedSets}/{totalSets}</span>
              </div>
              <Progress value={setProgress} className="h-2" />
            </div>
          </div>

          {/* Current Exercise with Enhanced Visual */}
          {currentExercise && (
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  {currentExercise.name}
                </h3>
                <Badge variant="outline">Current</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Set</p>
                  <p className="text-2xl font-bold text-blue-600">{session.currentSet}</p>
                  <p className="text-xs text-gray-500">of {currentExercise.sets}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Reps</p>
                  <p className="text-2xl font-bold text-green-600">{currentExercise.reps}</p>
                  <p className="text-xs text-gray-500">target</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Rest</p>
                  <p className="text-2xl font-bold text-orange-600">{currentExercise.rest}s</p>
                  <p className="text-xs text-gray-500">after set</p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Timer Section */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 border rounded-lg bg-blue-50">
              <Timer className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{timer.formattedTotalTime}</p>
              <p className="text-xs text-gray-600">Total Time</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-green-50">
              <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{timer.formattedExerciseTime}</p>
              <p className="text-xs text-gray-600">Exercise Time</p>
            </div>
            <div className="text-center p-3 border rounded-lg bg-orange-50">
              <RotateCcw className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-lg font-bold">{timer.formattedRestTime}</p>
              <p className="text-xs text-gray-600">Rest Time</p>
            </div>
          </div>

          {/* Enhanced Rest Mode */}
          {session.isResting && currentExercise && (
            <div className="p-4 border-2 border-orange-200 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 text-center">
              <h3 className="font-bold text-lg mb-2 flex items-center justify-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-500" />
                Rest Time
              </h3>
              <p className="text-4xl font-bold text-orange-600 mb-2">
                {Math.max(0, currentExercise.rest - timer.restTime)}s
              </p>
              <div className="mb-3">
                <Progress value={restProgress} className="h-2" />
              </div>
              <p className="text-sm text-gray-600 mb-2">{motivationMsg}</p>
              {Math.max(0, currentExercise.rest - timer.restTime) <= 5 && (
                <p className="text-xs text-orange-700 font-semibold animate-pulse">
                  🔥 Get ready to crush it!
                </p>
              )}
            </div>
          )}

          {/* Enhanced Control Buttons */}
          <div className="flex gap-2">
            <Button onClick={togglePause} variant="outline" size="sm" className="px-4">
              {session.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>

            {session.isResting && (
              <Button onClick={skipRest} variant="outline" size="sm">
                <SkipForward className="h-4 w-4 mr-2" />
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
              <Square className="h-4 w-4 mr-2" />
              End
            </Button>
          </div>

          {/* Enhanced Exercise List */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Exercise Progress
            </h3>
            {session.exercises.map((exercise, index) => {
              const isActive = index === currentIndex
              const isPast = index < currentIndex
              const isFuture = index > currentIndex

              return (
                <div
                  key={exercise.id}
                  className={`flex justify-between items-center p-3 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-blue-100 border-blue-300 border-2 shadow-sm"
                      : isPast
                      ? "bg-green-100 border-green-200 border"
                      : "bg-gray-50 border-gray-200 border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? "bg-blue-500 text-white" :
                      isPast ? "bg-green-500 text-white" :
                      "bg-gray-300 text-gray-600"
                    }`}>
                      {isPast ? "✓" : index + 1}
                    </div>
                    <span className={exercise.completed ? "line-through text-gray-500" : ""}>
                      {exercise.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {exercise.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {exercise.sets} sets
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
