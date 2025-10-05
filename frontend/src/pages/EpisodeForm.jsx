import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useNotificationStore } from '../store/useNotificationStore'

const initial = {
  title: '',
  genre: '',
  audience: '',
  language: 'English',
  duration: '15 minutes',
  tone: 'Motivational',
  script: '',
  audio_cues: '',
  short_description: '',
  long_description: '',
  keywords: '',
  promo_text: '',
  voice_style: 'Warm, conversational',
  music_style: 'Modern indie-electronic',
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export default function EpisodeForm() {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [currentStep, setCurrentStep] = useState(1)
  const [mode, setMode] = useState('ai') // 'manual' | 'ai'
  const [aiTopic, setAiTopic] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0) // Force re-render key
  const { success, error: notifyError, info } = useNotificationStore()

  // Debug: Monitor form changes
  useEffect(() => {
    console.log('Form state updated:', { 
      title: form.title, 
      script: form.script?.length, 
      hasScript: !!form.script 
    })
  }, [form.title, form.script])

  // Debug: Monitor generated content changes  
  useEffect(() => {
    if (generatedContent) {
      console.log('Generated content state updated:', generatedContent)
    }
  }, [generatedContent])

  const steps = [
    { id: 1, title: 'Basic Info', icon: '📝', description: 'Set up your podcast details' },
    { id: 2, title: 'Content', icon: '✨', description: 'Generate or write your script' },
    { id: 3, title: 'Voice & Style', icon: '🎙️', description: 'Choose voice and audio settings' },
    { id: 4, title: 'Review', icon: '👁️', description: 'Review and generate podcast' }
  ]

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const validateStep = (step) => {
    const e = {}
    switch (step) {
      case 1:
        if (!form.title) e.title = 'Title is required'
        if (!form.genre) e.genre = 'Genre is required'
        if (!form.audience) e.audience = 'Target audience is required'
        break
      case 2:
        if (mode === 'manual' && !form.script) e.script = 'Script is required'
        if (mode === 'ai' && !aiTopic) e.aiTopic = 'Topic is required for AI generation'
        break
      case 3:
        if (!form.voice_style) e.voice_style = 'Voice style is required'
        break
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const generateWithAI = async () => {
    if (!aiTopic.trim()) {
      setErrors({ aiTopic: 'Please enter a topic' })
      return
    }

    setAiLoading(true)
    setIsGenerating(true)
    setProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 10 : prev)
      }, 200)

      // Use your AI service's script generation endpoint
      const durationMinutes = parseInt(form.duration.replace(/\D/g, '')) || 15
      const response = await axios.post(`${API_BASE}/script/generate`, {
        topic: aiTopic,
        style: form.tone.toLowerCase(),
        duration_minutes: durationMinutes,
        tone: form.tone.toLowerCase(),
        include_intro: true,
        include_outro: true
      })
      
      const scriptData = response.data
      const generated = {
        title: form.title || `${aiTopic.substring(0, 50)}${aiTopic.length > 50 ? '...' : ''}`,
        script: scriptData.script || '',
        short_description: `A ${durationMinutes}-minute podcast about ${aiTopic}`,
        long_description: scriptData.script ? scriptData.script.substring(0, 200) + '...' : '',
        keywords: aiTopic.split(' ').slice(0, 5).join(', '),
        promo_text: `Join us for an engaging discussion about ${aiTopic}`
      }

      clearInterval(progressInterval)
      setProgress(100)

      if (generated) {
        console.log('Generated content:', generated) // Debug log
        setGeneratedContent(generated)
        
        // Update form with generated content - use functional state updates
        setForm(prev => {
          const updatedForm = {
            ...prev,
            title: generated.title || prev.title,
            script: generated.script || '',
            short_description: generated.short_description || '',
            long_description: generated.long_description || '',
            keywords: generated.keywords || '',
            promo_text: generated.promo_text || ''
          }
          console.log('Form updated:', updatedForm) // Debug log
          return updatedForm
        })
        
        // Force re-render
        setRefreshKey(prev => prev + 1)
        
        success('AI content generated successfully!', 'Generation Complete')
        
        // Move to voice selection after a short delay
        setTimeout(() => {
          console.log('Moving to step 3') // Debug log
          setCurrentStep(3)
        }, 1000)
      } else {
        console.error('No generated content received')
        notifyError('No content was generated. Please try again.')
      }
    } catch (error) {
      console.error('AI Generation failed:', error)
      setErrors({ ai: 'Failed to generate content. Please try again.' })
    } finally {
      setAiLoading(false)
      setTimeout(() => setIsGenerating(false), 1000)
    }
  }

  const generatePodcast = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return

    try {
      setIsGenerating(true)
      setProgress(0)

      const progressInterval = setInterval(() => {
        setProgress(prev => prev < 90 ? prev + 5 : prev)
      }, 500)

      const payload = {
        title: form.title,
        genre: form.genre,
        audience: form.audience,
        language: form.language,
        duration: form.duration,
        tone: form.tone,
        script: form.script,
        audio_cues: form.audio_cues.split('\n').filter(Boolean),
        metadata: {
          short_description: form.short_description,
          long_description: form.long_description,
          keywords: form.keywords.split(',').map(k => k.trim()),
          promo_text: form.promo_text,
        },
        voice_style: form.voice_style,
        music_style: form.music_style,
      }

      let result
      // Use your AI service's complete podcast generation endpoint
      const durationMinutes = parseInt(form.duration.replace(/\D/g, '')) || 15
      const podcastRequest = {
        script_params: {
          topic: form.title,
          style: form.tone.toLowerCase(),
          duration: durationMinutes,
          audience: form.audience.toLowerCase()
        },
        tts_params: {
          text: form.script,
          model: "coqui",
          speed: 1.0,
          pitch: 0.0
        },
        audio_params: {
          enhance_audio: true,
          remove_noise: true,
          normalize: true,
          add_effects: false
        },
        include_music: false
      }
      
      const response = await axios.post(`${API_BASE}/podcast/generate`, podcastRequest)
      result = response.data
      
      clearInterval(progressInterval)
      setProgress(100)

      if (result) {
        success('Podcast generated successfully!', 'Generation Complete')
        // Redirect to success page or show success modal
        setTimeout(() => {
          window.location.href = '/dashboard?tab=library'
        }, 1500)
      }
    } catch (error) {
      console.error('Podcast generation failed:', error)
      setErrors({ generation: 'Failed to generate podcast. Please try again.' })
      notifyError(error.message || 'Failed to generate podcast. Please try again.', 'Generation Failed')
    } finally {
      setTimeout(() => setIsGenerating(false), 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute opacity-[0.02]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180],
              opacity: [0.02, 0.05, 0.02],
            }}
            transition={{
              duration: 8 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1c-1.66 0-3 1.34-3 3v5c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3z"/>
              <path d="M19 10v1c0 3.87-3.13 7-7 7s-7-3.13-7-7v-1H3v1c0 4.72 3.56 8.61 8 9.31V22h2v-1.69c4.44-.7 8-4.59 8-9.31v-1h-2z"/>
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 backdrop-blur-xl bg-black/20 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="w-10 h-10 bg-white/5 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Create New Podcast</h1>
                <p className="text-gray-400">Build your podcast with AI assistance</p>
              </div>
            </div>
            
            {/* Save Draft */}
            <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all">
              Save Draft
            </button>
          </div>
        </div>
      </motion.header>

      {/* Progress Steps */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-12">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              className="flex items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex flex-col items-center">
                <motion.div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    currentStep >= step.id 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white/5 border-white/20 text-gray-400'
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="text-2xl">{step.icon}</span>
                </motion.div>
                <div className="mt-3 text-center">
                  <p className={`font-medium ${currentStep >= step.id ? 'text-white' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-20 h-px mx-4 ${
                  currentStep > step.id ? 'bg-blue-500' : 'bg-white/20'
                }`} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div 
          className="bg-white/5 border border-white/10 rounded-3xl p-8"
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 && <BasicInfoStep form={form} update={update} errors={errors} />}
            {currentStep === 2 && (
              <ContentStep 
                mode={mode} 
                setMode={setMode}
                form={form} 
                update={update} 
                aiTopic={aiTopic}
                setAiTopic={setAiTopic}
                generateWithAI={generateWithAI}
                aiLoading={aiLoading}
                errors={errors}
                generatedContent={generatedContent}
                isGenerating={isGenerating}
                progress={progress}
              />
            )}
            {currentStep === 3 && <VoiceStyleStep form={form} update={update} errors={errors} />}
            {currentStep === 4 && (
              <ReviewStep 
                form={form} 
                generatePodcast={generatePodcast}
                isGenerating={isGenerating}
                progress={progress}
                errors={errors}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <motion.button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/20 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
            whileHover={{ scale: currentStep > 1 ? 1.02 : 1 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </motion.button>

          {currentStep < 4 ? (
            <motion.button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          ) : (
            <motion.button
              onClick={generatePodcast}
              disabled={isGenerating}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 transition-all"
              whileHover={{ scale: isGenerating ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </>
              ) : (
                <>
                  🚀 Generate Podcast
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
function BasicInfoStep({ form, update, errors }) {
  const genres = [
    'Technology', 'Business', 'Health & Fitness', 'Education', 'Comedy',
    'News & Politics', 'Science', 'History', 'Arts & Culture', 'Sports',
    'True Crime', 'Personal Development', 'Entrepreneurship', 'Marketing'
  ]

  const durations = [
    '5 minutes', '10 minutes', '15 minutes', '20 minutes', 
    '30 minutes', '45 minutes', '60 minutes'
  ]

  const tones = [
    'Professional', 'Conversational', 'Educational', 'Motivational',
    'Humorous', 'Serious', 'Inspiring', 'Analytical', 'Storytelling'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
        <p className="text-gray-400">Let's start with the fundamentals of your podcast.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Podcast Title *
          </label>
          <input
            value={form.title}
            onChange={update('title')}
            placeholder="e.g., The Future of AI in Healthcare"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 transition-all ${
              errors.title ? 'border-red-500' : 'border-white/20 focus:border-blue-500/50'
            }`}
          />
          {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Genre/Category *
          </label>
          <select
            value={form.genre}
            onChange={update('genre')}
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white focus:bg-white/10 transition-all ${
              errors.genre ? 'border-red-500' : 'border-white/20 focus:border-blue-500/50'
            }`}
          >
            <option value="" className="bg-gray-900">Select a genre...</option>
            {genres.map(genre => (
              <option key={genre} value={genre} className="bg-gray-900">{genre}</option>
            ))}
          </select>
          {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Audience *
          </label>
          <input
            value={form.audience}
            onChange={update('audience')}
            placeholder="e.g., Healthcare professionals, Tech enthusiasts"
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 transition-all ${
              errors.audience ? 'border-red-500' : 'border-white/20 focus:border-blue-500/50'
            }`}
          />
          {errors.audience && <p className="text-red-400 text-sm mt-1">{errors.audience}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Language
          </label>
          <select
            value={form.language}
            onChange={update('language')}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            <option value="English" className="bg-gray-900">English</option>
            <option value="Spanish" className="bg-gray-900">Spanish</option>
            <option value="French" className="bg-gray-900">French</option>
            <option value="German" className="bg-gray-900">German</option>
            <option value="Italian" className="bg-gray-900">Italian</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Duration
          </label>
          <select
            value={form.duration}
            onChange={update('duration')}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            {durations.map(duration => (
              <option key={duration} value={duration} className="bg-gray-900">{duration}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tone & Style
          </label>
          <select
            value={form.tone}
            onChange={update('tone')}
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all"
          >
            {tones.map(tone => (
              <option key={tone} value={tone} className="bg-gray-900">{tone}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Short Description
        </label>
        <textarea
          value={form.short_description}
          onChange={update('short_description')}
          placeholder="A brief description of what this podcast episode covers..."
          rows={3}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all"
        />
      </div>
    </motion.div>
  )
}

function ContentStep({ mode, setMode, form, update, aiTopic, setAiTopic, generateWithAI, aiLoading, errors, generatedContent, isGenerating, progress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Content Creation</h2>
        <p className="text-gray-400">Choose how you want to create your podcast content.</p>
      </div>

      {/* Mode Selection */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.button
          onClick={() => setMode('ai')}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${
            mode === 'ai' 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-semibold text-white">AI Generation</h3>
              <p className="text-sm text-gray-400">Let AI create your script</p>
            </div>
          </div>
          <p className="text-sm text-gray-300">
            Provide a topic and let our AI generate a complete script, descriptions, and metadata for your podcast.
          </p>
        </motion.button>

        <motion.button
          onClick={() => setMode('manual')}
          className={`p-6 rounded-2xl border-2 transition-all text-left ${
            mode === 'manual' 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl">✍️</div>
            <div>
              <h3 className="font-semibold text-white">Manual Writing</h3>
              <p className="text-sm text-gray-400">Write your own script</p>
            </div>
          </div>
          <p className="text-sm text-gray-300">
            Have full control over your content by writing your own script and podcast details.
          </p>
        </motion.button>
      </div>

      {/* AI Generation Interface */}
      {mode === 'ai' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Podcast Topic *
            </label>
            <textarea
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="e.g., Explore the impact of artificial intelligence on modern healthcare, including diagnostic tools, treatment personalization, and ethical considerations for medical professionals"
              rows={4}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 transition-all ${
                errors.aiTopic ? 'border-red-500' : 'border-white/20 focus:border-blue-500/50'
              }`}
            />
            {errors.aiTopic && <p className="text-red-400 text-sm mt-1">{errors.aiTopic}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Be as detailed as possible. Include key points, target audience considerations, and any specific angles you want covered.
            </p>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div>
                  <h3 className="font-semibold text-white">AI is generating your podcast...</h3>
                  <p className="text-sm text-gray-400">This may take 30-60 seconds</p>
                </div>
              </div>
              
              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-400">{progress}% complete</p>
            </motion.div>
          )}

          {/* Generated Content Preview */}
          {generatedContent && (
            <motion.div
              key={generatedContent.title + Date.now()} // Force re-render
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">✨</span>
                <h3 className="font-semibold text-green-400">Content Generated Successfully!</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-300">Title:</p>
                  <p className="text-white">{generatedContent.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">Script Preview:</p>
                  <p className="text-gray-300 text-sm">{generatedContent.script?.substring(0, 200)}...</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Form Script Length: {form.script?.length || 0} characters</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            onClick={generateWithAI}
            disabled={aiLoading || !aiTopic.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            whileHover={{ scale: aiLoading ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {aiLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Generating Content...
              </div>
            ) : (
              '✨ Generate with AI'
            )}
          </motion.button>
        </motion.div>
      )}

      {/* Manual Script Editor */}
      {mode === 'manual' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Podcast Script *
            </label>
            <textarea
              key={`script-${refreshKey}`} // Force re-render when content updates
              value={form.script}
              onChange={update('script')}
              placeholder="Write your podcast script here. Include natural speech patterns, pauses, and emphasis where needed..."
              rows={12}
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 transition-all font-mono text-sm ${
                errors.script ? 'border-red-500' : 'border-white/20 focus:border-blue-500/50'
              }`}
            />
            {errors.script && <p className="text-red-400 text-sm mt-1">{errors.script}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Word count: {form.script.split(' ').filter(Boolean).length} words
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Keywords (comma-separated)
              </label>
              <input
                value={form.keywords}
                onChange={update('keywords')}
                placeholder="AI, healthcare, technology, innovation"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audio Cues (line-separated)
              </label>
              <textarea
                value={form.audio_cues}
                onChange={update('audio_cues')}
                placeholder="[Pause]&#10;[Background music starts]&#10;[Emphasis on 'important']"
                rows={3}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>
        </motion.div>
      )}

      {errors.ai && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm">{errors.ai}</p>
        </div>
      )}
    </motion.div>
  )
}

function VoiceStyleStep({ form, update, errors }) {
  const voices = [
    { 
      name: 'Nova', 
      accent: 'US English', 
      gender: 'Female',
      description: 'Warm and professional, perfect for educational content',
      style: 'Warm, conversational',
      preview: '🎵'
    },
    { 
      name: 'Orion', 
      accent: 'British English', 
      gender: 'Male',
      description: 'Authoritative and clear, great for news and analysis',
      style: 'Professional, authoritative',
      preview: '🎵'
    },
    { 
      name: 'Lyra', 
      accent: 'Australian English', 
      gender: 'Female',
      description: 'Friendly and engaging, ideal for lifestyle content',
      style: 'Friendly, engaging',
      preview: '🎵'
    },
    { 
      name: 'Atlas', 
      accent: 'Canadian English', 
      gender: 'Male',
      description: 'Calm and trustworthy, perfect for business podcasts',
      style: 'Calm, trustworthy',
      preview: '🎵'
    },
  ]

  const musicStyles = [
    'No background music',
    'Ambient electronic',
    'Modern indie-electronic', 
    'Classical piano',
    'Upbeat corporate',
    'Soft jazz',
    'Nature sounds',
    'Minimal techno'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Voice & Audio Style</h2>
        <p className="text-gray-400">Choose the perfect voice and audio styling for your podcast.</p>
      </div>

      {/* Voice Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          AI Voice Selection
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          {voices.map((voice) => (
            <motion.button
              key={voice.name}
              onClick={() => update('voice_style')({ target: { value: voice.style } })}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                form.voice_style === voice.style
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{voice.name}</h3>
                  <p className="text-sm text-gray-400">{voice.accent} • {voice.gender}</p>
                </div>
                <button className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center hover:bg-blue-500/30 transition-all">
                  <span className="text-sm">{voice.preview}</span>
                </button>
              </div>
              <p className="text-sm text-gray-300 mb-2">{voice.description}</p>
              <span className="text-xs px-2 py-1 bg-white/10 text-blue-400 rounded-full">
                {voice.style}
              </span>
            </motion.button>
          ))}
        </div>
        {errors.voice_style && <p className="text-red-400 text-sm mt-2">{errors.voice_style}</p>}
      </div>

      {/* Music Style */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Background Music Style
        </label>
        <select
          value={form.music_style}
          onChange={update('music_style')}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all"
        >
          {musicStyles.map(style => (
            <option key={style} value={style} className="bg-gray-900">{style}</option>
          ))}
        </select>
      </div>

      {/* Additional Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Speaking Pace
          </label>
          <div className="bg-white/5 border border-white/20 rounded-xl p-4">
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.1"
              defaultValue="1.0"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Audio Quality
          </label>
          <select className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white focus:bg-white/10 focus:border-blue-500/50 transition-all">
            <option value="standard" className="bg-gray-900">Standard (faster)</option>
            <option value="high" className="bg-gray-900">High Quality (recommended)</option>
            <option value="premium" className="bg-gray-900">Premium (slower, best quality)</option>
          </select>
        </div>
      </div>

      {/* Long Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Detailed Description
        </label>
        <textarea
          value={form.long_description}
          onChange={update('long_description')}
          placeholder="Provide a comprehensive description of your podcast episode. This will be used for SEO and platform descriptions..."
          rows={4}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Promo Text */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Promotional Text
        </label>
        <textarea
          value={form.promo_text}
          onChange={update('promo_text')}
          placeholder="Write compelling promotional text for social media and marketing..."
          rows={3}
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:bg-white/10 focus:border-blue-500/50 transition-all"
        />
      </div>
    </motion.div>
  )
}

function ReviewStep({ form, generatePodcast, isGenerating, progress, errors }) {
  const estimatedTime = () => {
    const words = form.script.split(' ').filter(Boolean).length
    const wordsPerMinute = 150
    return Math.ceil(words / wordsPerMinute)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review & Generate</h2>
        <p className="text-gray-400">Review your podcast details before generating the final audio.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/20 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-lg">📝</span>
            Basic Information
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Title:</span>
              <span className="text-white font-medium">{form.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Genre:</span>
              <span className="text-white">{form.genre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{form.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tone:</span>
              <span className="text-white">{form.tone}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/20 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-lg">🎙️</span>
            Audio Settings
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Voice Style:</span>
              <span className="text-white">{form.voice_style}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Language:</span>
              <span className="text-white">{form.language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Music:</span>
              <span className="text-white">{form.music_style}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Est. Length:</span>
              <span className="text-white">{estimatedTime()} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Script Preview */}
      <div className="bg-white/5 border border-white/20 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-lg">📄</span>
          Script Preview
        </h3>
        <div className="bg-black/20 rounded-xl p-4 max-h-40 overflow-y-auto">
          <p className="text-gray-300 text-sm font-mono leading-relaxed">
            {form.script.substring(0, 500)}
            {form.script.length > 500 && <span className="text-gray-500">... (continued)</span>}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Total words: {form.script.split(' ').filter(Boolean).length}
        </p>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
            <div>
              <h3 className="font-semibold text-white">Generating your podcast...</h3>
              <p className="text-sm text-gray-400">This process may take 2-5 minutes</p>
            </div>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-3 mb-2">
            <motion.div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-xs text-gray-400">{progress}% complete</p>
          
          <div className="mt-4 text-sm text-gray-300">
            <p>🎯 Processing script and voice settings...</p>
            <p>🎵 Adding background music and audio effects...</p>
            <p>🔧 Optimizing audio quality and timing...</p>
          </div>
        </motion.div>
      )}

      {errors.generation && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400">{errors.generation}</p>
        </div>
      )}

      {/* Final Check */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-medium text-yellow-400 mb-2">Before you generate:</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Make sure your script is complete and error-free</li>
              <li>• Check that all settings match your preferences</li>
              <li>• Generation typically takes 2-5 minutes depending on length</li>
              <li>• You can save this as a draft and return later</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
