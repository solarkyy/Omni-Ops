# AI Coding Standards for OMNI-OPS

## Code Quality Rules

### ✅ MUST DO

1. **Prevent Duplicates**
   ```javascript
   if (!window.featureName) {
       window.featureName = { /* ... */ };
   }
   ```

2. **Use Unique Feature IDs**
   ```javascript
   // AUTO-FEATURE [health_bar]: Feature Name
   ```

3. **Safe Object Access**
   ```javascript
   if (window.player && window.player.health !== undefined) {
       // Use player.health
   }
   ```

4. **Console Logging**
   ```javascript
   console.log('[FeatureName] Initialized');
   console.log('[FeatureName] Event:', data);
   ```

5. **Delayed Initialization**
   ```javascript
   setTimeout(() => feature.init(), 500);
   ```

### ❌ NEVER DO

1. **Don't Inject Outside IIFE**
   ```javascript
   })(); // Game code ends here
   // ❌ Never put code here!
   ```

2. **Don't Duplicate Global Variables**
   ```javascript
   // ❌ Bad
   const healthBarUI = {};
   const healthBarUI = {}; // Duplicate!
   
   // ✅ Good
   if (!window.healthBarUI) {
       window.healthBarUI = {};
   }
   ```

3. **Don't Access Undefined Objects**
   ```javascript
   // ❌ Bad
   player.health = 100;
   
   // ✅ Good
   if (window.player) {
       window.player.health = 100;
   }
   ```

4. **Don't Block Main Thread**
   ```javascript
   // ❌ Bad
   while(true) { /* infinite loop */ }
   
   // ✅ Good
   setInterval(() => { /* periodic update */ }, 100);
   ```

## Code Injection Location

### ✅ CORRECT Pattern
```javascript
// Line ~3073 in omni-core-game.js
console.log('[Core Game] v11 loaded successfully');

// ✅ INJECT NEW CODE HERE (inside IIFE)
if (!window.newFeature) {
    window.newFeature = { /* ... */ };
}

})(); // IIFE closure
```

## Naming Conventions

### Feature IDs
- Use lowercase with underscores
- Keep under 20 characters
- Be descriptive: `health_bar` not `hb`

### Window Objects
- Use camelCase: `window.healthBarUI`
- Suffix with purpose: `...UI`, `...System`, `...Manager`

### DOM Element IDs
- Use kebab-case: `health-bar-fill`
- Prefix with feature: `health-bar-`, `stamina-bar-`

## Performance Guidelines

### Update Frequencies

| Feature Type | Update Rate | Interval |
|--------------|-------------|----------|
| HUD/UI | 10 FPS | 100ms |
| Physics | 60 FPS | 16ms |
| AI Logic | 5 FPS | 200ms |
| Network | 20 FPS | 50ms |

### Example
```javascript
// UI updates - 100ms is fine
setInterval(() => {
    hudElement.update();
}, 100);

// Physics - use game loop or requestAnimationFrame
// (Don't add extra intervals for physics)
```

## Error Handling

### Always Wrap Critical Code
```javascript
try {
    // Code that might fail
    const element = document.getElementById('my-element');
    element.textContent = 'Updated';
} catch (error) {
    console.error('[FeatureName] Error:', error);
}
```

### Graceful Degradation
```javascript
window.myFeature = {
    init() {
        try {
            // Try to initialize
            this.setupUI();
        } catch (e) {
            console.warn('[MyFeature] Could not initialize UI:', e);
            // Continue without UI
        }
    }
};
```

## Code Review Checklist

Before implementing, verify:

- [ ] Feature ID is unique (check for `feature_id` in file)
- [ ] Code is inside IIFE (before `})();`)
- [ ] Uses `window.` prefix for globals
- [ ] Has duplicate prevention check
- [ ] Includes console logs for debugging
- [ ] Handles undefined objects safely
- [ ] Uses appropriate update frequency
- [ ] Has error handling for critical code
- [ ] DOM elements use unique IDs
- [ ] Cleans up resources (if needed)

## File Size Considerations

- Keep additions under 2KB per feature
- Minimize whitespace in injected code
- Use concise but readable variable names
- Comment only complex logic

## Testing Approach

After injection:
1. Check console for init message
2. Verify no JavaScript errors
3. Test feature functionality
4. Check performance (FPS should stay >30)
5. Verify no conflicts with existing features
