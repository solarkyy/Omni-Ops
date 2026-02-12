# 🎯 CLINE EXECUTABLE TASK - Wall Running Feature

**START HERE CLINE** - Copy this entire file and paste into Cline chat, then tell Cline: "Execute this task"

---

## TASK OBJECTIVE

Implement a **Matrix-style wall running mechanic** in the Three.js game at `c:\Users\kjoly\OneDrive\Desktop\Omni Ops\index.html`

### Feature Requirements
- **Wall Detection**: Use raycasts to detect when player is near walls
- **Wall Running Physics**: Apply 5% reduced gravity when on wall
- **Camera Tilt**: Tilt camera 15-30° toward the wall while running
- **Exit Mechanism**: Player exits wall running on jump or direction change
- **Audio**: Play wall-specific footstep sounds (3 variations)
- **Toggle**: Activate/deactivate with X key
- **Performance**: Maintain 60fps during wall running

---

## FILES TO MODIFY

### Primary File: `js/omni-core-game.js`

This file contains the game engine. You need to add wall running to the player physics system.

**Current Player Object Location**: Search for `this.player = {` around line 2900

**Add these new properties to player object:**
```javascript
// Wall Running Properties
wallRunning: false,
onWall: false,
wallNormal: new THREE.Vector3(0, 0, 0),
wallDirection: new THREE.Vector3(0, 0, 0),
cameraTiltTarget: 0,
```

---

## IMPLEMENTATION STEPS

### Step 1: Wall Detection System
Create a function to detect walls using raycasts:
```javascript
detectWallRunning() {
  // Cast rays in 8 directions around the player
  // If ray hits something within 2 units, player is near wall
  // Store the wall normal for physics calculation
  // Return true if valid wall found
}
```

**Where**: Add before player.update() call (search for "player.update()")

**What it does**:
- Sends invisible rays from player in cardinal directions
- Detects walls, obstacles within 2 units
- Stores wall information for physics

### Step 2: Wall Running Physics
Modify gravity when on wall:
```javascript
if (player.wallRunning && player.onWall) {
  // Reduce gravity to 5% while on wall
  // Apply slight friction along wall surface
  // Keep player "stuck" to wall
}
```

**Where**: In player.update() physics section (search for "gravity")

**What it does**:
- Reduces downward acceleration
- Maintains wall contact
- Allows sliding smoothly down walls

### Step 3: Camera Tilt
Rotate camera toward wall:
```javascript
if (player.wallRunning && player.onWall) {
  // Smoothly tilt camera toward wall normal
  // Clamp rotation between 15° and 30°
  // Use lerp for smooth transitions
}
```

**Where**: In camera.update() or controls section (search for "camera.rotation")

**What it does**:
- Makes camera tilt in direction of wall
- Creates cinematic "on wall" feeling
- Smooth animation, not snappy

### Step 4: Exit Wall Running
Stop when player jumps or changes direction:
```javascript
if (playerInput.jump || playerInput.directionChanged) {
  player.wallRunning = false
  player.onWall = false
  // Restore camera to normal
}
```

**Where**: In input handling section (search for "playerInput.jump")

**What it does**:
- Exits wall running when jumping
- Exits when moving away from wall
- Resets camera to normal

### Step 5: Audio System
Play footstep sounds while wall running:
```javascript
if (player.wallRunning && footstepTimer > 0.3) {
  // Pick random variation (3 total)
  // Play wall-specific footstep
  // Reset timer
}
```

**Where**: In player.update() audio section (search for "footstep")

**What it does**:
- Plays sound every 0.3 seconds while on wall
- Uses 3 different audio files for variety
- Different pitch/tone than normal footsteps

### Step 6: X Key Toggle
Add input detection:
```javascript
if (input.key === 'x' || input.key === 'X') {
  player.wallRunning = !player.wallRunning
}
```

**Where**: In input handler (search for "keydown")

