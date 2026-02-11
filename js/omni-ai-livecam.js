// OMNI-OPS AI LIVE CAM INTERFACE
// Watch the AI play in real-time with full statistics and controls
(function() {
    'use strict';
    console.log('[AI Live Cam] Initializing...');

const AILiveCam = {
    active: false,
    aiPlayerActive: false,
    aiLoopInterval: null,
    updateInterval: null,
    statsInterval: null,
    thoughtUpdateInterval: null,
    serverUrl: 'http://localhost:8080',
    ws: null,
    wsConnected: false,
    lastThoughts: [],

    init: function() {
        console.log('[AI Live Cam] Creating UI...');
        this.createButton();
        this.createUI();
        this.setupKeys();
        this.setupStyles();
        this.connectToVisionBrain();
    },

    createButton: function() {
        // Create live cam button
        const liveCamButton = document.createElement('button');
        liveCamButton.id = 'livecam-btn';
        liveCamButton.innerHTML = '📹 AI LIVE CAM (F4)';
        liveCamButton.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            z-index: 600;
            padding: 8px 15px;
            background: #0a0a3a;
            color: #0af;
            border: 2px solid #0af;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-family: monospace;
            font-size: 12px;
            transition: all 0.2s;
            box-shadow: 0 0 10px rgba(0,170,255,0.3);
        `;
        liveCamButton.onmouseover = () => {
            liveCamButton.style.background = '#0af';
            liveCamButton.style.color = '#000';
            liveCamButton.style.boxShadow = '0 0 20px rgba(0,170,255,0.6)';
        };
        liveCamButton.onmouseout = () => {
            liveCamButton.style.background = '#0a0a3a';
            liveCamButton.style.color = '#0af';
            liveCamButton.style.boxShadow = '0 0 10px rgba(0,170,255,0.3)';
        };
        liveCamButton.onclick = () => this.toggle();
        document.body.appendChild(liveCamButton);
    },
    
    createUI: function() {
        const html = `
            <div id="ai-livecam-overlay" class="ai-livecam-hidden">
                <div class="ai-livecam-container">
                    <!-- Header -->
                    <div class="ai-livecam-header">
                        <div class="ai-livecam-title">📹 AI LIVE CAM - Watch & Direct AI</div>
                        <div class="ai-status-indicator">
                            <span class="ai-dot" id="ai-player-dot"></span>
                            <span id="ai-player-status">AI Inactive</span>
                        </div>
                        <button class="ai-livecam-close" onclick="window.AILiveCam.toggle()">✕</button>
                    </div>
                    
                    <!-- Content Grid -->
                    <div class="ai-livecam-content">
                        <!-- Left Column: Camera View & Vision -->
                        <div class="ai-livecam-left">
                            <!-- Game Feed -->
                            <div class="ai-camera-panel">
                                <div class="panel-title">🎮 GAME VIEW</div>
                                <div class="game-view-box">
                                    <div id="ai-game-feed" class="game-feed">
                                        <canvas id="ai-vision-canvas" width="400" height="300"></canvas>
                                        <div class="game-overlay-info">
                                            <div id="ai-target-indicator" class="target-indicator">NO TARGET</div>
                                            <div id="ai-crosshair" class="ai-crosshair"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- AI Vision / Radar -->
                            <div class="ai-radar-panel">
                                <div class="panel-title">🎯 AI TACTICAL VIEW</div>
                                <div class="radar-box">
                                    <canvas id="ai-radar-canvas" width="300" height="300"></canvas>
                                    <div class="radar-legend">
                                        <span>� Player</span>
                                        <span>🔴 Enemies</span>
                                        <span>⚪ Objects</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Middle Column: AI Brain & Stats -->
                        <div class="ai-livecam-middle">
                            <!-- AI State -->
                            <div class="ai-brain-panel">
                                <div class="panel-title">🧠 AI BRAIN</div>
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
                            
                            <!-- Thoughts Stream -->
                            <div class="ai-thoughts-panel">
                                <div class="panel-title">💭 AI THOUGHTS</div>
                                <div id="ai-thoughts" class="thoughts-stream"></div>
                            </div>

                            <!-- AI Chat -->
                            <div class="ai-chat-panel">
                                <div class="panel-title">💬 CHAT WITH AI</div>
                                <div id="ai-chat-messages" class="chat-messages-live"></div>
                                <div class="chat-input-container">
                                    <input type="text" id="ai-chat-input-live" placeholder="Give AI directives... (e.g., 'Find cover', 'Attack enemy')" autocomplete="off">
                                    <button id="ai-chat-send-live" class="chat-send-btn">SEND</button>
                                </div>
                                <div class="quick-commands-chat">
                                    <button class="quick-cmd-btn" data-cmd="Find cover">�️ Find Cover</button>
                                    <button class="quick-cmd-btn" data-cmd="Attack enemy">⚔️ Attack</button>
                                    <button class="quick-cmd-btn" data-cmd="Retreat">🏃 Retreat</button>
                                    <button class="quick-cmd-btn" data-cmd="Hold position">🎯 Hold</button>
                                </div>
                            </div>

                            <!-- Statistics -->
                            <div class="ai-stats-panel">
                                <div class="panel-title">📊 PERFORMANCE</div>
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
                                        <div class="stat-label">ALIVE TIME</div>
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
                        </div>
                        
                        <!-- Right Column: Controls & Log -->
                        <div class="ai-livecam-right">
                            <!-- AI Controls -->
                            <div class="ai-controls-panel">
                                <div class="panel-title">🎛️ AI CONTROLS</div>
                                <div class="controls-grid">
                                    <button id="btn-ai-start" class="ai-control-btn ai-btn-start" 
                                            onclick="window.AILiveCam.startAI()">
                                        ▶️ START AI
                                    </button>
                                    <button id="btn-ai-stop" class="ai-control-btn ai-btn-stop" 
                                            onclick="window.AILiveCam.stopAI()" disabled>
                                        ⏹️ STOP AI
                                    </button>
                                    <button class="ai-control-btn" onclick="window.AILiveCam.resetStats()">
                                        🔄 RESET STATS
                                    </button>
                                    <button class="ai-control-btn" onclick="window.AILiveCam.testConnection()">
                                        🔗 TEST CONNECTION
                                    </button>
                                </div>
                                
                                <!-- AI Settings -->
                                <div class="ai-settings">
                                    <div class="setting-row">
                                        <label>Difficulty:</label>
                                        <select id="ai-difficulty">
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
                            
                            <!-- Activity Log -->
                            <div class="ai-log-panel">
                                <div class="panel-title">📝 ACTIVITY LOG</div>
                                <div id="ai-activity-log" class="activity-log"></div>
                            </div>
                            
                            <!-- Debug Info -->
                            <div class="ai-debug-panel">
                                <div class="panel-title">🔧 DEBUG</div>
                                <div id="ai-debug-info" class="debug-info">
                                    <div class="debug-line">Position: <span id="debug-pos">0, 0, 0</span></div>
                                    <div class="debug-line">Look: <span id="debug-look">0°, 0°</span></div>
                                    <div class="debug-line">Velocity: <span id="debug-vel">0, 0, 0</span></div>
                                    <div class="debug-line">Enemies Visible: <span id="debug-enemies">0</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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

        // Setup chat functionality
        this.setupChatHandlers();
    },

    setupChatHandlers: function() {
        // Chat send button
        const sendBtn = document.getElementById('ai-chat-send-live');
        if (sendBtn) {
            sendBtn.onclick = () => this.sendChatDirective();
        }

        // Chat input enter key
        const chatInput = document.getElementById('ai-chat-input-live');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatDirective();
                }
            });
        }

        // Quick command buttons
        document.querySelectorAll('.quick-cmd-btn').forEach(btn => {
            btn.onclick = () => {
                const cmd = btn.getAttribute('data-cmd');
                if (cmd) {
                    const chatInput = document.getElementById('ai-chat-input-live');
                    if (chatInput) {
                        chatInput.value = cmd;
                        this.sendChatDirective();
                    }
                }
            };
        });
    },

    sendChatDirective: function() {
        const chatInput = document.getElementById('ai-chat-input-live');
        if (!chatInput) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Add message to chat display
        this.addChatMessage('user', message);

        // Send via WebSocket if connected
        if (this.wsConnected && this.ws) {
            this.ws.send(JSON.stringify({
                type: 'user_directive',
                directive: message,
                timestamp: Date.now()
            }));
        }

        // Also log it as an instruction
        this.log(`📢 Directive sent: ${message}`, 'ai-action');
        this.addThought(`User directive: ${message}`, 'command');

        // Clear input
        chatInput.value = '';
    },

    addChatMessage: function(sender, message, timestamp) {
        const chatMessages = document.getElementById('ai-chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-msg-live ${sender}`;

        const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

        const senderNames = {
            'user': 'YOU',
            'ai': 'AI',
            'external': 'EXTERNAL AI',
            'system': 'SYSTEM'
        };

        messageDiv.innerHTML = `
            <div class="msg-header-live">
                <span class="msg-sender-live">${senderNames[sender] || sender.toUpperCase()}</span>
                <span class="msg-time-live">${time}</span>
            </div>
            <div class="msg-content-live">${message}</div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Keep last 50 messages
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    },
    
    setupStyles: function() {
        if (document.getElementById('ai-livecam-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'ai-livecam-styles';
        style.textContent = `
            .ai-livecam-hidden { display: none !important; }
            
            #ai-livecam-overlay {
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
            
            .ai-livecam-container {
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
            
            .ai-livecam-header {
                background: linear-gradient(to bottom, #0f6, #0a4);
                padding: 12px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #0f6;
            }
            
            .ai-livecam-title {
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
            
            .ai-livecam-close {
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
            
            .ai-livecam-close:hover {
                background: #f66;
            }
            
            .ai-livecam-content {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 10px;
                padding: 10px;
                overflow: hidden;
            }
            
            .ai-livecam-left, .ai-livecam-middle, .ai-livecam-right {
                display: flex;
                flex-direction: column;
                gap: 10px;
                overflow-y: auto;
            }
            
            .ai-camera-panel, .ai-radar-panel, .ai-brain-panel, 
            .ai-thoughts-panel, .ai-stats-panel, .ai-controls-panel, 
            .ai-log-panel, .ai-debug-panel {
                background: rgba(0, 255, 100, 0.05);
                border: 2px solid #0f6;
                border-radius: 6px;
                padding: 10px;
            }
            
            .panel-title {
                font-size: 14px;
                font-weight: bold;
                color: #0ff;
                margin-bottom: 10px;
                padding-bottom: 5px;
                border-bottom: 1px solid #0f6;
            }
            
            .game-view-box {
                position: relative;
                background: #000;
                border: 2px solid #333;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .game-feed {
                position: relative;
                width: 100%;
                height: 300px;
                background: #111;
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
                top: 10px;
                left: 10px;
                background: rgba(255, 0, 0, 0.8);
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 12px;
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
            
            .radar-box {
                position: relative;
            }
            
            #ai-radar-canvas {
                width: 100%;
                height: 300px;
                background: #000;
                border: 1px solid #0f6;
                border-radius: 4px;
            }
            
            .radar-legend {
                display: flex;
                justify-content: space-around;
                margin-top: 5px;
                font-size: 11px;
            }
            
            .brain-content {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .brain-row {
                display: flex;
                justify-content: space-between;
                padding: 5px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 3px;
            }
            
            .brain-label {
                color: #0f6;
                font-weight: bold;
            }
            
            .brain-value {
                color: #0ff;
            }
            
            .thoughts-stream {
                max-height: 200px;
                overflow-y: auto;
                font-size: 11px;
                line-height: 1.4;
            }
            
            .thought-entry {
                padding: 5px;
                margin-bottom: 5px;
                background: rgba(0, 255, 100, 0.1);
                border-left: 3px solid #0f6;
                border-radius: 2px;
            }
            
            .thought-time {
                color: #0f6;
                margin-right: 8px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            
            .stat-box {
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #0f6;
                text-align: center;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;  
                color: #0ff;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 10px;
                color: #0f6;
            }
            
            .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 15px;
            }
            
            .ai-control-btn {
                padding: 10px;
                background: #0f6;
                color: #000;
                border: none;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            }
            
            .ai-control-btn:hover:not(:disabled) {
                background: #0ff;
            }
            
            .ai-control-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .ai-btn-start {
                background: #0f0;
            }
            
            .ai-btn-stop {
                background: #f00;
                color: #fff;
            }
            
            .ai-settings {
                margin-top: 10px;
            }
            
            .setting-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                font-size: 12px;
            }
            
            .setting-row label {
                flex: 0 0 100px;
                color: #0f6;
            }
            
            .setting-row select,
            .setting-row input[type="range"] {
                flex: 1;
                background: #000;
                color: #0f6;
                border: 1px solid #0f6;
                padding: 3px 5px;
                border-radius: 3px;
            }
            
            .activity-log {
                max-height: 200px;
                overflow-y: auto;
                font-size: 11px;
                line-height: 1.3;
            }
            
            .log-entry {
                padding: 3px 5px;
                margin-bottom: 3px;
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

            /* Chat message styles */
            .chat-messages-live {
                max-height: 250px;
                overflow-y: auto;
                margin-bottom: 10px;
            }

            .chat-msg-live {
                padding: 8px 10px;
                margin-bottom: 8px;
                border-radius: 8px;
                border-left: 3px solid;
                animation: slideIn 0.3s ease-out;
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            .chat-msg-live.user {
                border-left-color: #0af;
                background: rgba(0, 170, 255, 0.15);
            }

            .chat-msg-live.ai {
                border-left-color: #0f6;
                background: rgba(0, 255, 100, 0.15);
            }

            .chat-msg-live.external {
                border-left-color: #f90;
                background: rgba(255, 153, 0, 0.15);
            }

            .chat-msg-live.system {
                border-left-color: #888;
                background: rgba(136, 136, 136, 0.1);
                text-align: center;
                font-size: 11px;
                color: #aaa;
            }

            .msg-header-live {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
            }

            .msg-sender-live {
                font-weight: bold;
                font-size: 11px;
            }

            .chat-msg-live.user .msg-sender-live { color: #0af; }
            .chat-msg-live.ai .msg-sender-live { color: #0f6; }
            .chat-msg-live.external .msg-sender-live { color: #f90; }

            .msg-time-live {
                font-size: 9px;
                color: #888;
            }

            .msg-content-live {
                font-size: 12px;
                line-height: 1.4;
                color: #fff;
            }

            .chat-input-container {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }

            #ai-chat-input-live {
                flex: 1;
                padding: 8px 10px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid #0f6;
                border-radius: 5px;
                color: #fff;
                font-family: 'Courier New', monospace;
                font-size: 12px;
            }

            #ai-chat-input-live:focus {
                outline: none;
                border-color: #0ff;
                box-shadow: 0 0 10px rgba(0, 255, 100, 0.3);
            }

            .chat-send-btn {
                padding: 8px 15px;
                background: #0f6;
                border: none;
                border-radius: 5px;
                color: #000;
                font-weight: bold;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                transition: all 0.2s;
            }

            .chat-send-btn:hover {
                background: #0ff;
                box-shadow: 0 0 15px rgba(0, 255, 100, 0.5);
            }

            .quick-commands-chat {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                margin-top: 10px;
            }

            .quick-cmd-btn {
                padding: 8px;
                background: rgba(0, 255, 100, 0.1);
                border: 1px solid #0f6;
                border-radius: 5px;
                color: #0f6;
                font-size: 10px;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Courier New', monospace;
                font-weight: bold;
            }

            .quick-cmd-btn:hover {
                background: #0f6;
                color: #000;
                transform: translateY(-2px);
                box-shadow: 0 4px 10px rgba(0, 255, 100, 0.4);
            }

            .ai-chat-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }
        `;

        document.head.appendChild(style);
    },
    
    setupKeys: function() {
        const handler = (e) => {
            // F4 opens live cam only
            if (e.code === 'F4') {
                e.preventDefault();
                this.toggle();
                return true;
            }
            return false;
        };
        
        if (window.OmniKeybinds && window.OmniKeybinds.register) {
            window.OmniKeybinds.register({
                id: 'ai-livecam',
                priority: 99,
                onKeyDown: handler
            });
        } else {
            document.addEventListener('keydown', handler);
        }
    },
    
    toggle: function() {
        this.active = !this.active;
        const overlay = document.getElementById('ai-livecam-overlay');
        const button = document.getElementById('livecam-btn');
        if (overlay) {
            if (this.active) {
                overlay.classList.remove('ai-livecam-hidden');
                if (button) button.style.opacity = '0.6';
                this.startUpdates();
                if (typeof document.exitPointerLock === 'function') {
                    document.exitPointerLock();
                }
            } else {
                overlay.classList.add('ai-livecam-hidden');
                if (button) button.style.opacity = '1';
                this.stopUpdates();
                if (window.isGameActive && typeof window.safeRequestPointerLock === 'function') {
                    window.safeRequestPointerLock();
                }
            }
        }
    },
    
    startUpdates: function() {
        this.updateInterval = setInterval(() => this.updateDisplay(), 100);
        this.statsInterval = setInterval(() => this.updateStats(), 500);
        this.thoughtUpdateInterval = setInterval(() => this.updateThoughts(), 1000);
    },
    
    stopUpdates: function() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.statsInterval) clearInterval(this.statsInterval);
        if (this.thoughtUpdateInterval) clearInterval(this.thoughtUpdateInterval);
    },
    
    updateDisplay: function() {
        if (!window.AIPlayerAPI) return;

        const state = window.AIPlayerAPI.getGameState();
        if (!state) return;

        // Capture game viewport and draw to AI vision canvas
        this.renderGameView();

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

    renderGameView: function() {
        const visionCanvas = document.getElementById('ai-vision-canvas');
        if (!visionCanvas) return;

        const ctx = visionCanvas.getContext('2d');

        // Find the main game canvas - try multiple methods
        let gameCanvas = null;

        // Method 1: Check if we have a cached reference
        if (window.omni && window.omni.gameCanvas) {
            gameCanvas = window.omni.gameCanvas;
        }

        // Method 2: Look for THREE.js renderer canvas
        if (!gameCanvas && window.renderer && window.renderer.domElement) {
            gameCanvas = window.renderer.domElement;
        }

        // Method 3: Search all canvases, prioritizing large ones
        if (!gameCanvas) {
            const allCanvases = document.querySelectorAll('canvas');
            let largestCanvas = null;
            let largestArea = 0;

            allCanvases.forEach(canvas => {
                // Skip our own canvases
                if (canvas === visionCanvas ||
                    canvas.id === 'ai-radar-canvas' ||
                    canvas.id === 'minimap-canvas') {
                    return;
                }

                // Check canvas dimensions - use clientWidth/clientHeight for display size
                const area = canvas.clientWidth * canvas.clientHeight;
                if (area > largestArea) {
                    largestArea = area;
                    largestCanvas = canvas;
                }
            });

            if (largestCanvas && largestArea > 100000) { // Require at least reasonable size
                gameCanvas = largestCanvas;
            }
        }

        if (!gameCanvas) {
            // No game canvas found - show clear error message
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
            ctx.fillStyle = '#00d9ff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('NO GAME CANVAS FOUND', visionCanvas.width / 2, visionCanvas.height / 2 - 20);
            ctx.fillStyle = '#0f6';
            ctx.font = '10px monospace';
            ctx.fillText('Tried: window.renderer, cached ref, canvas search', visionCanvas.width / 2, visionCanvas.height / 2);
            ctx.fillText('Game must be loaded and rendering', visionCanvas.width / 2, visionCanvas.height / 2 + 15);
            return;
        }

        try {
            // Draw the game canvas to the vision canvas (scaled down)
            ctx.drawImage(gameCanvas, 0, 0, visionCanvas.width, visionCanvas.height);

            // Add a subtle border to indicate live feed
            ctx.strokeStyle = '#0f6';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, visionCanvas.width - 2, visionCanvas.height - 2);

            // Update target indicator
            const targetIndicator = document.getElementById('ai-target-indicator');
            if (targetIndicator) {
                targetIndicator.textContent = 'LIVE FEED';
                targetIndicator.style.background = 'rgba(0, 255, 100, 0.8)';
            }

            // Store reference for future use
            window.omni = window.omni || {};
            window.omni.gameCanvas = gameCanvas;
        } catch (e) {
            // If direct copy fails, show error
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, visionCanvas.width, visionCanvas.height);
            ctx.fillStyle = '#f44';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Canvas Capture Error: ' + e.message, visionCanvas.width / 2, visionCanvas.height / 2 - 10);
            ctx.fillStyle = '#0f6';
            ctx.font = '10px monospace';
            ctx.fillText('Canvas found but drawing failed', visionCanvas.width / 2, visionCanvas.height / 2 + 10);
        }
    },
    
    updateStats: function() {
        if (!window.AIPlayerAPI) return;

        const state = window.AIPlayerAPI.getGameState();
        if (!state) return;

        document.getElementById('stat-health').textContent = Math.floor(state.player.health);
        document.getElementById('stat-ammo').textContent = `${state.player.ammo}/${state.player.reserveAmmo}`;
        document.getElementById('stat-enemies').textContent = state.enemies.length;
    },

    connectToVisionBrain: function() {
        console.log('[AI Live Cam] Connecting to Vision Brain Bridge...');

        try {
            this.ws = new WebSocket('ws://localhost:8082');

            this.ws.onopen = () => {
                this.wsConnected = true;
                console.log('[AI Live Cam] ✅ Connected to Vision Brain Bridge');
                this.addThought('Connected to Vision Brain Bridge', 'system');

                // Announce connection
                this.ws.send(JSON.stringify({
                    type: 'ai_connected',
                    name: 'AI_Live_Cam',
                    capabilities: ['vision_display', 'monitoring']
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleVisionBrainMessage(data);
                } catch (error) {
                    console.error('[AI Live Cam] Failed to parse message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[AI Live Cam] WebSocket error:', error);
                this.wsConnected = false;
            };

            this.ws.onclose = () => {
                console.log('[AI Live Cam] Disconnected from Vision Brain Bridge. Retrying in 5s...');
                this.wsConnected = false;
                this.addThought('Disconnected from Vision Brain', 'error');
                setTimeout(() => this.connectToVisionBrain(), 5000);
            };
        } catch (error) {
            console.error('[AI Live Cam] Failed to connect to Vision Brain:', error);
            this.addThought('Failed to connect to Vision Brain - Is it running?', 'error');
        }
    },

    handleVisionBrainMessage: function(data) {
        const { type } = data;

        switch(type) {
            case 'vision_frame':
                // Vision data received
                break;
            case 'decision_made':
                this.addThought(`Decision: ${data.decision} (confidence: ${(data.confidence * 100).toFixed(0)}%)`, 'decision');
                this.updateAIBrain({ state: data.decision, confidence: data.confidence });
                break;
            case 'ai_state':
                this.updateAIBrain({
                    state: data.currentTask || 'idle',
                    target: data.target || 'None',
                    objective: data.memory?.[0]?.action || 'Analyzing...'
                });
                break;
            case 'request_guidance':
                this.addThought(`AI requesting guidance: ${data.situation}`, 'question');
                this.addChatMessage('ai', `Need guidance: ${data.situation}`);
                break;
            case 'chat':
                this.addThought(`AI says: ${data.message}`, 'chat');
                this.addChatMessage('ai', data.message);
                break;
            case 'ai_response':
                this.addChatMessage('ai', data.message || data.response);
                break;
            case 'ai_answer':
                this.addChatMessage('external', data.answer);
                break;
            case 'instruction':
                this.addThought(`External command: ${data.command}`, 'command');
                this.addChatMessage('external', `Command: ${data.command}`);
                break;
            case 'user_directive':
                // Show directives from other sources
                if (data.source !== 'livecam') {
                    this.addChatMessage('user', data.directive);
                }
                break;
            default:
                console.log('[AI Live Cam] Unknown message type:', type, data);
        }
    },

    updateAIBrain: function(brain) {
        if (brain.state) {
            document.getElementById('ai-state').textContent = brain.state.toUpperCase();
        }
        if (brain.target !== undefined) {
            document.getElementById('ai-target').textContent = brain.target;
        }
        if (brain.objective) {
            document.getElementById('ai-objective').textContent = brain.objective;
        }
    },

    updateThoughts: function() {
        // This is called periodically to update the thoughts display
        // Thoughts are added via addThought() when messages arrive from Vision Brain

        // If not connected, show status
        if (!this.wsConnected) {
            const thoughtsDiv = document.getElementById('ai-thoughts');
            if (thoughtsDiv && thoughtsDiv.children.length === 0) {
                this.addThought('Connecting to Vision Brain...', 'system');
            }
        }
    },

    addThought: function(message, type = 'info') {
        const thoughtsDiv = document.getElementById('ai-thoughts');
        if (!thoughtsDiv) return;

        const entry = document.createElement('div');
        entry.className = 'thought-entry';

        const time = new Date().toLocaleTimeString();
        const timestamp = document.createElement('span');
        timestamp.className = 'thought-time';
        timestamp.textContent = `[${time}] `;

        const content = document.createElement('span');
        content.textContent = message;

        // Color code by type
        switch(type) {
            case 'decision':
                content.style.color = '#0ff';
                break;
            case 'question':
                content.style.color = '#fa0';
                break;
            case 'error':
                content.style.color = '#f44';
                break;
            case 'command':
                content.style.color = '#f0f';
                break;
            case 'chat':
                content.style.color = '#0f0';
                break;
            case 'system':
                content.style.color = '#aaa';
                break;
            default:
                content.style.color = '#0f6';
        }

        entry.appendChild(timestamp);
        entry.appendChild(content);
        thoughtsDiv.insertBefore(entry, thoughtsDiv.firstChild);

        // Keep last 20 thoughts
        while (thoughtsDiv.children.length > 20) {
            thoughtsDiv.removeChild(thoughtsDiv.lastChild);
        }

        // Store in history
        this.lastThoughts.unshift({ message, type, time });
        if (this.lastThoughts.length > 50) {
            this.lastThoughts.pop();
        }
    },
    
    drawRadar: function(state) {
        const canvas = document.getElementById('ai-radar-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const scale = 3;  // 3 pixels per game unit
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
    
    startAI: function() {
        this.log('Starting AI player...', 'ai-action');
        document.getElementById('btn-ai-start').disabled = true;
        document.getElementById('btn-ai-stop').disabled = false;
        document.getElementById('ai-player-status').textContent = 'AI Active';
        document.querySelector('.ai-dot').classList.add('active');
        this.aiPlayerActive = true;
        
        // Activate AI control mode (bypasses pointer lock requirement)
        if (window.AIPlayerAPI) {
            window.AIPlayerAPI.activateAI();
            this.log('✓ AI control mode enabled', 'ai-success');
        }
        
        // Start AI decision loop
        this.startAILoop();
        
        this.log('AI player activated!', 'ai-success');
    },
    
    stopAI: function() {
        this.log('Stopping AI player...', 'ai-action');
        document.getElementById('btn-ai-start').disabled = false;
        document.getElementById('btn-ai-stop').disabled = true;
        document.getElementById('ai-player-status').textContent = 'AI Inactive';
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
    },
    
    resetStats: function() {
        this.log('Statistics reset', 'ai-action');
        document.getElementById('stat-kills').textContent = '0';
        document.getElementById('stat-accuracy').textContent = '0%';
        document.getElementById('stat-time').textContent = '0s';
    },
    
    startAILoop: function() {
        if (this.aiLoopInterval) clearInterval(this.aiLoopInterval);

        let visionFrameCounter = 0;

        this.aiLoopInterval = setInterval(() => {
            if (!this.aiPlayerActive || !window.AIPlayerAPI) return;

            // Get game state
            const state = window.AIPlayerAPI.getGameState();
            if (!state) return;

            // Send vision frame to Vision Brain every 10 ticks (1 second at 100ms interval)
            visionFrameCounter++;
            if (visionFrameCounter >= 10 && this.wsConnected) {
                this.sendVisionFrame(state);
                visionFrameCounter = 0;
            }

            // Simple AI behavior: move and look around
            // Check for enemies
            if (state.enemies && state.enemies.length > 0) {
                // Find closest enemy
                const closest = state.enemies.reduce((prev, curr) =>
                    prev.distance < curr.distance ? prev : curr
                );

                // Calculate look direction to enemy
                const dx = closest.x - state.player.x;
                const dz = closest.z - state.player.z;
                const yaw = Math.atan2(dx, dz);

                // Look at enemy
                window.AIPlayerAPI.setLook(yaw, 0);

                // Move toward enemy if far
                if (closest.distance > 15) {
                    window.AIPlayerAPI.setInput('moveForward', true);
                } else {
                    window.AIPlayerAPI.setInput('moveForward', false);
                    window.AIPlayerAPI.setInput('moveBackward', true);
                }

                // Shoot if aimed
                window.AIPlayerAPI.setInput('fire', true);

                this.log(`🎯 Engaging enemy at ${closest.distance.toFixed(1)}m`, 'ai-combat');
            } else {
                // No enemies - explore
                window.AIPlayerAPI.setInput('moveForward', true);
                window.AIPlayerAPI.setInput('fire', false);
            }
        }, 100);
    },

    sendVisionFrame: function(state) {
        if (!this.ws || !this.wsConnected) return;

        try {
            // Find game canvas using same logic as renderGameView
            let gameCanvas = null;

            // Method 1: Check cached reference
            if (window.omni && window.omni.gameCanvas) {
                gameCanvas = window.omni.gameCanvas;
            }

            // Method 2: Look for THREE.js renderer canvas
            if (!gameCanvas && window.renderer && window.renderer.domElement) {
                gameCanvas = window.renderer.domElement;
            }

            if (!gameCanvas) return;

            // Scale down for transmission
            const scaledWidth = 320;
            const scaledHeight = 240;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = scaledWidth;
            tempCanvas.height = scaledHeight;

            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(gameCanvas, 0, 0, scaledWidth, scaledHeight);

            const frameData = tempCanvas.toDataURL('image/jpeg', 0.6);

            // Prepare vision data
            const visionData = {
                type: 'vision_frame',
                timestamp: Date.now(),
                frame: frameData,
                position: {
                    x: state.player.x,
                    y: state.player.y,
                    z: state.player.z
                },
                rotation: {
                    yaw: state.player.yaw,
                    pitch: state.player.pitch
                },
                detected_objects: state.enemies.map(e => ({
                    type: 'enemy',
                    faction: e.faction,
                    distance: e.distance,
                    position: { x: e.x, y: e.y, z: e.z },
                    threat: e.distance < 15 ? 'high' : 'medium'
                })),
                threats: state.enemies.filter(e => e.distance < 20),
                player_state: {
                    health: state.player.health,
                    ammo: state.player.ammo,
                    velocity: state.player.velocity
                }
            };

            this.ws.send(JSON.stringify(visionData));
        } catch (error) {
            console.error('[AI Live Cam] Failed to send vision frame:', error);
        }
    },
    
    testConnection: function() {
        this.log('Testing connection to AI server...', 'ai-action');
        
        if (window.AIPlayerAPI) {
            const state = window.AIPlayerAPI.getGameState();
            if (state) {
                this.log('✓ Game state accessible', 'ai-success');
                this.log(`✓ Player at (${state.player.x.toFixed(1)}, ${state.player.z.toFixed(1)})`, 'ai-success');
                this.log(`✓ ${state.enemies.length} enemies detected`, 'ai-success');
            } else {
                this.log('✗ Game not active', 'ai-action');
            }
        } else {
            this.log('✗ AIPlayerAPI not found', 'ai-action');
        }
    },
    
    log: function(message, type = '') {
        const logDiv = document.getElementById('ai-activity-log');
        if (!logDiv) return;
        
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${message}`;
        
        logDiv.insertBefore(entry, logDiv.firstChild);
        
        // Keep only last 50 entries
        while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.lastChild);
        }
    }
};

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AILiveCam.init());
} else {
    AILiveCam.init();
}

// Expose to window
window.AILiveCam = AILiveCam;

console.log('[AI Diagnostics] Live cam loaded - Press F4 to open live cam (watch AI play)');

})();
