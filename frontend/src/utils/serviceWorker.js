// Service Worker Registration
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // Update available
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update notification
                showUpdateNotification()
              }
            })
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

const showUpdateNotification = () => {
  const event = new CustomEvent('showToast', {
    detail: 'App updated! Refresh to get the latest version.'
  })
  window.dispatchEvent(event)
}

// Preload critical resources
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/api/podcasts',
    // Add other critical API endpoints
  ]
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalResources.forEach(resource => {
        fetch(resource, { 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).catch(() => {}) // Ignore errors for preloading
      })
    })
  }
}
