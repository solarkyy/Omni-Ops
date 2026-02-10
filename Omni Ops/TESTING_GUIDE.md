# OMNI-OPS Testing & Verification Guide

## Quick Start - Game Flow Testing

### Step 1: Load the Game
1. Open `index.html` in a web browser
2. You should see:
   - **Loading Screen** with "⚡ OMNI-OPS" logo and progress bar
   - Module loading status (Core Game → Story System → Living World → Story Integration → etc.)
   - Status: "All systems ready!" when complete

### Step 2: Main Menu
After loading completes, you should see:
- **Menu Title:** "⚡ OMNI-OPS" with subtitle "THE HEROES OF ALBION"
- **4 Menu Buttons:**
  - 📖 Start Story (recommended for first test)
  - 🎮 Quick Play
  - 🌐 New Game (Host) - for multiplayer
  - 🔗 Join Game - for multiplayer

### Step 3: Start Story Mode (Recommended)
1. Click **"📖 Start Story"**
2. You should see the **5-phase animated intro cutscene**:
   - Phase 1: Monastery ruins appear
   - Phase 2: Fire and destruction animation
   - Phase 3-5: Narration about the curse
3. **Skip button (SPACE)** should work to skip intro
4. After intro completes → **Game should auto-launch**

⚠️ **CRITICAL POINT:** If stuck here, the infinite loop bug is still active. See Troubleshooting below.

### Step 4: Gameplay Screen Load
Once game launches, you should see:
- **3D World** with blue sky background
- **Living world elements:**
  - Buildings visible (Tavern, Blacksmith, Temple, Farm, etc.)
  - NPCs walking around with schedules
  - Terrain with paths and forest
- **HUD Display (top-left):**
  ```
  LOCAL_HOST
  00:00 (game time clock)
  ```
- **HUD Display (bottom-left):**
  ```
  Ammo: 30 / 90
  HP: 100
  ```
- **Player able to move** with WASD keys and mouse to look around

### Step 5: Test Core Systems
**Player Movement:**
- WASD keys move player forward/back/strafe
- Mouse moves camera view
- Hold Shift to sprint (increases FOV slightly, drains stamina)
- Q/E keys to lean left/right

**Weapon System:**
- Left-click to shoot (should see muzzle flash and hear sound)
- Press R to reload
- Look at ammo count - should decrease/restock
- Press V to toggle fire mode (SEMI / AUTO)

**NPC Interaction:**
- Walk near an NPC
- "Press F to interact" prompt should appear near bottom-center
- Press F to open dialogue
- You should see:
  - NPC name in gold text
  - Faction in gray text
  - Dialogue text in green
  - **Dialogue options** with nice styling (green border, hover effect)
- Click dialogue option to respond

**Game Menu (Pipboy):**
- Press I to open Pipboy menu (right panel)
- Should show Stats, Reputation, Map tabs
- Press I again to close

**Game Editor:**
- Press F2 to open editor
- You can spawn objects and test systems
- Press F2 again to close

**Day/Night Cycle:**
- Watch the clock in HUD
- Sun should change color intensity
- 0-6 hours: Night (dark blue sky)
- 6-18 hours: Day (bright)
- 18-22 hours: Evening (orange/red)
- 22-24 hours: Night

---

## Automated Diagnostics

### How to Run Diagnostics
1. Open **Browser Console** (F12 → Console tab)
2. Type: `OmniDiagnostics.runAllChecks()`
3. Press Enter

### Expected Output
You should see organized test results showing PASS/FAIL for:
- **Module Loading:** Three.js, Scene, Renderer, Camera
- **Game State:** gameState, player object
- **Systems:** Story system, Living World, Lighting
- **DOM Elements:** All UI elements properly created
- **Functions:** All critical functions available

