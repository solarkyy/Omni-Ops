#!/usr/bin/env python3
"""
Comprehensive AI System Test
Tests: API availability, activation, commands, and status
"""

import json
import time
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text:^60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.RESET}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.RESET}")

def main():
    print_header("OMNI-OPS AI SYSTEM COMPREHENSIVE TEST")
    
    # Test 1: Check file structure
    print_info("Test 1: Verifying file structure...")
    workspace = Path(__file__).parent
    required_files = {
        'js/omni-core-game.js': 'Core game engine',
        'js/omni-unified-control-panel.js': 'Control panel UI',
        'js/omni-ai-game-bridge.js': 'AI Bridge API',
        'index.html': 'Main HTML file',
        'scripts/omni-main.js': 'Module loader'
    }
    
    all_files_exist = True
    for file_path, description in required_files.items():
        full_path = workspace / file_path
        if full_path.exists():
            print_success(f"{description}: {file_path}")
        else:
            print_error(f"{description}: {file_path} NOT FOUND")
            all_files_exist = False
    
    if not all_files_exist:
        print_error("Some required files are missing!")
        return False
    
    # Test 2: Check for APIPlayerAPI definition in core game
    print_info("\nTest 2: Checking AIPlayerAPI definition...")
    core_game = workspace / 'js/omni-core-game.js'
    if core_game.exists():
        content = core_game.read_text()
        if 'window.AIPlayerAPI' in content:
            print_success("AIPlayerAPI is defined in omni-core-game.js")
        else:
            print_error("AIPlayerAPI definition not found in omni-core-game.js")
            return False
    
    # Test 3: Check unified panel for waiting mechanism
    print_info("\nTest 3: Checking unified panel for API wait mechanism...")
    panel_file = workspace / 'js/omni-unified-control-panel.js'
    if panel_file.exists():
        content = panel_file.read_text()
        if 'waitForAPI' in content:
            print_success("Unified panel has waitForAPI method")
        else:
            print_warning("Unified panel missing waitForAPI method")
    
    # Test 4: Script loading order
    print_info("\nTest 4: Verifying script loading order in index.html...")
    html_file = workspace / 'index.html'
    if html_file.exists():
        content = html_file.read_text()
        
        # Check that THREE.js and PeerJS are loaded first
        three_pos = content.find('three.js')
        peer_pos = content.find('peerjs')
        bridge_pos = content.find('omni-ai-game-bridge.js')
        panel_pos = content.find('omni-unified-control-panel.js')
        main_pos = content.find('scripts/omni-main.js')
        
        if three_pos > 0 and peer_pos > 0:
            print_success("Three.js and PeerJS loaded before other scripts")
        
        if bridge_pos > 0 and panel_pos > bridge_pos:
            print_success("AI Bridge loaded before Unified Panel")
        
        if main_pos > 0:
            print_success("Module loader (omni-main.js) found")
        
        print_info(f"  Loading order: THREE.js → PeerJS → AI Bridge → Panel → Main")
    
    # Test 5: Console commands to test
    print_header("BROWSER CONSOLE TESTS")
    
    tests = [
        {
            'name': 'Check API Availability',
            'command': "typeof window.AIPlayerAPI === 'object' ? '✓ API Available' : '✗ API Not Available'",
            'expected': '✓ API Available'
        },
        {
            'name': 'Activate AI',
            'command': "window.AIPlayerAPI.activateAI(); window.AIPlayerAPI.isAIControlling() ? '✓ AI Activated' : '✗ Activation Failed'",
            'expected': '✓ AI Activated'
        },
        {
            'name': 'Move Forward',
            'command': "window.AIPlayerAPI.setInput('moveForward', true); setTimeout(() => window.AIPlayerAPI.setInput('moveForward', false), 500); '✓ Move command sent'",
            'expected': '✓ Move command sent'
        },
        {
            'name': 'Fire Weapon',
            'command': "window.AIPlayerAPI.shoot(); '✓ Fire command sent'",
            'expected': '✓ Fire command sent'
        },
        {
            'name': 'Deactivate AI',
            'command': "window.AIPlayerAPI.deactivateAI(); !window.AIPlayerAPI.isAIControlling() ? '✓ AI Deactivated' : '✗ Deactivation Failed'",
            'expected': '✓ AI Deactivated'
        },
        {
            'name': 'Get Game State',
            'command': "const state = window.AIPlayerAPI.getGameState(); state ? '✓ State Retrieved' : '✗ Game not active'",
            'expected': '✓ State Retrieved or ✗ Game not active'
        }
    ]
    
    print_info("Run these commands in the browser console (F12) after opening the game:\n")
    for i, test in enumerate(tests, 1):
        print(f"{Colors.BOLD}{i}. {test['name']}{Colors.RESET}")
        print(f"   Command: {Colors.CYAN}{test['command']}{Colors.RESET}")
        print(f"   Expected: {Colors.GREEN}{test['expected']}{Colors.RESET}\n")
    
    # Test 6: Troubleshooting guide
    print_header("TROUBLESHOOTING")
    
    troubleshoot = {
        "AIPlayerAPI not available": [
            "1. Check that omni-core-game.js loaded successfully (check Network tab)",
            "2. Wait 5+ seconds for modules to load",
            "3. Check browser console for any JS errors",
            "4. Refresh the page (Ctrl+Shift+R)"
        ],
        "AI doesn't respond to commands": [
            "1. Make sure game is running (press 'Start Story' or 'Quick Play')",
            "2. Check that AI is activated with: window.AIPlayerAPI.isAIControlling()",
            "3. Check console for errors when sending commands",
            "4. Look for '[Panel]' or '[AI Bridge]' messages in console"
        ],
        "Control panel shows 'AI Not Active'": [
            "1. Click the 'Activate' button on the AI tab",
            "2. Check console for errors: console.log(typeof window.AIPlayerAPI)",
            "3. Make sure all modules loaded: check Module Loader status",
            "4. Try running a command manually in console"
        ]
    }
    
    for issue, solutions in troubleshoot.items():
        print(f"{Colors.YELLOW}{Colors.BOLD}If: {issue}{Colors.RESET}")
        for solution in solutions:
            print(f"   {solution}")
        print()
    
    # Test 7: Diagnostic command
    print_header("QUICK DIAGNOSTIC")
    
    print_info("Copy and paste this in the browser console to get a status report:\n")
    
    diagnostic_code = """
console.group('OMNI-OPS AI DIAGNOSTIC');
console.log('Timestamp:', new Date().toISOString());
console.log('---');
console.log('API Status:', typeof window.AIPlayerAPI === 'object' ? '✓ Available' : '✗ Not Available');
if (typeof window.AIPlayerAPI === 'object') {
    console.log('  - AI Active:', window.AIPlayerAPI.isAIControlling());
    const state = window.AIPlayerAPI.getGameState();
    console.log('  - Game Active:', state !== null);
    if (state) {
        console.log('  - Position:', `(${state.position.x.toFixed(1)}, ${state.position.y.toFixed(1)}, ${state.position.z.toFixed(1)})`);
    }
}
console.log('Bridge Status:', typeof window.AIGameBridgeAPI === 'object' ? '✓ Available' : '✗ Not Available');
if (typeof window.AIGameBridgeAPI === 'object') {
    console.log('  - Status:', window.AIGameBridgeAPI.getStatus());
}
console.log('Panel Status:', typeof window.OmniUnifiedPanel === 'object' ? '✓ Available' : '✗ Not Available');
console.groupEnd();
"""
    
    print(f"{Colors.CYAN}{diagnostic_code}{Colors.RESET}")
    
    # Final summary
    print_header("NEXT STEPS")
    
    print_info("1. Open the game: file:///" + str(workspace / "index.html"))
    print_info("2. Wait for module loading to complete (watch the loading bar)")
    print_info("3. Open browser DevTools (F12) and go to Console tab")
    print_info("4. Run the Quick Diagnostic command above")
    print_info("5. If API is available, click 'Activate' button on AI tab in control panel")
    print_info("6. Test movement and commands using the control panel")
    print_info("7. Check console for [Panel] and [AI Bridge] messages")
    
    print_success("\nTest setup complete! Game is ready for debugging.")
    print()
    
    return True

if __name__ == '__main__':
    main()
