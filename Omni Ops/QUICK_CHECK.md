# OMNI-OPS Quick Verification Checklist

## 🎮 Game Flow - Step-by-Step
Opens `index.html` and follow this flow to verify all critical systems work:

### 1. Loading ✓
- [ ] See "⚡ OMNI-OPS" loading screen
- [ ] Progress bar fills from 0% to 100%
- [ ] See module list updating (Core Game → Story → Living World → etc.)
- [ ] Message changes to "All systems ready!"

**If stuck:** Check browser console for module load errors

---

### 2. Main Menu ✓
- [ ] Loading screen fades/disappears
- [ ] Menu overlay appears with dark background
- [ ] See "⚡ OMNI-OPS" title and "THE HEROES OF ALBION" subtitle
- [ ] See 4 buttons:
  - 📖 Start Story
  - 🎮 Quick Play
  - 🌐 New Game (Host)
  - 🔗 Join Game

**If stuck:** Try pressing F12 to open console, check for JavaScript errors

---

### 3. Start Story Mode ✓
- [ ] Click "📖 Start Story" button
- [ ] Menu fades away
- [ ] Black screen briefly (normal - loading 3D scene)
- [ ] **Intro cutscene begins playing**
  - Monastery ruins appear
  - Fire/destruction animation
  - Narration text displays

**Can skip:** Press SPACE to skip intro (optional)

---

### ⚠️ CRITICAL: Post-Intro Game Load
- [ ] Intro finishes completely (5 phases total)
- [ ] **Game automatically launches** (THIS WAS THE BUG - should work now)
- [ ] You see the 3D game world:
  - Blue sky background
  - Terrain with paths
  - Buildings visible
  - NPCs walking around
- [ ] **NOT:** Black screen, hanging, or infinite loop

**If THIS fails:** See "Troubleshooting" section below

---

### 4. Gameplay Basics ✓

#### Movement
- [ ] Press W, A, S, D keys
- [ ] Player moves forward/left/back/right
- [ ] Move mouse to look around
- [ ] Hold Shift to sprint

#### HUD Display
- [ ] Top-left shows: Room ID, Time (clock)
- [ ] Bottom-left shows: Ammo count, Health
- [ ] **Time should increment:**
  - Format: HH:MM (like 03:45)
  - Updates roughly every second
  - Never goes backwards

#### Shooting
- [ ] Click mouse to shoot
- [ ] Should hear cocking/fire sound
- [ ] Ammo count decreases
- [ ] Press R to reload
- [ ] Reserve ammo decreases (first number)
- [ ] Press V to toggle SEMI/AUTO mode in HUD

---

### 5. Living World ✓

#### NPC Visibility
- [ ] Walk around game world
- [ ] See NPCs walking on paths
- [ ] NPCs changed appearance (some have helmets, different colors)
- [ ] NPCs follow schedules (some near buildings, some on paths)
- [ ] Should see at least 5-10 NPCs visible

#### Buildings
- [ ] See at least 6 major structures:
  - Tavern (largest, gathering place)
  - Blacksmith (workshop area)
  - Farm (with crop patterns)
  - Temple (religious structure)
  - Market (trading area)
  - Alchemist (potion shop)

#### Day/Night Cycle
- [ ] Game clock in HUD increments
- [ ] Once every ~20 seconds, sky color changes slightly
- [ ] Schedule of NPCs changes based on time:
  - 22:00-06:00 (Night) - darker, fewer NPCs out
  - 06:00-22:00 (Day) - brighter, more NPCs active

---

### 6. Interaction System ✓

#### F-Key Interaction
- [ ] Walk near an NPC
- [ ] At close range, see prompt: **"Press F to interact"**
- [ ] This prompt appears near bottom-center of screen
- [ ] Prompt disappears when far away

#### Dialogue Box Opens
- [ ] Press F while prompt visible
- [ ] Dialogue box appears (bottom-center, green border)
- [ ] In dialogue box, see:
  - [ ] NPC name (gold/yellow text)
  - [ ] Faction name (gray text)
  - [ ] Dialogue text (green text)
  - [ ] **Dialogue options below** (2-4 options)

#### Dialogue Options Work
- [ ] Each option has green border and can click it
- [ ] Hover over option: turns brighter green, might shift slightly
- [ ] Click option: dialogue updates or closes

#### Dialogue Closes
- [ ] After interaction, dialogue box disappears
- [ ] Controls return to normal (can move, shoot, etc.)

---

### 7. Menu Systems ✓

#### Pipboy Menu (I Key)
- [ ] Press I key
- [ ] Panel slides in from right side
- [ ] Shows "PIP-BOY 3000" title
- [ ] Press I again to close

#### Editor (F2 Key)
- [ ] Press F2
- [ ] Editor panel appears (usually in a corner)
- [ ] Can see spawning options, object properties
- [ ] Press F2 again to close

---

### 8. Console Diagnostics (Optional) ✓

Run this in browser console (F12):
```javascript
OmniDiagnostics.runAllChecks()
```

Expected output:
- 20+ checks
- Most should show ✓ PASS
- 0 or 1 failures acceptable
- Shows summary: "Passed: 20"

---

## 🚨 Troubleshooting

### ❌ Problem: Black Screen After Intro
**What it looks like:** Intro finishes, everything goes black

**Quick Fix:**
1. Open browser console (F12)
2. Type: `window.launchGame()`
3. Press Enter
4. If game appears, the fix worked but may have timing issue

**Root Cause Check:**
```javascript
console.log(GameStory.currentState)  // Should show "INTRO_COMPLETE"
```

