import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Subtle structured particle field that reacts to scroll (0..1) and pointer
export default function ReactiveField({ colorA = '#22d3ee', colorB = '#ec4899', intensity = 0.6 }) {
  const countX = 40
  const countY = 20
  const pointsRef = useRef()
  const positions = useMemo(() => {
    const arr = []
    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        const px = (x / (countX - 1) - 0.5) * 12
        const py = (y / (countY - 1) - 0.5) * 6
        const pz = 0
        arr.push(px, py, pz)
      }
    }
    return new Float32Array(arr)
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { width, height } = state.size
    const mouseX = (state.pointer.x || 0) * 0.5
    const mouseY = (state.pointer.y || 0) * 0.5
    const pos = pointsRef.current.geometry.attributes.position.array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      // Wave based on time and distance to mouse
      const d = Math.hypot(x * 0.15 - mouseX * 6, y * 0.25 - mouseY * 4)
      const z = Math.sin(d - t * 1.2) * 0.25 * intensity
      pos[i + 2] = z
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} position={[0, 0, -2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color={colorA} opacity={0.9} transparent />
    </points>
  )
}


