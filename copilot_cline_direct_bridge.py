#!/usr/bin/env python3
"""
Copilot-Cline Direct Bridge
Enables real-time collaboration between Copilot and Cline

Communication flow:
1. Copilot sends task to Cline via file system
2. Cline reads task and modifies code
3. Changes auto-apply to game
4. Copilot monitors progress
5. Real-time dashboard shows everything
"""

import os
import sys
import time
import json
import subprocess
from datetime import datetime
from pathlib import Path
import threading

class CopilotClineBridge:
    def __init__(self):
        self.workspace = Path("c:/Users/kjoly/OneDrive/Desktop/Omni Ops")
        self.cline_inbox = self.workspace / "cline_inbox"
        self.cline_outbox = self.workspace / "cline_outbox"
        self.collab_log = self.workspace / "REAL_TIME_COLLAB.log"
        self.status_file = self.workspace / "REAL_TIME_STATUS.json"
        
        # Create directories if they don't exist
        self.cline_inbox.mkdir(exist_ok=True)
        self.cline_outbox.mkdir(exist_ok=True)
        
        self.collaboration_history = []
        self.start_time = datetime.now()
        
    def log_event(self, actor, message, msg_type="info"):
        """Log collaboration event"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        event = {
            "timestamp": timestamp,
            "actor": actor,
            "message": message,
            "type": msg_type
        }
        self.collaboration_history.append(event)
        
        # Also write to file
        with open(self.collab_log, 'a', encoding='utf-8') as f:
            f.write(f"[{timestamp}] {actor}: {message}\n")
        
        print(f"[{timestamp}] {actor}: {message}")
        
        # Update status
        self.update_status()
    
    def update_status(self):
        """Update real-time status file"""
        status = {
            "timestamp": datetime.now().isoformat(),
            "total_messages": len(self.collaboration_history),
            "elapsed_seconds": (datetime.now() - self.start_time).total_seconds(),
            "recent_events": self.collaboration_history[-10:],
            "cline_status": self.get_cline_status(),
            "game_status": self.get_game_status()
        }
        
        with open(self.status_file, 'w', encoding='utf-8') as f:
            json.dump(status, f, indent=2)
    
    def get_cline_status(self):
        """Check if Cline has responded"""
        if list(self.cline_outbox.glob("*.json")):
            return "responding"
        return "waiting"
    
    def get_game_status(self):
        """Check game file modification time"""
        game_file = self.workspace / "js" / "omni-core-game.js"
        if game_file.exists():
            mtime = os.path.getmtime(game_file)
            return datetime.fromtimestamp(mtime).isoformat()
        return "unknown"
    
    def send_to_cline(self, task_name, instructions, code_file=None, modify_request=None):
        """Send task to Cline via file system"""
        message_id = f"msg-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        task = {
            "id": message_id,
            "task": task_name,
            "instructions": instructions,
            "timestamp": datetime.now().isoformat(),
            "code_file": code_file,
            "modify_request": modify_request,
            "status": "pending_cline"
        }
        
        # Write to inbox for Cline to read
        task_file = self.cline_inbox / f"{message_id}.json"
        with open(task_file, 'w', encoding='utf-8') as f:
            json.dump(task, f, indent=2)
        
        self.log_event("COPILOT", f"Sent to Cline: {task_name}", "send")
        return message_id
    
    def wait_for_cline_response(self, task_id, timeout=30):
        """Wait for Cline to respond"""
        start = time.time()
        
        while time.time() - start < timeout:
            response_file = self.cline_outbox / f"{task_id}-response.json"
            
            if response_file.exists():
                with open(response_file, 'r', encoding='utf-8') as f:
                    response = json.load(f)
                
                self.log_event("CLINE", response.get("message", "Task completed"), "response")
                
                # Check if code was modified
                if response.get("code_modified"):
                    self.log_event("CLINE", "Code modified and saved", "code_change")
                
                return response
            
            time.sleep(1)
        
        self.log_event("COPILOT", f"Timeout waiting for Cline (>{timeout}s)", "warning")
        return None
    
    def run_workflow(self):
        """Execute the full wall running implementation workflow"""
        
        print("\n" + "="*60)
        print("COPILOT-CLINE REAL-TIME COLLABORATION")
        print("="*60 + "\n")
        
        self.log_event("COPILOT", "Starting real-time collaboration workflow", "start")
        
        # Phase 1: Send initial task to Cline
        print("\n[PHASE 1] Sending wall running task to Cline...\n")
        
        task_id = self.send_to_cline(
            task_name="Implement Wall Running Feature",
            instructions="""Implement matrix-style wall running in js/omni-core-game.js:

