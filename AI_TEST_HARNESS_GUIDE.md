# OMNI-OPS UNIFIED AI TEST HARNESS
## Complete Guide for External Tools (Copilot, Dev Agents, AI Systems)

---

## Overview

The **AI Test Harness** is a unified JavaScript API that allows external tools (GitHub Copilot, offline dev agents, etc.) to:

- **Run automated behavioral tests** on AI agents
- **Verify game functionality** in real-time
- **Collect quantified metrics** on AI decisions and performance
- **Execute complex test sequences** with step-by-step control
- **Monitor and validate** agent behavior changes

All tests run **in-browser without changing core game logic**, making it safe for rapid iteration and validation.

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│  External Tool (Copilot / Dev Agent) │
│   - Calls setupScenario()            │
│   - Executes runScript()             │
│   - Reads getResults()               │
└──────────────────┬───────────────────┘
                   │
                   ↓ Browser Console / HTTP Message
┌──────────────────────────────────────────────────────┐
│  OMNI-OPS Game (http://localhost:8000)               │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ window.OmniOpsTestHarness                       │ │
│  │  • setupScenario(name, options)                 │ │
│  │  • runScript(scriptName, steps)                 │ │
│  │  • getResults()                                 │ │
│  │  • getMetrics()                                 │ │
│  └─────────────────────────────────────────────────┘ │
│                    ↓                                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Game Systems                                    │ │
│  │  • AIPlayerAPI (player state / commands)       │ │
│  │  • AgentBridge (AI commands)                   │ │
│  │  • IntelligentAgent (AI behavior)              │ │
│  │  • AIUnits (spawned entities)                  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Launch the Game

Open the game at `http://localhost:8000` in your browser.

### 2. Access the Test Harness

**Option A: Browser Console**
```javascript
// Check if harness is ready
console.log(window.OmniOpsTestHarness);

// List available scenarios
console.log(window.OmniOpsTestHarness.availableScenarios);

// List available scripts
console.log(window.OmniOpsTestHarness.availableScripts);
```

**Option B: In-Game Panel**
- Press **F12** while playing to open the test panel
- Select scenario and script via dropdowns
- Click buttons to run tests

**Option C: External Tool (WebSocket/HTTP Bridge)**
- See "Integration Pattern" section below

### 3. Run a Basic Test

```javascript
// Setup scenario
await window.OmniOpsTestHarness.setupScenario('patrol_basic', {
    playerHealth: 100,
    playerAmmo: 30,
    aiEnabled: true
});

// Run test script
const results = await window.OmniOpsTestHarness.runScript('patrol_sequence');

// Get results
const testData = window.OmniOpsTestHarness.getResults();
console.log(JSON.stringify(testData, null, 2));
```

---

## Available Scenarios

### 1. `patrol_basic`
**Description**: Test basic patrol behavior

**Setup Options**:
```javascript
{
  playerHealth: 100,
  playerAmmo: 30,
  spawnEnemies: false,
  aiEnabled: true,
  aiMode: 'patrol_area'
}
```

**What It Tests**:
- AI activation
- Movement execution
- Patrol decision-making

---

### 2. `engage_enemies`
**Description**: Test enemy detection and engagement

**Setup Options**:
```javascript
{
  playerHealth: 100,
  playerAmmo: 60,
  spawnEnemies: true,
  enemyCount: 2,
  enemyPositions: [
    { x: 10, y: 50, z: 10 },
    { x: -10, y: 50, z: -10 }
  ],
  aiEnabled: true,
  aiMode: 'idle'
}
```

**What It Tests**:
- Enemy visibility detection
- Combat state transitions
- Engagement behavior

---

### 3. `supply_management`
**Description**: Test health/ammo management logic

**Setup Options**:
```javascript
{
  playerHealth: 30,
  playerAmmo: 5,
  spawnEnemies: true,
  spawnSupplies: true,
  aiEnabled: true,
  aiMode: 'hold_position'
}
```

**What It Tests**:
- Low resource detection
- Retreat decision-making
- Recovery behavior

---

### 4. `squad_coordination`
**Description**: Test squad commands and movement

**Setup Options**:
```javascript
{
  playerHealth: 100,
  playerAmmo: 60,
  spawnSquad: true,
  squadSize: 4,
  aiEnabled: true,
  aiMode: 'idle'
}
```

**What It Tests**:
- Squad command routing
- Coordinated movement
- Order execution

---

### 5. `ai_decision_making`
**Description**: Test AI decision logic under pressure

**Setup Options**:
```javascript
{
  playerHealth: 50,
  playerAmmo: 15,
  spawnEnemies: true,
  enemyCount: 3,
  aiEnabled: true,
  trackDecisions: true
}
```

**What It Tests**:
- Decision logic with constraints
- Threat assessment
- Strategic choices

---

## Available Test Scripts

### 1. `patrol_sequence`
Tests the complete patrol behavior lifecycle.

```javascript
await window.OmniOpsTestHarness.runScript('patrol_sequence');
```

**Steps**:
1. Activate AI
2. Check AI is active
3. Issue "patrol_area" command
4. Wait for movement
5. Verify AI is moving
6. Wait for patrol duration
7. Deactivate AI

**Expected Result**: Test passes if AI activates, moves, and accepts commands.

---

### 2. `enemy_engagement`
Tests enemy detection and combat behavior.

```javascript
await window.OmniOpsTestHarness.runScript('enemy_engagement');
```

**Steps**:
1. Activate AI
2. Issue "seek_enemies" command
3. Wait for scan
4. Verify enemies visible
5. Wait for combat engagement
6. Verify combat state
7. Deactivate AI

**Expected Result**: Test passes if AI detects enemies and enters combat.

---

### 3. `hold_position`
Tests defensive stance and position stability.

```javascript
await window.OmniOpsTestHarness.runScript('hold_position');
```

**Steps**:
1. Activate AI
2. Issue "hold_position" command
3. Wait for stance
4. Verify position is stable
5. Wait for hold duration
6. Deactivate AI

**Expected Result**: Test passes if AI maintains position.

---

### 4. `resource_management`
Tests resource-aware decision-making.

```javascript
await window.OmniOpsTestHarness.runScript('resource_management');
```

**Steps**:
1. Activate AI
2. Check health and ammo statuses
3. Issue "return_to_safe_zone" command
4. Wait for retreat behavior
5. Deactivate AI

**Expected Result**: Test passes if AI responds to low resources.

---

## Custom Test Scripts

You can write custom test scripts by calling `runScript()` with a steps array:

```javascript
const customSteps = [
    { action: 'activate_ai', wait: 200 },
    { action: 'issue_command', command: 'patrol_area', wait: 500 },
    { action: 'wait', ms: 3000 },
    { action: 'check_metric', metric: 'is_moving', expectedValue: true },
    { action: 'deactivate_ai', wait: 200 }
];

const results = await window.OmniOpsTestHarness.runScript('custom_test', customSteps);
```

### Available Step Actions

| Action | Parameters | Description |
|--------|-----------|-------------|
| `activate_ai` | `wait` (optional) | Enable the AI agent |
| `deactivate_ai` | `wait` (optional) | Disable the AI agent |
| `issue_command` | `command`, `wait` | Send AI command (patrol_area, seek_enemies, hold_position, return_to_safe_zone, status) |
| `check_metric` | `metric`, `expectedValue`, `failMessage` | Verify a game metric matches expectation |
| `wait` | `ms` | Wait N milliseconds |
| `checkpoint` | `name`, `description` | Mark a test checkpoint |
| `checkout` | `name`, `state` | Mark test complete (pass/fail) |
| `take_snapshot` | - | Capture game state |
| `custom` | `callback` | Execute custom async function |

### Available Metrics for `check_metric`

| Metric | Type | Description |
|--------|------|-------------|
| `ai_active` | bool | AI agent is enabled |
| `player_health` | number | Player current health |
| `player_ammo` | number | Player current ammo |
| `is_moving` | bool | Player is in motion |
| `in_combat` | bool | AI in combat state |
| `position_stable` | bool | Player position unchanged |
| `enemy_in_sight` | bool | Enemies visible to AI |
| `current_mode` | string | AI current mode |

---

## API Reference

### `setupScenario(scenarioName, options)`

Initializes a test scenario with game state configuration.

**Parameters**:
- `scenarioName` (string): Name from `availableScenarios`
- `options` (object, optional): Overrides for scenario defaults

**Returns**: Promise resolving to OmniOpsTestHarness API (for chaining)

**Example**:
```javascript
await window.OmniOpsTestHarness.setupScenario('patrol_basic', {
    playerHealth: 100,
    playerAmmo: 60
});
```

---

### `runScript(scriptName, steps?)`

Executes a test script in sequence.

**Parameters**:
- `scriptName` (string): Name from `availableScripts` OR custom identifier
- `steps` (array, optional): Custom step array (if not using predefined script)

**Returns**: Promise resolving to array of step results

**Example**:
```javascript
// Use predefined script
const results = await window.OmniOpsTestHarness.runScript('patrol_sequence');

// Use custom script
const customSteps = [ /* ... */ ];
const results = await window.OmniOpsTestHarness.runScript('my_test', customSteps);
```

---

### `getResults()`

Returns complete test results including metrics, errors, and passes/failures.

**Returns**: Object with structure:
```javascript
{
    scenario: string,           // Current scenario name
    script: string,             // Current script name
    passed: boolean,            // Overall test passed
    summary: {
        total_duration_ms: number,     // Total test time
        passed_checks: number,         // Passed assertions
        failed_checks: number,         // Failed assertions
        total_checks: number           // Total assertions
    },
    metrics: {
        commandsSent: number,
        errors: Array,
        decisions: Array,
        snapshots: Array,
        checkpoints: Array
    },
    command_history: Array,     // All commands sent
    errors: Array               // All error messages
}
```

**Example**:
```javascript
const results = window.OmniOpsTestHarness.getResults();
console.log(`Test ${results.passed ? 'PASSED' : 'FAILED'}`);
console.log(`Checks: ${results.summary.passed_checks}/${results.summary.total_checks}`);
```

---

### `getMetrics()`

Returns current game metrics snapshot.

**Returns**: Object with current values:
```javascript
{
    ai_active: boolean,
    player_health: number,
    player_ammo: number,
    is_moving: boolean,
    in_combat: boolean,
    enemy_in_sight: boolean,
    current_mode: string
}
```

---

### `clearResults()`

Clears historical test data and resets metrics.

**Returns**: void

---

## Integration Patterns

### Pattern 1: Browser Console (Manual Testing)

```javascript
// Paste into browser console while game is running

// 1. Setup
await window.OmniOpsTestHarness.setupScenario('patrol_basic');

// 2. Run test
await window.OmniOpsTestHarness.runScript('patrol_sequence');

// 3. Get results
const results = window.OmniOpsTestHarness.getResults();
console.table(results.summary);

// 4. Export
copy(JSON.stringify(results, null, 2));
```

---

### Pattern 2: GitHub Copilot / Claude Integration

```python
# With browser WebSocket bridge or Playwright:

import asyncio
import json

async def run_ai_test():
    # Connect to game browser
    browser = await launch()
    page = await browser.newPage()
    await page.goto('http://localhost:8000')
    
    # Wait for game to load
    await page.waitForFunction('window.OmniOpsTestHarness')
    
    # Run test
    results = await page.evaluate("""
        async () => {
            await window.OmniOpsTestHarness.setupScenario('patrol_basic');
            await window.OmniOpsTestHarness.runScript('patrol_sequence');
            return window.OmniOpsTestHarness.getResults();
        }
    """)
    
    # Process results
    print(json.dumps(results, indent=2))
    return results['passed']

asyncio.run(run_ai_test())
```

---

### Pattern 3: Offline Dev Agent (Node.js / Puppeteer)

```javascript
// puppeteer-ai-tester.js

const puppeteer = require('puppeteer');

async function runAITest(scenario, script) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle2' });
    
    // Wait for harness
    await page.waitForFunction(() => window.OmniOpsTestHarness);
    
    // Setup scenario
    console.log(`Setting up: ${scenario}`);
    await page.evaluate((s) => window.OmniOpsTestHarness.setupScenario(s), scenario);
    
    // Run script
    console.log(`Running: ${script}`);
    await page.evaluate((s) => window.OmniOpsTestHarness.runScript(s), script);
    
    // Get results
    const results = await page.evaluate(() => window.OmniOpsTestHarness.getResults());
    
    console.log(JSON.stringify(results, null, 2));
    
    await browser.close();
    return results;
}

// Usage
runAITest('patrol_basic', 'patrol_sequence')
    .then(r => console.log(`Test ${r.passed ? 'PASSED' : 'FAILED'}`))
    .catch(console.error);
```

---

### Pattern 4: HTTP Bridge (External Process)

Create a simple bridge server:

```python
# test_bridge_server.py

from flask import Flask, request, jsonify
from selenium import webdriver
import asyncio
import json

app = Flask(__name__)
driver = None

@app.route('/api/test/run', methods=['POST'])
def run_test():
    data = request.json
    scenario = data.get('scenario', 'patrol_basic')
    script = data.get('script', 'patrol_sequence')
    
    # Execute in browser via Selenium
    script = f"""
        await window.OmniOpsTestHarness.setupScenario('{scenario}');
        await window.OmniOpsTestHarness.runScript('{script}');
        return window.OmniOpsTestHarness.getResults();
    """
    
    results = driver.execute_async_script(f"return ({script})")
    return jsonify(results)

if __name__ == '__main__':
    driver = webdriver.Chrome()
    driver.get('http://localhost:8000')
    app.run(port=9000)
```

Then call from external tool:

```javascript
const response = await fetch('http://localhost:9000/api/test/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        scenario: 'patrol_basic',
        script: 'patrol_sequence'
    })
});

const results = await response.json();
console.log(results);
```

---

## Troubleshooting

### Issue: "window.OmniOpsTestHarness is undefined"

**Solution**: 
- Ensure game is fully loaded (wait 2-3 seconds after page load)
- Check browser console for errors
- Verify `ai_test_harness.js` is included in HTML

```javascript
// Wait for harness
await new Promise(resolve => {
    const check = setInterval(() => {
        if (window.OmniOpsTestHarness) {
            clearInterval(check);
            resolve();
        }
    }, 100);
    setTimeout(() => { clearInterval(check); resolve(); }, 10000);
});
```

---

### Issue: "AIPlayerAPI not available"

**Solution**:
- Ensure game is fully initialized
- Press "Start Game" in the menu first
- Wait for HUD elements to appear

```javascript
// Check status
const health = window.AIPlayerAPI?.getSnapshot();
if (!health) {
    console.log('Waiting for game initialization...');
    await new Promise(r => setTimeout(r, 3000));
}
```

---

### Issue: Test timeout or hangs

**Solution**:
- Increase wait times for slow machines
- Check browser console for JavaScript errors
- Verify AI is enabled: `window.IntelligentAgent.enabled`

---

## Best Practices

### 1. Always Setup Before Running

```javascript
// ✓ CORRECT
await window.OmniOpsTestHarness.setupScenario('patrol_basic');
await window.OmniOpsTestHarness.runScript('patrol_sequence');

// ✗ WRONG
await window.OmniOpsTestHarness.runScript('patrol_sequence');
```

### 2. Use Error Handling

```javascript
try {
    await window.OmniOpsTestHarness.setupScenario('patrol_basic');
    await window.OmniOpsTestHarness.runScript('patrol_sequence');
} catch (err) {
    console.error('Test failed:', err.message);
    // Report failure to external system
}
```

### 3. Batch Related Tests

```javascript
// Run multiple tests in sequence
const scenarios = ['patrol_basic', 'engage_enemies', 'supply_management'];
const results = [];

for (const scenario of scenarios) {
    await window.OmniOpsTestHarness.setupScenario(scenario);
    await window.OmniOpsTestHarness.runScript(
        Object.keys(TEST_SCRIPTS)[0]  // Use first available script
    );
    results.push(window.OmniOpsTestHarness.getResults());
}

console.log(JSON.stringify(results, null, 2));
```

### 4. Log Results for Analysis

```javascript
const results = window.OmniOpsTestHarness.getResults();

// Save to file (if in Node.js environment)
const timestamp = new Date().toISOString();
const filename = `test_${timestamp}.json`;
// fs.writeFileSync(filename, JSON.stringify(results, null, 2));

// Or upload to server
await fetch('/api/test-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...results, timestamp })
});
```

---

## Example: Complete Test Suite for Copilot

```javascript
/**
 * Complete AI Test Suite - Run from GitHub Copilot or browser console
 */

const TestSuite = {
    results: [],
    
    async run() {
        const scenarios = [
            { name: 'patrol_basic', script: 'patrol_sequence' },
            { name: 'engage_enemies', script: 'enemy_engagement' },
            { name: 'supply_management', script: 'resource_management' }
        ];
        
        for (const test of scenarios) {
            console.log(`\n🧪 Testing: ${test.name}`);
            try {
                await window.OmniOpsTestHarness.setupScenario(test.name);
                await window.OmniOpsTestHarness.runScript(test.script);
                const result = window.OmniOpsTestHarness.getResults();
                this.results.push(result);
                
                const status = result.passed ? '✓ PASS' : '✗ FAIL';
                console.log(`${status} - ${result.summary.passed_checks}/${result.summary.total_checks} checks`);
            } catch (err) {
                console.error(`✗ ERROR: ${err.message}`);
                this.results.push({
                    scenario: test.name,
                    passed: false,
                    error: err.message
                });
            }
        }
        
        this.printSummary();
        return this.results;
    },
    
    printSummary() {
        console.log('\n📊 TEST SUMMARY');
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        console.log(`${passed}/${total} tests passed`);
        console.log(JSON.stringify(this.results, null, 2));
    }
};

// Run: await TestSuite.run();
```

---

## Support

For issues, errors, or feature requests:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify game is fully loaded and playable
4. Contact development team with test results JSON

---

## Version History

- **v1.0** (2026-02-12): Initial release
  - 5 built-in scenarios
  - 4 test scripts
  - Comprehensive API
  - In-game panel UI
  - External tool integration examples
