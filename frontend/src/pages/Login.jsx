import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'
import { useNotificationStore } from '../store/useNotificationStore'

export default function Login() {
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = sp.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore(state => state.login)
  const { success, error: notifyError } = useNotificationStore()

  // Daily podcast facts that rotate based on the day
  const getDailyFact = () => {
    const facts = [
      "🎯 Did you know? The average podcast listener subscribes to 6 shows and listens for 7+ hours per week!",
      "📈 Podcasting is growing by 20% annually - it's the fastest-growing media format!",
      "🌍 There are over 4 million podcasts worldwide, but less than 20% publish regularly!",
      "💡 Edison Research found that 80% of podcast listeners finish entire episodes!",
      "🚀 Podcast advertising revenue hit $2 billion in 2023 and is expected to double by 2026!",
      "🎧 75% of podcast listeners discover new products through podcast ads!",
      "⭐ The most successful podcasts publish consistently - weekly shows get 5x more downloads!"
    ];
    
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return facts[dayOfYear % facts.length];
  };

  async function submit(e) {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      const url = `${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/auth/login`
      const res = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }) 
      })
      if (!res.ok) { 
        const j = await res.json().catch(() => ({ message: 'Login failed' }))
        throw new Error(j.message || 'Login failed') 
      }
      const data = await res.json()
      
      login(data.token, data.user)
      success(`Welcome back, ${data.user.email}!`, 'Login Successful')
      
      // Small delay to ensure state is propagated before navigation
      setTimeout(() => {
        nav(next)
      }, 100)
    } catch (err) {
      setError(err.message)
      notifyError(err.message, 'Login Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-black overflow-hidden flex flex-col">
      {/* Navigation */}
      <motion.nav 
        className="bg-black/80 backdrop-blur-xl border-b border-white/10 flex-shrink-0"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 animate-pulse opacity-60"></div>
              <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
                <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Podcaster</span>
          </motion.div>
          
          <motion.a
            href="/"
            className="text-white/70 hover:text-white transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            ← Back to Home
          </motion.a>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="flex h-full">
        {/* Left Side - Daily Podcast Fact */}
        <motion.div 
          className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 relative overflow-hidden"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-32 right-16 w-24 h-24 bg-purple-400/15 rounded-full blur-2xl animate-bounce"></div>
            <div className="absolute top-1/2 right-8 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            {/* Floating elements */}
            <motion.div 
              className="absolute top-1/4 right-1/4 text-3xl opacity-20"
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🎙️
            </motion.div>
            
            <motion.div 
              className="absolute bottom-1/3 left-1/4 text-2xl opacity-20"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            >
              📊
            </motion.div>
            
            <motion.div 
              className="absolute top-2/3 right-1/3 text-2xl opacity-20"
              animate={{ 
                y: [0, -8, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            >
              �
            </motion.div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-6 py-4 text-white">
            <motion.div
              className="mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
                  <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
                </svg>
              </div>
            </motion.div>
            
            {/* Professional Audio Wave Visualization */}
            <motion.div
              className="text-center mb-4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((height, i) => (
                  <motion.div
                    key={i}
                    className="bg-gradient-to-t from-blue-500 to-purple-400 rounded-full"
                    style={{ width: '4px', height: `${height * 6}px` }}
                    animate={{ 
                      scaleY: [1, 1.5, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
            
            <motion.h1
              className="text-3xl font-bold mb-4 leading-tight text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="block text-white">Welcome Back to</span>
              <span className="block bg-gradient-to-r from-blue-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                Podcaster
              </span>
            </motion.h1>

            {/* Daily Fact */}
            <motion.div
              className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-4"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm">💡</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Daily Podcast Insight</h3>
                  <p className="text-xs text-blue-200">Updated every day</p>
                </div>
              </div>
              <p className="text-sm text-blue-100 leading-relaxed">{getDailyFact()}</p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-xl font-bold text-white">4M+</div>
                <div className="text-xs text-blue-200">Active Podcasts</div>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="text-xl font-bold text-white">464M+</div>
                <div className="text-xs text-blue-200">Podcast Listeners</div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          className="w-full lg:w-1/2 bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <motion.div 
              className="absolute top-10 right-10 w-16 h-16 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full blur-xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-16 left-10 w-12 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full blur-xl"
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </div>
          
          <div className="w-full max-w-sm relative z-10">
            <form onSubmit={submit} className="space-y-3">
              {/* Header */}
              <motion.div
                className="text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                {/* Clean Podcast Icon */}
                <motion.div
                  className="text-center mb-3"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </motion.div>
                
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-3 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <svg className="w-5 h-5 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
                    <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1">Welcome Back</h1>
                <p className="text-gray-400 text-xs">Continue your podcast journey</p>
              </motion.div>

              {/* Form Fields */}
              <motion.div
                className="space-y-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <div className="relative">
                  <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">
                    📧 Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
                
                <div className="relative">
                  <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">
                    🔒 Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg backdrop-blur"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="text-red-400 text-xs">{error}</div>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 hover:from-blue-600 hover:via-purple-600 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg py-2.5 font-bold text-white transition-all shadow-lg hover:shadow-blue-500/25 relative overflow-hidden group text-sm"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div 
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <span>🚀 Sign In to Your Studio</span>
                )}
              </motion.button>

              {/* Forgot Password */}
              <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <a href="#" className="text-xs text-purple-400 hover:text-purple-300">
                  Forgot your password?
                </a>
              </motion.div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <motion.button
                  type="button"
                  className="flex items-center justify-center gap-1 px-2 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-all text-xs"
                  whileHover={{ scale: 1.02 }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </motion.button>

                <motion.button
                  type="button"
                  className="flex items-center justify-center gap-1 px-2 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-all text-xs"
                  whileHover={{ scale: 1.02 }}
                >
                  <svg className="w-3 h-3" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </motion.button>
              </div>

              {/* Footer */}
              <div className="text-center pt-1">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <a 
                    href={`/signup?next=${encodeURIComponent(next)}`}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Sign up free
                  </a>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}