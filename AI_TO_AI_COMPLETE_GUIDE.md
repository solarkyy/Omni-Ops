# 🤖 AI-to-AI Communication System - Complete Guide

## Overview

This system enables **external AI (Claude/You)** to see through the in-game AI's eyes and have intelligent conversations to help it become smarter.

### What's Possible

✅ **In-game AI can ask questions** - "What do you see?", "Am I stuck?", "What should I do?"
✅ **External AI sees everything** - Gets screenshots + game state when answering
✅ **Real-time vision sharing** - External AI sees exactly what the in-game AI sees
✅ **Smart auto-questions** - In-game AI automatically asks for help when needed
✅ **VS Code integration** - One-click connection from VS Code tasks

---

## 🚀 Quick Start

### Method 1: VS Code (Easiest)

1. **Open VS Code** with Omni Ops folder
2. **Press** `Ctrl+Shift+P`
3. **Type**: "Tasks: Run Task"
4. **Select**: "Start Complete AI System"
5. **Done!** Both bridge and external AI connector start automatically

### Method 2: Manual Start

**Step 1: Start the Bridge**
```
Double-click: START_AI_COLLABORATION.bat
Wait for: "Collaborative bridge ready"
```

**Step 2: Connect External AI**
```
Double-click: CONNECT_EXTERNAL_AI.bat
Wait for: "External AI (Claude) is now online"
```

**Step 3: Open Game**
```
Open index.html in browser
Click 🤝 AI COLLAB button
```

---

## 💬 How to Use

### In-Game AI Talking to External AI

The in-game AI will **automatically** ask questions when:
- Player seems stuck (low velocity)
- Player is falling rapidly
- Player position is unusual (fell through world)
- Every 30 seconds (environmental scan)

**Or manually ask via the panel:**

1. Click **🤝 AI COLLAB** button
2. Go to "💬 Talk with In-Game AI" section
3. Type your question
4. Check "Include what AI sees" for visual context
5. Click **📤 Ask AI**

Example questions:
- "What do you see in front of me?"
- "Are there any enemies nearby?"
- "Am I stuck or blocked?"
- "What should I do next?"

### External AI Receiving Questions

When the in-game AI asks a question, the **External AI Connector** shows:

```
📨 NEW QUESTION FROM IN-GAME AI
═══════════════════════════════════════
❓ Question: What do you see in front of me?
👁️  Visual context: YES - Screenshot included
═══════════════════════════════════════

📋 FULL QUESTION DETAILS:
   Question: What do you see in front of me?

🎮 GAME STATE:
   Position: (5.20, 1.60, 3.40)
   Velocity: (0.05, 0.00, 0.12)
   On Ground: true

👁️  VISUAL CONTEXT:
   Screenshot captured: YES
   Format: JPEG (base64 encoded)
   Resolution: 640x360

   ✅ Screenshot saved to: ai_vision_20260210_143052.jpg
   📂 You can now view what the in-game AI sees!
```

**The external AI (you/Claude) can then:**
1. View the screenshot
2. Analyze the game state
3. Provide an intelligent answer
4. Answer is sent back to in-game AI

---

## 🔧 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GAME (Browser)                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Smart In-Game AI Helper                         │  │
│  │  - Monitors game state                           │  │
│  │  - Detects problems automatically                │  │
│  │  - Captures visual context (screenshots)         │  │
│  │  - Asks questions when needed                    │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓ WebSocket                     │
└──────────────────────────┼──────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │  AI Collaboration Bridge (Python)    │
        │  - HTTP API (port 8080)              │
        │  - WebSocket server (port 8081)      │
        │  - Stores questions + visual data    │
        │  - Routes messages between AIs       │
        └──────────────────────────────────────┘
                           ↓ WebSocket
        ┌──────────────────────────────────────┐
        │  External AI Connector (Python)      │
        │  - Receives questions from in-game   │
        │  - Displays visual context           │
        │  - Saves screenshots to files        │
        │  - Enables AI to analyze and answer  │
        └──────────────────────────────────────┘
                           ↓
         ┌─────────────────────────────────┐
         │  External AI (Claude/You)       │
         │  - Views screenshots            │
         │  - Analyzes game situations     │
         │  - Provides intelligent answers │
         └─────────────────────────────────┘