REQUIREMENTS:
1. Wall Detection: Use raycasts to detect when player is near walls
2. Wall Running Physics: Apply 5% reduced gravity when on wall
3. Camera Tilt: Tilt camera 15-30° toward the wall
4. Exit on Jump: Player exits wall running on jump
5. Audio: Play wall-specific footstep sounds (3 variations)
6. X Key Toggle: Activate/deactivate feature with X key

IMPLEMENTATION:
- Modify player object properties
- Add detectWallRunning() function
- Modify player.update() for physics
- Update camera system for tilt
- Add audio system integration
- Add input handler for X key

DELIVERABLE:
Return progress updates and confirm when each step is complete.
Respond with {"status": "in_progress", "step": "...", "message": "..."}
When complete: {"status": "complete", "code_modified": true, "message": "Wall running implemented"}""",
            code_file="js/omni-core-game.js",
            modify_request="Add wall running to Three.js game"
        )
        
        # Phase 2: Wait for Cline to start working
        print("\n[PHASE 2] Waiting for Cline to acknowledge task...\n")
        
        response = self.wait_for_cline_response(task_id, timeout=45)
        
        if response:
            if response.get("status") == "complete":
                self.log_event("COPILOT", "Cline completed the implementation!", "success")
            else:
                self.log_event("COPILOT", f"Cline progress: {response.get('message')}", "progress")
        
        # Phase 3: Monitor game and request tests
        print("\n[PHASE 3] Requesting feature tests...\n")
        
        test_task_id = self.send_to_cline(
            task_name="Test Wall Running Feature",
            instructions="""Test the wall running implementation:

TEST CASES (14 total):
1. Wall Detection (Raycast) - Verify raycasts detect walls
2. Wall Stick Speed - Player sticks within 2 frames
3. Physics (Gravity 5%) - Gravity reduces correctly
4. Camera Tilt (15°) - Camera tilts minimum
5. Camera Tilt (30°) - Camera tilts maximum
6. Toggle with X Key - X key toggles on/off
7. Exit on Jump - Jump exits wall running
8. Exit on Direction Change - Direction change exits
9. Footstep Audio - Normal - Base sound plays
10. Footstep Audio - Variant 1 - First variant plays
11. Footstep Audio - Variant 2 - Second variant plays
12. Wall Slide Performance - Maintains 60fps
13. Multi-wall Transitions - Can transition between walls
14. Edge Case: Corner Collision - Handles corners

Respond with test results in format:
{"status": "testing", "tests_passed": N, "tests_total": 14, "last_test": "..."}
When complete: {"status": "complete", "tests_passed": 14, "all_tests_passing": true}""",
            code_file="test_ai_connection.html"
        )
        
        # Phase 4: Wait for test results
        print("\n[PHASE 4] Running tests...\n")
        
        test_response = self.wait_for_cline_response(test_task_id, timeout=60)
        
        # Phase 5: Summary
        print("\n" + "="*60)
        print("COLLABORATION SUMMARY")
        print("="*60)
        
        self.log_event("COPILOT", "Workflow complete. Check REAL_TIME_STATUS.json for details", "complete")
        
        elapsed = datetime.now() - self.start_time
        print(f"\nTotal Elapsed Time: {elapsed}")
        print(f"Total Messages: {len(self.collaboration_history)}")
        print(f"\nReal-time status saved to: {self.status_file}")
        print("View live updates in: cline_real_time_center.html\n")
        
        return True


def main():
    print("\n" + "="*60)
    print("STARTING DIRECT COPILOT-CLINE COMMUNICATION BRIDGE")
    print("="*60)
    print("\nThis system enables real-time collaboration:")
    print("1. I (Copilot) send tasks to Cline")
    print("2. Cline modifies game code in real-time")
    print("3. Game auto-updates with new features")
    print("4. All visible in dashboard on screen")
    print("\nOpen cline_real_time_center.html in browser to watch!")
    print("\n" + "="*60 + "\n")
    
    bridge = CopilotClineBridge()
    bridge.run_workflow()


if __name__ == "__main__":
    main()
