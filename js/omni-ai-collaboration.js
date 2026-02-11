// OMNI-OPS AI COLLABORATION MODULE
// Enables AI-to-AI communication for autonomous problem solving
(function() {
    'use strict';
    console.log('[AI Collaboration] Initializing...');

const AICollaboration = {
    httpUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8081',
    ws: null,
    connected: false,
    autonomousMode: false,
    autoFixEnabled: false,
    reconnectInterval: null,
    checkingStatus: false,
    panelOpen: false,

    init: function() {
        this.connectWebSocket();
        this.startDiagnosticReporting();
        this.createCollaborationUI();
        console.log('[AI Collaboration] Initialized');
    },

    checkBridgeStatus: async function() {
        try {
            const response = await fetch(`${this.httpUrl}/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    },

    async showStartInstructions() {
        const modal = document.createElement('div');
        modal.id = 'ai-collab-start-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
        `;

        modal.innerHTML = `
            <div style="
                background: #1a0a1a;
                border: 3px solid #f0f;
                border-radius: 10px;
                padding: 30px;
                max-width: 500px;
                box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
            ">
                <div style="font-size: 24px; color: #f0f; font-weight: bold; margin-bottom: 20px; text-align: center;">
                    🤝 Start AI Collaboration Bridge
                </div>

                <div style="color: #f0f; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    The AI Collaboration Bridge is not running yet.
                    <br><br>
                    <strong style="color: #0f0;">Quick Start (if VS Code is open):</strong>
                    <br>
                    Click the button below to start the bridge automatically!
                </div>

                <button id="btn-start-vscode" style="
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #0a3a0a 0%, #0a5a0a 100%);
                    color: #0f0;
                    border: 3px solid #0f0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    margin-bottom: 15px;
                    box-shadow: 0 0 15px rgba(0,255,0,0.3);
                    transition: all 0.2s;
                ">⚡ START IN VS CODE</button>

                <div style="color: #888; font-size: 12px; text-align: center; margin: 15px 0;">
                    — OR —
                </div>

                <div style="color: #aaa; font-size: 12px; line-height: 1.5; margin-bottom: 15px;">
                    <strong>Manual Start:</strong><br>
                    Double-click: <code style="background: #000; padding: 2px 5px; color: #0f0;">START_AI_COLLABORATION.bat</code>
                </div>

                <div style="display: flex; gap: 10px;">
                    <button id="btn-check-again" style="
                        flex: 1;
                        padding: 12px;
                        background: #0a3a0a;
                        color: #0f0;
                        border: 2px solid #0f0;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                        font-family: 'Courier New', monospace;
                    ">🔄 Check Again</button>

                    <button id="btn-cancel-start" style="
                        flex: 1;
                        padding: 12px;
                        background: #3a0a0a;
                        color: #f44;
                        border: 2px solid #f44;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                        font-family: 'Courier New', monospace;
                    ">✕ Cancel</button>
                </div>

                <div id="status-message" style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 5px;
                    text-align: center;
                    color: #ff0;
                    font-size: 12px;
                    display: none;
                "></div>
            </div>
        `;

        document.body.appendChild(modal);

        const startVSCodeBtn = document.getElementById('btn-start-vscode');
        const checkAgainBtn = document.getElementById('btn-check-again');
        const cancelBtn = document.getElementById('btn-cancel-start');
        const statusMsg = document.getElementById('status-message');

        // Add hover effect for VS Code button
        startVSCodeBtn.onmouseover = () => {
            startVSCodeBtn.style.background = 'linear-gradient(135deg, #0f0 0%, #0a0 100%)';
            startVSCodeBtn.style.color = '#000';
            startVSCodeBtn.style.boxShadow = '0 0 25px rgba(0,255,0,0.6)';
        };
        startVSCodeBtn.onmouseout = () => {
            startVSCodeBtn.style.background = 'linear-gradient(135deg, #0a3a0a 0%, #0a5a0a 100%)';
            startVSCodeBtn.style.color = '#0f0';
            startVSCodeBtn.style.boxShadow = '0 0 15px rgba(0,255,0,0.3)';
        };

        // Start bridge in VS Code
        startVSCodeBtn.onclick = async () => {
            statusMsg.style.display = 'block';
            statusMsg.textContent = '⚡ Opening VS Code task...';
            statusMsg.style.color = '#0f0';

            // Trigger VS Code task
            const workspaceFolder = 'c:/Users/kjoly/OneDrive/Desktop/Omni Ops';
            const taskUrl = `vscode://file/${workspaceFolder}?task=Start AI Collaboration Bridge`;
            window.location.href = taskUrl;

            // Wait a moment then start checking
            setTimeout(async () => {
                statusMsg.textContent = '⏳ Waiting for bridge to start...';
                statusMsg.style.color = '#ff0';

                // Check every 2 seconds for 30 seconds
                let attempts = 0;
                const maxAttempts = 15;

                const checkInterval = setInterval(async () => {
                    attempts++;
                    const isRunning = await this.checkBridgeStatus();

                    if (isRunning) {
                        clearInterval(checkInterval);
                        statusMsg.textContent = '✓ Bridge detected! Connecting...';
                        statusMsg.style.color = '#0f0';

                        setTimeout(() => {
                            modal.remove();
                            this.connectWebSocket();
                            this.togglePanel();
                        }, 1000);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        statusMsg.textContent = '⏱️ Taking longer than expected. Check VS Code terminal or use manual start.';
                        statusMsg.style.color = '#f80';
                    } else {
                        statusMsg.textContent = `⏳ Waiting... (${attempts * 2}s)`;
                    }
                }, 2000);
            }, 2000);
        };

        checkAgainBtn.onclick = async () => {
            statusMsg.style.display = 'block';
            statusMsg.textContent = '🔍 Checking for bridge...';
            statusMsg.style.color = '#ff0';

            const isRunning = await this.checkBridgeStatus();

            if (isRunning) {
                statusMsg.textContent = '✓ Bridge detected! Connecting...';
                statusMsg.style.color = '#0f0';

                setTimeout(() => {
                    modal.remove();
                    this.connectWebSocket();
                    this.togglePanel();
                }, 1000);
            } else {
                statusMsg.textContent = '✗ Bridge not detected. Please start START_AI_COLLABORATION.bat';
                statusMsg.style.color = '#f44';
            }
        };

        cancelBtn.onclick = () => {
            modal.remove();
        };
    },

    connectWebSocket: function() {
        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('[AI Collaboration] WebSocket connected');
                this.connected = true;
                this.updateConnectionStatus();
                this.sendMessage({
                    type: 'connection',
                    client: 'in_game_ai',
                    timestamp: new Date().toISOString()
                });
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleExternalMessage(data);
            };

            this.ws.onclose = () => {
                console.log('[AI Collaboration] WebSocket disconnected');
                this.connected = false;
                this.updateConnectionStatus();
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[AI Collaboration] WebSocket error:', error);
            };
        } catch (e) {
            console.error('[AI Collaboration] Failed to connect:', e);
            this.scheduleReconnect();
        }
    },

    scheduleReconnect: function() {
        if (this.reconnectInterval) return;

        this.reconnectInterval = setInterval(() => {
            if (!this.connected) {
                console.log('[AI Collaboration] Attempting to reconnect...');
                this.connectWebSocket();
            } else {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
            }
        }, 5000);
    },

    sendMessage: function(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        }
        return false;
    },

    handleExternalMessage: function(data) {
        const type = data.type;

        if (type === 'diagnostic_response') {
            this.displayDiagnostics(data.diagnostics);
        } else if (type === 'command_result') {
            this.logCollaboration(`Command '${data.command}' result: ${data.result.message}`, 'external');
        } else if (type === 'fix_result') {
            this.logCollaboration(
                `Fix ${data.success ? 'applied successfully' : 'failed'}: ${data.message}`,
                'external'
            );
        } else if (type === 'issues_detected') {
            this.handleIssuesDetected(data.issues);
        }
    },

    handleIssuesDetected: function(issues) {
        if (issues.errors && issues.errors.length > 0) {
            issues.errors.forEach(error => {
                this.logCollaboration(`⚠️ Error detected: ${error.message}`, 'system');
            });
        }

        if (issues.warnings && issues.warnings.length > 0) {
            issues.warnings.forEach(warning => {
                this.logCollaboration(`⚡ Warning: ${warning.message}`, 'system');
            });
        }
    },

    startDiagnosticReporting: function() {
        // Send game state updates every 2 seconds
        setInterval(() => {
            if (!this.connected || !window.AIPlayerAPI) return;

            const state = window.AIPlayerAPI.getGameState();
            if (!state) return;

            fetch(`${this.httpUrl}/update_game_state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: state })
            }).catch(e => {
                // Silently fail if bridge isn't running
            });
        }, 2000);
    },

    requestExternalAnalysis: function(issue) {
        if (!this.connected) {
            this.logCollaboration('Cannot request analysis - not connected to external AI', 'system');
            return;
        }

        this.sendMessage({
            type: 'analysis_request',
            issue: issue,
            context: window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : null,
            timestamp: new Date().toISOString()
        });

        this.logCollaboration(`Requested external AI analysis for: ${issue}`, 'in_game');
    },

    toggleAutonomousMode: function() {
        this.autonomousMode = !this.autonomousMode;

        fetch(`${this.httpUrl}/toggle_autonomous`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: this.autonomousMode })
        }).then(r => r.json())
          .then(data => {
              this.autonomousMode = data.autonomous_mode;
              this.updateConnectionStatus();
              this.logCollaboration(
                  `Autonomous mode ${this.autonomousMode ? 'enabled' : 'disabled'}`,
                  'system'
              );
          })
          .catch(e => console.error('Failed to toggle autonomous mode:', e));
    },

    toggleAutoFix: function() {
        this.autoFixEnabled = !this.autoFixEnabled;

        fetch(`${this.httpUrl}/toggle_auto_fix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: this.autoFixEnabled })
        }).then(r => r.json())
          .then(data => {
              this.autoFixEnabled = data.auto_fix_enabled;
              this.updateConnectionStatus();
              this.logCollaboration(
                  `Auto-fix ${this.autoFixEnabled ? 'enabled' : 'disabled'}`,
                  'system'
              );
          })
          .catch(e => console.error('Failed to toggle auto-fix:', e));
    },

    openChatInterface: function() {
        // Open chat interface via VS Code task
        const workspaceFolder = 'c:/Users/kjoly/OneDrive/Desktop/Omni Ops';
        const taskUrl = `vscode://file/${workspaceFolder}?task=Open AI Chat Interface`;

        // Try to open via vscode:// protocol
        window.location.href = taskUrl;

        // Show helpful message
        console.log('[AI Collab] Opening AI Chat Interface via VS Code');
    },

    showChatStartInstructions: async function() {
        const modal = document.createElement('div');
        modal.id = 'ai-chat-start-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
        `;

        modal.innerHTML = `
            <div style="
                background: #1a0a1a;
                border: 3px solid #0af;
                border-radius: 10px;
                padding: 30px;
                max-width: 550px;
                box-shadow: 0 0 30px rgba(0, 170, 255, 0.5);
            ">
                <div style="font-size: 24px; color: #0af; font-weight: bold; margin-bottom: 20px; text-align: center;">
                    💬 AI Collaboration Chat
                </div>

                <div style="color: #fff; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    The bridge isn't running yet. Let's start the complete AI chat system!
                    <br><br>
                    <strong style="color: #0f6;">When you click below:</strong>
                    <br><br>
                    ✅ Bridge starts automatically<br>
                    ✅ Chat interface opens in browser<br>
                    ✅ All three of you can talk together!
                    <br><br>
                    <div style="background: rgba(0,170,255,0.1); padding: 12px; border-left: 3px solid #0af; margin: 15px 0;">
                        <strong style="color: #0af;">Who's in the chat:</strong><br>
                        👤 <strong>YOU</strong> - The human<br>
                        🎮 <strong>IN-GAME AI</strong> - Asks questions & shares visuals<br>
                        🤖 <strong>EXTERNAL AI (Claude)</strong> - Provides smart answers
                    </div>
                </div>

                <button id="btn-start-chat-system" style="
                    width: 100%;
                    padding: 15px;
                    background: linear-gradient(135deg, #0af 0%, #08d 100%);
                    color: #fff;
                    border: 3px solid #0af;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    margin-bottom: 10px;
                    box-shadow: 0 0 15px rgba(0,170,255,0.3);
                    transition: all 0.2s;
                ">🚀 START CHAT SYSTEM</button>

                <button id="btn-cancel-chat-start" style="
                    width: 100%;
                    padding: 12px;
                    background: #3a0a0a;
                    color: #f44;
                    border: 2px solid #f44;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    font-family: 'Courier New', monospace;
                ">✕ Cancel</button>

                <div id="chat-status-message" style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border-radius: 5px;
                    text-align: center;
                    color: #ff0;
                    font-size: 12px;
                    display: none;
                "></div>
            </div>
        `;

        document.body.appendChild(modal);

        const startBtn = document.getElementById('btn-start-chat-system');
        const cancelBtn = document.getElementById('btn-cancel-chat-start');
        const statusMsg = document.getElementById('chat-status-message');

        // Hover effects
        startBtn.onmouseover = () => {
            startBtn.style.background = 'linear-gradient(135deg, #0cf 0%, #0af 100%)';
            startBtn.style.boxShadow = '0 0 25px rgba(0,170,255,0.6)';
        };
        startBtn.onmouseout = () => {
            startBtn.style.background = 'linear-gradient(135deg, #0af 0%, #08d 100%)';
            startBtn.style.boxShadow = '0 0 15px rgba(0,170,255,0.3)';
        };

        // Start chat system
        startBtn.onclick = async () => {
            statusMsg.style.display = 'block';
            statusMsg.textContent = '🚀 Opening VS Code to start chat system...';
            statusMsg.style.color = '#0af';

            // Trigger VS Code task to start bridge and open chat
            const workspaceFolder = 'c:/Users/kjoly/OneDrive/Desktop/Omni Ops';
            const taskUrl = `vscode://file/${workspaceFolder}?task=Start Complete AI System with Chat`;
            window.location.href = taskUrl;

            statusMsg.textContent = '✅ Chat system starting! Browser will open in a few seconds...';
            statusMsg.style.color = '#0f6';

            // Close modal after delay
            setTimeout(() => {
                modal.remove();
            }, 3000);
        };

        cancelBtn.onclick = () => {
            modal.remove();
        };
    },

    showLauncherInstructions: function() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10003;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Courier New', monospace;
        `;

        modal.innerHTML = `
            <div style="
                background: #1a0a1a;
                border: 3px solid #f90;
                border-radius: 10px;
                padding: 30px;
                max-width: 600px;
                box-shadow: 0 0 30px rgba(255, 153, 0, 0.5);
            ">
                <div style="font-size: 24px; color: #f90; font-weight: bold; margin-bottom: 20px; text-align: center;">
                    🚀 Start Launcher Service
                </div>

                <div style="color: #fff; font-size: 14px; line-height: 1.7; margin-bottom: 20px;">
                    To use the one-click AI chat start, you need to run the launcher service first.
                    <br><br>
                    <div style="background: rgba(255,153,0,0.1); padding: 15px; border-left: 3px solid #f90; margin: 15px 0; border-radius: 5px;">
                        <strong style="color: #f90; font-size: 15px;">🎯 One-Time Setup:</strong><br><br>
                        <strong>1.</strong> Open a new terminal/command prompt<br>
                        <strong>2.</strong> Go to your Omni Ops folder<br>
                        <strong>3.</strong> Run:
                        <div style="background: #000; padding: 10px; margin: 10px 0; border-radius: 5px; font-family: monospace;">
                            <span style="color: #0f0; font-weight: bold;">python ai_launcher_service.py</span>
                        </div>
                        <strong>4.</strong> Leave that terminal open in the background<br>
                        <strong>5.</strong> Click this button again!
                    </div>

                    <div style="background: rgba(0,170,255,0.1); padding: 12px; border-left: 3px solid #0af; margin: 15px 0; border-radius: 5px; font-size: 12px;">
                        <strong style="color: #0af;">💡 How it works:</strong><br>
                        The launcher service runs in the background and listens for the button click.
                        When you click 🤝 AI COLLAB, it automatically starts the bridge and opens the chat!
                    </div>

                    <div style="background: rgba(0,255,102,0.1); padding: 12px; border-left: 3px solid #0f6; margin: 15px 0; border-radius: 5px; font-size: 12px;">
                        <strong style="color: #0f6;">✨ Alternative:</strong><br>
                        If you don't want to run the launcher service, just double-click <strong>START_AI_CHAT.bat</strong> in your Omni Ops folder.
                    </div>
                </div>

                <button id="btn-close-launcher-modal" style="
                    width: 100%;
                    padding: 12px;
                    background: #3a0a0a;
                    color: #f44;
                    border: 2px solid #f44;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    font-family: 'Courier New', monospace;
                ">✕ Got It</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-close-launcher-modal').onclick = () => {
            modal.remove();
        };
    },

    createCollaborationUI: function() {
        // Add collaboration panel button
        const collabButton = document.createElement('button');
        collabButton.id = 'ai-collab-btn';
        collabButton.innerHTML = '🤝 AI COLLAB';
        collabButton.style.cssText = `
            position: fixed;
            top: 90px;
            right: 10px;
            z-index: 600;
            padding: 8px 15px;
            background: #3a0a3a;
            color: #f0f;
            border: 2px solid #f0f;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-family: monospace;
            font-size: 12px;
            transition: all 0.2s;
            box-shadow: 0 0 10px rgba(255,0,255,0.3);
        `;
        collabButton.onmouseover = () => {
            collabButton.style.background = '#f0f';
            collabButton.style.color = '#000';
            collabButton.style.boxShadow = '0 0 20px rgba(255,0,255,0.6)';
        };
        collabButton.onmouseout = () => {
            collabButton.style.background = '#3a0a3a';
            collabButton.style.color = '#f0f';
            collabButton.style.boxShadow = '0 0 10px rgba(255,0,255,0.3)';
        };
        // Smart click handler - opens unified AI panel
        collabButton.onclick = () => {
            if (window.UnifiedAIPanel) {
                window.UnifiedAIPanel.toggle();
            } else {
                alert('AI Collaboration system loading... Try again in a moment.');
            }
        };
        document.body.appendChild(collabButton);

        // Create collaboration panel
        const html = `
            <div id="ai-collab-panel" class="ai-collab-hidden">
                <div class="ai-collab-container">
                    <div class="ai-collab-header">
                        <div class="ai-collab-title">🤝 AI Collaboration Center</div>
                        <div class="connection-status" id="collab-status">
                            <span class="status-dot" id="collab-dot"></span>
                            <span id="collab-status-text">Disconnected</span>
                        </div>
                        <button class="ai-collab-close" onclick="window.AICollaboration.togglePanel()">✕</button>
                    </div>

                    <div class="ai-collab-content">
                        <!-- Controls -->
                        <div class="collab-controls">
                            <button id="btn-autonomous" class="collab-btn" onclick="window.AICollaboration.toggleAutonomousMode()">
                                🤖 Autonomous: <span id="autonomous-status">OFF</span>
                            </button>
                            <button id="btn-autofix" class="collab-btn" onclick="window.AICollaboration.toggleAutoFix()">
                                🔧 Auto-Fix: <span id="autofix-status">OFF</span>
                            </button>
                            <button class="collab-btn" onclick="window.AICollaboration.requestExternalAnalysis('general')">
                                📊 Request Analysis
                            </button>
                        </div>

                        <!-- Collaboration Log -->
                        <div class="collab-log-panel">
                            <div class="panel-subtitle">📜 Collaboration Log</div>
                            <div id="collab-log" class="collab-log"></div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="quick-actions-panel">
                            <div class="panel-subtitle">⚡ Quick Actions</div>
                            <div class="quick-actions-grid">
                                <button class="action-btn" onclick="window.AICollaboration.requestExternalAnalysis('performance')">
                                    Check Performance
                                </button>
                                <button class="action-btn" onclick="window.AICollaboration.requestExternalAnalysis('player_stuck')">
                                    Diagnose Stuck Player
                                </button>
                                <button class="action-btn" onclick="window.AICollaboration.requestExternalAnalysis('spawn_issues')">
                                    Analyze Spawn System
                                </button>
                                <button class="action-btn" onclick="window.AICollaboration.requestExternalAnalysis('ai_behavior')">
                                    Review AI Behavior
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
        this.addCollaborationStyles();
    },

    addCollaborationStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-collab-hidden { display: none !important; }

            #ai-collab-panel {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                width: 400px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.95);
                border: 3px solid #f0f;
                border-radius: 10px;
                z-index: 10002;
                font-family: 'Courier New', monospace;
                color: #f0f;
                box-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
            }

            .ai-collab-container {
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .ai-collab-header {
                background: linear-gradient(to bottom, #f0f, #a0a);
                padding: 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 2px solid #f0f;
            }

            .ai-collab-title {
                font-size: 14px;
                font-weight: bold;
                color: #000;
            }

            .connection-status {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #000;
                font-size: 11px;
                font-weight: bold;
            }

            .status-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: #f00;
                animation: pulse 2s infinite;
            }

            .status-dot.connected { background: #0f0; }
            .status-dot.autonomous { background: #ff0; }

            .ai-collab-close {
                background: #f44;
                color: #fff;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
            }

            .ai-collab-content {
                padding: 12px;
                overflow-y: auto;
                flex: 1;
            }

            .collab-controls {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
                margin-bottom: 12px;
            }

            .collab-btn {
                padding: 10px;
                background: #3a0a3a;
                color: #f0f;
                border: 2px solid #f0f;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                font-size: 11px;
                transition: all 0.2s;
                font-family: 'Courier New', monospace;
            }

            .collab-btn:hover {
                background: #f0f;
                color: #000;
                box-shadow: 0 0 10px #f0f;
            }

            .collab-log-panel, .quick-actions-panel {
                background: rgba(255, 0, 255, 0.05);
                border: 1px solid #f0f;
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 12px;
            }

            .panel-subtitle {
                font-size: 12px;
                font-weight: bold;
                color: #f0f;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255, 0, 255, 0.3);
            }

            .collab-log {
                max-height: 200px;
                overflow-y: auto;
                font-size : 10px;
                line-height: 1.4;
            }

            .collab-log-entry {
                padding: 5px;
                margin-bottom: 4px;
                border-left: 2px solid #f0f;
                border-radius: 2px;
                background: rgba(255, 0, 255, 0.1);
            }

            .collab-log-entry.external {
                border-left-color: #0ff;
                background: rgba(0, 255, 255, 0.1);
            }

            .collab-log-entry.system {
                border-left-color: #ff0;
                background: rgba(255, 255, 0, 0.1);
            }

            .log-time {
                color: #f0f;
                font-size: 9px;
                margin-right: 5px;
            }

            .quick-actions-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            }

            .action-btn {
                padding: 8px;
                background: #1a0a1a;
                color: #f0f;
                border: 1px solid #f0f;
                border-radius: 4px;
                cursor: pointer;
                font-size: 10px;
                transition: all 0.2s;
                font-family: 'Courier New', monospace;
            }

            .action-btn:hover {
                background: #f0f;
                color: #000;
            }
        `;
        document.head.appendChild(style);
    },

    togglePanel: function() {
        const panel = document.getElementById('ai-collab-panel');
        if (panel) {
            panel.classList.toggle('ai-collab-hidden');
        }
    },

    updateConnectionStatus: function() {
        const dot = document.getElementById('collab-dot');
        const statusText = document.getElementById('collab-status-text');
        const autonomousStatus = document.getElementById('autonomous-status');
        const autofixStatus = document.getElementById('autofix-status');

        if (dot) {
            dot.className = 'status-dot';
            if (this.connected) {
                dot.classList.add('connected');
                if (this.autonomousMode) dot.classList.add('autonomous');
            }
        }

        if (statusText) {
            if (this.connected) {
                statusText.textContent = this.autonomousMode ? 'Autonomous' : 'Connected';
            } else {
                statusText.textContent = 'Disconnected';
            }
        }

        if (autonomousStatus) {
            autonomousStatus.textContent = this.autonomousMode ? 'ON' : 'OFF';
        }

        if (autofixStatus) {
            autofixStatus.textContent = this.autoFixEnabled ? 'ON' : 'OFF';
        }
    },

    logCollaboration: function(message, source) {
        const logDiv = document.getElementById('collab-log');
        if (!logDiv) return;

        const entry = document.createElement('div');
        entry.className = `collab-log-entry ${source}`;
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;

        logDiv.insertBefore(entry, logDiv.firstChild);

        // Keep only last 50 entries
        while (logDiv.children.length > 50) {
            logDiv.removeChild(logDiv.lastChild);
        }

        // Also send to HTTP endpoint for external AI visibility
        fetch(`${this.httpUrl}/in_game_message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, source: source })
        }).catch(e => {
            // Silently fail
        });
    },

    displayDiagnostics: function(diagnostics) {
        // Could extend this to show detailed diagnostics
        this.logCollaboration('Received diagnostics from external AI', 'external');
    }
};

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AICollaboration.init());
} else {
    AICollaboration.init();
}

// Expose to window
window.AICollaboration = AICollaboration;

console.log('[AI Collaboration] Module loaded - AI-to-AI communication ready');

})();
