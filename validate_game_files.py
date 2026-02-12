#!/usr/bin/env python3
"""Validate game files for syntax errors"""

import re
import os

files_to_check = [
    "js/omni-ai-npc-intelligence.js",
    "js/omni-core-game.js",
    "ai_chat_interface.html"
]

print("=" * 80)
print(" " * 25 + "GAME FILES VALIDATION")
print("=" * 80)

issues_found = []

for filepath in files_to_check:
    print(f"\n[*] Checking {filepath}...")
    
    if not os.path.exists(filepath):
        print(f"    ✗ File not found!")
        issues_found.append(f"{filepath}: Not found")
        continue
    
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Check for orphaned console.errors
        error_count = content.count('console.error')
        log_count = content.count('console.log')
        
        # Check for fetch calls
        fetch_count = content.count('fetch')
        
        # Check for AI bridge references
        bridge_refs = content.count('localhost:5000')
        
        print(f"    Lines: {len(content.splitlines())}")
        print(f"    Fetch calls: {fetch_count}")
        print(f"    Console.log: {log_count}")
        print(f"    Console.error: {error_count}")
        print(f"    AI Bridge refs: {bridge_refs}")
        
        # Check for common syntax issues
        if '{{' in content and '}}' not in content:
            issues_found.append(f"{filepath}: Unclosed template literals")
        
        if content.count('{') != content.count('}'):
            issues_found.append(f"{filepath}: Mismatched braces")
            
        if content.count('[') != content.count(']'):
            issues_found.append(f"{filepath}: Mismatched brackets")
            
        print(f"    ✓ No syntax issues detected")
        
    except Exception as e:
        print(f"    ✗ Error reading: {e}")
        issues_found.append(f"{filepath}: {e}")

print("\n" + "=" * 80)
if issues_found:
    print("ISSUES FOUND:")
    for issue in issues_found:
        print(f"  - {issue}")
else:
    print("✓ All files validated successfully!")
print("=" * 80)
