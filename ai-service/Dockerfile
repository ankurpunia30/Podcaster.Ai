# Use Python 3.11 with CUDA support for AI models
FROM nvidia/cuda:11.8-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3-pip \
    python3.11-venv \
    curl \
    git \
    ffmpeg \
    espeak \
    espeak-data \
    libespeak1 \
    libespeak-dev \
    festival \
    festvox-kallpc16k \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Download and install Ollama
RUN curl -fsSL https://ollama.ai/install.sh | sh

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p outputs voices temp

# Download default TTS models (this will happen on first run)
# RUN python3 -c "from TTS.api import TTS; TTS(model_name='tts_models/en/ljspeech/tacotron2-DDC')"

# Expose ports
EXPOSE 8000 11434

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Start script
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
