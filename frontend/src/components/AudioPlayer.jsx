import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function AudioPlayer({ 
  audioUrl, 
  title = "Untitled Podcast",
  duration = 0,
  onPlay,
  onPause,
  className = "" 
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration)
  const [volume, setVolume] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setTotalDuration(audio.duration)
    const handleLoadStart = () => setIsLoading(true)
    const handleLoadedData = () => setIsLoading(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onPause?.()
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('loadeddata', handleLoadedData)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('loadeddata', handleLoadedData)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl, onPause])

  const togglePlay = async () => {
    if (!audioRef.current || !audioUrl) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        onPause?.()
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        onPlay?.()
      }
    } catch (error) {
      console.error('Playback error:', error)
      setIsPlaying(false)
    }
  }

  const handleSeek = (e) => {
    if (!audioRef.current || !totalDuration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * totalDuration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  return (
    <motion.div 
      className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
      />

      {/* Track Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <div className="flex items-center text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span className="mx-2">/</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div 
          className="w-full h-2 bg-white/10 rounded-full cursor-pointer overflow-hidden"
          onClick={handleSeek}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <motion.button
            onClick={togglePlay}
            disabled={!audioUrl || isLoading}
            className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </motion.button>

          {/* Skip Controls */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, currentTime - 10)
              }
            }}
            className="w-8 h-8 text-gray-400 hover:text-white transition-colors"
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>

          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.min(totalDuration, currentTime + 10)
              }
            }}
            className="w-8 h-8 text-gray-400 hover:text-white transition-colors"
          >
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
            </svg>
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </motion.div>
  )
}
