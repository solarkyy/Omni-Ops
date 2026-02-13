# Step 4: Behavior Code Request/Approval Hook - Implementation Guide

## Overview

This implementation adds a **safe behavior patch request/approval pipeline** that allows external LLMs to propose behavior changes while requiring explicit human approval before any code modifications go live.

**Key Principle**: NO CODE EXECUTION - This is a pure approval and tracking layer with no eval(), Function(), or dynamic script injection.

---

## Implementation Summary

### 1. New Files Created

- **`ai/BehaviorPatchManager.js`** - Core behavior patch management system
  - Manages pending, approved, and rejected patches
  - Exposes `window.AIBehaviorPatches` API
  - Provides safe validation and storage

### 2. Modified Files

- **`ai/AgentBridge.js`**
  - Added `request_behavior` command routing in `enqueueCommand()`
  - Updated `exportSnapshot()` to include `behaviorPatches` data
  - Added support for structured JSON commands

- **`index.html`**
  - Added `<script src="ai/BehaviorPatchManager.js" defer></script>` in load order

---

## Command Routing

### AgentBridge.enqueueCommand() Enhancement

```javascript
// NEW: Structured command parsing
let structuredCommand = null;
if (typeof cmd === 'string' && cmd.startsWith('{')) {
    structuredCommand = JSON.parse(cmd);
    cmd = structuredCommand.type || '';
}

// NEW: request_behavior routing
if (cmd === 'request_behavior') {
    if (!window.AIBehaviorPatches) {
        return { ok: false, message: 'AIBehaviorPatches module not loaded' };
    }
    
    const patchResult = window.AIBehaviorPatches.createPatchRequest(
        structuredCommand.payload
    );
    
    return {
        ok: patchResult.ok,
        type: 'behavior_request_recorded',
        patchId: patchResult.patchId,
        message: patchResult.message
    };
}
```

---

## AIBehaviorPatches API

### window.AIBehaviorPatches Methods

#### 1. **list(status = 'pending')**
Returns array of patches, optionally filtered by status.

```javascript
// List all pending patches
const pending = AIBehaviorPatches.list('pending');
console.table(pending);

// List all patches (pending, approved, rejected)
const all = AIBehaviorPatches.list('all');
```

**Returns:**
```javascript
[
  {
    id: "seek_ai_tweak_1",
    featureId: "seek_ai_tweak_1",
    summary: "More aggressive enemy pursuit",
    targetFile: "IntelligentAgent.js",
    targetSection: "seek_enemies mode",
    proposer: "external_llm",
    createdAt: "2026-02-12T10:30:00.000Z",
    status: "pending",
    codeLength: 245
  },
  // ... more patches
]
```

#### 2. **get(id)**
Get full details of a specific patch (including code).

```javascript
const patch = AIBehaviorPatches.get('seek_ai_tweak_1');
console.log(patch.code);  // View full code
```

#### 3. **apply(id)**
Approve and apply a pending patch. Logs to AI Dev Log and console.

```javascript
const result = AIBehaviorPatches.apply('seek_ai_tweak_1');
// Console will show full patch details and code
// AI Dev Log will record the approval
```

**Returns:**
```javascript
{
  ok: true,
  message: "Patch 'seek_ai_tweak_1' approved and logged. Review console for code details.",
  patch: {
    id: "seek_ai_tweak_1",
    summary: "More aggressive enemy pursuit",
    targetFile: "IntelligentAgent.js",
    codeLength: 245
  }
}
```

#### 4. **reject(id, reason)**
Reject a pending patch with optional reason.

```javascript
AIBehaviorPatches.reject('seek_ai_tweak_1', 'Too aggressive for current balance');
```

#### 5. **stats()**
Get patch counts by status.

```javascript
const stats = AIBehaviorPatches.stats();
// { pending: 2, approved: 5, rejected: 1, total: 8 }
```

#### 6. **clear(status = 'all')**
Clear patches by status.

```javascript
AIBehaviorPatches.clear('rejected');  // Clear rejected patches
AIBehaviorPatches.clear('all');       // Clear everything
```

#### 7. **exportSnapshot()** (Internal)
Called by AgentBridge.exportSnapshot() - returns lightweight metadata.

```javascript
// This is called automatically by AgentBridge.exportSnapshot()
// Do not call directly
```

---

## exportSnapshot() Enhancement

### Updated Snapshot Structure

```javascript
const snapshot = window.AgentBridge.exportSnapshot();
console.log(JSON.stringify(snapshot, null, 2));
```

**New `behaviorPatches` field:**
```json
{
  "timestamp": "2026-02-12T10:35:00.000Z",
  "playerState": { /* ... */ },
  "sectorState": { /* ... */ },
  "aiContext": { /* ... */ },
  "agentState": { /* ... */ },
  "behaviorPatches": {
    "pending": [
      {
        "id": "seek_ai_tweak_1",
        "featureId": "seek_ai_tweak_1",
        "summary": "More aggressive enemy pursuit",
        "createdAt": "2026-02-12T10:30:00.000Z",
        "codeLength": 245,
        "targetFile": "IntelligentAgent.js"
      }
    ],
    "appliedCount": 3,
    "rejectedCount": 1
  },
  "recentActions": [ /* ... */ ],
  "commandExecutions": [ /* ... */ ],
  "bridgeReady": true
}
```

**Key Points:**
- Only includes **lightweight metadata** (no full code bodies)
- Pending patches show summary and basic info
- Applied/rejected counts are aggregated
- Safe for external LLM consumption

---

## Usage Examples

### Example 1: External LLM Requests a Behavior Change

```javascript
// External LLM sends structured command
window.AgentBridge.enqueueCommand(JSON.stringify({
  type: 'request_behavior',
  payload: {
    featureId: 'patrol_wider_sweep',
    summary: 'Increase patrol radius from 30m to 50m for better coverage',
    code: `
