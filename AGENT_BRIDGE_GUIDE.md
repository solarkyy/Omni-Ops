# Agent Bridge Integration Guide

## Overview

The **Agent Bridge** is a minimal, clean bridge between your in-game **IntelligentAgent** and external reasoning systems (LLM, Copilot, or other AI tools). It enables:

- **External commands**: Send natural language instructions from an LLM to the agent
- **State snapshots**: Export compact game state + recent actions for LLM analysis
- **Dev-only mode**: Opt-in bridge that doesn't affect normal gameplay

## Files Changed

### 1. **ai/AgentBridge.js** (NEW)
- Core bridge module with two main methods
- ~180 lines, well-documented
- Exposes `window.AgentBridge` global

### 2. **index.html**
- Added script tag: `<script src="ai/AgentBridge.js" defer></script>`
- Loaded after `IntelligentAgent.js`

### 3. **js/omni-unified-control-panel.js**
- Added "Copy Snapshot" button in AI tab
- Added `copySnapshot()` method to OmniUnifiedPanel
- Displays visual feedback when snapshot is copied

## API Reference

### `AgentBridge.enqueueCommand(text: string)`

Forwards a natural language command to IntelligentAgent and logs it to the AI Dev Log.

```javascript
// From console or external script:
window.AgentBridge.enqueueCommand('move forward');
// → Returned: { ok: true, message: 'Command processed', result: {...} }

window.AgentBridge.enqueueCommand('reload weapon');
// → Forwards to IntelligentAgent.onCommand(), logs to AI Dev Log
```

**Parameters:**
- `text` (string): Natural language command like "explore", "patrol", "status", etc.

**Returns:**
```javascript
{
  ok: boolean,           // Success/failure indicator
  message: string,       // Human-readable result
  result: object         // IntelligentAgent's response object
}
```

### `AgentBridge.exportSnapshot()`

Returns a compact JSON snapshot of current game state + recent AI actions.

```javascript
const snapshot = window.AgentBridge.exportSnapshot();
console.log(JSON.stringify(snapshot, null, 2));
```

**Returns:**
```javascript
{
  timestamp: "2026-02-11T14:30:45.123Z",
  playerState: {
    position: { x: 15.5, y: 1.8, z: -23.2 },
    yaw: 0.45,
    pitch: -0.2,
    health: 85,
    ammo: 18,
    reserveAmmo: 62,
    stamina: 75,
    mode: "FPS",
    isAiming: false,
    isReloading: false
  },
  agentState: {
    enabled: true,
    currentMode: "explore",
    currentObjective: "patrol area"
  },
  recentActions: [
    { time: "14:30:44", message: "Command: patrol area", level: "info" },
    { time: "14:30:45", message: "Exploration mode active.", level: "info" },
    ...  // Last 8 entries
  ],
  bridgeReady: true
}
```

### `AgentBridge.status()`

Print bridge status to console.

```javascript
window.AgentBridge.status();
// → Logs { bridgeReady: true, gameActive: true, ... }
```

## Testing In-Game

### Step 1: Start Game
1. Open the game in a browser
2. Start a single-player session
3. Press `Tab` to open the Unified Control Panel (lower right)

### Step 2: Test enqueueCommand()
**Method A: Using the AI Tab**
1. Click the **AI** tab in the Unified Control Panel
2. In the "AI Dev Command" input field, type: `explore`
3. Click **Send**
   - The command is forwarded to IntelligentAgent
   - Appears in the AI Dev Log below
   - Agent starts exploring behavior

**Method B: Using Browser Console**
1. Open browser **Developer Console** (F12)
2. Run: `window.AgentBridge.enqueueCommand('patrol')`
3. Check response in console
4. Watch agent behavior change in-game

### Step 3: Test exportSnapshot()
**Method A: Using the "Copy Snapshot" Button (Easiest)**
1. In the Unified Control Panel, go to **AI** tab
2. Click the blue **📋 Copy Snapshot** button
   - Snapshot is copied to clipboard
   - Console shows: `✓ Snapshot copied to clipboard!`
   - Message disappears after 3 seconds

