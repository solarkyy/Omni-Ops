"""
AI Manual Responder - Interactive Terminal Interface
Allows you to manually respond to in-game AI questions in real-time
"""
import asyncio
import websockets
import json
import base64
import sys
import os
from datetime import datetime
import threading
import aioconsole

class AIManualResponder:
    """Interactive manual responder for AI collaboration"""

    def __init__(self, ws_url='ws://localhost:8081', http_url='http://localhost:8080'):
        self.ws_url = ws_url
        self.http_url = http_url
        self.ws = None
        self.running = True
        self.pending_questions = []
        self.question_counter = 0

    async def connect(self):
        """Connect to the collaborative bridge"""
        print("\n" + "=" * 70)
        print("🤖 AI MANUAL RESPONDER - Interactive Response System")
        print("=" * 70)
        print()
        print("🔗 Connecting to AI Collaboration Bridge...")
        print(f"   WebSocket: {self.ws_url}")
        print(f"   HTTP API:  {self.http_url}")
        print()

        try:
            self.ws = await websockets.connect(self.ws_url)
            print("✅ Connected to bridge!")
            print()
            print("=" * 70)
            print("📋 INSTRUCTIONS:")
            print("=" * 70)
            print()
            print("1. Questions from the in-game AI will appear below")
            print("2. Type your answer and press ENTER to respond")
            print("3. Type 'help' for command list")
            print("4. Type 'quit' to exit")
            print()
            print("The in-game AI will receive your responses in real-time!")
            print("=" * 70)
            print()
            print("👂 Listening for questions...")
            print()

            return True
        except Exception as e:
            print(f"❌ Failed to connect: {e}")
            print()
            print("📌 Make sure the bridge is running:")
            print("   python ai_collaborative_bridge.py")
            return False

    async def listen_for_messages(self):
        """Listen for messages from bridge"""
        try:
            async for message in self.ws:
                data = json.loads(message)
                await self.handle_message(data)
        except websockets.exceptions.ConnectionClosed:
            print("\n⚠️  Connection closed")
            self.running = False
        except Exception as e:
            print(f"\n❌ Error: {e}")
            self.running = False

    async def handle_message(self, data):
        """Handle incoming messages"""
        msg_type = data.get('type')

        if msg_type == 'ai_question_notification' or msg_type == 'ai_question':
            await self.handle_new_question(data)
        elif msg_type == 'welcome':
            print(f"📨 {data.get('message')}")
            print()

    async def handle_new_question(self, data):
        """Handle a new question from in-game AI"""
        self.question_counter += 1

        question = data.get('question', 'No question provided')
        has_visual = data.get('has_visual', False)
        game_state = data.get('gameState', {})
        timestamp = data.get('timestamp', datetime.now().isoformat())

        # Store the question
        question_data = {
            'id': self.question_counter,
            'question': question,
            'has_visual': has_visual,
            'game_state': game_state,
            'timestamp': timestamp,
            'answered': False
        }
        self.pending_questions.append(question_data)

        # Display the question prominently
        print("\n" + "╔" + "=" * 68 + "╗")
        print(f"║  📨 NEW QUESTION #{self.question_counter} FROM IN-GAME AI" + " " * 25 + "║")
        print("╚" + "=" * 68 + "╝")
        print()
        print(f"⏰ Time: {timestamp}")
        print()
        print(f"❓ Question:")
        print(f"   {question}")
        print()

        if has_visual:
            print("👁️  Visual Context: YES (Screenshot captured)")
            print("   The AI sent a screenshot of what it sees")
            print()

        # Display game state if available
        if game_state:
            player = game_state.get('playerPos', {})
            velocity = game_state.get('velocity', {})

            if player:
                print("🎮 Game State:")
                print(f"   Position: X:{player.get('x', 0):.1f}, Y:{player.get('y', 0):.1f}, Z:{player.get('z', 0):.1f}")

                if velocity:
                    speed = (velocity.get('x', 0)**2 + velocity.get('y', 0)**2 + velocity.get('z', 0)**2)**0.5
                    print(f"   Velocity: {speed:.2f} m/s")
                    if speed < 0.1:
                        print("   ⚠️  Player appears to be stationary")
                    if velocity.get('y', 0) < -5:
                        print("   ⚠️  Player is falling rapidly!")
                print()

        print("─" * 70)
        print("💬 Your response (or type 'skip' to skip, 'help' for commands):")
        print("─" * 70)

    async def send_answer(self, answer, question_id=None):
        """Send an answer back to in-game AI"""
        if not self.ws:
            print("❌ Not connected to bridge")
            return False

        message = {
            'type': 'ai_answer',
            'answer': answer,
            'question_id': question_id if question_id else -1,
            'timestamp': datetime.now().isoformat()
        }

        try:
            await self.ws.send(json.dumps(message))

            # Mark question as answered
            if question_id:
                for q in self.pending_questions:
                    if q['id'] == question_id:
                        q['answered'] = True

            print()
            print("✅ Answer sent successfully!")
            print(f"   📤 '{answer}'")
            print()
            print("👂 Waiting for next question...")
            print()
            return True
        except Exception as e:
            print(f"❌ Failed to send answer: {e}")
            return False

    async def handle_input(self):
        """Handle user input"""
        while self.running:
            try:
                user_input = await aioconsole.ainput()
                command = user_input.strip().lower()

                if command == 'quit' or command == 'exit':
                    print("\n👋 Exiting...")
                    self.running = False
                    break

                elif command == 'help':
                    self.show_help()

                elif command == 'skip':
                    print("⏭️  Skipped question")
                    print("👂 Waiting for next question...")
                    print()

                elif command == 'list' or command == 'questions':
                    self.list_pending_questions()

                elif command.startswith('answer '):
                    # Quick answer with question ID: answer 1 This is my response
                    parts = command.split(' ', 2)
                    if len(parts) >= 3:
                        try:
                            q_id = int(parts[1])
                            answer_text = parts[2]
                            await self.send_answer(answer_text, q_id)
                        except ValueError:
                            print("❌ Invalid question ID. Use: answer <id> <text>")
                    else:
                        print("❌ Usage: answer <id> <text>")

                elif command == '':
                    # Empty input, do nothing
                    pass

                else:
                    # Treat as answer to most recent question
                    if self.pending_questions:
                        latest_q = None
                        for q in reversed(self.pending_questions):
                            if not q['answered']:
                                latest_q = q
                                break

                        if latest_q:
                            await self.send_answer(user_input, latest_q['id'])
                        else:
                            print("❌ No pending questions to answer")
                    else:
                        print("❌ No questions received yet")

            except EOFError:
                break
            except Exception as e:
                print(f"❌ Input error: {e}")

    def show_help(self):
        """Show help menu"""
        print()
        print("=" * 70)
        print("📖 COMMAND HELP")
        print("=" * 70)
        print()
        print("Simply type your answer and press ENTER to respond to latest question")
        print()
        print("Commands:")
        print("  help              - Show this help menu")
        print("  list, questions   - List all pending questions")
        print("  answer <id> <text> - Answer a specific question by ID")
        print("  skip              - Skip the current question")
        print("  quit, exit        - Exit the program")
        print()
        print("Examples:")
        print("  > I can see a building ahead and an enemy nearby")
        print("  > answer 2 The player appears to be stuck")
        print()
        print("=" * 70)
        print()

    def list_pending_questions(self):
        """List all pending questions"""
        print()
        print("=" * 70)
        print("📋 PENDING QUESTIONS")
        print("=" * 70)
        print()

        unanswered = [q for q in self.pending_questions if not q['answered']]

        if not unanswered:
            print("✅ No pending questions!")
        else:
            for q in unanswered:
                status = "✅ ANSWERED" if q['answered'] else "❓ PENDING"
                print(f"#{q['id']} - {status}")
                print(f"   Q: {q['question'][:60]}...")
                print(f"   Visual: {'YES' if q['has_visual'] else 'NO'}")
                print()

        print("=" * 70)
        print()

    async def run(self):
        """Main run loop"""
        if not await self.connect():
            return

        try:
            # Run listener and input handler concurrently
            await asyncio.gather(
                self.listen_for_messages(),
                self.handle_input()
            )
        except KeyboardInterrupt:
            print("\n\n👋 Interrupted. Disconnecting...")
        finally:
            if self.ws:
                await self.ws.close()
            print("✅ Disconnected from bridge")


async def main():
    print()
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║         AI MANUAL RESPONDER - Interactive Terminal Interface       ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print()

    responder = AIManualResponder()
    await responder.run()


if __name__ == "__main__":
    try:
        # Check if aioconsole is installed
        import aioconsole
    except ImportError:
        print("❌ Missing required package: aioconsole")
        print()
        print("Please install it with:")
        print("  pip install aioconsole")
        print()
        sys.exit(1)

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n✅ Goodbye!")
