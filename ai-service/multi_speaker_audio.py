#!/usr/bin/env python3
"""
Multi-Speaker and Music Support for AI Service
Adds support for multiple speakers and intro/outro music
"""

import numpy as np
import soundfile as sf
import librosa
import os
import time
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class MusicGenerator:
    """Generate background music for podcasts"""
    
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        self.sample_rate = 22050
        
    def generate_ambient_music(self, duration: float, volume: float = 0.3) -> str:
        """Generate ambient background music"""
        duration_samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, duration_samples)
        
        # Layer multiple sine waves for ambient texture
        freq1, freq2, freq3 = 220, 330, 440  # A3, E4, A4
        wave1 = 0.3 * np.sin(2 * np.pi * freq1 * t)
        wave2 = 0.2 * np.sin(2 * np.pi * freq2 * t)
        wave3 = 0.1 * np.sin(2 * np.pi * freq3 * t)
        
        # Add gentle modulation
        modulation = 0.1 * np.sin(2 * np.pi * 0.5 * t)
        ambient_music = (wave1 + wave2 + wave3) * (1 + modulation) * volume
        
        return self._save_audio(ambient_music, "ambient")
    
    def generate_upbeat_music(self, duration: float, volume: float = 0.4) -> str:
        """Generate upbeat intro/outro music"""
        duration_samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, duration_samples)
        
        # Create rhythmic pattern
        beat_freq = 2.0  # 2 beats per second
        beat_pattern = np.sin(2 * np.pi * beat_freq * t)
        
        # Melody and harmony
        melody = 0.4 * np.sin(2 * np.pi * 523 * t)  # C5
        harmony = 0.2 * np.sin(2 * np.pi * 659 * t)  # E5
        
        upbeat_music = (melody + harmony) * (0.5 + 0.5 * np.abs(beat_pattern)) * volume
        
        return self._save_audio(upbeat_music, "upbeat")
    
    def generate_relaxing_music(self, duration: float, volume: float = 0.25) -> str:
        """Generate soft, relaxing music"""
        duration_samples = int(duration * self.sample_rate)
        t = np.linspace(0, duration, duration_samples)
        
        # Soft pentatonic scale notes
        freqs = [261.63, 293.66, 329.63, 392.00, 440.00]  # C, D, E, G, A
        relaxing_music = np.zeros_like(t)
        
        for i, freq in enumerate(freqs):
            phase_offset = i * 0.2
            wave = 0.15 * np.sin(2 * np.pi * freq * t + phase_offset)
            relaxing_music += wave
        
        relaxing_music *= volume
        
        return self._save_audio(relaxing_music, "relaxing")
    
    def apply_fade(self, audio: np.ndarray, fade_in: bool = True, fade_out: bool = True) -> np.ndarray:
        """Apply fade in/out to audio"""
        if fade_in:
            fade_samples = int(0.5 * self.sample_rate)  # 0.5 second fade
            fade_in_curve = np.linspace(0, 1, fade_samples)
            audio[:fade_samples] *= fade_in_curve
        
        if fade_out:
            fade_samples = int(0.5 * self.sample_rate)
            fade_out_curve = np.linspace(1, 0, fade_samples)
            audio[-fade_samples:] *= fade_out_curve
        
        return audio
    
    def _save_audio(self, audio: np.ndarray, style: str) -> str:
        """Save audio to file and return path"""
        filename = f"music_{style}_{int(time.time())}.wav"
        filepath = os.path.join(self.output_dir, filename)
        sf.write(filepath, audio, self.sample_rate)
        logger.info(f"Generated {style} music: {filepath}")
        return filepath

