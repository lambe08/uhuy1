import { useState, useEffect, useCallback } from 'react'
import { stepRecordService } from '@/lib/database'
import { isDemoMode } from '@/lib/supabase'
import type { StepRecord } from '@/lib/supabase'

interface StepData {
  daily: number
  weekly: number
  goal: number
  lastUpdate: Date
  history: StepRecord[]
}

interface StepDetector {
  lastAcceleration: number
  stepThreshold: number
  stepCount: number
  lastStepTime: number
}

export function useStepTracking(userId: string | null, stepGoal: number = 10000) {
  const [stepData, setStepData] = useState<StepData>({
    daily: 0,
    weekly: 0,
    goal: stepGoal,
    lastUpdate: new Date(),
    history: []
  })

  const [isTracking, setIsTracking] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [loading, setLoading] = useState(false)

  const [stepDetector] = useState<StepDetector>({
    lastAcceleration: 0,
    stepThreshold: 12,
    stepCount: 0,
    lastStepTime: 0
  })

  // Load step data from database
  const loadStepData = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get today's step record
      const todayRecord = await stepRecordService.getStepRecord(userId, today)

      // Get weekly steps
      const weeklySteps = await stepRecordService.getWeeklySteps(userId)

      // Get step history
      const history = await stepRecordService.getStepHistory(userId, 30)

      setStepData(prev => ({
        ...prev,
        daily: todayRecord?.steps || 0,
        weekly: weeklySteps,
        goal: stepGoal,
        history
      }))
    } catch (error) {
      console.error('Error loading step data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, stepGoal])

  // Save step data to database
  const saveStepData = useCallback(async (steps: number) => {
    if (!userId) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const calories = Math.round(steps * 0.04) // Rough estimate
      const distance = Math.round(steps * 0.8) // Rough estimate in meters

      await stepRecordService.upsertStepRecord({
        user_id: userId,
        date: today,
        steps,
        calories_est: calories,
        distance_est: distance,
        source: 'device_motion'
      })
    } catch (error) {
      console.error('Error saving step data:', error)
    }
  }, [userId])

  // Demo mode step simulation
  useEffect(() => {
    if (!isDemoMode || !userId || !isTracking) return

    const simulationInterval = setInterval(() => {
      const incrementSteps = Math.floor(Math.random() * 5) + 1 // 1-5 steps

      setStepData(prev => {
        const newDaily = prev.daily + incrementSteps
        const newWeekly = prev.weekly + incrementSteps

        // Save to demo database every 20 steps
        if (newDaily % 20 === 0) {
          saveStepData(newDaily)
        }

        return {
          ...prev,
          daily: newDaily,
          weekly: newWeekly,
          lastUpdate: new Date()
        }
      })
    }, 3000) // Update every 3 seconds in demo mode

    return () => clearInterval(simulationInterval)
  }, [isDemoMode, userId, isTracking, saveStepData])

  // Device motion step detection (only for non-demo mode)
  useEffect(() => {
    if (isDemoMode || !isTracking || !userId || typeof window === 'undefined') return

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return

      const { x, y, z } = event.accelerationIncludingGravity
      if (x === null || y === null || z === null) return

      const acceleration = Math.sqrt(x * x + y * y + z * z)

      // Simple step detection algorithm
      if (
        acceleration > stepDetector.stepThreshold &&
        acceleration > stepDetector.lastAcceleration + 2 &&
        Date.now() - stepDetector.lastStepTime > 300 // Minimum 300ms between steps
      ) {
        stepDetector.stepCount++
        stepDetector.lastStepTime = Date.now()

        setStepData(prev => {
          const newDaily = prev.daily + 1
          const newWeekly = prev.weekly + 1

          // Save to database every 10 steps to reduce API calls
          if (newDaily % 10 === 0) {
            saveStepData(newDaily)
          }

          return {
            ...prev,
            daily: newDaily,
            weekly: newWeekly,
            lastUpdate: new Date()
          }
        })
      }

      stepDetector.lastAcceleration = acceleration
    }

    window.addEventListener('devicemotion', handleDeviceMotion)

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion)
      // Save final count when tracking stops
      if (stepData.daily > 0) {
        saveStepData(stepData.daily)
      }
    }
  }, [isTracking, userId, stepDetector, stepData.daily, saveStepData])

  // Load data on mount and when userId changes
  useEffect(() => {
    loadStepData()
  }, [loadStepData])

  // Request device motion permission
  const requestPermission = async () => {
    if (isDemoMode) {
      // Demo mode: always grant permission
      setPermissionGranted(true)
      setIsTracking(true)
      return { success: true, error: null }
    }

    if ('requestPermission' in DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const response = await DeviceMotionEvent.requestPermission()
        if (response === 'granted') {
          setPermissionGranted(true)
          setIsTracking(true)
          return { success: true, error: null }
        } else {
          return { success: false, error: 'Permission denied' }
        }
      } catch (error) {
        console.error('Error requesting motion permission:', error)
        return { success: false, error: 'Failed to request permission' }
      }
    } else {
      // For Android and other devices that don't require explicit permission
      setPermissionGranted(true)
      setIsTracking(true)
      return { success: true, error: null }
    }
  }

  // Start/stop tracking
  const startTracking = () => {
    if (permissionGranted || isDemoMode) {
      setIsTracking(true)
    } else {
      requestPermission()
    }
  }

  const stopTracking = () => {
    setIsTracking(false)
    // Save final count
    if (stepData.daily > 0) {
      saveStepData(stepData.daily)
    }
  }

  // Manual step adjustment
  const adjustSteps = async (newSteps: number) => {
    if (!userId) return

    setStepData(prev => ({
      ...prev,
      daily: Math.max(0, newSteps),
      lastUpdate: new Date()
    }))

    await saveStepData(Math.max(0, newSteps))
  }

  // Update goal
  const updateGoal = (newGoal: number) => {
    setStepData(prev => ({
      ...prev,
      goal: newGoal
    }))
  }

  // Calculate statistics
  const statistics = {
    progress: (stepData.daily / stepData.goal) * 100,
    calories: Math.round(stepData.daily * 0.04),
    distance: Math.round(stepData.daily * 0.0008 * 100) / 100, // km
    activeMinutes: Math.round(stepData.daily * 0.8 / 60),
    weeklyProgress: (stepData.weekly / (stepData.goal * 7)) * 100
  }

  return {
    stepData,
    statistics,
    isTracking,
    permissionGranted,
    loading,
    requestPermission,
    startTracking,
    stopTracking,
    adjustSteps,
    updateGoal,
    refreshData: loadStepData,
    isDemoMode
  }
}
