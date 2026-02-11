"""
AI Collaborative Bridge - Enables AI-to-AI Communication
Allows external AI (Claude) to communicate with in-game AI system
for autonomous problem detection, diagnosis, and solving.
"""

import json
import time
import asyncio
import websockets
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from typing import Dict, List, Any
from datetime import datetime
from collections import deque

class CollaborativeBridge:
    """Bridge for AI-to-AI collaboration and autonomous diagnostics"""

    def __init__(self, port=8080, ws_port=8081):
        self.port = port
        self.ws_port = ws_port
        self.server = None
        self.ws_server = None
        self.server_thread = None
        self.ws_thread = None

        # Communication queues
        self.external_ai_messages = deque(maxlen=100)
        self.in_game_ai_messages = deque(maxlen=100)
        self.diagnostic_reports = deque(maxlen=50)
        self.collaboration_log = deque(maxlen=200)
        self.ai_questions = deque(maxlen=50)  # FIX: Store AI questions
        self.question_counter = 0  # Counter for question IDs

        # Active WebSocket connections
        self.ws_connections = set()

        # Autonomous mode settings
        self.autonomous_mode = False
        self.auto_fix_enabled = False

        # Diagnostic state
        self.current_diagnostics = {
            'game_state': None,
            'errors': [],
            'warnings': [],
            'performance': {},
            'last_update': None
        }

    def start_server(self):
        """Start HTTP server for REST API"""
        handler = self._create_handler()
        self.server = HTTPServer(('localhost', self.port), handler)
        self.server_thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.server_thread.start()
        print(f"✓ Collaborative bridge HTTP server started on http://localhost:{self.port}")

        # Start WebSocket server
        self._start_websocket_server()

    def _start_websocket_server(self):
        """Start WebSocket server for real-time communication"""
        async def handle_websocket(websocket):
            self.ws_connections.add(websocket)
            self.log_collaboration('Client connected via WebSocket', 'system')

            try:
                async for message in websocket:
                    data = json.loads(message)
                    await self.handle_external_message(websocket, data)
            except websockets.exceptions.ConnectionClosed:
                pass
            finally:
                self.ws_connections.discard(websocket)
                self.log_collaboration('Client disconnected', 'system')

        async def start_server():
            async with websockets.serve(handle_websocket, 'localhost', self.ws_port):
                await asyncio.Future()  # run forever

        def run_ws_server():
            asyncio.run(start_server())

        self.ws_thread = threading.Thread(target=run_ws_server, daemon=True)
        self.ws_thread.start()
        print(f"✓ Collaborative bridge WebSocket server started on ws://localhost:{self.ws_port}")

    async def handle_external_message(self, websocket, data):
        """Handle messages from external AI (Claude)"""
        msg_type = data.get('type')

        if msg_type == 'diagnostic_request':
            # Send current diagnostics to external AI
            response = {
                'type': 'diagnostic_response',
                'diagnostics': self.current_diagnostics,
                'timestamp': datetime.now().isoformat()
            }
            await websocket.send(json.dumps(response))

        elif msg_type == 'command':
            # Execute command in game
            command = data.get('command')
            self.log_collaboration(f'External AI: {command}', 'external')
            result = await self.execute_game_command(command, data.get('params', {}))

            response = {
                'type': 'command_result',
                'command': command,
                'result': result,
                'timestamp': datetime.now().isoformat()
            }
            await websocket.send(json.dumps(response))

        elif msg_type == 'analysis':
            # External AI providing analysis
            analysis = data.get('analysis')
            suggestions = data.get('suggestions', [])
            self.log_collaboration(f'External AI Analysis: {analysis}', 'external')

            # Store for in-game AI to access
            self.external_ai_messages.append({
                'type': 'analysis',
                'content': analysis,
                'suggestions': suggestions,
                'timestamp': datetime.now().isoformat()
            })

        elif msg_type == 'fix_proposal':
            # External AI proposing a fix
            fix = data.get('fix')
            self.log_collaboration(f'External AI proposes fix: {fix["description"]}', 'external')

            if self.auto_fix_enabled:
                # Automatically apply fix
                result = await self.apply_fix(fix)
                response = {
                    'type': 'fix_result',
                    'success': result['success'],
                    'message': result['message'],
                    'timestamp': datetime.now().isoformat()
                }
                await websocket.send(json.dumps(response))

        elif msg_type == 'ai_question':
            # In-game AI asking for help with visual context
            question = data.get('question')
            game_state = data.get('gameState')
            visual_data = data.get('visualData')

            self.log_collaboration(f'In-game AI asks: {question}', 'in_game')

            # Store the question with context and unique ID
            self.question_counter += 1
            self.ai_questions.append({
                'id': self.question_counter,
                'question': question,
                'gameState': game_state,
                'visualData': visual_data,
                'timestamp': datetime.now().isoformat(),
                'answered': False
            })

            # Broadcast to all connected clients
            await self.broadcast_to_external_ai({
                'type': 'ai_question_notification',
                'question': question,
                'has_visual': visual_data is not None,
                'visualData': visual_data,
                'gameState': game_state,
                'timestamp': datetime.now().isoformat()
            })

        elif msg_type == 'ai_answer':
            # External AI answering an in-game AI question
            answer = data.get('answer')
            question_id = data.get('question_id', -1)

            self.log_collaboration(f'External AI answers: {answer}', 'external')

            # Store answer for in-game AI to retrieve
            self.external_ai_messages.append({
                'type': 'answer',
                'content': answer,
                'question_id': question_id,
                'timestamp': datetime.now().isoformat()
            })

            # Broadcast to all connected clients
            await self.broadcast_to_external_ai({
                'type': 'ai_answer',
                'answer': answer,
                'question_id': question_id,
                'timestamp': datetime.now().isoformat()
            })

        elif msg_type == 'user_message':
            # User sent a message in the chat interface
            message = data.get('message')
            self.log_collaboration(f'User: {message}', 'user')

            # Broadcast to all connected clients (in-game AI, external AI, other chat clients)
            await self.broadcast_to_external_ai({
                'type': 'user_message',
                'message': message,
                'sender': 'user',
                'sender_name': 'USER',
                'timestamp': datetime.now().isoformat()
            })

        elif msg_type == 'chat_client_connected':
            # Chat interface connected
            self.log_collaboration('Chat interface connected', 'system')
            await websocket.send(json.dumps({
                'type': 'welcome',
                'message': 'Connected to AI Collaboration Bridge',
                'timestamp': datetime.now().isoformat()
            }))

    async def execute_game_command(self, command: str, params: dict) -> dict:
        """Execute a command in the game"""
        # This would interact with the game's command system
        # For now, we'll simulate it

        if command == 'run_test':
            test_type = params.get('test_type')
            return {
                'success': True,
                'message': f'Running {test_type} test',
                'test_queued': True
            }

        elif command == 'get_game_state':
            return {
                'success': True,
                'state': self.current_diagnostics['game_state']
            }

        elif command == 'spawn_test_entity':
            entity_type = params.get('entity_type', 'enemy')
            return {
                'success': True,
                'message': f'Spawned {entity_type}',
                'entity_id': f'test_{entity_type}_{int(time.time())}'
            }

        elif command == 'clear_errors':
            self.current_diagnostics['errors'] = []
            return {
                'success': True,
                'message': 'Errors cleared'
            }

        return {
            'success': False,
            'message': f'Unknown command: {command}'
        }

    async def apply_fix(self, fix: dict) -> dict:
        """Apply a proposed fix"""
        fix_type = fix.get('type')

        if fix_type == 'config_change':
            # Apply configuration change
            config = fix.get('config')
            return {
                'success': True,
                'message': f'Applied config change: {config}'
            }

        elif fix_type == 'code_patch':
            # This would require more sophisticated handling
            return {
                'success': False,
                'message': 'Code patching requires manual approval'
            }

        return {
            'success': False,
            'message': f'Unknown fix type: {fix_type}'
        }

    async def broadcast_to_external_ai(self, message: dict):
        """Broadcast message to all connected external AIs"""
        if self.ws_connections:
            message_json = json.dumps(message)
            await asyncio.gather(
                *[ws.send(message_json) for ws in self.ws_connections],
                return_exceptions=True
            )

    async def broadcast_to_game(self, message: dict):
        """Broadcast message to all connected game clients (WebSocket)"""
        if self.ws_connections:
            message_json = json.dumps(message)
            await asyncio.gather(
                *[ws.send(message_json) for ws in self.ws_connections],
                return_exceptions=True
            )

    def log_collaboration(self, message: str, source: str):
        """Log collaboration activity"""
        entry = {
            'message': message,
            'source': source,
            'timestamp': datetime.now().isoformat()
        }
        self.collaboration_log.append(entry)
        print(f"[{source.upper()}] {message}")

    def update_diagnostics(self, game_state: dict):
        """Update diagnostic information from game"""
        self.current_diagnostics['game_state'] = game_state
        self.current_diagnostics['last_update'] = datetime.now().isoformat()

        # Auto-detect issues
        issues = self.detect_issues(game_state)
        if issues:
            self.current_diagnostics['errors'].extend(issues['errors'])
            self.current_diagnostics['warnings'].extend(issues['warnings'])

            # If in autonomous mode, notify external AI
            if self.autonomous_mode and self.ws_connections:
                asyncio.run(self.broadcast_to_external_ai({
                    'type': 'issues_detected',
                    'issues': issues,
                    'timestamp': datetime.now().isoformat()
                }))

    def detect_issues(self, game_state: dict) -> dict:
        """Automatically detect issues in game state"""
        errors = []
        warnings = []

        if game_state:
            player = game_state.get('player', {})

            # Check for stuck player
            velocity = player.get('velocity', {})
            if all(abs(velocity.get(axis, 0)) < 0.001 for axis in ['x', 'y', 'z']):
                # Player might be stuck
                warnings.append({
                    'type': 'player_stuck',
                    'message': 'Player velocity is near zero - may be stuck',
                    'severity': 'medium'
                })

            # Check for low health
            health = player.get('health', 100)
            if health < 20:
                warnings.append({
                    'type': 'low_health',
                    'message': f'Player health critical: {health}',
                    'severity': 'high'
                })

            # Check for position anomalies
            y_pos = player.get('y', 0)
            if y_pos < -10:
                errors.append({
                    'type': 'player_fell_through_world',
                    'message': f'Player fell through world (y={y_pos})',
                    'severity': 'critical'
                })

        return {
            'errors': errors,
            'warnings': warnings
        }

    def _create_handler(self):
        """Create HTTP request handler"""
        bridge = self

        class CollaborativeHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass

            def do_OPTIONS(self):
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()

            def do_GET(self):
                if self.path == '/status':
                    self.send_json_response({
                        'status': 'connected',
                        'autonomous_mode': bridge.autonomous_mode,
                        'auto_fix_enabled': bridge.auto_fix_enabled,
                        'ws_connections': len(bridge.ws_connections),
                        'timestamp': time.time()
                    })

                elif self.path == '/diagnostics':
                    self.send_json_response({
                        'diagnostics': bridge.current_diagnostics,
                        'timestamp': datetime.now().isoformat()
                    })

                elif self.path == '/collaboration_log':
                    self.send_json_response({
                        'log': list(bridge.collaboration_log),
                        'count': len(bridge.collaboration_log)
                    })

                elif self.path == '/external_messages':
                    self.send_json_response({
                        'messages': list(bridge.external_ai_messages)
                    })

                elif self.path == '/ai_questions':
                    # NEW: Return pending AI questions
                    self.send_json_response({
                        'questions': [dict(q) for q in bridge.ai_questions],
                        'count': len(bridge.ai_questions)
                    })

                else:
                    self.send_error(404)

            def do_POST(self):
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length).decode('utf-8')

                try:
                    data = json.loads(body)
                except json.JSONDecodeError:
                    self.send_error(400, "Invalid JSON")
                    return

                if self.path == '/update_game_state':
                    # Receive game state update
                    bridge.update_diagnostics(data.get('state'))
                    self.send_json_response({'status': 'received'})

                elif self.path == '/in_game_message':
                    # Message from in-game AI
                    message = data.get('message')
                    bridge.log_collaboration(f'In-game AI: {message}', 'in_game')
                    bridge.in_game_ai_messages.append({
                        'message': message,
                        'timestamp': datetime.now().isoformat()
                    })
                    self.send_json_response({'status': 'received'})

                elif self.path == '/ai_answer':
                    # Answer from external AI (LLM Responder)
                    answer = data.get('answer')
                    question_id = data.get('question_id', -1)
                    source = data.get('source', 'external_ai')

                    bridge.log_collaboration(f'AI Answer received (Q#{question_id}): {answer}', source)

                    # Store the answer
                    bridge.external_ai_messages.append({
                        'type': 'answer',
                        'content': answer,
                        'question_id': question_id,
                        'timestamp': datetime.now().isoformat()
                    })

                    # Broadcast answer to all connected WebSocket clients (in-game)
                    asyncio.run(bridge.broadcast_to_game({
                        'type': 'ai_answer',
                        'answer': answer,
                        'question_id': question_id,
                        'source': source,
                        'timestamp': data.get('timestamp', datetime.now().isoformat())
                    }))

                    print(f"✅ Answer broadcasted to {len(bridge.ws_connections)} WebSocket clients")
                    self.send_json_response({'status': 'received', 'answer_sent': True})

                elif self.path == '/toggle_autonomous':
                    bridge.autonomous_mode = data.get('enabled', not bridge.autonomous_mode)
                    bridge.log_collaboration(
                        f'Autonomous mode {"enabled" if bridge.autonomous_mode else "disabled"}',
                        'system'
                    )
                    self.send_json_response({
                        'autonomous_mode': bridge.autonomous_mode
                    })

                elif self.path == '/toggle_auto_fix':
                    bridge.auto_fix_enabled = data.get('enabled', not bridge.auto_fix_enabled)
                    bridge.log_collaboration(
                        f'Auto-fix {"enabled" if bridge.auto_fix_enabled else "disabled"}',
                        'system'
                    )
                    self.send_json_response({
                        'auto_fix_enabled': bridge.auto_fix_enabled
                    })

                else:
                    self.send_error(404)

            def send_json_response(self, data):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode('utf-8'))

        return CollaborativeHandler

    def stop_server(self):
        """Stop the servers"""
        if self.server:
            self.server.shutdown()
            print("✓ HTTP server stopped")
        if self.ws_server:
            self.ws_server.close()
            print("✓ WebSocket server stopped")


if __name__ == "__main__":
    # Start the collaborative bridge
    bridge = CollaborativeBridge(port=8080, ws_port=8081)
    bridge.start_server()

    print("\n🤖 AI Collaborative Bridge Ready")
    print("=" * 60)
    print("HTTP API: http://localhost:8080")
    print("WebSocket: ws://localhost:8081")
    print("\nFeatures:")
    print("  • AI-to-AI communication")
    print("  • Autonomous problem detection")
    print("  • Auto-fix capabilities")
    print("  • Real-time diagnostics")
    print("\nPress Ctrl+C to stop\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        bridge.stop_server()
        print("✓ Collaborative bridge stopped")