class MultiSpeakerProcessor:
    """Handle multiple speakers and voice variety"""
    
    def __init__(self, tts_model):
        self.tts_model = tts_model
        self.speaker_voices = {
            "speaker1": {"gender": "female", "speed": 1.0, "pitch": 0.0},
            "speaker2": {"gender": "male", "speed": 0.95, "pitch": -2.0},
            "speaker3": {"gender": "female", "speed": 1.05, "pitch": 1.0},
            "narrator": {"gender": "neutral", "speed": 0.9, "pitch": 0.0}
        }
    
    def parse_script_for_speakers(self, script: str, num_speakers: int = 2) -> List[Dict[str, Any]]:
        """Parse script into segments for multiple speakers"""
        paragraphs = [p.strip() for p in script.split('\n\n') if p.strip()]
        segments = []
        current_speaker = 1
        
        for i, paragraph in enumerate(paragraphs):
            # Assign speakers based on content and alternation
            if 'question' in paragraph.lower() or '?' in paragraph:
                speaker_id = 2  # Questions to speaker 2
            elif 'welcome' in paragraph.lower() and i == 0:
                speaker_id = 1  # Host introduction
            else:
                # Alternate between speakers
                current_speaker = (current_speaker % num_speakers) + 1
                speaker_id = current_speaker
            
            speaker_key = f"speaker{speaker_id}"
            voice_config = self.speaker_voices.get(speaker_key, self.speaker_voices["speaker1"])
            
            segments.append({
                "speaker": speaker_id,
                "text": paragraph,
                "voice_config": voice_config,
                "pause_after": 0.8  # Pause between speakers
            })
        
        logger.info(f"Parsed script into {len(segments)} segments for {num_speakers} speakers")
        return segments
    
    async def synthesize_multi_speaker(self, segments: List[Dict[str, Any]], output_dir: str) -> str:
        """Synthesize audio for multiple speakers and combine"""
        audio_files = []
        
        for i, segment in enumerate(segments):
            # Generate TTS for this segment
            temp_file = os.path.join(output_dir, f"segment_{i}_{int(time.time())}.wav")
            
            try:
                # Apply voice configuration
                voice_config = segment["voice_config"]
                
                # Generate speech with specific voice settings
                self.tts_model.tts_to_file(
                    text=segment["text"],
                    file_path=temp_file,
                    speed=voice_config["speed"]
                )
                
                # Load and process audio
                audio_data, sample_rate = sf.read(temp_file)
                
                # Apply pitch modification if needed
                if voice_config["pitch"] != 0.0:
                    # Simple pitch shift (you might want to use more sophisticated methods)
                    audio_data = librosa.effects.pitch_shift(
                        audio_data, sr=sample_rate, n_steps=voice_config["pitch"]
                    )
                
                # Add pause after speaker
                pause_duration = segment["pause_after"]
                pause_samples = int(pause_duration * sample_rate)
                pause_audio = np.zeros(pause_samples)
                
                # Combine speech and pause
                combined_audio = np.concatenate([audio_data, pause_audio])
                
                # Save processed segment
                processed_file = os.path.join(output_dir, f"processed_segment_{i}.wav")
                sf.write(processed_file, combined_audio, sample_rate)
                
                audio_files.append(processed_file)
                
                # Clean up temp file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                    
            except Exception as e:
                logger.error(f"Failed to process segment {i}: {e}")
                continue
        
        # Combine all segments
        return await self._combine_audio_files(audio_files, output_dir)
    
    async def _combine_audio_files(self, audio_files: List[str], output_dir: str) -> str:
        """Combine multiple audio files into one"""
        if not audio_files:
            raise ValueError("No audio files to combine")
        
        combined_audio = []
        target_sample_rate = None
        
        for file_path in audio_files:
            audio_data, sample_rate = sf.read(file_path)
            
            if target_sample_rate is None:
                target_sample_rate = sample_rate
            elif sample_rate != target_sample_rate:
                # Resample if needed
                audio_data = librosa.resample(audio_data, orig_sr=sample_rate, target_sr=target_sample_rate)
            
            combined_audio.append(audio_data)
            
            # Clean up individual files
            os.remove(file_path)
        
        # Concatenate all audio
        final_audio = np.concatenate(combined_audio)
        
        # Save combined audio
        output_file = os.path.join(output_dir, f"multi_speaker_audio_{int(time.time())}.wav")
        sf.write(output_file, final_audio, target_sample_rate)
        
        logger.info(f"Combined {len(audio_files)} audio segments into {output_file}")
        return output_file

