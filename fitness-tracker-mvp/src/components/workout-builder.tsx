'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Trash2,
  Save,
  Play,
  Target,
  Calendar,
  TrendingUp,
  Zap,
  Clock,
  Dumbbell,
  Settings,
  Copy,
  Shuffle
} from 'lucide-react'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  rest_time: number
  instructions?: string
  target_muscles?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  equipment: string[]
}

interface WorkoutProgram {
  id: string
  name: string
  description: string
  weeks: number
  frequency: number // workouts per week
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  workouts: ProgramWorkout[]
  progression: ProgressionRule[]
}

interface ProgramWorkout {
  id: string
  week: number
  day: number
  name: string
  exercises: Exercise[]
  focus: string
  estimated_duration: number
}

interface ProgressionRule {
  type: 'reps' | 'sets' | 'weight' | 'rest'
  increment: number
  frequency: 'weekly' | 'biweekly'
  condition: string
}

interface WorkoutBuilderProps {
  userId: string | null
  onSaveProgram?: (program: WorkoutProgram) => void
  onStartWorkout?: (workout: ProgramWorkout) => void
}

// Pre-built exercise database for bodyweight training
const EXERCISE_DATABASE: Exercise[] = [
  {
    id: 'push-up',
    name: 'Push-ups',
    sets: 3,
    reps: '8-12',
    rest_time: 60,
    difficulty: 'beginner',
    equipment: [],
    target_muscles: ['chest', 'shoulders', 'triceps'],
    instructions: 'Keep your body in a straight line from head to heels'
  },
  {
    id: 'squat',
    name: 'Bodyweight Squats',
    sets: 3,
    reps: '12-15',
    rest_time: 60,
    difficulty: 'beginner',
    equipment: [],
    target_muscles: ['quadriceps', 'glutes', 'calves'],
    instructions: 'Lower until thighs are parallel to floor'
  },
  {
    id: 'plank',
    name: 'Plank',
    sets: 3,
    reps: '30-60s',
    rest_time: 60,
    difficulty: 'beginner',
    equipment: [],
    target_muscles: ['core', 'shoulders'],
    instructions: 'Hold straight line from head to heels'
  },
  {
    id: 'lunges',
    name: 'Lunges',
    sets: 3,
    reps: '10-12 each leg',
    rest_time: 60,
    difficulty: 'beginner',
    equipment: [],
    target_muscles: ['quadriceps', 'glutes', 'hamstrings'],
    instructions: 'Step forward and lower until both knees at 90 degrees'
  },
  {
    id: 'burpees',
    name: 'Burpees',
    sets: 3,
    reps: '5-8',
    rest_time: 90,
    difficulty: 'intermediate',
    equipment: [],
    target_muscles: ['full body'],
    instructions: 'Squat, jump back to plank, jump feet back, jump up'
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    sets: 3,
    reps: '20-30',
    rest_time: 60,
    difficulty: 'intermediate',
    equipment: [],
    target_muscles: ['core', 'cardio'],
    instructions: 'Alternate bringing knees to chest in plank position'
  },
  {
    id: 'pike-pushups',
    name: 'Pike Push-ups',
    sets: 3,
    reps: '6-10',
    rest_time: 90,
    difficulty: 'advanced',
    equipment: [],
    target_muscles: ['shoulders', 'triceps'],
    instructions: 'Start in downward dog position, lower head toward ground'
  },
  {
    id: 'single-leg-squat',
    name: 'Single Leg Squats',
    sets: 3,
    reps: '5-8 each leg',
    rest_time: 120,
    difficulty: 'advanced',
    equipment: [],
    target_muscles: ['quadriceps', 'glutes', 'balance'],
    instructions: 'Squat on one leg, extend other leg forward'
  }
]

// Pre-built program templates
const PROGRAM_TEMPLATES: Omit<WorkoutProgram, 'id'>[] = [
  {
    name: "Beginner Full Body",
    description: "4-week progressive program perfect for starting your fitness journey",
    weeks: 4,
    frequency: 3,
    difficulty: 'beginner',
    workouts: [],
    progression: [
      { type: 'reps', increment: 2, frequency: 'weekly', condition: 'Can complete all sets' },
      { type: 'sets', increment: 1, frequency: 'biweekly', condition: 'After 2 weeks' }
    ]
  },
  {
    name: "Intermediate Strength",
    description: "4-week program to build strength and endurance",
    weeks: 4,
    frequency: 4,
    difficulty: 'intermediate',
    workouts: [],
    progression: [
      { type: 'reps', increment: 3, frequency: 'weekly', condition: 'Can complete all sets' },
      { type: 'rest', increment: -10, frequency: 'biweekly', condition: 'Good form maintained' }
    ]
  },
  {
    name: "Advanced Conditioning",
    description: "Intense 4-week program for experienced athletes",
    weeks: 4,
    frequency: 5,
    difficulty: 'advanced',
    workouts: [],
    progression: [
      { type: 'reps', increment: 4, frequency: 'weekly', condition: 'Perfect form maintained' },
      { type: 'sets', increment: 1, frequency: 'biweekly', condition: 'After progression check' }
    ]
  }
]

