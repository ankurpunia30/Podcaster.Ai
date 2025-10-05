import React from 'react'
import { motion } from 'framer-motion'

export default function Landing() {
  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900">
      <div className="sticky top-0 z-20 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Podcaster" className="h-8 w-8" />
            <span className="font-semibold">Podcaster</span>
          </div>
          <a href="/learn" className="text-sm text-slate-300 hover:text-white">Learn</a>
        </div>
      </div>
      <ReferralBanner />
      <div className="max-w-6xl mx-auto px-4">
        <section className="py-20 text-center relative">
          <HeroWave />
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Create Your First AI Podcast in Minutes</h1>
            <p className="mt-3 text-slate-300">Experience AI-powered podcasting for free. No credit card required.</p>
            <HeroInlineForm />
          </div>
        </section>
        <TrustBar />
        <SectionCardStatic title="Why Podcaster" subtitle="Everything you need to go from idea to episode."><ValueGrid /></SectionCardStatic>
        <SectionCardStatic title="Try one free podcast today — instantly!" subtitle="Draft a topic, choose a voice, generate.">
          <div className="grid md:grid-cols-3 gap-4 text-left">
            {["Draft topic","Pick voice","Generate"].map((s,i)=> (
              <div key={s} className="bg-white/5 border border-white/10 rounded p-4">
                <div className="text-sm text-slate-300">Step {i+1}</div>
                <div className="font-semibold mt-1">{s}</div>
              </div>
            ))}
          </div>
          <a href="/dashboard" className="inline-block mt-5 bg-blue-500/90 hover:bg-blue-500 rounded px-5 py-3 shadow-lg shadow-blue-500/30">Generate My Free Podcast</a>
        </SectionCardStatic>
        <SectionCardStatic title="Popular AI‑Generated Podcasts" subtitle="Trending samples from our community."><PopularCarousel /></SectionCardStatic>
        <SectionCardStatic title="How it works" subtitle="Three simple steps to publish."><HowSteps /></SectionCardStatic>
        <SectionCardStatic title="What listeners say" subtitle="Social proof that builds trust."><TestimonialsGrid /></SectionCardStatic>
        <SectionCardStatic title="Go Pro — Unlock Unlimited Podcasts" subtitle="More voices, longer episodes, analytics, and priority mixing."><PlanCompare /></SectionCardStatic>
        <SectionCardStatic title="Join our community" subtitle="Get podcast tips & AI insights."><FooterCompact /></SectionCardStatic>
      </div>
    </div>
  )
}