Example output:
```
[HH:MM:SS] [SYSTEM] ====== OMNI-OPS DIAGNOSTIC SUITE ======
[HH:MM:SS] [PASS] ✓ Module Load - Three.js
[HH:MM:SS] [PASS] ✓ DOM Element - Game Container
[HH:MM:SS] [PASS] ✓ Story System Module
[HH:MM:SS] [PASS] ✓ Three.js Scene Creation
... (20+ checks)
[HH:MM:SS] [SYSTEM] ====== DIAGNOSTIC SUMMARY ======
[HH:MM:SS] [INFO] Passed: 20
[HH:MM:SS] [INFO] Failed: 0
[HH:MM:SS] [INFO] Warnings: 1
```

---

## System-by-System Verification

### 1. Core Rendering ✅
**What to Check:**
- [ ] Game window shows 3D rendered world
- [ ] Sky is blue (0x87ceeb color)
- [ ] Lighting appears natural (not pure black or white)
- [ ] Objects have shadows

**If Failed:**
- Check browser console for THREE.js errors
- Verify WebGL is supported: `console.log(THREE.WebGLRenderer)`
- Try a different browser (Chrome, Firefox recommended)

### 2. Living World System ✅
**What to Check:**
- [ ] NPCs visible in game world (should see at least 5-10)
- [ ] NPCs move and walk around
- [ ] All 6 buildings spawn: Tavern, Blacksmith, Farm, Temple, Market, Alchemist
- [ ] Buildings have proper placement and size

**Test Commands:**
- `console.log(LivingWorldNPCs.npcs.length)` - shows NPC count
- `console.log(LivingWorldNPCs.buildings.length)` - shows building count

**If Failed:**
- Check console for LivingWorldNPCs initialization errors
- Verify buildings spawn: Look for recognizable structures
- If no NPCs appear: Check job assignment system

### 3. Story System ✅
**What to Check:**
- [ ] Intro cutscene plays (5 phases visible)
- [ ] Narration text appears
- [ ] Intro can be skipped with SPACE
- [ ] Game loads after intro completes (no infinite loop)

**Test Commands:**
- `console.log(GameStory.currentState)` - should show next state after INTRO_COMPLETE
- `GameStory.skipIntro()` - manually skip if testing

**If Failed:** See "Infinite Loop Bug" in Troubleshooting

### 4. NPC Interaction & Dialogue ✅
**What to Check:**
- [ ] Interaction prompt appears when near NPC (text: "Press F to interact")
- [ ] Pressing F opens dialogue box
- [ ] Dialogue box shows NPC name (gold color)
- [ ] Dialogue box shows faction name (gray)
- [ ] Dialogue options appear with proper styling
- [ ] Can click options without crashing

**If Failed:**
- Verify F-key binding: `console.log('F-key test')`
- Check dialogue HTML elements exist
- Verify interaction raycast working: Walk around NPCs

### 5. Combat System ✅
**What to Check:**
- [ ] Click to shoot (should see muzzle flash/hear sound)
- [ ] Ammo count decreases
- [ ] R key reloads
- [ ] Reserve ammo decreases when reloading
- [ ] V key toggles fire mode (SEMI ↔ AUTO)

**Test Commands:**
- `console.log(player.ammo)` - shows current magazine ammo
- `console.log(player.reserveAmmo)` - shows reserve ammo

**If Failed:**
- Check audio system: Verify Web Audio API working
- Check ammo display updates in HUD
- Verify click/fire input working

### 6. HUD Display ✅
**What to Check:**
- [ ] Clock shows time (format HH:MM)
- [ ] Clock updates every second (game second)
- [ ] Ammo display: "Ammo: X / Y"
- [ ] Health display: "HP: 100"
- [ ] Room ID shows in corner

**If Failed:**
- Check elements exist: `document.getElementById('world-clock')`
- Verify update functions: `console.log(gameState.time)`

### 7. UI/Menu System ✅
**What to Check:**
- [ ] Main menu appears on load
- [ ] Menu buttons clickable
- [ ] Menu overlays dark background
- [ ] Buttons have hover effects (green highlight)
- [ ] Menu disappears when game starts

**If Failed:**
- Check CSS styles loaded
- Verify menu-overlay visibility
- Check button onclick handlers

