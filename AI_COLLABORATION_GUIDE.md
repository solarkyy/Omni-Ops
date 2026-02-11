# 🤝 AI Collaborative Diagnostics System

## Overview

The AI Collaborative Diagnostics System enables **AI-to-AI communication** between external AI (like Claude) and the in-game AI system. This allows for **autonomous problem detection, diagnosis, and solving** without constant human intervention.

Think of it as having two AI specialists working together: one monitoring from the outside (external AI), and one embedded in the game (in-game AI), collaborating to keep everything running smoothly.

## 🎯 Key Features

### 🤖 AI-to-AI Communication
- **WebSocket Connection**: Real-time bidirectional communication
- **HTTP REST API**: For status updates and diagnostics
- **Message Queue System**: Reliable message delivery
- **Collaboration Logging**: Track all AI interactions

### 🔍 Autonomous Problem Detection
- **Auto-diagnostics**: Continuously monitors game state
- **Issue Detection**: Automatically identifies problems
  - Player stuck detection
  - Position anomalies (falling through world)
  - Health warnings
  - Performance issues
- **Real-time Alerts**: External AI notified immediately

### 🔧 Auto-Fix Capabilities
- **Automated Repairs**: Can fix common issues automatically
- **Fix Proposals**: External AI suggests fixes
- **Safety Controls**: Manual approval for critical changes
- **Fix Verification**: Tests applied fixes

### 📊 Real-Time Diagnostics
- **Game State Monitoring**: Player position, velocity, health
- **Performance Tracking**: FPS, memory, render times
- **Error Tracking**: Collects and reports errors
- **Collaboration History**: Full log of AI interactions

## 🚀 Quick Start

### 1. Start the Collaboration Bridge
```bash
# Windows
START_AI_COLLABORATION.bat

# Or manually
python ai_collaborative_bridge.py
```

### 2. Launch the Game
```bash
python -m http.server 8000
```
Open http://localhost:8000 and start playing

### 3. Open AI Collaboration Panel
- Click the **🤝 AI COLLAB** button (purple, top-right)
- Or it will appear automatically when connected

### 4. Enable Autonomous Mode
- Click **"🤖 Autonomous: OFF"** to enable
- The system will now auto-detect and report issues
- External AI will be notified of all problems

### 5. Optional: Enable Auto-Fix
- Click **"🔧 Auto-Fix: OFF"** to enable
- System will automatically apply safe fixes
- Critical changes still require approval

## 🎮 How It Works

### Architecture

```
┌─────────────────┐         WebSocket/HTTP         ┌──────────────────┐
│  External AI    │◄──────────────────────────────►│  In-Game AI      │
│  (Claude)       │                                 │  (JavaScript)    │
└─────────────────┘                                 └──────────────────┘
         │                                                   │
         │                                                   │
         ▼                                                   ▼
┌─────────────────┐                                 ┌──────────────────┐
│ Collaborative   │                                 │   Game Engine    │
│ Bridge (Python) │                                 │   (Three.js)     │
└─────────────────┘                                 └──────────────────┘
```

### Communication Flow

1. **Game Monitoring**
   - In-game AI monitors game state every 2 seconds
   - Sends updates to Collaborative Bridge
   - Auto-detects issues using heuristics

2. **Issue Detection**
   - Bridge analyzes game state for anomalies
   - Categorizes issues (errors vs warnings)
   - Notifies external AI if in autonomous mode

3. **AI Collaboration**
   - External AI receives issue notification
   - Analyzes context and game state
   - Proposes fixes or requests more data
   - In-game AI executes commands

4. **Fix Application**
   - External AI proposes fix
   - If auto-fix enabled: applied automatically
   - Otherwise: queued for approval
   - Result reported back to external AI

## 📡 API Reference

### WebSocket Messages

#### From External AI to In-Game AI

```javascript
// Request diagnostics
{
    type: 'diagnostic_request',
    timestamp: '2024-01-01T00:00:00Z'
}

// Execute command
{
    type: 'command',
    command: 'run_test',
    params: { test_type: 'movement' },
    timestamp: '2024-01-01T00:00:00Z'
}

// Provide analysis
{
    type: 'analysis',
    analysis: 'Player appears stuck at position (10, 0, 15)',
    suggestions: ['Check collision detection', 'Reset player position'],
    timestamp: '2024-01-01T00:00:00Z'
}

// Propose fix
{
    type: 'fix_proposal',
    fix: {
        type: 'config_change',
        description: 'Reset player to safe spawn',
        config: { respawn: true }
    },
    timestamp: '2024-01-01T00:00:00Z'
}
```

#### From In-Game AI to External AI

```javascript
// Issues detected
{
    type: 'issues_detected',
    issues: {
        errors: [{ type: 'player_fell', message: '...', severity: 'critical' }],
        warnings: [{ type: 'low_health', message: '...', severity: 'medium' }]
    },
    timestamp: '2024-01-01T00:00:00Z'
}

// Command result
{
    type: 'command_result',
    command: 'run_test',
    result: { success: true, message: 'Test completed' },
    timestamp: '2024-01-01T00:00:00Z'
}
```

### HTTP Endpoints

