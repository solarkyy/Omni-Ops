/**
 * AI Vision & Brain Communication Panel
 * Allows real-time conversation and vision sharing between external AI and in-game AI
 */

class AIVisionBrainPanel {
    constructor() {
        this.isOpen = false;
        this.ws = null;
        this.isConnected = false;
        this.messageHistory = [];
        this.currentVisionFrame = null;
        this.aiStatus = {};
        
        this.init();
    }
    
    init() {
        this.createUI();
        this.setupEventListeners();
        this.connectToVisionBridge();
    }
    
    createUI() {
        // Main container
        const container = document.createElement('div');
        container.id = 'ai-vision-brain-panel';
        container.innerHTML = `
            <div class="vision-brain-container">
                <!-- Vision Display -->
                <div class="vision-section">
                    <div class="section-header">
                        <h3>👁️ Shared Vision Feed</h3>
                        <span class="connection-status offline">● Offline</span>
                    </div>
                    
                    <div class="vision-display">
                        <canvas id="ai-vision-canvas" width="320" height="240"></canvas>
                        <div class="vision-overlay">
                            <div class="vision-info">
                                <div class="info-line">Position: <span id="ai-pos">--</span></div>
                                <div class="info-line">Objects: <span id="ai-objects">0</span></div>
                                <div class="info-line">Threats: <span id="ai-threats">0</span></div>
                                <div class="info-line">Opportunities: <span id="ai-opps">0</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- AI Brain Status -->
                <div class="brain-section">
                    <div class="section-header">
                        <h3>🧠 AI Brain Status</h3>
                    </div>
                    
                    <div class="brain-status">
                        <div class="status-item">
                            <label>Current Task:</label>
                            <span id="ai-task">idle</span>
                        </div>
                        <div class="status-item">
                            <label>Confidence:</label>
                            <div class="confidence-bar">
                                <div id="ai-confidence" class="confidence-fill" style="width: 50%"></div>
                            </div>
                            <span id="ai-confidence-text">50%</span>
                        </div>
                        <div class="status-item">
                            <label>Autonomy Level:</label>
                            <div class="autonomy-bar">
                                <div id="ai-autonomy" class="autonomy-fill" style="width: 50%"></div>
                            </div>
                            <span id="ai-autonomy-text">5/10</span>
                        </div>
                        <div class="status-item">
                            <label>Health:</label>
                            <div class="health-bar">
                                <div id="ai-health" class="health-fill" style="width: 100%"></div>
                            </div>
                            <span id="ai-health-text">100%</span>
                        </div>
                        <div class="status-item">
                            <label>Memory:</label>
                            <span id="ai-memory" class="memory-count">0 events</span>
                        </div>
                    </div>
                    
                    <div class="quick-commands">
                        <button class="cmd-btn" data-cmd="analyze">📊 Analyze Situation</button>
                        <button class="cmd-btn" data-cmd="see">👀 What Do You See?</button>
                        <button class="cmd-btn" data-cmd="help">🆘 Ask for Help</button>
                        <button class="cmd-btn" data-cmd="autonomy-up">⬆️ More Autonomy</button>
                    </div>
                </div>
                
                <!-- AI Chat -->
                <div class="chat-section">
                    <div class="section-header">
                        <h3>💬 AI Conversation</h3>
                    </div>
                    
                    <div id="ai-chat-messages" class="chat-messages"></div>
                    
                    <div class="chat-input-group">
                        <input 
                            type="text" 
                            id="ai-chat-input" 
                            placeholder="Talk to the AI... (e.g., 'What do you see?', 'Do you need help?')"
                            autocomplete="off"
                        >
                        <button id="ai-chat-send">Send</button>
                    </div>
                    
                    <div class="quick-prompts">
                        <span class="prompt-label">Quick prompts:</span>
                        <button class="prompt-btn">what_see</button>
                        <button class="prompt-btn">how_decide</button>
                        <button class="prompt-btn">learn_together</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #ai-vision-brain-panel {
                position: fixed;
                top: 50px;
                right: 400px;
                width: 600px;
                height: 650px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #00d9ff;
                border-radius: 10px;
                padding: 15px;
                font-family: 'Courier New', monospace;
                color: #00d9ff;
                box-shadow: 0 0 20px rgba(0, 217, 255, 0.3);
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 9998;
                overflow-y: auto;
            }
            
            #ai-vision-brain-panel.hidden {
                display: none;
            }
            
            .vision-brain-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                height: 100%;
            }
            
            .vision-section, .brain-section, .chat-section {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #00d9ff;
                border-radius: 8px;
                padding: 10px;
            }
            
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid #00d9ff;
            }
            
            .section-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: bold;
            }
            
            .connection-status {
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: bold;
            }
            
            .connection-status.online {
                background: #00d900;
                color: #000;
            }
            
            .connection-status.offline {
                background: #d90000;
                color: #fff;
            }
            
            .vision-display {
                position: relative;
                width: 100%;
                aspect-ratio: 4/3;
                background: #000;
                border: 1px solid #00d9ff;
                border-radius: 4px;
                overflow: hidden;
            }
            
            #ai-vision-canvas {
                width: 100%;
                height: 100%;
            }
            
            .vision-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            
            .vision-info {
                position: absolute;
                bottom: 8px;
                left: 8px;
                background: rgba(0, 0, 0, 0.8);
                padding: 6px 10px;
                border-radius: 4px;
                font-size: 11px;
            }
            
            .info-line {
                margin: 2px 0;
            }
            
            .brain-status {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
            }
            
            .status-item label {
                min-width: 100px;
                font-weight: bold;
            }
            
            .confidence-bar, .autonomy-bar, .health-bar {
                flex: 1;
                height: 12px;
                background: #000;
                border: 1px solid #00d9ff;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .confidence-fill {
                height: 100%;
                background: linear-gradient(90deg, #004aff, #00d9ff);
                display: block;
            }
            
            .autonomy-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff6b00, #ffaa00);
                display: block;
            }
            
            .health-fill {
                height: 100%;
                background: linear-gradient(90deg, #ff0000, #00d900);
                display: block;
            }
            
            .quick-commands {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
            }
            
            .cmd-btn {
                padding: 6px 10px;
                background: rgba(0, 217, 255, 0.1);
                border: 1px solid #00d9ff;
                border-radius: 4px;
                color: #00d9ff;
                cursor: pointer;
                font-size: 11px;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .cmd-btn:hover {
                background: rgba(0, 217, 255, 0.3);
                box-shadow: 0 0 10px rgba(0, 217, 255, 0.5);
            }
            
            .chat-messages {
                height: 120px;
                overflow-y: auto;
                background: #000;
                border: 1px solid #00d9ff;
                border-radius: 4px;
                padding: 8px;
                margin-bottom: 8px;
                font-size: 11px;
            }
            
            .chat-message {
                margin: 4px 0;
                padding: 4px;
                border-radius: 3px;
            }
            
            .chat-message.user {
                background: rgba(0, 217, 255, 0.1);
                color: #00d9ff;
            }
            
            .chat-message.ai {
                background: rgba(255, 170, 0, 0.1);
                color: #ffaa00;
            }
            
            .chat-message.system {
                background: rgba(0, 217, 0, 0.1);
                color: #00d900;
            }
            
            .chat-input-group {
                display: flex;
                gap: 6px;
                margin-bottom: 8px;
            }
            
            #ai-chat-input {
                flex: 1;
                padding: 6px 8px;
                background: #000;
                border: 1px solid #00d9ff;
                border-radius: 4px;
                color: #00d9ff;
                font-family: 'Courier New', monospace;
                font-size: 11px;
            }
            
            #ai-chat-input::placeholder {
                color: #00d9ff40;
            }
            
            #ai-chat-send {
                padding: 6px 12px;
                background: rgba(0, 217, 255, 0.2);
                border: 1px solid #00d9ff;
                border-radius: 4px;
                color: #00d9ff;
                cursor: pointer;
                font-weight: bold;
                font-size: 11px;
            }
            
            #ai-chat-send:hover {
                background: rgba(0, 217, 255, 0.4);
            }
            
            .quick-prompts {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
                font-size: 10px;
            }
            
            .prompt-label {
                font-weight: bold;
                color: #00d9ff80;
            }
            
            .prompt-btn {
                padding: 3px 6px;
                background: #000;
                border: 1px solid #00d9ff;
                border-radius: 3px;
                color: #00d9ff;
                cursor: pointer;
                font-size: 10px;
            }
            
            .prompt-btn:hover {
                background: rgba(0, 217, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(container);
    }
    
    setupEventListeners() {
        // Send chat message
        const sendBtn = document.getElementById('ai-chat-send');
        const chatInput = document.getElementById('ai-chat-input');
        
        sendBtn.addEventListener('click', () => this.sendChatMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
        
        // Quick commands
        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cmd = btn.dataset.cmd;
                this.executeCommand(cmd);
            });
        });
        
        // Quick prompts
        document.querySelectorAll('.prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.textContent;
                chatInput.value = prompt;
                chatInput.focus();
            });
        });
    }
    
    connectToVisionBridge() {
        try {
            this.ws = new WebSocket("ws://localhost:8082");
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.updateConnectionStatus(true);
                console.log("✅ Vision Brain Panel connected");
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleVisionUpdate(data);
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                setTimeout(() => this.connectToVisionBridge(), 3000);
            };
        } catch (error) {
            console.error("Failed to connect to vision bridge:", error);
            this.updateConnectionStatus(false);
        }
    }
    
    updateConnectionStatus(connected) {
        const status = document.querySelector('.connection-status');
        if (status) {
            if (connected) {
                status.textContent = '● Online';
                status.classList.add('online');
                status.classList.remove('offline');
            } else {
                status.textContent = '● Offline';
                status.classList.remove('online');
                status.classList.add('offline');
            }
        }
    }
    
    handleVisionUpdate(data) {
        if (data.type === 'vision_update') {
            this.renderVisionFrame(data.vision);
            this.updateVisionInfo(data.vision);
        } else if (data.type === 'ai_state_update') {
            this.updateAIStatus(data.state);
        } else if (data.type === 'chat_message') {
            this.displayChatMessage(data.sender, data.message);
        } else if (data.type === 'instruction_acknowledged') {
            this.displaySystemMessage(`Command queued: ${data.command}`);
        }
    }
    
    renderVisionFrame(vision) {
        if (!vision.frame) return;
        
        const canvas = document.getElementById('ai-vision-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Draw detected objects as overlays
            if (vision.detected_objects) {
                this.drawDetectedObjects(ctx, vision.detected_objects, canvas);
            }
        };
        
        img.src = vision.frame;
    }
    
    drawDetectedObjects(ctx, objects, canvas) {
        objects.forEach(obj => {
            // Simple detection visualization
            ctx.strokeStyle = obj.threat && obj.threat !== 'none' ? '#ff0000' : '#00ff00';
            ctx.lineWidth = 2;
            
            const x = (Math.random() * 0.5 + 0.25) * canvas.width;
            const y = (Math.random() * 0.5 + 0.25) * canvas.height;
            const size = 30;
            
            ctx.strokeRect(x - size/2, y - size/2, size, size);
            
            ctx.fillStyle = ctx.strokeStyle;
            ctx.font = '10px monospace';
            ctx.fillText(obj.type, x - size/2, y - size/2 - 5);
        });
    }
    
    updateVisionInfo(vision) {
        const pos = vision.position;
        const posText = `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
        
        document.getElementById('ai-pos').textContent = posText;
        document.getElementById('ai-objects').textContent = vision.detected_objects?.length || 0;
        document.getElementById('ai-threats').textContent = vision.threats?.length || 0;
        document.getElementById('ai-opps').textContent = vision.opportunities?.length || 0;
    }
    
