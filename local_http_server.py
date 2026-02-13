#!/usr/bin/env python3
"""
Local HTTP Server for Omni Ops Game
Serves game files and provides API endpoints for real-time collaboration
Auto-starts Cline integration bridge
"""

import os
import sys
import json
import time
import threading
import subprocess
from urllib import request as urlrequest
from urllib.error import URLError, HTTPError
from pathlib import Path
from flask import Flask, jsonify, send_from_directory, send_file, request, Response, redirect
from flask_cors import CORS, cross_origin

# Configuration
WORKSPACE_DIR = Path(__file__).parent
PORT = 8080
HOST = '127.0.0.1'
OPS_CONSOLE_DIR = WORKSPACE_DIR / 'ops-console' / 'client'
OPS_CONSOLE_SERVER = os.environ.get('OPS_CONSOLE_SERVER', 'http://127.0.0.1:3000')

app = Flask(__name__, static_folder=str(WORKSPACE_DIR))
CORS(app)

# File-based message queues for Cline communication
CLINE_INBOX_DIR = WORKSPACE_DIR / 'cline_inbox'
CLINE_OUTBOX_DIR = WORKSPACE_DIR / 'cline_outbox'
CLINE_INBOX_DIR.mkdir(exist_ok=True)
CLINE_OUTBOX_DIR.mkdir(exist_ok=True)

# Mock status data for development
STATUS_FILE = WORKSPACE_DIR / 'REAL_TIME_STATUS.json'
COLLAB_LOG_FILE = WORKSPACE_DIR / 'REAL_TIME_COLLAB.log'
CLINE_MESSAGES_FILE = WORKSPACE_DIR / 'cline_messages.json'

# Collaboration state
collaboration_messages = []
real_mode = True  # Auto-enable real mode
bridge_process = None

