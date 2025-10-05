import { create } from 'zustand'

// Room state: users, local user, mic state, join/leave
export const useRoomStore = create((set, get) => ({
  joined: false,
  users: [], // { id, name, x, y, z, speaking }
  local: { id: 'me', name: 'You', speaking: false, muted: true, x: 0, y: 0, z: 0 },
  join: () => set({ joined: true }),
  leave: () => set({ joined: false, users: [] }),
  toggleMute: () => set(state => ({ local: { ...state.local, muted: !state.local.muted } })),
  setSpeaking: (speaking) => set(state => ({ local: { ...state.local, speaking } })),
  moveLocal: (pos) => set(state => ({ local: { ...state.local, ...pos } })),
  addRandomUser: () => {
    const id = Math.random().toString(36).slice(2,8)
    const name = `Guest-${id}`
    const x = (Math.random()-0.5)*3
    const z = (Math.random()-0.5)*3
    set(state => ({ users: [...state.users, { id, name, x, y: 0, z, speaking: false }] }))
  },
  setUserSpeaking: (id, speaking) => set(state => ({ users: state.users.map(u => u.id===id? { ...u, speaking } : u) })),
}))


