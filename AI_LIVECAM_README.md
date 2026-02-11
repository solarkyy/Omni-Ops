# 🤖 AI LIVE CAM - Watch AI Play Your Game!

## Overview

The AI Live Cam system allows an autonomous AI agent to **actually play your game** while you watch in real-time. Think of it like watching a live stream, but the streamer is an AI making its own decisions! The live cam now includes a **real-time viewport** showing exactly what the AI sees.

## 🎮 Features

### 🧠 Autonomous AI Player
- **Independent decision-making** - AI analyzes game state and makes its own choices
- **Combat AI** - Engages enemies, aims, shoots, reloads
- **Exploration** - Navigates the world when no threats present
- **Survival instincts** - Retreats when low health, takes cover
- **Real-time adaptation** - Responds to changing game conditions

### 📹 Live Viewing Interface
- **Game View** - See what the AI sees
- **Tactical Radar** - Top-down view of AI position and enemies
- **AI Brain Panel** - See current AI state, target, objective
- **Thought Stream** - Read AI's decision-making process
- **Live Statistics** - Kills, accuracy, survival time, health, ammo
- **Activity Log** - Real-time log of AI actions

### 🎛️ Controls
- **Start/Stop AI** - Control when AI plays
- **Difficulty Settings** - Easy, Medium, Hard, Expert
- **Aggression Slider** - Control how aggressive AI is
- **Update Rate** - Adjust AI decision speed
- **Statistics Reset** - Clear stats and start fresh

## 🚀 Quick Start

### 1. Start the Game
```bash
python -m http.server 8000
```
Open http://localhost:8000

### 2. Launch Game
- Click "SINGLE PLAYER" to start
- Wait for game to load

### 3. Open AI Live Cam
- Press **F4** to open AI Live Cam interface
- Interface shows up as overlay with live game viewport

### 4. Watch AI Play!
- Click **"▶️ START AI"** in the controls section
- Watch the AI start playing autonomously
- Monitor stats, live viewport, radar, and thought process in real-time
- The **Game View** panel shows exactly what the AI sees

## 📋 Requirements

### Game State - DONE ✅
- Game exposes comprehensive state via `window.AIPlayerAPI.getGameState()`
- Returns player position, health, ammo, enemies, etc.

### Input Control - DONE ✅
- AI can inject keyboard/mouse inputs via `window.AIPlayerAPI.setInput()`
- AI can control movement, aiming, shooting, reloading

### Live Interface - DONE ✅
- F4 opens live cam overlay
- Real-time updates every 100ms
- Statistics updated every 500ms
- Thought stream updated every 1000ms

## 🎯 AI Capabilities

### Combat Behavior
- Detects enemies within awareness range (50m)
- Calculates optimal aim with accuracy variation
- Manages distance - retreats if too close, advances if too far
- Strafes while engaging
- Reloads when safe
- Takes cover when health is low

### Movement AI
- Explores map when no enemies present
- Generates random waypoints
- Sprints when stamina available
- Navigates around obstacles

### Decision Making
States the AI can be in:
- **IDLE** - Waiting for action
- **EXPLORING** - Moving through world
- **ENGAGING** - In combat with enemy
- **TAKING_COVER** - Defensive position
- **RELOADING** - Reloading weapon
- **RETREATING** - Low health escape

### Personality Settings
```python
aim_accuracy = 0.85      # 85% accuracy
reaction_time = 0.2      # 200ms reaction
aggression = 0.7         # 70% aggressive
awareness_range = 50     # Can see 50 units
```

## 🔧 Technical Architecture

### Game-Side API (JavaScript)
```javascript
// Get full game state
const state = window.AIPlayerAPI.getGameState();
// Returns: { player: {...}, enemies: [...], objectsCount, gameMode }

// Control player
window.AIPlayerAPI.setInput('moveForward', true);
window.AIPlayerAPI.setLook(yaw, pitch);
window.AIPlayerAPI.shoot();
window.AIPlayerAPI.pressKey('reload');
window.AIPlayerAPI.releaseAllInputs();
```

### AI Player (Python)
```python
from ai_game_player import AIGamePlayer, GameBridge

bridge = GameBridge()
ai_player = AIGamePlayer(bridge)
ai_player.run()  # Start autonomous play
```

### Live Cam Interface (JavaScript)
```javascript
// Toggle with F4
window.AILiveCam.toggle();

// Start/stop AI
window.AILiveCam.startAI();
window.AILiveCam.stopAI();

// View updates automatically
```

## 📊 Statistics Tracked

- **Kills** - Enemies eliminated
- **Deaths** - Times AI player died
- **Shots Fired** - Total shots taken
- **Shots Hit** - Successful hits
- **Accuracy** - Hit percentage
- **Distance Traveled** - Total movement
- **Time Survived** - Survival duration
- **Enemies Spotted** - Detection count
- **Cover Taken** - Defensive moves

## 🎮 Keyboard Controls

| Key | Function |
|-----|----------|
| F3  | Open AI Testing Interface |
| F4  | Open AI Live Cam (Watch AI Play) |
| ESC | Pause / Settings |

## 🔍 Debug Information

The debug panel shows:
- **Position** - Current X, Y, Z coordinates
- **Look** - Yaw and pitch angles
- **Velocity** - Movement vector
- **Enemies Visible** - Count of detected enemies

## 📡 Radar View

The tactical radar displays:
- 🟢 **Green dot** - AI player position
- 🔴 **Red dots** - Hostile enemies
- ⚪ **White dots** - Objects/obstacles
- **Green line** - AI's look direction

## 💭 Thought Stream

