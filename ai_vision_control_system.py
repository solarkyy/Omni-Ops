#!/usr/bin/env python3
"""
AI VISION & CONTROL SYSTEM
============================
Gives AI full visual perception of game screen + input control
Enables closed-loop testing where AI codes features and tests them

Components:
1. Screen Capture - Real-time game state via browser
2. AI Vision - Process game visuals for understanding
3. Input Controller - Send player commands (move, jump, shoot, etc)
4. Testing Loop - AI tests its own implementations
5. Feedback System - Results back to AI for validation
"""

import os
import sys
import json
import time
import base64
import threading
import subprocess
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import Dict, List, Any
import socket

# Configuration
WORKSPACE_DIR = Path(__file__).parent
PORT = 8081
HOST = '127.0.0.1'

app = Flask(__name__)
CORS(app)

# Global state
ai_perception_state = {
    'last_frame': None,
    'last_frame_time': 0,
    'game_state': {},
    'player_position': [0, 0, 0],
    'player_health': 100,
    'can_move': True,
    'test_results': [],
    'feature_queue': []
}

input_command_queue = []
vision_data = {}

class AIBrainConnection:
    """Connection to Claude AI for vision/command processing"""
    
    def __init__(self):
        self.model = "claude-3-5-sonnet-20241022"
        self.api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        self.conversation_history = []
    
    def analyze_game_state(self, frame_b64: str, game_info: Dict) -> str:
        """Ask Claude to analyze current game state"""
        try:
            from anthropic import Anthropic
            client = Anthropic()
            
            # Build context message
            context = f"""
You are an AI player in a 3D FPS game. Analyze this frame and current state:

GAME STATE:
- Player Health: {game_info.get('health', 100)}/100
- Player Position: {game_info.get('position', [0,0,0])}
- Current Weapon: {game_info.get('weapon', 'Unknown')}
- Ammo: {game_info.get('ammo', 0)}/{game_info.get('reserve', 0)}
- On Ground: {game_info.get('on_ground', True)}
- Sprint Active: {game_info.get('sprinting', False)}

WHAT DO YOU SEE?
Describe:
1. Your immediate surroundings
2. Any enemies or NPCs
3. Items or objectives visible
4. Available paths or actions
5. Recommended next action

Be concise and actionable.
"""
            
            # Add image to message
            message_content = [
                {
                    "type": "text",
                    "text": context
                },
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": frame_b64
                    }
                }
            ]
            
            # Store in history
            self.conversation_history.append({
                "role": "user",
                "content": message_content
            })
            
            # Get response with full history
            response = client.messages.create(
                model=self.model,
                max_tokens=500,
                messages=self.conversation_history
            )
            
            analysis = response.content[0].text
            
            # Store response in history
            self.conversation_history.append({
                "role": "assistant", 
                "content": analysis
            })
            
            # Keep conversation to last 10 exchanges to avoid context explosion
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]
            
            return analysis
        
        except Exception as e:
            return f"Vision analysis failed: {str(e)}"
    
    def generate_test_sequence(self, feature_name: str, feature_code: str) -> List[str]:
        """Ask Claude to generate test sequence for a feature"""
        try:
            from anthropic import Anthropic
            client = Anthropic()
            
            prompt = f"""
A new feature was just implemented in the game:

FEATURE: {feature_name}
CODE:
```javascript
{feature_code[:500]}...
```

Generate a sequence of game actions to TEST this feature. Return as JSON array of commands.

Examples:
- "move_forward"
- "jump"
- "sprint"
- "crouch"
- "shoot"
- "reload"
- "look_around"
- "wait_2_seconds"
- "check_health"

Return: {{"test_sequence": ["command1", "command2", ...]}}
"""
            
            response = client.messages.create(
                model=self.model,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            
            try:
                result = json.loads(response.content[0].text)
                return result.get('test_sequence', [])
            except:
                return ["move_forward", "jump", "look_around"]
        
        except Exception as e:
            print(f"Test sequence generation failed: {e}")
            return []

ai_brain = AIBrainConnection()

# ============================================================================
# SCREEN CAPTURE ENDPOINTS
# ============================================================================

@app.route('/api/vision/capture', methods=['POST'])
def capture_frame():
    """Receive screen frame from game (base64 encoded PNG)"""
    try:
        data = request.json
        frame_b64 = data.get('frame', '')
        game_info = data.get('game_info', {})
        
        # Store frame
        ai_perception_state['last_frame'] = frame_b64
        ai_perception_state['last_frame_time'] = time.time()
        ai_perception_state['game_state'] = game_info
        
        # Update player info
        if 'player' in game_info:
            ai_perception_state['player_health'] = game_info['player'].get('health', 100)
            ai_perception_state['player_position'] = game_info['player'].get('position', [0,0,0])
        
        return jsonify({
            "status": "frame_received",
            "command_queue_size": len(input_command_queue)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vision/analyze', methods=['POST'])
def analyze_frame():
    """Ask AI to analyze current game frame"""
    try:
        if not ai_perception_state['last_frame']:
            return jsonify({"error": "No frame captured yet"}), 400
        
        # Get AI analysis
        analysis = ai_brain.analyze_game_state(
            ai_perception_state['last_frame'],
            ai_perception_state['game_state']
        )
        
        return jsonify({
            "status": "analyzed",
            "analysis": analysis,
            "game_state": ai_perception_state['game_state']
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# INPUT CONTROL ENDPOINTS
# ============================================================================

@app.route('/api/control/queue-commands', methods=['POST'])
def queue_commands():
    """Queue input commands for player"""
    try:
        data = request.json
        commands = data.get('commands', [])
        
        for cmd in commands:
            input_command_queue.append(cmd)
        
        return jsonify({
            "status": "queued",
            "commands_added": len(commands),
            "queue_length": len(input_command_queue)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/control/next-commands', methods=['GET'])
def get_next_commands():
    """Get queued commands (called by game client)"""
    try:
        # Return next batch of commands
        batch = input_command_queue[:10]
        if batch:
            del input_command_queue[:10]
        
        return jsonify({
            "commands": batch,
            "remaining": len(input_command_queue)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/control/move', methods=['POST'])
def control_move():
    """Direct movement command"""
    try:
        data = request.json
        direction = data.get('direction', 'forward')  # forward, back, left, right
        duration = data.get('duration', 1.0)  # seconds
        
        input_command_queue.append({
            "type": "move",
            "direction": direction,
            "duration": duration
        })
        
        return jsonify({"status": "move_queued"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# TESTING & FEATURE VALIDATION
# ============================================================================

@app.route('/api/test/start-feature-test', methods=['POST'])
def start_feature_test():
    """Start automated test sequence for a feature"""
    try:
        data = request.json
        feature_name = data.get('feature_name', 'Unknown')
        feature_code = data.get('feature_code', '')
        
        # Generate test sequence
        test_sequence = ai_brain.generate_test_sequence(feature_name, feature_code)
        
        # Queue commands
        for cmd in test_sequence:
            input_command_queue.append({
                "type": "action",
                "action": cmd
            })
        
        test_id = f"test_{int(time.time())}"
        ai_perception_state['test_results'].append({
            "test_id": test_id,
            "feature": feature_name,
            "start_time": time.time(),
            "sequence": test_sequence,
            "status": "running"
        })
        
        return jsonify({
            "status": "test_started",
            "test_id": test_id,
            "sequence_length": len(test_sequence)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/test/report-result', methods=['POST'])
def report_test_result():
    """Report test execution result"""
    try:
        data = request.json
        test_id = data.get('test_id', '')
        result = data.get('result', 'unknown')
        observations = data.get('observations', '')
        
        # Find and update test
        for test in ai_perception_state['test_results']:
            if test['test_id'] == test_id:
                test['status'] = 'completed'
                test['result'] = result
                test['observations'] = observations
                test['end_time'] = time.time()
                break
        
        return jsonify({
            "status": "result_recorded",
            "test_id": test_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# STATUS & MONITORING
# ============================================================================

@app.route('/api/status', methods=['GET'])
def status():
    """Get system status"""
    return jsonify({
        "service": "AI Vision & Control System",
        "status": "active",
        "uptime": time.time(),
        "frame_rate": 30,
        "command_queue_size": len(input_command_queue),
        "player_health": ai_perception_state['player_health'],
        "player_position": ai_perception_state['player_position'],
        "active_tests": len([t for t in ai_perception_state['test_results'] if t['status'] == 'running'])
    })

@app.route('/api/debug/state', methods=['GET'])
def debug_state():
    """Get full debug state"""
    return jsonify({
        "perception_state": ai_perception_state,
        "queue_length": len(input_command_queue),
        "conversation_history_length": len(ai_brain.conversation_history)
    })

# ============================================================================
# WEB INTERFACE
# ============================================================================

@app.route('/vision-dashboard.html')
def vision_dashboard():
    """Serve AI vision dashboard"""
    return send_file(WORKSPACE_DIR / 'ai_vision_dashboard.html')

def send_file(path):
    """Send file"""
    with open(path, 'r') as f:
        return f.read()

# ============================================================================
# STARTUP
# ============================================================================

def start_server():
    """Start the vision control server"""
    print(f"\n{'='*70}")
    print("AI VISION & CONTROL SYSTEM STARTING")
    print(f"{'='*70}")
    print(f"Server: http://{HOST}:{PORT}")
    print(f"Dashboard: http://{HOST}:{PORT}/vision-dashboard.html")
    print(f"API Status: http://{HOST}:{PORT}/api/status")
    print(f"{'='*70}\n")
    
    app.run(host=HOST, port=PORT, debug=False, threaded=True)

if __name__ == '__main__':
    start_server()
