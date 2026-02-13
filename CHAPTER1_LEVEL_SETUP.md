# OMNI-OPS Chapter 1 "Cold Boot" - Level Setup

## Overview
Chapter 1 now spawns the player in a proper greybox starting room instead of an empty black void.

---

## Level Geometry: Start Room Corridor

**Dimensions:** 20m wide × 80m deep × 6m tall  
**Style:** Greybox with dark materials, cyan accent lights, visible doorway landmark  
**Atmosphere:** Dark (0x0a0a0a background), light fog, point lights for ambient illumination

### Room Elements:

- **Floor**: 20m × 80m, dark grey (0x333333)
- **Walls**: Left/Right walls along full length, Back wall behind player
- **Doorway Landmark**: Glowing cyan doorframe at far end (z=78-80)
  - Provides clear spatial goal for "move forward"
  - Visual destination players naturally move toward
- **Ceiling**: Partial panel coverage for atmosphere
- **Lighting**: 3 cyan point lights distributed along corridor (z=20, 40, 60)
- **Path Marker**: Glowing floor decal near doorway (z=70) to guide player

---

## Player Spawn

**Position:** `(0, 1.6, 5)`  
**Facing:** Forward (+Z direction) toward doorway  
**Environment:** Dark atmosphere, light fog, clear forward path visible

---

## Spatial Layout (Top-Down View)

```
Z-AXIS (Forward/Backward)
↑
│
80m ──────────────────────────────────────────────
│         ╔═══════════════════╗  ← DOORWAY (Landmark)
│         ║                   ║     - Glowing cyan frame
│         ║                   ║     - EXIT_DOOR_01 (z=75)
75m ───────                   ───────
│      
70m         [Path Marker]  ← Glowing floor hint
│      
60m         [Light ●]      ← Point light
│      
50m
│      
40m   ●                ●   ← TERMINAL_01 (right side, z=35)
│   [Light]                  Point light (z=40)
35m
│      
30m
│      
20m   ●                    ← Point light (left side, z=20)
│      
15m   ●                    ← WORKBENCH_01 (left side)
│      
12m       [TUT_MOVEMENT]   ← Movement tutorial trigger
│      
8m        [TUT_LOOK]       ← Look tutorial trigger
│      
5m          ★              ← PLAYER SPAWN (0, 1.6, 5)
│      
0m ════════════════════════ ← BACK WALL
    -10m   -5    0    5   10m
         X-AXIS (Left/Right)
```

---

## Trigger Positions (Relative to Player Spawn)

### Tutorial Triggers
1. **TUT_LOOK_TRIGGER**
   - Position: `(0, 1, 8)` — 3m ahead of spawn
   - Radius: 3m
   - Triggers: "Camera Control" tutorial on entry
   - Objective: `OBJ_C1_WAKE`

2. **TUT_MOVEMENT_TRIGGER**
   - Position: `(0, 1, 12)` — 7m ahead of spawn
   - Radius: 4m
   - Triggers: "Movement" tutorial (WASD controls)
   - Objective: `OBJ_C1_FIRST_MOVEMENT`

### Interactable Objects
1. **WORKBENCH_01** (Supply Cache)
   - Position: `(-7, 1, 15)` — Left wall, 10m ahead
   - Objective: `OBJ_C1_SCAVENGE_GEAR`
   - Interaction: "Scavenge Equipment [F]"

2. **TERMINAL_01** (Archive Terminal)
   - Position: `(7, 1, 35)` — Right wall, 30m ahead
   - Objective: `OBJ_C1_UNDERSTAND_THREAT`
   - Interaction: "Access Terminal [F]"

3. **EXIT_DOOR_01** (Archive Exit)
   - Position: `(0, 1, 75)` — At doorway, 70m ahead
   - Objective: `OBJ_C1_REACH_HUB_EXIT`
   - Interaction: "Exit Archive [F]"

### Future Zone Triggers (Beyond Room)
4. **BUFFER_ZONE_ENTRY** — `(0, 1, 78)` — At doorway threshold
5. **CORRUPTION_FIELD_01** — `(0, 1, 100)` — Beyond door (future level section)
6. **NODE_ENTRANCE** — `(0, 1, 150)` — Far ahead (future level section)

---

## Implementation Files

### Level Generation
**File:** `js/omni-ops-chapter1-integration.js`

**Function:** `createChapter1StartRoom()`  
- Creates floor, walls, ceiling, doorway landmark
- Adds point lights and visual hints
- Materials: Dark grey walls (0x444444), black floor (0x333333), cyan accents (0x00ff88)

**Function:** `setChapter1PlayerSpawn()`  
- Sets `cameraRig.position` to `(0, 1.6, 5)`
- Orients camera forward toward doorway
- Updates scene background to dark atmosphere

### Data Configuration
**File:** `js/omni-ops-data-chapter1.js`

**Arrays:**
- `interactables`: 3 objects positioned in corridor
- `zoneTriggers`: 6 triggers for tutorials and progression

### Scripting
**File:** `js/omni-ops-chapter1.js`

**Functions:**
- `_checkZoneTriggers()`: Detects player proximity to triggers
- `_onZoneTrigger(trigger)`: Handles tutorial display and objective progression
- `showTutorial(tutorialId)`: Displays tutorial UI

---

## Changes Made

1. ✅ **Created greybox start room** instead of spawning in empty void
2. ✅ **Positioned player spawn** at back of room facing forward
3. ✅ **Added visible doorway landmark** so "move forward" has clear goal
4. ✅ **Repositioned all triggers** inside corridor relative to player spawn
5. ✅ **Repositioned all interactables** along corridor walls
6. ✅ **Added tutorial trigger zones** for TUT_LOOK and TUT_MOVEMENT
7. ✅ **Updated zone trigger handler** to support tutorial triggers
8. ✅ **Set dark atmosphere** (black background, fog, cyan lighting)

---

## Testing the Setup

When you start Chapter 1:
1. Player spawns at back of dark corridor
2. Cyan lights provide ambient illumination
3. Glowing doorway visible 70m ahead provides clear navigation goal
4. Tutorial triggers fire as player moves forward
5. Interactables (supply cache, terminal) are visible along walls
6. All existing Chapter 1 scripting (HUD, ARIA VO, objectives) functions unchanged

---

## Next Steps (Optional Expansion)

- **Add visual corruption effects** to walls/ceiling (glitch shaders, flickering)
- **Spawn low-poly debris/props** for environmental storytelling
- **Create second corridor section** beyond doorway for Buffer Zone entry
- **Add ambient audio** (server hum, electrical buzz, distant Admin processes)
