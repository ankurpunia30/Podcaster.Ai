## Podcaster

Full-stack platform to generate podcasts from a topic: frontend (React + Tailwind), backend (Node.js/Express + MongoDB), and AI microservice (FastAPI) for script generation, text-to-speech, and mixing.

### Architecture
- frontend (React + Vite + Tailwind)
- backend (Node.js + Express + MongoDB)
- ai-service (Python + FastAPI + Coqui TTS/pydub)

Workflow:
1. Frontend calls backend `/podcast/generate` with a topic.
2. Backend orchestrates AI service: `/generate_script` → `/speak` → `/mix`.
3. AI service returns final MP3 URL under `ai-service/outputs/`.
4. Backend stores metadata in MongoDB and returns to frontend.

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB instance

### Quick Start

1) AI Service
```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

2) Backend
```bash
cd backend
npm install
cp .env.example .env
# Set MONGO_URI, JWT_SECRET, AI_SERVICE_URL
npm run dev
```

3) Frontend
```bash
cd frontend
npm install
# Optional: cp .env.example .env and set VITE_API_BASE
npm run dev
```

### Environment Variables

backend/.env
- PORT=4000
- MONGO_URI=mongodb://localhost:27017/podcast_platform
- JWT_SECRET=change_me
- AI_SERVICE_URL=http://127.0.0.1:8000

ai-service/.env
- HOST=0.0.0.0
- PORT=8000
- BASE_URL=http://127.0.0.1:8000
- OUTPUT_DIR=./outputs
- MODEL_NAME=tts_models/en/ljspeech/tacotron2-DDC
- LLM_PROVIDER=none
- OPENAI_API_KEY=

frontend/.env
- VITE_API_BASE=http://localhost:4000

### Backend API
- POST `/auth/register` → `{ token, user }`
- POST `/auth/login` → `{ token, user }`
- POST `/podcast/generate` (Auth) → `{ id, audioUrl, durationSec, createdAt }`
- GET `/podcast/history` (Auth) → `[{ id, topic, audioUrl, durationSec, createdAt, status }]`

### AI Service API
- POST `/generate_script` → `{ script }` (body: `{ topic }`)
- POST `/speak` → `{ audio_url, duration_sec }` (body: `{ text, voice? }`)
- POST `/mix` → `{ audio_url, duration_sec }` (body: `{ narration_url }`)
- GET `/outputs/{name}` → serves mp3

### Notes
- Coqui TTS used if available; otherwise a tonal fallback keeps pipeline testable.
- Audio files are written to `ai-service/outputs/` and served by the AI service.

### License
MIT


# Podcaster.Ai
# Podcaster.Ai
