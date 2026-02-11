/**
 * OMNI-OPS Unified Control Panel
 * Consolidates Chat, Controls, Game State, and Status into tabbed interface
 * Replaces scattered UI elements
 */

window.OmniUnifiedPanel = {
    visible: false,
    currentTab: 'status',
    
    init() {
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'omni-unified-panel';
        panel.innerHTML = `
            <div class="unified-panel-container">
                <!-- Header -->
                <div class="unified-header">
                    <div class="unified-title">⚡ OMNI-OPS CONTROL</div>
                    <div class="unified-controls">
                        <button id="panel-collapse-btn" class="panel-btn">−</button>
                        <button id="panel-close-btn" class="panel-btn">✕</button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div class="unified-tabs">
                    <button class="tab-btn active" data-tab="status">📊 Status</button>
                    <button class="tab-btn" data-tab="controls">🎮 Controls</button>
                    <button class="tab-btn" data-tab="ai">🤖 AI</button>
                    <button class="tab-btn" data-tab="chat">💬 Chat</button>
                    <button class="tab-btn" data-tab="tools">🔧 Tools</button>
                </div>
                
                <!-- Tab Content -->
                <div class="unified-content">
                    
                    <!-- Status Tab -->
                    <div class="tab-content active" id="tab-status" data-tab="status">
                        <div class="status-grid">
                            <div class="status-item">
                                <span class="status-label">👤 Health</span>
                                <div class="status-bar">
                                    <div id="status-hp-bar" class="bar green"></div>
                                    <span id="status-hp-text">100/100</span>
                                </div>
                            </div>
                            <div class="status-item">
                                <span class="status-label">⚡ Stamina</span>
                                <div class="status-bar">
                                    <div id="status-stamina-bar" class="bar yellow"></div>
                                    <span id="status-stamina-text">100%</span>
                                </div>
                            </div>
                            <div class="status-item">
                                <span class="status-label">🔫 Ammo</span>
                                <span id="status-ammo">30 / 90</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">📍 Position</span>
                                <span id="status-pos" style="font-size:11px;">X: 0.00 | Y: 0.00 | Z: 0.00</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">⚙️ Mode</span>
                                <span id="status-mode" style="font-weight:bold; color:#0f0;">FPS</span>
                            </div>
                            <div class="status-item">
                                <span class="status-label">🎮 Game</span>
                                <span id="status-game" style="color:#0f6;">ACTIVE</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Controls Tab -->
                    <div class="tab-content" id="tab-controls" data-tab="controls">
                        <div class="controls-section">
                            <h4>Movement & Actions</h4>
                            <div class="control-grid">
                                <button class="quick-action-btn" data-action="moveForward">W - Forward</button>
                                <button class="quick-action-btn" data-action="moveBackward">S - Back</button>
                                <button class="quick-action-btn" data-action="moveLeft">A - Left</button>
                                <button class="quick-action-btn" data-action="moveRight">D - Right</button>
                                <button class="quick-action-btn" data-action="jump">SPACE - Jump</button>
                                <button class="quick-action-btn" data-action="sprint">SHIFT - Sprint</button>
                                <button class="quick-action-btn" data-action="crouch">CTRL - Crouch</button>
                                <button class="quick-action-btn" data-action="reload">R - Reload</button>
                            </div>
                        </div>
                        <div class="controls-section">
                            <h4>Settings</h4>
                            <div style="font-size:12px; color:#aaa;">
                                <label>Mouse Sensitivity: 
                                    <input type="range" id="panel-sensitivity" min="0.0005" max="0.005" step="0.0001" value="0.002" style="width:100px;">
                                </label>
                            </div>
                            <div style="font-size:12px; color:#aaa; margin-top:8px;">
                                <label>Move Speed: 
                                    <input type="range" id="panel-move-speed" min="5" max="15" step="1" value="8" style="width:100px;">
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI Tab -->
                    <div class="tab-content" id="tab-ai" data-tab="ai">
                        <div class="ai-control-panel">
                            <div style="margin-bottom:15px;">
                                <h4 style="margin:0 0 10px 0;">AI Control Status</h4>
                                <div class="status-indicator">
                                    <span id="ai-control-status" style="display:inline-block; width:12px; height:12px; background:#f00; border-radius:50%; margin-right:8px;"></span>
                                    <span id="ai-status-text">AI Not Active</span>
                                </div>
                            </div>
                            
                            <div style="border-top:1px solid #333; padding-top:12px;">
                                <h4 style="margin:0 0 10px 0;">AI Commands</h4>
                                <button id="ai-activate-btn" class="ai-btn activate-btn" style="width:48%; margin:5px 2% 5px 0;">▶️ Activate</button>
                                <button id="ai-deactivate-btn" class="ai-btn deactivate-btn" style="width:48%; margin:5px 0 5px 2%;">⏹️ Deactivate</button>
                                <button id="ai-move-fwd-btn" class="ai-btn" style="width:100%; margin:5px 0;">Move Forward</button>
                                <button id="ai-move-back-btn" class="ai-btn" style="width:100%; margin:5px 0;">Move Back</button>
                                <button id="ai-turn-left-btn" class="ai-btn" style="width:48%; margin:5px 2% 5px 0;">Turn Left</button>
                                <button id="ai-turn-right-btn" class="ai-btn" style="width:48%; margin:5px 0 5px 2%;">Turn Right</button>
                                <button id="ai-shoot-btn" class="ai-btn" style="width:100%; margin:5px 0;">Shoot</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chat Tab -->
                    <div class="tab-content" id="tab-chat" data-tab="chat">
                        <div id="chat-box" style="height:250px; overflow-y:auto; background:rgba(0,0,0,0.5); border:1px solid #0f6; border-radius:5px; padding:10px; margin-bottom:10px;">
                            <!-- Messages appear here -->
                        </div>
                        <div style="display:flex; gap:5px;">
                            <input type="text" id="chat-input" placeholder="Type message..." style="flex:1; padding:8px; background:#1a1a1a; border:1px solid #0f6; color:#0f6; border-radius:3px;">
                            <button id="chat-send-btn" style="padding:8px 15px; background:#0f6; color:#000; border:none; border-radius:3px; cursor:pointer; font-weight:bold;">Send</button>
                        </div>
                    </div>
                    
                    <!-- Tools Tab -->
                    <div class="tab-content" id="tab-tools" data-tab="tools">
                        <div class="tools-section">
                            <h4>Quick Tools</h4>
                            <button class="tool-btn" onclick="window.OmniUnifiedPanel.toggleSpectator()">🛸 Spectator Mode</button>
                            <button class="tool-btn" onclick="window.togglePipboy && window.togglePipboy()">📋 Pipboy (I)</button>
                            <button class="tool-btn" onclick="window.toggleEditor && window.toggleEditor()">✏️ Editor (F2)</button>
                            <button class="tool-btn" onclick="window.takeScreenshot && window.takeScreenshot()">📸 Screenshot</button>
                        </div>
                        <div class="tools-section">
                            <h4>Debug Info</h4>
                            <div style="font-size:11px; background:rgba(0,0,0,0.3); padding:8px; border-radius:3px; color:#aaa;">
                                <div id="debug-fps">FPS: --</div>
                                <div id="debug-objects">Objects: --</div>
                                <div id="debug-network">Network: Connected</div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add styles
        this.injectStyles();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Update stats loop
        this.startUpdateLoop();
        
        console.log('[Unified Panel] Initialized');
    },
    
    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #omni-unified-panel {
                position: fixed;
                right: 10px;
                bottom: 10px;
                width: 400px;
                max-height: 600px;
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #0f6;
                border-radius: 8px;
                color: #0f6;
                font-family: monospace;
                font-size: 12px;
                z-index: 990;
                display: flex;
                flex-direction: column;
                box-shadow: 0 0 20px rgba(0, 255, 102, 0.3);
            }
            
            .unified-panel-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .unified-header {
                background: linear-gradient(135deg, #0a3a0a 0%, #051a05 100%);
                padding: 12px 15px;
                border-bottom: 1px solid #0f6;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .unified-title {
                font-weight: bold;
                font-size: 14px;
                color: #0f6;
                text-shadow: 0 0 10px rgba(0, 255, 102, 0.5);
            }
            
            .unified-controls {
                display: flex;
                gap: 5px;
            }
            
            .panel-btn {
                background: rgba(0, 255, 102, 0.1);
                border: 1px solid #0f6;
                color: #0f6;
                width: 24px;
                height: 24px;
                border-radius: 3px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .panel-btn:hover {
                background: #0f6;
                color: #000;
            }
            
            .unified-tabs {
                display: flex;
                gap: 2px;
                padding: 8px;
                background: rgba(0, 0, 0, 0.5);
                border-bottom: 1px solid #0f6;
            }
            
            .tab-btn {
                flex: 1;
                padding: 6px 8px;
                background: rgba(0, 255, 102, 0.05);
                border: 1px solid rgba(0, 255, 102, 0.3);
                color: #0f6;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.2s;
                font-family: monospace;
            }
            
            .tab-btn:hover {
                background: rgba(0, 255, 102, 0.15);
            }
            
            .tab-btn.active {
                background: linear-gradient(135deg, #0f6 0%, #0d0 100%);
                color: #000;
                border-color: #0f6;
            }
            
            .unified-content {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
            }
            
            .tab-content {
                display: none;
            }
            
            .tab-content.active {
                display: block;
            }
            
            /* Status Tab */
            .status-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .status-item {
                background: rgba(0, 255, 102, 0.05);
                border: 1px solid rgba(0, 255, 102, 0.2);
                padding: 8px;
                border-radius: 4px;
            }
            
            .status-label {
                display: block;
                font-size: 11px;
                color: #0f6;
                font-weight: bold;
                margin-bottom: 4px;
            }
            
            .status-bar {
                position: relative;
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #0f6;
                border-radius: 2px;
                overflow: hidden;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #000;
                font-weight: bold;
            }
            
            .bar {
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                transition: width 0.3s;
            }
            
            .bar.green { background: linear-gradient(90deg, #00ff00, #00dd00); }
            .bar.yellow { background: linear-gradient(90deg, #ffff00, #ffdd00); }
            .bar.red { background: linear-gradient(90deg, #ff0000, #dd0000); }
            
            /* Controls Tab */
            .controls-section {
                margin-bottom: 15px;
            }
            
            .controls-section h4 {
                margin: 0 0 10px 0;
                color: #0f6;
                font-size: 12px;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
            }
            
            .control-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 5px;
            }
            
            .quick-action-btn {
                padding: 6px 8px;
                background: rgba(0, 255, 102, 0.1);
                border: 1px solid #0f6;
                color: #0f6;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
                font-weight: bold;
                transition: all 0.2s;
                font-family: monospace;
            }
            
            .quick-action-btn:hover {
                background: rgba(0, 255, 102, 0.3);
                box-shadow: 0 0 10px rgba(0, 255, 102, 0.3);
            }
            
            /* AI Tab */
            .ai-control-panel {
                background: rgba(0, 255, 102, 0.05);
                padding: 12px;
                border: 1px solid rgba(0, 255, 102, 0.2);
                border-radius: 4px;
            }
            
            .status-indicator {
                padding: 8px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 3px;
                font-size: 11px;
            }
            
            .ai-btn {
                display: block;
                width: 100%;
                padding: 8px;
                background: rgba(0, 255, 102, 0.1);
                border: 1px solid #0f6;
                color: #0f6;
                border-radius: 3px;
                cursor: pointer;
                font-weight: bold;
                font-family: monospace;
                font-size: 11px;
                transition: all 0.2s;
            }
            
            .ai-btn:hover {
                background: rgba(0, 255, 102, 0.2);
                box-shadow: 0 0 10px rgba(0, 255, 102, 0.2);
            }
            
            .activate-btn { color: #0f0; border-color: #0f0; }
            .activate-btn:hover { background: rgba(0, 255, 0, 0.15); }
            
            .deactivate-btn { color: #f00; border-color: #f00; }
            .deactivate-btn:hover { background: rgba(255, 0, 0, 0.15); }
            
            /* Tools Tab */
            .tools-section {
                margin-bottom: 15px;
            }
            
            .tools-section h4 {
                margin: 0 0 10px 0;
                color: #0f6;
                font-size: 12px;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
            }
            
            .tool-btn {
                display: block;
                width: 100%;
                padding: 8px;
                background: rgba(0, 255, 102, 0.1);
                border: 1px solid #0f6;
                color: #0f6;
                border-radius: 3px;
                cursor: pointer;
                font-weight: bold;
                font-family: monospace;
                font-size: 11px;
                margin-bottom: 5px;
                transition: all 0.2s;
            }
            
            .tool-btn:hover {
                background: #0f6;
                color: #000;
                box-shadow: 0 0 15px rgba(0, 255, 102, 0.5);
            }
            
            /* Scrollbar */
            #omni-unified-panel::-webkit-scrollbar {
                width: 8px;
            }
            
            #omni-unified-panel::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            #omni-unified-panel::-webkit-scrollbar-thumb {
                background: rgba(0, 255, 102, 0.5);
                border-radius: 4px;
            }
            
            #omni-unified-panel::-webkit-scrollbar-thumb:hover {
                background: rgba(0, 255, 102, 0.7);
            }
        `;
        document.head.appendChild(style);
    },
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // Panel controls
        document.getElementById('panel-close-btn').addEventListener('click', () => {
            document.getElementById('omni-unified-panel').style.display = 'none';
        });
        
        document.getElementById('panel-collapse-btn').addEventListener('click', () => {
            const content = document.querySelector('.unified-content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        });
        
        // AI buttons
        document.getElementById('ai-activate-btn').addEventListener('click', () => {
            if (window.AIPlayerAPI) {
                window.AIPlayerAPI.activateAI();
                this.updateAIStatus();
            }
        });
        
        document.getElementById('ai-deactivate-btn').addEventListener('click', () => {
            if (window.AIPlayerAPI) {
                window.AIPlayerAPI.deactivateAI();
                this.updateAIStatus();
            }
        });
        
        document.getElementById('ai-move-fwd-btn').addEventListener('click', () => {
            if (window.AIPlayerAPI) {
                window.AIPlayerAPI.setInput('moveForward', true);
                setTimeout(() => window.AIPlayerAPI.setInput('moveForward', false), 100);
            }
        });
        
        document.getElementById('ai-shoot-btn').addEventListener('click', () => {
            if (window.AIPlayerAPI) {
                window.AIPlayerAPI.shoot();
            }
        });
        
        // Chat
        document.getElementById('chat-send-btn').addEventListener('click', () => {
            const input = document.getElementById('chat-input');
            if (input.value.trim()) {
                this.addChatMessage('YOU', input.value);
                input.value = '';
            }
        });
    },
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
    },
    
    updateAIStatus() {
        if (window.AIPlayerAPI && window.AIPlayerAPI.isAIControlling()) {
            document.getElementById('ai-control-status').style.background = '#0f0';
            document.getElementById('ai-status-text').textContent = 'AI ACTIVE';
        } else {
            document.getElementById('ai-control-status').style.background = '#f00';
            document.getElementById('ai-status-text').textContent = 'AI Not Active';
        }
    },
    
    addChatMessage(sender, text) {
        const chatBox = document.getElementById('chat-box');
        const msg = document.createElement('div');
        msg.style.cssText = 'padding:5px; border-bottom:1px solid #333; font-size:11px;';
        msg.innerHTML = `<span style="color:#0f6; font-weight:bold;">${sender}:</span> ${text}`;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    },
    
    startUpdateLoop() {
        setInterval(() => {
            // Update status tab
            if (player) {
                document.getElementById('status-hp-text').textContent = `${player.health.toFixed(0)}/100`;
                document.getElementById('status-hp-bar').style.width = player.health + '%';
                
                document.getElementById('status-stamina-text').textContent = `${player.stamina.toFixed(0)}%`;
                document.getElementById('status-stamina-bar').style.width = player.stamina + '%';
                
                document.getElementById('status-ammo').textContent = `${player.ammo} / ${player.reserveAmmo}`;
                
                if (cameraRig) {
                    document.getElementById('status-pos').textContent = 
                        `X: ${cameraRig.position.x.toFixed(2)} | Y: ${cameraRig.position.y.toFixed(2)} | Z: ${cameraRig.position.z.toFixed(2)}`;
                }
            }
            
            // Update AI status
            this.updateAIStatus();
        }, 100);
    },
    
    toggleSpectator() {
        if (window.spectatorMode) {
            spectatorMode = !spectatorMode;
            alert('Spectator mode: ' + (spectatorMode ? 'ON' : 'OFF'));
        }
    }
};

// Initialize when game is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => window.OmniUnifiedPanel.init(), 1000);
    });
} else {
    setTimeout(() => window.OmniUnifiedPanel.init(), 1000);
}

console.log('[Unified Panel] Script loaded');