**What Should See:**
- Game world loads
- Can see 3D rendered scene
- NPCs visible
- HUD shows ammo/health

---

### ❌ Problem: Infinite Intro Loop
**What it looks like:** Intro plays, ends, immediately starts again

**Quick Fix:**
1. Open console (F12)
2. Type: `GameStory.skipIntro()`
3. This should break the loop and launch game

**Root Cause Check:**
- Check [js/omni-story.js line 454](js/omni-story.js#L454) - should call `launchGame()` directly
- Check [js/omni-core-game.js line 317](js/omni-core-game.js#L317) - startMode should have state check

---

### ❌ Problem: No NPCs Visible
**What it looks like:** Game loads fine, but no NPCs walking around

**Check:**
```javascript
console.log('NPC count:', LivingWorldNPCs.npcs.length)
console.log('Buildings:', LivingWorldNPCs.buildings.length)
```

**Expected:**
- NPC count: 20-40
- Buildings: 6-10

**If count is 0:**
- LivingWorldNPCs.init() may have failed
- Check console for initialization errors
- Try reloading page

---

### ❌ Problem: Dialogue Box Won't Open
**What it looks like:** Press F but nothing happens

**Check:**
```javascript
console.log('Game active:', gameState.isGameActive)
console.log('In dialogue:', gameState.isInDialogue)
```

**Expected:**
- gameActive: true
- isInDialogue: false (until you press F)

**If still not working:**
1. Make sure close to NPC (within interaction range)
2. Check dialogue-box exists: `document.getElementById('dialogue-box')`
3. Try: `openInteractionMenu({name: 'Test', faction: 'Test'})`

---

### ❌ Problem: Controls Don't Respond
**What it looks like:** Can't move with WASD, can't shoot

**Check:**
1. Click on game window (ensure it has focus)
2. Try pressing F to request pointer lock
3. If still stuck, check: `console.log(document.pointerLockElement)`

**If nothing works:**
- Reload page
- Check for menu overlay blocking input: `document.getElementById('menu-overlay').style.display`
- Should be 'none' during gameplay

---

### ❌ Problem: FPS Stuttering
**What it looks like:** Game feels choppy/laggy

**Check Frame Rate:**
```javascript
// Paste this in console
let fps = 0; let lastTime = Date.now();
setInterval(() => {
  console.log('FPS:', fps);
  fps = 0;
}, 1000);
// In animation loop it will count - check output
```

**Expected:** 30-60 FPS depending on hardware

**If low (< 15 FPS):**
1. Try in different browser
2. Close other tabs/programs
3. Reduce NPC count (game still playable, just fewer NPCs)

---

### ❌ Problem: No Sound Effects
**What it looks like:** Click to shoot but no sound

**Check:**
```javascript
console.log('Audio context:', player.audioContext)
console.log('Audio state:', player.audioContext ? player.audioContext.state : 'undefined')
```

**Solutions:**
1. Unmute browser tab (some browsers mute by default)
2. Check browser hasn't disabled audio
3. Audio Context state should be "running"

---

## ✅ Success Checklist

Mark these off to confirm game is working:

### Core Systems
- [ ] Game loads and reaches menu
- [ ] Intro cutscene plays end-to-end
- [ ] Game launches after intro (no black screen)
- [ ] Player appears in 3D world

### Living World
- [ ] Buildings visible (6 types)
- [ ] NPCs appear and walk around
- [ ] Day/night cycle working (sky changes)
- [ ] Clock increments (HUD time updates)

### Gameplay
- [ ] Player can move (WASD)
- [ ] Player can look (Mouse)
- [ ] Player can shoot (Click)
- [ ] Ammo updates (decreases when firing)
- [ ] Reload works (R key)

### Interaction
- [ ] Interaction prompt appears when near NPC
- [ ] F-key opens dialogue box
- [ ] Dialogue shows NPC name and text
- [ ] Can click dialogue options
- [ ] Dialogue closes properly

### UI/Menus
- [ ] HUD shows ammo and health
- [ ] Pipboy opens (I key)
- [ ] Editor opens (F2 key)
- [ ] Menu buttons work

### Error State
- [ ] Console shows no red error messages
- [ ] Console shows initialization success logs
- [ ] Game doesn't hang or freeze

---

## 🎮 Quick Key Reference

| Action | Key |
|--------|-----|
| Move Forward | W |
| Move Left | A |
| Move Back | S |
| Move Right | D |
| Look Around | Mouse |
| Sprint | Shift |
| Lean Left | Q |
| Lean Right | E |
| Shoot | Left Click |
| Reload | R |
| Fire Mode | V |
| Interact with NPC | F |
| Open Pipboy | I |
| Open Editor | F2 |
| Main Menu | Escape (if implemented) |
| Skip Intro | Space |

---

## 🔍 When In Doubt

1. **Open browser console:** F12 or Right-click → Inspect
2. **Check for red errors:** Look at "Console" tab
3. **Run diagnostics:** `OmniDiagnostics.runAllChecks()`
4. **Check game state:** `console.log(gameState)`
5. **See full test guide:** Open [TESTING_GUIDE.md](TESTING_GUIDE.md)
6. **Bug details:** Read [BUGFIX_SUMMARY.md](BUGFIX_SUMMARY.md)

---

## 📞 If All Else Fails

```javascript
// Nuclear option - reset everything
localStorage.clear();
location.reload();
```

This clears all saved state and reloads the page fresh.

**Expected:** Game loads from scratch, intro plays, game launches

---

**Status:** ✅ Ready to test
**Last Updated:** [Date of bugfix deployment]
**Contact:** Game issues or feature requests
