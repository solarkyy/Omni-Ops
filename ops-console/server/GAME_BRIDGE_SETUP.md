# Game Bridge Setup & Verification Guide

This guide walks you through setting up the **real game bridge** between the Ops Console and your running Omni-Ops game.

---

## Quick Start (5 minutes)

### 1. Ensure Game is Running

Start your game server:

```bash
# In the main Omni Ops folder
python local_http_server.py
```

Verify the game is accessible:

```bash
curl http://127.0.0.1:8080/
# Should return game HTML/welcome
```

### 2. Start Ops Console Backend

```bash
cd ops-console/
npm start
```

Expected output:

```
╔════════════════════════════════════════╗
║      Omni-Ops Ops Console Server       ║
╠════════════════════════════════════════╣
║  Server: http://localhost:3000         ║
║  Open: http://localhost:3000           ║
║                                        ║
║  Endpoints:                            ║
║    GET  /status                        ║
║    GET  /snapshot                      ║
║    GET  /tests                         ║
║    POST /run-test                      ║
║    GET  /last-test                     ║
║    POST /chat                          ║
║    POST /command                       ║
╚════════════════════════════════════════╝
```

### 3. Open Ops Console Frontend

Navigate to: **http://localhost:3000**

You should see the Ops Console UI.

---

## Verification Steps

### Step 1: Check Bridge Status in Console UI

1. Open **http://localhost:3000** in your browser
2. Look at the **Status** panel
3. Expected outcomes:

#### ✅ Success: Bridge Online

You'll see:
- ✓ Game components showing as ready/ready
- Status text like "AI ACTIVE, mode=patrol_area"
- Real game data in the snapshot

#### ❌ Failure: Bridge Offline

You'll see:
- "BRIDGE OFFLINE - Game API unreachable"
- Error message with suggestions
- Helpful troubleshooting tips

### Step 2: Test Individual Endpoints (curl)

Run these commands to verify each endpoint:

```bash
# 1. Status endpoint
curl http://localhost:3000/status
# Expected: JSON with ready, components, statusText

# 2. Snapshot endpoint
curl http://localhost:3000/snapshot
# Expected: JSON with gameState, aiState, decisionHistory

# 3. List tests
curl http://localhost:3000/tests
# Expected: JSON with array of test names

# 4. Get last test result
curl http://localhost:3000/last-test
# Expected: JSON with test result

# 5. Run a test
curl -X POST http://localhost:3000/run-test \
  -H "Content-Type: application/json" \
  -d '{"name": "patrol_basic"}'
# Expected: JSON with test name, passed status, metrics
```

All should return valid JSON (not HTML error pages).

### Step 3: Check Game API Directly

Bypass Ops Console and call the game API directly:

```bash
# Check if game APIs are implemented
curl http://127.0.0.1:8080/game-api/status
```

If you get a 404 or connection refused, the game-side API bridge is not implemented. 
See **"Game-Side Implementation"** section below.

### Step 4: Monitor Console Logs

Watch both terminals for errors:

**Ops Console terminal** (npm start):
- Look for error logs starting with `[gameBridge]`
- Should see logs like `[gameBridge] Calling http://127.0.0.1:8080/game-api/status`

**Game terminal** (python local_http_server.py):
- Should see incoming requests to `/game-api/*` routes

---

## Game-Side Implementation

The game must expose HTTP endpoints at `/game-api/*`. 

### Option 1: Implement Endpoints Directly in Game

If your game runs in a browser tab, inject these endpoints:

```javascript
// In your game's HTML or as an injected script:
const express = require('express');
const app = express();
app.use(express.json());

// Route to game APIs
app.get('/game-api/status', (req, res) => {
  res.json({
    ready: true,
    components: {
      agentBridge: !!window.AgentBridge,
      intelligentAgent: !!window.IntelligentAgent,
      aiPlayerAPI: !!window.AIPlayerAPI,
      testHarness: !!window.OmniOpsTestHarness
    },
    statusText: window.AgentBridge?.status?.() || 'Unknown',
    lastDecision: { /* ... */ },
    currentErrors: []
  });
});

// ... implement other endpoints (see GAME_API_CONTRACT.md)

app.listen(8080);
```

### Option 2: Use Existing local_http_server.py

If `local_http_server.py` already serves the game, add the routes there:

```python
# In local_http_server.py, add these routes after the game routes:

@app.get('/game-api/status')
def game_status():
    # Call into game via JavaScript bridge or IPC
    return jsonify({
        'ready': True,
        'components': {
            'agentBridge': True,
            'intelligentAgent': True,
            'aiPlayerAPI': True,
            'testHarness': True
        },
        'statusText': 'AI ACTIVE, mode=patrol_area',
        'lastDecision': { ... },
        'currentErrors': []
    })

# ... implement other endpoints
```

