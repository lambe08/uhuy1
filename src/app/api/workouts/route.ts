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
  images?: Array<{
    id: number;
    image: string;
    is_main: boolean;
  }>;
}

interface WgerImage {
  id: number;
  exercise: number;
  image: string;
  is_main: boolean;
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
  image?: string | null;
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

    // Fetch exercises and images from wger API
    const [exerciseResponse, imageResponse] = await Promise.all([
      fetch('https://wger.de/api/v2/exercise/?format=json&language=2&limit=100', {
        headers: {
          'Accept': 'application/json',
        },
      }),
      fetch('https://wger.de/api/v2/exerciseimage/?format=json&limit=200', {
        headers: {
          'Accept': 'application/json',
        },
      })
    ]);

    if (!exerciseResponse.ok || !imageResponse.ok) {
      throw new Error(`HTTP error! status: ${exerciseResponse.status} or ${imageResponse.status}`);
    }

    const [exerciseData, imageData] = await Promise.all([
      exerciseResponse.json() as Promise<WgerResponse>,
      imageResponse.json() as Promise<{ results: WgerImage[] }>
    ]);

    // Create image map for quick lookup
    const imageMap = new Map<number, string>();
    imageData.results.forEach(img => {
      if (img.is_main && !imageMap.has(img.exercise)) {
        imageMap.set(img.exercise, img.image);
      }
    });

    // Filter for bodyweight and minimal equipment exercises as per MVP specs
    const bodyweightKeywords = ['bodyweight', 'body weight', 'no equipment', 'calisthenics'];
    const minimalEquipment = ['dumbbell', 'resistance band', 'exercise ball', 'yoga mat', 'pull-up bar'];

    const transformedWorkouts = exerciseData.results
      .filter(exercise => {
        if (!exercise.name || !exercise.description) return false;

        // Filter for bodyweight or minimal equipment
        const equipmentNames = exercise.equipment?.map(eq => eq.name.toLowerCase()) || [];
        const hasNoEquipment = equipmentNames.length === 0 || equipmentNames.includes('none');
        const hasMinimalEquipment = equipmentNames.some(eq =>
          minimalEquipment.some(minimal => eq.includes(minimal.toLowerCase()))
        );
        const isBodyweight = bodyweightKeywords.some(keyword =>
          exercise.description.toLowerCase().includes(keyword) ||
          exercise.name.toLowerCase().includes(keyword)
        );

        return hasNoEquipment || hasMinimalEquipment || isBodyweight;
      })
      .map(exercise => {
        // Determine difficulty based on exercise characteristics
        const muscleCount = exercise.muscles?.length || 0;
        const description = exercise.description.toLowerCase();
        let difficulty = 'Beginner';

        if (description.includes('advanced') || description.includes('expert') || muscleCount > 3) {
          difficulty = 'Advanced';
        } else if (description.includes('intermediate') || muscleCount > 1) {
          difficulty = 'Intermediate';
        }

        // Estimate duration based on exercise type
        const category = exercise.category?.name.toLowerCase() || '';
        let duration = 15; // Default 15 minutes

        if (category.includes('cardio') || category.includes('conditioning')) {
          duration = Math.floor(Math.random() * 20) + 20; // 20-40 min
        } else if (category.includes('strength') || category.includes('power')) {
          duration = Math.floor(Math.random() * 15) + 25; // 25-40 min
        } else {
          duration = Math.floor(Math.random() * 15) + 15; // 15-30 min
        }

        return {
          id: exercise.id.toString(),
          name: exercise.name,
          category: exercise.category?.name || 'General',
          difficulty,
          duration,
          equipment: exercise.equipment?.map(eq => eq.name) || ['None'],
          description: exercise.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...', // Remove HTML tags
          muscles: exercise.muscles?.map(muscle => muscle.name) || [],
          image: imageMap.get(exercise.id) || null
        };
      })
      .slice(0, 30); // Increase limit to 30 bodyweight workouts

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
        muscles: ["Cardiovascular system"],
        image: null
      },
      {
        id: "2",
        name: "Bodyweight Strength Circuit",
        category: "Strength",
        difficulty: "Intermediate",
        duration: 30,
        equipment: ["None"],
        description: "Build muscle with push-ups, squats, lunges, and planks in this comprehensive bodyweight routine.",
        muscles: ["Chest", "Legs", "Core", "Arms"],
        image: null
      },
      {
        id: "3",
        name: "HIIT Power Session",
        category: "HIIT",
        difficulty: "Advanced",
        duration: 25,
        equipment: ["Dumbbells"],
        description: "Intense interval training combining strength and cardio for maximum calorie burn.",
        muscles: ["Full body"],
        image: null
      },
      {
        id: "4",
        name: "Yoga Flow",
        category: "Flexibility",
        difficulty: "Beginner",
        duration: 40,
        equipment: ["Yoga Mat"],
        description: "Gentle yoga flow focusing on flexibility, balance, and mindfulness.",
        muscles: ["Core", "Flexibility"],
        image: null
      },
      {
        id: "5",
        name: "Core Strengthening",
        category: "Strength",
        difficulty: "Beginner",
        duration: 15,
        equipment: ["None"],
        description: "Target your core muscles with planks, crunches, and leg raises for a stronger midsection.",
        muscles: ["Core", "Abs"],
        image: null
      },
      {
        id: "6",
        name: "Lower Body Blast",
        category: "Strength",
        difficulty: "Intermediate",
        duration: 25,
        equipment: ["None"],
        description: "Strengthen your legs and glutes with squats, lunges, and calf raises.",
        muscles: ["Legs", "Glutes", "Calves"],
        image: null
      }
    ];

    return NextResponse.json({ workouts: fallbackWorkouts });
  }
}
