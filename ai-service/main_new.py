from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import json
import os
import asyncio
import aiofiles
import tempfile
import logging
from typing import List, Optional, Dict
from datetime import datetime
import uuid

# Audio processing
import numpy as np
import soundfile as sf
from pydub import AudioSegment
import librosa
import noisereduce as nr

# TTS and AI models
from TTS.api import TTS
import torch
import requests
import httpx
from groq import AsyncGroq

# Optional imports for advanced features
try:
    from pedalboard import (
        Pedalboard, Compressor, Gain, Reverb, Chorus, 
        LadderFilter, Distortion, PitchShift, Delay
    )
    PEDALBOARD_AVAILABLE = True
except ImportError:
    PEDALBOARD_AVAILABLE = False

try:
    from tortoise.api import TextToSpeech
    from tortoise.utils.audio import load_voices
    TORTOISE_AVAILABLE = True
except ImportError:
    TORTOISE_AVAILABLE = False

# Background tasks - optional
try:
    from celery import Celery
    import redis
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Open Source AI Podcast Service",
    description="Complete AI service for podcast creation using open-source models",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for serving audio files
outputs_dir = os.path.join(os.getcwd(), "outputs")
if not os.path.exists(outputs_dir):
    os.makedirs(outputs_dir)
app.mount("/outputs", StaticFiles(directory=outputs_dir), name="outputs")

# Initialize components
tts_model = None
tortoise_tts = None
groq_client = None

# Environment variables
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "gsk_your_api_key_here")  # Get free API key from https://console.groq.com

# Pydantic models
class ScriptRequest(BaseModel):
    topic: str
    style: str = "conversational"
    duration_minutes: int = 5
    tone: str = "professional"
    include_intro: bool = True
    include_outro: bool = True

class TTSRequest(BaseModel):
    text: str
    voice: str = "default"
    speed: float = 1.0
    pitch: float = 0.0
    model: str = "coqui"  # "coqui" or "tortoise"

class VoiceCloneRequest(BaseModel):
    text: str
    voice_name: str
    speed: float = 1.0

class AudioProcessRequest(BaseModel):
    enhance_audio: bool = True
    remove_noise: bool = True
    normalize: bool = True
    add_effects: bool = False
    effects: Dict = {}

class PodcastGenerationRequest(BaseModel):
    script_params: ScriptRequest
    tts_params: TTSRequest
    audio_params: AudioProcessRequest
    include_music: bool = False
    music_style: str = "ambient"

# Initialize optional components
if CELERY_AVAILABLE:
    celery_app = Celery(
        "ai_service",
        broker="redis://localhost:6379/0",
        backend="redis://localhost:6379/0"
    )
    redis_client = redis.Redis(host='localhost', port=6379, db=1)
else:
    celery_app = None
    redis_client = None

@app.on_event("startup")
async def startup_event():
    """Initialize AI models on startup"""
    global tts_model, tortoise_tts, groq_client
    
    try:
        # Initialize Groq client
        logger.info("Initializing Groq client...")
        if GROQ_API_KEY and GROQ_API_KEY != "gsk_your_api_key_here":
            groq_client = AsyncGroq(api_key=GROQ_API_KEY)
            logger.info("Groq client initialized successfully!")
        else:
            logger.warning("Groq API key not set. Set GROQ_API_KEY environment variable.")
            groq_client = None
        
        # Initialize Coqui TTS
        logger.info("Initializing Coqui TTS...")
        tts_model = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        logger.info("Coqui TTS initialized successfully!")
        
        # Initialize Tortoise TTS (optional)
        if TORTOISE_AVAILABLE:
            logger.info("Initializing Tortoise TTS...")
            tortoise_tts = TextToSpeech()
            logger.info("Tortoise TTS initialized successfully!")
        else:
            logger.info("Tortoise TTS not available - using Coqui TTS only")
            tortoise_tts = None
        
        # Create directories
        os.makedirs("outputs", exist_ok=True)
        os.makedirs("voices", exist_ok=True)
        os.makedirs("temp", exist_ok=True)
        
        logger.info("AI Service initialized successfully!")
        
    except Exception as e:
        logger.error(f"Failed to initialize AI models: {e}")

