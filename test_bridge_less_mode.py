#!/usr/bin/env python3
"""
Quick Test: Bridge-less Mode Workflow
Tests the complete API-based collaboration system
"""

import requests
import json
import time
from pathlib import Path

BASE_URL = 'http://127.0.0.1:8080'
WORKSPACE = Path(__file__).parent

def test_health():
    """Test 1: Server health check"""
    print("🔍 Test 1: Server Health Check")
    try:
        response = requests.get(f'{BASE_URL}/api/health')
        data = response.json()
        print(f"   ✅ Server is {data['status']}")
        print(f"   📁 Workspace: {data['workspace']}")
        print(f"   🔌 Port: {data['port']}")
        return True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False

def test_initial_messages():
    """Test 2: Get initial welcome messages"""
    print("\n🔍 Test 2: Initial Messages")
    try:
        response = requests.get(f'{BASE_URL}/api/cline/messages')
        data = response.json()
        print(f"   ✅ Real Mode: {data['realMode']}")
        print(f"   ✅ Message Count: {data['messageCount']}")
        
        for msg in data['messages']:
            print(f"   💬 {msg['actor']}: {msg['content'][:60]}...")
        
        return data['realMode'] == True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False

def test_send_task():
    """Test 3: Send a task to Cline"""
    print("\n🔍 Test 3: Send Task to Cline")
    
    task_data = {
        'task': 'Add a minimap toggle button to the HUD',
        'type': 'implementation',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/api/cline/send',
            json=task_data,
            headers={'Content-Type': 'application/json'}
        )
        data = response.json()
        
        if data['success']:
            print(f"   ✅ Task sent successfully!")
            print(f"   🆔 Task ID: {data['taskId']}")
            print(f"   💾 Message: {data['message']}")
            return data['taskId']
        else:
            print(f"   ❌ Failed: {data.get('error', 'Unknown error')}")
            return None
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return None

def test_verify_task_file(task_id):
    """Test 4: Verify task file was created"""
    print("\n🔍 Test 4: Verify Task File")
    
    task_file = WORKSPACE / 'cline_inbox' / f'task_{task_id}.json'
    
    if task_file.exists():
        with open(task_file, 'r') as f:
            task_data = json.load(f)
        
        print(f"   ✅ Task file exists: {task_file.name}")
        print(f"   📝 Task: {task_data['task']}")
        print(f"   🏷️  Type: {task_data['type']}")
        print(f"   👤 From: {task_data['from']}")
        print(f"   📊 Status: {task_data['status']}")
        
        # Show file contents
        print(f"\n   📄 File Contents:")
        print("   " + "-" * 60)
        for line in json.dumps(task_data, indent=2).split('\n'):
            print(f"   {line}")
        print("   " + "-" * 60)
        
        return True
    else:
        print(f"   ❌ Task file not found: {task_file}")
        return False

def test_updated_messages():
    """Test 5: Check if message was added"""
    print("\n🔍 Test 5: Updated Messages")
    try:
        response = requests.get(f'{BASE_URL}/api/cline/messages')
        data = response.json()
        
        print(f"   ✅ Total messages: {data['messageCount']}")
        
        # Show latest messages
        recent = data['messages'][-3:]
        for msg in recent:
            print(f"   💬 {msg['actor']}: {msg['content'][:60]}...")
        
        return True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False

def test_simulate_response():
    """Test 6: Simulate Copilot response"""
    print("\n🔍 Test 6: Simulate Copilot Response")
    
    outbox_dir = WORKSPACE / 'cline_outbox'
    outbox_dir.mkdir(exist_ok=True)
    
    response_file = outbox_dir / 'response_1.json'
    response_data = {
        'taskId': 1,
        'status': 'completed',
        'message': '✅ Minimap toggle added! Check omni-ui.js for the new button.',
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
        'files_modified': ['js/omni-ui.js'],
        'from': 'copilot'
    }
    
    try:
        with open(response_file, 'w') as f:
            json.dump(response_data, f, indent=2)
        
        print(f"   ✅ Response file created: {response_file.name}")
        print(f"   💬 Message: {response_data['message']}")
        
        # Give the server time to detect it
        time.sleep(2)
        
        # Check if server processed it
        api_response = requests.get(f'{BASE_URL}/api/cline/check')
        check_data = api_response.json()
        
        if check_data['success']:
            print(f"   ✅ Server detected: {check_data['newMessages']} new message(s)")
        
        return True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False

def test_cleanup():
    """Test 7: Clean up test files"""
    print("\n🔍 Test 7: Cleanup")
    
    try:
        # Remove test files
        inbox_dir = WORKSPACE / 'cline_inbox'
        outbox_dir = WORKSPACE / 'cline_outbox'
        
        for f in inbox_dir.glob('*.json'):
            f.unlink()
            print(f"   🗑️  Removed: {f.name}")
        
        for f in outbox_dir.glob('*.json'):
            f.unlink()
            print(f"   🗑️  Removed: {f.name}")
        
        print("   ✅ Cleanup complete!")
        return True
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return False

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║       BRIDGE-LESS MODE - WORKFLOW TEST                       ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("Initial Messages", test_initial_messages()))
    
    task_id = test_send_task()
    results.append(("Send Task", task_id is not None))
    
    if task_id:
        results.append(("Verify Task File", test_verify_task_file(task_id)))
    
    results.append(("Updated Messages", test_updated_messages()))
    results.append(("Simulate Response", test_simulate_response()))
    results.append(("Cleanup", test_cleanup()))
    
    # Summary
    print("\n" + "="*62)
    print("📊 TEST RESULTS SUMMARY")
    print("="*62)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}  {name}")
    
    print("="*62)
    print(f"Result: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    print("="*62)
    
    if passed == total:
        print("\n🎉 SUCCESS! Bridge-less mode is fully operational!")
        print("\n📝 Next Steps:")
        print("   1. Open http://127.0.0.1:8080 in browser")
        print("   2. Press F3 to open collaboration overlay")
        print("   3. Send a request and watch it appear in cline_inbox/")
        print("   4. GitHub Copilot can monitor inbox and respond!")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    print()

if __name__ == '__main__':
    main()