### Option 3: Standalone Bridge Process

Run the game API bridge as a separate Node.js process:

```javascript
// game-api-bridge.js
const express = require('express');
const app = express();

// Import game APIs from game module
const { AgentBridge, OmniOpsTestHarness } = require('./game-apis.js');

app.get('/game-api/status', (req, res) => {
  res.json(AgentBridge.exportStatus());
});

// ... other endpoints

app.listen(8080);
```

Then run alongside the game:

```bash
# Terminal 1: Start game
python local_http_server.py

# Terminal 2: Start API bridge
node game-api-bridge.js
```

---

## Configuration

### Environment Variables

Create `ops-console/.env` (or use `.env.example`):

```bash
# Base URL where game API is running
OMNI_OPS_GAME_API_BASE=http://127.0.0.1:8080

# Timeout for API calls (ms)
OMNI_OPS_GAME_API_TIMEOUT=5000

# Ops Console server port
PORT=3000
```

If you change the game's port, update:

```bash
# If game runs on port 9000 instead
OMNI_OPS_GAME_API_BASE=http://127.0.0.1:9000
```

---

## Troubleshooting

### Problem: "Cannot reach game API at http://127.0.0.1:8080/game-api/status"

**Checklist**:
1. Is the game running?
   ```bash
   curl http://127.0.0.1:8080/
   # Should return HTML, not connection error
   ```

2. Are the `/game-api/*` routes implemented?
   ```bash
   curl http://127.0.0.1:8080/game-api/status
   # Should return JSON, not 404
   ```

3. Is Ops Console on the same network?
   - If running locally, should work
   - If running remotely, check firewall/network

### Problem: Response is HTML, not JSON

This usually means:
- The route is not implemented (404 page)
- There's an unhandled error (500 page)

**Solution**: Check game API bridge logs for errors.

### Problem: CORS Error in Browser Console

If you see `Cross-Origin Request Blocked`:
- This means the game API is not allowing requests from `localhost:3000`
- Add CORS headers in game API:

```python
# In game server (Flask example):
from flask_cors import CORS
CORS(app)

# Or manually:
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response
```

Or Node.js:

```javascript
const cors = require('cors');
app.use(cors()); // Allow all origins
```

### Problem: Timeout (5 second delay, then fails)

**Solutions**:
1. Increase timeout in `.env`:
   ```bash
   OMNI_OPS_GAME_API_TIMEOUT=10000  # 10 seconds
   ```

2. Check if game is under heavy load
3. Check network latency (ping)

---

## Full System Startup

Once verified, here's the complete startup sequence:

### Terminal 1: Game Server

```bash
cd "c:\Users\kjoly\OneDrive\Desktop\Omni Ops"
python local_http_server.py
```

Expected output:
```
Serving game at http://127.0.0.1:8080
```

### Terminal 2: Ops Console Backend

```bash
cd "c:\Users\kjoly\OneDrive\Desktop\Omni Ops\ops-console"
npm start
```

Expected output:
```
╔════════════════════════════════════════╗
║      Omni-Ops Ops Console Server       ║
╠════════════════════════════════════════╣
║  Server: http://localhost:3000         ║
...
```

### Terminal 3 (Optional): Open Browser

```bash
# On Windows
start http://localhost:3000

# On macOS
open http://localhost:3000

# On Linux
xdg-open http://localhost:3000
```

### Verify Everything Works

In Ops Console (http://localhost:3000):
1. Check **Status** panel - should show game components as ready
2. Click **Snapshot** - should show real game state
3. Go to **Tests** tab - should list available tests
4. Try running a test - should execute and show results

---

## Next Steps

Once the bridge is working:

1. **Implement missing game APIs** - Add any `/game-api/*` routes not yet implemented
2. **Add real test harness integration** - Link `/run-test` to actual game test execution
3. **Implement AI commands** - Wire `/command` POST to `AgentBridge.enqueueCommand()`
4. **Monitor and debug** - Use Ops Console to monitor AI behavior in real-time

For detailed API specification, see [GAME_API_CONTRACT.md](./GAME_API_CONTRACT.md).

---

## Quick Reference: All Files Changed

- **ops-console/server/gameBridge.js** - Now uses real HTTP calls instead of mocks
- **ops-console/.env.example** - Added `OMNI_OPS_GAME_API_BASE` and `OMNI_OPS_GAME_API_TIMEOUT`
- **ops-console/server/GAME_API_CONTRACT.md** - Full API specification and implementation guide

No changes needed to `index.js` - it already calls `gameBridge` correctly.

