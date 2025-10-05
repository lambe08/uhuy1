import { useState, useEffect, useCallback } from 'react'
import { workoutSessionService } from '@/lib/database'
import type { WorkoutSession } from '@/lib/supabase'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  duration: number // in seconds
  rest: number // rest time in seconds
  completed: boolean
}

interface WorkoutSessionData {
  id?: string
  workoutId: string
  workoutName: string
  exercises: Exercise[]
  currentExerciseIndex: number
  currentSet: number
  isActive: boolean
  isPaused: boolean
  isResting: boolean
  startTime: Date | null
  endTime: Date | null
  totalDuration: number // in seconds
  caloriesEstimated: number
}

interface TimerData {
  exerciseTime: number
  restTime: number
  totalTime: number
}

export function useWorkoutSession(userId: string | null) {
  const [session, setSession] = useState<WorkoutSessionData>({
    workoutId: '',
    workoutName: '',
    exercises: [],
    currentExerciseIndex: 0,
    currentSet: 1,
    isActive: false,
    isPaused: false,
    isResting: false,
    startTime: null,
    endTime: null,
    totalDuration: 0,
    caloriesEstimated: 0
  })

  const [timer, setTimer] = useState<TimerData>({
    exerciseTime: 0,
    restTime: 0,
    totalTime: 0
  })

  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<WorkoutSession[]>([])

  // Load workout history
  const loadWorkoutHistory = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const workoutHistory = await workoutSessionService.getWorkouts(userId, 30)
      setHistory(workoutHistory)
    } catch (error) {
      console.error('Error loading workout history:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Start a new workout session
  const startWorkout = useCallback((workoutId: string, workoutName: string, exercises: Exercise[]) => {
    setSession({
      workoutId,
      workoutName,
      exercises: exercises.map(ex => ({ ...ex, completed: false })),
      currentExerciseIndex: 0,
      currentSet: 1,
      isActive: true,
      isPaused: false,
      isResting: false,
      startTime: new Date(),
      endTime: null,
      totalDuration: 0,
      caloriesEstimated: 0
    })

    setTimer({
      exerciseTime: 0,
      restTime: 0,
      totalTime: 0
    })
  }, [])

  // Pause/resume workout
  const togglePause = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }))
  }, [])

  // Complete current set and move to rest or next exercise
  const completeSet = useCallback(() => {
    setSession(prev => {
      const currentExercise = prev.exercises[prev.currentExerciseIndex]
      if (!currentExercise) return prev

      const isLastSet = prev.currentSet >= currentExercise.sets
      const isLastExercise = prev.currentExerciseIndex >= prev.exercises.length - 1

      if (isLastSet) {
        // Mark exercise as completed
        const updatedExercises = [...prev.exercises]
        updatedExercises[prev.currentExerciseIndex].completed = true

        if (isLastExercise) {
          // Workout completed
          return {
            ...prev,
            exercises: updatedExercises,
            isActive: false,
            endTime: new Date()
          }
        } else {
          // Move to next exercise
          return {
            ...prev,
            exercises: updatedExercises,
            currentExerciseIndex: prev.currentExerciseIndex + 1,
            currentSet: 1,
            isResting: true
          }
        }
      } else {
        // Move to next set
        return {
          ...prev,
          currentSet: prev.currentSet + 1,
          isResting: true
        }
      }
    })

    // Reset exercise timer and start rest timer
    setTimer(prev => ({
      ...prev,
      exerciseTime: 0,
      restTime: 0
    }))
  }, [])

  // Skip rest period
  const skipRest = useCallback(() => {
    setSession(prev => ({
      ...prev,
      isResting: false
    }))

    setTimer(prev => ({
      ...prev,
      restTime: 0
    }))
  }, [])

  // End workout session
  const endWorkout = useCallback(async () => {
    if (!userId || !session.startTime) return

    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000 / 60) // in minutes
    const caloriesEstimated = Math.round(duration * 8) // Rough estimate: 8 cal/min

    try {
      // Save workout session to database
      await workoutSessionService.createWorkout({
        user_id: userId,
        workout_id: session.workoutId,
        workout_name: session.workoutName,
        duration_minutes: duration,
        calories_estimated: caloriesEstimated,
        completed_at: endTime.toISOString(),
        source: 'app'
      })

      // Update local state
      setSession(prev => ({
        ...prev,
        isActive: false,
        endTime,
        totalDuration: duration * 60,
        caloriesEstimated
      }))

      // Refresh history
      await loadWorkoutHistory()

      return { success: true, duration, calories: caloriesEstimated }
    } catch (error) {
      console.error('Error saving workout session:', error)
      return { success: false, error: 'Failed to save workout' }
    }
  }, [userId, session, loadWorkoutHistory])

  // Timer effect for tracking time
  useEffect(() => {
    if (!session.isActive || session.isPaused) return

    const interval = setInterval(() => {
      setTimer(prev => ({
        exerciseTime: session.isResting ? prev.exerciseTime : prev.exerciseTime + 1,
        restTime: session.isResting ? prev.restTime + 1 : prev.restTime,
        totalTime: prev.totalTime + 1
      }))

      // Auto-end rest period after specified time
      if (session.isResting) {
        const currentExercise = session.exercises[session.currentExerciseIndex]
        if (currentExercise && timer.restTime >= currentExercise.rest) {
          skipRest()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [session.isActive, session.isPaused, session.isResting, session.currentExerciseIndex, session.exercises, timer.restTime, skipRest])

  // Load history on mount
  useEffect(() => {
    loadWorkoutHistory()
  }, [loadWorkoutHistory])

  // Calculate current exercise progress
  const currentExercise = session.exercises[session.currentExerciseIndex]
  const progress = {
    exerciseProgress: session.exercises.filter(ex => ex.completed).length / session.exercises.length * 100,
    setProgress: currentExercise ? (session.currentSet - 1) / currentExercise.sets * 100 : 0,
    totalSets: session.exercises.reduce((total, ex) => total + ex.sets, 0),
    completedSets: session.exercises.slice(0, session.currentExerciseIndex).reduce((total, ex) => total + ex.sets, 0) + (session.currentSet - 1)
  }

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    session,
    timer: {
      ...timer,
      formattedExerciseTime: formatTime(timer.exerciseTime),
      formattedRestTime: formatTime(timer.restTime),
      formattedTotalTime: formatTime(timer.totalTime)
    },
    progress,
    currentExercise,
    history,
    loading,
    startWorkout,
    togglePause,
    completeSet,
    skipRest,
    endWorkout,
    refreshHistory: loadWorkoutHistory
  }
}
