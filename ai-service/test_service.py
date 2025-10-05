#!/usr/bin/env python3
"""
Comprehensive test script for the AI Service with all fixes applied
"""

import os
import asyncio
import sys
from dotenv import load_dotenv
from groq import AsyncGroq

# Load environment variables
load_dotenv()

def test_service_startup():
    """Test if the service can start without errors"""
    print("🧪 Testing AI Service Startup")
    print("=" * 50)
    
    try:
        # Test imports
        print("1. 📦 Testing imports...")
        sys.path.append('/Users/ankur/tts_env/ai-service')
        
        # Test core imports
        from main_new import app
        print("   ✅ FastAPI app import successful")
        
        from main_new import clean_text_for_tts, split_text_for_tts
        print("   ✅ TTS helper functions imported")
        
        # Check optional dependencies
        from main_new import PEDALBOARD_AVAILABLE, TORTOISE_AVAILABLE, CELERY_AVAILABLE
        print(f"   📊 Pedalboard available: {PEDALBOARD_AVAILABLE}")
        print(f"   📊 Tortoise TTS available: {TORTOISE_AVAILABLE}")
        print(f"   📊 Celery available: {CELERY_AVAILABLE}")
        
        # Check Groq API key
        print("2. 🔑 Checking Groq API key...")
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key != "gsk_your_api_key_here":
            print("   ✅ Groq API key configured")
        else:
            print("   ⚠️  Groq API key not configured")
        
        # Test text processing functions
        print("3. 🔧 Testing text processing...")
        test_text = "Hello world! This is a test (pause) with some issues... [sound effect]"
        cleaned = clean_text_for_tts(test_text)
        segments = split_text_for_tts(cleaned)
        
        print(f"   Original: '{test_text}'")
        print(f"   Cleaned:  '{cleaned}'")
        print(f"   Segments: {len(segments)} parts")
        for i, seg in enumerate(segments):
            print(f"     {i+1}. '{seg}' ({len(seg)} chars)")
        
        print("\n✅ Service startup test: PASSED")
        print("   🚀 All core components ready!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Service startup test: FAILED")
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_groq_connection():
    """Test Groq API connection"""
    api_key = os.getenv("GROQ_API_KEY", "gsk_your_api_key_here")
    
    if api_key == "gsk_your_api_key_here":
        print("❌ GROQ_API_KEY not set in environment")
        print("   Get a free API key from: https://console.groq.com")
        print("   Set it in .env file: GROQ_API_KEY=your_key_here")
        return False
    
    try:
        client = AsyncGroq(api_key=api_key)
        
        # Test with a simple prompt
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": "Say 'Hello from Groq!' in one sentence."}],
            model="llama-3.1-8b-instant",
            max_tokens=50
        )
        
        result = response.choices[0].message.content
        print(f"✅ Groq API connection successful!")
        print(f"   Response: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Groq API connection failed: {e}")
        return False

async def test_script_generation():
    """Test podcast script generation"""
    api_key = os.getenv("GROQ_API_KEY", "gsk_your_api_key_here")
    
    if api_key == "gsk_your_api_key_here":
        print("❌ Skipping script generation test - API key not set")
        return False
    
    try:
        client = AsyncGroq(api_key=api_key)
        
        prompt = """
        Create a 2-minute podcast script about "The Benefits of Morning Exercise".
        Style: conversational
        Tone: energetic
        
        Requirements:
        - Include timestamps for each section
        - Make it engaging and conversational
        - Include a compelling intro and outro
        
        Format the response as a clear, structured script.
        """
        
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1000
        )
        
        script = response.choices[0].message.content
        print(f"✅ Script generation successful!")
        print(f"   Generated {len(script.split())} words")
        print(f"   Preview: {script[:200]}...")
        return True
        
    except Exception as e:
        print(f"❌ Script generation failed: {e}")
        return False

def check_dependencies():
    """Check if required dependencies are available"""
    dependencies = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("groq", "Groq API client"),
        ("TTS", "Coqui TTS"),
        ("redis", "Redis client"),
        ("celery", "Celery"),
        ("soundfile", "SoundFile"),
        ("librosa", "Librosa"),
    ]
    
    print("Checking dependencies...")
    all_good = True
    
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"✅ {name}")
        except ImportError:
            print(f"❌ {name} - Not installed")
            all_good = False
    
    return all_good

async def main():
    """Run all tests"""
    print("🔍 AI Service Test Suite")
    print("=" * 40)
    
    # Check dependencies
    deps_ok = check_dependencies()
    print()
    
    # Test Groq connection
    print("Testing Groq API connection...")
    groq_ok = await test_groq_connection()
    print()
    
    # Test script generation
    if groq_ok:
        print("Testing script generation...")
        script_ok = await test_script_generation()
        print()
    else:
        script_ok = False
    
    # Summary
    print("=" * 40)
    print("📋 Test Summary:")
    print(f"   Dependencies: {'✅' if deps_ok else '❌'}")
    print(f"   Groq API: {'✅' if groq_ok else '❌'}")
    print(f"   Script Generation: {'✅' if script_ok else '❌'}")
    
    if deps_ok and groq_ok:
        print("\n🎉 AI Service is ready to run!")
        print("   Start with: ./start_groq.sh")
    else:
        print("\n⚠️  Some issues need to be resolved before running the service")
        if not groq_ok:
            print("   - Set up Groq API key in .env file")
        if not deps_ok:
            print("   - Install missing dependencies: pip install -r requirements.txt")

if __name__ == "__main__":
    asyncio.run(main())
