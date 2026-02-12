# OMNI-OPS Game Architecture

## Core Systems Overview

### Main Game File
**File**: `js/omni-core-game.js`
**Structure**: Wrapped in IIFE `(function() { ... })();`

### Critical Objects

#### Player Object
```javascript
const player = {
    velocity: THREE.Vector3,
    pitch: number,
    yaw: number,
    health: number,        // Current health (0-100)
    maxHealth: number,     // Maximum health (default 100)
    stamina: number,       // Current stamina (0-100)
    ammo: number,          // Current ammo in magazine
    reserveAmmo: number,   // Reserve ammunition
    onGround: boolean,
    isSprinting: boolean,
    isCrouching: boolean,
    isAiming: boolean
};
```

#### Camera & Scene
```javascript
let scene;          // THREE.Scene
let camera;         // THREE.PerspectiveCamera
let renderer;       // THREE.WebGLRenderer
let cameraRig;      // THREE.Object3D (camera parent)
```

#### Settings Object
```javascript
const SETTINGS = {
    MAX_WALK: 8,
    MAX_SPRINT: 28,
    JUMP_POWER: 11,
    GRAVITY: 35,
    PLAYER_RADIUS: 0.5,
    FOV_BASE: 85,
    FOV_ADS: 50
};
```

## Safe Injection Points

### ✅ CORRECT: Inject BEFORE closing IIFE
```javascript
console.log('[Core Game] v11 loaded successfully');

// ✅ YOUR CODE HERE (inside the IIFE)

})(); // CLOSE THE IIFE
```

### ❌ WRONG: After IIFE closure
```javascript
})(); // CLOSE THE IIFE

// ❌ NEVER PUT CODE HERE - Outside game scope!
```

## Global Scope Safety

Always use `window.yourFeature` to prevent conflicts:
```javascript
if (!window.healthBarUI) {
    window.healthBarUI = {
        // Your code
    };
}
```

## Available Functions

### Game Loop Access
Code injected after line 3073 runs BEFORE game loop, so use:
- `setTimeout()` for delayed initialization
- `setInterval()` for continuous updates
- `window.addEventListener('load')` for DOM-ready code

### Three.js Access
```javascript
scene.add(yourMesh);              // Add to scene
camera.position;                  // Camera position
objects.push(yourCollidable);     // Add collision object
```

## Common Patterns

### UI Elements
```javascript
const element = document.createElement('div');
element.style.cssText = 'position:fixed;top:20px;left:20px;...';
document.body.appendChild(element);
```

### Update Loops
```javascript
setInterval(() => {
    if (window.player) {
        // Update based on player state
    }
}, 100); // 100ms = 10 updates per second
```

### Preventing Duplicates
```javascript
if (!window.myFeature) {
    window.myFeature = { /* ... */ };
    window.myFeature.init();
}
```
