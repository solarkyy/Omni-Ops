## External LLM Reasoner - Quick Start Guide

Created two minimal scripts for running the LLM → game loop externally:

### Option 1: Browser Console (JavaScript) ✓ **Recommended for Testing**

**File:** `tools/llm_reasoner_example.js`

**How to run:**
1. Start your game in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Copy and paste the entire content of `llm_reasoner_example.js`
5. Press Enter
6. Watch console for snapshot → decision → command loop output

**Why use this:**
- No dependencies needed
- Runs immediately in browser console
- Direct access to window.AgentBridge
- Good for testing and debugging
- Easy to tweak CONFIG at top

**Example console output:**
```
╔════════════════════════════════════════════════════════════════╗
║ EXTERNAL LLM REASONER LOOP STARTING                            ║
╚════════════════════════════════════════════════════════════════╝
Config: { maxIterations: 5, delayMs: 2000, ... }

──────────────────────────────────────────────────────────────────
ITERATION 1/5
──────────────────────────────────────────────────────────────────
[1] Exporting game state snapshot...
[SNAPSHOT] { player: { position: [x,y], health: 100 }, ... }
[2] Constructing LLM prompt...
[PROMPT] (1240 chars)
[3] Calling LLM for decision...
[LLM] (PLACEHOLDER) Returning demo decision: "move forward"
[4] Enqueueing command to game...
[SUCCESS] Command enqueued: "move forward"
[SLEEP] Waiting 2000ms before next iteration...
```

---

### Option 2: Python External Process

**File:** `tools/llm_reasoner_loop.py`

**How to run:**
```bash
cd tools/
python llm_reasoner_loop.py
```

**Why use this:**
- Automate reasoning from external Python process
- Easier integration with data pipelines
- Can collect metrics across sessions
- Better for production deployment

**Modes:**
- **Selenium mode:** Connects to running browser, automates the loop
  - Requires: `pip install selenium`
  - Requires: Chrome/Firefox WebDriver binary
- **Console Paste mode:** Prints ready-to-paste script for manual console use

---

## Integration Points: Switching to Real LLMs

Both scripts have clearly marked `callLLM(prompt)` placeholder functions. Replace that function body:

### Common LLM APIs (Templates Included)

**JavaScript version** has templates for:
- OpenAI GPT-4
- Azure Copilot
- Anthropic Claude

**Python version** has templates for same APIs.

### Example: Switching JavaScript to OpenAI

In `tools/llm_reasoner_example.js`, replace the `callLLM()` function:

```javascript
// BEFORE (hard-coded demo):
function callLLM(prompt) {
  return "move forward";  // hard-coded
}

// AFTER (OpenAI integration):
async function callLLM(prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${YOUR_OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
    }),
  });
  const json = await response.json();
  return json.choices[0].message.content.trim();
}
```

Then update the loop to handle async:
```javascript
async function runReasonerLoop() {
  // ... existing code ...
  const decision = await callLLM(prompt);  // Add await
  // ... rest of loop ...
}
```

---

## What Each Part Does

| Step | Input | Output | Code |
|------|-------|--------|------|
| 1 | (none) | Game snapshot JSON | `window.AgentBridge.exportSnapshot()` |
| 2 | Snapshot + instruction | LLM prompt string | Construct prompt with JSON |
| 3 | Prompt | Decision text | `callLLM(prompt)` → **YOUR LLM HERE** |
| 4 | Decision | (none, side effect) | `window.AgentBridge.enqueueCommand(text)` |
| 5 | (none) | (none, sleep) | `setTimeout()` / `time.sleep()` |

---

## To Customize

**JavaScript (`llm_reasoner_example.js`):**
- Line 16-20: `REASONER_CONFIG` – iterations, delay, instruction
- Line 60-80: `callLLM()` – placeholder LLM call (replace this)
- Line 140+: `runReasonerLoop()` – main loop logic

**Python (`llm_reasoner_loop.py`):**
- Line 29-35: `CONFIG` – same settings
- Line 53+: `call_llm()` – placeholder (replace this)
- Line 180+: `run_reasoner_selenium()` – main loop logic

---

## Troubleshooting

**"window.AgentBridge not found"**
- Ensure game is fully loaded in browser
- Verify AgentBridge is exported from your game code
- Try running loop 2-3 seconds after page loads

**CORS errors when calling real LLM API**
- Some LLM endpoints don't allow browser requests (CORS)
- Solution: Run loop from Python instead, or use a proxy backend
- Or configure your API to allow your domain

**Commands not being processed**
- Check `enqueueCommand()` accepts the decision string format
- Verify decision text matches expected command patterns
- Review game Dev Log in snapshot to see if commands are being queued

---

## Next Steps

1. **Test the demo loop** with `llm_reasoner_example.js`
2. **Pick your LLM** (OpenAI, Azure, Claude, local model)
3. **Replace `callLLM()`** with real API call (use templates in script)
4. **Tune the prompt** – improve decision quality by adding game context
5. **Extract metrics** – log decisions and outcomes for analysis

Enjoy! 🎮
