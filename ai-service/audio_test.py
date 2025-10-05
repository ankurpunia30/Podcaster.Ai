#!/usr/bin/env python3
"""
Audio capabilities test for the AI service
Tests TTS (Text-to-Speech) functionality
"""

import asyncio
import os
import tempfile
import time
from datetime import datetime
import soundfile as sf
import numpy as np

def test_basic_audio_generation():
    """Test basic TTS functionality"""
    print("🎵 Testing Basic Audio Generation...")
    
    try:
        # Import TTS
        from TTS.api import TTS
        
        # Initialize TTS model (this will download the model on first run)
        print("   Loading TTS model (may take a moment on first run)...")
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        
        # Test text
        test_text = "Hello! This is a test of the AI podcast service text-to-speech functionality."
        
        # Generate audio
        print("   Generating speech...")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            tts.tts_to_file(text=test_text, file_path=temp_file.name)
            
            # Check if file was created and get info
            if os.path.exists(temp_file.name):
                audio_data, sample_rate = sf.read(temp_file.name)
                duration = len(audio_data) / sample_rate
                
                print(f"✅ Audio generation successful!")
                print(f"   Duration: {duration:.2f} seconds")
                print(f"   Sample rate: {sample_rate} Hz")
                print(f"   Audio file: {temp_file.name}")
                print(f"   File size: {os.path.getsize(temp_file.name)} bytes")
                
                # Clean up
                os.unlink(temp_file.name)
                return True
            else:
                print("❌ Audio file was not created")
                return False
                
    except Exception as e:
        print(f"❌ TTS test failed: {e}")
        return False

def test_audio_processing():
    """Test audio processing capabilities"""
    print("\n🔊 Testing Audio Processing...")
    
    try:
        import librosa
        import numpy as np
        from scipy import signal
        
        # Create a simple test tone
        duration = 2.0  # seconds
        sample_rate = 22050
        frequency = 440  # A4 note
        
        # Generate sine wave
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
        
        print(f"✅ Generated test audio: {duration}s at {sample_rate}Hz")
        
        # Test normalization
        normalized_audio = librosa.util.normalize(audio_data)
        print("✅ Audio normalization working")
        
        # Test pitch shifting (simple version)
        shifted_audio = librosa.effects.pitch_shift(audio_data, sr=sample_rate, n_steps=2)
        print("✅ Pitch shifting working")
        
        # Test tempo change
        tempo_changed = librosa.effects.time_stretch(audio_data, rate=1.2)
        print("✅ Tempo change working")
        
        # Save test file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            sf.write(temp_file.name, normalized_audio, sample_rate)
            print(f"✅ Audio file saved: {temp_file.name}")
            
            # Clean up
            os.unlink(temp_file.name)
            
        return True
        
    except Exception as e:
        print(f"❌ Audio processing test failed: {e}")
        return False

def test_audio_effects():
    """Test advanced audio effects"""
    print("\n✨ Testing Audio Effects...")
    
    try:
        # Check if pedalboard is available for effects
        try:
            from pedalboard import Pedalboard, Chorus, Reverb, Compressor, Gain
            effects_available = True
        except ImportError:
            print("⚠️  Pedalboard not available - advanced effects disabled")
            effects_available = False
        
        if effects_available:
            # Create test audio
            duration = 1.0
            sample_rate = 44100
            t = np.linspace(0, duration, int(sample_rate * duration), False)
            audio_data = np.sin(2 * np.pi * 440 * t) * 0.3
            
            # Apply effects
            board = Pedalboard([
                Compressor(threshold_db=-16, ratio=4),
                Gain(gain_db=3),
                Reverb(room_size=0.3),
                Chorus(rate_hz=1.0, depth=0.25, mix=0.3)
            ])
            
            effected_audio = board(audio_data, sample_rate)
            print("✅ Audio effects (Compressor, Gain, Reverb, Chorus) working")
            
            return True
        else:
            print("⚠️  Advanced effects not available")
            return False
            
    except Exception as e:
        print(f"❌ Audio effects test failed: {e}")
        return False

