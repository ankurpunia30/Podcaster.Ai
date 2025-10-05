import React from 'react'
import { motion } from 'framer-motion'
import { isDemoMode } from '../utils/demoApi'

export default function DemoBanner() {
  if (!isDemoMode()) return null
  
  return (
    <motion.div 
      className="fixed top-4 left-4 z-[9998] bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 max-w-sm"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">🚀</span>
        <div>
          <h4 className="font-semibold text-white text-sm mb-1">Demo Mode</h4>
          <p className="text-gray-300 text-xs">
            Use <strong>demo@example.com</strong> / <strong>demo123</strong> to login
          </p>
        </div>
      </div>
    </motion.div>
  )
}
