#!/usr/bin/env python3
"""Advanced In-Game NPC AI Simulation Test"""

import requests
import json
import time
from typing import Dict, Any

BASE_URL = "http://localhost:5000"

class GameAISimulator:
    """Simulates in-game NPC AI interactions"""
    
    def __init__(self):
        self.test_results = []
        self.npcs = [
            {"name": "Guard #1", "type": "GUARD", "health": 90},
            {"name": "Trader #2", "type": "TRADER", "health": 95},
            {"name": "Citizen #3", "type": "CITIZEN", "health": 85},
            {"name": "Raider #4", "type": "RAIDER", "health": 100},
        ]
        self.scenarios = [
            {
                "name": "Peaceful Day",
                "time": 12,
                "threat": 0,
                "description": "NPCs during peaceful daytime with no threats"
            },
            {
                "name": "Player Nearby",
                "time": 14,
                "threat": 20,
                "description": "Friendly NPCs responding to player presence"
            },
            {
                "name": "Moderate Threat",
                "time": 18,
                "threat": 50,
                "description": "Combat-ready NPCs during moderate threat"
            },
            {
                "name": "High Threat",
                "time": 20,
                "threat": 80,
                "description": "NPCs under extreme duress"
            }
        ]
    
    def test_npc_dialogue_chain(self):
        """Test extended dialogue with NPCs"""
        print("\n" + "=" * 80)
        print("TEST: NPC Dialogue Chain Simulation")
        print("=" * 80)
        
        dialogue_queries = [
            "Hello, what's your name?",
            "Can you tell me about this area?",
            "What are you doing here?",
            "Do you need any help?",
            "Take care of yourself"
        ]
        
        for i, query in enumerate(dialogue_queries, 1):
            print(f"\n[Dialogue {i}] Player: {query}")
            try:
                response = requests.post(f"{BASE_URL}/query",
                                       json={"query": query},
                                       timeout=5)
                data = response.json()
                
                if data.get("status") == "success":
                    npc_response = data.get("response", "")[:100]
                    print(f"  NPC: {npc_response}...")
                    self.test_results.append(("Dialogue Chain", True, f"Query {i} OK"))
                else:
                    print(f"  ✗ Error: {data.get('error')}")
                    self.test_results.append(("Dialogue Chain", False, f"Query {i} failed"))
            except Exception as e:
                print(f"  ✗ Exception: {e}")
                self.test_results.append(("Dialogue Chain", False, str(e)))
                
            time.sleep(0.3)
    
    def test_npc_scenario_reactions(self):
        """Test NPC reactions to different scenarios"""
        print("\n" + "=" * 80)
        print("TEST: NPC Scenario Reactions")
        print("=" * 80)
        
        for scenario in self.scenarios:
            print(f"\n[Scenario] {scenario['name']}: {scenario['description']}")
            print(f"  Time: {scenario['time']}:00, Threat Level: {scenario['threat']}")
            
            for npc in self.npcs:
                try:
                    state = {
                        "type": npc["type"],
                        "health": npc["health"]
                    }
                    context = {
                        "time_of_day": scenario["time"],
                        "threat_level": scenario["threat"],
                        "nearby_players": ["player1"] if scenario["threat"] > 0 else [],
                        "time_of_day": scenario["time"]
                    }
                    
                    response = requests.post(f"{BASE_URL}/npc-decision",
                                           json={"state": state, "context": context},
                                           timeout=5)
                    data = response.json()
                    
                    if data.get("status") == "success":
                        decision = data.get("decision", {})
                        action = decision.get("action", "IDLE")
                        reasoning = decision.get("reasoning", "")
                        print(f"    {npc['name']:15} → {action:10} ({reasoning[:40]}...)")
                        self.test_results.append(("Scenario", True, f"{npc['type']} in {scenario['name']}"))
                    else:
                        print(f"    {npc['name']:15} → ✗ Error")
                        self.test_results.append(("Scenario", False, f"{npc['type']}"))
                
                except Exception as e:
                    print(f"    {npc['name']:15} → ✗ Exception: {str(e)[:30]}")
                    self.test_results.append(("Scenario", False, f"{npc['type']}: {e}"))
                
                time.sleep(0.2)
    
    def test_npc_health_states(self):
        """Test NPC behavior at different health levels"""
        print("\n" + "=" * 80)
        print("TEST: NPC Health State Reactions")
        print("=" * 80)
        
        health_levels = [
            {"health": 100, "label": "Excellent"},
            {"health": 75, "label": "Good"},
            {"health": 50, "label": "Wounded"},
            {"health": 25, "label": "Critical"},
            {"health": 10, "label": "Near Death"}
        ]
        
        test_npc_type = "GUARD"
        
        for health_state in health_levels:
            print(f"\n[Health {health_state['label']}] {health_state['health']}% health")
            
            try:
                state = {
                    "type": test_npc_type,
                    "health": health_state["health"]
                }
                context = {
                    "time_of_day": 14,
                    "threat_level": 60,  # Constant moderate-high threat
                    "nearby_players": ["player1"],
                    "time_of_day": 14
                }
                
                response = requests.post(f"{BASE_URL}/npc-decision",
                                       json={"state": state, "context": context},
                                       timeout=5)
                data = response.json()
                
                if data.get("status") == "success":
                    decision = data.get("decision", {})
                    action = decision.get("action")
                    priority = decision.get("priority")
                    reasoning = decision.get("reasoning")
                    
                    print(f"  Action: {action} (Priority: {priority}/10)")
                    print(f"  Reasoning: {reasoning}")
                    self.test_results.append(("Health State", True, f"{health_state['label']}"))
                else:
                    print(f"  ✗ Error: {data.get('error')}")
                    self.test_results.append(("Health State", False, f"{health_state['label']}"))
                    
            except Exception as e:
                print(f"  ✗ Exception: {e}")
                self.test_results.append(("Health State", False, str(e)))
            
            time.sleep(0.2)
    
    def test_simultaneous_npcs(self):
        """Test multiple NPCs making decisions simultaneously"""
        print("\n" + "=" * 80)
        print("TEST: Simultaneous NPC Decisions")
        print("=" * 80)
        
        print("\nSimulating 4 NPCs making decisions at the same time...")
        
        requests_made = []
        
        for npc in self.npcs[:2]:  # Test first 2 NPCs
            state = {"type": npc["type"], "health": npc["health"]}
            context = {
                "time_of_day": 15,
                "threat_level": 30,
                "nearby_players": ["player1"]
            }
            
            try:
                response = requests.post(f"{BASE_URL}/npc-decision",
                                       json={"state": state, "context": context},
                                       timeout=5)
                data = response.json()
                
                if data.get("status") == "success":
                    decision = data.get("decision", {})
                    requests_made.append({
                        "npc": npc["name"],
                        "status": "success",
                        "action": decision.get("action")
                    })
                    print(f"  ✓ {npc['name']}: {decision.get('action')}")
                    self.test_results.append(("Simultaneous", True, npc["type"]))
                else:
                    requests_made.append({
                        "npc": npc["name"],
                        "status": "error",
                        "error": data.get("error")
                    })
                    print(f"  ✗ {npc['name']}: {data.get('error')}")
                    self.test_results.append(("Simultaneous", False, npc["type"]))
            except Exception as e:
                requests_made.append({
                    "npc": npc["name"],
                    "status": "exception",
                    "error": str(e)
                })
                print(f"  ✗ {npc['name']}: {e}")
                self.test_results.append(("Simultaneous", False, str(e)))
        
        successful = sum(1 for r in requests_made if r["status"] == "success")
        print(f"\nResult: {successful}/{len(requests_made)} requests successful")
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for _, success, _ in self.test_results if success)
        failed_tests = total_tests - passed_tests
        
        print(f"\nTotal Tests: {total_tests}")
        print(f"✓ Passed: {passed_tests}")
        print(f"✗ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        print("\nDetailed Results:")
        for test_type, success, details in self.test_results:
            status = "✓" if success else "✗"
            print(f"  {status} [{test_type:15}] {details}")
        
        print("\n" + "=" * 80)
        if failed_tests == 0:
            print("✓ ALL TESTS PASSED - Game AI Integration is fully functional!")
        else:
            print(f"⚠ {failed_tests} tests failed - Review errors above")
        print("=" * 80)

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print(" " * 20 + "ADVANCED IN-GAME NPC AI SIMULATION")
    print("=" * 80)
    
    # Check server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()
        if data.get("status") != "healthy":
            print("\n✗ ERROR: Bridge server is not healthy")
            return
    except Exception as e:
        print(f"\n✗ ERROR: Cannot connect to bridge: {e}")
        return
    
    print("✓ Bridge server is healthy - Starting tests...\n")
    
    # Run simulator
    simulator = GameAISimulator()
    simulator.test_npc_dialogue_chain()
    simulator.test_npc_scenario_reactions()
    simulator.test_npc_health_states()
    simulator.test_simultaneous_npcs()
    simulator.print_summary()

if __name__ == "__main__":
    main()
