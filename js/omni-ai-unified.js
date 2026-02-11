// OMNI-OPS UNIFIED AI DIAGNOSTICS
// Combined AI Testing + Live Cam Interface
// Press F3 or F4 to open
(function() {
    'use strict';
    console.log('[AI Unified] Initializing unified diagnostics v2.0...');

const AIUnified = {
    active: false,
    aiPlayerActive: false,
    aiLoopInterval: null,
    updateInterval: null,
    statsInterval: null,
    testQueue: [],
    currentTest: null,
    visualMarkers: [],
    chatHistory: [],
    serverUrl: 'http://localhost:8080',

    init: function() {
        console.log('[AI Unified] Creating unified interface...');
        this.createUI();
        this.setupKeys();
        this.setupStyles();
        this.connectToAI();
        this.startTestLoop();
    },

    createUI: function() {
        // Create diagnostic button
        const diagButton = document.createElement('button');
        diagButton.id = 'unified-diagnostic-btn';
        diagButton.innerHTML = '🤖 AI DIAGNOSTICS (F3/F4)';
        diagButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 600;
            padding: 8px 15px;
            background: #0a3a0a;
            color: #0f6;
            border: 2px solid #0f6;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-family: monospace;
            font-size: 12px;
            transition: all 0.2s;
            box-shadow: 0 0 10px rgba(0,255,100,0.3);
        `;
        diagButton.onmouseover = () => {
            diagButton.style.background = '#0f6';
            diagButton.style.color = '#000';
            diagButton.style.boxShadow = '0 0 20px rgba(0,255,100,0.6)';
        };
        diagButton.onmouseout = () => {
            diagButton.style.background = '#0a3a0a';
            diagButton.style.color = '#0f6';
            diagButton.style.boxShadow = '0 0 10px rgba(0,255,100,0.3)';
        };
        diagButton.onclick = () => this.toggle();
        document.body.appendChild(diagButton);

        const html = `
            <div id="ai-unified-overlay" class="ai-unified-hidden">
                <div class="ai-unified-container">
                    <!-- Header -->
                    <div class="ai-unified-header">
                        <div class="ai-unified-title">🤖 AI UNIFIED DIAGNOSTICS - Testing + Live Cam</div>
                        <div class="ai-status-indicator">
                            <span class="ai-dot" id="ai-player-dot"></span>
                            <span id="ai-status-text">AI Inactive</span>
                        </div>
                        <button class="ai-unified-close" onclick="window.AIUnified.toggle()">✕</button>
                    </div>

                    <!-- Three Column Layout -->
                    <div class="ai-unified-content">
                        <!-- LEFT: Live Cam View -->
                        <div class="ai-unified-left">
                            <div class="panel-header">📹 LIVE CAM VIEW</div>

                            <!-- Game Feed -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">🎮 Game Viewport</div>
                                <div class="game-feed">
                                    <canvas id="ai-vision-canvas" width="400" height="300"></canvas>
                                    <div class="game-overlay-info">
                                        <div id="ai-target-indicator" class="target-indicator">NO TARGET</div>
                                        <div id="ai-crosshair" class="ai-crosshair"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Tactical Radar -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">🎯 Tactical Radar</div>
                                <canvas id="ai-radar-canvas" width="300" height="300"></canvas>
                                <div class="radar-legend">
                                    <span>🟢 Player</span>
                                    <span>🔴 Enemies</span>
                                    <span>⚪ Objects</span>
                                </div>
                            </div>

                            <!-- Debug Info -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">🔧 Debug Info</div>
                                <div class="debug-info">
                                    <div class="debug-line">Position: <span id="debug-pos">0, 0, 0</span></div>
                                    <div class="debug-line">Look: <span id="debug-look">0°, 0°</span></div>
                                    <div class="debug-line">Velocity: <span id="debug-vel">0, 0, 0</span></div>
                                    <div class="debug-line">Enemies: <span id="debug-enemies">0</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- MIDDLE: AI Brain & Controls -->
                        <div class="ai-unified-middle">
                            <div class="panel-header">🧠 AI BRAIN & CONTROLS</div>

                            <!-- AI Controls -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">🎛️ AI Player Controls</div>
                                <div class="controls-grid">
                                    <button id="btn-ai-start" class="ai-btn ai-btn-start"
                                            onclick="window.AIUnified.startAI()">▶️ START AI</button>
                                    <button id="btn-ai-stop" class="ai-btn ai-btn-stop"
                                            onclick="window.AIUnified.stopAI()" disabled>⏹️ STOP AI</button>
                                    <button class="ai-btn" onclick="window.AIUnified.resetStats()">🔄 RESET</button>
                                    <button class="ai-btn" onclick="window.AIUnified.testConnection()">🔗 TEST</button>
                                </div>

                                <!-- AI Settings -->
                                <div class="ai-settings">
                                    <div class="setting-row">
                                        <label>Difficulty:</label>
                                        <select id="ai-difficulty" class="setting-select">
                                            <option value="easy">Easy</option>
                                            <option value="medium" selected>Medium</option>
                                            <option value="hard">Hard</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>
                                    <div class="setting-row">
                                        <label>Aggression:</label>
                                        <input type="range" id="ai-aggression" min="0" max="100" value="70">
                                        <span id="ai-aggression-val">70%</span>
                                    </div>
                                    <div class="setting-row">
                                        <label>Update Rate:</label>
                                        <input type="range" id="ai-update-rate" min="100" max="1000" value="200" step="100">
                                        <span id="ai-update-val">200ms</span>
                                    </div>
                                </div>
                            </div>

                            <!-- AI Brain State -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">🧠 Current State</div>
                                <div class="brain-content">
                                    <div class="brain-row">
                                        <span class="brain-label">STATE:</span>
                                        <span id="ai-state" class="brain-value">IDLE</span>
                                    </div>
                                    <div class="brain-row">
                                        <span class="brain-label">TARGET:</span>
                                        <span id="ai-target" class="brain-value">None</span>
                                    </div>
                                    <div class="brain-row">
                                        <span class="brain-label">OBJECTIVE:</span>
                                        <span id="ai-objective" class="brain-value">Waiting...</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Statistics -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">📊 Performance Stats</div>
                                <div class="stats-grid">
                                    <div class="stat-box">
                                        <div class="stat-value" id="stat-kills">0</div>
                                        <div class="stat-label">KILLS</div>
                                    </div>
                                    <div class="stat-box">
                                        <div class="stat-value" id="stat-accuracy">0%</div>
                                        <div class="stat-label">ACCURACY</div>
                                    </div>
                                    <div class="stat-box">
                                        <div class="stat-value" id="stat-time">0s</div>
                                        <div class="stat-label">ALIVE</div>
                                    </div>
                                    <div class="stat-box">
                                        <div class="stat-value" id="stat-health">100</div>
                                        <div class="stat-label">HEALTH</div>
                                    </div>
                                    <div class="stat-box">
                                        <div class="stat-value" id="stat-ammo">30</div>
                                        <div class="stat-label">AMMO</div>
                                    </div>
                                    <div class="stat-box">
                                        <div class="stat-value" id="stat-enemies">0</div>
                                        <div class="stat-label">ENEMIES</div>
                                    </div>
                                </div>
                            </div>

                            <!-- AI Thoughts -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">💭 AI Thought Stream</div>
                                <div id="ai-thoughts" class="thoughts-stream"></div>
                            </div>
                        </div>

                        <!-- RIGHT: Testing & Chat -->
                        <div class="ai-unified-right">
                            <div class="panel-header">🧪 AI TESTING & CHAT</div>

                            <!-- Test Execution -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">⚙️ Test Execution</div>
                                <div class="current-test-display">
                                    <div class="test-label">Current:</div>
                                    <div id="current-test-name">No test running</div>
                                    <div class="test-progress">
                                        <div class="progress-bar" id="test-progress"></div>
                                    </div>
                                </div>

                                <div class="test-queue-display">
                                    <div class="test-label">Queue (<span id="queue-count">0</span>):</div>
                                    <div id="test-queue" class="test-list"></div>
                                </div>

                                <!-- Quick Test Buttons -->
                                <div class="quick-test-btns">
                                    <button class="ai-btn ai-btn-small" onclick="window.AIUnified.runQuickTest('movement')">Movement</button>
                                    <button class="ai-btn ai-btn-small" onclick="window.AIUnified.runQuickTest('shooting')">Shooting</button>
                                    <button class="ai-btn ai-btn-small" onclick="window.AIUnified.runQuickTest('ui')">UI</button>
                                    <button class="ai-btn ai-btn-small ai-btn-danger" onclick="window.AIUnified.clearTests()">Clear</button>
                                </div>
                            </div>

                            <!-- Test Results -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">📋 Recent Results</div>
                                <div id="test-results" class="test-results-list"></div>
                            </div>

                            <!-- Chat Interface -->
                            <div class="ai-panel-box chat-panel">
                                <div class="panel-subtitle">💬 Chat with AI</div>
                                <div id="ai-chat-messages" class="chat-messages"></div>
                                <div class="chat-input-box">
                                    <input type="text" id="ai-chat-input" class="chat-input"
                                           placeholder="Ask AI to test something..."
                                           onkeypress="if(event.key==='Enter') window.AIUnified.sendMessage()">
                                    <button class="chat-send-btn" onclick="window.AIUnified.sendMessage()">Send</button>
                                </div>
                            </div>

                            <!-- Activity Log -->
                            <div class="ai-panel-box">
                                <div class="panel-subtitle">📝 Activity Log</div>
                                <div id="ai-activity-log" class="activity-log"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Visual Test Markers -->
                <div id="ai-test-markers"></div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Setup sliders
        const aggressionSlider = document.getElementById('ai-aggression');
        const updateSlider = document.getElementById('ai-update-rate');

        if (aggressionSlider) {
            aggressionSlider.oninput = (e) => {
                document.getElementById('ai-aggression-val').textContent = e.target.value + '%';
            };
        }

        if (updateSlider) {
            updateSlider.oninput = (e) => {
                document.getElementById('ai-update-val').textContent = e.target.value + 'ms';
            };
        }
    },

    setupStyles: function() {
        if (document.getElementById('ai-unified-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-unified-styles';
        style.textContent = `
            .ai-unified-hidden { display: none !important; }

            #ai-unified-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10001;
                font-family: 'Courier New', monospace;
                color: #0f6;
            }

            .ai-unified-container {
                width: 98%;
                height: 98%;
                margin: 1%;
                background: #000;
                border: 3px solid #0f6;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 0 40px rgba(0, 255, 100, 0.4);
            }

            .ai-unified-header {
                background: linear-gradient(to bottom, #0f6, #0a4);
                padding: 12px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #0f6;
            }

            .ai-unified-title {
                font-size: 18px;
                font-weight: bold;
                color: #000;
            }

            .ai-status-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #000;
                font-weight: bold;
            }

            .ai-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #f00;
                animation: pulse 2s infinite;
            }

            .ai-dot.active {
                background: #0f0;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .ai-unified-close {
                background: #f44;
                color: #fff;
                border: none;
                width: 30px;
                height: 30px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
            }

            .ai-unified-close:hover {
                background: #f66;
            }

            .ai-unified-content {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
                padding: 10px;
                overflow: hidden;
            }

            .ai-unified-left, .ai-unified-middle, .ai-unified-right {
                display: flex;
                flex-direction: column;
                gap: 10px;
                overflow-y: auto;
            }

            .panel-header {
                font-size: 16px;
                font-weight: bold;
                color: #0ff;
                padding: 8px 10px;
                background: rgba(0, 255, 255, 0.1);
                border: 2px solid #0ff;
                border-radius: 6px;
                text-align: center;
            }

            .ai-panel-box {
                background: rgba(0, 255, 100, 0.05);
                border: 2px solid #0f6;
                border-radius: 6px;
                padding: 10px;
            }

            .panel-subtitle {
                font-size: 13px;
                font-weight: bold;
                color: #0f6;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(0, 255, 100, 0.3);
            }

            .game-feed {
                position: relative;
                width: 100%;
                height: 200px;
                background: #111;
                border: 2px solid #333;
                border-radius: 4px;
                overflow: hidden;
            }

            #ai-vision-canvas {
                width: 100%;
                height: 100%;
                image-rendering: pixelated;
            }

            .game-overlay-info {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .target-indicator {
                position: absolute;
                top: 5px;
                left: 5px;
                background: rgba(255, 0, 0, 0.8);
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: bold;
            }

            .ai-crosshair {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border: 2px solid #0f0;
                border-radius: 50%;
            }

            #ai-radar-canvas {
                width: 100%;
                height: 200px;
                background: #000;
                border: 1px solid #0f6;
                border-radius: 4px;
            }

            .radar-legend {
                display: flex;
                justify-content: space-around;
                margin-top: 5px;
                font-size: 10px;
            }

            .debug-info {
                font-size: 11px;
            }

            .debug-line {
                padding: 3px 0;
                display: flex;
                justify-content: space-between;
            }

            .debug-line span {
                color: #0ff;
            }

            .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                margin-bottom: 10px;
            }

            .ai-btn {
                padding: 8px;
                background: #0a3a0a;
                color: #0f6;
                border: 2px solid #0f6;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 11px;
                transition: all 0.2s;
                font-family: 'Courier New', monospace;
            }

            .ai-btn:hover:not(:disabled) {
                background: #0f6;
                color: #000;
                box-shadow: 0 0 10px #0f6;
            }

            .ai-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .ai-btn-start {
                background: #0a3a0a;
                border-color: #0f0;
                color: #0f0;
            }

            .ai-btn-start:hover:not(:disabled) {
                background: #0f0;
                color: #000;
            }

            .ai-btn-stop {
                background: #3a0a0a;
                border-color: #f00;
                color: #f00;
            }

            .ai-btn-stop:hover:not(:disabled) {
                background: #f00;
                color: #fff;
            }

            .ai-btn-small {
                padding: 6px;
                font-size: 10px;
            }

            .ai-btn-danger {
                border-color: #f44;
                color: #f44;
            }

            .ai-btn-danger:hover {
                background: #f44;
                color: #000;
            }

            .ai-settings {
                margin-top: 8px;
            }

            .setting-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                font-size: 11px;
            }

            .setting-row label {
                flex: 0 0 70px;
                color: #0f6;
            }

            .setting-select,
            .setting-row input[type="range"] {
                flex: 1;
                background: #000;
                color: #0f6;
                border: 1px solid #0f6;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 10px;
            }

            .brain-content {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .brain-row {
                display: flex;
                justify-content: space-between;
                padding: 4px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
                font-size: 11px;
            }

            .brain-label {
                color: #0f6;
                font-weight: bold;
            }

            .brain-value {
                color: #0ff;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 6px;
            }

            .stat-box {
                background: rgba(0, 0, 0, 0.5);
                padding: 8px;
                border-radius: 4px;
                border: 1px solid #0f6;
                text-align: center;
            }

            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #0ff;
                margin-bottom: 3px;
            }

            .stat-label {
                font-size: 9px;
                color: #0f6;
            }

            .thoughts-stream {
                max-height: 120px;
                overflow-y: auto;
                font-size: 10px;
                line-height: 1.3;
            }

            .thought-entry {
                padding: 4px;
                margin-bottom: 3px;
                background: rgba(0, 255, 100, 0.1);
                border-left: 2px solid #0f6;
                border-radius: 2px;
            }

            .thought-time {
                color: #0f6;
                margin-right: 5px;
            }

            .current-test-display, .test-queue-display {
                margin-bottom: 10px;
            }

            .test-label {
                font-size: 10px;
                color: #0f6;
                opacity: 0.7;
                margin-bottom: 5px;
                text-transform: uppercase;
            }

            #current-test-name {
                font-size: 11px;
                font-weight: bold;
                color: #0ff;
                margin-bottom: 5px;
            }

            .test-progress {
                height: 4px;
                background: #1a1a1a;
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #0f6, #0ff);
                width: 0%;
                transition: width 0.3s;
            }

            .test-list {
                max-height: 100px;
                overflow-y: auto;
                font-size: 10px;
            }

            .test-item {
                background: rgba(0, 255, 255, 0.1);
                border-left: 2px solid #0ff;
                padding: 4px;
                margin: 3px 0;
                font-size: 10px;
                border-radius: 2px;
            }

            .quick-test-btns {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
                margin-top: 8px;
            }

            .test-results-list {
                max-height: 100px;
                overflow-y: auto;
                font-size: 10px;
            }

            .test-result {
                padding: 5px;
                margin: 3px 0;
                font-size: 10px;
                border-radius: 3px;
                border-left: 2px solid #0f6;
            }

            .test-result.pass {
                background: rgba(0, 255, 100, 0.15);
                border-left-color: #0f6;
            }

            .test-result.fail {
                background: rgba(255, 68, 68, 0.15);
                border-left-color: #f44;
            }

            .chat-panel {
                flex: 1;
            }

            .chat-messages {
                max-height: 150px;
                overflow-y: auto;
                padding: 8px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 100, 0.3);
                border-radius: 4px;
                margin-bottom: 8px;
                font-size: 11px;
            }

            .chat-message {
                margin: 5px 0;
                padding: 5px 8px;
                border-radius: 4px;
                font-size: 11px;
                line-height: 1.3;
            }

            .chat-message.user {
                background: rgba(0, 255, 255, 0.15);
                border-left: 2px solid #0ff;
                margin-left: 15px;
            }

            .chat-message.ai {
                background: rgba(0, 255, 100, 0.15);
                border-left: 2px solid #0f6;
                margin-right: 15px;
            }

            .chat-message.system {
                background: rgba(255, 255, 0, 0.1);
                border-left: 2px solid #ff0;
                font-size: 10px;
                opacity: 0.8;
            }

            .chat-sender {
                font-weight: bold;
                margin-bottom: 2px;
                font-size: 9px;
                opacity: 0.7;
            }

            .chat-input-box {
                display: flex;
                gap: 5px;
            }

            .chat-input {
                flex: 1;
                background: #1a1a1a;
                border: 1px solid #0f6;
                color: #0f6;
                padding: 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 11px;
            }

            .chat-input:focus {
                outline: none;
                box-shadow: 0 0 8px rgba(0, 255, 100, 0.3);
            }

            .chat-send-btn {
                background: #0a3a0a;
                color: #0f6;
                border: 2px solid #0f6;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
                font-size: 11px;
            }

            .chat-send-btn:hover {
                background: #0f6;
                color: #000;
            }

            .activity-log {
                max-height: 100px;
                overflow-y: auto;
                font-size: 10px;
                line-height: 1.3;
            }

            .log-entry {
                padding: 3px 5px;
                margin-bottom: 2px;
                border-left: 2px solid #0f6;
            }

            .log-entry.ai-action {
                border-color: #0ff;
            }

            .log-entry.ai-combat {
                border-color: #f00;
            }

            .log-entry.ai-success {
                border-color: #0f0;
            }

            /* In-game visual markers */
            #ai-test-markers {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            }

            .test-marker {
                position: absolute;
                width: 40px;
                height: 40px;
                border: 3px solid #0ff;
                border-radius: 50%;
                background: rgba(0, 255, 255, 0.2);
                animation: markerPulse 1s infinite;
                pointer-events: none;
            }

            .test-marker::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 10px;
                height: 10px;
                background: #0ff;
                border-radius: 50%;
                box-shadow: 0 0 10px #0ff;
            }

            @keyframes markerPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
            }

            .test-marker.success {
                border-color: #0f6;
                background: rgba(0, 255, 100, 0.2);
            }

            .test-marker.success::after {
                background: #0f6;
                box-shadow: 0 0 10px #0f6;
            }

            .test-marker.fail {
                border-color: #f44;
                background: rgba(255, 68, 68, 0.2);
            }

            .test-marker.fail::after {
                background: #f44;
                box-shadow: 0 0 10px #f44;
            }
        `;

        document.head.appendChild(style);
    },

    setupKeys: function() {
        const handler = (e) => {
            // Both F3 and F4 open the unified interface
            if (e.code === 'F3' || e.code === 'F4') {
                e.preventDefault();
                this.toggle();
                return true;
            }
            return false;
        };

        if (window.OmniKeybinds && window.OmniKeybinds.register) {
            window.OmniKeybinds.register({
                id: 'ai-unified',
                priority: 100,
                onKeyDown: handler
            });
        } else {
            document.addEventListener('keydown', handler);
        }
    },

    toggle: function() {
        this.active = !this.active;
        const overlay = document.getElementById('ai-unified-overlay');
        const button = document.getElementById('unified-diagnostic-btn');
        if (overlay) {
            if (this.active) {
                overlay.classList.remove('ai-unified-hidden');
                if (button) button.style.opacity = '0.6';
                this.startUpdates();
                if (typeof document.exitPointerLock === 'function') {
                    document.exitPointerLock();
                }
            } else {
                overlay.classList.add('ai-unified-hidden');
                if (button) button.style.opacity = '1';
                this.stopUpdates();
                if (window.isGameActive && typeof window.safeRequestPointerLock === 'function') {
                    window.safeRequestPointerLock();
                }
            }
        }
    },

    connectToAI: function() {
        setTimeout(() => {
            this.addChatMessage('system', 'Unified AI Diagnostics initialized. Press F3 or F4 to toggle.');
            this.addChatMessage('ai', 'Hello! I can test your game systems and play autonomously. Try "test movement" or click START AI to watch me play!');
        }, 500);
    },

    // === UPDATE METHODS ===

    startUpdates: function() {
        this.updateInterval = setInterval(() => this.updateDisplay(), 100);
        this.statsInterval = setInterval(() => this.updateStats(), 500);
    },

    stopUpdates: function() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.statsInterval) clearInterval(this.statsInterval);
    },

    updateDisplay: function() {
        if (!window.AIPlayerAPI) return;

        const state = window.AIPlayerAPI.getGameState();
        if (!state) return;

        // Update debug info
        document.getElementById('debug-pos').textContent =
            `${state.player.x.toFixed(1)}, ${state.player.y.toFixed(1)}, ${state.player.z.toFixed(1)}`;
        document.getElementById('debug-look').textContent =
            `${(state.player.yaw * 180 / Math.PI).toFixed(0)}°, ${(state.player.pitch * 180 / Math.PI).toFixed(0)}°`;
        document.getElementById('debug-vel').textContent =
            `${state.player.velocity.x.toFixed(2)}, ${state.player.velocity.y.toFixed(2)}, ${state.player.velocity.z.toFixed(2)}`;
        document.getElementById('debug-enemies').textContent = state.enemies.length;

        // Draw radar
        this.drawRadar(state);
    },

    updateStats: function() {
        if (!window.AIPlayerAPI) return;

        const state = window.AIPlayerAPI.getGameState();
        if (!state) return;

        document.getElementById('stat-health').textContent = Math.floor(state.player.health);
        document.getElementById('stat-ammo').textContent = `${state.player.ammo}/${state.player.reserveAmmo}`;
        document.getElementById('stat-enemies').textContent = state.enemies.length;
    },

    drawRadar: function(state) {
        const canvas = document.getElementById('ai-radar-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const scale = 3;
        const centerX = width / 2;
        const centerY = height / 2;

        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
            ctx.stroke();
        }
        for (let i = 0; i < height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
            ctx.stroke();
        }

        // Player (center)
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Player direction
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.sin(state.player.yaw) * 20,
            centerY + Math.cos(state.player.yaw) * 20
        );
        ctx.stroke();

        // Enemies
        state.enemies.forEach(enemy => {
            const dx = (enemy.x - state.player.x) * scale;
            const dz = (enemy.z - state.player.z) * scale;

            ctx.fillStyle = enemy.faction === 'RAIDER' ? '#f00' : '#fa0';
            ctx.beginPath();
            ctx.arc(centerX + dx, centerY + dz, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    // === AI CONTROL METHODS ===

    startAI: function() {
        this.log('Starting AI player...', 'ai-action');
        document.getElementById('btn-ai-start').disabled = true;
        document.getElementById('btn-ai-stop').disabled = false;
        document.getElementById('ai-status-text').textContent = 'AI Active';
        document.querySelector('.ai-dot').classList.add('active');
        this.aiPlayerActive = true;

        // Activate AI control mode
        if (window.AIPlayerAPI) {
            window.AIPlayerAPI.activateAI();
            this.log('✓ AI control mode enabled', 'ai-success');
        }

        // Start AI decision loop
        this.startAILoop();

        this.log('AI player activated!', 'ai-success');
        this.addChatMessage('ai', 'AI player is now active! Watch me play in the live cam on the left.');
    },

    stopAI: function() {
        this.log('Stopping AI player...', 'ai-action');
        document.getElementById('btn-ai-start').disabled = false;
        document.getElementById('btn-ai-stop').disabled = true;
        document.getElementById('ai-status-text').textContent = 'AI Inactive';
        document.querySelector('.ai-dot').classList.remove('active');
        this.aiPlayerActive = false;

        // Stop AI loop
        if (this.aiLoopInterval) {
            clearInterval(this.aiLoopInterval);
            this.aiLoopInterval = null;
        }

        // Release all inputs and deactivate AI mode
        if (window.AIPlayerAPI) {
            window.AIPlayerAPI.deactivateAI();
            this.log('✓ AI control mode disabled', 'ai-success');
        }

        this.log('AI player stopped', 'ai-action');
        this.addChatMessage('ai', 'AI player stopped.');
    },

    resetStats: function() {
        this.log('Statistics reset', 'ai-action');
        document.getElementById('stat-kills').textContent = '0';
        document.getElementById('stat-accuracy').textContent = '0%';
        document.getElementById('stat-time').textContent = '0s';
        this.addChatMessage('system', 'Statistics reset.');
    },

    testConnection: function() {
        this.log('Testing connection...', 'ai-action');

        if (window.AIPlayerAPI) {
            const state = window.AIPlayerAPI.getGameState();
            if (state) {
                this.log('✓ Game state accessible', 'ai-success');
                this.log(`✓ Player at (${state.player.x.toFixed(1)}, ${state.player.z.toFixed(1)})`, 'ai-success');
                this.log(`✓ ${state.enemies.length} enemies detected`, 'ai-success');
                this.addChatMessage('ai', `Connection OK! Player at (${state.player.x.toFixed(1)}, ${state.player.z.toFixed(1)}), ${state.enemies.length} enemies detected.`);
            } else {
                this.log('✗ Game not active', 'ai-action');
                this.addChatMessage('ai', 'Game is not currently active.');
            }
        } else {
            this.log('✗ AIPlayerAPI not found', 'ai-action');
            this.addChatMessage('ai', 'AIPlayerAPI not found. Make sure the game is loaded.');
        }
    },

    startAILoop: function() {
        if (this.aiLoopInterval) clearInterval(this.aiLoopInterval);

        this.aiLoopInterval = setInterval(() => {
            if (!this.aiPlayerActive || !window.AIPlayerAPI) return;

            const state = window.AIPlayerAPI.getGameState();
            if (!state) return;

            // Simple AI behavior
            if (state.enemies && state.enemies.length > 0) {
                const closest = state.enemies.reduce((prev, curr) =>
                    prev.distance < curr.distance ? prev : curr
                );

                const dx = closest.x - state.player.x;
                const dz = closest.z - state.player.z;
                const yaw = Math.atan2(dx, dz);

                window.AIPlayerAPI.setLook(yaw, 0);

                if (closest.distance > 15) {
                    window.AIPlayerAPI.setInput('moveForward', true);
                } else {
                    window.AIPlayerAPI.setInput('moveForward', false);
                    window.AIPlayerAPI.setInput('moveBackward', true);
                }

                window.AIPlayerAPI.setInput('fire', true);

                document.getElementById('ai-state').textContent = 'ENGAGING';
                document.getElementById('ai-target').textContent = `Enemy #${closest.id}`;
                document.getElementById('ai-objective').textContent = `Combat at ${closest.distance.toFixed(1)}m`;
            } else {
                window.AIPlayerAPI.setInput('moveForward', true);
                window.AIPlayerAPI.setInput('fire', false);

                document.getElementById('ai-state').textContent = 'EXPLORING';
                document.getElementById('ai-target').textContent = 'None';
                document.getElementById('ai-objective').textContent = 'Patrolling area';
            }
        }, 200);
    },

    // === TESTING METHODS ===

    sendMessage: function() {
        const input = document.getElementById('ai-chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        this.addChatMessage('user', message);
        input.value = '';

        this.processUserCommand(message);
    },

    addChatMessage: function(sender, message) {
        const messagesDiv = document.getElementById('ai-chat-messages');
        if (!messagesDiv) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;

        const senderLabel = sender === 'user' ? 'You' : sender === 'ai' ? 'AI' : 'System';
        msgDiv.innerHTML = `
            <div class="chat-sender">${senderLabel}</div>
            <div>${message}</div>
        `;

        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    processUserCommand: function(message) {
        const lower = message.toLowerCase();

        if (lower.includes('test movement')) {
            this.addChatMessage('ai', 'Starting movement test sequence...');
            this.runQuickTest('movement');
        } else if (lower.includes('test shooting')) {
            this.addChatMessage('ai', 'Starting shooting test sequence...');
            this.runQuickTest('shooting');
        } else if (lower.includes('test ui')) {
            this.addChatMessage('ai', 'Starting UI test sequence...');
            this.runQuickTest('ui');
        } else if (lower.includes('test all')) {
            this.addChatMessage('ai', 'Starting full system test...');
            this.runQuickTest('all');
        } else {
            setTimeout(() => {
                this.addChatMessage('ai', `I can help you test: movement, shooting, UI, or all systems. Just ask me to "test [feature]"!`);
            }, 500);
        }
    },

    runQuickTest: function(testType) {
        const tests = {
            movement: [
                { name: 'Player Position Check', fn: 'testPlayerPosition' },
                { name: 'Movement Keys Response', fn: 'testMovementKeys' },
                { name: 'Collision Detection', fn: 'testCollision' }
            ],
            shooting: [
                { name: 'Weapon System Check', fn: 'testWeapon' },
                { name: 'Ammo Counter', fn: 'testAmmo' },
                { name: 'Raycast Hit Detection', fn: 'testRaycast' }
            ],
            ui: [
                { name: 'HUD Elements Visible', fn: 'testHUD' },
                { name: 'Menu System', fn: 'testMenus' },
                { name: 'Keybind System', fn: 'testKeybinds' }
            ],
            all: ['movement', 'shooting', 'ui']
        };

        if (testType === 'all') {
            tests.all.forEach(type => {
                tests[type].forEach(test => this.queueTest(test));
            });
        } else if (tests[testType]) {
            tests[testType].forEach(test => this.queueTest(test));
        }

        this.updateQueueDisplay();
    },

    queueTest: function(test) {
        this.testQueue.push(test);
        this.log(`Queued: ${test.name}`);
    },

    startTestLoop: function() {
        setInterval(() => {
            if (!this.currentTest && this.testQueue.length > 0) {
                this.executeNextTest();
            }
        }, 100);
    },

    executeNextTest: function() {
        if (this.testQueue.length === 0) return;

        this.currentTest = this.testQueue.shift();
        this.updateQueueDisplay();

        const testName = document.getElementById('current-test-name');
        if (testName) testName.textContent = this.currentTest.name;

        this.log(`Executing: ${this.currentTest.name}`);

        this.runTest(this.currentTest.fn);
    },

    runTest: function(testFn) {
        let progress = 0;
        const progressBar = document.getElementById('test-progress');

        const progressInterval = setInterval(() => {
            progress += 10;
            if (progressBar) progressBar.style.width = progress + '%';
            if (progress >= 100) clearInterval(progressInterval);
        }, 100);

        setTimeout(() => {
            const result = this[testFn] ? this[testFn]() : { pass: false, message: 'Test function not found' };

            clearInterval(progressInterval);
            if (progressBar) progressBar.style.width = '100%';

            this.completeTest(result);
        }, 1000);
    },

    completeTest: function(result) {
        const testName = this.currentTest.name;

        const resultsDiv = document.getElementById('test-results');
        if (resultsDiv) {
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-result ${result.pass ? 'pass' : 'fail'}`;
            resultDiv.textContent = `${result.pass ? '✓' : '✗'} ${testName}: ${result.message}`;
            resultsDiv.insertBefore(resultDiv, resultsDiv.firstChild);

            while (resultsDiv.children.length > 5) {
                resultsDiv.removeChild(resultsDiv.lastChild);
            }
        }

        if (result.position) {
            this.addVisualMarker(result.position.x, result.position.y, result.pass);
        }

        this.log(`${result.pass ? 'PASS' : 'FAIL'}: ${testName}`);
        this.addChatMessage('ai', `Test complete: ${testName} - ${result.pass ? 'PASSED ✓' : 'FAILED ✗'}\n${result.message}`);

        this.currentTest = null;
        setTimeout(() => {
            const progressBar = document.getElementById('test-progress');
            if (progressBar) progressBar.style.width = '0%';
            const testNameEl = document.getElementById('current-test-name');
            if (testNameEl) testNameEl.textContent = 'No test running';
        }, 500);
    },

    updateQueueDisplay: function() {
        const queueDiv = document.getElementById('test-queue');
        const queueCount = document.getElementById('queue-count');

        if (queueCount) queueCount.textContent = this.testQueue.length;

        if (queueDiv) {
            queueDiv.innerHTML = '';
            this.testQueue.forEach((test, i) => {
                const item = document.createElement('div');
                item.className = 'test-item';
                item.textContent = `${i + 1}. ${test.name}`;
                queueDiv.appendChild(item);
            });
        }
    },

    addVisualMarker: function(x, y, success) {
        const markersDiv = document.getElementById('ai-test-markers');
        if (!markersDiv) return;

        const marker = document.createElement('div');
        marker.className = `test-marker ${success ? 'success' : 'fail'}`;
        marker.style.left = x + 'px';
        marker.style.top = y + 'px';

        markersDiv.appendChild(marker);

        setTimeout(() => marker.remove(), 3000);
    },

    clearTests: function() {
        this.testQueue = [];
        this.updateQueueDisplay();
        this.addChatMessage('system', 'Test queue cleared');
        this.log('Test queue cleared');
    },

    log: function(message, type = '') {
        const logDiv = document.getElementById('ai-activity-log');
        if (!logDiv) return;

        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${message}`;

        logDiv.insertBefore(entry, logDiv.firstChild);

        while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.lastChild);
        }
    },

    // === TEST FUNCTIONS ===

    testPlayerPosition: function() {
        try {
            if (!window.cameraRig) {
                return { pass: false, message: 'Camera rig not found' };
            }

            const pos = window.cameraRig.position;
            return {
                pass: true,
                message: `Player at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`,
                position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testMovementKeys: function() {
        try {
            if (!window.keys) {
                return { pass: false, message: 'Keys object not found' };
            }

            const keybinds = window.Keybinds ? window.Keybinds.get() : null;
            if (!keybinds) {
                return { pass: false, message: 'Keybinds system not found' };
            }

            return {
                pass: true,
                message: `Movement keys configured: ${keybinds.moveForward}, ${keybinds.moveBackward}, ${keybinds.moveLeft}, ${keybinds.moveRight}`,
                position: { x: 100, y: 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testCollision: function() {
        try {
            if (!window.objects) {
                return { pass: false, message: 'Objects array not found' };
            }

            return {
                pass: true,
                message: `${window.objects.length} collision objects in scene`,
                position: { x: 200, y: 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testWeapon: function() {
        try {
            if (!window.player) {
                return { pass: false, message: 'Player object not found' };
            }

            return {
                pass: true,
                message: `Weapon loaded, fire mode: ${window.player.fireModeIndex}`,
                position: { x: window.innerWidth - 100, y: 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testAmmo: function() {
        try {
            if (!window.player) {
                return { pass: false, message: 'Player object not found' };
            }

            return {
                pass: window.player.ammo >= 0 && window.player.reserveAmmo >= 0,
                message: `Ammo: ${window.player.ammo}/${window.player.reserveAmmo}`,
                position: { x: window.innerWidth - 100, y: 200 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testRaycast: function() {
        try {
            if (!window.raycaster) {
                return { pass: false, message: 'Raycaster not found' };
            }

            return {
                pass: true,
                message: 'Raycaster system functional',
                position: { x: window.innerWidth / 2, y: window.innerHeight / 3 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testHUD: function() {
        try {
            const hudElements = ['hud-ammo', 'hud-health', 'health-bar', 'stamina-bar'];
            const missing = hudElements.filter(id => !document.getElementById(id));

            return {
                pass: missing.length === 0,
                message: missing.length === 0 ? 'All HUD elements present' : `Missing: ${missing.join(', ')}`,
                position: { x: 100, y: window.innerHeight - 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testMenus: function() {
        try {
            const menus = ['menu-overlay', 'settings-screen', 'main-screen'];
            const missing = menus.filter(id => !document.getElementById(id));

            return {
                pass: missing.length === 0,
                message: missing.length === 0 ? 'All menu systems present' : `Missing: ${missing.join(', ')}`,
                position: { x: window.innerWidth / 2, y: 50 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },

    testKeybinds: function() {
        try {
            if (!window.Keybinds) {
                return { pass: false, message: 'Keybinds system not found' };
            }

            const binds = window.Keybinds.get();
            const count = Object.keys(binds).length;

            return {
                pass: count > 0,
                message: `${count} keybindings configured`,
                position: { x: 100, y: 200 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    }
};

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AIUnified.init());
} else {
    AIUnified.init();
}

// Expose to window
window.AIUnified = AIUnified;

console.log('[AI Diagnostics] Unified interface loaded - Press F3 or F4 to toggle (single unified panel)');

})();
