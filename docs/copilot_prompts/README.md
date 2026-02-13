# OMNI-OPS Copilot Prompts

Master prompts for generating OMNI-OPS game design documentation and code using Copilot, Claude, or other AI assistants.

## How to Use

Each prompt file in this folder is a **complete, self-contained instruction** for an AI assistant. Copy the entire contents and paste into your AI chat to generate the specified deliverable.

## Available Prompts

### Story & Narrative

- **[Story Context.txt](../../ai_context/Story%20Context.txt)** - Chapter 1 gameplay wiring prompt (code-focused, for implementing objectives, VO, and tutorial systems)

### Level Design

- **[omni_ops_act1_level_design.md](omni_ops_act1_level_design.md)** - Act 1 macro layout, level briefs for Chapters 2-5, encounter design deep-dive, and Safe Zone A hub design

### Systems Design

- **[omni_ops_systems_gdd.md](omni_ops_systems_gdd.md)** - Core loop implementation spec, system briefs (corruption, gear, sieges), data model, and Act 1 implementation priorities

### Quest & Narrative Design

- **[omni_ops_act1_quest_design.md](omni_ops_act1_quest_design.md)** - Quest objectives, player-facing text, tutorials, and VO hooks for Act 1 Chapters 2-5

### Combat & Gameplay Feel

- **[omni_ops_combat_feel.md](omni_ops_combat_feel.md)** - Combat feel tuning guide for early Act 1: weapons, AI behavior, feedback, and iteration workflow

### Implementation Guides

- **[omni_ops_java_implementation_bootstrap.md](omni_ops_java_implementation_bootstrap.md)** - Bootstrap prompt for Java/HTML implementation: tells Copilot to ask for exact files needed before generating code

## Workflow Recommendation

For a complete Act 1 vertical slice, use prompts in this order:

### Design Phase
1. **Story Context** → Wire Chapter 1 objectives, VO, and tutorials into code
2. **Level Design** → Design spatial layout and encounters for Chapters 2-5
3. **Systems GDD** → Align engineers and designers on core loop and data models
4. **Quest Design** → Generate quest objectives, text, and VO hooks for Chapters 2-5
5. **Combat Feel** → Define weapon and AI tuning targets for early combat iteration

### Implementation Phase
6. **Java Implementation Bootstrap** → Get Copilot to request exact existing code before generating Chapter 1 implementation

## Creating New Prompts

When adding new master prompts:

1. Create a `.md` file in this folder
2. Write a complete, standalone prompt (no external dependencies)
3. Include clear deliverable format requirements
4. Reference OMNI-OPS canon in `ai_context/` folder
5. Add entry to this index

## Context Files

AI assistants should always check `ai_context/` for:

- **Story Context.txt** - Narrative integration guide
- **Ai Context.txt** - AI assistant behavior guidelines
- **AI Vision and systems.txt** - AI systems architecture
- **game_architecture.md** - Core game structure
- **coding_standards.md** - Code quality rules

## Notes

- All prompts assume OMNI-OPS lore is canonical and should not be changed
- Prompts are engine-agnostic unless otherwise noted
- Focus is on practical, implementable deliverables for small teams
