"""
OMNI-OPS AI GAME PLAYER
Autonomous AI that can actually play the game while you watch in real-time.
"""

import time
import math
import random
import json
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

@dataclass
class Vector3:
    x: float
    y: float
    z: float
    
    def distance_to(self, other: 'Vector3') -> float:
        return math.sqrt((self.x - other.x)**2 + (self.y - other.y)**2 + (self.z - other.z)**2)
    
    def angle_to(self, other: 'Vector3') -> Tuple[float, float]:
        """Returns (yaw, pitch) to look at other position"""
        dx = other.x - self.x
        dz = other.z - self.z
        dy = other.y - self.y
        
        yaw = math.atan2(dx, dz)
        dist = math.sqrt(dx*dx + dz*dz)
        pitch = -math.atan2(dy, dist)
        
        return (yaw, pitch)

@dataclass
class Enemy:
    id: str
    position: Vector3
    health: float
    faction: str
    distance: float
    is_hostile: bool

@dataclass
class GameState:
    player_position: Vector3
    player_health: float
    player_ammo: int
    player_reserve_ammo: int
    player_stamina: float
    enemies: List[Enemy]
    objects_count: int
    yaw: float
    pitch: float
    is_sprinting: bool
    is_crouching: bool
    is_reloading: bool
    on_ground: bool

class AIState(Enum):
    IDLE = "idle"
    EXPLORING = "exploring"
    ENGAGING = "engaging"
    TAKING_COVER = "taking_cover"
    RELOADING = "reloading"
    HEALING = "healing"
    RETREATING = "retreating"

