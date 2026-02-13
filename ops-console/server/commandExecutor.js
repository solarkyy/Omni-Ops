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
