# OMNI-OPS Game Testing Workflow - FIXED

## Critical Bug Fixed ✅
**Issue:** Game showed black screen after intro cutscene  
**Cause:** `window.launchGame` function was not exposed globally  
**Solution:** Added explicit window exposure in omni-core-game.js

---

## Testing Steps (Follow in Order)

### Step 1: Load Game
1. Open browser console: **F12**
2. Look at Console tab
3. Wait for loading to complete (should see "All modules loaded" or similar)

**Expected Console Output:**
```
[Core Game] Binding buttons...
[Core Game] UI initialized...
[UI] btn-story-start clicked
[Story] Starting introduction sequence...
```

### Step 2: Verify Functions Are Exposed
In browser console, run:
```javascript
OmniDiagnostics.runAllChecks()
```

Or manually check:
```javascript
console.log('launchGame available:', typeof window.launchGame === 'function');
console.log('startMode available:', typeof window.startMode === 'function');
console.log('GameStory available:', typeof GameStory !== 'undefined');
```

**Expected Output:**
```
launchGame available: true
startMode available: true
GameStory available: true
```

### Step 3: Start Story Mode
1. Click **"📖 Start Story"** button on menu
2. Watch for console messages:
   - Should see intro phases animating
   - Message: "[Story] Intro sequence complete"
   - Message: "[Story] Launching game after intro completion..."
   - Message: "[Story] Launching game after intro completion..." ← Verify NO error after this

**What should happen:**
- Intro cutscene plays (5 phases with narration)
- After complete → Game world appears (NOT black screen)
- Can see sky, terrain, buildings, NPCs

**If black screen appears:**
- Don't close anything
- Open console (F12)
- Look for error messages containing "launchGame"
- Run: `window.launchGame()` (manually trigger game launch)
- Game should appear

### Step 4: Test Gameplay
Once game loads with world visible:

#### Movement Test
- [ ] Press W → move forward (message: "moving")
- [ ] Press A → strafe left
- [ ] Press D → strafe right  
- [ ] Move mouse → camera rotates
- [ ] Press Shift → sprint (should feel faster)

#### HUD Display Test  
- [ ] Top-left shows: "LOCAL_HOST" and time (e.g., "03:45")
- [ ] Bottom-left shows: "Ammo: 30 / 90" and "HP: 100"
- [ ] Time increments every second

#### Combat Test
- [ ] Left-click to shoot
- [ ] Hear sound effect
- [ ] Ammo count decreases: "Ammo: 29 / 90"
- [ ] Press R to reload
- [ ] See reserve ammo decrease: "Ammo: 30 / 60"

#### Interaction Test
- [ ] Walk near an NPC
- [ ] See prompt: "Press F to interact"
- [ ] Press F
- [ ] Dialogue box opens with:
  - NPC name (gold text)
  - Faction (gray text)
  - Dialogue text (green)
  - Dialogue options (clickable)
- [ ] Click an option
- [ ] Dialogue closes, can move again

### Step 5: Verify All Systems
```javascript
// In console, run each:
console.log('Game Active:', gameState.isGameActive);  // Should be true
console.log('NPCs Spawned:', LivingWorldNPCs.npcs.length);  // Should be 20+
console.log('Buildings:', LivingWorldNPCs.buildings.length);  // Should be 6+
console.log('Scene Objects:', scene.children.length);  // Should be 50+
console.log('Story State:', GameStory.currentState);  // Should be 'INTRO_COMPLETE' or 'ACT_ONE'
```

**Expected:**
- Game Active: true
- NPCs Spawned: 20-40
- Buildings: 6-10
- Scene Objects: 50+
- Story State: INTRO_COMPLETE

---

## Console Commands for Testing

### Quick Test All Systems
```javascript
// Run full diagnostic
OmniDiagnostics.runAllChecks()
```

### Manual Game Launch (if needed)
```javascript
// If game doesn't auto-launch after intro:
window.launchGame()
```

