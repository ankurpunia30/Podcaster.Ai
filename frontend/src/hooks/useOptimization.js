import { useCallback, useRef } from 'react'

/**
 * Hook to debounce function calls
 * Prevents rapid successive API calls
 */
export const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null)
  
  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])
  
  return [debouncedCallback, cancel]
}

/**
 * Hook to throttle function calls
 * Limits API calls to maximum frequency
 */
export const useThrottle = (callback, delay = 1000) => {
  const lastCallRef = useRef(0)
  
  const throttledCallback = useCallback((...args) => {
    const now = Date.now()
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now
      return callback(...args)
    }
  }, [callback, delay])
  
  return throttledCallback
}

/**
 * Hook for request deduplication
 * Prevents duplicate API calls with same parameters
 */
export const useRequestDeduplication = () => {
  const pendingRequestsRef = useRef(new Map())
  
  const makeRequest = useCallback(async (key, requestFn) => {
    // If request is already pending, return the existing promise
    if (pendingRequestsRef.current.has(key)) {
      console.log(`🔄 Deduplicating request for key: ${key}`)
      return pendingRequestsRef.current.get(key)
    }
    
    // Create new request promise
    const requestPromise = requestFn()
      .finally(() => {
        // Clean up when request completes
        pendingRequestsRef.current.delete(key)
      })
    
    // Store the promise
    pendingRequestsRef.current.set(key, requestPromise)
    
    return requestPromise
  }, [])
  
  const clearPendingRequests = useCallback(() => {
    pendingRequestsRef.current.clear()
  }, [])
  
  return { makeRequest, clearPendingRequests }
}
