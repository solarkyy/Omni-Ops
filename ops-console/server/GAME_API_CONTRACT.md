# Game API Contract

This document defines the HTTP API contract between the **Ops Console** backend and the **running Omni-Ops game**.

---

## Overview

The Ops Console (running at `http://localhost:3000`) communicates with the game via HTTP API endpoints hosted by the game (at `http://127.0.0.1:8080` by default).

### Configuration

The game API base URL is configurable:

```bash
# In ops-console/.env (or use the environment variable)
OMNI_OPS_GAME_API_BASE=http://127.0.0.1:8080
OMNI_OPS_GAME_API_TIMEOUT=5000  # milliseconds
```

All game API endpoints are prefixed with `/game-api/`.

### Error Handling

If the game API is unreachable, all endpoints return a graceful "bridge offline" response:

```json
{
  "bridgeOffline": true,
  "error": "Cannot reach game API at http://127.0.0.1:8080/game-api/*",
  "suggestions": [
    "Ensure game is running at http://127.0.0.1:8080",
    "Check that game-api endpoints are implemented and responding"
  ]
}
```

The Ops Console UI will display this status and guide users to verify the game is running.

---

## Endpoints

### 1. `GET /game-api/status`

**Purpose**: Get the current AI readiness and status.

**Called by**: `gameBridge.getStatus()`

**Game side should call**: `AgentBridge.status()` + `AgentBridge.getTestReadiness()`

**Response Body**:

