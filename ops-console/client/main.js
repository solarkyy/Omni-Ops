/**
 * client/main.js
 * 
 * Frontend logic for Ops Console.
 * Manages UI state, fetches from server endpoints, and handles user interactions.
 */

const API_BASE = '';

// State
let chatHistory = [];
let testResults = {};
let currentSnapshot = null;
let availableTests = [];
let latestCommands = []; // ⭐ NEW: Store latest Omni-Dev commands

let omniChannel = null;

// ============================================================================
// Utility Functions
// ============================================================================

async function fetchJSON(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch error on ${path}:`, error);
    throw error;
  }
}

function canExecuteLocally() {
  return typeof window !== 'undefined' && (window.AIPlayerAPI || window.AgentBridge);
}

async function executeCommandsLocally(commands) {
  const executed = [];
  let successful = 0;
  let failed = 0;

  for (const command of commands) {
    try {
      let result = null;
      if (command.type === 'run_test') {
        if (typeof window.runAITest === 'function') {
          result = await window.runAITest(command.name);
        } else {
          throw new Error('runAITest not available');
        }
      } else if (command.type === 'inspect_snapshot') {
        if (window.AgentBridge?.exportSnapshot) {
          result = window.AgentBridge.exportSnapshot();
        } else if (window.AIPlayerAPI?.getGameState) {
          result = window.AIPlayerAPI.getGameState();
        } else {
          throw new Error('No snapshot provider available');
        }
      } else if (command.type === 'send_ai_command') {
        if (window.AgentBridge?.enqueueCommand) {
          result = window.AgentBridge.enqueueCommand(command.mode || command.command || 'status');
        } else {
          throw new Error('AgentBridge.enqueueCommand not available');
        }
      } else if (command.type === 'check_status') {
        if (window.AgentBridge?.status) {
          result = window.AgentBridge.status();
        } else {
          result = { apiAvailable: !!window.AIPlayerAPI };
        }
      } else {
        throw new Error(`Unsupported local command type: ${command.type}`);
      }

      executed.push({ command, result, error: null });
      successful += 1;
    } catch (err) {
      executed.push({ command, result: null, error: err.message });
      failed += 1;
    }
  }

  return {
    executed,
    summary: {
      total: executed.length,
      successful,
      failed
    }
  };
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ============================================================================
// Status Bar Updates
// ============================================================================

async function updateStatusBar() {
  try {
    const status = await fetchJSON('/status');

    document.getElementById('last-refresh').textContent = timeAgo(Date.now());

    // Health light
    const healthLight = document.getElementById('health-light');
    const healthText = document.getElementById('health-text');

    if (status.ready && status.components.agentBridge) {
      healthLight.className = 'health-indicator ready';
      healthText.textContent = 'AI: READY';
    } else {
      healthLight.className = 'health-indicator error';
      healthText.textContent = 'AI: NOT READY';
    }

    // Mode display
    if (status.lastDecision) {
      document.getElementById('mode-display').textContent = `Mode: ${status.lastDecision.decidedMode}`;
    }

    // Get snapshot for threats and health
    if (!currentSnapshot) {
      await refreshSnapshot();
    }

    if (currentSnapshot) {
      const threats = currentSnapshot.aiState?.threatsNearby?.length || 0;
      const health = currentSnapshot.gameState?.playerHealth || 100;
      document.getElementById('threats-display').textContent = `Threats: ${threats}`;
      document.getElementById('player-health-display').textContent = `Health: ${health}%`;
    }
  } catch (error) {
    console.error('Error updating status bar:', error);
  }
}

// ============================================================================
// Snapshot Panel
// ============================================================================

async function refreshSnapshot() {
  try {
    currentSnapshot = await fetchJSON('/snapshot');
    renderSnapshot();
  } catch (error) {
    console.error('Error refreshing snapshot:', error);
    document.getElementById('snapshot-display').innerHTML = `<p style="color: #ff4444;">Error fetching snapshot</p>`;
  }
}

function renderSnapshot() {
  if (!currentSnapshot) {
    document.getElementById('snapshot-display').innerHTML = '<p>No snapshot available</p>';
    const freshness = document.getElementById('snapshot-freshness');
    if (freshness) {
      freshness.textContent = 'Last snapshot: none yet';
    }
    return;
  }

  const snap = currentSnapshot;
  const html = `
    <div class="snapshot-field">
      <span class="snapshot-field-label">Game State:</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Health:</span>
      <span class="snapshot-field-value">${snap.gameState?.playerHealth}%</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Ammo:</span>
      <span class="snapshot-field-value">${snap.gameState?.playerAmmo} rounds</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Sector:</span>
      <span class="snapshot-field-value">${snap.gameState?.sector}</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Threats:</span>
      <span class="snapshot-field-value">${snap.gameState?.activeThreats || 0}</span>
    </div>

    <div class="snapshot-field" style="margin-top: 12px;">
      <span class="snapshot-field-label">AI State:</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Mode:</span>
      <span class="snapshot-field-value">${snap.aiState?.currentMode}</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Target:</span>
      <span class="snapshot-field-value">(${snap.aiState?.targetLocation?.x.toFixed(1)}, ${snap.aiState?.targetLocation?.y.toFixed(1)})</span>
    </div>
    <div class="snapshot-field" style="margin-left: 12px;">
      <span class="snapshot-field-label">Threats Nearby:</span>
      <span class="snapshot-field-value">${snap.aiState?.threatsNearby?.length || 0}</span>
    </div>

    <div class="snapshot-field" style="margin-top: 12px;">
      <span class="snapshot-field-label">Decision History:</span>
    </div>
    ${(snap.decisionHistory || []).slice(0, 3).map((d, i) => `
      <div class="snapshot-field" style="margin-left: 12px; font-size: 11px;">
        <span style="color: #888;">[${i}]</span>
        <span style="color: #00ff88;">${d.decidedMode}</span>
        <span style="color: #888;">${timeAgo(d.timestamp)}</span>
        <br/>
        <span style="color: #b0b6ff; margin-left: 12px;">${d.reason}</span>
      </div>
    `).join('')}
  `;

  document.getElementById('snapshot-display').innerHTML = html;
  updateSnapshotFreshness();
  updateStatusBar(); // Update status bar with fresh snapshot data
}

function updateSnapshotFreshness() {
  const freshness = document.getElementById('snapshot-freshness');
  if (!freshness) return;

  const ts = currentSnapshot?.timestamp;
  if (!ts) {
    freshness.textContent = 'Last snapshot: none yet';
    return;
  }

  const ageMs = Date.now() - ts;
  if (ageMs < 1000) {
    freshness.textContent = 'Last snapshot: just now';
    return;
  }

  const totalSeconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const secondsWithTenth = (ageMs / 1000).toFixed(1);

  if (minutes > 0) {
    freshness.textContent = `Last snapshot: ${minutes}m ${seconds}s ago`;
  } else {
    freshness.textContent = `Last snapshot: ${secondsWithTenth}s ago`;
  }
}

// ============================================================================
// Tests Panel
// ============================================================================

async function loadTests() {
  try {
    const data = await fetchJSON('/tests');
    availableTests = data.tests || [];
    renderTests();
  } catch (error) {
    console.error('Error loading tests:', error);
  }
}

function renderTests() {
  const testsDisplay = document.getElementById('tests-display');
  testsDisplay.innerHTML = '';

  availableTests.forEach(testName => {
    const testDiv = document.createElement('div');
    testDiv.className = 'test-item';

    const label = document.createElement('span');
    label.textContent = testName;

    const button = document.createElement('button');
    button.textContent = 'Run';
    button.onclick = () => runTest(testName, button);

    testDiv.appendChild(label);
    testDiv.appendChild(button);
    testsDisplay.appendChild(testDiv);
  });
}

async function runTest(testName, buttonElement) {
  if (buttonElement) {
    buttonElement.textContent = '...';
    buttonElement.disabled = true;
  }

  try {
    const result = await fetchJSON('/run-test', {
      method: 'POST',
      body: JSON.stringify({ name: testName, options: {} })
    });

    testResults[testName] = result;

    // Update the test item styling
    const testParent = buttonElement?.parentElement;
    if (testParent) {
      testParent.className = result.passed ? 'test-item passed' : 'test-item failed';
    }

    // Show result
    renderLastTestResult();
  } catch (error) {
    console.error(`Error running test ${testName}:`, error);
    if (buttonElement) {
      buttonElement.textContent = '❌';
    }
  } finally {
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.textContent = 'Run';
    }
  }
}

function renderLastTestResult() {
  // Get the most recent test result
  const lastTest = Object.values(testResults)[Object.values(testResults).length - 1];

  if (!lastTest) {
    document.getElementById('last-test-result').innerHTML = '';
    return;
  }

  const reasons = (lastTest.reasons || []).map(r => `<div class="test-result-reason">✓ ${r}</div>`).join('');

  const html = `
    <div class="test-result-title">
      ${lastTest.passed ? '✅' : '❌'} ${lastTest.name}
    </div>
    <div style="font-size: 10px; color: #888; margin-bottom: 6px;">
      ${new Date(lastTest.timestamp || Date.now()).toLocaleTimeString()}
    </div>
    ${reasons}
  `;

  document.getElementById('last-test-result').innerHTML = html;
}

// ============================================================================
// Chat
// ============================================================================

function addChatMessage(role, from, text, commands = null) {
  chatHistory.push({ role, from, text, commands });

  const chatHistoryDiv = document.getElementById('chat-history');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message';

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${from}`;

  const label = document.createElement('div');
  label.className = 'bubble-label';
  label.textContent = from === 'omnidev'
    ? 'Omni-Dev'
    : from === 'code'
      ? 'Code-AI'
      : from === 'summary'
        ? 'Summary'
        : 'You';

  bubble.appendChild(label);

  const textNode = document.createElement('div');
  textNode.textContent = text;
  textNode.style.maxHeight = '200px';
  textNode.style.overflowY = 'auto';
  bubble.appendChild(textNode);

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

  messageDiv.appendChild(bubble);
  chatHistoryDiv.appendChild(messageDiv);

  // Auto-scroll to bottom
  chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

function removeLastChatMessages(count) {
  if (count <= 0) return;
  chatHistory = chatHistory.slice(0, -count);
  const chatHistoryDiv = document.getElementById('chat-history');
  const messages = chatHistoryDiv.querySelectorAll('.chat-message');
  for (let i = 0; i < count; i += 1) {
    const node = messages[messages.length - 1 - i];
    if (node && node.parentElement) {
      node.parentElement.removeChild(node);
    }
  }
}

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

    let response = null;
    try {
      const httpResponse = await fetch(`${API_BASE}/execute-commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: latestCommands })
      });

      if (!httpResponse.ok) {
        throw new Error(`HTTP ${httpResponse.status}`);
      }

      response = await httpResponse.json();
    } catch (error) {
      if (canExecuteLocally()) {
        console.log('[OpsConsole] HTTP call failed, switching to local execution via AIPlayerAPI/AgentBridge.');
        addChatMessage('assistant', 'code', 'HTTP blocked - executing locally via AIPlayerAPI/AgentBridge.');
        response = await executeCommandsLocally(latestCommands);
      } else {
        throw error;
      }
    }

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

async function sendChat(message) {
  if (!message.trim()) return;

  // Add user message
  addChatMessage('user', 'user', message);

  // Clear input
  document.getElementById('chat-input').value = '';

  try {
    // Show loading spinners
    addChatMessage('assistant', 'summary', 'Routing...');
    addChatMessage('assistant', 'code', 'Thinking...');
    addChatMessage('assistant', 'omnidev', 'Analyzing...');

    // Send to chat endpoint
    const response = await fetchJSON('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, includeSnapshot: true, includeLastTest: true })
    });

    // Remove loading messages (last three)
    removeLastChatMessages(3);

    // Add merged response
    if (response.reply) {
      addChatMessage('assistant', 'summary', response.reply);
    }
    if (response.agents?.code) {
      addChatMessage('assistant', 'code', response.agents.code.text || '');
    }
    if (response.agents?.omniDev) {
      addChatMessage('assistant', 'omnidev', response.agents.omniDev.reply || '', response.agents.omniDev.commands || []);
    }
  } catch (error) {
    console.error('Error sending chat:', error);
    removeLastChatMessages(3);
    addChatMessage('assistant', 'summary', `Error: ${error.message}`);
  }
}

// ============================================================================
// Event Listeners
// ============================================================================

document.getElementById('refresh-snapshot-btn').addEventListener('click', refreshSnapshot);

document.getElementById('send-button').addEventListener('click', () => {
  const input = document.getElementById('chat-input');
  sendChat(input.value);
});

document.getElementById('chat-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = document.getElementById('chat-input');
    sendChat(input.value);
  }
});

// Quick command buttons
document.querySelectorAll('.quick-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const mode = btn.getAttribute('data-mode');
    try {
      await fetchJSON('/command', {
        method: 'POST',
        body: JSON.stringify({ mode })
      });
      addChatMessage('assistant', 'omnidev', `Command "${mode}" sent to AI.`);
    } catch (error) {
      addChatMessage('assistant', 'code', `Failed to send command: ${error.message}`);
    }
  });
});

// ============================================================================
// Initialization
// ============================================================================

async function init() {
  try {
    initBroadcastChannel();
    // Load initial data
    await updateStatusBar();
    await refreshSnapshot();
    await loadTests();

    // Start polling status bar every 3 seconds
    setInterval(updateStatusBar, 3000);

    // Welcome message
    addChatMessage('assistant', 'omnidev', 'Omni-Dev ready. Describe what you see or want to test, and I\'ll help you debug the AI behavior.');
  } catch (error) {
    console.error('Initialization error:', error);
    addChatMessage('assistant', 'code', `Connection error: ${error.message}`);
  }
}

// Start the app
init();

function initBroadcastChannel() {
  try {
    // TODO: In the game tab, post messages via BroadcastChannel('omni-ops') when snapshots/tests update.
    omniChannel = new BroadcastChannel('omni-ops');
    omniChannel.onmessage = (event) => {
      const payload = event.data || {};
      if (payload.type === 'snapshot') {
        refreshSnapshot();
      }
      if (payload.type === 'status') {
        updateStatusBar();
      }
    };
  } catch (error) {
    console.warn('BroadcastChannel not available:', error);
  }
}
