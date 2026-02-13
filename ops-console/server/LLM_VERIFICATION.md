# LLM Integration Verification Checklist

Quick steps to verify that the LLM integration is working correctly.

---

## Pre-Verification Setup

Ensure the system is running:

```bash
# Terminal 1: Game server
python local_http_server.py

# Terminal 2: Ops Console backend
cd ops-console
npm start

# Terminal 3: Browser
open http://localhost:3000
# or
start http://localhost:3000
```

You should see:
```
[aiClients] Provider: mock, Code Model: gpt-4, Omni Model: gpt-4, Timeout: 30000ms
```

---

## Verification Steps

### ✅ Step 1: Verify Mock Provider (Default)

**What we're testing**: Does the mock provider work? (This should always succeed)

**In Ops Console**:
1. Go to **Chat** tab
2. Type: `"How is the AI doing?"`
3. Click **Send**
4. Wait 2-3 seconds

**Expected Results**:
- ✓ Receive a Code-AI response about the patrol logic
- ✓ Receive an Omni-Dev response with JSON commands
- ✓ Terminal shows `[aiClients] Calling...` logs

**If it fails**:
- Check that `npm start` is running in ops-console/
- Check browser console for errors (`F12`)
- Verify http://localhost:3000 is accessible

---

### ✅ Step 2: Verify Code-AI LLM Call

**What we're testing**: Code-AI receives message + history and returns analysis

**Prerequisite**: Switch to a real provider (OpenAI or local)

**Setup**:
```bash
# For OpenAI:
AI_PROVIDER=openai AI_API_KEY=sk-... npm start

# For local (Ollama):
ollama serve  # in another terminal
AI_PROVIDER=local AI_API_BASE=http://localhost:11434 npm start
```

**In Ops Console**:
1. Go to **Chat** tab
2. Type: `"Why did the AI switch to patrol mode?"`
3. Click **Send**
4. Wait for response (5-30 seconds depending on provider)

**Expected Results**:
- ✓ Code-AI section shows a technical explanation (not mock text)
- ✓ Response mentions concepts from the message or game state
- ✓ Terminal logs show provider being called

**Example response** (not mock):
```
The AI likely switched to patrol mode because the threat level dropped. 
Based on the decision history, it transitions from seek_enemies to patrol 
when no threats are nearby. This is correct behavior for maintaining sector coverage.
```

**If it fails**:
- **"Error: AI_API_KEY not set"** → Check `.env` has valid OpenAI key
- **"Error: Connection refused"** → Check local LLM server is running at the right port
- **Response is mock text** → Provider switch didn't work; verify npm restarted
- **Timeout after 30s** → Increase `AI_TIMEOUT_MS=60000` or check API service

---

### ✅ Step 3: Verify Omni-Dev JSON Protocol

**What we're testing**: Omni-Dev receives game context and returns valid JSON with commands

**Setup**:
Same as Step 2 (using OpenAI or local provider)

**In Ops Console**:
1. Go to **Chat** tab
2. Type: `"Run a test to check engagement logic"`
3. Click **Send**
4. Wait for response

**Expected Results**:
- ✓ Omni-Dev section shows **reply** text (not mock)
- ✓ Omni-Dev shows **commands** array with real commands:
  - Example: `{ "type": "run_test", "name": "engage_enemy" }`
- ✓ Commands are not the standard mock list
- ✓ Terminal shows "Omni-Dev" response being parsed

**Example response** (using real LLM):
```
Omni-Dev Reply:
"I'll run a comprehensive test of the engagement system and check for any issues."

Commands:
[
  { "type": "run_test", "name": "engage_multiple_enemies" },
  { "type": "check_status" }
]
```

**If it fails**:
- **"Failed to parse Omni-Dev response"** → LLM didn't return valid JSON
  - Solution: Use GPT-4 instead of GPT-3.5 (more reliable)
  - Or check model is installed if using local LLM
- **Commands array is empty** → Parsing failed silently
  - Check browser console for error details
  - Look at `agents.omniDev.raw.parseError` in DevTools
- **Reply says "Mock Omni-Dev response"** → Still using mock provider
  - Verify `AI_PROVIDER` env var was set before npm start

---

### ✅ Step 4: Verify Game Snapshot Context