### Force Start Story
```javascript
window.startMode('STORY')
```

### Force Start Quick Play
```javascript
window.startMode('SINGLE')
```

### Check Specific Systems
```javascript
// Story System
console.log('Story loaded:', typeof GameStory !== 'undefined');
console.log('Story state:', GameStory.currentState);

// Living World
console.log('Living World loaded:', typeof LivingWorldNPCs !== 'undefined');
console.log('NPC count:', LivingWorldNPCs.npcs.length);

// Game State
console.log('Full game state:', gameState);
console.log('Player position:', player.position);
console.log('Is game active:', gameState.isGameActive);
```

---

## Troubleshooting

### ❌ Problem: Still showing black screen
**Solution:**
1. Open console (F12)
2. Type: `window.launchGame()`
3. Press Enter
4. Game should appear

### ❌ Problem: launchGame still not available
**Check:**
```javascript
// Should all be true
console.log('launchGame:', typeof window.launchGame !== 'undefined');
console.log('startMode:', typeof window.startMode !== 'undefined');
console.log('GameStory:', typeof window.GameStory !== 'undefined');
```

**If any are false:**
- Hard reload: Ctrl+Shift+R
- Or clear cache: Settings → Clear browsing data → Reload

### ❌ Problem: NPCs not visible
**Check:**
```javascript
console.log('NPCs loaded:', LivingWorldNPCs.npcs.length);
console.log('Buildings loaded:', LivingWorldNPCs.buildings.length);
```

**If count is 0:**
- Check for errors in console
- Look for "Failed to initialize living world" messages
- Try: `LivingWorldNPCs.init()`

### ❌ Problem: Can't interact with NPCs
**Check:**
```javascript
console.log('Interaction handler available:', typeof handleInteraction === 'function');
console.log('In dialogue:', gameState.isInDialogue);
```

**If handler not available:**
- Check file size: `js/omni-core-game.js` should be 2500+ lines
- Verify file loaded: Check Network tab in DevTools

### ❌ Problem: Controls not responding
**Check:**
1. Click on game window to focus it
2. Check if in menu: `document.getElementById('menu-overlay').style.display === 'none'` should be true
3. Check if in dialogue: `gameState.isInDialogue` should be false

---

## Success Indicators ✅

Your game is **fully working** when:

✅ Game loads after intro (no black screen)
✅ Can see 3D world with blue sky, terrain, buildings
✅ NPCs visible and walking around
✅ Can move with WASD, look with mouse
✅ Can shoot and see ammo decrease
✅ Can interact with NPCs (F key → dialogue)
✅ HUD shows ammo/health and updates correctly
✅ No red error messages in console
✅ All console checks return expected values

---

## What Changed

### Modified Files
1. **js/omni-core-game.js** (Line 340-343)
   - Added: `window.launchGame = launchGame;`
   - Added: `window.initGame = initGame;`
   - Added: `window.handleInteraction = handleInteraction;`
   - **Why:** These functions needed to be globally accessible

### Why This Fixes Black Screen
- **Before:** Story system tried to call `window.launchGame()` but it didn't exist
- **After:** launchGame is properly exposed to window object
- **Result:** Game launches automatically after intro completes

---

## Quick Verification Checklist

- [ ] Game loads (menu appears)
- [ ] Intro cutscene plays
- [ ] No black screen after intro (world appears)
- [ ] Can move with WASD
- [ ] Can shoot with click
- [ ] Can interact with NPC (Press F)
- [ ] Console shows no critical errors (yellow warnings OK)
- [ ] All diagnostics pass

---

## Next Steps If Everything Works ✅

Once verified working:
1. **Test Story Progression** - Complete quests and dialogues
2. **Test Multiplayer** (optional) - Host/Join games
3. **Test Editor** - Press F2 to spawn objects
4. **Test Persistence** - Reload page, check "Resume Game" option
5. **Performance** - Check FPS in console, should be 30-60

---

**Status:** Game is now FIXED and READY FOR TESTING 🎮
