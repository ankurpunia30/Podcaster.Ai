// Demo API responses and data for testing without backend

export const DEMO_USER = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  createdAt: new Date().toISOString(),
}

export const DEMO_TOKEN = 'demo-jwt-token-12345'

export const DEMO_PODCASTS = [
  {
    id: 1,
    title: 'The Future of AI in Healthcare',
    description: 'Exploring how artificial intelligence is revolutionizing medical diagnosis and treatment.',
    duration: '15:32',
    status: 'published',
    createdAt: '2024-01-15T10:30:00Z',
    plays: 1234,
    genre: 'Technology',
    audioUrl: null
  },
  {
    id: 2,
    title: 'Building Sustainable Businesses',
    description: 'A deep dive into creating companies that are both profitable and environmentally conscious.',
    duration: '22:18',
    status: 'published',
    createdAt: '2024-01-10T14:20:00Z',
    plays: 856,
    genre: 'Business',
    audioUrl: null
  },
  {
    id: 3,
    title: 'The Art of Mindful Living',
    description: 'Practical strategies for incorporating mindfulness into your daily routine.',
    duration: '18:45',
    status: 'draft',
    createdAt: '2024-01-12T09:15:00Z',
    plays: 0,
    genre: 'Health & Fitness',
    audioUrl: null
  }
]

// Demo API simulation
export const demoAPI = {
  // Auth endpoints
  login: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    
    if (email === 'demo@example.com' && password === 'demo123') {
      return {
        token: DEMO_TOKEN,
        user: DEMO_USER
      }
    } else {
      throw new Error('Invalid credentials. Try demo@example.com / demo123')
    }
  },

  register: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      token: DEMO_TOKEN,
      user: { ...DEMO_USER, email }
    }
  },

  // AI Generation
  generatePodcast: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 3000)) // Simulate AI processing
    
    return {
      title: `AI Generated: ${data.topic.substring(0, 50)}...`,
      script: `Welcome to our podcast about ${data.topic}. 

In today's episode, we'll be exploring the fascinating world of ${data.topic}. This is a subject that has been gaining significant attention recently, and for good reason.

Let me start by giving you some background. ${data.topic} represents a major shift in how we think about technology and its impact on our daily lives. The implications are far-reaching and touch every aspect of our society.

[Pause for emphasis]

Now, you might be wondering, why should this matter to you? Well, let me explain. The developments in this field are not just academic curiosities - they have real, practical applications that will affect how we work, live, and interact with the world around us.

Consider this: just five years ago, the capabilities we're seeing today would have seemed like science fiction. But here we are, witnessing these incredible advances unfold in real-time.

[Background music subtle introduction]

The key players in this space are working tirelessly to push the boundaries of what's possible. Their innovations are creating new opportunities and solving problems we didn't even know we had.

But with great innovation comes great responsibility. We must consider the ethical implications and ensure that as we move forward, we're building a future that benefits everyone.

That's all for today's episode. Thank you for listening, and we'll see you next time.`,
      short_description: `An insightful exploration of ${data.topic} and its implications for the future.`,
      long_description: `Join us for a comprehensive discussion about ${data.topic}. In this episode, we dive deep into the current state of the field, examine key developments, and explore what the future might hold. Whether you're a newcomer to the subject or already familiar with the basics, you'll find valuable insights and perspectives that will enhance your understanding.`,
      keywords: `${data.topic}, technology, innovation, future, analysis`,
      promo_text: `🎧 NEW EPISODE: Discover the fascinating world of ${data.topic} in our latest podcast! Listen now for insights that will change how you think about the future. #Podcast #Technology #Innovation`
    }
  },

  // TTS Generation
  createPodcast: async (podcastData) => {
    await new Promise(resolve => setTimeout(resolve, 5000)) // Simulate TTS processing
    
    return {
      id: Date.now(),
      audioUrl: 'demo-audio-url',
      duration: podcastData.duration,
      status: 'completed',
      message: 'Podcast generated successfully! In a real implementation, this would contain the actual audio file.'
    }
  },

  // Get user podcasts
  getUserPodcasts: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return DEMO_PODCASTS
  }
}

// Check if we should use demo mode
export const isDemoMode = () => {
  return import.meta.env.VITE_DEMO_MODE === 'true' || 
         import.meta.env.VITE_API_BASE?.includes('demo') ||
         window.location.search.includes('demo=true')
}
