/**
 * ============================================================================
 * EXTERNAL LLM REASONER LOOP - PlayStation/Game Integration
 * ============================================================================
 * 
 * Demonstration: Complete LLM-powered game decision loop using command vocabulary
 *   1. Export game state snapshot via AgentBridge.exportSnapshot()
 *   2. Send snapshot + instruction to LLM
 *   3. LLM returns one of the defined commands from COMMAND_VOCABULARY
 *   4. Enqueue command via AgentBridge.enqueueCommand()
 *   5. Sleep and repeat
 * 
 * ★ IMPORTANT: LLM Must Choose from COMMAND_VOCABULARY
 *   The LLM is restricted to these responses:
 *   - "patrol_area"
 *   - "seek_enemies"
 *   - "hold_position"
 *   - "return_to_safe_zone"
 *   - "status"
 * 
 * ★ QUICK START:
 *   Paste this entire file into browser DevTools console (F12 → Console tab)
 *   Press Enter. Loop runs with hard-coded demo commands.
 * 
 * ★ PRODUCTION MODE:
 *   Edit callLLM() function (see INTEGRATION EXAMPLES below at line ~120)
 *   Uncomment one of the real LLM templates (OpenAI / Azure / Claude)
 *   Supply your API key, enable network calls, run loop again
 * 
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────
// ★ COMMAND VOCABULARY ★
// These are the ONLY valid commands the LLM can return
// Document this to your LLM in the prompt
// ─────────────────────────────────────────────────────────────────────────

const COMMAND_VOCABULARY = {
    'patrol_area':           'Slow loop around current sector, stay alert for threats',
    'seek_enemies':          'Move toward enemies and engage them',
    'hold_position':         'Stay near current spot in defensive stance, shoot threats',
    'return_to_safe_zone':   'Navigate back to base or safe area',
    'status':                'Report current game state'
};

// ─────────────────────────────────────────────────────────────────────────
// ★ TOP-LEVEL CONFIGURATION ★
// Edit these values to customize the loop
// ─────────────────────────────────────────────────────────────────────────

const ITERATIONS = 5;
const DELAY_MS = 2000;
const INSTRUCTION = `You are an intelligent game AI. Analyze the game state and choose the best tactical action.

Available commands:
${Object.entries(COMMAND_VOCABULARY).map(([cmd, desc]) => `  - "${cmd}": ${desc}`).join('\n')}

Always respond with ONLY ONE command name from the list above. No explanations, just the command.
Current strategy: Patrol the area, monitor for enemies, engage if spotted. Retreat to base if health is low.`;

// Optional: Set to false to reduce console spam
const LOG_FULL_SNAPSHOTS = false;

// ─────────────────────────────────────────────────────────────────────────
// ★ LLM DECISION FUNCTION ★
// ─────────────────────────────────────────────────────────────────────────
/**
 * callLLM(prompt)
 * 
 * This is the core decision-making function that selects a command.
 * 
 * DEFAULT: Returns hard-coded demo commands from COMMAND_VOCABULARY
 *          (no API calls, always works)
 * 
 * TO USE A REAL LLM: Scroll down and uncomment one of the integration
 * examples below. Each shows how to call OpenAI, Azure, or Claude.
 * 
 * IMPORTANT: Real LLM must be constrained to return ONLY valid commands
 * from COMMAND_VOCABULARY. See prompt formatting in templates.
 * 
 * @param {string} prompt - Game snapshot + instruction
 * @param {object} snapshot - Raw game snapshot (for demo heuristics)
 * @returns {string} - Command name (e.g., "patrol_area", "seek_enemies")
 */
function chooseDemoCommand(snapshot) {
  const safeChoices = ['patrol_area', 'return_to_safe_zone'];
  const unsafeChoices = ['seek_enemies', 'hold_position'];
  const fallbackChoices = [
    'patrol_area',
    'seek_enemies',
    'hold_position',
    'return_to_safe_zone',
    'status'
  ];

  const isInSafeZone = snapshot?.sectorState?.isInSafeZone;
  if (isInSafeZone === true) {
    return safeChoices[Math.floor(Math.random() * safeChoices.length)];
  }
  if (isInSafeZone === false) {
    return unsafeChoices[Math.floor(Math.random() * unsafeChoices.length)];
  }

  return fallbackChoices[Math.floor(Math.random() * fallbackChoices.length)];
}