```json
{
  "ready": true,
  "components": {
    "agentBridge": true,
    "intelligentAgent": true,
    "aiPlayerAPI": true,
    "testHarness": true
  },
  "statusText": "AI ACTIVE, mode=patrol_area",
  "lastDecision": {
    "decidedMode": "patrol_area",
    "timestamp": 1707820155000,
    "reason": "Routine patrol, no threats detected"
  },
  "currentErrors": []
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `ready` | boolean | True if all components are loaded and ready |
| `components.agentBridge` | boolean | Whether AgentBridge is initialized |
| `components.intelligentAgent` | boolean | Whether IntelligentAgent is initialized |
| `components.aiPlayerAPI` | boolean | Whether AIPlayerAPI is initialized |
| `components.testHarness` | boolean | Whether OmniOpsTestHarness is initialized |
| `statusText` | string | Human-readable status (e.g., "AI ACTIVE, mode=...") |
| `lastDecision` | object | Most recent AI decision info |
| `lastDecision.decidedMode` | string | The AI mode that was decided (e.g., "patrol_area") |
| `lastDecision.timestamp` | number | Milliseconds since epoch |
| `lastDecision.reason` | string | Why this mode was chosen |
| `currentErrors` | array | List of current error messages, or empty if no errors |

**Example Call** (from Ops Console):

```javascript
const response = await fetch('http://127.0.0.1:8080/game-api/status');
const data = await response.json();
console.log('Game status:', data.statusText);
```

---

### 2. `GET /game-api/snapshot`

**Purpose**: Get a full snapshot of game state and AI decision history.

**Called by**: `gameBridge.getSnapshot()`

**Game side should call**: `AgentBridge.exportSnapshot()`

**Response Body**:

```json
{
  "timestamp": 1707820155000,
  "gameState": {
    "playerHealth": 92,
    "playerAmmo": 156,
    "playerPosition": { "x": 125.3, "y": 45.8, "z": -32.1 },
    "sector": "Alpha-North",
    "activeThreats": 2
  },
  "aiState": {
    "currentMode": "patrol_area",
    "lastCommand": "patrol_area",
    "lastCommandTime": 1707820150000,
    "targetLocation": { "x": 150, "y": 50, "z": -30 },
    "threatsNearby": [
      { "id": "enemy_1", "distance": 45.2, "direction": "northeast" },
      { "id": "enemy_2", "distance": 62.8, "direction": "east" }
    ]
  },
  "decisionHistory": [
    {
      "index": 0,
      "decidedMode": "patrol_area",
      "timestamp": 1707820145000,
      "reason": "Routine sector patrol"
    },
    {
      "index": 1,
      "decidedMode": "hold_position",
      "timestamp": 1707820143000,
      "reason": "Threat detected, holding defensive position"
    },
    {
      "index": 2,
      "decidedMode": "patrol_area",
      "timestamp": 1707820150000,
      "reason": "Threats cleared, resuming patrol"
    }
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | number | When snapshot was captured (ms since epoch) |
| `gameState` | object | Current game state |
| `gameState.playerHealth` | number | Player health percentage (0-100) |
| `gameState.playerAmmo` | number | Current ammo count |
| `gameState.playerPosition` | object | 3D coordinates `{ x, y, z }` |
| `gameState.sector` | string | Current sector/area name |
| `gameState.activeThreats` | number | Count of active threats |
| `aiState` | object | Current AI state |
| `aiState.currentMode` | string | Current AI mode (e.g., "patrol_area", "seek_enemies") |
| `aiState.lastCommand` | string | Most recent command sent |
| `aiState.lastCommandTime` | number | When the command was sent (ms) |
| `aiState.targetLocation` | object | Target 3D coordinates `{ x, y, z }` or null |
| `aiState.threatsNearby` | array | List of nearby threats |
| `decisionHistory` | array | Recent AI decisions (newest first) |

---

### 3. `GET /game-api/tests`

**Purpose**: List all available tests.

**Called by**: `gameBridge.listTests()`

**Game side should call**: `OmniOpsTestHarness.listTests()`

**Response Body**:

```json
{
  "tests": [
    "patrol_basic",
    "patrol_zone_coverage",
    "engage_enemy",
    "engage_multiple_enemies",
    "health_decision_logic",
    "threat_detection",
    "decision_transitions",
    "ai_smoke_test"
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `tests` | array | List of test names as strings |

---

### 4. `POST /game-api/run-test`

**Purpose**: Run a specific test by name.

**Called by**: `gameBridge.runTest(name, options)`

**Game side should call**: `OmniOpsTestHarness.runTest(name, options)`

**Request Body**:

```json
{
  "name": "patrol_basic",
  "options": {
    "verbose": true,
    "timeout": 10000
  }
}
```

**Request Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the test to run |
| `options` | object | Optional test-specific options |

**Response Body**:

```json
{
  "name": "patrol_basic",
  "passed": true,
  "timestamp": 1707820155000,
  "metrics": {
    "modeDecided": "patrol_area",
    "transitionTime": 145,
    "pathCovered": 256.5
  },
  "reasons": [
    "AI correctly decided to patrol in empty sector",
    "Movement commands sent successfully"
  ]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Name of the test that ran |
| `passed` | boolean | Whether the test passed |
| `timestamp` | number | When the test was run (ms since epoch) |
| `metrics` | object | Test-specific metrics |
| `reasons` | array | Explanation strings for the test result |

---

### 5. `GET /game-api/last-test`

**Purpose**: Get the result of the most recently run test.

**Called by**: `gameBridge.getLastTestResult()`

**Game side should call**: `OmniOpsTestHarness.getLastResult()`

**Response Body**:

```json
{
  "name": "patrol_basic",
  "passed": true,
  "timestamp": 1707820155000,
  "metrics": {
    "modeDecided": "patrol_area",
    "transitionTime": 145,
    "pathCovered": 256.5
  },
  "reasons": [
    "AI correctly decided to patrol in empty sector",
    "Movement commands sent successfully",
    "No anomalies detected"
  ]
}
```

**Response Fields**: Same as `/game-api/run-test` response.

If no test has been run yet, return null or an empty result:

```json
{
  "name": null,
  "passed": false,
  "timestamp": null,
  "metrics": {},
  "reasons": ["No test has been run yet"]
}
```

---

### 6. `POST /game-api/command`

**Purpose**: Send a direct command to the AI agent.

**Called by**: `gameBridge.sendAICommand(mode)`

**Game side should call**: `AgentBridge.enqueueCommand(mode)`

**Request Body**:

```json
{
  "mode": "patrol_area"
}
```

**Request Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | Command/mode to enqueue (e.g., "patrol_area", "seek_enemies") |

**Response Body**:

```json
{
  "success": true,
  "command": "patrol_area",
  "queuedAt": 1707820155000,
  "message": "Command 'patrol_area' enqueued for AI execution"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the command was accepted |
| `command` | string | The command that was enqueued |
| `queuedAt` | number | When the command was queued (ms since epoch) |
| `message` | string | Human-readable confirmation message |

---

### 7. `GET /game-api/agent-status`

**Purpose**: Get a brief human-readable AI status.

**Called by**: `gameBridge.getAgentBridgeStatus()`

**Game side should call**: `AgentBridge.status()`

**Response Body**:

```json
{
  "status": "AI ACTIVE, mode=patrol_area, threats=2, health=92%"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Human-readable status line |

---

## Implementation Guide for Game

To implement this contract in your game, add an HTTP bridge (e.g., using `Express.js` or a simple Node server):

### Example: Minimal Game API Bridge

```javascript
// In your game or a separate bridge process:
const express = require('express');
const app = express();

app.use(express.json());

// Make these available globally in your game
// (e.g., window.AgentBridge, window.OmniOpsTestHarness, etc.)
const { AgentBridge, OmniOpsTestHarness, IntelligentAgent } = /* your game APIs */;

// GET /game-api/status
app.get('/game-api/status', (req, res) => {
  const testReadiness = AgentBridge.getTestReadiness();
  const status = AgentBridge.status();
  
  res.json({
    ready: testReadiness.ready,
    components: testReadiness.components,
    statusText: status,
    lastDecision: {
      decidedMode: IntelligentAgent.currentMode || 'unknown',
      timestamp: Date.now(),
      reason: 'Last decision reason'
    },
    currentErrors: testReadiness.missingComponents || []
  });
});

// GET /game-api/snapshot
app.get('/game-api/snapshot', (req, res) => {
  const snapshot = AgentBridge.exportSnapshot();
  res.json(snapshot);
});

// GET /game-api/tests
app.get('/game-api/tests', (req, res) => {
  const tests = OmniOpsTestHarness.listTests();
  res.json({ tests });
});

// POST /game-api/run-test
app.post('/game-api/run-test', (req, res) => {
  const { name, options } = req.body;
  const result = OmniOpsTestHarness.runTest(name, options);
  res.json(result);
});

// GET /game-api/last-test
app.get('/game-api/last-test', (req, res) => {
  const result = OmniOpsTestHarness.getLastResult();
  res.json(result);
});

// POST /game-api/command
app.post('/game-api/command', (req, res) => {
  const { mode } = req.body;
  const success = AgentBridge.enqueueCommand(mode);
  res.json({
    success,
    command: mode,
    queuedAt: Date.now(),
    message: `Command '${mode}' enqueued`
  });
});

// GET /game-api/agent-status
app.get('/game-api/agent-status', (req, res) => {
  const status = AgentBridge.status();
  res.json({ status });
});

app.listen(8080, () => console.log('Game API bridge running on port 8080'));
```

---

## Verification Checklist

- [ ] Game API bridge is running and responding to requests
- [ ] All 7 endpoints are implemented and returning correct JSON shapes
- [ ] Ops Console can reach the game API (check console for connection errors)
- [ ] `/status` reflects real game component readiness
- [ ] `/snapshot` reflects current game and AI state
- [ ] `/tests` returns actual available test names
- [ ] `/run-test` executes tests and returns results
- [ ] `/last-test` returns the most recent test result
- [ ] `/command` accepts and queues commands to the AI

---

## Testing

### Quick Test with curl

```bash
# Check if game API is online
curl http://127.0.0.1:8080/game-api/status

# Get snapshot
curl http://127.0.0.1:8080/game-api/snapshot

# List tests
curl http://127.0.0.1:8080/game-api/tests

# Run a test
curl -X POST http://127.0.0.1:8080/game-api/run-test \
  -H "Content-Type: application/json" \
  -d '{"name": "patrol_basic"}'
```

### From Ops Console

1. Start the Ops Console: `npm start` in `ops-console/`
2. Open browser: `http://localhost:3000`
3. Check the **Status** panel
4. If game API is offline, you'll see a clear error message
5. Run tests from the **Tests** tab

---

## Troubleshooting

### "Bridge Offline" Error

**Problem**: The Ops Console shows "BRIDGE OFFLINE"

**Solutions**:
1. Ensure the game is running at `http://127.0.0.1:8080`
2. Verify `/game-api/status` responds to a direct curl/fetch request
3. Check network connectivity between Ops Console and game
4. Check browser console (`F12`) for CORS errors
5. Verify `OMNI_OPS_GAME_API_BASE` env var is set correctly

### Timeout Errors

**Problem**: Requests are timing out

**Solutions**:
1. Increase `OMNI_OPS_GAME_API_TIMEOUT` in `.env`
2. Check if game is under heavy load
3. Ensure network latency is acceptable

### Invalid JSON Response

**Problem**: API returns unparseable response

**Solutions**:
1. Verify endpoint returns valid JSON (use `curl -i`)
2. Check for HTML error pages (indicates API route not found)
3. Review game API bridge implementation for typos

---

## Future Enhancements

- **WebSocket support** for real-time updates (instead of polling)
- **Server-Sent Events (SSE)** for live snapshots
- **Authentication tokens** for secure game-to-console communication
- **Batch operations** for fetching multiple resources at once
