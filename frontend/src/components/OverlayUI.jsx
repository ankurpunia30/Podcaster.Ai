import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRoomStore } from '../store/useRoomStore.js'

export default function OverlayUI({ onJoin, onLeave, onToggleMute, onAdd }) {
  const { joined, local } = useRoomStore()
  return (
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-4">
      <div className="flex justify-between">
        <div className="pointer-events-auto backdrop-blur bg-white/10 border border-white/20 shadow-lg rounded px-4 py-2">
          <p className="font-semibold">Podcaster Room</p>
          <p className="text-xs text-white/80">Minimal 3D space • Beta</p>
        </div>
      </div>
      <div className="flex justify-center">
        <motion.div layout className="pointer-events-auto flex items-center gap-2 backdrop-blur bg-white/10 border border-white/20 shadow-xl rounded-full px-3 py-2">
          <button onClick={onJoin} className="px-3 py-2 rounded bg-blue-500 hover:bg-blue-600">Join</button>
          <button onClick={onLeave} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Leave</button>
          <button onClick={onToggleMute} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">{local.muted? 'Unmute' : 'Mute'}</button>
          <button onClick={onAdd} className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600">Add People</button>
          <AnimatePresence>
            {!local.muted && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-white/80">Mic on</motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="flex justify-end">
        <div className="pointer-events-auto backdrop-blur bg-white/10 border border-white/20 shadow-lg rounded px-3 py-2 text-xs">
          <span>Users: </span>
          <UsersCount />
        </div>
      </div>
    </div>
  )
}

function UsersCount() {
  const { users } = useRoomStore()
  return <span>{users.length + 1}</span>
}


