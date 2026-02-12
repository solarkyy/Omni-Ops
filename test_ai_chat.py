#!/usr/bin/env python3
"""Test AI Chat Functionality"""

import requests
import json
import time

BASE_URL = "http://localhost:5000"

test_queries = [
    "What features does Omni-Ops have?",
    "How do I control the character?",
    "Scan the codebase for issues",
    "Tell me about the NPCs",
    "What files are in the workspace?",
]

print("=" * 70)
print("TESTING AI CHAT FUNCTIONALITY")
print("=" * 70)

results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

for i, query in enumerate(test_queries, 1):
    print(f"\n[TEST {i}] Sending: {query}")
    try:
        response = requests.post(f"{BASE_URL}/query", json={"query": query})
        data = response.json()
        
        if data.get("status") == "success":
            print(f"✓ SUCCESS")
            print(f"Response preview: {data['response'][:80]}...")
            results["passed"] += 1
        else:
            print(f"✗ FAILED: {data.get('error', 'Unknown error')}")
            results["failed"] += 1
            results["errors"].append(f"Query '{query}': {data.get('error')}")
    except Exception as e:
        print(f"✗ ERROR: {e}")
        results["failed"] += 1
        results["errors"].append(f"Query '{query}': {str(e)}")
    
    time.sleep(0.5)

print("\n" + "=" * 70)
print("TEST RESULTS")
print("=" * 70)
print(f"Passed: {results['passed']}")
print(f"Failed: {results['failed']}")

if results['errors']:
    print("\nErrors:")
    for error in results['errors']:
        print(f"  - {error}")

print("=" * 70)
