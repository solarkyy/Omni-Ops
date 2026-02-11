// OMNI-OPS AI LIVE CAM V2 - CLEAN TABBED INTERFACE
(function() {
    'use strict';
    console.log('[AI Live Cam V2] Initializing clean interface...');

const AILiveCam = {
    active: false,
    aiPlayerActive: false,
    aiLoopInterval: null,
    updateInterval: null,
    serverUrl: 'http://localhost:8080',
    ws: null,
    wsConnected: false,
    currentTab: 'chat',

    init: function() {
        console.log('[AI Live Cam V2] Creating UI...');
        this.createButton();
        this.createUI();
        this.setupKeys();
        this.setupStyles();
        this.setupHandlers();
        this.connectToVisionBrain();
    },

    createButton: function() {
        const btn = document.createElement('button');
        btn.id = 'livecam-btn';
        btn.innerHTML = '📹 AI LIVE CAM (F4)';
        btn.style.cssText = `
            position: fixed; top: 50px; right: 10px; z-index: 600;
            padding: 8px 15px; background: #0a0a3a; color: #0af;
            border: 2px solid #0af; border-radius: 5px; font-weight: bold;
            cursor: pointer; font-family: monospace; font-size: 12px;
            transition: all 0.2s; box-shadow: 0 0 10px rgba(0,170,255,0.3);
        `;
        btn.onmouseover = () => {
            btn.style.background = '#0af';
            btn.style.color = '#000';
        };
        btn.onmouseout = () => {
            btn.style.background = '#0a0a3a';
            btn.style.color = '#0af';
        };
        btn.onclick = () => this.toggle();
        document.body.appendChild(btn);
    },

    createUI: function() {
        const html = `
            <div id="ai-livecam-v2" class="hidden">
                <div class="livecam-container">
                    <!-- Header -->
                    <div class="livecam-header">
                        <div class="header-left">
                            <span class="title">📹 AI LIVE CAM</span>
                            <div class="status">
                                <span class="dot" id="ai-status-dot"></span>
                                <span id="ai-status-text">Inactive</span>
                            </div>
                        </div>
                        <div class="header-controls">
                            <button id="btn-start-ai" class="btn-start">▶️ START</button>
                            <button id="btn-stop-ai" class="btn-stop" disabled>⏹️ STOP</button>
                            <button class="btn-close" onclick="window.AILiveCam.toggle()">✕</button>
                        </div>
                    </div>

                    <!-- Main View Area -->
                    <div class="livecam-main">
                        <div class="game-view">
                            <canvas id="ai-canvas" width="800" height="600"></canvas>
                            <div class="overlay-info">
                                <div class="state-badge" id="state-badge">IDLE</div>
                                <div class="target-badge" id="target-badge">NO TARGET</div>
                            </div>
                        </div>
                        <div class="radar-mini">
                            <div class="radar-label">RADAR</div>
                            <canvas id="ai-radar" width="150" height="150"></canvas>
                        </div>
                    </div>

                    <!-- Tabbed Bottom Panel -->
                    <div class="livecam-bottom">
                        <div class="tabs">
                            <button class="tab active" data-tab="chat">💬 CHAT</button>
                            <button class="tab" data-tab="stats">📊 STATS</button>
                            <button class="tab" data-tab="log">📝 LOG</button>
                        </div>

                        <div class="tab-content">
                            <!-- CHAT TAB -->
                            <div class="tab-panel active" id="panel-chat">
                                <div id="chat-messages" class="chat-area"></div>
                                <div class="chat-input-row">
                                    <input type="text" id="chat-input" placeholder="Command: 'Move forward', 'Attack', 'Find cover'..." />
                                    <button id="chat-send">SEND</button>
                                </div>
                                <div class="quick-cmds">
                                    <button data-cmd="Move forward">Forward</button>
                                    <button data-cmd="Attack enemy">Attack</button>
                                    <button data-cmd="Find cover">Cover</button>
                                    <button data-cmd="Hold position">Hold</button>
                                    <button data-cmd="Retreat">Retreat</button>
                                </div>
                            </div>

                            <!-- STATS TAB -->
                            <div class="tab-panel" id="panel-stats">
                                <div class="stats-row">
                                    <div class="stat"><label>HEALTH:</label> <span id="stat-health">100</span></div>
                                    <div class="stat"><label>AMMO:</label> <span id="stat-ammo">30</span></div>
                                    <div class="stat"><label>ENEMIES:</label> <span id="stat-enemies">0</span></div>
                                    <div class="stat"><label>KILLS:</label> <span id="stat-kills">0</span></div>
                                    <div class="stat"><label>TIME:</label> <span id="stat-time">0s</span></div>
                                </div>
                            </div>

                            <!-- LOG TAB -->
                            <div class="tab-panel" id="panel-log">
                                <div id="activity-log" class="log-area"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    setupHandlers: function() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.onclick = () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`panel-${tabName}`).classList.add('active');
            };
        });

        // Chat send
        const sendBtn = document.getElementById('chat-send');
        const chatInput = document.getElementById('chat-input');

        sendBtn.onclick = () => this.sendChat();
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendChat();
        };

        // Quick commands
        document.querySelectorAll('.quick-cmds button').forEach(btn => {
            btn.onclick = () => {
                chatInput.value = btn.dataset.cmd;
                this.sendChat();
            };
        });

        // AI controls
        document.getElementById('btn-start-ai').onclick = () => this.startAI();
        document.getElementById('btn-stop-ai').onclick = () => this.stopAI();
    },

    sendChat: function() {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (!msg) return;

        this.addChatMsg('user', msg);

        if (this.wsConnected && this.ws) {
            this.ws.send(JSON.stringify({
                type: 'user_directive',
                directive: msg,
                timestamp: Date.now()
            }));
        }

        this.log(`📢 Sent: ${msg}`);
        input.value = '';
    },

    addChatMsg: function(sender, text) {
        const chatArea = document.getElementById('chat-messages');
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        const time = new Date().toLocaleTimeString();

        const names = { user: 'YOU', ai: 'AI', external: 'EXTERNAL' };
        msg.innerHTML = `
            <div class="msg-header">
                <span class="msg-sender">${names[sender]}</span>
                <span class="msg-time">${time}</span>
            </div>
            <div class="msg-text">${text}</div>
        `;

        chatArea.appendChild(msg);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Keep last 50
        while (chatArea.children.length > 50) {
            chatArea.removeChild(chatArea.firstChild);
        }
    },

    log: function(text) {
        const logArea = document.getElementById('activity-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString();
        entry.textContent = `[${time}] ${text}`;
        logArea.insertBefore(entry, logArea.firstChild);

        while (logArea.children.length > 100) {
            logArea.removeChild(logArea.lastChild);
        }
    },

    connectToVisionBrain: function() {
        console.log('[AI Live Cam V2] Connecting to Vision Brain...');
        this.ws = new WebSocket('ws://localhost:8082');

        this.ws.onopen = () => {
            this.wsConnected = true;
            console.log('[AI Live Cam V2] Connected');
            document.getElementById('ai-status-dot').classList.add('connected');
            document.getElementById('ai-status-text').textContent = 'Connected';
            this.addChatMsg('ai', 'AI system online and ready for commands.');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
            console.error('[AI Live Cam V2] WebSocket error:', error);
        };

        this.ws.onclose = () => {
            this.wsConnected = false;
            document.getElementById('ai-status-dot').classList.remove('connected');
            document.getElementById('ai-status-text').textContent = 'Disconnected';
            this.log('Disconnected. Retrying in 5s...');
            setTimeout(() => this.connectToVisionBrain(), 5000);
        };
    },

    handleMessage: function(data) {
        const type = data.type;

        if (type === 'ai_response') {
            this.addChatMsg('ai', data.message);
            this.log(`🤖 AI: ${data.message}`);
        } else if (type === 'instruction') {
            this.log(`📋 Executing: ${data.command}`);
        } else if (type === 'ai_state') {
            document.getElementById('state-badge').textContent = data.currentTask || 'IDLE';
        }
    },

    startAI: function() {
        this.aiPlayerActive = true;
        document.getElementById('btn-start-ai').disabled = true;
        document.getElementById('btn-stop-ai').disabled = false;
        this.log('✅ AI Started');
        this.addChatMsg('ai', 'AI control activated. Awaiting directives.');

        if (window.AIPlayerAPI) {
            window.AIPlayerAPI.activateAI();
        }
    },

    stopAI: function() {
        this.aiPlayerActive = false;
        document.getElementById('btn-start-ai').disabled = false;
        document.getElementById('btn-stop-ai').disabled = true;
        this.log('⏹️ AI Stopped');

        if (window.AIPlayerAPI) {
            window.AIPlayerAPI.deactivateAI();
        }
    },

    toggle: function() {
        this.active = !this.active;
        const overlay = document.getElementById('ai-livecam-v2');
        if (this.active) {
            overlay.classList.remove('hidden');
            this.startUpdates();
        } else {
            overlay.classList.add('hidden');
            this.stopUpdates();
        }
    },

    startUpdates: function() {
        this.updateInterval = setInterval(() => this.updateDisplay(), 100);
    },

    stopUpdates: function() {
        if (this.updateInterval) clearInterval(this.updateInterval);
    },

    updateDisplay: function() {
        if (!window.AIPlayerAPI) return;
        const state = window.AIPlayerAPI.getGameState();
        if (!state) return;

        // Update stats
        document.getElementById('stat-health').textContent = Math.floor(state.player.health);
        document.getElementById('stat-ammo').textContent = state.player.ammo;
        document.getElementById('stat-enemies').textContent = state.enemies.length;

        // Update game canvas
        this.renderGameView();
    },

    renderGameView: function() {
        const canvas = document.getElementById('ai-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Find game canvas
        let gameCanvas = null;
        if (window.renderer && window.renderer.domElement) {
            gameCanvas = window.renderer.domElement;
        }

        if (gameCanvas) {
            try {
                ctx.drawImage(gameCanvas, 0, 0, canvas.width, canvas.height);
            } catch (e) {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#0f6';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('NO GAME VIEW', canvas.width/2, canvas.height/2);
            }
        }
    },

    setupKeys: function() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'F4') {
                e.preventDefault();
                this.toggle();
            }
        });
    },

    setupStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            #ai-livecam-v2 { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 10001; font-family: monospace; }
            #ai-livecam-v2.hidden { display: none; }
            .livecam-container { width: 100%; height: 100%; display: flex; flex-direction: column; }

            .livecam-header { background: linear-gradient(135deg, #0f6, #0a4); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f6; }
            .header-left { display: flex; align-items: center; gap: 20px; }
            .title { font-size: 18px; font-weight: bold; color: #000; }
            .status { display: flex; align-items: center; gap: 8px; color: #000; font-size: 13px; }
            .dot { width: 10px; height: 10px; border-radius: 50%; background: #f00; }
            .dot.connected { background: #0f0; }
            .header-controls { display: flex; gap: 10px; }
            .btn-start { padding: 8px 15px; background: #0f0; color: #000; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
            .btn-stop { padding: 8px 15px; background: #f00; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
            .btn-close { padding: 8px 15px; background: #f44; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
            .btn-start:disabled, .btn-stop:disabled { opacity: 0.5; cursor: not-allowed; }

            .livecam-main { flex: 1; display: flex; gap: 10px; padding: 10px; overflow: hidden; }
            .game-view { flex: 1; position: relative; background: #000; border: 2px solid #0f6; border-radius: 8px; overflow: hidden; }
            #ai-canvas { width: 100%; height: 100%; }
            .overlay-info { position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 8px; }
            .state-badge, .target-badge { background: rgba(0,255,100,0.8); color: #000; padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: bold; }
            .radar-mini { width: 180px; background: rgba(0,0,0,0.7); border: 2px solid #0f6; border-radius: 8px; padding: 10px; }
            .radar-label { color: #0f6; font-size: 12px; margin-bottom: 5px; font-weight: bold; }
            #ai-radar { width: 100%; height: auto; background: #000; border: 1px solid #0f6; border-radius: 4px; }

            .livecam-bottom { height: 250px; background: rgba(0,0,0,0.8); border-top: 2px solid #0f6; display: flex; flex-direction: column; }
            .tabs { display: flex; background: rgba(0,0,0,0.5); border-bottom: 2px solid rgba(0,255,100,0.3); }
            .tab { padding: 12px 24px; background: transparent; border: none; border-bottom: 3px solid transparent; color: #0f6; font-family: monospace; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.2s; }
            .tab:hover { background: rgba(0,255,100,0.1); }
            .tab.active { border-bottom-color: #0f6; background: rgba(0,255,100,0.2); color: #0ff; }

            .tab-content { flex: 1; overflow: hidden; }
            .tab-panel { display: none; height: 100%; padding: 15px; overflow-y: auto; }
            .tab-panel.active { display: flex; flex-direction: column; }

            .chat-area { flex: 1; overflow-y: auto; margin-bottom: 10px; }
            .chat-msg { padding: 8px 10px; margin-bottom: 8px; border-radius: 8px; border-left: 3px solid; }
            .chat-msg.user { border-left-color: #0af; background: rgba(0,170,255,0.1); }
            .chat-msg.ai { border-left-color: #0f6; background: rgba(0,255,100,0.1); }
            .msg-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .msg-sender { font-size: 11px; font-weight: bold; color: #0f6; }
            .msg-time { font-size: 10px; color: #888; }
            .msg-text { font-size: 13px; color: #fff; line-height: 1.4; }

            .chat-input-row { display: flex; gap: 8px; margin-bottom: 10px; }
            #chat-input { flex: 1; padding: 10px; background: rgba(0,0,0,0.5); border: 2px solid #0f6; border-radius: 5px; color: #fff; font-family: monospace; font-size: 13px; }
            #chat-input:focus { outline: none; border-color: #0ff; box-shadow: 0 0 10px rgba(0,255,100,0.3); }
            #chat-send { padding: 10px 20px; background: #0f6; color: #000; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
            #chat-send:hover { background: #0ff; }

            .quick-cmds { display: flex; gap: 8px; flex-wrap: wrap; }
            .quick-cmds button { padding: 8px 16px; background: rgba(0,255,100,0.1); border: 1px solid #0f6; border-radius: 5px; color: #0f6; font-size: 11px; cursor: pointer; transition: all 0.2s; }
            .quick-cmds button:hover { background: #0f6; color: #000; transform: translateY(-2px); }

            .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; }
            .stat { background: rgba(0,255,100,0.05); padding: 15px; border: 2px solid #0f6; border-radius: 8px; text-align: center; }
            .stat label { display: block; color: #0f6; font-size: 11px; margin-bottom: 8px; font-weight: bold; }
            .stat span { display: block; color: #0ff; font-size: 20px; font-weight: bold; }

            .log-area { height: 100%; overflow-y: auto; font-size: 12px; }
            .log-entry { padding: 4px 8px; margin-bottom: 4px; border-left: 2px solid #0f6; color: #0f6; }
        `;
        document.head.appendChild(style);
    }
};

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AILiveCam.init());
} else {
    AILiveCam.init();
}

window.AILiveCam = AILiveCam;
console.log('[AI Live Cam V2] Ready - Press F4');

})();
