import React, { memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'

/**
 * Optimized Podcast Card Component with memoization
 */
const PodcastCard = memo(({ 
  podcast, 
  onPlay, 
  isSelected = false,
  showDetails = true 
}) => {
  // Memoize expensive calculations
  const formattedDate = useMemo(() => {
    return new Date(podcast.createdAt || podcast.created_at).toLocaleDateString()
  }, [podcast.createdAt, podcast.created_at])

  const statusColor = useMemo(() => {
    switch (podcast.status) {
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'generating': return 'text-yellow-400 bg-yellow-500/20'
      case 'generating_audio': return 'text-blue-400 bg-blue-500/20'
      case 'failed': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }, [podcast.status])

  const handlePlay = useCallback(() => {
    onPlay(podcast)
  }, [onPlay, podcast])

  const canPlay = podcast.status === 'completed' && podcast.audioUrl

  return (
    <motion.div
      className={`group p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer ${
        isSelected ? 'bg-green-500/10 border-green-500/30' : ''
      }`}
      onClick={canPlay ? handlePlay : undefined}
      whileHover={{ x: 4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
          {podcast.thumbnail || '🎙️'}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-1 truncate">
            {podcast.title}
          </h4>
          {showDetails && (
            <p className="text-sm text-gray-400 mb-2 line-clamp-2">
              {podcast.description || `A podcast about ${podcast.topic}`}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{podcast.plays || 0} plays</span>
              <span>{formattedDate}</span>
              {podcast.duration && <span>{podcast.duration}</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
                {podcast.status}
              </div>
              
              {canPlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlay()
                  }}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

PodcastCard.displayName = 'PodcastCard'

export default PodcastCard
