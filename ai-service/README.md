# Open Source AI Podcast Service with Groq API

A comprehensive AI-powered podcast generation service using open-source TTS models and Groq API for LLM capabilities.

## Features

### 🎙️ Text-to-Speech (TTS)
- **Coqui TTS**: High-quality neural text-to-speech
- **Tortoise TTS**: Advanced voice cloning capabilities
- Pitch and speed control
- Multiple voice options

### 🧠 AI Content Generation
- **Script Generation**: Create engaging podcast scripts using Groq's LLM
- **Content Enhancement**: Improve existing content for better readability
- **SEO Optimization**: Generate SEO-friendly metadata and descriptions
- **Content Summarization**: Create summaries in various formats

### 🔊 Audio Processing
- Noise reduction and audio enhancement
- Audio effects (reverb, chorus, compression)
- Audio format conversion
- Background music integration

### 🎯 Voice Cloning
- Clone voices from audio samples
- Generate speech in cloned voices
- Support for multiple voice models

### ⚡ Background Processing
- Asynchronous podcast generation
- Task tracking and status monitoring
- Redis-based job queue

## Quick Start

### Prerequisites
```bash
# Install Redis (macOS)
brew install redis
brew services start redis

# Install Redis (Ubuntu)
sudo apt install redis-server
sudo systemctl start redis
```