function SectionBlock({ innerRef, idx=0, align='center', title, subtitle, ctaHref, learnHref }) {
  // Center vertically in viewport, one section per page
  const top = `calc(${idx}00vh + 50vh)`
  return (
    <div ref={innerRef} style={{ position: 'absolute', top, left: '50%', transform: 'translate(-50%, -50%)', width: 'min(92vw, 960px)' }} className={`pointer-events-auto text-${align}`}>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.6, once: false }} transition={{ duration: 0.6, ease: 'easeOut' }} className="mx-auto max-w-3xl rounded-xl backdrop-blur bg-black/45 border border-white/10 p-8 shadow-2xl">
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">{title}</h2>
        <p className="mt-3 text-slate-200 text-lg">{subtitle}</p>
        <div className="mt-5 flex items-center gap-3 justify-center">
          {ctaHref && (
            <a href={ctaHref} className="inline-block bg-blue-500/90 hover:bg-blue-500 transition rounded px-5 py-3 shadow-lg shadow-blue-500/30">Generate My Podcast</a>
          )}
          {learnHref && (
            <a href={learnHref} className="inline-block bg-white/10 hover:bg-white/20 transition rounded px-5 py-3 border border-white/20">Try in Studio</a>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function SectionCard({ title, subtitle, children }) { return null }

function SectionCardStatic({ title, subtitle, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.4 }} transition={{ duration: 0.6 }} className="py-14">
      <div className="mx-auto rounded-xl backdrop-blur bg-black/35 border border-white/10 p-8 shadow-2xl">
        <h3 className="text-2xl md:text-3xl font-semibold text-center">{title}</h3>
        {subtitle && <p className="text-center text-slate-300 mt-2">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </motion.section>
  )
}

function ValueGrid() {
  const items = [
    { t: 'AI Voices & Avatars', d: 'Multiple realistic voices and animated avatars.', icon: '🎙️' },
    { t: 'Instant Episode Generation', d: 'From topic to audio in minutes.', icon: '⚡' },
    { t: 'Smart Editing Tools', d: 'Fine‑tune script, pacing, and music.', icon: '✂️' },
    { t: 'Analytics & Insights', d: 'Understand listeners and growth.', icon: '📈' },
  ]
  return (
    <div className="grid md:grid-cols-4 gap-4 text-left">
      {items.map((it) => (
        <div key={it.t} className="bg-white/5 border border-white/10 rounded p-4 hover:shadow-lg hover:shadow-blue-500/10 transition">
          <div className="flex items-center gap-2 font-semibold"><span className="text-lg" aria-hidden>{it.icon}</span>{it.t}</div>
          <p className="text-sm text-slate-300 mt-1">{it.d}</p>
        </div>
      ))}
    </div>
  )
}

function PopularCarousel() {
  const items = Array.from({ length: 6 }).map((_, i) => ({
    title: `AI Daily #${i+1}`,
    desc: 'Trends, tools, and insights from the AI scene.',
    dur: `${8 + i} min`,
  }))
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {items.map((it, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded overflow-hidden hover:shadow-xl hover:shadow-pink-500/10 transition">
          <div className="relative h-28 bg-gradient-to-br from-blue-500/30 to-pink-500/30">
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="h-10 w-10 rounded-full bg-white/90 text-slate-900">▶</button>
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-400">{it.dur}</div>
            <div className="font-semibold mt-1">{it.title}</div>
            <p className="text-sm text-slate-300 mt-1">{it.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function HowSteps() {
  const steps = [
    { n: 1, t: 'Choose a topic' },
    { n: 2, t: 'Customize voice & script' },
    { n: 3, t: 'Generate & publish' },
  ]
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {steps.map((s) => (
        <div key={s.n} className="bg-white/5 border border-white/10 rounded p-4 text-center">
          <div className="text-sm text-slate-300">Step {s.n}</div>
          <div className="font-semibold mt-1">{s.t}</div>
          {s.n < 3 && <div className="mt-3 text-slate-400">→</div>}
        </div>
      ))}
    </div>
  )
}

function HeroWave() {
  return (
    <svg className="pointer-events-none absolute -z-10 left-0 right-0 -top-8 w-full" height="140" viewBox="0 0 1440 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 80 C 180 20, 360 140, 540 80 S 900 20, 1080 80 S 1260 140, 1440 80" stroke="url(#grad)" strokeWidth="2" fill="none" opacity="0.35"/>
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="50%" stopColor="#8b5cf6"/>
          <stop offset="100%" stopColor="#ec4899"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function TestimonialsGrid() {
  const quotes = [
    '“Clear, actionable — made me rethink my show.”',
    '“Loved the voice design module.”',
    '“The projects are portfolio‑ready.”',
  ]
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {quotes.map((q, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded p-4">
          <p className="text-slate-200">{q}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <img src="/logo.svg" className="h-5 w-5 rounded" />
            <span>Alex • Product Designer</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlanCompare() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white/5 border border-white/10 rounded p-5">
        <div className="font-semibold">Free</div>
        <ul className="mt-2 text-sm text-slate-300 list-disc list-inside">
          <li>1 free podcast</li>
          <li>Basic voices</li>
          <li>Community support</li>
        </ul>
      </div>
      <div className="bg-blue-500/10 ring-2 ring-blue-500 rounded p-5">
        <div className="font-semibold">Pro</div>
        <ul className="mt-2 text-sm text-slate-200 list-disc list-inside">
          <li>Unlimited podcasts</li>
          <li>Premium voices</li>
          <li>Analytics & priority mixing</li>
        </ul>
        <a href="/studio" className="inline-block mt-4 bg-blue-500 rounded px-4 py-2">Upgrade to Pro</a>
      </div>
    </div>
  )
}

function FooterCompact() {
  return (
    <div className="text-center">
      <form className="inline-flex gap-2">
        <input placeholder="you@example.com" className="bg-white/10 border border-white/20 rounded px-3 py-2 placeholder:text-slate-400" />
        <button className="bg-blue-500/90 hover:bg-blue-500 rounded px-4">Subscribe</button>
      </form>
      <div className="mt-3 flex items-center justify-center gap-4 text-slate-300">
        {['Twitter','GitHub','LinkedIn'].map((s)=> (
          <a key={s} href="#" className="hover:text-white hover:scale-105 transition">{s}</a>
        ))}
      </div>
      <div className="text-xs text-slate-500 mt-3">© {new Date().getFullYear()} Podcaster</div>
    </div>
  )
}

// removed 3D helpers

function HeroInlineForm() {
  const [topic, setTopic] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [audioUrl, setAudioUrl] = React.useState('')
  async function submit(e) {
    e.preventDefault()
    if (!topic) return
    try {
      setLoading(true)
      const t = localStorage.getItem('token')
      const headers = t ? { Authorization: `Bearer ${t}` } : {}
      const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/script/generate`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', ...headers }, 
        body: JSON.stringify({ 
          topic: topic,
          style: "conversational",
          duration_minutes: 2,
          tone: "professional",
          include_intro: true,
          include_outro: true
        }) 
      })
      const data = await res.json()
      setAudioUrl(data?.audioUrl || '')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="mt-5 max-w-xl mx-auto">
      <form onSubmit={submit} className="flex gap-2">
        <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="Enter topic or title" className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-3 placeholder:text-slate-400" />
        <button disabled={!topic || loading} className="bg-blue-500/90 hover:bg-blue-500 rounded px-5 py-3 shadow-lg shadow-blue-500/30 disabled:opacity-60">{loading? 'Generating…' : 'Generate Free Podcast'}</button>
      </form>
      {audioUrl && (
        <div className="mt-4 text-left bg-white/5 border border-white/10 rounded p-4">
          <div className="text-sm text-slate-300 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-xs">Watermark</span>
            <span>Preview (30–60s). Upgrade to remove watermark and unlock full length.</span>
          </div>
          <audio className="mt-2 w-full" controls src={audioUrl} />
          <a href="/dashboard" className="inline-block mt-3 bg-blue-500/90 hover:bg-blue-500 rounded px-4 py-2">Upgrade to Pro</a>
        </div>
      )}
    </div>
  )
}

function TrustBar() {
  const logos = ['CreatorHub','StudioFlow','AudioCraft','WaveLab','Podlytics']
  return (
    <div className="py-6">
      <div className="text-center text-slate-400 text-sm">Trusted by creators at</div>
      <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-3 text-center text-slate-300 opacity-80">
        {logos.map(l => <div key={l} className="bg-white/5 border border-white/10 rounded px-3 py-2">{l}</div>)}
      </div>
    </div>
  )
}

function ReferralBanner() {
  const [link, setLink] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  React.useEffect(() => {
    // create or fetch referral code
    let code = localStorage.getItem('refCode')
    if (!code) {
      code = Math.random().toString(36).slice(2, 8)
      localStorage.setItem('refCode', code)
    }
    const url = new URL(window.location.href)
    url.searchParams.set('ref', code)
    setLink(url.toString())

    // credit if visited with ?ref= and not self, once per session
    const paramRef = new URLSearchParams(window.location.search).get('ref')
    const credited = sessionStorage.getItem('creditedRef')
    if (paramRef && paramRef !== code && !credited) {
      const current = Number(localStorage.getItem('credits') || 1)
      localStorage.setItem('credits', String(current + 1))
      sessionStorage.setItem('creditedRef', '1')
    }
  }, [])
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(()=>setCopied(false), 1200) } catch {}
  }
  return (
    <div className="bg-blue-500/10 border-b border-blue-500/30">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 text-sm">
        <span>Invite a friend, get 1 credit</span>
        <div className="flex-1 overflow-hidden">
          <span className="truncate text-slate-300">{link}</span>
        </div>
        <button onClick={copy} className="bg-blue-500/90 hover:bg-blue-500 rounded px-3 py-1">{copied? 'Copied' : 'Copy link'}</button>
      </div>
    </div>
  )
}


