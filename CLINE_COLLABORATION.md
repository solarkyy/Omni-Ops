# 🤖 Cline AI Collaboration System

Complete system for 100% collaboration with Cline on the Omni Ops project.

## Quick Start

### 1. In VS Code
- **Open Cline**: Click the Cline icon in the sidebar (or use Extension)
- **Use Task Format**: Send requests using the standardized format below
- **Let Cline Work**: It will autonomously handle the task

### 2. Structured Task Format

Send tasks to Cline using this format:

```
[CLINE_TASK]
PRIORITY: High/Medium/Low
CATEGORY: Bug Fix / Feature / Optimization / Testing / Integration
OBJECTIVE: [Clear description of what needs to be done]

CONTEXT:
- [Relevant background info]
- [Files involved]
- [Success criteria]

TESTING:
- [How to verify it works]
- [Expected output]

DEPENDENCIES:
- [Any blockers or prerequisites]
```

## Categories & Examples

### 🐛 Bug Fixes
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Bug Fix
OBJECTIVE: Fix AI system not responding to forward movement commands

CONTEXT:
- File: js/omni-core-game.js (line 2918)
- Issue: AIPlayerAPI.setInput() not triggering movement
- The _aiActive flag is set but input isn't being processed

TESTING:
- Open test_ai_connection.html
- Click "Run Full Auto-Test"
- Verify character moves forward for 2 seconds
- Check console for no errors

DEPENDENCIES: Game must be loaded
```

### ✨ Features
```
[CLINE_TASK]
PRIORITY: Medium
CATEGORY: Feature
OBJECTIVE: Add AI pathfinding system for NPC agents

CONTEXT:
- File: js/omni-ai-npc-intelligence.js
- Need to implement A* pathfinding
- NPCs currently use basic movement only

TESTING:
- Spawn 5 NPCs in editor
- Give them move commands
- Verify they navigate around obstacles
- Check performance impact

DEPENDENCIES: None
```

### ⚡ Optimizations
```
[CLINE_TASK]
PRIORITY: Low
CATEGORY: Optimization
OBJECTIVE: Reduce memory usage in particle system

CONTEXT:
- File: js/omni-core-game.js (particle system)
- Current: 1000+ particles causing frame drops
- Goal: Optimize to 60fps with 2000 particles

TESTING:
- Spawn max particles
- Check FPS (should be 60+)
- Monitor memory usage

DEPENDENCIES: None
```

### 🧪 Testing
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Testing
OBJECTIVE: Create comprehensive test suite for AI API

CONTEXT:
- Files: test_ai_connection.html, js/omni-core-game.js
- Need to test all AIPlayerAPI methods
- Should cover cross-window communication

TESTING:
- Run new test file
- All tests should pass
- Coverage should be >90%

DEPENDENCIES: None
```

### 🔗 Integration
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Integration
OBJECTIVE: Connect Cline workflow to task management system

CONTEXT:
- Files: task_manager.py, coding_assistant.py
- Need to sync Cline tasks with existing system
- Create bidirectional communication

TESTING:
- Run task_manager.py
- Submit task through system
- Cline receives and processes it
- Results sync back

