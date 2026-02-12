#!/usr/bin/env python3
"""
System Verification & Setup
Checks all components are ready for AI Vision System
"""

import os
import sys
import json
from pathlib import Path

def check_files():
    """Verify all required files exist"""
    workspace = Path(__file__).parent
    required_files = [
        'ai_vision_control_system.py',
        'ai_orchestrator.py',
        'START_COMPLETE_AI_SYSTEM.py',
        'js/ai-vision-control.js',
        'ai_vision_dashboard.html',
        'index.html',
        'js/omni-core-game.js'
    ]
    
    print("\n[FILES]")
    missing = []
    for f in required_files:
        path = workspace / f
        if path.exists():
            size = path.stat().st_size
            print(f"  ✓ {f} ({size} bytes)")
        else:
            print(f"  ✗ {f} MISSING")
            missing.append(f)
    
    return len(missing) == 0

def check_python_deps():
    """Check Python dependencies"""
    print("\n[PYTHON DEPENDENCIES]")
    
    deps = {
        'flask': 'Flask HTTP server',
        'flask_cors': 'CORS support',
        'anthropic': 'Claude API',
        'requests': 'HTTP client'
    }
    
    missing = []
    for pkg, desc in deps.items():
        try:
            __import__(pkg)
            print(f"  ✓ {pkg}: {desc}")
        except ImportError:
            print(f"  ✗ {pkg}: {desc} - MISSING")
            missing.append(pkg)
    
    if missing:
        print(f"\n  Install missing: pip install {' '.join(missing)}")
    
    return len(missing) == 0

def check_env():
    """Check environment"""
    print("\n[ENVIRONMENT]")
    
    api_key = os.environ.get('ANTHROPIC_API_KEY', '')
    if api_key:
        masked = api_key[:7] + '*' * 20 + api_key[-7:]
        print(f"  ✓ ANTHROPIC_API_KEY set ({masked})")
    else:
        print(f"  ✗ ANTHROPIC_API_KEY not set")
        return False
    
    return True

def check_game_integration():
    """Check game integration"""
    workspace = Path(__file__).parent
    print("\n[GAME INTEGRATION]")
    
    index_path = workspace / 'index.html'
    with open(index_path) as f:
        content = f.read()
    
    checks = {
        'ai-vision-control.js': 'AI Vision script',
        'omni-core-game.js': 'Core game engine',
        'health-bar-fill': 'Health bar HUD'
    }
    
    for check, desc in checks.items():
        if check in content:
            print(f"  ✓ {desc} found in index.html")
        else:
            print(f"  ✗ {desc} NOT found in index.html")
            return False
    
    return True

def check_ports():
    """Check if ports are available"""
    import socket
    
    print("\n[PORTS]")
    ports = {
        8000: "Game Server",
        8080: "Game HTTP API",
        8081: "AI Vision API"
    }
    
    available = True
    for port, name in ports.items():
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        
        if result != 0:
            print(f"  ✓ {port}: {name} (available)")
        else:
            print(f"  ✗ {port}: {name} (in use)")
            available = False
    
    return available

def main():
    print("="*70)
    print("OMNI-OPS AI VISION SYSTEM - SETUP VERIFICATION")
    print("="*70)
    
    checks = [
        ("Files", check_files),
        ("Dependencies", check_python_deps),
        ("Environment", check_env),
        ("Game Integration", check_game_integration),
        ("Ports", check_ports)
    ]
    
    results = {}
    for name, check in checks:
        try:
            results[name] = check()
        except Exception as e:
            print(f"\n  ERROR: {e}")
            results[name] = False
    
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    all_ok = True
    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {name}")
        if not result:
            all_ok = False
    
    print("\n" + "="*70)
    
    if all_ok:
        print("✓ ALL SYSTEMS READY")
        print("\nTo start the AI system:")
        print("  1. Windows: Double-click START_AI_SYSTEM.bat")
        print("  2. Python: python START_COMPLETE_AI_SYSTEM.py")
        print("  3. Manual: python ai_orchestrator.py")
    else:
        print("✗ SOME SYSTEMS NOT READY")
        print("\nFix the issues above and run this again.")
    
    print("\nDocumentation: AI_VISION_SYSTEM_README.md")
    print("="*70 + "\n")
    
    return 0 if all_ok else 1

if __name__ == '__main__':
    sys.exit(main())
