# Omni‑Ops Ops Console

A separate web dashboard to monitor, control, and debug the running Omni‑Ops game from another browser tab.

## Architecture

```
ops-console/
├── server/
│   ├── index.js           # Express server with REST endpoints
│   ├── gameBridge.js      # Stubbed functions to call game APIs
│   └── aiClients.js       # Placeholder for Code-AI + Omni-Dev calls
├── client/
│   ├── index.html         # UI layout
│   └── main.js            # Frontend logic & state management
├── package.json           # Node dependencies
└── README.md              # This file
```

## Quick Start

### Prerequisites

- Node.js 14+ installed
- Omni‑Ops game running at `http://127.0.0.1:8080` in another browser tab

### Installation & Setup

1. **Navigate to the ops-console directory:**

   ```bash
   cd ops-console
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the server:**

   ```bash
   npm start
   ```

   Expected output:
   ```
   ╔════════════════════════════════════════╗
   ║      Omni-Ops Ops Console Server       ║
   ╠════════════════════════════════════════╣
   ║  Server: http://localhost:3000         ║
   ║  Open: http://localhost:3000           ║
   │                                        ║
   │  Endpoints:                            ║
   │    GET  /status                        ║
   │    GET  /snapshot                      ║
   │    GET  /tests                         ║
   │    POST /run-test                      ║
   │    GET  /last-test                     ║
   │    POST /chat                          ║
   │    POST /command                       ║
   ╚════════════════════════════════════════╝
   ```

4. **Open in browser:**

   In a new browser tab, navigate to:
   ```
   http://localhost:3000
   ```

   You should now see the Ops Console dashboard alongside your Omni‑Ops game tab.

---

## Ops Console UI Layout

### Status Bar (Top)
- **Health Indicator:** Green (ready), yellow (warning), red (error)
- **Current Mode:** The AI's active decision mode
- **Threats:** Number of enemies detected
- **Health:** Player health percentage
- **Last Refresh:** Timestamp of last status update

### Two-Column Layout

#### Left: Dashboard
- **📊 Snapshot Panel**
  - Click "Get Snapshot" to fetch current game + AI state
  - Shows: player health, ammo, sector, AI mode, target, threats, recent decisions
  
- **🧪 Tests Panel**
  - Lists all available tests (patrol_basic, engage_enemy, etc.)
  - Click "Run" next to any test to execute it
  - Latest test result shown below with pass/fail status

#### Right: Chat
- **💬 AI Ops Chat**
  - Chat with Code‑AI (senior engineer suggestions) and Omni‑Dev (in‑game AI protocol)
  - Both respond to the same message; bubbles show both perspectives
  - Omni‑Dev responses display structured `commands` for game execution
  
- **Quick Command Buttons**
  - 🔄 Patrol
  - 🎯 Engage
  - 🛡️ Hold
  - 🏃 Retreat
  
  Click any to send a direct mode command to the AI.

---

## REST Endpoints

All endpoints respond with JSON. Base URL: `http://localhost:3000`

### `GET /status`
Returns AI readiness and current component health.

**Response:**
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

### `GET /snapshot`
Fetches full game state + AI decision history snapshot.

**Response:**
```json
{
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
    "lastCommandTime": 1707596395000,
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
      "timestamp": 1707596390000,
      "reason": "Routine sector patrol"
    }
  ]
}
```

---

### `GET /tests`
Lists all available AI tests.

**Response:**
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

### `POST /run-test`
Runs a named test and returns its result.

**Request:**
```json
{
  "name": "patrol_basic",
  "options": {}
}
```

