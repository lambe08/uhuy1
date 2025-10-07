'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  Calendar,
  Footprints,
  Target,
  Flame,
  MapPin,
  Award,
  Clock,
  Activity,
  BarChart3
} from 'lucide-react'
import { stepRecordService } from '@/lib/database'
import type { StepRecord } from '@/lib/supabase'

interface StepAnalyticsProps {
  userId: string | null
  currentSteps: number
  stepGoal: number
}

interface AnalyticsData {
  dailyStats: {
    steps: number
    calories: number
    distance: number
    activeMinutes: number
    goalProgress: number
  }
  weeklyData: StepRecord[]
  monthlyData: StepRecord[]
  streakData: {
    currentStreak: number
    longestStreak: number
    goalsThisWeek: number
    goalsThisMonth: number
  }
}

export default function StepAnalytics({ userId, currentSteps, stepGoal }: StepAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailyStats: {
      steps: currentSteps,
      calories: 0,
      distance: 0,
      activeMinutes: 0,
      goalProgress: 0
    },
    weeklyData: [],
    monthlyData: [],
    streakData: {
      currentStreak: 0,
      longestStreak: 0,
      goalsThisWeek: 0,
      goalsThisMonth: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week')

  // Calculate derived stats from steps
  const calculateStats = (steps: number, userWeight: number = 70) => {
    // Rough estimations based on average adult
    const caloriesPerStep = 0.04 // approximately 40 calories per 1000 steps
    const metersPerStep = 0.762 // average step length
    const stepsPerMinute = 100 // moderate walking pace

    return {
      calories: Math.round(steps * caloriesPerStep),
      distance: Math.round((steps * metersPerStep) / 1000 * 100) / 100, // km with 2 decimal places
      activeMinutes: Math.round(steps / stepsPerMinute),
      goalProgress: Math.min(100, (steps / stepGoal) * 100)
    }
  }

  // Load step history and calculate analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Get weekly and monthly data
        const [weeklyData, monthlyData] = await Promise.all([
          stepRecordService.getStepHistory(userId, 7),
          stepRecordService.getStepHistory(userId, 30)
        ])

        // Calculate today's stats
        const todayStats = calculateStats(currentSteps)

        // Calculate streak data
        const streakData = calculateStreaks(weeklyData.concat(monthlyData), stepGoal)

        setAnalytics({
          dailyStats: {
            steps: currentSteps,
            ...todayStats
          },
          weeklyData,
          monthlyData,
          streakData
        })

        // Save today's step data if we have steps
        if (currentSteps > 0) {
          const today = new Date().toISOString().split('T')[0]
          await stepRecordService.upsertStepRecord({
            user_id: userId,
            date: today,
            steps: currentSteps,
            calories_est: todayStats.calories,
            distance_est: todayStats.distance * 1000, // convert to meters
            source: 'device_motion'
          })
        }

      } catch (error) {
        console.error('Failed to load step analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [userId, currentSteps, stepGoal])

  const calculateStreaks = (records: StepRecord[], goal: number) => {
    const sortedRecords = records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let goalsThisWeek = 0
    let goalsThisMonth = 0

    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    for (const record of sortedRecords) {
      const recordDate = new Date(record.date)
      const achievedGoal = record.steps >= goal

      // Count goals this week/month
      if (recordDate >= weekAgo && achievedGoal) goalsThisWeek++
      if (recordDate >= monthAgo && achievedGoal) goalsThisMonth++

      // Calculate streaks
      if (achievedGoal) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)

        // Current streak (from most recent)
        if (currentStreak === 0 && recordDate >= new Date(today.getTime() - 24 * 60 * 60 * 1000)) {
          currentStreak = tempStreak
        }
      } else {
        tempStreak = 0
      }
    }

    return { currentStreak, longestStreak, goalsThisWeek, goalsThisMonth }
  }

  const getWeekDays = () => {
    const days = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const record = analytics.weeklyData.find(r => r.date === dateStr)

      days.push({
        date: dateStr,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        steps: record?.steps || 0,
        isToday: i === 0
      })
    }

    return days
  }

  const getMonthWeeks = () => {
    const weeks = []
    const today = new Date()

    for (let i = 3; i >= 0; i--) {
      const weekEnd = new Date(today.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000)

      const weekRecords = analytics.monthlyData.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= weekStart && recordDate <= weekEnd
      })

      const totalSteps = weekRecords.reduce((sum, record) => sum + record.steps, 0)
      const avgSteps = weekRecords.length > 0 ? Math.round(totalSteps / 7) : 0

      weeks.push({
        label: `Week of ${weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
        avgSteps,
        totalSteps,
        isCurrentWeek: i === 0
      })
    }

    return weeks
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Step Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-muted animate-pulse rounded" />
              <div className="h-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weekDays = getWeekDays()
  const monthWeeks = getMonthWeeks()
  const maxSteps = Math.max(...weekDays.map(d => d.steps), stepGoal)

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Today's Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Goal Progress Ring */}
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <Progress
                value={analytics.dailyStats.goalProgress}
                className="absolute inset-0 w-full h-full rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{Math.round(analytics.dailyStats.goalProgress)}%</div>
                  <div className="text-xs text-muted-foreground">of goal</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant={analytics.dailyStats.goalProgress >= 100 ? "default" : "secondary"}>
                {analytics.dailyStats.steps.toLocaleString()} / {stepGoal.toLocaleString()} steps
              </Badge>
              {analytics.dailyStats.goalProgress >= 100 && (
                <Award className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>

          <Separator />

          {/* Daily Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <div className="text-lg font-bold">{analytics.dailyStats.calories}</div>
              <div className="text-xs text-muted-foreground">Calories</div>
            </div>
            <div>
              <MapPin className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">{analytics.dailyStats.distance}</div>
              <div className="text-xs text-muted-foreground">Kilometers</div>
            </div>
            <div>
              <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <div className="text-lg font-bold">{analytics.dailyStats.activeMinutes}</div>
              <div className="text-xs text-muted-foreground">Active Min</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streak & Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Current Streak</span>
              </div>
              <div className="text-2xl font-bold">{analytics.streakData.currentStreak}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Best Streak</span>
              </div>
              <div className="text-2xl font-bold">{analytics.streakData.longestStreak}</div>
              <div className="text-xs text-muted-foreground">days</div>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Week Goals</span>
              </div>
              <div className="text-2xl font-bold">{analytics.streakData.goalsThisWeek}/7</div>
              <div className="text-xs text-muted-foreground">completed</div>
            </div>

            <div className="text-center p-3 border rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Month Goals</span>
              </div>
              <div className="text-2xl font-bold">{analytics.streakData.goalsThisMonth}/30</div>
              <div className="text-xs text-muted-foreground">completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Step History
            </span>
            <div className="flex gap-1">
              <Button
                variant={selectedView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('week')}
              >
                Week
              </Button>
              <Button
                variant={selectedView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('month')}
              >
                Month
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'week' | 'month')}>
            <TabsContent value="week" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Daily Steps (Last 7 Days)</span>
                  <span>Goal: {stepGoal.toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  {weekDays.map((day) => (
                    <div key={day.date} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                          {day.day} {day.isToday && '(Today)'}
                        </span>
                        <span className={day.steps >= stepGoal ? 'text-green-600 font-medium' : ''}>
                          {day.steps.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            day.steps >= stepGoal ? 'bg-green-500' :
                            day.steps >= stepGoal * 0.8 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (day.steps / maxSteps) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="month" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Weekly Averages (Last 4 Weeks)</span>
                  <span>Daily Goal: {stepGoal.toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  {monthWeeks.map((week, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className={`font-medium ${week.isCurrentWeek ? 'text-blue-600' : ''}`}>
                          {week.label} {week.isCurrentWeek && '(Current)'}
                        </span>
                        <span className={week.avgSteps >= stepGoal ? 'text-green-600 font-medium' : ''}>
                          {week.avgSteps.toLocaleString()}/day avg
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            week.avgSteps >= stepGoal ? 'bg-green-500' :
                            week.avgSteps >= stepGoal * 0.8 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (week.avgSteps / stepGoal) * 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total: {week.totalSteps.toLocaleString()} steps
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
