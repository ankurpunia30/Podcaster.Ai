import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Temporary in-memory storage for testing
let users = [];
let podcasts = [];
let nextUserId = 1;
let nextPodcastId = 1;

// Test authentication endpoints
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  
  const user = {
    id: nextUserId++,
    email,
    role: 'user',
    createdAt: new Date()
  };
  
  users.push(user);
  
  // Create a simple token (for testing only - not secure!)
  const token = `test-token-${user.id}`;
  
  res.json({ 
    token, 
    user: { id: user.id, email: user.email, role: user.role } 
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Create a simple token (for testing only)
  const token = `test-token-${user.id}`;
  
  res.json({ 
    token, 
    user: { id: user.id, email: user.email, role: user.role } 
  });
});

// Also add routes with /api prefix for compatibility  
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ message: 'Email already registered' });
  }
  
  const user = {
    id: nextUserId++,
    email,
    role: 'user',
    createdAt: new Date()
  };
  
  users.push(user);
  
  // Create a simple token (for testing only - not secure!)
  const token = `test-token-${user.id}`;
  
  res.json({ 
    token, 
    user: { id: user.id, email: user.email, role: user.role } 
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Create a simple token (for testing only)
  const token = `test-token-${user.id}`;
  
  res.json({ 
    token, 
    user: { id: user.id, email: user.email, role: user.role } 
  });
});

// Simple auth middleware for testing
const testAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }
  
  const userId = token.replace('test-token-', '');
  const user = users.find(u => u.id == userId);
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  req.user = user;
  next();
};

// Podcast endpoints
app.post('/podcast/generate', testAuth, (req, res) => {
  const { topic, style = 'professional' } = req.body;
  
  if (!topic) {
    return res.status(400).json({ message: 'Topic required' });
  }
  
  const podcast = {
    id: nextPodcastId++,
    userId: req.user.id,
    topic,
    title: topic.length > 50 ? `${topic.substring(0, 47)}...` : topic,
    description: `An AI-generated podcast exploring ${topic}`,
    author: req.user.email,
    thumbnail: ['🎙️', '🎧', '📻', '🎵'][Math.floor(Math.random() * 4)],
    genre: 'Education',
    script: '',
    audioUrl: '',
    duration: '0:00',
    durationSec: 0,
    status: 'generating',
    style,
    plays: 0,
    rating: 4.5,
    createdAt: new Date()
  };
  
  podcasts.push(podcast);
  
  // Simulate async generation - complete after 5 seconds
  setTimeout(() => {
    const podcastIndex = podcasts.findIndex(p => p.id === podcast.id);
    if (podcastIndex >= 0) {
      podcasts[podcastIndex].status = 'completed';
      podcasts[podcastIndex].audioUrl = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/outputs/test_${podcast.id}.wav`;
      podcasts[podcastIndex].duration = '2:30';
      podcasts[podcastIndex].durationSec = 150;
      podcasts[podcastIndex].script = `This is a generated podcast about ${topic}. Welcome to our discussion on this fascinating topic...`;
    }
  }, 5000);
  
  res.json({
    id: podcast.id,
    topic: podcast.topic,
    title: podcast.title,
    description: podcast.description,
    author: podcast.author,
    thumbnail: podcast.thumbnail,
    genre: podcast.genre,
    status: podcast.status,
    audioUrl: null,
    createdAt: podcast.createdAt,
  });
});

app.get('/podcast/history', testAuth, (req, res) => {
  const userPodcasts = podcasts
    .filter(p => p.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
  res.json(userPodcasts.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    author: p.author,
    thumbnail: p.thumbnail,
    genre: p.genre,
    duration: p.duration,
    topic: p.topic,
    audioUrl: p.audioUrl,
    status: p.status,
    plays: p.plays,
    rating: p.rating,
    createdAt: p.createdAt,
  })));
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'podcast-backend-test-mode', 
    timestamp: new Date().toISOString(),
    users: users.length,
    podcasts: podcasts.length
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'podcast-backend-test-mode',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'in-memory (test mode)'
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📝 Test Mode: Using in-memory storage`);
  console.log(`🔧 To use MongoDB Atlas, fix the IP whitelist and use regular server.js`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});
