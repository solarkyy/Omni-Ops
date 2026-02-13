# Context: Omni-Ops Documentation Hub

**Tier:** Registry Navigation (Tier 2 Index)  
**Audience:** Developers, Architects, LLMs  
**Purpose:** O(1) retrieval of all technical documentation  
**Last Updated:** 2026-02-13  

---

## 🏛️ THE TRI-TIERED ARCHITECTURE

### Tier 1: The Manifesto (Immutable Axioms)
- **File:** `/.github/copilot-instructions.md`
- **Content:** Non-negotiable rules, zero-allocation principles, architecture boundaries
- **When to Read:** Before writing any code, understanding project philosophy

### Tier 2: The Registry (Global Configuration)
- **File:** `/docs/CONFIG_MASTER.json`
- **Content:** All hardcoded values (ports, timeouts, physics constants, command vocabulary)
- **When to Read:** When adding constants, debugging network issues, tuning game behavior

### Tier 3: The Schematic (System Flow)
- **File:** `/docs/SYSTEM_FLOW_BLUEPRINT.md`
- **Content:** Cold boot sequence, communication flow between Brain↔Body↔Bridge
- **When to Read:** Onboarding, understanding initialization, debugging load order

---

## 📚 DOCUMENTATION BY SYSTEM

### 🧠 AI BRAIN SYSTEMS

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| [Unified CHANGELOG.md](/docs/CHANGELOG.md) | Consolidated fix history + architectural learnings | Debugging a known issue, understanding past decisions |
| [System Flow Blueprint](/docs/SYSTEM_FLOW_BLUEPRINT.md) | Cold boot sequence (Phases 1-4) | Understanding how game initializes, LLM context |

### 🌉 AGENTBRIDGE (Command Router)

**Context: Command Routing & Context Validation**

| Topic | File | Details |
|-------|------|---------|
| **Overview** | `ai/AgentBridge.js` | Public APIs: `isReady()`, `enqueueCommand()`, `exportSnapshot()` |
| **Readiness System** | `/docs/CHANGELOG.md#critical-fix-agentbridge-readiness-race-condition` | How AgentBridge detects readiness, force_ready override |
| **Config Values** | `/docs/CONFIG_MASTER.json` (agent_bridge section) | timeouts, dev_mode, testMode, max_output_entries |

**Key Methods:**
```javascript
window.AgentBridge.isReady()  // → true/false
window.AgentBridge.status()  // → full status object
window.AgentBridge.enqueueCommand(cmd)  // → { ok, message, result }
window.AgentBridge.exportSnapshot()  // → game state for LLM
```

**Quick Start:**
```javascript
// 1. Check bridge readiness
window.AgentBridge.isReady();  // Must return true before sending commands

// 2. Send a command
window.AgentBridge.enqueueCommand('patrol_area');

// 3. Inspect results
const snapshot = window.AgentBridge.exportSnapshot();
console.log(snapshot.commandExecutions);  // Last 10 commands
```

---

### 🤖 INTELLIGENTAGENT (AI Decision Layer)

**Context: Smart AI Reasoning & Command Execution**

| Topic | File | Details |
|-------|------|---------|
| **Module** | `ai/IntelligentAgent.js` | Command handler, decision logic, thought stream |
| **Syntax Fix** | `/docs/CHANGELOG.md#critical-fix-intelligentagent-syntax-error` | How IntelligentAgent bug was resolved |
| **Command Vocabulary** | `/docs/CONFIG_MASTER.json` (intelligent_agent) | Valid commands: patrol_area, seek_enemies, hold_position, return_to_safe_zone, status |
| **Execution History** | `/docs/CHANGELOG.md#p2-command-execution-history-logging` | Before/after state logging for LLM analysis |

**Command Vocabulary (CONFIG_MASTER.json):**
```json
{
  "intelligent_agent": {
    "command_vocabulary": [
      "patrol_area",
      "seek_enemies", 
      "hold_position",
      "return_to_safe_zone",
      "status"
    ]
  }
}
```

**Key Methods:**
```javascript
window.IntelligentAgent.onCommand(cmd)  // → { ok, message }
window.IntelligentAgent.enable()  // Activate AI
window.IntelligentAgent.disable()  // Deactivate AI
window.IntelligentAgent.logThought(msg, level)  // Debug logging
```

---

### 🎯 BEHAVIOR PATCHES (Approval Pipeline)

**Context: AI Behavior Request Management**

| Topic | File | Details |
|-------|------|---------|
| **Module** | `ai/BehaviorPatchManager.js` | Behavior patch creation, approval, rejection |
| **Config Values** | `/docs/CONFIG_MASTER.json` (behavior_patches) | Max pending, code length limits |

