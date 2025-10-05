import { create } from 'zustand'

export const useAuthStore = create((set, get) => ({
  // Modal state
  modalOpen: false,
  open: () => set({ modalOpen: true }),
  close: () => set({ modalOpen: false }),
  
  // Auth state
  user: null,
  token: null,
  isAuthenticated: false,
  
  // Initialize auth from localStorage
  initAuth: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        })
      } catch (error) {
        console.error('Failed to parse user data:', error)
        get().logout()
      }
    }
  },
  
  // Login
  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ 
      token, 
      user, 
      isAuthenticated: true,
      modalOpen: false 
    })
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ 
      token: null, 
      user: null, 
      isAuthenticated: false 
    })
  }
}))


