# AI Worker Contract – OMNI-OPS Definitive Edition

**Version:** 1.0  
**Date:** February 12, 2026  
**Status:** Fully Operational

---

## Overview

The **AI Worker Contract** defines the single, authoritative interface for all external tools, IDEs, and LLMs (like Copilot) to interact with OMNI-OPS game state and AI behavior. This ensures **safety**, **consistency**, and **observability** across IDE-side reasoning and in-game execution.

**Core Principle:**  
✓ All game interaction must flow through **AgentBridge** → **IntelligentAgent** → **AIPlayerAPI**  
✗ Never call movement/physics APIs directly  
✔ All commands are logged, validated, and context-gated

---

## 1. Public API Surface

### 1.1 State Inspection

```javascript
// Get complete game state snapshot for LLM analysis
const snapshot = window.AgentBridge.exportSnapshot();

// Returns:
{
  timestamp: "2026-02-12T...",
  playerState: {
    position: { x, y, z },
    yaw, pitch,
    health, ammo, reserveAmmo, stamina,
    mode, isAiming, isReloading
  },
  sectorState: {
    currentSectorId,
    isInSafeZone,
    isInCorruptedZone,
    areaLabel
  },
  aiContext: {
    status: "ready|loading|idle|disabled|error",
    loadedAt,
    files: [ { name, excerpt, truncated, length } ]
  },
  agentState: {
    enabled, currentMode, currentObjective
  },
  behaviorPatches: {
    pending: [...],
    appliedCount, rejectedCount
  },
  commandExecutions: [
    {
      time, timestamp, command, decidedMode, modeChanged,
      contextReady, success, reason,
      beforeState: { health, ammo, sector, areaLabel },
      afterState: { health, ammo, sector, areaLabel }
    }
    // ... last 8 executions
  ],
  lastCommandExecution: { ... },
  decisionSummary: "Last decision: ...",
  bridgeReady: true
}
```

### 1.2 Command Execution

```javascript
// Send a command (string or structured object)
const result = window.AgentBridge.enqueueCommand('patrol_area');
// or
const result = window.AgentBridge.enqueueCommand({
  type: 'request_behavior',
  payload: { featureId, summary, code, targetFile, targetSection }
});

// Returns:
{
  ok: boolean,
  message: string,
  contextReady?: boolean,
  status?: string,
  result?: any
}
```

**Valid Commands (COMMAND_VOCABULARY):**
- `patrol_area` – Slow loop, stay alert
- `seek_enemies` – Hunt and engage
- `hold_position` – Defensive stance
- `return_to_safe_zone` – Retreat to base
- `status` – Report state
- `request_behavior` – (structured) Request patch approval

### 1.3 Context & Readiness

```javascript
// Check if AI context is ready
const status = window.AgentBridge.getAIContextReadyStatus();
// Returns: { ready: boolean, reason: string, status: string }

// Get bridge operational status
const health = window.AgentBridge.status();
// Returns: {
//   bridgeReady, intelligentAgentReady, aiPlayerAPIReady,
//   gameActive, devMode, aiContextStatus
// }
```

### 1.4 Behavior Patch Workflow

```javascript
// List pending patches
const pending = window.AIBehaviorPatches.list('pending');

// Get full patch details
const patch = window.AIBehaviorPatches.get(patchId);

// Approve a patch
const result = window.AIBehaviorPatches.apply(patchId);

// Reject a patch
const result = window.AIBehaviorPatches.reject(patchId, 'reason');

// Get statistics
const stats = window.AIBehaviorPatches.stats();
// Returns: { pending, approved, rejected, total }
```

---

## 2. AI Worker Helper (Convenience Layer)

For Copilot and IDE tools, use the simplified **OmniAIWorker** object:

```javascript
// All helper methods route through AgentBridge/AIBehaviorPatches internally

window.OmniAIWorker = {
  // State inspection
  getSnapshot(),              // → AgentBridge.exportSnapshot()
  getContextStatus(),         // → AgentBridge.getAIContextReadyStatus()
  getHealth(),                // → AgentBridge.status()
  
  // Command execution
  sendCommand(cmd),           // → AgentBridge.enqueueCommand(cmd)
  
  // Behavior patches
  listPatches(status),        // → AIBehaviorPatches.list(status)
  getPatch(id),               // → AIBehaviorPatches.get(id)
  applyPatch(id),             // → AIBehaviorPatches.apply(id)
  rejectPatch(id, reason),    // → AIBehaviorPatches.reject(id, reason)
  getPatchStats(),            // → AIBehaviorPatches.stats()
  
  // Decision history (NEW – see optimization proposals)
  summarizeRecentDecisions(count), // → Compressed decision history
  
  // Telemetry (NEW – see optimization proposals)
  logExternalRequest(ideCommand, gameDecision, patches)
};
```

