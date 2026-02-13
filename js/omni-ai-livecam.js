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
    serverUrl: 'http://127.0.0.1:8080',
    
    init: function() {
        console.log('[AI Live Cam] Creating UI...');
        this.createUI();
        this.setupKeys();
        this.setupStyles();
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
                            
                            <!-- Thoughts Stream -->
                            <div class="ai-thoughts-panel">
                                <div class="panel-title">💭 AI THOUGHTS</div>
                                <div id="ai-thoughts" class="thoughts-stream"></div>
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
        
        this.aiLoopInterval = setInterval(() => {
            if (!this.aiPlayerActive || !window.AIPlayerAPI) return;
            
            // Get game state
            const state = window.AIPlayerAPI.getGameState();
            if (!state) return;
            
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

console.log('[AI Diagnostics] Live cam loaded - Press F3 or F4 to open unified interface (testing + live cam)');

})();
