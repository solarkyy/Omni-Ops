# 🎮 OMNI-OPS TESTING GUIDE

## Quick Start

### Test 1: Local Testing (Recommended First)
**URL:** `http://localhost:8000`

1. **Wait for Local Server:** Ensure Python server is running
2. **Open URL:** Navigate to `http://localhost:8000` in your browser
3. **Wait for Load:** Game should show progress bar, then loading screen
4. **Expected Result:** Game loads in ~2-5 seconds, menu appears

### Test 2: GitHub Pages Testing
**URL:** `https://solarkyy.github.io/Omni-Ops/`

1. **Wait 2 minutes:** GitHub Pages needs rebuild time after push
2. **Hard Refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. **Check for Errors:** Open DevTools (`F12`), check Console tab
4. **Expected Result:** Same as local test

---

## Console Diagnostics

### Automatic Startup Verification
After the game loads (whether stuck or working), the console should automatically show:

```
=== OMNI-OPS STARTUP VERIFICATION ===

Step 1: Module Availability
✓ Three.js: true
✓ PeerJS: true
✓ GameStory: true
✓ ModuleLoader: true
✓ OmniDiagnostics: true
✓ LivingWorldNPCs: true

Step 2: Global Functions
✓ launchGame: function
✓ startMode: function
✓ showScreen: function
✓ initializeUI: function

Step 3: Game State
✓ gameState exists
  - isGameActive: false
  - timeOfDay: 12

✓ player exists
  - health: 100
  - ammo: 30

Step 4: Critical DOM Elements
✓ game-container: found
✓ menu-overlay: found
✓ ui-layer: found
✓ dialogue-box: found
✓ loading-screen: found
✓ pipboy-menu: found

Step 5: Full Diagnostics
```

### Manual Verification Commands

If you need to verify manually, open DevTools Console (`F12`) and paste these:

```javascript
// Check module loading status
console.log('Module Status:', {
    'Three.js': typeof THREE !== 'undefined' ? '✓' : '✗',
    'GameStory': typeof GameStory !== 'undefined' ? '✓' : '✗',
    'launchGame': typeof window.launchGame === 'function' ? '✓' : '✗',
    'startMode': typeof window.startMode === 'function' ? '✓' : '✗',
    'initializeUI': typeof window.initializeUI === 'function' ? '✓' : '✗'
});

// Run full diagnostic suite
OmniDiagnostics.runAllChecks().then(result => console.log(result));
```

---

## Expected Game Flow

### Phase 1: Loading (Automatic)
- [ ] Page loads with loading screen
- [ ] Progress bar appears and fills
- [ ] Modules load one by one
- [ ] Console shows: `✓ Successfully loaded: [Module Name]`

### Phase 2: Main Menu (Should appear after loading)
- [ ] Loading screen disappears
- [ ] Blue/gray menu overlay visible
- [ ] 4 menu buttons visible:
  - 📖 Start Story
  - ⚙️ Settings
  - 👥 Multiplayer
  - 📊 Diagnostics

### Phase 3: Start Story (Click "📖 Start Story")
- [ ] Cutscene begins (5 phases)
- [ ] Press SPACE to skip
- [ ] After cutscene ends, game world loads
- [ ] 3D environment visible

### Phase 4: Game World (After cutscene)
- [ ] Press W/A/S/D to move
- [ ] Mouse to look around
- [ ] HUD visible (health, ammo, time, coordinates)
- [ ] Press I for inventory (Pip-Boy)
- [ ] Press E to interact with objects
- [ ] Press F2 to open editor

---

## Troubleshooting

### Issue: Stuck at "Initializing..."
**Possible Causes:**
1. Modules not loading → Check console for 404 errors
2. Modules loading but failing → Look for red ✗ errors
3. Module exports not available → See error names
4. JavaScript syntax errors → Check error stack traces

**Solutions:**
1. Hard refresh: `Ctrl+Shift+R`
2. Clear browser cache: DevTools > Network > Disable cache + refresh
3. Test locally first: `http://localhost:8000`
4. Check all 9 modules loaded in console

### Issue: JavaScript Errors in Console
**If you see:**
```
Uncaught ReferenceError: startMode is not defined
```

**Check:**
1. Is `omni-core-game.js` in the list of loaded modules? (Step 1)
2. If missing, check console for 404 error
3. If loaded, check console for red ✗ after module name

### Issue: Menu Appears but Buttons Don't Work
**Check:**
1. Is `omni-pipboy-system.js` loaded? (Critical for buttons)
2. Open console, click a button, look for errors
3. Common error: `Uncaught ReferenceError: startMode is not defined`
   - This means Core Game didn't load properly
   - Try hard refresh + clear cache

### Issue: Game Loads but Nothing is Visible
**Check:**
1. Is Three.js loaded? (Console must show ✓ Three.js: true)
2. Check browser console for WebGL errors
3. Try updating graphics drivers
4. Test in different browser (Chrome, Firefox)

---

## Performance Notes

### Load Times (Expected)
- **Local (http://localhost:8000):** 2-5 seconds
- **GitHub Pages (first visit):** 5-10 seconds
- **GitHub Pages (cached):** 2-5 seconds

### Module Load Order (Should see these in console)
1. ✓ Core Game
2. ✓ Multiplayer Sync
3. ✓ Story System
4. ✓ Living World
5. ✓ Story Integration
6. ✓ UE5 Editor
7. ✓ Pip-Boy System
8. ✓ Living NPC City
9. ✓ Integration Layer

---

## Advanced Debugging

### View Detailed Module Loading Log
```javascript
// Shows every module load attempt
console.log(ModuleLoader.modules);
```

### Check Game State
```javascript
// Shows current game configuration
console.log('Game State:', {
    modulesReady: window.modulesReady,
    gameActive: gameState?.isGameActive,
    playerHealth: player?.health,
    playerAmmo: player?.ammo,
    timeOfDay: gameState?.timeOfDay
});
```

### List All Window Exports
```javascript
// Shows everything exported to window
const exported = Object.keys(window).filter(k => 
    typeof window[k] === 'function' || typeof window[k] === 'object'
);
console.log('Exported Functions/Objects:', exported.slice(0, 50));
```

---

## Success Indicators

### Checklist: Game is Working ✅
- [ ] Loading screen appears and fills
- [ ] Console shows all 9 modules with ✓
- [ ] Menu appears after loading
- [ ] Can click "Start Story"
- [ ] Cutscene plays without errors
- [ ] Game world loads after cutscene
- [ ] Can move with WASD
- [ ] HUD displays correctly

### If ALL checkboxes pass:
**🎮 Congratulations! The game is working properly!**

Use the console commands in advanced debugging to verify systems are ready for gameplay testing.

---

## Need Help?

1. **Take a screenshot:** DevTools Console showing current state
2. **Copy error message:** Full error text + line number
3. **Note what's missing:**
   - Is loading bar stuck?
   - Is menu not appearing?
   - Are modules not loading?
   - Which specific buttons don't work?

4. **Test locally first:** Helps confirm if issue is local vs. GitHub Pages specific

---

## Next Steps After Successful Load

Once game loads successfully:

1. **Test Story Mode:** Click "Start Story" and play intro cutscene
2. **Test Main Gameplay:** 
   - Move around (WASD)
   - Look around (Mouse)
   - Interact with objects (E key)
   - Check HUD (top-right corner)
3. **Test Inventory:** Press I to open Pip-Boy
4. **Test Multiplayer:** Click "Multiplayer" in menu
5. **Test Editor:** Press F2 to open world editor

Each successful test means that system is ready for development!
