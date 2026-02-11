# 🚀 VS Code Integration - One-Click Bridge Start

## What's New?

The AI Collaboration button now features **one-click automatic start** via VS Code integration!

## How It Works

### Automatic Start Flow

```
Click 🤝 AI COLLAB
       ↓
Bridge not running?
       ↓
Modal appears with:
"⚡ START IN VS CODE" button
       ↓
Click it
       ↓
VS Code opens terminal
       ↓
Python bridge starts automatically
       ↓
Modal auto-detects connection
       ↓
Panel opens - you're ready!
```

## Requirements

✅ **VS Code must be open** with the Omni Ops folder
✅ **Python installed** with `websockets` package
✅ **Browser allows `vscode://` protocol** (enabled by default)

## Usage

### Method 1: One-Click Start (Recommended)

1. **Open VS Code** with your Omni Ops project
2. **Click** 🤝 AI COLLAB button in game
3. **Click** ⚡ START IN VS CODE
4. **Wait** ~2-5 seconds for auto-connection
5. **Done!** Collaboration panel opens automatically

### Method 2: Manual Start (Fallback)

If VS Code isn't open or you prefer manual control:

1. Double-click `START_AI_COLLABORATION.bat`
2. Click 🔄 Check Again in modal
3. Done!

## Technical Details

### VS Code Task Configuration

The integration uses a VS Code task defined in `.vscode/tasks.json`:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start AI Collaboration Bridge",
            "type": "shell",
            "command": "python",
            "args": ["ai_collaborative_bridge.py"],
            "presentation": {
                "reveal": "always",
                "panel": "new"
            }
        }
    ]
}
```

### Browser Integration

The button uses the `vscode://` protocol to trigger tasks:

```javascript
const taskUrl = `vscode://file/${workspaceFolder}?task=Start AI Collaboration Bridge`;
window.location.href = taskUrl;
```

### Auto-Detection

After triggering the task, the modal:
- Checks bridge status every 2 seconds
- Shows countdown timer (2s, 4s, 6s...)
- Automatically connects when detected
- Times out after 30 seconds with helpful message

## Benefits

✅ **No context switching** - Stay in browser, let VS Code handle it
✅ **Visual feedback** - See Python bridge running in VS Code terminal
✅ **Automatic** - No manual checking, connects when ready
✅ **Reliable** - Falls back to manual if needed
✅ **Developer-friendly** - Uses standard VS Code tasks

## Status Messages

| Message | Meaning |
|---------|---------|
| ⚡ Opening VS Code task... | Triggering VS Code |
| ⏳ Waiting for bridge to start... | Checking every 2s |
| ⏳ Waiting... (4s) | Elapsed time shown |
| ✓ Bridge detected! Connecting... | Found it! |
| ⏱️ Taking longer than expected... | 30s timeout - check VS Code |

## Troubleshooting

### "VS Code didn't open"
- Make sure VS Code is already running
- Try opening the Omni Ops folder in VS Code first
- Use manual start method instead

### "Task taking too long"
- Check VS Code terminal for errors
- Ensure Python is installed: `python --version`
- Ensure websockets installed: `pip install websockets`
- Check if ports 8080/8081 are free

### "Task not found"
- Ensure `.vscode/tasks.json` exists in project folder
- Try reloading VS Code workspace
- Task name must be: "Start AI Collaboration Bridge"

### "Bridge starts but modal doesn't detect it"
- Click 🔄 Check Again manually
- Verify bridge console shows "ready" message
- Check `http://localhost:8080/status` in browser

## Example Workflow

**Day 1: First Setup**
```
1. Open VS Code with Omni Ops
2. Start game in browser
3. Click 🤝 AI COLLAB
4. Click ⚡ START IN VS CODE
5. Watch VS Code terminal start bridge
6. Modal auto-connects
7. Start collaborating!
```

**Day 2: Already Familiar**
```
1. VS Code already open from yesterday
2. Click 🤝 AI COLLAB
3. Click ⚡ START IN VS CODE
4. Connected in 3 seconds
5. Back to work!
```

## Advanced: Running Task Manually

You can also start the bridge directly from VS Code:

1. Press `Ctrl+Shift+P` (Command Palette)
2. Type: "Tasks: Run Task"
3. Select: "Start AI Collaboration Bridge"
4. Terminal opens and starts bridge

## Files Involved

- `.vscode/tasks.json` - VS Code task configuration
- `js/omni-ai-collaboration.js` - Browser-side integration
- `ai_collaborative_bridge.py` - The Python bridge server
- `START_AI_COLLABORATION.bat` - Manual fallback option

## Comparison: VS Code vs Batch File

| Feature | VS Code Method | Batch File |
|---------|----------------|------------|
| Speed | ⚡ 1 click | 🐌 Find file + double-click |
| Visual feedback | ✅ Terminal in VS Code | ✅ Separate console window |
| Auto-connect | ✅ Yes | ❌ Manual check needed |
| Requirements | VS Code open | None |
| Best for | Development workflow | Quick tests, non-VS Code users |

---

**Just click the button and let the integration do the work! 🚀**

*Works seamlessly when VS Code is open, falls back gracefully when it's not.*
