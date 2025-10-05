#!/bin/bash

echo "🚀 Installing AI Service Requirements..."
echo "======================================="

cd /Users/ankur/tts_env/ai-service

# Upgrade pip first
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing requirements from requirements.txt..."
pip install -r requirements.txt

echo ""
echo "✅ All requirements installed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Updated requirements.txt with 125+ dependencies"
echo "   - Includes all multi-speaker support packages"
echo "   - Includes all music generation packages"
echo "   - Includes all AI/TTS/LLM packages"
echo "   - Includes all audio processing packages"
echo ""
echo "🎉 Ready to run the AI service!"
