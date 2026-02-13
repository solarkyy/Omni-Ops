# Game Bridge Implementation Guide

This guide shows how to connect **gameBridge.js** to the real Omni-Ops game running at `http://127.0.0.1:8080`.

---

## Option 1: HTTP Bridge in the Game (Recommended for Quick Start)

### Step 1: Embed a Small HTTP Server in the Game

Inside your Omni-Ops main JavaScript file (e.g., `index.html` or `game.js`), add these endpoints:

```javascript
/**
 * In your game's initialization code, expose these HTTP endpoints
 * This allows the Ops Console to fetch real game state
 */

// Example using Express in a game worker or embedded server
const express = require('express');
const app = express();

app.get('/api/game-state', (req, res) => {
  res.json(AgentBridge.exportSnapshot());
});

app.get('/api/game-status', (req, res) => {
  res.json({
    ready: AgentBridge.getTestReadiness(),
    statusText: AgentBridge.status()
  });
});

app.get('/api/tests', (req, res) => {
  res.json({ tests: OmniOpsTestHarness.listTests() });
});

app.post('/api/run-test', express.json(), (req, res) => {
  const { name, options } = req.body;
  const result = OmniOpsTestHarness.runTest(name, options || {});
  res.json(result);
});

app.get('/api/last-test', (req, res) => {
  res.json(OmniOpsTestHarness.getLastResult());
});

app.post('/api/command', express.json(), (req, res) => {
  const { mode } = req.body;
  AgentBridge.enqueueCommand(mode);
  res.json({ success: true, command: mode });
});

app.listen(8081); // Different port to avoid conflict with game
```

### Step 2: Update gameBridge.js

Replace the stub functions with real HTTP calls:

```javascript
// server/gameBridge.js

const GAME_API_URL = process.env.GAME_API_URL || 'http://127.0.0.1:8081/api';

async function getStatus() {
  const response = await fetch(`${GAME_API_URL}/game-status`);
  return await response.json();
}

async function getSnapshot() {
  const response = await fetch(`${GAME_API_URL}/game-state`);
  return await response.json();
}

async function listTests() {
  const response = await fetch(`${GAME_API_URL}/tests`);
  const data = await response.json();
  return data.tests;
}

async function runTest(name, options = {}) {
  const response = await fetch(`${GAME_API_URL}/run-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, options })
  });
  return await response.json();
}

async function getLastTestResult() {
  const response = await fetch(`${GAME_API_URL}/last-test`);
  return await response.json();
}

async function sendAICommand(mode) {
  const response = await fetch(`${GAME_API_URL}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  return await response.json();
}

// Also uncomment if needed:
async function getAgentBridgeStatus() {
  const status = await getStatus();
  return status.statusText;
}

module.exports = { getStatus, getSnapshot, /* ... */ };
```

### Step 3: Run Both Servers

```bash
# Terminal 1: Omni-Ops game at :8000 with embedded API at :8081
# (In your game startup)

# Terminal 2: Ops Console server
cd ops-console
npm start
# Now at :3000
```

### Step 4: Verify Connection

In Ops Console browser tab, click "Get Snapshot". If it shows real game data instead of mock, you're connected!

---

## Option 2: Browser Extension (DevTools Protocol)

If you want to avoid embedding code in the game, use a browser extension:

### Step 1: Create Minimal Extension

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Omni-Ops Bridge",
  "version": "1.0",
  "permissions": ["scripting", "activeTab"],
  "background": {
    "service_worker": "background.js"
  }
}
```

**background.js:**
```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSnapshot") {
    // Inject script into game tab to call AgentBridge.exportSnapshot()
    chrome.tabs.executeScript(sender.tab.id, {
      code: `AgentBridge.exportSnapshot()`
    }, (results) => {
      sendResponse(results[0]);
    });
  }
});
```

### Step 2: Update gameBridge.js to Use Extension

```javascript
// In gameBridge.js
async function getSnapshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "getSnapshot" },
      (response) => resolve(response)
    );
  });
}
```

---

## Option 3: SharedWorker (For Same-Origin Communication)

If both game and console are hosted from the same origin:

### Step 1: Create SharedWorker

**shared-worker.js:**
```javascript
let gameReferences = null;