DEPENDENCIES: Python environment ready
```

## Communication Channels

### Direct Requests
```
"@Cline, I need you to [objective]"
```
Cline will:
1. Analyze the request
2. Examine relevant files
3. Execute changes
4. Test results
5. Report status

### Using Task Files
Create `.cline-task` files:

```json
{
  "id": "task-001",
  "priority": "high",
  "category": "bug-fix",
  "objective": "Fix AI forward movement",
  "status": "assigned",
  "created_at": "2026-02-11T00:00:00Z"
}
```

### Status Tracking
Check `CLINE_STATUS.json` for real-time updates:

```json
{
  "current_task": "task-001",
  "status": "in_progress",
  "progress": 75,
  "activities": [
    "Examined AIPlayerAPI",
    "Found issue in setInput()",
    "Applied fix",
    "Testing..."
  ],
  "last_update": "2026-02-11T00:15:00Z"
}
```

## Key Integration Points

### 1. **AIPlayerAPI Integration** (js/omni-core-game.js)
- Line 2918: `window.AIPlayerAPI` definition
- Cline can extend this with new methods
- Use setInput(), pressKey(), shoot() for control

### 2. **Task Manager** (task_manager.py)
```python
# Cline can interface with:
from task_manager import TaskManager
tm = TaskManager()
tm.create_task({"objective": "...", "priority": "high"})
```

### 3. **Test Framework** (test_ai_connection.html)
```javascript
// Cline runs tests via:
runFullTest()           // Comprehensive test
testForwardMovement()   // Specific test
checkAPIStatus()        // Validate connection
```

### 4. **Coding Assistant** (coding_assistant.py)
```python
# Cline can use for code generation:
from coding_assistant import CodeAssistant
ca = CodeAssistant()
code = ca.generate_code(spec="AI pathfinding")
```

## Best Practices for Cline Collaboration

### ✅ DO:
- ✓ Use standardized task format
- ✓ Provide file paths and line numbers
- ✓ Define clear success criteria
- ✓ Include testing instructions
- ✓ Update status files
- ✓ Use git commits for tracking
- ✓ Document all changes

### ❌ DON'T:
- ✗ Send vague requests ("fix the AI")
- ✗ Skip testing instructions
- ✗ Make changes without context
- ✗ Ignore error messages
- ✗ Commit without messages
- ✗ Break existing functionality

## Example Workflow

### Step 1: Send Task
```
[CLINE_TASK]
PRIORITY: High
CATEGORY: Bug Fix
OBJECTIVE: Fix AI movement commands not working

CONTEXT:
- See test_ai_connection.html - forward movement test fails
- AIPlayerAPI exists but setInput() seems ignored
- Need to debug and fix

TESTING:
- Run test_ai_connection.html
- Click "Run Full Auto-Test"
- Character should move forward for 2 seconds

DEPENDENCIES: Game must be loaded
```

### Step 2: Cline Executes
1. ✓ Reads AIPlayerAPI code
2. ✓ Identifies issue
3. ✓ Creates fix
4. ✓ Tests it
5. ✓ Reports results

### Step 3: Track Progress
- Monitor `CLINE_STATUS.json`
- Check git commits
- Verify in game

### Step 4: Verify Completion
- ✓ Test runs successfully
- ✓ No new errors
- ✓ Performance unchanged
- ✓ Code documented

## Advanced: Custom Cline Tasks

### Create Reusable Task Templates

**File: `templates/cline-task-template.json`**
```json
{
  "name": "quick-fix",
  "description": "Fast bug fix workflow",
  "steps": [
    "Examine error logs",
    "Locate issue in code",
    "Apply minimal fix",
    "Run tests",
    "Commit with message"
  ]
}
```

### Chain Multiple Tasks

```
[CLINE_TASK_CHAIN]
TASK_1: Fix AI initialization
  - Priority: High
  - Objective: Make sure AIPlayerAPI initializes correctly

TASK_2: Extend with new features
  - Priority: Medium
  - Objective: Add AI state machine

TASK_3: Comprehensive testing
  - Priority: High
  - Objective: Create full test suite

DEPENDENCIES:
  - TASK_1 must complete before TASK_2
  - TASK_2 must complete before TASK_3
```

## Monitoring & Debugging

### Real-time Status
```javascript
// Check in console:
console.log(localStorage.getItem('cline_status'))
```

### Task History
```bash
# View recent tasks:
git log --oneline --grep="CLINE_TASK" -10
```

### Performance Analysis
```python
# Run diagnostics:
python run_diagnostics.py
python test_ai_comprehensive.py
```

## Emergency Stop

If something goes wrong:

### 1. Immediate Stop
- Close Cline or cancel current task
- Changes will only affect working branch

### 2. Revert Last Changes
```bash
git reset --hard HEAD~1
```

### 3. Review Changes
```bash
git diff HEAD~1
```

---

## Quick Reference

| Need | Use |
|------|-----|
| Quick fix | `[CLINE_TASK]` format |
| Complex feature | Task chain with dependencies |
| Testing | Include testing in TESTING section |
| Emergency | Git reset + close Cline |
| Status check | Read `CLINE_STATUS.json` |

## AI Collaboration Benefits

- **100% Autonomous**: Cline handles entire task lifecycle
- **Documented**: Every change tracked in git
- **Testable**: Built-in verification steps
- **Reversible**: Easy rollback if needed
- **Scalable**: Chain multiple tasks
- **Auditable**: Complete history maintained

---

**Last Updated**: 2026-02-11
**Version**: 1.0
**Status**: Active
