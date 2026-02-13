/**
 * gameBridge.js
 * 
 * Connects Ops Console to the running Omni-Ops game via HTTP API.
 * 
 * The game must expose a minimal HTTP bridge server (or middleware) that:
 *   - Runs on the same domain as the game (http://127.0.0.1:8080)
 *   - Exposes /game-api/status, /game-api/snapshot, /game-api/tests, 
 *     /game-api/run-test, /game-api/last-test
 * 
 * If the game API is unreachable, all methods gracefully return a
 * "bridge offline" response shape so the Ops Console UI can display
 * a clear status and suggestions.
 */

// ============================================================================
// Configuration
// ============================================================================

// Base URL for game API. Default to game running on localhost:8080
const GAME_API_BASE = process.env.OMNI_OPS_GAME_API_BASE || 'http://127.0.0.1:8080';

// Timeout in milliseconds for game API calls
const GAME_API_TIMEOUT = parseInt(process.env.OMNI_OPS_GAME_API_TIMEOUT || '5000', 10);

// ============================================================================
// Utility: Fetch with timeout
// ============================================================================

/**
 * Wrapper around fetch with timeout.
 * Throws if the request times out or network fails.
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GAME_API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Helper to call a game API endpoint and handle errors gracefully.
 * Returns { ok: boolean, data: any, error?: string }
 */
async function callGameAPI(endpoint, options = {}) {
  const url = `${GAME_API_BASE}${endpoint}`;
  
  try {
    console.log(`[gameBridge] Calling ${url}`);
    const response = await fetchWithTimeout(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`[gameBridge] ✓ ${endpoint} - Success`);
    return { ok: true, data };
  } catch (error) {
    console.error(`[gameBridge] ✗ ${endpoint} - ${error.message}`);
    return { ok: false, error: error.message };
  }
}

// ============================================================================
// Bridge Offline Response Helpers
// ============================================================================

/**
 * Returns a "bridge offline" status response when the game API is unreachable.
 */
function bridgeOfflineStatus() {
  return {
    bridgeOffline: true,
    ready: false,
    components: {
      agentBridge: false,
      intelligentAgent: false,
      aiPlayerAPI: false,
      testHarness: false
    },
    statusText: 'BRIDGE OFFLINE - Game API unreachable',
    error: `Cannot reach game API at ${GAME_API_BASE}/game-api/status`,
    suggestions: [
      `Ensure game is running at ${GAME_API_BASE}`,
      'Check that game-api endpoints are implemented and responding',
      'Verify network connectivity'
    ],
    lastDecision: null,
    currentErrors: ['Game API bridge is offline']
  };
}

/**
 * Returns a "bridge offline" snapshot response.
 */
function bridgeOfflineSnapshot() {
  return {
    bridgeOffline: true,
    timestamp: Date.now(),
    gameState: null,
    aiState: null,
    decisionHistory: [],
    error: `Cannot reach game API at ${GAME_API_BASE}/game-api/snapshot`,
    suggestions: [
      `Ensure game is running at ${GAME_API_BASE}`,
      'Implement /game-api/snapshot endpoint in game'
    ]
  };
}

// ============================================================================
// Public Bridge Functions
// ============================================================================

/**
 * GET /game-api/status
 * 
 * Expected game response:
 * {
 *   "ready": boolean,
 *   "components": {
 *     "agentBridge": boolean,
 *     "intelligentAgent": boolean,
 *     "aiPlayerAPI": boolean,
 *     "testHarness": boolean
 *   },
 *   "statusText": string,  // Human-readable status
 *   "lastDecision": {
 *     "decidedMode": string,
 *     "timestamp": number (ms),
 *     "reason": string
 *   },
 *   "currentErrors": array
 * }
 * 
 * Game should call: AgentBridge.status() + AgentBridge.getTestReadiness()
 */
async function getStatus() {
  const result = await callGameAPI('/game-api/status');
  
  if (!result.ok) {
    return bridgeOfflineStatus();
  }
  
  return result.data;
}

/**
 * GET /game-api/snapshot
 * 
 * Expected game response:
 * {
 *   "timestamp": number (ms),
 *   "gameState": {
 *     "playerHealth": number,
 *     "playerAmmo": number,
 *     "playerPosition": { x, y, z },
 *     "sector": string,
 *     "activeThreats": number
 *   },
 *   "aiState": {
 *     "currentMode": string,
 *     "lastCommand": string,
 *     "lastCommandTime": number (ms),
 *     "targetLocation": { x, y, z },
 *     "threatsNearby": [ { id, distance, direction }, ... ]
 *   },
 *   "decisionHistory": [
 *     { index, decidedMode, timestamp, reason },
 *     ...
 *   ]
 * }
 * 
 * Game should call: AgentBridge.exportSnapshot()
 */