**Response:**
```json
{
  "name": "patrol_basic",
  "passed": true,
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

---

### `GET /last-test`
Returns the result of the most recently run test.

**Response:** (Same shape as run-test result)

---

### `POST /chat`
Sends a message to both Code‑AI and Omni‑Dev.

**Request:**
```json
{
  "message": "Why didn't the AI engage when I saw enemies?",
  "history": [
    {
      "role": "user",
      "from": "user",
      "text": "Previous question..."
    }
  ]
}
```

**Response:**
```json
{
  "code": {
    "text": "The patrol logic looks solid. Try running `engage_enemy` test to validate...",
    "raw": {
      "model": "code-ai-v1",
      "temperature": 0.7,
      "tokens": 150
    }
  },
  "omniDev": {
    "reply": "I'll run the engage_enemy test and inspect the snapshot.",
    "commands": [
      { "type": "run_test", "name": "engage_enemy" },
      { "type": "inspect_snapshot" }
    ],
    "raw": {
      "model": "omni-dev-protocol-v1",
      "snapshotUsed": true,
      "testResultIncluded": false
    }
  }
}
```

---

### `POST /command`
Sends a direct AI mode command to the game.

**Request:**
```json
{
  "mode": "seek_enemies"
}
```

**Response:**
```json
{
  "success": true,
  "command": "seek_enemies",
  "queuedAt": 1707596410000,
  "message": "Command \"seek_enemies\" enqueued for AI execution"
}
```

---

## Implementation: Connecting to the Game

The **gameBridge.js** file contains stub functions. Currently, they return mock data. To connect to the actual running game, you have three options:

### Option 1: DevTools MCP (Recommended for Extension)
- Use VS Code DevTools MCP or a browser extension to inject a script into the game tab
- Call `AgentBridge.exportSnapshot()`, `OmniOpsTestHarness.runTest()`, etc. directly
- Send results back to the console server via a WebSocket or message channel

### Option 2: SharedWorker
- In the game, create a SharedWorker that holds the actual `AgentBridge` and test harness
- The console server can connect to the same SharedWorker and call functions directly

### Option 3: HTTP Bridge in Game
- Embed a small HTTP endpoint in the game that exposes game APIs
- Replace the mock functions in **gameBridge.js** with fetch calls to that endpoint

**For now, the mock data lets you develop and test the UI immediately.**

---

## Extending the Console

### Add a New Test UI Panel
1. Add a button in `client/index.html`
2. Call `fetchJSON('/tests')` in `main.js`
3. Render results in a new section

### Add Real AI Model Integration
1. Open `server/aiClients.js`
2. Replace `callCodeAI()` and `callOmniDevAI()` with real API calls:
   ```javascript
   // Example: OpenAI integration
   async function callCodeAI(message, history) {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
       body: JSON.stringify({
         model: 'gpt-4',
         messages: formatChatHistory(message, history),
         temperature: 0.7
       })
     });
     return await response.json();
   }
   ```

### Connect to Real Game Data
1. Open `server/gameBridge.js`
2. Replace each stub function with a real call to the game:
   ```javascript
   async function getSnapshot() {
     // Option A: Call an embedded game endpoint
     const response = await fetch('http://127.0.0.1:8080/api/game-state');
     return await response.json();
     
     // Option B: Use a SharedWorker or postMessage bridge
   }
   ```

---

## Environment Variables (Optional)

Create a `.env` file in the `ops-console` directory:

```bash
# Port for the console server
PORT=3000

# URL of the running Omni-Ops game
OMNI_OPS_URL=http://127.0.0.1:8080

# API keys for real AI models (if integrated)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...
```

Then update `gameBridge.js` and `aiClients.js` to use `process.env.*`.

---

## Troubleshooting

### "Cannot GET /"
- Make sure you're visiting `http://localhost:3000` (not the game URL)
- Check that the server is running and outputting the banner

### Chat not responding
- Currently returns mock responses—this is expected during development
- To enable real AI, integrate OpenAI or another API in `aiClients.js`

### Snapshot always shows mock data
- This is expected; the game bridge is stubbed
- To fetch real data, implement the game connection as described above

### Tests not running
- Verify the test harness exists in the game (`OmniOpsTestHarness` global)
- Implement the game bridge call in `gameBridge.runTest()`

---

## Next Steps

1. **Test the UI:** Open both the game and console in browser tabs; verify status updates every 3 seconds
2. **Run mock tests:** Click test buttons and see results
3. **Chat with mocks:** Send messages and see both Code‑AI and Omni‑Dev respond
4. **Connect the game:** Implement one function in `gameBridge.js` to call real game data
5. **Add AI models:** Integrate OpenAI or local LLM in `aiClients.js`

---

## License

As part of Omni‑Ops project.
