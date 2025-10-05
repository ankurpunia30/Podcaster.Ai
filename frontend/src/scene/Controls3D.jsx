import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Controls3D({ playing, onPlayToggle, onPrev, onNext, onToggleAnalytics }) {
  return (
    <group>
      <Button3D label={playing? 'Pause' : 'Play'} color="#22d3ee" x={-0.9} onClick={onPlayToggle} />
      <Button3D label="Prev" color="#8b5cf6" x={-1.6} onClick={onPrev} />
      <Button3D label="Next" color="#ec4899" x={-0.2} onClick={onNext} />
      <Button3D label="Analytics" color="#22d3ee" x={0.6} onClick={onToggleAnalytics} />
    </group>
  )
}

function Button3D({ label, color, x=0, onClick }) {
  const ref = useRef()
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.z = Math.sin(performance.now()/1000 + x) * 0.02
  })
  return (
    <group position={[x, 0, 0]}>
      <mesh ref={ref} onClick={onClick} onPointerOver={(e)=> e.object.scale.setScalar(1.05)} onPointerOut={(e)=> e.object.scale.setScalar(1)}>
        <roundedBoxGeometry args={[0.7, 0.25, 0.08, 3, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} metalness={0.2} roughness={0.6} />
      </mesh>
      <TextSprite text={label} />
    </group>
  )
}

function TextSprite({ text }) {
  // Minimal text using HTML overlay could be added; here, basic placeholder sprite
  return null
}


