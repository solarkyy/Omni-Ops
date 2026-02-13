# Omni-Dev Command Execution Pipeline
## Implementation Guide (Stage 4)

---

## Overview

This implementation adds a **command execution pipeline** that enables Omni-Dev to execute generated commands directly against the game via the REST API, completing the **chat → commands → game** loop.

**Key Features:**
- Omni-Dev generates commands via LLM
- User clicks "Run Omni-Dev Commands" button
- Backend executor routes commands to game bridge
- Results displayed in UI with success/failure feedback
- Manual execution only (explicitly click button, no auto-exec)
- Graceful error handling for offline/unreachable game

---

## Files Modified / Created

### 1. **[ops-console/server/commandExecutor.js](ops-console/server/commandExecutor.js)** ⭐ NEW
   - Command executor module
   - Maps 4 command types to gameBridge functions
   - Returns structured results with success/failure tracking

### 2. **[ops-console/server/index.js](ops-console/server/index.js)**
   - Added `require('./commandExecutor')`
   - Added `POST /execute-commands` endpoint
   - Updated startup banner

### 3. **[ops-console/client/main.js](ops-console/client/main.js)**
   - Added `latestCommands` state variable
   - Enhanced command display with "Run Omni-Dev Commands" button
   - Added `executeOmniDevCommands()` function
   - Auto-refresh snapshot + status after execution

---

## Backend Implementation

### Command Executor Module (`commandExecutor.js`)

Supports 4 command types:

```javascript
[
  { type: "run_test", name: "patrol_basic", options: {...} },
  { type: "inspect_snapshot" },
  { type: "send_ai_command", mode: "patrol_area" },
  { type: "check_status" }
]
```

| Type | Calls | Returns |
|------|-------|---------|
| `run_test` | `gameBridge.runTest(name, options)` | TestResult object |
| `inspect_snapshot` | `gameBridge.getSnapshot()` | Game + AI state |
| `send_ai_command` | `gameBridge.sendAICommand(mode)` | Command confirmation |
| `check_status` | `gameBridge.getStatus()` | AI readiness status |

**Result Structure:**
```json
{
  "executed": [
    { "command": {...}, "result": {...}, "error": null },
    { "command": {...}, "result": null, "error": "bridge offline" }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1
  }
}
```

### REST Endpoint

**POST /execute-commands**

```bash
curl -X POST http://localhost:3000/execute-commands \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      { "type": "run_test", "name": "patrol_basic" },
      { "type": "check_status" }
    ]
  }'
```

**Response (200 OK):**
```json
{
  "executed": [
    {
      "command": { "type": "run_test", "name": "patrol_basic" },
      "result": { "name": "patrol_basic", "passed": true, "timestamp": 1739354521234 },
      "error": null
    },
    {
      "command": { "type": "check_status" },
      "result": { "ready": true, "components": {...} },
      "error": null
    }
  ],
  "summary": { "total": 2, "successful": 2, "failed": 0 }
}
```

**Error Handling:**
- Bridge offline → `error: "Game API unreachable at..."`
- Invalid command type → `error: "Unknown command type: \"foo\""`
- Missing required field → `error: "Missing \"name\" field for run_test"`

---

## Frontend Implementation

### State Management

```javascript
let latestCommands = [];  // Stores commands from latest chat response
```

### Command Display & Button

When chat response includes `agents.omniDev.commands[]`:

1. Renders commands as JSON
2. Adds blue **"▶ Run Omni-Dev Commands"** button
3. Stores commands in `latestCommands`

### Execution Flow

```javascript
executeOmniDevCommands()
  → POST /execute-commands with latestCommands
  → Display result summary (✅ 2 successful, ❌ 0 failed)
  → List each command with status
  → Auto-refresh snapshot + status bar
```

### Result Display Format

```
✓ Executed 2 command(s)
  Successful: 2
  Failed: 0
  [1] ✅ run_test
  [2] ✅ check_status
```

or (with failures):

```
✓ Executed 3 command(s)
  Successful: 2
  Failed: 1
  [1] ✅ send_ai_command
  [2] ❌ inspect_snapshot (bridge offline)
  [3] ✅ check_status
```

---

## How to Test

### Prerequisites

1. **Both servers running:**
   ```bash
   # Terminal 1: Game server
   cd "c:\Users\kjoly\OneDrive\Desktop\Omni Ops"
   python local_http_server.py
   
   # Terminal 2: Ops Console server
   cd "c:\Users\kjoly\OneDrive\Desktop\Omni Ops\ops-console"
   npm install
   npm start
   ```

