# Context: SYSTEM FLOW BLUEPRINT

**Tier:** Schematic (Tier 3 — Logic Flow)  
**System:** Omni-Ops Architecture  
**Audience:** Architects, DevOps, LLM Integration Engineers  
**Authority:** Chief Systems Architect  
**Last Updated:** 2026-02-13  

---

## OVERVIEW

This document describes the **Cold Boot Sequence** and **Steady-State Data Flow** of Omni-Ops. It is the "source of truth" for understanding how the Brain (Python @ 8080), Body (Three.js Electron), and Bridge (AgentBridge) interact.

**Related Docs:**
- [Manifesto](.github/copilot-instructions.md) — Immutable axioms
- [Registry](docs/CONFIG_MASTER.json) — Hardcoded values
- [AgentBridge Guide](docs/systems/AgentBridge.md) — Command routing
- [Physics Engine](docs/systems/Physics_Engine.md) — Titanium subsystem

---

## PHASE 1: ELECTRON BOOTSTRAP (T=0s to T=2s)

### Trigger
User runs `npm start` or `npm run dev`

### Steps

| Step | Action | Responsibility | Output |
|------|--------|-----------------|--------|
| 1 | `main.js` starts Electron process | Electron runtime | Process spawned |
| 2 | Load `index.html` (game window) | BrowserWindow API | DOM ready, no scripts running |
| 3 | Inject Three.js ESM modules | `<script>` tags (single import point) | Renderer initialized |
| 4 | Create WebGL canvas context | Three.js `new THREE.WebGLRenderer()` | Canvas 1920x1080 ready |
| 5 | Init Octree spatial partition | Physics engine bootstrap | Physics ready for objects |
| 6 | Pre-allocate Object Pools | BulletPool, ParticlePool (see CONFIG_MASTER) | Zero-allocation game loop ready |

**State After Phase 1:**
```
✅ Electron window open
✅ Three.js renderer active (60 FPS ready)
✅ Physics engine waiting for entities
❌ AI systems NOT yet loaded
❌ Network NOT yet attempted
```

**Failure Mode:** If Electron/Three.js fails → **Crash** (cannot recover)

---

## PHASE 2: AI MODULE INITIALIZATION (T=2s to T=4s)

### Trigger
index.html loads these scripts in order:

```html
<!-- These must load AFTER Three.js, BEFORE game loop starts -->
<script src="ai/IntelligentAgent.js"></script>
<script src="ai/BehaviorPatchManager.js"></script>
<script src="ai/AgentBridge.js"></script>
<script src="ai/ai_test_harness.js"></script>
```

### Steps

| Step | Action | Responsibility | Result |
|------|--------|-----------------|--------|
| 1 | IntelligentAgent.js loads | Browser global scope | `window.IntelligentAgent` available |
| 2 | BehaviorPatchManager.js loads | Browser global scope | `window.AIBehaviorPatches` available |
| 3 | AgentBridge.js loads | Browser global scope | `window.AgentBridge` available |
| 4 | SignalBus initialized | AgentBridge or IntelligentAgent | Event pub/sub ready |
| 5 | Test Harness loads | Browser global scope | `window.OmniTestHarness` ready |

**State After Phase 2:**
```
✅ All AI modules loaded
✅ SignalBus ready (physics can emit events → UI subscribed)
✅ Command handler ready (can accept LLM commands)
❌ AI Server NOT yet contacted
❌ AI Context NOT yet loaded
```

**Failure Mode:** If any script fails to load → AgentBridge.isReady() = false → Error banner shown

---

## PHASE 3: BRAIN CONNECTION (T=4s to T=6s)

### Trigger
After modules loaded, `AgentBridge.startReadinessMonitoring()` is called automatically

### Steps

| Step | Action | URL | Port | Timeout | Result |
|------|--------|-----|------|---------|--------|
| 1 | Poll readiness | — | — | 100ms | Check isReady() state |
| 2 | Detect context needed | — | — | — | CONFIG_MASTER.ai_context.enabled = true? |
| 3 | Trigger context load | GET `/ai_context/README.md` | 8080 | 30s (CRIT-3) | Fetch first file |
| 4 | Fetch all context files | GET `/ai_context/{file}` (parallel) | 8080 | 30s | Load up to 10 files |
| 5 | Parse + cache files | In-memory cache | — | — | Set TTL = 5 min |
| 6 | Mark ready: `isReady()` = true | — | — | — | Hide error banner |
| 7 | Emit signal | `SignalBus.emit('ai:context_ready')` | — | — | UI can display "Ready" |

