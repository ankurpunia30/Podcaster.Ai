import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

const pins = [
  { lat: 37.7749, lon: -122.4194 }, // SF
  { lat: 51.5074, lon: -0.1278 }, // London
  { lat: 28.6139, lon: 77.2090 }, // Delhi
  { lat: -33.8688, lon: 151.2093 }, // Sydney
]

function latLonToXYZ(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI/180)
  const theta = (lon + 180) * (Math.PI/180)
  const x = -r * Math.sin(phi) * Math.cos(theta)
  const z = r * Math.sin(phi) * Math.sin(theta)
  const y = r * Math.cos(phi)
  return [x, y, z]
}

export default function GlobeAnalytics() {
  const r = 0.8
  const points = useMemo(() => pins.map(p => latLonToXYZ(p.lat, p.lon, r+0.02)), [])
  useFrame((state) => {
    state.scene.rotation.y += 0.0015
  })
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 48, 48]} />
        <meshStandardMaterial color="#0b1220" emissive="#0ea5e9" emissiveIntensity={0.15} metalness={0.2} roughness={0.7} />
      </mesh>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  )
}


