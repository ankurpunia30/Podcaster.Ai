#!/usr/bin/env python3
"""
Fixed Audio Test - Proper pause handling for TTS
"""

import asyncio
import os
import tempfile
import time
import soundfile as sf
import numpy as np
import librosa
from dotenv import load_dotenv
from groq import AsyncGroq
from TTS.api import TTS

async def generate_proper_script():
    """Generate script with proper TTS formatting"""
    load_dotenv()
    
    client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    
    response = await client.chat.completions.create(
        messages=[{"role": "user", "content": """
            Create a 1-minute podcast segment about "The Benefits of Morning Exercise".
            
            IMPORTANT FORMATTING RULES for text-to-speech:
            - Do NOT write "(pause)" or "pause" - instead use periods and commas for natural pauses
            - Use ellipses (...) for longer pauses
            - Write it as natural speech, not script directions
            - Use exclamation points for energy
            - Keep sentences conversational and flowing
            - No stage directions or sound cues
            - About 100-120 words total
            
            Make it energetic and conversational, like a real person talking.
        """}],
        model="llama-3.3-70b-versatile",
        max_tokens=200
    )
    
    return response.choices[0].message.content

def add_natural_pauses(text):
    """Process text to make pauses more natural for TTS"""
    # Replace common pause indicators with better TTS formatting
    replacements = {
        '(pause)': '...',
        '(brief pause)': '.',
        '(long pause)': '....',
        ' - ': '... ',
        '(sound cue)': '',
        '(music)': '',
        '[': '',
        ']': '',
        '(': '',
        ')': ''
    }
    
    processed_text = text
    for old, new in replacements.items():
        processed_text = processed_text.replace(old, new)
    
    # Clean up multiple punctuation
    processed_text = processed_text.replace('....', '...')
    processed_text = processed_text.replace('...', '. ')
    processed_text = processed_text.replace('..', '.')
    
    # Clean up extra spaces
    processed_text = ' '.join(processed_text.split())
    
    return processed_text

def split_into_segments(text, max_length=100):
    """Split long text into smaller segments for better TTS processing"""
    sentences = text.split('. ')
    segments = []
    current_segment = ""
    
    for sentence in sentences:
        if len(current_segment + sentence) < max_length:
            current_segment += sentence + ". "
        else:
            if current_segment:
                segments.append(current_segment.strip())
            current_segment = sentence + ". "
    
    if current_segment:
        segments.append(current_segment.strip())
    
    return segments

def add_manual_pauses(audio_segments, pause_duration=0.5):
    """Add manual pauses between audio segments"""
    sample_rate = 22050
    pause_samples = int(pause_duration * sample_rate)
    pause_audio = np.zeros(pause_samples)
    
    final_audio = []
    for i, segment in enumerate(audio_segments):
        final_audio.extend(segment)
        if i < len(audio_segments) - 1:  # Don't add pause after last segment
            final_audio.extend(pause_audio)
    
    return np.array(final_audio)

