from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn
import json
import os
import asyncio
import aiofiles
import tempfile
import logging
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from functools import lru_cache
import hashlib
import time
from collections import defaultdict

# Audio processing
import numpy as np
import soundfile as sf
from pydub import AudioSegment
import librosa
import noisereduce as nr
from pedalboard import (
    Pedalboard, Compressor, Gain, Reverb, Chorus, 
    LadderFilter, Distortion, PitchShift, Delay
)

# TTS and AI models
from TTS.api import TTS
import torch
import requests
import httpx
from tortoise.api import TextToSpeech
from tortoise.utils.audio import load_voices
from groq import Groq

# Background tasks
from celery import Celery
import redis

# Import multi-speaker audio support
from multi_speaker_audio import MusicGenerator, MultiSpeakerProcessor, AudioMixer

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Configuration
output_dir = "outputs"
temp_dir = "temp"

# Ensure directories exist
os.makedirs(output_dir, exist_ok=True)
os.makedirs(temp_dir, exist_ok=True)

# Performance Optimizations
# Performance optimization class
class PerformanceOptimizer:
    def __init__(self):
        self.connection_pool = asyncio.Queue(maxsize=10)
        self.active_connections = 0
        self.max_connections = 10
        
    async def get_connection(self):
        """Get a connection from the pool"""
        if self.active_connections < self.max_connections:
            self.active_connections += 1
            return AsyncConnectionContext(self)
        else:
            # Wait for an available connection
            await asyncio.sleep(0.1)
            return await self.get_connection()
    
    def release_connection(self):
        """Release a connection back to the pool"""
        if self.active_connections > 0:
            self.active_connections -= 1

class AsyncConnectionContext:
    def __init__(self, optimizer):
        self.optimizer = optimizer
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.optimizer.release_connection()

class PerformanceCache:
    """In-memory cache for expensive operations"""
    def __init__(self):
        self.script_cache = {}
        self.audio_cache = {}
        self.model_cache = {}
        self.max_cache_size = 100
        self.cache_ttl = 3600  # 1 hour
    
    def get_cache_key(self, *args) -> str:
        """Generate cache key from arguments"""
        return hashlib.md5(str(args).encode()).hexdigest()
    
    def get_script(self, topic: str, style: str) -> Optional[str]:
        key = f"{topic}_{style}"
        cache_entry = self.script_cache.get(key)
        if cache_entry and time.time() - cache_entry['timestamp'] < self.cache_ttl:
            logger.info(f"Cache hit for script: {topic[:30]}...")
            performance_metrics.record_cache_hit("script")
            return cache_entry['data']
        performance_metrics.record_cache_miss("script")
        return None
    
    def set_script(self, topic: str, style: str, script: str):
        key = self.get_cache_key("script", topic, style)
        if len(self.script_cache) >= self.max_cache_size:
            # Remove oldest entry
            oldest_key = min(self.script_cache.keys(), 
                           key=lambda k: self.script_cache[k]['timestamp'])
            del self.script_cache[oldest_key]
        
        self.script_cache[key] = {
            'data': script,
            'timestamp': time.time()
        }
        logger.info(f"Cached script for: {topic[:30]}...")
    
    def get_audio(self, text_hash: str) -> Optional[str]:
        cache_entry = self.audio_cache.get(text_hash)
        if cache_entry and time.time() - cache_entry['timestamp'] < self.cache_ttl:
            if os.path.exists(cache_entry['file_path']):
                logger.info(f"Cache hit for audio: {text_hash[:8]}...")
                performance_metrics.record_cache_hit("audio")
                return cache_entry['file_path']
        performance_metrics.record_cache_miss("audio")
        return None
    
    def set_audio(self, text_hash: str, file_path: str):
        if len(self.audio_cache) >= self.max_cache_size:
            # Remove oldest entry and file
            oldest_key = min(self.audio_cache.keys(), 
                           key=lambda k: self.audio_cache[k]['timestamp'])
            old_file = self.audio_cache[oldest_key]['file_path']
            if os.path.exists(old_file):
                os.remove(old_file)
            del self.audio_cache[oldest_key]
        
        self.audio_cache[text_hash] = {
            'file_path': file_path,
            'timestamp': time.time()
        }
        logger.info(f"Cached audio: {text_hash[:8]}...")