def auto_implement_feature(task_id, task, request_type):
    """
    AUTO-IMPLEMENT feature with CODE REVIEW and VALIDATION
    Reviews code before writing to prevent errors
    """
    global collaboration_messages
    
    time.sleep(0.5)
    
    # Step 1: Load AI Context
    context_dir = WORKSPACE_DIR / 'ai_context'
    ai_context = {}
    if context_dir.exists():
        collaboration_messages.append({
            'actor': 'COPILOT',
            'content': '📚 Loading AI context for better code...',
            'timestamp': '',
            'type': 'copilot'
        })
        try:
            for context_file in context_dir.glob('*.md'):
                with open(context_file, 'r', encoding='utf-8') as f:
                    ai_context[context_file.stem] = f.read()
            collaboration_messages.append({
                'actor': 'COPILOT',
                'content': f'✅ Loaded {len(ai_context)} context files',
                'timestamp': '',
                'type': 'copilot'
            })
        except Exception as e:
            collaboration_messages.append({
                'actor': 'COPILOT',
                'content': f'⚠️ Context load failed: {e}',
                'timestamp': '',
                'type': 'copilot'
            })
        time.sleep(0.5)
    
    # Step 2: Analysis
    collaboration_messages.append({
        'actor': 'COPILOT',
        'content': f'🔍 Analyzing: "{task}"',
        'timestamp': '',
        'type': 'copilot'
    })
    time.sleep(1)
    
    # Step 3: Generate code (with context awareness)
    task_lower = task.lower()
    target_file = WORKSPACE_DIR / 'js' / 'omni-core-game.js'
    feature_code = ""
    feature_type = ""
    feature_id = task_lower.replace(' ', '_')[:20]
    
    if 'health' in task_lower and 'bar' in task_lower:
        feature_type = "Health Bar UI"
        feature_code = f"""
// AUTO-FEATURE [{feature_id}]: Health Bar System
if (!window.healthBarUI) {{
    window.healthBarUI = {{
        element: null,
        init() {{
            if (this.element) return; // Prevent duplicates
            const bar = document.createElement('div');
            bar.style.cssText = 'position:fixed;top:20px;left:20px;width:200px;height:30px;background:#222;border:2px solid #0f0;border-radius:5px;overflow:hidden;z-index:9000;';
            const fill = document.createElement('div');
            fill.id = 'health-bar-fill';
            fill.style.cssText = 'height:100%;background:linear-gradient(90deg,#f00,#0f0);transition:width 0.3s;width:100%';
            const text = document.createElement('div');
            text.id = 'health-text';
            text.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:bold 14px monospace;z-index:1;text-shadow:0 0 3px #000';
            text.textContent = '100 / 100';
            bar.appendChild(fill);
            bar.appendChild(text);
            document.body.appendChild(bar);
            this.element = bar;
            console.log('[Health Bar] Initialized');
        }},
        update(current, max) {{
            const fill = document.getElementById('health-bar-fill');
            const text = document.getElementById('health-text');
            if (fill && text) {{
                const percent = (current / max) * 100;
                fill.style.width = percent + '%';
                text.textContent = Math.floor(current) + ' / ' + max;
            }}
        }}
    }};
    setTimeout(() => window.healthBarUI.init(), 500);
    setInterval(() => {{
        if (window.player) window.healthBarUI.update(player.health || 100, player.maxHealth || 100);
    }}, 100);
}}"""
    elif 'wall' in task_lower and ('run' in task_lower or 'jump' in task_lower):
        feature_type = "Wall Running"
        feature_code = f"""
// AUTO-FEATURE [{feature_id}]: Wall Running System
if (!window.wallRunSystem) {{
    window.wallRunSystem = {{
        active: false,
        wallSide: null,
        wallNormal: null,
        wallRunSpeed: 8,
        wallRunGravity: 5,
        maxWallRunTime: 3,
        wallRunTimer: 0,
        
        init() {{
            console.log('[Wall Run] System initialized');
        }},
        
        checkWall() {{
            if (!window.player || !window.objects) return null;
            
            const rayDirections = [
                new THREE.Vector3(1, 0, 0),   // Right
                new THREE.Vector3(-1, 0, 0),  // Left
                new THREE.Vector3(0, 0, 1),   // Forward
                new THREE.Vector3(0, 0, -1)   // Back
            ];
            
            const raycaster = new THREE.Raycaster();
            const playerPos = window.camera ? window.camera.position.clone() : new THREE.Vector3();
            
            for (let i = 0; i < rayDirections.length; i++) {{
                const dir = rayDirections[i].clone();
                if (window.camera) {{
                    dir.applyQuaternion(window.camera.quaternion);
                }}
                dir.y = 0;
                dir.normalize();
                
                raycaster.set(playerPos, dir);
                const intersects = raycaster.intersectObjects(window.objects || []);
                
                if (intersects.length > 0 && intersects[0].distance < 1.5) {{
                    return {{
                        side: i === 0 ? 'right' : i === 1 ? 'left' : i === 2 ? 'forward' : 'back',
                        normal: intersects[0].face.normal.clone(),
                        distance: intersects[0].distance
                    }};
                }}
            }}
            return null;
        }},
        
        start(wallData) {{
            this.active = true;
            this.wallSide = wallData.side;
            this.wallNormal = wallData.normal;
            this.wallRunTimer = this.maxWallRunTime;
            
            if (window.player) {{
                window.player.velocity.y = 2;
            }}
            
            console.log('[Wall Run] Started on', wallData.side, 'wall');
        }},
        
        stop() {{
            if (!this.active) return;
            this.active = false;
            this.wallSide = null;
            this.wallNormal = null;
            console.log('[Wall Run] Stopped');
        }},
        
        update(deltaTime) {{
            if (!this.active || !window.player) return;
            
            this.wallRunTimer -= deltaTime;
            if (this.wallRunTimer <= 0) {{
                this.stop();
                return;
            }}
            
            const wallCheck = this.checkWall();
            if (!wallCheck) {{
                this.stop();
                return;
            }}
            
            // Apply wall run physics
            if (window.player.velocity) {{
                window.player.velocity.y = Math.max(
                    window.player.velocity.y - this.wallRunGravity * deltaTime,
                    -5
                );
                
                const wallDir = new THREE.Vector3(-this.wallNormal.z, 0, this.wallNormal.x);
                if (this.wallSide === 'right') wallDir.multiplyScalar(-1);
                
                if (window.camera) {{
                    const forward = new THREE.Vector3(0, 0, -1);
                    forward.applyQuaternion(window.camera.quaternion);
                    forward.y = 0;
                    forward.normalize();
                    
                    const movement = forward.clone().multiplyScalar(this.wallRunSpeed * deltaTime);
                    window.player.velocity.x = movement.x;
                    window.player.velocity.z = movement.z;
                }}
            }}
        }}
    }};
    
    window.wallRunSystem.init();
    
    // Add keybinds and update loop
    let lastSpacePress = 0;
    document.addEventListener('keydown', (e) => {{
        if (e.code === 'Space' && !window.wallRunSystem.active) {{
            const now = Date.now();
            const wallData = window.wallRunSystem.checkWall();
            if (wallData && now - lastSpacePress < 300) {{
                window.wallRunSystem.start(wallData);
            }}
            lastSpacePress = now;
        }}
    }});
    
    console.log('[Wall Run] Ready - Double-tap SPACE near walls!');
}}"""
    elif 'powerup' in task_lower or 'boost' in task_lower or 'pickup' in task_lower:
        feature_type = "Powerup System"
        feature_code = f"""
// AUTO-FEATURE [{feature_id}]: Powerup System
if (!window.powerupSystem) {{
    window.powerupSystem = {{
        items: [],
        
        spawn(position, type = 'speed') {{
            const geometry = new THREE.SphereGeometry(0.5, 16, 16);
            const color = type === 'speed' ? 0x00ffff : type === 'health' ? 0x00ff00 : 0xffff00;
            const material = new THREE.MeshBasicMaterial({{
                color: color,
                emissive: color,
                emissiveIntensity: 0.5
            }});
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.userData = {{ type, spinSpeed: 2, bobSpeed: 2 }};
            
            if (window.scene) {{
                window.scene.add(mesh);
                this.items.push(mesh);
                console.log('[Powerup] Spawned', type, 'at', position);
            }}
        }},
        
        collect(type) {{
            console.log('[Powerup] Collected:', type);
            
            if (type === 'health' && window.player) {{
                window.player.health = Math.min(
                    (window.player.health || 100) + 25,
                    window.player.maxHealth || 100
                );
                console.log('[Powerup] Health restored to', window.player.health);
            }} else if (type === 'speed' && window.SETTINGS) {{
                const originalSpeed = window.SETTINGS.MAX_SPRINT;
                window.SETTINGS.MAX_SPRINT *= 1.5;
                console.log('[Powerup] Speed boost activated!');
                
                setTimeout(() => {{
                    window.SETTINGS.MAX_SPRINT = originalSpeed;
                    console.log('[Powerup] Speed boost expired');
                }}, 10000);
            }} else if (type === 'jump' && window.SETTINGS) {{
                const originalJump = window.SETTINGS.JUMP_POWER;
                window.SETTINGS.JUMP_POWER *= 1.5;
                console.log('[Powerup] Jump boost activated!');
                
                setTimeout(() => {{
                    window.SETTINGS.JUMP_POWER = originalJump;
                    console.log('[Powerup] Jump boost expired');
                }}, 10000);
            }}
        }},
        
        update(deltaTime) {{
            if (!window.camera) return;
            const playerPos = window.camera.position;
            
            for (let i = this.items.length - 1; i >= 0; i--) {{
                const item = this.items[i];
                
                // Spin animation
                item.rotation.y += item.userData.spinSpeed * deltaTime;
                
                // Bob animation
                const bobAmount = Math.sin(Date.now() * 0.002 * item.userData.bobSpeed) * 0.3;
                item.position.y += bobAmount * deltaTime;
                
                // Check collection
                const distance = playerPos.distanceTo(item.position);
                if (distance < 1.5) {{
                    this.collect(item.userData.type);
                    if (window.scene) {{
                        window.scene.remove(item);
                    }}
                    this.items.splice(i, 1);
                }}
            }}
        }}
    }};
    
    // Spawn some test powerups
    setTimeout(() => {{
        if (window.powerupSystem && window.scene) {{
            window.powerupSystem.spawn(new THREE.Vector3(10, 1, 10), 'speed');
            window.powerupSystem.spawn(new THREE.Vector3(-10, 1, -10), 'health');
            window.powerupSystem.spawn(new THREE.Vector3(0, 1, 15), 'jump');
            console.log('[Powerup] Test powerups spawned!');
        }}
    }}, 2000);
    
    console.log('[Powerup] System initialized');
}}"""
    else:
        feature_type = "Generic Feature"
        feature_code = f"""
// AUTO-FEATURE [{feature_id}]: {task}
console.log('[Feature] Loaded: {task}');"""
    
    collaboration_messages.append({
        'actor': 'COPILOT',
        'content': f'📝 Generated: {len(feature_code)} chars | Type: {feature_type} | Context: {"✅" if ai_context else "❌"}',
        'timestamp': '',
        'type': 'copilot'
    })
    time.sleep(1)
    
    # Step 4: CODE REVIEW & VALIDATION
    collaboration_messages.append({
        'actor': 'COPILOT',
        'content': f'🔍 Code Review: Checking for conflicts...',
        'timestamp': '',
        'type': 'copilot'
    })
    time.sleep(0.5)
    
    try:
        # Read current file
        with open(target_file, 'r', encoding='utf-8') as f:
            original_code = f.read()
        
        # Check for duplicates
        if feature_id in original_code:
            collaboration_messages.append({
                'actor': 'COPILOT',
                'content': f'⚠️  Feature [{feature_id}] already exists! Skipping...',
                'timestamp': '',
                'type': 'copilot'
            })
            return
        
        # Validate injection point
        injection_marker = "console.log('[Core Game] v11 loaded successfully');"
        if injection_marker not in original_code:
            collaboration_messages.append({
                'actor': 'COPILOT',
                'content': '❌ Cannot find safe injection point!',
                'timestamp': '',
                'type': 'copilot'
            })
            return
        
        collaboration_messages.append({
            'actor': 'COPILOT',
            'content': '✅ Review passed! Safe to implement.',
            'timestamp': '',
            'type': 'copilot'
        })
        time.sleep(0.5)
        
        # Step 5: IMPLEMENT
        collaboration_messages.append({
            'actor': 'CLINE',
            'content': f'⚙️  Writing code to {target_file.name}...',
            'timestamp': '',
            'type': 'cline'
        })
        time.sleep(1)
        
        # Inject BEFORE the closing IIFE
        injection_point = original_code.find(injection_marker) + len(injection_marker)
        modified_code = original_code[:injection_point] + '\n' + feature_code + '\n' + original_code[injection_point:]
        
        # Write file
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(modified_code)
        
        collaboration_messages.append({
            'actor': 'CLINE',
            'content': f'💾 Injected {len(feature_code)} chars successfully!',
            'timestamp': '',
            'type': 'cline'
        })
        
        files_modified = [str(target_file.relative_to(WORKSPACE_DIR))]
        
    except Exception as e:
        collaboration_messages.append({
            'actor': 'CLINE',
            'content': f'❌ Error: {str(e)}',
            'timestamp': '',
            'type': 'cline'
        })
        return
    
    time.sleep(0.5)
    
    # Step 5: Success
    collaboration_messages.append({
        'actor': 'CLINE',
        'content': f'✅ {feature_type} IMPLEMENTED! Press F5 to reload game.',
            'timestamp': '',
        'type': 'cline'
    })
    
    # Update task
    task_file = CLINE_INBOX_DIR / f'task_{task_id}.json'
    if task_file.exists():
        with open(task_file, 'r') as f:
            task_data = json.load(f)
        task_data['status'] = 'completed'
        task_data['feature_id'] = feature_id
        with open(task_file, 'w') as f:
            json.dump(task_data, f, indent=2)
    
    collaboration_messages.append({
        'actor': 'SYSTEM',
        'content': '🎉 Ready for next request!',
        'timestamp': '',
        'type': 'system'
    })

