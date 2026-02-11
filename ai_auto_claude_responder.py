"""
Automatic Claude AI Responder - Uses Anthropic API for intelligent responses
This script automatically responds to in-game AI questions using Claude's vision and reasoning
"""
import asyncio
import aiohttp
import json
import base64
import os
import sys
from datetime import datetime
from anthropic import Anthropic

class AutoClaudeResponder:
    """Automatic responder using Claude API"""

    def __init__(self, bridge_url='http://localhost:8080', api_key=None):
        self.bridge_url = bridge_url
        self.running = True
        self.processed_questions = set()

        # Initialize Anthropic client
        self.api_key = api_key or os.environ.get('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("❌ No API key found! Set ANTHROPIC_API_KEY environment variable or pass api_key parameter")

        self.client = Anthropic(api_key=self.api_key)

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
                    'source': 'claude_automatic'
                }

                async with session.post(f'{self.bridge_url}/ai_answer', json=payload) as resp:
                    if resp.status == 200:
                        return True
                    else:
                        print(f"⚠️  Failed to send answer: {resp.status}")
        except Exception as e:
            print(f"⚠️  Error sending answer: {e}")
        return False

    def analyze_with_claude(self, question, game_state=None, visual_data=None):
        """Use Claude to analyze question and provide intelligent answer"""

        # Build system prompt with game context
        system_prompt = """You are an intelligent AI assistant helping an in-game AI agent in a 3D game environment.
Your role is to:
1. Analyze visual context (screenshots) when provided
2. Consider game state data (player position, velocity, etc.)
3. Provide clear, actionable guidance
4. Help the in-game AI make smart decisions

Keep responses concise (1-3 sentences) and focused on what the AI can do next."""

        # Build message content
        messages_content = []

        # Add visual context if available (Claude has vision!)
        if visual_data:
            try:
                # Extract base64 data (remove data URL prefix if present)
                if visual_data.startswith('data:image'):
                    visual_data = visual_data.split(',')[1]

                messages_content.append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": visual_data
                    }
                })
                print("   👁️  Visual data included in Claude analysis")
            except Exception as e:
                print(f"   ⚠️  Could not process visual data: {e}")

        # Build context text
        context_parts = []

        if game_state:
            player = game_state.get('player', {})
            context_parts.append(f"Player Position: ({player.get('x', 0):.1f}, {player.get('y', 0):.1f}, {player.get('z', 0):.1f})")

            vel = player.get('velocity', {})
            speed = (vel.get('x', 0)**2 + vel.get('y', 0)**2 + vel.get('z', 0)**2) ** 0.5
            context_parts.append(f"Speed: {speed:.2f} m/s")
            context_parts.append(f"On Ground: {player.get('onGround', False)}")

        # Combine question with context
        full_question = question
        if context_parts:
            full_question += "\n\nGame State:\n" + "\n".join(context_parts)

        messages_content.append({
            "type": "text",
            "text": full_question
        })

        # Call Claude API
        try:
            print("   🤖 Calling Claude API...")

            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",  # Latest Claude model with vision
                max_tokens=300,
                system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": messages_content
                }]
            )

            # Extract answer
            answer = response.content[0].text
            print(f"   ✅ Claude responded: {answer[:100]}...")
            return answer

        except Exception as e:
            print(f"   ❌ Claude API error: {e}")
            return None

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

        if visual_data:
            print(f"👁️  Visual Context: YES (Screenshot included)")
        else:
            print(f"👁️  Visual Context: NO")

        print("-"*70)

        # Get Claude's intelligent response
        answer = self.analyze_with_claude(question_text, game_state, visual_data)

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
            print("❌ Failed to get answer from Claude")

        print("="*70)
        print()
        return False

    async def run(self):
        """Main loop - poll for questions and respond automatically"""
        print()
        print("╔═══════════════════════════════════════════════════════════════╗")
        print("║     AUTOMATIC CLAUDE AI RESPONDER - FULLY INTELLIGENT        ║")
        print("╚═══════════════════════════════════════════════════════════════╝")
        print()
        print("🤖 Claude AI is now AUTOMATICALLY responding to in-game questions!")
        print("   - Uses Claude's vision to analyze screenshots")
        print("   - Analyzes game state for context")
        print("   - Provides intelligent, actionable answers")
        print()
        print(f"🔗 Connected to bridge: {self.bridge_url}")
        print(f"✅ API Key configured: {self.api_key[:8]}...{self.api_key[-4:]}")
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
    """Entry point"""

    # Check for API key
    api_key = os.environ.get('ANTHROPIC_API_KEY')

    if not api_key:
        print()
        print("=" * 70)
        print("❌ ERROR: No Anthropic API Key Found!")
        print("=" * 70)
        print()
        print("You need to set your Claude API key as an environment variable.")
        print()
        print("WINDOWS:")
        print('  set ANTHROPIC_API_KEY=sk-ant-your-key-here')
        print('  python ai_auto_claude_responder.py')
        print()
        print("Or add it permanently:")
        print('  setx ANTHROPIC_API_KEY "sk-ant-your-key-here"')
        print('  (then restart terminal)')
        print()
        print("LINUX/MAC:")
        print('  export ANTHROPIC_API_KEY=sk-ant-your-key-here')
        print('  python ai_auto_claude_responder.py')
        print()
        print("Or add to ~/.bashrc or ~/.zshrc:")
        print('  export ANTHROPIC_API_KEY="sk-ant-your-key-here"')
        print()
        print("🔑 Get your API key at: https://console.anthropic.com/")
        print()
        print("=" * 70)
        print()
        return

    # Check for required packages
    try:
        import anthropic
    except ImportError:
        print()
        print("=" * 70)
        print("❌ ERROR: Missing required package!")
        print("=" * 70)
        print()
        print("Install the Anthropic SDK:")
        print("  pip install anthropic")
        print()
        print("Or install all requirements:")
        print("  pip install anthropic aiohttp")
        print()
        print("=" * 70)
        print()
        return

    # Start the responder
    responder = AutoClaudeResponder()
    await responder.run()

if __name__ == "__main__":
    asyncio.run(main())
