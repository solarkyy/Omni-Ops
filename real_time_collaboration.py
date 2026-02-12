#!/usr/bin/env python3
"""
REAL-TIME COPILOT-CLINE COLLABORATION
======================================

This starts a live collaboration session where:
1. Copilot (me) sends tasks to Cline
2. Cline modifies game code in real-time
3. Game updates as code changes
4. You watch everything in dashboard

Usage:
    python real_time_collaboration.py
"""

import os
import sys
import time
import webbrowser
import subprocess
import threading
from pathlib import Path

def start_game_server():
    """Start HTTP server for game"""
    print("[1/3] Starting game server on localhost:8000...")
    
    try:
        # Check if already running
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 8000))
        sock.close()
        
        if result == 0:
            print("      Server already running!")
            return
        
        # Start server
        subprocess.Popen(
            [sys.executable, '-m', 'http.server', '8000'],
            cwd=str(Path("c:/Users/kjoly/OneDrive/Desktop/Omni Ops")),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        time.sleep(2)
        print("      Game server running at http://localhost:8000")
        
    except Exception as e:
        print(f"      Error: {e}")

def main():
    workspace = Path("c:/Users/kjoly/OneDrive/Desktop/Omni Ops")
    
    print("\n" + "="*70)
    print("REAL-TIME COPILOT-CLINE COLLABORATION SYSTEM")
    print("="*70)
    print("\nThis system enables live AI collaboration with real-time game updates!")
    print("\nHow it works:")
    print("  1. I (Copilot) send tasks to Cline")
    print("  2. Cline modifies game code")
    print("  3. Game auto-updates with new features")
    print("  4. You see everything in real-time dashboard")
    print("\n" + "="*70 + "\n")
    
    # Step 1: Start game server
    start_game_server()
    
    # Step 2: Open dashboard
    print("[2/3] Opening real-time collaboration dashboard...")
    dashboard = workspace / "cline_real_time_center.html"
    
    try:
        webbrowser.open(f"file:///{dashboard}")
        print("      Dashboard opened in browser!")
    except Exception as e:
        print(f"      Error opening browser: {e}")
        print(f"      Manually open: file:///{dashboard}")
    
    time.sleep(2)
    
    # Step 3: Start collaboration bridge
    print("[3/3] Starting Copilot-Cline collaboration bridge...")
    print("\n      This will:")
    print("        - Send tasks to Cline")
    print("        - Wait for Cline responses")
    print("        - Monitor game updates")
    print("        - Report progress in dashboard")
    print("\n" + "="*70)
    print("INSTRUCTIONS:")
    print("="*70)
    print("\n1. GIVE CLINE THE TASK:")
    print("   Copy: CLINE_EXECUTABLE_TASK.md")
    print("   Paste into: Cline chat (right sidebar in VS Code)")
    print("   Type: 'Execute this task'")
    print("\n2. WATCH COLLABORATION CENTER:")
    print("   Left: Me and Cline chatting about implementation")
    print("   Center: Game with new wall running feature")
    print("   Right: Tests passing as features complete")
    print("\n3. GAME UPDATES IN REAL-TIME:")
    print("   As Cline modifies code, game will auto-update")
    print("   New features will be testable immediately")
    print("\n" + "="*70 + "\n")
    
    # Start the bridge
    bridge_script = workspace / "copilot_cline_direct_bridge.py"
    
    try:
        subprocess.run([sys.executable, str(bridge_script)])
    except KeyboardInterrupt:
        print("\n\nCollaboration session ended by user.")
    except Exception as e:
        print(f"Error: {e}")
    
    print("\n" + "="*70)
    print("SESSION COMPLETE")
    print("="*70)
    print("\nCheck these files for results:")
    print(f"  - REAL_TIME_STATUS.json (current status)")
    print(f"  - REAL_TIME_COLLAB.log (full conversation)")
    print(f"  - CLINE_TASK_STATUS.json (task progress)")
    print("\n")

if __name__ == "__main__":
    main()
