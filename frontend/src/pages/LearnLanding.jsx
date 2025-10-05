import React from 'react'
import { motion } from 'framer-motion'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } }

export default function LearnLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
      {/* Simple top bar */}
      <header className="sticky top-0 z-20 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Podcaster" className="h-7 w-7" />
            <span className="font-semibold">Podcaster Learn</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#articles" className="hover:text-white">Articles</a>
            <a href="#courses" className="hover:text-white">Courses</a>
            <a href="#testimonials" className="hover:text-white">Reviews</a>
            <a href="#community" className="hover:text-white">Community</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.h1 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.7, once: false }} className="text-4xl md:text-6xl font-bold leading-tight">
            Learn, Design, and Ship Better Audio Experiences
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.7 }} className="mt-4 text-slate-300 max-w-2xl mx-auto">
            Courses, articles, and tools for AI-first podcasting, UX, and product storytellers.
          </motion.p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <motion.a whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} href="#courses" className="bg-blue-500/90 hover:bg-blue-500 rounded px-5 py-3 shadow-lg shadow-blue-500/30">Browse Courses</motion.a>
            <motion.a whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} href="#articles" className="bg-white/10 hover:bg-white/20 rounded px-5 py-3 border border-white/20">Read Articles</motion.a>
          </div>
        </section>

        {/* Featured Articles */}
        <section id="articles" className="max-w-6xl mx-auto px-4 py-14">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.5 }} className="text-2xl md:text-3xl font-semibold mb-6">Featured Articles</motion.h2>
          <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.article key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.3 }} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:shadow-xl hover:shadow-blue-500/10 transition">
                <div className="text-xs text-slate-400">Sep {10+i}, 2025 • 6 min read</div>
                <h3 className="mt-2 font-semibold">Designing Audio-First Interfaces #{i+1}</h3>
                <p className="text-sm text-slate-300 mt-1">Tactics for guiding attention with sound, motion, and space.</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <img src="/logo.svg" className="h-5 w-5 rounded" />
                  <span>Podcaster Team</span>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Courses / Certificates */}
        <section id="courses" className="max-w-6xl mx-auto px-4 py-14">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.5 }} className="text-2xl md:text-3xl font-semibold mb-6">Courses & Certificates</motion.h2>
          <div className="grid md:grid-cols-3 gap-4">
            {['AI Podcast Design', 'TTS Voice Design', 'Audio UX Foundations'].map((title, i) => (
              <motion.div key={title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.3 }} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:shadow-xl hover:shadow-pink-500/10 transition">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-slate-300 mt-1">Start: Oct {5 + i}, 2025 • 4 weeks • Self-paced</p>
                <a href="#" className="inline-block mt-3 text-blue-300 hover:text-blue-200">View syllabus →</a>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="max-w-6xl mx-auto px-4 py-14">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.5 }} className="text-2xl md:text-3xl font-semibold mb-6">What learners say</motion.h2>
          <div className="grid md:grid-cols-3 gap-4">
            {["“Clear, actionable — made me rethink my show.”", "“Loved the voice design module.”", "“The projects are portfolio-ready.”"].map((q, i) => (
              <motion.blockquote key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.3 }} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-slate-200">{q}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <img src="/logo.svg" className="h-5 w-5 rounded" />
                  <span>Alex • Product Designer</span>
                </div>
              </motion.blockquote>
            ))}
          </div>
        </section>

        {/* Community */}
        <section id="community" className="max-w-6xl mx-auto px-4 py-14">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.5 }} className="text-2xl md:text-3xl font-semibold mb-6">Community & Resources</motion.h2>
          <div className="grid md:grid-cols-4 gap-4">
            {["Discord", "Templates", "Case Studies", "Tools"].map((t) => (
              <motion.div key={t} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ amount: 0.3 }} whileHover={{ scale: 1.02 }} className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-slate-300">{t}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-4 py-14 text-slate-300">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2">
                <img src="/logo.svg" className="h-7 w-7" />
                <span className="font-semibold">Podcaster Learn</span>
              </div>
              <p className="text-sm mt-2">Practical courses and resources for AI-first audio and UX.</p>
            </div>
            <form className="space-y-2">
              <label className="text-sm">Join newsletter</label>
              <div className="flex gap-2">
                <input placeholder="you@example.com" className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 placeholder:text-slate-400" />
                <button className="bg-blue-500/90 hover:bg-blue-500 rounded px-4">Subscribe</button>
              </div>
            </form>
            <div className="flex items-center gap-4 justify-start md:justify-end">
              {['Twitter','GitHub','LinkedIn'].map((s)=> (
                <a key={s} href="#" className="hover:text-white hover:scale-105 transition">{s}</a>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-6">© {new Date().getFullYear()} Podcaster</div>
        </footer>
      </main>
    </div>
  )
}