**State After Phase 3 (SUCCESS):**
```
✅ AgentBridge.isReady() = true
✅ AI Context cached (5 min TTL)
✅ Game can accept AI commands
✅ Test Harness can run scripts
✅ LLM can call enqueueCommand()
```

**Fallback Path (BRAIN OFFLINE):**

If **ANY** fetch fails (timeout, 404, network error):

| Condition | Behavior | Recovery |
|-----------|----------|----------|
| **No prior cache** | Skip context, log warning | User calls `window.AgentBridge.forceReady()` |
| **Prior cache exists** | Use cached data, log warning | Context valid until TTL expires |
| **All retries exhausted** | Start Fallback Mode | Physics loop runs, AI commands → `hold_position` only |

**Error Recovery Code Pattern (SEE: CONFIG_MASTER.json error_handling):**
```javascript
async function loadAIContext() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);  // REF: CONFIG_MASTER.ai_context.context_load_timeout_ms
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`Server ${response.status}`);
    return await response.json();
  } catch (err) {
    console.warn('[AgentBridge] Context load failed, using fallback:', err.message);
    return getCachedContext() || getFallbackBehavior();
  }
}
```

---

## SUBSYSTEM 5: UNIVERSAL /API/ ROUTE HANDLER (The Handshake Fix)

