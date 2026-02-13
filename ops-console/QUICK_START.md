# Ops Console – Quick Reference

## File Tree

```
ops-console/
├── server/
│   ├── index.js              # Express app + 7 REST endpoints
│   ├── gameBridge.js         # Stubbed game API calls (TODO: integrate real game)
│   └── aiClients.js          # Code-AI + Omni-Dev model callouts (mock responses)
├── client/
│   ├── index.html            # Single-page UI (status bar + dashboard + chat)
│   └── main.js               # Frontend logic (polling, fetch, rendering)
├── package.json              # Express, cors, body-parser
├── README.md                 # Full setup + API documentation
├── .env.example              # Environment variables template
└── QUICK_START.md            # This file
```

## Quick Start (30 seconds)

```bash
# 1. Navigate to ops-console
cd ops-console

# 2. Install dependencies
npm install

# 3. Start server
npm start

# 4. Open browser
# Tab 1: http://127.0.0.1:8080 (Omni-Ops game)
# Tab 2: http://localhost:3000 (Ops Console)
```

You should now see:
- **Left side:** Snapshot panel + test list
- **Right side:** Chat interface with Omni-Dev and Code-AI
- **Top:** Status bar with health, mode, threats
- **Buttons:** Quick commands (Patrol, Engage, Hold, Retreat)

---

## Key API Payloads

### GET /status
```json
{
  "ready": true,
  "components": { "agentBridge": true, "intelligentAgent": true },
  "statusText": "AI ACTIVE, mode=patrol_area",
  "lastDecision": { "decidedMode": "patrol_area", "reason": "..." }
}
```

### GET /snapshot
```json
{
  "gameState": { "playerHealth": 92, "playerAmmo": 156, "sector": "Alpha-North" },
  "aiState": { "currentMode": "patrol_area", "threatsNearby": [ ... ] },
  "decisionHistory": [ ... ]
}
```

### POST /chat
```json
{
  "code": { "text": "Try running engage_enemy test..." },
  "omniDev": {
    "reply": "I'll run the test and inspect snapshot.",
    "commands": [
      { "type": "run_test", "name": "engage_enemy" },
      { "type": "inspect_snapshot" }
    ]
  }
}
```

### POST /run-test
```json
{
  "name": "patrol_basic",
  "passed": true,
  "reasons": [ "AI correctly decided to patrol", "..." ]
}
```

---

## Architecture at a Glance

```
Browser Tab 1              Browser Tab 2
(Omni-Ops Game)            (Ops Console)
  |                          |
  | AgentBridge              | /status
  | OmniOpsTestHarness       | /snapshot
  | ...                      | /tests
  |                          | /run-test
  |                          | /chat
  └──────────────────────────┘
        (To be wired)
```

**Current State:** Mock data (working UI, no real game connection yet)
**Next Step:** Implement gameBridge functions to call actual game APIs

---

## UI Features

| Panel | Feature | Action |
|-------|---------|--------|
| **Status Bar** | Health light | Updates every 3s |
| **Status Bar** | Mode / Threats / Health | Real-time from snapshot |
| **Left** | Snapshot | Click "Get Snapshot" to refresh |
| **Left** | Tests | Click "Run" next to any test |
| **Left** | Last Result | Auto-updates after test runs |
| **Right** | Chat Input | Send message to Code-AI + Omni-Dev |
| **Right** | Quick Buttons | Send direct AI commands |
| **Chat** | Code-AI | Left bubble (engineering suggestions) |
| **Chat** | Omni-Dev | Right bubble (JSON commands block) |

---

## Next Steps

1. **Verify it works:** Both tabs should be visible; status bar should update
2. **Test the mock flow:** Click "Get Snapshot", send a chat message, run a test
3. **Connect the game:** Open `server/gameBridge.js` and implement one function to fetch real data
4. **Add AI models:** Open `server/aiClients.js` and wire up OpenAI / local LLM (optional)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot GET /" | Verify server running: `npm start` outputs banner |
| Chat shows "Thinking..." then nothing | Normal (mock); integrate real AI to enable |
| Snapshot always same mock data | Expected; game bridge is stubbed (see README for wiring) |
| Tests show in list but don't run | Implement game bridge call in `gameBridge.runTest()` |

---

## Environment Variables (Optional)

Create `.env` in `ops-console/`:

```bash
PORT=3000
OMNI_OPS_URL=http://127.0.0.1:8080
OPENAI_API_KEY=sk-... # If integrating real AI
```

See `.env.example` for template.

---

**You are ready to run the Ops Console!**