See AI's decision-making in real-time:
```
[14:23:45] AI Player activated. Beginning autonomous operation.
[14:23:46] 🔍 Area clear - exploring...
[14:23:50] 📍 Waypoint reached - selecting new destination
[14:23:55] 🎯 Enemy spotted at 32.5m - ENGAGING!
[14:23:57] ↔️ Enemy too close (8.2m) - strafing!
[14:24:02] 🔄 Reloading (8 rounds left)
[14:24:10] ⚠️ Health critical (28HP) - RETREATING!
```

## 🎨 Visual Indicators

### AI Status Dot
- 🔴 **Red (pulsing)** - AI inactive
- 🟢 **Green (pulsing)** - AI active and playing

### Target Indicator
- Shows "NO TARGET" when exploring
- Shows enemy ID when engaging

### Crosshair
- Green circle showing AI's aim point

## ⚙️ Advanced Configuration

### Difficulty Levels
- **Easy** - 70% accuracy, slow reaction
- **Medium** - 85% accuracy, normal reaction
- **Hard** - 95% accuracy, fast reaction
- **Expert** - 99% accuracy, instant reaction

### Aggression Levels
- **0-30%** - Very defensive, takes cover often
- **30-70%** - Balanced approach
- **70-100%** - Highly aggressive, rushes enemies

### Update Rate
- **100ms** - Very responsive (CPU intensive)
- **200ms** - Balanced (default)
- **500ms** - Slower but smooth
- **1000ms** - Strategic decisions only

## 🐛 Troubleshooting

### AI Not Moving
- Check that game is active (not in menu)
- Verify pointer lock is not required
- Check console for errors

### No Enemies Showing
- AI units must be spawned in game
- Check `window.aiUnits` array
- Verify enemy spawn system is working

### Stats Not Updating
- Ensure F4 interface is open
- Check browser console for errors
- Verify `AIPlayerAPI` is available

### AI Stuck in Loop
- Press "STOP AI" button
- Reset statistics
- Adjust difficulty/aggression
- Restart AI

## 🚧 Current Limitations

1. **AI-Player Bridge** - Not fully connected yet
   - Python AI player needs HTTP/WebSocket connection to game
   - Currently uses mock bridge for development

2. **Vision System** - Not implemented yet
   - AI relies on game state data
   - No computer vision of actual game screen

3. **Learning** - Not implemented yet
   - AI uses predefined behaviors
   - No machine learning or adaptation over time

## 🔮 Future Enhancements

### Short Term
- [ ] Connect Python AI to JavaScript game via WebSocket
- [ ] Implement actual shooting/hit detection
- [ ] Add voice commentary (text-to-speech)
- [ ] Save/load AI configuration profiles

### Long Term
- [ ] Machine learning integration
- [ ] Multiple AI agents playing together
- [ ] AI vs AI combat mode
- [ ] Replay system with AI decision breakdown
- [ ] Custom AI personality builder

## 📁 File Structure

```
Omni Ops/
├── ai_game_player.py              # Python AI player logic
├── js/
│   ├── omni-ai-livecam.js        # F4 live cam interface with real viewport
│   ├── omni-ai-tester.js         # F3 testing interface
│   └── omni-core-game.js         # Game + AI API
└── index.html                     # Main HTML with scripts
```

## 🎓 How It Works

1. **Game Exposes State**
   - `AIPlayerAPI.getGameState()` returns current game data
   - Enemy positions, player stats, world info

2. **AI Analyzes State**
   - AIGamePlayer processes game state
   - Makes decisions based on situation
   - Selects appropriate action

3. **AI Controls Player**
   - Commands sent via `AIPlayerAPI.setInput()`
   - Inputs injected into game's key system
   - Player moves/aims/shoots as AI decides

4. **Live Cam Shows Everything**
   - F4 interface polls game state
   - Updates displays in real-time
   - Shows AI thoughts and statistics

## 🎬 Demo Scenario

```
1. Press F4 - Opens AI Live Cam
2. Click "START AI" - AI takes control
3. Watch AI spawn in game world
4. Live viewport shows AI's first-person view
5. AI looks around (IDLE state)
6. AI starts exploring - moves to waypoint
7. Enemy spawns nearby
8. AI detects enemy (ENGAGING state)
9. AI aims at enemy (watch in live viewport!)
10. AI shoots (stats update: shots fired++)
11. Enemy eliminated (stats update: kills++)
12. AI returns to exploring
13. Repeat and enjoy the show!
```

## 💡 Tips for Best Experience

1. **Spawn Enemies** - AI needs targets to showcase combat
2. **Watch Thought Stream** - Most interesting part!
3. **Adjust Difficulty** - Start easy, increase as AI improves
4. **Monitor Radar** - See tactical situation clearly
5. **Check Debug** - Understand what AI is sensing
6. **Try Different Settings** - Each personality behaves differently

## 🤝 Contributing

To enhance the AI:
1. Edit `ai_game_player.py` for new behaviors
2. Modify decision-making in `make_decision()`
3. Add new AI states in `AIState` enum
4. Update live cam to display new features

## 📝 License

Part of Omni-Ops project.

## 🙏 Credits

- AI decision logic based on game AI best practices
- Live interface inspired by esports spectator modes
- Built with Three.js and vanilla JavaScript

---

**Press F4 and watch your AI play in real-time! 🤖🎮**

## 🆕 What's New

- **Live Viewport**: The Game View panel now shows exactly what the AI sees in real-time
- **F3/F4 Separation**: F3 opens Testing, F4 opens Live Cam (no more conflicts)
- **Independent Interfaces**: Each interface is optimized for its specific purpose
- **Real-time Capture**: Live canvas feed from the game viewport to the AI vision display
- **Better Organization**: Testing and watching AI are now separate, focused experiences
