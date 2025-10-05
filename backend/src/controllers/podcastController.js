import axios from 'axios';
import Podcast from '../models/Podcast.js';

const aiBaseUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

export const generatePodcast = async (req, res, next) => {
  try {
    const { topic, style = 'professional' } = req.body;
    if (!topic) return res.status(400).json({ message: 'topic required' });

    // Generate a title from the topic
    const title = topic.length > 50 ? `${topic.substring(0, 47)}...` : topic;
    const description = `An AI-generated podcast exploring ${topic}`;

    // Create initial podcast record
    const record = await Podcast.create({
      userId: req.user.id,
      topic,
      title,
      description,
      author: req.user.email || 'AI Generated',
      thumbnail: getRandomThumbnail(),
      genre: inferGenre(topic),
      script: '',
      audioUrl: '',
      durationSec: 0,
      status: 'generating',
      style
    });

    // Generate script and audio asynchronously
    generatePodcastAsync(record._id, topic, style);

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
async function generatePodcastAsync(podcastId, topic, style) {
  try {
    // 1) Generate script using the AI service
    const scriptResp = await axios.post(`${aiBaseUrl}/script/generate`, { 
      topic,
      style,
      duration: 'medium'
    });
    const script = scriptResp.data?.script || '';

    // 2) Generate TTS audio
    const ttsResp = await axios.post(`${aiBaseUrl}/tts/synthesize`, { 
      text: script,
      voice: 'default',
      style
    });
    const audioUrl = ttsResp.data?.audio_url;
    const durationSec = ttsResp.data?.duration || 0;
    const duration = formatDuration(durationSec);

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
    await Podcast.findByIdAndUpdate(podcastId, {
      status: 'failed',
      error: err?.message || 'Generation failed'
    });
    console.error(`Podcast ${podcastId} generation failed:`, err.message);
  }
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
    res.json(items.map((p) => ({
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
    })));
  } catch (err) {
    next(err);
  }
};


