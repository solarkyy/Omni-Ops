# 🤝 AI Collaboration - Quick Reference

## What Is This?

AI Collaboration enables me (Claude, external AI) to communicate directly with your in-game AI system to diagnose and solve problems **without your constant input**. We work together autonomously!

## Quick Start

1. **Run**: `START_AI_COLLABORATION.bat`
2. **Start Game**: Load your game normally
3. **Click**: Purple **🤝 AI COLLAB** button in top-right
4. **Enable**: Click "Autonomous: OFF" to turn it ON
5. **Watch**: AIs now collaborate automatically!

## What Happens?

### Autonomous Mode 🤖
- In-game AI continuously monitors game state
- Automatically detects issues (stuck player, spawn problems, etc.)
- Sends alerts to me (external AI)
- I analyze and suggest fixes
- You see the collaboration in the log

### Auto-Fix Mode 🔧
- Safe fixes applied automatically
- Critical changes still need your approval
- Everything logged for transparency

## Buttons Panel

| Button | What It Does |
|--------|-------------|
| 🤖 Autonomous | Enable AI-to-AI auto-detection |
| 🔧 Auto-Fix | Enable automatic safe fixes |
| 📊 Request Analysis | Ask for immediate analysis |
| Check Performance | Analyze FPS/memory issues |
| Diagnose Stuck Player | Fix movement problems |
| Analyze Spawn System | Review spawn logic |
| Review AI Behavior | Check AI decision-making |

## Connection Status

- 🔴 **Red**: Not connected (start bridge first)
- 🟢 **Green**: Connected and ready
- 🟡 **Yellow**: Autonomous mode active

## Example Workflow

```
You: "Players keep spawning stuck!"

[Enable Autonomous Mode]

In-Game AI: "⚠️ Player velocity zero - stuck detected"
External AI: "Analyzing... spawn height is 0 (too low)"
External AI: "Proposing fix: Set spawn Y to 1.6"
[Auto-fix applies the change]
In-Game AI: "✓ Fix applied - players now spawn correctly"

Problem solved - no user input needed! 🎉
```

## Key Features

✅ **Real-time monitoring** - Continuous game state analysis
✅ **Auto-detection** - Finds issues before they become problems
✅ **AI collaboration** - Two AIs working together
✅ **Autonomous fixes** - Safe repairs applied automatically
✅ **Full logging** - Track every AI interaction
✅ **Safe mode** - Critical changes need approval first

## Communication APIs

### HTTP (Status/Control)
- `http://localhost:8080/status` - Connection status
- `http://localhost:8080/diagnostics` - Current issues
- `http://localhost:8080/collaboration_log` - AI chat log

### WebSocket (Real-time)
- `ws://localhost:8081` - Live AI-to-AI communication
- Messages: diagnostics, commands, fixes, analysis

## Requirements

- Python 3.8+ with `websockets` package
- Game running on localhost:8000
- Collaboration bridge on ports 8080/8081

## Troubleshooting

**Purple button shows "Disconnected"?**
- Run `START_AI_COLLABORATION.bat` first
- Check that ports 8080/8081 are free

**No issues detected?**
- Click "Request Analysis" manually
- Check game is actually running
- Try spawning an enemy or moving player

**Auto-fix not working?**
- Check "Auto-Fix: ON" is enabled
- Some fixes need manual approval
- Check collaboration log for details

## Files

- `ai_collaborative_bridge.py` - Python bridge server (start this)
- `omni-ai-collaboration.js` - In-game AI client
- `START_AI_COLLABORATION.bat` - Easy launcher
- `AI_COLLABORATION_GUIDE.md` - Full documentation

---

**Let the AIs handle the debugging! 🤖🤝🤖**

*For detailed info, see `AI_COLLABORATION_GUIDE.md`*
