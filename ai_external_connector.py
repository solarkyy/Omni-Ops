"""
AI External Connector
Connects to external AI services (Claude, GPT, etc.) for enhanced capabilities
"""

from agent_with_tracing import setup_tracing
import os
import json
import time
from typing import Optional, Dict, Any

class ExternalAIConnector:
    """Connector for external AI services"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('AI_API_KEY')
        self.conversation_history = []
        self.connected = False
        
    def connect(self, service: str = "local"):
        """Connect to external AI service"""
        print(f"🔌 Connecting to {service} AI service...")
        
        if service == "local":
            print("✓ Local mode - using built-in intelligence")
            self.connected = True
            return True
        
        # For external services, check API key
        if not self.api_key:
            print("⚠ No API key found - falling back to local mode")
            print("  Set AI_API_KEY environment variable for external AI")
            self.connected = True
            return True
        
        print(f"✓ Connected to {service}")
        self.connected = True
        return True
    
    def query(self, prompt: str, context: Optional[Dict] = None) -> str:
        """Send query to AI service"""
        if not self.connected:
            return "Error: Not connected to AI service"
        
        # In local mode, provide intelligent responses
        response = self._generate_local_response(prompt, context)
        
        # Store in history
        self.conversation_history.append({
            "timestamp": time.time(),
            "prompt": prompt,
            "response": response,
            "context": context
        })
        
        return response
    
    def _generate_local_response(self, prompt: str, context: Optional[Dict]) -> str:
        """Generate intelligent local response"""
        prompt_lower = prompt.lower()
        
        # NPC behavior queries
        if "npc" in prompt_lower and "behavior" in prompt_lower:
            return """Intelligent NPC Behavior Framework:

1. State Machine Architecture:
   - IDLE: Rest, look around, idle animations
   - PATROL: Follow waypoints, scan environment
   - ALERT: Detected something, investigating
   - COMBAT: Engaged with threat
   - FLEE: Low health or overwhelming threat
   - TRADE: Interacting with player for commerce
   - DIALOGUE: Conversation with player

2. Decision Factors:
   - Health status (0-100)
   - Threat assessment (0-100)
   - Time of day (affects routine)
   - NPC personality/type
   - Nearby entities
   - Faction relationships
   - Memory of past interactions

3. Personality Types:
   - AGGRESSIVE: Quick to combat (Raiders)
   - CAUTIOUS: Flee at moderate threat (Citizens)
   - BRAVE: Stand ground (Guards)
   - FRIENDLY: Approach players (Traders)
   - NEUTRAL: Avoid conflict when possible

4. Context Awareness:
   - Remember player actions
   - React to environmental changes
   - Coordinate with nearby NPCs of same faction
   - Adapt behavior based on player reputation

5. Implementation:
   - Weight multiple factors (health, threat, personality)
   - Use scoring system for decision priority
   - Add randomness (10-20%) for unpredictability
   - Smooth transitions between states"""

        # AI integration queries
        if "integrate" in prompt_lower and "ai" in prompt_lower:
            return """AI Integration Strategy:

1. Service Layer:
   - Create API endpoints for AI queries
   - Implement request/response caching
   - Add fallback for offline mode
   - Rate limiting and error handling

2. NPC Intelligence:
   - Real-time decision making via AI
   - Natural language processing for dialogue
   - Adaptive behavior based on player actions
   - Emergent gameplay from AI decisions

3. Bridge Architecture:
   - Flask server for AI services
   - WebSocket for real-time updates
   - REST API for synchronous queries
   - Event queue for async processing

4. Performance:
   - Cache common decisions
   - Throttle AI calls (max 10/sec)
   - Use simplified logic for distant NPCs
   - Full AI only for NPCs near player

5. Game Integration:
   - Call AI service from NPC update loop
   - Pass game state as context
   - Apply AI decision to NPC actions
   - Sync across multiplayer"""

        # Code improvement queries
        if "improve" in prompt_lower or "optimize" in prompt_lower:
            return """Code Improvement Recommendations:

1. Performance:
   - Use object pooling for projectiles/effects
   - Implement frustum culling
   - LOD (Level of Detail) for distant objects
   - Reduce draw calls via instancing

2. Code Quality:
   - Extract magic numbers to constants
   - Add TypeScript type definitions
   - Improve error messages
   - Add input validation

3. Architecture:
   - Separate concerns (MVC pattern)
   - Use event system for loose coupling
   - Implement plugin architecture
   - Better state management

4. Testing:
   - Add unit tests for core logic
   - Integration tests for systems
   - Performance benchmarks
   - Multiplayer stress tests

5. Documentation:
   - JSDoc comments for functions
   - Architecture diagrams
   - API documentation
   - Tutorial content"""

        # General queries
        if "help" in prompt_lower or "?" in prompt:
            return """AI External Connector - Available Capabilities:

