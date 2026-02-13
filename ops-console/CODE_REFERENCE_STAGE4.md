# Ready-to-Deploy Code Reference

This file contains all code changes in ready-to-copy format.

---

## 1. New File: commandExecutor.js

**Path:** `ops-console/server/commandExecutor.js`

**Full file content:**

```javascript
/**
 * commandExecutor.js
 *
 * Executes Omni-Dev commands against the game bridge.
 *
 * Command types supported:
 *   - run_test { name, options? }
 *   - inspect_snapshot { }
 *   - send_ai_command { mode }
 *   - check_status { }
 *
 * Usage:
 *   const executor = require('./commandExecutor');
 *   const result = await executor.executeCommands([
 *     { type: "run_test", name: "patrol_basic" },
 *     { type: "check_status" }
 *   ]);
 */

const gameBridge = require('./gameBridge');

/**
 * Execute a single command via gameBridge.
 * Returns { command, result, error: null | string }
 */
async function executeCommand(command) {
  try {
    if (!command || !command.type) {
      return {
        command,
        result: null,
        error: 'Missing "type" field'
      };
    }

    let result;

    switch (command.type) {
      case 'run_test': {
        if (!command.name) {
          return {
            command,
            result: null,
            error: 'Missing "name" field for run_test'
          };
        }
        result = await gameBridge.runTest(command.name, command.options || {});
        break;
      }

      case 'inspect_snapshot': {
        result = await gameBridge.getSnapshot();
        break;
      }

      case 'send_ai_command': {
        if (!command.mode) {
          return {
            command,
            result: null,
            error: 'Missing "mode" field for send_ai_command'
          };
        }
        result = await gameBridge.sendAICommand(command.mode);
        break;
      }

      case 'check_status': {
        result = await gameBridge.getStatus();
        break;
      }

      default: {
        return {
          command,
          result: null,
          error: `Unknown command type: "${command.type}"`
        };
      }
    }

    // Command executed successfully (even if game API is offline)
    return {
      command,
      result,
      error: null
    };
  } catch (error) {
    return {
      command,
      result: null,
      error: error.message
    };
  }
}

/**
 * Execute a batch of commands.
 * Returns { executed: [{ command, result, error }, ...] }
 */
async function executeCommands(commands = []) {
  if (!Array.isArray(commands)) {
    return {
      executed: [],
      error: 'Commands must be an array'
    };
  }

  const executed = [];

  for (const command of commands) {
    const result = await executeCommand(command);
    executed.push(result);
  }

  // Summarize results
  const successCount = executed.filter(e => !e.error).length;
  const failureCount = executed.filter(e => e.error).length;

  return {
    executed,
    summary: {
      total: executed.length,
      successful: successCount,
      failed: failureCount
    }
  };
}

module.exports = {
  executeCommand,
  executeCommands
};
```

---

## 2. Modified: server/index.js

**Path:** `ops-console/server/index.js`

### Change 1: Add require (Line 23)

**Before:**
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const gameBridge = require('./gameBridge');
const aiOrchestrator = require('./aiOrchestrator');
```

**After:**
```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const gameBridge = require('./gameBridge');
const aiOrchestrator = require('./aiOrchestrator');
const commandExecutor = require('./commandExecutor');
```

### Change 2: Add POST /execute-commands endpoint (Before server startup)

**Insert this code before the "Server startup" comment:**

```javascript
/**
 * POST /execute-commands
 * 
 * Input:
 * {
 *   "commands": [
 *     { "type": "run_test", "name": "patrol_basic", "options": {} },
 *     { "type": "inspect_snapshot" },
 *     { "type": "send_ai_command", "mode": "patrol_area" },
 *     { "type": "check_status" }
 *   ]
 * }
 *
 * Output:
 * {
 *   "executed": [
 *     { "command": {...}, "result": {...}, "error": null | string },
 *     ...
 *   ],
 *   "summary": {
 *     "total": 4,
 *     "successful": 3,
 *     "failed": 1
 *   }
 * }
 */
app.post('/execute-commands', async (req, res) => {
  try {
    const { commands } = req.body;
    if (!Array.isArray(commands)) {
      return res.status(400).json({ error: 'Expected "commands" to be an array' });
    }

    const result = await commandExecutor.executeCommands(commands);
    res.json(result);
  } catch (error) {
    console.error('Error executing commands:', error);
    res.status(500).json({ error: 'Failed to execute commands', details: error.message });
  }
});
```

### Change 3: Update startup banner

**Before:**
```javascript
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      Omni-Ops Ops Console Server       ║
╠════════════════════════════════════════╣
║  Server: http://localhost:${PORT}          ║
║  Open: http://localhost:${PORT}            ║
║                                        ║
║  Endpoints:                            ║
║    GET  /status                        ║
║    GET  /snapshot                      ║
║    GET  /tests                         ║
║    POST /run-test                      ║
║    GET  /last-test                     ║
║    POST /chat                          ║
║    POST /command                       ║
╚════════════════════════════════════════╝
  `);
});
```

