// wger.de API Service - Exercise database integration
// Compliant with free tier usage and 24-hour caching strategy

interface WgerExercise {
  id: number
  uuid?: string
  name: string
  exercise_base: number
  description: string
  creation_date?: string
  category: number
  muscles: number[]
  muscles_secondary: number[]
  equipment: number[]
  language: number
  license: number
  license_author?: string
  variations?: number[]
}

interface WgerCategory {
  id: number
  name: string
}

interface WgerMuscle {
  id: number
  name: string
  name_en: string
  is_front: boolean
}

interface WgerEquipment {
  id: number
  name: string
}

interface WgerImage {
  id: number
  exercise_base: number
  image: string
  is_main: boolean
  license: number
  license_author: string
}

interface WgerExerciseInfo {
  id: number
  name: string
  description: string
  category: string
  muscles: string[]
  muscles_secondary: string[]
  equipment: string[]
  images: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

// Cache storage
interface CacheEntry<T> {
  data: T
  etag: string | null
  timestamp: number
}

const cache = new Map<string, CacheEntry<any>>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const WGER_BASE_URL = process.env.WGER_API_URL || 'https://wger.de/api/v2'

// Helper to check if cache is valid
function isCacheValid(key: string): boolean {
  const entry = cache.get(key)
  if (!entry) return false
  return Date.now() - entry.timestamp < CACHE_DURATION
}

// Fetch with ETag support
async function fetchWithCache<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cacheKey = endpoint
  const cachedEntry = cache.get(cacheKey)

  // Add ETag header if we have cached data
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (cachedEntry?.etag && isCacheValid(cacheKey)) {
    headers['If-None-Match'] = cachedEntry.etag
  }

  try {
    const response = await fetch(`${WGER_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // If 304 Not Modified, return cached data
    if (response.status === 304 && cachedEntry) {
      return cachedEntry.data
    }

    if (!response.ok) {
      throw new Error(`wger API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const etag = response.headers.get('ETag')

    // Update cache
    cache.set(cacheKey, {
      data,
      etag,
      timestamp: Date.now(),
    })

    return data
  } catch (error) {
    // If fetch fails but we have cached data, return it
    if (cachedEntry) {
      console.warn('wger API fetch failed, using cached data:', error)
      return cachedEntry.data
    }
    throw error
  }
}

// Metadata lookups (these change rarely, so we cache aggressively)
let categoriesCache: Map<number, string> | null = null
let musclesCache: Map<number, string> | null = null
let equipmentCache: Map<number, string> | null = null

async function getCategories(): Promise<Map<number, string>> {
  if (categoriesCache) return categoriesCache

  try {
    const data = await fetchWithCache<{ results: WgerCategory[] }>(
      '/exercisecategory/?limit=100'
    )
    categoriesCache = new Map(data.results.map(c => [c.id, c.name]))
    return categoriesCache
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return new Map()
  }
}

async function getMuscles(): Promise<Map<number, string>> {
  if (musclesCache) return musclesCache

  try {
    const data = await fetchWithCache<{ results: WgerMuscle[] }>(
      '/muscle/?limit=100'
    )
    musclesCache = new Map(data.results.map(m => [m.id, m.name_en || m.name]))
    return musclesCache
  } catch (error) {
    console.error('Failed to fetch muscles:', error)
    return new Map()
  }
}

async function getEquipment(): Promise<Map<number, string>> {
  if (equipmentCache) return equipmentCache

  try {
    const data = await fetchWithCache<{ results: WgerEquipment[] }>(
      '/equipment/?limit=100'
    )
    equipmentCache = new Map(data.results.map(e => [e.id, e.name]))
    return equipmentCache
  } catch (error) {
    console.error('Failed to fetch equipment:', error)
    return new Map()
  }
}

// Determine difficulty based on muscle groups and description
function determineDifficulty(
  primaryMuscles: number,
  secondaryMuscles: number,
  description: string
): 'beginner' | 'intermediate' | 'advanced' {
  const desc = description.toLowerCase()
  const totalMuscles = primaryMuscles + secondaryMuscles

  if (
    desc.includes('advanced') ||
    desc.includes('expert') ||
    desc.includes('complex') ||
    totalMuscles > 4
  ) {
    return 'advanced'
  }

  if (
    desc.includes('intermediate') ||
    desc.includes('moderate') ||
    totalMuscles > 2
  ) {
    return 'intermediate'
  }

  return 'beginner'
}

// Main service
export const wgerService = {
  // Get bodyweight exercises (equipment ID 7 = bodyweight)
  async getBodyweightExercises(
    language = 2, // 2 = English
    limit = 50
  ): Promise<WgerExerciseInfo[]> {
    try {
      const [categories, muscles, equipment, exercisesData, imagesData] =
        await Promise.all([
          getCategories(),
          getMuscles(),
          getEquipment(),
          fetchWithCache<{ results: WgerExercise[] }>(
            `/exercise/?language=${language}&limit=${limit}`
          ),
          fetchWithCache<{ results: WgerImage[] }>(
            `/exerciseimage/?limit=${limit * 2}`
          ),
        ])

      // Create image map
      const imageMap = new Map<number, string[]>()
      imagesData.results.forEach(img => {
        if (!imageMap.has(img.exercise_base)) {
          imageMap.set(img.exercise_base, [])
        }
        imageMap.get(img.exercise_base)!.push(img.image)
      })

      // Filter and transform exercises
      const exercises = exercisesData.results
        .filter(ex => {
          // Only bodyweight or minimal equipment
          return (
            ex.equipment.length === 0 ||
            ex.equipment.every(
              e => equipment.get(e)?.toLowerCase().includes('body') || e === 7
            )
          )
        })
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          description: ex.description.replace(/<[^>]*>/g, '').trim(),
          category: categories.get(ex.category) || 'General',
          muscles: ex.muscles.map(m => muscles.get(m) || 'Unknown'),
          muscles_secondary: ex.muscles_secondary.map(
            m => muscles.get(m) || 'Unknown'
          ),
          equipment: ex.equipment.map(e => equipment.get(e) || 'None'),
          images: imageMap.get(ex.exercise_base) || [],
          difficulty: determineDifficulty(
            ex.muscles.length,
            ex.muscles_secondary.length,
            ex.description
          ),
        }))

