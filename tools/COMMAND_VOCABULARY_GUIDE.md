# Command Vocabulary Guide

## Summary of Changes

### Files Modified

1. **[ai/IntelligentAgent.js](../ai/IntelligentAgent.js)**
   - Added `COMMAND_VOCABULARY` object defining 5 commands at the top
   - Rewrote `onCommand()` method to only accept vocabulary commands
   - Extended `tick()` method with full behavior implementation for each mode
   - Added state tracking: `patrolDirection`, `lastEnemyPos`, `safeZonePos`

2. **[tools/llm_reasoner_example.js](llm_reasoner_example.js)**
   - Added `COMMAND_VOCABULARY` object in config (mirrors IntelligentAgent)
   - Updated demo `callLLM()` to return only valid commands
   - Updated LLM templates (OpenAI, Azure, Claude) to constrain responses
   - Expanded "How to Use" with command reference and testing procedures
   - Added command validation before enqueueing

---

## Command Vocabulary

| Command | Description | Behavior |
|---------|-------------|----------|
| **patrol_area** | Slow loop around current sector, stay alert | Walks slowly, scans 360°, logs position, stays in vicinity |
| **seek_enemies** | Move toward enemies and engage them | Moves forward aggressively, fires periodically, scans for targets |
| **hold_position** | Stay near current spot in defensive stance | Minimal movement (defensive sway), shoots threats, scans area |
| **return_to_safe_zone** | Navigate back to base or safe area | Moves steadily toward base position, logs distance |
| **status** | Report current game state | Returns summary of health, ammo, position, mode, etc. |

---

## Testing Each Command Manually

### Prerequisites
1. Game running in browser
2. Press F12 to open DevTools
3. Look for "AI THOUGHTS" overlay in top-left corner (shows AI Dev Log)

### Test Method 1: Via Console (Recommended for Quick Tests)

**Enable AI First:**
```javascript
window.IntelligentAgent.enable();
window.AIPlayerAPI.activateAI();
```

**Test Each Command:**

#### ✓ patrol_area
```javascript
window.AgentBridge.enqueueCommand('patrol_area');
```
**Expected behavior:**
- AI moves slowly in a loose circle
- Head rotates left/right scanning area
- Dev Log shows: `"Mode: PATROL_AREA | SECTOR_0_0 (safe zone)"` then `"Patrol: Scanning direction reversed"`
- Position stays within ~10m of starting point

#### ✓ seek_enemies
```javascript
window.AgentBridge.enqueueCommand('seek_enemies');
```
**Expected behavior:**
- AI moves forward rapidly
- Weapon fires in bursts (sound/muzzle flash)
- Randomly looks around while advancing
- Dev Log shows: `"Mode: SEEK_ENEMIES | Scanning..."` then `"Hunting enemies..."`
- Different from patrol: more aggressive movement, visible firing

#### ✓ hold_position
```javascript
window.AgentBridge.enqueueCommand('hold_position');
```
**Expected behavior:**
- AI barely moves (minor sway only)
- Weapon fires sporadically
- Slowly scans area while standing still
- Dev Log shows: `"Mode: HOLD_POSITION | SECTOR_0_0 (safe zone) | Defensive stance"`
- Position changes <1m per tick

#### ✓ return_to_safe_zone
```javascript
window.AgentBridge.enqueueCommand('return_to_safe_zone');
```
**Expected behavior:**
- AI walks steadily forward toward (0, 50, 0) base position
- Doesn't deviate from path
- Dev Log shows: `"Mode: RETURN_TO_SAFE_ZONE | Moving to base..."`
- After reaching base, automatically switches to `hold_position`
- Shows distance remaining: `"Return: Moving to base (15.4m away)"`

#### ✓ status
```javascript
window.AgentBridge.enqueueCommand('status');
```
**Expected behavior:**
- No movement change
- Dev Log shows full status line:
  ```
   Status: AI on | mode=... | sector=SECTOR_0_0 (safe zone) | obj=... | hp=... | ammo=.../... | pos=... | game=...
  ```
- Useful for health/ammo checks during other modes

### Test Method 2: Alias Testing

IntelligentAgent accepts aliases for convenience:

```javascript
// These all do the same thing:
window.AgentBridge.enqueueCommand('patrol_area');
window.AgentBridge.enqueueCommand('patrol');
window.AgentBridge.enqueueCommand('patrol_sector');

// These all seek:
window.AgentBridge.enqueueCommand('seek_enemies');
window.AgentBridge.enqueueCommand('seek');
window.AgentBridge.enqueueCommand('hunt');
window.AgentBridge.enqueueCommand('hunt_enemies');

// These all hold:
window.AgentBridge.enqueueCommand('hold_position');
window.AgentBridge.enqueueCommand('hold');
window.AgentBridge.enqueueCommand('defend');
window.AgentBridge.enqueueCommand('defensive');

// These all retreat:
window.AgentBridge.enqueueCommand('return_to_safe_zone');
window.AgentBridge.enqueueCommand('retreat');
window.AgentBridge.enqueueCommand('return');
window.AgentBridge.enqueueCommand('go_home');
```

### Test Method 3: Error Handling

Test invalid commands to see error behavior:

```javascript
// This will fail with helpful message
window.AgentBridge.enqueueCommand('jump and attack');
// Returns: { ok: false, message: 'Unknown command: "jump and attack". Available: patrol_area, seek_enemies, ...' }

// This will fail - not in vocabulary:
window.AgentBridge.enqueueCommand('move forward 10 meters');
// Dev Log shows: [INFO] [CMD] Received: "move forward 10 meters"
// Then returns error with command list
```