// Modified patrol logic
const PATROL_RADIUS = 50;  // Increased from 30
// ... rest of implementation
`,
    targetFile: 'IntelligentAgent.js',
    targetSection: 'patrol_area mode'
  }
}));

// Result:
// {
//   ok: true,
//   type: "behavior_request_recorded",
//   patchId: "patrol_wider_sweep",
//   message: "Patch 'patrol_wider_sweep' created and awaiting approval"
// }
```

**AI Dev Log shows:**
```
📝 Behavior patch requested: "patrol_wider_sweep" – Increase patrol radius from 30m to 50m for better coverage. Awaiting approval (AIBehaviorPatches.list/apply).
```

### Example 2: Human Reviews and Approves

```javascript
// 1. List pending patches
const pending = AIBehaviorPatches.list();
console.table(pending);

// 2. Get full details
const patch = AIBehaviorPatches.get('patrol_wider_sweep');
console.log('Summary:', patch.summary);
console.log('Code:', patch.code);

// 3. Approve if satisfied
AIBehaviorPatches.apply('patrol_wider_sweep');
```

**Console output:**
```
[AIBehaviorPatches] Patch approved: patrol_wider_sweep
Patch details: {
  featureId: "patrol_wider_sweep",
  summary: "Increase patrol radius from 30m to 50m for better coverage",
  targetFile: "IntelligentAgent.js",
  targetSection: "patrol_area mode",
  codeLength: 87
}
Code to apply:
// Modified patrol logic
const PATROL_RADIUS = 50;  // Increased from 30
// ... rest of implementation
```

**AI Dev Log shows:**
```
✅ Behavior patch APPROVED: "patrol_wider_sweep" – Increase patrol radius from 30m to 50m for better coverage. Target: IntelligentAgent.js (87 chars).
```

### Example 3: Human Rejects Patch

```javascript
AIBehaviorPatches.reject('patrol_wider_sweep', 'Performance concerns - 50m is too wide');
```

**AI Dev Log shows:**
```
❌ Behavior patch REJECTED: "patrol_wider_sweep" – Performance concerns - 50m is too wide
```

### Example 4: LLM Reads Snapshot to Check Patch Status

```javascript
const snapshot = window.AgentBridge.exportSnapshot();

// Check pending patches
console.log('Pending patches:', snapshot.behaviorPatches.pending.length);
console.log('Applied patches:', snapshot.behaviorPatches.appliedCount);

// LLM can see:
// - How many patches are waiting for review
// - What patches have been applied
// - Summaries of pending patches (for context)
```

---

## Validation Rules

The `createPatchRequest()` method validates:

1. **featureId**: Non-empty string, must be unique
2. **summary**: Non-empty string, max 500 chars
3. **code**: String between 10 and 10,000 chars
4. **targetFile** (optional): String
5. **targetSection** (optional): String
6. **Max pending limit**: 20 patches (prevents spam)

**Example validation error:**
```javascript
window.AgentBridge.enqueueCommand(JSON.stringify({
  type: 'request_behavior',
  payload: {
    featureId: '',  // Invalid: empty
    summary: 'Test',
    code: 'abc'  // Invalid: too short
  }
}));

// Returns:
// { ok: false, message: "Invalid featureId: must be a non-empty string" }
```

---

## Safety Guarantees

✅ **NO eval() or Function()** - Code is stored as strings only  
✅ **NO dynamic script injection** - No DOM script element creation  
✅ **NO automatic execution** - All patches require explicit human approval  
✅ **Full logging** - Every action is logged to AI Dev Log  
✅ **Validation** - All inputs are validated before storage  
✅ **Limits** - Max 20 pending patches to prevent abuse  
✅ **Backwards compatible** - Existing commands still work normally  

---

## Testing in Browser Console

### Quick Test Workflow

```javascript
// 1. Request a patch
window.AgentBridge.enqueueCommand(JSON.stringify({
  type: 'request_behavior',
  payload: {
    featureId: 'test_patch_1',
    summary: 'Test behavior modification',
    code: '// Test code\nconsole.log("Hello from test patch");',
    targetFile: 'IntelligentAgent.js',
    targetSection: 'test section'
  }
}));

// 2. Check snapshot
const snapshot = window.AgentBridge.exportSnapshot();
console.log('Pending patches:', snapshot.behaviorPatches.pending);

// 3. List patches
AIBehaviorPatches.list();

// 4. View full patch
AIBehaviorPatches.get('test_patch_1');

// 5. Approve
AIBehaviorPatches.apply('test_patch_1');

// 6. Check stats
AIBehaviorPatches.stats();
```

---

## What's Next

This implementation provides the **approval metadata layer**. To actually execute approved patches:

1. **Manual application**: Copy code from console and edit files by hand
2. **Future enhancement**: Add a `window.AIBehaviorPatches.execute(id)` method that safely applies patches using predefined target hooks
3. **IDE integration**: Connect to VS Code extension that can apply patches as file edits

For now, this system ensures **full human control** while maintaining **clear audit trails** of all proposed changes.

---

## Summary

✅ **Command routing**: `request_behavior` commands route to AIBehaviorPatches  
✅ **Patch management**: Full CRUD operations via `window.AIBehaviorPatches`  
✅ **Snapshot integration**: `exportSnapshot()` includes behaviorPatches metadata  
✅ **Safe by design**: No code execution, only approval tracking  
✅ **Well logged**: All actions recorded in AI Dev Log  
✅ **Backwards compatible**: Existing commands unaffected  

You now have a production-ready behavior patch request/approval system that external LLMs can use to propose changes while you maintain full control over what gets applied.