### Setup
1. **Get Groq API Key** (Free):
   - Visit [Groq Console](https://console.groq.com)
   - Sign up and get your API key

2. **Install Dependencies**:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your GROQ_API_KEY
   ```

4. **Start the Service**:
   ```bash
   ./start_groq.sh
   ```

The service will be available at `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.

## API Endpoints

### Content Generation
- `POST /script/generate` - Generate podcast scripts
- `POST /content/enhance` - Enhance existing content
- `POST /seo/optimize` - Generate SEO metadata
- `POST /content/summarize` - Create content summaries

### Text-to-Speech
- `POST /tts/synthesize` - Convert text to speech
- `POST /voice/clone` - Clone voices from samples

### Audio Processing
- `POST /audio/process` - Enhance and process audio files

### Complete Podcast Generation
- `POST /podcast/generate` - Generate complete podcast episode
- `GET /task/{task_id}` - Check generation status

### System
- `GET /health` - Service health check
- `GET /status` - Model loading status

## Usage Examples

### Generate a Podcast Script
```python
import requests

response = requests.post("http://localhost:8000/script/generate", json={
    "topic": "The Future of AI in Healthcare",
    "duration_minutes": 15,
    "style": "conversational",
    "tone": "informative",
    "include_intro": True,
    "include_outro": True
})

script = response.json()
print(script["script"])
```

### Convert Text to Speech
```python
response = requests.post("http://localhost:8000/tts/synthesize", json={
    "text": "Welcome to our AI-powered podcast!",
    "speed": 1.0,
    "pitch": 0.0,
    "model": "coqui"
})

audio_file = response.json()["audio_file"]
```

### Enhance Content
```python
response = requests.post("http://localhost:8000/content/enhance", json={
    "content": "Your original content here...",
    "type": "style"  # general, grammar, style, clarity
})

enhanced = response.json()["enhanced_content"]
```

### Generate SEO Metadata
```python
response = requests.post("http://localhost:8000/seo/optimize", json={
    "content": "Your podcast content...",
    "keywords": ["AI", "technology", "future"],
    "type": "podcast"
})

seo_data = response.json()["seo_metadata"]
```

## Architecture

### Technology Stack
- **FastAPI**: Modern async web framework
- **Groq API**: Fast LLM inference (free tier available)
- **Coqui TTS**: Open-source neural text-to-speech
- **Tortoise TTS**: Advanced voice cloning
- **Redis**: Task queue and caching
- **Celery**: Background task processing
- **Pedalboard**: Audio effects processing

### Model Information
- **LLM**: Llama 3.1 70B (via Groq API)
- **TTS**: Tacotron2-DDC with LJSpeech dataset
- **Voice Cloning**: Tortoise TTS with voice samples

### Performance
- Script generation: ~2-5 seconds (via Groq)
- TTS synthesis: ~1-3 seconds per minute of audio
- Voice cloning: ~30-60 seconds (depends on sample quality)

## Configuration

### Environment Variables
```bash
# Required
GROQ_API_KEY=your_groq_api_key

# Optional
REDIS_HOST=localhost
REDIS_PORT=6379
SERVICE_PORT=8000
LOG_LEVEL=INFO
```

### Model Configuration
The service automatically downloads and caches TTS models on first use:
- Coqui TTS models: ~100-500MB each
- Tortoise TTS: ~2GB total

## Development

### Running in Development Mode
```bash
python main_new.py
# Service runs with auto-reload enabled
```

### Testing
```bash
pytest tests/
```

### Code Formatting
```bash
black main_new.py
flake8 main_new.py
```

## Production Deployment

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main_new.py"]
```

### Environment Setup
1. Set up Redis cluster for scaling
2. Configure proper CORS origins
3. Set up SSL/TLS certificates
4. Configure monitoring and logging

## Troubleshooting

### Common Issues

**Groq API Errors**
- Ensure GROQ_API_KEY is set correctly
- Check API rate limits (free tier has limits)
- Verify internet connection

**TTS Model Loading**
- First run downloads large models (~2GB total)
- Ensure sufficient disk space and memory
- Check network connectivity for model downloads

**Audio Processing Issues**
- Install required audio libraries: `sudo apt-get install libsndfile1`
- Check input audio format compatibility

**Redis Connection**
- Ensure Redis server is running: `redis-cli ping`
- Check Redis configuration and ports

### Performance Optimization
- Use GPU if available for faster TTS
- Implement audio caching for repeated requests
- Use Redis clustering for high-throughput scenarios

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For questions and support:
- Check the [API documentation](http://localhost:8000/docs)
- Review the troubleshooting section
- Open an issue on the repository

---

**Note**: This service uses free Groq API for LLM features. For production use, consider the API rate limits and upgrade to paid tiers if needed.
- **Background Music**: AI-generated ambient music
- **Audio Enhancement**: Noise reduction and normalization

## 🛠 Tech Stack

- **LLM**: Ollama (Llama 3.2, Qwen2.5, Code Llama)
- **TTS**: Coqui TTS, Tortoise TTS
- **Audio**: PyDub, librosa, soundfile
- **API**: FastAPI with async processing
- **Processing**: Background tasks with Celery/Redis
- **Storage**: Local file system + optional MinIO

## 📋 Installation

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull AI models
ollama pull llama3.2:3b
ollama pull qwen2.5:7b

# Install system dependencies (Ubuntu/Debian)
sudo apt-get install ffmpeg espeak espeak-data libespeak-dev
```

## 🚀 Quick Start

```bash
# Start the service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Or with Docker
docker-compose up -d
```

## 🔧 Configuration

Create `.env` file:
```
OLLAMA_BASE_URL=http://localhost:11434
TTS_MODEL=tts_models/en/ljspeech/tacotron2-DDC
AUDIO_OUTPUT_DIR=./outputs
REDIS_URL=redis://localhost:6379
```

## 📡 API Endpoints

- `POST /generate_script` - Generate podcast script from topic
- `POST /text_to_speech` - Convert text to speech
- `POST /clone_voice` - Create voice clone from sample
- `POST /mix_audio` - Mix narration with background music
- `POST /enhance_audio` - Noise reduction and enhancement
- `GET /models` - List available TTS models
- `GET /voices` - List available voices

## 🎵 Supported Models

### Text Generation
- Llama 3.2 (1B, 3B, 11B, 90B)
- Qwen2.5 (0.5B, 1.5B, 3B, 7B, 14B, 32B, 72B)
- Code Llama (7B, 13B, 34B)
- Mistral (7B, 8x7B)

### Text-to-Speech
- Tacotron2 + WaveGlow
- FastSpeech2 + HiFiGAN
- VITS models
- Tortoise TTS (voice cloning)
- Bark (multilingual)

## 🔥 Performance Tips

- Use GPU if available for TTS models
- Enable model caching for faster responses
- Use Redis for task queuing
- Implement audio streaming for real-time playback