class AudioMixer:
    """Mix voice, music, and create final production"""
    
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
    
    async def create_full_production(self, voice_file: str, intro_music: str = None, 
                                   outro_music: str = None, background_music: str = None) -> str:
        """Create full podcast production with intro, voice, and outro"""
        try:
            # Load voice audio
            voice_audio, voice_sr = sf.read(voice_file)
            final_audio = voice_audio
            target_sr = voice_sr
            
            # Add intro music
            if intro_music and os.path.exists(intro_music):
                intro_audio, intro_sr = sf.read(intro_music)
                if intro_sr != target_sr:
                    intro_audio = librosa.resample(intro_audio, orig_sr=intro_sr, target_sr=target_sr)
                
                # Crossfade intro with voice
                crossfade_samples = int(1.0 * target_sr)  # 1 second crossfade
                
                if len(intro_audio) > crossfade_samples:
                    # Fade out intro over voice beginning
                    fade_out = np.linspace(1, 0.2, crossfade_samples)
                    fade_in = np.linspace(0.2, 1, crossfade_samples)
                    
                    intro_audio[-crossfade_samples:] *= fade_out
                    voice_audio[:crossfade_samples] *= fade_in
                    voice_audio[:crossfade_samples] += intro_audio[-crossfade_samples:] * 0.3
                
                final_audio = np.concatenate([intro_audio[:-crossfade_samples], voice_audio])
            
            # Add background music
            if background_music and os.path.exists(background_music):
                bg_audio, bg_sr = sf.read(background_music)
                if bg_sr != target_sr:
                    bg_audio = librosa.resample(bg_audio, orig_sr=bg_sr, target_sr=target_sr)
                
                # Loop background music to match voice length
                voice_length = len(final_audio)
                bg_length = len(bg_audio)
                
                if bg_length < voice_length:
                    loops_needed = int(np.ceil(voice_length / bg_length))
                    bg_audio = np.tile(bg_audio, loops_needed)[:voice_length]
                else:
                    bg_audio = bg_audio[:voice_length]
                
                # Mix background at low volume
                final_audio = final_audio + (bg_audio * 0.15)
            
            # Add outro music
            if outro_music and os.path.exists(outro_music):
                outro_audio, outro_sr = sf.read(outro_music)
                if outro_sr != target_sr:
                    outro_audio = librosa.resample(outro_audio, orig_sr=outro_sr, target_sr=target_sr)
                
                # Crossfade voice with outro
                crossfade_samples = int(1.0 * target_sr)
                
                if len(outro_audio) > crossfade_samples and len(final_audio) > crossfade_samples:
                    fade_out = np.linspace(1, 0.2, crossfade_samples)
                    fade_in = np.linspace(0.2, 1, crossfade_samples)
                    
                    final_audio[-crossfade_samples:] *= fade_out
                    outro_audio[:crossfade_samples] *= fade_in
                    outro_audio[:crossfade_samples] += final_audio[-crossfade_samples:] * 0.3
                
                final_audio = np.concatenate([final_audio[:-crossfade_samples], outro_audio])
            
            # Normalize final audio
            max_amplitude = np.max(np.abs(final_audio))
            if max_amplitude > 1.0:
                final_audio = final_audio / max_amplitude * 0.95
            
            # Save final production
            final_file = os.path.join(self.output_dir, f"full_production_{int(time.time())}.wav")
            sf.write(final_file, final_audio, target_sr)
            
            logger.info(f"Created full production: {final_file}")
            return final_file
            
        except Exception as e:
            logger.error(f"Audio mixing failed: {e}")
            raise Exception(f"Audio mixing failed: {str(e)}")
    
    def enhance_audio_quality(self, audio_file: str) -> str:
        """Apply audio enhancement (normalize, noise reduction, etc.)"""
        try:
            audio_data, sample_rate = sf.read(audio_file)
            
            # Normalize audio
            max_amplitude = np.max(np.abs(audio_data))
            if max_amplitude > 0:
                audio_data = audio_data / max_amplitude * 0.95
            
            # Simple noise gate (remove very quiet parts)
            noise_threshold = 0.01
            audio_data[np.abs(audio_data) < noise_threshold] *= 0.1
            
            # Save enhanced audio
            enhanced_file = os.path.join(self.output_dir, f"enhanced_{int(time.time())}.wav")
            sf.write(enhanced_file, audio_data, sample_rate)
            
            return enhanced_file
            
        except Exception as e:
            logger.error(f"Audio enhancement failed: {e}")
            return audio_file  # Return original if enhancement fails
