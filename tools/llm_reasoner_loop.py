#!/usr/bin/env python3
"""
================================================================================
EXTERNAL LLM REASONER LOOP - Python Version (via Selenium)
================================================================================

This is a companion Python script that connects to a running browser instance
and executes the same LLM → game loop as the JavaScript version.

HOW TO USE:
  1. Ensure Selenium is installed: pip install selenium
  2. Start your game in browser
  3. Run this script: python llm_reasoner_loop.py
  4. Script will connect to browser and start the reasoning loop

The JavaScript version (llm_reasoner_example.js) is simpler to test directly
in the console. This Python version is useful if you want to:
  - Run the reasoner from an external process
  - Collect data across multiple game sessions
  - Integrate with other Python tools/pipelines

================================================================================
"""

import json
import time
import sys
from typing import Dict, Any

# Try to import Selenium (optional - for real browser integration)
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    HAS_SELENIUM = True
except ImportError:
    HAS_SELENIUM = False
    print("[WARNING] Selenium not installed. Using console-paste mode.")
    print("[INFO] Install with: pip install selenium")


# ─────────────────────────────────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────

CONFIG = {
    "max_iterations": 5,
    "delay_ms": 2000,
    "log_snapshots": True,
    "high_level_instruction": "Play defensively: move around the map and shoot enemies when you see them.",
    
    # For Selenium mode:
    "browser_url": "http://localhost:8000",  # Adjust to your game URL
    "headless": False,  # Set to True to run browser in background
}


# ─────────────────────────────────────────────────────────────────────────
# PLACEHOLDER LLM FUNCTION
# ─────────────────────────────────────────────────────────────────────────

def call_llm(prompt: str) -> str:
    """
    Placeholder LLM function.
    
    ★ THIS IS THE INTEGRATION POINT ★
    
    Replace the body of this function with your real LLM API call.
    
    Args:
        prompt: Game snapshot + high-level instruction
        
    Returns:
        Decision string (e.g., "move forward", "patrol", "shoot")
    """
    
    # ─── PLACEHOLDER IMPLEMENTATION ─────────────────────────────────
    # Returns hard-coded example decisions
    
    demo_decisions = [
        "move forward",
        "patrol left side",
        "shoot enemy in sight",
        "move backward and regroup",
        "hold position and scan area",
    ]
    
    import random
    decision = random.choice(demo_decisions)
    
    print(f"[LLM] (PLACEHOLDER) Returning demo decision: \"{decision}\"")
    print(f"[LLM] (PLACEHOLDER) To integrate a real LLM:")
    print(f"      - Call OpenAI: requests.post('https://api.openai.com/...', ...)")
    print(f"      - Call Azure: requests.post('https://*.openai.azure.com/...', ...)")
    print(f"      - Or any other LLM API endpoint")
    print(f"      - Prompt length: {len(prompt)} chars")
    
    return decision
    
    # ─────────────────────────────────────────────────────────────────
    # ★ REAL LLM INTEGRATION TEMPLATE ★
    #
    # Uncomment and modify one of these patterns:
    #
    # ── OpenAI Example ─────────────────────────────────────────────
    # import os
    # from openai import OpenAI
    #
    # def call_llm_openai(prompt: str) -> str:
    #     client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    #     response = client.chat.completions.create(
    #         model="gpt-4-turbo",
    #         messages=[{"role": "user", "content": prompt}],
    #         max_tokens=50,
    #         temperature=0.7,
    #     )
    #     return response.choices[0].message.content.strip()
    #
    # ── Azure Copilot Example ──────────────────────────────────────
    # from azure.ai.inference import ChatCompletionsClient
    # from azure.core.credentials import AzureKeyCredential
    #
    # def call_llm_azure(prompt: str) -> str:
    #     endpoint = "https://{resource}.openai.azure.com/"
    #     key = os.getenv("AZURE_API_KEY")
    #     client = ChatCompletionsClient(endpoint=endpoint, credential=AzureKeyCredential(key))
    #     response = client.complete(
    #         messages=[{"role": "user", "content": prompt}],
    #         model="gpt-4-turbo",
    #     )
    #     return response.choices[0].message.content
    #
    # ── Anthropic Claude Example ───────────────────────────────────
    # import anthropic
    #
    # def call_llm_claude(prompt: str) -> str:
    #     client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    #     message = client.messages.create(
    #         model="claude-3-sonnet-20240229",
    #         max_tokens=100,
    #         messages=[{"role": "user", "content": prompt}],
    #     )
    #     return message.content[0].text
    #
    # ─────────────────────────────────────────────────────────────────


# ─────────────────────────────────────────────────────────────────────────
# REASONER LOOP - Console-Paste Mode (No Selenium)
# ─────────────────────────────────────────────────────────────────────────