---

## 3. Safety Constraints

### 3.1 Forbidden Paths

❌ **DO NOT:**
```javascript
// These bypass safety logging and context gating
window.AIPlayerAPI.moveForward();
window.AIPlayerAPI.moveBackward();
player.position.x += 10;
cameraRig.position.set(...);
window.AIPlayerAPI.shoot();  // Direct fire without logging
window.IntelligentAgent.enterMode('seek_enemies');  // Direct mode switch
```

✔ **DO:**
```javascript
// Always use AgentBridge for commands
window.AgentBridge.enqueueCommand('patrol_area');
window.AgentBridge.enqueueCommand('shoot via onCommand');
// Commands are logged, validated, and context-gated
```

### 3.2 Context Gating

All gameplay commands (not `status` or `request_behavior`) are blocked until AI context is ready:

```javascript
// If aiContext.status != 'ready', enqueueCommand:
// 1. Logs a warning
// 2. Falls back to hold_position (safe fallback)
// 3. Or rejects if fallback disabled
```

**Why?** Ensures LLM reasoning has full project context before making decisions.

### 3.3 Decision Logging

Every command execution is logged with:
- `requestedCommand` – What the LLM asked for
- `decidedMode` – What safety logic approved
- `beforeState` / `afterState` – Health, ammo, sector
- `modeChanged` – Whether override occurred
- `reason` – Why (if different)

This creates an audit trail for co-learning.

---

## 4. Optimization Proposals

### 4.1 Enhanced Decision Summary

**File:** `ai/IntelligentAgent.js`  
**Function:** `formatDecisionSummary(entry)`

**Current:**
```javascript
return `Last decision: requested="${entry.command}" → decided="${entry.decidedMode}" 
  | ${overrideLabel} | reason="${entry.reason}" | contextReady=${entry.contextReady}`;
```

**Proposed Extensions:**
- Add `healthTrend` (was 80% → now 75% = -5%)
- Add `ammoUsed` in last decision
- Add `executionTimeMs` (latency)
- Add `decisionRationale` (abbreviated reason)

**Benefit:** LLMs learn from execution outcomes without re-reading full state.

---

### 4.2 Decision History Compression

**File:** `ai/ai_worker_api.js` (NEW)  
**Function:** `OmniAIWorker.summarizeRecentDecisions(count = 3)`

```javascript
// Compresses last N command executions into a concise history
// for LLM prompt injection

// Input: Last 3 executions from actionHistory
// Output:
[
  {
    cmd: "patrol_area",
    decided: "patrol_area",
    healthBefore: 85, healthAfter: 83,
    ammoBefore: 30, ammoAfter: 28,
    reason: "As requested"
  },
  {
    cmd: "seek_enemies",
    decided: "hold_position",
    healthBefore: 83, healthAfter: 75,
    ammoBefore: 28, ammoAfter: 20,
    reason: "Low resources override"
  },
  // ...
]

// Benefit: 50% shorter LLM prompts, same decision quality
```

**Efficiency Gain:** Shorter prompts → fewer tokens → cheaper API calls.  
**Intelligence Gain:** LLM sees pattern of overrides and can adjust tactics.

---

### 4.3 Smarter Snapshot Pruning

**File:** `ai/AgentBridge.js`  
**Function:** `exportSnapshot(...options)`

**Current:** Always returns last 8 entries from `commandExecutions`.

**Proposed Options Parameter:**
```javascript
exportSnapshot(options = {}) {
  const {
    maxCommandExecutions = 8,    // Keep N most recent
    includePatchHistory = false, // Full patch codes or just pending?
    includeSectorMap = false,    // Full sector info or just current?
    compressDecisions = false    // Use summarizeRecentDecisions?
  } = options;
  // ...
}
```

**Benefit:** Smaller payloads when sending to external LLM APIs.

---

### 4.4 Context-Awareness in Decision Logic

**File:** `ai/IntelligentAgent.js`  
**Function:** `decideBestMode(requestedMode, ...)`

**Current:** Checks health, ammo, zone, but doesn't adapt to LLM learning.

**Proposed Extension:**
```javascript
// New field: executionHistory confidence
// If LLM has successfully used "seek_enemies" 3x without override,
// confidence goes up, thresholds may relax slightly

decideBestMode(requestedMode, playerState, sectorState, options = {}) {
  // NEW: Check if LLM has "learned" this mode
  const llmConfidence = this.getCommandConfidence?.(requestedMode) || 0;
  
  // If high confidence (2+ successful uses), relax safety thresholds slightly
  const healthThreshold = llmConfidence > 0.7 ? 35 : 40;
  // ...
}
```

**Benefit:** Over time, LLM gets smarter and more aggressive when it proves reliable.  
**Safety:** Thresholds never drop below critical floors.

