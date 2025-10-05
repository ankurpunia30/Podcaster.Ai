from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
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

# Background tasks
from celery import Celery
import redis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
ollama_base_url = "http://localhost:11434"

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
    """Initialize AI models on startup"""
    global tts_model, tortoise_tts
    
    try:
        # Initialize Coqui TTS
        logger.info("Initializing Coqui TTS...")
        tts_model = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC", progress_bar=False)
        
        # Initialize Tortoise TTS
        logger.info("Initializing Tortoise TTS...")
        tortoise_tts = TextToSpeech()
        
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
    """Generate podcast script using Ollama"""
    try:
        prompt = f"""
        Create a {request.duration_minutes}-minute podcast script about {request.topic}.
        Style: {request.style}
        Tone: {request.tone}
        
        Requirements:
        - Include timestamps for each section
        - Make it engaging and conversational
        - Add natural pauses and transitions
        - Include sound cues where appropriate
        {"- Include a compelling intro" if request.include_intro else ""}
        {"- Include a memorable outro" if request.include_outro else ""}
        
        Format the response as JSON with sections and timestamps.
        """
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ollama_base_url}/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                result = response.json()
                script_content = result.get("response", "")
                
                return {
                    "success": True,
                    "script": script_content,
                    "metadata": {
                        "topic": request.topic,
                        "duration": request.duration_minutes,
                        "style": request.style,
                        "generated_at": datetime.now().isoformat()
                    }
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to generate script")
                
    except Exception as e:
        logger.error(f"Script generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts/synthesize")
async def synthesize_speech(request: TTSRequest):
    """Convert text to speech using selected TTS model"""
    try:
        if request.model == "coqui" and tts_model:
            # Use Coqui TTS
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                tts_model.tts_to_file(
                    text=request.text,
                    file_path=temp_file.name,
                    speed=request.speed
                )
                
                # Load and process audio
                audio_data, sample_rate = sf.read(temp_file.name)
                
                # Apply pitch shift if requested
                if request.pitch != 0.0:
                    board = Pedalboard([PitchShift(semitones=request.pitch)])
                    audio_data = board(audio_data, sample_rate)
                
                # Save final audio
                output_path = await save_audio_file(audio_data, sample_rate)
                
                # Clean up temp file
                os.unlink(temp_file.name)
                
                return {
                    "success": True,
                    "audio_file": output_path,
                    "duration": len(audio_data) / sample_rate,
                    "model_used": "coqui"
                }
                
        elif request.model == "tortoise" and tortoise_tts:
            # Use Tortoise TTS (requires voice samples)
            # This is a simplified version - in production, you'd need proper voice setup
            audio_data = tortoise_tts.tts_with_preset(
                request.text,
                voice_samples=None,  # Would need voice samples
                preset="fast"
            )
            
            output_path = await save_audio_file(audio_data.cpu().numpy())
            
            return {
                "success": True,
                "audio_file": output_path,
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
