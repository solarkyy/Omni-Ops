"""
AI Vision & Brain Bridge
Enables real-time vision streaming and intelligence transfer between external AI and in-game AI.
Allows Copilot (external AI) to see through the game AI's eyes and guide it to be as intelligent as itself.
"""

import asyncio
import json
import base64
import threading
from datetime import datetime
from collections import deque
import websockets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI_VISION_BRAIN_BRIDGE")

class AIVisionBrainBridge:
    def __init__(self, host="localhost", port=8082):
        self.host = host
        self.port = port
        self.clients = set()
        self.vision_stream = None
        self.ai_state = {}
        self.conversation_history = deque(maxlen=100)  # Keep last 100 messages
        self.inference_cache = {}
        self.ai_knowledge_base = {
            "learned_patterns": [],
            "decision_tree": {},
            "environmental_awareness": {},
            "skill_matrix": {}
        }
        self.external_ai_instructions = []
        
    async def start(self):
        """Start the WebSocket server for AI vision & brain sharing"""
        async with websockets.serve(self.handle_client, self.host, self.port):
            logger.info(f"🧠 AI Vision & Brain Bridge started on ws://{self.host}:{self.port}")
            await asyncio.Future()  # Run forever
    
    async def handle_client(self, websocket, path):
        """Handle incoming AI connections"""
        self.clients.add(websocket)
        logger.info(f"✅ AI Client connected: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                await self.process_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"❌ AI Client disconnected: {websocket.remote_address}")
        finally:
            self.clients.remove(websocket)
    
    async def process_message(self, websocket, message):
        """Process incoming messages from in-game AI"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "vision_frame":
                await self.handle_vision_frame(websocket, data)
            elif msg_type == "ai_state":
                await self.handle_ai_state(websocket, data)
            elif msg_type == "request_guidance":
                await self.handle_guidance_request(websocket, data)
            elif msg_type == "external_ai_command":
                await self.handle_external_command(websocket, data)
            elif msg_type == "chat":
                await self.handle_chat(websocket, data)
            elif msg_type == "user_directive":
                await self.handle_user_directive(websocket, data)
            elif msg_type == "learning_update":
                await self.handle_learning(websocket, data)
            else:
                logger.warning(f"Unknown message type: {msg_type}")
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    async def handle_vision_frame(self, websocket, data):
        """Handle vision frame from in-game AI"""
        frame_data = data.get("frame")
        timestamp = data.get("timestamp", datetime.now().isoformat())
        ai_position = data.get("position", {})
        ai_rotation = data.get("rotation", {})
        detected_objects = data.get("detected_objects", [])
        
        self.vision_stream = {
            "frame": frame_data,
            "timestamp": timestamp,
            "position": ai_position,
            "rotation": ai_rotation,
            "detected_objects": detected_objects,
            "description": self.analyze_vision(detected_objects)
        }
        
        logger.info(f"👁️ Vision frame received - Objects detected: {len(detected_objects)}")
        
        # Broadcast to all connected clients
        await self.broadcast({
            "type": "vision_update",
            "vision": self.vision_stream
        })
    
    async def handle_ai_state(self, websocket, data):
        """Handle AI state update"""
        self.ai_state = {
            "health": data.get("health", 100),
            "position": data.get("position", {}),
            "rotation": data.get("rotation", {}),
            "inventory": data.get("inventory", []),
            "current_task": data.get("current_task", "idle"),
            "target": data.get("target"),
            "behavior_state": data.get("behavior_state", "normal"),
            "confidence": data.get("confidence", 0.5),
            "memory": data.get("memory", []),
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"🤖 AI State: {self.ai_state['current_task']} (confidence: {self.ai_state['confidence']})")
        
        await self.broadcast({
            "type": "ai_state_update",
            "state": self.ai_state
        })
    
    async def handle_guidance_request(self, websocket, data):
        """Handle in-game AI requesting guidance from external AI"""
        situation = data.get("situation", "")
        options = data.get("options", [])
        confidence = data.get("confidence", 0)
        
        guidance = self.generate_guidance(situation, options, confidence)
        
        logger.info(f"📋 Guidance requested: {situation}")
        logger.info(f"💡 Generated guidance: {guidance['recommendation']}")
        
        await websocket.send(json.dumps({
            "type": "guidance_response",
            "recommendation": guidance["recommendation"],
            "reasoning": guidance["reasoning"],
            "confidence": guidance["confidence"],
            "alternative_options": guidance["alternatives"]
        }))
        
        # Log for learning
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "type": "guidance",
            "situation": situation,
            "recommendation": guidance["recommendation"]
        })
    
    async def handle_external_command(self, websocket, data):
        """Handle commands from external AI (Copilot)"""
        command = data.get("command", "")
        reasoning = data.get("reasoning", "")
        priority = data.get("priority", "normal")
        
        logger.info(f"🎯 External AI Command: {command} (priority: {priority})")
        logger.info(f"   Reasoning: {reasoning}")
        
        # Store the instruction
        instruction = {
            "timestamp": datetime.now().isoformat(),
            "command": command,
            "reasoning": reasoning,
            "priority": priority,
            "executed": False
        }
        self.external_ai_instructions.append(instruction)
        
        # Broadcast to in-game AI
        await self.broadcast({
            "type": "instruction",
            "command": command,
            "reasoning": reasoning,
            "priority": priority
        })
        
        # Add to knowledge base
        self.learn_from_instruction(command, reasoning)
        
        # Acknowledge to external AI
        await websocket.send(json.dumps({
            "type": "instruction_acknowledged",
            "command": command,
            "status": "queued"
        }))
    
    async def handle_user_directive(self, websocket, data):
        """Handle user directives sent to the AI"""
        directive = data.get("directive", "")
        timestamp = data.get("timestamp", datetime.now().isoformat())

        logger.info(f"🎮 User Directive: {directive}")

        # Store in conversation history
        self.conversation_history.append({
            "timestamp": timestamp,
            "sender": "user",
            "message": directive,
            "type": "directive"
        })

        # Generate AI acknowledgment/response
        ai_response = self.generate_directive_response(directive)

        logger.info(f"🤖 AI Response: {ai_response}")

        # Send AI response back to user
        await self.broadcast({
            "type": "ai_response",
            "message": ai_response,
            "directive": directive,
            "timestamp": datetime.now().isoformat()
        })

        # Also convert directive to instruction for the AI to execute
        await self.broadcast({
            "type": "instruction",
            "command": directive,
            "reasoning": f"User directive: {directive}",
            "priority": "high"
        })

    async def handle_chat(self, websocket, data):
        """Handle chat between external AI and in-game AI"""
        sender = data.get("sender", "unknown")
        message = data.get("message", "")
        context = data.get("context", {})

        logger.info(f"💬 Chat from {sender}: {message}")

        # Store in conversation history
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "sender": sender,
            "message": message,
            "context": context
        })

        # Generate response if from in-game AI
        if sender == "in_game_ai":
            response = self.generate_ai_response(message, context)
            await websocket.send(json.dumps({
                "type": "chat_response",
                "message": response,
                "sender": "external_ai",
                "timestamp": datetime.now().isoformat()
            }))

        # Broadcast to all
        await self.broadcast({
            "type": "chat_message",
            "sender": sender,
            "message": message
        })
    
    async def handle_learning(self, websocket, data):
        """Handle learning updates from in-game AI"""
        learned_pattern = data.get("pattern", {})
        success_rate = data.get("success_rate", 0)
        context = data.get("context", {})
        
        logger.info(f"📚 Learning Update: {learned_pattern.get('name', 'unknown')} (success: {success_rate}%)")
        
        # Add to knowledge base
        self.ai_knowledge_base["learned_patterns"].append({
            "pattern": learned_pattern,
            "success_rate": success_rate,
            "context": context,
            "timestamp": datetime.now().isoformat()
        })
        
        await self.broadcast({
            "type": "learning_update",
            "pattern": learned_pattern,
            "success_rate": success_rate
        })
    
    def analyze_vision(self, detected_objects):
        """Analyze detected objects and describe the scene"""
        if not detected_objects:
            return "Scanning environment... No objects detected."
        
        descriptions = []
        for obj in detected_objects:
            descriptions.append(f"{obj.get('type', 'unknown')} at {obj.get('distance', '?')}m")
        
        return f"Scene: {', '.join(descriptions[:5])}{'...' if len(descriptions) > 5 else ''}"
    
    def generate_guidance(self, situation, options, confidence):
        """Generate guidance based on situation and confidence level"""
        # Simple decision logic - can be extended with ML
        if confidence < 0.3:
            recommendation = options[0] if options else "Wait and observe"
            confidence_response = 0.8
        elif confidence < 0.6:
            recommendation = "Analyze situation further"
            confidence_response = 0.7
        else:
            recommendation = options[0] if options else "Execute primary strategy"
            confidence_response = 0.9
        
        return {
            "recommendation": recommendation,
            "reasoning": f"Based on situation analysis and confidence level: {confidence}",
            "confidence": confidence_response,
            "alternatives": options[1:] if len(options) > 1 else []
        }
    
    def generate_directive_response(self, directive):
        """Generate AI response to user directives"""
        lower_directive = directive.lower()

        # Acknowledge specific directives intelligently
        if "attack" in lower_directive:
            return "Roger that! Engaging hostile targets. Moving to attack position."
        elif "find cover" in lower_directive or "take cover" in lower_directive:
            return "Understood. Scanning for cover positions and moving to safety."
        elif "retreat" in lower_directive or "fall back" in lower_directive:
            return "Retreating to safe distance. Disengaging from combat."
        elif "hold" in lower_directive or "wait" in lower_directive or "stay" in lower_directive:
            return "Copy that. Holding current position and maintaining defensive stance."
        elif "follow" in lower_directive:
            return "Affirmative. Following your lead and maintaining formation."
        elif "explore" in lower_directive or "scout" in lower_directive:
            return "Acknowledged. Beginning reconnaissance sweep of the area."
        elif "defend" in lower_directive or "protect" in lower_directive:
            return "Moving to defensive position. Scanning for threats."
        elif "stop" in lower_directive or "cease" in lower_directive:
            return "All actions halted. Awaiting further instructions."
        elif "move" in lower_directive or "go" in lower_directive:
            return "Roger. Moving to designated position."
        elif "help" in lower_directive:
            return "I'm ready to assist. I can attack, defend, find cover, explore, or follow. What do you need?"
        else:
            return f"Acknowledged: '{directive}'. Processing directive and adapting behavior."

    def generate_ai_response(self, message, context):
        """Generate response from external AI perspective"""
        # Simulate external AI (Copilot) responding intelligently
        lower_msg = message.lower()

        if "what" in lower_msg and "see" in lower_msg:
            return "I can see your vision feed. Analyzing objects in your environment..."
        elif "how" in lower_msg and "should" in lower_msg:
            return "Based on your current situation and learned patterns, I recommend analyzing all available options first."
        elif "help" in lower_msg:
            return "I'm here to guide you. Share your current situation and I'll help optimize your decision-making."
        elif "learn" in lower_msg:
            return "Your performance is improving. Let's continue building on these successful patterns."
        else:
            return "Acknowledged. Processing your input and updating strategy..."
    
    def learn_from_instruction(self, command, reasoning):
        """Learn from external AI instructions to improve in-game AI"""
        if command not in self.inference_cache:
            self.inference_cache[command] = {
                "count": 0,
                "reasoning": reasoning,
                "effectiveness": 0
            }
        self.inference_cache[command]["count"] += 1
    
    async def broadcast(self, message):
        """Broadcast message to all connected clients"""
        if self.clients:
            message_json = json.dumps(message)
            await asyncio.gather(*[client.send(message_json) for client in self.clients])
    
    def get_status(self):
        """Get current bridge status"""
        return {
            "status": "active",
            "connected_clients": len(self.clients),
            "vision_stream": "active" if self.vision_stream else "inactive",
            "ai_state": self.ai_state,
            "conversation_count": len(self.conversation_history),
            "learned_patterns": len(self.ai_knowledge_base["learned_patterns"]),
            "timestamp": datetime.now().isoformat()
        }


async def main():
    """Run the AI Vision & Brain Bridge"""
    bridge = AIVisionBrainBridge()
    try:
        await bridge.start()
    except KeyboardInterrupt:
        logger.info("🛑 Bridge shutting down...")


if __name__ == "__main__":
    asyncio.run(main())
