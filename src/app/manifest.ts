import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitHome+ - Home Workout & Fitness Tracker',
    short_name: 'FitHome+',
    description: 'Home workouts without equipment, step tracking, Strava sync, and social fitness community',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    orientation: 'portrait',
    scope: '/',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-256x256.png',
        sizes: '256x256',
        type: 'image/png'
      },
      {
        src: '/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    categories: ['health', 'fitness', 'lifestyle'],
    shortcuts: [
      {
        name: 'Track Steps',
        short_name: 'Steps',
        description: 'Start step tracking',
        url: '/?action=track-steps',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Start Workout',
        short_name: 'Workout',
        description: 'Browse workout library',
        url: '/?tab=workouts',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Social Feed',
        short_name: 'Social',
        description: 'View community posts',
        url: '/?tab=social',
        icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
      }
    ],
    protocol_handlers: [
      {
        protocol: 'web+fittracker',
        url: '/import?url=%s'
      }
    ]
  }
}
