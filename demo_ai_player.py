"""
DEMO: AI Playing Game Without Server
Tests the AI player logic locally with simulated game state
"""

from ai_game_player import AIGamePlayer, GameBridge, Vector3, Enemy
import time
import random

class DemoGameBridge(GameBridge):
    """Simulated game bridge for demo purposes"""
    
    def __init__(self):
        super().__init__()
        self.player_pos = Vector3(0, 1.6, 0)
        self.player_health = 100
        self.player_ammo = 30
        self.player_reserve = 90
        self.enemies = []
        self.yaw = 0
        self.pitch = 0
        self.time_start = time.time()
        
        # Spawn some demo enemies
        self.spawn_demo_enemies()
    
    def spawn_demo_enemies(self):
        """Spawn demo enemies around player"""
        positions = [
            (20, 0, 20),
            (-15, 0, 25),
            (30, 0, -10),
            (-20, 0, -20)
        ]
        
        for i, (x, y, z) in enumerate(positions):
            enemy_pos = Vector3(x, y, z)
            distance = self.player_pos.distance_to(enemy_pos)
            
            self.enemies.append({
                'id': f'enemy_{i}',
                'x': x, 'y': y, 'z': z,
                'health': 100,
                'faction': 'RAIDER',
                'distance': distance
            })
    
    def get_game_state(self):
        """Return simulated game state"""
        # Update enemy distances
        for enemy in self.enemies:
            enemy_pos = Vector3(enemy['x'], enemy['y'], enemy['z'])
            enemy['distance'] = self.player_pos.distance_to(enemy_pos)
        
        return {
            'player': {
                'x': self.player_pos.x,
                'y': self.player_pos.y,
                'z': self.player_pos.z,
                'health': self.player_health,
                'ammo': self.player_ammo,
                'reserveAmmo': self.player_reserve,
                'stamina': 100,
                'yaw': self.yaw,
                'pitch': self.pitch,
                'isSprinting': False,
                'isCrouching': False,
                'isReloading': False,
                'onGround': True
            },
            'enemies': self.enemies,
            'objectsCount': 10
        }
    
    def set_input(self, action, pressed):
        """Simulate input"""
        super().set_input(action, pressed)
        
        # Simulate movement
        if action == 'moveForward' and pressed:
            # Move player forward
            self.player_pos.z -= 0.1
        elif action == 'moveBackward' and pressed:
            self.player_pos.z += 0.1
        elif action == 'moveLeft' and pressed:
            self.player_pos.x -= 0.1
        elif action == 'moveRight' and pressed:
            self.player_pos.x += 0.1
        
        # Simulate shooting
        if action == 'fire' and pressed and self.player_ammo > 0:
            self.player_ammo -= 1
            # Check if hit enemy
            if random.random() < 0.3:  # 30% hit chance for demo
                # Remove closest enemy if in range
                if self.enemies:
                    closest = min(self.enemies, key=lambda e: e['distance'])
                    if closest['distance'] < 50:
                        self.enemies.remove(closest)
                        print(f"  💥 Hit! Enemy eliminated. {len(self.enemies)} remaining")
    
    def set_look(self, yaw, pitch):
        """Set look direction"""
        self.yaw = yaw
        self.pitch = pitch
    
    def press_key(self, action):
        """Press key once"""
        if action == 'reload':
            if self.player_reserve >= 30:
                ammo_needed = 30 - self.player_ammo
                self.player_ammo = 30
                self.player_reserve -= ammo_needed
                print(f"  🔄 Reloaded: {self.player_ammo}/{self.player_reserve}")


def demo_ai_player():
    """Run AI player demo"""
    print("=" * 60)
    print("🤖 AI GAME PLAYER DEMO")
    print("=" * 60)
    print()
    print("This demo simulates the AI playing the game.")
    print("Watch the AI make decisions and control the player!")
    print()
    print("Press Ctrl+C to stop")
    print()
    time.sleep(2)
    
    # Create simulated bridge
    bridge = DemoGameBridge()
    
    # Create AI player
    ai = AIGamePlayer(bridge)
    
    print(f"🧠 AI Configuration:")
    print(f"  • Accuracy: {ai.aim_accuracy * 100}%")
    print(f"  • Reaction Time: {ai.reaction_time}s")
    print(f"  • Aggression: {ai.aggression * 100}%")
    print(f"  • Awareness Range: {ai.awareness_range}m")
    print()
    
    # Start AI
    ai.start()
    
    try:
        iteration = 0
        while ai.running and iteration < 100:  # Run for 100 iterations
            iteration += 1
            
            # Get state
            state = ai.get_game_state()
            if not state:
                print("⚠️ No game state available")
                time.sleep(0.5)
                continue
            
            # Make decision
            ai.make_decision(state)
            
            # Print status every 10 iterations
            if iteration % 10 == 0:
                status = ai.get_status_report()
                print(f"\n📊 Status Update (iteration {iteration}):")
                print(f"  State: {status['state']}")
                print(f"  Position: ({state.player_position.x:.1f}, {state.player_position.z:.1f})")
                print(f"  Health: {state.player_health:.0f}")
                print(f"  Ammo: {state.player_ammo}/{state.player_reserve_ammo}")
                print(f"  Enemies: {len(state.enemies)}")
                
                if status['thoughts']:
                    print(f"  Latest Thought: {status['thoughts'][-1]}")
            
            # Delay
            time.sleep(ai.decision_cooldown)
            
            # Stop if no enemies left
            if len(state.enemies) == 0:
                print("\n✅ All enemies eliminated!")
                break
    
    except KeyboardInterrupt:
        print("\n\n⏹️ Stopped by user")
    
    finally:
        ai.stop()
        
        # Final report
        print("\n" + "=" * 60)
        print("📈 FINAL REPORT")
        print("=" * 60)
        status = ai.get_status_report()
        print(f"Kills: {ai.stats['kills']}")
        print(f"Shots Fired: {ai.stats['shots_fired']}")
        print(f"Enemies Spotted: {ai.stats['enemies_spotted']}")
        print(f"Accuracy: {ai.stats['shots_hit'] / max(ai.stats['shots_fired'], 1) * 100:.1f}%")
        print(f"Time Alive: {time.time() - ai.stats['time_survived']:.1f}s")
        print()
        
        print("💭 Thought Process:")
        for thought in ai.thought_process[-10:]:
            print(f"  {thought}")
        
        print("\n✨ Demo complete!")
        print("To use with real game: Open game, press F4, click START AI")


if __name__ == '__main__':
    demo_ai_player()
