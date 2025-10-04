"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Award,
  Activity,
  Clock,
  Footprints,
  Flame,
  MapPin,
  BarChart3,
  LineChart
} from "lucide-react"
import { stepRecordService } from "@/lib/database"

interface StepAnalyticsProps {
  userId: string | null
  stepGoal: number
  currentSteps: number
  weeklySteps: number
}

interface StepRecord {
  date: string
  steps: number
  calories_estimated: number
  distance_estimated: number
}

interface Analytics {
  averageDaily: number
  averageWeekly: number
  bestDay: { date: string; steps: number }
  streakDays: number
  totalDistance: number
  totalCalories: number
  trend: 'up' | 'down' | 'stable'
  trendPercentage: number
  goalAchievementRate: number
}

export function StepAnalytics({ userId, stepGoal, currentSteps, weeklySteps }: StepAnalyticsProps) {
  const [stepHistory, setStepHistory] = useState<StepRecord[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('week')

  useEffect(() => {
    if (userId) {
      loadStepHistory()
    }
  }, [userId, timeRange])

  const loadStepHistory = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
      const history = await stepRecordService.getStepHistory(userId, days)
      setStepHistory(history)
      calculateAnalytics(history)
    } catch (error) {
      console.error('Error loading step history:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (history: StepRecord[]) => {
    if (history.length === 0) {
      setAnalytics(null)
      return
    }

    const totalSteps = history.reduce((sum, record) => sum + record.steps, 0)
    const totalDistance = history.reduce((sum, record) => sum + record.distance_estimated, 0)
    const totalCalories = history.reduce((sum, record) => sum + record.calories_estimated, 0)

    const averageDaily = totalSteps / history.length
    const averageWeekly = averageDaily * 7

    const bestDay = history.reduce((best, current) =>
      current.steps > best.steps ? current : best
    )

    // Calculate streak (consecutive days meeting goal)
    let streakDays = 0
    const sortedHistory = [...history].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (const record of sortedHistory) {
      if (record.steps >= stepGoal) {
        streakDays++
      } else {
        break
      }
    }

    // Calculate trend (comparing first half vs second half of period)
    const midpoint = Math.floor(history.length / 2)
    const firstHalf = history.slice(0, midpoint)
    const secondHalf = history.slice(midpoint)

    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.steps, 0) / firstHalf.length
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.steps, 0) / secondHalf.length

    const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
    const trend = Math.abs(trendPercentage) < 5 ? 'stable' :
                  trendPercentage > 0 ? 'up' : 'down'

    // Goal achievement rate
    const goalAchievements = history.filter(record => record.steps >= stepGoal).length
    const goalAchievementRate = (goalAchievements / history.length) * 100

    setAnalytics({
      averageDaily,
      averageWeekly,
      bestDay,
      streakDays,
      totalDistance,
      totalCalories,
      trend,
      trendPercentage: Math.abs(trendPercentage),
      goalAchievementRate
    })
  }

  // Generate chart data for visualization
  const generateChartData = () => {
    if (!stepHistory.length) return []

    return stepHistory.map(record => ({
      date: new Date(record.date).toLocaleDateString('en', {
        month: 'short',
        day: 'numeric'
      }),
      steps: record.steps,
      goal: stepGoal,
      percentage: (record.steps / stepGoal) * 100
    }))
  }

  const chartData = generateChartData()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Step Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Step Analytics
              </CardTitle>
              <CardDescription>
                Track your progress and identify patterns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('week')}
              >
                7D
              </Button>
              <Button
                variant={timeRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('month')}
              >
                30D
              </Button>
              <Button
                variant={timeRange === '3months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('3months')}
              >
                90D
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {analytics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.averageDaily).toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <Progress
                  value={(analytics.averageDaily / stepGoal) * 100}
                  className="h-2"
                />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Goal Achievement</p>
                  <p className="text-2xl font-bold">{Math.round(analytics.goalAchievementRate)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2">
                <Progress value={analytics.goalAchievementRate} className="h-2" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold">{analytics.streakDays}</p>
                  <p className="text-xs text-gray-500">days</p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Trend</p>
                  <div className="flex items-center gap-1">
                    {analytics.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : analytics.trend === 'down' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <LineChart className="h-4 w-4 text-gray-500" />
                    )}
                    <p className="text-lg font-bold">
                      {analytics.trendPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Chart Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Daily Steps Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Simple Bar Chart */}
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(chartData.length, 7)}, 1fr)` }}>
                  {chartData.slice(-7).map((day, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2">
                      <div className="w-full h-32 bg-gray-100 rounded relative flex items-end justify-center">
                        <div
                          className={`w-4/5 rounded-t transition-all ${
                            day.steps >= stepGoal ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{
                            height: `${Math.max(5, Math.min(95, (day.steps / (stepGoal * 1.5)) * 100))}%`
                          }}
                        ></div>
                        {/* Goal line */}
                        <div
                          className="absolute w-full border-t-2 border-dashed border-orange-400"
                          style={{ bottom: `${(stepGoal / (stepGoal * 1.5)) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium">{day.date}</p>
                        <p className="text-xs text-gray-600">{day.steps.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Daily Steps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Goal Achieved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-orange-400"></div>
                    <span>Daily Goal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analytics */}
          <Tabs defaultValue="insights" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="health">Health Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {/* Best Performance */}
                    <div className="p-4 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">Best Day</p>
                          <p className="text-sm text-green-700">
                            {analytics.bestDay.steps.toLocaleString()} steps on{' '}
                            {new Date(analytics.bestDay.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Streak Information */}
                    <div className="p-4 border rounded-lg bg-orange-50">
                      <div className="flex items-center gap-3">
                        <Flame className="h-6 w-6 text-orange-600" />
                        <div>
                          <p className="font-semibold text-orange-800">
                            {analytics.streakDays > 0 ? `${analytics.streakDays} Day Streak!` : 'Start Your Streak'}
                          </p>
                          <p className="text-sm text-orange-700">
                            {analytics.streakDays > 0
                              ? `You've hit your goal ${analytics.streakDays} days in a row`
                              : 'Hit your daily goal to start a streak'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trend Analysis */}
                    <div className={`p-4 border rounded-lg ${
                      analytics.trend === 'up' ? 'bg-green-50' :
                      analytics.trend === 'down' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        {analytics.trend === 'up' ? (
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        ) : analytics.trend === 'down' ? (
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        ) : (
                          <LineChart className="h-6 w-6 text-blue-600" />
                        )}
                        <div>
                          <p className={`font-semibold ${
                            analytics.trend === 'up' ? 'text-green-800' :
                            analytics.trend === 'down' ? 'text-red-800' : 'text-blue-800'
                          }`}>
                            {analytics.trend === 'up' ? 'Improving Trend' :
                             analytics.trend === 'down' ? 'Declining Trend' : 'Stable Performance'}
                          </p>
                          <p className={`text-sm ${
                            analytics.trend === 'up' ? 'text-green-700' :
                            analytics.trend === 'down' ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {analytics.trend === 'up'
                              ? `Your activity increased by ${analytics.trendPercentage.toFixed(1)}%`
                              : analytics.trend === 'down'
                              ? `Your activity decreased by ${analytics.trendPercentage.toFixed(1)}%`
                              : 'Your activity level is consistent'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="records" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stepHistory.slice(0, 10).map((record, index) => (
                      <div key={record.date} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant={record.steps >= stepGoal ? "default" : "secondary"}>
                            {new Date(record.date).toLocaleDateString('en', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Badge>
                          <div>
                            <p className="font-medium">{record.steps.toLocaleString()} steps</p>
                            <p className="text-sm text-gray-600">
                              {(record.distance_estimated / 1000).toFixed(1)} km • {record.calories_estimated} cal
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.steps >= stepGoal && (
                            <Target className="h-4 w-4 text-green-500" />
                          )}
                          <Progress
                            value={(record.steps / stepGoal) * 100}
                            className="w-16 h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Health Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg bg-blue-50">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{(analytics.totalDistance / 1000).toFixed(1)} km</p>
                      <p className="text-sm text-gray-600">Total Distance</p>
                      <p className="text-xs text-blue-600 mt-1">
                        ≈ {Math.round((analytics.totalDistance / 1000) / 1.6)} miles
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg bg-orange-50">
                      <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <p className="text-2xl font-bold">{Math.round(analytics.totalCalories)}</p>
                      <p className="text-sm text-gray-600">Calories Burned</p>
                      <p className="text-xs text-orange-600 mt-1">
                        ≈ {(analytics.totalCalories / 3500).toFixed(2)} lbs
                      </p>
                    </div>

                    <div className="text-center p-4 border rounded-lg bg-green-50">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{Math.round(analytics.averageDaily * 0.8 / 60)}</p>
                      <p className="text-sm text-gray-600">Active Minutes/Day</p>
                      <p className="text-xs text-green-600 mt-1">
                        @ 100 steps/min
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">💡 Health Benefits</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Improved cardiovascular health</li>
                      <li>• Enhanced mood and mental wellbeing</li>
                      <li>• Better sleep quality</li>
                      <li>• Increased bone density</li>
                      <li>• Enhanced immune system</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!analytics && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Footprints className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Step Data Yet</h3>
            <p className="text-gray-600 mb-4">
              Start tracking your steps to see analytics and insights
            </p>
            <Button onClick={loadStepHistory}>
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
