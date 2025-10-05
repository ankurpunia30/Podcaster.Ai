import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const voices = [
  { id: 'nova', color: '#22d3ee' },
  { id: 'orion', color: '#8b5cf6' },
  { id: 'lyra', color: '#ec4899' },
]

export default function VoiceAvatars({ amplitude = 0, active = false }) {
  return (
    <group>
      {voices.map((v, i) => (
        <Voice key={v.id} color={v.color} offset={i} amplitude={amplitude} active={active} />
      ))}
    </group>
  )
}

function Voice({ color, offset, amplitude, active }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    const pulse = active ? 0.6 + amplitude * 1.2 : 0.3
    ref.current.scale.setScalar(0.9 + pulse * 0.2)
    ref.current.material.emissiveIntensity = pulse
  })
  return (
    <mesh ref={ref} position={[0, offset * 0.5, 0]}>
      <icosahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} metalness={0.2} roughness={0.6} />
    </mesh>
  )
}


