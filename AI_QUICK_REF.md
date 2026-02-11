# 🚀 AI-to-AI System - Quick Reference Card

## Start Everything (VS Code)

```
Ctrl+Shift+P → "Tasks: Run Task" → "Start Complete AI System"
```

**That's it!** Both bridge and external AI connector start.

---

## Start Everything (Manual)

```
1. Double-click: START_AI_COLLABORATION.bat
2. Double-click: CONNECT_EXTERNAL_AI.bat
3. Open game in browser
4. Click 🤝 AI COLLAB button
```

---

## Ask Questions (In-Game)

**In the game browser:**
1. Click **🤝 AI COLLAB**
2. Type question in chat box
3. Check **"Include what AI sees"** (recommended)
4. Click **📤 Ask AI**

---

## See Answers (External AI)

**In the connector terminal:**
- Questions appear automatically
- Screenshots saved as `ai_vision_TIMESTAMP.jpg`
- View what in-game AI sees
- Provide intelligent answers

---

## Auto-Questions

Smart AI automatically asks when:
- ✅ Player stuck (low velocity)
- ✅ Player falling rapidly
- ✅ Position unusual (fell through world)
- ✅ Every 30 seconds (environment scan)

---

## Ports

- **HTTP API:** http://localhost:8080
- **WebSocket:** ws://localhost:8081

---

## Key Features

| Feature | Status |
|---------|--------|
| 👁️ Visual Context (Screenshots) | ✅ Working |
| 💬 In-Game AI Chat | ✅ Working |
| 🤖 Smart Auto-Questions | ✅ Working |
| 📊 Game State Data | ✅ Working |
| 🔗 VS Code Integration | ✅ Working |
| 💾 Screenshot Saving | ✅ Working |

---

## Example Workflow

```
1. Start system (VS Code task or batch files)
2. Player gets stuck in game
3. Smart AI detects low velocity
4. Asks: "Can you see if I'm stuck?"
5. External AI receives:
   - Question text
   - Screenshot of game view
   - Player position/velocity data
6. Screenshot saved: ai_vision_143052.jpg
7. External AI views image
8. Provides answer: "Yes, stuck against wall..."
9. In-game AI receives answer
10. Logs to collaboration panel
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bridge won't start | Install: `pip install websockets` |
| Connector won't start | Install: `pip install aiohttp` |
| No questions | Reload game page |
| No visual context | Check `preserveDrawingBuffer: true` |

---

## Files Created

- `ai_external_connector.py` - External AI connector
- `js/omni-smart-ai-helper.js` - Smart in-game AI
- `CONNECT_EXTERNAL_AI.bat` - Easy connector launcher
- `.vscode/tasks.json` - VS Code tasks (updated)
- `AI_TO_AI_COMPLETE_GUIDE.md` - Full documentation

---

**Need help? Read: `AI_TO_AI_COMPLETE_GUIDE.md`**
