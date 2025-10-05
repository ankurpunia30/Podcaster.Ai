#!/bin/bash

# AI Service Startup Script for Groq-based implementation
echo "Starting Open Source AI Podcast Service with Groq API..."

# Set environment variables
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Check if virtual environment exists
if [ ! -d "../bin" ]; then
    echo "Virtual environment not found. Please run from within the tts_env environment."
    exit 1
fi

# Check if .env file exists, create from example if not
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo "Please edit .env file with your Groq API key and other settings."
    else
        echo "Warning: No .env file found. Using default configuration."
    fi
fi

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create necessary directories
mkdir -p outputs
mkdir -p voices
mkdir -p temp

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Redis is not running. Starting Redis..."
    # Try to start Redis (adjust command based on your system)
    if command -v redis-server > /dev/null 2>&1; then
        redis-server --daemonize yes --port 6379
        sleep 2
    else
        echo "Redis not found. Please install and start Redis server."
        echo "On macOS: brew install redis && brew services start redis"
        echo "On Ubuntu: sudo apt install redis-server && sudo systemctl start redis"
        exit 1
    fi
fi

# Start Celery worker in background for background tasks
echo "Starting Celery worker..."
celery -A main_new.celery_app worker --loglevel=info &
CELERY_PID=$!

# Start the service
echo "Starting AI Service on port 8000..."
echo "Access the API docs at: http://localhost:8000/docs"
echo "Service will be available at: http://localhost:8000"
echo ""
echo "To get a free Groq API key, visit: https://console.groq.com"
echo "Set GROQ_API_KEY in your .env file to enable LLM features."
echo ""
echo "Available endpoints:"
echo "  POST /script/generate - Generate podcast scripts"
echo "  POST /tts/synthesize - Convert text to speech"
echo "  POST /voice/clone - Clone voices"
echo "  POST /audio/process - Enhance audio quality"
echo "  POST /podcast/generate - Complete podcast generation"
echo "  POST /content/enhance - Enhance existing content"
echo "  POST /seo/optimize - Generate SEO metadata"
echo "  POST /content/summarize - Summarize content"
echo ""
echo "Press Ctrl+C to stop the service"
echo "----------------------------------------"

# Cleanup on exit
trap "kill $CELERY_PID; redis-cli shutdown" EXIT

# Run the service
python main_new.py
