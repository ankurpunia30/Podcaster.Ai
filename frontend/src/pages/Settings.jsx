import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'

export default function Settings() {
  const { user, logout } = useAuthStore()
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    audio: {
      quality: 'high',
      autoplay: false,
      volume: 80
    },
    privacy: {
      analytics: true,
      publicProfile: false
    }
  })

  const [activeSection, setActiveSection] = useState('general')

  const sections = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'audio', name: 'Audio', icon: '🔊' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'account', name: 'Account', icon: '👤' },
  ]

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const handleSave = () => {
    // Here you would save to backend/localStorage
    console.log('Saving settings:', settings)
    // Show success notification
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Customize your podcast creation experience</p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-2 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              {/* General Settings */}
              {activeSection === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">General Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Theme
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => updateSetting('theme', '', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
                    >
                      <option value="dark" className="bg-gray-900">Dark</option>
                      <option value="light" className="bg-gray-900">Light</option>
                      <option value="auto" className="bg-gray-900">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Language
                    </label>
                    <select className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white">
                      <option value="en" className="bg-gray-900">English</option>
                      <option value="es" className="bg-gray-900">Spanish</option>
                      <option value="fr" className="bg-gray-900">French</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Audio Settings */}
              {activeSection === 'audio' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Audio Settings</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Audio Quality
                    </label>
                    <select
                      value={settings.audio.quality}
                      onChange={(e) => updateSetting('audio', 'quality', e.target.value)}
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white"
                    >
                      <option value="low" className="bg-gray-900">Low (64 kbps)</option>
                      <option value="medium" className="bg-gray-900">Medium (128 kbps)</option>
                      <option value="high" className="bg-gray-900">High (192 kbps)</option>
                      <option value="premium" className="bg-gray-900">Premium (320 kbps)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Default Volume: {settings.audio.volume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.audio.volume}
                      onChange={(e) => updateSetting('audio', 'volume', parseInt(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Auto-play podcasts</h4>
                      <p className="text-sm text-gray-400">Automatically start playing the next episode</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.audio.autoplay}
                        onChange={(e) => updateSetting('audio', 'autoplay', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Notifications</h2>
                  
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Get notified about podcast updates via email' },
                    { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                    { key: 'marketing', label: 'Marketing Updates', desc: 'Receive news and promotional content' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{item.label}</h4>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.notifications[item.key]}
                          onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Privacy */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Privacy & Data</h2>
                  
                  {[
                    { key: 'analytics', label: 'Usage Analytics', desc: 'Help improve the platform by sharing anonymous usage data' },
                    { key: 'publicProfile', label: 'Public Profile', desc: 'Make your profile and podcasts discoverable to other users' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{item.label}</h4>
                        <p className="text-sm text-gray-400">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.privacy[item.key]}
                          onChange={(e) => updateSetting('privacy', item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* Account */}
              {activeSection === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Account Settings</h2>
                  
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-2">Account Information</h4>
                    <p className="text-gray-400 text-sm mb-4">Email: {user?.email || 'demo@example.com'}</p>
                    <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all">
                      Update Email
                    </button>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <h4 className="text-red-400 font-medium mb-2">Danger Zone</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-white/10 mt-8">
                <motion.button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
