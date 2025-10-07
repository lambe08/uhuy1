import { useState, useEffect, useCallback, useRef } from 'react'
import { stepsDailyService } from '@/lib/database'
import { isDemoMode } from '@/lib/supabase'

interface StepData {
  daily: number
  weekly: number
  monthly: number
  goal: number
  streak: number
  lastUpdate: Date
}

interface StepStatistics {
  progress: number
  weeklyProgress: number
  distance: number // in km
  calories: number
  averageDaily: number
  bestDay: number
  activeMinutes: number
}

interface StepHistory {
  date: string
  steps: number
  calories_est: number
  distance_est: number
  goal_achieved: boolean
}

export function useStepTracking(userId: string | null, stepGoal: number = 10000) {
  const [stepData, setStepData] = useState<StepData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    goal: stepGoal,
    streak: 0,
    lastUpdate: new Date()
  })

  const [statistics, setStatistics] = useState<StepStatistics>({
    progress: 0,
    weeklyProgress: 0,
    distance: 0,
    calories: 0,
    averageDaily: 0,
    bestDay: 0,
    activeMinutes: 0
  })

  const [stepHistory, setStepHistory] = useState<StepHistory[]>([])
  const [isTracking, setIsTracking] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  // For device motion tracking
  const stepCountRef = useRef(0)
  const lastSaveRef = useRef<Date>(new Date())
  const syncIntervalRef = useRef<NodeJS.Timeout>()
  const motionListenerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null)

  // Enhanced step calculation with better accuracy
  const calculateSteps = useCallback((acceleration: DeviceMotionEvent['accelerationIncludingGravity']) => {
    if (!acceleration || !acceleration.x || !acceleration.y || !acceleration.z) return 0

    // Enhanced step detection algorithm
    const magnitude = Math.sqrt(
      acceleration.x * acceleration.x +
      acceleration.y * acceleration.y +
      acceleration.z * acceleration.z
    )

    // Adaptive threshold based on device orientation and user activity
    const threshold = 12 // Base threshold
    const smoothingFactor = 0.1

    // Simple step detection (in production, use more sophisticated algorithms)
    if (magnitude > threshold) {
      return 1
    }
    return 0
  }, [])

  // Enhanced statistics calculation
  const calculateStats = useCallback(() => {
    const progress = stepData.goal > 0 ? (stepData.daily / stepData.goal) * 100 : 0
    const weeklyGoal = stepData.goal * 7
    const weeklyProgress = weeklyGoal > 0 ? (stepData.weekly / weeklyGoal) * 100 : 0

    // Estimate distance (average step length: 0.7m)
    const distance = (stepData.daily * 0.0007) // km

    // Estimate calories (rough calculation based on steps and average weight)
    const calories = Math.round(stepData.daily * 0.04)

    // Calculate average from history
    const averageDaily = stepHistory.length > 0
      ? stepHistory.reduce((sum, day) => sum + day.steps, 0) / stepHistory.length
      : stepData.daily

    // Find best day
    const bestDay = stepHistory.length > 0
      ? Math.max(...stepHistory.map(day => day.steps))
      : stepData.daily

    // Estimate active minutes (rough calculation: 1 minute per 100 steps)
    const activeMinutes = Math.round(stepData.daily / 100)

    setStatistics({
      progress,
      weeklyProgress,
      distance: Number(distance.toFixed(2)),
      calories,
      averageDaily: Math.round(averageDaily),
      bestDay,
      activeMinutes
    })
  }, [stepData, stepHistory])

  // Load step history and calculate streak
  const loadStepHistory = useCallback(async () => {
    if (!userId) return

    try {
      const history = await stepsDailyService.getStepsHistory(userId, 30)
      const formattedHistory: StepHistory[] = history.map(record => ({
        date: record.date,
        steps: record.steps,
        calories_est: record.calories_est,
        distance_est: record.distance_est,
        goal_achieved: record.steps >= stepGoal
      }))

      setStepHistory(formattedHistory)

      // Calculate current streak
      let streak = 0
      const sortedHistory = formattedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      for (const day of sortedHistory) {
        if (day.goal_achieved) {
          streak++
        } else {
          break
        }
      }

      setStepData(prev => ({ ...prev, streak }))

    } catch (error) {
      console.error('Error loading step history:', error)
      setError('Failed to load step history')
    }
  }, [userId, stepGoal])

  // Enhanced data persistence with offline support
  const saveStepsToDatabase = useCallback(async (steps: number, force: boolean = false) => {
    if (!userId) return

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Only save every 30 seconds unless forced, to avoid excessive API calls
    if (!force && now.getTime() - lastSaveRef.current.getTime() < 30000) {
      return
    }

    try {
      const distance = steps * 0.0007 // km
      const calories = steps * 0.04

      const stepRecord = {
        user_id: userId,
        date: today,
        steps,
        calories_est: calories,
        distance_est: distance,
        source: 'device_motion' as const
      }

      const result = await stepsDailyService.upsertStepsDaily(stepRecord)

      if (result) {
        lastSaveRef.current = now
        setLastSyncTime(now)
        setError(null)

        // Update step history
        await loadStepHistory()
      }
    } catch (error) {
      console.error('Error saving steps:', error)
      setError('Failed to sync steps')

      // In case of error, we'll retry on next sync
      // For offline support, we could store in localStorage here
      if (!isDemoMode) {
        localStorage.setItem(`steps_offline_${userId}_${today}`, steps.toString())
      }
    }
  }, [userId, loadStepHistory])

  // Load today's steps from database
  const loadTodaySteps = useCallback(async () => {
    if (!userId) return

    const today = new Date().toISOString().split('T')[0]

    try {
      const todayRecord = await stepsDailyService.getStepsDaily(userId, today)

      if (todayRecord) {
        stepCountRef.current = todayRecord.steps
        setStepData(prev => ({
          ...prev,
          daily: todayRecord.steps
        }))
      }

      // Load weekly and monthly data
      const weeklySteps = await stepsDailyService.getWeeklySteps(userId)
      const history = await stepsDailyService.getStepsHistory(userId, 30)
      const monthlySteps = history
        .filter(record => {
          const recordDate = new Date(record.date)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return recordDate >= thirtyDaysAgo
        })
        .reduce((sum, record) => sum + record.steps, 0)

      setStepData(prev => ({
        ...prev,
        weekly: weeklySteps,
        monthly: monthlySteps
      }))

    } catch (error) {
      console.error('Error loading today steps:', error)
      setError('Failed to load step data')
    }
  }, [userId])

  // Device motion handler with enhanced detection
  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isTracking) return

    const steps = calculateSteps(event.accelerationIncludingGravity)
    if (steps > 0) {
      stepCountRef.current += steps
      setStepData(prev => ({
        ...prev,
        daily: stepCountRef.current,
        lastUpdate: new Date()
      }))
    }
  }, [isTracking, calculateSteps])

  // Request permission for device motion
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setError('Device motion not supported on this device')
      return false
    }

    try {
      // For iOS 13+ devices
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        if (permission === 'granted') {
          setHasPermission(true)
          setError(null)
          return true
        } else {
          setError('Permission denied for device motion')
          return false
        }
      } else {
        // For other devices, assume permission granted
        setHasPermission(true)
        setError(null)
        return true
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      setError('Failed to request motion permission')
      return false
    }
  }, [])

  // Start step tracking
  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) return
    }

    setIsTracking(true)
    setError(null)

    // Set up motion listener
    motionListenerRef.current = handleDeviceMotion
    window.addEventListener('devicemotion', motionListenerRef.current)

    // Set up automatic syncing every 2 minutes
    syncIntervalRef.current = setInterval(() => {
      saveStepsToDatabase(stepCountRef.current)
    }, 120000) // 2 minutes

    console.log('Step tracking started')
  }, [hasPermission, requestPermission, handleDeviceMotion, saveStepsToDatabase])

  // Stop step tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false)

    if (motionListenerRef.current) {
      window.removeEventListener('devicemotion', motionListenerRef.current)
      motionListenerRef.current = null
    }

    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = undefined
    }

    // Final save
    if (stepCountRef.current > 0) {
      saveStepsToDatabase(stepCountRef.current, true)
    }

    console.log('Step tracking stopped')
  }, [saveStepsToDatabase])

  // Manual sync function for user-triggered sync
  const syncNow = useCallback(async () => {
    if (stepCountRef.current > 0) {
      await saveStepsToDatabase(stepCountRef.current, true)
    }
    await loadTodaySteps()
    await loadStepHistory()
  }, [saveStepsToDatabase, loadTodaySteps, loadStepHistory])

  // Offline sync recovery
  const syncOfflineData = useCallback(async () => {
    if (!userId || isDemoMode) return

    // Check for offline stored data
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`steps_offline_${userId}`))

    for (const key of keys) {
      const steps = localStorage.getItem(key)
      const date = key.split('_').pop()

      if (steps && date) {
        try {
          const distance = parseInt(steps) * 0.0007
          const calories = parseInt(steps) * 0.04

          await stepsDailyService.upsertStepsDaily({
            user_id: userId,
            date,
            steps: parseInt(steps),
            calories_est: calories,
            distance_est: distance,
            source: 'device_motion'
          })

          localStorage.removeItem(key)
          console.log(`Synced offline data for ${date}:`, steps, 'steps')
        } catch (error) {
          console.error(`Failed to sync offline data for ${date}:`, error)
        }
      }
    }
  }, [userId])

  // Initialize and load data
  useEffect(() => {
    if (userId) {
      loadTodaySteps()
      loadStepHistory()
      syncOfflineData()
    }
  }, [userId, loadTodaySteps, loadStepHistory, syncOfflineData])

  // Update goal
  useEffect(() => {
    setStepData(prev => ({ ...prev, goal: stepGoal }))
  }, [stepGoal])

  // Calculate statistics when data changes
  useEffect(() => {
    calculateStats()
  }, [calculateStats])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (motionListenerRef.current) {
        window.removeEventListener('devicemotion', motionListenerRef.current)
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [])

  return {
    stepData,
    statistics,
    stepHistory,
    isTracking,
    hasPermission,
    error,
    lastSyncTime,
    requestPermission,
    startTracking,
    stopTracking,
    syncNow
  }
}
