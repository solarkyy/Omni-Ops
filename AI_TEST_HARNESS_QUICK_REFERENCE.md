# AI TEST HARNESS - QUICK REFERENCE

## One-Minute Setup

1. Add to `index.html`:
```html
<script src="ai/ai_test_harness.js" defer></script>
<script src="ai/ai_test_panel.js" defer></script>
```

2. Reload page

3. Verify: `console.log(window.OmniOpsTestHarness)`

---

## Command Cheat Sheet

### Basic Test
```javascript
// Setup scenario
await window.OmniOpsTestHarness.setupScenario('patrol_basic');

// Run test
await window.OmniOpsTestHarness.runScript('patrol_sequence');

// Get results
window.OmniOpsTestHarness.getResults();
```

### Available Scenarios
```
'patrol_basic'          - Basic patrol behavior
'engage_enemies'        - Enemy detection
'supply_management'     - Health/ammo management
'squad_coordination'    - Squad commands
'ai_decision_making'    - Decision logic
```

### Available Scripts
```
'patrol_sequence'       - Patrol lifecycle
'enemy_engagement'      - Combat behavior
'hold_position'         - Defensive stance
'resource_management'   - Retreat behavior
```

### List All Tests
```javascript
window.OmniOpsTestHarness.availableScenarios;
window.OmniOpsTestHarness.availableScripts;
```

### Get Current Metrics
```javascript
window.OmniOpsTestHarness.getMetrics();
```

### Clear Results
```javascript
window.OmniOpsTestHarness.clearResults();
```

---

## In-Game Controls

| Action | Method |
|--------|--------|
| Open Panel | Press **F12** while playing |
| Close Panel | Press **F12** or click X |
| Setup Scenario | Select dropdown + Click "SETUP SCENARIO" |
| Run Test | Select script + Click "RUN TEST" |
| Stop Test | Click "STOP" |
| View Logs | Scroll in log area |
| Export Results | Click "EXPORT RESULTS JSON" |

---

## Custom Test Script

```javascript
const mySteps = [
    { action: 'activate_ai', wait: 200 },
    { action: 'issue_command', command: 'patrol_area', wait: 500 },
    { action: 'wait', ms: 3000 },
    { action: 'check_metric', metric: 'is_moving', expectedValue: true },
    { action: 'deactivate_ai', wait: 200 }
];

await window.OmniOpsTestHarness.runScript('custom', mySteps);
```

---

## Step Actions

| Action | Parameters |
|--------|-----------|
| `activate_ai` | `wait` (ms) |
| `deactivate_ai` | `wait` (ms) |
| `issue_command` | `command`, `wait` |
| `check_metric` | `metric`, `expectedValue`, `failMessage` |
| `wait` | `ms` |
| `checkpoint` | `name`, `description` |
| `checkout` | `name`, `state` |
| `take_snapshot` | - |
| `custom` | `callback` |

---

## Available Metrics

```
ai_active           boolean     AI is enabled
player_health       number      Current health
player_ammo         number      Current ammo count
is_moving           boolean     Player moving
in_combat           boolean     In combat state
position_stable     boolean     Position unchanged
enemy_in_sight      boolean     Enemies visible
current_mode        string      AI current mode
```

---

## Common Commands

```javascript
// Run full test suite
await window.OmniOpsTestHarness.setupScenario('patrol_basic');
await window.OmniOpsTestHarness.runScript('patrol_sequence');
const r = window.OmniOpsTestHarness.getResults();
console.table(r.summary);

// Check AI status
window.OmniOpsTestHarness.getMetrics();

// Run multiple tests
const scenarios = ['patrol_basic', 'engage_enemies'];
for (const s of scenarios) {
    await window.OmniOpsTestHarness.setupScenario(s);
    await window.OmniOpsTestHarness.runScript('patrol_sequence');
    console.log(s, window.OmniOpsTestHarness.getResults().passed);
}

// Export results
const results = window.OmniOpsTestHarness.getResults();
copy(JSON.stringify(results, null, 2));
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Undefined API | Reload page, check console for errors |
| Panel won't open | Check `ai_test_panel.js` loaded |
| Test timeout | Increase wait times, ensure game initialized |
| No metrics | Start a game first (click menu button) |
| Commands fail | Ensure scenario `setupScenario()` run first |

---

## Results Structure

```javascript
{
    scenario: string,           // Test scenario name
    script: string,             // Test script name  
    passed: boolean,            // Test passed
    summary: {
        total_duration_ms,      // Test time
        passed_checks,          // Assertions passed
        failed_checks,          // Assertions failed
        total_checks            // Total assertions
    },
    metrics: {...},             // All collected metrics
    errors: [...]               // Error list
}
```

---

## Documentation Files

| File | Purpose |
|------|---------|
| `AI_TEST_HARNESS_GUIDE.md` | Complete API reference |
| `AI_TEST_HARNESS_QUICKSTART.md` | Quick start guide |
| `AI_TEST_HARNESS_HTML_INTEGRATION.md` | Setup instructions |
| `AI_TEST_HARNESS_IMPLEMENTATION_SUMMARY.md` | Overview |
| **THIS FILE** | Quick reference |

---

## External Tool Integration

```python
# Puppeteer example
results = await page.evaluate("""
    async () => {
        await window.OmniOpsTestHarness.setupScenario('patrol_basic');
        await window.OmniOpsTestHarness.runScript('patrol_sequence');
        return window.OmniOpsTestHarness.getResults();
    }
""")
```

---

## Version Info

- **Version**: 1.0
- **Status**: Production Ready
- **Date**: February 12, 2026
- **Files**: 2 JS modules + 5 Markdown docs

---

**Pro Tip**: Bookmark `AI_TEST_HARNESS_GUIDE.md` for full API documentation
