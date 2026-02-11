# 🤖 Automatic Claude AI Responder - Setup Guide

## What This Does

This system provides **fully automatic, intelligent AI responses** to your in-game AI questions using Claude's API:

✅ **Claude's Vision** - Analyzes screenshots to see what the AI sees
✅ **Game Context** - Considers player position, velocity, game state
✅ **Smart Answers** - Provides actionable, contextual guidance
✅ **Fully Automatic** - No manual typing required!

---

## 🔑 Step 1: Get Your Claude API Key

1. Go to: https://console.anthropic.com/
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-`)

> **Note:** You'll need to add credits to your Anthropic account
> Pricing: ~$3 per million input tokens, $15 per million output tokens
> (Very affordable - hundreds of questions for $1)

---

## 🔧 Step 2: Set Your API Key

### Windows (Temporary - Current Terminal Only)
```bash
set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Windows (Permanent)
```bash
setx ANTHROPIC_API_KEY "sk-ant-your-key-here"
```
> **Important:** After using `setx`, close and reopen your terminal!

### Linux/Mac (Temporary)
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Linux/Mac (Permanent)
Add to `~/.bashrc` or `~/.zshrc`:
```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

---

## 📦 Step 3: Install Requirements

```bash
pip install anthropic aiohttp
```

Or if you have a requirements file:
```bash
pip install -r requirements.txt
```

---

## 🚀 Step 4: Start the System

### 1. Start the Bridge
```bash
START_AI_COLLABORATION.bat
```
Or:
```bash
python ai_collaborative_bridge.py
```

Wait for: **"AI Collaborative Bridge Ready"**

---

### 2. Start the Game
```bash
python -m http.server 8000
```

Open: http://localhost:8000

---

### 3. Start Automatic Claude Responder
**Double-click:** `START_AUTO_CLAUDE_RESPONDER.bat`

Or manually:
```bash
python ai_auto_claude_responder.py
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║     AUTOMATIC CLAUDE AI RESPONDER - FULLY INTELLIGENT        ║
╚═══════════════════════════════════════════════════════════════╝

🤖 Claude AI is now AUTOMATICALLY responding to in-game questions!
   - Uses Claude's vision to analyze screenshots
   - Analyzes game state for context
   - Provides intelligent, actionable answers

🔗 Connected to bridge: http://localhost:8080
✅ API Key configured: sk-ant-1...xyz

👂 Listening for questions... (Checking every 2 seconds)
```

---

## 🎮 Step 5: Test It!

### In-Game:
1. Press **F3** to open AI Collaboration panel
2. Go to **Chat** tab
3. Type a question: "What do you see? Where should I go?"
4. Press Enter

### Watch the Magic:
The automatic responder will:
1. ✅ Receive the question
2. 👁️ Analyze the screenshot (if available)
3. 🎮 Consider game state
4. 🤖 Ask Claude for intelligent answer
5. ✉️ Send response back to game
6. 💬 Answer appears in game chat!

---

## 📊 Example Output

When a question comes in, you'll see:

```
======================================================================
📨 NEW QUESTION #1
======================================================================
⏰ Time: 2026-02-10T14:30:22
❓ Question: What do you see? Where should I go?
🎮 Position: (42.5, 3.2, -18.7)
👁️  Visual Context: YES (Screenshot included)
----------------------------------------------------------------------
   👁️  Visual data included in Claude analysis
   🤖 Calling Claude API...
   ✅ Claude responded: Based on the screenshot, I can see you're in...
----------------------------------------------------------------------
✅ ANSWER SENT TO GAME:
   Based on the screenshot, I can see you're in an open area with
   buildings to your north. Your velocity is low, suggesting you're
   stationary. I recommend moving forward (W key) toward the
   building entrance ahead.
======================================================================
```

---

## 🛠️ Troubleshooting

### "No API key found"
- Make sure you set `ANTHROPIC_API_KEY` environment variable
- If you used `setx`, restart your terminal
- Check: `echo %ANTHROPIC_API_KEY%` (Windows) or `echo $ANTHROPIC_API_KEY` (Linux/Mac)

### "Missing required package: anthropic"
```bash
pip install anthropic aiohttp
```

### "Failed to connect to bridge"
- Start the bridge first: `START_AI_COLLABORATION.bat`
- Make sure port 8080/8081 are not in use
- Check firewall settings

### "No questions received"
- Open the game in browser (localhost:8000)
- Press F3 to open AI Collaboration panel
- Make sure Smart AI Helper is enabled
- Try asking a question manually in chat

### "Claude API error: rate limit"
- You've hit your API rate limit
- Wait a few seconds and try again
- Consider upgrading your Anthropic tier

---

## 💰 Cost Estimates

Using Claude 3.5 Sonnet (recommended):

| Input Tokens | Output Tokens | Cost |
|--------------|---------------|------|
| ~500 tokens  | ~100 tokens   | ~$0.002 per question |
| 500 questions | 50k tokens   | ~$1.00 |

**With Vision:**
- Screenshots: ~$0.005-0.01 per image analyzed
- Still very affordable!

---

## 🎯 Features

### Claude Vision Analysis
When screenshots are included, Claude can:
- ✅ Identify objects and terrain
- ✅ Detect enemies or NPCs
- ✅ Analyze game environment
- ✅ Provide spatial guidance

### Game State Analysis
Claude considers:
- ✅ Player position (X, Y, Z)
- ✅ Velocity and movement state
- ✅ Ground contact status
- ✅ Historical context

### Smart Responses
Claude provides:
- ✅ Concise, actionable answers (1-3 sentences)
- ✅ Context-aware guidance
- ✅ Tactical suggestions
- ✅ Environmental awareness

---

## 🔄 Comparison: Manual vs Automatic

| Feature | Manual Responder | Automatic Claude |
|---------|------------------|------------------|
| **Typing Required** | Yes, you type | No, fully automatic |
| **Vision Analysis** | No, you describe | Yes, Claude sees |
| **Intelligence** | Your knowledge | Claude's reasoning |
| **Speed** | ~30 seconds | ~2-3 seconds |
| **Cost** | Free | ~$0.002 per question |
| **Multi-tasking** | No, must watch | Yes, runs in background |

---

## 🎉 Complete Workflow

```
┌─────────────────────────────────────┐
│  1. Start Bridge (Port 8080/8081)  │
│     START_AI_COLLABORATION.bat      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  2. Start Game (Port 8000)          │
│     python -m http.server 8000      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  3. Open Game in Browser            │
│     http://localhost:8000           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  4. Set API Key (if not set)        │
│     set ANTHROPIC_API_KEY=sk-...    │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  5. Start Auto Responder            │
│     START_AUTO_CLAUDE_RESPONDER.bat │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  6. In-Game AI asks questions       │
│     Claude automatically responds!   │
└─────────────────────────────────────┘
```

---

## 🎊 You're All Set!

Your in-game AI now has:
- 🧠 Claude's intelligence
- 👁️ Vision capabilities
- 🎮 Game state awareness
- ⚡ Automatic responses

**No manual work required - just play and let Claude help!**

---

**Created:** 2026-02-10
**Status:** ✅ READY TO USE - Automatic Intelligence System!
