import { useState, useEffect, useRef, useMemo } from 'react'

/**
 * Virtual scrolling hook for large lists
 * Only renders visible items to improve performance
 */
export const useVirtualScroll = ({
  items = [],
  itemHeight = 100,
  containerHeight = 400,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef(null)

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return {
      startIndex,
      endIndex,
      items: items.slice(startIndex, endIndex + 1),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, itemHeight, scrollTop, containerHeight, overscan])

  useEffect(() => {
    const element = scrollElementRef.current
    if (!element) return

    const handleScroll = () => {
      setScrollTop(element.scrollTop)
    }

    element.addEventListener('scroll', handleScroll, { passive: true })
    return () => element.removeEventListener('scroll', handleScroll)
  }, [])

  return {
    scrollElementRef,
    visibleItems,
    totalHeight: visibleItems.totalHeight,
    offsetY: visibleItems.offsetY
  }
}

/**
 * Virtual List Component
 */
export const VirtualList = ({ 
  items, 
  itemHeight = 100, 
  height = 400, 
  renderItem,
  className = ""
}) => {
  const { scrollElementRef, visibleItems, totalHeight, offsetY } = useVirtualScroll({
    items,
    itemHeight,
    containerHeight: height
  })

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.items.map((item, index) => 
            renderItem(item, visibleItems.startIndex + index)
          )}
        </div>
      </div>
    </div>
  )
}
