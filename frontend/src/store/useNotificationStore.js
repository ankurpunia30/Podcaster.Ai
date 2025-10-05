import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      title: 'Notification',
      message: '',
      duration: 5000, // 5 seconds
      ...notification
    }
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }))
    
    // Auto remove after duration
    setTimeout(() => {
      get().removeNotification(id)
    }, newNotification.duration)
    
    return id
  },
  
  removeNotification: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  },
  
  clearAll: () => {
    set({ notifications: [] })
  },
  
  // Helper methods for different types
  success: (message, title = 'Success') => {
    return get().addNotification({ type: 'success', title, message })
  },
  
  error: (message, title = 'Error') => {
    return get().addNotification({ type: 'error', title, message, duration: 8000 })
  },
  
  warning: (message, title = 'Warning') => {
    return get().addNotification({ type: 'warning', title, message })
  },
  
  info: (message, title = 'Info') => {
    return get().addNotification({ type: 'info', title, message })
  }
}))