class AIGamePlayer:
    """Autonomous AI player that can play the game"""
    
    def __init__(self, game_bridge):
        self.bridge = game_bridge
        self.state = AIState.IDLE
        self.current_target: Optional[Enemy] = None
        self.exploration_waypoint: Optional[Vector3] = None
        self.last_shot_time = 0
        self.last_state_update = 0
        self.decision_cooldown = 0.1  # Make decisions every 100ms
        
        # AI Personality/Difficulty Settings
        self.aim_accuracy = 0.85  # 85% accuracy
        self.reaction_time = 0.2  # 200ms reaction time
        self.aggression = 0.7  # 70% aggressive (vs defensive)
        self.awareness_range = 50  # Can "see" enemies within 50 units
        
        # Statistics
        self.stats = {
            'kills': 0,
            'deaths': 0,
            'shots_fired': 0,
            'shots_hit': 0,
            'distance_traveled': 0,
            'time_survived': 0,
            'enemies_spotted': 0,
            'cover_taken': 0
        }
        
        self.running = False
        self.thought_process = []
        
    def start(self):
        """Start the AI player"""
        self.running = True
        self.stats['time_survived'] = time.time()
        self.log_thought("AI Player activated. Beginning autonomous operation.")
        
    def stop(self):
        """Stop the AI player"""
        self.running = False
        self.release_all_inputs()
        self.log_thought("AI Player deactivated.")
        
    def log_thought(self, thought: str):
        """Log AI's thought process for debugging/viewing"""
        timestamp = time.strftime("%H:%M:%S")
        self.thought_process.append(f"[{timestamp}] {thought}")
        # Keep only last 20 thoughts
        if len(self.thought_process) > 20:
            self.thought_process.pop(0)
        print(f"[AI] {thought}")
        
    def get_game_state(self) -> Optional[GameState]:
        """Get current game state from bridge"""
        try:
            state_data = self.bridge.get_game_state()
            if not state_data:
                return None
                
            # Parse game state
            enemies = []
            if 'enemies' in state_data:
                for e in state_data['enemies']:
                    pos = Vector3(e['x'], e['y'], e['z'])
                    enemies.append(Enemy(
                        id=e['id'],
                        position=pos,
                        health=e['health'],
                        faction=e['faction'],
                        distance=e['distance'],
                        is_hostile=e['faction'] in ['RAIDER', 'HOSTILE']
                    ))
            
            player_pos = Vector3(
                state_data['player']['x'],
                state_data['player']['y'],
                state_data['player']['z']
            )
            
            return GameState(
                player_position=player_pos,
                player_health=state_data['player']['health'],
                player_ammo=state_data['player']['ammo'],
                player_reserve_ammo=state_data['player']['reserveAmmo'],
                player_stamina=state_data['player']['stamina'],
                enemies=enemies,
                objects_count=state_data.get('objectsCount', 0),
                yaw=state_data['player'].get('yaw', 0),
                pitch=state_data['player'].get('pitch', 0),
                is_sprinting=state_data['player'].get('isSprinting', False),
                is_crouching=state_data['player'].get('isCrouching', False),
                is_reloading=state_data['player'].get('isReloading', False),
                on_ground=state_data['player'].get('onGround', True)
            )
        except Exception as e:
            print(f"[AI] Error getting game state: {e}")
            return None
    
    def make_decision(self, state: GameState):
        """Main AI decision-making logic"""
        
        # Critical: Health check
        if state.player_health < 30:
            if self.state != AIState.RETREATING:
                self.state = AIState.RETREATING
                self.log_thought(f"⚠️ Health critical ({state.player_health:.0f}HP) - RETREATING!")
            return self.execute_retreat(state)
        
        # Priority: Reload if low ammo and safe
        if state.player_ammo < 10 and state.player_reserve_ammo > 0:
            nearby_enemies = [e for e in state.enemies if e.distance < 20 and e.is_hostile]
            if not nearby_enemies:
                if self.state != AIState.RELOADING:
                    self.state = AIState.RELOADING
                    self.log_thought(f"🔄 Reloading ({state.player_ammo} rounds left)")
                return self.execute_reload()
        
        # Find hostile enemies in awareness range
        hostile_enemies = [
            e for e in state.enemies 
            if e.is_hostile and e.distance < self.awareness_range
        ]
        
        if hostile_enemies:
            # Sort by threat (closer = higher threat)
            hostile_enemies.sort(key=lambda e: e.distance)
            self.current_target = hostile_enemies[0]
            
            if self.state != AIState.ENGAGING:
                self.state = AIState.ENGAGING
                self.stats['enemies_spotted'] += 1
                self.log_thought(f"🎯 Enemy spotted at {self.current_target.distance:.1f}m - ENGAGING!")
            
            return self.execute_combat(state, self.current_target)
        
        else:
            # No enemies - explore
            if self.state != AIState.EXPLORING:
                self.state = AIState.EXPLORING
                self.exploration_waypoint = self.generate_exploration_waypoint(state)
                self.log_thought(f"🔍 Area clear - exploring...")
            
            return self.execute_exploration(state)
    
    def execute_combat(self, state: GameState, target: Enemy):
        """Execute combat behavior"""
        
        # Calculate aim towards enemy
        yaw_target, pitch_target = state.player_position.angle_to(target.position)
        
        # Apply accuracy variation
        yaw_error = random.gauss(0, (1 - self.aim_accuracy) * 0.1)
        pitch_error = random.gauss(0, (1 - self.aim_accuracy) * 0.1)
        
        yaw_target += yaw_error
        pitch_target += pitch_error
        
        # Aim at target
        self.set_look_direction(yaw_target, pitch_target)
        
        # Movement strategy based on distance
        if target.distance < 10:
            # Too close - strafe and back up
            self.set_movement(backward=True, strafe_left=random.random() > 0.5)
            self.log_thought(f"↔️ Enemy too close ({target.distance:.1f}m) - strafing!")
        elif target.distance > 30:
            # Too far - move closer
            self.set_movement(forward=True, sprint=state.player_stamina > 30)
        else:
            # Good distance - strafe while shooting
            if random.random() < 0.7:  # 70% chance to strafe
                self.set_movement(strafe_left=random.random() > 0.5)
        
        # Crouch for accuracy 30% of the time
        if random.random() < 0.3 and not state.is_crouching:
            self.press_key('crouch')
        
        # Shoot if aimed reasonably well
        yaw_diff = abs(yaw_target - state.yaw)
        pitch_diff = abs(pitch_target - state.pitch)
        
        if yaw_diff < 0.2 and pitch_diff < 0.2:  # Within aiming threshold
            current_time = time.time()
            if current_time - self.last_shot_time > 0.1:  # 10 shots per second max
                self.shoot()
                self.last_shot_time = current_time
                self.stats['shots_fired'] += 1
    
    def execute_retreat(self, state: GameState):
        """Retreat to safety when low health"""
        # Run away from nearest enemy
        if state.enemies:
            nearest = min(state.enemies, key=lambda e: e.distance)
            # Run opposite direction
            flee_yaw = state.player_position.angle_to(nearest.position)[0] + math.pi
            self.set_look_direction(flee_yaw, 0)
            self.set_movement(forward=True, sprint=True)
        else:
            # Just run forward
            self.set_movement(forward=True, sprint=True)
    
    def execute_exploration(self, state: GameState):
        """Explore the map when no enemies"""
        if not self.exploration_waypoint:
            self.exploration_waypoint = self.generate_exploration_waypoint(state)
        
        # Check if reached waypoint
        distance = state.player_position.distance_to(self.exploration_waypoint)
        if distance < 5:
            self.exploration_waypoint = self.generate_exploration_waypoint(state)
            self.log_thought("📍 Waypoint reached - selecting new destination")
        
        # Move towards waypoint
        yaw_target, _ = state.player_position.angle_to(self.exploration_waypoint)
        self.set_look_direction(yaw_target, 0)
        self.set_movement(forward=True, sprint=state.player_stamina > 50)
    
    def generate_exploration_waypoint(self, state: GameState) -> Vector3:
        """Generate random exploration waypoint"""
        angle = random.uniform(0, 2 * math.pi)
        distance = random.uniform(20, 50)
        
        return Vector3(
            state.player_position.x + math.sin(angle) * distance,
            state.player_position.y,
            state.player_position.z + math.cos(angle) * distance
        )
    
    # === INPUT CONTROL METHODS ===
    
    def set_movement(self, forward=False, backward=False, strafe_left=False, 
                    strafe_right=False, sprint=False, crouch=False, jump=False):
        """Set movement keys"""
        self.bridge.set_input('moveForward', forward)
        self.bridge.set_input('moveBackward', backward)
        self.bridge.set_input('moveLeft', strafe_left)
        self.bridge.set_input('moveRight', strafe_right)
        self.bridge.set_input('sprint', sprint)
        self.bridge.set_input('crouch', crouch)
        if jump:
            self.press_key('jump')
    
    def set_look_direction(self, yaw: float, pitch: float):
        """Set camera look direction"""
        self.bridge.set_look(yaw, pitch)
    
    def shoot(self):
        """Fire weapon"""
        self.bridge.set_input('fire', True)
        time.sleep(0.05)
        self.bridge.set_input('fire', False)
    
    def execute_reload(self):
        """Reload weapon"""
        self.press_key('reload')
    
    def press_key(self, action: str):
        """Press a key once"""
        self.bridge.press_key(action)
    
    def release_all_inputs(self):
        """Release all input keys"""
        self.bridge.release_all_inputs()
    
    # === MAIN LOOP ===
    
    def run(self):
        """Main AI loop"""
        self.start()
        
        try:
            while self.running:
                current_time = time.time()
                
                # Throttle decision-making
                if current_time - self.last_state_update < self.decision_cooldown:
                    time.sleep(0.01)
                    continue
                
                self.last_state_update = current_time
                
                # Get game state
                state = self.get_game_state()
                if not state:
                    time.sleep(0.1)
                    continue
                
                # Make decision based on state
                self.make_decision(state)
                
                # Update statistics
                if self.stats['time_survived'] > 0:
                    elapsed = current_time - self.stats['time_survived']
                else:
                    elapsed = 0
                
                # Small delay
                time.sleep(0.01)
                
        except KeyboardInterrupt:
            self.log_thought("Manual stop detected")
        finally:
            self.stop()
    
    def get_status_report(self) -> Dict:
        """Get current AI status for display"""
        elapsed = time.time() - self.stats['time_survived'] if self.stats['time_survived'] > 0 else 0
        accuracy = (self.stats['shots_hit'] / self.stats['shots_fired'] * 100) if self.stats['shots_fired'] > 0 else 0
        
        return {
            'state': self.state.value,
            'target': self.current_target.id if self.current_target else None,
            'thoughts': self.thought_process[-5:],  # Last 5 thoughts
            'stats': {
                **self.stats,
                'time_alive': f"{elapsed:.1f}s",
                'accuracy': f"{accuracy:.1f}%"
            }
        }


