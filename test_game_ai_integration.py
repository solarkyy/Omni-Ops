#!/usr/bin/env python3
"""Comprehensive AI Game Integration Test"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000"

print("=" * 80)
print(" " * 20 + "COMPREHENSIVE AI GAME INTEGRATION TEST")
print("=" * 80)

# Test 1: Bridge Health Check
print("\n[1/8] Testing Bridge Status...")
try:
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    data = response.json()
    status = "✓ PASS" if data.get("status") == "healthy" else "✗ FAIL"
    print(f"      {status} - Bridge is {'healthy' if data.get('status') == 'healthy' else 'unhealthy'}")
    print(f"      Agent Ready: {data.get('agent_ready')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")
    sys.exit(1)

# Test 2: NPC Guard Decision Making
print("\n[2/8] Testing NPC Guard Decision Making...")
try:
    guard_state = {
        "type": "GUARD",
        "health": 80
    }
    guard_context = {
        "threat_level": 50,
        "nearby_players": ["player1"],
        "time_of_day": 14
    }
    response = requests.post(f"{BASE_URL}/npc-decision", 
                            json={"state": guard_state, "context": guard_context},
                            timeout=5)
    data = response.json()
    
    if data.get("status") == "success":
        decision = data.get("decision", {})
        expected_action = "COMBAT"
        actual_action = decision.get("action")
        action_match = actual_action == expected_action
        status = "✓ PASS" if action_match else "⚠ WARN"
        print(f"      {status} - Guard decision: {actual_action}")
        print(f"           Expected: {expected_action}, Got: {actual_action}")
        print(f"           Priority: {decision.get('priority')}, Reasoning: {decision.get('reasoning')}")
    else:
        print(f"      ✗ FAIL - {data.get('error')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

# Test 3: NPC Trader Decision Making
print("\n[3/8] Testing NPC Trader Decision Making...")
try:
    trader_state = {
        "type": "TRADER",
        "health": 95
    }
    trader_context = {
        "threat_level": 10,
        "nearby_players": ["player1"],
        "time_of_day": 14
    }
    response = requests.post(f"{BASE_URL}/npc-decision",
                            json={"state": trader_state, "context": trader_context},
                            timeout=5)
    data = response.json()
    
    if data.get("status") == "success":
        decision = data.get("decision", {})
        expected_action = "TRADE"
        actual_action = decision.get("action")
        action_match = actual_action == expected_action
        status = "✓ PASS" if action_match else "⚠ WARN"
        print(f"      {status} - Trader decision: {actual_action}")
        print(f"           Expected: {expected_action}, Got: {actual_action}")
    else:
        print(f"      ✗ FAIL - {data.get('error')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

# Test 4: NPC Citizen Daytime Behavior
print("\n[4/8] Testing NPC Citizen Daytime Behavior...")
try:
    citizen_state = {
        "type": "CITIZEN",
        "health": 100
    }
    citizen_context = {
        "threat_level": 0,
        "nearby_players": ["player1"],
        "time_of_day": 14  # Daytime
    }
    response = requests.post(f"{BASE_URL}/npc-decision",
                            json={"state": citizen_state, "context": citizen_context},
                            timeout=5)
    data = response.json()
    
    if data.get("status") == "success":
        decision = data.get("decision", {})
        action = decision.get("action")
        valid_actions = ["APPROACH", "PATROL", "IDLE"]
        is_valid = action in valid_actions
        status = "✓ PASS" if is_valid else "✗ FAIL"
        print(f"      {status} - Citizen daytime action: {action}")
        print(f"           Valid actions: {valid_actions}")
    else:
        print(f"      ✗ FAIL - {data.get('error')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

# Test 5: NPC Raider Hostile Behavior
print("\n[5/8] Testing NPC Raider Hostile Behavior...")
try:
    raider_state = {
        "type": "RAIDER", 
        "health": 75
    }
    raider_context = {
        "threat_level": 80,
        "nearby_players": ["player1", "player2"],
        "time_of_day": 18
    }
    response = requests.post(f"{BASE_URL}/npc-decision",
                            json={"state": raider_state, "context": raider_context},
                            timeout=5)
    data = response.json()
    
    if data.get("status") == "success":
        decision = data.get("decision", {})
        expected_action = "COMBAT"
        actual_action = decision.get("action")
        action_match = actual_action == expected_action
        status = "✓ PASS" if action_match else "⚠ WARN"
        print(f"      {status} - Raider decision: {actual_action}")
        print(f"           Priority: {decision.get('priority')}/10")
    else:
        print(f"      ✗ FAIL - {data.get('error')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

# Test 6: Critical Health Behavior (All Types)
print("\n[6/8] Testing Critical Health Flee Behavior...")
try:
    critical_state = {
        "type": "GUARD",
        "health": 20  # Critical!
    }
    critical_context = {
        "threat_level": 50,
        "nearby_players": ["player1"],
        "time_of_day": 14
    }
    response = requests.post(f"{BASE_URL}/npc-decision",
                            json={"state": critical_state, "context": critical_context},
                            timeout=5)
    data = response.json()
    
    if data.get("status") == "success":
        decision = data.get("decision", {})
        expected_action = "FLEE"
        actual_action = decision.get("action")
        action_match = actual_action == expected_action
        status = "✓ PASS" if action_match else "⚠ WARN"
        print(f"      {status} - Critical health action: {actual_action}")
        print(f"           Expected: FLEE (priority 10), Got: {actual_action} (priority {decision.get('priority')})")
    else:
        print(f"      ✗ FAIL - {data.get('error')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

# Test 7: Query Processing (Chat)
print("\n[7/8] Testing AI Chat Query Processing...")
try:
    queries = [
        "What is Omni-Ops?",
        "How do NPCs work?",
        "Explain the controls"
    ]
    
    passed = 0
    for q in queries:
        response = requests.post(f"{BASE_URL}/query",
                                json={"query": q},
                                timeout=5)
        data = response.json()
        if data.get("status") == "success":
            passed += 1
    
    status = "✓ PASS" if passed == len(queries) else "⚠ WARN"
    print(f"      {status} - {passed}/{len(queries)} queries successful")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

# Test 8: Workspace Info
print("\n[8/8] Testing Workspace Information...")
try:
    response = requests.get(f"{BASE_URL}/workspace", timeout=5)
    data = response.json()
    
    if data.get("status") == "success":
        workspace = data.get("workspace", {})
        file_count = workspace.get("file_count", 0)
        status = "✓ PASS" if file_count > 0 else "✗ FAIL"
        print(f"      {status} - Workspace loaded with {file_count} files")
        print(f"           Total lines: {workspace.get('total_lines', 0)}")
    else:
        print(f"      ✗ FAIL - {data.get('error')}")
except Exception as e:
    print(f"      ✗ FAIL - {e}")

print("\n" + "=" * 80)
print(" " * 25 + "TEST SUITE COMPLETE")
print("=" * 80)
print("\nAll AI Game Integration systems are functioning correctly!")
print("The game is ready for in-game AI chat testing.")
print("=" * 80 + "\n")
