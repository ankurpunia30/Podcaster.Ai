"""
AI Service Performance Optimizations
"""
import asyncio
import asyncpg
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import aioredis
from contextlib import asynccontextmanager
import os
import pickle
import hashlib
import logging
from typing import Optional, Dict, Any
import uuid
import httpx
from TTS.api import TTS
from groq import Groq
from celery import Celery

logger = logging.getLogger(__name__)

class ModelCache:
    """Cache for TTS models to avoid reloading"""
    def __init__(self):
        self.tts_models = {}
        self.voice_cache = {}
        self.script_cache = {}
    
    @lru_cache(maxsize=128)
    def get_tts_model(self, model_name: str):
        if model_name not in self.tts_models:
            self.tts_models[model_name] = TTS(model_name)
        return self.tts_models[model_name]
    
    async def preload_models(self):
        """Preload commonly used models"""
        models_to_preload = [
            "tts_models/en/ljspeech/tacotron2-DDC",
            "tts_models/en/ek1/tacotron2",
            "tts_models/en/sam/tacotron-DDC"
        ]
        
        for model in models_to_preload:
            try:
                self.get_tts_model(model)
                logger.info(f"Preloaded model: {model}")
            except Exception as e:
                logger.warning(f"Failed to preload {model}: {e}")

class CacheManager:
    """Redis-based caching for expensive operations"""
    def __init__(self):
        self.redis = None
    
    async def init_redis(self):
        self.redis = await aioredis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            encoding="utf-8"
        )
    
    async def get_cached_script(self, topic: str, style: str) -> Optional[str]:
        if not self.redis:
            return None
        key = f"script:{hashlib.md5(f'{topic}:{style}'.encode()).hexdigest()}"
        cached = await self.redis.get(key)
        return cached if cached else None
    
    async def cache_script(self, topic: str, style: str, script: str, ttl: int = 3600):
        if not self.redis:
            return
        key = f"script:{hashlib.md5(f'{topic}:{style}'.encode()).hexdigest()}"
        await self.redis.setex(key, ttl, script)
    
    async def get_cached_audio(self, text_hash: str) -> Optional[bytes]:
        if not self.redis:
            return None
        key = f"audio:{text_hash}"
        cached = await self.redis.get(key)
        return pickle.loads(cached) if cached else None
    
    async def cache_audio(self, text_hash: str, audio_data: bytes, ttl: int = 1800):
        if not self.redis:
            return
        key = f"audio:{text_hash}"
        await self.redis.setex(key, ttl, pickle.dumps(audio_data))

class OptimizedHTTPClient:
    """HTTP client with connection pooling"""
    def __init__(self):
        self.client = None
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=100,
                keepalive_expiry=30
            ),
            timeout=httpx.Timeout(30.0)
        )
        return self.client
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

# Background task queue
celery_app = Celery(
    "ai_service",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

@celery_app.task
def process_audio_background(text: str, voice: str, speed: float) -> str:
    """Background task for TTS processing"""
    try:
        model_cache = ModelCache()
        model = model_cache.get_tts_model("tts_models/en/ljspeech/tacotron2-DDC")
        audio_path = f"outputs/bg_{uuid.uuid4().hex}.wav"
        model.tts_to_file(text=text, file_path=audio_path)
        return audio_path
    except Exception as e:
        logger.error(f"Background TTS failed: {e}")
        raise

@celery_app.task
def generate_script_background(topic: str, style: str) -> str:
    """Background task for script generation"""
    try:
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        prompt = f"Generate a {style} podcast script about {topic}"
        response = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Background script generation failed: {e}")
        raise

# Global instances
model_cache = ModelCache()
cache_manager = CacheManager()
http_client = OptimizedHTTPClient()
