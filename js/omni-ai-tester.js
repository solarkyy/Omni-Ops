// OMNI-OPS AI TESTER & CHAT SYSTEM
// Two-way communication between AI and player with AI control capabilities
(function() {
    'use strict';
    console.log('[AI Tester] Initializing AI control and chat system...');

const AITester = {
    active: false,
    aiControlEnabled: false,
    chatHistory: [],
    serverUrl: 'http://localhost:8080',
    ws: null,

    init: function() {
        console.log('[AI Tester] Creating chat UI...');
        this.createUI();
        this.setupKeys();
        this.connectWebSocket();
    },

    createUI: function() {
        const html = `
            <div id="ai-chat-overlay" style="display:none; position:fixed; top:0; right:0; width:400px; height:100%; background:rgba(0,0,0,0.95); border-left:3px solid #00ff00; z-index:2000; font-family:monospace;">
                <!-- Header -->
                <div style="padding:15px; background:#001100; border-bottom:2px solid #00ff00;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="color:#00ff00; font-size:16px; font-weight:bold;">🤖 AI CONTROL PANEL</div>
                        <button onclick="window.AITester.toggle()" style="background:#00ff00; color:#000; border:none; padding:5px 10px; cursor:pointer; font-weight:bold; border-radius:3px;">✕</button>
                    </div>
                    <div id="ai-connection-status" style="color:#ff0; font-size:11px; margin-top:5px;">⚠ Disconnected</div>
                </div>

                <!-- AI Control Status -->
                <div style="padding:10px; background:#002200; border-bottom:1px solid #00ff00;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="color:#00ff00; font-size:12px;">AI Control:</span>
                        <button id="ai-control-toggle" onclick="window.AITester.toggleAIControl()" style="background:#ff0000; color:#000; border:none; padding:5px 15px; cursor:pointer; font-weight:bold; border-radius:3px;">OFF</button>
                    </div>
                    <div id="ai-current-action" style="color:#0ff; font-size:11px; min-height:20px;">Idle</div>
                </div>

                <!-- Chat Messages -->
                <div id="ai-chat-messages" style="flex:1; overflow-y:auto; padding:10px; height:calc(100vh - 300px); background:#000;">
                    <div style="color:#00ff00; font-size:11px; opacity:0.6; margin-bottom:10px;">
                        💬 Two-way chat with AI enabled<br>
                        🎮 AI can take control and play<br>
                        📸 Screenshots auto-captured<br>
                        Press F5 to toggle this panel
                    </div>
                </div>

                <!-- Chat Input -->
                <div style="padding:10px; background:#001100; border-top:2px solid #00ff00;">
                    <textarea id="ai-chat-input" placeholder="Message to AI..." style="width:100%; height:60px; background:#002200; color:#00ff00; border:1px solid #00ff00; padding:8px; font-family:monospace; font-size:12px; resize:none; border-radius:3px;"></textarea>
                    <div style="display:flex; gap:5px; margin-top:5px;">
                        <button onclick="window.AITester.sendMessage()" style="flex:1; background:#00ff00; color:#000; border:none; padding:8px; cursor:pointer; font-weight:bold; border-radius:3px;">SEND</button>
                        <button onclick="window.AITester.takeScreenshot()" style="background:#0088ff; color:#fff; border:none; padding:8px 15px; cursor:pointer; font-weight:bold; border-radius:3px;">📸</button>
                        <button onclick="window.AITester.clearChat()" style="background:#880000; color:#fff; border:none; padding:8px 15px; cursor:pointer; font-weight:bold; border-radius:3px;">🗑</button>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div style="padding:10px; background:#000; border-top:1px solid #00ff00; display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <button onclick="window.AITester.requestAIAction('explore')" style="background:#004400; color:#00ff00; border:1px solid #00ff00; padding:8px; cursor:pointer; font-size:11px; border-radius:3px;">🗺 Explore</button>
                    <button onclick="window.AITester.requestAIAction('combat')" style="background:#440000; color:#ff0000; border:1px solid #ff0000; padding:8px; cursor:pointer; font-size:11px; border-radius:3px;">⚔ Combat</button>
                    <button onclick="window.AITester.requestAIAction('collect')" style="background:#004444; color:#00ffff; border:1px solid #00ffff; padding:8px; cursor:pointer; font-size:11px; border-radius:3px;">📦 Collect</button>
                    <button onclick="window.AITester.requestAIAction('return')" style="background:#444400; color:#ffff00; border:1px solid #ffff00; padding:8px; cursor:pointer; font-size:11px; border-radius:3px;">🏠 Return</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Setup enter key for chat input
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    },

    setupKeys: function() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F5') {
                e.preventDefault();
                this.toggle();
            }
        });
    },

    toggle: function() {
        this.active = !this.active;
        const overlay = document.getElementById('ai-chat-overlay');
        if (overlay) {
            overlay.style.display = this.active ? 'flex' : 'none';
            overlay.style.flexDirection = 'column';
        }

        if (this.active) {
            this.addSystemMessage('AI Chat Panel Opened - Press F5 to close');
        }
    },

    connectWebSocket: function() {
        try {
            this.ws = new WebSocket('ws://localhost:8080/ai-chat');

            this.ws.onopen = () => {
                console.log('[AI Tester] WebSocket connected');
                this.updateConnectionStatus('✅ Connected', '#00ff00');
                this.addSystemMessage('Connected to AI server');
            };

            this.ws.onclose = () => {
                console.log('[AI Tester] WebSocket disconnected');
                this.updateConnectionStatus('⚠ Disconnected', '#ff0000');
                // Attempt reconnect after 5 seconds
                setTimeout(() => this.connectWebSocket(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error('[AI Tester] WebSocket error:', error);
                this.updateConnectionStatus('❌ Error', '#ff0000');
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleAIMessage(data);
            };
        } catch (err) {
            console.error('[AI Tester] Failed to connect WebSocket:', err);
            this.updateConnectionStatus('⚠ Offline Mode', '#ffaa00');
            this.addSystemMessage('Running in offline mode - Server not available');
        }
    },

    updateConnectionStatus: function(text, color) {
        const status = document.getElementById('ai-connection-status');
        if (status) {
            status.textContent = text;
            status.style.color = color;
        }
    },

    sendMessage: function() {
        const input = document.getElementById('ai-chat-input');
        if (!input || !input.value.trim()) return;

        const message = input.value.trim();
        this.addPlayerMessage(message);

        // Send to AI server if connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'player_message',
                content: message,
                gameState: this.captureGameState()
            }));
        } else {
            // Offline mode - simulate AI response
            this.simulateAIResponse(message);
        }

        input.value = '';
    },

    handleAIMessage: function(data) {
        if (data.type === 'ai_message') {
            this.addAIMessage(data.content);
        } else if (data.type === 'ai_action') {
            this.executeAIAction(data.action);
        } else if (data.type === 'ai_control') {
            this.updateAIControl(data.enabled);
        }
    },

    addPlayerMessage: function(text) {
        this.addMessage('PLAYER', text, '#00ffff');
    },

    addAIMessage: function(text) {
        this.addMessage('AI', text, '#00ff00');
    },

    addSystemMessage: function(text) {
        this.addMessage('SYSTEM', text, '#ffaa00');
    },

    addMessage: function(sender, text, color) {
        const container = document.getElementById('ai-chat-messages');
        if (!container) return;

        const timestamp = new Date().toLocaleTimeString();
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            margin-bottom: 10px;
            padding: 8px;
            background: rgba(0,255,0,0.05);
            border-left: 3px solid ${color};
            border-radius: 3px;
        `;

        messageDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                <span style="color:${color}; font-weight:bold; font-size:11px;">${sender}</span>
                <span style="color:#666; font-size:10px;">${timestamp}</span>
            </div>
            <div style="color:#00ff00; font-size:12px; line-height:1.4;">${text}</div>
        `;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;

        this.chatHistory.push({ sender, text, timestamp });
    },

    toggleAIControl: function() {
        this.aiControlEnabled = !this.aiControlEnabled;
        const btn = document.getElementById('ai-control-toggle');
        const actionDiv = document.getElementById('ai-current-action');

        if (btn) {
            btn.textContent = this.aiControlEnabled ? 'ON' : 'OFF';
            btn.style.background = this.aiControlEnabled ? '#00ff00' : '#ff0000';
        }

        if (this.aiControlEnabled) {
            this.addSystemMessage('🤖 AI Control ENABLED - AI can now play the game');
            this.startAIControl();
        } else {
            this.addSystemMessage('🛑 AI Control DISABLED - Manual control restored');
            this.stopAIControl();
        }

        // Notify server
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'control_toggle',
                enabled: this.aiControlEnabled
            }));
        }
    },

    startAIControl: function() {
        if (this.aiLoopInterval) return;

        this.aiLoopInterval = setInterval(() => {
            if (this.aiControlEnabled) {
                this.performAILogic();
            }
        }, 100);
    },

    stopAIControl: function() {
        if (this.aiLoopInterval) {
            clearInterval(this.aiLoopInterval);
            this.aiLoopInterval = null;
        }

        const actionDiv = document.getElementById('ai-current-action');
        if (actionDiv) {
            actionDiv.textContent = 'Idle';
        }
    },

    performAILogic: function() {
        // Basic AI decision making
        if (!window.player || !window.cameraRig) return;

        const gameState = this.captureGameState();

        // Simple AI behavior
        if (gameState.health < 30) {
            this.updateCurrentAction('⚠ Low health - seeking cover');
            // AI could move to safety
        } else if (gameState.nearbyEnemies > 0) {
            this.updateCurrentAction('⚔ Engaging enemies');
            // AI could aim and shoot
        } else {
            this.updateCurrentAction('🗺 Exploring area');
            // AI could move around
        }
    },

    executeAIAction: function(action) {
        this.addAIMessage(`Executing action: ${action}`);
        this.updateCurrentAction(`Performing: ${action}`);

        // Execute game actions based on AI commands
        switch(action) {
            case 'move_forward':
                this.simulateKeyPress('w', 500);
                break;
            case 'move_backward':
                this.simulateKeyPress('s', 500);
                break;
            case 'turn_left':
                this.simulateMouseMove(-50, 0);
                break;
            case 'turn_right':
                this.simulateMouseMove(50, 0);
                break;
            case 'shoot':
                this.simulateMouseClick();
                break;
            case 'jump':
                this.simulateKeyPress(' ', 200);
                break;
        }
    },

    simulateKeyPress: function(key, duration) {
        if (!window.keys) return;

        window.keys[key] = true;
        setTimeout(() => {
            window.keys[key] = false;
        }, duration);
    },

    simulateMouseMove: function(deltaX, deltaY) {
        if (!window.player) return;

        const sensitivity = window.mouseSensitivity || 0.002;
        window.player.yaw -= deltaX * sensitivity;
        window.player.pitch -= deltaY * sensitivity;
        window.player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, window.player.pitch));
    },

    simulateMouseClick: function() {
        if (window.shoot) {
            window.shoot();
        }
    },

    updateCurrentAction: function(action) {
        const actionDiv = document.getElementById('ai-current-action');
        if (actionDiv) {
            actionDiv.textContent = action;
        }
    },

    requestAIAction: function(actionType) {
        const messages = {
            explore: 'Please explore the area and report what you find',
            combat: 'Engage nearby enemies in combat',
            collect: 'Collect nearby items and resources',
            return: 'Return to starting position'
        };

        const message = messages[actionType] || actionType;
        const input = document.getElementById('ai-chat-input');
        if (input) {
            input.value = message;
        }
        this.sendMessage();
    },

    captureGameState: function() {
        const state = {
            timestamp: Date.now(),
            health: window.player ? window.player.health : 100,
            stamina: window.player ? window.player.stamina : 100,
            position: window.cameraRig ? {
                x: window.cameraRig.position.x,
                y: window.cameraRig.position.y,
                z: window.cameraRig.position.z
            } : null,
            nearbyEnemies: 0,
            nearbyItems: 0
        };

        // Count nearby enemies
        if (window.aiUnits) {
            state.nearbyEnemies = window.aiUnits.filter(unit => {
                if (!unit.mesh || !window.cameraRig) return false;
                const dist = unit.mesh.position.distanceTo(window.cameraRig.position);
                return dist < 20 && unit.userData?.faction === window.FACTIONS?.RAIDER;
            }).length;
        }

        return state;
    },

    takeScreenshot: function() {
        if (!window.renderer) {
            this.addSystemMessage('❌ Screenshot failed - renderer not available');
            return;
        }

        try {
            const canvas = window.renderer.domElement;
            const dataUrl = canvas.toDataURL('image/png');

            // Download screenshot locally
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `omni-ops-screenshot-${timestamp}.png`;
            link.href = dataUrl;
            link.click();

            this.addSystemMessage('📸 Screenshot captured successfully');

            // Send to AI backend for vision analysis
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.addSystemMessage('🔍 Sending to AI for vision analysis...');

                this.ws.send(JSON.stringify({
                    type: 'screenshot',
                    image: dataUrl,
                    gameState: this.captureGameState(),
                    timestamp: timestamp
                }));
            } else {
                this.addSystemMessage('⚠ AI server not connected - screenshot saved locally only');
            }
        } catch (err) {
            console.error('[AI Tester] Screenshot error:', err);
            this.addSystemMessage('❌ Screenshot failed: ' + err.message);
        }
    },

    clearChat: function() {
        const container = document.getElementById('ai-chat-messages');
        if (container) {
            container.innerHTML = '<div style="color:#00ff00; font-size:11px; opacity:0.6;">Chat cleared</div>';
        }
        this.chatHistory = [];
    },

    simulateAIResponse: function(message) {
        // Offline mode - simulate AI responses
        setTimeout(() => {
            const responses = [
                "I understand. I'm analyzing the current situation.",
                "Received your message. Processing game state...",
                "I can see the game environment. What would you like me to do?",
                "Standing by for instructions.",
                "Monitoring the game area. I can take control if needed."
            ];

            const response = responses[Math.floor(Math.random() * responses.length)];
            this.addAIMessage(response);
        }, 1000);
    }
};

// Initialize
window.AITester = AITester;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AITester.init());
} else {
    AITester.init();
}

})();

console.log('[AI Tester] Module loaded successfully');