# Utility functions
def generate_unique_filename(extension: str = "wav") -> str:
    """Generate unique filename with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"podcast_{timestamp}_{unique_id}.{extension}"

def clean_text_for_tts(text: str) -> str:
    """Clean and validate text for TTS with comprehensive safety"""
    import re
    import string
    
    # Remove quotes at start/end
    text = text.strip('"\'')
    
    # Remove anything in parentheses or brackets
    text = re.sub(r'\([^)]*\)', '', text)
    text = re.sub(r'\[[^\]]*\]', '', text)
    
    # Remove common stage directions
    stage_directions = [
        'pause', 'brief pause', 'long pause', 
        'sound cue', 'music', 'fade in', 'fade out',
        'background music', 'sfx', 'sound effect'
    ]
    
    for direction in stage_directions:
        text = text.replace(f'({direction})', '')
        text = text.replace(f'[{direction}]', '')
    
    # Clean up punctuation for better flow
    text = text.replace('...', '. ')
    text = text.replace('..', '.')
    text = text.replace(' - ', '. ')
    
    # Ensure proper punctuation
    if not text.endswith(('.', '!', '?')):
        text += '.'
    
    # Clean up extra spaces
    text = ' '.join(text.split())
    
    # Validate text length and content
    if len(text.strip()) < 3:
        return "Hello there, welcome to our podcast."
    
    # Remove any problematic characters that might cause TTS issues
    text = ''.join(char for char in text if char.isprintable())
    
    return text

def split_text_for_tts(text: str, max_length: int = 60) -> list:
    """Ultra-safe text segmentation that prevents decoder issues"""
    import re
    
    min_length = 10
    
    # First, split by sentences
    sentences = re.split(r'([.!?]+)', text)
    
    # Combine sentences with their punctuation
    clean_sentences = []
    for i in range(0, len(sentences), 2):
        if i + 1 < len(sentences):
            sentence = sentences[i].strip() + sentences[i + 1]
        else:
            sentence = sentences[i].strip()
        
        if sentence.strip():
            clean_sentences.append(sentence.strip())
    
    # Now segment by length
    segments = []
    
    for sentence in clean_sentences:
        if len(sentence) <= max_length and len(sentence) >= min_length:
            segments.append(sentence)
        elif len(sentence) > max_length:
            # Split long sentences by words
            words = sentence.split()
            current_segment = ""
            
            for word in words:
                test_segment = current_segment + " " + word if current_segment else word
                
                if len(test_segment) <= max_length:
                    current_segment = test_segment
                else:
                    if current_segment and len(current_segment) >= min_length:
                        segments.append(current_segment.strip())
                    current_segment = word
            
            if current_segment and len(current_segment) >= min_length:
                segments.append(current_segment.strip())
        elif len(sentence) < min_length and segments:
            # Append short segments to previous segment
            segments[-1] = segments[-1] + " " + sentence
    
    # Final validation - ensure all segments meet requirements
    validated_segments = []
    for segment in segments:
        segment = segment.strip()
        if min_length <= len(segment) <= max_length and segment:
            validated_segments.append(segment)
    
    # If no valid segments, create a default one
    if not validated_segments:
        validated_segments = ["Hello and welcome to our podcast today."]
    
    return validated_segments

async def save_audio_file(audio_data: np.ndarray, sample_rate: int = 22050) -> str:
    """Save audio data to file and return filename"""
    filename = generate_unique_filename("wav")
    filepath = os.path.join("outputs", filename)
    sf.write(filepath, audio_data, sample_rate)
    return filename

def enhance_audio(audio_data: np.ndarray, sample_rate: int = 22050) -> np.ndarray:
    """Apply audio enhancement with fallback for missing dependencies"""
    try:
        # Noise reduction (always available)
        reduced_noise = nr.reduce_noise(y=audio_data, sr=sample_rate)
        
        # Apply pedalboard effects if available
        if PEDALBOARD_AVAILABLE:
            board = Pedalboard([
                Compressor(threshold_db=-16, ratio=4),
                Gain(gain_db=2),
                Reverb(room_size=0.25, damping=0.5, wet_level=0.1)
            ])
            enhanced = board(reduced_noise, sample_rate)
        else:
            # Fallback: basic audio normalization
            try:
                enhanced = librosa.util.normalize(reduced_noise)
            except Exception as e:
                logger.warning(f"Audio normalization failed: {e}")
                enhanced = reduced_noise  # Use unenhanced audio
            
        return enhanced
        
    except Exception as e:
        logger.error(f"Audio enhancement failed: {e}")
        # Return normalized audio as fallback
        try:
            return librosa.util.normalize(audio_data)
        except Exception:
            return audio_data  # Return original if normalization fails

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Open Source AI Podcast Service", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "AI Podcast Service",
        "version": "1.0.0",
        "models": {
            "coqui_tts": tts_model is not None,
            "tortoise_tts": tortoise_tts is not None,
            "groq_api": groq_client is not None
        }
    }

@app.get("/models/status")
async def models_status():
    """Check status of loaded AI models"""
    status = {
        "coqui_tts": tts_model is not None,
        "tortoise_tts": tortoise_tts is not None,
        "groq_available": False
    }
    
    # Check Groq availability
    try:
        if groq_client and GROQ_API_KEY != "gsk_your_api_key_here":
            # Test Groq API connection
            test_response = await groq_client.chat.completions.create(
                messages=[{"role": "user", "content": "Hello"}],
                model="llama-3.1-8b-instant",
                max_tokens=5
            )
            status["groq_available"] = True
    except Exception as e:
        logger.error(f"Groq API test failed: {e}")
        status["groq_available"] = False
    
    return status

@app.post("/script/generate")
async def generate_script(request: ScriptRequest):
    """Generate podcast script using Groq API with enhanced content generation"""
    try:
        # Calculate target word count for comprehensive content
        target_words = request.duration_minutes * 200  # 200 words per minute for natural speech
        
        prompt = f"""
        Create a comprehensive, engaging {request.duration_minutes}-minute podcast script about "{request.topic}".
        
        SPECIFICATIONS:
        - Duration: {request.duration_minutes} minutes ({target_words} words approximately)
        - Style: {request.style}
        - Tone: {request.tone}
        
        CONTENT REQUIREMENTS:
        - Write as natural, conversational speech for text-to-speech
        - Create substantial, in-depth content worthy of a {request.duration_minutes}-minute episode
        - Include multiple key points, examples, and detailed explanations
        - Make it engaging throughout with varied pacing and energy
        - Use storytelling techniques where appropriate
        {"- Start with an engaging hook and introduction" if request.include_intro else ""}
        {"- End with a memorable conclusion and call-to-action" if request.include_outro else ""}
        
        STRUCTURE GUIDELINES:
        - Introduction: Set the stage and hook the listener
        - Main content: 3-5 key points with detailed exploration
        - Examples and real-world applications
        - Conclusion: Summarize key takeaways
        
        SPEECH FORMATTING:
        - Write as if someone is speaking naturally and conversationally
        - Use periods for natural pauses, commas for brief pauses
        - Use exclamation points for energy and enthusiasm
        - NO stage directions like "(pause)" or "[sound effects]"
        - NO parentheses or brackets for directions
        - Keep sentences flowing and conversational
        - Vary sentence length for natural rhythm
        
        TARGET: Approximately {target_words} words of rich, substantive content.
        
        Write ONLY the spoken podcast content, nothing else.
        """
        
        if not groq_client:
            raise HTTPException(status_code=500, detail="Groq client not initialized")
        
        response = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=4000  # Increased for longer content
        )
        
        script_content = response.choices[0].message.content.strip()
        
        # Validate content length
        word_count = len(script_content.split())
        if word_count < target_words * 0.7:  # If less than 70% of target
            logger.warning(f"Script too short ({word_count} words vs {target_words} target). Enhancing...")
            
            # Generate additional content
            enhancement_prompt = f"""
            The following podcast script about "{request.topic}" needs to be expanded to reach {target_words} words for a {request.duration_minutes}-minute episode.
            
            Current script ({word_count} words):
            {script_content}
            
            Please expand this script by:
            - Adding more detailed explanations and examples
            - Including additional relevant points and insights
            - Expanding on existing ideas with more depth
            - Adding real-world applications and case studies
            - Maintaining the same {request.style} tone and natural speech flow
            
            Return the complete expanded script (approximately {target_words} words).
            """
            
            enhancement_response = await groq_client.chat.completions.create(
                messages=[{"role": "user", "content": enhancement_prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=4000
            )
            
            script_content = enhancement_response.choices[0].message.content.strip()
        
        final_word_count = len(script_content.split())
        estimated_duration = final_word_count / 200  # 200 words per minute
        
        return {
            "success": True,
            "script": script_content,
            "metadata": {
                "topic": request.topic,
                "duration_target": request.duration_minutes,
                "estimated_duration": round(estimated_duration, 1),
                "word_count": final_word_count,
                "target_words": target_words,
                "style": request.style,
                "tone": request.tone,
                "generated_at": datetime.now().isoformat(),
                "model": "llama-3.3-70b-versatile"
            }
        }
                
    except Exception as e:
        logger.error(f"Script generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Convert text to speech using selected TTS model with decoder safety"""
    try:
        if request.model == "coqui" and tts_model:
            # Clean text for better TTS output
            cleaned_text = clean_text_for_tts(request.text)
            
            # Split into SAFE segments to prevent decoder issues
            segments = split_text_for_tts(cleaned_text, max_length=60)
            
            audio_segments = []
            
            for i, segment in enumerate(segments):
                # Validate segment before processing
                if not segment.strip() or len(segment.strip()) < 3:
                    logger.warning(f"Skipping invalid segment: '{segment}'")
                    continue
                    
                logger.info(f"Processing segment {i+1}/{len(segments)}: '{segment[:30]}...'")
                
                try:
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                        tts_model.tts_to_file(
                            text=segment,
                            file_path=temp_file.name,
                            speed=request.speed
                        )
                        
                        # Load segment audio with safety checks
                        segment_audio, sample_rate = sf.read(temp_file.name)
                        duration = len(segment_audio) / sample_rate
                        
                        # Safety check - truncate if too long
                        if duration > 15.0:
                            logger.warning(f"Segment too long ({duration:.1f}s), truncating...")
                            max_samples = int(15.0 * sample_rate)
                            segment_audio = segment_audio[:max_samples]
                        
                        # Validate audio quality
                        if len(segment_audio) > 0 and not np.all(segment_audio == 0):
                            audio_segments.append(segment_audio)
                            logger.info(f"Valid audio generated: {len(segment_audio) / sample_rate:.1f}s")
                        else:
                            logger.warning("Invalid audio generated, using silence")
                            audio_segments.append(np.zeros(int(1.0 * sample_rate)))
                        
                        # Clean up temp file
                        os.unlink(temp_file.name)
                        
                except Exception as e:
                    logger.error(f"Failed to process segment '{segment}': {e}")
                    # Add silence for failed segments
                    silence = np.zeros(int(1.0 * sample_rate))
                    audio_segments.append(silence)
                    continue
            
            # Combine segments with smaller pauses
            if len(audio_segments) > 1:
                pause_duration = 0.3  # Shorter pauses
                pause_samples = int(pause_duration * sample_rate)
                pause_audio = np.zeros(pause_samples)
                
                combined_audio = []
                for i, segment in enumerate(audio_segments):
                    combined_audio.extend(segment)
                    if i < len(audio_segments) - 1:
                        combined_audio.extend(pause_audio)
                
                audio_data = np.array(combined_audio)
            else:
                audio_data = audio_segments[0] if audio_segments else np.array([])
            
            # Safety check for total duration
            total_duration = len(audio_data) / sample_rate
            if total_duration > 300.0:  # 5 minutes max
                logger.warning(f"Audio too long ({total_duration:.1f}s), truncating to 5 minutes")
                max_samples = int(300.0 * sample_rate)
                audio_data = audio_data[:max_samples]
            
            # Apply pitch shift if requested (simplified for safety)
            if request.pitch != 0.0:
                try:
                    import librosa.effects
                    audio_data = librosa.effects.pitch_shift(audio_data, sr=sample_rate, 
                                                           n_steps=request.pitch)
                except Exception as e:
                    logger.warning(f"Pitch shifting failed: {e}")
            
            # Normalize and save final audio
            try:
                normalized_audio = librosa.util.normalize(audio_data)
            except Exception as e:
                logger.warning(f"Audio normalization failed: {e}")
                normalized_audio = audio_data  # Use unnormalized audio
            output_filename = await save_audio_file(normalized_audio, sample_rate)
            
            return {
                "success": True,
                "audio_file": output_filename,
                "duration": len(normalized_audio) / sample_rate,
                "model_used": "coqui",
                "segments_processed": len(segments),
                "text_cleaned": cleaned_text != request.text,
                "decoder_safe": True
            }
                
        elif request.model == "tortoise" and tortoise_tts:
            # Use Tortoise TTS (requires voice samples)
            # This is a simplified version - in production, you'd need proper voice setup
            audio_data = tortoise_tts.tts_with_preset(
                request.text,
                voice_samples=None,  # Would need voice samples
                preset="fast"
            )
            
            output_filename = await save_audio_file(audio_data.cpu().numpy())
            
            return {
                "success": True,
                "audio_file": output_filename,
                "model_used": "tortoise"
            }
        else:
            raise HTTPException(status_code=400, detail="TTS model not available")
            
    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice/clone")
