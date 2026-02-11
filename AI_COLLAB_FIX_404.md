# FIX: 404 Error When LLM Responder Sends Answers

## Problem
LLM Responder was getting "Failed to send answer: 404" because:
1. The running AI Bridge was an older version without the `/ai_answer` endpoint
2. Questions didn't have unique IDs for tracking

## What Was Fixed

### 1. Added Question ID Counter
```python
self.question_counter = 0  # Counter for question IDs
```

### 2. Questions Now Get Unique IDs
When a question is received, it gets assigned a unique ID:
```python
self.question_counter += 1
self.ai_questions.append({
    'id': self.question_counter,  # NEW!
    'question': question,
    'gameState': game_state,
    'visualData': visual_data,
    'timestamp': datetime.now().isoformat(),
    'answered': False
})
```

### 3. Enhanced `/ai_answer` Endpoint
Added better logging and question ID tracking:
```python
bridge.log_collaboration(f'AI Answer received (Q#{question_id}): {answer}', source)
print(f"✅ Answer broadcasted to {len(bridge.ws_connections)} WebSocket clients")
```

## How to Restart
You MUST restart the AI Bridge for changes to take effect!

### Windows:
1. Close the "AI Bridge (Port 8080/8081)" terminal window (Ctrl+C)
2. Run: `START_AI_COLLABORATION.bat`

### Command Line:
```bash
# Stop the bridge (Ctrl+C in its terminal)
# Then restart:
python ai_collaborative_bridge.py
```

## How to Test

1. **Restart ALL services** (Bridge + LLM Responder + Game):
   ```cmd
   START_AI_COLLABORATION.bat
   START_LOCAL_LLM_RESPONDER.bat
   ```

2. **Open game** - go to localhost:8000

3. **Open AI Collaboration Panel** - Press F9 in game

4. **Ask a question** - Type "hello" or "what is 2+2?"

5. **Check terminals**:
   - Bridge should show: `[IN_GAME] In-game AI asks: ...`
   - LLM Responder should show: `Querying local LLM...`
   - Bridge should show: `[local_llm_automatic] AI Answer received (Q#1): ...`
   - Bridge should show: `✅ Answer broadcasted to N WebSocket clients`

## Expected Output

### AI Bridge Terminal:
```
[IN_GAME] In-game AI asks: hello
[local_llm_automatic] AI Answer received (Q#1): Hello! I'm here to help...
✅ Answer broadcasted to 1 WebSocket clients
```

### LLM Responder Terminal:
```
📨 NEW QUESTION #1
❓ Question: hello
🤖 Querying local LLM...
✅ ANSWER SENT TO GAME:
   Hello! I'm here to help...
```

### In-Game:
You should see the AI's response appear in the collaboration panel!

## Still Getting 404?

If you still get 404 after restarting:

1. **Check bridge is running on port 8080**:
   ```
   netstat -ano | findstr :8080
   ```

2. **Check the endpoint exists**:
   Open browser to: http://localhost:8080/status
   Should see JSON response

3. **Check LLM responder URL**:
   Make sure it's pointing to: `http://localhost:8080`
   (Check line 16 in ai_auto_local_llm_responder.py)

4. **Check bridge logs**:
   You should see this line when bridge starts:
   ```
   ✓ Collaborative bridge HTTP server started on http://localhost:8080
   ```

## Success Indicators

✅ **Bridge shows**: `AI Answer received (Q#1): ...`
✅ **Bridge shows**: `✅ Answer broadcasted to N WebSocket clients`
✅ **No 404 errors in LLM Responder terminal**
✅ **Answer appears in game**

## Key Files Modified
- `ai_collaborative_bridge.py` - Added question IDs and enhanced logging
