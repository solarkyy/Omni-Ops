"""
AI Collaborative Bridge
Connects multiple AI agents for collaborative problem solving
"""

from agent_with_tracing import OmniAgent, setup_tracing
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import threading
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for browser access

# Global agent instance
agent = None
conversation_history = []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "AI Collaborative Bridge",
        "agent_ready": agent is not None
    })

@app.route('/query', methods=['POST'])
def process_query():
    """Process a query from external source"""
    try:
        data = request.json
        query = data.get('query', '')
        include_context = data.get('include_context', False)
        
        if not query:
            return jsonify({"error": "No query provided"}), 400
        
        # Process with agent
        response = agent.process_query(query, include_context=include_context)
        
        # Store in history
        conversation_history.append({
            "timestamp": time.time(),
            "query": query,
            "response": response
        })
        
        # Keep only last 100 messages
        if len(conversation_history) > 100:
            conversation_history.pop(0)
        
        return jsonify({
            "status": "success",
            "query": query,
            "response": response,
            "timestamp": time.time()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_file():
    """Analyze a specific file"""
    try:
        data = request.json
        file_path = data.get('file_path', '')
        
        if not file_path:
            return jsonify({"error": "No file path provided"}), 400
        
        analysis = agent.analyze_code(file_path)
        
        return jsonify({
            "status": "success",
            "file_path": file_path,
            "analysis": analysis
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/scan', methods=['GET'])
def scan_issues():
    """Scan codebase for issues"""
    try:
        issues = agent.scan_for_issues()
        
        return jsonify({
            "status": "success",
            "issues": issues,
            "summary": {
                "performance": len(issues['performance']),
                "bugs": len(issues['bugs']),
                "security": len(issues['security']),
                "code_quality": len(issues['code_quality'])
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/improve', methods=['POST'])
def suggest_improvements():
    """Get improvement suggestions for a file"""
    try:
        data = request.json
        file_path = data.get('file_path', '')
        
        if not file_path:
            return jsonify({"error": "No file path provided"}), 400
        
        suggestions = agent.auto_improve_code(file_path)
        
        return jsonify({
            "status": "success",
            "suggestions": suggestions
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/workspace', methods=['GET'])
def get_workspace_info():
    """Get workspace information"""
    try:
        return jsonify({
            "status": "success",
            "workspace": agent.codebase_context
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history', methods=['GET'])
def get_history():
    """Get conversation history"""
    limit = request.args.get('limit', 20, type=int)
    return jsonify({
        "status": "success",
        "history": conversation_history[-limit:]
    })

@app.route('/npc-decision', methods=['POST'])
def npc_decision():
    """AI-powered NPC decision making"""
    try:
        data = request.json
        npc_state = data.get('state', {})
        context = data.get('context', {})
        
        # Generate intelligent NPC decision
        decision = generate_npc_decision(npc_state, context)
        
        return jsonify({
            "status": "success",
            "decision": decision
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_npc_decision(state, context):
    """Generate intelligent NPC decision based on state and context"""
    npc_type = state.get('type', 'CITIZEN')
    health = state.get('health', 100)
    threat_level = context.get('threat_level', 0)
    nearby_players = context.get('nearby_players', [])
    time_of_day = context.get('time_of_day', 12)
    
    decision = {
        "action": "IDLE",
        "target": None,
        "priority": 0,
        "reasoning": ""
    }
    
    # Threat assessment
    if threat_level > 70 or health < 30:
        decision["action"] = "FLEE"
        decision["priority"] = 10
        decision["reasoning"] = "High threat or low health - retreating to safety"
    
    elif threat_level > 40 and npc_type in ["GUARD", "RAIDER"]:
        decision["action"] = "COMBAT"
        decision["priority"] = 8
        decision["target"] = nearby_players[0] if nearby_players else None
        decision["reasoning"] = "Combat-trained NPC engaging threat"
    
    # Social behavior for citizens
    elif npc_type == "CITIZEN":
        if 6 <= time_of_day <= 22:  # Daytime
            if nearby_players and threat_level < 20:
                decision["action"] = "APPROACH"
                decision["priority"] = 5
                decision["target"] = nearby_players[0]
                decision["reasoning"] = "Friendly NPC approaching player during daytime"
            else:
                decision["action"] = "PATROL"
                decision["priority"] = 3
                decision["reasoning"] = "Daily routine - patrolling area"
        else:  # Nighttime
            decision["action"] = "SLEEP"
            decision["priority"] = 2
            decision["reasoning"] = "Nighttime rest"
    
    # Trader behavior
    elif npc_type == "TRADER":
        if nearby_players and threat_level < 30:
            decision["action"] = "TRADE"
            decision["priority"] = 7
            decision["target"] = nearby_players[0]
            decision["reasoning"] = "Trader engaging customer"
        else:
            decision["action"] = "IDLE"
            decision["priority"] = 2
            decision["reasoning"] = "Waiting for customers"
    
    # Guard behavior
    elif npc_type == "GUARD":
        if threat_level > 20:
            decision["action"] = "ALERT"
            decision["priority"] = 6
            decision["reasoning"] = "Guard on alert - monitoring situation"
        else:
            decision["action"] = "PATROL"
            decision["priority"] = 4
            decision["reasoning"] = "Guard on routine patrol"
    
    # Raider behavior
    elif npc_type == "RAIDER":
        if nearby_players or threat_level > 0:
            decision["action"] = "COMBAT"
            decision["priority"] = 9
            decision["target"] = nearby_players[0] if nearby_players else None
            decision["reasoning"] = "Hostile raider engaging targets"
        else:
            decision["action"] = "PATROL"
            decision["priority"] = 5
            decision["reasoning"] = "Raider searching for targets"
    
    return decision

def start_bridge():
    """Start the collaborative bridge server"""
    global agent
    
    print("="*70)
    print("🌉 AI COLLABORATIVE BRIDGE")
    print("="*70)
    
    # Initialize tracing
    setup_tracing()
    
    # Create agent
    print("\nInitializing AI agent...")
    agent = OmniAgent(use_local=True)
    
    print("\n" + "="*70)
    print("BRIDGE ACTIVE - Endpoints:")
    print("="*70)
    print("  POST /query - Process query")
    print("  POST /analyze - Analyze file")
    print("  GET  /scan - Scan for issues")
    print("  POST /improve - Get improvements")
    print("  POST /npc-decision - AI NPC decisions")
    print("  GET  /workspace - Workspace info")
    print("  GET  /history - Conversation history")
    print("  GET  /health - Health check")
    print("="*70)
    print("\n🌐 Server running on http://localhost:5000")
    print("🔌 Ready to receive requests from external AIs and game systems\n")
    
    # Run Flask server
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)

if __name__ == "__main__":
    try:
        # Install Flask if not present
        try:
            import flask
            import flask_cors
        except ImportError:
            print("Installing required packages...")
            import subprocess
            subprocess.check_call(['pip', 'install', 'flask', 'flask-cors'])
            print("✓ Packages installed\n")
        
        start_bridge()
    except KeyboardInterrupt:
        print("\n\n👋 Bridge shutdown")
    except Exception as e:
        print(f"\n❌ Error: {e}")