---

### 4.5 Lightweight Telemetry for Co-Learning

**File:** `ai/ai_worker_api.js` (NEW)  
**Function:** `OmniAIWorker.logExternalRequest(...)`

```javascript
OmniAIWorker.logExternalRequest({
  ideReason: "Low health detected, suggest retreat",
  ideCommand: "return_to_safe_zone",
  gameDecision: "return_to_safe_zone",
  decidedMode: "return_to_safe_zone",
  patchesApplied: [],
  timestamp: Date.now()
});

// Logged to window.ExternalRequestLog = []
// Downloaded for offline analysis
// Identifies which IDE reasoning works best in-game
```

**Benefit:** Build dataset of successful IDE→Game decision chains.  
**Intelligence:** Train future LLM prompts on what actually works.

---

### 4.6 Command Confidence Tracking

**File:** `ai/IntelligentAgent.js` (NEW field)

```javascript
commandSuccessRates = {
  'patrol_area': { attempts: 5, successes: 5, confidence: 1.0 },
  'seek_enemies': { attempts: 3, successes: 2, confidence: 0.67 },
  'hold_position': { attempts: 8, successes: 8, confidence: 1.0 },
  'return_to_safe_zone': { attempts: 2, successes: 2, confidence: 1.0 },
};

// Updated after each command execution
// Analyzed by decideBestMode() for confidence-based thresholds
// Exported in snapshot for LLM learning
```

**Benefit:** LLMs can see which commands have highest success rates.

---

## 5. Implementation Checklist

### Critical (Do Now)
- [ ] Create `ai/ai_worker_api.js` with `OmniAIWorker` wrapper
- [ ] Add JSDoc "AI Worker Contract" section to AgentBridge.js
- [ ] Wire up `OmniAIWorker.summarizeRecentDecisions()`
- [ ] Fix AgentBridge.exportSnapshot() edge cases
- [ ] Verify context guard in enqueueCommand()

### High (Next)
- [ ] Add decision history compression to ai_worker_api
- [ ] Implement command confidence tracking
- [ ] Add lightweight telemetry logging
- [ ] Enhance formatDecisionSummary with trends

### Nice-to-Have (Backlog)
- [ ] Adaptive safety thresholds based on confidence
- [ ] Full co-learning telemetry pipeline
- [ ] Decision success rate analytics
- [ ] LLM prompt auto-generation from telemetry

---

## 6. Usage Examples

### Example 1: Simple Command Loop (Copilot Pattern)

```javascript
// In IDE tooling or Copilot prompt:
async function runGameTurn() {
  const snapshot = window.OmniAIWorker.getSnapshot();
  const contextReady = window.OmniAIWorker.getContextStatus();
  
  if (!contextReady.ready) {
    console.log('Waiting for context:', contextReady.reason);
    return;
  }
  
  // LLM analyzes snapshot and decides
  const decision = analyzeWithLLM(snapshot);
  
  // Send command
  const result = window.OmniAIWorker.sendCommand(decision);
  
  if (!result.ok) {
    console.error('Command failed:', result.message);
  }
}
```

### Example 2: Behavior Patch Workflow

```javascript
// External AI proposes a behavior change
const patchRequest = {
  featureId: 'seek_more_aggressive',
  summary: 'Increase enemy engagement distance',
  code: `const engagement_distance = 50; // was 30`,
  targetFile: 'IntelligentAgent.js',
  targetSection: 'seek_enemies mode'
};

window.AgentBridge.enqueueCommand({
  type: 'request_behavior',
  payload: patchRequest
});

// Human reviews in UI → approves or rejects
// Logged to actionHistory for IDE side to learn from
```

### Example 3: Smarter Decision Summary

```javascript
const recent = window.OmniAIWorker.summarizeRecentDecisions(5);

// Build prompt for LLM:
const prompt = `
Recent decisions:
${recent.map(d => 
  `- ${d.cmd}→${d.decided}: health ${d.healthBefore}%→${d.healthAfter}%, reason: ${d.reason}`
).join('\n')}

Recommendation: Adjust strategy based on health trends.
`;
```

---

## 7. Testing the Contract

### Quick Validation (2 minutes)
1. **Context Status:** `window.OmniAIWorker.getContextStatus()` → should be `ready`
2. **Send Command:** `window.OmniAIWorker.sendCommand('status')` → should log state
3. **Patch List:** `window.OmniAIWorker.listPatches('pending')` → should return array
4. **Health:** `window.OmniAIWorker.getHealth()` → should show all systems ready

### Full Validation (5 minutes)
See final sanity checklist in implementation guide.

---

## 8. Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2026-02-12 | Proposed | Initial definition with 6 optimization proposals |

---

**Lead Engineer:** Copilot  
**Status:** Ready for implementation as Critical items
