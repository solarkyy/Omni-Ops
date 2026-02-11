# OMNI-OPS AI VIEW MODE SYSTEM

## Quick Start

**Double-click `LAUNCH_GAME.bat`** to start the game with AI features enabled.

## AI Features

### 🤖 AI Chat & Control Panel (F5)
- **Two-way chat** with AI
- **AI Control Toggle** - Let AI take over and play
- **Live game state** monitoring
- **Quick action buttons** for AI commands
- **Screenshot capture** (📸 button)

### 📹 AI Live Cam (F4)
- Watch AI play in real-time
- View AI vision and targeting
- See live statistics and performance
- Monitor AI decision-making

### 📸 Screenshots
- Auto-captured to `screenshots/` folder
- Click 📸 button in AI panel
- High-quality PNG format
- Timestamped filenames

## Controls

| Key | Action |
|-----|--------|
| **F4** | Toggle AI Live Cam |
| **F5** | Toggle AI Chat Panel |
| **TAB** | Open Pip-Boy |
| **M** | Tactical Mode |
| **WASD** | Movement |
| **ESC** | Settings Menu |

## AI Control Features

When AI Control is **ON** (green button):
- AI analyzes game state every 100ms
- AI makes decisions automatically
- AI can move, shoot, and interact
- You can still send instructions via chat

When AI Control is **OFF** (red button):
- Manual control only
- AI will respond to chat messages
- AI provides advice and analysis

## Quick Actions

The AI panel has 4 quick action buttons:

1. **🗺 Explore** - AI explores the area
2. **⚔ Combat** - AI engages enemies
3. **📦 Collect** - AI collects items
4. **🏠 Return** - AI returns to start

## Communication

### Talking to AI
Type messages in the chat box and press **SEND** or **Enter**.

Example messages:
- "What do you see?"
- "Move forward"
- "Find enemies"
- "Take screenshot"
- "What should I do?"

### AI Responses
The AI will respond with:
- Current situation analysis
- Suggested actions
- Confirmation of commands
- Status updates

## Technical Details

### Game State Capture
The AI can see:
- Player position
- Health & stamina
- Nearby enemies
- Available items
- Current objective

### Offline Mode
If the AI server isn't running, the system works in offline mode:
- Chat still functions
- Manual AI control available
- Simulated responses
- All features accessible

## Troubleshooting

**AI Panel won't open:**
- Press F5 to toggle
- Check browser console for errors

**Screenshots not saving:**
- Check `screenshots/` folder exists
- Browser may prompt for download location

**AI not responding:**
- Server may be offline (normal)
- System works in offline mode
- Responses will be simulated

## Files

- `LAUNCH_GAME.bat` - Main launcher
- `js/omni-ai-tester.js` - AI control & chat
- `js/omni-ai-livecam.js` - AI live cam view
- `screenshots/` - Screenshot storage

## Server Setup (Optional)

For full AI functionality with external AI services:

1. Install Python
2. Run: `python -m http.server 8000`
3. Open: `http://localhost:8000`

The launcher does this automatically!

---

**Version:** AI View Mode Edition
**Last Updated:** February 2026