**Location:** [agent_with_tracing.py](../agent_with_tracing.py#L123)  
**Activation:** Game startup, when AgentBridge attempts `GET /api/*` routes  
**Purpose:** Prevent 404 errors on `/api/*` requests that cause game to hang indefinitely

### The Bug

**Before Fix:**
```
Game Startup (T=4s):
  AgentBridge tries: GET /api/context → Server responds: 404 Not Found
  ↓
  AgentBridge decision: "Context failed, context_load_timeout_ms not reached yet"
  ↓
  AgentBridge waits: 30 seconds for retry...
  ↓
  Game UI frozen. Player sees nothing.
  ↓
  (EVENTUALLY) 30-second timeout expires → Game continues but in fallback mode
  
RESULT: 30 second hangs on startup. Unacceptable UX.
```

### The Fix

**After Fix:**
```
Game Startup (T=4s):
  AgentBridge tries: GET /api/context
  ↓
  Server matches /api/* → calls _handle_api_universal()
  ↓
  Response: 200 OK { "status": "ready", "resource": "context", ... }
  ↓
  AgentBridge sees: 200 OK → proceeds immediately
  ↓
  Game loads in <1 second
  
RESULT: Instant handshake. Smooth startup.
```

### Implementation

```python
def _handle_api_universal(self, path: str):
    """
    GET|POST /api/* → Universal handler for ALL /api/ routes.
    Prevents 404 errors that previously caused 30-second startup hangs.
    
    REF: SYSTEM_FLOW_BLUEPRINT.md § Phase 3: Brain Connection
    REF: CONFIG_MASTER.json § network.ai_server_url
    """
    resource = path.replace("/api/", "").split("?")[0] or "status"
    
    response = {
        "status": "ready",
        "service": "omni-ops-brain",
        "resource": resource,
        "timestamp": __import__('time').time(),
    }
    self._send_json_response(200, response)
    print(f"[BrainServer::API] {path} → 200 OK")
```

**Why This Works:**
- Any request to `/api/{anything}` now returns `200 OK` instead of `404 Not Found`
- Prevents the 30-second context timeout fallback
- Game bootstraps immediately
- Actual context files can still be loaded from `/ai_context/` (separate endpoint)

**Config Reference:** [CONFIG_MASTER.python_server_settings.routes](../docs/CONFIG_MASTER.json#L233)

---

## PHASE 3.5: UI INITIALIZATION (T=5s to T=5.5s)

### Overview

After the **AI Brain handshake** succeeds (Phase 3), the UI must be explicitly initialized and attached to the **global window object**. This is a critical phase where:

1. All DOM elements are queried and validated
2. Event handlers are bound to UI buttons
3. A **SignalBus is created** (if not already present)
4. The **ui:system_ready signal is emitted** to notify ModuleLoader
5. Game is ready to transition to PHASE 4

### The Problem: "Ghosting"

**Previously**, `window.initializeUI` was defined but the Electron client couldn't find it because:
- It was **not explicitly attached** to the window object early enough
- No **signal emission** confirmed completion
- **ModuleLoader had no way to know** UI was ready → waited indefinitely
- **Result:** Game appeared frozen for up to 5 seconds

### Trigger

After Brain connection phase completes, `ModuleLoader` (in `scripts/omni-main.js`) calls:

```javascript
if (window.initializeUI) {
    window.initializeUI();  // Explicitly call the global function
}
```

### Steps

| Step | Action | Responsibility | Output |
|------|--------|-----------------|--------|
| 1 | Query main menu buttons | DOM API | All buttons found and validated (or logged as missing) |
| 2 | Bind click handlers | `window.initializeUI` | `btn-story-start`, `btn-single`, `btn-quit`, etc. ready |
| 3 | Initialize SignalBus | `window.SignalBus` created (if missing) | Pub/sub system ready for events |
| 4 | Display main menu | `showScreen('main')` | Menu visible to player |
| 5 | Emit signal | `SignalBus.emit('ui:system_ready')` | ModuleLoader unblocks |
| 6 | Timeout safeguard | CONFIG_MASTER.ui.ui_boot_timeout_ms | If step 5 takes > 5s, proceed anyway |

### Code Implementation

`js/omni-core-game.js` lines 777-925:

```javascript
window.initializeUI = function() {
    console.log('[UI-BOOT] ================================');
    console.log('[UI-BOOT] PHASE 3.5: UI INITIALIZATION STARTED');
    
    // ... button binding via bindBtn() helper ...
    
    // ✅ MANDATORY: Create SignalBus if missing
    if (!window.SignalBus) {
        window.SignalBus = {
            listeners: {},
            on: function(event, callback) { /* ... */ },
            emit: function(event, data) { /* ... */ },
            off: function(event, callback) { /* ... */ }
        };
        console.log('[UI-BOOT] ✓ SignalBus created');
    }
    
    // ✅ MANDATORY: Emit ui:system_ready signal
    window.SignalBus.emit('ui:system_ready', {
        timestamp: Date.now(),
        phase: 'UI_INITIALIZATION_COMPLETE',
        initiator: 'window.initializeUI()'
    });
    console.log('[UI-BOOT] ✓ Emitted signal: ui:system_ready');
    
    console.log('[UI-BOOT] PHASE 3.5: UI INITIALIZATION COMPLETE');
};
```

### State After Phase 3.5

```
✅ window.initializeUI explicitly attached to global scope
✅ All UI buttons bound and functional
✅ SignalBus initialized (system-wide event pub/sub ready)
✅ ui:system_ready signal emitted (ModuleLoader listening)
✅ Main menu displayed
✅ Game ready for PHASE 4: GAME ENTER
```

### Fallback / Error Recovery

If `ui:system_ready` signal not received within `CONFIG_MASTER.ui.ui_boot_timeout_ms` (5000ms):

```javascript
// In ModuleLoader (scripts/omni-main.js):
const timeout = setTimeout(() => {
    if (!window.uiReady) {
        console.warn('[ModuleLoader] UI boot timeout - proceeding anyway');
        proceedToGameStart();  // Fallback: game starts without full UI init
    }
}, CONFIG_MASTER.ui.ui_boot_timeout_ms);

// Listen for signal
window.SignalBus.on('ui:system_ready', () => {
    window.uiReady = true;
    clearTimeout(timeout);
    proceedToGameStart();  // Signal received - proceed normally
});
```

### Config Reference

**File:** [docs/CONFIG_MASTER.json](../docs/CONFIG_MASTER.json#L91-L100)

```json
"ui": {
  "ui_boot_timeout_ms": 5000,
  "ui_boot_note": "Maximum time to wait for window.initializeUI() to complete...",
  "signal_bus_enabled": true
}
```

### Logging & Debugging

All Phase 3.5 logs are tagged with **`[UI-BOOT]`** for easy filtering:

```
[UI-BOOT] PHASE 3.5: UI INITIALIZATION STARTED
[UI-BOOT] ✓ Button bound: btn-story-start
[UI-BOOT] ✓ Main menu displayed via showScreen("main")
[UI-BOOT] ✓ SignalBus created (did not exist)
[UI-BOOT] ✓ Emitted signal: ui:system_ready
[UI-BOOT] PHASE 3.5: UI INITIALIZATION COMPLETE
```

**Filter in browser console:** `console.log(performance.getEntriesByName('*')); // Filter by [UI-BOOT]`

---

## PHASE 4: GAME ENTER (T=5.5s+)

### Trigger
Player clicks "Play" or game auto-starts (after UI initialization complete)

### Steps

| Event | Action | Responsibility | Signal Emitted |
|-------|--------|-----------------|-----------------|
| 1 | Player spawned | Physics engine | `SignalBus.emit('player:spawned')` |
| 2 | UI binds to signals | Specter Command HUD | UI subscribed to all signals |
| 3 | Game loop starts | Three.js render loop (60 FPS) | 16.67ms per frame |
| 4 | Physics sub-step loop | Fixed timestep (10 steps) | Deterministic collisions |
| 5 | AI polling active | AgentBridge monitoring readiness | Can accept commands |
| 6 | Test Harness ready | Behavioral test framework | Can run automated tests |

**Steady-State Data Flow (Every Frame):**

```
1. Input → Player movement / AI command
2. Physics Update Loop (CONFIG_MASTER.physics.sub_steps = 10)
   FOR i=0 TO 10:
      velocity += gravity * dt
      position += velocity * dt
      CollisionDetect() via Octree
      CollisionResolve() via SAT
3. Octree.query() → AI Sector detection
4. AI Decision Engine (if enabled)
   IF command pending:
      IntelligentAgent.decideBestMode()
      → patrol_area | seek_enemies | hold_position | return_to_safe_zone
5. SignalBus.emit() → all events
   - 'player:damaged'
   - 'ai:mode_changed'
   - 'ui:ammo_depleted'
   - (Physics NEVER touches DOM; all via SignalBus)
6. UI Subscribers update
   - Health bar
   - Ammo counter
   - AI status indicator
   (Via requestAnimationFrame batching, throttled to 10 Hz)
7. Render → Display next frame
```

---

## DATA FLOW: LLM COMMAND → GAME ACTION

### Sequence Diagram

```
External LLM (Copilot)
       ↓
window.AgentBridge.enqueueCommand("patrol_area")
       ↓
AgentBridge.getAIContextReadyStatus() → { ready: true, ... }
       ↓
window.IntelligentAgent.onCommand("patrol_area")
       ↓
IntelligentAgent.decideBestMode() → "patrol_area" (safe, contextually valid)
       ↓
IntelligentAgent.currentMode = "patrol_area"
       ↓
Physics Integration:
  - nextPosition = targetSector + radius
  - velocity = normalized(targetSector - currentPos) * MOVE_SPEED
  - FOR 10 sub-steps: UpdatePhysics()
       ↓
SignalBus.emit('ai:mode_changed', { from: 'idle', to: 'patrol_area' })
       ↓
UI Subscriber updates hud:
  - Display "Patrolling Sector 3"
  - Green indicator on radar
       ↓
Test Harness (optional):
  - Capture state snapshot
  - Log decision to actionHistory
  - Validate mode change occurred
       ↓
LLM polls AgentBridge.exportSnapshot()
  ↓ Returns: { playerState, sectorState, commandExecutions, agentState }
  ↓ LLM reasons: "Command succeeded, player now moving toward Sector 3"
```

---

## SUBSYSTEM 1: SMART DECISION LAYER (IntelligentAgent.decideBestMode)

**Location:** [ai/IntelligentAgent.js](../ai/IntelligentAgent.js#L140)  
**Activation:** Every time external LLM calls `enqueueCommand()`  
**Purpose:** Enforce safety overrides while respecting LLM strategy preferences

### Decision Priority Fire (Non-Negotiable → Negotiable)

```
┌─────────────────────────────────────────────────────┐
│  Input: requestedMode, playerState, sectorState    │
└────────────────┬────────────────────────────────────┘
                 ↓
        ┌─────────────────────────┐
        │ RULE 1: Critical Health │
        │  health < 25 → RETREAT  │
        │                         │
        │ ❌ OVERRIDE: Always     │
        │ 🟢 Result: return_to_   │
        │           safe_zone     │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ RULE 2: Low Health +    │
        │ Low Ammo                │
        │ (health<40 ∧ ammo<5)    │
        │ → RETREAT               │
        │                         │
        │ ❌ OVERRIDE: Always     │
        │ 🟢 Result: return_to_   │
        │           safe_zone     │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ RULE 3: Zero Ammo +     │
        │ Corrupted Zone          │
        │ (ammo<1 ∧ corrupted)    │
        │ → HOLD DEFENSIVE        │
        │                         │
        │ ❌ OVERRIDE: No seek    │
        │ 🟢 Result: hold_position│
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ RULE 4: Good Resources  │
        │ health≥60 ∧ ammo≥20     │
        │ → Allow LLM request     │
        │                         │
        │ ✅ PREFERENCE           │
        │ 🟢 Result: requested    │
        │           Mode          │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ RULE 5: Moderate Res.   │
        │ 40≤health≤60 ∧ ammo≥5   │
        │ → Allow LLM (cautious)  │
        │                         │
        │ ✅ PREFERENCE           │
        │ 🟢 Result: requested    │
        │           Mode          │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │ FALLBACK: Safe Default  │
        │ inSafeZone              │
        │ → patrol_area           │
        │ else                    │
        │ → hold_position         │
        │                         │
        │ ✅ PREFERENCE           │
        │ 🟢 Result: Default Mode │
        └────────────┬────────────┘
                     ↓
        ┌─────────────────────────┐
        │  Output: decidedMode    │
        │  (may differ from       │
        │  requestedMode)         │
        └─────────────────────────┘
```

**Config Reference:** [CONFIG_MASTER.intelligent_agent_decision_thresholds](../docs/CONFIG_MASTER.json#L137)  
**Thresholds Defined:**
- Critical Health: **25**
- Low Health: **40** (paired with Low Ammo: **5**)
- Good Health: **60** (paired with Good Ammo: **20**)
- Moderate Health Range: **40-60** (paired with Ammo: **5**)

---

## SUBSYSTEM 2: COMMAND ROUTING & STRUCTURED COMMANDS

**Location:** [ai/AgentBridge.js](../ai/AgentBridge.js#L260)  
**Activation:** When `window.AgentBridge.enqueueCommand(command, options)` called
**Purpose:** Route commands to appropriate handler (gameplay, behavior patches, diagnostics)

### Command Types

```
┌──────────────────────────────────────────────────────────┐
│        Input: enqueueCommand(cmd, options)               │
└────────────────┬─────────────────────────────────────────┘
                 ↓
        ┌────────────────────────────────┐
        │ Parse command type:            │
        │ - String: "patrol_area"        │
        │ - JSON: { type: "request_    │
        │           behavior", ... }     │
        └────┬────────────┬──────────────┘
             ↓            ↓
     ┌──────────────┐ ┌──────────────────┐
     │ Vocabulary   │ │ Special Routing  │
     │ Command      │ │ request_behavior │
     │              │ │ → redirect to    │
     │ gameplay     │ │ AIBehaviorPatches│
     │ modes        │ │ .createPatchReq()│
     │              │ │                  │
     │ patrol_area  │ │ Returns:         │
     │ seek_enemies │ │ {ok, patchId,    │
     │ hold_pos     │ │  message}        │
     │ return_home  │ │                  │
     │ status       │ │ → Then recorded  │
     │              │ │   in approval    │
     │ → Forward to │ │   queue          │
     │ Intelligent  │ └──────────────────┘
     │ Agent.       │
     │ onCommand()  │
     └──────────────┘
```

**Error Handling:** If command type parsing fails, fallback to safe command (`hold_position`).

---

## SUBSYSTEM 3: AI CONTEXT READINESS GUARD

**Location:** [ai/AgentBridge.js](../ai/AgentBridge.js#L290)  
**Activation:** When gameplay command attempted before context fully loaded
**Purpose:** Prevent LLM from sending complex commands while engine still bootstrapping

### Readiness Polling & Throttling

```
Command arrives:
  ↓
Is context required? (CONFIG.ai_context.enabled)
  ├─ NO  → Skip guard, process immediately
  └─ YES ↓
       Get context status:
       ├─ "disabled" → ready ✓
       ├─ "ready"    → ready ✓
       ├─ "loading"  → NOT ready ✗
       └─ "error"    → NOT ready ✗
         ↓ (NOT ready)
       Is this an informational command?
       (status, info, state)
       ├─ YES → Process anyway (no context needed)
       └─ NO ↓
           Throttle warning to once per 5 seconds
           Apply fallback strategy:
           ├─ bypassContextCheck: true → Process anyway
           ├─ fallbackToSafe: true → Replace with hold_position
           └─ Neither → Reject with { ok: false, contextReady: false }
                       → Return reason to LLM
```

**Config Reference:**  
- Warning throttle: **5000 ms** ([CONFIG_MASTER.agent_bridge.context_warning_throttle_ms](../docs/CONFIG_MASTER.json#L93))
- Load timeout: **30000 ms** ([CONFIG_MASTER.agent_bridge_network.context_load_timeout_ms](../docs/CONFIG_MASTER.json#L179))

---

## SUBSYSTEM 4: STATE SNAPSHOT EXPORT (LLM Feedback Loop)

**Location:** [ai/AgentBridge.js](../ai/AgentBridge.js#L420)  
**Activation:** On demand: `window.AgentBridge.exportSnapshot()`
**Purpose:** Provide current game state back to external reasoning layer for LLM decision-making

### Snapshot Structure

```javascript
{
  playerState: {
    position: { x, y, z },
    health, ammo, stamina,
    mode,  // current: patrol_area | seek_enemies | hold_position | return_to_safe_zone
    isAiming, isReloading
  },
  sectorState: {
    currentSectorId,
    isInSafeZone,
    isInCorruptedZone,
    areaLabel
  },
  aiContext: {
    status,  // "ready" | "loading" | "disabled" | "error"
    loadedAt,
    files: [ { name, excerpt, truncated, length } ]
  },
  recentActions: [
    { time: "HH:MM:SS", message: "...", level: "info|warn|error" },
    ...  // Last 8 entries (CONFIG.max_output_entries)
  ],
  commandExecutionHistory: [
    {
      requestedCommand: "patrol_area",
      decidedMode: "patrol_area",
      beforeState: { ... },
      afterState: { ... },
      success: true,
      reason: "..."
    },
    ... // Last 10 entries (CONFIG.action_history_limit)
  ],
  bridgeReady: true | false
}
```

**Purpose of Each Field for LLM:**
- `playerState`: "Where is the player now? Health? Weapon state?"
- `sectorState`: "What zone is the player in? Safe or threat?"
- `commandExecutionHistory`: "What commands succeeded/failed? How did decisions change?"
- `bridgeReady`: "Can I send the next command or should I wait?"

---

## ERROR STATES & RECOVERY

### State Machine

```
┌─────────────────────────────────────┐
│         STARTUP SEQUENCE            │
└──────────────┬──────────────────────┘
               ↓
        Electron Bootstrap
               ↓
        AI Module Load
               ↓
        Brain Connection Attempt
         ↙              ↘
    SUCCESS            FAILURE
      ↓                  ↓
  ✅ READY         ⚠️ FALLBACK MODE
      ↓                  ↓
 Game Loop           Limited Ops
  Normal             (safe commands only)
  Physics            hold_position
  AI Commands        patrol_area
  Full Test          No LLM commands
                     (User can click forceReady())
                          ↓
                     Try Context Reload
                          ↓
                     Cache Hit? → READY
                     Cache Miss? → Still Fallback
```

### Common Failure Modes

| Failure | Cause | Detection | Recovery | Neural Guardrail |
|---------|-------|-----------|----------|-----------------|
| **Handshake 404** | Server returns 404 for `/api/*` routes | Game hangs 30s+ on start | Add universal `/api/` handler | `_handle_api_universal()` in agent_with_tracing.py returns 200 OK for all `/api/{path}` |
| **Brain Offline** | Python server down on 127.0.0.1:8080 | Fetch timeout (30s) | Fallback mode, cache, or `forceReady()` | CONFIG.network.fallback_mode enabled |
| **Context Load Timeout** | Files too large or network slow | No response after 30s | Use cached context or fallback | CONFIG_MASTER.agent_bridge_network.context_load_timeout_ms = 30000 |
| **Windows DNS Lag** | localhost resolves slowly | Commands delayed 5-10s | Use 127.0.0.1 (CONFIG_MASTER enforces this) | CONFIG_MASTER.ports.network_host = "127.0.0.1" |
| **Physics Stutter** | GC pause or memory leak | FPS < 30, deltaTime > 50ms | Sub-step loop clamps delta to 50ms (max) | CONFIG_MASTER.core_game_settings.physics.max_delta_clamped_ms = 50 |
| **DOM Crash** | Direct physics→DOM write | UI thread blocked | Architecture boundary enforced: use SignalBus only | copilot-instructions.md § III.C enforces this |

---

## CONFIGURATION REFERENCE

**REF: docs/CONFIG_MASTER.json**

| Setting | Value | Location |
|---------|-------|----------|
| AI Server Port | 8080 | `ports.ai_brain_server` |
| Vision Server Port | 8081 | `ports.ai_vision_server` |
| Network Host | 127.0.0.1 | `ports.network_host` |
| Physics Sub-Steps | 10 | `physics.sub_steps` |
| Context TTL | 5 min (300s) | `ai_context.refresh_interval_ms` |
| Timeout | 3s (3000ms) | `network.timeout_ms` |
| Vision Capture | 500ms | `network.vision_frame_capture_ms` |

---

## COLD BOOT SEQUENCE (QUICK REFERENCE)

```
T=0s      → npm start
T=0-2s    → Electron + Three.js load
T=2-4s    → AI modules load (IntelligentAgent, Bridge, Patches)
T=4-6s    → Brain connection (fetch context from 127.0.0.1:8080)
T=6s+     → Game playable, AI ready
```

**If any phase fails →** System degrades gracefully (no crash)  
**If brain unreachable →** Fallback mode (physical play OK, AI limited)  
**If user in hurry →** `window.AgentBridge.forceReady()` (CLI override)

---

## TESTING & VALIDATION

**Pre-Launch Checklist (5 min):**
```javascript
// Browser Console
window.AgentBridge.status();
// Expect: { bridgeReady: true, gameActive: true, aiContextStatus: 'ready' }

window.OmniTestHarness.runHealthCheck();
// Expect: All subsystems ✅

window.AgentBridge.enqueueCommand("patrol_area");
// Expect: { ok: true, contextReady: true }
```

**Perf Validation:**
```javascript
// Physics loop must complete in < 4ms (CONFIG_MASTER.physics.physics_budget_ms)
performance.mark('physics-start');
// ... Physics update ...
performance.mark('physics-end');
performance.measure('physics', 'physics-start', 'physics-end');
// Log result (only if DEBUG flag set)
```

---

## LEARNING LOOP & SELF-CORRECTION

If a bug is discovered (e.g., "404 on context load"), this document is updated FIRST:

1. **Document the failure mode** (add to "Common Failure Modes" table)
2. **Record the root cause** (e.g., "Wrong port, should be 8080")
3. **Update CONFIG_MASTER.json** if needed
4. **Update code** with reference comments
5. **Commit together** (doc + code fix)

**Never fix code without updating docs. Never update docs without updating CONFIG_MASTER.json.**

---

## NEXT STEPS

1. ✅ Review this flow against actual code behavior
2. ✅ Run cold boot test: `npm start` → watch Phase 1-4 timing in console
3. ✅ Validate AgentBridge.isReady() transitions
4. ✅ Test fallback mode: kill Python server, verify graceful degradation
5. ✅ Record findings in this document

---

**Questions about this flow?** → Issue tracking in SYSTEM_FLOW_ISSUES.md (create if needed)
