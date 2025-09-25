// Service Worker for Restaurant Management SaaS
const CACHE_NAME = 'restaurant-saas-v1'
const STATIC_CACHE = 'restaurant-saas-static-v1'
const DYNAMIC_CACHE = 'restaurant-saas-dynamic-v1'

const STATIC_FILES = [
  '/',
  '/dashboard',
  '/auth/login',
  '/offline.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
]

const API_CACHE_PATTERNS = [
  /\/api\/restaurants/,
  /\/api\/menu/,
  /\/api\/users\/profile/,
]

const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: 'cache-first',
  // Network first for dynamic content
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate for frequently updated content
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
}

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Static files cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error)
      })
  )
})

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with different strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) return

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request))
  } else {
    event.respondWith(handleGenericRequest(request))
  }
})

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)
}

// Check if request is for API
function isAPIRequest(request) {
  return request.url.includes('/api/')
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Error handling static asset:', error)
    return new Response('Static asset not available', { status: 404 })
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses for specific patterns
      if (shouldCacheAPIResponse(request)) {
        const cache = await caches.open(DYNAMIC_CACHE)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    }
    
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for API request')
    
    // Fall back to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This request is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      return networkResponse
    }
    throw new Error('Network response not ok')
  } catch (error) {
    console.log('Service Worker: Navigation request failed, showing offline page')
    
    // Try to serve cached version
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Show offline page
    const offlinePage = await caches.match('/offline.html')
    return offlinePage || new Response('Offline', { status: 503 })
  }
}

// Handle other requests with stale-while-revalidate
async function handleGenericRequest(request) {
  const cachedResponse = await caches.match(request)
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE)
      cache.then((c) => c.put(request, networkResponse.clone()))
    }
    return networkResponse
  }).catch(() => {
    console.log('Service Worker: Network failed for generic request')
    return cachedResponse || new Response('Not available offline', { status: 503 })
  })
  
  return cachedResponse || fetchPromise
}

// Check if API response should be cached
function shouldCacheAPIResponse(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event:', event.tag)
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOfflineOrders())
  } else if (event.tag === 'menu-sync') {
    event.waitUntil(syncOfflineMenuChanges())
  }
})

// Sync offline orders when back online
async function syncOfflineOrders() {
  try {
    console.log('Service Worker: Syncing offline orders')
    // Implementation would sync with IndexedDB and API
    
    // Notify clients about successful sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_SUCCESS',
        data: { orders: 'synced' }
      })
    })
  } catch (error) {
    console.error('Service Worker: Error syncing offline orders:', error)
  }
}

// Sync offline menu changes
async function syncOfflineMenuChanges() {
  try {
    console.log('Service Worker: Syncing offline menu changes')
    // Implementation would sync menu changes
  } catch (error) {
    console.error('Service Worker: Error syncing menu changes:', error)
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: 'You have new orders to process',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'order-notification',
    data: {
      url: '/dashboard/orders'
    },
    actions: [
      {
        action: 'view',
        title: 'View Orders',
        icon: '/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    renotify: true
  }
  
  if (event.data) {
    const data = event.data.json()
    options.body = data.message || options.body
    options.data = { ...options.data, ...data }
  }
  
  event.waitUntil(
    self.registration.showNotification('Restaurant SaaS', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action)
  
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/dashboard'
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then((clients) => {
          // Check if there's already a window/tab open with the target URL
          const existingClient = clients.find(client => 
            client.url.includes(urlToOpen)
          )
          
          if (existingClient) {
            return existingClient.focus()
          }
          
          // Check if there's any open window/tab
          if (clients.length > 0) {
            return clients[0].navigate(urlToOpen).then(client => client.focus())
          }
          
          // Open new window/tab
          return self.clients.openWindow(urlToOpen)
        })
    )
  }
})

// Message handler for client communication
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.addAll(event.data.urls))
    )
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync event:', event.tag)
  
  if (event.tag === 'menu-update') {
    event.waitUntil(updateMenuCache())
  }
})

// Update menu cache periodically
async function updateMenuCache() {
  try {
    console.log('Service Worker: Updating menu cache')
    // Implementation would fetch latest menu data
  } catch (error) {
    console.error('Service Worker: Error updating menu cache:', error)
  }
}
