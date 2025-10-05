import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'
import { useMicAudio } from '../hooks/useMicAudio.js'

// Color palette
const COLORS = {
  bg: '#0f172a', // deep navy
  wave: '#22d3ee', // cyan-400
  mic: '#6366f1', // indigo-500
  listener: '#10b981', // emerald-500
  light: '#f8fafc', // off-white
}

// Floating futuristic mic object with indigo highlight
function MicObject() {
  return (
    <group>
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh castShadow>
          <capsuleGeometry args={[0.18, 0.5, 8, 16]} />
          <meshStandardMaterial color={COLORS.mic} metalness={0.4} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.2, 32]} />
          <meshStandardMaterial color={COLORS.light} metalness={0.1} roughness={0.8} />
        </mesh>
        <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.28, 0.02, 12, 64]} />
          <meshStandardMaterial color={COLORS.mic} emissive={COLORS.mic} emissiveIntensity={0.6} />
        </mesh>
      </Float>
    </group>
  )
}

// Listener avatar with emerald aura that reacts to incoming waves
function ListenerAvatar({ reactIntensity = 0 }) {
  const ringRef = useRef()
  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.material.emissiveIntensity = 0.15 + reactIntensity * 1.2
      ringRef.current.scale.setScalar(1 + reactIntensity * 0.3)
    }
  })
  return (
    <group>
      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh castShadow>
          <capsuleGeometry args={[0.22, 0.6, 8, 16]} />
          <meshStandardMaterial color={COLORS.light} metalness={0.1} roughness={0.6} />
        </mesh>
        <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.35, 0.38, 48]} />
          <meshStandardMaterial color={COLORS.listener} emissive={COLORS.listener} emissiveIntensity={0.2} />
        </mesh>
      </Float>
    </group>
  )
}

// Sound waves: instanced rings traveling from mic to listener, size driven by amplitude
function SoundWaves({ amplitude, origin = [0, 0, 0], target = [2.5, 0, 0] }) {
  const count = 40
  const refs = useRef([])
  const stateRef = useRef(Array.from({ length: count }).map(() => ({ t: -1, speed: 0, scale: 1 })))
  const meshRef = useRef()
  const dir = useMemo(() => {
    const dx = target[0] - origin[0]
    const dy = target[1] - origin[1]
    const dz = target[2] - origin[2]
    const len = Math.max(0.0001, Math.hypot(dx, dy, dz))
    return [dx/len, dy/len, dz/len]
  }, [origin, target])

  // Spawn helper
  function spawnOne(i, amp) {
    const s = stateRef.current[i]
    s.t = 0
    s.speed = 0.02 + amp * 0.08
    s.scale = 0.6 + amp * 1.4
  }

  useFrame(() => {
    const amp = Math.max(0, Math.min(1, amplitude || 0))
    if (amp > 0.05) {
      // Spawn proportional to amplitude
      const num = Math.min(count, Math.ceil(amp * 2))
      for (let n = 0; n < num; n++) {
        const idx = stateRef.current.findIndex(s => s.t < 0)
        if (idx >= 0) spawnOne(idx, amp)
      }
    }

    if (!meshRef.current) return
    for (let i = 0; i < count; i++) {
      const s = stateRef.current[i]
      const m = refs.current[i]
      if (!m) continue
      if (s.t >= 0) {
        s.t += s.speed
        const p = Math.min(1, s.t)
        const x = origin[0] + dir[0] * p * 3.2
        const y = origin[1] + dir[1] * p * 3.2
        const z = origin[2] + dir[2] * p * 3.2
        m.position.set(x, y, z)
        const scale = s.scale * (1 + p)
        m.scale.setScalar(scale)
        const opacity = 1 - p
        m.material.opacity = opacity
        m.updateMatrix()
        meshRef.current.setMatrixAt(i, m.matrix)
        if (p >= 1) {
          s.t = -1
        }
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const instances = useMemo(() => Array.from({ length: count }), [count])

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <ringGeometry args={[0.25, 0.28, 32]} />
      <meshStandardMaterial ref={(r) => {}} color={COLORS.wave} emissive={COLORS.wave} emissiveIntensity={0.8} transparent opacity={0.9} />
      {instances.map((_, i) => (
        <object3D key={i} ref={(el) => (refs.current[i] = el)} />
      ))}
    </instancedMesh>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color={COLORS.bg} />
    </mesh>
  )
}

export default function AudioExperience() {
  const [scene, setScene] = useState('speaker') // 'speaker' | 'listener'
  const [amplitude, setAmplitude] = useState(0)
  const { start, stop } = useMicAudio((level) => setAmplitude(level))

  useEffect(() => {
    // Auto-start mic; toggle scenes every 6s for demo
    start()
    const id = setInterval(() => {
      setScene((s) => (s === 'speaker' ? 'listener' : 'speaker'))
    }, 6000)
    return () => {
      clearInterval(id)
      stop()
    }
  }, [])

  // Positions
  const micPos = [-1.6, 0.3, 0]
  const listenerPos = [1.6, 0.3, 0]

  return (
    <div className="h-screen w-screen" style={{ backgroundColor: COLORS.bg }}>
      <Canvas shadows camera={{ position: [0, 2.2, 4], fov: 50 }}>
        <color attach="background" args={[COLORS.bg]} />
        <hemisphereLight intensity={0.4} groundColor={COLORS.bg} color={COLORS.light} />
        <directionalLight castShadow position={[4, 6, 4]} intensity={1.2} color={COLORS.light} />
        <group>
          <Floor />
          {/* Scene grouping with manual fading via material opacity on children if needed */}
          <group position={micPos}>
            <MicObject />
          </group>
          <group position={listenerPos}>
            <ListenerAvatar reactIntensity={scene === 'listener' ? Math.min(1, amplitude * 2) : amplitude * 0.5} />
          </group>
          <group>
            <SoundWaves amplitude={amplitude} origin={micPos} target={listenerPos} />
          </group>
        </group>
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  )
}


