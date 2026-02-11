/**
 * OMNI-OPS UNIFIED AI COLLABORATION PANEL
 * Complete AI interface combining Chat, Live Cam, Vision Brain, and Controls
 * Toggles with Collab button or F3 key
 */

(function() {
    'use strict';

    const UnifiedAIPanel = {
        isOpen: false,
        ws: null,
        connected: false,
        currentTab: 'chat',
        wsUrl: 'ws://localhost:8081',
        httpUrl: 'http://localhost:8080',
        visionInterval: null,
        statsInterval: null,

        init: function() {
            console.log('[Unified AI] Initializing comprehensive AI panel...');
            this.createUI();
            this.setupEventListeners();
            this.connectToBridge();
            this.setupKeybindings();
        },

        setupKeybindings: function() {
            document.addEventListener('keydown', (e) => {
                // F3 toggles the unified panel
                if (e.key === 'F3') {
                    e.preventDefault();
                    this.toggle();
                }
                // F4 opens panel and switches to Quick Commands
                if (e.key === 'F4') {
                    e.preventDefault();
                    if (!this.isOpen) {
                        this.open();
                    }
                    this.switchTab('vision');
                }
                // ESC closes the panel
                if (e.key === 'Escape' && this.isOpen) {
                    e.preventDefault();
                    this.close();
                }
            });
        },

        toggle: function() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },

        open: function() {
            const panel = document.getElementById('unified-ai-panel');
            if (panel) {
                panel.classList.remove('hidden');
                this.isOpen = true;
                console.log('[Unified AI] Panel opened');
            }
        },

        close: function() {
            const panel = document.getElementById('unified-ai-panel');
            if (panel) {
                panel.classList.add('hidden');
                this.isOpen = false;
                console.log('[Unified AI] Panel closed');
            }
        },

        switchTab: function(tabName) {
            this.currentTab = tabName;

            // Update tab buttons
            document.querySelectorAll('.unified-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeBtn) activeBtn.classList.add('active');

            // Update tab content
            document.querySelectorAll('.unified-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            const activeContent = document.getElementById(`tab-${tabName}`);
            if (activeContent) activeContent.classList.add('active');

            console.log(`[Unified AI] Switched to ${tabName} tab`);
        },

        connectToBridge: function() {
            console.log('[Unified AI] Connecting to bridge...');

            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('[Unified AI] Connected to bridge!');
                this.connected = true;
                this.updateConnectionStatus(true);
                this.addChatMessage('system', '✅ Connected to AI Collaboration Bridge');

                // Register as unified panel client
                this.ws.send(JSON.stringify({
                    type: 'unified_panel_connected',
                    timestamp: new Date().toISOString()
                }));
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.ws.onclose = () => {
                console.log('[Unified AI] Disconnected from bridge');
                this.connected = false;
                this.updateConnectionStatus(false);
                this.addChatMessage('system', '⚠️ Disconnected. Reconnecting in 3 seconds...');
                setTimeout(() => this.connectToBridge(), 3000);
            };

            this.ws.onerror = (error) => {
                console.error('[Unified AI] WebSocket error:', error);
            };
        },

        handleMessage: function(data) {
            const type = data.type;

            if (type === 'user_message') {
                this.addChatMessage('user', data.message, data.timestamp);
            } else if (type === 'ai_question' || type === 'ai_question_notification') {
                this.addChatMessage('in-game-ai', data.question, data.timestamp, {
                    hasVisual: data.has_visual
                });
            } else if (type === 'ai_answer') {
                this.addChatMessage('external-ai', data.answer, data.timestamp);
            }
        },

        updateConnectionStatus: function(connected) {
            const statusDot = document.getElementById('unified-status-dot');
            const statusText = document.getElementById('unified-status-text');

            if (statusDot) {
                statusDot.className = connected ? 'status-dot connected' : 'status-dot';
            }
            if (statusText) {
                statusText.textContent = connected ? 'Connected' : 'Disconnected';
            }
        },

        // ===== CHAT FUNCTIONS =====

        sendChatMessage: function() {
            const input = document.getElementById('unified-chat-input');
            if (!input) return;

            const message = input.value.trim();
            if (!message) return;

            if (!this.connected) {
                this.addChatMessage('system', '❌ Not connected to bridge');
                return;
            }

            this.ws.send(JSON.stringify({
                type: 'user_message',
                message: message,
                source: 'unified_panel',
                timestamp: new Date().toISOString()
            }));

            this.addChatMessage('user', message, new Date().toISOString());
            input.value = '';
        },

        addChatMessage: function(sender, content, timestamp, options = {}) {
            const messagesDiv = document.getElementById('unified-chat-messages');
            if (!messagesDiv) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-msg ${sender}`;

            const senderNames = {
                'user': 'YOU',
                'in-game-ai': 'IN-GAME AI',
                'external-ai': 'EXTERNAL AI (Claude)',
                'system': 'SYSTEM'
            };

            const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

            if (sender === 'system') {
                messageDiv.innerHTML = `<div class="msg-content">${content}</div>`;
            } else {
                messageDiv.innerHTML = `
                    <div class="msg-header">
                        <span class="msg-sender">${senderNames[sender]}</span>
                        <span class="msg-time">${time}</span>
                    </div>
                    <div class="msg-content">${content}</div>
                    ${options.hasVisual ? '<div class="msg-note">👁️ Visual context included</div>' : ''}
                `;
            }

            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },

        askExternalAI: function(question, includeVisual = false) {
            if (!this.connected) {
                console.warn('[Unified AI] Cannot ask external AI - not connected');
                return;
            }

            const messageData = {
                type: 'ai_question',
                question: question,
                has_visual: includeVisual,
                timestamp: new Date().toISOString()
            };

            // Add game state if available
            if (window.AIPlayerAPI && window.AIPlayerAPI.getGameState) {
                const gameState = window.AIPlayerAPI.getGameState();
                if (gameState && gameState.player) {
                    messageData.gameState = {
                        playerPos: gameState.player,
                        velocity: gameState.player.velocity || { x: 0, y: 0, z: 0 }
                    };
                }
            }

            // Capture visual if requested
            if (includeVisual) {
                const imageData = this.captureGameView();
                if (imageData) {
                    messageData.image = imageData;
                }
            }

            this.ws.send(JSON.stringify(messageData));
            this.addChatMessage('in-game-ai', question, messageData.timestamp, {
                hasVisual: includeVisual
            });
        },

        captureGameView: function() {
            try {
                const canvas = document.querySelector('canvas');
                if (!canvas) {
                    console.warn('[Unified AI] No canvas found for capture');
                    return null;
                }

                const tempCanvas = document.createElement('canvas');
                const targetWidth = 640;
                const targetHeight = 360;
                tempCanvas.width = targetWidth;
                tempCanvas.height = targetHeight;

                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

                const imageData = tempCanvas.toDataURL('image/jpeg', 0.7);
                console.log('[Unified AI] Captured game view');
                return imageData;

            } catch (error) {
                console.error('[Unified AI] Error capturing game view:', error);
                return null;
            }
        },

        // ===== QUICK COMMANDS =====

        quickCommand: function(cmd) {
            const commands = {
                'analyze': 'Can you analyze the current game situation? What should I do next?',
                'see': 'What do you see in the game right now? Describe the environment.',
                'stuck': 'I think the player might be stuck. Can you check and suggest how to get unstuck?',
                'threat': 'Are there any threats or dangers nearby?',
                'objective': 'What should my current objective be?',
                'help': 'I need help with the current situation. What do you recommend?'
            };

            const question = commands[cmd];
            if (question) {
                this.askExternalAI(question, true);
                if (this.currentTab !== 'chat') {
                    this.switchTab('chat');
                }
            }
        },

        // ===== UI CREATION =====

        setupEventListeners: function() {
            // Chat send button
            const sendBtn = document.getElementById('unified-send-btn');
            if (sendBtn) {
                sendBtn.addEventListener('click', () => this.sendChatMessage());
            }

            // Chat input enter key
            const chatInput = document.getElementById('unified-chat-input');
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendChatMessage();
                    }
                });
            }

            // Tab buttons
            document.querySelectorAll('.unified-tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tabName = e.target.dataset.tab;
                    if (tabName) this.switchTab(tabName);
                });
            });

            // Quick command buttons
            document.querySelectorAll('.quick-cmd-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const cmd = e.target.dataset.cmd;
                    if (cmd) this.quickCommand(cmd);
                });
            });

            // Close button
            const closeBtn = document.getElementById('unified-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.close());
            }
        },

        createUI: function() {
            const html = `
                <div id="unified-ai-panel" class="hidden">
                    <div class="unified-container">
                        <!-- Header -->
                        <div class="unified-header">
                            <div class="unified-title">🤖 AI COLLABORATION CENTER</div>
                            <div class="unified-status">
                                <span class="status-dot" id="unified-status-dot"></span>
                                <span id="unified-status-text">Connecting...</span>
                            </div>
                            <button class="unified-close-btn" id="unified-close-btn">✕</button>
                        </div>

                        <!-- Tab Navigation -->
                        <div class="unified-tabs">
                            <button class="unified-tab-btn active" data-tab="chat">💬 Chat</button>
                            <button class="unified-tab-btn" data-tab="vision">👁️ Quick Commands</button>
                            <button class="unified-tab-btn" data-tab="controls">ℹ️ Info</button>
                        </div>

                        <!-- Tab Content -->
                        <div class="unified-content">
                            <!-- CHAT TAB -->
                            <div id="tab-chat" class="unified-tab-content active">
                                <div class="chat-participants">
                                    <span class="participant user">👤 YOU</span>
                                    <span class="participant in-game">🎮 IN-GAME AI</span>
                                    <span class="participant external">🤖 EXTERNAL AI</span>
                                </div>
                                <div class="chat-messages-area" id="unified-chat-messages">
                                    <!-- Messages appear here -->
                                </div>
                                <div class="chat-input-container">
                                    <input
                                        type="text"
                                        id="unified-chat-input"
                                        placeholder="Type message... (Press Enter)"
                                    />
                                    <button class="chat-send" id="unified-send-btn">📤</button>
                                </div>
                            </div>

                            <!-- VISION BRAIN TAB -->
                            <div id="tab-vision" class="unified-tab-content">
                                <div class="vision-brain-grid">
                                    <!-- Quick Commands -->
                                    <div class="quick-commands-panel">
                                        <div class="panel-header">⚡ QUICK AI COMMANDS</div>
                                        <div style="padding: 15px; color: #0af; font-size: 13px; line-height: 1.6;">
                                            Click any command to instantly ask the external AI for help.
                                            Responses appear in the Chat tab!
                                        </div>
                                        <div class="commands-grid">
                                            <button class="quick-cmd-btn" data-cmd="analyze">📊 Analyze Situation</button>
                                            <button class="quick-cmd-btn" data-cmd="see">👀 What Do You See?</button>
                                            <button class="quick-cmd-btn" data-cmd="stuck">🆘 Player Stuck?</button>
                                            <button class="quick-cmd-btn" data-cmd="threat">⚠️ Check Threats</button>
                                            <button class="quick-cmd-btn" data-cmd="objective">🎯 Next Objective</button>
                                            <button class="quick-cmd-btn" data-cmd="help">💡 General Help</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- CONTROLS TAB -->
                            <div id="tab-controls" class="unified-tab-content">
                                <div class="controls-panel">
                                    <div class="panel-header">ℹ️ AI COLLABORATION INFO</div>
                                    <div class="controls-info">
                                        <h3>Keyboard Shortcuts</h3>
                                        <div class="shortcut-list">
                                            <div class="shortcut-item">
                                                <kbd>F3</kbd>
                                                <span>Toggle AI Panel</span>
                                            </div>
                                            <div class="shortcut-item">
                                                <kbd>F4</kbd>
                                                <span>Quick Commands</span>
                                            </div>
                                            <div class="shortcut-item">
                                                <kbd>ESC</kbd>
                                                <span>Close Panel</span>
                                            </div>
                                        </div>

                                        <h3>How It Works</h3>
                                        <ul class="features-list">
                                            <li>💬 <strong>Chat Tab:</strong> Talk with in-game and external AI</li>
                                            <li>⚡ <strong>Quick Commands:</strong> Instant AI assistance</li>
                                            <li>🤖 <strong>Smart Helper:</strong> AI asks for help automatically</li>
                                            <li>👁️ <strong>Visual Context:</strong> AI can see the game</li>
                                            <li>📤 <strong>Real-time:</strong> Instant message delivery</li>
                                        </ul>

                                        <h3>Getting Responses</h3>
                                        <div style="padding: 12px; background: rgba(0,170,255,0.1); border-left: 3px solid #0af; margin: 10px 0; border-radius: 5px;">
                                            <strong>Start Manual Responder:</strong><br>
                                            Run <code>START_AI_MANUAL_RESPONDER.bat</code> to respond to AI questions in a terminal window!
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
            this.addStyles();
        },

        addStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                /* Unified AI Panel - Side Panel Design */
                #unified-ai-panel {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 450px;
                    height: 100vh;
                    background: rgba(0, 0, 0, 0.95);
                    border-left: 3px solid #0af;
                    z-index: 10000;
                    font-family: 'Courier New', monospace;
                    display: flex;
                    flex-direction: column;
                    box-shadow: -5px 0 30px rgba(0, 170, 255, 0.5);
                    transform: translateX(0);
                    transition: transform 0.3s ease-out;
                }

                #unified-ai-panel.hidden {
                    transform: translateX(100%);
                }

                .unified-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                /* Header */
                .unified-header {
                    background: linear-gradient(135deg, #0af 0%, #08d 100%);
                    padding: 15px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #0af;
                }

                .unified-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #000;
                }

                .unified-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 12px;
                    color: #000;
                    font-weight: bold;
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #f00;
                    animation: pulse 2s infinite;
                }

                .status-dot.connected {
                    background: #0f0;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                .unified-close-btn {
                    background: #f44;
                    color: #fff;
                    border: none;
                    width: 30px;
                    height: 30px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: bold;
                    transition: all 0.2s;
                }

                .unified-close-btn:hover {
                    background: #f66;
                    transform: scale(1.1);
                }

                /* Tabs */
                .unified-tabs {
                    display: flex;
                    background: rgba(0, 0, 0, 0.5);
                    border-bottom: 2px solid rgba(0, 170, 255, 0.3);
                    padding: 0 10px;
                    gap: 5px;
                }

                .unified-tab-btn {
                    padding: 12px 20px;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #0af;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .unified-tab-btn:hover {
                    background: rgba(0, 170, 255, 0.1);
                    color: #0cf;
                }

                .unified-tab-btn.active {
                    background: rgba(0, 170, 255, 0.2);
                    border-bottom-color: #0af;
                    color: #0cf;
                }

                /* Content Area */
                .unified-content {
                    flex: 1;
                    overflow: hidden;
                    position: relative;
                }

                .unified-tab-content {
                    display: none;
                    height: 100%;
                    overflow-y: auto;
                }

                .unified-tab-content.active {
                    display: flex;
                    flex-direction: column;
                }

                /* CHAT TAB STYLES */
                .chat-participants {
                    background: rgba(0, 0, 0, 0.5);
                    padding: 10px 15px;
                    border-bottom: 1px solid rgba(0, 170, 255, 0.3);
                    display: flex;
                    gap: 12px;
                    font-size: 11px;
                }

                .participant {
                    padding: 5px 12px;
                    border-radius: 12px;
                    border: 1px solid;
                    font-weight: bold;
                }

                .participant.user {
                    border-color: #0af;
                    color: #0af;
                    background: rgba(0, 170, 255, 0.1);
                }

                .participant.in-game {
                    border-color: #0f6;
                    color: #0f6;
                    background: rgba(0, 255, 102, 0.1);
                }

                .participant.external {
                    border-color: #f90;
                    color: #f90;
                    background: rgba(255, 153, 0, 0.1);
                }

                .chat-messages-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .chat-msg {
                    padding: 12px;
                    border-radius: 10px;
                    border-left: 4px solid;
                    animation: msgSlide 0.3s ease-out;
                    max-width: 80%;
                }

                @keyframes msgSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chat-msg.user {
                    border-left-color: #0af;
                    background: rgba(0, 170, 255, 0.15);
                    align-self: flex-end;
                }

                .chat-msg.in-game-ai {
                    border-left-color: #0f6;
                    background: rgba(0, 255, 102, 0.15);
                    align-self: flex-start;
                }

                .chat-msg.external-ai {
                    border-left-color: #f90;
                    background: rgba(255, 153, 0, 0.15);
                    align-self: flex-start;
                }

                .chat-msg.system {
                    border-left-color: #888;
                    background: rgba(136, 136, 136, 0.15);
                    align-self: center;
                    font-size: 12px;
                    color: #aaa;
                    text-align: center;
                }

                .msg-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }

                .msg-sender {
                    font-weight: bold;
                    font-size: 12px;
                }

                .chat-msg.user .msg-sender { color: #0af; }
                .chat-msg.in-game-ai .msg-sender { color: #0f6; }
                .chat-msg.external-ai .msg-sender { color: #f90; }

                .msg-time {
                    font-size: 10px;
                    color: #888;
                }

                .msg-content {
                    font-size: 14px;
                    line-height: 1.5;
                    color: #fff;
                }

                .msg-note {
                    margin-top: 6px;
                    font-size: 11px;
                    color: #0f6;
                }

                .chat-input-container {
                    background: rgba(0, 0, 0, 0.8);
                    padding: 15px;
                    border-top: 2px solid rgba(0, 170, 255, 0.3);
                    display: flex;
                    gap: 10px;
                }

                #unified-chat-input {
                    flex: 1;
                    padding: 12px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid #0af;
                    border-radius: 8px;
                    color: #fff;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                }

                #unified-chat-input:focus {
                    outline: none;
                    border-color: #0cf;
                    box-shadow: 0 0 15px rgba(0, 170, 255, 0.4);
                }

                .chat-send {
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #0af 0%, #08d 100%);
                    border: none;
                    border-radius: 8px;
                    color: #fff;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 16px;
                }

                .chat-send:hover {
                    background: linear-gradient(135deg, #0cf 0%, #0af 100%);
                    box-shadow: 0 0 20px rgba(0, 170, 255, 0.6);
                    transform: scale(1.05);
                }

                /* LIVE CAM TAB STYLES */
                .livecam-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 15px;
                    padding: 15px;
                    height: 100%;
                }

                .livecam-panel {
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid rgba(0, 170, 255, 0.3);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .panel-header {
                    background: rgba(0, 170, 255, 0.2);
                    padding: 10px;
                    font-weight: bold;
                    font-size: 13px;
                    color: #0af;
                    border-bottom: 2px solid rgba(0, 170, 255, 0.3);
                }

                .vision-display {
                    padding: 10px;
                }

                #unified-vision-canvas {
                    width: 100%;
                    height: auto;
                    border: 2px solid rgba(0, 170, 255, 0.3);
                    border-radius: 5px;
                }

                .stats-grid {
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px;
                    background: rgba(0, 170, 255, 0.05);
                    border-radius: 5px;
                    border-left: 3px solid #0af;
                }

                .stat-label {
                    color: #0af;
                    font-size: 12px;
                    font-weight: bold;
                }

                .stat-value {
                    color: #fff;
                    font-size: 12px;
                }

                /* VISION BRAIN TAB STYLES */
                .vision-brain-grid {
                    padding: 15px;
                    display: grid;
                    grid-template-rows: auto 1fr;
                    gap: 15px;
                    height: 100%;
                }

                .brain-status-panel, .quick-commands-panel {
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid rgba(0, 170, 255, 0.3);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .brain-info {
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .brain-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .brain-item label {
                    color: #0af;
                    font-size: 12px;
                    font-weight: bold;
                }

                .brain-item span {
                    color: #fff;
                    font-size: 13px;
                }

                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 4px;
                    overflow: hidden;
                    border: 1px solid rgba(0, 170, 255, 0.3);
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #0af 0%, #0cf 100%);
                    transition: width 0.3s;
                }

                .commands-grid {
                    padding: 15px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }

                .quick-cmd-btn {
                    padding: 15px 10px;
                    background: rgba(0, 170, 255, 0.1);
                    border: 2px solid #0af;
                    border-radius: 8px;
                    color: #0af;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .quick-cmd-btn:hover {
                    background: #0af;
                    color: #000;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 170, 255, 0.5);
                }

                /* CONTROLS TAB STYLES */
                .controls-panel {
                    padding: 20px;
                    height: 100%;
                    overflow-y: auto;
                }

                .controls-info h3 {
                    color: #0af;
                    margin: 20px 0 10px 0;
                    font-size: 16px;
                    border-bottom: 2px solid rgba(0, 170, 255, 0.3);
                    padding-bottom: 5px;
                }

                .shortcut-list {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin: 15px 0;
                }

                .shortcut-item {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 10px;
                    background: rgba(0, 170, 255, 0.05);
                    border-radius: 5px;
                    border-left: 3px solid #0af;
                }

                kbd {
                    background: #0af;
                    color: #000;
                    padding: 5px 12px;
                    border-radius: 5px;
                    font-weight: bold;
                    font-size: 13px;
                    min-width: 50px;
                    text-align: center;
                }

                .shortcut-item span {
                    color: #fff;
                    font-size: 14px;
                }

                .features-list {
                    list-style: none;
                    padding: 0;
                    margin: 15px 0;
                }

                .features-list li {
                    padding: 10px;
                    margin: 5px 0;
                    background: rgba(0, 170, 255, 0.05);
                    border-radius: 5px;
                    border-left: 3px solid #0f6;
                    color: #fff;
                    font-size: 14px;
                }

                /* Scrollbar Styles */
                .chat-messages-area::-webkit-scrollbar,
                .unified-tab-content::-webkit-scrollbar,
                .controls-panel::-webkit-scrollbar {
                    width: 10px;
                }

                .chat-messages-area::-webkit-scrollbar-track,
                .unified-tab-content::-webkit-scrollbar-track,
                .controls-panel::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }

                .chat-messages-area::-webkit-scrollbar-thumb,
                .unified-tab-content::-webkit-scrollbar-thumb,
                .controls-panel::-webkit-scrollbar-thumb {
                    background: rgba(0, 170, 255, 0.5);
                    border-radius: 5px;
                }

                .chat-messages-area::-webkit-scrollbar-thumb:hover,
                .unified-tab-content::-webkit-scrollbar-thumb:hover,
                .controls-panel::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 170, 255, 0.7);
                }
            `;
            document.head.appendChild(style);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UnifiedAIPanel.init());
    } else {
        UnifiedAIPanel.init();
    }

    // Expose globally
    window.UnifiedAIPanel = UnifiedAIPanel;

    console.log('[Unified AI] Unified AI Panel loaded successfully');
})();
