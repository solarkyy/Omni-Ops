# AI TEST HARNESS - HTML INTEGRATION GUIDE

## Where to Add the Scripts

The test harness modules should be added to `index.html` right after the core AI systems load.

**Current script load order in index.html:**
```
1. CORE MODULES (omni-main.js, etc.)
2. AI SYSTEMS (IntelligentAgent.js, AgentBridge.js, etc.)  
3. [INSERT TEST HARNESS HERE] ← YOUR NEW SCRIPTS
4. COMPLETE AI SYSTEM (ai-complete-system.js)
5. COLLABORATION OVERLAY (ai-collab-overlay.js)
```

---

## Implementation

### Option 1: Add to index.html (Recommended)

Find this section in your `index.html` (around line 357):

```html
<!-- AI SYSTEM - LOADS AFTER CORE MODULES -->
<script src="js/omni-ai-game-bridge.js" defer></script>
<script src="js/omni-unified-control-panel.js" defer></script>
<script src="js/omni-ai-npc-intelligence.js" defer></script>
<script src="ai/IntelligentAgent.js" defer></script>
<script src="ai/BehaviorPatchManager.js" defer></script>
<script src="ai/AgentBridge.js" defer></script>
<!-- HIGH: AI Worker API - Convenience wrapper for IDE/Copilot integration -->
<script src="ai/ai_worker_api.js" defer></script>
```

**Add these two lines right after `ai_worker_api.js`:**

```html
<!-- TEST HARNESS - Automated testing and external tool integration -->
<script src="ai/ai_test_harness.js" defer></script>
<script src="ai/ai_test_panel.js" defer></script>
```

**Full example:**

```html
<!-- AI SYSTEM - LOADS AFTER CORE MODULES -->
<script src="js/omni-ai-game-bridge.js" defer></script>
<script src="js/omni-unified-control-panel.js" defer></script>
<script src="js/omni-ai-npc-intelligence.js" defer></script>
<script src="ai/IntelligentAgent.js" defer></script>
<script src="ai/BehaviorPatchManager.js" defer></script>
<script src="ai/AgentBridge.js" defer></script>
<!-- HIGH: AI Worker API - Convenience wrapper for IDE/Copilot integration -->
<script src="ai/ai_worker_api.js" defer></script>

<!-- TEST HARNESS - Automated testing and external tool integration -->
<script src="ai/ai_test_harness.js" defer></script>
<script src="ai/ai_test_panel.js" defer></script>

<!-- COMPLETE AI SYSTEM - Browser-integrated vision, control, and orchestration -->
<script src="js/ai-complete-system.js" defer></script>
```

---

## Verification

After adding the scripts and reloading the page, verify in browser console:

```javascript
// Check core harness
console.log(window.OmniOpsTestHarness);
// Should output: { setupScenario: ƒ, runScript: ƒ, ... }

// Check UI panel
console.log(window.AiTestPanel);
// Should output: { toggle: ƒ, log: ƒ, ... }

// Check available tests
console.log(window.OmniOpsTestHarness.availableScenarios);
// Should output: ['patrol_basic', 'engage_enemies', ...]

console.log(window.OmniOpsTestHarness.availableScripts);
// Should output: ['patrol_sequence', 'enemy_engagement', ...]
```

---

## Testing the Integration

### 1. From Browser Console

```javascript
// Simple test
await window.OmniOpsTestHarness.setupScenario('patrol_basic');
await window.OmniOpsTestHarness.runScript('patrol_sequence');
console.log(window.OmniOpsTestHarness.getResults());
```

### 2. From In-Game Panel

- Press **F12** while playing
- Select scenario and script
- Click buttons to run tests

### 3. Check Load Order

```javascript
// In console, check that systems loaded in order
console.log({
  hasAgentBridge: !!window.AgentBridge,
  hasIntelligentAgent: !!window.IntelligentAgent,
  hasAIPlayerAPI: !!window.AIPlayerAPI,
  hasTestHarness: !!window.OmniOpsTestHarness,
  hasTestPanel: !!window.AiTestPanel
});

// All should be true
```

---

## Complete index.html Script Section

Here's the complete `<script>` section with test harness included:

```html
<!-- CORE MODULES - MUST LOAD FIRST -->
<script src="scripts/omni-main.js" defer></script>
<script src="scripts/omni-diagnostics.js" defer></script>
<script src="scripts/startup-verify.js" defer></script>

<!-- AI SYSTEM - LOADS AFTER CORE MODULES -->
<script src="js/omni-ai-game-bridge.js" defer></script>
<script src="js/omni-unified-control-panel.js" defer></script>
<script src="js/omni-ai-npc-intelligence.js" defer></script>
<script src="ai/IntelligentAgent.js" defer></script>
<script src="ai/BehaviorPatchManager.js" defer></script>
<script src="ai/AgentBridge.js" defer></script>

<!-- HIGH: AI Worker API - Convenience wrapper for IDE/Copilot integration -->
<script src="ai/ai_worker_api.js" defer></script>

<!-- TEST HARNESS - Automated testing and external tool integration -->
<script src="ai/ai_test_harness.js" defer></script>
<script src="ai/ai_test_panel.js" defer></script>

<!-- COMPLETE AI SYSTEM - Browser-integrated vision, control, and orchestration -->
<script src="js/ai-complete-system.js" defer></script>

<!-- AI COLLABORATION OVERLAY - In-game command center (F3 to toggle) -->
<script src="js/ai-collab-overlay.js" defer></script>

<!-- Initialization and diagnostics -->
<script>
    window.pageLog = [];
    const originalLog = console.log;
    console.log = function(...args) {
        originalLog.apply(console, args);
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        window.pageLog.push(msg);
        const logEl = document.getElementById('page-debug-log');
        if (logEl && window.pageLog.length > 0) {
            logEl.innerHTML = 'Recent logs:<br>' + window.pageLog.slice(-10).join('<br>');
        }
    };
    console.log('[TEST HARNESS] Ready. Press F12 to open panel or use window.OmniOpsTestHarness');
</script>

<div id="page-debug-log" style="position:fixed; bottom:10px; right:10px; background:rgba(0,0,0,0.8); color:#0f6; padding:10px; font-size:10px; max-width:300px; max-height:100px; overflow-y:auto; border:1px solid #0f6; z-index:5000; pointer-events:none;"></div>
```

---

## If Integration Doesn't Work

### Issue: `OmniOpsTestHarness is undefined`

**Cause**: Scripts loaded in wrong order or not loaded at all

**Solution**:
1. Check DevTools Network tab - do files load with 200 status?
2. Check script order - test harness must load AFTER AgentBridge
3. Look for JavaScript errors in Console tab
4. Verify file paths are correct relative to HTML location

```javascript
// Debug: Check what's loaded
fetch('ai/ai_test_harness.js')
    .then(r => r.ok ? console.log('✓ File exists') : console.log('✗ File not found'))
    .catch(e => console.log('✗ Fetch error:', e));
```

### Issue: Test panel doesn't open with F12

**Cause**: `ai_test_panel.js` not loaded or harness not initialized

**Solution**:
```javascript
// Force initialize
window.AiTestPanel?.toggle();

// If that doesn't work, check if loaded:
console.log(!!window.AiTestPanel);  // Should be true
```

---

## Common Mistakes to Avoid

❌ **Wrong**: Loading test harness before AgentBridge
```html
<script src="ai/ai_test_harness.js"></script>
<script src="ai/AgentBridge.js"></script>
```

✓ **Correct**: Load in proper order
```html
<script src="ai/AgentBridge.js"></script>
<script src="ai/ai_test_harness.js"></script>
```

---

❌ **Wrong**: Removing `defer` attribute
```html
<script src="ai/ai_test_harness.js"></script>  <!-- NO defer! -->
```

✓ **Correct**: Keep `defer` for proper loading
```html
<script src="ai/ai_test_harness.js" defer></script>
```

---

## Next Steps

After integration:

1. ✓ Reload page and verify scripts load (Network tab)
2. ✓ Open browser console and check: `window.OmniOpsTestHarness`
3. ✓ Start a game and press F12 to test panel
4. ✓ Try first test: `await window.OmniOpsTestHarness.setupScenario('patrol_basic')`
5. ✓ Read `AI_TEST_HARNESS_GUIDE.md` for complete API documentation

---

## File Locations Required

Before integration, verify these files exist:

```
OMNI OPS/
├── index.html              ← EDIT HERE (add script includes)
├── ai/
│   ├── ai_test_harness.js    ← NEW
│   ├── ai_test_panel.js      ← NEW
│   ├── AgentBridge.js        ← EXISTING (must be before test harness)
│   ├── IntelligentAgent.js   ← EXISTING
│   └── ...
└── Documentation/
    ├── AI_TEST_HARNESS_GUIDE.md             ← FULL API REFERENCE
    ├── AI_TEST_HARNESS_QUICKSTART.md        ← QUICK START
    └── AI_TEST_HARNESS_HTML_INTEGRATION.md  ← THIS FILE
```

---

## Support

For issues:
1. Check console for JavaScript errors
2. Verify file paths in Network tab
3. Ensure scripts load in correct order (defer helps with this)
4. Read `AI_TEST_HARNESS_GUIDE.md` for API questions

---

**Status**: Ready to implement  
**Complexity**: Simple - 2 lines added to HTML  
**Risk**: None - test harness is isolated, doesn't modify core game