def test_voice_cloning_prep():
    """Test voice cloning preparation (Tortoise TTS)"""
    print("\n🎭 Testing Voice Cloning Capabilities...")
    
    try:
        from tortoise.api import TextToSpeech
        from tortoise.utils.audio import load_voices
        
        # Initialize Tortoise TTS
        print("   Loading Tortoise TTS (this may take several minutes on first run)...")
        tts = TextToSpeech()
        
        print("✅ Tortoise TTS loaded successfully")
        print("✅ Voice cloning capabilities available")
        print("   Note: Voice cloning requires audio samples to work")
        
        return True
        
    except Exception as e:
        print(f"❌ Voice cloning test failed: {e}")
        print("   This is expected if models haven't been downloaded yet")
        return False

async def test_complete_audio_pipeline():
    """Test the complete audio generation pipeline"""
    print("\n🎬 Testing Complete Audio Pipeline...")
    
    try:
        from dotenv import load_dotenv
        from groq import AsyncGroq
        from TTS.api import TTS
        
        load_dotenv()
        
        # Step 1: Generate script with Groq
        client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        
        print("   1. Generating script with Groq...")
        response = await client.chat.completions.create(
            messages=[{"role": "user", "content": "Create a 30-second podcast intro about AI technology. Keep it under 50 words."}],
            model="llama-3.3-70b-versatile",
            max_tokens=100
        )
        
        script = response.choices[0].message.content
        print(f"✅ Script generated: {len(script.split())} words")
        
        # Step 2: Convert to speech
        print("   2. Converting script to speech...")
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            tts.tts_to_file(text=script, file_path=temp_file.name)
            
            if os.path.exists(temp_file.name):
                audio_data, sample_rate = sf.read(temp_file.name)
                duration = len(audio_data) / sample_rate
                
                print(f"✅ Audio generated: {duration:.1f}s")
                print(f"   File: {temp_file.name}")
                
                # Step 3: Basic audio processing
                print("   3. Processing audio...")
                normalized_audio = librosa.util.normalize(audio_data)
                
                # Save final version
                final_file = temp_file.name.replace('.wav', '_final.wav')
                sf.write(final_file, normalized_audio, sample_rate)
                
                print(f"✅ Complete pipeline successful!")
                print(f"   Final audio: {final_file}")
                
                # Clean up
                os.unlink(temp_file.name)
                os.unlink(final_file)
                
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ Complete pipeline test failed: {e}")
        return False

async def main():
    """Run all audio tests"""
    print("🎵 AI Service Audio Capabilities Test")
    print("=" * 50)
    
    results = []
    
    # Test basic TTS
    results.append(test_basic_audio_generation())
    
    # Test audio processing
    results.append(test_audio_processing())
    
    # Test audio effects
    results.append(test_audio_effects())
    
    # Test voice cloning prep
    results.append(test_voice_cloning_prep())
    
    # Test complete pipeline
    results.append(await test_complete_audio_pipeline())
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 Audio Test Summary:")
    print(f"   Basic TTS: {'✅' if results[0] else '❌'}")
    print(f"   Audio Processing: {'✅' if results[1] else '❌'}")
    print(f"   Audio Effects: {'✅' if results[2] else '⚠️'}")
    print(f"   Voice Cloning Prep: {'✅' if results[3] else '⚠️'}")
    print(f"   Complete Pipeline: {'✅' if results[4] else '❌'}")
    
    working_features = sum(results)
    total_features = len(results)
    
    print(f"\n🎯 Audio Capabilities: {working_features}/{total_features} working")
    
    if results[0] and results[1] and results[4]:
        print("\n🎉 Core audio functionality is working!")
        print("💡 Ready for podcast audio generation!")
        print("🚀 Next steps:")
        print("   1. Install Redis for background processing")
        print("   2. Start the full API service")
        print("   3. Test audio endpoints via API")
    else:
        print("\n⚠️  Some audio features need attention")
        if not results[0]:
            print("   - Install TTS models")
        if not results[1]:
            print("   - Check audio processing libraries")

if __name__ == "__main__":
    asyncio.run(main())
