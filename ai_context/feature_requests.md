# Feature Request Examples

## How to Request Features

When requesting features via the AI overlay (F3), be specific about what you want:

### ✅ Good Requests

- **"add health bar"** - Clear, specific UI element
- **"add wall running system"** - Clear game mechanic
- **"add mini-map radar"** - Specific UI feature
- **"add night vision toggle"** - Clear ability with on/off state
- **"add speed boost powerup"** - Clear collectible with effect
- **"add dash ability"** - Clear player ability
- **"add enemy spawner"** - Clear game system
- **"add stamina bar"** - Clear UI element
- **"add ammo counter"** - Clear HUD element

### ❌ Vague Requests

- "make it better" - Too vague
- "add stuff" - Not specific
- "fix it" - Not actionable
- "add AI" - Too broad

## Feature Types & Keywords

### UI/HUD Features
**Keywords**: bar, display, counter, indicator, meter, gauge, overlay
**Examples**:
- Health bar
- Stamina bar  
- Ammo counter
- Score display
- Compass
- Crosshair
- Mini-map

### Player Abilities
**Keywords**: ability, power, skill, move, action
**Examples**:
- Double jump
- Dash
- Wall run
- Slide
- Grappling hook
- Jetpack
- Sprint boost

### Collectibles/Powerups
**Keywords**: powerup, pickup, collectible, item, boost
**Examples**:
- Health pack
- Ammo box
- Speed boost
- Shield powerup
- Weapon pickup
- Coin/currency

### Game Mechanics
**Keywords**: system, mechanic, physics, behavior
**Examples**:
- Enemy AI
- Projectile system
- Particle effects
- Day/night cycle
- Weather system
- Save/load

### Visual Effects
**Keywords**: effect, visual, particle, animation
**Examples**:
- Muzzle flash
- Explosion
- Trail effect
- Screen shake
- Blood splatter
- Smoke

## Complex Feature Examples

### Multi-Component Features

Some features require multiple systems working together. The AI will attempt to create comprehensive implementations:

#### Example: "add grappling hook"
Components needed:
- Input detection (mouse click)
- Raycasting (find grapple point)
- Physics (pull player toward point)
- Visual (rope/line rendering)
- UI (cooldown indicator)
- Audio (launch/attach sounds)

#### Example: "add enemy AI"
Components needed:
- Enemy entity management
- Pathfinding logic
- State machine (idle, chase, attack)
- Health system
- Damage detection
- Death behavior
- Spawning system

### Incremental Implementation

For complex features, consider requesting incrementally:

1. **Phase 1**: "add basic enemy spawner"
2. **Phase 2**: "add enemy health bars"
3. **Phase 3**: "add enemy chase AI"
4. **Phase 4**: "add enemy attack system"

This allows testing at each stage and ensures stability.

## Feature Testing

After requesting a feature:

1. **Check Console**: Look for initialization messages
   ```
   [FeatureName] Initialized
   [FeatureName] Ready
   ```

2. **Test Functionality**: Try using the feature
   - For UI: Visual elements appear?
   - For abilities: Keybinds work?
   - For systems: Updates happening?

3. **Check Performance**: Monitor FPS
   - Should stay >30 FPS
   - If drops significantly, feature may need optimization

4. **Look for Errors**: Open browser console (F12)
   - Red errors indicate problems
   - Yellow warnings are usually okay

## Modifying Features

### To Adjust Existing Features

Request modifications:
- "make health bar bigger"
- "change dash cooldown to 2 seconds"
- "move mini-map to bottom left"
- "change speed boost duration to 15 seconds"

### To Remove Features

Currently not automated, but you can:
1. Open [js/omni-core-game.js](js/omni-core-game.js)
2. Find the `// AUTO-FEATURE [feature_id]` comment
3. Delete that code block
4. Refresh browser (F5)

## Troubleshooting

### Feature Not Working

1. **Check if it loaded**:
   - Open browser console (F12)
   - Look for `[FeatureName] Initialized`

2. **Check for errors**:
   - Red error messages in console
   - Usually indicate missing dependencies

3. **Check duplicate**:
   - Feature ID already exists?
   - System will skip duplicates automatically

4. **Check injection point**:
   - Code injected in wrong location?
   - Should see validation message before implementation

### Feature Breaks Game

1. **Immediate fix**: Refresh (F5) and restore backup
2. **Check console**: What's the error?
3. **Remove feature**: Delete code block from game file
4. **Report issue**: Note what feature caused the break

## Best Practices

### Before Requesting

1. **Know what you want** - Be specific
2. **Check if it exists** - Avoid duplicates
3. **Consider complexity** - Start simple
4. **Think about interactions** - How does it affect other systems?

### After Implementation

1. **Test immediately** - Verify it works
2. **Check performance** - Monitor FPS
3. **Save backups** - Important game states
4. **Document changes** - Keep track of what's added

### For Complex Projects

1. **Plan ahead** - List all features needed
2. **Prioritize** - Implement important features first
3. **Test incrementally** - Don't add everything at once
4. **Iterate** - Refine and adjust as needed

## Context Awareness

The AI now uses context files to generate better code:

- **Architecture** knowledge - Understands game structure
- **Pattern** matching - Uses proven templates
- **Standards** compliance - Follows coding rules
- **Example** reference - Based on working code

This means:
- ✅ Better quality code
- ✅ Fewer bugs
- ✅ Proper structure
- ✅ Performance optimized
- ✅ Follows patterns

## Future Features

Potential features to add:

### Near-term (Simple)
- [ ] Crosshair customization
- [ ] Kill counter
- [ ] Headshot detection
- [ ] Reload indicator
- [ ] Damage numbers

### Mid-term (Moderate)
- [ ] Weapon switching
- [ ] Grenade system
- [ ] Cover system
- [ ] Leaning mechanic
- [ ] Footstep sounds

### Long-term (Complex)
- [ ] Multiplayer networking
- [ ] Inventory system
- [ ] Quest system
- [ ] Dialog system
- [ ] Crafting system

---

**The AI is ready to implement features - just describe what you want!** 🚀