async def clone_voice(request: VoiceCloneRequest, voice_samples: List[UploadFile] = File(...)):
    """Clone voice using uploaded samples"""
    try:
        if not tortoise_tts:
            raise HTTPException(status_code=400, detail="Tortoise TTS not available")
        
        # Save voice samples
        voice_dir = os.path.join("voices", request.voice_name)
        os.makedirs(voice_dir, exist_ok=True)
        
        for sample in voice_samples:
            sample_path = os.path.join(voice_dir, sample.filename)
            async with aiofiles.open(sample_path, 'wb') as f:
                content = await sample.read()
                await f.write(content)
        
        # Load voice samples
        voice_samples_data = load_voices([request.voice_name])
        
        # Generate speech with cloned voice
        audio_data = tortoise_tts.tts_with_preset(
            request.text,
            voice_samples=voice_samples_data[request.voice_name],
            preset="high_quality"
        )
        
        output_path = await save_audio_file(audio_data.cpu().numpy())
        
        return {
            "success": True,
            "audio_file": output_path,
            "voice_name": request.voice_name,
            "samples_used": len(voice_samples)
        }
        
    except Exception as e:
        logger.error(f"Voice cloning failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/audio/process")
async def process_audio(file: UploadFile = File(...), params: str = None):
    """Process uploaded audio file with enhancements"""
    try:
        # Parse parameters
        if params:
            audio_params = AudioProcessRequest.parse_raw(params)
        else:
            audio_params = AudioProcessRequest()
        
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Load audio
        try:
            audio_data, sample_rate = librosa.load(temp_path, sr=None)
        except Exception as e:
            logger.error(f"Failed to load audio file: {e}")
            raise HTTPException(status_code=400, detail="Could not load audio file")
        
        # Apply processing
        if audio_params.remove_noise or audio_params.enhance_audio:
            audio_data = enhance_audio(audio_data, sample_rate)
        
        if audio_params.normalize:
            try:
                audio_data = librosa.util.normalize(audio_data)
            except Exception as e:
                logger.warning(f"Audio normalization failed: {e}")
        
        if audio_params.add_effects and audio_params.effects and PEDALBOARD_AVAILABLE:
            # Apply custom effects based on parameters (only if pedalboard available)
            effects = []
            if audio_params.effects.get("reverb"):
                effects.append(Reverb(room_size=0.5))
            if audio_params.effects.get("chorus"):
                effects.append(Chorus())
            if audio_params.effects.get("compressor"):
                effects.append(Compressor())
            
            if effects:
                board = Pedalboard(effects)
                audio_data = board(audio_data, sample_rate)
        elif audio_params.add_effects and not PEDALBOARD_AVAILABLE:
            logger.warning("Advanced effects requested but pedalboard not available")
        
        # Save processed audio
        output_path = await save_audio_file(audio_data, sample_rate)
        
        # Clean up
        os.unlink(temp_path)
        
        return {
            "success": True,
            "processed_file": output_path,
            "original_duration": len(audio_data) / sample_rate,
            "processing_applied": {
                "noise_reduction": audio_params.remove_noise,
                "enhancement": audio_params.enhance_audio,
                "normalization": audio_params.normalize,
                "effects": audio_params.add_effects
            }
        }
        
    except Exception as e:
        logger.error(f"Audio processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/podcast/generate")
