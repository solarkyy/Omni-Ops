#!/usr/bin/env python3
"""
SIMPLE GAME LAUNCHER
Runs the game with integrated AI system
No external servers needed - everything in the browser!
"""

import os
import sys
import time
import webbrowser
import subprocess
from pathlib import Path

def main():
    workspace = Path(__file__).parent
    os.chdir(workspace)
    
    print("\n" + "="*70)
    print("  OMNI-OPS: GAME WITH INTEGRATED AI SYSTEM")
    print("  Everything runs in the browser - no external servers!")
    print("="*70 + "\n")
    
    print("[1/3] Starting game server on http://localhost:8000...")
    
    # Check if port is available
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', 8000))
    sock.close()
    
    if result == 0:
        print("      ✓ Server already running!")
    else:
        # Start Python HTTP server
        try:
            # Python 3.9+ has built-in HTTP server
            proc = subprocess.Popen(
                [sys.executable, '-m', 'http.server', '8000', '--directory', str(workspace)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except TypeError:
            # Fallback for older Python
            proc = subprocess.Popen(
                [sys.executable, '-m', 'http.server', '8000'],
                cwd=str(workspace),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        
        time.sleep(2)
        print("      ✓ Server started!")
    
    print("\n[2/3] Opening game browser...")
    game_url = "http://localhost:8000"
    webbrowser.open(game_url)
    print(f"      ✓ Opening {game_url}")
    
    print("\n[3/3] Game ready!\n")
    
    print("="*70)
    print("  USING THE AI SYSTEM")
    print("="*70)
    print("""
  1. Wait for game to load (15-20 seconds)
  2. Click "Start Game" in the menu
  3. Look for the AI ORCHESTRATION PANEL in bottom-left corner
  
  Using the AI Panel:
  • Click "Analyze Frame" to see current game state
  • Enter feature name and click "Start Test" to test it
  • Use Quick Commands for manual player control
  • Everything runs directly in the browser!
  
  Examples:
  • Enter "wall running" and click "Start Test"
  • Enter "stamina drain" and click "Start Test"
  • Use manual buttons to test features yourself
  
  No external servers required!
  No Python orchestrator needed!
  Everything in the browser!
""")
    print("="*70)
    print(f"\nGame: {game_url}")
    print("Press Ctrl+C to stop server\n")
    
    # Keep server running
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nShutting down...")
        try:
            proc.kill()
        except:
            pass
        print("Goodbye!")

if __name__ == '__main__':
    main()