**Configuration (CONFIG_MASTER.json):**
```json
{
  "behavior_patches": {
    "max_pending": 20,
    "max_code_length": 10000,
    "min_code_length": 10,
    "max_summary_length": 500
  }
}
```

---

### 🎮 GAME INITIALIZATION & LOADING

**Context: Cold Boot Sequence & DOM Initialization**

| Topic | File | Details |
|-------|------|---------|
| **Boot Sequence** | `/docs/SYSTEM_FLOW_BLUEPRINT.md` | Phases 1-4 timeline, error paths |
| **Loader Error Fix** | `/docs/CHANGELOG.md#critical-fix-loader-dom-null-reference` | DOM null guard pattern |
| **Startup Info** | `/docs/CONFIG_MASTER.json` (system section) | Versions, runtime info |

**Key Bootstrap Issues (Already Fixed):**
1. ✅ `TypeError: Cannot set properties of null` — Fixed with defensive null guards
2. ✅ Race condition with async script loading — Fixed with early registration
3. ✅ Missing DOM elements — All wrapped in null checks

---

### 🧪 TEST HARNESS & VALIDATION

**Context: Automated Behavioral Testing**

| Topic | File | Details |
|-------|------|---------|
| **Overview** | `ai/ai_test_harness.js` | Automated test execution, scenario setup |
| **Early Registration Fix** | `/docs/CHANGELOG.md#p3-test-harness-early-registration` | How race conditions were resolved |
| **Readiness API** | `window.OmniTestHarness.getTestReadiness()` | Check component initialization |

**Quick Start (Browser Console):**
```javascript
// Check if all tests can run
window.OmniTestHarness.getTestReadiness();
// Expected: { ready: true, components: {...}, missingComponents: [] }

// Run a specific test
window.OmniTestHarness.runTest('patrol_basic');
// Inspects result, logs to console

// Run full health check
window.OmniTestHarness.runHealthCheck();
```

---

### 📊 PHYSICS ENGINE (Titanium)

**Context: Custom Octree + Fixed Sub-Stepping**

| Topic | Details |
|-------|---------|
| **Type** | Custom Titanium Octree-based collision |
| **Sub-Steps** | 10 (CONFIG_MASTER.json `physics.sub_steps`) |
| **Gravity** | -9.81 (CONFIG_MASTER.json `physics.gravity`) |
| **Max Delta** | 50ms (CONFIG_MASTER.json `physics.max_delta_ms`) |
| **Budget** | ≤ 4ms per frame (CONFIG_MASTER.json `physics.physics_budget_ms`) |

**Immutable Law (from Manifesto):**
- No `new Vector3()` inside `update()` — use object pools
- Reuse math objects at module scope
- All physics writes via SignalBus, NOT direct DOM

---

### 🎨 UI & SPECTER COMMAND HUD

**Context: Diegetic UI Overlay & SignalBus Decoupling**

| Topic | Details |
|-------|---------|
| **UI Type** | Diegetic "Specter Command" overlay |
| **Bridge** | `window.updateDialogue()` |
| **Pattern** | Event-driven via SignalBus, NOT direct physics→DOM writes |
| **Update Rate** | Throttled to 10 Hz (CONFIG_MASTER.json `ui.ui_update_hz`) |

**Immutable Law (from Manifesto):**
- Physics NEVER touches DOM
- All state changes emitted as signals
- UI subscribes to signals independently

---

### 🌐 NETWORK & PYTHON AI SERVER

**Context: Brain Connection (Port 8080)**

| Setting | Value | File |
|---------|-------|------|
| **Host** | 127.0.0.1 | CONFIG_MASTER.json (NOT localhost!) |
| **Port** | 8080 | CONFIG_MASTER.json |
| **Timeout** | 3000ms | CONFIG_MASTER.json |
| **Context TTL** | 5min (300s) | CONFIG_MASTER.json |
| **Fallback Mode** | Enabled (game continues offline) | SYSTEM_FLOW_BLUEPRINT.md |

**Critical Rule:** Always use `127.0.0.1`, NEVER `localhost` (Windows DNS lag)

---

## 🔍 QUICK LOOKUP TABLE

### By Issue Type

| Issue | Solution | File |
|-------|----------|------|
| "AgentBridge not ready" | Read readiness section of CHANGELOG | `/docs/CHANGELOG.md#critical-fix-agentbridge-readiness-race-condition` |
| "IntelligentAgent undefined" | Module loading fix | `/docs/CHANGELOG.md#critical-fix-intelligentagent-syntax-error` |
| "DOM element not found crash" | Null guard pattern | `/docs/CHANGELOG.md#critical-fix-loader-dom-null-reference` |
| "Command not recognized" | Check command vocabulary | `/docs/CONFIG_MASTER.json` (intelligent_agent.command_vocabulary) |
| "Physics stuttering" | Check sub-step and frame budget | `/docs/CONFIG_MASTER.json` (physics section) |
| "Network timeout" | Verify 127.0.0.1, check timeout value | `/docs/CONFIG_MASTER.json` (network section) |

