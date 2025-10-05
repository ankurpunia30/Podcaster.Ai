import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRoomStore } from '../store/useRoomStore.js'

// Simple avatar: capsule-like body and glowing ring for voice activity
function Avatar({ user, isLocal }) {
  const ringRef = useRef()
  useFrame(() => {
    if (ringRef.current) {
      const glow = user.speaking ? 1 : 0.1
      ringRef.current.material.emissiveIntensity = glow
    }
  })
  return (
    <group position={[user.x, 0, user.z]}>
      <mesh>
        <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
        <meshStandardMaterial color={isLocal ? '#4f8cff' : '#8b5cf6'} metalness={0.1} roughness={0.6} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.35, 0.38, 32]} />
        <meshStandardMaterial color={isLocal ? '#60a5fa' : '#a78bfa'} emissive={isLocal ? '#60a5fa' : '#a78bfa'} emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#0f172a" />
    </mesh>
  )
}

export default function RoomScene({ children }) {
  const { users, local } = useRoomStore()
  return (
    <div className="absolute inset-0">
      <Canvas shadows camera={{ position: [3, 3, 3], fov: 50 }}>
        <color attach="background" args={["#0b1220"]} />
        <hemisphereLight intensity={0.6} groundColor={'#0b1220'} />
        <directionalLight castShadow position={[5, 8, 5]} intensity={1.2} />
        <Floor />
        <Avatar user={local} isLocal />
        {users.map(u => <Avatar key={u.id} user={u} />)}
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
      {children}
    </div>
  )
}


