import axios from 'axios';
import Podcast from '../models/Podcast.js';

const aiBaseUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export const generatePodcast = async (req, res, next) => {
  try {
    const { 
      topic, 
      style = 'professional', 
      voice = 'default', 
      speed = 1.0,
      script = '',
      metadata = {}
    } = req.body;
    
    if (!topic) return res.status(400).json({ message: 'topic required' });

    // Normalize style to match enum values
    const normalizedStyle = normalizeStyle(style);

    // Generate a title from the topic or use provided metadata
    const title = metadata.title || (topic.length > 50 ? `${topic.substring(0, 47)}...` : topic);
    const description = metadata.short_description || `An AI-generated podcast exploring ${topic}`;

    // Create initial podcast record
    const record = await Podcast.create({
      userId: req.user.id,
      topic,
      title,
      description,
      author: req.user.email || 'AI Generated',
      thumbnail: getRandomThumbnail(),
      genre: metadata.genre || inferGenre(topic),
      script: script, // Use provided script if available
      audioUrl: '',
      durationSec: 0,
      status: script ? 'generating' : 'generating', // If script provided, skip to audio generation
      style: normalizedStyle,
      voice,
      speed
    });

    // Generate podcast asynchronously (will skip script generation if script provided)
    generatePodcastAsync(record._id, topic, normalizedStyle, voice, speed, script);

    res.json({
      id: record._id,
      topic: record.topic,
      title: record.title,
      description: record.description,
      author: record.author,
      thumbnail: record.thumbnail,
      genre: record.genre,
      status: record.status,
      audioUrl: null,
      createdAt: record.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to generate podcast asynchronously
async function generatePodcastAsync(podcastId, topic, style, voice = 'default', speed = 1.0, existingScript = '') {
  try {
    console.log(`Starting podcast generation for ID: ${podcastId}, topic: ${topic}, style: ${style}`);
    
    let script = existingScript;
    
    // 1) Generate script only if not provided
    if (!script) {
      console.log(`Calling AI service at: ${aiBaseUrl}/script/generate`);
      const scriptResp = await axios.post(`${aiBaseUrl}/script/generate`, { 
        topic,
        style,
        duration_minutes: 5
      });
      script = scriptResp.data?.script || '';
      console.log(`Script generated, length: ${script.length}`);
      
      // Update the podcast record with script
      await Podcast.findByIdAndUpdate(podcastId, {
        script,
        status: 'generating_audio'
      });
    } else {
      console.log(`Using provided script, length: ${script.length}`);
      // Update status to indicate we're generating audio
      await Podcast.findByIdAndUpdate(podcastId, {
        status: 'generating_audio'
      });
    }

    // 2) Generate TTS audio
    console.log(`Calling AI service at: ${aiBaseUrl}/tts/synthesize`);
    const ttsResp = await axios.post(`${aiBaseUrl}/tts/synthesize`, { 
      text: script,
      voice: voice,
      speed: speed
    });
    
    if (!ttsResp.data.success) {
      throw new Error('TTS generation failed');
    }
    
    const audioUrl = ttsResp.data.audio_file;
    const durationSec = ttsResp.data.duration || 0;
    const duration = formatDuration(durationSec);
    console.log(`Audio generated: ${audioUrl}, duration: ${durationSec}s`);

    // Update the podcast record
    await Podcast.findByIdAndUpdate(podcastId, {
      script,
      audioUrl,
      duration,
      durationSec,
      status: 'completed'
    });

    console.log(`Podcast ${podcastId} generated successfully`);
  } catch (err) {
    // Update with error status
    console.error(`Podcast ${podcastId} generation failed:`, err.message);
    console.error('Error details:', err.response?.data || err.message);
    
    await Podcast.findByIdAndUpdate(podcastId, {
      status: 'failed',
      error: err?.message || 'Generation failed'
    });
  }
}

// Helper function to normalize style values
function normalizeStyle(style) {
  const styleMap = {
    'motivational': 'motivational',
    'professional': 'professional',
    'conversational': 'conversational',
    'energetic': 'energetic',
    'educational': 'educational',
    'casual': 'casual',
    'formal': 'formal'
  };
  
  const normalized = style.toLowerCase();
  return styleMap[normalized] || 'professional'; // fallback to professional
}

// Helper functions
function getRandomThumbnail() {
  const thumbnails = ['🎙️', '🎧', '📻', '🎵', '🎤', '📢', '🔊', '🎼'];
  return thumbnails[Math.floor(Math.random() * thumbnails.length)];
}

function inferGenre(topic) {
  const topicLower = topic.toLowerCase();
  if (topicLower.includes('tech') || topicLower.includes('ai') || topicLower.includes('software')) {
    return 'Technology';
  } else if (topicLower.includes('business') || topicLower.includes('entrepreneur')) {
    return 'Business';
  } else if (topicLower.includes('health') || topicLower.includes('fitness') || topicLower.includes('mental')) {
    return 'Health & Fitness';
  } else if (topicLower.includes('science') || topicLower.includes('research')) {
    return 'Science';
  } else if (topicLower.includes('history') || topicLower.includes('culture')) {
    return 'History & Culture';
  }
  return 'Education';
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export const getHistory = async (req, res, next) => {
  try {
    const items = await Podcast.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50);
    const podcasts = items.map((p) => ({
      id: p._id,
      title: p.title,
      description: p.description,
      author: p.author,
      thumbnail: p.thumbnail,
      genre: p.genre,
      duration: p.duration || '0:00',
      topic: p.topic,
      audioUrl: p.audioUrl,
      status: p.status,
      plays: p.plays,
      rating: p.rating,
      createdAt: p.createdAt,
    }));
    res.json({ podcasts });
  } catch (err) {
    next(err);
  }
};

export const generateScript = async (req, res, next) => {
  try {
    const { topic, style = 'professional', duration_minutes = 5, tone = 'professional' } = req.body;
    if (!topic) return res.status(400).json({ message: 'topic required' });

    console.log(`Generating script for topic: ${topic}, style: ${style}`);
    console.log(`AI service URL: ${aiBaseUrl}/script/generate`);

    // Generate script using the AI service
    const scriptResp = await axios.post(`${aiBaseUrl}/script/generate`, { 
      topic,
      style,
      duration_minutes,
      tone,
      include_intro: true,
      include_outro: true
    });

    console.log('Script generation response:', scriptResp.status, scriptResp.data);

    res.json({
      script: scriptResp.data?.script || '',
      metadata: scriptResp.data?.metadata || {}
    });
  } catch (err) {
    console.error('Script generation failed:', err.message);
    console.error('Error details:', err.response?.data || err.message);
    next(err);
  }
};


