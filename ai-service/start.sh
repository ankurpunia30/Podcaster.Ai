#!/bin/bash
set -e

echo "Starting AI Service Setup..."

# Start Redis in background
redis-server --daemonize yes --port 6379

# Start Ollama in background
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to start
echo "Waiting for Ollama to start..."
sleep 10

# Pull required models
echo "Pulling Ollama models..."
ollama pull llama3.2
ollama pull qwen2.5

# Start Celery worker in background
celery -A main.celery_app worker --loglevel=info &
CELERY_PID=$!

# Start the FastAPI application
echo "Starting FastAPI application..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Cleanup on exit
trap "kill $OLLAMA_PID $CELERY_PID; redis-cli shutdown" EXIT
