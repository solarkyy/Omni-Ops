# Running Omni Agent Locally (No API Key Needed!)

## Quick Start - 3 Steps

### 1. Install Ollama
Download and install from: **https://ollama.com**

Windows installer will set everything up automatically.

### 2. Pull a Model
```powershell
# Small, fast model (recommended for gaming)
ollama pull llama3.2

# OR larger, more capable model
ollama pull llama3.2:3b

# OR even more powerful
ollama pull mistral
```

### 3. Run the Agent
```powershell
python agent_with_tracing.py
```

That's it! The agent will auto-detect Ollama and run completely offline.

## Available Models

| Model | Size | Speed | RAM Needed |
|-------|------|-------|------------|
| `llama3.2` | 2GB | Fast | 4GB |
| `llama3.2:3b` | 3GB | Medium | 6GB |
| `mistral` | 4GB | Medium | 8GB |
| `llama3.1` | 5GB | Slower | 10GB |

## Usage Examples

### Basic Usage
```python
from agent_with_tracing import OmniAgent, setup_tracing

setup_tracing()
agent = OmniAgent(use_local=True)  # Uses local Ollama

response = agent.process_query("How do I use the Pip-Boy?")
print(response)
```

### Choose a Different Model
```python
agent = OmniAgent(use_local=True, local_model="mistral")
```

### Fallback Options
```python
# Try local first, then cloud, then demo
agent = OmniAgent(
    use_local=True,  # Try Ollama
    api_key=os.getenv("MOONSHOT_API_KEY")  # Fallback to Kimi k2
)
```

## Benefits of Local

✅ **100% Free** - No API costs  
✅ **Private** - Your data never leaves your machine  
✅ **Fast** - No network latency  
✅ **Offline** - Works without internet  
✅ **Unlimited** - No rate limits or quotas  

## Tracing

All local model calls are fully traced:
- Model inference time
- Token counts (prompt & completion)
- Full request/response flow
- Performance metrics

View traces in AI Toolkit to optimize model selection and prompts.

## Troubleshooting

**"Ollama not detected"**
- Make sure Ollama is running (should auto-start)
- Check by visiting: http://localhost:11434
- Restart Ollama if needed

**Model not found**
- Run: `ollama pull llama3.2`
- Check available models: `ollama list`

**Slow responses**
- Try a smaller model: `ollama pull llama3.2` (2GB)
- Close other apps to free up RAM
- Consider GPU acceleration

**Out of memory**
- Use smaller model: `llama3.2` instead of `llama3.1`
- Close other applications
- Check RAM usage

## Performance Tips

1. **First run is slower** - Model loads into memory
2. **Subsequent queries are fast** - Model stays cached
3. **Use appropriate size** - Balance quality vs speed
4. **Keep Ollama running** - Faster startup

## Comparison

| Method | Cost | Speed | Privacy | Quality |
|--------|------|-------|---------|---------|
| Local (Ollama) | Free | Fast* | 100% | Good |
| Kimi k2 | Paid | Fast | Cloud | Excellent |
| Demo | Free | Instant | N/A | None |

*After initial load
