import React from 'react'

export default function Benefits() {
  const items = [
    { t: 'Generate in minutes', d: 'From topic to finished audio faster than it takes to make coffee.' },
    { t: 'Realistic AI voices', d: 'Multiple styles, languages, and emotions.' },
    { t: 'Smart mixing', d: 'Automatic music ducking and consistent loudness.' },
    { t: 'One‑click publish', d: 'Share to your audience with branded links and embeds.' },
    { t: 'Analytics & growth', d: 'Track listens, completion, and top sources.' },
    { t: 'Team collaboration', d: 'Comment, version, and ship together.' },
  ]
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-white">
      <header className="sticky top-0 z-20 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="max-w-6xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" className="h-7 w-7" />
            <span className="font-semibold">Why Podcaster</span>
          </div>
          <a className="bg-blue-500/90 hover:bg-blue-500 rounded px-4 py-2" href="/dashboard">Start free</a>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">Create more. Edit less. Grow faster.</h1>
          <p className="mt-3 text-slate-300">Podcaster streamlines scripting, voice, and mixing—so you can publish consistently and focus on what matters: your content.</p>
        </div>
        <section className="mt-10 grid md:grid-cols-3 gap-4">
          {items.map(i => (
            <div key={i.t} className="bg-white/5 border border-white/10 rounded p-4">
              <div className="font-semibold">{i.t}</div>
              <p className="text-sm text-slate-300 mt-1">{i.d}</p>
            </div>
          ))}
        </section>
        <section className="mt-12 text-center">
          <a className="inline-block bg-blue-500/90 hover:bg-blue-500 rounded px-5 py-3 shadow-lg shadow-blue-500/30" href="/create">Generate your first episode</a>
          <p className="mt-2 text-slate-400 text-sm">No credit card required.</p>
        </section>
      </main>
    </div>
  )
}