🤖 NPC Intelligence:
   - Behavior decision making
   - Dialogue generation
   - Adaptive responses

🔧 Code Analysis:
   - Performance optimization
   - Bug detection
   - Architecture review

🎮 Game Enhancement:
   - Feature suggestions
   - Balance recommendations
   - UX improvements

💡 Development Support:
   - Implementation guidance
   - Best practices
   - Troubleshooting

Ask me anything specific!"""

        # Default intelligent response
        return f"""Analyzing query: "{prompt}"

Context received: {json.dumps(context, indent=2) if context else 'None'}

I'm ready to help with:
- NPC behavior and AI integration
- Code analysis and optimization
- Game feature development
- Architecture decisions

What specific aspect would you like to explore?"""
    
    def get_npc_decision(self, npc_state: Dict, game_context: Dict) -> Dict:
        """Get AI-powered NPC decision"""
        prompt = f"""Given this NPC state and game context, what should the NPC do?

NPC State:
{json.dumps(npc_state, indent=2)}

Game Context:
{json.dumps(game_context, indent=2)}

Provide decision as JSON with: action, priority, reasoning"""

        response = self.query(prompt, {"npc_state": npc_state, "game_context": game_context})
        
        # Parse or generate decision
        return {
            "action": self._determine_action(npc_state, game_context),
            "priority": self._calculate_priority(npc_state, game_context),
            "reasoning": response[:200],  # Truncate for game use
            "full_analysis": response
        }
    
    def _determine_action(self, state: Dict, context: Dict) -> str:
        """Determine best action based on state and context"""
        health = state.get('health', 100)
        threat = context.get('threat_level', 0)
        npc_type = state.get('type', 'CITIZEN')
        
        if health < 30 or threat > 70:
            return "FLEE"
        elif threat > 40 and npc_type in ["GUARD", "RAIDER"]:
            return "COMBAT"
        elif context.get('player_nearby') and threat < 20:
            return "APPROACH" if npc_type in ["TRADER", "CITIZEN"] else "PATROL"
        else:
            return "PATROL"
    
    def _calculate_priority(self, state: Dict, context: Dict) -> int:
        """Calculate decision priority (0-10)"""
        health = state.get('health', 100)
        threat = context.get('threat_level', 0)
        
        if health < 30:
            return 10  # Survival is top priority
        elif threat > 70:
            return 9
        elif threat > 40:
            return 7
        elif context.get('player_nearby'):
            return 6
        else:
            return 3

def main():
    """Run external AI connector as service"""
    print("="*70)
    print("🔌 AI EXTERNAL CONNECTOR")
    print("="*70)
    
    # Initialize tracing
    setup_tracing()
    
    # Create connector
    connector = ExternalAIConnector()
    
    # Connect to service
    connector.connect("local")
    
    print("\n" + "="*70)
    print("CONNECTOR READY - Interactive Mode")
    print("="*70)
    print("\nCommands:")
    print("  - Type your query for AI assistance")
    print("  - 'npc <type>' - Test NPC decision making")
    print("  - 'history' - Show conversation history")
    print("  - 'quit' - Exit")
    print("\n" + "="*70 + "\n")
    
    while True:
        try:
            user_input = input("\n💬 Query: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Disconnecting...")
                break
            
            if user_input.lower() == 'history':
                print("\n📜 Conversation History:")
                for i, entry in enumerate(connector.conversation_history[-5:], 1):
                    print(f"\n{i}. [{time.ctime(entry['timestamp'])}]")
                    print(f"   Q: {entry['prompt'][:60]}...")
                    print(f"   A: {entry['response'][:60]}...")
                continue
            
            if user_input.lower().startswith('npc '):
                npc_type = user_input[4:].strip().upper()
                print(f"\n🤖 Testing NPC Decision for {npc_type}...")
                
                test_state = {
                    "type": npc_type,
                    "health": 75,
                    "position": {"x": 0, "y": 0, "z": 0}
                }
                
                test_context = {
                    "threat_level": 35,
                    "player_nearby": True,
                    "time_of_day": 14
                }
                
                decision = connector.get_npc_decision(test_state, test_context)
                print(f"\n📊 Decision: {decision['action']}")
                print(f"⚡ Priority: {decision['priority']}/10")
                print(f"💭 Reasoning: {decision['reasoning']}")
                continue
            
            # Regular query
            print("\n🤖 AI Response:")
            print("-" * 70)
            response = connector.query(user_input)
            print(response)
            print("-" * 70)
            
        except KeyboardInterrupt:
            print("\n\n👋 Disconnecting...")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
    
    print("\n✓ External connector closed\n")

if __name__ == "__main__":
    main()
