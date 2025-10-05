# Podcaster.AI

🎙️ **AI-Powered Podcast Generation Platform**

A full-stack application that generates high-quality podcasts from any topic using AI. Features include real-time script generation, professional text-to-speech conversion, and a modern dashboard for managing your podcast library.

## ✨ Features

- 🤖 **AI Script Generation** - Intelligent podcast scripts using Groq LLM
- 🎙️ **Professional TTS** - High-quality voice synthesis with Coqui TTS & Tortoise TTS
- 🗣️ **Multi-Speaker Support** - Generate conversations with different speakers and voices
- 🎵 **Music Integration** - Automatic intro/outro music generation and background music
- 🔀 **Audio Mixing** - Professional audio mixing with crossfades and effects
- 🎨 **Modern UI** - Beautiful React dashboard with Spotify-style audio player
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔐 **User Authentication** - Secure JWT-based authentication
- 📊 **Analytics Dashboard** - Track plays, ratings, and podcast performance
- 🎵 **Audio Controls** - Full-featured audio player with progress tracking
- 📚 **Podcast Library** - Organize and manage all your generated podcasts
- ⚡ **Performance Optimized** - Caching, connection pooling, and async processing
- 🎛️ **Audio Enhancement** - Noise reduction, compression, reverb, and other effects

## 🏗️ Architecture

### Frontend (React + Vite + Tailwind CSS)
- Modern React 18 with TypeScript support
- Tailwind CSS for responsive design
- Zustand for state management
- Framer Motion for smooth animations
- Axios for API communication

### Backend (Node.js + Express + MongoDB)
- RESTful API with Express.js
- MongoDB with Mongoose ODM
- JWT authentication and authorization
- File serving capabilities
- Comprehensive error handling

### AI Service (Python + FastAPI)
- FastAPI for high-performance API
- Groq LLM for script generation
- Coqui TTS for voice synthesis
- Audio processing and file management
- Real-time generation status updates

## 🚀 Workflow

1. **Topic Input** → User enters podcast topic and preferences
2. **Script Generation** → AI creates engaging podcast script using Groq
3. **Voice Synthesis** → Coqui TTS converts script to natural speech
4. **Audio Processing** → Final audio optimization and file generation
5. **Dashboard Update** → Podcast appears in user's library with playback controls

## 📋 Prerequisites

- **Node.js** 18+ 
- **Python** 3.11+
- **MongoDB** (local or Atlas)
- **Groq API Key** (for script generation)

## 🛠️ Quick Start

### 1. AI Service Setup
```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Groq API key
python main.py
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure MongoDB URI and JWT secret in .env
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## ⚙️ Environment Configuration

### Backend (.env)
```env
PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/podcast-app
JWT_SECRET=your-super-secret-jwt-key-here
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### AI Service (.env)
```env
HOST=0.0.0.0
PORT=8000
BASE_URL=http://localhost:8000
OUTPUT_DIR=./outputs
GROQ_API_KEY=your-groq-api-key-here
TTS_MODEL=tts_models/en/ljspeech/tacotron2-DDC
```

### Frontend (.env)
```env
VITE_API_BASE=http://localhost:4000
```

## 🔌 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }
  ```

- `POST /auth/login` - User login
  ```json
  {
    "email": "user@example.com", 
    "password": "password123"
  }
  ```

### Podcast Endpoints (Require Authentication)
- `POST /api/podcasts/generate` - Generate new podcast
  ```json
  {
    "topic": "The Future of AI",
    "style": "professional",
    "duration_minutes": 10,
    "voice": "female",
    "speed": 1.0
  }
  ```

- `GET /api/podcasts/history` - Get user's podcasts
  ```json
  {
    "podcasts": [
      {
        "id": "...",
        "title": "The Future of AI",
        "audioUrl": "outputs/podcast_123.wav",
        "duration": "8:42",
        "status": "completed",
        "createdAt": "2025-10-06T...",
        "plays": 5,
        "rating": 4.5
      }
    ]
  }
  ```

- `POST /api/podcasts/script` - Generate script only
  ```json
  {
    "topic": "Machine Learning Basics",
    "style": "educational",
    "duration_minutes": 5
  }
  ```

### AI Service Endpoints
- `POST /script/generate` - Generate podcast script
- `POST /tts/generate` - Convert text to speech
- `GET /outputs/{filename}` - Serve generated audio files

## 🎯 Features in Detail

### Dashboard Components
- **Overview Tab** - Quick podcast generation and recent episodes
- **Library Tab** - Browse all generated podcasts with filtering
- **Analytics Tab** - Performance metrics and insights
- **Settings Tab** - User preferences and account management

### Audio Player Features
- **Spotify-style Interface** - Familiar and intuitive controls
- **Progress Tracking** - Visual progress bar with seek functionality
- **Volume Control** - Adjustable volume with mute option
- **Responsive Design** - Works on all screen sizes

### Podcast Generation Options
- **Multiple Styles** - Professional, conversational, educational, motivational
- **Voice Selection** - Male/female voice options
- **Speed Control** - Adjustable playback speed (0.5x - 2x)
- **Duration Control** - 5, 10, 15, or 30-minute episodes

## 🔧 Development

### Project Structure
```
tts_env/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── stores/        # Zustand state management
│   │   └── utils/         # Helper functions
├── backend/           # Node.js API server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── middleware/    # Custom middleware
└── ai-service/        # Python AI service
    ├── outputs/           # Generated audio files
    ├── voices/           # Voice model files
    └── main.py           # FastAPI application
```

### Key Technologies
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Zustand
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT
- **AI Service**: FastAPI, Coqui TTS, Groq API, PyTorch
- **Authentication**: JWT tokens with secure cookie storage
- **Database**: MongoDB with Atlas cloud hosting

## 🚀 Deployment

The application is designed for easy deployment:

1. **Frontend**: Deploy to Vercel, Netlify, or any static hosting
2. **Backend**: Deploy to Railway, Render, or Heroku
3. **AI Service**: Deploy to Railway, Render with GPU support
4. **Database**: Use MongoDB Atlas for cloud database

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Coqui TTS](https://github.com/coqui-ai/TTS) - High-quality text-to-speech
- [Groq](https://groq.com/) - Fast LLM inference for script generation
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Smooth animations

---

**Made with ❤️ for podcast creators everywhere**