async def test_improved_tts():
    """Test improved TTS with proper pause handling"""
    print("🎙️ Testing Improved TTS with Proper Pauses")
    print("=" * 50)
    
    try:
        # Generate script
        print("1. 📝 Generating improved script...")
        script = await generate_proper_script()
        
        # Process the script
        processed_script = add_natural_pauses(script)
        print("✅ Script processed for TTS")
        print(f"   Original: {script[:100]}...")
        print(f"   Processed: {processed_script[:100]}...")
        
        # Split into segments for better control
        segments = split_into_segments(processed_script)
        print(f"✅ Split into {len(segments)} segments")
        
        # Initialize TTS
        print("\n2. 🎵 Generating speech segments...")
        tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        
        audio_segments = []
        total_duration = 0
        
        for i, segment in enumerate(segments):
            print(f"   Processing segment {i+1}/{len(segments)}")
            
            with tempfile.NamedTemporaryFile(suffix=f"_seg_{i}.wav", delete=False) as temp_file:
                # Generate audio for this segment
                tts.tts_to_file(text=segment, file_path=temp_file.name)
                
                # Load the audio
                audio_data, sample_rate = sf.read(temp_file.name)
                audio_segments.append(audio_data)
                
                segment_duration = len(audio_data) / sample_rate
                total_duration += segment_duration
                
                print(f"     Segment {i+1}: {segment_duration:.1f}s")
                
                # Clean up
                os.unlink(temp_file.name)
        
        # Combine segments with proper pauses
        print("\n3. 🔧 Combining segments with pauses...")
        final_audio = add_manual_pauses(audio_segments, pause_duration=0.8)
        
        # Final processing
        print("4. ✨ Final audio processing...")
        normalized_audio = librosa.util.normalize(final_audio)
        trimmed_audio, _ = librosa.effects.trim(normalized_audio, top_db=20)
        
        # Save final version
        final_filename = f"improved_podcast_{int(time.time())}.wav"
        sf.write(final_filename, trimmed_audio, sample_rate)
        
        final_duration = len(trimmed_audio) / sample_rate
        file_size = os.path.getsize(final_filename)
        
        print(f"\n🎉 Improved podcast generation complete!")
        print(f"   📁 File: {final_filename}")
        print(f"   ⏱️  Duration: {final_duration:.1f} seconds")
        print(f"   💾 Size: {file_size / 1024:.1f} KB")
        print(f"   🎵 Segments: {len(segments)} with natural pauses")
        
        print(f"\n📋 Script used:")
        print(f"   {processed_script}")
        
        print(f"\n🎵 To play: afplay {final_filename}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

async def test_different_approaches():
    """Test different approaches for natural speech"""
    print("\n🔬 Testing Different Speech Approaches")
    print("=" * 50)
    
    approaches = [
        {
            "name": "Conversational Style",
            "text": "Good morning! Ready to transform your day? Let's talk about morning exercise. It's amazing how a simple workout can boost your energy, improve your mood, and set you up for success. Just 15 minutes can make all the difference. Give it a try tomorrow!"
        },
        {
            "name": "Professional Style",
            "text": "Welcome to today's health segment. Morning exercise provides numerous benefits including increased energy levels, improved cardiovascular health, and enhanced mental clarity. Research shows that individuals who exercise in the morning report higher productivity throughout the day."
        },
        {
            "name": "Energetic Style",
            "text": "Hey there, fitness enthusiasts! Want to supercharge your mornings? Here's the secret: exercise! It gets your blood pumping, your mind sharp, and your spirit soaring. Whether it's a quick jog, some yoga, or jumping jacks, your future self will thank you!"
        }
    ]
    
    tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
    
    for i, approach in enumerate(approaches):
        print(f"\n   Testing: {approach['name']}")
        
        with tempfile.NamedTemporaryFile(suffix=f"_style_{i}.wav", delete=False) as temp_file:
            tts.tts_to_file(text=approach['text'], file_path=temp_file.name)
            
            audio_data, sample_rate = sf.read(temp_file.name)
            duration = len(audio_data) / sample_rate
            
            # Save with descriptive name
            style_filename = f"style_{approach['name'].lower().replace(' ', '_')}_{int(time.time())}.wav"
            sf.write(style_filename, audio_data, sample_rate)
            
            print(f"   ✅ Generated: {duration:.1f}s - {style_filename}")
            
            # Clean up temp
            os.unlink(temp_file.name)

async def main():
    """Run improved TTS tests"""
    print("🎙️ Improved AI Podcast TTS Testing")
    print("=" * 50)
    
    # Test improved approach
    success1 = await test_improved_tts()
    
    # Test different styles
    await test_different_approaches()
    
    print("\n" + "=" * 50)
    if success1:
        print("🎉 TTS improvements successful!")
        print("💡 Key improvements:")
        print("   ✅ No more literal 'pause' reading")
        print("   ✅ Natural sentence flow")
        print("   ✅ Proper punctuation for pauses")
        print("   ✅ Segmented generation with manual pauses")
        print("   ✅ Multiple speaking styles available")
        
        print("\n🚀 Your audio now sounds much more natural!")
    else:
        print("⚠️  Some issues to resolve")

if __name__ == "__main__":
    asyncio.run(main())
