import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * Hook for Web Worker integration
 */
export const useWebWorker = (workerScript) => {
  const workerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    workerRef.current = new Worker(workerScript)
    
    workerRef.current.onmessage = (e) => {
      const { type } = e.data
      if (type.includes('ERROR')) {
        setError(e.data.error)
        setIsLoading(false)
      } else if (type.includes('COMPLETE')) {
        setIsLoading(false)
      }
    }

    workerRef.current.onerror = (error) => {
      setError(error.message)
      setIsLoading(false)
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
      }
    }
  }, [workerScript])

  const postMessage = useCallback((data) => {
    if (workerRef.current) {
      setIsLoading(true)
      setError(null)
      workerRef.current.postMessage(data)
    }
  }, [])

  return { postMessage, isLoading, error }
}

/**
 * Hook for optimized filtering with Web Worker
 */
export const useOptimizedFilter = (data = [], initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters)
  const [filteredData, setFilteredData] = useState(data)
  const { postMessage, isLoading } = useWebWorker('/data-worker.js')
  
  const workerRef = useRef()
  
  useEffect(() => {
    const worker = new Worker('/data-worker.js')
    workerRef.current = worker
    
    worker.onmessage = (e) => {
      if (e.data.type === 'FILTER_COMPLETE') {
        setFilteredData(e.data.data)
      }
    }
    
    return () => worker.terminate()
  }, [])

  useEffect(() => {
    if (data.length > 100) {
      // Use Web Worker for large datasets
      workerRef.current?.postMessage({
        type: 'FILTER_PODCASTS',
        data: { podcasts: data, filters }
      })
    } else {
      // Use main thread for small datasets
      setFilteredData(data.filter(item => {
        if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
          return false
        }
        if (filters.search && !item.title?.toLowerCase().includes(filters.search.toLowerCase())) {
          return false
        }
        return true
      }))
    }
  }, [data, filters])

  return {
    filteredData,
    filters,
    setFilters,
    isLoading
  }
}

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(Date.now())
  const renderCount = useRef(0)

  useEffect(() => {
    renderCount.current++
    const renderTime = Date.now() - renderStartTime.current
    
    if (renderTime > 16) { // Longer than 1 frame (60fps)
      console.warn(`${componentName} slow render: ${renderTime}ms (render #${renderCount.current})`)
    }
    
    renderStartTime.current = Date.now()
  })

  const markRenderStart = useCallback(() => {
    renderStartTime.current = Date.now()
  }, [])

  return { markRenderStart, renderCount: renderCount.current }
}

/**
 * Hook for request batching
 */
export const useRequestBatch = (batchSize = 10, delay = 100) => {
  const batchRef = useRef([])
  const timeoutRef = useRef(null)

  const addToBatch = useCallback((request) => {
    batchRef.current.push(request)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      if (batchRef.current.length > 0) {
        const batch = [...batchRef.current]
        batchRef.current = []
        
        // Process batch
        processBatch(batch)
      }
    }, delay)
    
    if (batchRef.current.length >= batchSize) {
      clearTimeout(timeoutRef.current)
      const batch = [...batchRef.current]
      batchRef.current = []
      processBatch(batch)
    }
  }, [batchSize, delay])

  const processBatch = async (batch) => {
    try {
      // Group similar requests
      const grouped = batch.reduce((acc, req) => {
        const key = `${req.method}_${req.url}`
        if (!acc[key]) acc[key] = []
        acc[key].push(req)
        return acc
      }, {})

      // Execute grouped requests
      await Promise.all(
        Object.entries(grouped).map(([key, requests]) => {
          if (requests.length === 1) {
            return requests[0].execute()
          } else {
            // Batch similar requests
            return executeBatchRequest(requests)
          }
        })
      )
    } catch (error) {
      console.error('Batch request failed:', error)
    }
  }

  const executeBatchRequest = async (requests) => {
    // Implementation depends on your API's batch capabilities
    console.log(`Executing batch of ${requests.length} similar requests`)
    return Promise.all(requests.map(req => req.execute()))
  }

  return { addToBatch }
}

/**
 * Hook for intelligent prefetching
 */
export const usePrefetch = (prefetchFn, dependencies = []) => {
  const prefetchedRef = useRef(new Set())
  
  const prefetch = useCallback((key) => {
    if (!prefetchedRef.current.has(key)) {
      prefetchedRef.current.add(key)
      
      // Prefetch during idle time
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => prefetchFn(key))
      } else {
        setTimeout(() => prefetchFn(key), 0)
      }
    }
  }, [prefetchFn])

  const clearPrefetchCache = useCallback(() => {
    prefetchedRef.current.clear()
  }, [])

  return { prefetch, clearPrefetchCache }
}
