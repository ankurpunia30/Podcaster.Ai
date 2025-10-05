import React from 'react'
import AuthModal from '../components/AuthModal.jsx'
import { useAuthStore } from '../store/useAuthStore.js'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll, Float, OrbitControls } from '@react-three/drei'

function Mic() {
  return (
    <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.6, 12, 24]} />
        <meshStandardMaterial color={'#8b5cf6'} metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[0.32, 0.02, 12, 64]} />
        <meshStandardMaterial color={'#22d3ee'} emissive={'#22d3ee'} emissiveIntensity={0.6} />
      </mesh>
    </Float>
  )
}

function WaveRings({ count=40 }) {
  const rings = Array.from({ length: count })
  return (
    <group>
      {rings.map((_, i) => (
        <mesh key={i} scale={1 + i*0.06} rotation={[Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.35, 0.37, 64]} />
          <meshStandardMaterial color={'#22d3ee'} transparent opacity={Math.max(0, 0.9 - i*0.02)} />
        </mesh>
      ))}
    </group>
  )
}

export default function StoryLanding3D() {
  const { open } = useAuthStore()
  return (
    <div className="h-screen w-screen text-white">
      <Canvas camera={{ position: [0, 1.8, 6], fov: 50 }}>
        <color attach="background" args={["#0f172a"]} />
        <hemisphereLight intensity={0.6} groundColor={'#0f172a'} color={'#f8fafc'} />
        <directionalLight castShadow position={[5, 8, 5]} intensity={1.2} color={'#f8fafc'} />
        <ScrollControls pages={5} damping={0.2}>
          <Scroll>
            {/* Hero mic */}
            <group position={[0, 0.6, 0]}>
              <Mic />
              <group position={[0,0,0]}>
                <WaveRings />
              </group>
            </group>
            {/* Sections visuals (simple placeholders) */}
            <group position={[2.6, -3.2, 0]}>
              <mesh>
                <icosahedronGeometry args={[0.6,0]} />
                <meshStandardMaterial color={'#ec4899'} emissive={'#ec4899'} emissiveIntensity={0.4} />
              </mesh>
            </group>
            <group position={[0, -6.4, 0]}>
              <mesh rotation={[-Math.PI/2,0,0]}>
                <torusGeometry args={[2.2, 0.04, 12, 128, Math.PI]} />
                <meshStandardMaterial color={'#22d3ee'} />
              </mesh>
            </group>
            <group position={[-2.6, -9.4, 0]}>
              <mesh>
                <sphereGeometry args={[0.9, 48, 48]} />
                <meshStandardMaterial color={'#0b1220'} emissive={'#22d3ee'} emissiveIntensity={0.15} />
              </mesh>
            </group>
          </Scroll>
          <Scroll html>
            <div className="absolute inset-0 pointer-events-none">
              <Section top="12vh" title="Create Your First AI Podcast in Minutes" subtitle="Generate a studio‑quality episode with a single prompt. Free to try." onCta={()=>open()} ctaLabel="Generate" />
              <Section top="112vh" title="AI Voices & Instant Generation" subtitle="Lifelike narration and automatic mixing—hear it as you build." />
              <Section top="212vh" title="Smart Timeline Editing" subtitle="Drag intros, ads, and outros on a curved timeline." />
              <Section top="312vh" title="Global Analytics" subtitle="See listener hotspots on a live globe and grow faster." />
              <Section top="412vh" title="Share & Collaborate" subtitle="Publish everywhere and build with your team in real time." onCta={()=>open()} ctaLabel="Get Started" />
            </div>
          </Scroll>
        </ScrollControls>
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="h-7 w-7"/>
            <span className="font-semibold">Podcaster</span>
          </div>
          <div className="pointer-events-auto flex items-center gap-3">
            <a href="/learn" className="text-slate-300 hover:text-white">Learn</a>
            <a href="/create" className="text-slate-300 hover:text-white">Create</a>
            <button onClick={()=>open()} className="bg-blue-500/90 hover:bg-blue-500 rounded px-4 py-2">Sign in</button>
          </div>
        </div>
      </div>
      <AuthModal />
    </div>
  )
}

function Section({ top, title, subtitle, ctaHref, onCta, ctaLabel='Get Started' }) {
  return (
    <div style={{ position: 'absolute', top, left: '50%', transform: 'translateX(-50%)' }} className="pointer-events-auto w-[min(92vw,900px)] text-center">
      <div className="mx-auto rounded-xl backdrop-blur bg-black/35 border border-white/10 p-6 shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">{title}</h2>
        <p className="mt-2 text-slate-200">{subtitle}</p>
        {ctaHref && <a href={ctaHref} className="inline-block mt-4 bg-blue-500/90 hover:bg-blue-500 rounded px-5 py-3 shadow-lg shadow-blue-500/30">{ctaLabel}</a>}
        {onCta && <button onClick={onCta} className="inline-block mt-4 bg-blue-500/90 hover:bg-blue-500 rounded px-5 py-3 shadow-lg shadow-blue-500/30">{ctaLabel}</button>}
      </div>
    </div>
  )
}


