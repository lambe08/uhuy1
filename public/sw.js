// FitTracker PWA Service Worker
// Enhanced caching strategies for offline-first experience

const CACHE_NAME = 'fittracker-v1.0.0';
const DYNAMIC_CACHE_NAME = 'fittracker-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/offline.html', // Fallback page for offline
];

// API routes to cache dynamically
const CACHEABLE_APIS = [
  '/api/workouts',
  '/api/strava/activities',
  '/api/posts',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Strategy 1: Cache First (for static assets)
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy 2: Network First with Fallback (for API calls)
  if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Strategy 3: Stale While Revalidate (for workout data)
  if (url.pathname.includes('/api/workouts')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Strategy 4: Network First (for dynamic content)
  event.respondWith(networkFirst(request));
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-step-data') {
    event.waitUntil(syncStepData());
  }

  if (event.tag === 'sync-workout-progress') {
    event.waitUntil(syncWorkoutProgress());
  }

  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPosts());
  }
});

// Push notifications for workout reminders
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'Time for your workout! 💪',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/?tab=workouts',
      action: 'workout-reminder'
    },
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/icon-192x192.png'
      },
      {
        action: 'snooze',
        title: 'Remind Later',
        icon: '/icon-192x192.png'
      }
    ],
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification('FitTracker Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/?tab=workouts&action=start')
    );
  } else if (event.action === 'snooze') {
    // Schedule another notification in 30 minutes
    setTimeout(() => {
      self.registration.showNotification('Workout Reminder', {
        body: 'Ready for your workout now? 🏃‍♂️',
        icon: '/icon-192x192.png'
      });
    }, 30 * 60 * 1000);
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// CACHING STRATEGIES

// Cache First - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache first failed:', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

// Network First with Fallback - good for API calls
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for API calls
    return new Response(JSON.stringify({
      error: 'Offline - cached data not available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - good for workout data
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Always try to update in the background
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Network update failed:', error);
    });

  // Return cached version immediately if available
  if (cachedResponse) {
    // Update in background
    networkResponsePromise;
    return cachedResponse;
  }

  // Otherwise wait for network
  return networkResponsePromise;
}

// Network First - for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    return new Response('Network error', { status: 503 });
  }
}

// BACKGROUND SYNC FUNCTIONS

async function syncStepData() {
  console.log('[SW] Syncing step data');
  try {
    // Get offline step data from IndexedDB
    const stepData = await getOfflineStepData();

    if (stepData && stepData.length > 0) {
      const response = await fetch('/api/steps/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: stepData })
      });

      if (response.ok) {
        // Clear synced data from IndexedDB
        await clearSyncedStepData(stepData);
        console.log('[SW] Step data synced successfully');
      }
    }
  } catch (error) {
    console.log('[SW] Step data sync failed:', error);
    throw error; // Will retry the sync
  }
}

async function syncWorkoutProgress() {
  console.log('[SW] Syncing workout progress');
  // Similar implementation for workout data
}

async function syncPosts() {
  console.log('[SW] Syncing posts');
  // Similar implementation for social posts
}

// IndexedDB helper functions (simplified - would need full implementation)
async function getOfflineStepData() {
  // Implementation to read from IndexedDB
  return [];
}

async function clearSyncedStepData(data) {
  // Implementation to clear synced data from IndexedDB
}

console.log('[SW] Service Worker script loaded');
