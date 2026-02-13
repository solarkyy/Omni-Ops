---
name: 'JavaScript/Three.js Standards'
description: 'Core coding conventions for all JavaScript files in Omni-Ops'
applyTo: '**/*.js'
---

# JavaScript & Three.js Coding Standards

## General Rules
- Use `const` by default, `let` only for mutation. Never `var`.
- Use `===` strict equality exclusively.
- Extract all magic numbers to the `CONFIG` object in `config/`.
- All `async` functions must wrap in `try/catch` with contextual error logging.
- Use template literals for string building, not concatenation.

## Three.js Specific
- `import * as THREE from 'three'` appears ONLY in `omni-core-game.js`.
- Other modules receive Three.js objects via dependency injection or re-exports.
- Never allocate `new THREE.Vector3()`, `new THREE.Quaternion()`, or `new THREE.Matrix4()` inside any per-frame function.
- Declare reusable math objects at module scope: `const _v1 = new THREE.Vector3();`
- Use `renderer.clearDepth()` before rendering the weapon viewmodel scene.
- Use `InstancedMesh` for any geometry with > 10 identical instances.

## Performance
- Target < 16.67ms total frame time.
- No `new` keyword in any function called from the game loop.
- Use `Float32Array` for large numeric datasets.
- All spatial queries go through the Octree.

## Error Handling
- Pattern: `console.error('[ModuleName::methodName]', error.message, { state });`
- Every `fetch` must use `AbortController` with `CONFIG.NETWORK.TIMEOUT_MS`.
- Every DOM access: `const el = document.getElementById(id); if (el) { ... }`