def run_reasoner_console_paste():
    """
    Print a ready-to-paste script for the browser console.
    User can copy the output and paste into DevTools.
    """
    print("\n" + "=" * 80)
    print("CONSOLE-PASTE MODE")
    print("=" * 80)
    print("\nInstructions:")
    print("  1. Open your game in browser")
    print("  2. Open DevTools (F12)")
    print("  3. Copy & paste the content of: tools/llm_reasoner_example.js")
    print("  4. Press Enter to start the reasoning loop")
    print("\nAlternatively, manually run this code in your console:")
    print("-" * 80)
    print(open("llm_reasoner_example.js", "r").read() if False else "[See llm_reasoner_example.js file]")
    print("-" * 80)


# ─────────────────────────────────────────────────────────────────────────
# REASONER LOOP - Selenium Mode (Automated Browser Control)
# ─────────────────────────────────────────────────────────────────────────

def run_reasoner_selenium():
    """
    Automated reasoning loop via Selenium WebDriver.
    Connects to running browser, executes decision loop.
    """
    if not HAS_SELENIUM:
        print("[ERROR] Selenium not installed. Install with: pip install selenium")
        print("[INFO] Or use console-paste mode instead (see run_reasoner_console_paste)")
        return
    
    print("\n" + "=" * 80)
    print("SELENIUM BROWSER CONTROL MODE")
    print("=" * 80)
    print(f"Connecting to browser at: {CONFIG['browser_url']}")
    
    try:
        driver = webdriver.Chrome()  # or webdriver.Firefox()
        driver.get(CONFIG['browser_url'])
        
        print(f"✓ Connected to browser")
        time.sleep(2)  # Give page time to load
        
        # ───────────────────────────────────────────────────────────
        # MAIN LOOP
        # ───────────────────────────────────────────────────────────
        for iteration in range(1, CONFIG["max_iterations"] + 1):
            print(f"\n{'─' * 80}")
            print(f"ITERATION {iteration}/{CONFIG['max_iterations']}")
            print(f"{'─' * 80}")
            
            try:
                # ─────────────────────────────────────────────────────
                # STEP 1: Export snapshot
                # ─────────────────────────────────────────────────────
                print("[1] Exporting game snapshot...")
                snapshot_json = driver.execute_script(
                    "return window.AgentBridge.exportSnapshot();"
                )
                snapshot = snapshot_json if isinstance(snapshot_json, dict) else {}
                
                if CONFIG["log_snapshots"]:
                    print("[SNAPSHOT]", json.dumps(snapshot, indent=2))
                else:
                    print(f"[SNAPSHOT] ({len(json.dumps(snapshot))} chars)")
                
                # ─────────────────────────────────────────────────────
                # STEP 2: Construct LLM prompt
                # ─────────────────────────────────────────────────────
                print("[2] Constructing LLM prompt...")
                prompt = f"""
Game State:
{json.dumps(snapshot, indent=2)}

Instruction: {CONFIG['high_level_instruction']}

Respond with a single short command (3-10 words max).
Examples: "move forward", "patrol left", "shoot enemy", "take cover"
                """.strip()
                
                print(f"[PROMPT] ({len(prompt)} chars)")
                
                # ─────────────────────────────────────────────────────
                # STEP 3: Call LLM
                # ─────────────────────────────────────────────────────
                print("[3] Calling LLM for decision...")
                decision = call_llm(prompt)
                print(f"[DECISION] \"{decision}\"")
                
                # ─────────────────────────────────────────────────────
                # STEP 4: Enqueue command
                # ─────────────────────────────────────────────────────
                print("[4] Enqueueing command...")
                driver.execute_script(
                    f"window.AgentBridge.enqueueCommand('{decision}');"
                )
                print(f"[SUCCESS] Command enqueued: \"{decision}\"")
                
            except Exception as e:
                print(f"[ERROR] Iteration {iteration} failed: {e}")
            
            # ───────────────────────────────────────────────────────
            # STEP 5: Sleep
            # ───────────────────────────────────────────────────────
            if iteration < CONFIG["max_iterations"]:
                delay_sec = CONFIG["delay_ms"] / 1000
                print(f"\n[SLEEP] Waiting {delay_sec}s before next iteration...")
                time.sleep(delay_sec)
        
        print("\n" + "=" * 80)
        print("REASONER LOOP COMPLETE")
        print("=" * 80)
        
        driver.quit()
        
    except Exception as e:
        print(f"[FATAL ERROR] {e}")
        sys.exit(1)


# ─────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n╔═══════════════════════════════════════════════════════════════╗")
    print("║ EXTERNAL LLM REASONER - Python Version                        ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print(f"\nConfig: {json.dumps(CONFIG, indent=2)}")
    
    # Choose mode based on availability
    if HAS_SELENIUM:
        print("\n[PROMPT] Select mode:")
        print("  [1] Selenium (automated browser control)")
        print("  [2] Console Paste (manual paste into DevTools)")
        
        choice = input("\nYour choice (1 or 2): ").strip()
        if choice == "1":
            run_reasoner_selenium()
        else:
            run_reasoner_console_paste()
    else:
        print("\n[INFO] Selenium not available; using console-paste mode")
        run_reasoner_console_paste()