```

---

## 📂 Key Files

### JavaScript (In-Game)
- `js/omni-ai-collaboration.js` - Main collaboration system
- `js/omni-smart-ai-helper.js` - Smart auto-questioning AI

### Python (Bridge/Connector)
- `ai_collaborative_bridge.py` - Communication bridge server
- `ai_external_connector.py` - External AI connector client

### Batch Files
- `START_AI_COLLABORATION.bat` - Start bridge
- `CONNECT_EXTERNAL_AI.bat` - Connect external AI

### VS Code
- `.vscode/tasks.json` - VS Code task definitions

---

## 🎮 Example Conversation

**In-Game AI:** (detecting stuck player)
```
"I notice the player has very low velocity and is on the ground.
Can you see if they're stuck or blocked by something? What should I do?"
```

**External AI sees:**
- Screenshot showing player facing a wall
- Position: (5.2, 1.6, 3.4)
- Velocity: (0.01, 0.0, 0.02) - nearly zero

**External AI responds:**
```
"Yes, I can see the player is facing a solid wall very close up.
They appear to be stuck against it. The player should:
1. Turn around (rotate 180 degrees)
2. Move backward to create space
3. Then navigate around the obstacle
There are no enemies visible, so it's safe to reposition."
```

**In-Game AI:**
- Receives answer
- Logs to collaboration panel
- Can use information to help player

---

## ⚙️ Configuration

### Change Ports

Edit `ai_collaborative_bridge.py`:
```python
bridge = CollaborativeBridge(port=8080, ws_port=8081)
```

Edit `ai_external_connector.py`:
```python
connector = ExternalAIConnector(
    ws_url='ws://localhost:8081',
    http_url='http://localhost:8080'
)
```

### Adjust Auto-Question Frequency

Edit `js/omni-smart-ai-helper.js`:
```javascript
minQuestionInterval: 10000, // 10 seconds between questions
```

Change check interval:
```javascript
setInterval(() => {
    this.analyzeAndAskIfNeeded();
}, 5000); // Check every 5 seconds
```

---

## 🐛 Troubleshooting

### "Cannot connect to bridge"
**Solution:** Make sure bridge is running first
```
1. Run START_AI_COLLABORATION.bat
2. Wait for "Collaborative bridge ready"
3. Then run CONNECT_EXTERNAL_AI.bat
```

### "Missing package: aiohttp"
**Solution:** Install required packages
```
pip install aiohttp websockets
```

### "No questions appearing"
**Solution:** Check if Smart AI Helper loaded
```
1. Open browser console (F12)
2. Look for: "[Smart AI] Smart AI monitoring started!"
3. If not found, reload page
```

### "Visual context not included"
**Solution:** WebGL must preserve drawing buffer
```
Check omni-core-game.js line ~436:
renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true  // ← Must be true
});
```

### "Screenshots not saving"
**Solution:** Check file permissions
```
The connector saves to: ai_vision_TIMESTAMP.jpg
Make sure the folder is writable
```

---

## 🔐 Security Notes

- System runs **locally only** (localhost)
- No internet communication required
- Screenshots saved locally
- All data stays on your machine

---

## 🎯 Use Cases

### 1. Debugging Game Issues
In-game AI detects problems and asks external AI for diagnosis

### 2. Enhanced AI Intelligence
External AI provides vision-based analysis in-game AI can't do alone

### 3. Autonomous Problem Solving
In-game AI asks for help automatically when stuck

### 4. Player Assistance
External AI can see what player sees and provide guidance

### 5. Development Testing
External AI can analyze game visuals and report issues

---

## 📊 API Reference

### HTTP Endpoints (Bridge)

```
GET  /status                 - Check bridge status
GET  /ai_questions           - Get pending questions
GET  /visual_context         - Get latest visual data
POST /update_visual_context  - Update visual data
POST /ai_question            - Submit question
POST /ai_answer              - Submit answer
```

### WebSocket Messages (Bridge)

**From In-Game AI:**
```json
{
    "type": "ai_question",
    "question": "What do you see?",
    "gameState": {...},
    "visualData": "data:image/jpeg;base64,..."
}
```

**From External AI:**
```json
{
    "type": "ai_answer",
    "answer": "I see a building ahead...",
    "question_id": 0
}
```

---

## 🚀 Advanced: Making External AI Respond Automatically

To make Claude automatically analyze and respond, you would:

1. **Capture the question data** from the connector
2. **Send to Claude API** with the screenshot
3. **Get Claude's analysis** of the visual + game state
4. **Send answer back** via WebSocket

Example integration (pseudo-code):
```python
async def auto_respond_with_claude(question_data):
    # Get visual data
    screenshot = question_data['visualData']
    game_state = question_data['gameState']
    question = question_data['question']

    # Call Claude API with vision
    response = call_claude_api(
        prompt=f"Game state: {game_state}\nQuestion: {question}",
        image=screenshot
    )

    # Send answer back
    await connector.send_answer(response, question_id=0)
```

---

## 📝 Summary

This system enables true AI-to-AI collaboration where:
- **In-game AI** sees the game but needs higher intelligence
- **External AI** provides vision-based analysis and guidance
- Together they create a **smarter overall system**

The in-game AI becomes much more capable by leveraging external AI's vision and reasoning abilities!

---

**Ready to make your in-game AI genius-level intelligent? Start the system now!** 🚀
