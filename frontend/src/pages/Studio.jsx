import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, OrbitControls, Stars } from '@react-three/drei'
import { useMicAudio } from '../hooks/useMicAudio.js'
import MicWaves from '../scene/MicWaves.jsx'
import CurvedTimeline from '../scene/CurvedTimeline.jsx'
import VoiceAvatars from '../scene/VoiceAvatars.jsx'
import GlobeAnalytics from '../scene/GlobeAnalytics.jsx'
import Controls3D from '../scene/Controls3D.jsx'

// Futuristic Studio layout scene
export default function Studio() {
  const [amplitude, setAmplitude] = useState(0)
  const { start, stop } = useMicAudio((level) => setAmplitude(level))
  const [playing, setPlaying] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Request mic access only when user explicitly toggles Play/Mic
  useEffect(() => {
    if (playing) {
      start()
    } else {
      stop()
      setAmplitude(0)
    }
    return () => {}
  }, [playing])

  return (
    <div className="h-screen w-screen">
      <Canvas shadows camera={{ position: [0, 2.2, 6], fov: 50 }}>
        <color attach="background" args={["#0f172a"]} />
        <hemisphereLight intensity={0.6} groundColor={'#0f172a'} color={'#f8fafc'} />
        <directionalLight castShadow position={[5, 8, 5]} intensity={1.2} color={'#f8fafc'} />
        <Stars radius={100} depth={50} count={2000} factor={2} saturation={0} fade speed={1} />

        {/* Center mic with waves & particles */}
        <group position={[0, 0.3, 0]}>
          <MicWaves amplitude={amplitude} playing={playing} />
        </group>

        {/* Voice avatars to the right side */}
        <group position={[2.8, 0.2, 0]}>
          <VoiceAvatars amplitude={amplitude} active={playing} />
        </group>

        {/* Curved 3D timeline at bottom */}
        <group position={[0, -1.2, 0]}>
          <CurvedTimeline />
        </group>

        {/* Analytics globe toggled in view */}
        {showAnalytics && (
          <group position={[-2.6, 0.8, 0]}>
            <GlobeAnalytics />
          </group>
        )}

        {/* Floating 3D controls */}
        <group position={[0, 1.6, 0]}>
          <Controls3D
            playing={playing}
            onPlayToggle={() => setPlaying((p) => !p)}
            onPrev={() => {}}
            onNext={() => {}}
            onToggleAnalytics={() => setShowAnalytics((s) => !s)}
          />
        </group>

        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  )
}