    updateAIStatus(state) {
        document.getElementById('ai-task').textContent = state.current_task || 'idle';
        
        const confidence = (state.confidence || 0.5) * 100;
        document.getElementById('ai-confidence').style.width = confidence + '%';
        document.getElementById('ai-confidence-text').textContent = confidence.toFixed(0) + '%';
        
        const autonomy = (state.autonomy_level || 5) * 10;
        document.getElementById('ai-autonomy').style.width = autonomy + '%';
        document.getElementById('ai-autonomy-text').textContent = (state.autonomy_level || 5) + '/10';
        
        const health = state.health || 100;
        document.getElementById('ai-health').style.width = health + '%';
        document.getElementById('ai-health-text').textContent = health + '%';
        
        document.getElementById('ai-memory').textContent = (state.memory?.length || 0) + ' events';
    }
    
    sendChatMessage() {
        const input = document.getElementById('ai-chat-input');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.displayChatMessage('user', message);
        input.value = '';
        
        // Send to bridge
        if (this.ws && this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'chat',
                sender: 'external_ai',
                message: message,
                context: {
                    timestamp: Date.now(),
                    panelOpen: true
                }
            }));
        }
    }
    
    displayChatMessage(sender, message) {
        const messagesDiv = document.getElementById('ai-chat-messages');
        if (!messagesDiv) return;
        
        const msgEl = document.createElement('div');
        msgEl.className = `chat-message ${sender === 'user' ? 'user' : sender === 'external_ai' ? 'user' : 'ai'}`;
        msgEl.textContent = `${sender}: ${message}`;
        
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    displaySystemMessage(message) {
        const messagesDiv = document.getElementById('ai-chat-messages');
        if (!messagesDiv) return;
        
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-message system';
        msgEl.textContent = `🤖 ${message}`;
        
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
    
    executeCommand(cmd) {
        switch(cmd) {
            case 'analyze':
                this.sendChatMessage('What\'s your current situation assessment?');
                break;
            case 'see':
                this.sendChatMessage('What do you see right now?');
                break;
            case 'help':
                this.sendChatMessage('Do you need any help with your current task?');
                break;
            case 'autonomy-up':
                if (this.ws && this.isConnected) {
                    this.ws.send(JSON.stringify({
                        type: 'instruction',
                        command: 'increase_autonomy',
                        reasoning: 'AI is performing well, increase decision-making autonomy'
                    }));
                }
                break;
        }
    }
    
    toggle() {
        const panel = document.getElementById('ai-vision-brain-panel');
        if (!panel) return;
        
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    }
    
    show() {
        this.isOpen = true;
        const panel = document.getElementById('ai-vision-brain-panel');
        if (panel) panel.classList.remove('hidden');
    }
    
    hide() {
        this.isOpen = false;
        const panel = document.getElementById('ai-vision-brain-panel');
        if (panel) panel.classList.add('hidden');
    }
}

// Initialize global instance
window.AIVisionBrainPanel = null;

function initializeVisionBrainPanel() {
    if (!window.AIVisionBrainPanel) {
        window.AIVisionBrainPanel = new AIVisionBrainPanel();
        console.log("✅ Vision Brain Panel initialized");
    }
    return window.AIVisionBrainPanel;
}