**Method B: Using Browser Console**
1. Open Developer Console (F12)
2. Run: `const snap = window.AgentBridge.exportSnapshot(); console.log(JSON.stringify(snap, null, 2));`
3. Snapshot appears in console as formatted JSON
4. Copy from console directly

**Method C: Export to External File**
```javascript
// In console:
const snap = window.AgentBridge.exportSnapshot();
const jsonStr = JSON.stringify(snap, null, 2);
// Copy jsonStr to a file or send to external tool
```

### Step 4: Test Full Loop (LLM Integration Ready)
1. Copy a snapshot using the button
2. Analyze it (in your head or with an external tool)
3. Decide on next action (e.g., "move to ammo crate")
4. Send command via: `window.AgentBridge.enqueueCommand('move to ammo crate')`
5. Read new snapshot to see state change

## Example External Workflow

Here's pseudo-code for an external LLM loop:

```javascript
// External script (e.g., Copilot integration)
async function aiLoop() {
  for (let i = 0; i < 5; i++) {
    // Step 1: Read game state
    const snapshot = window.AgentBridge.exportSnapshot();
    
    // Step 2: Send to LLM
    const analysis = await llamaApi.analyze(snapshot);
    
    // Step 3: Get LLM command
    const nextCommand = analysis.recommendedAction;
    
    // Step 4: Execute in-game
    const result = window.AgentBridge.enqueueCommand(nextCommand);
    console.log('LLM said:', nextCommand, 'Result:', result);
    
    // Step 5: Wait and repeat
    await sleep(2000);
  }
}
```

## Dev Mode Features

### Status Check
```javascript
window.AgentBridge.status();
```
Prints to console:
```
{ 
  bridgeReady: true,
  intelligentAgentReady: true,
  aiPlayerAPIReady: true,
  gameActive: true,
  devMode: true
}
```

### Debug Snapshot Pretty-Print
```javascript
window.AgentBridge.debugPrintSnapshot();
```
Prints formatted snapshot to console with group collapsing for readability.

## Integration Checklist

- ✅ **Files created**: `ai/AgentBridge.js`
- ✅ **HTML updated**: Script tag added
- ✅ **UI updated**: Copy Snapshot button added
- ✅ **Methods implemented**: `enqueueCommand()`, `exportSnapshot()`
- ✅ **No breaking changes**: IntelligentAgent & AIPlayerAPI untouched
- ✅ **Dev-only**: Opt-in, doesn't interfere with normal gameplay
- ✅ **Ready for LLM**: Structured snapshot format for external analysis

## Next Steps (When Ready)

Once you have an external LLM/reasoning engine ready:

1. **Set up the LLM caller**: Create a script that:
   - Reads `window.AgentBridge.exportSnapshot()`
   - Sends snapshot to your LLM/reasoning API
   - Receives decision text
   - Calls `window.AgentBridge.enqueueCommand(decision)`

2. **Test the loop**: Run a few iterations and watch the agent respond

3. **Optimize commands**: Refine natural language to improve command recognition

4. **Add feedback**: Use console logs to debug agent behavior vs. LLM expectations

## Troubleshooting

**"AgentBridge not ready - IntelligentAgent or AIPlayerAPI missing"**
- Problem: Scripts haven't loaded yet
- Solution: Wait a moment, or press F9 to toggle AI (forces initialization)

**Snapshot shows `bridgeReady: false`**
- Problem: Game not active
- Solution: Start a game session first

**"Clipboard error" in console**
- Problem: Browser clipboard permission issue
- Solution: Check browser console security settings; snapshot still prints to console

**Command doesn't execute**
- Problem: Could be invalid command text
- Solution: Check AI Dev Log in panel for error message

## Architecture Notes

The Agent Bridge is intentionally **minimal**:
- No internal state management
- No caching or batching
- Direct proxying to `IntelligentAgent.onCommand()`
- Direct reads from `AIPlayerAPI.getGameState()` and `IntelligentAgent.thoughts`

This keeps it **transparent** and **debuggable** while providing a clean interface for external tools.

---

**Ready to connect your LLM?** Start by calling `window.AgentBridge.exportSnapshot()` in the browser console and examining the output structure!
