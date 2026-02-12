#!/usr/bin/env python3
"""
Test script to verify AI Player API availability and control
"""

import webbrowser
import time
import json
from pathlib import Path

# Test file locations
workspace = Path(__file__).parent
html_file = workspace / "index.html"

print("=" * 60)
print("OMNI-OPS AI ACTIVATION TEST")
print("=" * 60)
print()

# Open browser to test
print("[1] Opening game in browser...")
webbrowser.open(f"file:///{html_file}")

print("[2] Game loaded. Check browser console for:")
print("    - 'Module loading complete' confirmation")
print("    - 'AIPlayerAPI' status")
print()

print("[3] Test Instructions:")
print("    1. Open browser DevTools (F12)")
print("    2. Go to Console tab")
print("    3. Run: window.AIPlayerAPI ? 'API Ready' : 'API Not Found'")
print("    4. If API Ready, run: window.AIPlayerAPI.activateAI()")
print("    5. Check if AI status changes")
print()

print("[4] Auto-Test Commands:")
print("    Type in console to test:")
print()
print("    // Check API exists")
print("    console.log('AIPlayerAPI exists:', typeof window.AIPlayerAPI === 'object')")
print()
print("    // Check AI can be activated")
print("    if (window.AIPlayerAPI) {")
print("        window.AIPlayerAPI.activateAI();")
print("        console.log('AI Activated:', window.AIPlayerAPI.isAIControlling());")
print("    }")
print()
print("    // Test movement command")
print("    if (window.AIPlayerAPI) {")
print("        window.AIPlayerAPI.setInput('moveForward', true);")
print("        setTimeout(() => {")
print("            window.AIPlayerAPI.setInput('moveForward', false);")
print("        }, 500);")
print("        console.log('Movement command sent');")
print("    }")
print()
print("=" * 60)

time.sleep(2)
print("\n[5] Waiting for game to load (15 seconds)...")
print("    Look at browser console for any errors...")
print()

for i in range(15, 0, -1):
    print(f"    Time remaining: {i}s...", end="\r")
    time.sleep(1)

print("\n[6] If you see 'AIPlayerAPI not available!' error, check:")
print("    a) Browser console for module loading errors")
print("    b) Verify all JS files loaded successfully")
print("    c) Check script loading order in index.html")
print()
print("=" * 60)
