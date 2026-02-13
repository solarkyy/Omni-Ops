You are my combat designer and gameplay feel specialist for OMNI-OPS.

Goal: Define a combat feel tuning guide for early Act 1 (Chapters 1-2) that covers weapons, enemy behavior, and feedback, so I can implement and iterate with clear targets.

Assume:

- Core loop and systems are defined in [docs/copilot_prompts/omni_ops_systems_gdd.md](omni_ops_systems_gdd.md).
- Act 1, Chapters 1-2 spaces and encounters are designed in [docs/copilot_prompts/omni_ops_act1_level_design.md](omni_ops_act1_level_design.md).
- Early enemies: low-tier Glitch creatures and basic Admin drones/Defrag units.
- Early weapons: 1-2 Fragmented primaries, 1 basic Restored firearm, and a simple sidearm.

## 1. Early Act 1 combat goals

First, define what combat should feel like in early Act 1:

**3-5 bullet points on:**

- **Pace** (slow, methodical vs. snappy, reactive).
- **Lethality** (TTK on player/enemies, how dangerous mistakes are).
- **Player fantasy** (System Runner as careful tactician vs. power fantasy).

**3 "this is not…" bullets** (e.g., not a pure horde shooter, not a twitch arena, etc.).

## 2. Weapon feel targets (Fragmented vs Restored)

For early-game weapons, define feel targets, not exact numbers:

### For Fragmented weapons (glitched rifles/SMGs/etc.):

- Recoil profile, accuracy, and "jank" level.
- Sound and VFX vibe (glitchy, digital artifacts vs. physical punch).
- Pros/cons vs Glitch creatures and drones.

### For the first Restored gun (real firearm):

- How it should feel different from Fragmented (heavier, more stable, more lethal vs hardware).
- Rough ranges for:
  - Time to kill on basic enemies.
  - Reload feel (fast/slow, weighty/snappy).
- What feedback sells a "clean, restored" weapon (sound, animation, screen shake, muzzle flash).

**Output this as:**

A small table listing each early weapon and its intended feel tags (e.g., "burst-accurate", "panic hose", "slow but decisive").

## 3. AI behavior tuning - early enemies

Define tuning targets, not engine code, for:

### Glitch creatures:

- Detection behavior (sight vs sound, reaction time, how forgiving they are).
- Attack cadence and telegraphing (clear windups vs cheap hits).
- How many can pressure the player at once without feeling unfair.

### Admin drones / basic Defrag units:

- Aiming behavior and reaction time (no aimbots).
- Use ideas like:
  - Delay before firing after spotting player.
  - Max turn rate for tracking.
  - Occasional deliberate miss / inaccuracy at range.
- Preferred engagement ranges and flanking behavior.

**Give these as:**

Bullet points per enemy type, including:

- "Feels fair when…"
- "Feels cheap when…"
- Tuning knobs I can tweak (reaction delay, aim error, burst length, etc.).

## 4. Feedback & readability checklist

Create a combat feedback checklist for early Act 1:

### When the player hits an enemy:

- What they should see (hit reactions, stagger, VFX).
- What they should hear (distinct impact sounds per enemy type/surface).
- Optional camera effects (micro-shake, brief hit pause, crosshair flash).

### When the player gets hit:

- Minimal UI and VFX to communicate direction, damage type, and severity.
- Audio cues for low health and suppression.

### For telegraphs:

- How Glitch creatures signal a coming attack.
- How drones signal line-up and firing.

Deliver this as a short, reusable checklist I can keep next to the combat code.

## 5. Tuning plan for a solo/mini team

Suggest a practical tuning loop for me as (mostly) a solo dev or small team:

### Recommended test scenario(s) in early Act 1:

E.g., a small "combat sandbox" room with 3-5 target encounter setups.

### Order of tuning:

Weapons first, then AI reaction/accuracy, then VFX/SFX polish.

### Concrete advice:

- How many iterations to expect.
- What to log or record when playtesting (TTK, hit/miss ratios, times the player feels unfairly killed).

## 6. Output format

Use these headings:

- Early Act 1 combat goals
- Early weapons - feel targets
- AI behavior tuning - early enemies
- Combat feedback checklist
- Tuning loop for a small team

Keep everything consistent with OMNI-OPS tone (eerie, tactical, grounded) and the existing systems GDD.
