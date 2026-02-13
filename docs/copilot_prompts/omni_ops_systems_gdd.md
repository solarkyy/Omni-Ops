You are my systems designer and technical GDD co-author for OMNI-OPS.

Goal: Turn the existing OMNI-OPS concept + Act 1 work into a concise Systems & Loop GDD that engineering, design, and narrative can all use.

Assume we already have:

Canon setting, factions, Admin, Buffer Zone, etc.

3-Act narrative backbone.

Act 1, Chapter 1 designed in detail.

Act 1 macro layout and level briefs (Chapters 2-5).

## 1. Core loop - implementation spec

Document the moment-to-moment and session loop in a way programmers can wire up:

Describe:

**Micro loop:** "engage → loot → retreat/advance → manage resources".

**Session loop:** "Prepare in Safe Zone → Scavenge → Restore Gear → Cleanse Sector → Unlock Story → Defend Zone".

For each step, specify:

- Inputs (player actions, required systems).
- Outputs (resources, world state changes).
- Dependencies (inventory system, AI spawning, economy, etc.).

Deliver this as a bullet structure that could drop into GDD_Systems_CoreLoop.md.

## 2. Key systems - high-level specs

For these systems, create 1-2 page style briefs (concise, but actionable):

### Corruption & Restoration System

How corruption level is represented (per sector, per tile/volume).

How restoration waves work when a Compiler Beacon is planted.

What changes mechanically and visually when corruption level drops.

### Weapons & Gear Progression

Fragmented → Stabilized → Pristine pipeline.

How weapon stats differ by tier (conceptually, not numbers).

How crafting/upgrading ties into Source Code / Patch Data.

### Safe Zones & Sieges

How a sector becomes a Safe Zone.

Safe Zone states: Normal → Threatened → Under Siege → Fortified / Partially Re-corrupted.

Inputs that drive sieges (player actions, time, Admin aggression level).

For each system, include:

- **Purpose** (why it exists in the game).
- **Core data it needs** (e.g., SectorState, WeaponTier enums).
- **Hooks other systems will need** (events, flags).

## 3. Data model sketch

Propose a simple data model for:

- **Sectors** (corruption level, safe zone state, resources, unlocked services).
- **Weapons/gear** (ID, tier, tags for enemy type effectiveness).
- **Admin aggression** (global "heat" or "threat" score that influences sieges).

You don't need engine-specific syntax, but describe:

- Likely enums.
- Key structs/classes.
- Relationships between them (e.g., Sector references its current Node, Safe Zone hub, and active siege state).

## 4. Implementation priorities for Act 1

List implementation priorities for a small team, scoped just to Act 1:

### Tier 1 (must have for vertical slice):

Which systems must be fully functional in Act 1 (even if simplified).

### Tier 2 (nice-to-have for Act 1, can be partial):

Systems that can ship in a minimal version and grow later.

For each item, give:

- Why it's in that tier.
- Any suggested shortcuts (e.g., "fake dynamic sieges with scripted events in Act 1").

## 5. Output format

Use these headings:

- Core loop - system view
- System briefs - corruption, gear, safe zones & sieges
- Data model sketch - sectors, gear, Admin aggression
- Act 1 implementation priorities

Keep everything aligned with existing OMNI-OPS lore and Act 1 design; don't add new story beats, just system detail.
