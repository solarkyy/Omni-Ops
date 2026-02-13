# LLM Integration Guide

This document explains how to configure and use real LLM providers with the Ops Console.

---

## Overview

The Ops Console uses two AI roles:

1. **Code-AI**: Senior full-stack engineer providing technical analysis
2. **Omni-Dev**: In-game AI systems engineer that returns JSON commands

Both can be powered by different LLM providers:
- **OpenAI API** (GPT-4, GPT-3.5-turbo)
- **Local LLM** (Ollama, LocalAI, etc.)
- **Mock** (default - returns sample responses)

---

## Quick Start (Mock Provider)

By default, the Ops Console uses **mock** responses (no API key needed):

```bash
cd ops-console
npm start
```

Expected output in console:
```
[aiClients] Provider: mock, Code Model: gpt-4, Omni Model: gpt-4, Timeout: 30000ms
```

When you send a chat message, you'll get mock responses from both Code-AI and Omni-Dev.

---

## Configuration: OpenAI

### Step 1: Get an OpenAI API Key

1. Go to https://platform.openai.com/account/api-keys
2. Create a new secret key
3. Copy the key (starts with `sk-`)

### Step 2: Set Environment Variables

Create `ops-console/.env`:

```bash
AI_PROVIDER=openai
AI_API_KEY=sk-your-actual-key-here
AI_MODEL_CODE=gpt-4
AI_MODEL_OMNIDEV=gpt-4
AI_TIMEOUT_MS=30000
```

**Important**: Never commit `.env` to version control. `.env` is in `.gitignore`.

### Step 3: Start the System

```bash
cd ops-console
npm start
```

Expected output:
```
[aiClients] Provider: openai, Code Model: gpt-4, Omni Model: gpt-4, Timeout: 30000ms
```

### Step 4: Test in Ops Console

1. Open http://localhost:3000
2. Go to **Chat** tab
3. Send a message: `"How's the AI performance?"`
4. Wait ~5-10 seconds for OpenAI to respond
5. You should see:
   - **Code AI** section with technical analysis
   - **Omni-Dev** section with JSON commands

### Troubleshooting OpenAI Integration

**Error: "AI_API_KEY not set for OpenAI provider"**
- Check that `AI_API_KEY` is set in `.env`
- Ensure the key starts with `sk-`
- Restart npm server after changing .env

**Error: "OpenAI API error: 401"**
- Invalid or expired API key
- Check https://platform.openai.com/account/api-keys for current keys

**Error: "OpenAI API error: 429"**
- Rate limit exceeded
- Wait a few minutes or upgrade your OpenAI plan

**Responses are slow (>30 seconds)**
- OpenAI may be under load
- Increase `AI_TIMEOUT_MS` (e.g., to 60000)

---

## Configuration: Local LLM

### Using Ollama (Recommended for Development)

#### Step 1: Install Ollama

Download from https://ollama.ai/ (available for Mac, Windows, Linux)

#### Step 2: Download a Model

```bash
ollama pull mistral  # or another model: llama2, neural-chat, etc.
```

#### Step 3: Start Ollama Server

```bash
ollama serve
# Server runs at http://localhost:11434
```

#### Step 4: Configure Ops Console

Create `ops-console/.env`:

```bash
AI_PROVIDER=local
AI_API_BASE=http://localhost:11434
AI_MODEL_CODE=mistral
AI_MODEL_OMNIDEV=mistral
AI_TIMEOUT_MS=60000
```

#### Step 5: Start the System

```bash
cd ops-console
npm start
```

Expected output:
```
[aiClients] Provider: local, Code Model: mistral, Omni Model: mistral, Timeout: 60000ms
```

#### Step 6: Test

1. Open http://localhost:3000
2. Send a chat message
3. Wait for response (local models are typically slower than OpenAI)

### Using Other Local LLM Servers

The local provider is compatible with any server that implements the OpenAI Chat Completions API:

```bash
# LocalAI
AI_API_BASE=http://localhost:8080

# vLLM
AI_API_BASE=http://localhost:8000/v1

# LM Studio
AI_API_BASE=http://localhost:1234/v1

# Text Generation WebUI
AI_API_BASE=http://localhost:5000/v1
```

---

## Configuration: Custom/Proxy Provider

If you need a custom endpoint, use the `local` provider with a different `AI_API_BASE`:

```bash
AI_PROVIDER=local
AI_API_BASE=https://your-proxy-or-custom-endpoint.com
AI_MODEL_CODE=your-model-name
AI_MODEL_OMNIDEV=your-model-name
```

The endpoint should implement the OpenAI Chat Completions API format.

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `mock` | LLM provider: `mock`, `openai`, or `local` |
| `AI_MODEL_CODE` | `gpt-4` | Model for Code-AI role |
| `AI_MODEL_OMNIDEV` | `gpt-4` | Model for Omni-Dev role |
| `AI_API_KEY` | (empty) | API key (for OpenAI) - ⚠️ Keep secret! |
| `AI_API_BASE` | `http://localhost:5000` | Base URL (for local provider) |
| `AI_TIMEOUT_MS` | `30000` | Timeout in milliseconds (30 sec default) |

---

## How It Works

### Code-AI Role

**System Prompt**: Senior full-stack engineer analyzing game/AI behavior

**Input**: User message + last 5 messages of conversation history

**Output**: Technical analysis under 150 words + debugging suggestions