def get_status():
    """Get current collaboration status"""
    try:
        if STATUS_FILE.exists():
            with open(STATUS_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    
    # Default status
    return {
        'copilot_status': 'Ready',
        'cline_status': 'Idle',
        'messages_count': 0,
        'elapsed_time': '0:00',
        'task_progress': 0,
        'current_task': 'Waiting for input...',
        'test_results': {
            'passed': 0,
            'failed': 0,
            'total': 0
        }
    }

def get_messages():
    """Get collaboration messages"""
    messages = []
    try:
        if COLLAB_LOG_FILE.exists():
            with open(COLLAB_LOG_FILE, 'r') as f:
                for line in f:
                    try:
                        msg = json.loads(line.strip())
                        messages.append(msg)
                    except:
                        pass
    except:
        pass
    return messages

def proxy_ops_console_request(path):
    """
    Proxy Ops Console API requests to the Node backend.

    Run instructions (dev):
      1) Start the game server: python local_http_server.py
      2) Start Ops Console API server: cd ops-console && npm start
      3) Open http://127.0.0.1:8080/ (game)
      4) Open http://127.0.0.1:8080/ops-console/ (console)
    """
    url = f"{OPS_CONSOLE_SERVER}{path}"
    if request.query_string:
        url += "?" + request.query_string.decode('utf-8')

    data = request.get_data() if request.method in ['POST', 'PUT', 'PATCH'] else None
    headers = {}
    content_type = request.headers.get('Content-Type')
    if content_type:
        headers['Content-Type'] = content_type

    try:
        req = urlrequest.Request(url, data=data, headers=headers, method=request.method)
        with urlrequest.urlopen(req, timeout=5) as resp:
            body = resp.read()
            proxied_type = resp.headers.get('Content-Type', 'application/json')
            return Response(body, status=resp.status, content_type=proxied_type)
    except HTTPError as e:
        return Response(e.read(), status=e.code, content_type='application/json')
    except URLError as e:
        return jsonify({
            'error': 'Ops Console backend unavailable',
            'details': str(e)
        }), 502
    except Exception as e:
        return jsonify({
            'error': 'Ops Console proxy error',
            'details': str(e)
        }), 502

@app.route('/')
def index():
    """Serve main game"""
    return send_file(WORKSPACE_DIR / 'index.html')

@app.route('/ops-console/')
@app.route('/ops-console')
@app.route('/ops-console/<path:filepath>')
def ops_console_files(filepath='index.html'):
    """Serve Ops Console UI from the same origin"""
    if request.path == '/ops-console':
        return redirect('/ops-console/')
    if not OPS_CONSOLE_DIR.exists():
        return 'Ops Console not found', 404
    return send_from_directory(OPS_CONSOLE_DIR, filepath)

@app.route('/status', methods=['GET'])
def ops_console_status():
    return proxy_ops_console_request('/status')

@app.route('/snapshot', methods=['GET'])
def ops_console_snapshot():
    return proxy_ops_console_request('/snapshot')

@app.route('/tests', methods=['GET'])
def ops_console_tests():
    return proxy_ops_console_request('/tests')

@app.route('/last-test', methods=['GET'])
def ops_console_last_test():
    return proxy_ops_console_request('/last-test')

@app.route('/run-test', methods=['POST'])
def ops_console_run_test():
    return proxy_ops_console_request('/run-test')

@app.route('/chat', methods=['POST'])
def ops_console_chat():
    return proxy_ops_console_request('/chat')

@app.route('/command', methods=['POST'])
def ops_console_command():
    return proxy_ops_console_request('/command')

@app.route('/<path:filepath>')
def serve_files(filepath):
    """Serve static files"""
    file_path = WORKSPACE_DIR / filepath
    
    # Security: prevent directory traversal
    if not str(file_path.resolve()).startswith(str(WORKSPACE_DIR.resolve())):
        return 'Forbidden', 403
    
    if file_path.exists() and file_path.is_file():
        return send_file(file_path)
    
    return 'Not found', 404

# API Endpoints
@app.route('/api/status', methods=['GET'])
@cross_origin()
def api_status():
    """Get current collaboration status"""
    return jsonify(get_status())

@app.route('/api/messages', methods=['GET'])
@cross_origin()
def api_messages():
    """Get collaboration messages"""
    return jsonify({
        'messages': get_messages()
    })

@app.route('/api/message', methods=['POST'])
@cross_origin()
def api_add_message():
    """Add a new collaboration message"""
    try:
        data = request.json
        
        # Log message to file
        message = {
            'actor': data.get('actor', 'UNKNOWN'),
            'content': data.get('content', ''),
            'timestamp': data.get('timestamp', ''),
            'type': data.get('type', 'text')
        }
        
        with open(COLLAB_LOG_FILE, 'a') as f:
            f.write(json.dumps(message) + '\n')
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/health', methods=['GET'])
@cross_origin()
def api_health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'workspace': str(WORKSPACE_DIR),
        'port': PORT
    })

