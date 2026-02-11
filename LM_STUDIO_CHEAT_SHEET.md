# 📋 LM STUDIO - ONE PAGE CHEAT SHEET

## 🎯 THE ABSOLUTE FASTEST WAY (2 Minutes)

### In LM Studio:
1. **Local Server** tab → Load model → **Start Server** ✅

### In 3 Terminals:
```bash
# Terminal 1
START_AI_COLLABORATION.bat

# Terminal 2
python -m http.server 8000

# Terminal 3
START_LOCAL_LLM_RESPONDER.bat
```

### In Browser:
1. Open: **http://localhost:8000**
2. Press **F3** in game
3. Ask a question in Chat tab
4. **Done!** 🎉

---

## 🔧 First Time Setup (One Time Only)

```bash
# Install required package
pip install aiohttp

# Download a model in LM Studio (recommended):
# - Llama 3.2 3B (fast, 2GB)
# - Phi-3 (very fast, 2GB)
# - Mistral 7B (better quality, 4GB)
```

---

## ✅ Success = This Output

**Terminal 3:**
```
🤖 Local LLM is now AUTOMATICALLY responding!
👂 Listening for questions...

📨 NEW QUESTION #1
❓ Question: What should I do?
✅ ANSWER SENT TO GAME: [AI response here]
```

**In-Game Chat:**
```
You: What should I do?
AI: [Smart contextual response from your local LLM]
```

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| "Failed to connect" | Start LM Studio server (Local Server tab) |
| "No response" | Try smaller model or increase GPU layers |
| "Missing aiohttp" | `pip install aiohttp` |
| No questions appear | Start bridge first (Terminal 1) |

---

## 💡 Pro Tips

- **Faster:** Use Phi-3 or Llama 3.2 3B
- **Better:** Use Mistral 7B or Llama 3 8B
- **Change model:** Just load different model in LM Studio
- **GPU faster:** Increase GPU layers in LM Studio settings

---

## 🎮 Everything You Run

```
LM Studio: [Local Server tab] → Start Server ✅
Terminal 1: START_AI_COLLABORATION.bat
Terminal 2: python -m http.server 8000
Terminal 3: START_LOCAL_LLM_RESPONDER.bat
Browser:    http://localhost:8000
```

---

## ✨ The Script is PRE-CONFIGURED for LM Studio!

**Default settings in `ai_auto_local_llm_responder.py`:**
- URL: `http://localhost:1234/v1/chat/completions`
- Model: `local-model` (auto-detects)
- Works immediately - no config needed!

---

**That's it! You're ready!** 🚀

Full guide: `LM_STUDIO_QUICK_START.md`