### Test Method 4: Full LLM Loop (Demo Mode)

Paste the entire [llm_reasoner_example.js](llm_reasoner_example.js) into console:

```javascript
// Paste entire file into console
// Press Enter
// Observe 5 iterations of:
//   [1] Exporting snapshot...
//   [2] Constructing prompt...
//   [3] Calling LLM...
//   [LLM-DEMO] Decision: "patrol_area"
//   [COMMAND] "patrol_area" (from COMMAND_VOCABULARY)
//   [4] Enqueueing command...
//   [SUCCESS] Command enqueued: "patrol_area"
//   [SLEEP] Waiting 2000ms...
```

---

## Checking Behavior in Dev Log

The AI Dev Log is updated in real-time. Look for these patterns:

### Patrol Mode Log
```
Mode: PATROL_AREA | SECTOR_1_-1 (safe zone)
Patrol: Scanning area...
Patrol: Scanning direction reversed
Patrol: Scanning area...
```

### Seek Mode Log
```
Mode: SEEK_ENEMIES | Scanning from (150,100)
Seek: Hunting enemies...
Seek: Engaging target!
Seek: Hunting enemies...
```

### Hold Mode Log
```
Mode: HOLD_POSITION | SECTOR_2_0 (safe zone) | Defensive stance
Hold: Covering fire
Hold: Defensive position maintained
Hold: Covering fire
```

### Return Mode Log
```
Mode: RETURN_TO_SAFE_ZONE | From (300,200) to base
Return: Moving to base (287.3m away)
Return: Moving to base (200.1m away)
Return: Moving to base (45.2m away)
Return: Reached safe zone!
Set mode: HOLD_POSITION
```

---

## LLM Integration: Command Validation

When connecting a real LLM (OpenAI, Azure, Claude), the system validates responses:

1. **System Prompt Constraint** (in callLLM templates):
   ```
   You must respond with ONLY one command name from this list:
   patrol_area, seek_enemies, hold_position, return_to_safe_zone, status
   
   Do not explain. Do not use other words. Always respond with exactly one command name.
   ```

2. **Response Validation** (in llm_reasoner_example.js):
   ```javascript
   if (!validCommands.includes(response_text)) {
     console.warn('[LLM] Invalid response:', response_text);
     return 'patrol_area';  // fallback
   }
   ```

3. **Fallback Behavior**:
   - If LLM returns anything not in vocabulary → fallback to `patrol_area`
   - Loop continues normally
   - Invalid response is logged for debugging

---

## Tips for Real LLM Setup

### Making LLM Respect Command Vocabulary

**Best Approach: Instruct via System Prompt**
```javascript
// In your LLM call:
const systemPrompt = `You are a tactical game AI. Respond with ONLY one command:
${Object.keys(COMMAND_VOCABULARY).join(', ')}
No explanations. One word only.`;
```

**Add Context to Inform Better Decisions:**
```javascript
const prompt = `
Current Game State:
- Health: ${snapshot.playerState.health}%
- Ammo: ${snapshot.playerState.ammo}
- Position: ${JSON.stringify(snapshot.playerState.position)}
- Sector: ${snapshot.sectorState?.currentSectorId} (${snapshot.sectorState?.areaLabel})
- IsInSafeZone: ${snapshot.sectorState?.isInSafeZone}
- Mode: ${snapshot.agentState.currentMode}
- Recent Actions: ${snapshot.recentActions.map(a => a.message).join('; ')}

Strategy: ${INSTRUCTION}

Available Actions:
- patrol_area: Scan local area for threats
- seek_enemies: Advance and engage enemies
- hold_position: Defensive stance, cover location
- return_to_safe_zone: Navigate to base when compromised
- status: Check current situation

Choose best action as ONE WORD.
`;
```

---

## Snapshot Sector Context

AgentBridge snapshots include minimal sector context for reasoning:

```json
"sectorState": {
   "currentSectorId": "SECTOR_0_0",
   "isInSafeZone": true,
   "isInCorruptedZone": false,
   "areaLabel": "safe zone"
}
```

Use these fields to bias decisions (safe zone => patrol/return, corrupted zone => seek/hold).

### Testing Real LLM

Before running the full loop:
```javascript
// Test single LLM call
const testPrompt = "Game health=100, ammo=120. What should I do?";
const decision = await callLLM_OpenAI(testPrompt);
console.log("LLM decided:", decision);
// Should output: patrol_area, seek_enemies, hold_position, etc.
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| AI doesn't move | `enable()` not called | Run `window.IntelligentAgent.enable()` |
| AI enabled but no commands execute | AI not activated | Run `window.AIPlayerAPI.activateAI()` |
| "Unknown command" error | Typo or invalid command | Check against COMMAND_VOCABULARY list, use aliases |
| Commands come but AI doesn't move | `tick()` not running | Check F9 toggle, verify `loopTimer` is active |
| LLM returns invalid command | Real LLM not constrained | Improve system prompt, test with demo first |
| Position doesn't match AI visual position | Z-axis convention | Z increases backward, X to right (check game coords) |

---

## Next Steps

1. ✓ Test each command manually from console
2. ✓ Verify behaviors match descriptions above
3. ✓ Run demo loop (llm_reasoner_example.js) with hard-coded commands
4. When ready: Uncomment ONE real LLM option in `callLLM()`
5. Add your API key and test single call
6. Run full loop with real LLM

Enjoy! 🎮
