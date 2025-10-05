import React, { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'

// Simple curved timeline (arc) with draggable segment blocks along the arc
export default function CurvedTimeline() {
  const arcRef = useRef()
  const [segments, setSegments] = useState([
    { id: 'intro', t: 0.1, color: '#22d3ee' },
    { id: 'ad', t: 0.45, color: '#ec4899' },
    { id: 'music', t: 0.65, color: '#8b5cf6' },
    { id: 'outro', t: 0.9, color: '#22d3ee' },
  ])
  const radius = 2.4

  const positions = useMemo(() => segments.map(s => tToPos(s.t, radius)), [segments])

  return (
    <group>
      <mesh ref={arcRef} rotation={[-Math.PI/2, 0, 0]}>
        <torusGeometry args={[radius, 0.02, 8, 128, Math.PI]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {segments.map((s, i) => (
        <Segment key={s.id} s={s} pos={positions[i]} radius={radius} onChange={(t) => setSegments(prev => prev.map(p => p.id===s.id? { ...p, t } : p))} />
      ))}
    </group>
  )
}

function tToPos(t, r) {
  const ang = Math.PI * t + Math.PI // 180 to 360 degrees
  const x = Math.cos(ang) * r
  const z = Math.sin(ang) * r
  return [x, 0.02, z]
}

function Segment({ s, pos, radius, onChange }) {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(...pos)
      ref.current.lookAt(0, 0, 0)
    }
  })
  // Drag along arc via simple mouse wheel or placeholder: animate gently
  return (
    <mesh ref={ref} onPointerDown={(e)=>{ e.stopPropagation(); onChange(Math.min(0.99, Math.max(0.01, s.t + 0.02))) }}>
      <boxGeometry args={[0.2, 0.08, 0.2]} />
      <meshStandardMaterial color={s.color} emissive={s.color} emissiveIntensity={0.5} />
    </mesh>
  )
}


