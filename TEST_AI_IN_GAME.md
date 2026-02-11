# AI In-Game Testing System

## 🤖 Overview

A comprehensive AI testing interface that allows your Python AI agents to test game functions directly while providing real-time visual feedback and chat communication.

## 🎮 Features

### 1. **Visual Testing Interface**
- Real-time test execution display
- Progress bars for running tests
- Test queue management
- Results history with pass/fail indicators

### 2. **AI Chat Interface**
- Real-time communication with AI
- Natural language test requests
- System status updates
- Interactive command processing

### 3. **Visual Feedback System**
- In-game markers showing test locations
- Color-coded status (green=pass, red=fail, cyan=testing)
- Animated pulse effects
- Automatic cleanup after 3 seconds

### 4. **Automated Test Suite**
- **Movement Tests**: Position, keys, collision
- **Shooting Tests**: Weapon, ammo, raycast
- **UI Tests**: HUD, menus, keybinds
- **Full System**: All tests combined

## 🚀 Quick Start

### Step 1: Start the Game
```bash
cd "c:\Users\kjoly\OneDrive\Desktop\Omni Ops"
python -m http.server 8000
```
Open: http://localhost:8000

### Step 2: Start AI Bridge (Optional)
```bash
python ai_game_bridge.py
```
This starts the Python bridge on port 8080 for advanced AI integration.

### Step 3: Open Testing Interface
**In-Game**: Press `F3` to toggle the AI testing interface

## 🎯 Usage

### Manual Testing
1. Press **F3** to open AI tester
2. Click quick action buttons:
   - "Test Movement" - Check player controls
   - "Test Shooting" - Verify weapons
   - "Test UI" - Check interface
   - "Clear All" - Reset queue

### Chat Commands
Type in the chat box:
- "test movement" - Queue movement tests
- "test shooting" - Queue shooting tests
- "test ui" - Queue UI tests
- "test all" - Run complete test suite
- "help" - Show available commands

### Visual Feedback
- **Cyan pulsing markers** = Test in progress
- **Green markers** = Test passed
- **Red markers** = Test failed
- Markers appear at test locations and fade after 3 seconds

## 🔧 Test Functions

### Built-in Tests

#### Movement
- `testPlayerPosition` - Verify player location in 3D space
- `testMovementKeys` - Check WASD keybind configuration
- `testCollision` - Count collision objects in scene

#### Shooting
- `testWeapon` - Verify weapon system loaded
- `testAmmo` - Check ammo counter functionality
- `testRaycast` - Test hit detection system

#### UI
- `testHUD` - Verify all HUD elements present
- `testMenus` - Check menu system availability
- `testKeybinds` - Test keybinding system

## 🐍 Python AI Integration

### Basic Usage
```python
from ai_game_bridge import GameTestingBridge, AIGameTester

# Start the bridge
bridge = GameTestingBridge(port=8080)
bridge.start_server()

# Create AI tester
tester = AIGameTester(bridge)

# Run automated tests
results = tester.run_automated_tests()
```

### Custom Tests
```python
# Queue a test
bridge.queue_test('custom', 'My custom test description')

# Check results
results = bridge.get_test_results(limit=10)

# Get chat history
messages = bridge.get_chat_history(limit=50)
```

### API Endpoints

The bridge server provides:
- `GET /status` - Check connection status
- `GET /tests/queue` - Get pending tests
- `GET /tests/results` - Get test results
- `GET /chat/history` - Get chat messages
- `POST /tests/submit` - Submit test result
- `POST /chat/message` - Send chat message
- `POST /tests/queue` - Add test to queue

## 📊 Interface Sections

### Left Panel: Test Execution
- **Current Test**: Shows running test with progress bar
- **Queue**: Lists upcoming tests
- **Recent Results**: Last 5 test results with pass/fail
- **Quick Actions**: One-click test buttons

### Right Panel: Communication
- **Chat Messages**: Real-time AI conversation
- **Chat Input**: Type commands or questions
- **Visual Log**: Timestamped test events

## 🎨 Visual Markers

Markers appear on screen at test locations:

```javascript
// Add custom marker
AITester.addVisualMarker(x, y, success);
// x, y = screen coordinates
// success = true (green) or false (red)
```

## 🔌 Extending Tests

Add custom test functions in `omni-ai-tester.js`:

```javascript
testCustomFunction: function() {
    try {
        // Your test logic here
        const result = yourTestCode();
        
        return {
            pass: result.isSuccessful,
            message: 'Test details here',
            position: { x: 100, y: 100 } // Optional marker
        };
    } catch (e) {
        return { 
            pass: false, 
            message: `Error: ${e.message}` 
        };
    }
}
```

Then register it in quick tests:

```javascript
customTest: [
    { name: 'My Custom Test', fn: 'testCustomFunction' }
]
```

## 🎯 Keyboard Shortcuts

- **F3** - Toggle AI testing interface
- **Enter** (in chat) - Send message
- **Escape** - Close interface (when open)

## 📝 Tips

1. **Keep tests small**: Each test should check one specific thing
2. **Use visual markers**: Help locate issues quickly
3. **Check the log**: Visual log shows all test activities
4. **Clear queue**: Use "Clear All" if queue gets backed up
5. **Chat with AI**: Describe problems in natural language

## 🐛 Troubleshooting

### Interface won't open
- Check console (F12) for errors
- Verify `omni-ai-tester.js` is loaded
- Try refreshing the page

### Tests not running
- Check test queue count
- Verify game is active and loaded
- Check visual log for errors

### AI not responding
- Bridge server must be running: `python ai_game_bridge.py`
- Check console for connection errors
- Verify port 8080 is not blocked

## 🚀 Advanced Features

### Remote Testing
The AI bridge allows remote testing from Python:

```python
# Run tests from Python
bridge.queue_test('movement', 'Remote movement test')
bridge.queue_test('shooting', 'Remote shooting test')

# Monitor results
time.sleep(5)
results = bridge.get_test_results()
for result in results:
    print(f"{result['test']}: {result['status']}")
```

### Batch Testing
Queue multiple tests at once:

```javascript
AITester.runQuickTest('all'); // All test suites
```

### Real-time Monitoring
Watch tests execute in real-time with visual feedback and chat updates.

## 📖 Example Session

1. Press **F3** to open interface
2. Type: "test movement"
3. AI responds: "Starting movement test sequence..."
4. Watch as:
   - Tests appear in queue
   - Progress bar fills
   - Visual markers appear on screen
   - Results populate in panel
5. Type: "test all" for comprehensive check
6. Review results and chat log

## 🎓 Best Practices

1. **Test after changes**: Run relevant tests after code modifications
2. **Use visual markers**: They help pinpoint where tests occur
3. **Read AI messages**: AI provides context for test results
4. **Check patterns**: Look for repeated failures
5. **Save results**: Important results are logged with timestamps

## 🔮 Future Enhancements

- Performance profiling
- Network latency testing
- AI behavior testing
- Automated bug reporting
- Test result export (JSON/CSV)
- Custom test scripts
- Video recording of test runs

---

**Press F3 in-game to start testing!** 🎮🤖
