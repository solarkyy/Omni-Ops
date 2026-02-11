"""
OMNI-OPS AI BACKEND SERVER
Connects game to AI services (Claude, GPT-4 Vision, etc.)
Handles vision-based gameplay and chat
"""

import asyncio
import websockets
import json
import base64
import os
from pathlib import Path
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

# Try to import AI SDKs
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False
    print("[Warning] Anthropic SDK not installed. Run: pip install anthropic")

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("[Warning] OpenAI SDK not installed. Run: pip install openai")

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class OmniAIServer:
    def __init__(self):
        self.clients = set()
        self.game_state = {}
        self.conversation_history = []
        self.ai_mode = 'claude'  # claude, gpt4, or moonshot
        self.ai_control_enabled = False

        # Initialize API clients
        self.setup_ai_clients()

        print("=" * 50)
        print("🤖 OMNI-OPS AI SERVER")
        print("=" * 50)
        print(f"Claude API: {'✓' if ANTHROPIC_AVAILABLE else '✗'}")
        print(f"OpenAI API: {'✓' if OPENAI_AVAILABLE else '✗'}")
        print("=" * 50)

    def setup_ai_clients(self):
        """Initialize AI service clients"""
        self.anthropic_client = None
        self.openai_client = None

        if ANTHROPIC_AVAILABLE:
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if api_key:
                self.anthropic_client = anthropic.Anthropic(api_key=api_key)
                print("[✓] Claude API initialized")

        if OPENAI_AVAILABLE:
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                self.openai_client = openai.OpenAI(api_key=api_key)
                print("[✓] OpenAI API initialized")

    async def handle_client(self, websocket, path):
        """Handle WebSocket connections from game"""
        self.clients.add(websocket)
        print(f"[+] Client connected: {websocket.remote_address}")

        try:
            async for message in websocket:
                data = json.loads(message)
                await self.process_message(websocket, data)
        except websockets.exceptions.ConnectionClosed:
            print(f"[-] Client disconnected: {websocket.remote_address}")
        finally:
            self.clients.remove(websocket)

    async def process_message(self, websocket, data):
        """Process messages from game client"""
        msg_type = data.get('type')

        if msg_type == 'player_message':
            # Player sent a chat message
            await self.handle_chat_message(websocket, data)

        elif msg_type == 'screenshot':
            # Game sent a screenshot for AI analysis
            await self.handle_screenshot(websocket, data)

        elif msg_type == 'game_state':
            # Game state update
            self.game_state = data.get('state', {})

            # If AI control is enabled, make decisions
            if self.ai_control_enabled:
                await self.ai_make_decision(websocket)

        elif msg_type == 'control_toggle':
            # Toggle AI control
            self.ai_control_enabled = data.get('enabled', False)
            status = "ENABLED" if self.ai_control_enabled else "DISABLED"
            print(f"[*] AI Control {status}")

            await self.send_to_client(websocket, {
                'type': 'ai_message',
                'content': f'AI control {status}. {"I will now play the game autonomously." if self.ai_control_enabled else "Manual control restored."}'
            })

    async def handle_chat_message(self, websocket, data):
        """Handle chat messages and get AI response"""
        player_message = data.get('content', '')
        game_state = data.get('gameState', {})

        print(f"[Player] {player_message}")

        # Add to conversation history
        self.conversation_history.append({
            'role': 'user',
            'content': player_message
        })

        # Get AI response
        ai_response = await self.get_ai_response(player_message, game_state)

        # Add to history
        self.conversation_history.append({
            'role': 'assistant',
            'content': ai_response
        })

        print(f"[AI] {ai_response}")

        # Send response back to game
        await self.send_to_client(websocket, {
            'type': 'ai_message',
            'content': ai_response
        })

    async def handle_screenshot(self, websocket, data):
        """Handle screenshot for AI vision analysis"""
        screenshot_data = data.get('image')  # Base64 encoded image
        game_state = data.get('gameState', {})

        # Save screenshot
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        screenshot_path = Path("screenshots") / f"ai_view_{timestamp}.png"
        screenshot_path.parent.mkdir(exist_ok=True)

        # Decode and save
        if screenshot_data:
            image_data = base64.b64decode(screenshot_data.split(',')[1])
            with open(screenshot_path, 'wb') as f:
                f.write(image_data)

            print(f"[📸] Screenshot saved: {screenshot_path}")

            # Get AI vision analysis
            analysis = await self.analyze_screenshot(screenshot_data, game_state)

            await self.send_to_client(websocket, {
                'type': 'ai_message',
                'content': f'Vision Analysis: {analysis}'
            })

    async def get_ai_response(self, message, game_state=None):
        """Get response from AI service"""

        # Build context with game state
        context = self.build_game_context(game_state)
        full_prompt = f"{context}\n\nPlayer: {message}\n\nAI (respond as a helpful gaming AI assistant):"

        # Try Claude first
        if self.anthropic_client:
            try:
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1024,
                    messages=[
                        {"role": "user", "content": full_prompt}
                    ]
                )
                return response.content[0].text
            except Exception as e:
                print(f"[Error] Claude API failed: {e}")

        # Fallback to OpenAI
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an AI assistant for a video game. Help the player with tactics, exploration, and combat."},
                        {"role": "user", "content": full_prompt}
                    ]
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"[Error] OpenAI API failed: {e}")

        # Fallback response
        return self.generate_fallback_response(message, game_state)

    async def analyze_screenshot(self, screenshot_base64, game_state):
        """Use AI vision to analyze screenshot"""

        if not self.anthropic_client:
            return "Vision analysis requires Claude API. Please configure ANTHROPIC_API_KEY."

        try:
            # Extract image data
            image_data = screenshot_base64.split(',')[1] if ',' in screenshot_base64 else screenshot_base64

            context = self.build_game_context(game_state)

            response = self.anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": "image/png",
                                    "data": image_data
                                }
                            },
                            {
                                "type": "text",
                                "text": f"""Analyze this game screenshot from Omni-Ops (a tactical FPS).

Game Context: {context}

Please describe:
1. What you see in the environment
2. Any threats or enemies
3. Items or objectives visible
4. Recommended tactical actions

Keep response concise (2-3 sentences)."""
                            }
                        ]
                    }
                ]
            )

            return response.content[0].text

        except Exception as e:
            print(f"[Error] Vision analysis failed: {e}")
            return f"Vision analysis error: {str(e)}"

    async def ai_make_decision(self, websocket):
        """AI makes a decision about what action to take"""
        if not self.game_state:
            return

        # Analyze game state
        health = self.game_state.get('health', 100)
        enemies_nearby = self.game_state.get('nearbyEnemies', 0)
        position = self.game_state.get('position')

        action = None

        # Simple AI logic (can be enhanced with actual AI reasoning)
        if health < 30:
            action = 'seek_cover'
        elif enemies_nearby > 0:
            action = 'engage_enemy'
        else:
            action = 'explore'

        # Send action to game
        await self.send_to_client(websocket, {
            'type': 'ai_action',
            'action': action,
            'reasoning': self.get_action_reasoning(action)
        })

    def build_game_context(self, game_state):
        """Build context string from game state"""
        if not game_state:
            return "Game session active"

        context_parts = []

        if 'health' in game_state:
            context_parts.append(f"Health: {game_state['health']}")

        if 'stamina' in game_state:
            context_parts.append(f"Stamina: {game_state['stamina']}")

        if 'nearbyEnemies' in game_state:
            enemies = game_state['nearbyEnemies']
            context_parts.append(f"Nearby enemies: {enemies}")

        if 'position' in game_state:
            pos = game_state['position']
            context_parts.append(f"Position: ({pos.get('x', 0):.1f}, {pos.get('y', 0):.1f}, {pos.get('z', 0):.1f})")

        return " | ".join(context_parts) if context_parts else "Game active"

    def generate_fallback_response(self, message, game_state):
        """Generate response when no AI service available"""
        message_lower = message.lower()

        responses = {
            'help': 'I can help you with exploration, combat tactics, and game objectives. What do you need?',
            'what': 'Based on the current situation, I recommend exploring the area carefully. Watch for enemies.',
            'where': 'Check your map (press Tab) to see your current location and objectives.',
            'how': 'Use WASD to move, mouse to aim, and left click to shoot. Press M for tactical mode.',
            'enemy': f'I detect {game_state.get("nearbyEnemies", 0)} enemies nearby. Stay alert!',
            'health': f'Your health is at {game_state.get("health", 100)}. {"Find cover!" if game_state.get("health", 100) < 50 else "You\\'re doing good."}',
        }

        for keyword, response in responses.items():
            if keyword in message_lower:
                return response

        return "I'm analyzing the situation. What would you like to do?"

    def get_action_reasoning(self, action):
        """Get reasoning for AI action"""
        reasonings = {
            'seek_cover': 'Low health detected - moving to safety',
            'engage_enemy': 'Enemies nearby - engaging in combat',
            'explore': 'Area clear - continuing exploration',
            'collect_items': 'Resources available - collecting items',
            'return_base': 'Mission objective - returning to base'
        }
        return reasonings.get(action, 'Taking action')

    async def send_to_client(self, websocket, message):
        """Send message to client"""
        try:
            await websocket.send(json.dumps(message))
        except Exception as e:
            print(f"[Error] Failed to send to client: {e}")

    async def start(self):
        """Start the WebSocket server"""
        print("\n[*] Starting WebSocket server on ws://localhost:8080")
        async with websockets.serve(self.handle_client, "localhost", 8080):
            await asyncio.Future()  # Run forever

def main():
    """Main entry point"""
    server = OmniAIServer()

    print("\n" + "=" * 50)
    print("SERVER READY")
    print("=" * 50)
    print("WebSocket: ws://localhost:8080")
    print("Game: http://localhost:8000")
    print("\nPress Ctrl+C to stop")
    print("=" * 50 + "\n")

    # Run the server
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("\n[*] Server stopped")

if __name__ == "__main__":
    main()
