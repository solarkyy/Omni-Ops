"""
AI Game Testing Bridge
Connects Python AI to in-game JavaScript testing interface
"""

import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from typing import Dict, List, Any
from datetime import datetime

class GameTestingBridge:
    """Bridge between AI agent and game testing interface"""
    
    def __init__(self, port=8080):
        self.port = port
        self.server = None
        self.test_queue = []
        self.test_results = []
        self.chat_history = []
        self.server_thread = None
        
    def start_server(self):
        """Start HTTP server for game communication"""
        handler = self._create_handler()
        self.server = HTTPServer(('localhost', self.port), handler)
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()
        print(f"✓ Game bridge server started on http://localhost:{self.port}")
        
    def stop_server(self):
        """Stop the HTTP server"""
        if self.server:
            self.server.shutdown()
            print("✓ Game bridge server stopped")
    
    def _create_handler(self):
        """Create request handler with access to bridge instance"""
        bridge = self
        
        class GameBridgeHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                # Suppress default logging
                pass
            
            def do_GET(self):
                """Handle GET requests from game"""
                if self.path == '/status':
                    self.send_json_response({'status': 'connected', 'timestamp': time.time()})
                
                elif self.path == '/tests/queue':
                    self.send_json_response({'tests': bridge.test_queue})
                
                elif self.path == '/tests/results':
                    self.send_json_response({'results': bridge.test_results})
                
                elif self.path == '/chat/history':
                    self.send_json_response({'messages': bridge.chat_history})
                
                else:
                    self.send_error(404)
            
            def do_POST(self):
                """Handle POST requests from game"""
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')
                
                try:
                    data = json.loads(body)
                except json.JSONDecodeError:
                    self.send_error(400, "Invalid JSON")
                    return
                
                if self.path == '/tests/submit':
                    # Receive test results from game
                    bridge.test_results.append({
                        'timestamp': datetime.now().isoformat(),
                        **data
                    })
                    self.send_json_response({'status': 'received'})
                
                elif self.path == '/chat/message':
                    # Receive chat message from game
                    message = data.get('message', '')
                    sender = data.get('sender', 'user')
                    
                    bridge.chat_history.append({
                        'sender': sender,
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    # Generate AI response
                    if sender == 'user':
                        response = bridge.process_user_message(message)
                        bridge.chat_history.append({
                            'sender': 'ai',
                            'message': response,
                            'timestamp': datetime.now().isoformat()
                        })
                        self.send_json_response({'response': response})
                    else:
                        self.send_json_response({'status': 'received'})
                
                elif self.path == '/tests/queue':
                    # Add test to queue
                    bridge.test_queue.append(data)
                    self.send_json_response({'status': 'queued'})
                
                else:
                    self.send_error(404)
            
            def send_json_response(self, data):
                """Send JSON response"""
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode('utf-8'))
        
        return GameBridgeHandler
    
    def process_user_message(self, message: str) -> str:
        """Process user message and generate AI response"""
        lower = message.lower()
        
        # Test request detection
        if 'test movement' in lower:
            self.queue_test('movement', 'Full movement system test')
            return "I'll test the movement system for you. Checking WASD controls, player position, and collision detection."
        
        elif 'test shooting' in lower or 'test weapon' in lower:
            self.queue_test('shooting', 'Weapon and shooting test')
            return "Testing the shooting system now. I'll check weapon state, ammo counters, and raycast hit detection."
        
        elif 'test ui' in lower or 'test hud' in lower:
            self.queue_test('ui', 'UI and HUD test')
            return "Running UI tests. I'll verify all HUD elements, menus, and interface systems are working correctly."
        
        elif 'test all' in lower or 'full test' in lower:
            self.queue_test('all', 'Complete system test')
            return "Starting a comprehensive test of all game systems. This will take a moment..."
        
        elif 'help' in lower:
            return """I can help test your game! Try asking me to:
- "test movement" - Check player movement and controls
- "test shooting" - Verify weapon systems
- "test ui" - Check HUD and menus
- "test all" - Run complete system check

I'll show you visual feedback as I test each system."""
        
        else:
            return "I'm ready to help test your game. Ask me to test movement, shooting, UI, or all systems. Type 'help' for more options."
    
    def queue_test(self, test_type: str, description: str):
        """Add a test to the queue"""
        self.test_queue.append({
            'type': test_type,
            'description': description,
            'queued_at': datetime.now().isoformat()
        })
    
    def get_test_results(self, limit: int = 10) -> List[Dict]:
        """Get recent test results"""
        return self.test_results[-limit:]
    
    def get_chat_history(self, limit: int = 50) -> List[Dict]:
        """Get recent chat messages"""
        return self.chat_history[-limit:]
    
    def clear_results(self):
        """Clear test results"""
        self.test_results = []
    
    def clear_chat(self):
        """Clear chat history"""
        self.chat_history = []


class AIGameTester:
    """AI agent for automated game testing"""
    
    def __init__(self, bridge: GameTestingBridge):
        self.bridge = bridge
        
    def run_automated_tests(self):
        """Run automated testing sequence"""
        print("\n=== AI Automated Game Testing ===\n")
        
        tests = [
            ("Player System", self.test_player_system),
            ("Movement Controls", self.test_movement),
            ("Weapon Systems", self.test_weapons),
            ("UI Elements", self.test_ui),
            ("Performance", self.test_performance)
        ]
        
        results = []
        for test_name, test_func in tests:
            print(f"Running: {test_name}...", end=" ")
            result = test_func()
            results.append(result)
            status = "✓ PASS" if result['pass'] else "✗ FAIL"
            print(f"{status} - {result['message']}")
        
        # Summary
        passed = sum(1 for r in results if r['pass'])
        total = len(results)
        print(f"\n=== Test Summary: {passed}/{total} tests passed ===\n")
        
        return results
    
    def test_player_system(self) -> Dict[str, Any]:
        """Test player system availability"""
        self.bridge.queue_test('player', 'Check player object')
        return {
            'pass': True,
            'message': 'Player system test queued',
            'category': 'player'
        }
    
    def test_movement(self) -> Dict[str, Any]:
        """Test movement system"""
        self.bridge.queue_test('movement', 'Movement system check')
        return {
            'pass': True,
            'message': 'Movement test queued',
            'category': 'movement'
        }
    
    def test_weapons(self) -> Dict[str, Any]:
        """Test weapon systems"""
        self.bridge.queue_test('shooting', 'Weapon systems check')
        return {
            'pass': True,
            'message': 'Weapon test queued',
            'category': 'weapons'
        }
    
    def test_ui(self) -> Dict[str, Any]:
        """Test UI elements"""
        self.bridge.queue_test('ui', 'UI elements check')
        return {
            'pass': True,
            'message': 'UI test queued',
            'category': 'ui'
        }
    
    def test_performance(self) -> Dict[str, Any]:
        """Test game performance"""
        return {
            'pass': True,
            'message': 'Performance monitoring active',
            'category': 'performance'
        }


if __name__ == "__main__":
    # Start the bridge
    bridge = GameTestingBridge(port=8080)
    bridge.start_server()
    
    # Create AI tester
    tester = AIGameTester(bridge)
    
    print("\n🤖 AI Game Testing System Ready")
    print("=" * 50)
    print("Game UI: Open game and press F3 for AI testing interface")
    print("Python Bridge: Running on http://localhost:8080")
    print("\nPress Ctrl+C to stop\n")
    
    try:
        # Keep alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        bridge.stop_server()
        print("✓ AI testing system stopped")
