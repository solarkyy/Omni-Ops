# 🚀 AI LIVE CAM - QUICK START GUIDE

## What Is This?

An **autonomous AI that actually plays your game** while you watch in real-time! It's like Twitch, but the streamer is an AI making its own decisions.

## ⚡ 30-Second Setup

### 1. Start Game Server
```bash
cd "c:\Users\kjoly\OneDrive\Desktop\Omni Ops"
python -m http.server 8000
```

### 2. Open Game
- Go to: http://localhost:8000
- Click **"SINGLE PLAYER"**
- Wait for game to load

### 3. Open AI Live Cam
- Press **F4** key
- You'll see the AI Live Cam interface

### 4. Watch AI Play!
- Click **"▶️ START AI"** button
- Watch the AI start playing autonomously!

## 🎮 What You'll See

### Left Panel - Camera View
- **Game Feed**: What AI sees
- **Tactical Radar**: Top-down map showing:
  - 🟢 Green = AI player
  - 🔴 Red = Enemies
  - ⚪ White = Objects

### Middle Panel - AI Brain
- **Current State**: IDLE, EXPLORING, ENGAGING, RETREATING
- **Target**: Which enemy AI is focused on
- **Thoughts**: Real-time decision-making process
- **Stats**: Kills, accuracy, health, ammo

### Right Panel - Controls
- **START/STOP AI**: Control the AI
- **Difficulty**: Easy → Expert
- **Aggression**: Defensive → Aggressive
- **Activity Log**: What AI is doing
- **Debug Info**: Technical data

## 🎯 AI Behavior Examples

### Exploring
```
💭 "Area clear - exploring..."
💭 "📍 Waypoint reached - selecting new destination"
```

### Combat
```
💭 "🎯 Enemy spotted at 32.5m - ENGAGING!"
💭 "↔️ Enemy too close (8.2m) - strafing!"
💭 "🔄 Reloading (8 rounds left)"
```

### Survival
```
💭 "⚠️ Health critical (28HP) - RETREATING!"
```

## 🎛️ Controls

| Key | Action |
|-----|--------|
| F4 | Toggle AI Live Cam |
| F3 | Open AI Testing (different interface) |
| ESC | Pause game |

## 📊 What AI Can Do

✅ **Autonomous Movement** - Explores world independently
✅ **Enemy Detection** - Spots enemies within 50m  
✅ **Combat** - Aims, shoots, reloads
✅ **Tactical Decisions** - Engages, retreats, takes cover
✅ **Survival** - Monitors health, manages ammo
✅ **Adaptation** - Responds to changing situations

## 🔧 Quick Troubleshooting

### AI Not Moving?
- Make sure game is running (not in menu)
- Check AI status dot (should be 🟢 green)
- Click "TEST CONNECTION" button

### No Enemies?
- AI needs enemies to showcase combat
- Spawn enemies in game first
- Check radar for red dots

### Interface Not Opening?
- Press F4 (not F3)
- Refresh page if needed
- Check browser console for errors

## 🎨 Customization

### Difficulty Levels
- **Easy**: 70% accuracy, slow
- **Medium**: 85% accuracy (default)
- **Hard**: 95% accuracy, fast
- **Expert**: 99% accuracy, instant

### Aggression (0-100%)
- **Low (0-30%)**: Defensive, takes cover
- **Medium (30-70%)**: Balanced
- **High (70-100%)**: Aggressive, rushes

### Update Rate
- **100ms**: Very responsive (intense)
- **200ms**: Balanced (default)
- **500ms**: Relaxed
- **1000ms**: Strategic only

## 📝 Demo Mode (No Game Required)

Test AI logic without running game:
```bash
python demo_ai_player.py
```

This runs a simulation showing how AI makes decisions.

## 🎬 Typical AI Session

1. **F4** - Open Live Cam
2. **Click START** - AI activates
3. AI spawns and looks around (**IDLE**)
4. No enemies → AI explores (**EXPLORING**)
5. Enemy appears → AI detects it (**ENGAGING**)
6. AI aims and shoots
7. Enemy eliminated → Kill count +1
8. AI continues exploring
9. Health drops → AI retreats (**RETREATING**)
10. AI finds cover and reloads

## 💡 Pro Tips

1. **Watch the Thought Stream** - Most interesting part!
2. **Adjust Difficulty** - Start easy, increase gradually
3. **Monitor Radar** - See tactical situation clearly
4. **Check Activity Log** - Understand every action
5. **Try Different Settings** - Each creates unique AI behavior

## 🔮 What's Next?

Currently working on:
- [ ] Full Python-JavaScript bridge (WebSocket)
- [ ] Voice commentary (text-to-speech)
- [ ] Machine learning integration
- [ ] AI vs AI combat mode
- [ ] Replay system with decision breakdown

## 🆘 Need Help?

- Read: `AI_LIVECAM_README.md` (full documentation)
- Check: Browser console (F12) for errors
- Test: Run `demo_ai_player.py` to verify AI logic

## 🎉 Ready to Watch!

1. Open game
2. Press F4
3. Click START AI
4. Enjoy the show! 🍿

---

**The AI is watching. The AI is learning. The AI is playing.** 🤖🎮

Press F4 now!
