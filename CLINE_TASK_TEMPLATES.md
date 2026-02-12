# Cline Task Submission Template

## Copy and paste this into Cline to submit tasks

### Bug Fix Template
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Bug Fix
OBJECTIVE: [Brief description of what's broken]

CONTEXT:
- File: [filename and line number]
- Issue: [What's wrong]
- Related code: [Relevant snippet or path]
- Error message: [If applicable]

TESTING:
- Step 1: [How to reproduce]
- Step 2: [Verify the fix]
- Expected: [What should happen]
- Success criteria: [How to know it worked]

DEPENDENCIES:
- [Any prerequisites or blockers]
```

### Feature Template
```
[CLINE_TASK]
PRIORITY: Medium
CATEGORY: Feature
OBJECTIVE: [Feature name and description]

CONTEXT:
- Files to modify: [list]
- Related features: [any existing similar features]
- User story: [What problem does this solve]

TESTING:
- Test scenario: [How to test it]
- Expected behavior: [What should happen]
- Edge cases: [Special cases to handle]

DEPENDENCIES:
- [Any features that need to be done first]
```

### Optimization Template
```
[CLINE_TASK]
PRIORITY: Low
CATEGORY: Optimization
OBJECTIVE: [What to optimize]

CONTEXT:
- Current performance: [Measurements]
- Target performance: [Goals]
- File(s): [Which files]
- Constraint: [Any limitations]

TESTING:
- Benchmark: [How to measure]
- Baseline: [Current metrics]
- Target: [What we're aiming for]

DEPENDENCIES: None
```

### Testing Template
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Testing
OBJECTIVE: [What to test]

CONTEXT:
- Test scope: [What areas]
- Files involved: [Which files need tests]
- Coverage target: [Percentage or scenarios]

TESTING:
- Test execution: [How to run]
- Expected result: [All tests pass]
- Coverage report: [Where to find it]

DEPENDENCIES: None
```

### Integration Template
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Integration
OBJECTIVE: [Integrate X with Y]

CONTEXT:
- System A: [Description]
- System B: [Description]
- Integration point: [How they connect]
- Current status: [What exists]

TESTING:
- Test flow: [End-to-end test]
- Verification: [How to confirm it works]
- Performance impact: [Check if affected]

DEPENDENCIES:
- [Any systems that must be ready first]
```

---

## Real Examples

### Example 1: Fix AI Forward Movement
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Bug Fix
OBJECTIVE: Fix AI forward movement not working

CONTEXT:
- File: js/omni-core-game.js (line 2918)
- Issue: AIPlayerAPI.setInput('moveForward', true) doesn't move player
- Error in console: None, but movement doesn't happen
- Test page: test_ai_connection.html (Run Full Auto-Test fails)

TESTING:
- Step 1: Open test_ai_connection.html in browser
- Step 2: Click "Run Full Auto-Test"
- Step 3: Watch game window - player should move forward for 2 seconds
- Expected: Character position changes
- Success: Test completes with "✓ Forward movement test completed"

DEPENDENCIES:
- Game must be loaded in index.html
- Browser must have both windows open
```

### Example 2: Add NPC Pathfinding
```
[CLINE_TASK]
PRIORITY: Medium
CATEGORY: Feature
OBJECTIVE: Implement A* pathfinding for NPC movement

CONTEXT:
- File to modify: js/omni-ai-npc-intelligence.js
- Related: NPC spawning system, movement code
- User story: NPCs should navigate around obstacles intelligently
- Current: NPCs move in straight lines, get stuck on walls

TESTING:
- Test scenario: Spawn 5 NPCs, tell them to move to distant location
- Expected behavior: NPCs find path around obstacles
- Edge cases: Handle unreachable destinations, narrow corridors
- Performance: Should not cause FPS drops below 60

DEPENDENCIES:
- A* algorithm implementation (can use existing library or implement)
```

---

## Cline Task Chain Example

```
[CLINE_TASK_CHAIN]

TASK_1: Fix AI Movement System
  PRIORITY: High
  OBJECTIVE: Ensure AIPlayerAPI properly controls player movement
  DEPENDENCIES: None

TASK_2: Extend AI Control Capabilities
  PRIORITY: Medium
  OBJECTIVE: Add camera control and weapon firing to AIPlayerAPI
  DEPENDENCIES: TASK_1 must be complete

TASK_3: Create Comprehensive Test Suite
  PRIORITY: High
  OBJECTIVE: Test all new AI capabilities
  DEPENDENCIES: TASK_2 must be complete

DEPENDENCIES:
  EXECUTE_ORDER: TASK_1 -> TASK_2 -> TASK_3
  PARALLEL: None (all sequential)
```

---

## Tips for Best Results

✅ **DO:**
- Be specific and detailed
- Include file paths and line numbers
- Provide clear success criteria
- List all dependencies
- Include testing instructions

❌ **DON'T:**
- Be vague ("fix the game")
- Forget testing details
- Ignore error messages
- Skip context
- Make massive changes in one task

## Getting Help

If Cline gets stuck:
1. Check CLINE_LOG.txt for errors
2. Review CLINE_STATUS.json for status
3. Run: `python cline_collaboration_bridge.py status`
4. Check: `git log --oneline -10` for recent changes

---

**Need to modify a task?** Just resubmit with updated PRIORITY or OBJECTIVE!
