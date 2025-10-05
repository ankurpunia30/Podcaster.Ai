import React, { useRef } from 'react'
import { Float, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

const colors = {
  mic: '#8b5cf6', // neon purple
  wave: '#22d3ee', // electric cyan
  pink: '#ec4899',
}

export default function MicWaves({ amplitude = 0, playing = false }) {
  const rippleRef = useRef()
  const sparklesRef = useRef()
  useFrame((_, dt) => {
    if (rippleRef.current) {
      const s = 1 + amplitude * 1.5
      rippleRef.current.scale.setScalar(s)
      rippleRef.current.material.opacity = 0.4 + amplitude * 0.4
    }
    if (sparklesRef.current) {
      sparklesRef.current.scale.setScalar(1 + amplitude)
    }
  })
  return (
    <group>
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh castShadow>
          <capsuleGeometry args={[0.2, 0.6, 12, 24]} />
          <meshStandardMaterial color={colors.mic} metalness={0.5} roughness={0.2} emissive={colors.mic} emissiveIntensity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]} ref={rippleRef}>
          <ringGeometry args={[0.35, 0.38, 64]} />
          <meshStandardMaterial color={colors.wave} emissive={colors.wave} emissiveIntensity={0.8} transparent opacity={0.6} />
        </mesh>
        <Sparkles ref={sparklesRef} count={60} speed={0.5} scale={1.8} size={2} color={colors.pink} />
      </Float>
    </group>
  )
}


