# AI Context System Guide

## What is This?

The `ai_context/` folder contains **reference materials** that help the AI generate better code when implementing features.

## Files in Context Folder

### 1. game_architecture.md
- **Purpose**: Core game structure and object definitions
- **Contains**:
  - Player object properties (health, stamina, velocity, etc.)
  - Camera & scene references
  - SETTINGS object values
  - Safe code injection points
  - Common patterns for accessing game objects

### 2. feature_templates.md
- **Purpose**: Ready-to-use code templates for common features
- **Contains**:
  - UI Overlay template
  - Physics system template
  - Collectible/powerup template
  - HUD element template
  - Best practices checklist

### 3. coding_standards.md
- **Purpose**: Quality rules and standards
- **Contains**:
  - Must-do patterns (duplicate prevention, safe access, etc.)
  - Never-do anti-patterns (code outside IIFE, etc.)
  - Naming conventions
  - Performance guidelines
  - Error handling patterns
  - Code review checklist

### 4. common_patterns.md
- **Purpose**: Working examples of common feature types
- **Contains**:
  - Health/status bar pattern
  - Ability with cooldown pattern
  - Toggled feature (on/off) pattern
  - Timed buff/effect pattern
  - Spawner system pattern
  - Notification system pattern
  - Mini-map/radar pattern

## How It Works

When you request a feature implementation via the AI collaboration overlay (F3), the system:

1. **Loads Context**: Reads all `.md` files from `ai_context/`
2. **Analyzes Request**: Determines feature type (UI, physics, ability, etc.)
3. **Matches Pattern**: Finds relevant template/pattern from context
4. **Generates Code**: Creates code following standards and architecture
5. **Validates**: Checks for duplicates and safety
6. **Implements**: Injects code at safe location

## Benefits

### Before Context System
```javascript
// Generic, might not work
if (!window.feature) {
    console.log('Feature');
}
```

### After Context System
```javascript
// Follows patterns, proper structure, error handling
if (!window.healthBarUI) {
    window.healthBarUI = {
        element: null,
        init() {
            // Proper initialization with duplicate check
            if (this.element) return;
            // Full implementation with styling, updates, etc.
        },
        update(health, maxHealth) {
            // Safe property access
            if (this.element) {
                // Update logic
            }
        }
    };
    
    setTimeout(() => window.healthBarUI.init(), 500);
    setInterval(() => {
        if (window.player) {
            window.healthBarUI.update(
                window.player.health,
                window.player.maxHealth
            );
        }
    }, 100);
}
```

## Extending the Context

### To Add New Patterns

1. Open relevant `.md` file in `ai_context/`
2. Add your pattern using markdown format
3. Include code examples with comments
4. Save - AI will automatically load on next request

### To Add New Context Files

```markdown
1. Create new .md file in ai_context/
2. Name it descriptively: ai_behaviors.md, particle_effects.md, etc.
3. Write documentation with code examples
4. AI will load it automatically
```

## Context File Format

Use this structure for new context files:

```markdown
# File Title

## Section 1: Overview
Brief description of what this covers

## Section 2: Key Concepts
Important concepts or data structures

## Section 3: Code Examples

### Example: Feature Name
\`\`\`javascript
// Complete working code example
if (!window.myFeature) {
    window.myFeature = {
        // Full implementation
    };
}
\`\`\`

### Example: Another Feature
\`\`\`javascript
// Another example
\`\`\`

## Section 4: Best Practices
- Bullet point 1
- Bullet point 2
```

## Debugging Context Usage

To verify AI is using context:

1. Request a feature via AI overlay (F3)
2. Watch for message: **"📚 Loading AI context for better code generation..."**
3. Should show: **"✅ Loaded X context files"**
4. Generated code should follow patterns from context

## Performance

- Context files loaded once per implementation
- Minimal overhead (<100ms)
- Only `.md` files are loaded
- Context improves code quality significantly

## Future Improvements

Potential additions to context system:

- **Enemy AI patterns** - Pathfinding, state machines, behaviors
- **Weapon systems** - Shooting, reloading, projectiles
- **Particle effects** - Explosions, trails, impacts
- **Audio integration** - Sound effects, music, spatial audio
- **Multiplayer patterns** - Networking, synchronization
- **Save/load systems** - Persistence, checkpoints
- **Menu systems** - UI navigation, settings screens

## Quick Reference

| File | Purpose | Use When |
|------|---------|----------|
| game_architecture.md | Core game objects | Accessing player, camera, scene |
| feature_templates.md | Empty templates | Creating new feature types |
| coding_standards.md | Quality rules | Ensuring code quality |
| common_patterns.md | Working examples | Implementing standard features |

---

**The AI is now context-aware and will generate significantly better code!** 🚀
