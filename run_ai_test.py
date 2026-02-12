#!/usr/bin/env python3
"""
OMNI-OPS AI Activation Test Runner
Guides you through testing the AI system step-by-step
"""

import webbrowser
import os
import time
import platform
from pathlib import Path

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def clear_screen():
    os.system('cls' if platform.system() == 'Windows' else 'clear')

def print_header(text, width=60):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*width}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(width)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*width}{Colors.RESET}\n")

def print_step(step_num, text):
    print(f"{Colors.BOLD}{Colors.YELLOW}[Step {step_num}] {text}{Colors.RESET}")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.RESET}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.RESET}")

def print_input_prompt(text):
    return input(f"{Colors.BOLD}{Colors.MAGENTA}→ {text}{Colors.RESET}")

def main():
    clear_screen()
    print_header("🎮 OMNI-OPS AI SYSTEM TEST RUNNER")
    
    workspace = Path(__file__).parent
    
    # Step 1: Verify files
    print_step(1, "Verifying Files")
    required_files = {
        'index.html': 'Game',
        'test_ai_browser.html': 'Test Interface',
    }
    
    all_present = True
    for filename, description in required_files.items():
        path = workspace / filename
        if path.exists():
            print_success(f"{description}: {filename}")
        else:
            print_error(f"{description}: {filename} NOT FOUND")
            all_present = False
    
    if not all_present:
        print_error("\nSome required files are missing!")
        return False
    
    # Step 2: Open game
    print_step(2, "Opening Game")
    game_url = (workspace / "index.html").as_uri()
    print_info(f"Opening: {game_url}")
    webbrowser.open(game_url)
    
    print_info("Game window opened. Waiting for it to load...")
    print_info("You should see a loading bar. Wait for it to complete.")
    
    # Step 3: Open test interface
    print_step(3, "Opening Test Interface")
    test_url = (workspace / "test_ai_browser.html").as_uri()
    print_info(f"Opening: {test_url}")
    webbrowser.open(test_url)
    
    print_info("Test interface opened in a new tab.")
    
    # Step 4: Wait for game load
    print_step(4, "Waiting for Game Initialization")
    print_info("The game is loading modules. This may take 10-15 seconds...")
    
    for i in range(15, 0, -1):
        print(f"  Waiting... {i}s remaining", end='\r')
        time.sleep(1)
    
    print("\n" + Colors.GREEN + "✓ Loading time complete\n" + Colors.RESET)
    
    # Step 5: Instructions
    print_step(5, "Testing Instructions")
    
    print(f"""
{Colors.BOLD}In the Test Interface window:{Colors.RESET}

1. Look at the "System Status" section:
   - Should show "✓ API Available" in green
   - AI Status should show "🤖 AI INACTIVE"
   
2. If API is available:
   {Colors.CYAN}→ Click "{Colors.BOLD}▶️ Activate AI{Colors.CYAN}"{Colors.RESET}
   
3. Test Movement (from Test Interface):
   {Colors.CYAN}→ Click "{Colors.BOLD}⬆️ Forward{Colors.CYAN}"{Colors.RESET}
   {Colors.CYAN}→ Watch the player move in the game window{Colors.RESET}
   
4. Test Actions:
   {Colors.CYAN}→ Click "{Colors.BOLD}💨 Jump{Colors.CYAN}"{Colors.RESET}
   {Colors.CYAN}→ Click "{Colors.BOLD}🔫 Shoot{Colors.CYAN}"{Colors.RESET}
   
5. Get Game State:
   {Colors.CYAN}→ Click "{Colors.BOLD}🎮 Get Game State{Colors.CYAN}"{Colors.RESET}
   {Colors.CYAN}→ Should show player position, health, ammo, etc.{Colors.RESET}

{Colors.BOLD}Troubleshooting:{Colors.RESET}

If "API Not Available":
   - Check that game window shows loading bar completed
   - Sometimes takes 20+ seconds for full initialization
   - Try clicking "Check API Status" again after 10 seconds

If game doesn't start:
   - In game window, click "Quick Play" to start a game
   - AI system only works when game is active

If commands don't execute:
   - Make sure "AI ACTIVE" is shown and highlighted in green
   - Check browser console (F12) for any error messages
""")
    
    # Step 6: Guided testing
    print_step(6, "Guided Testing")
    
    tests = [
        {
            'name': 'Check API Status',
            'button': 'Click "📊 Check API Status" button',
            'expected': 'Should show ✓ API Available'
        },
        {
            'name': 'Activate AI',
            'button': 'Click "▶️ Activate AI" button',
            'expected': 'AI Status should turn green "🤖 AI ACTIVE"'
        },
        {
            'name': 'Move Forward',
            'button': 'Click "⬆️ Forward" button',
            'expected': 'Player should move forward in game'
        },
        {
            'name': 'Get Game State',
            'button': 'Click "🎮 Get Game State" button',
            'expected': 'Log should show position, health, ammo'
        },
        {
            'name': 'Deactivate AI',
            'button': 'Click "⏹️ Deactivate AI" button',
            'expected': 'AI Status should turn red "🤖 AI INACTIVE"'
        }
    ]
    
    for i, test in enumerate(tests, 1):
        print(f"\n{Colors.BOLD}Test {i}: {test['name']}{Colors.RESET}")
        print(f"  {Colors.CYAN}{test['button']}{Colors.RESET}")
        print(f"  {Colors.YELLOW}Expected: {test['expected']}{Colors.RESET}")
        
        response = print_input_prompt(f"Did test {i} pass? (y/n): ").strip().lower()
        
        if response == 'y':
            print_success(f"Test {i} passed!")
        elif response == 'n':
            print_error(f"Test {i} failed. Check:")
            print(f"  {Colors.CYAN}- Browser console (F12) for errors{Colors.RESET}")
            print(f"  {Colors.CYAN}- Game window is loaded and game started{Colors.RESET}")
            print(f"  {Colors.CYAN}- Run 'Run Full Diagnostic' button{Colors.RESET}")
        elif response == 's':
            print_info("Skipping test...")
        else:
            print_info("Invalid input. Continuing...")
    
    # Final summary
    print_step(7, "Testing Complete")
    
    print(f"""
{Colors.BOLD}{Colors.GREEN}
✓ AI System Testing Complete!
{Colors.RESET}

{Colors.BOLD}Next Steps:{Colors.RESET}
1. If all tests passed: {Colors.GREEN}AI system is working correctly{Colors.RESET}
2. If some failed: Check the troubleshooting section above
3. For detailed diagnostics: Click "🔍 Run Full Diagnostic" in test interface
4. For console testing: Check {Colors.CYAN}AI_ACTIVATION_TEST_GUIDE.md{Colors.RESET}

{Colors.BOLD}Documentation:{Colors.RESET}
- Full guide: AI_ACTIVATION_TEST_GUIDE.md
- Python test: test_ai_comprehensive.py
- Browser test: test_ai_browser.html

{Colors.BOLD}Additional Resources:{Colors.RESET}
- Game console: F12 in game window
- Test console: F12 in test window
- Check logs: Look for [Panel], [AI Bridge], [AI] prefixes
""")
    
    response = print_input_prompt("\nWould you like to view the full documentation? (y/n): ").strip().lower()
    
    if response == 'y':
        guide_path = workspace / "AI_ACTIVATION_TEST_GUIDE.md"
        if guide_path.exists():
            os.startfile(str(guide_path)) if platform.system() == 'Windows' else os.system(f'open "{guide_path}"')
            print_success("Documentation opened!")
        else:
            print_error("Documentation file not found")
    
    print_success("Test runner complete!")
    print_info("Keep both windows open for continued testing.\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Test interrupted by user{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.RED}Error: {e}{Colors.RESET}")
