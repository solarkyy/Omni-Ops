"""
AI Chat Launcher Service
A small HTTP server that listens for commands to start the AI chat system.
Run this in the background, then the collab button can trigger it via HTTP.
"""
import subprocess
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading
import time

class LauncherHandler(BaseHTTPRequestHandler):
    bridge_process = None
    llm_responder_process = None

    def log_message(self, format, *args):
        pass  # Suppress default logging

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path == '/status':
            # Check if launcher is running
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'launcher_running': True,
                'bridge_running': LauncherHandler.bridge_process is not None,
                'llm_responder_running': LauncherHandler.llm_responder_process is not None,
                'timestamp': time.time()
            }
            self.wfile.write(json.dumps(response).encode())

    def do_POST(self):
        if self.path == '/start_chat_system':
            print('[Launcher] Received command to start AI chat system')

            # Start the bridge if not already running
            if LauncherHandler.bridge_process is None:
                try:
                    print('[Launcher] Starting collaboration bridge...')

                    # Start bridge in a new console window
                    if sys.platform == 'win32':
                        LauncherHandler.bridge_process = subprocess.Popen(
                            ['start', 'cmd', '/k', 'python', 'ai_collaborative_bridge.py'],
                            shell=True,
                            cwd=os.path.dirname(os.path.abspath(__file__))
                        )
                    else:
                        # Linux/Mac
                        LauncherHandler.bridge_process = subprocess.Popen(
                            ['python', 'ai_collaborative_bridge.py'],
                            cwd=os.path.dirname(os.path.abspath(__file__))
                        )

                    # Wait a moment for bridge to start
                    time.sleep(2)

                    print('[Launcher] ✓ Bridge started!')

                    # Start LLM Responder
                    print('[Launcher] Starting local LLM responder...')
                    if sys.platform == 'win32':
                        LauncherHandler.llm_responder_process = subprocess.Popen(
                            ['start', 'cmd', '/k', 'python', 'ai_auto_local_llm_responder.py'],
                            shell=True,
                            cwd=os.path.dirname(os.path.abspath(__file__))
                        )
                    else:
                        # Linux/Mac
                        LauncherHandler.llm_responder_process = subprocess.Popen(
                            ['python', 'ai_auto_local_llm_responder.py'],
                            cwd=os.path.dirname(os.path.abspath(__file__))
                        )

                    time.sleep(1)
                    print('[Launcher] ✓ LLM Responder started!')

                    # Open chat interface
                    print('[Launcher] Opening chat interface...')
                    chat_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ai_chat_interface.html')

                    if sys.platform == 'win32':
                        os.startfile(chat_file)
                    elif sys.platform == 'darwin':
                        subprocess.Popen(['open', chat_file])
                    else:
                        subprocess.Popen(['xdg-open', chat_file])

                    print('[Launcher] ✓ Chat interface opened!')

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()

                    response = {
                        'success': True,
                        'message': 'AI chat system started successfully',
                        'bridge_started': True,
                        'llm_responder_started': True,
                        'chat_opened': True
                    }
                    self.wfile.write(json.dumps(response).encode())

                except Exception as e:
                    print(f'[Launcher] Error starting chat system: {e}')

                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()

                    response = {
                        'success': False,
                        'message': f'Error: {str(e)}'
                    }
                    self.wfile.write(json.dumps(response).encode())
            else:
                # Already running, just open chat
                print('[Launcher] Bridge already running, opening chat...')

                chat_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ai_chat_interface.html')

                if sys.platform == 'win32':
                    os.startfile(chat_file)
                elif sys.platform == 'darwin':
                    subprocess.Popen(['open', chat_file])
                else:
                    subprocess.Popen(['xdg-open', chat_file])

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                response = {
                    'success': True,
                    'message': 'Bridge already running, chat opened',
                    'bridge_started': False,
                    'chat_opened': True
                }
                self.wfile.write(json.dumps(response).encode())

def main():
    port = 8082

    print()
    print('=' * 60)
    print('   AI CHAT LAUNCHER SERVICE')
    print('=' * 60)
    print()
    print('This service listens for commands from the collab button')
    print('to start the AI chat system.')
    print()
    print(f'Listening on: http://localhost:{port}')
    print()
    print('The 🤝 AI COLLAB button can now start the chat system!')
    print()
    print('Leave this window open in the background.')
    print('Press Ctrl+C to stop.')
    print()
    print('=' * 60)
    print()

    server = HTTPServer(('localhost', port), LauncherHandler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[Launcher] Shutting down...')
        server.shutdown()
        print('[Launcher] Stopped')

if __name__ == '__main__':
    main()
