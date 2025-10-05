import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initAuth, token } = useAuthStore()
  const location = useLocation()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Initialize auth state when component mounts
  useEffect(() => {
    const initialize = async () => {
      if (!isAuthenticated) {
        initAuth()
      }
      setIsInitialized(true)
    }
    initialize()
  }, [isAuthenticated, initAuth])
  
  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }
  
  // Check both isAuthenticated and token/localStorage as fallback
  const hasToken = localStorage.getItem('token')
  const hasAuth = isAuthenticated || hasToken
  
  // Only log when there are auth issues for debugging
  if (!hasAuth) {
    console.log('🔒 Auth required - redirecting to login from:', location.pathname)
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  
  return children
}
