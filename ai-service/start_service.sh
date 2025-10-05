#!/bin/bash

# AI Service Startup Script with all fixes
echo "🚀 Starting AI Podcast Service"
echo "================================"

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo "📦 Activating virtual environment..."
    source /Users/ankur/tts_env/bin/activate
fi

# Set environment variables
export PYTHONPATH="/Users/ankur/tts_env/ai-service:$PYTHONPATH"

# Check .env file
if [[ ! -f .env ]]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "🔑 Please edit .env and add your GROQ_API_KEY"
    echo "   Get a free API key from: https://console.groq.com"
fi

# Start the service
echo "🎙️ Starting AI Service on http://localhost:8000"
echo ""
echo "🎯 Available endpoints:"
echo "   GET  /health                    - Health check"
echo "   GET  /docs                      - API documentation"  
echo "   POST /script/generate           - Generate podcast script"
echo "   POST /tts/synthesize            - Text-to-speech synthesis"
echo "   POST /audio/process             - Process audio files"
echo "   POST /podcast/generate          - Full podcast generation"
echo ""
echo "🛑 Press Ctrl+C to stop the service"
echo ""

# Start with uvicorn
python -m uvicorn main_new:app --host 0.0.0.0 --port 8000 --reload
