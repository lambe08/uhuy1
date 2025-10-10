import { NextResponse } from 'next/server';
import { wgerService } from '@/lib/wger';

// Simplified interface for workout response
interface WorkoutResponse {
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

export async function GET() {
  try {
    // Use the new wger service with ETag caching
    const exercises = await wgerService.getBodyweightExercises(2, 50);

    // Transform to expected format
    const transformedWorkouts: WorkoutResponse[] = exercises.map(ex => {
      // Estimate duration based on category
      const category = ex.category.toLowerCase();
      let duration = 15;

      if (category.includes('cardio') || category.includes('conditioning')) {
        duration = Math.floor(Math.random() * 20) + 20;
      } else if (category.includes('strength') || category.includes('power')) {
        duration = Math.floor(Math.random() * 15) + 25;
      } else {
        duration = Math.floor(Math.random() * 15) + 15;
      }

      return {
        id: ex.id.toString(),
        name: ex.name,
        category: ex.category,
        difficulty: ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1),
        duration,
        equipment: ex.equipment.length > 0 ? ex.equipment : ['None'],
        description: ex.description.substring(0, 200) + (ex.description.length > 200 ? '...' : ''),
        muscles: [...ex.muscles, ...ex.muscles_secondary],
        image: ex.images.length > 0 ? ex.images[0] : null,
      };
    }).slice(0, 30);

    return NextResponse.json({
      workouts: transformedWorkouts,
      cached: wgerService.getCacheStats()
    });
  } catch (error) {
    console.error('Error fetching workouts from wger:', error);

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
