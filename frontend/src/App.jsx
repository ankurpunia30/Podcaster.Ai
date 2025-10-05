import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationContainer from './components/NotificationContainer'
// Import pages
import Home from './pages/Home.jsx'
import Landing from './pages/Landing.jsx'
import LearnLanding from './pages/LearnLanding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EpisodeForm from './pages/EpisodeForm.jsx'
import Login from './pages/Login.jsx'
import Benefits from './pages/Benefits.jsx'
import Signup from './pages/Signup.jsx'
import Studio from './pages/Studio.jsx'
import AudioExperience from './pages/AudioExperience.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  const initAuth = useAuthStore(state => state.initAuth)
  
  // Initialize auth state from localStorage on app start
  useEffect(() => {
    initAuth()
  }, [initAuth])

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/learn" element={<LearnLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/create" element={
          <ProtectedRoute>
            <EpisodeForm />
          </ProtectedRoute>
        } />
        <Route path="/studio" element={
          <ProtectedRoute>
            <Studio />
          </ProtectedRoute>
        } />
        <Route path="/audio-experience" element={
          <ProtectedRoute>
            <AudioExperience />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
      </Routes>
      
      {/* Global UI Components */}
      <NotificationContainer />
    </BrowserRouter>
  )
}


