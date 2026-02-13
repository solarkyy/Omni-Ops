You are my narrative designer and quest writer for OMNI-OPS.

Goal: Using the existing OMNI-OPS canon, Act 1 backbone, and the Act 1 level/encounter layout (Chapters 2-5) plus Systems GDD, generate quest/mission structures and player-facing text for the rest of Act 1, in the same style as Chapter 1 "Cold Boot".

Assume:

Chapter 1 "Cold Boot" already has:

- Mission summary.
- Objective list with IDs OBJ_C1_*.
- Quest-log entries, hints, tutorial prompts.
- ARIA VO IDs for key beats.

The Act 1 macro layout and level briefs for Chapters 2-5 exist in [docs/copilot_prompts/omni_ops_act1_level_design.md](omni_ops_act1_level_design.md).

Core systems and loop are defined in [docs/copilot_prompts/omni_ops_systems_gdd.md](omni_ops_systems_gdd.md).

## 1. Chapters 2-5 - mission summaries

For each remaining Act 1 chapter (2, 3, 4, 5):

Provide:

- **Mission name + short tagline.**
- **3-5 sentence description:**
  - Where it takes place (match the level brief).
  - What the player's main goal is.
  - How it advances the Act 1 story (identity, Admin threat, first safe zone, first siege, etc.).
- **1-2 sentences on what the chapter is teaching/testing** (systems or skills).

Format heading as:

```markdown
## Chapter 2 - [Name]

## Chapter 3 - [Name]
```

etc.

## 2. Objective flows (OBJ_C2_, OBJ_C3_, OBJ_C4_, OBJ_C5_)

For each chapter:

Define 5-9 core objectives, following the Chapter 1 style.

For each objective:

- **ID:** e.g., OBJ_C2_SCOUT_OUTSKIRTS, OBJ_C3_PREPARE_SIEGE, etc.
- **On-screen text** (1 short imperative line).
- **Quest-log entry** (2-4 sentences, clear and atmospheric).
- **Optional Hint line,** diegetic and non-patronizing.

Ensure objectives align with:

- The level critical path and optional routes from the Act 1 level design prompt.
- The Systems GDD (using corruption/restoration, gear, safe zones, sieges).

## 3. Key tutorial/guide prompts per chapter

For Chapters 2-5, list any new tutorials or guidance popups needed beyond Chapter 1, such as:

First time:

- Using Stabilized/Pristine gear.
- Managing Safe Zone defenses.
- Experiencing a siege.
- Seeing partial re-corruption.

For each tutorial:

- **ID:** TUT_C2_..., TUT_C3_... etc.
- **Trigger moment.**
- **Short title.**
- **1-2 sentence body,** diegetic (HUD/system/ARIA voice framing).

Do not repeat Chapter 1 tutorials unless they change behavior.

## 4. ARIA (and maybe 1 other key NPC) VO hooks (no full lines)

For each chapter:

List which moments need VO from ARIA or one key NPC (e.g., Kess or Safe Zone leader), but **do not write the full lines yet**.

For each moment, provide:

- **A VO ID stub,** like ARIA_C2_001, KESS_C3_002.
- **A 1-2 sentence intent description:**
  - What the line should communicate.
  - Emotion/tone (e.g., "encouraging under pressure", "suspicious, testing the player").

This will become the input for separate VO-sheet prompts later.

## 5. Output format

Use these headings:

- Chapter 2-5 mission summaries
- Chapter 2 objectives & quest-log
- Chapter 3 objectives & quest-log
- Chapter 4 objectives & quest-log
- Chapter 5 objectives & quest-log
- New tutorials by chapter
- VO hook plan (ARIA + 1 NPC)

## Constraints:

- Do not change the overall Act 1 story beats already established.
- Do not reference Fallout or any external IP.
- Keep terminology consistent with OMNI-OPS (Buffer Zone, corruption, Sector Nodes, Compiler Beacons, Safe Zones, Defrag/Eraser Units, Source Code, Patch Data).