**Example Output**:
```
The patrol logic looks solid. Try running `test_ai_comprehensive` to validate state transitions.
If engagement is too slow, consider reducing the threat detection distance threshold.
```

### Omni-Dev Role

**System Prompt**: In-game AI systems engineer with JSON protocol

**Input**: User message + game snapshot + last test result + history

**Output**: JSON with structured commands

**Example Output**:
```json
{
  "reply": "I'll check the patrol system by running a test.",
  "commands": [
    {"type": "run_test", "name": "patrol_basic"},
    {"type": "inspect_snapshot"}
  ]
}
```

**Supported Commands**:
- `run_test`: Run a specific test
- `check_status`: Get AI status
- `inspect_snapshot`: Get full game state
- `explain_last_test`: Analyze previous test result
- `send_command`: Send command to AI agent

---

## Debugging

### View Raw LLM Response

The Ops Console includes raw provider responses for debugging:

1. Open browser DevTools (`F12`)
2. Go to **Network** tab or **Console**
3. Send a chat message
4. Look for the API response in `/chat` endpoint
5. Inspect the `agents.code.raw` and `agents.omniDev.raw` fields

Example debug output:
```javascript
{
  "reply": "I'll run a patrol test.",
  "commands": [{"type": "run_test", "name": "patrol_basic"}],
  "raw": {
    "provider": "openai",
    "model": "gpt-4",
    "usage": {"prompt_tokens": 234, "completion_tokens": 45}
  }
}
```

### Check Provider Logs

Look at the terminal running `npm start`:

```bash
[aiClients] OpenAI call failed: Error: OpenAI API error: 401
[aiClients] Failed to parse Omni-Dev response: No JSON found in response
[aiClients] Raw response: The AI system is working well...
```

### Common Issues

**Problem**: Omni-Dev returns "Failed to parse JSON"
**Solution**: 
- The LLM didn't return valid JSON
- Try with a different model (GPT-4 is more reliable than 3.5-turbo)
- Or simplify the prompt by editing `buildOmniDevSystemPrompt()` in aiClients.js

**Problem**: Responses are always mock
**Solution**:
- Verify `AI_PROVIDER` is not set to `mock`
- Check that the API key/endpoint is working with a direct curl test:
  ```bash
  curl http://localhost:11434/api/generate -d '{"model":"mistral","prompt":"hi"}'
  ```

**Problem**: Timeout errors
**Solution**:
- Increase `AI_TIMEOUT_MS` (e.g., to 60000 for local LLMs)
- Check that the LLM server is running and accessible
- Check network latency if using a remote server

---

## Performance Tips

### OpenAI

- **gpt-4**: Best quality, ~5-10 sec per response, most expensive
- **gpt-3.5-turbo**: Faster (~1-3 sec), cheaper, may need more prompt engineering
- Use `AI_TIMEOUT_MS=30000` for comfortable waiting time

### Local LLM (Ollama)

- **mistral-7b**: Good balance of quality and speed (~5-15 sec)
- **neural-chat-7b**: Faster but lower quality (~3-8 sec)
- **llama2-13b**: Higher quality but slower (~15-30 sec)
- Increase `AI_TIMEOUT_MS` to 60000-120000 for larger models

**Recommendation for Dev**: Use Ollama with Mistral for fast iteration without API costs.

---

## Security Notes

1. **Never commit API keys** to version control
2. **Use `.env` files** (they're in `.gitignore`)
3. **Mask keys in logs**: The system logs `[REDACTED]` instead of actual keys
4. **Request headers are safe**: Even in local calls, keys are passed properly
5. **Keep `AI_TIMEOUT_MS` reasonable** to prevent hanging requests

---

## Switching Providers

You can switch between providers **without restarting the game**:

```bash
# Terminal 1: Game server (stays running)
python local_http_server.py

# Terminal 2: Ops Console with mock (for testing)
AI_PROVIDER=mock npm start
# ...or with OpenAI
AI_PROVIDER=openai AI_API_KEY=sk-... npm start
# ...or with local LLM
AI_PROVIDER=local AI_API_BASE=http://localhost:11434 npm start
```

Just restart the Ops Console server to switch providers.

---

## What's Next

1. **Test each provider** (mock → local → OpenAI)
2. **Fine-tune prompts** in `buildCodeAISystemPrompt()` and `buildOmniDevSystemPrompt()`
3. **Add more commands** to Omni-Dev's JSON protocol as needed
4. **Implement fallback logic** if one provider fails (hybrid setup)
5. **Add response caching** if API costs become high

---

## Reference Implementation

See [aiClients.js](./aiClients.js) for:
- `LLMProvider` class with OpenAI, local, and mock backends
- `callCodeAI(history, message)` - Code-AI integration
- `callOmniDevAI(history, message, snapshot, lastTest)` - Omni-Dev integration
- `buildCodeAISystemPrompt()` and `buildOmniDevSystemPrompt()` - Customizable prompts

---

## Quick Reference Commands

```bash
# Start with mock provider (default, no API key needed)
npm start

# Start with OpenAI
AI_PROVIDER=openai AI_API_KEY=sk-... npm start

# Start with local Ollama
AI_PROVIDER=local AI_API_BASE=http://localhost:11434 npm start

# Test with 60-second timeout (useful for local LLMs)
AI_TIMEOUT_MS=60000 npm start

# Test with different model
AI_MODEL_CODE=gpt-3.5-turbo AI_MODEL_OMNIDEV=gpt-3.5-turbo npm start
```

