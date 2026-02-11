# 🤖 Local LLM Automatic Responder - Complete Setup Guide

## What This Does

Run a **fully automatic, intelligent AI responder** completely LOCAL on your machine:

✅ **No API Keys Required** - Everything runs on your computer
✅ **No Internet Required** - Works offline
✅ **100% Free** - No usage costs
✅ **Privacy Focused** - Your data never leaves your machine
✅ **Vision Support** - Use models like LLaVA to analyze screenshots
✅ **Fully Automatic** - No manual typing required!

---

## 🎯 Supported LLM Backends

### 1. Ollama (Recommended - Easiest)
- **Website:** https://ollama.com/
- **Models:** llama3.2, mistral, llava (vision), codellama
- **API:** `http://localhost:11434/api/generate`
- **Why:** Easiest to install, great models, vision support

### 2. LM Studio
- **Website:** https://lmstudio.ai/
- **Models:** Any GGUF model from HuggingFace
- **API:** `http://localhost:1234/v1/chat/completions`
- **Why:** Nice GUI, easy model management

### 3. Text Generation WebUI
- **Website:** https://github.com/oobabooga/text-generation-webui
- **Models:** Any HuggingFace model
- **API:** `http://localhost:5000/api/v1/generate`
- **Why:** Most powerful, GPU acceleration

### 4. Any OpenAI-Compatible API
- Custom deployments
- vLLM, FastChat, etc.

---

## 📦 Quick Start with Ollama (Recommended)

### Step 1: Install Ollama
1. Download from: https://ollama.com/
2. Install (Windows, Mac, or Linux)
3. Open terminal and verify:
   ```bash
   ollama --version
   ```

### Step 2: Download a Model
```bash
# For text responses (smaller, faster)
ollama pull llama3.2

# For vision + text (can analyze screenshots!)
ollama pull llava
```

**Model Sizes:**
- `llama3.2` - 2GB (fast, good quality)
- `mistral` - 4GB (excellent quality)
- `llava` - 4.7GB (vision + text)

### Step 3: Test Ollama
```bash
ollama run llama3.2
```
Type a question, verify it works, then type `/bye` to exit.

### Step 4: Configure the Script

Open `ai_auto_local_llm_responder.py` and edit these lines (around line 255):

```python
# Configuration - EDIT THESE VALUES
LLM_URL = 'http://localhost:11434/api/generate'  # Ollama default
MODEL = 'llama3.2:latest'  # Change to your model
USE_VISION = False  # Set True if using llava or other vision model
```

**For vision support:**
```python
MODEL = 'llava:latest'
USE_VISION = True
```

### Step 5: Start Everything

**Terminal 1 - AI Bridge:**
```bash
START_AI_COLLABORATION.bat
```

**Terminal 2 - Game Server:**
```bash
python -m http.server 8000
```
Open: http://localhost:8000

**Terminal 3 - Local LLM Responder:**
```bash
START_LOCAL_LLM_RESPONDER.bat
```

### Step 6: Test It!
1. Press **F3** in game
2. Go to **Chat** tab
3. Ask: "What should I do next?"
4. Watch your local LLM respond!

---

## 🎮 Example Usage

### What You See (In Terminal):
```
╔═══════════════════════════════════════════════════════════════╗
║      AUTOMATIC LOCAL LLM RESPONDER - FULLY INTELLIGENT       ║
╚═══════════════════════════════════════════════════════════════╝

🤖 Local LLM is now AUTOMATICALLY responding to in-game questions!
   - Model: llama3.2:latest
   - API: http://localhost:11434/api/generate
   - Vision: Disabled

👂 Listening for questions...

======================================================================
📨 NEW QUESTION #1
======================================================================
❓ Question: What should I do next?
🎮 Position: (42.5, 3.2, -18.7)
----------------------------------------------------------------------
   🤖 Querying local LLM...
   ✅ Response received
----------------------------------------------------------------------
✅ ANSWER SENT TO GAME:
   Based on your position and low velocity, I recommend moving
   forward using the W key to explore the area ahead. Stay alert
   for any obstacles or enemies.
======================================================================
```

### What You See (In Game):
```
You: What should I do next?
AI: Based on your position and low velocity, I recommend moving
    forward using the W key to explore the area ahead. Stay alert
    for any obstacles or enemies.
```

---

## 🎨 Using Vision Models

Vision models like **LLaVA** can see and analyze screenshots!

### Setup Vision:
```bash
# Download llava model
ollama pull llava
```

Edit `ai_auto_local_llm_responder.py`:
```python
MODEL = 'llava:latest'
USE_VISION = True
```

### Vision Model Responses:
```
👁️  Visual Context: YES (Will be analyzed by vision model)
   🤖 Querying local LLM...
   👁️  Visual data included for vision model
   ✅ Response received
----------------------------------------------------------------------
✅ ANSWER SENT TO GAME:
   I can see you're in an open courtyard with stone walls. There's
   a doorway to your north. Your velocity suggests you're standing
   still - try moving through that doorway.
```

