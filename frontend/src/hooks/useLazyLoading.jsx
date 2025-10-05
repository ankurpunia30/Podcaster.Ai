import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

/**
 * Intersection Observer hook for lazy loading
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
      if (entry.isIntersecting && !hasIntersected) {
        setHasIntersected(true)
      }
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    })

    observer.observe(element)
    return () => observer.unobserve(element)
  }, [hasIntersected, options])

  return { elementRef, isIntersecting, hasIntersected }
}

/**
 * Lazy loaded image component with placeholder
 */
export const LazyImage = ({ 
  src, 
  alt, 
  className = "", 
  placeholder = "🎙️",
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { elementRef, hasIntersected } = useIntersectionObserver()

  return (
    <div ref={elementRef} className={`relative ${className}`} {...props}>
      {!hasIntersected || hasError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-2xl">
          {placeholder}
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                ⏳
              </motion.div>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            loading="lazy"
          />
        </>
      )}
    </div>
  )
}

/**
 * Lazy loaded component wrapper
 */
export const LazyComponent = ({ children, fallback = null, className = "" }) => {
  const { elementRef, hasIntersected } = useIntersectionObserver()

  return (
    <div ref={elementRef} className={className}>
      {hasIntersected ? children : fallback}
    </div>
  )
}
