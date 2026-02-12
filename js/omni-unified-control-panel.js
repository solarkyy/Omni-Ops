/**
 * OMNI-OPS Unified Control Panel
 * Consolidates all UI controls into one clean tabbed interface
 */

window.OmniUnifiedPanel = {
    visible: false,
    currentTab: 'status',
    
    init() {
        // Create panel HTML
        const panel = document.createElement('div');
        panel.id = 'omni-unified-panel';
        panel.style.cssText = `
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
        `;
        
        panel.innerHTML = `
            <div style="display:flex;flex-direction:column;height:100%;">
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#0a3a0a,#051a05);padding:12px 15px;border-bottom:1px solid #0f6;display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:bold;font-size:14px;color:#0f6;text-shadow:0 0 10px rgba(0,255,102,0.5);">⚡ OMNI-OPS CONTROL</div>
                    <div style="display:flex;gap:5px;">
                        <button id="panel-minimize" style="background:rgba(0,255,102,0.1);border:1px solid #0f6;color:#0f6;width:24px;height:24px;border-radius:3px;cursor:pointer;font-weight:bold;">−</button>
                        <button id="panel-close" style="background:rgba(0,255,102,0.1);border:1px solid #0f6;color:#0f6;width:24px;height:24px;border-radius:3px;cursor:pointer;font-weight:bold;">✕</button>
                    </div>
                </div>
                
                <!-- Tabs -->
                <div style="display:flex;gap:2px;padding:8px;background:rgba(0,0,0,0.5);border-bottom:1px solid #0f6;">
                    <button class="omni-tab active" data-tab="status">📊 Status</button>
                    <button class="omni-tab" data-tab="controls">🎮 Controls</button>
                    <button class="omni-tab" data-tab="ai">🤖 AI</button>
                    <button class="omni-tab" data-tab="tools">🔧 Tools</button>
                </div>
                
                <!-- Content -->
                <div id="panel-content" style="flex:1;overflow-y:auto;padding:12px;">
                    <!-- Status Tab -->
                    <div class="omni-tab-content active" data-tab="status">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                            <div style="background:rgba(0,255,102,0.05);border:1px solid rgba(0,255,102,0.2);padding:8px;border-radius:4px;">
                                <div style="font-size:11px;color:#0f6;font-weight:bold;margin-bottom:4px;">👤 Health</div>
                                <div id="panel-hp">100/100</div>
                            </div>
                            <div style="background:rgba(0,255,102,0.05);border:1px solid rgba(0,255,102,0.2);padding:8px;border-radius:4px;">
                                <div style="font-size:11px;color:#0f6;font-weight:bold;margin-bottom:4px;">⚡ Stamina</div>
                                <div id="panel-stamina">100%</div>
                            </div>
                            <div style="background:rgba(0,255,102,0.05);border:1px solid rgba(0,255,102,0.2);padding:8px;border-radius:4px;">
                                <div style="font-size:11px;color:#0f6;font-weight:bold;margin-bottom:4px;">🔫 Ammo</div>
                                <div id="panel-ammo">30/90</div>
                            </div>
                            <div style="background:rgba(0,255,102,0.05);border:1px solid rgba(0,255,102,0.2);padding:8px;border-radius:4px;">
                                <div style="font-size:11px;color:#0f6;font-weight:bold;margin-bottom:4px;">📍 Position</div>
                                <div id="panel-pos" style="font-size:10px;">0, 0, 0</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Controls Tab -->
                    <div class="omni-tab-content" data-tab="controls" style="display:none;">
                        <h4 style="margin:0 0 10px;color:#0f6;">Movement Commands</h4>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:15px;">
                            <button class="panel-btn" onclick="window.OmniUnifiedPanel.testMove('forward')">▲ Forward</button>
                            <button class="panel-btn" onclick="window.OmniUnifiedPanel.testMove('backward')">▼ Back</button>
                            <button class="panel-btn" onclick="window.OmniUnifiedPanel.testMove('left')">◀ Left</button>
                            <button class="panel-btn" onclick="window.OmniUnifiedPanel.testMove('right')">▶ Right</button>
                        </div>
                        <h4 style="margin:15px 0 10px;color:#0f6;">Quick Actions</h4>
                        <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.OmniUnifiedPanel.quickAction('jump')">Jump</button>
                        <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.OmniUnifiedPanel.quickAction('reload')">Reload</button>
                        <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.OmniUnifiedPanel.quickAction('shoot')">Shoot</button>
                    </div>
                    
                    <!-- AI Tab -->
                    <div class="omni-tab-content" data-tab="ai" style="display:none;">
                        <div style="background:rgba(0,255,102,0.05);padding:12px;border:1px solid rgba(0,255,102,0.2);border-radius:4px;">
                            <h4 style="margin:0 0 10px;color:#0f6;">AI Status</h4>
                            <div style="padding:8px;background:rgba(0,0,0,0.3);border:1px solid #333;border-radius:3px;font-size:11px;margin-bottom:12px;">
                                <span id="ai-status-dot" style="display:inline-block;width:12px;height:12px;background:#f00;border-radius:50%;margin-right:8px;"></span>
                                <span id="ai-status-text">AI Not Active</span>
                            </div>
                            <button class="panel-btn" style="width:48%;margin:2px;background:rgba(0,255,0,0.1);border-color:#0f0;color:#0f0;" onclick="window.OmniUnifiedPanel.toggleAI(true)">▶️ Activate</button>
                            <button class="panel-btn" style="width:48%;margin:2px;background:rgba(255,0,0,0.1);border-color:#f00;color:#f00;" onclick="window.OmniUnifiedPanel.toggleAI(false)">⏹️ Stop</button>
                            <h4 style="margin:15px 0 10px;color:#0f6;">AI Controls</h4>
                            <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.OmniUnifiedPanel.aiCommand('forward')">Move Forward</button>
                            <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.OmniUnifiedPanel.aiCommand('patrol')">Auto Patrol</button>
                            <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.OmniUnifiedPanel.aiCommand('engage')">Auto Engage</button>
                        </div>
                    </div>
                    
                    <!-- Tools Tab -->
                    <div class="omni-tab-content" data-tab="tools" style="display:none;">
                        <h4 style="margin:0 0 10px;color:#0f6;">Game Tools</h4>
                        <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.togglePipboy && window.togglePipboy()">📋 Pipboy (I)</button>
                        <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.toggleEditor && window.toggleEditor()">✏️ Editor (F2)</button>
                        <button class="panel-btn" style="width:100%;margin:5px 0;" onclick="window.spectatorMode && (spectatorMode = !spectatorMode)">🛸 Spectator</button>
                        <h4 style="margin:15px 0 10px;color:#0f6;">Debug Info</h4>
                        <div style="font-size:11px;background:rgba(0,0,0,0.3);padding:8px;border-radius:3px;color:#aaa;">
                            <div>FPS: <span id="debug-fps">--</span></div>
                            <div>Objects: <span id="debug-objects">--</span></div>
                            <div>Mode: <span id="debug-mode">--</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Add tab styles
        const style = document.createElement('style');
        style.textContent = `
            .omni-tab {
                flex: 1;
                padding: 6px 8px;
                background: rgba(0,255,102,0.05);
                border: 1px solid rgba(0,255,102,0.3);
                color: #0f6;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.2s;
                font-family: monospace;
            }
            .omni-tab:hover {
                background: rgba(0,255,102,0.15);
            }
            .omni-tab.active {
                background: linear-gradient(135deg,#0f6,#0d0);
                color: #000;
            }
            .panel-btn {
                padding: 8px;
                background: rgba(0,255,102,0.1);
                border: 1px solid #0f6;
                color: #0f6;
                border-radius: 3px;
                cursor: pointer;
                font-weight: bold;
                font-family: monospace;
                font-size: 11px;
                transition: all 0.2s;
            }
            .panel-btn:hover {
                background: rgba(0,255,102,0.3);
                box-shadow: 0 0 10px rgba(0,255,102,0.3);
            }
        `;
        document.head.appendChild(style);
        
        // Setup event listeners
        this.setupEvents();
        this.startUpdateLoop();
        
        console.log('[Unified Panel] ✓ Initialized');
    },
    
    setupEvents() {
        // Tab switching
        document.querySelectorAll('.omni-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                document.querySelectorAll('.omni-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.omni-tab-content').forEach(c => c.style.display = 'none');
                e.target.classList.add('active');
                document.querySelector(`.omni-tab-content[data-tab="${tab}"]`).style.display = 'block';
            });
        });
        
        // Close/minimize
        document.getElementById('panel-close').onclick = () => {
            document.getElementById('omni-unified-panel').style.display = 'none';
        };
        document.getElementById('panel-minimize').onclick = () => {
            const content = document.getElementById('panel-content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        };
    },
    
    waitForAPI(maxWait = 30000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (typeof window.AIPlayerAPI !== 'undefined') {
                    clearInterval(checkInterval);
                    console.log('[Unified Panel] ✓ AIPlayerAPI is now available');
                    resolve(true);
                } else if (Date.now() - startTime > maxWait) {
                    clearInterval(checkInterval);
                    console.warn('[Unified Panel] ⚠️ AIPlayerAPI timeout after', maxWait, 'ms');
                    resolve(false);
                }
            }, 100);
        });
    },
    
    startUpdateLoop() {
        setInterval(() => {
            if (typeof player !== 'undefined') {
                document.getElementById('panel-hp').textContent = `${Math.floor(player.health)}/100`;
                document.getElementById('panel-stamina').textContent = `${Math.floor(player.stamina)}%`;
                document.getElementById('panel-ammo').textContent = `${player.ammo}/${player.reserveAmmo}`;
            }
            if (typeof cameraRig !== 'undefined') {
                document.getElementById('panel-pos').textContent = 
                    `${cameraRig.position.x.toFixed(1)}, ${cameraRig.position.y.toFixed(1)}, ${cameraRig.position.z.toFixed(1)}`;
            }
            if (typeof gameMode !== 'undefined') {
                document.getElementById('debug-mode').textContent = gameMode;
            }
            
            // Update AI status
            if (window.AIPlayerAPI && window.AIPlayerAPI.isAIControlling()) {
                document.getElementById('ai-status-dot').style.background = '#0f0';
                document.getElementById('ai-status-text').textContent = 'AI ACTIVE';
            } else {
                document.getElementById('ai-status-dot').style.background = '#f00';
                document.getElementById('ai-status-text').textContent = 'AI Not Active';
            }
        }, 100);
    },
    
    testMove(direction) {
        if (!window.AIPlayerAPI) {
            console.error('[Panel] AIPlayerAPI not available! Waiting for initialization...');
            this.showErrorMessage('Waiting for AI API to initialize...');
            this.waitForAPI().then((available) => {
                if (available) {
                    this.testMove(direction);
                } else {
                    this.showErrorMessage('AI API failed to initialize. Check console.');
                }
            });
            return;
        }
        
        const actions = {
            forward: 'moveForward',
            backward: 'moveBackward',
            left: 'moveLeft',
            right: 'moveRight'
        };
        
        const action = actions[direction];
        window.AIPlayerAPI.setInput(action, true);
        setTimeout(() => window.AIPlayerAPI.setInput(action, false), 500);
        console.log(`[Panel] Moved ${direction}`);
    },
    
    quickAction(action) {
        if (!window.AIPlayerAPI) {
            console.error('[Panel] AIPlayerAPI not available! Waiting for initialization...');
            this.showErrorMessage('Waiting for AI API to initialize...');
            this.waitForAPI().then((available) => {
                if (available) {
                    this.quickAction(action);
                } else {
                    this.showErrorMessage('AI API failed to initialize. Check console.');
                }
            });
            return;
        }
        
        if (action === 'shoot') {
            window.AIPlayerAPI.shoot();
        } else {
            window.AIPlayerAPI.pressKey(action);
        }
        console.log(`[Panel] Action: ${action}`);
    },
    
    toggleAI(activate) {
        if (!window.AIPlayerAPI) {
            console.error('[Panel] AIPlayerAPI not available! Waiting for initialization...');
            this.showErrorMessage('Waiting for AI API to initialize...');
            this.waitForAPI().then((available) => {
                if (available) {
                    this.toggleAI(activate);
                } else {
                    this.showErrorMessage('AI API failed to initialize. Check console.');
                }
            });
            return;
        }
        
        if (activate) {
            window.AIPlayerAPI.activateAI();
            console.log('[Panel] AI activated');
            this.showSuccessMessage('AI Activated');
        } else {
            window.AIPlayerAPI.deactivateAI();
            console.log('[Panel] AI deactivated');
            this.showSuccessMessage('AI Deactivated');
        }
    },
    
    aiCommand(cmd) {
        if (!window.AIPlayerAPI) {
            console.error('[Panel] AIPlayerAPI not available! Waiting for initialization...');
            this.showErrorMessage('Waiting for AI API to initialize...');
            this.waitForAPI().then((available) => {
                if (available) {
                    this.aiCommand(cmd);
                } else {
                    this.showErrorMessage('AI API failed to initialize. Check console.');
                }
            });
            return;
        }
        
        console.log(`[Panel] AI Command: ${cmd}`);
        alert(`AI Command "${cmd}" - This would trigger autonomous behavior`);
    },
    
    showErrorMessage(msg) {
        const panel = document.getElementById('omni-unified-panel');
        if (!panel) return;
        
        // Create temporary message
        const msgEl = document.createElement('div');
        msgEl.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1001;
            animation: fadeInOut 3s ease-in-out;
        `;
        msgEl.textContent = msg;
        panel.parentElement.appendChild(msgEl);
        
        setTimeout(() => msgEl.remove(), 3000);
    },
    
    showSuccessMessage(msg) {
        const panel = document.getElementById('omni-unified-panel');
        if (!panel) return;
        
        // Create temporary message
        const msgEl = document.createElement('div');
        msgEl.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 255, 0, 0.9);
            color: black;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1001;
            animation: fadeInOut 3s ease-in-out;
            font-weight: bold;
        `;
        msgEl.textContent = msg;
        panel.parentElement.appendChild(msgEl);
        
        setTimeout(() => msgEl.remove(), 3000);
    }
};

// Auto-initialize when game loads
setTimeout(() => {
    if (typeof THREE !== 'undefined') {
        window.OmniUnifiedPanel.init();
    }
}, 2000);

console.log('[Unified Panel] Script loaded');
