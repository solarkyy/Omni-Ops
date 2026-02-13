# AI TEST HARNESS - QUICK INTEGRATION GUIDE

## What's Included

The unified AI test harness consists of three components:

### 1. **ai_test_harness.js** (Core Module)
- Location: `ai/ai_test_harness.js`
- Provides: `window.OmniOpsTestHarness` API
- Integrates with: AgentBridge, IntelligentAgent, AIPlayerAPI
- No core game logic changes

### 2. **ai_test_panel.js** (UI Control Panel)
- Location: `ai/ai_test_panel.js`
- Provides: In-game test panel (F12 to toggle)
- Features: Scenario selection, script execution, real-time logs
- No core game logic changes

### 3. **AI_TEST_HARNESS_GUIDE.md** (Complete Documentation)
- Comprehensive API reference
- Available scenarios and scripts
- Integration patterns for external tools
- Usage examples for Copilot and dev agents

---

## How to Integrate

### Step 1: Include the JavaScript Modules

Add these lines to your HTML `<head>` or before closing `</body>`:

```html
<!-- AI Test Harness System -->
<script src="ai/ai_test_harness.js"></script>
<script src="ai/ai_test_panel.js"></script>
```

**IMPORTANT**: Make sure these load **AFTER** the following systems are initialized:
- `omni-core-game.js` (for game state and AIPlayerAPI)
- `ai/AgentBridge.js` (for command routing)
- `ai/IntelligentAgent.js` (for AI control)

**Recommended order**:
```html
<!-- Game Core -->
<script src="js/three.min.js"></script>
<script src="js/omni-core-game.js"></script>

<!-- AI Systems (must load before test harness) -->
<script src="ai/AgentBridge.js"></script>
<script src="ai/IntelligentAgent.js"></script>
<script src="ai/ai_worker_api.js"></script>
<script src="ai/BehaviorPatchManager.js"></script>

<!-- TEST HARNESS (loads after all systems) -->
<script src="ai/ai_test_harness.js"></script>
<script src="ai/ai_test_panel.js"></script>
```

### Step 2: Verify Integration

Open browser console and run:

```javascript
console.log(window.OmniOpsTestHarness);
```

Expected output:
```javascript
{
  setupScenario: ƒ,
  runScript: ƒ,
  getResults: ƒ,
  getMetrics: ƒ,
  clearResults: ƒ,
  wait: ƒ,
  availableScenarios: ['patrol_basic', 'engage_enemies', ...],
  availableScripts: ['patrol_sequence', 'enemy_engagement', ...],
  ...
}
```

If undefined, check:
1. Are the script files included?
2. Are they loading after core systems?
3. Check console for any JavaScript errors

---

## Usage Patterns

### From Browser Console (Manual Testing)

```javascript
// 1. Setup
await window.OmniOpsTestHarness.setupScenario('patrol_basic');

// 2. Run test
await window.OmniOpsTestHarness.runScript('patrol_sequence');

// 3. Get results
const results = window.OmniOpsTestHarness.getResults();
console.log(JSON.stringify(results, null, 2));
```

### From In-Game Panel

1. Press **F12** while playing
2. Select scenario from dropdown
3. Click "SETUP SCENARIO"
4. Select test script from dropdown
5. Click "RUN TEST"
6. View results in the panel
7. Click "EXPORT RESULTS JSON" to copy to clipboard

### From External Tool (Copilot / Dev Agent)

See `AI_TEST_HARNESS_GUIDE.md` for complete integration examples including:
- Puppeteer/Playwright automation
- HTTP bridge patterns
- WebSocket communication
- Claude API integration

---

## Available Tests

### Scenarios (5 total)
1. **patrol_basic** - Basic patrol behavior
2. **engage_enemies** - Enemy detection and combat
3. **supply_management** - Health/ammo management
4. **squad_coordination** - Squad commands
5. **ai_decision_making** - Decision logic under pressure

### Scripts (4 total)
1. **patrol_sequence** - Tests patrol lifecycle
2. **enemy_engagement** - Tests combat behavior
3. **hold_position** - Tests defensive stance
4. **resource_management** - Tests retreat behavior

---

## Key Features

✓ **No Core Changes**: Test harness doesn't modify game logic
✓ **Safe Integration**: Works alongside existing systems
✓ **Comprehensive Metrics**: Tracks decisions, commands, errors
✓ **External Tool Ready**: APIs designed for Copilot / dev agents
✓ **Real-time Monitoring**: In-game panel with live results
✓ **Custom Scripts**: Write your own test sequences
✓ **Automated Export**: Save results as JSON

---

## Testing AI Changes Safely

### Workflow for Copilot Testing New AI Features

1. **Propose Feature**: Copilot suggests AI improvement
2. **Setup Test**: `setupScenario('patrol_basic')` 
3. **Run Test**: `runScript('patrol_sequence')`
4. **Review Results**: `getResults()` shows metrics
5. **Approve/Reject**: Based on test outcomes
6. **Store Results**: Archive test JSON in `test_results/`

### Example: Testing New Patrol Logic

```javascript
// Before change
await window.OmniOpsTestHarness.setupScenario('patrol_basic');
await window.OmniOpsTestHarness.runScript('patrol_sequence');
const before = window.OmniOpsTestHarness.getResults();

// [Copilot modifies patrol logic in IntelligentAgent]

// After change
await window.OmniOpsTestHarness.setupScenario('patrol_basic');
await window.OmniOpsTestHarness.runScript('patrol_sequence');
const after = window.OmniOpsTestHarness.getResults();

// Compare
console.log(`Before: ${before.passed ? 'PASS' : 'FAIL'}`);
console.log(`After:  ${after.passed ? 'PASS' : 'FAIL'}`);
console.log(`Improvement: ${after.summary.passed_checks - before.summary.passed_checks} more checks passed`);
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `OmniOpsTestHarness is undefined` | Ensure scripts load in correct order, after core game systems |
| Panel not opening (F12) | Check console for errors, verify `ai_test_panel.js` loaded |
| Tests timeout/hang | Increase wait times, check AI is enabled, verify game initialized |
| `AIPlayerAPI not available` | Complete game initialization first (click "Start Game" menu) |
| Results show errors | Check game console, verify setup completed before running |

---

## File Locations

```
OMNI OPS/
├── index.html (add script includes here)
├── ai/
│   ├── ai_test_harness.js       ← CORE MODULE
│   ├── ai_test_panel.js          ← UI PANEL
│   ├── AgentBridge.js            (existing)
│   ├── IntelligentAgent.js       (existing)
│   └── ...
├── js/
│   └── omni-core-game.js        (existing)
└── AI_TEST_HARNESS_GUIDE.md      ← FULL DOCUMENTATION
```

---

## Next Steps

1. ✓ Include the JavaScript files in your HTML
2. ✓ Test from browser console: `window.OmniOpsTestHarness`
3. ✓ Try in-game panel: Press F12
4. ✓ Read `AI_TEST_HARNESS_GUIDE.md` for complete API reference
5. ✓ Integrate with your Copilot / dev agent workflows

---

## Questions & Support

- **API Questions**: See comprehensive `AI_TEST_HARNESS_GUIDE.md`
- **Integration Help**: Review pattern examples in guide
- **Troubleshooting**: Check the troubleshooting table above
- **Custom Tests**: Use `runScript()` with custom steps array

---

**Version**: 1.0  
**Date**: February 12, 2026  
**Status**: Production Ready
