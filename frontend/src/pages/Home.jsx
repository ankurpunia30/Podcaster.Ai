import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { motion, useScroll as useFramerScroll, useTransform } from 'framer-motion'
import { useAuthStore } from '../store/useAuthStore'

// Audio Visualizer Component
function AudioVisualizer({ position = [0, 0, 0] }) {
  const groupRef = useRef()
  const barsCount = 12
  const bars = useRef([])
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01
      
      // Animate bars with different frequencies
      bars.current.forEach((bar, i) => {
        if (bar) {
          const time = state.clock.elapsedTime
          const frequency = 1 + i * 0.3
          const height = 0.5 + Math.sin(time * frequency) * 0.3
          bar.scale.y = Math.max(0.1, height)
          bar.material.emissiveIntensity = 0.2 + Math.sin(time * frequency) * 0.3
        }
      })
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: barsCount }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => (bars.current[i] = el)}
          position={[
            Math.cos((i / barsCount) * Math.PI * 2) * 0.8,
            0,
            Math.sin((i / barsCount) * Math.PI * 2) * 0.8
          ]}
        >
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial
            color="#4299e1"
            emissive="#4299e1"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

// Enhanced 3D Podcast Equipment
function PodcastStudio3D({ position = [0, 0, 0] }) {
  const studioRef = useRef()
  
  useFrame((state) => {
    if (studioRef.current) {
      studioRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })
  
  return (
    <group ref={studioRef} position={position}>
      {/* Mixing Console */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 0.3, 1]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      {/* Console Knobs and Sliders */}
      {Array.from({ length: 8 }, (_, i) => (
        <Float key={i} speed={1 + i * 0.1} rotationIntensity={0.1} floatIntensity={0.05}>
          <mesh position={[-0.6 + (i * 0.2), 0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
            <meshStandardMaterial 
              color="#4299e1"
              emissive="#4299e1"
              emissiveIntensity={0.3}
            />
          </mesh>
        </Float>
      ))}
      
      {/* Studio Monitors */}
      <mesh position={[-1.2, 0.8, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[1.2, 0.8, 0]}>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      
      {/* Speaker Cones */}
      <mesh position={[-1.2, 0.8, 0.16]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[1.2, 0.8, 0.16]}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  )
}

// 3D Sound Waves Effect
function SoundWaves3D({ position = [0, 0, 0], color = "#4299e1" }) {
  const wavesRef = useRef()
  
  useFrame((state) => {
    if (wavesRef.current) {
      const time = state.clock.elapsedTime
      wavesRef.current.children.forEach((wave, i) => {
        wave.scale.setScalar(1 + Math.sin(time * 2 + i * 0.5) * 0.3)
        wave.material.opacity = 0.6 - (Math.sin(time * 2 + i * 0.5) * 0.3)
      })
    }
  })
  
  return (
    <group ref={wavesRef} position={position}>
      {[1, 2, 3, 4].map((i) => (
        <mesh key={i} scale={i * 0.3}>
          <torusGeometry args={[1, 0.05, 8, 32]} />
          <meshStandardMaterial 
            color={color}
            transparent
            opacity={0.4 / i}
          />
        </mesh>
      ))}
    </group>
  )
}

// Professional Podcast Microphone Component
function PodcastMicrophone() {
  const micRef = useRef()
  
  useFrame((state) => {
    if (micRef.current) {
      micRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      micRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1
    }
  })

  return (
    <group ref={micRef} position={[2.5, 0, 0]}>
      {/* Professional Mic Body */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.25, 1.2, 16]} />
        <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Mic Grille */}
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Mic Stand */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 2, 8]} />
        <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Boom Arm */}
      <mesh position={[-1, -0.5, 0]} rotation={[0, 0, Math.PI/4]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 8]} />
        <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Recording Indicator Light */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial 
          color="#f56565" 
          emissive="#f56565"
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  )
}

