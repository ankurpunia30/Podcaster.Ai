import { useState, useEffect } from 'react'

/**
 * Development component to monitor API call performance
 * Only shows in development mode
 */
export default function APIMonitor() {
  const [apiCalls, setApiCalls] = useState([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only show in development
    if (import.meta.env.MODE !== 'development') return

    let callCount = 0
    const originalFetch = window.fetch
    const originalAxios = window.axios?.request

    // Monitor fetch calls
    window.fetch = async (...args) => {
      const startTime = Date.now()
      const callId = ++callCount
      
      setApiCalls(prev => [...prev, {
        id: callId,
        url: args[0],
        method: args[1]?.method || 'GET',
        startTime,
        status: 'pending'
      }].slice(-20)) // Keep last 20 calls

      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()
        
        setApiCalls(prev => prev.map(call => 
          call.id === callId 
            ? { ...call, status: response.status, duration: endTime - startTime, endTime }
            : call
        ))
        
        return response
      } catch (error) {
        const endTime = Date.now()
        
        setApiCalls(prev => prev.map(call => 
          call.id === callId 
            ? { ...call, status: 'error', duration: endTime - startTime, endTime, error: error.message }
            : call
        ))
        
        throw error
      }
    }

    // Cleanup
    return () => {
      window.fetch = originalFetch
      if (originalAxios) window.axios.request = originalAxios
    }
  }, [])

  if (import.meta.env.MODE !== 'development') return null

  const totalCalls = apiCalls.length
  const pendingCalls = apiCalls.filter(call => call.status === 'pending').length
  const avgDuration = apiCalls
    .filter(call => call.duration)
    .reduce((sum, call, _, arr) => sum + call.duration / arr.length, 0)

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-600 transition-colors"
      >
        API Monitor ({totalCalls})
      </button>
      
      {isVisible && (
        <div className="absolute top-12 right-0 bg-black/90 backdrop-blur text-white p-4 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">API Call Monitor</h3>
            <button 
              onClick={() => setApiCalls([])}
              className="text-xs bg-red-500 px-2 py-1 rounded hover:bg-red-600"
            >
              Clear
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs mb-3 p-2 bg-white/10 rounded">
            <div>
              <div className="text-gray-300">Total</div>
              <div className="font-bold">{totalCalls}</div>
            </div>
            <div>
              <div className="text-gray-300">Pending</div>
              <div className="font-bold text-yellow-400">{pendingCalls}</div>
            </div>
            <div>
              <div className="text-gray-300">Avg Time</div>
              <div className="font-bold">{Math.round(avgDuration)}ms</div>
            </div>
          </div>
          
          <div className="space-y-2 text-xs">
            {apiCalls.slice().reverse().map(call => (
              <div
                key={call.id}
                className={`p-2 rounded border-l-2 ${
                  call.status === 'pending' 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : call.status >= 200 && call.status < 300
                    ? 'border-green-400 bg-green-400/10'
                    : 'border-red-400 bg-red-400/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {call.method} {call.url.replace(import.meta.env.VITE_API_BASE || '', '')}
                    </div>
                    <div className="text-gray-400">
                      {new Date(call.startTime).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <div className={`font-bold ${
                      call.status === 'pending' ? 'text-yellow-400' :
                      call.status >= 200 && call.status < 300 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {call.status === 'pending' ? '...' : call.status}
                    </div>
                    {call.duration && (
                      <div className="text-gray-300">{call.duration}ms</div>
                    )}
                  </div>
                </div>
                {call.error && (
                  <div className="text-red-300 text-xs mt-1 truncate">{call.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
