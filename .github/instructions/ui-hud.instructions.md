---
name: 'UI/HUD Standards'
description: 'Coding conventions for Specter Command overlay and all DOM-touching code'
applyTo: 'ui/**/*.js'
---

# UI & HUD Coding Standards

## DOM Access
- NEVER access a DOM element without a null guard:
  ```javascript
  const el = document.getElementById('hp-bar');
  if (el) el.style.width = `${hp}%`;
  ```
- Use the `window.updateDialogue()` bridge for all narrative/dialogue UI updates.

## Architecture
- UI modules subscribe to `SignalBus` events. They NEVER import physics or game state modules directly.
- UI updates are throttled to 10Hz maximum. Batch DOM writes in `requestAnimationFrame`.
- Use CSS classes for state changes, not inline styles, when possible.

## Performance
- Minimize DOM queries. Cache element references at module initialization.
- Never trigger layout thrashing (read then write in alternation).
- Use `textContent` over `innerHTML` for text updates (avoids reparse).