      return exercises
    } catch (error) {
      console.error('Failed to fetch bodyweight exercises:', error)
      return []
    }
  },

  // Get exercises by category
  async getExercisesByCategory(
    categoryId: number,
    language = 2
  ): Promise<WgerExerciseInfo[]> {
    try {
      const [exercises, categories] = await Promise.all([
        this.getBodyweightExercises(language, 100),
        getCategories()
      ])
      return exercises.filter(ex => categories.get(categoryId) === ex.category)
    } catch (error) {
      console.error('Failed to fetch exercises by category:', error)
      return []
    }
  },

  // Get exercises by muscle group
  async getExercisesByMuscle(
    muscleName: string,
    language = 2
  ): Promise<WgerExerciseInfo[]> {
    try {
      const exercises = await this.getBodyweightExercises(language, 100)
      return exercises.filter(ex =>
        ex.muscles.some(m => m.toLowerCase().includes(muscleName.toLowerCase()))
      )
    } catch (error) {
      console.error('Failed to fetch exercises by muscle:', error)
      return []
    }
  },

  // Search exercises by name or description
  async searchExercises(
    query: string,
    language = 2
  ): Promise<WgerExerciseInfo[]> {
    try {
      const exercises = await this.getBodyweightExercises(language, 100)
      const lowerQuery = query.toLowerCase()
      return exercises.filter(
        ex =>
          ex.name.toLowerCase().includes(lowerQuery) ||
          ex.description.toLowerCase().includes(lowerQuery)
      )
    } catch (error) {
      console.error('Failed to search exercises:', error)
      return []
    }
  },

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    cache.clear()
    categoriesCache = null
    musclesCache = null
    equipmentCache = null
  },

  // Get cache statistics
  getCacheStats() {
    return {
      entries: cache.size,
      categories: categoriesCache?.size || 0,
      muscles: musclesCache?.size || 0,
      equipment: equipmentCache?.size || 0,
    }
  },
}
