# API Payloads Reference

Quick copy-paste examples for testing Ops Console endpoints using curl, Postman, or your browser console.

---

## GET /status

Fetch AI readiness and system health.

```bash
curl http://localhost:3000/status
```

**Example Response:**
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
    "timestamp": 1707596400000,
    "reason": "Routine patrol, no threats detected"
  },
  "currentErrors": []
}
```

---

## GET /snapshot

Fetch full game state + AI decision history.

```bash
curl http://localhost:3000/snapshot
```

**Example Response:**
```json
{
  "gameState": {
    "playerHealth": 92,
    "playerAmmo": 156,
    "playerPosition": {
      "x": 125.3,
      "y": 45.8,
      "z": -32.1
    },
    "sector": "Alpha-North",
    "activeThreats": 2
  },
  "aiState": {
    "currentMode": "patrol_area",
    "lastCommand": "patrol_area",
    "lastCommandTime": 1707596395000,
    "targetLocation": {
      "x": 150,
      "y": 50,
      "z": -30
    },
    "threatsNearby": [
      {
        "id": "enemy_1",
        "distance": 45.2,
        "direction": "northeast"
      },
      {
        "id": "enemy_2",
        "distance": 62.8,
        "direction": "east"
      }
    ]
  },
  "decisionHistory": [
    {
      "index": 0,
      "decidedMode": "patrol_area",
      "timestamp": 1707596390000,
      "reason": "Routine sector patrol"
    },
    {
      "index": 1,
      "decidedMode": "hold_position",
      "timestamp": 1707596388000,
      "reason": "Threat detected, holding defensive position"
    },
    {
      "index": 2,
      "decidedMode": "patrol_area",
      "timestamp": 1707596385000,
      "reason": "Threats cleared, resuming patrol"
    }
  ]
}
```

---

## GET /tests

List all available tests.

```bash
curl http://localhost:3000/tests
```

**Example Response:**
```json
{
  "tests": [
    "patrol_basic",
    "patrol_zone_coverage",
    "engage_enemy",
    "engage_multiple_enemies",
    "health_decision_logic",
    "context_snapshot_integrity",
    "actionHistory_tracking",
    "threat_detection",
    "decision_transitions",
    "ai_smoke_test"
  ]
}
```

---

## POST /run-test

Execute a test.

```bash
curl -X POST http://localhost:3000/run-test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "patrol_basic",
    "options": {}
  }'
```

**Request Body:**
```json
{
  "name": "patrol_basic",
  "options": {}
}
```

**Example Response (Test Passed):**
```json
{
  "name": "patrol_basic",
  "passed": true,
  "timestamp": 1707596410000,
  "metrics": {
    "modeDecided": "patrol_area",
    "transitionTime": 145,
    "pathCovered": 256.5,
    "decisionReason": "Routine patrol assigned"
  },
  "reasons": [
    "AI correctly decided to patrol in empty sector",
    "Movement commands sent successfully",
    "No anomalies detected"
  ]
}
```

**Example Response (Test Failed):**
```json
{
  "name": "engage_enemy",
  "passed": false,
  "timestamp": 1707596411000,
  "metrics": {
    "threatDetectionMs": 150,
    "engagementDecisionMs": 2000,
    "targetAcquisition": false
  },
  "reasons": [
    "FAIL: Threat detection took longer than 100ms",
    "FAIL: Enemy acquisition failed"
  ]
}
```

---

## GET /last-test

Get the most recently run test result.

```bash
curl http://localhost:3000/last-test
```

**Example Response:**
```json
{
  "name": "patrol_basic",
  "passed": true,
  "timestamp": 1707596410000,
  "metrics": {
    "modeDecided": "patrol_area",
    "transitionTime": 145,
    "pathCovered": 256.5,
    "decisionReason": "Routine patrol assigned"
  },
  "reasons": [
    "AI correctly decided to patrol in empty sector",
    "Movement commands sent successfully",
    "No anomalies detected"
  ]
}
```

---

## POST /chat

Send a message to Code-AI and Omni-Dev.

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why didnt the AI engage when I saw enemies?",
    "history": [
      {
        "role": "user",
        "from": "user",
        "text": "Can you debug the patrol mode?"
      }
    ]
  }'
```

**Request Body:**
```json
{
  "message": "Why didnt the AI engage when I saw enemies?",
  "history": [
    {
      "role": "user",
      "from": "user",
      "text": "Can you debug the patrol mode?"
    }
  ]
}
```

**Example Response:**
```json
{
  "code": {
    "text": "The engagement logic looks correct. Check if the threat detection range is set properly. Try running the `threat_detection` test to see if enemies are being detected at the right distance. Also verify health level—maybe the AI was too low on health to engage.",
    "raw": {
      "model": "code-ai-v1",
      "temperature": 0.7,
      "tokens": 120
    }
  },
  "omniDev": {
    "reply": "I'll inspect the latest snapshot and run a focused engagement test to understand what happened.",
    "commands": [
      {
        "type": "inspect_snapshot"
      },
      {
        "type": "run_test",
        "name": "engage_enemy"
      },
      {
        "type": "explain_last_test"
      }
    ],
    "raw": {
      "model": "omni-dev-protocol-v1",
      "snapshotUsed": true,
      "testResultIncluded": false
    }
  }
}
```

**Request with Empty History (First Message):**
```json
{
  "message": "Is the AI system healthy?",
  "history": []
}
```

---

## POST /command

Send a direct AI command.

```bash
curl -X POST http://localhost:3000/command \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "seek_enemies"
  }'
```

