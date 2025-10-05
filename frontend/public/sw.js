// Service Worker for aggressive caching
const CACHE_NAME = 'podcaster-ai-v1'
const STATIC_CACHE = 'static-v1'
const API_CACHE = 'api-v1'

// Cache static assets
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets
]

// Cache API responses for offline access
const API_CACHE_PATTERNS = [
  /\/api\/podcasts\/history/,
  /\/api\/podcasts$/,
  /\/outputs\/.+\.wav$/,
]

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE)
    ])
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  // Handle API requests
  if (request.url.includes('/api/') || API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Serve from cache first (stale-while-revalidate)
            fetch(request).then(fetchResponse => {
              if (fetchResponse.ok) {
                cache.put(request, fetchResponse.clone())
              }
            }).catch(() => {}) // Ignore network errors
            
            return response
          }
          
          // Not in cache, fetch from network
          return fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone())
            }
            return fetchResponse
          })
        })
      })
    )
    return
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request)
    })
  )
})

// Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
