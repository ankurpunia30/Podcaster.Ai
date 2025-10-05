// Web Worker for heavy data processing
self.onmessage = function(e) {
  const { type, data } = e.data

  switch (type) {
    case 'PROCESS_ANALYTICS':
      processAnalytics(data)
      break
      
    case 'FILTER_PODCASTS':
      filterPodcasts(data)
      break
      
    case 'GENERATE_CHART_DATA':
      generateChartData(data)
      break
      
    default:
      console.warn('Unknown worker task:', type)
  }
}

function processAnalytics(podcasts) {
  try {
    const analytics = {
      totalPodcasts: podcasts.length,
      totalPlays: podcasts.reduce((sum, p) => sum + (p.plays || 0), 0),
      averageRating: podcasts.reduce((sum, p) => sum + (p.rating || 0), 0) / podcasts.length,
      genreDistribution: {},
      monthlyTrends: {},
      topPerformers: []
    }

    // Calculate genre distribution
    podcasts.forEach(podcast => {
      const genre = podcast.genre || 'Unknown'
      analytics.genreDistribution[genre] = (analytics.genreDistribution[genre] || 0) + 1
    })

    // Calculate monthly trends
    podcasts.forEach(podcast => {
      const date = new Date(podcast.createdAt || podcast.created_at)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      
      if (!analytics.monthlyTrends[monthKey]) {
        analytics.monthlyTrends[monthKey] = { count: 0, plays: 0 }
      }
      
      analytics.monthlyTrends[monthKey].count++
      analytics.monthlyTrends[monthKey].plays += podcast.plays || 0
    })

    // Find top performers
    analytics.topPerformers = podcasts
      .filter(p => p.plays > 0)
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        plays: p.plays,
        rating: p.rating
      }))

    self.postMessage({
      type: 'ANALYTICS_COMPLETE',
      data: analytics
    })
  } catch (error) {
    self.postMessage({
      type: 'ANALYTICS_ERROR',
      error: error.message
    })
  }
}

function filterPodcasts({ podcasts, filters }) {
  try {
    let filtered = [...podcasts]

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchLower) ||
        p.topic?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      )
    }

    // Apply genre filter
    if (filters.genre && filters.genre !== 'all') {
      filtered = filtered.filter(p => p.genre === filters.genre)
    }

    // Apply date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(p => {
        const date = new Date(p.createdAt || p.created_at)
        return date >= start && date <= end
      })
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const { field, direction } = filters.sortBy
        const aVal = a[field] || 0
        const bVal = b[field] || 0
        
        if (direction === 'desc') {
          return bVal - aVal || bVal.localeCompare?.(aVal) || 0
        } else {
          return aVal - bVal || aVal.localeCompare?.(bVal) || 0
        }
      })
    }

    self.postMessage({
      type: 'FILTER_COMPLETE',
      data: filtered
    })
  } catch (error) {
    self.postMessage({
      type: 'FILTER_ERROR',
      error: error.message
    })
  }
}

function generateChartData(podcasts) {
  try {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const chartData = {
      labels: last30Days.map(date => {
        const d = new Date(date)
        return `${d.getMonth() + 1}/${d.getDate()}`
      }),
      datasets: [
        {
          label: 'Daily Podcast Creation',
          data: last30Days.map(date => {
            return podcasts.filter(p => {
              const pDate = new Date(p.createdAt || p.created_at).toISOString().split('T')[0]
              return pDate === date
            }).length
          }),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Daily Plays',
          data: last30Days.map(date => {
            return podcasts
              .filter(p => {
                const pDate = new Date(p.createdAt || p.created_at).toISOString().split('T')[0]
                return pDate === date
              })
              .reduce((sum, p) => sum + (p.plays || 0), 0)
          }),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }
      ]
    }

    self.postMessage({
      type: 'CHART_DATA_COMPLETE',
      data: chartData
    })
  } catch (error) {
    self.postMessage({
      type: 'CHART_DATA_ERROR',
      error: error.message
    })
  }
}
