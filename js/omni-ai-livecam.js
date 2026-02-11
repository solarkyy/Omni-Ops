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
    visionUpdateInterval: null,
    serverUrl: 'http://localhost:8080',
    ws: null,
    wsConnected: false,
    
    init: function() {
        console.log('[AI Live Cam] Creating UI...');
        this.createUI();
        this.setupKeys();
        this.setupStyles();
        this.connectWebSocket();
    },

    connectWebSocket: function() {
        try {
            this.ws = new WebSocket('ws://localhost:8080');

            this.ws.onopen = () => {
                console.log('[AI Live Cam] WebSocket connected to backend');
                this.wsConnected = true;
                this.log('✓ Connected to AI backend server', 'ai-success');
            };

            this.ws.onclose = () => {
                console.log('[AI Live Cam] WebSocket disconnected');
                this.wsConnected = false;
                this.log('⚠ Disconnected from AI backend', 'ai-action');
                // Attempt reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error('[AI Live Cam] WebSocket error:', error);
                this.wsConnected = false;
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                } catch (err) {
                    console.error('[AI Live Cam] Failed to parse server message:', err);
                }
            };
        } catch (err) {
            console.error('[AI Live Cam] Failed to connect WebSocket:', err);
            this.log('Running in offline mode - advanced AI features unavailable', 'ai-action');
        }
    },

    handleServerMessage: function(data) {
        if (data.type === 'ai_message') {
            // AI backend sent a message/analysis
            this.addChatMessage('AI', data.content);
        } else if (data.type === 'ai_action') {
            // AI backend wants to perform an action
            this.log(`🤖 Backend AI: ${data.action}`, 'ai-action');
            this.addChatMessage('SYSTEM', `AI Action: ${data.action}`);
        } else if (data.type === 'ai_analysis') {
            // Vision analysis from backend
            this.addChatMessage('AI', `Vision Analysis: ${data.content}`);
        } else if (data.type === 'ai_response') {
            // Direct chat response
            this.addChatMessage('AI', data.content);
        } else if (data.type === 'ai_report') {
            // System report from AI
            this.addChatMessage('AI', data.content);
        }
    },

    addChatMessage: function(sender, content) {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;

        const timestamp = new Date().toLocaleTimeString();
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender.toLowerCase()}`;

        messageDiv.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-sender ${sender.toLowerCase()}">${sender}</span>
                <span class="chat-timestamp">${timestamp}</span>
            </div>
            <div class="chat-content">${content}</div>
        `;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },

    sendChatMessage: function() {
        const input = document.getElementById('ai-chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        this.addChatMessage('USER', message);

        // Get current game state and vision
        const gameState = window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : null;
        const visionCanvas = document.getElementById('ai-vision-canvas');
        const visionData = visionCanvas ? visionCanvas.toDataURL('image/png') : null;

        // Send to backend if connected
        if (this.wsConnected) {
            this.sendToBackend({
                type: 'chat_message',
                message: message,
                gameState: gameState,
                vision: visionData,
                timestamp: Date.now()
            });
        } else {
            // Offline mode - simulate AI response
            this.simulateAIResponse(message, gameState);
        }

        input.value = '';
    },

    simulateAIResponse: function(userMessage, gameState) {
        // Offline AI response based on game state
        setTimeout(() => {
            let response = '';

            const lower = userMessage.toLowerCase();

            if (lower.includes('test') || lower.includes('report') || lower.includes('diagnostic')) {
                response = this.generateTestReport(gameState);
            } else if (lower.includes('see') || lower.includes('vision') || lower.includes('look') || lower.includes('view')) {
                if (gameState && gameState.enemies.length > 0) {
                    response = `I can see ${gameState.enemies.length} enemies. The closest one is at ${gameState.enemies[0].distance.toFixed(1)}m.`;
                } else {
                    response = "I don't see any enemies right now. The area appears clear.";
                }
            } else if (lower.includes('health') || lower.includes('status')) {
                if (gameState) {
                    response = `My status:\n- Health: ${gameState.player.health}/${gameState.player.maxHealth}\n- Ammo: ${gameState.player.ammo}/${gameState.player.reserveAmmo}\n- Position: (${gameState.player.x.toFixed(1)}, ${gameState.player.z.toFixed(1)})`;
                } else {
                    response = "Game is not active. Cannot check status.";
                }
            } else if (lower.includes('enemy') || lower.includes('enemies') || lower.includes('threat')) {
                if (gameState && gameState.enemies.length > 0) {
                    response = `There are ${gameState.enemies.length} enemies detected:\n` +
                        gameState.enemies.slice(0, 3).map((e, i) =>
                            `${i + 1}. ${e.faction} at ${e.distance.toFixed(1)}m (Health: ${e.health})`
                        ).join('\n');
                    if (gameState.enemies.length > 3) {
                        response += `\n... and ${gameState.enemies.length - 3} more`;
                    }
                } else {
                    response = "No enemies detected in the area.";
                }
            } else if (lower.includes('improve') || lower.includes('problem') || lower.includes('issue') || lower.includes('fix')) {
                response = this.generateImprovementReport(gameState);
            } else if (lower.includes('working') || lower.includes('works')) {
                response = this.generateWorkingReport(gameState);
            } else if (lower.includes('help') || lower.includes('command')) {
                response = `I'm the AI assistant. Available commands:\n\n` +
                    `📊 "test" or "report" - Run system diagnostics\n` +
                    `👁️ "what do you see?" - Vision report\n` +
                    `❤️ "status" or "health" - My current status\n` +
                    `⚔️ "enemies" - Enemy threat analysis\n` +
                    `✓ "what works?" - Report working systems\n` +
                    `⚠️ "what's broken?" - Report issues\n` +
                    `💡 "improvements" - Suggest improvements\n\n` +
                    `I can see the game and analyze what's happening!`;
            } else {
                response = `I received your message: "${userMessage}". Note: AI backend is offline. For full functionality, please start the backend server. I can still answer basic questions about the game state.`;
            }

            this.addChatMessage('AI', response);
        }, 500);
    },

    generateImprovementReport: function(gameState) {
        const lines = [];
        lines.push('=== IMPROVEMENT SUGGESTIONS ===\n');

        // Vision system
        const visionCanvas = document.getElementById('ai-vision-canvas');
        if (!visionCanvas || !window.renderer) {
            lines.push('⚠ VISION SYSTEM:');
            lines.push('  - Game view canvas is not capturing properly');
            lines.push('  - Recommendation: Check if window.renderer exists');
            lines.push('  - This prevents me from "seeing" the game\n');
        }

        // Backend
        if (!this.wsConnected) {
            lines.push('⚠ AI BACKEND:');
            lines.push('  - Backend server is offline');
            lines.push('  - Missing: Advanced vision analysis, natural language');
            lines.push('  - Recommendation: Run LAUNCH_AI_BACKEND.bat\n');
        }

        // Combat system
        if (gameState && this.aiPlayerActive) {
            lines.push('⚠ COMBAT AI:');
            lines.push('  - Currently using basic decision tree');
            lines.push('  - Could improve: Cover detection, team tactics');
            lines.push('  - Could improve: Predictive aiming, flanking\n');
        }

        // Performance
        lines.push('💡 PERFORMANCE:');
        lines.push('  - Vision updates at 10 FPS (could be higher)');
        lines.push('  - AI decision loop at 10 Hz (good)');
        lines.push('  - Could add: Frame rate adaptation\n');

        if (lines.length === 1) {
            return 'Everything appears to be working well! No major improvements needed at this time.';
        }

        return lines.join('\n');
    },

    generateWorkingReport: function(gameState) {
        const lines = [];
        lines.push('=== WORKING SYSTEMS ===\n');

        // Game API
        if (gameState) {
            lines.push('✅ GAME API:');
            lines.push('  - Player position tracking');
            lines.push('  - Enemy detection and tracking');
            lines.push('  - Health/ammo monitoring\n');
        }

        // Control System
        if (window.AIPlayerAPI) {
            lines.push('✅ CONTROL SYSTEM:');
            lines.push('  - Movement controls (WASD)');
            lines.push('  - Aiming and shooting');
            lines.push('  - Sprint, crouch, reload\n');
        }

        // AI Logic
        if (this.aiPlayerActive) {
            lines.push('✅ AI DECISION MAKING:');
            lines.push('  - Tactical combat engagement');
            lines.push('  - Cover seeking when low health');
            lines.push('  - Auto-reload when low ammo');
            lines.push('  - Distance-based tactics\n');
        }

        // UI
        lines.push('✅ USER INTERFACE:');
        lines.push('  - Live statistics display');
        lines.push('  - Tactical radar view');
        lines.push('  - Activity logging');
        lines.push('  - Chat system (this!)\n');

        // Keybinds
        lines.push('✅ CONTROLS:');
        lines.push('  - F4 to open/close');
        lines.push('  - Difficulty settings');
        lines.push('  - Aggression slider');

        return lines.join('\n');
    },

    generateTestReport: function(gameState) {
        const lines = [];
        lines.push('=== AI SYSTEM TEST REPORT ===\n');

        // Test 1: Game API
        if (gameState) {
            lines.push('✓ Game API: WORKING');
            lines.push(`  - Player at (${gameState.player.x.toFixed(1)}, ${gameState.player.z.toFixed(1)})`);
            lines.push(`  - Health: ${gameState.player.health}/${gameState.player.maxHealth}`);
            lines.push(`  - Enemies visible: ${gameState.enemies.length}`);
        } else {
            lines.push('✗ Game API: NOT ACTIVE');
        }

        // Test 2: Vision System
        const visionCanvas = document.getElementById('ai-vision-canvas');
        if (visionCanvas && window.renderer) {
            lines.push('✓ Vision System: WORKING');
            lines.push(`  - Canvas: ${visionCanvas.width}x${visionCanvas.height}`);
        } else {
            lines.push('✗ Vision System: NOT WORKING');
            lines.push('  - Issue: Canvas or renderer unavailable');
        }

        // Test 3: Backend Connection
        if (this.wsConnected) {
            lines.push('✓ Backend Server: CONNECTED');
        } else {
            lines.push('✗ Backend Server: OFFLINE');
            lines.push('  - Recommendation: Start ai_backend_server.py');
        }

        // Test 4: Control System
        if (window.AIPlayerAPI) {
            lines.push('✓ Control System: AVAILABLE');
            lines.push(`  - AI Active: ${this.aiPlayerActive ? 'YES' : 'NO'}`);
        } else {
            lines.push('✗ Control System: NOT FOUND');
        }

        lines.push('\n=== RECOMMENDATIONS ===');
        if (!this.wsConnected) {
            lines.push('- Start the Python backend server for advanced AI features');
        }
        if (!gameState) {
            lines.push('- Start the game to enable AI testing');
        }
        if (gameState && gameState.enemies.length === 0) {
            lines.push('- Spawn enemies to test combat AI');
        }

        return lines.join('\n');
    },

    sendToBackend: function(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    },

    addThought: function(text) {
        // Legacy function - now routes to chat
        this.addChatMessage('SYSTEM', text);
    },
    
    createUI: function() {
        const html = `
            <div id="ai-livecam-overlay" class="ai-livecam-hidden">
                <div class="ai-livecam-container">
                    <!-- Header -->
                    <div class="ai-livecam-header">
                        <div class="ai-livecam-title">📹 AI LIVE CAM - Watch AI Play</div>
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
                                        <span>🟢 Player</span>
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
                            
                            <!-- AI Chat Interface -->
                            <div class="ai-chat-panel">
                                <div class="panel-title">💬 AI CHAT - Talk to the AI</div>
                                <div id="ai-chat-messages" class="chat-messages"></div>
                                <div class="chat-input-container">
                                    <input type="text" id="ai-chat-input" class="chat-input"
                                           placeholder="Ask the AI anything... (Enter to send)"
                                           onkeypress="if(event.key==='Enter') window.AILiveCam.sendChatMessage()">
                                    <button onclick="window.AILiveCam.sendChatMessage()" class="chat-send-btn">SEND</button>
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

            /* Chat Interface Styles */
            .ai-chat-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 300px;
            }

            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #0f6;
                border-radius: 4px;
                margin-bottom: 8px;
                font-size: 12px;
                line-height: 1.5;
                max-height: 400px;
            }

            .chat-message {
                margin-bottom: 10px;
                padding: 8px;
                border-radius: 4px;
                border-left: 3px solid #0f6;
            }

            .chat-message.user {
                background: rgba(0, 255, 255, 0.1);
                border-left-color: #0ff;
            }

            .chat-message.ai {
                background: rgba(0, 255, 100, 0.1);
                border-left-color: #0f6;
            }

            .chat-message.system {
                background: rgba(255, 170, 0, 0.1);
                border-left-color: #fa0;
            }

            .chat-message-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 4px;
                font-size: 10px;
            }

            .chat-sender {
                font-weight: bold;
                color: #0f6;
            }

            .chat-sender.user {
                color: #0ff;
            }

            .chat-sender.system {
                color: #fa0;
            }

            .chat-timestamp {
                color: #666;
            }

            .chat-content {
                color: #0f6;
                white-space: pre-wrap;
            }

            .chat-input-container {
                display: flex;
                gap: 8px;
            }

            .chat-input {
                flex: 1;
                background: #000;
                color: #0f6;
                border: 1px solid #0f6;
                border-radius: 4px;
                padding: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
            }

            .chat-input:focus {
                outline: none;
                border-color: #0ff;
                box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
            }

            .chat-send-btn {
                background: #0f6;
                color: #000;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                font-weight: bold;
                cursor: pointer;
                font-family: 'Courier New', monospace;
            }

            .chat-send-btn:hover {
                background: #0ff;
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
        `;
        
        document.head.appendChild(style);
    },
    
    setupKeys: function() {
        const handler = (e) => {
            // F3 or F4 both open the unified interface
            if (e.code === 'F3' || e.code === 'F4') {
                e.preventDefault();
                this.toggle();
                // Also toggle the testing interface if available
                if (window.AITester && window.AITester.toggle) {
                    window.AITester.toggle();
                }
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
        if (overlay) {
            if (this.active) {
                overlay.classList.remove('ai-livecam-hidden');
                this.startUpdates();
                if (typeof document.exitPointerLock === 'function') {
                    document.exitPointerLock();
                }

                // Send welcome message
                setTimeout(() => {
                    this.addChatMessage('SYSTEM', 'AI Live Cam activated. Type "help" for available commands or "test" to run a system diagnostic.');
                }, 100);
            } else {
                overlay.classList.add('ai-livecam-hidden');
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
        this.visionUpdateInterval = setInterval(() => this.updateGameVision(), 100);
    },
    
    stopUpdates: function() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.statsInterval) clearInterval(this.statsInterval);
        if (this.thoughtUpdateInterval) clearInterval(this.thoughtUpdateInterval);
        if (this.visionUpdateInterval) clearInterval(this.visionUpdateInterval);
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
    
    updateThoughts: function() {
        // This will be filled by AI player
    },

    updateGameVision: function() {
        // Capture the actual game renderer output to the AI vision canvas
        const visionCanvas = document.getElementById('ai-vision-canvas');
        const gameRenderer = window.renderer;

        if (!visionCanvas || !gameRenderer) return;

        try {
            const ctx = visionCanvas.getContext('2d');
            const srcCanvas = gameRenderer.domElement;

            // Draw the game canvas onto the AI vision canvas (scaled down)
            ctx.drawImage(srcCanvas, 0, 0, visionCanvas.width, visionCanvas.height);
        } catch (err) {
            console.error('[AI Live Cam] Failed to capture game vision:', err);
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

        // Notify backend server
        this.sendToBackend({
            type: 'control_toggle',
            enabled: true,
            mode: 'autonomous'
        });

        // Start AI decision loop
        this.startAILoop();

        // Start periodic vision updates to backend (every 2 seconds)
        this.visionSendInterval = setInterval(() => {
            if (this.wsConnected && this.aiPlayerActive) {
                this.sendVisionToBackend();
            }
        }, 2000);

        this.log('AI player activated!', 'ai-success');
        this.addChatMessage('SYSTEM', 'AI control activated. Analyzing environment...');

        // Have AI introduce itself and report
        setTimeout(() => {
            const state = window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : null;
            if (state) {
                this.addChatMessage('AI', `I'm now in control. I see ${state.enemies.length} enemies in the area. My health is ${state.player.health}/${state.player.maxHealth}. Beginning tactical operations...`);
            } else {
                this.addChatMessage('AI', 'AI control activated, but game state unavailable. Waiting for game to start...');
            }
        }, 1000);
    },

    sendVisionToBackend: function() {
        const visionCanvas = document.getElementById('ai-vision-canvas');
        if (!visionCanvas) return;

        try {
            // Get current game state
            const state = window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : null;

            // Get screenshot as base64
            const dataUrl = visionCanvas.toDataURL('image/png');

            // Send to backend for analysis
            this.sendToBackend({
                type: 'screenshot',
                image: dataUrl,
                gameState: state,
                timestamp: Date.now()
            });

            this.addThought('Vision data sent to AI backend for analysis...');
        } catch (err) {
            console.error('[AI Live Cam] Failed to send vision:', err);
        }
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

        // Stop vision sending
        if (this.visionSendInterval) {
            clearInterval(this.visionSendInterval);
            this.visionSendInterval = null;
        }

        // Release all inputs and deactivate AI mode
        if (window.AIPlayerAPI) {
            window.AIPlayerAPI.deactivateAI();
            this.log('✓ AI control mode disabled', 'ai-success');
        }

        // Notify backend
        this.sendToBackend({
            type: 'control_toggle',
            enabled: false
        });

        this.log('AI player stopped', 'ai-action');
        this.addThought('AI control deactivated. Manual control restored.');
    },
    
    resetStats: function() {
        this.log('Statistics reset', 'ai-action');
        document.getElementById('stat-kills').textContent = '0';
        document.getElementById('stat-accuracy').textContent = '0%';
        document.getElementById('stat-time').textContent = '0s';
    },
    
    startAILoop: function() {
        if (this.aiLoopInterval) clearInterval(this.aiLoopInterval);

        // AI state tracking
        this.aiState = {
            lastShotTime: 0,
            isInCombat: false,
            coverSearchTime: 0,
            lastReloadTime: 0,
            currentTarget: null,
            strafeDirection: 1,
            strafeChangeTime: 0
        };

        this.aiLoopInterval = setInterval(() => {
            if (!this.aiPlayerActive || !window.AIPlayerAPI) return;

            // Get game state
            const state = window.AIPlayerAPI.getGameState();
            if (!state) return;

            // Get difficulty settings
            const difficulty = document.getElementById('ai-difficulty')?.value || 'medium';
            const aggression = parseInt(document.getElementById('ai-aggression')?.value || 70) / 100;

            // Enhanced AI behavior with tactics
            this.performIntelligentAI(state, difficulty, aggression);
        }, 100);
    },

    performIntelligentAI: function(state, difficulty, aggression) {
        const player = state.player;
        const enemies = state.enemies;
        const now = Date.now();

        // Clear all inputs each frame
        window.AIPlayerAPI.setInput('moveForward', false);
        window.AIPlayerAPI.setInput('moveBackward', false);
        window.AIPlayerAPI.setInput('moveLeft', false);
        window.AIPlayerAPI.setInput('moveRight', false);
        window.AIPlayerAPI.setInput('fire', false);
        window.AIPlayerAPI.setInput('sprint', false);
        window.AIPlayerAPI.setInput('crouch', false);

        // Update AI state display
        const healthPercent = (player.health / player.maxHealth) * 100;
        const ammoPercent = player.reserveAmmo > 0 ? (player.ammo / 30) : 0;

        // === TACTICAL DECISION TREE ===

        // 1. CRITICAL: Low health - seek cover
        if (healthPercent < 30) {
            document.getElementById('ai-state').textContent = 'SEEKING COVER';
            document.getElementById('ai-objective').textContent = 'Retreating - Low health!';

            // Move backward and strafe
            window.AIPlayerAPI.setInput('moveBackward', true);
            window.AIPlayerAPI.setInput('sprint', true);
            window.AIPlayerAPI.setInput('crouch', true);

            // Strafe to make harder to hit
            if (now - this.aiState.strafeChangeTime > 800) {
                this.aiState.strafeDirection *= -1;
                this.aiState.strafeChangeTime = now;
            }
            window.AIPlayerAPI.setInput(this.aiState.strafeDirection > 0 ? 'moveRight' : 'moveLeft', true);

            this.log('⚠️ Low health! Seeking cover...', 'ai-combat');
            return;
        }

        // 2. RELOAD: Low ammo
        if (player.ammo < 5 && !player.isReloading && player.reserveAmmo > 0) {
            if (now - this.aiState.lastReloadTime > 2000) {
                document.getElementById('ai-state').textContent = 'RELOADING';
                window.AIPlayerAPI.pressKey('reload');
                this.aiState.lastReloadTime = now;
                this.log('🔄 Reloading weapon', 'ai-action');
            }
        }

        // 3. COMBAT: Engage enemies
        if (enemies && enemies.length > 0) {
            this.aiState.isInCombat = true;
            document.getElementById('ai-state').textContent = 'COMBAT';

            // Find closest enemy
            const closest = enemies.reduce((prev, curr) =>
                prev.distance < curr.distance ? prev : curr
            );

            this.aiState.currentTarget = closest;
            document.getElementById('ai-target').textContent = `Enemy at ${closest.distance.toFixed(1)}m`;
            document.getElementById('ai-objective').textContent = `Engaging hostile target`;

            // Calculate look direction to enemy
            const dx = closest.x - player.x;
            const dz = closest.z - player.z;
            const dy = closest.y - player.y;
            const yaw = Math.atan2(dx, dz);
            const distance = Math.sqrt(dx * dx + dz * dz);
            const pitch = -Math.atan2(dy, distance);

            // Look at enemy with difficulty-based accuracy
            let aimYaw = yaw;
            let aimPitch = pitch;

            if (difficulty === 'easy') {
                // Poor aim
                aimYaw += (Math.random() - 0.5) * 0.3;
                aimPitch += (Math.random() - 0.5) * 0.2;
            } else if (difficulty === 'medium') {
                // Decent aim
                aimYaw += (Math.random() - 0.5) * 0.15;
                aimPitch += (Math.random() - 0.5) * 0.1;
            } else if (difficulty === 'hard') {
                // Good aim
                aimYaw += (Math.random() - 0.5) * 0.05;
                aimPitch += (Math.random() - 0.5) * 0.03;
            }
            // Expert = perfect aim

            window.AIPlayerAPI.setLook(aimYaw, aimPitch);

            // Distance-based tactics
            const optimalRange = 15 + (aggression * 10); // 15-25m based on aggression

            if (closest.distance > optimalRange + 5) {
                // Too far - advance
                window.AIPlayerAPI.setInput('moveForward', true);
                if (aggression > 0.7) {
                    window.AIPlayerAPI.setInput('sprint', true);
                }
                this.log(`🎯 Advancing on enemy (${closest.distance.toFixed(1)}m)`, 'ai-combat');

            } else if (closest.distance < optimalRange - 5) {
                // Too close - back up
                window.AIPlayerAPI.setInput('moveBackward', true);
                this.log(`🎯 Creating distance from enemy (${closest.distance.toFixed(1)}m)`, 'ai-combat');

            } else {
                // Optimal range - strafe and shoot
                if (now - this.aiState.strafeChangeTime > 1000) {
                    this.aiState.strafeDirection *= -1;
                    this.aiState.strafeChangeTime = now;
                }
                window.AIPlayerAPI.setInput(this.aiState.strafeDirection > 0 ? 'moveRight' : 'moveLeft', true);
            }

            // Shoot if aimed at target and have ammo
            if (player.ammo > 0 && !player.isReloading) {
                const angleToTarget = Math.abs(yaw - player.yaw);
                const isAimed = angleToTarget < 0.2; // ~11 degrees

                if (isAimed) {
                    window.AIPlayerAPI.setInput('fire', true);
                    if (now - this.aiState.lastShotTime > 200) {
                        this.log(`🎯 Engaging enemy at ${closest.distance.toFixed(1)}m`, 'ai-combat');
                        this.aiState.lastShotTime = now;
                    }
                }
            }

        } else {
            // 4. EXPLORATION: No enemies - patrol
            this.aiState.isInCombat = false;
            document.getElementById('ai-state').textContent = 'EXPLORING';
            document.getElementById('ai-target').textContent = 'None';
            document.getElementById('ai-objective').textContent = 'Patrolling area';

            // Move forward slowly
            window.AIPlayerAPI.setInput('moveForward', true);

            // Slowly rotate to scan area
            const scanSpeed = 0.008;
            const newYaw = player.yaw + scanSpeed;
            window.AIPlayerAPI.setLook(newYaw, 0);

            if (now - this.aiState.lastShotTime > 5000) {
                this.log('🗺️ Area clear, continuing patrol', 'ai-action');
                this.aiState.lastShotTime = now;
            }
        }
    },
    
    testConnection: function() {
        this.log('Testing connections...', 'ai-action');

        // Test game API
        if (window.AIPlayerAPI) {
            const state = window.AIPlayerAPI.getGameState();
            if (state) {
                this.log('✓ Game API connected', 'ai-success');
                this.log(`✓ Player at (${state.player.x.toFixed(1)}, ${state.player.z.toFixed(1)})`, 'ai-success');
                this.log(`✓ Health: ${state.player.health.toFixed(0)}/${state.player.maxHealth}`, 'ai-success');
                this.log(`✓ Ammo: ${state.player.ammo}/${state.player.reserveAmmo}`, 'ai-success');
                this.log(`✓ ${state.enemies.length} enemies detected`, 'ai-success');
            } else {
                this.log('✗ Game not active', 'ai-action');
            }
        } else {
            this.log('✗ AIPlayerAPI not found', 'ai-action');
        }

        // Test WebSocket backend
        if (this.wsConnected) {
            this.log('✓ AI backend server connected', 'ai-success');
            this.sendToBackend({
                type: 'ping',
                timestamp: Date.now()
            });
        } else {
            this.log('✗ AI backend server offline (advanced AI features unavailable)', 'ai-action');
            this.log('  Local AI is still functional', 'ai-action');
        }

        // Test renderer
        if (window.renderer) {
            this.log('✓ Game renderer available', 'ai-success');
        } else {
            this.log('✗ Game renderer not found', 'ai-action');
        }

        this.log('Connection test complete', 'ai-action');
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

console.log('[AI Diagnostics] Live cam loaded - Press F3 or F4 to open unified interface (testing + live cam)');

})();
