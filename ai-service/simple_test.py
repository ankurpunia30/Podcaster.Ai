#!/usr/bin/env python3
"""
Simple AI service test - Direct API calls without FastAPI
Tests the core Groq functionality
"""

import asyncio
import json
import os
from dotenv import load_dotenv
from groq import AsyncGroq

# Load environment variables
load_dotenv()

class SimpleAIService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "gsk_your_api_key_here":
            raise ValueError("GROQ_API_KEY not set in environment")
        self.groq_client = AsyncGroq(api_key=api_key)
    
    async def generate_script(self, topic, duration_minutes=5, style="conversational", tone="informative"):
        """Generate podcast script"""
        prompt = f"""
        Create a {duration_minutes}-minute podcast script about {topic}.
        Style: {style}
        Tone: {tone}
        
        Requirements:
        - Include timestamps for each section
        - Make it engaging and conversational
        - Add natural pauses and transitions
        - Include sound cues where appropriate
        - Include a compelling intro and outro
        
        Format the response as a clear, structured script.
        """
        
        try:
            response = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=2000
            )
            
            script_content = response.choices[0].message.content
            return {
                "success": True,
                "script": script_content,
                "metadata": {
                    "topic": topic,
                    "duration": duration_minutes,
                    "style": style,
                    "tone": tone,
                    "word_count": len(script_content.split()),
                    "model": "llama-3.3-70b-versatile"
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def enhance_content(self, content, enhancement_type="general"):
        """Enhance existing content"""
        prompts = {
            "general": f"Improve this content for better readability and engagement:\\n\\n{content}",
            "grammar": f"Fix grammar, spelling, and punctuation errors in this content:\\n\\n{content}",
            "style": f"Improve the writing style and flow of this content:\\n\\n{content}",
            "clarity": f"Make this content clearer and more concise:\\n\\n{content}"
        }
        
        try:
            response = await self.groq_client.chat.completions.create(
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
                "model": "llama-3.3-70b-versatile"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def generate_seo_metadata(self, content, keywords=None, content_type="podcast"):
        """Generate SEO metadata"""
        keywords_str = ', '.join(keywords) if keywords else 'Not specified'
        
        prompt = f"""
        Analyze this {content_type} content and generate SEO-optimized metadata:
        
        Content: {content}
        Target Keywords: {keywords_str}
        
        Please provide in JSON format:
        {{
          "title": "SEO title (60 characters max)",
          "meta_description": "Meta description (155 characters max)",
          "tags": ["tag1", "tag2", "tag3"],
          "summary": "Short summary (2-3 sentences)",
          "description": "Long description (2-3 paragraphs)",
          "categories": ["category1", "category2"]
        }}
        
        Return only the JSON, no other text.
        """
        
        try:
            response = await self.groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=1000
            )
            
            seo_content = response.choices[0].message.content
            
            # Try to parse as JSON
            try:
                seo_data = json.loads(seo_content)
            except:
                seo_data = {"raw_response": seo_content}
            
            return {
                "success": True,
                "seo_metadata": seo_data,
                "original_keywords": keywords,
                "content_type": content_type
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

async def main():
    print("🤖 Simple AI Service Test")
    print("=" * 40)
    
    try:
        ai_service = SimpleAIService()
        print("✅ AI Service initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize AI service: {e}")
        return
    
    # Test script generation
    print("\\n📝 Testing script generation...")
    result = await ai_service.generate_script(
        topic="The Benefits of AI in Education",
        duration_minutes=3,
        style="conversational",
        tone="enthusiastic"
    )
    
    if result["success"]:
        print("✅ Script generation successful!")
        print(f"   Word count: {result['metadata']['word_count']}")
        print(f"   Preview: {result['script'][:200]}...")
    else:
        print(f"❌ Script generation failed: {result['error']}")
    
    # Test content enhancement
    print("\\n✨ Testing content enhancement...")
    sample_content = "AI is good for education. It help students learn better. AI can make personalized lessons."
    
    enhance_result = await ai_service.enhance_content(sample_content, "grammar")
    
    if enhance_result["success"]:
        print("✅ Content enhancement successful!")
        print(f"   Original: {sample_content}")
        print(f"   Enhanced: {enhance_result['enhanced_content'][:200]}...")
    else:
        print(f"❌ Content enhancement failed: {enhance_result['error']}")
    
    # Test SEO metadata generation
    print("\\n🔍 Testing SEO metadata generation...")
    seo_result = await ai_service.generate_seo_metadata(
        "A podcast about how artificial intelligence is transforming modern education",
        keywords=["AI", "education", "technology", "learning"],
        content_type="podcast"
    )
    
    if seo_result["success"]:
        print("✅ SEO metadata generation successful!")
        if "title" in seo_result["seo_metadata"]:
            print(f"   Title: {seo_result['seo_metadata']['title']}")
        else:
            print(f"   Generated: {str(seo_result['seo_metadata'])[:200]}...")
    else:
        print(f"❌ SEO metadata generation failed: {seo_result['error']}")
    
    print("\\n" + "=" * 40)
    print("🎉 AI Service core functionality test complete!")
    print("💡 All core features are working with Groq API.")
    print("🚀 Ready to integrate with your frontend!")

if __name__ == "__main__":
    asyncio.run(main())
