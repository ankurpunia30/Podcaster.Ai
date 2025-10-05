import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotificationStore } from '../store/useNotificationStore'

const iconMap = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️'
}

const colorMap = {
  success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  error: 'from-red-500/20 to-pink-500/20 border-red-500/30',
  warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
  info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
}

function Notification({ notification }) {
  const removeNotification = useNotificationStore(state => state.removeNotification)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      className={`bg-gradient-to-r ${colorMap[notification.type]} border rounded-2xl p-4 shadow-2xl backdrop-blur-xl max-w-sm w-full`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{iconMap[notification.type]}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white text-sm">{notification.title}</h4>
          {notification.message && (
            <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
          )}
        </div>
        <button
          onClick={() => removeNotification(notification.id)}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

export default function NotificationContainer() {
  const notifications = useNotificationStore(state => state.notifications)
  
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <Notification key={notification.id} notification={notification} />
        ))}
      </AnimatePresence>
    </div>
  )
}