**What it does**:
- Allows player to enable/disable feature
- Toggles on/off with X key

---

## TEST CASES (14 Total)

After implementation, verify these all pass:

```
1. ✅ Wall Detection (Raycast) - Raycasts properly detect walls
2. ✅ Wall Stick Speed - Player sticks to wall within 2 frames
3. ✅ Physics (Gravity 5%) - Gravity reduces to 5% on walls
4. ✅ Camera Tilt (15°) - Camera tilts minimum 15°
5. ✅ Camera Tilt (30°) - Camera tilts maximum 30°
6. ✅ Toggle with X Key - X key toggles feature on/off
7. ✅ Exit on Jump - Jump exits wall running
8. ✅ Exit on Direction Change - Changing direction exits
9. ✅ Footstep Audio - Normal - Base footstep sound plays
10. ✅ Footstep Audio - Variant 1 - First variation plays
11. ✅ Footstep Audio - Variant 2 - Second variation plays
12. ✅ Wall Slide Performance - Maintains 60fps
13. ✅ Multi-wall Transitions - Can transition between walls
14. ✅ Edge Case: Corner Collision - Handles corners correctly
```

---

## BONUS FEATURES (Optional)

If you want to add extra features:
- Slow motion effect while on wall (Matrix-style)
- Particle effects for wall contact
- Extended wall running duration (6-8 seconds max)
- Combat moves while wall running
- Sound effects for wall impact

---

## SUCCESS CRITERIA

Task is complete when:
- ✅ Wall running activates with X key
- ✅ Player can run on vertical walls
- ✅ Camera tilts while wall running
- ✅ Gravity is reduced on walls
- ✅ Audio plays variations
- ✅ Feature can be toggled on/off
- ✅ All 14 test cases pass
- ✅ Performance stays at 60fps
- ✅ Player can exit by jumping or moving away

---

## HOW TO TEST

After you implement:

1. **Start game**: Open `http://localhost:8000` in browser
2. **Find a wall**: Navigate to vertical surface in game
3. **Press X**: Activate wall running
4. **Run into wall**: Player should stick to vertical surface
5. **Check camera**: Camera should tilt toward wall
6. **Listen for audio**: Wall footsteps should play
7. **Jump**: Should exit wall running
8. **Press X again**: Should toggle feature off

---

## FILES & DIRECTORIES

**Main implementation file:**
- `js/omni-core-game.js` - Add all features here

**Test file:**
- `test_ai_connection.html` - Use to verify features work

**Game main file:**
- `index.html` - Game runs here

**Task tracking:**
- This file: `CLINE_EXECUTABLE_TASK.md`
- Status file: `CLINE_TASK_STATUS.json` (update as you progress)

---

## PROGRESS TRACKING

As you work, update `CLINE_TASK_STATUS.json`:

```json
{
  "task": "Wall Running - Matrix Style",
  "status": "in_progress",
  "progress_percent": 25,
  "current_step": "Step 2: Wall Running Physics",
  "completed_steps": ["Step 1: Wall Detection System"],
  "issues": [],
  "next_action": "Implement gravity reduction logic",
  "timestamp": "2026-02-11T20:00:00Z"
}
```

---

## QUESTIONS?

If you get stuck:
1. Check `js/omni-core-game.js` line numbers in comments
2. Search for existing physics code as reference
3. Look at how camera works for tilt implementation
4. Reference test cases for expected behavior

---

## FINAL DELIVERY

When complete:
1. ✅ All code in `js/omni-core-game.js`
2. ✅ Git commit with message: "feat: add matrix-style wall running"
3. ✅ All 14 tests passing
4. ✅ Update status file to "complete"
5. ✅ Push to repository

---

**Ready to implement? Start with Step 1: Wall Detection System**

This file will be monitored by the orchestration system to track your progress. Update `CLINE_TASK_STATUS.json` as you complete each step!
