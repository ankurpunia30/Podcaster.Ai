import { create } from 'zustand'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const usePodcastStore = create((set, get) => ({
  // State
  podcasts: [],
  loading: false,
  lastFetched: null,
  error: null,
  pendingRequests: new Map(),
  backgroundSyncEnabled: true,
  lastBackgroundSync: null,
  
  // Cache duration (5 minutes)
  CACHE_DURATION: 5 * 60 * 1000,
  
  // Background sync interval (2 minutes)
  BACKGROUND_SYNC_INTERVAL: 2 * 60 * 1000,
  
  // Actions
  setPodcasts: (podcasts) => set({ podcasts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Check if cache is still valid
  isCacheValid: () => {
    const { lastFetched, CACHE_DURATION } = get()
    if (!lastFetched) return false
    return Date.now() - lastFetched < CACHE_DURATION
  },
  
  // Fetch podcasts with caching and deduplication
  fetchPodcasts: async (token, forceRefresh = false) => {
    const { isCacheValid, podcasts, pendingRequests } = get()
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid() && podcasts.length > 0) {
      console.log('📦 Using cached podcasts data')
      return podcasts
    }
    
    // Deduplicate requests
    const requestKey = `fetch_podcasts_${token?.slice(-8) || 'no_token'}`
    if (pendingRequests.has(requestKey)) {
      console.log('🔄 Deduplicating fetch podcasts request')
      return pendingRequests.get(requestKey)
    }
    
    set({ loading: true, error: null })
    
    const requestPromise = (async () => {
      try {
        console.log('🔄 Fetching fresh podcasts data')
        const response = await axios.get(`${API_BASE}/api/podcasts`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        const fetchedPodcasts = response.data.podcasts || []
        set({ 
          podcasts: fetchedPodcasts, 
          lastFetched: Date.now(), 
          loading: false 
        })
        
        return fetchedPodcasts
      } catch (error) {
        console.error('Failed to fetch podcasts:', error)
        set({ error: error.message, loading: false })
        throw error
      } finally {
        // Remove from pending requests
        const { pendingRequests } = get()
        pendingRequests.delete(requestKey)
        set({ pendingRequests: new Map(pendingRequests) })
      }
    })()
    
    // Store pending request
    pendingRequests.set(requestKey, requestPromise)
    set({ pendingRequests: new Map(pendingRequests) })
    
    return requestPromise
  },
  
  // Add new podcast to store (for real-time updates)
  addPodcast: (podcast) => {
    const { podcasts } = get()
    set({ podcasts: [podcast, ...podcasts] })
  },
  
  // Update podcast status
  updatePodcast: (podcastId, updates) => {
    const { podcasts } = get()
    const updatedPodcasts = podcasts.map(p => 
      p.id === podcastId ? { ...p, ...updates } : p
    )
    set({ podcasts: updatedPodcasts })
  },
  
  // Smart polling - only when needed
  startSmartPolling: (token, interval = 30000) => {
    const { stopPolling } = get()
    
    // Clear any existing polling
    stopPolling()
    
    const pollId = setInterval(async () => {
      const { podcasts } = get()
      
      // Only poll if we have podcasts in progress
      const hasGeneratingPodcasts = podcasts.some(p => 
        p.status === 'generating' || p.status === 'generating_audio'
      )
      
      if (hasGeneratingPodcasts) {
        console.log('🔄 Smart polling: Checking for updates...')
        await get().fetchPodcasts(token, true)
      } else {
        console.log('⏸️ Smart polling: No active generations, skipping...')
      }
    }, interval)
    
    set({ pollingId: pollId })
    return pollId
  },
  
  stopPolling: () => {
    const { pollingId } = get()
    if (pollingId) {
      clearInterval(pollingId)
      set({ pollingId: null })
    }
  },
  
  // Clear cache (useful for logout)
  clearCache: () => {
    get().stopPolling()
    get().stopBackgroundSync()
    set({ 
      podcasts: [], 
      lastFetched: null, 
      loading: false, 
      error: null,
      pendingRequests: new Map()
    })
  },

  // Background sync for fresh data (non-blocking)
  startBackgroundSync: (token) => {
    const { stopBackgroundSync, BACKGROUND_SYNC_INTERVAL } = get()
    
    stopBackgroundSync() // Clear any existing sync
    
    const syncId = setInterval(async () => {
      try {
        // Only sync if cache is getting stale (last 1 minute of cache life)
        const { lastFetched, CACHE_DURATION, isCacheValid } = get()
        const timeUntilExpiry = CACHE_DURATION - (Date.now() - (lastFetched || 0))
        
        if (timeUntilExpiry < 60000) { // Less than 1 minute left
          console.log('🔄 Background sync: Refreshing stale cache')
          await get().fetchPodcasts(token, true)
        }
      } catch (error) {
        console.error('Background sync failed:', error)
      }
    }, BACKGROUND_SYNC_INTERVAL)
    
    set({ backgroundSyncId: syncId })
  },

  stopBackgroundSync: () => {
    const { backgroundSyncId } = get()
    if (backgroundSyncId) {
      clearInterval(backgroundSyncId)
      set({ backgroundSyncId: null })
    }
  },

  // Optimistic updates for better UX
  optimisticUpdate: (podcastId, updates) => {
    const { podcasts } = get()
    const optimisticPodcasts = podcasts.map(p => 
      p.id === podcastId ? { ...p, ...updates, _optimistic: true } : p
    )
    set({ podcasts: optimisticPodcasts })
  },

  // Batch updates for multiple podcasts
  batchUpdatePodcasts: (updates) => {
    const { podcasts } = get()
    const updatedPodcasts = podcasts.map(podcast => {
      const update = updates.find(u => u.id === podcast.id)
      return update ? { ...podcast, ...update, _optimistic: false } : podcast
    })
    set({ podcasts: updatedPodcasts })
  },

  // Preload next batch of data
  preloadData: async (token, offset = 0, limit = 20) => {
    try {
      const response = await axios.get(`${API_BASE}/api/podcasts`, {
        params: { offset, limit },
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const { podcasts } = get()
      const newPodcasts = response.data.podcasts || []
      
      // Merge with existing data (avoid duplicates)
      const mergedPodcasts = [...podcasts]
      newPodcasts.forEach(newPodcast => {
        if (!mergedPodcasts.find(p => p.id === newPodcast.id)) {
          mergedPodcasts.push(newPodcast)
        }
      })
      
      set({ podcasts: mergedPodcasts })
      console.log(`📦 Preloaded ${newPodcasts.length} additional podcasts`)
    } catch (error) {
      console.error('Preload failed:', error)
    }
  }
}))

export default usePodcastStore
