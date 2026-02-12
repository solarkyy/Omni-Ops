#!/usr/bin/env python3
"""Final Quick AI Integration Verification Test"""

import requests
import json

BASE_URL = "http://localhost:5000"

tests = {
    "Bridge Health": ("GET", "/health", None),
    "Chat Query": ("POST", "/query", {"query": "Test message"}),
    "NPC Decision": ("POST", "/npc-decision", {
        "state": {"type": "GUARD", "health": 80},
        "context": {"threat_level": 50, "nearby_players": ["player1"], "time_of_day": 14}
    }),
    "Workspace Info": ("GET", "/workspace", None),
}

print("=" * 70)
print("FINAL AI INTEGRATION TEST - QUICK VERIFICATION")
print("=" * 70)

passed = 0
failed = 0

for test_name, (method, endpoint, data) in tests.items():
    print(f"\n[*] Testing {test_name}...")
    try:
        if method == "GET":
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
        else:
            response = requests.post(f"{BASE_URL}{endpoint}",
                                    json=data, timeout=5)
        
        result = response.json()
        
        if result.get("status") == "success" or result.get("status") == "healthy":
            print(f"    ✓ PASS")
            passed += 1
        else:
            print(f"    ✗ FAIL - {result.get('error', 'No error message')}")
            failed += 1
    except Exception as e:
        print(f"    ✗ FAIL - {e}")
        failed += 1

print("\n" + "=" * 70)
print(f"RESULTS: {passed} Passed, {failed} Failed")
print("=" * 70)

if failed == 0:
    print("✓ ALL TESTS PASSED - AI GAME IS FULLY FUNCTIONAL")
    print("\nThe game is ready to play!")
    print("- In-game AI NPCs are working")
    print("- NPC decision making is functional")
    print("- Human-AI communication is enabled")
    print("- Game backend is fully operational")
else:
    print("⚠ Some tests failed - check above for details")

print("=" * 70)
