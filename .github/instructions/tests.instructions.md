---
name: 'Test File Standards'
description: 'Conventions for writing unit and integration tests'
applyTo: 'tests/**/*.js,tests/**/*.test.js,**/*.spec.js'
---

# Test Writing Standards

## Structure
- One test file per system/module.
- Group tests with `describe()` blocks matching the module name.
- Use descriptive `it()` names: `it('should clamp HP to zero when damage exceeds current HP')`.

## Isolation
- Tests must not depend on DOM, network, or filesystem.
- Mock external dependencies (SignalBus, fetch, DOM) using stubs.
- Reset all mocks and state in `beforeEach()`.

## Performance Tests
- Use `performance.mark()` and `performance.measure()` behind a `DEBUG` flag.
- Assert that hot-path functions complete within budget (e.g., physics update < 4ms).

## Coverage
- Every public API function must have at least one happy-path and one edge-case test.
- Test boundary conditions: zero, negative, null, undefined, MAX_SAFE_INTEGER.
