/**
 * AI TEST HARNESS CONTROL PANEL
 * 
 * In-game UI for running and monitoring automated AI tests.
 * Integrates with ai_test_harness.js
 * 
 * HOTKEYS:
 * - F12: Toggle test panel (when game is active)
 * 
 * ACCESS:
 * - Browser console: window.AiTestPanel.toggle()
 * - In-game: F12 key
 */

(function() {
    'use strict';

    const CONFIG = {
        devMode: true,
        panelWidth: '450px',
        panelMaxHeight: '600px'
    };

    let panelState = {
        isOpen: false,
        isRunning: false,
        currentTest: null,
        testLog: [],
        maxLogEntries: 50
    };

    // ─────────────────────────────────────────────────────────────────────
    // UI CREATION
    // ─────────────────────────────────────────────────────────────────────

    function createPanelHTML() {
        return `
<div id="ai-test-panel" style="
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: ${CONFIG.panelWidth};
    max-height: ${CONFIG.panelMaxHeight};
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 2px solid #00ff00;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
    z-index: 9999;
    font-family: 'Courier New', monospace;
    display: none;
    flex-direction: column;
    color: #00ff00;
    font-size: 12px;
">
    <!-- Header -->
    <div style="
        padding: 10px 15px;
        background: rgba(0, 255, 0, 0.1);
        border-bottom: 1px solid #00ff00;
        display: flex;
        justify-content: space-between;
        align-items: center;
    ">
        <span style="font-weight: bold; text-transform: uppercase;">⚙ AI Test Harness</span>
        <button id="ai-test-close" style="
            background: none;
            border: none;
            color: #00ff00;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">✕</button>
    </div>

    <!-- Status Bar -->
    <div id="ai-test-status" style="
        padding: 8px 15px;
        background: rgba(0, 255, 0, 0.05);
        border-bottom: 1px solid #00aa00;
        font-size: 11px;
        min-height: 20px;
    ">Ready</div>

    <!-- Scenario Selection -->
    <div style="padding: 10px 15px; border-bottom: 1px solid #00aa00;">
        <div style="margin-bottom: 5px; text-transform: uppercase; font-size: 11px; opacity: 0.7;">Scenario:</div>
        <select id="ai-test-scenario-select" style="
            width: 100%;
            padding: 6px 8px;
            background: #0a0a0a;
            border: 1px solid #00ff00;
            color: #00ff00;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            margin-bottom: 8px;
        "></select>
        <button id="ai-test-setup-btn" style="
            width: 100%;
            padding: 8px;
            background: #00ff00;
            color: #000;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 11px;
        ">SETUP SCENARIO</button>
    </div>

    <!-- Script Selection -->
    <div style="padding: 10px 15px; border-bottom: 1px solid #00aa00;">
        <div style="margin-bottom: 5px; text-transform: uppercase; font-size: 11px; opacity: 0.7;">Test Script:</div>
        <select id="ai-test-script-select" style="
            width: 100%;
            padding: 6px 8px;
            background: #0a0a0a;
            border: 1px solid #00ff00;
            color: #00ff00;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            margin-bottom: 8px;
        "></select>
        <button id="ai-test-run-btn" style="
            width: 100%;
            padding: 8px;
            background: #00ff00;
            color: #000;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 11px;
        ">RUN TEST</button>
    </div>

    <!-- Quick Actions -->
    <div style="padding: 10px 15px; border-bottom: 1px solid #00aa00; display: flex; gap: 8px;">
        <button id="ai-test-stop-btn" style="
            flex: 1;
            padding: 6px;
            background: #ff3333;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 11px;
            font-family: 'Courier New', monospace;
        ">STOP</button>
        <button id="ai-test-clear-btn" style="
            flex: 1;
            padding: 6px;
            background: #333333;
            color: #fff;
            border: 1px solid #666;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-family: 'Courier New', monospace;
        ">CLEAR</button>
    </div>

    <!-- Test Log -->
    <div id="ai-test-log" style="
        flex: 1;
        overflow-y: auto;
        padding: 10px 15px;
        border-bottom: 1px solid #00aa00;
        background: #050505;
        max-height: 250px;
        font-size: 10px;
        line-height: 1.4;
    "></div>

    <!-- Results Section (hidden by default) -->
    <div id="ai-test-results" style="
        padding: 10px 15px;
        border-bottom: 1px solid #00aa00;
        background: rgba(0, 0, 0, 0.3);
        display: none;
        font-size: 10px;
    "></div>

    <!-- Export Button -->
    <div style="padding: 10px 15px;">
        <button id="ai-test-export-btn" style="
            width: 100%;
            padding: 6px;
            background: #0066ff;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-family: 'Courier New', monospace;
        ">EXPORT RESULTS JSON</button>
    </div>
</div>
        `;
    }

    // ─────────────────────────────────────────────────────────────────────
    // PANEL MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────

    function initializePanel() {
        // Check if panel already exists
        if (document.getElementById('ai-test-panel')) {
            return;
        }

        // Create panel HTML
        const panelHTML = createPanelHTML();
        const container = document.createElement('div');
        container.innerHTML = panelHTML;
        document.body.appendChild(container.firstChild);

        // Populate scenario dropdown
        if (window.OmniOpsTestHarness) {
            const scenarioSelect = document.getElementById('ai-test-scenario-select');
            const scriptSelect = document.getElementById('ai-test-script-select');

            window.OmniOpsTestHarness.availableScenarios.forEach(scenario => {
                const option = document.createElement('option');
                option.value = scenario;
                option.textContent = scenario;
                scenarioSelect.appendChild(option);
            });

            window.OmniOpsTestHarness.availableScripts.forEach(script => {
                const option = document.createElement('option');
                option.value = script;
                option.textContent = script;
                scriptSelect.appendChild(option);
            });
        }

        // Bind event listeners
        bindEventListeners();
        log('Panel initialized. Ready for testing.');
    }

    function toggle() {
        const panel = document.getElementById('ai-test-panel');
        if (!panel) {
            initializePanel();
            return;
        }

        panelState.isOpen = !panelState.isOpen;
        panel.style.display = panelState.isOpen ? 'flex' : 'none';
    }

    // ─────────────────────────────────────────────────────────────────────
    // EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────────────

    function bindEventListeners() {
        const closeBtn = document.getElementById('ai-test-close');
        const setupBtn = document.getElementById('ai-test-setup-btn');
        const runBtn = document.getElementById('ai-test-run-btn');
        const stopBtn = document.getElementById('ai-test-stop-btn');
        const clearBtn = document.getElementById('ai-test-clear-btn');
        const exportBtn = document.getElementById('ai-test-export-btn');

        if (closeBtn) closeBtn.addEventListener('click', toggle);
        if (setupBtn) setupBtn.addEventListener('click', onSetupScenario);
        if (runBtn) runBtn.addEventListener('click', onRunTest);
        if (stopBtn) stopBtn.addEventListener('click', onStopTest);
        if (clearBtn) clearBtn.addEventListener('click', onClearLog);
        if (exportBtn) exportBtn.addEventListener('click', onExportResults);
    }

    async function onSetupScenario() {
        const scenarioSelect = document.getElementById('ai-test-scenario-select');
        const scenario = scenarioSelect.value;

        updateStatus('Setting up scenario...');
        log(`[SETUP] ${scenario}`);

        try {
            await window.OmniOpsTestHarness.setupScenario(scenario);
            updateStatus(`Scenario ready: ${scenario}`, 'success');
            log(`✓ ${scenario} ready`);
        } catch (err) {
            updateStatus(`Setup failed: ${err.message}`, 'error');
            log(`✗ Setup error: ${err.message}`);
        }
    }

    async function onRunTest() {
        if (!window.OmniOpsTestHarness.currentScenario) {
            updateStatus('Setup a scenario first', 'error');
            log('✗ No scenario selected. Click SETUP first.');
            return;
        }

        const scriptSelect = document.getElementById('ai-test-script-select');
        const script = scriptSelect.value;

        panelState.isRunning = true;
        updateStatus(`Running: ${script}...`, 'running');
        log(`\n[TEST START] ${script}`);
        log(`Timestamp: ${new Date().toISOString()}`);

        try {
            const results = await window.OmniOpsTestHarness.runScript(script);
            
            panelState.isRunning = false;
            const testResults = window.OmniOpsTestHarness.getResults();

            if (testResults.passed) {
                updateStatus(`✓ PASSED`, 'success');
                log(`✓ Test passed!`);
            } else {
                updateStatus(`✗ FAILED`, 'error');
                log(`✗ Test failed`);
            }

            log(`Checks: ${testResults.summary.passed_checks}/${testResults.summary.total_checks}`);
            log(`Duration: ${testResults.summary.total_duration_ms}ms`);
            log(`Errors: ${testResults.errors.length}`);

            displayResults(testResults);

        } catch (err) {
            panelState.isRunning = false;
            updateStatus(`Test error: ${err.message}`, 'error');
            log(`✗ Error: ${err.message}`);
        }
    }

    function onStopTest() {
        if (panelState.isRunning) {
            panelState.isRunning = false;
            updateStatus('Test stopped', 'warning');
            log('Test execution stopped');
        }
    }

    function onClearLog() {
        panelState.testLog = [];
        const logDiv = document.getElementById('ai-test-log');
        if (logDiv) logDiv.innerHTML = '';
    }

    function onExportResults() {
        try {
            const results = window.OmniOpsTestHarness.getResults();
            const json = JSON.stringify(results, null, 2);
            
            // Copy to clipboard
            navigator.clipboard.writeText(json).then(() => {
                log('✓ Results copied to clipboard');
                updateStatus('Results exported', 'success');
            }).catch(err => {
                log(`✗ Clipboard error: ${err}`);
                console.log('[AI Test Panel] Results:', json);
            });
        } catch (err) {
            log(`✗ Export error: ${err.message}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LOGGING & DISPLAY
    // ─────────────────────────────────────────────────────────────────────

    function log(message) {
        panelState.testLog.push(message);
        if (panelState.testLog.length > CONFIG.maxLogEntries) {
            panelState.testLog.shift();
        }

        const logDiv = document.getElementById('ai-test-log');
        if (logDiv) {
            logDiv.innerHTML = panelState.testLog.map(msg => {
                const escaped = String(msg).replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<div>${escaped}</div>`;
            }).join('');
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        if (CONFIG.devMode) {
            console.log('[AI Test Panel]', message);
        }
    }

    function updateStatus(message, type = 'normal') {
        const statusDiv = document.getElementById('ai-test-status');
        if (!statusDiv) return;

        let style = 'color: #00ff00;';
        if (type === 'error') style = 'color: #ff3333;';
        else if (type === 'warning') style = 'color: #ffaa00;';
        else if (type === 'success') style = 'color: #00ff00;';
        else if (type === 'running') style = 'color: #00cccc;';

        statusDiv.innerHTML = `<span style="${style}">${message}</span>`;
    }

    function displayResults(results) {
        const resultsTab = document.getElementById('ai-test-results');
        if (!resultsTab) return;

        let html = `
<div style="background: ${results.passed ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 51, 51, 0.1)'}; padding: 8px; border-radius: 4px;">
    <div style="font-weight: bold; margin-bottom: 5px;">
        ${results.passed ? '✓ TEST PASSED' : '✗ TEST FAILED'}
    </div>
    <div>Passed: ${results.summary.passed_checks}/${results.summary.total_checks}</div>
    <div>Duration: ${results.summary.total_duration_ms}ms</div>
    <div>Errors: ${results.errors.length}</div>
    ${results.errors.length > 0 ? `
        <div style="margin-top: 5px; color: #ff6666;">
            ${results.errors.slice(0, 3).map(e => 
                `<div>• ${e.message.substring(0, 40)}</div>`
            ).join('')}
        </div>
    ` : ''}
</div>
        `;

        resultsTab.innerHTML = html;
        resultsTab.style.display = 'block';
    }

    // ─────────────────────────────────────────────────────────────────────
    // KEYBOARD SHORTCUTS
    // ─────────────────────────────────────────────────────────────────────

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // F12 to toggle panel (when game is active)
            if (e.code === 'F12' && window.isGameActive) {
                e.preventDefault();
                toggle();
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────

    const AiTestPanel = {
        toggle,
        log,
        updateStatus,
        initialize: initializePanel,
        get isOpen() { return panelState.isOpen; },
        get isRunning() { return panelState.isRunning; }
    };

    // ─────────────────────────────────────────────────────────────────────
    // INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────

    // Wait for AI test harness to be ready
    function waitForHarness() {
        if (window.OmniOpsTestHarness) {
            initializePanel();
            setupKeyboardShortcuts();
            window.AiTestPanel = AiTestPanel;
            console.log('[AI Test Panel] ✓ Initialized and ready');
            console.log('[AI Test Panel] Press F12 to toggle, or call window.AiTestPanel.toggle()');
        } else {
            setTimeout(waitForHarness, 100);
        }
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForHarness);
    } else {
        waitForHarness();
    }

    window.AiTestPanel = AiTestPanel;

})();
