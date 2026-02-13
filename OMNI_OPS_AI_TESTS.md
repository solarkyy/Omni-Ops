# Omni-Ops AI Test Harness

## Quick Start

The AI test harness validates AI decision-making, command execution, and state tracking without interfering with gameplay.

### Running Tests

Open browser console at `http://127.0.0.1:8080` (or your game URL):

```javascript
// List available tests
OmniOpsTestHarness.listTests()
// Returns: ["patrol_basic", "decision_override_low_health", "context_snapshot_integrity", "actionHistory_tracking", "mode_transition_timing"]

// Run a single test
await OmniOpsTestHarness.runTest('patrol_basic')

// Run all tests
await OmniOpsTestHarness.runAll()

// Get last result
OmniOpsTestHarness.getLastResult()

// Check if tests are running
OmniOpsTestHarness.getLiveStatus()
```

### Console Shortcuts

```javascript
// Quick test with formatted output
runAITest('patrol_basic')

// Run all tests with summary table
runAllAITests()

// Check test status
aiTestStatus()
```

### URL Parameter

Auto-run a test on page load:
```
http://127.0.0.1:8080/?aitest=patrol_basic
```

## Available Tests

1. **patrol_basic** - Validates patrol mode activation, command acceptance, and actionHistory tracking
2. **decision_override_low_health** - Tests safety overrides when health is critical (uses state mocking)
3. **context_snapshot_integrity** - Schema validation for AgentBridge.exportSnapshot()
4. **actionHistory_tracking** - Verifies multi-command tracking with full context
5. **mode_transition_timing** - Measures command-to-mode-change latency

## Test Results Schema

Each test returns a `TestResult` object:

```javascript
{
    name: string,              // Test name
    testRunId: string,         // UUID for this run
    startedAt: ISO8601,
    finishedAt: ISO8601,
    durationMs: number,
    passed: boolean,           // true if all checks passed
    reasons: string[],         // Human-readable outcomes
    decisions: array,          // From IntelligentAgent.actionHistory
    errors: array,             // Any errors encountered
    metrics: {
        commandsSent: number,
        checksPerformed: number,
        checksPassed: number,
        checksFailed: number,
        modeTransitions: number,
        avgExecutionTimeMs: number,
        snapshotBytes: number
    },
    finalSnapshot: object      // Final game state
}
```

## System Requirements

Tests require these components (checked via `AgentBridge.getTestReadiness()`):

- AgentBridge (ai/AgentBridge.js)
- IntelligentAgent (ai/IntelligentAgent.js)
- AIPlayerAPI (ai/ai_player.js)
- OmniAIWorker (ai/ai_worker_api.js)

**Critical**: IntelligentAgent must be wired to AIPlayerAPI via `AgentBridge._bootstrap()` before tests run.

## Test Isolation

- Tests **never** mutate player position, health, or ammo directly
- Test mode bypasses AI context readiness checks for deterministic execution
- All state is restored after tests (AI disabled, test flags cleared)
- ActionHistory limit temporarily increased during tests (50 vs 10) to prevent data loss
- Only one test runs at a time (concurrent tests are rejected)

## Troubleshooting

**"System not ready" error**:
```javascript
AgentBridge.getTestReadiness()
// Check `ready` field and `recommendations` array
```

**"Another test is running" error**:
Wait for current test to complete or check status:
```javascript
aiTestStatus()
```

**Tests timing out**:
Tests use `pollUntil()` with 2-5 second timeouts. If your machine is slow or game loop paused, tests may fail. Not a harness bug—actual timing issue.

## Advanced Usage

### Check Test Info
```javascript
OmniOpsTestHarness.getTestInfo('patrol_basic')
// Returns: { name, description, estimatedDuration }
```

### Manually Enable Test Mode
```javascript
AgentBridge.enableTestMode()
// Bypasses context checks, enables verbose logging

AgentBridge.disableTestMode()
// Restore normal operation
```

### Access Test Results History
```javascript
OmniOpsTestHarness.getAllResults()
// Returns array of all TestResult objects from current session

OmniOpsTestHarness.clearResults()
// Clear results history
```

---

**Last Updated**: 2026-02-12  
**Test Harness Version**: Production v2.0