async def generate_complete_podcast(background_tasks: BackgroundTasks, request: PodcastGenerationRequest):
    """Generate complete podcast episode (with or without background processing)"""
    try:
        task_id = str(uuid.uuid4())
        
        # Try to use Redis for background processing if available
        if CELERY_AVAILABLE:
            try:
                # Store task info in Redis
                redis_client.setex(
                    f"task:{task_id}",
                    3600,  # 1 hour TTL
                    json.dumps({
                        "status": "started",
                        "progress": 0,
                        "created_at": datetime.now().isoformat()
                    })
                )
                
                # Start background task
                background_tasks.add_task(process_podcast_generation, task_id, request)
                
                return {
                    "success": True,
                    "task_id": task_id,
                    "message": "Podcast generation started (background processing)",
                    "estimated_time": "5-10 minutes",
                    "check_status": f"/task/{task_id}"
                }
            except Exception as redis_error:
                logger.warning(f"Redis unavailable, falling back to direct processing: {redis_error}")
        
        # Fallback: Direct processing without Redis
        logger.info("Processing podcast directly (Redis unavailable)")
        
        # Generate script
        if hasattr(request, 'script_params') and request.script_params:
            script_request = ScriptRequest(**request.script_params.dict())
            script_response = await generate_script(script_request)
            script_text = script_response.get('script', '')
        else:
            # Use TTS text directly
            script_text = request.tts_params.text if request.tts_params else "Welcome to our podcast!"
        
        # Generate TTS
        if request.tts_params:
            tts_request = TTSRequest(
                text=script_text,
                model=request.tts_params.model or "coqui",
                speed=request.tts_params.speed or 1.0,
                pitch=request.tts_params.pitch or 0.0
            )
            tts_response = await synthesize_speech(tts_request)
            
            return {
                "success": True,
                "task_id": task_id,
                "message": "Podcast generated successfully (direct processing)",
                "audio_file": tts_response.get('audio_file'),
                "duration": tts_response.get('duration'),
                "script_length": len(script_text),
                "processing_method": "direct"
            }
        else:
            return {
                "success": False,
                "message": "No TTS parameters provided",
                "task_id": task_id
            }
        
    except Exception as e:
        logger.error(f"Podcast generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of background task (Redis required)"""
    try:
        if not CELERY_AVAILABLE:
            raise HTTPException(status_code=503, detail="Background task tracking unavailable (Redis not connected)")
            
        task_data = redis_client.get(f"task:{task_id}")
        if not task_data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return json.loads(task_data)
        
    except Exception as e:
        logger.error(f"Task status check failed: {e}")
        if "Redis not connected" in str(e):
            raise HTTPException(status_code=503, detail="Task tracking service unavailable")
        raise HTTPException(status_code=500, detail=str(e))

async def process_podcast_generation(task_id: str, request: PodcastGenerationRequest):
    """Background task for complete podcast generation (Redis required)"""
    try:
        if not CELERY_AVAILABLE:
            logger.error(f"Background processing called but Redis unavailable for task {task_id}")
            return
            
        # Update progress: Script generation (20%)
        try:
            redis_client.setex(
                f"task:{task_id}",
                3600,
                json.dumps({
                    "status": "generating_script",
                    "progress": 20,
                    "current_step": "Generating script..."
                })
            )
        except Exception as redis_error:
            logger.error(f"Redis update failed for task {task_id}: {redis_error}")
            return
        
        # Generate script
        script_response = await generate_script(request.script_params)
        script_content = script_response["script"]
        
        # Update progress: TTS synthesis (60%)
        redis_client.setex(
            f"task:{task_id}",
            3600,
            json.dumps({
                "status": "synthesizing_speech",
                "progress": 60,
                "current_step": "Converting text to speech..."
            })
        )
        
        # Convert to speech
        tts_request = TTSRequest(text=script_content, **request.tts_params.dict())
        tts_response = await synthesize_speech(tts_request)
        audio_file = tts_response["audio_file"]
        
        # Update progress: Audio processing (90%)
        redis_client.setex(
            f"task:{task_id}",
            3600,
            json.dumps({
                "status": "processing_audio",
                "progress": 90,
                "current_step": "Enhancing audio quality..."
            })
        )
        
        # Process audio if requested
        if request.audio_params.enhance_audio:
            # Load and enhance audio
            audio_data, sample_rate = sf.read(audio_file)
            enhanced_audio = enhance_audio(audio_data, sample_rate)
            audio_file = await save_audio_file(enhanced_audio, sample_rate)
        
        # Complete
        redis_client.setex(
            f"task:{task_id}",
            3600,
            json.dumps({
                "status": "completed",
                "progress": 100,
                "result": {
                    "audio_file": audio_file,
                    "script": script_content,
                    "duration": tts_response.get("duration", 0),
                    "metadata": script_response["metadata"]
                },
                "completed_at": datetime.now().isoformat()
            })
        )
        
    except Exception as e:
        logger.error(f"Background podcast generation failed: {e}")
        redis_client.setex(
            f"task:{task_id}",
            3600,
            json.dumps({
                "status": "failed",
                "error": str(e),
                "failed_at": datetime.now().isoformat()
            })
        )

@app.post("/content/enhance")
async def enhance_content(request: dict):
    """Enhance existing content using Groq API"""
    try:
        if not groq_client:
            raise HTTPException(status_code=500, detail="Groq client not initialized")
        
        content = request.get("content", "")
        enhancement_type = request.get("type", "general")  # general, grammar, style, clarity
        
        prompts = {
            "general": f"Improve this content for better readability and engagement:\n\n{content}",
            "grammar": f"Fix grammar, spelling, and punctuation errors in this content:\n\n{content}",
            "style": f"Improve the writing style and flow of this content:\n\n{content}",
            "clarity": f"Make this content clearer and more concise:\n\n{content}"
        }
        
        response = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompts.get(enhancement_type, prompts["general"])}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=2000
        )
        
        enhanced_content = response.choices[0].message.content
        
        return {
            "success": True,
            "original_content": content,
            "enhanced_content": enhanced_content,
            "enhancement_type": enhancement_type,
            "model": "llama-3.1-70b-versatile"
        }
        
    except Exception as e:
        logger.error(f"Content enhancement failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/seo/optimize")
