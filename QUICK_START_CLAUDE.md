# 🚀 QUICK START - Automatic Claude AI Responder

## THE FASTEST WAY TO GET STARTED

### 1️⃣ Install Requirements (ONE TIME ONLY)
```bash
pip install anthropic aiohttp websockets
```

### 2️⃣ Set Your API Key (ONE TIME ONLY)
Get key from: https://console.anthropic.com/

**Windows:**
```bash
setx ANTHROPIC_API_KEY "sk-ant-your-key-here"
```
Then **RESTART YOUR TERMINAL** (important!)

**Linux/Mac:**
```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.bashrc
source ~/.bashrc
```

### 3️⃣ Start Everything (DO THIS EVERY TIME)

**Open 3 terminals:**

**Terminal 1 - Bridge:**
```bash
START_AI_COLLABORATION.bat
```

**Terminal 2 - Game:**
```bash
python -m http.server 8000
```
Then open: http://localhost:8000

**Terminal 3 - Auto Claude:**
```bash
START_AUTO_CLAUDE_RESPONDER.bat
```

### 4️⃣ Test It!
In game:
1. Press **F3**
2. Go to **Chat** tab
3. Ask: "What do you see?"
4. Watch Claude respond automatically!

---

## ✅ Success Looks Like This:

**Terminal 3 (Auto Claude) will show:**
```
╔═══════════════════════════════════════════════════════════════╗
║     AUTOMATIC CLAUDE AI RESPONDER - FULLY INTELLIGENT        ║
╚═══════════════════════════════════════════════════════════════╝

🤖 Claude AI is now AUTOMATICALLY responding to in-game questions!
👂 Listening for questions...

======================================================================
📨 NEW QUESTION #1
======================================================================
❓ Question: What do you see?
👁️  Visual Context: YES (Screenshot included)
   🤖 Calling Claude API...
   ✅ Claude responded: I can see you're in an open area...
✅ ANSWER SENT TO GAME
======================================================================
```

**In-game chat will show:**
```
You: What do you see?
Claude: I can see you're in an open area with buildings ahead...
```

---

## 🆘 Troubleshooting

### Problem: "No API key found"
**Solution:**
```bash
# Windows
setx ANTHROPIC_API_KEY "sk-ant-your-key-here"
# Then RESTART terminal

# Verify it worked:
echo %ANTHROPIC_API_KEY%
```

### Problem: "Missing required package: anthropic"
**Solution:**
```bash
pip install anthropic aiohttp websockets
```

### Problem: "Failed to connect to bridge"
**Solution:** Start the bridge first in Terminal 1

### Problem: No questions appearing
**Solution:**
1. Make sure game is open at localhost:8000
2. Press F3 in game
3. Try asking a question manually

---

## 📝 File Reference

Created files:
- ✅ `ai_auto_claude_responder.py` - Main automatic responder script
- ✅ `START_AUTO_CLAUDE_RESPONDER.bat` - Easy launcher
- ✅ `SETUP_CLAUDE_API.md` - Complete detailed guide
- ✅ `requirements.txt` - Python dependencies
- ✅ `QUICK_START_CLAUDE.md` - This file!

---

## 💡 Tips

- Keep all 3 terminals open while playing
- Claude costs ~$0.002 per question (very cheap!)
- Claude can see screenshots and analyze them
- Responses are fully automatic - no typing!
- Press Ctrl+C in Terminal 3 to stop Claude

---

**That's it! You're ready to play with AI assistance!** 🎮🤖
