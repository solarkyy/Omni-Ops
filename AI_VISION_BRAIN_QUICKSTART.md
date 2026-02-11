# AI Vision & Brain - Quick Start Guide
## Make the In-Game AI as Smart as You in 3 Steps

**Created**: February 10, 2026  
**Status**: ✅ Ready to Use

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Start the Bridge
```bash
Windows: Double-click → START_AI_VISION_BRAIN.bat
Command: python ai_vision_brain_bridge.py
```

You should see:
```
🧠 AI Vision & Brain Bridge started on ws://localhost:8082
```

### Step 2: Open Your Game
```
1. Open http://localhost:8000 in browser
2. Start any game mode (Story, Quick Play, etc.)
3. Play normally - AI will initialize automatically
```

### Step 3: Press F5 to Talk to AI
```
Game Running → Press F5 → Vision Brain Panel Opens
→ See AI's Camera Feed + Chat Interface
→ Start Talking!
```

**That's it! You're now connected to the in-game AI.**

---

## 💬 Example Conversation with AI

```
YOU:  "What do you see?"
AI:   "I can see 12 objects: 3 enemies at 20 meters, 
       2 healing items, 1 weapon, 6 walls, and several other objects."

YOU:  "What's your confidence level?"
AI:   "My confidence is 65%. I'm not fully sure about combat."

YOU:  "Try moving to cover first, then assess."
AI:   "Understood. Moving to cover now... 
       Good decision! I see the threat more clearly from here.
       My confidence is now 82%."

YOU:  "Keep doing that. You're learning well."
AI:   "Acknowledged. I'm storing this pattern: 
       'Get cover first → assess → decide.'
       This will help me in future similar situations."
```

---

## 👁️ What You'll See

### Vision Feed (Live Camera)
```
┌─────────────────────┐
│  What AI Sees       │
│                     │
│  ◻ Enemy (red)      │  ← Threat detected
│  ◻ Item (green)     │  ← Opportunity
│  ◻ Wall             │
│                     │
└─────────────────────┘
```

### AI Status
- **Confidence**: How sure is the AI? (50% = uncertain, 90% = very sure)
- **Autonomy**: How independent? (5 = asks for help, 9 = decides alone)
- **Health**: AI's health bar
- **Current Task**: What is it doing right now?

### Real-Time Buttons
- **📊 Analyze Situation** - Ask AI to assess
- **👀 What Do You See?** - See vision + discuss
- **🆘 Ask for Help** - Request guidance
- **⬆️ More Autonomy** - Let it be more independent

---

## 🎮 Commands to Try

| Command | Result |
|---------|--------|
| "What do you see?" | AI describes environment |
| "What's your confidence?" | AI reports certainty level |
| "Do you need help?" | AI asks if uncertain |
| "Be more autonomous" | AI becomes independent |
| "Analyze threats" | AI assesses danger |
| "What did you learn?" | AI shares discoveries |

---

## 🧠 How the System Works

### The AI Thinks Every 500ms
```
1. Look around (capture vision)
2. Assess situation (threats? opportunities?)
3. Generate options (what could I do?)
4. Decide (based on confidence level)
5. Execute (do the action)
6. Learn (remember if it worked)
```

### Smart Autonomy System
- **Low Confidence** (< 60%) → Asks for guidance
- **Medium Confidence** (60-80%) → Asks sometimes
- **High Confidence** (> 80%) → Decides independently

### Continuous Learning
Every suggestion you make teaches the AI. After ~30 good suggestions, the AI learns automatically.

---

## 📊 Key Metrics

### AI Confidence
```
40% - New AI, just spawned
50% - Starting to understand
65% - Learning well
80% - Expert level
90%+ - As good as external AI
```

### Autonomy Levels
```
3/10 - Ask permission for everything (safe training)
5/10 - Normal (default)
7/10 - More independent (proven itself)
9/10 - Expert mode (rarely asks for help)
```

### Success Tracking
The AI keeps score:
- Each **successful** decision → Confidence +2%
- Each **failed** decision → Confidence -5%
- External AI guidance → Confidence +10%
- Repeated success → Higher autonomy

---

## ⚡ Power Tips

### Tip 1: Guide the AI Early
When AI is uncertain (< 60% confidence), give it advice. It learns faster.

### Tip 2: Watch Before Interrupting
Let the AI make decisions first. If it fails, teach it better next time.

