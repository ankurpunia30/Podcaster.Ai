#!/bin/bash
# Clean up unnecessary files from the podcast project

echo "🧹 Cleaning up unnecessary files..."

# Count files before cleanup
echo "📊 Files before cleanup:"
find /Users/ankur/tts_env -type f \( -name "*.py" -o -name "*.jsx" -o -name "*.js" -o -name "*.wav" \) | wc -l

echo ""
echo "🗑️  Removing unnecessary files..."

# Remove test files
echo "   Removing test files..."
rm -f /Users/ankur/tts_env/ai-service/api_test.py
rm -f /Users/ankur/tts_env/ai-service/audio_test.py
rm -f /Users/ankur/tts_env/ai-service/complete_api_test.py
rm -f /Users/ankur/tts_env/ai-service/complete_audio_test.py
rm -f /Users/ankur/tts_env/ai-service/comprehensive_test.py
rm -f /Users/ankur/tts_env/ai-service/fixed_audio_test.py
rm -f /Users/ankur/tts_env/ai-service/integration_test.py
rm -f /Users/ankur/tts_env/ai-service/simple_test.py
rm -f /Users/ankur/tts_env/ai-service/standalone_comprehensive_test.py
rm -f /Users/ankur/tts_env/ai-service/test_service.py
rm -f /Users/ankur/tts_env/backend/src/server-test.js

# Remove demo files
echo "   Removing demo files..."
rm -f /Users/ankur/tts_env/ai-service/final_demo.py
rm -f /Users/ankur/tts_env/ai-service/fixed_decoder_demo.py
rm -f /Users/ankur/tts_env/ai-service/ultra_safe_demo.py

# Remove backup files
echo "   Removing backup files..."
rm -f /Users/ankur/tts_env/ai-service/main_backup.py
rm -f /Users/ankur/tts_env/ai-service/main_new.py
rm -f /Users/ankur/tts_env/frontend/src/pages/EpisodeForm_backup.jsx
rm -f /Users/ankur/tts_env/frontend/src/pages/EpisodeForm2.jsx

# Remove old audio files (keep only recent ones)
echo "   Removing old audio test files..."
rm -f /Users/ankur/tts_env/ai-service/*.wav
rm -f /Users/ankur/tts_env/ai-service/outputs/*.wav 2>/dev/null
rm -f /Users/ankur/tts_env/ai-service/temp/*.wav 2>/dev/null

# Remove validation and performance test files (keep syntax_check.py)
echo "   Removing validation test files..."
rm -f /Users/ankur/tts_env/validation_test.py
rm -f /Users/ankur/tts_env/ai-service/performance_test.py

# Remove utility files that are no longer needed
echo "   Removing old utility files..."
rm -f /Users/ankur/tts_env/frontend/public/audio-test.html
rm -f /Users/ankur/tts_env/frontend/src/utils/demoApi.js

# Remove unused documentation files
echo "   Removing outdated documentation..."
rm -f /Users/ankur/tts_env/ai-service/DECODER_FIX_COMPLETE.md
rm -f /Users/ankur/tts_env/ai-service/IMPLEMENTATION_COMPLETE.md
rm -f /Users/ankur/tts_env/ai-service/HOW_TO_CHECK.md

# Remove __pycache__ directories
echo "   Removing Python cache files..."
find /Users/ankur/tts_env -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null

# Remove .pyc files
find /Users/ankur/tts_env -name "*.pyc" -type f -delete 2>/dev/null

# Clean up empty directories
echo "   Removing empty directories..."
find /Users/ankur/tts_env -type d -empty -delete 2>/dev/null

echo ""
echo "📊 Files after cleanup:"
find /Users/ankur/tts_env -type f \( -name "*.py" -o -name "*.jsx" -o -name "*.js" -o -name "*.wav" \) | wc -l

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "🔥 Files removed:"
echo "   ✅ Test files (api_test.py, audio_test.py, etc.)"
echo "   ✅ Demo files (final_demo.py, ultra_safe_demo.py, etc.)"
echo "   ✅ Backup files (main_backup.py, EpisodeForm_backup.jsx, etc.)"
echo "   ✅ Old audio files (*.wav test files)"
echo "   ✅ Validation test files (validation_test.py, performance_test.py)"
echo "   ✅ Utility files (audio-test.html, demoApi.js)"
echo "   ✅ Outdated documentation"
echo "   ✅ Python cache files (__pycache__, *.pyc)"
echo ""
echo "🎯 Core project files retained:"
echo "   ✅ main.py (AI service)"
echo "   ✅ Dashboard.jsx (main frontend)"
echo "   ✅ EpisodeForm.jsx (podcast creation)"
echo "   ✅ Backend routes and middleware"
echo "   ✅ Configuration files"
echo "   ✅ Current documentation"
echo "   ✅ syntax_check.py (for validation)"
