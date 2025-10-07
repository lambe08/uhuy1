import { NextResponse } from 'next/server';

interface WgerExercise {
  id: number;
  name: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  muscles: Array<{
    id: number;
    name: string;
  }>;
  equipment: Array<{
    id: number;
    name: string;
  }>;
}

interface WgerResponse {
  results: WgerExercise[];
}

// Cache workouts for 24 hours as mentioned in specs
interface CachedWorkout {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  duration: number;
  equipment: string[];
  description: string;
  muscles: string[];
}

let cachedWorkouts: CachedWorkout[] = [];
let lastCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET() {
  try {
    // Check if we have cached data that's still valid
    const now = Date.now();
    if (cachedWorkouts.length > 0 && (now - lastCacheTime) < CACHE_DURATION) {
      return NextResponse.json({ workouts: cachedWorkouts });
    }

    // Fetch from wger API
    const response = await fetch('https://wger.de/api/v2/exercise/?format=json&language=2&limit=50', {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: WgerResponse = await response.json();

    // Transform the data to our format
    const transformedWorkouts = data.results
      .filter(exercise => exercise.name && exercise.description)
      .map(exercise => ({
        id: exercise.id.toString(),
        name: exercise.name,
        category: exercise.category?.name || 'General',
        difficulty: Math.random() > 0.6 ? 'Advanced' : Math.random() > 0.3 ? 'Intermediate' : 'Beginner',
        duration: Math.floor(Math.random() * 40) + 10, // Random duration 10-50 min
        equipment: exercise.equipment?.map(eq => eq.name) || ['None'],
        description: exercise.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...', // Remove HTML tags
        muscles: exercise.muscles?.map(muscle => muscle.name) || []
      }))
      .slice(0, 20); // Limit to 20 workouts

    // Update cache
    cachedWorkouts = transformedWorkouts;
    lastCacheTime = now;

    return NextResponse.json({ workouts: transformedWorkouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);

    // Return fallback workouts if API fails
    const fallbackWorkouts = [
      {
        id: "1",
        name: "Morning Cardio Blast",
        category: "Cardio",
        difficulty: "Beginner",
        duration: 20,
        equipment: ["None"],
        description: "High-energy cardio workout to start your day with jumping jacks, burpees, and running in place.",
        muscles: ["Cardiovascular system"]
      },
      {
        id: "2",
        name: "Bodyweight Strength Circuit",
        category: "Strength",
        difficulty: "Intermediate",
        duration: 30,
        equipment: ["None"],
        description: "Build muscle with push-ups, squats, lunges, and planks in this comprehensive bodyweight routine.",
        muscles: ["Chest", "Legs", "Core", "Arms"]
      },
      {
        id: "3",
        name: "HIIT Power Session",
        category: "HIIT",
        difficulty: "Advanced",
        duration: 25,
        equipment: ["Dumbbells"],
        description: "Intense interval training combining strength and cardio for maximum calorie burn.",
        muscles: ["Full body"]
      },
      {
        id: "4",
        name: "Yoga Flow",
        category: "Flexibility",
        difficulty: "Beginner",
        duration: 40,
        equipment: ["Yoga Mat"],
        description: "Gentle yoga flow focusing on flexibility, balance, and mindfulness.",
        muscles: ["Core", "Flexibility"]
      }
    ];

    return NextResponse.json({ workouts: fallbackWorkouts });
  }
}
