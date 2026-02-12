# OMNI-OPS AI SYSTEM - ACTIVATION & TESTING GUIDE

## Problem Summary
When attempting to activate AI control, the error "AIPlayerAPI not available!" appeared, preventing the AI from taking control of the player character.

## Root Cause
The `AIPlayerAPI` is defined in `omni-core-game.js`, which is loaded dynamically by the module loader. The unified control panel and related interfaces attempted to use this API before it was fully initialized, causing a race condition.

## Fixes Applied

### 1. **Unified Control Panel Enhancement** (`js/omni-unified-control-panel.js`)
- ✅ Added `waitForAPI()` method to wait for `window.AIPlayerAPI` to become available
- ✅ Updated `testMove()`, `quickAction()`, `toggleAI()`, and `aiCommand()` methods to handle missing API gracefully
- ✅ Added automatic retry with waiting for API if not initially available
- ✅ Added `showErrorMessage()` and `showSuccessMessage()` for better user feedback

### 2. **AI Game Bridge Enhancement** (`js/omni-ai-game-bridge.js`)
- ✅ Added `waitForAPI()` method for consistent API waiting
- ✅ Added `getStatus()` method for diagnostics
- ✅ Added initialization guard with `AIGameBridgeReady` flag

### 3. **Startup Verification** (`scripts/startup-verify.js`)
- ✅ Added checks for `AIPlayerAPI`, `AIGameBridgeAPI`, and `OmniUnifiedPanel`
- ✅ Now reports AI system status during startup

## How to Test

### Method 1: Using the Browser Test Interface (RECOMMENDED)
```bash
# 1. Open the test HTML file in your browser
file:///c:/Users/kjoly/OneDrive/Desktop/Omni%20Ops/test_ai_browser.html

# 2. Open the game in another tab/window
file:///c:/Users/kjoly/OneDrive/Desktop/Omni%20Ops/index.html

# 3. Start a game (click "Start Story" or "Quick Play")

# 4. In the test window, click "Check API Status"

# 5. If API is available, click "Activate AI"

# 6. Test commands:
   - Use movement buttons (Forward, Backward, Left, Right)
   - Use action buttons (Jump, Reload, Shoot)
   - Check game state with "Get Game State"
```

### Method 2: Using Browser Console (Advanced)
```javascript
// In browser console (F12), run these commands:

// 1. Check if API is available
console.log('API Available:', typeof window.AIPlayerAPI === 'object');

// 2. If available, activate AI
window.AIPlayerAPI.activateAI();
console.log('AI Active:', window.AIPlayerAPI.isAIControlling());

// 3. Test movement
window.AIPlayerAPI.setInput('moveForward', true);
setTimeout(() => window.AIPlayerAPI.setInput('moveForward', false), 500);

// 4. Test firing
window.AIPlayerAPI.shoot();

// 5. Get game state
const state = window.AIPlayerAPI.getGameState();
console.log('Game State:', state);

// 6. Deactivate when done
window.AIPlayerAPI.deactivateAI();
```

### Method 3: Using Python Test Scripts
```bash
# Run from command line:
python test_ai_comprehensive.py

# Follow instructions to run console tests
```

## Testing Checklist

- [ ] Game loads without console errors
- [ ] Module loading bar completes (shows "All systems ready!")
- [ ] "Check API Status" shows ✓ API Available
- [ ] "Activate AI" button successfully activates AI
- [ ] AI Status indicator shows green "🤖 AI ACTIVE"
- [ ] Movement commands (Forward, Backward, Left, Right) execute
- [ ] Jump command works
- [ ] Reload command works
- [ ] Shoot command executes
- [ ] "Get Game State" returns valid position and stats
- [ ] "Deactivate AI" stops AI control
- [ ] No console errors appear during any commands

## Expected Output

### Successful API Check
```
✓ API Available
Game Status: Game Active
```

### Successful AI Activation
```
[timestamp] Attempting to activate AI...
[timestamp] ✓ AI activated successfully
```