### 8. Persistence (Save/Load) ✅
**What to Check:**
- [ ] Press F2 to open editor
- [ ] Click "SAVE WORLD" button
- [ ] Get success message in console
- [ ] Close browser
- [ ] Reopen and check "Resume Game" button appears

**If Failed:**
- Check localStorage available: `console.log(localStorage)`
- Verify save data exists: `console.log(localStorage.getItem('omni_world_save'))`

---

## Troubleshooting

### ❌ Problem: Black Screen After Intro
**Symptoms:** Intro plays fine, then screen goes black/doesn't load game

**Solution:**
1. **Open Console (F12)** and check for errors
2. **Expected fix already applied:** startMode() checks if intro was already played
3. **Manual check:** `console.log(GameStory.currentState)` should show "INTRO_COMPLETE"
4. **If not working:** Check launchGame() error messages in console

**Debug Command:**
```javascript
// Manually trigger game launch
window.launchGame();
```

### ❌ Problem: Infinite Loop (Intro repeats forever)
**Symptoms:** Intro plays, ends, immediately restarts

**Root Cause:** startMode() → GameStory.startIntro() → startMode() loop

**Solution Applied (verify in code):**
- Check [js/omni-core-game.js](js/omni-core-game.js#L315-L329) - startMode() should check `GameStory.currentState !== 'INTRO_COMPLETE'`
- Check [js/omni-story.js](js/omni-story.js#L454) - completeIntro() should call `window.launchGame()` directly

**Verify Fix:**
```javascript
console.log(GameStory.currentState); // Should NOT be 'STARTING_INTRO'
// Try manually launching game:
window.launchGame();
```

### ❌ Problem: NPCs Not Visible
**Symptoms:** Game loads but no NPCs in world

**Solutions:**
1. Check LivingWorldNPCs initialized:
   ```javascript
   console.log(LivingWorldNPCs.npcs.length);
   ```
2. Check initGame() was called without errors
3. Verify buildings spawned:
   ```javascript
   console.log(scene.children.length); // Should be 50+
   ```

### ❌ Problem: Dialogue Box Doesn't Appear
**Symptoms:** Press F but no dialogue box shows

**Solutions:**
1. Verify interaction worked:
   ```javascript
   console.log(gameState.isInDialogue); // Should be true
   ```
2. Check dialogue-box exists:
   ```javascript
   document.getElementById('dialogue-box').style.display = 'flex';
   ```
3. Verify interaction raycast hit NPC:
   ```javascript
   console.log('Interaction triggered');
   ```

### ❌ Problem: Controls Not Responding
**Symptoms:** Can't move, can't interact

**Solutions:**
1. Check pointer lock not requested (game in menu):
   ```javascript
   console.log(document.pointerLockElement); // Should be canvas
   ```
2. Check isGameActive flag:
   ```javascript
   console.log(gameState.isGameActive);
   ```
3. Click on game window to focus
4. Check for menu overlay blocking input

### ❌ Problem: Janky Animation / Low FPS
**Symptoms:** Game stutters, animation feel choppy

**Solutions:**
1. Check frame rate:
   ```javascript
   // Add to console monitor FPS
   let lastTime = Date.now(), frames = 0;
   setInterval(() => {
       frames++;
       if (Date.now() - lastTime >= 1000) {
           console.log('FPS:', frames);
           frames = 0;
           lastTime = Date.now();
       }
   }, 16);
   ```
2. Reduce settings:
   - Fewer NPCs
   - Simpler world gen
   - Disable shadows
3. Check for console errors causing slowdown

### ❌ Problem: Audio Not Working
**Symptoms:** No sound effects when shooting

**Solutions:**
1. Check Web Audio API available:
   ```javascript
   console.log(AudioContext || webkitAudioContext);
   ```
2. Check browser doesn't have audio disabled
3. Unmute browser tab (some browsers require user interaction first)
4. Test: `player.audioContext` should exist

### ❌ Problem: Module Loading Stuck
**Symptoms:** Loading bar freezes, never reaches 100%

**Solutions:**
1. Check browser console for specific module errors
2. Open Network tab in DevTools - see which file failed to load
3. Common issues:
   - File not found (404 error)
   - Syntax error in JavaScript
   - CORS issue (unlikely on local file)
4. Verify file paths start from root: `/js/` not `./js/`

### ❌ Problem: Menu Button Click Not Working
**Symptoms:** Click button but nothing happens

**Solutions:**
1. Check initializeUI was called:
   ```javascript
   console.log(typeof window.initializeUI);
   ```
2. Try manually starting story:
   ```javascript
   window.startMode('STORY');
   ```
3. Check for JavaScript errors in console
4. Verify button element exists:
   ```javascript
   document.getElementById('btn-story-start').click();
   ```

---

## Complete Verification Checklist

Use this when testing complete game flow:

- [ ] **Loading Phase**
  - [ ] Loading screen displays
  - [ ] Progress bar fills
  - [ ] All modules load without errors
  - [ ] "All systems ready!" message appears

- [ ] **Menu Phase**
  - [ ] Main menu displays
  - [ ] All buttons visible
  - [ ] Button hovers work (color change)
  - [ ] Menu overlay is dark/semi-transparent

- [ ] **Story Mode Launch**
  - [ ] Click "Start Story"
  - [ ] Menu fades/closes
  - [ ] Intro cutscene begins

- [ ] **Intro Cutscene**
  - [ ] 5 phases animate
  - [ ] Narration text appears
  - [ ] Visual effects visible
  - [ ] SPACE skips intro
  - [ ] Intro completes without error

- [ ] **Game Load (CRITICAL)**
  - [ ] Game renders 3D world
  - [ ] No black screen
  - [ ] No infinite loop
  - [ ] Player spawns
  - [ ] HUD displays

- [ ] **Living World Verification**
  - [ ] Buildings visible
  - [ ] NPCs walking
  - [ ] Day/night cycle working
  - [ ] Clock incrementing

- [ ] **Interaction Testing**
  - [ ] Walk near NPC
  - [ ] "Press F" prompt appears
  - [ ] Press F opens dialogue
  - [ ] Dialogue has NPC name
  - [ ] Can click options
  - [ ] Closes properly

- [ ] **Combat Testing**
  - [ ] Can shoot (click)
  - [ ] Ammo decreases
  - [ ] Can reload (R)
  - [ ] Fire mode toggles (V)
  - [ ] Sound works

- [ ] **Systems Operational**
  - [ ] Can move (WASD)
  - [ ] Can look (Mouse)
  - [ ] Can sprint (Shift)
  - [ ] Can open Pipboy (I)
  - [ ] Can open Editor (F2)

---

## Quick Console Commands Reference

```javascript
// Diagnostics
OmniDiagnostics.runAllChecks()

// Game State
console.log(gameState)
console.log('Game Active:', gameState.isGameActive)
console.log('Player Health:', player.health)
console.log('Player Ammo:', player.ammo, '/', player.reserveAmmo)

// Story System
console.log('Story State:', GameStory.currentState)
GameStory.skipIntro()  // Force skip intro
window.launchGame()     // Force launch game

// Living World
console.log('NPCs:', LivingWorldNPCs.npcs.length)
console.log('Buildings:', LivingWorldNPCs.buildings.length)

// Scene
console.log('3D Objects:', scene.children.length)

// Testing
window.startMode('SINGLE')  // Start quick play
window.startMode('STORY')   // Start story mode
```

---

## Success Indicators

Your game is **working correctly** when:

✅ Full game flow completes without errors
✅ Intro cutscene plays and game launches after
✅ Can interact with NPCs using F key
✅ Combat system responds to clicks/inputs
✅ HUD displays and updates properly
✅ Living world NPCs visible and moving
✅ No console errors that break gameplay
✅ Menu system responsive and functional

---

## Next Steps After Verification

1. **Test all quests/story paths**
2. **Test multiplayer (if needed)**
3. **Performance optimization** (if FPS < 60)
4. **Content expansion** (more NPCs, quests, buildings)
5. **Balance gameplay** (difficulty, weapon balance)

Good luck, Commander! 🎮