function callLLM(prompt, snapshot) {
  
  // ─── DEFAULT: HARD-CODED DEMO (no API keys needed) ─────────────────
  // This is always active. To use a real LLM, comment this section out
  // and uncomment one of the integration examples below.
  
  const command = chooseDemoCommand(snapshot);
  
  console.log(`[LLM-DEMO] Decision: "${command}" (from COMMAND_VOCABULARY)`);
  console.log(`[LLM-DEMO] (To use real LLM: see INTEGRATION EXAMPLES below)`);
  
  return command;
  
  
  // ═════════════════════════════════════════════════════════════════════
  // ★ INTEGRATION EXAMPLES ★
  // 
  // Uncomment ONE of the integration functions below when ready to connect
  // a real LLM. Each example shows how to constrain the LLM to the 
  // command vocabulary.
  // 
  // STEP 1: Paste the example that matches your LLM provider below
  // STEP 2: Add your API key and endpoint URL
  // STEP 3: Comment out the HARD-CODED DEMO section above
  // STEP 4: Uncomment one of: return await callLLM_OpenAI(prompt);  etc.
  // 
  // ═════════════════════════════════════════════════════════════════════
  
  
  // ─────────────────────────────────────────────────────────────────────
  // EXAMPLE 1: OpenAI (GPT-4 / GPT-3.5)
  // ─────────────────────────────────────────────────────────────────────
  /*
  // 1. Get your API key from: https://platform.openai.com/api-keys
  // 2. Replace YOUR_OPENAI_API_KEY below with the actual key
  // 3. Uncomment this entire function block
  // 4. At the end of callLLM(), replace "return command;" with:
  //    return await callLLM_OpenAI(prompt);
  
  async function callLLM_OpenAI(prompt) {
    const apiKey = "YOUR_OPENAI_API_KEY";  // ← REPLACE THIS
    const validCommands = Object.keys(COMMAND_VOCABULARY);
    
    const systemPrompt = `You are a tactical game AI. You must respond with ONLY one command name from this list:
${validCommands.join(', ')}

Do not explain. Do not use other words. Always respond with exactly one command name.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',  // or 'gpt-3.5-turbo' for cheaper
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 20,
        temperature: 0.5,
      }),
    });
    const json = await response.json();
    if (json.error) {
      console.error('[LLM-OPENAI] Error:', json.error.message);
      return 'patrol_area';  // fallback
    }
    const response_text = json.choices[0].message.content.trim().toLowerCase();
    // Validate response is in vocabulary
    if (validCommands.includes(response_text)) {
      return response_text;
    }
    console.warn('[LLM-OPENAI] Invalid response:', response_text, '- falling back to patrol_area');
    return 'patrol_area';
  }
  */
  
  
  // ─────────────────────────────────────────────────────────────────────
  // EXAMPLE 2: Azure Copilot / OpenAI
  // ─────────────────────────────────────────────────────────────────────
  /*
  // 1. Get your endpoint from Azure: https://portal.azure.com/
  // 2. Get your API key from Azure
  // 3. Replace YOUR_AZURE_ENDPOINT and YOUR_AZURE_KEY below
  // 4. Uncomment this entire function block
  // 5. At the end of callLLM(), replace "return command;" with:
  //    return await callLLM_Azure(prompt);
  
  async function callLLM_Azure(prompt) {
    const endpoint = "https://YOUR_RESOURCE_NAME.openai.azure.com/";  // ← REPLACE
    const apiKey = "YOUR_AZURE_API_KEY";  // ← REPLACE
    const deploymentName = "gpt-4-turbo";  // Adjust to your deployment name
    const validCommands = Object.keys(COMMAND_VOCABULARY);
    
    const systemPrompt = `You are a tactical game AI. You must respond with ONLY one command name from this list:
${validCommands.join(', ')}

Do not explain. Do not use other words. Always respond with exactly one command name.`;
    
    const response = await fetch(
      `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 20,
          temperature: 0.5,
        }),
      }
    );
    const json = await response.json();
    if (json.error) {
      console.error('[LLM-AZURE] Error:', json.error.message);
      return 'patrol_area';  // fallback
    }
    const response_text = json.choices[0].message.content.trim().toLowerCase();
    // Validate response is in vocabulary
    if (validCommands.includes(response_text)) {
      return response_text;
    }
    console.warn('[LLM-AZURE] Invalid response:', response_text, '- falling back to patrol_area');
    return 'patrol_area';
  }
  */
  
  
  // ─────────────────────────────────────────────────────────────────────
  // EXAMPLE 3: Anthropic Claude
  // ─────────────────────────────────────────────────────────────────────
  /*
  // 1. Get your API key from: https://console.anthropic.com/
  // 2. Replace YOUR_ANTHROPIC_API_KEY below
  // 3. Uncomment this entire function block
  // 4. At the end of callLLM(), replace "return command;" with:
  //    return await callLLM_Claude(prompt);
  
  async function callLLM_Claude(prompt) {
    const apiKey = "YOUR_ANTHROPIC_API_KEY";  // ← REPLACE THIS
    const validCommands = Object.keys(COMMAND_VOCABULARY);
    
    const systemPrompt = `You are a tactical game AI. You must respond with ONLY one command name from this list:
${validCommands.join(', ')}

Do not explain. Do not use other words. Always respond with exactly one command name.`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',  // or 'claude-3-opus-20240229' for better
        max_tokens: 20,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const json = await response.json();
    if (json.error) {
      console.error('[LLM-CLAUDE] Error:', json.error.message);
      return 'patrol_area';  // fallback
    }
    const response_text = json.content[0].text.trim().toLowerCase();
    // Validate response is in vocabulary
    if (validCommands.includes(response_text)) {
      return response_text;
    }
    console.warn('[LLM-CLAUDE] Invalid response:', response_text, '- falling back to patrol_area');
    return 'patrol_area';
  }
  */
  
  
  // ═════════════════════════════════════════════════════════════════════
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN REASONING LOOP
// ─────────────────────────────────────────────────────────────────────────

async function runReasonerLoop() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║ EXTERNAL LLM REASONER LOOP STARTING                            ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(`ITERATIONS: ${ITERATIONS}`);
  console.log(`DELAY: ${DELAY_MS}ms`);
  console.log(`INSTRUCTION: "${INSTRUCTION}"`);
  console.log("");
  
  // Verify AgentBridge is available
  if (typeof window.AgentBridge === "undefined") {
    console.error("[ERROR] window.AgentBridge not found! Is the game running?");
    return;
  }
  
  // ───────────────────────────────────────────────────────────────────
  // MAIN LOOP
  // ───────────────────────────────────────────────────────────────────
  for (let iteration = 1; iteration <= ITERATIONS; iteration++) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`ITERATION ${iteration}/${ITERATIONS}`);
    console.log(`${"─".repeat(70)}`);
    
    try {
      // ─────────────────────────────────────────────────────────────
      // STEP 1: Export game state snapshot
      // ─────────────────────────────────────────────────────────────
      console.log("[1] Exporting game state snapshot...");
      const snapshot = window.AgentBridge.exportSnapshot();
      
      if (LOG_FULL_SNAPSHOTS) {
        console.log("[SNAPSHOT]", JSON.stringify(snapshot, null, 2));
      } else {
        console.log(`[SNAPSHOT] (${JSON.stringify(snapshot).length} chars)`);
      }
      
      // ─────────────────────────────────────────────────────────────
      // STEP 2: Construct prompt for LLM
      // ─────────────────────────────────────────────────────────────
      console.log("[2] Constructing LLM prompt...");
      const contextBlock = (snapshot.aiContext?.files || [])
        .map((file) => `- ${file.name}: ${file.excerpt}`)
        .join('\n');
      const prompt = `
Game State:
${JSON.stringify(snapshot, null, 2)}

    AI_CONTEXT (must follow these rules and constraints):
    ${contextBlock || 'AI context not loaded'}

Strategic Instruction: ${INSTRUCTION}
      `.trim();
      
      console.log(`[PROMPT] (${prompt.length} chars)`);
      
      // ─────────────────────────────────────────────────────────────
      // STEP 3: Call LLM to get next decision
      // ─────────────────────────────────────────────────────────────
      console.log("[3] Calling LLM for command decision...");
      const command = callLLM(prompt, snapshot);
      console.log(`[COMMAND] "${command}" (from COMMAND_VOCABULARY)`);
      
      // Validate command is in vocabulary
      const vocabKeys = Object.keys(COMMAND_VOCABULARY);
      if (!vocabKeys.includes(command.toLowerCase())) {
        console.warn(`[ERROR] Invalid command "${command}" - not in vocabulary!`);
        console.warn(`   Valid commands: ${vocabKeys.join(', ')}`);
        continue;
      };
      
      // ─────────────────────────────────────────────────────────────
      // STEP 4: Enqueue command to game
      // ─────────────────────────────────────────────────────────────
      console.log("[4] Enqueueing command to game...");
      window.AgentBridge.enqueueCommand(command);
      console.log(`[SUCCESS] Command enqueued: "${command}"`);
      
    } catch (error) {
      console.error(`[ERROR] Iteration ${iteration} failed:`, error);
    }
    
    // ───────────────────────────────────────────────────────────────
    // STEP 5: Sleep before next iteration
    // ───────────────────────────────────────────────────────────────
    if (iteration < ITERATIONS) {
      console.log(`\n[SLEEP] Waiting ${DELAY_MS}ms before next iteration...`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
  
  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║ REASONER LOOP COMPLETE                                         ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
}

// ─────────────────────────────────────────────────────────────────────────
// ★ HOW TO USE THIS SCRIPT ★
// ─────────────────────────────────────────────────────────────────────────
//
// STEP 1: QUICK START (Demo Mode - No API Keys Needed)
// ───────────────────────────────────────────────────────────────────────
// 1. Open your game in a web browser
// 2. Press F12 to open DevTools → go to "Console" tab
// 3. Copy this ENTIRE file (or scroll down to the next section)
// 4. Paste into the console
// 5. Press Enter
// 6. Watch the console output as the loop runs with hard-coded commands
//
// EXPECTED OUTPUT:
//   [1] Exporting game state snapshot...
//   [SNAPSHOT] {...game state json...}
//   [3] Calling LLM for command decision...
//   [LLM-DEMO] Decision: "patrol_area" (from COMMAND_VOCABULARY)
//   [COMMAND] "patrol_area" (from COMMAND_VOCABULARY)
//   [4] Enqueueing command to game...
//   [SUCCESS] Command enqueued: "patrol_area"
//
// ─────────────────────────────────────────────────────────────────────────
// STEP 2: UNDERSTAND THE COMMAND VOCABULARY
// ───────────────────────────────────────────────────────────────────────
// The LLM (real or demo) must ALWAYS respond with one of:
//   - patrol_area       : Slow loop around current sector, stay alert
//   - seek_enemies      : Move toward enemies and engage them
//   - hold_position     : Stay in place in defensive stance, shoot threats
//   - return_to_safe_zone : Navigate back to base
//   - status            : Report current game state
//
// Each command implements specific AI behavior in IntelligentAgent.tick()
//
// ─────────────────────────────────────────────────────────────────────────
// STEP 3: TEST COMMANDS MANUALLY (Before Running LLM Loop)
// ───────────────────────────────────────────────────────────────────────
//
// Test from AI Dev Command Box:
//   Open the game, press F12 to see the AI Dev Command panel.
//   Manually type and submit each command to verify behavior:
//   
//   window.AgentBridge.enqueueCommand('patrol_area');
//   → Look for: AI walks around slowly, scans area left/right
//   → Log shows: "Mode: PATROL_AREA | Sector: (...position...)"
//
//   window.AgentBridge.enqueueCommand('seek_enemies');
//   → Look for: AI moves forward aggressively, fires periodically
//   → Log shows: "Mode: SEEK_ENEMIES | Scanning..." then "Hunting..."
//
//   window.AgentBridge.enqueueCommand('hold_position');
//   → Look for: AI stands still/minimal movement, defensive stance
//   → Log shows: "Mode: HOLD_POSITION | Sector:... | Defensive stance"
//
//   window.AgentBridge.enqueueCommand('return_to_safe_zone');
//   → Look for: AI moves steadily forward toward base position
//   → Log shows: "Mode: RETURN_TO_SAFE_ZONE | Moving to base..."
//
//   window.AgentBridge.enqueueCommand('status');
//   → Log shows: Current position, health, ammo, mode, objective, etc.
//
// Test from Browser Console Directly:
//   You can also test directly from console without running full loop:
//   1. Make sure AI is enabled: window.IntelligentAgent.enable()
//   2. Activate AI control: window.AIPlayerAPI.activateAI()
//   3. Send command: window.AgentBridge.enqueueCommand('patrol_area')
//   4. Watch the AI move!
//   5. Check Dev Log (F9 or look for overlay in top-left)
//
// ─────────────────────────────────────────────────────────────────────────
// STEP 4: CUSTOMIZE THE LOOP (Edit at Top of File)
// ───────────────────────────────────────────────────────────────────────
// Look for these lines near the top:
//   const ITERATIONS = 5;              ← How many decision loops
//   const DELAY_MS = 2000;             ← Wait time between decisions (ms)
//   const INSTRUCTION = "...";         ← Strategy instruction sent to LLM
//
// Change these values to customize behavior, then re-run the script.
//
// ─────────────────────────────────────────────────────────────────────────
// STEP 5: CONNECT A REAL LLM (When Ready)
// ───────────────────────────────────────────────────────────────────────
// The callLLM() function now returns ONLY valid commands from VOCABULARY.
// Real LLM examples are constrained to return valid commands with fallback.
//
// A) OPENAI (GPT-4 / GPT-3.5-turbo):
//    - Get key from https://platform.openai.com/api-keys
//    - Uncomment the "EXAMPLE 1: OpenAI" block in callLLM() function
//    - Add your API key where it says YOUR_OPENAI_API_KEY
//    - Comment out the hard-coded demo section at top of callLLM()
//    - Change the return statement to: return await callLLM_OpenAI(prompt);
//    - Re-paste and run
//
// B) AZURE COPILOT:
//    - Get endpoint and key from Azure Portal
//    - Uncomment the "EXAMPLE 2: Azure Copilot" block in callLLM() function
//    - Add your endpoint and key
//    - Comment out the hard-coded demo section
//    - Change return statement to: return await callLLM_Azure(prompt);
//    - Re-paste and run
//
// C) ANTHROPIC CLAUDE:
//    - Get key from https://console.anthropic.com/
//    - Uncomment the "EXAMPLE 3: Anthropic Claude" block in callLLM() function
//    - Add your API key
//    - Comment out the hard-coded demo section
//    - Change return statement to: return await callLLM_Claude(prompt);
//    - Re-paste and run
//
// ─────────────────────────────────────────────────────────────────────────
// TROUBLESHOOTING
// ─────────────────────────────────────────────────────────────────────────
// Q: "window.AgentBridge not found"
// A: Make sure game is fully loaded. Wait 2-3 seconds after page loads,
//    then try again.
//
// Q: "Invalid command ... not in vocabulary!"
// A: LLM returned a command not in COMMAND_VOCABULARY. Check LLM response.
//    Demo mode uses only valid commands. Real LLM needs better prompting.
//
// Q: API calls get CORS errors
// A: Some LLM endpoints don't allow direct browser requests. Either:
//    - Use the Python version (tools/llm_reasoner_loop.py) instead
//    - Set up a backend proxy to forward requests
//    - Use a CORS-enabled LLM endpoint
//
// Q: Commands not appearing in-game
// A: Check if AI is enabled. Run: window.AIPlayerAPI.activateAI()
//    Review the Dev Log in your game to see if commands are being queued.
//    Make sure IntelligentAgent.tick() is running (F9 toggles it).
//
// ─────────────────────────────────────────────────────────────────────────
// START THE LOOP
// ─────────────────────────────────────────────────────────────────────────

// Run the reasoner loop
runReasonerLoop().catch((err) => {
  console.error("[FATAL ERROR]", err);
});

console.log("\n[INFO] Reasoner loop started. Check console for progress.");
console.log("[INFO] Commands must come from COMMAND_VOCABULARY - see top of file.");
console.log("[INFO] If using a real LLM, uncomment one of the INTEGRATION EXAMPLES above.");

