// AI Collaboration Overlay System
// Press F3 in-game to access real-time collaboration with Copilot and Cline
// Copilot (AI Boss) manages Cline (Implementation AI)

class AICollaborationOverlay {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.statusData = {};
        this.messageQueue = [];
        this.collaborationActive = false;
        this.lastMessageId = 0;
        this.realMode = false; // Toggle between simulated and real Cline
        this.checkedRealMode = false; // Track if we've checked server for real mode
        
        this.init();
    }
    
    init() {
        // Create overlay HTML
        this.createOverlayHTML();
        
        // Setup keyboard shortcut (F3)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F3' || e.keyCode === 114) {
                e.preventDefault();
                if (this.isOpen) {
                    this.close();
                } else {
                    this.open();
                }
            }
        });
        
        // Load collaboration status periodically
        setInterval(() => this.loadStatus(), 1000);
        
        // Update game view canvas continuously (30 FPS) - ALWAYS ON
        setInterval(() => {
            this.updateGameView();
        }, 33);
        
        // Poll for new Cline messages every 2 seconds
        setInterval(() => this.pollClineMessages(), 2000);
        
        // Add message immediately on ENTER
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.isOpen) {
                const input = document.getElementById('collab-user-input');
                if (document.activeElement === input && input.value.trim()) {
                    e.preventDefault();
                    this.sendUserRequest(input.value);
                    input.value = '';
                }
            }
        });
    }
    
    createOverlayHTML() {
        const overlay = document.createElement('div');
        overlay.id = 'ai-collab-overlay';
        overlay.innerHTML = `
            <div id="collab-panel">
                <div class="collab-header">
                    <div class="collab-title">
                        <span class="live-dot"></span> AI COLLABORATION COMMAND CENTER
                    </div>
                    <div class="collab-controls">
                        <button id="collab-clear-btn" style="margin-right: 10px; padding: 4px 12px; background: #333; color: #0f6; border: 1px solid #0f6; border-radius: 3px; cursor: pointer; font-size: 11px;">🗑️ Clear Chat</button>
                        <span id="collab-status">Ready</span>
                        <button id="collab-close-btn">×</button>
                    </div>
                </div>
                
                <div class="collab-main">
                    <!-- LEFT: Game View -->
                    <div class="collab-section collab-game">
                        <div class="collab-section-title">GAME VIEW</div>
                        <div id="collab-game-feed">
                            <canvas id="collab-game-canvas"></canvas>
                            <div id="collab-game-status">
                                <div>Game: <span id="game-fps">60</span> FPS</div>
                                <div>Player: <span id="player-status">Ready</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CENTER: Chat -->
                    <div class="collab-section collab-chat">
                        <div class="collab-section-title">COLLABORATION CHAT</div>
                        <div id="collab-chat-messages"></div>
                        <div class="collab-chat-input-area">
                            <input 
                                id="collab-user-input" 
                                type="text" 
                                placeholder="Request feature or ask question... (ENTER to send)"
                                maxlength="200"
                            />
                        </div>
                    </div>
                    
                    <!-- RIGHT: Status -->
                    <div class="collab-section collab-status">
                        <div class="collab-section-title">PROGRESS</div>
                        <div id="collab-progress-info">
                            <div class="status-row">
                                <span>Copilot Status:</span>
                                <span id="copilot-status" class="status-value">Ready</span>
                            </div>
                            <div class="status-row">
                                <span>Cline Status:</span>
                                <span id="cline-status-display" class="status-value">Waiting</span>
                            </div>
                            <div class="status-row">
                                <span>Messages:</span>
                                <span id="msg-count-display" class="status-value">0</span>
                            </div>
                            <div class="status-row">
                                <span>Elapsed:</span>
                                <span id="elapsed-display" class="status-value">0s</span>
                            </div>
                            
                            <div style="margin-top: 15px;">
                                <div style="font-size: 10px; color: #0af; margin-bottom: 5px;">Task Progress</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" id="task-progress">0%</div>
                                </div>
                            </div>
                            
                            <div style="margin-top: 15px;">
                                <div style="font-size: 10px; color: #0af; margin-bottom: 5px;">Test Results</div>
                                <div id="test-results-mini"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #ai-collab-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 10000;
                font-family: 'Courier New', monospace;
                color: #0f6;
                border: 2px solid #0f6;
                box-shadow: 0 0 30px rgba(0, 255, 100, 0.3);
            }
            
            #ai-collab-overlay.active {
                display: flex;
                flex-direction: column;
            }
            
            #collab-panel {
                display: flex;
                flex-direction: column;
                height: 100%;
                gap: 0;
            }
            
            .collab-header {
                background: linear-gradient(135deg, #0f6, #0d0);
                color: #000;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #0f6;
            }
            
            .collab-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: bold;
                font-size: 14px;
            }
            
            .live-dot {
                width: 8px;
                height: 8px;
                background: #f00;
                border-radius: 50%;
                animation: pulse 1s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .collab-controls {
                display: flex;
                align-items: center;
                gap: 15px;
                font-size: 12px;
            }
            
            #collab-close-btn {
                background: rgba(0, 0, 0, 0.3);
                color: #000;
                border: 1px solid #000;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            #collab-close-btn:hover {
                background: rgba(0, 0, 0, 0.6);
            }
            
            .collab-main {
                display: grid;
                grid-template-columns: 1fr 1.5fr 0.8fr;
                gap: 10px;
                flex: 1;
                padding: 10px;
                overflow: hidden;
            }
            
            .collab-section {
                display: flex;
                flex-direction: column;
                background: rgba(0, 20, 10, 0.8);
                border: 1px solid #0f6;
                border-radius: 5px;
                padding: 10px;
                overflow: hidden;
            }
            
            .collab-section-title {
                font-weight: bold;
                font-size: 11px;
                color: #0af;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 1px solid #0f6;
            }
            
            #collab-game-feed {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
            }
            
            #collab-game-canvas {
                flex: 1;
                background: #000;
                border: 1px solid #0f6;
                border-radius: 3px;
            }
            
            #collab-game-status {
                font-size: 9px;
                display: flex;
                gap: 15px;
            }
            
            .collab-chat {
                flex-direction: column;
            }
            
            #collab-chat-messages {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 8px;
                scrollbar-width: thin;
                scrollbar-color: #0f6 transparent;
            }
            
            #collab-chat-messages::-webkit-scrollbar {
                width: 4px;
            }
            
            #collab-chat-messages::-webkit-scrollbar-thumb {
                background: #0f6;
                border-radius: 2px;
            }
            
            .collab-msg {
                padding: 6px;
                margin-bottom: 6px;
                border-left: 2px solid #0f6;
                border-radius: 3px;
                font-size: 10px;
                background: rgba(0, 255, 100, 0.05);
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-10px); }
                to { opacity: 1; transform: translateX(0); }
            }
            
            .collab-msg.user {
                border-left-color: #0af;
                background: rgba(0, 175, 255, 0.05);
            }
            
            .collab-msg.copilot {
                border-left-color: #0f6;
                background: rgba(0, 255, 100, 0.05);
            }
            
            .collab-msg.cline {
                border-left-color: #ff0;
                background: rgba(255, 255, 0, 0.05);
            }
            
            .collab-msg-header {
                font-weight: bold;
                font-size: 9px;
                margin-bottom: 2px;
            }
            
            .collab-msg.user .collab-msg-header { color: #0af; }
            .collab-msg.copilot .collab-msg-header { color: #0f6; }
            .collab-msg.cline .collab-msg-header { color: #ff0; }
            
            .collab-chat-input-area {
                display: flex;
                gap: 5px;
            }
            
            #collab-user-input {
                flex: 1;
                background: rgba(0, 255, 100, 0.05);
                border: 1px solid #0f6;
                color: #0f6;
                padding: 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 10px;
            }
            
            #collab-user-input:focus {
                outline: none;
                box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
            }
            
            .collab-status {
                flex-direction: column;
            }
            
            #collab-progress-info {
                flex: 1;
                overflow-y: auto;
            }
            
            .status-row {
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                padding: 4px 0;
                border-bottom: 1px solid rgba(0, 255, 100, 0.1);
            }
            
            .status-value {
                color: #0af;
                font-weight: bold;
            }
            
            .progress-bar {
                width: 100%;
                height: 15px;
                background: rgba(0, 255, 100, 0.1);
                border: 1px solid #0f6;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #0f6, #0d0);
                width: 0%;
                transition: width 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                color: #000;
                font-weight: bold;
            }
            
            #test-results-mini {
                font-size: 9px;
                max-height: 150px;
                overflow-y: auto;
            }
            
            .test-result-item {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 0;
            }
            
            .test-indicator {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: #ff0;
            }
            
            .test-indicator.pass {
                background: #0f6;
            }
            
            .test-indicator.fail {
                background: #f00;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        
        // Close button
        document.getElementById('collab-close-btn').addEventListener('click', () => this.close());
        
        // Clear chat button
        document.getElementById('collab-clear-btn').addEventListener('click', () => this.clearChat());
        
        // Load initial messages
        this.loadMessages();
    }
    
    open() {
        this.isOpen = true;
        document.getElementById('ai-collab-overlay').classList.add('active');
        
        // Check for real mode on first open
        if (!this.checkedRealMode) {
            this.checkedRealMode = true;
            this.checkRealModeStatus();
        }
        
        // Send initial message and start demo conversation (only on first open)
        if (this.messages.length === 0) {
            this.addMessage('SYSTEM', '⚡ AI Collaboration Command Center - Initializing...', 'system');
            
            // Wait a moment for real mode check, then show appropriate welcome
            setTimeout(() => {
                if (this.realMode) {
                    this.addMessage('SYSTEM', '✅ REAL MODE ACTIVE - Cline is operational!', 'system');
                    this.addMessage('COPILOT', 'Hello! I\'m coordinating with the actual Cline process.', 'copilot');
                    this.addMessage('CLINE', '🚀 Ready for real implementation work!', 'cline');
                    this.addMessage('SYSTEM', 'Request features and I\'ll implement them for real!', 'system');
                } else {
                    this.addMessage('SYSTEM', '⚠️ Demo Mode - Showing simulated workflow', 'system');
                    this.addMessage('COPILOT', 'Hello! I\'m Copilot - your AI coordinator.', 'copilot');
                    this.addMessage('CLINE', 'And I\'m Cline - the implementation AI.', 'cline');
                    this.addMessage('SYSTEM', 'Try: "hello", "what can you do?", or "enable real mode"', 'system');
                }
            }, 1500);
        }
    }
    
    checkRealModeStatus() {
        // Check if server has real mode enabled
        fetch('http://127.0.0.1:8080/api/cline/messages')
            .then(r => r.json())
            .then(data => {
                if (data.realMode) {
                    this.realMode = true;
                    const statusEl = document.getElementById('collab-status');
                    if (statusEl) {
                        statusEl.textContent = '🟢 Real Mode';
                        statusEl.style.color = '#0f6';
                    }
                }
            })
            .catch(() => {
                // Server not available - stay in demo mode
            });
    }
    
    close() {
        this.isOpen = false;
        document.getElementById('ai-collab-overlay').classList.remove('active');
    }
    
    addMessage(actor, content, type = 'info') {
        const message = {
            actor: actor,
            content: content,
            type: type,
            time: new Date().toLocaleTimeString()
        };
        
        this.messages.push(message);
        this.displayMessage(message);
        
        // Save to localStorage for persistence
        try {
            localStorage.setItem('collab_messages', JSON.stringify(this.messages));
        } catch (e) {}
    }
    
    displayMessage(message) {
        const container = document.getElementById('collab-chat-messages');
        if (!container) return;
        
        const div = document.createElement('div');
        div.className = `collab-msg ${message.type}`;
        div.innerHTML = `
            <div class="collab-msg-header">${message.actor} • ${message.time}</div>
            <div>${message.content}</div>
        `;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
    
    loadMessages() {
        try {
            const saved = localStorage.getItem('collab_messages');
            if (saved) {
                this.messages = JSON.parse(saved);
                const container = document.getElementById('collab-chat-messages');
                if (container) {
                    container.innerHTML = '';
                    this.messages.forEach(msg => this.displayMessage(msg));
                }
            }
        } catch (e) {}
    }
    
    sendUserRequest(request) {
        // Add user message to display
        this.addMessage('YOU', request, 'user');
        
        // Send to collaboration system via HTTP API
        this.sendToCollaboration('user', request);
        
        // Determine intent: conversation, question, or implementation request
        const intent = this.detectIntent(request);
        
        if (intent === 'greeting') {
            this.handleGreeting(request);
        } else if (intent === 'question') {
            this.handleQuestion(request);
        } else if (intent === 'clear') {
            this.clearChat();
        } else if (intent === 'enable_real_mode') {
            this.enableRealMode();
        } else {
            this.handleImplementationRequest(request);
        }
    }
    
    detectIntent(text) {
        const lower = text.toLowerCase().trim();
        
        // Enable real mode
        if (lower.includes('enable real mode') || lower.includes('activate real mode') || lower.includes('turn on real mode') || lower === 'real mode') {
            return 'enable_real_mode';
        }
        
        // Greetings
        const greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'sup', 'yo', 'whats up', "what's up"];
        if (greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ','))) {
            return 'greeting';
        }
        
        // Clear chat
        if (lower.includes('clear chat') || lower.includes('reset chat') || lower.includes('new game')) {
            return 'clear';
        }
        
        // Questions
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'could you', 'would you', 'is', 'are', 'do you', 'does', 'did', 'will'];
        if (questionWords.some(q => lower.startsWith(q + ' ')) || lower.endsWith('?')) {
            return 'question';
        }
        
        // Otherwise it's an implementation request
        return 'implementation';
    }
    
    handleGreeting(request) {
        setTimeout(() => {
            const responses = [
                "Hey! I'm Copilot, your AI coordinator. Ready to work with Cline to implement features!",
                "Hello! Copilot here. What would you like us to build today?",
                "Hi there! I'm managing Cline's work. Got any features in mind?",
                "Greetings! Standing by to coordinate implementations with Cline."
            ];
            this.addMessage('COPILOT', responses[Math.floor(Math.random() * responses.length)], 'copilot');
        }, 500);
        
        setTimeout(() => {
            this.addMessage('CLINE', "Hello! Ready to implement whatever you need.", 'cline');
        }, 1200);
    }
    
    handleQuestion(request) {
        const lower = request.toLowerCase();
        
        setTimeout(() => {
            let response = '';
            
            if (lower.includes('status') || lower.includes('how are you')) {
                response = "System status: All operational. Currently in simulation mode - showing how collaboration would work.";
            } else if (lower.includes('what can you') || lower.includes('what do you')) {
                response = "I coordinate with Cline to implement game features. You request it, I break it down, Cline codes it. Try: 'add wall running' or 'improve AI pathfinding'";
            } else if (lower.includes('real') || lower.includes('actually') || lower.includes('working')) {
                response = "⚠️ Currently in DEMO MODE. Conversations are simulated to show the concept. Real Cline integration coming next!";
            } else if (lower.includes('how') && lower.includes('work')) {
                response = "You request features → I analyze & delegate → Cline implements → Tests run → Code goes live. Simple!";
            } else {
                response = "Good question! Right now I'm demonstrating the collaboration concept. For real implementations, we need to connect actual Cline process.";
            }
            
            this.addMessage('COPILOT', response, 'copilot');
        }, 600);
        
        if (lower.includes('cline') && !lower.includes('copilot')) {
            setTimeout(() => {
                this.addMessage('CLINE', "I handle the actual coding work. Copilot coordinates, I implement.", 'cline');
            }, 1500);
        }
    }
    
    clearChat() {
        this.messages = [];
        localStorage.removeItem('collab_messages');
        const container = document.getElementById('collab-chat-messages');
        if (container) container.innerHTML = '';
        
        setTimeout(() => {
            this.addMessage('SYSTEM', '💬 Chat cleared. Ready for fresh start!', 'system');
        }, 300);
        
        setTimeout(() => {
            this.addMessage('COPILOT', 'Clean slate! What would you like to build?', 'copilot');
        }, 1000);
    }
    
    enableRealMode() {
        // Enable real Cline integration
        this.addMessage('SYSTEM', '⚡ Real mode is AUTO-ENABLED in bridge-less mode', 'system');
        
        setTimeout(() => {
            fetch('http://127.0.0.1:8080/api/cline/enable', {
                method: 'POST'
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.realMode = true;
                    this.addMessage('SYSTEM', '✅ BRIDGE-LESS MODE ACTIVE!', 'system');
                    this.addMessage('COPILOT', 'Tasks are sent via API - no bridge process needed!', 'copilot');
                    this.addMessage('CLINE', '🚀 Ready to receive tasks from inbox directory.', 'cline');
                    this.addMessage('SYSTEM', 'Files saved to cline_inbox/ - GitHub Copilot will pick them up!', 'system');
                } else {
                    this.addMessage('SYSTEM', '❌ Failed to enable real mode', 'system');
                }
            })
            .catch(err => {
                this.addMessage('SYSTEM', '❌ Connection error - is the server running?', 'system');
            });
        }, 500);
    }
    
    handleImplementationRequest(request) {
        // Check if real mode is enabled
        if (this.realMode) {
            // REAL MODE - Send to actual Cline
            this.sendRealTask(request);
        } else {
            // SIMULATED MODE - Show demo workflow
            this.sendSimulatedTask(request);
        }
    }
    
    sendRealTask(request) {
        // Send task to real Cline via HTTP API
        setTimeout(() => {
            this.addMessage('COPILOT', `📋 Analyzing: "${request}"`, 'copilot');
        }, 600);
        
        setTimeout(() => {
            this.addMessage('COPILOT', `✅ REAL MODE - Sending to actual Cline...`, 'copilot');
        }, 1200);
        
        setTimeout(() => {
            // Send to Cline via API
            fetch('http://127.0.0.1:8080/api/cline/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: request,
                    type: 'implementation',
                    timestamp: new Date().toISOString()
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    this.addMessage('COPILOT', `🔧 Task delegated to Cline (Task ID: ${data.taskId})`, 'copilot');
                    this.addMessage('SYSTEM', `⏳ Waiting for Cline to implement...`, 'system');
                    
                    // Start polling for Cline's response more frequently
                    this.startTaskMonitoring(data.taskId);
                } else {
                    this.addMessage('SYSTEM', `❌ Error sending to Cline: ${data.error}`, 'system');
                }
            })
            .catch(err => {
                this.addMessage('SYSTEM', `❌ Connection error: ${err.message}`, 'system');
            });
        }, 1800);
    }
    
    sendSimulatedTask(request) {
        // Simulated workflow with [SIMULATED] tags
        setTimeout(() => {
            this.addMessage('COPILOT', `📋 Analyzing: "${request}"`, 'copilot');
        }, 600);
        
        setTimeout(() => {
            this.addMessage('COPILOT', `⚠️ NOTE: Currently in DEMO MODE - simulating workflow`, 'copilot');
        }, 1200);
        
        setTimeout(() => {
            this.addMessage('COPILOT', `🔧 In real mode, I'd delegate this to Cline now...`, 'copilot');
        }, 1800);
        
        setTimeout(() => {
            this.addMessage('CLINE', `📥 [SIMULATED] Task: "${request}"`, 'cline');
        }, 2400);
        
        setTimeout(() => {
            this.addMessage('CLINE', `🔍 [SIMULATED] Would scan: js/omni-*.js files`, 'cline');
        }, 3200);
        
        setTimeout(() => {
            this.addMessage('CLINE', `✏️ [SIMULATED] Would implement changes...`, 'cline');
            const progressBar = document.getElementById('collab-progress-bar');
            if (progressBar) progressBar.style.width = '50%';
        }, 4500);
        
        setTimeout(() => {
            this.addMessage('CLINE', `⚠️ [SIMULATED] No actual code written (demo mode)`, 'cline');
            const progressBar = document.getElementById('collab-progress-bar');
            if (progressBar) progressBar.style.width = '100%';
        }, 6000);
        
        setTimeout(() => {
            this.addMessage('COPILOT', `ℹ️ To enable REAL MODE, type: "enable real mode"`, 'copilot');
        }, 7000);
        
        setTimeout(() => {
            this.addMessage('SYSTEM', `Ready for next request (or say "hello" to chat!)`, 'system');
            const progressBar = document.getElementById('collab-progress-bar');
            if (progressBar) {
                setTimeout(() => progressBar.style.width = '0%', 1000);
            }
        }, 8000);
    }
    
    startTaskMonitoring(taskId) {
        // Poll more frequently for this specific task
        const checkInterval = setInterval(() => {
            fetch('http://127.0.0.1:8080/api/cline/check')
                .then(r => r.json())
                .then(data => {
                    if (data.newMessages > 0) {
                        // New messages received - they'll be picked up by pollClineMessages
                        clearInterval(checkInterval);
                    }
                })
                .catch(() => {});
        }, 3000);
        
        // Stop monitoring after 5 minutes
        setTimeout(() => clearInterval(checkInterval), 300000);
    }
    
    sendToCollaboration(actor, content) {
        // Send message to collaboration system via HTTP API
        const message = {
            actor: actor.toUpperCase(),
            content: content,
            timestamp: new Date().toLocaleTimeString(),
            type: actor.toLowerCase()
        };
        
        fetch('http://127.0.0.1:8080/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        }).catch(() => {
            // Server not available - message saved locally only
        });
    }
    
    writeCollaborationRequest(request) {
        // Create request file for actual collaboration system
        const request_file = {
            timestamp: new Date().toISOString(),
            user_request: request,
            from_game: true,
            status: 'pending'
        };
        
        // Save locally and send to server
        localStorage.setItem('last_collab_request', JSON.stringify(request_file));
        
        // Also send to HTTP API
        this.sendToCollaboration('user', `[REQUEST] ${request}`);
    }
    
    loadStatus() {
        // Load real status from HTTP server
        const statusEl = document.getElementById('collab-status');
        const copilotEl = document.getElementById('copilot-status');
        const clineEl = document.getElementById('cline-status-display');
        const msgCountEl = document.getElementById('msg-count-display');
        
        fetch('http://127.0.0.1:8080/api/status')
            .then(r => r.json())
            .then(data => {
                if (copilotEl) copilotEl.textContent = data.copilot_status || 'Ready';
                if (clineEl) clineEl.textContent = data.cline_status || 'Idle';
                if (msgCountEl) msgCountEl.textContent = this.messages.length; // Use actual message count
                if (statusEl) {
                    statusEl.textContent = '🟢 Connected';
                    statusEl.style.color = '#0f6';
                }
                
                // Update progress bar from server or keep current
                const progressBar = document.getElementById('collab-progress-bar');
                if (progressBar && data.task_progress !== undefined) {
                    progressBar.style.width = (data.task_progress || 0) + '%';
                }
            })
            .catch((err) => {
                // Server not available - show connecting status
                if (statusEl) {
                    statusEl.textContent = '🟡 Local Mode';
                    statusEl.style.color = '#ff0';
                }
                // Still functional in local mode
                if (copilotEl) copilotEl.textContent = 'Ready';
                if (clineEl) clineEl.textContent = 'Ready';
                if (msgCountEl) msgCountEl.textContent = this.messages.length;
            });
    }
    
    pollClineMessages() {
        // Poll server for new Cline messages
        fetch('http://127.0.0.1:8080/api/cline/messages')
            .then(r => r.json())
            .then(data => {
                // Auto-enable real mode on first successful connection
                if (!this.checkedRealMode && data.realMode) {
                    this.checkedRealMode = true;
                    this.realMode = true;
                    
                    const statusEl = document.getElementById('collab-status');
                    if (statusEl) {
                        statusEl.textContent = '🟢 Bridge-less Mode';
                        statusEl.style.color = '#0f6';
                    }
                }
                
                if (data.messages && data.messages.length > this.lastMessageId) {
                    // New messages from server
                    const newMessages = data.messages.slice(this.lastMessageId);
                    newMessages.forEach(msg => {
                        // Add all server messages (CLINE, COPILOT, SYSTEM)
                        const actorLower = msg.actor.toLowerCase();
                        this.addMessage(msg.actor, msg.content, actorLower);
                    });
                    this.lastMessageId = data.messages.length;
                }
                
                // Update real mode status
                if (data.realMode !== undefined && data.realMode !== this.realMode) {
                    this.realMode = data.realMode;
                    
                    // Update status display
                    const statusEl = document.getElementById('collab-status');
                    const clineStatusEl = document.getElementById('cline-status-display');
                    
                    if (this.realMode) {
                        if (statusEl) {
                            statusEl.textContent = '🟢 Bridge-less Mode';
                            statusEl.style.color = '#0f6';
                        }
                        if (clineStatusEl) {
                            clineStatusEl.textContent = 'Ready';
                        }
                    }
                }
            })
            .catch(() => {
                // Server not available - stay in simulated mode
                if (this.realMode) {
                    this.realMode = false;
                    const statusEl = document.getElementById('collab-status');
                    if (statusEl) {
                        statusEl.textContent = '🟡 Offline';
                        statusEl.style.color = '#ff0';
                    }
                }
            });
    }
    
    updateGameView() {
        // Copy game canvas to overlay canvas with better canvas detection
        try {
            const overlayCanvas = document.getElementById('collab-game-canvas');
            if (!overlayCanvas) return;
            
            const ctx = overlayCanvas.getContext('2d');
            
            // Set canvas dimensions
            overlayCanvas.width = 400;
            overlayCanvas.height = 300;
            
            // Find the main game canvas
            let gameCanvas = null;
            
            // Method 1: Look for renderer canvas in Three.js context
            if (window.renderer && window.renderer.domElement) {
                gameCanvas = window.renderer.domElement;
            }
            
            // Method 2: Query all canvases and find the largest one
            if (!gameCanvas) {
                const allCanvases = document.querySelectorAll('canvas');
                let largestCanvas = null;
                let largestArea = 0;
                
                allCanvases.forEach(canvas => {
                    if (canvas.id !== 'collab-game-canvas' && canvas.id !== 'minimap-canvas') {
                        const area = canvas.width * canvas.height;
                        if (area > largestArea) {
                            largestArea = area;
                            largestCanvas = canvas;
                        }
                    }
                });
                
                gameCanvas = largestCanvas;
            }
            
            // Draw background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            
            // If we found a game canvas, attempt to copy it
            if (gameCanvas && gameCanvas.width > 0) {
                try {
                    // Calculate scaling to fit
                    const scaleX = overlayCanvas.width / gameCanvas.width;
                    const scaleY = overlayCanvas.height / gameCanvas.height;
                    const scale = Math.min(scaleX, scaleY);
                    
                    const drawWidth = gameCanvas.width * scale;
                    const drawHeight = gameCanvas.height * scale;
                    const offsetX = (overlayCanvas.width - drawWidth) / 2;
                    const offsetY = (overlayCanvas.height - drawHeight) / 2;
                    
                    ctx.drawImage(gameCanvas, offsetX, offsetY, drawWidth, drawHeight);
                    
                    // Draw border to indicate live feed
                    ctx.strokeStyle = '#0f6';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(1, 1, overlayCanvas.width - 2, overlayCanvas.height - 2);
                    
                } catch (e) {
                    // CORS or other error - show placeholder
                    this.drawPlaceholder(ctx, overlayCanvas.width, overlayCanvas.height);
                }
            } else {
                // No game canvas found - show placeholder
                this.drawPlaceholder(ctx, overlayCanvas.width, overlayCanvas.height);
            }
        } catch (e) {
            console.warn('Canvas update failed:', e);
        }
    }
    
    drawPlaceholder(ctx, width, height) {
        // Draw animated placeholder to show system is active
        ctx.fillStyle = '#001a00';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid pattern
        ctx.strokeStyle = '#0f6';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        
        for (let x = 0; x < width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.globalAlpha = 1.0;
        
        // Draw border
        ctx.strokeStyle = '#0f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, width - 2, height - 2);
        
        // Draw text
        ctx.fillStyle = '#0f6';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 LIVE GAME FEED', width / 2, height / 2 - 10);
        
        ctx.font = '12px monospace';
        ctx.fillStyle = '#0a0';
        ctx.fillText('Monitoring active', width / 2, height / 2 + 15);
        
        // Pulse effect
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 255, 102, ${pulse})`;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 + 40, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.aiCollabOverlay = new AICollaborationOverlay();
    });
} else {
    window.aiCollabOverlay = new AICollaborationOverlay();
}
