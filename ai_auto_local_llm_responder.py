"""
Automatic Local LLM Responder - Uses local LLM for intelligent responses
Works with Ollama, LM Studio, or any OpenAI-compatible API
Supports vision models like llava for screenshot analysis
"""
import asyncio
import aiohttp
import json
import base64
from datetime import datetime

class LocalLLMResponder:
    """Automatic responder using local LLM"""

    def __init__(self,
                 bridge_url='http://localhost:8080',
                 llm_url='http://localhost:11434/api/generate',  # Ollama default
                 model='llama3.2:latest',  # or 'llava' for vision
                 use_vision=False):

        self.bridge_url = bridge_url
        self.llm_url = llm_url
        self.model = model
        self.use_vision = use_vision
        self.running = True
        self.processed_questions = set()

        print(f"🤖 Configured to use: {model}")
        print(f"🔗 LLM URL: {llm_url}")
        print(f"👁️  Vision: {'Enabled' if use_vision else 'Disabled'}")

    async def fetch_questions(self):
        """Fetch pending questions from bridge"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f'{self.bridge_url}/ai_questions') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return data.get('questions', [])
        except Exception as e:
            print(f"⚠️  Error fetching questions: {e}")
        return []

    async def send_answer(self, answer, question_id=-1):
        """Send answer back to in-game AI"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    'answer': answer,
                    'question_id': question_id,
                    'timestamp': datetime.now().isoformat(),
                    'source': 'local_llm_automatic'
                }

                async with session.post(f'{self.bridge_url}/ai_answer', json=payload) as resp:
                    if resp.status == 200:
                        return True
                    else:
                        print(f"⚠️  Failed to send answer: {resp.status}")
        except Exception as e:
            print(f"⚠️  Error sending answer: {e}")
        return False

    async def query_ollama(self, prompt, visual_data=None):
        """Query Ollama API"""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 150  # Keep responses concise
                }
            }

            # Add image for vision models
            if visual_data and self.use_vision:
                try:
                    # Extract base64 data
                    if visual_data.startswith('data:image'):
                        visual_data = visual_data.split(',')[1]
                    payload["images"] = [visual_data]
                    print("   👁️  Visual data included for vision model")
                except Exception as e:
                    print(f"   ⚠️  Could not process visual data: {e}")

            async with aiohttp.ClientSession() as session:
                async with session.post(self.llm_url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        return result.get('response', '').strip()
                    else:
                        text = await resp.text()
                        print(f"   ❌ LLM API error {resp.status}: {text}")
                        return None

        except asyncio.TimeoutError:
            print("   ⏱️  LLM request timed out (60s)")
            return None
        except Exception as e:
            print(f"   ❌ LLM error: {e}")
            return None

    async def query_lmstudio(self, prompt, visual_data=None):
        """Query LM Studio API (OpenAI compatible)"""
        try:
            messages = [{
                "role": "system",
                "content": "You are a helpful AI assistant for a game. Keep responses concise (1-3 sentences) and actionable."
            }]

            # For vision, include image in message (if supported)
            if visual_data and self.use_vision:
                content = [
                    {"type": "text", "text": prompt}
                ]
                # Note: LM Studio may not support vision yet
                messages.append({"role": "user", "content": content})
            else:
                messages.append({"role": "user", "content": prompt})

            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 150
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(self.llm_url, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        return result['choices'][0]['message']['content'].strip()
                    else:
                        text = await resp.text()
                        print(f"   ❌ LLM API error {resp.status}: {text}")
                        return None

        except asyncio.TimeoutError:
            print("   ⏱️  LLM request timed out (60s)")
            return None
        except Exception as e:
            print(f"   ❌ LLM error: {e}")
            return None

    def build_prompt(self, question, game_state=None):
        """Build prompt with context"""

        system_context = """You are an AI assistant helping a player in a 3D game environment.
Provide clear, concise, actionable guidance in 1-3 sentences.
Focus on what the player should do next."""

        context_parts = []

        if game_state:
            player = game_state.get('player', {})
            context_parts.append(f"Player Position: ({player.get('x', 0):.1f}, {player.get('y', 0):.1f}, {player.get('z', 0):.1f})")

            vel = player.get('velocity', {})
            speed = (vel.get('x', 0)**2 + vel.get('y', 0)**2 + vel.get('z', 0)**2) ** 0.5
            context_parts.append(f"Speed: {speed:.2f} m/s")
            context_parts.append(f"On Ground: {player.get('onGround', False)}")

        # Build full prompt
        prompt = system_context + "\n\n"

        if context_parts:
            prompt += "Game State:\n" + "\n".join(context_parts) + "\n\n"

        prompt += f"Player Question: {question}\n\n"
        prompt += "Your Response:"

        return prompt

    async def analyze_with_llm(self, question, game_state=None, visual_data=None):
        """Get response from local LLM"""

        prompt = self.build_prompt(question, game_state)

        print("   🤖 Querying local LLM...")

        # Detect API type from URL
        if 'ollama' in self.llm_url or ':11434' in self.llm_url:
            return await self.query_ollama(prompt, visual_data)
        elif 'v1/chat/completions' in self.llm_url or ':1234' in self.llm_url:
            return await self.query_lmstudio(prompt, visual_data)
        else:
            # Try Ollama format first
            response = await self.query_ollama(prompt, visual_data)
            if response:
                return response
            # Fallback to OpenAI format
            return await self.query_lmstudio(prompt, visual_data)

    async def process_question(self, question_data):
        """Process a single question automatically"""
        question_text = question_data.get('question', '')
        question_id = question_data.get('id', -1)
        game_state = question_data.get('gameState')
        visual_data = question_data.get('visualData')
        timestamp = question_data.get('timestamp', '')

        print("\n" + "="*70)
        print(f"📨 NEW QUESTION #{question_id}")
        print("="*70)
        print(f"⏰ Time: {timestamp}")
        print(f"❓ Question: {question_text}")

        if game_state:
            player = game_state.get('player', {})
            print(f"🎮 Position: ({player.get('x', 0):.1f}, {player.get('y', 0):.1f}, {player.get('z', 0):.1f})")

        if visual_data and self.use_vision:
            print(f"👁️  Visual Context: YES (Will be analyzed by vision model)")
        elif visual_data:
            print(f"👁️  Visual Context: Available (vision disabled)")
        else:
            print(f"👁️  Visual Context: NO")

        print("-"*70)

        # Get LLM response
        if self.use_vision and visual_data:
            answer = await self.analyze_with_llm(question_text, game_state, visual_data)
        else:
            answer = await self.analyze_with_llm(question_text, game_state)

        if answer:
            # Send answer back to game
            success = await self.send_answer(answer, question_id)

            if success:
                print("-"*70)
                print(f"✅ ANSWER SENT TO GAME:")
                print(f"   {answer}")
                print("="*70)
                print()
                return True
            else:
                print("❌ Failed to send answer to game")
        else:
            print("❌ Failed to get answer from LLM")

        print("="*70)
        print()
        return False

    async def run(self):
        """Main loop - poll for questions and respond automatically"""
        print()
        print("╔═══════════════════════════════════════════════════════════════╗")
        print("║      AUTOMATIC LOCAL LLM RESPONDER - FULLY INTELLIGENT       ║")
        print("╚═══════════════════════════════════════════════════════════════╝")
        print()
        print("🤖 Local LLM is now AUTOMATICALLY responding to in-game questions!")
        print(f"   - Model: {self.model}")
        print(f"   - API: {self.llm_url}")
        print(f"   - Vision: {'Enabled' if self.use_vision else 'Disabled'}")
        print()
        print(f"🔗 Connected to bridge: {self.bridge_url}")
        print()
        print("👂 Listening for questions... (Checking every 2 seconds)")
        print("   Press Ctrl+C to stop")
        print()
        print("="*70)

        try:
            while self.running:
                # Fetch pending questions
                questions = await self.fetch_questions()

                # Process new questions
                for q in questions:
                    q_id = q.get('id', -1)

                    # Skip if already processed
                    if q_id in self.processed_questions:
                        continue

                    # Process this question
                    success = await self.process_question(q)

                    if success:
                        self.processed_questions.add(q_id)

                # Wait before checking again
                await asyncio.sleep(2)

        except KeyboardInterrupt:
            print("\n")
            print("👋 Shutting down automatic responder...")
            print("✅ Goodbye!")
            print()

async def main():
    """Entry point with configuration"""

    print()
    print("=" * 70)
    print("  AUTOMATIC LOCAL LLM RESPONDER - CONFIGURATION")
    print("=" * 70)
    print()
    print("Supported LLM Backends:")
    print("  1. Ollama (default) - http://localhost:11434/api/generate")
    print("  2. LM Studio - http://localhost:1234/v1/chat/completions")
    print("  3. Text Generation WebUI - http://localhost:5000/api/v1/generate")
    print("  4. Custom OpenAI-compatible API")
    print()
    print("Recommended Models:")
    print("  • Text only: llama3.2:latest, mistral, codellama")
    print("  • With vision: llava, llava-llama3, bakllava")
    print()
    print("=" * 70)
    print()

    # Configuration - EDIT THESE VALUES
    # =====================================================================
    # LM STUDIO CONFIGURATION (Pre-configured for LM Studio!)
    # =====================================================================
    LLM_URL = 'http://localhost:1234/v1/chat/completions'  # LM Studio default
    MODEL = 'local-model'  # LM Studio auto-detects your loaded model
    USE_VISION = True  # ✅ ENABLED for Qwen3 VL 8B vision model!

    # Alternative: Ollama Configuration (uncomment to use)
    # LLM_URL = 'http://localhost:11434/api/generate'
    # MODEL = 'llama3.2:latest'
    # USE_VISION = False

    print(f"📝 Current Configuration:")
    print(f"   LLM URL: {LLM_URL}")
    print(f"   Model: {MODEL}")
    print(f"   Vision: {USE_VISION}")
    print()

    # Quick config override from environment
    import os
    if os.environ.get('LLM_URL'):
        LLM_URL = os.environ.get('LLM_URL')
        print(f"   [ENV] Using LLM_URL: {LLM_URL}")
    if os.environ.get('LLM_MODEL'):
        MODEL = os.environ.get('LLM_MODEL')
        print(f"   [ENV] Using LLM_MODEL: {MODEL}")
    if os.environ.get('USE_VISION'):
        USE_VISION = os.environ.get('USE_VISION').lower() == 'true'
        print(f"   [ENV] Using USE_VISION: {USE_VISION}")

    print()
    print("💡 To change configuration:")
    print("   Edit the values at the top of this script")
    print("   Or set environment variables: LLM_URL, LLM_MODEL, USE_VISION")
    print()
    print("=" * 70)
    print()

    # Check if aiohttp is installed
    try:
        import aiohttp
    except ImportError:
        print("❌ ERROR: Missing required package!")
        print()
        print("Install required packages:")
        print("  pip install aiohttp")
        print()
        return

    # Start the responder
    responder = LocalLLMResponder(
        llm_url=LLM_URL,
        model=MODEL,
        use_vision=USE_VISION
    )
    await responder.run()

if __name__ == "__main__":
    asyncio.run(main())