// Sound Wave Visualization
function SoundWaves() {
  const wavesRef = useRef()
  
  useFrame((state) => {
    if (wavesRef.current) {
      wavesRef.current.rotation.z = state.clock.elapsedTime * 0.2
      wavesRef.current.children.forEach((child, i) => {
        child.scale.x = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.3
        child.scale.y = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.3
      })
    }
  })

  return (
    <group ref={wavesRef} position={[0, 1, -2]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, 0, i * 0.3]} rotation={[Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.5 + i * 0.2, 0.02, 8, 32]} />
          <meshStandardMaterial 
            color={`hsl(${200 + i * 20}, 70%, 60%)`}
            transparent 
            opacity={0.7 - i * 0.1}
            emissive={`hsl(${200 + i * 20}, 70%, 40%)`}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

// Multiple Podcast Hosts/Avatars
function PodcastAvatars() {
  const avatarsRef = useRef()
  
  useFrame((state) => {
    if (avatarsRef.current) {
      avatarsRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <group ref={avatarsRef} position={[-3, 0.5, 1]}>
      {[0, 1, 2].map((i) => (
        <Float key={i} speed={1.5 + i * 0.3} rotationIntensity={0.3} floatIntensity={0.5}>
          <group position={[i * 1.2, 0, 0]}>
            {/* Avatar Head */}
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshStandardMaterial 
                color={i === 0 ? "#f7fafc" : i === 1 ? "#fed7d7" : "#bee3f8"}
                roughness={0.8}
                metalness={0.1}
              />
            </mesh>
            
            {/* Avatar Body */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 0.6, 8]} />
              <meshStandardMaterial 
                color={i === 0 ? "#4299e1" : i === 1 ? "#ed8936" : "#48bb78"}
                roughness={0.6}
              />
            </mesh>
            
            {/* Speech Bubble */}
            <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial 
                color="#ffffff"
                transparent
                opacity={0.8}
                emissive="#ffffff"
                emissiveIntensity={0.2}
              />
            </mesh>
          </group>
        </Float>
      ))}
    </group>
  )
}

// Floating Script Pages
function FloatingScripts() {
  const scriptsRef = useRef()
  
  useFrame((state) => {
    if (scriptsRef.current) {
      scriptsRef.current.children.forEach((child, i) => {
        child.rotation.x = Math.sin(state.clock.elapsedTime + i) * 0.1
        child.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.05
        child.position.y = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.3
      })
    }
  })

  return (
    <group ref={scriptsRef} position={[0, 2, -1]}>
      {[1, 2, 3, 4].map((i) => (
        <mesh 
          key={i} 
          position={[(i - 2.5) * 0.8, 0, 0]} 
          rotation={[0, i * 0.3, 0]}
        >
          <planeGeometry args={[0.4, 0.6]} />
          <meshStandardMaterial 
            color="#ffffff"
            transparent
            opacity={0.9}
            side={2}
          />
        </mesh>
      ))}
    </group>
  )
}

// Podcast Camera
function PodcastCamera() {
  const cameraRef = useRef()
  
  useFrame((state) => {
    if (cameraRef.current) {
      cameraRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <group ref={cameraRef} position={[-2, 0, 2]}>
      {/* Camera Body */}
      <mesh>
        <boxGeometry args={[0.4, 0.3, 0.6]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Camera Lens */}
      <mesh position={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
        <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Lens Glass */}
      <mesh position={[0, 0, 0.41]}>
        <circleGeometry args={[0.12, 16]} />
        <meshStandardMaterial 
          color="#63b3ed"
          transparent
          opacity={0.3}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Recording Light */}
      <mesh position={[0.2, 0.15, 0.2]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial 
          color="#f56565"
          emissive="#f56565"
          emissiveIntensity={Math.sin(Date.now() * 0.01) * 0.5 + 0.5}
        />
      </mesh>
    </group>
  )
}

// Audio Waveform Display
function AudioWaveform() {
  const waveformRef = useRef()
  
  useFrame((state) => {
    if (waveformRef.current) {
      waveformRef.current.children.forEach((child, i) => {
        child.scale.y = 1 + Math.sin(state.clock.elapsedTime * 4 + i * 0.3) * 0.8
      })
    }
  })

  return (
    <group ref={waveformRef} position={[0, -1, -2]}>
      {[...Array(20)].map((_, i) => (
        <mesh key={i} position={[(i - 10) * 0.15, 0, 0]}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial 
            color={`hsl(${180 + i * 10}, 70%, 60%)`}
            emissive={`hsl(${180 + i * 10}, 70%, 30%)`}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// Main 3D Podcast Scene
function Scene3D() {
  return (
    <>
      {/* Dark Podcast Studio Background */}
      <color attach="background" args={['#0a0a0a']} />
      
      {/* Professional Studio Lighting */}
      <ambientLight intensity={0.4} color="#ffffff" />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" castShadow />
      <pointLight position={[-3, 2, 3]} intensity={0.6} color="#4299e1" />
      <pointLight position={[3, 2, -3]} intensity={0.6} color="#ed8936" />
      <spotLight 
        position={[0, 8, 0]} 
        intensity={1} 
        color="#f7fafc" 
        angle={0.6} 
        penumbra={0.5}
        castShadow
      />
      
      {/* Podcast Studio Elements */}
      <PodcastMicrophone />
      <SoundWaves />
      <PodcastAvatars />
      <FloatingScripts />
      <PodcastCamera />
      <AudioWaveform />
    </>
  )
}

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  return (
    <motion.header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 animate-pulse opacity-60"></div>
            {/* Podcast microphone icon */}
            <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
              <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">Podcaster</span>
        </motion.div>
        
        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'Studio', 'Pricing', 'About'].map((item, index) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-white/70 hover:text-white font-medium transition-colors relative"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
            >
              {item}
            </motion.a>
          ))}
        </nav>
        
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {user ? (
            <div className="flex items-center gap-4">
              <motion.a
                href="/dashboard"
                className="px-4 py-2 text-white/70 hover:text-white font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Dashboard
              </motion.a>
              <motion.button
                onClick={handleLogout}
                className="px-4 py-2 text-white/70 hover:text-white font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Logout
              </motion.button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <motion.a
                href="/login"
                className="px-4 py-2 text-white/70 hover:text-white font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                Login
              </motion.a>
              <motion.a
                href="/signup"
                className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign Up
              </motion.a>
            </div>
          )}
        </motion.div>
      </div>
    </motion.header>
  )
}

// Interactive 3D Feature Components
function ScrollTriggered3DFeature({ position, rotation, scale, children, triggerRange, scrollY }) {
  const progress = useTransform(scrollY, triggerRange, [0, 1])
  const featureScale = useTransform(progress, [0, 1], [0.3, scale])
  const featureOpacity = useTransform(progress, [0, 1], [0.2, 1])
  
  return (
    <motion.group 
      position={position} 
      rotation={rotation}
      scale={featureScale}
      style={{ opacity: featureOpacity }}
    >
      {children}
    </motion.group>
  )
}

// Enhanced 3D Scene with Scroll Triggers
function Enhanced3DScene({ scrollY }) {
  const cameraX = useTransform(scrollY, [0, 2000, 4000, 6000], [0, 2, -2, 0])
  const cameraY = useTransform(scrollY, [0, 2000, 4000, 6000], [2, 3, 2, 1])
  const cameraZ = useTransform(scrollY, [0, 2000, 4000, 6000], [8, 6, 10, 8])
  
  return (
    <Canvas 
      camera={{ position: [0, 2, 8], fov: 45 }}
      onCreated={(state) => {
        console.log('Enhanced 3D Canvas created', state)
      }}
    >
      <motion.group
        position={[cameraX.get(), cameraY.get(), cameraZ.get()]}
        animate={{
          x: cameraX.get(),
          y: cameraY.get(), 
          z: cameraZ.get()
        }}
      >
        {/* Base Studio Scene */}
        <Scene3D />
        
        {/* Audio Visualizer */}
        <AudioVisualizer position={[-3, -1, 2]} />
        
        {/* Feature 1: AI Voice Generation (appears at 300px scroll) */}
        <ScrollTriggered3DFeature
          position={[3, 1, 2]}
          rotation={[0, Math.PI/4, 0]}
          scale={1.2}
          triggerRange={[300, 600]}
          scrollY={scrollY}
        >
          <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
            {/* Podcast Microphone for AI Voice */}
            <mesh>
              <cylinderGeometry args={[0.3, 0.25, 0.8, 16]} />
              <meshStandardMaterial 
                color="#00d4ff" 
                emissive="#00aacc"
                emissiveIntensity={0.5}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            {/* Sound waves from microphone */}
            {[1, 2, 3].map((i) => (
              <mesh key={i} position={[0, 0, 0]} scale={[1 + i * 0.3, 1 + i * 0.3, 1]}>
                <torusGeometry args={[0.6, 0.02, 8, 32]} />
                <meshStandardMaterial 
                  color="#00d4ff"
                  transparent
                  opacity={0.3 / i}
                />
              </mesh>
            ))}
          </Float>
        </ScrollTriggered3DFeature>

        {/* Feature 2: Script Writing (appears at 800px scroll) */}
        <ScrollTriggered3DFeature
          position={[-3, 2, 1]}
          rotation={[0, -Math.PI/6, 0]}
          scale={1.5}
          triggerRange={[800, 1100]}
          scrollY={scrollY}
        >
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
            {/* Floating documents */}
            {[1, 2, 3, 4].map((i) => (
              <mesh 
                key={i}
                position={[(i-2.5) * 0.3, Math.sin(i) * 0.2, i * 0.1]}
                rotation={[0, i * 0.2, Math.sin(i) * 0.1]}
              >
                <planeGeometry args={[0.4, 0.6]} />
                <meshStandardMaterial 
                  color="#ffffff"
                  transparent
                  opacity={0.9}
                  side={2}
                />
              </mesh>
            ))}
            {/* Pen writing */}
            <mesh position={[0.5, -0.3, 0]} rotation={[0, 0, Math.PI/4]}>
              <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
              <meshStandardMaterial color="#4a90e2" />
            </mesh>
            {/* Script pages indicator */}
            <mesh position={[0, -0.5, 0]}>
              <boxGeometry args={[0.6, 0.05, 0.4]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </Float>
        </ScrollTriggered3DFeature>

        {/* Feature 3: Auto Music Mixing (appears at 1300px scroll) */}
        <ScrollTriggered3DFeature
          position={[0, -1, 3]}
          rotation={[0, 0, 0]}
          scale={1.3}
          triggerRange={[1300, 1600]}
          scrollY={scrollY}
        >
          <Float speed={3} rotationIntensity={0.3} floatIntensity={0.2}>
            {/* Mixing console */}
            <mesh>
              <boxGeometry args={[1.5, 0.3, 0.8]} />
              <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Frequency bars */}
            {[...Array(12)].map((_, i) => (
              <mesh key={i} position={[(i-6) * 0.15, 0.2, 0]}>
                <boxGeometry args={[0.08, 0.3 + Math.sin(Date.now() * 0.01 + i) * 0.2, 0.08]} />
                <meshStandardMaterial 
                  color={`hsl(${200 + i * 15}, 80%, 60%)`}
                  emissive={`hsl(${200 + i * 15}, 80%, 40%)`}
                  emissiveIntensity={0.4}
                />
              </mesh>
            ))}
          </Float>
        </ScrollTriggered3DFeature>

        {/* Feature 4: Publishing (appears at 1700px scroll) */}
        <ScrollTriggered3DFeature
          position={[2, 3, -1]}
          rotation={[Math.PI/6, 0, 0]}
          scale={1.4}
          triggerRange={[1700, 2000]}
          scrollY={scrollY}
        >
          <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.5}>
            {/* Podcast Distribution Hub */}
            <mesh>
              <cylinderGeometry args={[0.4, 0.4, 0.8, 8]} />
              <meshStandardMaterial 
                color="#4a90e2" 
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            {/* Orbiting platform icons */}
            {['Spotify', 'Apple', 'Google'].map((platform, i) => (
              <Float key={platform} speed={2 + i * 0.5}>
                <mesh position={[
                  Math.cos(i * (Math.PI * 2 / 3)) * 1.2,
                  Math.sin(Date.now() * 0.001 + i) * 0.3,
                  Math.sin(i * (Math.PI * 2 / 3)) * 1.2
                ]}>
                  <boxGeometry args={[0.15, 0.15, 0.05]} />
                  <meshStandardMaterial 
                    color={i === 0 ? "#1db954" : i === 1 ? "#fc3c44" : "#4285f4"}
                    emissive={i === 0 ? "#1db954" : i === 1 ? "#fc3c44" : "#4285f4"}
                    emissiveIntensity={0.3}
                  />
                </mesh>
              </Float>
            ))}
          </Float>
        </ScrollTriggered3DFeature>
      </motion.group>
    </Canvas>
  )
}

// Hero Section
function HeroSection() {
  const { scrollY } = useFramerScroll()
  const y = useTransform(scrollY, [0, 1000], [0, -300])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Podcast-themed background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black"></div>
        {/* Microphone pattern */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            <svg className="w-8 h-8 text-blue-500/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
              <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
            </svg>
          </motion.div>
        ))}
        {/* Waveform pattern */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scaleY: [0.5, 1.5, 0.5],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{
              duration: 2 + Math.random() * 1.5,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            <div className="flex items-end gap-1">
              {[...Array(5)].map((_, j) => (
                <div 
                  key={j}
                  className="bg-purple-500/20 w-1"
                  style={{ height: `${10 + Math.random() * 20}px` }}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced 3D Canvas Background */}
      <div className="absolute inset-0 z-0">
        <Enhanced3DScene scrollY={scrollY} />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 z-10" />
      
      {/* Hero Content */}
      <motion.div 
        className="relative z-20 text-center px-6 max-w-5xl mx-auto"
        style={{ y, opacity }}
      >
        {/* Clean Title Section */}
        <motion.h1 
          className="text-6xl md:text-8xl font-bold text-white mb-6 leading-tight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <span>Create</span>
          <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent block">
            AI Podcasts
          </span>
          <span>in Minutes</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        >
          Transform your ideas into professional podcasts with AI-powered voices, 
          intelligent editing, and seamless publishing. No studio required.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
        >
          <motion.a
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transition-all"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            Start Creating Free
          </motion.a>
          
          <motion.a
            href="/studio"
            className="flex items-center gap-3 px-6 py-4 text-white border border-white/20 rounded-full hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            Try Studio
          </motion.a>
        </motion.div>
        
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
        >
          <p className="text-sm text-gray-400 mb-4">Trusted by 50,000+ creators worldwide</p>
          <div className="flex items-center justify-center gap-8 opacity-50">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div 
                key={i} 
                className="w-8 h-8 bg-white/10 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.5 + i * 0.1, duration: 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

// Enhanced Features Section with 3D Integration
function FeaturesSection() {
  const { scrollY } = useFramerScroll()
  
  const features = [
    {
      icon: "🎙️",
      title: "AI Voice Generation",
      description: "Choose from dozens of ultra-realistic AI voices that sound completely natural and engaging.",
      scrollTrigger: [500, 800],
      color: "#00d4ff"
    },
    {
      icon: "✨",
      title: "Smart Script Writing",
      description: "Our AI creates compelling, well-structured scripts from just your topic or brief outline.",
      scrollTrigger: [1200, 1500],
      color: "#4a90e2"
    },
    {
      icon: "🎵",
      title: "Auto Music Mixing",
      description: "Professional background music and sound effects are automatically balanced and mixed.",
      scrollTrigger: [2000, 2300],
      color: "#9b59b6"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Generate complete podcast episodes in under 5 minutes, not hours or days.",
      scrollTrigger: [2600, 2900],
      color: "#f1c40f"
    },
    {
      icon: "🌍",
      title: "Multi-Platform Publishing",
      description: "One-click distribution to Spotify, Apple Podcasts, Google Podcasts, and more.",
      scrollTrigger: [2800, 3100],
      color: "#e74c3c"
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      description: "Track your podcast's performance with detailed analytics and audience insights.",
      scrollTrigger: [3200, 3500],
      color: "#2ecc71"
    }
  ]

  return (
    <section className="py-32 bg-gradient-to-b from-black via-gray-900 to-black relative overflow-hidden">
      {/* Podcast-themed background elements */}
      <div className="absolute inset-0 opacity-5">
        {/* Sound wave lines */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`soundwave-${i}`}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"
            style={{ top: `${10 + i * 10}%` }}
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scaleX: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        {/* Floating podcast icons */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`podcast-icon-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -15, 0],
              rotate: [0, 180, 360],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          >
            <svg className="w-6 h-6 text-purple-400/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm6 2a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm-3 7h6v-2H9v2z"/>
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Floating 3D Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.5} />
          
          {/* Floating geometric shapes that respond to scroll */}
          {features.map((feature, index) => {
            const progress = useTransform(scrollY, feature.scrollTrigger, [0, 1])
            const x = useTransform(progress, [0, 1], [10, 0])
            const rotationY = useTransform(scrollY, [0, 4000], [0, Math.PI * 2])
            
            return (
              <motion.group
                key={index}
                position={[x.get(), (index - 2) * 1.5, -2]}
                rotation={[0, rotationY.get(), 0]}
                animate={{
                  x: x.get(),
                  rotateY: rotationY.get()
                }}
              >
                <Float speed={1 + index * 0.2} rotationIntensity={0.1} floatIntensity={0.3}>
                  {/* Podcast-related 3D elements */}
                  <mesh>
                    <cylinderGeometry args={[0.2, 0.15, 0.4, 8]} />
                    <meshStandardMaterial 
                      color={feature.color}
                      emissive={feature.color}
                      emissiveIntensity={0.2}
                      metalness={0.8}
                      roughness={0.2}
                    />
                  </mesh>
                  {/* Microphone grille */}
                  <mesh position={[0, 0.25, 0]}>
                    <sphereGeometry args={[0.22, 8, 8]} />
                    <meshStandardMaterial 
                      color={feature.color}
                      transparent
                      opacity={0.3}
                      wireframe
                    />
                  </mesh>
                </Float>
              </motion.group>
            )
          })}
        </Canvas>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0.3, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Everything you need to
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
              create amazing podcasts
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Professional podcasting tools powered by cutting-edge AI technology
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const progress = useTransform(scrollY, feature.scrollTrigger, [0, 1])
            const scale = useTransform(progress, [0, 1], [0.8, 1])
            const opacity = useTransform(progress, [0, 1], [0.3, 1])
            
            return (
              <motion.div
                key={index}
                className="p-8 bg-white/5 backdrop-blur border border-white/10 rounded-3xl hover:bg-white/10 transition-all duration-500 relative overflow-hidden"
                style={{ 
                  scale,
                  opacity,
                  boxShadow: `0 0 30px ${feature.color}20`
                }}
                initial={{ opacity: 0.4, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ 
                  scale: 1.05,
                  y: -10,
                  boxShadow: `0 20px 40px ${feature.color}30`,
                  transition: { duration: 0.3 }
                }}
                viewport={{ once: true }}
              >
                {/* Animated background glow */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background: `radial-gradient(circle at center, ${feature.color}10, transparent 70%)`,
                    opacity: progress
                  }}
                />
                
                <div className="relative z-10">
                  <motion.div 
                    className="text-4xl mb-4"
                    animate={{
                      rotate: progress.get() * 360,
                      scale: 1 + progress.get() * 0.2
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 
                    className="text-xl font-semibold text-white mb-3"
                    style={{ color: progress.get() > 0.5 ? feature.color : 'white' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Interactive 3D Journey Section
function InteractiveJourneySection() {
  const { scrollY } = useFramerScroll()
  const sectionRef = useRef(null)
  
  const journeySteps = [
    {
      title: "1. Share Your Idea",
      description: "Simply describe your podcast concept",
      icon: "💡",
      position: [-4, 0, 0],
      color: "#f1c40f"
    },
    {
      title: "2. AI Creates Script",
      description: "Our AI generates engaging content",
      icon: "📝",
      position: [-2, 1, -1],
      color: "#3498db"
    },
    {
      title: "3. Choose Voice",
      description: "Select from premium AI voices",
      icon: "🎤",
      position: [0, 0, 0],
      color: "#e74c3c"
    },
    {
      title: "4. Auto Production",
      description: "Music, effects, and editing handled",
      icon: "🎛️",
      position: [2, -1, -1],
      color: "#9b59b6"
    },
    {
      title: "5. Publish Everywhere",
      description: "One-click to all major platforms",
      icon: "🌐",
      position: [4, 0, 0],
      color: "#2ecc71"
    }
  ]

  return (
    <section className="py-32 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
      {/* Podcast studio background ambiance */}
      <div className="absolute inset-0 opacity-10">
        {/* Recording studio panels */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`panel-${i}`}
            className="absolute bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg"
            style={{
              width: '120px',
              height: '80px',
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              transform: `rotate(${-10 + Math.random() * 20}deg)`
            }}
            animate={{
              y: [0, -8, 0],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            {/* Panel texture lines */}
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="absolute left-2 right-2 h-px bg-blue-500/20"
                style={{ top: `${20 + j * 15}px` }}
              />
            ))}
          </motion.div>
        ))}
        {/* Equalizer bars */}
        <div className="absolute bottom-10 left-10 right-10">
          <div className="flex justify-center items-end gap-2">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`eq-${i}`}
                className="bg-gradient-to-t from-blue-600/30 to-purple-600/30 w-2 rounded-t"
                animate={{
                  height: [10 + Math.random() * 30, 40 + Math.random() * 60, 10 + Math.random() * 30]
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Simplified 3D Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, -5, 5]} intensity={0.6} color="#4299e1" />
          
          {/* Simple Journey Path */}
          <motion.group>
            {/* Connecting Path */}
            <mesh position={[0, 0, -0.5]} rotation={[0, 0, Math.PI/2]}>
              <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
              <meshStandardMaterial 
                color="#6366f1" 
                emissive="#6366f1"
                emissiveIntensity={0.2}
                transparent
                opacity={0.8}
              />
            </mesh>
            
            {/* Journey Steps as 3D Elements */}
            {journeySteps.map((step, index) => (
              <motion.group
                key={index}
                position={step.position}
              >
                <Float speed={1.5 + index * 0.3} rotationIntensity={0.1} floatIntensity={0.4}>
                  {/* Main step sphere */}
                  <mesh>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial 
                      color={step.color}
                      emissive={step.color}
                      emissiveIntensity={0.4}
                    />
                  </mesh>
                  
                  {/* Orbiting elements */}
                  {[1, 2, 3].map((orbitIndex) => (
                    <Float key={orbitIndex} speed={2 + orbitIndex}>
                      <mesh position={[
                        Math.cos(orbitIndex * Math.PI * 2/3) * 0.6,
                        Math.sin(Date.now() * 0.001 + orbitIndex) * 0.2,
                        Math.sin(orbitIndex * Math.PI * 2/3) * 0.6
                      ]}>
                        <sphereGeometry args={[0.05, 8, 8]} />
                        <meshStandardMaterial 
                          color={step.color}
                          transparent
                          opacity={0.6}
                        />
                      </mesh>
                    </Float>
                  ))}
                </Float>
              </motion.group>
            ))}
          </motion.group>
        </Canvas>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            From Idea to
            <span className="bg-gradient-to-r from-yellow-400 via-purple-500 to-green-400 bg-clip-text text-transparent block">
              Published Podcast
            </span>
            in Minutes
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Watch your podcast journey unfold in our interactive 3D timeline
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-5 gap-8">
          {journeySteps.map((step, index) => {
            const progress = useTransform(
              scrollY, 
              [3500 + index * 200, 3700 + index * 200], 
              [0, 1]
            )
            
            return (
              <motion.div
                key={index}
                className="text-center relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.1 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl relative"
                  style={{
                    backgroundColor: `${step.color}20`,
                    border: `2px solid ${step.color}`,
                    boxShadow: `0 0 20px ${step.color}40`
                  }}
                  whileInView={{
                    boxShadow: `0 0 30px ${step.color}60`,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  viewport={{ once: false }}
                >
                  {step.icon}
                  
                  {/* Step number indicator */}
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      backgroundColor: step.color,
                      color: '#000'
                    }}
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      repeatType: "reverse",
                      delay: index * 0.2 
                    }}
                  >
                    {index + 1}
                  </motion.div>
                </motion.div>
                
                <h3 className="text-lg font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Pricing Section with 3D Elements
function PricingSection() {
  const { scrollY } = useFramerScroll()
  
  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out AI podcasting",
      features: [
        "3 podcast episodes per month",
        "Basic AI voices",
        "Standard templates",
        "Community support",
        "720p video export"
      ],
      color: "#3498db",
      popular: false,
      buttonText: "Start Free",
      position: [-3, 0, 0]
    },
    {
      name: "Creator",
      price: "$29",
      period: "/month",
      description: "For serious podcast creators",
      features: [
        "Unlimited podcast episodes",
        "Premium AI voices",
        "Custom templates",
        "Priority support",
        "4K video export",
        "Advanced analytics",
        "Multi-platform publishing"
      ],
      color: "#e74c3c",
      popular: true,
      buttonText: "Start Creating",
      position: [0, 1, 0]
    },
    {
      name: "Studio",
      price: "$79",
      period: "/month",
      description: "For podcast studios and teams",
      features: [
        "Everything in Creator",
        "Team collaboration",
        "Custom voice cloning",
        "White-label solution",
        "API access",
        "Dedicated support",
        "Custom integrations"
      ],
      color: "#9b59b6",
      popular: false,
      buttonText: "Contact Sales",
      position: [3, 0, 0]
    }
  ]

  return (
    <section className="py-32 bg-gradient-to-b from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Pricing background with podcast theme */}
      <div className="absolute inset-0 opacity-10">
        {/* Currency and pricing symbols */}
        {['$', '€', '£', '¥'].map((symbol, i) => (
          <motion.div
            key={`currency-${i}`}
            className="absolute text-6xl font-bold text-blue-400/20"
            style={{
              left: `${15 + i * 20}%`,
              top: `${10 + i * 15}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
              opacity: [0.05, 0.2, 0.05]
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          >
            {symbol}
          </motion.div>
        ))}
        {/* Podcast subscription icons */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`sub-icon-${i}`}
            className="absolute"
            style={{
              right: `${5 + i * 10}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            <svg className="w-8 h-8 text-purple-500/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </motion.div>
        ))}
        {/* Plan connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          {[...Array(3)].map((_, i) => (
            <motion.path
              key={`connection-${i}`}
              d={`M ${200 + i * 200} 100 Q ${300 + i * 200} 200 ${400 + i * 200} 300`}
              stroke="rgba(99, 102, 241, 0.1)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              animate={{
                pathLength: [0, 1, 0]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </svg>
      </div>

      {/* 3D Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color="#3498db" />
          <pointLight position={[-5, 5, 5]} intensity={0.8} color="#e74c3c" />
          <pointLight position={[0, -5, 5]} intensity={0.6} color="#9b59b6" />
          
          {/* 3D Pricing Cards */}
          {pricingPlans.map((plan, index) => (
            <motion.group
              key={index}
              position={plan.position}
            >
              <Float speed={1.2 + index * 0.3} rotationIntensity={0.1} floatIntensity={0.3}>
                {/* Main pricing card */}
                <mesh>
                  <boxGeometry args={[0.8, 1.2, 0.1]} />
                  <meshStandardMaterial 
                    color={plan.color}
                    emissive={plan.color}
                    emissiveIntensity={plan.popular ? 0.3 : 0.1}
                    transparent
                    opacity={0.7}
                  />
                </mesh>
                
                {/* Popular indicator ring */}
                {plan.popular && (
                  <mesh position={[0, 0, 0.2]}>
                    <torusGeometry args={[0.6, 0.03, 8, 32]} />
                    <meshStandardMaterial 
                      color="#f1c40f"
                      emissive="#f1c40f"
                      emissiveIntensity={0.5}
                    />
                  </mesh>
                )}
                
                {/* Floating price symbols */}
                {[1, 2, 3, 4].map((symbolIndex) => (
                  <Float key={symbolIndex} speed={2 + symbolIndex * 0.5}>
                    <mesh position={[
                      Math.cos(symbolIndex * Math.PI / 2) * 1.2,
                      Math.sin(Date.now() * 0.001 + symbolIndex) * 0.3,
                      Math.sin(symbolIndex * Math.PI / 2) * 1.2
                    ]}>
                      <boxGeometry args={[0.05, 0.05, 0.05]} />
                      <meshStandardMaterial 
                        color={plan.color}
                        emissive={plan.color}
                        emissiveIntensity={0.4}
                      />
                    </mesh>
                  </Float>
                ))}
              </Float>
            </motion.group>
          ))}
        </Canvas>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-blue-400 via-red-400 to-purple-400 bg-clip-text text-transparent block">
              Podcasting Plan
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Start free, then scale as your podcast grows. All plans include our core AI features.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              className={`relative p-8 rounded-3xl border transition-all duration-500 ${
                plan.popular 
                  ? 'bg-white/10 border-yellow-400 scale-105' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              style={{ 
                boxShadow: `0 0 30px ${plan.color}20`,
              }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true, amount: 0.1 }}
              whileHover={{ 
                scale: plan.popular ? 1.05 : 1.02,
                y: -5,
                boxShadow: `0 20px 40px ${plan.color}30`,
                transition: { duration: 0.3 }
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <motion.div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-semibold rounded-full text-sm"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  Most Popular
                </motion.div>
              )}
              
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 rounded-3xl"
                style={{
                  background: `radial-gradient(circle at center, ${plan.color}10, transparent 70%)`,
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.5
                }}
              />
              
              <div className="relative z-10">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="text-4xl font-bold"
                      style={{ color: plan.color }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-400 text-lg">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-gray-400 mt-2">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      className="flex items-center gap-3 text-gray-300"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: featureIndex * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${plan.color}20`, border: `1px solid ${plan.color}` }}
                        whileHover={{ scale: 1.2 }}
                      >
                        <svg className="w-3 h-3" style={{ color: plan.color }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </motion.div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>
                
                <motion.button
                  className={`w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:from-yellow-300 hover:to-orange-300'
                      : `bg-transparent border-2 text-white hover:bg-white hover:text-black`
                  }`}
                  style={{
                    borderColor: plan.popular ? 'transparent' : plan.color,
                    color: plan.popular ? 'black' : plan.color
                  }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 0 20px ${plan.color}40`
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {plan.buttonText}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Additional info */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <p className="text-gray-400 mb-4">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              SSL Encrypted
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              99.9% Uptime
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              24/7 Support
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// CTA Section with 3D Elements
function CTA3DSection() {
  const { scrollY } = useFramerScroll()
  
  return (
    <section className="py-32 bg-gradient-to-t from-black via-purple-900/20 to-black relative overflow-hidden">
      {/* CTA background with podcast launch theme */}
      <div className="absolute inset-0 opacity-10">
        {/* Rocket launch trails for "launch your podcast" */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`trail-${i}`}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              bottom: '10%',
              width: '2px',
              height: '200px',
              background: `linear-gradient(to top, transparent, rgba(139, 92, 246, 0.3), transparent)`
            }}
            animate={{
              opacity: [0, 0.6, 0],
              height: ['100px', '300px', '100px']
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        {/* Success stars */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
              opacity: [0, 0.4, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4
            }}
          >
            <svg className="w-4 h-4 text-yellow-400/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </motion.div>
        ))}
        {/* Platform logos background */}
        {['Spotify', 'Apple', 'Google', 'YouTube'].map((platform, i) => (
          <motion.div
            key={`platform-${i}`}
            className="absolute text-4xl font-bold text-gray-600/20"
            style={{
              right: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              transform: `rotate(${-20 + Math.random() * 40}deg)`
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.05, 0.15, 0.05]
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            {platform}
          </motion.div>
        ))}
      </div>

      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#8b5cf6" />
          
          {/* 3D CTA Elements */}
          <motion.group
            animate={{
              rotateY: useTransform(scrollY, [0, 2000], [0, Math.PI * 2]).get()
            }}
          >
            {/* Central Podcast Symbol */}
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
              <mesh position={[0, 0, 0]}>
                <torusGeometry args={[1.5, 0.3, 16, 32]} />
                <meshStandardMaterial 
                  color="#8b5cf6"
                  emissive="#8b5cf6"
                  emissiveIntensity={0.5}
                />
              </mesh>
              {/* Inner microphone */}
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.25, 0.8, 16]} />
                <meshStandardMaterial 
                  color="#2d3748"
                  metalness={0.9}
                  roughness={0.1}
                />
              </mesh>
            </Float>
            
            {/* Orbiting Podcast Elements */}
            {[1, 2, 3, 4].map((i) => (
              <Float key={i} speed={2 + i * 0.5}>
                <mesh position={[
                  Math.cos(i * Math.PI / 2) * 3,
                  Math.sin(Date.now() * 0.001 + i) * 0.5,
                  Math.sin(i * Math.PI / 2) * 3
                ]}>
                  <cylinderGeometry args={[0.1, 0.08, 0.3, 8]} />
                  <meshStandardMaterial 
                    color={['#f1c40f', '#e74c3c', '#2ecc71', '#3498db'][i-1]}
                    emissive={['#f1c40f', '#e74c3c', '#2ecc71', '#3498db'][i-1]}
                    emissiveIntensity={0.3}
                    metalness={0.7}
                  />
                </mesh>
              </Float>
            ))}
          </motion.group>
        </Canvas>
      </div>
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
            Ready to Launch
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent block">
              Your Podcast?
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Join thousands of creators who've transformed their ideas into successful podcasts. 
            Start your journey in less than 5 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <motion.button
              className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full text-lg shadow-2xl relative overflow-hidden group"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 0 30px rgba(139, 92, 246, 0.6)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Create Your First Podcast</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            <motion.button
              className="px-8 py-4 border-2 border-purple-400 text-purple-400 font-semibold rounded-full text-lg hover:bg-purple-400 hover:text-black transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Demo
            </motion.button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {[
              { number: "10K+", label: "Podcasts Created" },
              { number: "50M+", label: "Downloads Generated" },
              { number: "4.9★", label: "User Rating" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
                viewport={{ once: true, amount: 0.1 }}
              >
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="py-16 bg-black border-t border-white/10 relative overflow-hidden">
      {/* Footer background with podcast network theme */}
      <div className="absolute inset-0 opacity-5">
        {/* Network connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          {[...Array(8)].map((_, i) => (
            <motion.circle
              key={`network-${i}`}
              cx={`${20 + i * 10}%`}
              cy={`${30 + (i % 3) * 20}%`}
              r="2"
              fill="rgba(99, 102, 241, 0.3)"
              animate={{
                r: [2, 6, 2],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3 + i * 0.2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
          {[...Array(6)].map((_, i) => (
            <motion.line
              key={`line-${i}`}
              x1={`${20 + i * 12}%`}
              y1="30%"
              x2={`${30 + i * 12}%`}
              y2="50%"
              stroke="rgba(99, 102, 241, 0.2)"
              strokeWidth="1"
              animate={{
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 2.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </svg>
        {/* Podcast wave signatures */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`signature-${i}`}
            className="absolute bottom-5 flex items-end gap-1"
            style={{ left: `${15 + i * 20}%` }}
            animate={{
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5
            }}
          >
            {[...Array(8)].map((_, j) => (
              <motion.div
                key={j}
                className="bg-purple-500/30 w-1 rounded-t"
                animate={{
                  height: [5 + Math.random() * 10, 15 + Math.random() * 20, 5 + Math.random() * 10]
                }}
                transition={{
                  duration: 1 + Math.random(),
                  repeat: Infinity,
                  delay: j * 0.1
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Podcaster</span>
        </div>
        <p className="text-gray-400 mb-8">
          Revolutionizing podcasting with artificial intelligence.
        </p>
        <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
          <span>© {new Date().getFullYear()} Podcaster</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </footer>
  )
}

// Main Home Component
export default function Home() {
  return (
    <div className="bg-black text-white overflow-x-hidden relative">
      {/* Global podcast ambiance background */}
      <div className="fixed inset-0 pointer-events-none opacity-5 z-0">
        {/* Floating microphone icons */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={`global-mic-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -40, 20, 0],
              rotate: [0, 90, -45, 0],
              opacity: [0.02, 0.08, 0.02]
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 10
            }}
          >
            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
              <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
            </svg>
          </motion.div>
        ))}
        {/* Subtle sound waves */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`global-wave-${i}`}
            className="absolute left-0 right-0 h-px"
            style={{ 
              top: `${10 + i * 8}%`,
              background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)'
            }}
            animate={{
              scaleX: [0.5, 1.5, 0.5],
              opacity: [0.02, 0.06, 0.02]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
      </div>
      
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <InteractiveJourneySection />
      <PricingSection />
      <CTA3DSection />
      <Footer />
    </div>
  )
}


