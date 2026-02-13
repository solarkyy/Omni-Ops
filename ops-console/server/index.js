/**
 * server/index.js
 * 
 * Express server for Ops Console.
 * 
 * Endpoints:
 *   GET  /status          - AI readiness and status
 *   GET  /snapshot        - Full game + AI state snapshot
 *   GET  /tests           - List available tests
 *   POST /run-test        - Execute a test
 *   GET  /last-test       - Get last test result
 *   POST /chat            - Send message to Code-AI + Omni-Dev
 *   POST /command         - Send direct command to AI
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const gameBridge = require('./gameBridge');
const aiOrchestrator = require('./aiOrchestrator');
const commandExecutor = require('./commandExecutor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const CLIENT_DIR = path.join(__dirname, '../client');

// Static files (serve client/)
app.use('/ops-console', express.static(CLIENT_DIR));

app.get('/ops-console', (req, res) => {
  res.redirect('/ops-console/');
});

app.get('/ops-console/', (req, res) => {
  res.sendFile(path.join(CLIENT_DIR, 'index.html'));
});

// ============================================================================
// REST Endpoints
// ============================================================================

/**
 * GET /status
 * Returns AI readiness, component health, and current AI status.
 */
app.get('/status', async (req, res) => {
  try {
    const status = await gameBridge.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch status', details: error.message });
  }
});

/**
 * GET /snapshot
 * Returns full game state + AI decision history snapshot.
 */
app.get('/snapshot', async (req, res) => {
  try {
    const snapshot = await gameBridge.getSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch snapshot', details: error.message });
  }
});

/**
 * GET /tests
 * Returns list of available tests.
 */
app.get('/tests', async (req, res) => {
  try {
    const tests = await gameBridge.listTests();
    res.json({ tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Failed to fetch tests', details: error.message });
  }
});

/**
 * POST /run-test
 * Body: { "name": "patrol_basic", "options": { } }
 * Runs a named test and returns TestResult.
 */
app.post('/run-test', async (req, res) => {
  try {
    const { name, options } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing "name" field' });
    }
    const result = await gameBridge.runTest(name, options);
    res.json(result);
  } catch (error) {
    console.error('Error running test:', error);
    res.status(500).json({ error: 'Failed to run test', details: error.message });
  }
});

/**
 * GET /last-test
 * Returns the result of the most recently run test.
 */
app.get('/last-test', async (req, res) => {
  try {
    const result = await gameBridge.getLastTestResult();
    res.json(result);
  } catch (error) {
    console.error('Error fetching last test:', error);
    res.status(500).json({ error: 'Failed to fetch last test', details: error.message });
  }
});

/**
 * POST /chat
 * 
 * Input:
 * {
 *   "message": "Why didn't the AI engage?",
 *   "includeSnapshot": true,
 *   "includeLastTest": true
 * }
 *
 * Output:
 * {
 *   "reply": "...",
 *   "agents": {
 *     "code": { "text": "...", "raw": { } },
 *     "omniDev": { "reply": "...", "commands": [ ], "raw": { } }
 *   }
 * }
 */
app.post('/chat', async (req, res) => {
  try {
    const { message, includeSnapshot, includeLastTest } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Missing "message" field' });
    }

    const snapshot = includeSnapshot ? await gameBridge.getSnapshot() : null;
    const lastTestResult = includeLastTest ? await gameBridge.getLastTestResult() : null;

    const response = await aiOrchestrator.routeChat(message, {
      snapshot,
      lastTest: lastTestResult
    });

    res.json(response);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Failed to process chat', details: error.message });
  }
});

/**
 * POST /command
 * Body: { "mode": "patrol_area" }
 * Sends a direct AI command to the game.
 */
app.post('/command', async (req, res) => {
  try {
    const { mode } = req.body;
    if (!mode) {
      return res.status(400).json({ error: 'Missing "mode" field' });
    }
    const result = await gameBridge.sendAICommand(mode);
    res.json(result);
  } catch (error) {
    console.error('Error sending command:', error);
    res.status(500).json({ error: 'Failed to send command', details: error.message });
  }
});

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

// ============================================================================
// Server startup
// ============================================================================

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