self.onconnect = function(event) {
  const port = event.ports[0];

  port.onmessage = function(event) {
    const { type, payload } = event.data;

    if (type === 'registerGame') {
      gameReferences = payload; // References to AgentBridge, etc.
    }

    if (type === 'getSnapshot') {
      port.postMessage({
        type: 'snapshot',
        data: gameReferences.AgentBridge.exportSnapshot()
      });
    }

    if (type === 'listTests') {
      port.postMessage({
        type: 'tests',
        data: gameReferences.OmniOpsTestHarness.listTests()
      });
    }
  };
};
```

### Step 2: In Game Tab

```javascript
const worker = new SharedWorker('shared-worker.js');
worker.port.start();

// Register game APIs with the worker
worker.port.postMessage({
  type: 'registerGame',
  payload: { AgentBridge, OmniOpsTestHarness }
});
```

### Step 3: In Ops Console

**gameBridge.js:**
```javascript
const worker = new SharedWorker('shared-worker.js');
worker.port.start();

async function getSnapshot() {
  return new Promise((resolve) => {
    worker.port.onmessage = (event) => {
      if (event.data.type === 'snapshot') {
        resolve(event.data.data);
      }
    };
    worker.port.postMessage({ type: 'getSnapshot' });
  });
}
```

---

## Option 4: Direct Window Reference (Dev Mode Only)

If Ops Console and Game are on the same domain and CORS allows:

```javascript
// gameBridge.js
const gameWindow = window.opener || window.top; // Reference to game tab

async function getSnapshot() {
  return gameWindow.AgentBridge.exportSnapshot();
}

async function listTests() {
  return gameWindow.OmniOpsTestHarness.listTests();
}

async function runTest(name, options) {
  return gameWindow.OmniOpsTestHarness.runTest(name, options);
}
```

**Note:** Only works if both pages are on the same domain and you open the console as a popup from the game.

---

## Summary of Options

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **HTTP Bridge** | Simple, no extension needed | Requires embedding in game | Low |
| **Extension** | Clean separation | Requires extension install | Medium |
| **SharedWorker** | Elegant IPC | Same-origin only | Medium |
| **Direct Reference** | Dev-friendly | Limited by CORS | Low |

---

## Recommended Path

1. **Start with HTTP Bridge (Option 1):** Fastest to get working
2. **Embed 6 endpoints** in your game's server (or worker)
3. **Replace gameBridge stubs** with fetch calls
4. **Test in Ops Console:** Status should now be real data

---

## Example: Complete HTTP Bridge Implementation

**In your Omni-Ops game (e.g., `ai_vision_dashboard.html` or server):**

```javascript
// Start a simple HTTP server for the Ops Console bridge
const express = require('express');
const app = express();
app.use(express.json());

// These are called from Ops Console
app.get('/api/game-state', (req, res) => {
  res.json({
    gameState: {
      playerHealth: window.player?.health || 100,
      playerAmmo: window.player?.ammo || 0,
      playerPosition: window.player?.position || { x: 0, y: 0, z: 0 },
      sector: window.player?.sector || 'Unknown'
    },
    aiState: {
      currentMode: window.AgentBridge?.currentMode || 'idle',
      lastCommand: window.AgentBridge?.lastCommand || 'none',
      threatsNearby: window.threats?.nearby || []
    },
    decisionHistory: window.AgentBridge?.decisions || []
  });
});

app.post('/api/run-test', (req, res) => {
  const result = window.OmniOpsTestHarness.runTest(
    req.body.name,
    req.body.options
  );
  res.json(result);
});

app.listen(8081, () => console.log('Game API Bridge ready at :8081'));
```

**In Ops Console `gameBridge.js`:**

```javascript
const GAME_API = 'http://127.0.0.1:8081/api';

async function getSnapshot() {
  const res = await fetch(`${GAME_API}/game-state`);
  return res.json();
}

async function runTest(name, options) {
  const res = await fetch(`${GAME_API}/run-test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, options })
  });
  return res.json();
}

// ... rest of functions
```

**Done!** The Ops Console will now fetch real data from your game.

---

## Testing the Connection

```bash
# From Ops Console directory
curl http://127.0.0.1:8081/api/game-state

# Should return:
{
  "gameState": { "playerHealth": 92, ... },
  "aiState": { "currentMode": "patrol_area", ... },
  "decisionHistory": [...]
}
```

If you see real game data, the bridge is working! 🎉
