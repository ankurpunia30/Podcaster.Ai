import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import usePodcastStore from '../stores/usePodcastStore'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import AudioPlayer from '../components/AudioPlayer'
import SpotifyStylePlayer from '../components/SpotifyStylePlayer'
import APIMonitor from '../components/APIMonitor'
import OptimizedPodcastCard from '../components/OptimizedPodcastCard'
import { VirtualList } from '../hooks/useVirtualScroll.jsx'
import { LazyComponent } from '../hooks/useLazyLoading.jsx'
import { useOptimizedFilter, usePerformanceMonitor } from '../hooks/usePerformance'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  BarElement,
  Filler
)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const AI_SERVICE_BASE = import.meta.env.VITE_AI_SERVICE_BASE || 'http://localhost:8000'

function Dashboard() {
  const { user, token, isAuthenticated, logout } = useAuthStore()
  const { fetchPodcasts, startSmartPolling, stopPolling, podcasts } = usePodcastStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [toastMessage, setToastMessage] = useState('')

  // Debug authentication state
  useEffect(() => {
    console.log('Dashboard Auth State:', { 
      isAuthenticated, 
      hasUser: !!user, 
      hasToken: !!token,
      userEmail: user?.email 
    })
  }, [isAuthenticated, user, token])

  // Fetch initial data and start smart polling
  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login?next=/dashboard')
      return
    }

    // Fetch initial podcast data
    fetchPodcasts(token)

    // Start smart polling (only polls when there are generating podcasts)
    const pollingId = startSmartPolling(token, 15000) // Check every 15 seconds instead of 10

    return () => {
      stopPolling()
    }
  }, [isAuthenticated, token, navigate])

  // Watch for completed podcasts and create notifications
  useEffect(() => {
    const completedPodcasts = podcasts.filter(p => p.status === 'completed')
    
    completedPodcasts.forEach(podcast => {
      const existingNotification = notifications.find(n => 
        n.type === 'podcast_completed' && n.podcast?.id === podcast.id
      )
      
      if (!existingNotification) {
        const newNotification = {
          id: `${podcast.id}_${Date.now()}`,
          type: 'podcast_completed',
          title: 'Podcast Ready! 🎉',
          message: `"${podcast.title}" has been generated and is ready to play.`,
          podcast: podcast,
          timestamp: new Date(),
          read: false
        }
        setNotifications(prev => [newNotification, ...prev].slice(0, 10))
      }
    })
  }, [podcasts])

  // Original polling logic (remove this after testing)
  /*
  // Check for new completed podcasts every 10 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const checkForNewPodcasts = async () => {
      try {
        const token = useAuthStore.getState().token
        if (!token) return

        const response = await axios.get(`${API_BASE}/api/podcasts`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const podcasts = response.data.podcasts || []
        const newlyCompleted = podcasts.filter(podcast => 
          podcast.status === 'completed' && 
          new Date(podcast.updatedAt || podcast.updated_at) > lastCheckedTime
        )

        // Add notifications for newly completed podcasts
        newlyCompleted.forEach(podcast => {
          const notificationExists = notifications.some(n => n.podcastId === podcast._id)
          if (!notificationExists) {
            const newNotification = {
              id: Date.now() + Math.random(),
              podcastId: podcast._id,
              title: 'Podcast Ready!',
              message: `"${podcast.title}" is ready to listen`,
              podcast: podcast,
              timestamp: new Date(),
              read: false
            }
            setNotifications(prev => [newNotification, ...prev].slice(0, 10)) // Keep only latest 10
          }
        })

        setLastCheckedTime(new Date())
      } catch (error) {
        console.error('Failed to check for new podcasts:', error)
      }
    }

    // Check immediately and then every 10 seconds
    checkForNewPodcasts()
    const interval = setInterval(checkForNewPodcasts, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated, lastCheckedTime, notifications])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login?next=/dashboard')
    }
  }, [isAuthenticated, navigate])
  */

  const playTrack = (podcast) => {
    // Ensure the audioUrl is a complete URL
    const fullAudioUrl = podcast.audioUrl?.startsWith('http') 
      ? podcast.audioUrl 
      : `http://localhost:8000/${podcast.audioUrl}`;
    
    console.log('Playing podcast:', podcast.title, 'Audio URL:', fullAudioUrl);
    
    setCurrentTrack({
      ...podcast,
      audioUrl: fullAudioUrl
    })
    setIsPlaying(true)
  }

  const pauseTrack = () => {
    setIsPlaying(false)
  }

  const handlePlayPause = (shouldPlay) => {
    setIsPlaying(shouldPlay)
  }

  const handleNotificationClick = (notification) => {
    // Mark notification as read
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    
    // Play the podcast
    if (notification.podcast) {
      playTrack(notification.podcast)
    }
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Listen for toast messages from QuickGenerate
  useEffect(() => {
    const handleToastMessage = (event) => {
      showToast(event.detail)
    }

    window.addEventListener('showToast', handleToastMessage)
    return () => window.removeEventListener('showToast', handleToastMessage)
  }, [])

  // Add auth status indicator for debugging
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please log in to access the dashboard</p>
          <button 
            onClick={() => navigate('/login?next=/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating podcast-themed elements */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-[0.02]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              opacity: [0.02, 0.05, 0.02],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            <svg className="w-12 h-12 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
              <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
            </svg>
          </motion.div>
        ))}
        {/* Gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 via-purple-900/5 to-indigo-900/5" />
      </div>

      <Header 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        navigate={navigate}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onClearNotifications={clearAllNotifications}
      />
      <main className={`relative z-10 ${currentTrack ? 'pb-24' : ''}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" onPlay={playTrack} />}
          {activeTab === 'analytics' && <AnalyticsTab key="analytics" />}
          {activeTab === 'library' && <LibraryTab key="library" onPlay={playTrack} />}
          {activeTab === 'settings' && <SettingsTab key="settings" />}
        </AnimatePresence>
      </main>

      {/* Spotify-style Global Audio Player */}
      {currentTrack && (
        <SpotifyStylePlayer 
          track={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onClose={() => {
            setCurrentTrack(null);
            setIsPlaying(false);
          }}
        />
      )}

      {/* API Performance Monitor (Development Only) */}
      <APIMonitor />

      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-lg z-50 max-w-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-medium">{toastMessage}</p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function Header({ user, activeTab, setActiveTab, navigate, notifications = [], onNotificationClick, onClearNotifications }) {
  const { logout } = useAuthStore()
  const [showNotifications, setShowNotifications] = useState(false)
  const unreadCount = notifications.filter(n => !n.read).length

  // Listen for tab change events from Quick Actions
  useEffect(() => {
    const handleTabChange = (event) => {
      setActiveTab(event.detail)
    }

    window.addEventListener('changeTab', handleTabChange)
    return () => window.removeEventListener('changeTab', handleTabChange)
  }, [setActiveTab])

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'library', name: 'Library', icon: '🎧' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.header 
      className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <motion.div 
            className="flex items-center gap-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
                <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
              </svg>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">Podcaster</span>
              <p className="text-sm text-gray-400">Creator Studio</p>
            </div>
          </motion.div>

          {/* Search and actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                placeholder="Search podcasts, analytics..." 
                className="bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 w-80 placeholder:text-slate-400 focus:bg-white/10 focus:border-blue-500/50 transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>

            <motion.button
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/create')}
            >
              + Create Podcast
            </motion.button>

            {/* Notifications */}
            <motion.div 
              className="relative notifications-container"
              whileHover={{ scale: 1.05 }}
            >
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 bg-white/5 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
              </button>
              {unreadCount > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {unreadCount}
                </div>
              )}

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-96 bg-black/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <button 
                          onClick={onClearNotifications}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          className={`p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all ${
                            !notification.read ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : ''
                          }`}
                          onClick={() => {
                            onNotificationClick(notification)
                            setShowNotifications(false)
                          }}
                          whileHover={{ x: 4 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">🎧</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-gray-400 text-sm mt-1 truncate">
                                {notification.message}
                              </p>
                              <p className="text-gray-500 text-xs mt-2">
                                {notification.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12l-5 5-5-5z" />
                            </svg>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-400">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="font-medium">No notifications yet</p>
                        <p className="text-sm mt-1">We'll notify you when your podcasts are ready</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.email || 'User'}</p>
                <p className="text-xs text-gray-400">Pro Plan</p>
              </div>
              <div className="relative group">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </motion.div>
                <div className="absolute right-0 top-12 w-48 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    Billing
                  </button>
                  <hr className="border-white/20 my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex space-x-1 bg-white/5 rounded-xl p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
              {activeTab === tab.id && (
                <motion.div
                  className="absolute inset-0 bg-white rounded-xl -z-10"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </nav>
      </div>
    </motion.header>
  )
}

// Overview Tab - Main dashboard view
function OverviewTab({ onPlay }) {
  const { podcasts, loading, fetchPodcasts } = usePodcastStore()
  const { token } = useAuthStore()

  // Fetch podcasts only if not already loaded
  useEffect(() => {
    if (token && podcasts.length === 0) {
      fetchPodcasts(token)
    }
  }, [token, podcasts.length, fetchPodcasts])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-6 py-8 space-y-8"
    >
      {/* Welcome Section */}
      <WelcomeSection podcasts={podcasts} />
      
      {/* Key Metrics */}
      <StatsGrid podcasts={podcasts} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <QuickActionsCard />
          
          {/* Recent Activity */}
          <RecentActivity podcasts={podcasts} />
          
          {/* Performance Overview */}
          <PerformanceOverview podcasts={podcasts} />
        </div>
        
        <div className="space-y-8">
          {/* Creation Tools */}
          <QuickGenerate />
          
          {/* My Podcasts Player */}
          <MyPodcastsPlayer podcasts={podcasts} onPlay={onPlay} />
          
          {/* Upgrade Card */}
          <UpgradeCard />
          
          {/* Tips & Resources */}
          <TipsAndResources />
          
          {/* Community Feed */}
          <CommunityFeed />
        </div>
      </div>
    </motion.div>
  )
}

function WelcomeSection({ podcasts = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')

  // Calculate real progress
  const totalPodcasts = podcasts.length
  const completedPodcasts = podcasts.filter(p => p.status === 'completed').length
  const generatingPodcasts = podcasts.filter(p => p.status === 'generating').length
  const goalTarget = 10 // Daily goal
  const progressPercentage = Math.min((completedPodcasts / goalTarget) * 100, 100)

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting('Good morning')
      else if (hour < 17) setGreeting('Good afternoon')
      else setGreeting('Good evening')
    }

    // Update greeting immediately
    updateGreeting()
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      updateGreeting() // Also update greeting in case time crosses boundary
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <motion.section 
      className="relative overflow-hidden bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-white/10 rounded-3xl p-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {greeting}! 👋
            </h1>
            <p className="text-xl text-gray-300">
              {totalPodcasts > 0 ? 'Keep up the great work!' : 'Ready to create something amazing today?'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono text-blue-400">
              {currentTime.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div 
            className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <p className="font-semibold text-white">Progress Goal</p>
                <p className="text-sm text-gray-400">{goalTarget} podcasts target</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {completedPodcasts} of {goalTarget} completed ({Math.round(progressPercentage)}%)
            </p>
          </motion.div>

          <motion.div 
            className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <p className="font-semibold text-white">Processing</p>
                <p className="text-sm text-gray-400">AI is working</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {generatingPodcasts > 0 ? (
                <>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-blue-400">{generatingPodcasts} podcasts in queue</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No active processing</p>
              )}
            </div>
          </motion.div>

          <motion.div 
            className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <p className="font-semibold text-white">Achievement</p>
                <p className="text-sm text-gray-400">Total created</p>
              </div>
            </div>
            <p className="text-sm text-purple-400">
              {totalPodcasts > 0 ? `${totalPodcasts} podcasts created! 🎉` : 'Ready to start creating! ✨'}
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{
              left: `${20 + i * 20}%`,
              top: `${10 + (i % 2) * 60}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </motion.section>
  )
}

function StatsGrid({ podcasts = [] }) {
  // Calculate real stats from podcasts data
  const totalPodcasts = podcasts.length
  const completedPodcasts = podcasts.filter(p => p.status === 'completed').length
  const totalPlays = podcasts.reduce((sum, p) => sum + (p.plays || 0), 0)
  const avgRating = podcasts.length > 0 ? 
    (podcasts.reduce((sum, p) => sum + (p.rating || 0), 0) / podcasts.length).toFixed(1) : '0.0'
  const generatingPodcasts = podcasts.filter(p => p.status === 'generating').length

  const stats = [
    {
      label: "Total Podcasts",
      value: totalPodcasts,
      change: totalPodcasts > 0 ? "+100%" : null,
      changeType: "positive",
      icon: "🎙️",
      color: "blue",
      description: "All created podcasts"
    },
    {
      label: "Completed",
      value: completedPodcasts,
      change: completedPodcasts > 0 ? `${Math.round((completedPodcasts/totalPodcasts) * 100)}%` : null,
      changeType: "positive", 
      icon: "✅",
      color: "green",
      description: "Ready to listen"
    },
    {
      label: "Total Plays",
      value: totalPlays,
      change: totalPlays > 0 ? "+100%" : null,
      changeType: "positive",
      icon: "▶️",
      color: "purple",
      description: "Across all podcasts"
    },
    {
      label: "Generating",
      value: generatingPodcasts,
      change: generatingPodcasts > 0 ? "Active" : null,
      changeType: generatingPodcasts > 0 ? "positive" : "neutral",
      icon: "⏳",
      color: "yellow",
      description: "Currently processing"
    },
    {
      label: "Avg. Rating",
      value: `${avgRating}/5`,
      change: avgRating > 0 ? "+0.0" : null,
      changeType: "positive",
      icon: "⭐",
      color: "orange",
      description: "User feedback"
    },
    {
      label: "Success Rate",
      value: totalPodcasts > 0 ? `${Math.round((completedPodcasts/totalPodcasts) * 100)}%` : "0%",
      change: completedPodcasts > 0 ? "+100%" : null,
      changeType: "positive",
      icon: "📈",
      color: "indigo",
      description: "Completion rate"
    }
  ]

  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30'
  }

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} colorClass={colorClasses[stat.color]} index={index} />
      ))}
    </section>
  )
}

function StatCard({ stat, colorClass, index }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100)
    return () => clearTimeout(timer)
  }, [index])

  useEffect(() => {
    if (!isVisible) return
    
    let startValue = 0
    const targetValue = typeof stat.value === 'string' 
      ? parseInt(stat.value.replace(/[^\d]/g, '')) || 0
      : stat.value
    
    const duration = 1500
    const increment = targetValue / (duration / 16)
    
    const timer = setInterval(() => {
      startValue += increment
      if (startValue >= targetValue) {
        setDisplayValue(targetValue)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(startValue))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, stat.value])

  const formatDisplayValue = (value) => {
    if (typeof stat.value === 'string') {
      if (stat.value.includes('$')) return `$${value.toLocaleString()}`
      if (stat.value.includes('h')) return `${value.toLocaleString()}h`
      if (stat.value.includes('/')) return stat.value
      if (stat.value.includes('%')) return `${value}%`
    }
    return value.toLocaleString()
  }

  return (
    <motion.div
      className={`relative overflow-hidden bg-gradient-to-br ${colorClass} border rounded-2xl p-6 hover:scale-105 transition-all duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl">{stat.icon}</div>
        <div className={`text-sm px-2 py-1 rounded-full ${
          stat.changeType === 'positive' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {stat.change}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-3xl font-bold text-white mb-1">
          {formatDisplayValue(displayValue)}
        </div>
        <div className="text-sm font-medium text-gray-200">
          {stat.label}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {stat.description}
        </div>
      </div>

      {/* Animated background element */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-white/5 rounded-full" />
    </motion.div>
  )
}

function QuickActionsCard() {
  const navigate = useNavigate()
  const [isCreating, setIsCreating] = useState(false)
  
  const actions = [
    {
      title: "Create New Podcast",
      description: "Start with AI-powered script generation",
      icon: "🎙️",
      color: "blue",
      action: () => {
        setIsCreating(true)
        setTimeout(() => {
          navigate('/create')
          setIsCreating(false)
        }, 500)
      }
    },
    {
      title: "View Analytics",
      description: "Check your podcast performance", 
      icon: "�",
      color: "green",
      action: () => {
        // Scroll to top and change tab to analytics
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => {
          // Trigger analytics tab via custom event
          const event = new CustomEvent('changeTab', { detail: 'analytics' })
          window.dispatchEvent(event)
        }, 300)
      }
    },
    {
      title: "Manage Library",
      description: "Browse and organize your podcasts",
      icon: "�",
      color: "purple",
      action: () => {
        // Scroll to top and change tab to library
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => {
          // Trigger library tab via custom event
          const event = new CustomEvent('changeTab', { detail: 'library' })
          window.dispatchEvent(event)
        }, 300)
      }
    },
    {
      title: "Account Settings",
      description: "Update your profile and preferences",
      icon: "⚙️",
      color: "orange",
      action: () => {
        // Scroll to top and change tab to settings
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => {
          // Trigger settings tab via custom event
          const event = new CustomEvent('changeTab', { detail: 'settings' })
          window.dispatchEvent(event)
        }, 300)
      }
    }
  ]

  return (
    <motion.section 
      className="bg-white/5 border border-white/10 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">⚡</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Quick Actions</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            onClick={action.action}
            disabled={isCreating && action.title.includes('Create')}
            className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isCreating && action.title.includes('Create') ? 1 : 1.02, y: isCreating && action.title.includes('Create') ? 0 : -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {isCreating && action.title.includes('Create') ? (
                  <div className="w-6 h-6 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                ) : (
                  action.icon
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {isCreating && action.title.includes('Create') ? 'Creating...' : action.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  {action.description}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.section>
  )
}

function RecentActivity({ podcasts = [] }) {
  // Get the 5 most recent podcasts
  const recentPodcasts = podcasts
    .sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0))
    .slice(0, 5)
    .map(podcast => ({
      title: podcast.title,
      time: new Date(podcast.createdAt || podcast.created_at).toLocaleDateString(),
      status: podcast.status,
      plays: podcast.plays || 0,
      icon: podcast.status === 'completed' ? '✅' : 
            podcast.status === 'generating' ? '⏳' : 
            podcast.status === 'failed' ? '❌' : '🎙️'
    }))

  return (
    <motion.section 
      className="bg-white/5 border border-white/10 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <span className="text-lg">📝</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
        </div>
        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {recentPodcasts.length > 0 ? (
          recentPodcasts.map((activity, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ x: 4 }}
            >
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <h4 className="font-medium text-white">{activity.title}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-sm text-gray-400">{activity.time}</p>
                  {activity.plays > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                      {activity.plays} plays
                    </span>
                  )}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                activity.status === 'completed' 
                  ? 'bg-green-500/20 text-green-400'
                  : activity.status === 'generating'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : activity.status === 'failed'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {activity.status}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📝</div>
            <p className="font-medium">No recent activity</p>
            <p className="text-sm mt-1">Create your first podcast to see activity here</p>
          </div>
        )}
      </div>
    </motion.section>
  )
}

function PerformanceOverview({ podcasts = [] }) {
  // Generate chart data based on real podcast data
  const hasData = podcasts.length > 0 && podcasts.some(p => p.plays > 0)
  
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Listens',
        data: hasData ? [1200, 1900, 1700, 2400, 2000, 2800, 3100] : [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgba(59, 130, 246, 0.3)',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Podcasts Created',
        data: hasData ? [2, 4, 3, 6, 5, 8, 7] : [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgba(168, 85, 247, 0.3)',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        tension: 0.4,
        fill: true,
      }
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(156, 163, 175, 0.4)',
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        enabled: false
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.6)',
        }
      },
    },
  }

  return (
    <motion.section 
      className="bg-white/5 border border-white/10 rounded-2xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">📈</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Performance Overview</h3>
      </div>
      {/* Blurred chart background with overlay */}
      <div className="h-64 relative">
        <div className="absolute inset-0 opacity-20 blur-sm">
          <Line data={data} options={options} />
        </div>
        
        {/* Overlay with message */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-semibold text-white mb-1">No Data Available</p>
            <p className="text-sm text-gray-400">Your analytics will appear here once you create podcasts</p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function QuickGenerate() {
  const [topic, setTopic] = useState('')
  const [voice, setVoice] = useState('Nova')
  const [style, setStyle] = useState('conversational')
  const [duration, setDuration] = useState('5-8') // New field for duration
  const [targetAudience, setTargetAudience] = useState('general') // New field for audience
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { addPodcast } = usePodcastStore()

  const voices = [
    { name: 'Nova', accent: 'US English', gender: 'Female' },
    { name: 'Orion', accent: 'British English', gender: 'Male' },
    { name: 'Lyra', accent: 'Australian English', gender: 'Female' },
    { name: 'Atlas', accent: 'Canadian English', gender: 'Male' },
  ]

  const styles = ['conversational', 'professional', 'energetic', 'educational']
  
  const durations = [
    { value: '3-5', label: '3-5 minutes (Quick)' },
    { value: '5-8', label: '5-8 minutes (Standard)' },
    { value: '8-12', label: '8-12 minutes (Extended)' },
    { value: '12-15', label: '12-15 minutes (Deep Dive)' }
  ]
  
  const audiences = [
    { value: 'general', label: 'General Audience' },
    { value: 'professional', label: 'Professional/Business' },
    { value: 'academic', label: 'Academic/Educational' },
    { value: 'casual', label: 'Casual/Entertainment' },
    { value: 'technical', label: 'Technical/Expert' }
  ]

  const handleGenerate = async () => {
    if (!topic.trim()) return
    
    console.log('QuickGenerate: Starting generation with token:', token ? 'present' : 'missing')
    console.log('QuickGenerate: User:', user)
    
    if (!token) {
      setError('Authentication required. Please log in again.')
      return
    }
    
    setIsGenerating(true)
    setError('')
    
    try {
      // Extract duration numbers for API
      const durationMinutes = parseInt(duration.split('-')[1]) || 8 // Use max duration as target
      
      const response = await axios.post(`${API_BASE}/api/podcasts/generate`, {
        topic: topic.trim(),
        style: style,
        voice: voice,
        speed: 1.0,
        duration: durationMinutes,
        targetAudience: targetAudience
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data) {
        // Add the new podcast to the store for immediate UI update
        if (response.data.id) {
          addPodcast({
            id: response.data.id,
            title: topic.trim(),
            status: 'generating',
            topic: topic.trim(),
            style: style,
            voice: voice,
            duration: '0:00',
            createdAt: new Date().toISOString(),
            audioUrl: null
          })
        }
        
        // Clear form but keep preferences
        setTopic('')
        
        // Show success message
        setTimeout(() => {
          // Trigger toast message
          const event = new CustomEvent('showToast', { 
            detail: `"${topic.trim()}" is being generated (~${durationMinutes} min). You'll be notified when it's ready!` 
          })
          window.dispatchEvent(event)
        }, 500)
      } else {
        throw new Error(response.data.message || 'Failed to create podcast')
      }
    } catch (error) {
      console.error('Failed to generate podcast:', error)
      
      if (error.response?.status === 401) {
        setError('Authentication expired. Please log in again.')
        // Optionally redirect to login
        setTimeout(() => {
          navigate('/login?next=/dashboard')
        }, 2000)
      } else {
        setError(error.response?.data?.message || 'Failed to generate podcast. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <motion.section 
      className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">🚀</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Quick Generate</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Podcast Topic
          </label>
          <input 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The Future of AI in Healthcare"
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            AI Voice
          </label>
          <select 
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name} className="bg-gray-900">
                {v.name} - {v.accent} ({v.gender})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Style
          </label>
          <select 
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            {styles.map((s) => (
              <option key={s} value={s} className="bg-gray-900 capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Podcast Length
          </label>
          <select 
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            {durations.map((d) => (
              <option key={d.value} value={d.value} className="bg-gray-900">
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Audience
          </label>
          <select 
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            {audiences.map((a) => (
              <option key={a.value} value={a.value} className="bg-gray-900">
                {a.label}
              </option>
            ))}
          </select>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <span>{error}</span>
            </p>
          </div>
        )}
        
        <motion.button
          onClick={handleGenerate}
          disabled={!topic.trim() || isGenerating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: isGenerating ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Creating Podcast...
            </div>
          ) : (
            'Generate Podcast ✨'
          )}
        </motion.button>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <p className="text-xs text-green-400 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>Pro tip: Be specific with your topic for best results. Your podcast will appear in the Library tab once generated.</span>
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function MyPodcastsPlayer({ podcasts = [], onPlay }) {
  const [selectedPodcast, setSelectedPodcast] = useState(null)
  
  // Default demo podcast that's always available
  const demoPodcast = {
    _id: 'demo-podcast-1',
    title: 'Welcome to AI Podcasting',
    description: 'A demo podcast showcasing our AI-powered podcast generation',
    status: 'completed',
    audioUrl: 'https://www.soundjay.com/misc/sounds/magic-chime-02.wav', // Demo audio
    audio_url: 'https://www.soundjay.com/misc/sounds/magic-chime-02.wav',
    style: 'conversational',
    plays: 42,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
    isDemo: true
  }
  
  // Filter completed podcasts that have audio
  const availablePodcasts = podcasts.filter(p => 
    p.status === 'completed' && (p.audioUrl || p.audio_url)
  )
  
  // Combine demo podcast with user podcasts (demo first)
  const allAvailablePodcasts = [demoPodcast, ...availablePodcasts]
  
  // Get the most recent 5 podcasts for the player (including demo)
  const recentPodcasts = allAvailablePodcasts
    .sort((a, b) => {
      // Keep demo at top, then sort by date
      if (a.isDemo && !b.isDemo) return -1
      if (!a.isDemo && b.isDemo) return 1
      return new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
    })
    .slice(0, 5)

  const handlePlay = (podcast) => {
    setSelectedPodcast(podcast)
    onPlay(podcast)
  }

  return (
    <motion.section 
      className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-2xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">🎧</span>
        </div>
        <h3 className="text-xl font-semibold text-white">My Podcasts Player</h3>
        <span className="text-sm text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
          {allAvailablePodcasts.length} available
        </span>
      </div>
      
      <div className="space-y-3">
        {recentPodcasts.map((podcast, index) => (
          <motion.div
            key={podcast._id || index}
            className={`group p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer ${
              selectedPodcast?._id === podcast._id ? 'bg-green-500/10 border-green-500/30' : ''
            } ${podcast.isDemo ? 'border-blue-400/30 bg-blue-500/5' : ''}`}
            onClick={() => handlePlay(podcast)}
            whileHover={{ x: 4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${podcast.isDemo ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-green-500 to-blue-500'} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {selectedPodcast?._id === podcast._id ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </motion.div>
                ) : (
                  <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white group-hover:text-green-400 transition-colors truncate">
                    {podcast.title}
                  </h4>
                  {podcast.isDemo && (
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                      DEMO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400 capitalize">
                    {podcast.style || 'conversational'}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    {podcast.plays || 0} plays
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">
                    {new Date(podcast.createdAt || podcast.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {selectedPodcast?._id === podcast._id && (
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="w-1 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-4 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
                <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {allAvailablePodcasts.length > 5 && (
        <motion.button
          className="w-full mt-4 py-2 text-sm text-green-400 hover:text-green-300 transition-colors border border-green-500/30 rounded-lg hover:bg-green-500/10"
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            // Trigger library tab switch to see all podcasts
            const event = new CustomEvent('changeTab', { detail: 'library' })
            window.dispatchEvent(event)
          }}
        >
          View All {allAvailablePodcasts.length} Podcasts →
        </motion.button>
      )}
      
      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
        <p className="text-xs text-green-400 flex items-start gap-2">
          <span className="text-sm">🎵</span>
          <span>
            {availablePodcasts.length > 0 
              ? "Click any podcast to start playing. Your audio will appear in the player at the bottom of the screen."
              : "Try our demo podcast above! Create your own podcasts and they'll appear here with the demo."
            }
          </span>
        </p>
      </div>
    </motion.section>
  )
}

// Analytics Tab - Shows performance metrics and charts
function AnalyticsTab() {
  const { podcasts, loading, fetchPodcasts } = usePodcastStore()
  const { token } = useAuthStore()

  // Fetch podcasts only if not already loaded
  useEffect(() => {
    if (token && podcasts.length === 0) {
      fetchPodcasts(token)
    }
  }, [token, podcasts.length, fetchPodcasts])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-6 py-8 space-y-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Track your podcast performance and growth</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <StatsGrid podcasts={podcasts} />
          <div className="grid lg:grid-cols-2 gap-8">
            <PerformanceOverview podcasts={podcasts} />
            <RecentActivity podcasts={podcasts} />
          </div>
        </>
      )}
    </motion.div>
  )
}

// Library Tab - Shows all user's podcasts with virtual scrolling
function LibraryTab({ onPlay }) {
  const { podcasts, loading, fetchPodcasts } = usePodcastStore()
  const { token } = useAuthStore()
  const { markRenderStart } = usePerformanceMonitor('LibraryTab')
  
  const [filterState, setFilterState] = useState({
    status: 'all',
    search: '',
    sortBy: { field: 'createdAt', direction: 'desc' }
  })

  const { filteredData: filteredPodcasts, isLoading: isFiltering } = useOptimizedFilter(
    podcasts, 
    filterState
  )

  useEffect(() => {
    markRenderStart()
    if (token && podcasts.length === 0) {
      fetchPodcasts(token)
    }
  }, [token, podcasts.length, fetchPodcasts, markRenderStart])

  const renderPodcastItem = useCallback((podcast, index) => (
    <OptimizedPodcastCard
      key={podcast.id}
      podcast={podcast}
      onPlay={onPlay}
      showDetails={true}
    />
  ), [onPlay])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-6 py-8 space-y-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
          <p className="text-gray-400">Manage and listen to your podcasts</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={filterState.status}
            onChange={(e) => setFilterState(prev => ({ ...prev, status: e.target.value }))}
            className="bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white"
          >
            <option value="all" className="bg-gray-900">All Podcasts</option>
            <option value="completed" className="bg-gray-900">Completed</option>
            <option value="generating" className="bg-gray-900">Generating</option>
            <option value="failed" className="bg-gray-900">Failed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      ) : filteredPodcasts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPodcasts.map((podcast, index) => (
            <motion.div
              key={podcast._id}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2 truncate">{podcast.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{podcast.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  podcast.status === 'completed' 
                    ? 'bg-green-500/20 text-green-400'
                    : podcast.status === 'generating'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {podcast.status}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>{podcast.plays || 0} plays</span>
                  <span>{new Date(podcast.createdAt || podcast.created_at).toLocaleDateString()}</span>
                </div>
                
                {podcast.status === 'completed' && (podcast.audioUrl || podcast.audio_url) && (
                  <button
                    onClick={() => onPlay(podcast)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-4">🎙️</div>
          <h3 className="text-xl font-semibold text-white mb-2">No podcasts found</h3>
          <p className="mb-6">Create your first podcast to get started</p>
          <button
            onClick={() => {
              const event = new CustomEvent('changeTab', { detail: 'overview' })
              window.dispatchEvent(event)
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Create Podcast
          </button>
        </div>
      )}
    </motion.div>
  )
}

// Settings Tab - User account and app settings
function SettingsTab() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    notifications: true,
    autoPlay: false,
    theme: 'dark'
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-6 py-8 space-y-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account and preferences</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Account Settings */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Account</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input 
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-gray-400"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plan</label>
              <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 font-medium">Pro Plan</p>
                <p className="text-sm text-gray-400">Unlimited podcast generation</p>
              </div>
            </div>
          </div>
        </div>

        {/* App Preferences */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Push Notifications</p>
                <p className="text-sm text-gray-400">Get notified when podcasts are ready</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Auto-play</p>
                <p className="text-sm text-gray-400">Automatically play next podcast</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => setSettings({...settings, autoPlay: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h3>
        <p className="text-gray-400 mb-4">These actions cannot be undone.</p>
        
        <div className="flex gap-4">
          <button
            onClick={handleLogout}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
          
          <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// Additional helper components that are referenced but missing
function UpgradeCard() {
  return (
    <motion.section 
      className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-yellow-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">⭐</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Pro Features</h3>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-green-400">✅</span>
          Unlimited podcast generation
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-green-400">✅</span>
          Advanced analytics
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-green-400">✅</span>
          Priority processing
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-green-400">✅</span>
          Custom voices
        </div>
      </div>
      
      <p className="text-xs text-green-400 bg-green-500/20 px-3 py-2 rounded-lg">
        🎉 You're already on Pro! Enjoy all features.
      </p>
    </motion.section>
  )
}

function TipsAndResources() {
  const tips = [
    {
      title: "Better Topics",
      tip: "Be specific with your podcast topics for more engaging content",
      icon: "💡"
    },
    {
      title: "Voice Selection",
      tip: "Choose different voices to match your content style",
      icon: "🎤"
    },
    {
      title: "Optimal Length",
      tip: "Keep topics focused for 5-15 minute podcasts",
      icon: "⏱️"
    }
  ]

  return (
    <motion.section 
      className="bg-white/5 border border-white/10 rounded-2xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">💡</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Tips & Resources</h3>
      </div>
      
      <div className="space-y-4">
        {tips.map((tip, index) => (
          <div key={index} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
            <div className="flex items-start gap-3">
              <span className="text-lg">{tip.icon}</span>
              <div>
                <h4 className="font-medium text-white mb-1">{tip.title}</h4>
                <p className="text-sm text-gray-400">{tip.tip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

function CommunityFeed() {
  const posts = [
    {
      user: "Sarah M.",
      content: "Just created my first AI podcast about sustainable living! The quality is amazing 🌱",
      time: "2h ago"
    },
    {
      user: "Tech Guru",
      content: "Pro tip: Using specific examples in your topics creates more engaging content",
      time: "4h ago"
    },
    {
      user: "Pod Creator",
      content: "Hit 1000+ total plays today! Thanks to this amazing platform 🎉",
      time: "6h ago"
    }
  ]

  return (
    <motion.section 
      className="bg-white/5 border border-white/10 rounded-2xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
          <span className="text-lg">👥</span>
        </div>
        <h3 className="text-xl font-semibold text-white">Community</h3>
      </div>
      
      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div 
            key={index}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            whileHover={{ x: 2 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {post.user[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-white text-sm">{post.user}</span>
                  <span className="text-xs text-gray-500">{post.time}</span>
                </div>
                <p className="text-sm text-gray-300">{post.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30 rounded-lg hover:bg-blue-500/10">
        Join Community →
      </button>
    </motion.section>
  )
}

export default Dashboard