2. **Verify game API is live:**
   ```bash
   curl http://127.0.0.1:8080/game-api/status
   # Should return JSON with ready/components/statusText
   ```

3. **Verify Ops Console is live:**
   ```bash
   curl http://localhost:3000/status
   # Should return JSON status
   ```

### Test Scenario

1. **Open Ops Console** → `http://localhost:3000/ops-console`

2. **Send a chat message:**
   - Input: `"Check if patrol_basic test passes"`
   - UI: Omni-Dev responds with `commands: [{ type: "run_test", name: "patrol_basic" }]`

3. **Click "▶ Run Omni-Dev Commands" button**
   - UI: "Executing 1 command(s)..."
   - Backend: Calls `gameBridge.runTest("patrol_basic")`
   - UI: Shows result:
     ```
     ✓ Executed 1 command(s)
       Successful: 1
       Failed: 0
       [1] ✅ run_test
     ```

4. **Verify state update:**
   - Snapshot panel refreshes with updated test result
   - Status bar shows fresh timestamp

### Test Error Scenarios

**A. Game Bridge Offline**
```javascript
// Kill game server mid-execution
// Result: ❌ check_status (Cannot reach game API at...)
```

**B. Invalid Command Type**
```javascript
// Manually POST with: { "commands": [{ "type": "invalid_command" }] }
// Result: ❌ invalid_command (Unknown command type: "invalid_command")
```

**C. Missing Required Field**
```javascript
// Manually POST with: { "commands": [{ "type": "run_test" }] }
// Result: ❌ run_test (Missing "name" field for run_test)
```

---

## Integration with LLM Flow

### Omni-Dev Command Generation (aiClients.js)

Omni-Dev LLM should generate commands in response to user queries:

```json
{
  "reply": "Running diagnostics on patrol behavior...",
  "commands": [
    { "type": "inspect_snapshot" },
    { "type": "run_test", "name": "patrol_basic" },
    { "type": "check_status" }
  ]
}
```

### Chat Response Structure

```javascript
{
  "reply": "Summary of all agents...",
  "agents": {
    "code": { "text": "...", "raw": {...} },
    "omniDev": {
      "reply": "...",
      "commands": [...],        // ← Captured and stored
      "raw": {...}
    }
  }
}
```

---

## Safety & Design Decisions

### Why Manual Execution Only?

- **No auto-exec on every chat** → Prevents accidental command spam
- **Explicit button click** → User has full control
- **Buffer before execution** → Time to review command JSON first

### Error Resilience

- **Bridge offline** → Commands still execute successfully on client, result shows bridge error
- **No UI crash** → All try/catch blocks prevent error propagation
- **Clear messaging** → User sees exactly which commands failed and why

### Performance

- **Parallel command execution** → Loop through commands sequentially (safe for game bridge)
- **Auto-refresh delay** → 500ms after execution (allows game state to settle)
- **History limits** → Chat history capped at 200 messages

---

## Future Enhancements

1. **Scheduled Execution** → Queue commands to run at specific intervals
2. **Command History** → Track all executed commands with timestamps
3. **Conditional Logic** → "Run command B only if command A succeeds"
4. **Batch Status Dashboard** → View all command results in a separate panel
5. **Omni-Dev Feedback Loop** → "Command X failed because Y; suggest alternative"

---

## Troubleshooting

### Button doesn't appear
- Verify chat response includes `agents.omniDev.commands` array
- Check browser console for errors
- Confirm `latestCommands` is being set

### Commands execute but return bridge offline
- Verify game server is running: `python local_http_server.py`
- Check game API responds: `curl http://127.0.0.1:8080/game-api/status`
- Check network connectivity between servers

### Results show 0 successful, all failed
- Inspect network tab in DevTools
- Check server logs for 500 errors
- Verify command JSON structure matches schema

---

## Files Ready to Deploy

✅ [ops-console/server/commandExecutor.js](ops-console/server/commandExecutor.js)  
✅ [ops-console/server/index.js](ops-console/server/index.js) (2 changes)  
✅ [ops-console/client/main.js](ops-console/client/main.js) (3 changes)  

**Ready for production deployment.**

---

**Implementation complete.** The command execution pipeline is now live and ready for testing against the real game. Omni-Dev can now execute commands end-to-end via the UI.