# Global cache instance
performance_cache = PerformanceCache()

# Global performance optimizer instance
performance_optimizer = PerformanceOptimizer()

# Model loading optimization
@lru_cache(maxsize=3)
def get_tts_model(model_name: str = "tts_models/en/ljspeech/tacotron2-DDC"):
    """Load and cache TTS models"""
    logger.info(f"Loading TTS model: {model_name}")
    return TTS(model_name)

# Async utilities for better performance
async def async_groq_request(prompt: str, model: str = "mixtral-8x7b-32768") -> str:
    """Async wrapper for Groq API calls"""
    loop = asyncio.get_event_loop()
    
    def sync_groq_call():
        response = groq_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048
        )
        return response.choices[0].message.content
    
    return await loop.run_in_executor(None, sync_groq_call)

def get_text_hash(text: str) -> str:
    """Generate hash for text caching"""
    return hashlib.md5(text.encode()).hexdigest()

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

# Initialize components
tts_model = None
tortoise_tts = None
music_generator = None
multi_speaker_processor = None
audio_mixer = None
ollama_base_url = "http://localhost:11434"

# Pydantic models
class ScriptRequest(BaseModel):
    topic: str
    style: str = "conversational"
    duration_minutes: int = 5
    tone: str = "professional"
    include_intro: bool = True
    include_outro: bool = True
    num_speakers: int = 1
    speaker_styles: List[str] = ["conversational"]
    include_music: bool = False
    music_style: str = "ambient"

class TTSRequest(BaseModel):
    text: str
    voice: str = "default"
    speed: float = 1.0
    pitch: float = 0.0
    model: str = "coqui"  # "coqui" or "tortoise"

class MultiSpeakerTTSRequest(BaseModel):
    segments: List[Dict[str, Any]]  # [{"speaker": 1, "text": "Hello", "voice": "female"}]
    voices: Dict[str, str] = {"speaker1": "female", "speaker2": "male"}
    speeds: Dict[str, float] = {"speaker1": 1.0, "speaker2": 1.0}
    model: str = "coqui"

class MusicRequest(BaseModel):
    style: str = "ambient"  # ambient, upbeat, dramatic, relaxing
    duration: float = 10.0  # seconds
    fade_in: bool = True
    fade_out: bool = True
    volume: float = 0.3  # 0.1 to 1.0

class PodcastProductionRequest(BaseModel):
    script_params: ScriptRequest
    multi_speaker_params: MultiSpeakerTTSRequest
    intro_music: Optional[MusicRequest] = None
    outro_music: Optional[MusicRequest] = None
    background_music: Optional[MusicRequest] = None
    final_mix: bool = True

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

