import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SpotifyStylePlayer = ({ track, isPlaying, onPlayPause, onClose }) => {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current || !track) return;

    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, track]);

  // Load new track
  useEffect(() => {
    if (audioRef.current && track) {
      audioRef.current.load();
      setCurrentTime(0);
    }
  }, [track?.audioUrl]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-3 z-50"
      >
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => onPlayPause(false)}
        />

        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
              {track.thumbnail}
            </div>
            <div className="min-w-0">
              <p className="text-white font-medium truncate text-sm">{track.title}</p>
              <p className="text-gray-400 text-xs truncate">{track.artist}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {/* Control Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onPlayPause(!isPlaying)}
                className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-gray-400 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div
                className="flex-1 h-1 bg-gray-600 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-white rounded-full relative transition-all group-hover:bg-green-400"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <span className="text-xs text-gray-400 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Close */}
          <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.72 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.72l3.663-3.816a1 1 0 011.617.816zM12.22 6.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06L14.44 9 12.22 6.78a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.72 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.72l3.663-3.816a1 1 0 011.617.816zM13.22 5.22a.75.75 0 011.06 0 4.968 4.968 0 010 7.04.75.75 0 01-1.06-1.06 3.47 3.47 0 000-4.92.75.75 0 010-1.06zm2.121-1.414a.75.75 0 011.06 0A8.972 8.972 0 0118 9a8.972 8.972 0 01-1.599 5.194.75.75 0 01-1.06-1.06A7.47 7.47 0 0016.5 9c0-1.279-.319-2.489-.879-3.536a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
          }
          .slider:hover::-webkit-slider-thumb {
            opacity: 1;
          }
          .slider::-webkit-slider-track {
            background: rgb(75 85 99);
            height: 4px;
            border-radius: 2px;
          }
          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            opacity: 0;
            transition: opacity 0.2s;
          }
          .slider:hover::-moz-range-thumb {
            opacity: 1;
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpotifyStylePlayer;