**Valid Modes:**
- `patrol_area` – Routine patrol
- `seek_enemies` – Search for and engage enemies
- `hold_position` – Defensive stance
- `return_to_safe_zone` – Retreat to base
- (Others as defined in your AgentBridge)

**Request Body:**
```json
{
  "mode": "seek_enemies"
}
```

**Example Response:**
```json
{
  "success": true,
  "command": "seek_enemies",
  "queuedAt": 1707596415000,
  "message": "Command \"seek_enemies\" enqueued for AI execution"
}
```

**Example Failed Response:**
```json
{
  "success": false,
  "command": "invalid_mode",
  "message": "Invalid mode: invalid_mode"
}
```

---

## Testing with Browser Console

Open browser DevTools (F12) and run:

```javascript
// Get status
fetch('http://localhost:3000/status')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));

// Get snapshot
fetch('http://localhost:3000/snapshot')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));

// List tests
fetch('http://localhost:3000/tests')
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));

// Run a test
fetch('http://localhost:3000/run-test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'patrol_basic', options: {} })
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));

// Send command
fetch('http://localhost:3000/command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'seek_enemies' })
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));

// Chat with AI
fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Is the AI working correctly?',
    history: []
  })
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)));
```

---

## Testing with Postman

1. Create a new **Collection** named "Omni-Ops"
2. Add these requests:

| Name | Method | URL | Body |
|------|--------|-----|------|
| Status | GET | `http://localhost:3000/status` | (none) |
| Snapshot | GET | `http://localhost:3000/snapshot` | (none) |
| Tests | GET | `http://localhost:3000/tests` | (none) |
| Run Test | POST | `http://localhost:3000/run-test` | See below |
| Last Test | GET | `http://localhost:3000/last-test` | (none) |
| Chat | POST | `http://localhost:3000/chat` | See below |
| Command | POST | `http://localhost:3000/command` | See below |

**POST Bodies (Postman):**

For `/run-test`, set Body → raw → JSON:
```json
{
  "name": "patrol_basic",
  "options": {}
}
```

For `/chat`, set Body → raw → JSON:
```json
{
  "message": "Is the AI system ready?",
  "history": []
}
```

For `/command`, set Body → raw → JSON:
```json
{
  "mode": "patrol_area"
}
```

---

## Common Test Workflows

### Smoke Test (Quick Health Check)

```bash
# 1. Check status
curl http://localhost:3000/status | jq .ready

# 2. Get snapshot
curl http://localhost:3000/snapshot | jq .gameState.playerHealth

# 3. Run basic patrol test
curl -X POST http://localhost:3000/run-test \
  -H "Content-Type: application/json" \
  -d '{"name":"patrol_basic","options":{}}'

# 4. Confirm results
curl http://localhost:3000/last-test | jq .passed
```

### Engagement Workflow

```bash
# 1. Current mode
curl http://localhost:3000/snapshot | jq .aiState.currentMode

# 2. Send engage command
curl -X POST http://localhost:3000/command \
  -H "Content-Type: application/json" \
  -d '{"mode":"seek_enemies"}'

# 3. Run engagement test
curl -X POST http://localhost:3000/run-test \
  -H "Content-Type: application/json" \
  -d '{"name":"engage_enemy","options":{}}'

# 4. Check results
curl http://localhost:3000/last-test | jq '.passed, .reasons'
```

### Chat & Debug Workflow

```bash
# 1. Send a question to AI
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Why is the AI not engaging enemies?",
    "history": []
  }' | jq '.omniDev.commands'

# 2. Execute the commands recommended by Omni-Dev
# (e.g., run_test, inspect_snapshot, etc.)

curl -X POST http://localhost:3000/run-test \
  -H "Content-Type: application/json" \
  -d '{"name":"engage_enemy","options":{}}'

# 3. Review results
curl http://localhost:3000/last-test | jq .
```

---

## Expected Response Times

| Endpoint | Time |
|----------|------|
| `/status` | < 50ms |
| `/snapshot` | < 50ms |
| `/tests` | < 50ms |
| `/run-test` | 100-500ms (depends on game) |
| `/last-test` | < 50ms |
| `/chat` | 1-3s (AI model latency) |
| `/command` | < 50ms |

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing \"name\" field"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch status",
  "details": "Connection refused"
}
```

---

## Integration Testing Script

Save as `test_api.sh` and run:

```bash
#!/bin/bash

echo "=== Testing Ops Console API ==="

echo -e "\n1. GET /status"
curl -s http://localhost:3000/status | jq .

echo -e "\n2. GET /tests"
curl -s http://localhost:3000/tests | jq .

echo -e "\n3. POST /run-test (patrol_basic)"
curl -s -X POST http://localhost:3000/run-test \
  -H "Content-Type: application/json" \
  -d '{"name":"patrol_basic","options":{}}' | jq .

echo -e "\n4. GET /last-test"
curl -s http://localhost:3000/last-test | jq .

echo -e "\n5. GET /snapshot"
curl -s http://localhost:3000/snapshot | jq .gameState

echo -e "\n=== All tests complete ==="
```

Run with: `bash test_api.sh`

---

## Notes

- All timestamps are in **milliseconds since epoch** (JavaScript Date.now())
- All coordinates are 3D Cartesian: `{ x, y, z }`
- Distances are in **game units** (typically meters)
- Health is a **percentage** (0–100)
- The `/chat` endpoint returns **two separate AI responses**, not merged

**Happy testing!** 🎉
