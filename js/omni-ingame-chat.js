"""
In-Game AI Chat Panel
Integrates chat directly into the game as an overlay
"""

(function() {
    'use strict';

    const InGameAIChat = {
        ws: null,
        connected: false,
        panelOpen: false,
        httpUrl: 'http://localhost:8080',
        wsUrl: 'ws://localhost:8081',

        init: function() {
            console.log('[AI Chat] Initializing in-game chat system...');
            this.createChatUI();
            this.connectToBridge();
        },

        connectToBridge: function() {
            console.log('[AI Chat] Connecting to bridge...');

            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('[AI Chat] Connected to bridge!');
                this.connected = true;
                this.updateConnectionStatus(true);
                this.addSystemMessage('✅ Connected to AI Collaboration Bridge');

                // Register as in-game chat client
                this.ws.send(JSON.stringify({
                    type: 'chat_client_connected',
                    source: 'in_game',
                    timestamp: new Date().toISOString()
                }));
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.ws.onclose = () => {
                console.log('[AI Chat] Disconnected from bridge');
                this.connected = false;
                this.updateConnectionStatus(false);
                this.addSystemMessage('⚠️ Disconnected. Reconnecting in 3 seconds...');

                setTimeout(() => this.connectToBridge(), 3000);
            };

            this.ws.onerror = (error) => {
                console.error('[AI Chat] WebSocket error:', error);
            };
        },

        handleMessage: function(data) {
            const type = data.type;

            if (type === 'user_message') {
                // User sent a message from external chat or in-game
                if (data.source !== 'in_game') {  // Don't show our own messages twice
                    this.addMessage('user', 'YOU', data.message, data.timestamp);
                }
            } else if (type === 'ai_question_notification' || type === 'ai_question') {
                // In-game AI asked a question
                this.addMessage('in-game-ai', 'IN-GAME AI', data.question, data.timestamp, {
                    hasVisual: data.has_visual,
                    gameState: data.gameState
                });
            } else if (type === 'ai_answer') {
                // External AI answered
                this.addMessage('external-ai', 'EXTERNAL AI (Claude)', data.answer, data.timestamp);
            }
        },

        sendMessage: function(message) {
            if (!this.connected) {
                this.addSystemMessage('❌ Not connected to bridge');
                return;
            }

            this.ws.send(JSON.stringify({
                type: 'user_message',
                message: message,
                source: 'in_game',
                timestamp: new Date().toISOString()
            }));

            // Show in local chat immediately
            this.addMessage('user', 'YOU', message, new Date().toISOString());
        },

        addMessage: function(sender, senderName, content, timestamp, options = {}) {
            const messagesDiv = document.getElementById('ingame-chat-messages');
            if (!messagesDiv) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${sender}`;

            const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();

            messageDiv.innerHTML = `
                <div class="message-header">
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${content}</div>
                ${options.hasVisual ? '<div class="message-note">👁️ Visual context included</div>' : ''}
            `;

            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },

        addSystemMessage: function(content) {
            const messagesDiv = document.getElementById('ingame-chat-messages');
            if (!messagesDiv) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message system';
            messageDiv.innerHTML = `<div class="message-content">${content}</div>`;

            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },

        updateConnectionStatus: function(connected) {
            const statusDot = document.getElementById('chat-status-dot');
            const statusText = document.getElementById('chat-status-text');

            if (statusDot) {
                statusDot.className = connected ? 'status-dot connected' : 'status-dot';
            }
            if (statusText) {
                statusText.textContent = connected ? 'Connected' : 'Disconnected';
            }
        },

        togglePanel: function() {
            const panel = document.getElementById('ingame-chat-panel');
            if (!panel) return;

            this.panelOpen = !this.panelOpen;

            if (this.panelOpen) {
                panel.classList.remove('hidden');
                // Focus input when opening
                const input = document.getElementById('chat-input');
                if (input) setTimeout(() => input.focus(), 100);
            } else {
                panel.classList.add('hidden');
            }
        },

        createChatUI: function() {
            const html = `
                <div id="ingame-chat-panel" class="hidden">
                    <div class="chat-panel-header">
                        <div class="chat-title">💬 AI Collaboration Chat</div>
                        <div class="chat-status">
                            <span class="status-dot" id="chat-status-dot"></span>
                            <span id="chat-status-text">Connecting...</span>
                        </div>
                        <button class="chat-close-btn" onclick="window.InGameAIChat.togglePanel()">✕</button>
                    </div>

                    <div class="chat-participants">
                        <span class="participant user">👤 YOU</span>
                        <span class="participant in-game">🎮 IN-GAME AI</span>
                        <span class="participant external">🤖 EXTERNAL AI</span>
                    </div>

                    <div class="chat-messages" id="ingame-chat-messages">
                        <!-- Messages appear here -->
                    </div>

                    <div class="chat-input-area">
                        <input
                            type="text"
                            id="chat-input"
                            placeholder="Type message... (Press Enter)"
                            onkeypress="if(event.key==='Enter') window.InGameAIChat.handleSend()"
                        />
                        <button class="chat-send-btn" onclick="window.InGameAIChat.handleSend()">📤</button>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', html);
            this.addChatStyles();

            // Welcome message
            setTimeout(() => {
                this.addSystemMessage('🎉 AI Chat Ready! Type a message or wait for in-game AI to respond.');
            }, 1000);
        },

        handleSend: function() {
            const input = document.getElementById('chat-input');
            if (!input) return;

            const message = input.value.trim();
            if (!message) return;

            this.sendMessage(message);
            input.value = '';
        },

        askExternalAI: function(question, includeVisual = false) {
            if (!this.connected) {
                console.warn('[AI Chat] Cannot ask external AI - not connected');
                return;
            }

            console.log(`[AI Chat] In-game AI asking: "${question}"`);

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

            // Send to bridge
            this.ws.send(JSON.stringify(messageData));

            // Show in chat panel
            this.addMessage('in-game-ai', 'IN-GAME AI', question, messageData.timestamp, {
                hasVisual: includeVisual
            });
        },

        captureGameView: function() {
            try {
                // Find the game canvas
                const canvas = document.querySelector('canvas');
                if (!canvas) {
                    console.warn('[AI Chat] No canvas found for capture');
                    return null;
                }

                // Create a temporary canvas for resizing
                const tempCanvas = document.createElement('canvas');
                const targetWidth = 640;
                const targetHeight = 360;
                tempCanvas.width = targetWidth;
                tempCanvas.height = targetHeight;

                const ctx = tempCanvas.getContext('2d');

                // Draw the game canvas onto the temp canvas (scaled down)
                ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

                // Convert to base64 JPEG
                const imageData = tempCanvas.toDataURL('image/jpeg', 0.7);

                console.log('[AI Chat] Captured game view');
                return imageData;

            } catch (error) {
                console.error('[AI Chat] Error capturing game view:', error);
                return null;
            }
        },

        addChatStyles: function() {
            const style = document.createElement('style');
            style.textContent = `
                #ingame-chat-panel {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 450px;
                    height: 550px;
                    background: rgba(0, 0, 0, 0.95);
                    border: 3px solid #0af;
                    border-radius: 10px;
                    z-index: 9999;
                    font-family: 'Courier New', monospace;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 0 30px rgba(0, 170, 255, 0.5);
                }

                #ingame-chat-panel.hidden {
                    display: none;
                }

                .chat-panel-header {
                    background: linear-gradient(135deg, #0af 0%, #08d 100%);
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #0af;
                }

                .chat-title {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                }

                .chat-status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    color: #000;
                    font-weight: bold;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
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

                .chat-close-btn {
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

                .chat-participants {
                    background: rgba(0, 0, 0, 0.5);
                    padding: 8px 12px;
                    border-bottom: 1px solid rgba(0, 170, 255, 0.3);
                    display: flex;
                    gap: 10px;
                    font-size: 10px;
                }

                .participant {
                    padding: 4px 8px;
                    border-radius: 10px;
                    border: 1px solid;
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

                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .chat-message {
                    padding: 10px;
                    border-radius: 8px;
                    border-left: 3px solid;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .chat-message.user {
                    border-left-color: #0af;
                    background: rgba(0, 170, 255, 0.1);
                    align-self: flex-end;
                    max-width: 80%;
                }

                .chat-message.in-game-ai {
                    border-left-color: #0f6;
                    background: rgba(0, 255, 102, 0.1);
                    align-self: flex-start;
                    max-width: 80%;
                }

                .chat-message.external-ai {
                    border-left-color: #f90;
                    background: rgba(255, 153, 0, 0.1);
                    align-self: flex-start;
                    max-width: 80%;
                }

                .chat-message.system {
                    border-left-color: #888;
                    background: rgba(136, 136, 136, 0.1);
                    align-self: center;
                    font-size: 11px;
                    color: #aaa;
                    text-align: center;
                    max-width: 90%;
                }

                .message-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                }

                .message-sender {
                    font-weight: bold;
                    font-size: 12px;
                }

                .chat-message.user .message-sender { color: #0af; }
                .chat-message.in-game-ai .message-sender { color: #0f6; }
                .chat-message.external-ai .message-sender { color: #f90; }

                .message-time {
                    font-size: 10px;
                    color: #888;
                }

                .message-content {
                    font-size: 13px;
                    line-height: 1.4;
                    color: #fff;
                }

                .message-note {
                    margin-top: 6px;
                    font-size: 11px;
                    color: #0f6;
                }

                .chat-input-area {
                    background: rgba(0, 0, 0, 0.8);
                    padding: 12px;
                    border-top: 2px solid rgba(0, 170, 255, 0.3);
                    display: flex;
                    gap: 8px;
                }

                #chat-input {
                    flex: 1;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.5);
                    border: 2px solid #0af;
                    border-radius: 5px;
                    color: #fff;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }

                #chat-input:focus {
                    outline: none;
                    border-color: #0cf;
                    box-shadow: 0 0 10px rgba(0, 170, 255, 0.3);
                }

                .chat-send-btn {
                    padding: 10px 15px;
                    background: linear-gradient(135deg, #0af 0%, #08d 100%);
                    border: none;
                    border-radius: 5px;
                    color: #fff;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .chat-send-btn:hover {
                    background: linear-gradient(135deg, #0cf 0%, #0af 100%);
                    box-shadow: 0 0 15px rgba(0, 170, 255, 0.5);
                }

                .chat-messages::-webkit-scrollbar {
                    width: 8px;
                }

                .chat-messages::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }

                .chat-messages::-webkit-scrollbar-thumb {
                    background: rgba(0, 170, 255, 0.5);
                    border-radius: 4px;
                }

                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 170, 255, 0.7);
                }
            `;
            document.head.appendChild(style);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => InGameAIChat.init());
    } else {
        InGameAIChat.init();
    }

    // Expose globally
    window.InGameAIChat = InGameAIChat;

    console.log('[AI Chat] In-game chat module loaded');
})();