### By Component

| Component | Core File | Config | Flow |
|-----------|-----------|--------|------|
| **AgentBridge** | `ai/AgentBridge.js` | `CONFIG_MASTER.json` (agent_bridge) | SYSTEM_FLOW_BLUEPRINT.md (Phase 3) |
| **IntelligentAgent** | `ai/IntelligentAgent.js` | `CONFIG_MASTER.json` (intelligent_agent) | SYSTEM_FLOW_BLUEPRINT.md (Phase 4) |
| **Behavior Patches** | `ai/BehaviorPatchManager.js` | `CONFIG_MASTER.json` (behavior_patches) | — |
| **Test Harness** | `ai/ai_test_harness.js` | — | SYSTEM_FLOW_BLUEPRINT.md (Validation) |
| **Physics** | Core game loop | `CONFIG_MASTER.json` (physics) | SYSTEM_FLOW_BLUEPRINT.md (Phase 4) |
| **UI** | `js/omni-unified-control-panel.js` | `CONFIG_MASTER.json` (ui) | SYSTEM_FLOW_BLUEPRINT.md (Phase 4) |

---

## 📋 CONSOLIDATED CHANGELOG

**File:** `/docs/CHANGELOG.md`

**Contains:**
- ✅ 7 major fixes (CRITICAL + P1-P4)
- ✅ Root cause analysis for each
- ✅ Implementation details with code samples
- ✅ Validation procedures
- ✅ Related CONFIG values
- ✅ Architectural learnings

**Search for:** [CRITICAL FIX], [P1], [P2], [P3], [P4]

---

## 🗂️ FILE ORGANIZATION

### Stored in `/docs/`
```
docs/
├── README.md                      ← You are here
├── CONFIG_MASTER.json             ← Tier 2: Registry
├── SYSTEM_FLOW_BLUEPRINT.md       ← Tier 3: Schematic
├── CHANGELOG.md                   ← Consolidated fixes (12 docs → 1)
├── archive/                       ← Fragmented docs (for historical reference)
│   ├── AGENTBRIDGE_READINESS_FIX.md
│   ├── INTELLIGENT_AGENT_FIX.md
│   ├── LOADER_ERROR_FIX.md
│   └── ... (9 total)
└── systems/                       ← Planned (Phase 4)
    ├── Physics_Engine.md
    ├── AgentBridge.md
    └── ... (future)
```

### Root Level (Source of Truth)
```
.github/
├── copilot-instructions.md        ← Tier 1: Manifesto
└── instructions/
    ├── javascript-threejs.instructions.md
    ├── tests.instructions.md
    └── ui-hud.instructions.md
```

---

## 🚀 QUICK STARTS

### I'm New — Where Do I Start?
1. Read: `.github/copilot-instructions.md` (Manifesto) — 5 min
2. Read: `/docs/CONFIG_MASTER.json` (Registry) — 5 min
3. Read: `/docs/SYSTEM_FLOW_BLUEPRINT.md` (Schematic) — 10 min
4. Read: `/docs/CHANGELOG.md` (What was fixed) — 15 min
5. **Total:** 35 minutes to full context

### I Found a Bug — How Do I Debug?
1. Check `/docs/CHANGELOG.md` for similar issues (search by symptom)
2. Check `/docs/CONFIG_MASTER.json` for configuration issues
3. Check `/docs/SYSTEM_FLOW_BLUEPRINT.md` for initialization/flow issues
4. Reference `.github/copilot-instructions.md` for architectural violations

### I'm Writing New Code — What Do I Check?
1. **No Magic Numbers?** Every constant in `/docs/CONFIG_MASTER.json`? ✅
2. **No localhost?** All network calls use `127.0.0.1`? ✅
3. **Null Guards?** All DOM access guarded? ✅
4. **SignalBus?** Physics → UI via events, not direct? ✅
5. **Object Pools?** No `new` in game loop? ✅

---

## 🔗 EXTERNAL REFERENCES

- **Manifesto:** `/.github/copilot-instructions.md`
- **Architecture Rules:** `AGENTS.md` (old, kept for reference)
- **Build Instructions:** `package.json`
- **Dependencies:** `requirements.txt` (Python) + `package-lock.json` (Node)

---

## METADATA

**This Hub Document:**
- Last Updated: 2026-02-13
- Consolidation Level: 12 fragmented docs → 1 CHANGELOG + 1 index
- Next Step: Archive old files, finalize hierarchy
- Authority: Chief Systems Architect

**Questions?** Check the appropriate Context document above. Every section is tagged for O(1) semantic retrieval.