**After (add this line):**
```javascript
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║      Omni-Ops Ops Console Server       ║
╠════════════════════════════════════════╣
║  Server: http://localhost:${PORT}          ║
║  Open: http://localhost:${PORT}            ║
║                                        ║
║  Endpoints:                            ║
║    GET  /status                        ║
║    GET  /snapshot                      ║
║    GET  /tests                         ║
║    POST /run-test                      ║
║    GET  /last-test                     ║
║    POST /chat                          ║
║    POST /command                       ║
║    POST /execute-commands ⭐ NEW       ║
╚════════════════════════════════════════╝
  `);
});
```

---

## 3. Modified: client/main.js

**Path:** `ops-console/client/main.js`

### Change 1: Add state variable (Line 14)

**Before:**
```javascript
// State
let chatHistory = [];
let testResults = {};
let currentSnapshot = null;
let availableTests = [];

let omniChannel = null;
```

**After:**
```javascript
// State
let chatHistory = [];
let testResults = {};
let currentSnapshot = null;
let availableTests = [];
let latestCommands = []; // ⭐ NEW: Store latest Omni-Dev commands

let omniChannel = null;
```

### Change 2: Enhance command display with button (In addChatMessage function)

**Before:**
```javascript
  // Render Omni-Dev commands if present
  if (commands && commands.length > 0) {
    const commandsDiv = document.createElement('div');
    commandsDiv.className = 'omnidev-commands';
    commandsDiv.innerHTML = `<strong>Commands:</strong><pre>${JSON.stringify(commands, null, 2)}</pre>`;
    bubble.appendChild(commandsDiv);
  }
```

**After:**
```javascript
  // Render Omni-Dev commands if present
  if (commands && commands.length > 0) {
    const commandsDiv = document.createElement('div');
    commandsDiv.className = 'omnidev-commands';
    commandsDiv.innerHTML = `<strong>Commands:</strong><pre>${JSON.stringify(commands, null, 2)}</pre>`;
    bubble.appendChild(commandsDiv);

    // ⭐ NEW: Store and show execute button
    latestCommands = commands;
    const executeDiv = document.createElement('div');
    executeDiv.style.marginTop = '8px';
    const executeBtn = document.createElement('button');
    executeBtn.textContent = '▶ Run Omni-Dev Commands';
    executeBtn.style.backgroundColor = '#0099ff';
    executeBtn.style.color = 'white';
    executeBtn.style.padding = '6px 12px';
    executeBtn.style.border = 'none';
    executeBtn.style.borderRadius = '4px';
    executeBtn.style.cursor = 'pointer';
    executeBtn.style.fontSize = '12px';
    executeBtn.style.fontWeight = 'bold';
    executeBtn.onclick = executeOmniDevCommands;
    executeDiv.appendChild(executeBtn);
    bubble.appendChild(executeDiv);
  }
```

### Change 3: Add command execution function

**Add this entire section after `removeLastChatMessages()` and before `sendChat()`:**

```javascript
// ============================================================================
// Command Execution (⭐ NEW)
// ============================================================================

/**
 * Execute the latest Omni-Dev commands via the /execute-commands endpoint.
 */
async function executeOmniDevCommands() {
  if (!latestCommands || latestCommands.length === 0) {
    addChatMessage('assistant', 'code', 'No commands to execute.');
    return;
  }

  try {
    // Show executing status
    addChatMessage('assistant', 'code', `Executing ${latestCommands.length} command(s)...`);

    // Call the backend executor
    const response = await fetchJSON('/execute-commands', {
      method: 'POST',
      body: JSON.stringify({ commands: latestCommands })
    });

    // Parse results
    const { executed, summary } = response;
    const successful = summary ? summary.successful : 0;
    const failed = summary ? summary.failed : 0;

    // Build result message
    const resultLines = [`✓ Executed ${executed.length} command(s)`];

    if (summary) {
      resultLines.push(`  Successful: ${successful}`);
      resultLines.push(`  Failed: ${failed}`);
    }

    // Show each command result
    executed.forEach((exec, i) => {
      const cmdType = exec.command?.type || 'unknown';
      const status = exec.error ? '❌' : '✅';
      const detail = exec.error ? ` (${exec.error})` : '';
      resultLines.push(`  [${i + 1}] ${status} ${cmdType}${detail}`);
    });

    addChatMessage('assistant', 'omnidev', resultLines.join('\n'));

    // Refresh UI to show latest state
    setTimeout(() => {
      updateStatusBar();
      refreshSnapshot();
    }, 500);
  } catch (error) {
    console.error('Error executing commands:', error);
    addChatMessage('assistant', 'code', `Command execution failed: ${error.message}`);
  }
}
```

---

## Verification Checklist

- ✅ `commandExecutor.js` created with all 4 command types
- ✅ `server/index.js` requires commandExecutor module
- ✅ `server/index.js` has POST /execute-commands endpoint
- ✅ `server/index.js` startup banner includes new endpoint
- ✅ `client/main.js` has latestCommands state variable
- ✅ `client/main.js` renders execute button when commands present
- ✅ `client/main.js` has executeOmniDevCommands function
- ✅ Button triggers command execution and shows results

---

## Quick Test Command

```bash
curl -X POST http://localhost:3000/execute-commands \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      { "type": "check_status" }
    ]
  }'
```

Expected response: JSON with status check result.

---

**All code is production-ready and tested.**
