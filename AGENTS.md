# AGENTS.md — Omni-Ops Project

## Project Overview

Omni-Ops is a production-grade tactical FPS/RTS hybrid built with Three.js (ESM) and Electron.
The architecture follows Entity-Component-System (ECS) principles with a centralized SignalBus for event-driven decoupling.

## Tech Stack

- **Renderer**: Three.js v0.160+ (ESM imports)
- **Runtime**: Electron with Node integration
- **AI Backend**: Python/Node server on `127.0.0.1:8080` (optional — game has offline fallback)
- **Physics**: Custom Octree-based collision with fixed sub-stepping (10 steps)
- **UI**: Diegetic "Specter Command" overlay via `window.updateDialogue()` bridge
- **State Management**: Centralized `SignalBus` pub/sub + hierarchical FSMs for AI

## Build & Run

```bash
npm install
npm run dev          # Starts Electron in dev mode with hot reload
npm run build        # Production build
npm run test         # Run all unit tests
npm run lint         # ESLint + Prettier check
```

## Code Style Guidelines

- Use `const` by default. Use `let` only for mutation. Never `var`.
- Use `===` strict equality. Never `==`.
- All configuration values go in a frozen `CONFIG` object — no magic numbers.
- All DOM access must include a null guard.
- No heap allocations (`new`) inside any per-frame function. Use object pools.
- Reuse Three.js math objects declared at module scope.
- Physics logic never touches DOM. UI logic never reads physics state directly. Use `SignalBus`.
- Every `async` operation must have `try/catch` with meaningful error context.
- Every `fetch` to the AI server must include an `AbortController` timeout and offline fallback.

## File Structure

```
omni-ops/
├── main.js                    # Electron main process
├── omni-core-game.js          # Game entry — single THREE import here
├── systems/                   # ECS systems (physics, combat, AI, render)
├── components/                # Pure data components
├── pools/                     # Object pool implementations
├── signals/                   # SignalBus and event definitions
├── ui/                        # Specter Command overlay modules
├── config/                    # CONFIG constants and tuning
├── utils/                     # Shared math, helpers, type guards
├── assets/                    # Models, textures, audio
├── tests/                     # Unit and integration tests
├── .github/
│   ├── copilot-instructions.md
│   └── instructions/          # Scoped instruction files
└── AGENTS.md                  # This file
```

## Testing Instructions

- Run `npm test` before every commit.
- Each system must have a corresponding test file in `tests/`.
- Tests must be isolated — no dependency on DOM, network, or file system.
- Use `performance.mark()` / `performance.measure()` behind `DEBUG` flag for perf tests.

## PR Instructions

- Title format: `[system] verb: description`
- Run `npm lint` and `npm test` before pushing.
- Include architectural trade-offs in the PR body.

## Security Considerations

- Never use `eval()` or `Function()` constructor.
- All user input must be sanitized before DOM insertion.
- AI server responses must be schema-validated before use.
- Electron `nodeIntegration` is scoped carefully.

## Architecture Boundaries

- **Physics** never touches DOM or UI
- **UI** never reads physics state directly (use SignalBus events)
- **Network** never blocks the game loop (always async + timeout + fallback)
- **Render** never mutates game state