### Tip 3: Increase Autonomy Gradually
```
Low:    "Do this specific thing"
Medium: "Consider X, Y, or Z"
High:   "You decide - I trust you"
```

### Tip 4: Ask Contextual Questions
```
Bad:    "What?"
Good:   "What do you see at your 10 o'clock?"
Better: "3 enemies ahead - should we fight or evade?"
```

### Tip 5: Let It Fail Sometimes
The best learning comes from recovering from mistakes.

---

## 🎯 Example: Teaching Combat

### Scenario: AI approaches enemies uncertainly

**Step 1 - Guide Initial Action**
```
Game: AI sees 3 enemies, confidence 45%
You:  "Move to high ground first"
AI:   "Understood. Moving... Better view from here!"
```

**Step 2 - Build on Success**
```
Game: AI now spots ammo and healing
You:  "Good thinking. Get resources when uncertain"
AI:   "Storing pattern: Position → Assess → Gather → Engage"
```

**Step 3 - Test Independence**
```
Game: AI encounters similar situation
You:  Say nothing, just watch
Result: AI remembers pattern, executes without asking!
Confidence: 78% → 82% (increased automatically)
```

**You just trained an AI! 🎉**

---

## 🔧 Troubleshooting

### "Panel shows 'Offline'"
```
1. Start the bridge: python ai_vision_brain_bridge.py
2. Check you see: "🧠 AI Vision & Brain Bridge started"
3. Refresh game page
4. Try F5 again
```

### "No vision feed visible"
```
1. Make sure game is running (you see the world)
2. AI must be spawned (you're playing as someone)
3. Vision updates every 100ms (be patient if game is slow)
4. Check: window.InGameAI.visionData in console
```

### "AI not responding to chat"
```
1. Make sure you pressed Enter to send
2. Check if "● Online" in top-right
3. Try: window.InGameAI.sendChat("test")
4. Restart bridge if needed
```

---

## 📚 Files You Need

```
Omni Ops/
├── ai_vision_brain_bridge.py          ← Python server (START THIS)
├── START_AI_VISION_BRAIN.bat           ← Easy launcher
├── js/omni-in-game-ai-intelligence.js ← AI brain
├── js/omni-ai-vision-brain-panel.js   ← Chat interface
└── index.html                          ← Links everything
```

---

## ✅ Quick Checklist

- [ ] Bridge started (`START_AI_VISION_BRAIN.bat`)
- [ ] Game open in browser
- [ ] Press F5 - see panel appear
- [ ] Status shows "● Online" (green)
- [ ] Vision feed shows game camera
- [ ] Type "Hello" in chat
- [ ] See AI respond
- [ ] 🎉 Success!

---

## 🎓 Learning Path

### 5 Minutes (Beginner)
- Start bridge
- Open game
- Press F5
- Ask: "What do you see?"

### 15 Minutes (Intermediate)
- Guide AI through combat
- Watch it learn patterns
- Increase autonomy gradually
- See confidence improve

### 30+ Minutes (Advanced)
- AI becomes expert in similar situations
- Learns without asking
- Makes good decisions alone
- Teaches itself new things

---

## 💡 Fun Experiments

1. **Stop Talking**
   - Start AI, give 1 command, then watch
   - How long until it decides alone?

2. **Different Autonomy Levels**
   - Set to 2 (micro-manage)
   - Set to 9 (total freedom)
   - See difference in play style

3. **Conversation Strategies**
   - Be very detailed in descriptions
   - Be very brief in commands
   - Mix positive and negative feedback
   - Which works best?

4. **Challenge the AI**
   - "Clear this room" (no specific tactical advice)
   - AI must figure it out
   - How well does it adapt?

---

## 📞 Getting Help

**Something Not Working?**

1. Check Python server running
```
Terminal shows: "🧠 AI Vision & Brain Bridge started"
```

2. Check JavaScript console (F12)
```
Should see: "✅ In-Game AI Intelligence initialized"
```

3. Check WebSocket status
```
Console: window.InGameAI.isConnected
Should be: true
```

4. Restart everything
```
Kill Python server (Ctrl+C)
Refresh game page
Restart bridge
Try again
```

---

## 🚀 You're Ready!

The AI is now listening. It will learn from every interaction. The more you guide it, the smarter it becomes. After a few minutes, it should be as capable as you!

**Press F5 and start teaching! 🧠💬**