# === GAME BRIDGE - HTTP Communication ===
class GameBridge:
    """Bridge between AI and game via HTTP"""
    
    def __init__(self, game_url='http://localhost:8000'):
        self.game_url = game_url
        self.api_url = 'http://localhost:3000/api'  # Game bridge API
        self.inputs = {}
        self.last_state = None
        
    def get_game_state(self) -> Optional[Dict]:
        """Get current game state from JavaScript via eval"""
        try:
            import urllib.request
            import json
            
            # Query the AI API endpoint
            req = urllib.request.Request(
                f'{self.api_url}/gameState',
                method='GET'
            )
            req.add_header('User-Agent', 'AI Player')
            
            with urllib.request.urlopen(req, timeout=2) as response:
                data = json.loads(response.read().decode())
                if data.get('success'):
                    self.last_state = data.get('player', {})
                    return data
        except Exception as e:
            # Fallback: return last known state
            if self.last_state:
                return {
                    'success': True,
                    'player': self.last_state,
                    'enemies': [],
                    'objectsCount': 0
                }
        
        return None
    
    def set_input(self, action: str, pressed: bool):
        """Set input state via HTTP"""
        self.inputs[action] = pressed
        
        try:
            import urllib.request
            import json
            
            payload = json.dumps({
                'action': action,
                'pressed': pressed
            }).encode()
            
            req = urllib.request.Request(
                f'{self.api_url}/setInput',
                data=payload,
                method='POST',
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=1) as response:
                response.read()
        except Exception as e:
            print(f"[GameBridge] Warning: setInput failed - {e}")
        
    def set_look(self, yaw: float, pitch: float):
        """Set camera look direction via HTTP"""
        try:
            import urllib.request
            import json
            
            payload = json.dumps({
                'yaw': yaw,
                'pitch': pitch
            }).encode()
            
            req = urllib.request.Request(
                f'{self.api_url}/setLook',
                data=payload,
                method='POST',
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=1) as response:
                response.read()
        except Exception as e:
            print(f"[GameBridge] Warning: setLook failed - {e}")
    
    def press_key(self, action: str):
        """Press a key once via HTTP"""
        try:
            import urllib.request
            import json
            
            payload = json.dumps({
                'action': action
            }).encode()
            
            req = urllib.request.Request(
                f'{self.api_url}/pressKey',
                data=payload,
                method='POST',
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req, timeout=1) as response:
                response.read()
        except Exception as e:
            print(f"[GameBridge] Warning: pressKey failed - {e}")
        
    def release_all_inputs(self):
        """Release all inputs via HTTP"""
        self.inputs.clear()
        
        try:
            import urllib.request
            
            req = urllib.request.Request(
                f'{self.api_url}/releaseAll',
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=1) as response:
                response.read()
        except Exception as e:
            print(f"[GameBridge] Warning: releaseAll failed - {e}")


if __name__ == '__main__':
    print("=== OMNI-OPS AI GAME PLAYER ===")
    print("Testing AI player logic...")
    
    bridge = GameBridge()
    ai_player = AIGamePlayer(bridge)
    
    print(f"AI initialized with {ai_player.aim_accuracy*100}% accuracy")
    print(f"Aggression level: {ai_player.aggression*100}%")
    print(f"Awareness range: {ai_player.awareness_range}m")
    print("\nAI ready to play!")
