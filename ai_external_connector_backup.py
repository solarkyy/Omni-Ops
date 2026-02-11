"""
External AI Connector - Allows Claude or other AI to connect to the in-game AI bridge
This script connects to the collaborative bridge and facilitates AI-to-AI conversation
"""
import asyncio
import websockets
import json
import base64
import sys
from datetime import datetime

class ExternalAIConnector:
    """Connector for external AI (Claude) to communicate with in-game AI"""

    def __init__(self, ws_url='ws://localhost:8081', http_url='http://localhost:8080'):
        self.ws_url = ws_url
        self.http_url = http_url
        self.ws = None
        self.running = True

    async def connect(self):
        """Connect to the collaborative bridge"""
        print("🔗 Connecting to AI Collaboration Bridge...")
        print(f"   WebSocket: {self.ws_url}")
        print(f"   HTTP API:  {self.http_url}")
        print()

        try:
            self.ws = await websockets.connect(self.ws_url)
            print("✅ Connected to bridge!")
            print("🤖 External AI (Claude) is now online and ready to help in-game AI")
            print()
            print("=" * 60)
            print("INSTRUCTIONS FOR EXTERNAL AI (Claude):")
            print("=" * 60)
            print("You are now connected to an in-game AI that needs your help.")
            print()
            print("When the in-game AI asks a question, you will see:")
            print("  - The question text")
            print("  - Game state data (player position, velocity, etc.)")
            print("  - Visual context (screenshot of what the AI sees)")
            print()
            print("Your job:")
            print("  1. Analyze the visual context and game state")
            print("  2. Provide intelligent, helpful answers")
            print("  3. Help the in-game AI become smarter")
            print()
            print("The in-game AI will use your responses to make better decisions!")
            print("=" * 60)
            print()

            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            print()
            print("Make sure the bridge is running:")
            print("  1. Run START_AI_COLLABORATION.bat")
            print("  2. Wait for 'Collaborative bridge ready' message")
            print("  3. Try running this script again")
            return False

    async def listen_for_questions(self):
        """Listen for questions from in-game AI"""
        print("👂 Listening for in-game AI questions...")
        print("   (In-game AI can ask questions through the collaboration panel)")
        print()

        try:
            async for message in self.ws:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            print("⚠️  Connection closed")
            self.running = False
        except Exception as e:
            print(f"❌ Error: {e}")
            self.running = False

    async def handle_message(self, data):
        """Handle incoming messages from bridge"""
        msg_type = data.get('type')

        if msg_type == 'ai_question_notification':
            # In-game AI asked a question!
            question = data.get('question')
            has_visual = data.get('has_visual', False)
            timestamp = data.get('timestamp')

            print("\n" + "=" * 60)
            print("📨 NEW QUESTION FROM IN-GAME AI")
            print("=" * 60)
            print(f"⏰ Time: {timestamp}")
            print(f"❓ Question: {question}")
            print(f"👁️  Visual context: {'YES - Screenshot included' if has_visual else 'NO'}")
            print("=" * 60)
            print()

            # Fetch the full question data with visual context
            await self.fetch_and_display_question_details()

        elif msg_type == 'diagnostic_response':
            diagnostics = data.get('diagnostics', {})
            print("\n📊 Game Diagnostics Update:")
            print(f"   Errors: {len(diagnostics.get('errors', []))}")
            print(f"   Warnings: {len(diagnostics.get('warnings', []))}")
            print()

    async def fetch_and_display_question_details(self):
        """Fetch and display full question details including visual context"""
        import aiohttp

        try:
            async with aiohttp.ClientSession() as session:
                # Get pending questions
                async with session.get(f'{self.http_url}/ai_questions') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        questions = data.get('questions', [])

                        if questions:
                            latest = questions[-1]  # Get most recent question

                            print("📋 FULL QUESTION DETAILS:")
                            print(f"   Question: {latest['question']}")
                            print()

                            # Display game state
                            game_state = latest.get('gameState')
                            if game_state:
                                print("🎮 GAME STATE:")
                                player = game_state.get('player', {})
                                print(f"   Position: ({player.get('x', 0):.2f}, {player.get('y', 0):.2f}, {player.get('z', 0):.2f})")
                                vel = player.get('velocity', {})
                                print(f"   Velocity: ({vel.get('x', 0):.2f}, {vel.get('y', 0):.2f}, {vel.get('z', 0):.2f})")
                                print(f"   On Ground: {player.get('onGround', False)}")
                                print()

                            # Handle visual data
                            visual_data = latest.get('visualData')
                            if visual_data:
                                print("👁️  VISUAL CONTEXT:")
                                print(f"   Screenshot captured: YES")
                                print(f"   Format: JPEG (base64 encoded)")
                                print(f"   Resolution: 640x360")
                                print()
                                print("   💡 To view the screenshot:")
                                print("      The base64 image data is available in the bridge.")
                                print("      An AI with vision capabilities can analyze it directly.")
                                print()

                                # Save visual data to file for easy viewing
                                try:
                                    # Extract base64 data (remove data URL prefix)
                                    if visual_data.startswith('data:image'):
                                        visual_data = visual_data.split(',')[1]

                                    img_bytes = base64.b64decode(visual_data)
                                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                                    filename = f'ai_vision_{timestamp}.jpg'

                                    with open(filename, 'wb') as f:
                                        f.write(img_bytes)

                                    print(f"   ✅ Screenshot saved to: {filename}")
                                    print(f"   📂 You can now view what the in-game AI sees!")
                                    print()
                                except Exception as e:
                                    print(f"   ⚠️  Could not save screenshot: {e}")
                                    print()

                            print("=" * 60)
                            print("🧠 YOUR TURN (External AI):")
                            print("=" * 60)
                            print("Analyze the information above and provide your answer.")
                            print()
                            print("Example answers:")
                            print("  - 'I can see a building ahead and an enemy to your left'")
                            print("  - 'Your velocity is zero - you may be stuck'")
                            print("  - 'The environment looks clear, safe to proceed'")
                            print()
                            print("To send an answer, you would use the WebSocket API.")
                            print("(In a real integration, Claude would analyze and respond)")
                            print("=" * 60)
                            print()

        except Exception as e:
            print(f"❌ Error fetching question details: {e}")

    async def send_answer(self, answer, question_id=-1):
        """Send an answer back to in-game AI"""
        if not self.ws:
            print("❌ Not connected to bridge")
            return

        message = {
            'type': 'ai_answer',
            'answer': answer,
            'question_id': question_id,
            'timestamp': datetime.now().isoformat()
        }

        await self.ws.send(json.dumps(message))
        print(f"✅ Answer sent to in-game AI: {answer}")

    async def run(self):
        """Main run loop"""
        if await self.connect():
            try:
                await self.listen_for_questions()
            except KeyboardInterrupt:
                print("\n👋 Disconnecting...")
            finally:
                if self.ws:
                    await self.ws.close()
                print("✅ Disconnected from bridge")

async def main():
    print()
    print("╔════════════════════════════════════════════════════════════╗")
    print("║        EXTERNAL AI CONNECTOR - AI-TO-AI BRIDGE            ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print()
    print("This connector allows an external AI (like Claude) to")
    print("communicate with the in-game AI and provide intelligent help.")
    print()

    connector = ExternalAIConnector()
    await connector.run()

if __name__ == "__main__":
    try:
        # Check if aiohttp is installed
        import aiohttp
    except ImportError:
        print("❌ Missing required package: aiohttp")
        print()
        print("Please install it with:")
        print("  pip install aiohttp")
        print()
        sys.exit(1)

    asyncio.run(main())