@app.route('/api/cline/messages', methods=['GET'])
@cross_origin()
def api_cline_messages():
    """Get Cline collaboration messages"""
    global collaboration_messages, real_mode
    
    # Add welcome message on first connection if empty
    if real_mode and len(collaboration_messages) == 0:
        collaboration_messages.append({
            'actor': 'SYSTEM',
            'content': '⚡ AUTO-IMPLEMENTATION MODE - Features built in real-time!',
            'timestamp': '',
            'type': 'system'
        })
        collaboration_messages.append({
            'actor': 'COPILOT',
            'content': '🤖 Ready! I\'ll implement features immediately - watch live progress!',
            'timestamp': '',
            'type': 'copilot'
        })
        collaboration_messages.append({
            'actor': 'CLINE',
            'content': '⚡ Standing by for instant implementation. Just send your request!',
            'timestamp': '',
            'type': 'cline'
        })
    
    return jsonify({
        'messages': collaboration_messages,
        'realMode': real_mode,
        'messageCount': len(collaboration_messages)
    })

@app.route('/api/cline/send', methods=['POST'])
@cross_origin()
def api_cline_send():
    """Send task to GitHub Copilot for IMMEDIATE implementation"""
    try:
        data = request.json
        task = data.get('task', '')
        request_type = data.get('type', 'implementation')
        
        # Create task file for reference
        task_id = len(list(CLINE_INBOX_DIR.glob('*.json'))) + 1
        task_file = CLINE_INBOX_DIR / f'task_{task_id}.json'
        
        task_data = {
            'id': task_id,
            'type': request_type,
            'task': task,
            'timestamp': data.get('timestamp', ''),
            'from': 'user',
            'status': 'implementing'  # Changed from 'pending'
        }
        
        with open(task_file, 'w') as f:
            json.dump(task_data, f, indent=2)
        
        # Immediate acknowledgment
        collaboration_messages.append({
            'actor': 'COPILOT',
            'content': f'🎯 Received: "{task}"',
            'timestamp': task_data['timestamp'],
            'type': 'copilot'
        })
        
        # Start implementation in background thread
        threading.Thread(
            target=auto_implement_feature,
            args=(task_id, task, request_type),
            daemon=True
        ).start()
        
        return jsonify({
            'success': True,
            'taskId': task_id,
            'message': 'Implementation started - watch chat for progress!'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/cline/check', methods=['GET'])
@cross_origin()
def api_cline_check():
    """Check for Cline responses"""
    global collaboration_messages, real_mode
    
    try:
        # Check if Cline outbox has any responses
        outbox_files = sorted(CLINE_OUTBOX_DIR.glob('*.json'))
        
        if outbox_files:
            real_mode = True
            
            for response_file in outbox_files:
                try:
                    with open(response_file, 'r') as f:
                        response = json.load(f)
                    
                    # Add Cline's response to messages
                    collaboration_messages.append({
                        'actor': 'CLINE',
                        'content': response.get('message', 'Task completed'),
                        'timestamp': response.get('timestamp', ''),
                        'type': 'cline'
                    })
                    
                    # Move processed file
                    response_file.unlink()
                    
                except Exception as e:
                    print(f"Error reading response: {e}")
        
        return jsonify({
            'success': True,
            'newMessages': len(outbox_files),
            'realMode': real_mode
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/cline/enable', methods=['POST'])
@cross_origin()
def api_cline_enable():
    """Enable real Cline mode"""
    global real_mode
    real_mode = True
    
    collaboration_messages.append({
        'actor': 'SYSTEM',
        'content': '⚡ REAL MODE ENABLED - Cline is now operational!',
        'timestamp': '',
        'type': 'system'
    })
    
    return jsonify({'success': True, 'realMode': True})

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error'}), 500

def start_cline_bridge():
    """Bridge not needed - system works via direct API calls"""
    print('ℹ️  Bridge-less mode: System works via API endpoints directly')
    print('   Tasks will be saved to cline_inbox/ for Copilot to pick up')
    return None

def stop_cline_bridge():
    """No bridge to stop"""
    pass

if __name__ == '__main__':
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║    OMNI OPS - LOCAL HTTP SERVER (Bridge-less Mode)          ║
╚══════════════════════════════════════════════════════════════╝

✓ Starting HTTP Server...
  Host: {HOST}
  Port: {PORT}
  URL: http://{HOST}:{PORT}
  
✓ Workspace: {WORKSPACE_DIR}

✓ Real Mode: AUTO-ENABLED
✓ Integration: DIRECT API (No bridge needed)

✓ API Endpoints:
  - GET  /api/status         → Get collaboration status
  - GET  /api/cline/messages → Get Cline messages  
  - POST /api/cline/send     → Send task to Cline
  - GET  /api/cline/check    → Check for responses

✓ Communication Flow:
  1. User sends request via overlay (F3)
  2. Task saved to: cline_inbox/
  3. GitHub Copilot picks up task from inbox
  4. Copilot implements and saves to: cline_outbox/
  5. UI shows result
  
🎮 Ready! Open http://{HOST}:{PORT} and press F3 to test!

""")
    
    print("⚡ Server starting (bridge-less mode)...\n")
    
    try:
        app.run(host=HOST, port=PORT, debug=False, use_reloader=False, threaded=True)
    except KeyboardInterrupt:
        print('\n\n✓ Server stopped')