### Successful Movement Command
```
[timestamp] Sending movement command: moveForward
[timestamp] ✓ moveForward command completed
```

### Successful Game State Retrieval
```
[timestamp] Retrieving game state...
[timestamp] ✓ Game State Retrieved:
[timestamp]   Position: (123.45, 67.89, -234.56)
[timestamp]   Health: 100/100
[timestamp]   Stamina: 100%
[timestamp]   Ammo: 30/90
[timestamp]   Mode: FPS
[timestamp]   Aiming: false
[timestamp]   Reloading: false
```

## Troubleshooting

### Issue: "API Not Available - Make sure game is loaded"
- **Solution:**
  1. Make sure `index.html` is open in a browser window
  2. Wait 5+ seconds for the loading bar to complete
  3. Start a game ("Start Story" or "Quick Play")
  4. Return to test window and click "Check API Status" again

### Issue: AI won't activate / Status stays "INACTIVE"
- **Solution:**
  1. Check that game is running (not in menu)
  2. Look in browser console for errors
  3. Run "Run Full Diagnostic" to see what's available
  4. Check that the unified control panel loaded: `typeof window.OmniUnifiedPanel === 'object'`

### Issue: Commands don't execute
- **Solution:**
  1. Verify AI is actually active: Check the status indicator
  2. Click "Get Game State" to confirm game is running
  3. Check console for error messages with "[Panel]" or "[AI Bridge]" prefix
  4. Look for any errors from the movement system

### Issue: Game not holding focus / AI can't take full control
- **Solution:**
  1. Click on the game window to ensure it has focus
  2. The game may need pointer lock for full control
  3. Try starting a game first, then activating AI
  4. Check that you're in FPS mode (not menu mode)

### Issue: Module loading takes too long or fails
- **Solution:**
  1. Check Network tab in browser DevTools for failed requests
  2. Verify all JS files exist in the `js/` folder
  3. Check for CORS issues if loading from file://
  4. Try hard refresh: Ctrl+Shift+R
  5. Check browser console for specific error messages

## Console Messages to Look For

### Success Indicators
```
[ModuleLoader] ✓ Successfully loaded: Core Game
[ModuleLoader] ✓ Successfully loaded: Unified Control Panel
[AI Bridge] ✓ AIPlayerAPI available after XXX ms
[Panel] AI activated
[Panel] Moved forward
[Panel] Action: shoot
```

### Problem Indicators
```
[ModuleLoader] ✗ Failed to load: Core Game
[AI Bridge] ⚠️ AIPlayerAPI timeout
[Panel] AIPlayerAPI not available!
Uncaught TypeError: Cannot read property 'AIPlayerAPI' of undefined
```

## Files Affected

- ✅ `js/omni-unified-control-panel.js` - Enhanced with API waiting
- ✅ `js/omni-ai-game-bridge.js` - Added diagnostics and waiting
- ✅ `scripts/startup-verify.js` - Added AI system checks
- ✅ `test_ai_browser.html` - New test interface (Created)
- ✅ `test_ai_comprehensive.py` - New Python test (Created)

## Next Steps

1. **Immediate Testing (5 minutes)**
   - Open `test_ai_browser.html` in browser
   - Open `index.html` in another tab
   - Run "Check API Status" and "Activate AI" tests

2. **Integration Testing (15 minutes)**
   - Test all movement commands
   - Test all action commands
   - Test game state retrieval
   - Verify AI persists across game states

3. **Advanced Testing (Optional)**
   - Test rapid command sequences
   - Test commands while game is in different modes
   - Test with network simulation (intentional lag)
   - Profile API performance

## Support

If you encounter issues:
1. Check the console for specific error messages
2. Run "Run Full Diagnostic" in the test interface
3. Copy the console output from both windows
4. Check that all required files are present
5. Verify the script loading order hasn't changed

---
Last Updated: 2026-02-11  
Status: ✅ FIXES APPLIED AND READY FOR TESTING