---

## ⚙️ Configuration Options

### Using Environment Variables (Alternative)
```bash
# Windows
set LLM_URL=http://localhost:11434/api/generate
set LLM_MODEL=llama3.2:latest
set USE_VISION=false

# Linux/Mac
export LLM_URL=http://localhost:11434/api/generate
export LLM_MODEL=llama3.2:latest
export USE_VISION=false
```

### LM Studio Configuration:
```python
LLM_URL = 'http://localhost:1234/v1/chat/completions'
MODEL = 'your-model-name'
USE_VISION = False
```

### Custom API Configuration:
```python
LLM_URL = 'http://your-server:port/api/endpoint'
MODEL = 'your-model'
USE_VISION = False
```

---

## 🚀 Performance Tips

### Speed Optimization:
1. **Use smaller models** - `llama3.2` (2GB) is fast
2. **GPU acceleration** - Ollama auto-uses GPU if available
3. **Reduce max_tokens** - Edit `num_predict: 150` in script

### Quality Optimization:
1. **Use larger models** - `mistral` (4GB) or `llama3:70b`
2. **Adjust temperature** - Lower (0.5) = more consistent
3. **Better prompts** - Edit system prompt in script

### Memory Usage:
- `llama3.2` - ~3GB RAM
- `mistral` - ~5GB RAM
- `llava` - ~6GB RAM
- Vision adds ~500MB per screenshot

---

## 🛠️ Troubleshooting

### "Failed to connect to LLM"
**Solution:**
1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```
2. Test model manually:
   ```bash
   ollama run llama3.2
   ```
3. Check URL is correct in script

### "Model not found"
**Solution:**
```bash
# List installed models
ollama list

# Pull the model you need
ollama pull llama3.2
```

### "LLM request timed out"
**Solution:**
- Model is too large for your hardware
- Try a smaller model: `ollama pull llama3.2`
- Increase timeout in script (line ~120)

### "Vision not working"
**Solution:**
- Make sure you're using a vision model: `ollama pull llava`
- Set `USE_VISION = True` in script
- Verify screenshots are being captured in game

### Slow responses
**Solution:**
- Use GPU acceleration (CUDA, Metal, ROCm)
- Switch to smaller model
- Reduce `num_predict` tokens
- Close other GPU-intensive apps

---

## 📊 Model Comparison

| Model | Size | Speed | Quality | Vision | RAM |
|-------|------|-------|---------|--------|-----|
| `llama3.2` | 2GB | ⚡⚡⚡ | ⭐⭐⭐ | ❌ | 3GB |
| `mistral` | 4GB | ⚡⚡ | ⭐⭐⭐⭐ | ❌ | 5GB |
| `llava` | 4.7GB | ⚡⚡ | ⭐⭐⭐ | ✅ | 6GB |
| `codellama` | 3.8GB | ⚡⚡ | ⭐⭐⭐⭐ | ❌ | 5GB |
| `llama3:70b` | 40GB | ⚡ | ⭐⭐⭐⭐⭐ | ❌ | 48GB |

**Recommended for most users:** `llama3.2` or `llava`

---

## 🎯 Complete Workflow

```
┌─────────────────────────────────────┐
│  1. Install Ollama                  │
│     https://ollama.com/             │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  2. Download Model                  │
│     ollama pull llama3.2            │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  3. Configure Script                │
│     Edit MODEL in .py file          │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  4. Start Bridge                    │
│     START_AI_COLLABORATION.bat      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  5. Start Game                      │
│     python -m http.server 8000      │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  6. Start Local LLM Responder       │
│     START_LOCAL_LLM_RESPONDER.bat   │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  7. Play with AI assistance!        │
│     Press F3, ask questions         │
└─────────────────────────────────────┘
```

---

## 🆚 Local LLM vs Claude API

| Feature | Local LLM | Claude API |
|---------|-----------|------------|
| **Cost** | 100% Free | ~$0.002/question |
| **Privacy** | Complete | Data sent to Anthropic |
| **Internet** | Not required | Required |
| **Quality** | Good-Excellent | Excellent |
| **Vision** | Yes (llava) | Yes |
| **Speed** | 2-5 seconds | 1-2 seconds |
| **Setup** | More complex | Simple |
| **Hardware** | 4-8GB RAM | None |

---

## 📁 New Files Created

- ✅ `ai_auto_local_llm_responder.py` - Main local LLM responder
- ✅ `START_LOCAL_LLM_RESPONDER.bat` - Easy launcher
- ✅ `SETUP_LOCAL_LLM.md` - This complete guide

---

## 🎊 You're All Set!

Your in-game AI now has:
- 🧠 Local LLM intelligence
- 💻 Runs completely on your machine
- 💰 100% free forever
- 🔒 Complete privacy
- 👁️ Optional vision analysis
- ⚡ Automatic responses

**No API keys, no internet, no cost - just intelligent AI assistance!**

---

**Created:** 2026-02-10
**Status:** ✅ READY TO USE - Local Intelligence System!