async function getSnapshot() {
  const result = await callGameAPI('/game-api/snapshot');
  
  if (!result.ok) {
    return bridgeOfflineSnapshot();
  }
  
  return result.data;
}

/**
 * GET /game-api/tests
 * 
 * Expected game response:
 * {
 *   "tests": [ "test_name_1", "test_name_2", ... ]
 * }
 * 
 * Game should call: OmniOpsTestHarness.listTests()
 */
async function listTests() {
  const result = await callGameAPI('/game-api/tests');
  
  if (!result.ok) {
    return {
      bridgeOffline: true,
      tests: [],
      error: `Cannot reach game API at ${GAME_API_BASE}/game-api/tests`,
      suggestions: [
        `Ensure game is running at ${GAME_API_BASE}`,
        'Implement /game-api/tests endpoint in game'
      ]
    };
  }
  
  return result.data.tests || [];
}

/**
 * POST /game-api/run-test
 * 
 * Expected game request body:
 * {
 *   "name": "test_name",
 *   "options": { }
 * }
 * 
 * Expected game response:
 * {
 *   "name": string,
 *   "passed": boolean,
 *   "timestamp": number (ms),
 *   "metrics": { },
 *   "reasons": [ "reason_1", ... ]
 * }
 * 
 * Game should call: OmniOpsTestHarness.runTest(name, options)
 */
async function runTest(name, options = {}) {
  const result = await callGameAPI('/game-api/run-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, options })
  });
  
  if (!result.ok) {
    return {
      name,
      bridgeOffline: true,
      passed: false,
      timestamp: Date.now(),
      metrics: {},
      reasons: [`Game API unreachable at ${GAME_API_BASE}/game-api/run-test`],
      error: result.error,
      suggestions: [
        `Ensure game is running at ${GAME_API_BASE}`,
        'Implement /game-api/run-test endpoint in game'
      ]
    };
  }
  
  return result.data;
}

/**
 * GET /game-api/last-test
 * 
 * Expected game response:
 * {
 *   "name": string,
 *   "passed": boolean,
 *   "timestamp": number (ms),
 *   "metrics": { },
 *   "reasons": [ "reason_1", ... ]
 * }
 * 
 * Game should call: OmniOpsTestHarness.getLastResult()
 */
async function getLastTestResult() {
  const result = await callGameAPI('/game-api/last-test');
  
  if (!result.ok) {
    return {
      bridgeOffline: true,
      name: null,
      passed: false,
      timestamp: Date.now(),
      metrics: {},
      reasons: [`Game API unreachable at ${GAME_API_BASE}/game-api/last-test`],
      error: result.error,
      suggestions: [
        `Ensure game is running at ${GAME_API_BASE}`,
        'Implement /game-api/last-test endpoint in game'
      ]
    };
  }
  
  return result.data;
}

/**
 * POST /game-api/command
 * 
 * Expected game request body:
 * {
 *   "mode": "command_name"
 * }
 * 
 * Expected game response:
 * {
 *   "success": boolean,
 *   "command": string,
 *   "queuedAt": number (ms),
 *   "message": string
 * }
 * 
 * Game should call: AgentBridge.enqueueCommand(mode)
 */
async function sendAICommand(mode) {
  const result = await callGameAPI('/game-api/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  });
  
  if (!result.ok) {
    return {
      success: false,
      command: mode,
      bridgeOffline: true,
      error: result.error,
      message: `Game API unreachable at ${GAME_API_BASE}/game-api/command`,
      suggestions: [
        `Ensure game is running at ${GAME_API_BASE}`,
        'Implement /game-api/command endpoint in game'
      ]
    };
  }
  
  return result.data;
}

/**
 * GET /game-api/agent-status
 * 
 * Expected game response:
 * {
 *   "status": "Human-readable status string"
 * }
 * 
 * Game should call: AgentBridge.status()
 */
async function getAgentBridgeStatus() {
  const result = await callGameAPI('/game-api/agent-status');
  
  if (!result.ok) {
    return 'BRIDGE OFFLINE - Game API unreachable';
  }
  
  return result.data.status || result.data;
}

// ============================================================================
// Module exports
// ============================================================================

module.exports = {
  // Public API
  getStatus,
  getSnapshot,
  listTests,
  runTest,
  getLastTestResult,
  sendAICommand,
  getAgentBridgeStatus,
  
  // Configuration (for testing/debugging)
  getGameAPIBase: () => GAME_API_BASE,
  getGameAPITimeout: () => GAME_API_TIMEOUT
};