export default function WorkoutBuilder({ userId, onSaveProgram, onStartWorkout }: WorkoutBuilderProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'custom' | 'programs'>('templates')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customProgram, setCustomProgram] = useState<Partial<WorkoutProgram>>({
    name: '',
    description: '',
    weeks: 4,
    frequency: 3,
    difficulty: 'beginner',
    workouts: [],
    progression: []
  })
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([])
  const [currentWorkout, setCurrentWorkout] = useState<Partial<ProgramWorkout>>({
    name: '',
    week: 1,
    day: 1,
    exercises: [],
    focus: '',
    estimated_duration: 30
  })
  const [myPrograms, setMyPrograms] = useState<WorkoutProgram[]>([])

  // Generate workouts for template programs
  const generateTemplateWorkouts = (template: typeof PROGRAM_TEMPLATES[0]): ProgramWorkout[] => {
    const workouts: ProgramWorkout[] = []
    const exercisesForDifficulty = EXERCISE_DATABASE.filter(ex =>
      ex.difficulty === template.difficulty ||
      (template.difficulty === 'intermediate' && ex.difficulty === 'beginner') ||
      (template.difficulty === 'advanced' && ['beginner', 'intermediate'].includes(ex.difficulty))
    )

    for (let week = 1; week <= template.weeks; week++) {
      for (let day = 1; day <= template.frequency; day++) {
        const focusAreas = ['Upper Body', 'Lower Body', 'Full Body', 'Core & Cardio', 'HIIT']
        const focus = focusAreas[(day - 1) % focusAreas.length]

        // Select exercises based on focus and week progression
        let selectedExercises = exercisesForDifficulty.slice(0, Math.min(4 + Math.floor(week / 2), 6))

        // Apply weekly progression
        selectedExercises = selectedExercises.map(ex => ({
          ...ex,
          sets: ex.sets + Math.floor((week - 1) / 2),
          reps: adjustRepsForWeek(ex.reps, week),
          rest_time: Math.max(30, ex.rest_time - (week - 1) * 5)
        }))

        workouts.push({
          id: `${template.name.toLowerCase().replace(/\s+/g, '-')}-w${week}d${day}`,
          week,
          day,
          name: `Week ${week} Day ${day} - ${focus}`,
          exercises: selectedExercises,
          focus,
          estimated_duration: 30 + (selectedExercises.length * 5)
        })
      }
    }

    return workouts
  }

  const adjustRepsForWeek = (reps: string, week: number): string => {
    if (reps.includes('-')) {
      const [min, max] = reps.split('-').map(r => parseInt(r.replace(/\D/g, '')) || 0)
      const newMin = min + (week - 1)
      const newMax = max + (week - 1) * 2
      return reps.includes('s') ? `${newMin}-${newMax}s` : `${newMin}-${newMax}`
    }
    return reps
  }

  const handleCreateFromTemplate = (templateIndex: number) => {
    const template = PROGRAM_TEMPLATES[templateIndex]
    const workouts = generateTemplateWorkouts(template)

    const newProgram: WorkoutProgram = {
      id: `template-${Date.now()}`,
      ...template,
      workouts
    }

    setMyPrograms(prev => [...prev, newProgram])
    if (onSaveProgram) {
      onSaveProgram(newProgram)
    }
    setSelectedTemplate(newProgram.id)
  }

  const handleAddExercise = (exercise: Exercise) => {
    if (!selectedExercises.find(ex => ex.id === exercise.id)) {
      setSelectedExercises(prev => [...prev, exercise])
    }
  }

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId))
  }

  const handleCreateWorkout = () => {
    if (selectedExercises.length === 0 || !currentWorkout.name) return

    const workout: ProgramWorkout = {
      id: `custom-${Date.now()}`,
      name: currentWorkout.name || '',
      week: currentWorkout.week || 1,
      day: currentWorkout.day || 1,
      exercises: selectedExercises,
      focus: currentWorkout.focus || '',
      estimated_duration: selectedExercises.length * 8 + 10
    }

    setCustomProgram(prev => ({
      ...prev,
      workouts: [...(prev.workouts || []), workout]
    }))

    // Reset for next workout
    setSelectedExercises([])
    setCurrentWorkout({
      name: '',
      week: 1,
      day: 1,
      exercises: [],
      focus: '',
      estimated_duration: 30
    })
  }

  const handleSaveCustomProgram = () => {
    if (!customProgram.name || !customProgram.workouts?.length) return

    const program: WorkoutProgram = {
      id: `custom-${Date.now()}`,
      name: customProgram.name || '',
      description: customProgram.description || '',
      weeks: customProgram.weeks || 4,
      frequency: customProgram.frequency || 3,
      difficulty: customProgram.difficulty || 'beginner',
      workouts: customProgram.workouts || [],
      progression: customProgram.progression || []
    }

    setMyPrograms(prev => [...prev, program])
    if (onSaveProgram) {
      onSaveProgram(program)
    }

    // Reset form
    setCustomProgram({
      name: '',
      description: '',
      weeks: 4,
      frequency: 3,
      difficulty: 'beginner',
      workouts: [],
      progression: []
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Workout Program Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom Builder</TabsTrigger>
              <TabsTrigger value="programs">My Programs</TabsTrigger>
            </TabsList>

            {/* Template Programs */}
            <TabsContent value="templates" className="space-y-4">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Choose from our expertly designed 4-week programs with automatic progression
                </div>

                {PROGRAM_TEMPLATES.map((template, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="outline">
                            {template.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{template.weeks} weeks</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            <span>{template.frequency}x/week</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            <span>Auto-progression</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleCreateFromTemplate(index)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Program
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Custom Builder */}
            <TabsContent value="custom" className="space-y-6">
              {/* Program Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Program Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Program Name</label>
                      <Input
                        value={customProgram.name || ''}
                        onChange={(e) => setCustomProgram(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="My Custom Program"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Difficulty</label>
                      <select
                        value={customProgram.difficulty}
                        onChange={(e) => setCustomProgram(prev => ({ ...prev, difficulty: e.target.value as any }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={customProgram.description || ''}
                      onChange={(e) => setCustomProgram(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your program"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Weeks</label>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        value={customProgram.weeks}
                        onChange={(e) => setCustomProgram(prev => ({ ...prev, weeks: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Workouts per Week</label>
                      <Input
                        type="number"
                        min="1"
                        max="7"
                        value={customProgram.frequency}
                        onChange={(e) => setCustomProgram(prev => ({ ...prev, frequency: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exercise Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Add Exercises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EXERCISE_DATABASE.map((exercise) => (
                      <div key={exercise.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{exercise.name}</span>
                              <Badge variant="outline">
                                {exercise.difficulty}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {exercise.sets} sets × {exercise.reps}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {exercise.target_muscles?.map(muscle => (
                                <Badge key={muscle} variant="secondary" className="text-xs">
                                  {muscle}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddExercise(exercise)}
                            disabled={selectedExercises.some(ex => ex.id === exercise.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Exercises */}
              {selectedExercises.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Selected Exercises ({selectedExercises.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedExercises.map((exercise, index) => (
                        <div key={exercise.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div>
                            <span className="font-medium">{exercise.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {exercise.sets} × {exercise.reps}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveExercise(exercise.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium">Workout Name</label>
                        <Input
                          value={currentWorkout.name || ''}
                          onChange={(e) => setCurrentWorkout(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Upper Body Day 1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Focus Area</label>
                        <Input
                          value={currentWorkout.focus || ''}
                          onChange={(e) => setCurrentWorkout(prev => ({ ...prev, focus: e.target.value }))}
                          placeholder="e.g., Upper Body, Core"
                        />
                      </div>
                    </div>

                    <Button onClick={handleCreateWorkout} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Add Workout to Program
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Program Workouts */}
              {customProgram.workouts && customProgram.workouts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Program Workouts ({customProgram.workouts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customProgram.workouts.map((workout, index) => (
                        <div key={workout.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{workout.name}</span>
                              <div className="text-sm text-muted-foreground">
                                {workout.exercises.length} exercises • ~{workout.estimated_duration} min
                              </div>
                            </div>
                            <Badge variant="outline">{workout.focus}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <Button onClick={handleSaveCustomProgram} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Program
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Programs */}
            <TabsContent value="programs" className="space-y-4">
              {myPrograms.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Dumbbell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Programs Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first program using templates or the custom builder
                    </p>
                    <Button onClick={() => setActiveTab('templates')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Program
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myPrograms.map((program) => (
                    <Card key={program.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {program.name}
                              <Badge variant="outline">{program.difficulty}</Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {program.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{program.weeks}</div>
                            <div className="text-xs text-muted-foreground">weeks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{program.frequency}</div>
                            <div className="text-xs text-muted-foreground">per week</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{program.workouts.length}</div>
                            <div className="text-xs text-muted-foreground">workouts</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {program.workouts.slice(0, 3).map((workout) => (
                            <div key={workout.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="text-sm font-medium">{workout.name}</span>
                                <div className="text-xs text-muted-foreground">
                                  {workout.exercises.length} exercises • ~{workout.estimated_duration} min
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => onStartWorkout?.(workout)}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {program.workouts.length > 3 && (
                            <div className="text-center text-sm text-muted-foreground">
                              +{program.workouts.length - 3} more workouts
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
