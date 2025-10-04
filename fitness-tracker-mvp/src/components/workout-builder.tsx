"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  X,
  Edit,
  Save,
  Clock,
  Target,
  Dumbbell,
  Play,
  Copy,
  Star,
  Calendar,
  ChevronUp,
  ChevronDown,
  Settings,
  Zap,
  Award,
  Timer,
  RotateCcw
} from "lucide-react"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight?: number
  duration: number
  rest: number
  instructions?: string
  targetMuscles?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

interface CustomWorkout {
  id: string
  name: string
  description: string
  exercises: Exercise[]
  estimatedDuration: number
  targetMuscles: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  createdAt: string
  isFavorite?: boolean
}

interface WorkoutProgram {
  id: string
  name: string
  description: string
  duration: number // weeks
  workoutsPerWeek: number
  workouts: CustomWorkout[]
  level: 'beginner' | 'intermediate' | 'advanced'
  goal: 'strength' | 'cardio' | 'weight_loss' | 'muscle_gain' | 'general_fitness'
}

interface WorkoutBuilderProps {
  userId: string | null
  onWorkoutCreated?: (workout: CustomWorkout) => void
  onStartWorkout?: (workout: CustomWorkout) => void
}

export function WorkoutBuilder({ userId, onWorkoutCreated, onStartWorkout }: WorkoutBuilderProps) {
  const [currentWorkout, setCurrentWorkout] = useState<CustomWorkout>({
    id: '',
    name: '',
    description: '',
    exercises: [],
    estimatedDuration: 0,
    targetMuscles: [],
    difficulty: 'beginner',
    category: 'strength',
    createdAt: new Date().toISOString()
  })

  const [savedWorkouts, setSavedWorkouts] = useState<CustomWorkout[]>([])
  const [programs, setPrograms] = useState<WorkoutProgram[]>([])
  const [editingExercise, setEditingExercise] = useState<string | null>(null)
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Initialize exercise library with bodyweight exercises
  useEffect(() => {
    const defaultExercises: Exercise[] = [
      {
        id: '1',
        name: 'Push-ups',
        sets: 3,
        reps: 12,
        duration: 30,
        rest: 60,
        instructions: 'Keep body straight, lower chest to floor',
        targetMuscles: ['chest', 'triceps', 'shoulders'],
        difficulty: 'beginner'
      },
      {
        id: '2',
        name: 'Squats',
        sets: 3,
        reps: 15,
        duration: 45,
        rest: 60,
        instructions: 'Feet shoulder-width apart, lower until thighs parallel',
        targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
        difficulty: 'beginner'
      },
      {
        id: '3',
        name: 'Plank',
        sets: 3,
        reps: 1,
        duration: 60,
        rest: 45,
        instructions: 'Hold straight line from head to heels',
        targetMuscles: ['core', 'shoulders'],
        difficulty: 'beginner'
      },
      {
        id: '4',
        name: 'Burpees',
        sets: 3,
        reps: 10,
        duration: 40,
        rest: 90,
        instructions: 'Jump down, push-up, jump up with arms overhead',
        targetMuscles: ['full body'],
        difficulty: 'intermediate'
      },
      {
        id: '5',
        name: 'Mountain Climbers',
        sets: 3,
        reps: 20,
        duration: 45,
        rest: 60,
        instructions: 'Alternate bringing knees to chest in plank position',
        targetMuscles: ['core', 'shoulders', 'legs'],
        difficulty: 'intermediate'
      },
      {
        id: '6',
        name: 'Lunges',
        sets: 3,
        reps: 12,
        duration: 60,
        rest: 60,
        instructions: 'Step forward, lower back knee toward ground',
        targetMuscles: ['quadriceps', 'glutes', 'hamstrings'],
        difficulty: 'beginner'
      }
    ]
    setExerciseLibrary(defaultExercises)
  }, [])

  // Calculate workout metrics
  useEffect(() => {
    const totalDuration = currentWorkout.exercises.reduce((total, exercise) => {
      return total + (exercise.duration * exercise.sets) + (exercise.rest * (exercise.sets - 1))
    }, 0)

    const uniqueMuscles = Array.from(new Set(
      currentWorkout.exercises.flatMap(ex => ex.targetMuscles || [])
    ))

    setCurrentWorkout(prev => ({
      ...prev,
      estimatedDuration: Math.round(totalDuration / 60),
      targetMuscles: uniqueMuscles
    }))
  }, [currentWorkout.exercises])

  const addExerciseToWorkout = (exercise: Exercise) => {
    const newExercise = {
      ...exercise,
      id: `${exercise.id}-${Date.now()}`
    }
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const removeExerciseFromWorkout = (exerciseId: string) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.id !== exerciseId)
    }))
  }

  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    setCurrentWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      )
    }))
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const exercises = [...currentWorkout.exercises]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < exercises.length) {
      [exercises[index], exercises[targetIndex]] = [exercises[targetIndex], exercises[index]]
      setCurrentWorkout(prev => ({ ...prev, exercises }))
    }
  }

  const saveWorkout = () => {
    if (!currentWorkout.name.trim()) {
      alert('Please enter a workout name')
      return
    }

    const workoutToSave = {
      ...currentWorkout,
      id: currentWorkout.id || Date.now().toString(),
      createdAt: currentWorkout.createdAt || new Date().toISOString()
    }

    setSavedWorkouts(prev => {
      const existing = prev.find(w => w.id === workoutToSave.id)
      if (existing) {
        return prev.map(w => w.id === workoutToSave.id ? workoutToSave : w)
      }
      return [...prev, workoutToSave]
    })

    onWorkoutCreated?.(workoutToSave)
    alert('Workout saved successfully!')
  }

  const loadWorkout = (workout: CustomWorkout) => {
    setCurrentWorkout(workout)
  }

  const startWorkout = (workout: CustomWorkout) => {
    onStartWorkout?.(workout)
  }

  const filteredExercises = exerciseLibrary.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.targetMuscles?.some(muscle =>
                           muscle.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    const matchesCategory = selectedCategory === 'all' ||
                           exercise.targetMuscles?.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-500" />
            Workout Builder
          </CardTitle>
          <CardDescription>
            Create custom workouts tailored to your fitness goals
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Workout Builder</TabsTrigger>
          <TabsTrigger value="saved">My Workouts</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Exercise Library */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Exercise Library
                </CardTitle>
                <div className="space-y-3">
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {['all', 'chest', 'legs', 'core', 'shoulders', 'full body'].map(category => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {filteredExercises.map(exercise => (
                    <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{exercise.name}</p>
                          <Badge variant="outline" size="sm">
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {exercise.sets} sets × {exercise.reps} reps
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exercise.targetMuscles?.slice(0, 2).map(muscle => (
                            <Badge key={muscle} variant="secondary" className="text-xs">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addExerciseToWorkout(exercise)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workout Builder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Current Workout
                </CardTitle>
                <div className="space-y-3">
                  <Input
                    placeholder="Workout name..."
                    value={currentWorkout.name}
                    onChange={(e) => setCurrentWorkout(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Description (optional)..."
                    value={currentWorkout.description}
                    onChange={(e) => setCurrentWorkout(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="px-3 py-2 border rounded-md"
                      value={currentWorkout.difficulty}
                      onChange={(e) => setCurrentWorkout(prev => ({
                        ...prev,
                        difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced'
                      }))}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    <select
                      className="px-3 py-2 border rounded-md"
                      value={currentWorkout.category}
                      onChange={(e) => setCurrentWorkout(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="hiit">HIIT</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="full_body">Full Body</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Workout Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 border rounded-lg bg-blue-50">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <p className="text-sm font-bold">{currentWorkout.estimatedDuration}m</p>
                    <p className="text-xs text-gray-600">Duration</p>
                  </div>
                  <div className="text-center p-2 border rounded-lg bg-green-50">
                    <Target className="h-4 w-4 mx-auto mb-1 text-green-500" />
                    <p className="text-sm font-bold">{currentWorkout.exercises.length}</p>
                    <p className="text-xs text-gray-600">Exercises</p>
                  </div>
                  <div className="text-center p-2 border rounded-lg bg-orange-50">
                    <Zap className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                    <p className="text-sm font-bold">{currentWorkout.targetMuscles.length}</p>
                    <p className="text-xs text-gray-600">Muscles</p>
                  </div>
                </div>

                {/* Exercise List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentWorkout.exercises.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No exercises added yet</p>
                      <p className="text-sm">Add exercises from the library</p>
                    </div>
                  ) : (
                    currentWorkout.exercises.map((exercise, index) => (
                      <div key={exercise.id} className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{exercise.name}</h4>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => moveExercise(index, 'down')}
                              disabled={index === currentWorkout.exercises.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingExercise(exercise.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeExerciseFromWorkout(exercise.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {editingExercise === exercise.id ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Sets"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(exercise.id, { sets: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                              type="number"
                              placeholder="Reps"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(exercise.id, { reps: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                              type="number"
                              placeholder="Duration (s)"
                              value={exercise.duration}
                              onChange={(e) => updateExercise(exercise.id, { duration: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                              type="number"
                              placeholder="Rest (s)"
                              value={exercise.rest}
                              onChange={(e) => updateExercise(exercise.id, { rest: parseInt(e.target.value) || 0 })}
                            />
                            <Button
                              size="sm"
                              className="col-span-2"
                              onClick={() => setEditingExercise(null)}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3 text-blue-500" />
                              <span>{exercise.sets} sets × {exercise.reps} reps</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Timer className="h-3 w-3 text-green-500" />
                              <span>{exercise.duration}s work</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <RotateCcw className="h-3 w-3 text-orange-500" />
                              <span>{exercise.rest}s rest</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button onClick={saveWorkout} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Save Workout
                  </Button>
                  {currentWorkout.exercises.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => startWorkout(currentWorkout)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                My Saved Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedWorkouts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Dumbbell className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Saved Workouts</h3>
                  <p className="mb-4">Create your first custom workout</p>
                  <Button onClick={() => document.querySelector('[value="builder"]')?.click()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workout
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedWorkouts.map(workout => (
                    <Card key={workout.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{workout.name}</CardTitle>
                          <Badge variant="outline">{workout.difficulty}</Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {workout.description || 'Custom workout'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-blue-600">{workout.estimatedDuration}m</p>
                              <p className="text-xs text-gray-600">Duration</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-green-600">{workout.exercises.length}</p>
                              <p className="text-xs text-gray-600">Exercises</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-orange-600">{workout.targetMuscles.length}</p>
                              <p className="text-xs text-gray-600">Muscles</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {workout.targetMuscles.slice(0, 3).map(muscle => (
                              <Badge key={muscle} variant="secondary" className="text-xs">
                                {muscle}
                              </Badge>
                            ))}
                            {workout.targetMuscles.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{workout.targetMuscles.length - 3}
                              </Badge>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => startWorkout(workout)}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadWorkout(workout)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const copy = { ...workout, id: Date.now().toString(), name: `${workout.name} (Copy)` }
                                setSavedWorkouts(prev => [...prev, copy])
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Workout Programs
              </CardTitle>
              <CardDescription>
                Structured multi-week training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Programs Coming Soon</h3>
                <p className="mb-4">Structured training programs will be available in a future update</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• 4-week Beginner Program</p>
                  <p>• 8-week Strength Building</p>
                  <p>• 12-week Body Transformation</p>
                  <p>• Custom Program Builder</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