**What we're testing**: Omni-Dev receives game state context in its prompt

**In Ops Console**:
1. Go to **Snapshot** tab to verify game data is available
2. Go to **Chat** tab
3. Type: `"How is the player health looking?"`
4. Click **Send**

**Expected Results**:
- ✓ Omni-Dev response mentions something about player health/game state
- ✓ Response shows understanding of current game context
- ✓ Uses real values (not placeholder mock data)

**Example response**:
```
"The player health is at 92%, which is very good. The AI should maintain patrol 
while we have this buffer. I'll run a threat detection test to ensure detection is working."
```

---

### ✅ Step 5: Verify Error Handling

**What we're testing**: System gracefully handles API errors

**Setup**: Intentionally break the configuration

```bash
# Use wrong OpenAI key
AI_PROVIDER=openai AI_API_KEY=sk-invalid-key npm start
```

**In Ops Console**:
1. Send a chat message

**Expected Results**:
- ✓ Both Code-AI and Omni-Dev return error replies
- ✓ Omni-Dev commands array is empty `[]`
- ✓ UI doesn't crash
- ✓ Terminal shows clear error message (e.g., "401 Unauthorized")

**Example error response**:
```
Code-AI: "Error: OpenAI API error: 401 Unauthorized - invalid API key"
Omni-Dev: "I encountered an issue parsing my response. Please try again or run a test to get state."
Omni-Dev Commands: []
```

---

### ✅ Step 6: Verify Timeout Handling

**What we're testing**: Long-running requests timeout gracefully

**Setup**: Use a slow LLM or a ridiculously short timeout

```bash
AI_PROVIDER=local AI_TIMEOUT_MS=100 npm start
```

**In Ops Console**:
1. Send a chat message

**Expected Results**:
- ✓ After 100ms, requests abort
- ✓ Error message shown (not hanging UI)
- ✓ Terminal logs the abort

**Fix**:
```bash
# Use realistic timeout
AI_TIMEOUT_MS=60000 npm start
```

---

## Performance Benchmarks

| Provider | Model | Time per Response | Cost |
|----------|-------|-------------------|------|
| Mock | (none) | ~100ms | Free |
| OpenAI | gpt-4 | 5-10s | ~$0.01-0.05 per message |
| OpenAI | gpt-3.5-turbo | 1-3s | ~$0.001 per message |
| Ollama | mistral-7b | 5-15s | Free (local) |
| Ollama | neural-chat-7b | 3-8s | Free (local) |
| Ollama | llama2-13b | 15-30s | Free (local) |

**Recommendation for development**: Ollama + Mistral (good quality, fast, free)

---

## Troubleshooting Matrix

| Problem | Provider | Solution |
|---------|----------|----------|
| Mock responses always | Any | Check `AI_PROVIDER` env var was set before npm start |
| 401 Unauthorized | OpenAI | Verify API key in `.env` starts with `sk-` |
| Connection refused | Local | Start Ollama: `ollama serve` |
| Timeout (>30s) | Any | Increase `AI_TIMEOUT_MS` or check service is responding |
| JSON parse error | Any | Use GPT-4 instead of GPT-3.5 (more reliable JSON) |
| Slow responses | Local | Use smaller model (mistral instead of llama2) |

---

## Next Steps After Verification

1. ✅ Verify mock provider works
2. ✅ Verify real LLM provider calls (Code-AI or Omni-Dev)
3. ✅ Verify game context is included in prompts
4. ✅ Verify error handling
5. **Fine-tune prompts** in `aiClients.js` for better responses
6. **Add more Omni-Dev commands** as needed
7. **Implement provider fallbacks** (e.g., try OpenAI, fall back to local)
8. **Cache responses** if API costs are high

---

## Summary Checklist

- [ ] Mock provider works (basic functionality)
- [ ] Real LLM provider calls work (Code-AI or Omni-Dev)
- [ ] Code-AI provides real analysis (not mock text)
- [ ] Omni-Dev returns valid JSON with commands
- [ ] Game snapshot context is included in Omni-Dev response
- [ ] Error handling works gracefully
- [ ] Timeout handling works (doesn't hang UI)
- [ ] Terminal logs are clear and helpful
- [ ] Browser doesn't show CORS errors
- [ ] Performance is acceptable for your use case