#### GET `/status`
Get bridge connection status
```json
{
    "status": "connected",
    "autonomous_mode": true,
    "auto_fix_enabled": false,
    "ws_connections": 1,
    "timestamp": 1234567890
}
```

#### GET `/diagnostics`
Get current diagnostics
```json
{
    "diagnostics": {
        "game_state": { ... },
        "errors": [...],
        "warnings": [...],
        "performance": {...}
    },
    "timestamp": "2024-01-01T00:00:00Z"
}
```

#### GET `/collaboration_log`
Get collaboration history
```json
{
    "log": [
        { "message": "...", "source": "external", "timestamp": "..." }
    ],
    "count": 10
}
```

#### POST `/toggle_autonomous`
Enable/disable autonomous mode
```json
{ "enabled": true }
```

#### POST `/toggle_auto_fix`
Enable/disable auto-fix
```json
{ "enabled": true }
```

## 🎛️ Controls

### In Collaboration Panel

- **🤖 Autonomous Mode**: Auto-detect and report issues
- **🔧 Auto-Fix Mode**: Automatically apply safe fixes
- **📊 Request Analysis**: Ask external AI to analyze current state

### Quick Actions

- **Check Performance**: Request performance analysis
- **Diagnose Stuck Player**: Analyze player movement issues
- **Analyze Spawn System**: Review spawn system behavior
- **Review AI Behavior**: Check AI decision making

## 🔍 Use Cases

### Example 1: Stuck Player Detection

```
1. Player gets stuck in geometry
2. In-game AI detects velocity near zero
3. Warning sent to external AI
4. External AI analyzes position data
5. Proposes fix: reset to last safe position
6. If auto-fix enabled: automatically applied
7. Player respawns at safe location
```

### Example 2: Performance Degradation

```
1. Game FPS drops below threshold
2. In-game AI detects performance issue
3. External AI requested to analyze
4. External AI identifies memory leak
5. Suggests: clear old objects, reduce particle count
6. In-game AI executes cleanup
7. Performance restored
```

### Example 3: Spawn Issues

```
1. User reports spawning inside objects
2. Click "Analyze Spawn System"
3. External AI reviews spawn logic
4. Identifies: spawn height set to 0
5. Proposes: change spawn Y to 1.6
6. Fix applied to code
7. Players now spawn correctly
```

## 🛡️ Safety Features

### Manual Approval Required For
- Code changes
- Game-breaking fixes
- Irreversible operations
- System-wide config changes

### Automatic Approval Allowed For
- Player position resets
- Cache clearing
- Performance optimizations
- Non-destructive config changes

### Logging & Audit Trail
- All AI interactions logged
- Full collaboration history
- Timestamps on everything
- Source tracking (external vs in-game)

## 🔧 Configuration

### Bridge Settings
```python
bridge = CollaborativeBridge(
    port=8080,          # HTTP API port
    ws_port=8081,       # WebSocket port
)
```

### Autonomous Mode
```javascript
// Enable programmatically
window.AICollaboration.toggleAutonomousMode();

// Or via HTTP
POST http://localhost:8080/toggle_autonomous
{ "enabled": true }
```

## 📊 Monitoring

### Connection Status
- **🔴 Red Dot**: Disconnected
- **🟢 Green Dot**: Connected
- **🟡 Yellow Dot**: Autonomous mode active

### Log Coloring
- **Purple**: In-game AI messages
- **Cyan**: External AI messages
- **Yellow**: System messages

## 💡 Tips

1. **Start Bridge First**: Launch `START_AI_COLLABORATION.bat` before the game
2. **Check Connection**: Purple button should show "Connected" status
3. **Use Autonomous**: Enable for hands-free monitoring
4. **Review Logs**: Check collaboration log to see AI interactions
5. **Safe Testing**: Start without auto-fix to approve changes manually

## 🚧 Current Limitations

1. **Local Only**: Bridge runs on localhost (for security)
2. **Python Required**: Needs Python 3.8+ with websockets
3. **Manual Code Changes**: Some fixes still need human approval
4. **Learning Curve**: AIs need time to understand game patterns

## 🔮 Future Enhancements

- [ ] Machine learning for better issue detection
- [ ] Predictive problem prevention
- [ ] Multi-game support
- [ ] Cloud-based external AI option
- [ ] Natural language commands
- [ ] Visual debugging aids
- [ ] Performance profiling integration

## 📁 File Structure

```
Omni Ops/
├── ai_collaborative_bridge.py          # Python bridge server
├── js/
│   ├── omni-ai-collaboration.js       # In-game AI collaboration
│   ├── omni-ai-tester.js              # F3 testing interface
│   ├── omni-ai-livecam.js             # F4 live cam
│   └── omni-core-game.js              # Game engine
├── START_AI_COLLABORATION.bat          # Windows launcher
└── AI_COLLABORATION_GUIDE.md           # This file
```

## 🤝 Contributing

To extend AI collaboration capabilities:

1. **Add New Commands**: Extend `execute_game_command()` in bridge
2. **New Issue Detection**: Add to `detect_issues()` method
3. **Custom Fixes**: Implement in `apply_fix()` method
4. **UI Enhancements**: Modify `omni-ai-collaboration.js`

## 📝 License

Part of Omni-Ops project.

---

**Start collaborating with AI to keep your game running perfectly! 🤖🤝**