# Celery for background tasks
celery_app = Celery(
    "ai_service",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

# Redis client
redis_client = redis.Redis(host='localhost', port=6379, db=1)

@app.on_event("startup")
async def startup_event():
    """Initialize TTS models and audio processors on startup"""
    global tts_model, tortoise_tts, music_generator, multi_speaker_processor, audio_mixer
    
    logger.info("Starting AI Service with Multi-Speaker and Music Support...")
    
    try:
        # Initialize TTS model
        tts_model = get_tts_model()
        logger.info("✅ Coqui TTS model loaded successfully")
        
        # Initialize audio production components
        music_generator = MusicGenerator(output_dir)
        audio_mixer = AudioMixer(output_dir)
        
        if tts_model:
            multi_speaker_processor = MultiSpeakerProcessor(tts_model)
            logger.info("✅ Multi-speaker processor initialized")
        
        logger.info("✅ Music generator and audio mixer initialized")
        
    except Exception as e:
        logger.error(f"Failed to initialize audio components: {e}")

# Utility functions
def generate_unique_filename(extension: str = "wav") -> str:
    """Generate unique filename with timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    return f"{timestamp}_{unique_id}.{extension}"

async def save_audio_file(audio_data: np.ndarray, sample_rate: int = 22050) -> str:
    """Save audio data to file"""
    filename = generate_unique_filename("wav")
    filepath = os.path.join("outputs", filename)
    sf.write(filepath, audio_data, sample_rate)
    return filepath

def enhance_audio(audio_data: np.ndarray, sample_rate: int = 22050) -> np.ndarray:
    """Apply audio enhancement"""
    try:
        # Noise reduction
        reduced_noise = nr.reduce_noise(y=audio_data, sr=sample_rate)
        
        # Apply pedalboard effects
        board = Pedalboard([
            Compressor(threshold_db=-16, ratio=4),
            Gain(gain_db=2),
            Reverb(room_size=0.25, damping=0.5, wet_level=0.1)
        ])
        
        # Process audio
        enhanced = board(reduced_noise, sample_rate)
        return enhanced
        
    except Exception as e:
        logger.error(f"Audio enhancement failed: {e}")
        return audio_data

# Performance monitoring
class PerformanceMetrics:
    def __init__(self):
        self.request_times = defaultdict(list)
        self.cache_hits = defaultdict(int)
        self.cache_misses = defaultdict(int)
        self.total_requests = defaultdict(int)
        
    def record_request_time(self, endpoint: str, duration: float):
        self.request_times[endpoint].append(duration)
        self.total_requests[endpoint] += 1
        
    def record_cache_hit(self, cache_type: str):
        self.cache_hits[cache_type] += 1
        
    def record_cache_miss(self, cache_type: str):
        self.cache_misses[cache_type] += 1
        
    def get_metrics(self):
        metrics = {}
        for endpoint, times in self.request_times.items():
            if times:
                metrics[endpoint] = {
                    "avg_response_time": sum(times) / len(times),
                    "min_response_time": min(times),
                    "max_response_time": max(times),
                    "total_requests": self.total_requests[endpoint]
                }
        
        cache_metrics = {}
        for cache_type in set(list(self.cache_hits.keys()) + list(self.cache_misses.keys())):
            hits = self.cache_hits[cache_type]
            misses = self.cache_misses[cache_type]
            total = hits + misses
            cache_metrics[cache_type] = {
                "hit_rate": hits / total if total > 0 else 0,
                "total_hits": hits,
                "total_misses": misses
            }
        
        return {
            "response_times": metrics,
            "cache_performance": cache_metrics,
            "active_connections": performance_optimizer.active_connections,
            "cache_size": {
                "scripts": len(performance_cache.script_cache),
                "audio": len(performance_cache.audio_cache)
            }
        }

# Global performance metrics
performance_metrics = PerformanceMetrics()

@app.get("/metrics")
async def get_performance_metrics():
    """Get performance metrics and statistics"""
    return performance_metrics.get_metrics()

# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Open Source AI Podcast Service", "status": "running"}

@app.get("/models/status")
async def models_status():
    """Check status of loaded AI models"""
    status = {
        "coqui_tts": tts_model is not None,
        "tortoise_tts": tortoise_tts is not None,
        "ollama_available": False
    }
    
    # Check Ollama availability
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ollama_base_url}/api/tags", timeout=5.0)
            status["ollama_available"] = response.status_code == 200
            if status["ollama_available"]:
                status["ollama_models"] = response.json().get("models", [])
    except:
        pass
    
    return status

@app.post("/script/generate")
async def generate_script(request: ScriptRequest):
    """Generate podcast script using Groq with caching"""
    try:
        # Check cache first
        cached_script = performance_cache.get_script(request.topic, request.style)
        if cached_script:
            performance_metrics.record_cache_hit("script")
            return {"script": cached_script, "cached": True}
        else:
            performance_metrics.record_cache_miss("script")
        
        start_time = time.time()
        
        prompt = f"""
        You are creating audio content that will be read by a text-to-speech system. Write ONLY the spoken words that should be heard by listeners.

        Topic: {request.topic}
        Duration: {request.duration_minutes} minutes
        Style: {request.style}
        Tone: {request.tone}

        CRITICAL RULES - DO NOT INCLUDE:
        ❌ NO episode titles, headings, or section labels
        ❌ NO timestamps like [0:00] or (2:15)
        ❌ NO stage directions like [music plays] or [pause]
        ❌ NO speaker labels like "HOST:" or "NARRATOR:"
        ❌ NO markdown formatting like **bold** or *italics*
        ❌ NO bullet points or numbered lists
        ❌ NO sound effects descriptions
        ❌ NO technical instructions or notes

        WRITE ONLY:
        ✅ Natural, conversational speech
        ✅ Complete sentences with proper punctuation
        ✅ Direct address to the listener ("you", "we", "let's")
        ✅ Smooth transitions between ideas
        ✅ Rhetorical questions to engage listeners

        {'✅ Start with an engaging hook' if request.include_intro else ''}
        {'✅ End with a memorable conclusion' if request.include_outro else ''}

        Example of what TO write:
        "Welcome to today's discussion about technology. Have you ever wondered how artificial intelligence is changing our daily lives? Let's explore this fascinating topic together..."

        Example of what NOT to write:
        "**Welcome to TechTalk!** [upbeat music] HOST: Today we're discussing... [00:30]"

        Now write {request.duration_minutes} minutes of natural speech about {request.topic} in a {request.style} {request.tone} style:
        """
        
        # Use async Groq for better performance
        script_content = await async_groq_request(prompt, "llama-3.1-8b-instant")
        
        # Cache the result
        performance_cache.set_script(request.topic, request.style, script_content)
        
        generation_time = time.time() - start_time
        logger.info(f"Script generated in {generation_time:.2f}s for: {request.topic[:30]}...")
        performance_metrics.record_request_time("/script/generate", generation_time)
        
        return {
            "script": script_content,
            "cached": False,
            "generation_time": generation_time
        }
    except Exception as e:
        logger.error(f"Script generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Script generation failed: {str(e)}")

@app.post("/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Convert text to speech using selected TTS model with caching and optimization"""
    try:
        # Clean text for better TTS pronunciation
        cleaned_text = clean_text_for_tts(request.text)
        
        # Check cache first (use cleaned text for cache key)
        cache_key = f"tts_{hash(cleaned_text)}_{request.model}_{request.speed}_{request.pitch}"
        cached_result = performance_cache.get_audio(cache_key)
        if cached_result:
            performance_metrics.record_cache_hit("audio")
            return {"success": True, "audio_file": cached_result, "cached": True}
        else:
            performance_metrics.record_cache_miss("audio")
        
        start_time = time.time()
        
        if request.model == "coqui" and tts_model:
            # Use Coqui TTS with async processing
            async with performance_optimizer.get_connection() as session:
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                    # Run TTS in thread pool for better async performance
                    loop = asyncio.get_event_loop()
                    await loop.run_in_executor(
                        None, 
                        lambda: tts_model.tts_to_file(
                            text=cleaned_text,  # Use cleaned text
                            file_path=temp_file.name,
                            speed=request.speed
                        )
                    )
                    
                    # Load and process audio asynchronously
                    audio_data, sample_rate = await loop.run_in_executor(
                        None, sf.read, temp_file.name
                    )
                    
                    # Apply pitch shift if requested
                    if request.pitch != 0.0:
                        board = Pedalboard([PitchShift(semitones=request.pitch)])
                        audio_data = await loop.run_in_executor(
                            None, lambda: board(audio_data, sample_rate)
                        )
                    
                    # Save final audio
                    output_path = await save_audio_file(audio_data, sample_rate)
                    
                    # Cache the result
                    performance_cache.set_audio(cache_key, output_path)
                    
                    # Clean up temp file
                    os.unlink(temp_file.name)
                    
                    synthesis_time = time.time() - start_time
                    logger.info(f"TTS synthesis completed in {synthesis_time:.2f}s")
                    performance_metrics.record_request_time("/tts/synthesize", synthesis_time)
                    
                    return {
                        "success": True,
                        "audio_file": output_path,
                        "duration": len(audio_data) / sample_rate,
                        "model_used": "coqui",
                        "synthesis_time": synthesis_time,
                        "cached": False
                    }
                
        elif request.model == "tortoise" and tortoise_tts:
            # Use Tortoise TTS with async optimization
            async with performance_optimizer.get_connection() as session:
                loop = asyncio.get_event_loop()
                audio_data = await loop.run_in_executor(
                    None,
                    lambda: tortoise_tts.tts_with_preset(
                        request.text,
                        voice_samples=None,  # Would need voice samples
                        preset="fast"
                    )
                )
                
                output_path = await save_audio_file(audio_data.cpu().numpy())
                
                # Cache the result
                performance_cache.set_audio(cache_key, output_path)
                
                synthesis_time = time.time() - start_time
                performance_metrics.record_request_time("/tts/synthesize", synthesis_time)
                
                return {
                    "success": True,
                    "audio_file": output_path,
                    "model_used": "tortoise",
                    "synthesis_time": synthesis_time,
                    "cached": False
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
        audio_data, sample_rate = librosa.load(temp_path, sr=None)
        
        # Apply processing
        if audio_params.remove_noise or audio_params.enhance_audio:
            audio_data = enhance_audio(audio_data, sample_rate)
        
        if audio_params.normalize:
            audio_data = librosa.util.normalize(audio_data)
        
        if audio_params.add_effects and audio_params.effects:
            # Apply custom effects based on parameters
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
    """Generate complete podcast episode (background task)"""
    try:
        task_id = str(uuid.uuid4())
        
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
            "message": "Podcast generation started",
            "estimated_time": "5-10 minutes"
        }
        
    except Exception as e:
        logger.error(f"Podcast generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of background task"""
    try:
        task_data = redis_client.get(f"task:{task_id}")
        if not task_data:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return json.loads(task_data)
        
    except Exception as e:
        logger.error(f"Task status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_podcast_generation(task_id: str, request: PodcastGenerationRequest):
    """Background task for complete podcast generation"""
    try:
        # Update progress: Script generation (20%)
        redis_client.setex(
            f"task:{task_id}",
            3600,
            json.dumps({
                "status": "generating_script",
                "progress": 20,
                "current_step": "Generating script..."
            })
        )
        
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

# File serving endpoint
@app.get("/outputs/{filename}")
async def serve_audio_file(filename: str):
    """Serve generated audio files"""
    try:
        file_path = os.path.join("outputs", filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            media_type="audio/wav",
            filename=filename
        )
    except Exception as e:
        logger.error(f"File serving failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch/process")
async def batch_process(requests: List[dict]):
    """Process multiple requests in batch for better performance"""
    try:
        results = []
        
        # Group requests by type for optimal processing
        script_requests = [r for r in requests if r.get('type') == 'script']
        tts_requests = [r for r in requests if r.get('type') == 'tts']
        
        # Process script requests concurrently
        if script_requests:
            script_tasks = []
            for req in script_requests:
                script_req = ScriptRequest(**req['data'])
                task = generate_script(script_req)
                script_tasks.append(task)
            
            script_results = await asyncio.gather(*script_tasks, return_exceptions=True)
            
            for i, result in enumerate(script_results):
                if isinstance(result, Exception):
                    results.append({"success": False, "error": str(result), "request_id": script_requests[i].get('id')})
                else:
                    results.append({"success": True, "data": result, "request_id": script_requests[i].get('id')})
        
        # Process TTS requests concurrently (with connection pooling)
        if tts_requests:
            tts_tasks = []
            for req in tts_requests:
                tts_req = TTSRequest(**req['data'])
                task = synthesize_speech(tts_req)
                tts_tasks.append(task)
            
            # Limit concurrent TTS requests to avoid overwhelming the system
            batch_size = 3
            tts_results = []
            
            for i in range(0, len(tts_tasks), batch_size):
                batch = tts_tasks[i:i + batch_size]
                batch_results = await asyncio.gather(*batch, return_exceptions=True)
                tts_results.extend(batch_results)
            
            for i, result in enumerate(tts_results):
                if isinstance(result, Exception):
                    results.append({"success": False, "error": str(result), "request_id": tts_requests[i].get('id')})
                else:
                    results.append({"success": True, "data": result, "request_id": tts_requests[i].get('id')})
        
        return {
            "success": True,
            "batch_size": len(requests),
            "results": results,
            "processing_time": time.time()
        }
        
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/music/generate")
async def generate_music_endpoint(request: MusicRequest):
    """Generate background music for podcasts"""
    try:
        if not music_generator:
            raise HTTPException(status_code=500, detail="Music generator not initialized")
        
        if request.style == "ambient":
            music_path = music_generator.generate_ambient_music(request.duration, request.volume)
        elif request.style == "upbeat":
            music_path = music_generator.generate_upbeat_music(request.duration, request.volume)
        elif request.style == "relaxing":
            music_path = music_generator.generate_relaxing_music(request.duration, request.volume)
        else:
            music_path = music_generator.generate_ambient_music(request.duration, request.volume)
        
        # Apply fades if requested
        if request.fade_in or request.fade_out:
            import soundfile as sf
            audio_data, sample_rate = sf.read(music_path)
            audio_data = music_generator.apply_fade(audio_data, request.fade_in, request.fade_out)
            sf.write(music_path, audio_data, sample_rate)
        
        return {
            "success": True,
            "music_file": music_path,
            "style": request.style,
            "duration": request.duration
        }
        
    except Exception as e:
        logger.error(f"Music generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts/multi-speaker")
async def synthesize_multi_speaker(request: MultiSpeakerTTSRequest):
    """Generate TTS with multiple speakers"""
    try:
        if not multi_speaker_processor:
            raise HTTPException(status_code=500, detail="Multi-speaker processor not initialized")
        
        # Process segments with different speakers
        audio_path = await multi_speaker_processor.synthesize_multi_speaker(
            request.segments, 
            output_dir
        )
        
        return {
            "success": True,
            "audio_file": audio_path,
            "num_speakers": len(set(seg["speaker"] for seg in request.segments)),
            "total_segments": len(request.segments)
        }
        
    except Exception as e:
        logger.error(f"Multi-speaker TTS failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/podcast/full-production")
async def create_full_podcast_production(request: PodcastProductionRequest):
    """Create a complete podcast with multiple speakers and music"""
    try:
        start_time = time.time()
        
        # Step 1: Generate script with multi-speaker awareness
        script_content = await async_groq_request(
            create_multi_speaker_prompt(request.script_params), 
            "llama-3.1-8b-instant"
        )
        
        # Step 2: Parse script for multiple speakers
        if not multi_speaker_processor:
            raise HTTPException(status_code=500, detail="Multi-speaker processor not initialized")
        
        speaker_segments = multi_speaker_processor.parse_script_for_speakers(
            script_content, 
            request.script_params.num_speakers
        )
        
        # Step 3: Generate multi-speaker audio
        voice_audio_path = await multi_speaker_processor.synthesize_multi_speaker(
            speaker_segments, 
            output_dir
        )
        
        # Step 4: Generate music tracks
        music_files = {}
        
        if request.intro_music:
            music_files["intro"] = music_generator.generate_upbeat_music(
                request.intro_music.duration, 
                request.intro_music.volume
            )
        
        if request.outro_music:
            music_files["outro"] = music_generator.generate_upbeat_music(
                request.outro_music.duration, 
                request.outro_music.volume
            )
        
        if request.background_music:
            music_files["background"] = music_generator.generate_ambient_music(
                request.background_music.duration, 
                request.background_music.volume
            )
        
        # Step 5: Create final production mix
        if request.final_mix and audio_mixer:
            final_audio_path = await audio_mixer.create_full_production(
                voice_audio_path,
                music_files.get("intro"),
                music_files.get("outro"),
                music_files.get("background")
            )
        else:
            final_audio_path = voice_audio_path
        
        # Step 6: Enhance audio quality
        if audio_mixer:
            final_audio_path = audio_mixer.enhance_audio_quality(final_audio_path)
        
        production_time = time.time() - start_time
        
        return {
            "success": True,
            "script": script_content,
            "audio_file": final_audio_path,
            "production_details": {
                "num_speakers": request.script_params.num_speakers,
                "segments_generated": len(speaker_segments),
                "music_tracks": list(music_files.keys()),
                "final_mix": request.final_mix,
                "production_time": production_time
            },
            "music_files": music_files
        }
        
    except Exception as e:
        logger.error(f"Full production failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def create_multi_speaker_prompt(params: ScriptRequest) -> str:
    """Create prompt for multi-speaker podcast script"""
    return f"""
    Create a {params.duration_minutes}-minute podcast script about {params.topic} for {params.num_speakers} speakers.
    Style: {params.style}
    Tone: {params.tone}
    
    MULTI-SPEAKER GUIDELINES:
    - Write natural dialogue between {params.num_speakers} speakers
    - Speaker 1: Main host, introduces topics, asks questions
    - Speaker 2: Expert guest, provides insights, answers questions
    {f"- Speaker 3: Additional expert, brings different perspective" if params.num_speakers > 2 else ""}
    
    CONTENT STRUCTURE:
    - Start with Speaker 1 welcoming listeners and introducing the topic
    - Natural back-and-forth conversation between speakers
    - Each speaker should have distinct personality and knowledge
    - Include natural transitions and responses
    - End with both speakers providing final thoughts
    
    IMPORTANT RULES:
    ❌ NO speaker labels like "SPEAKER 1:" or "HOST:"
    ❌ NO stage directions or formatting
    ❌ NO timestamps or technical instructions
    
    ✅ Write each paragraph as one speaker's complete thought
    ✅ Alternate between speakers naturally
    ✅ Use conversational language with questions and responses
    ✅ Include natural pauses with paragraph breaks
    
    {"✅ Start with an engaging welcome from the main host" if params.include_intro else ""}
    {"✅ End with memorable closing remarks from both speakers" if params.include_outro else ""}
    
    Topic: {params.topic}
    Write {params.duration_minutes} minutes of natural conversation between {params.num_speakers} speakers:
    """

def clean_text_for_tts(text: str) -> str:
    """Clean text for better TTS pronunciation"""
    import re
    
    # Remove stage directions and action descriptions
    text = re.sub(r'\[.*?\]', '', text)
    text = re.sub(r'\(.*?\)', '', text)
    
    # Remove speaker labels
    text = re.sub(r'^[A-Z\s]+:', '', text, flags=re.MULTILINE)
    
    # Remove timestamps
    text = re.sub(r'\[?\d{1,2}:\d{2}\]?', '', text)
    
    # Remove emphasis markers
    text = re.sub(r'\*+([^*]+)\*+', r'\1', text)
    text = re.sub(r'_+([^_]+)_+', r'\1', text)
    
    # Clean quotation marks
    text = re.sub(r'"([^"]*)"', r'\1', text)
    
    # Replace abbreviations
    abbreviations = {
        'AI': 'artificial intelligence',
        'ML': 'machine learning',
        'API': 'A P I',
        'CEO': 'C E O',
        'vs': 'versus',
        'etc': 'et cetera'
    }
    
    for abbr, full in abbreviations.items():
        text = re.sub(f'\\b{re.escape(abbr)}\\b', full, text, flags=re.IGNORECASE)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n+', ' ', text)
    text = text.strip()
    
    return text
