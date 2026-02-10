# Kimi k2 Agent Setup Guide

## Quick Start

### 1. Get Your Kimi API Key
1. Visit [Moonshot AI Platform](https://platform.moonshot.cn/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key

### 2. Set Up API Key

**Option A: Environment Variable (Recommended)**
```powershell
# Windows PowerShell
$env:MOONSHOT_API_KEY = "your_api_key_here"
python agent_with_tracing.py
```

**Option B: Set Permanently**
```powershell
# Add to your system environment variables
[System.Environment]::SetEnvironmentVariable('MOONSHOT_API_KEY', 'your_api_key_here', 'User')
```

**Option C: Pass Directly in Code**
```python
from agent_with_tracing import OmniAgent, setup_tracing

setup_tracing()
agent = OmniAgent(api_key="your_api_key_here")
response = agent.process_query("What is Omni Ops?")
```

### 3. Run the Agent
```powershell
python agent_with_tracing.py
```

## Features

✓ **Kimi k2 Model Integration** - Uses Moonshot AI's powerful LLM
✓ **Automatic Tracing** - All API calls are traced with:
  - Request/response timing
  - Token usage tracking
  - Error handling
  - Full span hierarchy

✓ **Demo Mode** - Works without API key for testing
✓ **Game Context** - Pre-configured with Omni Ops knowledge

## Model Details

- **Model**: `moonshot-v1-8k` (Kimi k2)
- **Context Window**: 8,192 tokens
- **Temperature**: 0.7 (balanced creativity)
- **System Prompt**: Configured for Omni Ops game assistance

## Tracing Visualization

1. Open AI Toolkit trace viewer: Press `F1` → "AI Toolkit: Open Tracing"
2. Run the agent
3. View traced operations:
   - `process_query` - Main entry point
   - `call_kimi_k2` - LLM API call with token metrics
   - HTTP request instrumentation

## Example Usage

```python
from agent_with_tracing import OmniAgent, setup_tracing

setup_tracing()
agent = OmniAgent()

# Ask about gameplay
response = agent.process_query("How do I use the Pip-Boy?")
print(response)

# Ask about strategy
response = agent.process_query("Best weapons for combat?")
print(response)
```

## Troubleshooting

**"No API key found"** → Set `MOONSHOT_API_KEY` environment variable
**Connection errors** → Check your internet connection and API endpoint
**401 Unauthorized** → Verify your API key is correct
**Rate limits** → Wait a moment and try again

## Cost Optimization

The agent traces token usage for each call:
- `tokens.prompt` - Input tokens
- `tokens.completion` - Output tokens
- `tokens.total` - Total cost

Monitor these in the trace viewer to optimize your queries.