async def optimize_for_seo(request: dict):
    """Generate SEO-optimized metadata using Groq API"""
    try:
        if not groq_client:
            raise HTTPException(status_code=500, detail="Groq client not initialized")
        
        content = request.get("content", "")
        target_keywords = request.get("keywords", [])
        content_type = request.get("type", "podcast")  # podcast, blog, article
        
        prompt = f"""
        Analyze this {content_type} content and generate SEO-optimized metadata:
        
        Content: {content}
        Target Keywords: {', '.join(target_keywords) if target_keywords else 'Not specified'}
        
        Please provide:
        1. Title (60 characters max)
        2. Meta description (155 characters max)
        3. Suggested tags/keywords (10-15 items)
        4. Short summary (2-3 sentences)
        5. Long description (2-3 paragraphs)
        6. Suggested categories
        
        Format as JSON with these exact keys: title, meta_description, tags, summary, description, categories
        """
        
        response = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1000
        )
        
        seo_content = response.choices[0].message.content
        
        # Try to parse as JSON, fallback to structured text
        try:
            seo_data = json.loads(seo_content)
        except:
            seo_data = {"raw_response": seo_content}
        
        return {
            "success": True,
            "seo_metadata": seo_data,
            "original_keywords": target_keywords,
            "content_type": content_type,
            "model": "llama-3.1-70b-versatile"
        }
        
    except Exception as e:
        logger.error(f"SEO optimization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/content/summarize")
async def summarize_content(request: dict):
    """Generate content summaries using Groq API"""
    try:
        if not groq_client:
            raise HTTPException(status_code=500, detail="Groq client not initialized")
        
        content = request.get("content", "")
        summary_type = request.get("type", "brief")  # brief, detailed, bullet_points
        max_length = request.get("max_length", 200)
        
        prompts = {
            "brief": f"Summarize this content in {max_length} words or less:\n\n{content}",
            "detailed": f"Create a detailed summary of this content ({max_length} words max):\n\n{content}",
            "bullet_points": f"Create a bullet-point summary of the key points from this content:\n\n{content}"
        }
        
        response = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompts.get(summary_type, prompts["brief"])}],
            model="llama-3.1-8b-instant",  # Faster model for summaries
            temperature=0.2,
            max_tokens=500
        )
        
        summary = response.choices[0].message.content
        
        return {
            "success": True,
            "original_length": len(content.split()),
            "summary": summary,
            "summary_type": summary_type,
            "model": "llama-3.1-8b-instant"
        }
        
    except Exception as e:
        logger.error(f"Content summarization failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
