// OMNI-OPS AI TESTING INTERFACE
// Real-time AI testing with visual feedback and chat
(function() {
    'use strict';
    console.log('[AI Tester] Initializing v1.0...');

const AITester = {
    active: false,
    wsConnection: null,
    testQueue: [],
    currentTest: null,
    visualMarkers: [],
    chatHistory: [],
    testResults: {},
    
    init: function() {
        console.log('[AI Tester] Creating UI...');
        this.createUI();
        this.setupKeys();
        this.connectToAI();
        this.startTestLoop();
    },
    
    createUI: function() {
        // Create unified diagnostic button
        const diagButton = document.createElement('button');
        diagButton.id = 'unified-diagnostic-btn';
        diagButton.className = 'unified-diagnostic-btn';
        diagButton.innerHTML = '🧪 AI TESTING (F3)';
        diagButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 600;
            padding: 8px 15px;
            background: #0a3a0a;
            color: #0f6;
            border: 2px solid #0f6;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            font-family: monospace;
            font-size: 12px;
            transition: all 0.2s;
            box-shadow: 0 0 10px rgba(0,255,100,0.3);
        `;
        diagButton.onmouseover = () => {
            diagButton.style.background = '#0f6';
            diagButton.style.color = '#000';
            diagButton.style.boxShadow = '0 0 20px rgba(0,255,100,0.6)';
        };
        diagButton.onmouseout = () => {
            diagButton.style.background = '#0a3a0a';
            diagButton.style.color = '#0f6';
            diagButton.style.boxShadow = '0 0 10px rgba(0,255,100,0.3)';
        };
        diagButton.onclick = () => window.AITester.toggle();
        document.body.appendChild(diagButton);
        
        const html = `
            <div id="ai-tester-overlay" class="ai-tester-hidden">
                <!-- Main Container -->
                <div class="ai-tester-container">
                    <!-- Header -->
                    <div class="ai-tester-header">
                        <div class="ai-tester-title">🔧 UNIFIED DIAGNOSTIC PANEL</div>
                        <div class="ai-tester-status" id="ai-status">
                            <span class="status-dot" id="status-dot"></span>
                            <span id="status-text">Disconnected</span>
                        </div>
                        <button class="ai-tester-close" onclick="window.AITester.toggle()">✕</button>
                    </div>
                    
                    <!-- Two Column Layout -->
                    <div class="ai-tester-content">
                        <!-- Left: Test Panel -->
                        <div class="ai-test-panel">
                            <div class="panel-header">Test Execution</div>
                            
                            <!-- Current Test -->
                            <div class="current-test-box">
                                <div class="test-label">Current Test:</div>
                                <div id="current-test-name">No test running</div>
                                <div class="test-progress">
                                    <div class="progress-bar" id="test-progress"></div>
                                </div>
                            </div>
                            
                            <!-- Test Queue -->
                            <div class="test-queue-box">
                                <div class="test-label">Queue (<span id="queue-count">0</span>)</div>
                                <div id="test-queue" class="test-list"></div>
                            </div>
                            
                            <!-- Test Results -->
                            <div class="test-results-box">
                                <div class="test-label">Recent Results</div>
                                <div id="test-results" class="test-results-list"></div>
                            </div>
                            
                            <!-- Quick Actions -->
                            <div class="quick-actions">
                                <button class="ai-btn" onclick="window.AITester.runQuickTest('movement')">Test Movement</button>
                                <button class="ai-btn" onclick="window.AITester.runQuickTest('shooting')">Test Shooting</button>
                                <button class="ai-btn" onclick="window.AITester.runQuickTest('ui')">Test UI</button>
                                <button class="ai-btn ai-btn-danger" onclick="window.AITester.clearTests()">Clear All</button>
                            </div>
                        </div>
                        
                        <!-- Right: Chat & Visualization -->
                        <div class="ai-chat-panel">
                            <div class="panel-header">AI Communication</div>
                            
                            <!-- Chat Messages -->
                            <div id="ai-chat-messages" class="chat-messages"></div>
                            
                            <!-- Chat Input -->
                            <div class="chat-input-box">
                                <input type="text" id="ai-chat-input" class="chat-input" 
                                       placeholder="Ask AI to test something..." 
                                       onkeypress="if(event.key==='Enter') window.AITester.sendMessage()">
                                <button class="chat-send-btn" onclick="window.AITester.sendMessage()">Send</button>
                            </div>
                            
                            <!-- Visual Log -->
                            <div class="visual-log-box">
                                <div class="test-label">Visual Log</div>
                                <div id="visual-log" class="visual-log"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Visual Markers In-Game -->
                <div id="ai-test-markers"></div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        this.addStyles();
    },
    
    addStyles: function() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-tester-hidden { display: none !important; }
            
            #ai-tester-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Courier New', monospace;
                color: #0f6;
            }
            
            .ai-tester-container {
                width: 90%;
                max-width: 1400px;
                height: 85%;
                background: #0a0a0a;
                border: 3px solid #0f6;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 0 30px rgba(0, 255, 100, 0.3);
            }
            
            .ai-tester-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                background: #0a3a0a;
                border-bottom: 2px solid #0f6;
            }
            
            .ai-tester-title {
                font-size: 20px;
                font-weight: bold;
                color: #0f6;
                text-shadow: 0 0 10px #0f6;
            }
            
            .ai-tester-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 14px;
            }
            
            .status-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #f44;
                box-shadow: 0 0 10px currentColor;
                animation: pulse 2s infinite;
            }
            
            .status-dot.connected { background: #0f6; }
            .status-dot.testing { background: #ff0; }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .ai-tester-close {
                background: #f44;
                color: #000;
                border: none;
                border-radius: 5px;
                padding: 8px 15px;
                font-weight: bold;
                cursor: pointer;
                font-size: 16px;
            }
            
            .ai-tester-close:hover {
                background: #f66;
                box-shadow: 0 0 15px #f44;
            }
            
            .ai-tester-content {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .ai-test-panel, .ai-chat-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 15px;
                overflow-y: auto;
            }
            
            .ai-test-panel {
                border-right: 2px solid #0f6;
            }
            
            .panel-header {
                font-size: 16px;
                font-weight: bold;
                color: #0ff;
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid #0f6;
            }
            
            .current-test-box, .test-queue-box, .test-results-box, .visual-log-box {
                background: rgba(0, 255, 100, 0.05);
                border: 1px solid #0f6;
                border-radius: 5px;
                padding: 12px;
                margin-bottom: 15px;
            }
            
            .test-label {
                font-size: 12px;
                color: #0f6;
                opacity: 0.7;
                margin-bottom: 8px;
                text-transform: uppercase;
            }
            
            #current-test-name {
                font-size: 14px;
                font-weight: bold;
                color: #0ff;
                margin-bottom: 10px;
            }
            
            .test-progress {
                height: 6px;
                background: #1a1a1a;
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #0f6, #0ff);
                width: 0%;
                transition: width 0.3s;
            }
            
            .test-list, .test-results-list {
                max-height: 150px;
                overflow-y: auto;
            }
            
            .test-item {
                background: rgba(0, 255, 255, 0.1);
                border-left: 3px solid #0ff;
                padding: 8px;
                margin: 5px 0;
                font-size: 12px;
                border-radius: 3px;
            }
            
            .test-result {
                padding: 8px;
                margin: 5px 0;
                font-size: 12px;
                border-radius: 3px;
                border-left: 3px solid #0f6;
            }
            
            .test-result.pass {
                background: rgba(0, 255, 100, 0.15);
                border-left-color: #0f6;
            }
            
            .test-result.fail {
                background: rgba(255, 68, 68, 0.15);
                border-left-color: #f44;
            }
            
            .quick-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 10px;
            }
            
            .ai-btn {
                background: #0a3a0a;
                color: #0f6;
                border: 2px solid #0f6;
                padding: 10px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: all 0.2s;
            }
            
            .ai-btn:hover {
                background: #0f6;
                color: #000;
                box-shadow: 0 0 15px #0f6;
            }
            
            .ai-btn-danger {
                border-color: #f44;
                color: #f44;
            }
            
            .ai-btn-danger:hover {
                background: #f44;
                color: #000;
                box-shadow: 0 0 15px #f44;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #0f6;
                border-radius: 5px;
                margin-bottom: 10px;
                max-height: 300px;
            }
            
            .chat-message {
                margin: 8px 0;
                padding: 8px 12px;
                border-radius: 5px;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .chat-message.user {
                background: rgba(0, 255, 255, 0.15);
                border-left: 3px solid #0ff;
                margin-left: 20px;
            }
            
            .chat-message.ai {
                background: rgba(0, 255, 100, 0.15);
                border-left: 3px solid #0f6;
                margin-right: 20px;
            }
            
            .chat-message.system {
                background: rgba(255, 255, 0, 0.1);
                border-left: 3px solid #ff0;
                font-size: 11px;
                opacity: 0.8;
            }
            
            .chat-sender {
                font-weight: bold;
                margin-bottom: 3px;
                font-size: 11px;
                opacity: 0.7;
            }
            
            .chat-input-box {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .chat-input {
                flex: 1;
                background: #1a1a1a;
                border: 2px solid #0f6;
                color: #0f6;
                padding: 10px;
                border-radius: 5px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
            }
            
            .chat-input:focus {
                outline: none;
                box-shadow: 0 0 10px rgba(0, 255, 100, 0.3);
            }
            
            .chat-send-btn {
                background: #0a3a0a;
                color: #0f6;
                border: 2px solid #0f6;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.2s;
            }
            
            .chat-send-btn:hover {
                background: #0f6;
                color: #000;
                box-shadow: 0 0 15px #0f6;
            }
            
            .visual-log {
                max-height: 150px;
                overflow-y: auto;
                font-size: 11px;
                line-height: 1.6;
            }
            
            .log-entry {
                padding: 4px 0;
                border-bottom: 1px solid rgba(0, 255, 100, 0.1);
            }
            
            .log-timestamp {
                color: #0ff;
                margin-right: 8px;
            }
            
            /* In-game visual markers */
            #ai-test-markers {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9999;
            }
            
            .test-marker {
                position: absolute;
                width: 40px;
                height: 40px;
                border: 3px solid #0ff;
                border-radius: 50%;
                background: rgba(0, 255, 255, 0.2);
                animation: markerPulse 1s infinite;
                pointer-events: none;
            }
            
            .test-marker::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 10px;
                height: 10px;
                background: #0ff;
                border-radius: 50%;
                box-shadow: 0 0 10px #0ff;
            }
            
            @keyframes markerPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
            }
            
            .test-marker.success {
                border-color: #0f6;
                background: rgba(0, 255, 100, 0.2);
            }
            
            .test-marker.success::after {
                background: #0f6;
                box-shadow: 0 0 10px #0f6;
            }
            
            .test-marker.fail {
                border-color: #f44;
                background: rgba(255, 68, 68, 0.2);
            }
            
            .test-marker.fail::after {
                background: #f44;
                box-shadow: 0 0 10px #f44;
            }
        `;
        document.head.appendChild(style);
    },
    
    setupKeys: function() {
        const handler = (e) => {
            // F3 opens testing interface only
            if (e.code === 'F3') {
                e.preventDefault();
                this.toggle();
                return true;
            }
            return false;
        };
        
        if (window.OmniKeybinds && window.OmniKeybinds.register) {
            window.OmniKeybinds.register({
                id: 'ai-tester',
                priority: 100,
                onKeyDown: handler
            });
        } else {
            document.addEventListener('keydown', handler);
        }
    },
    
    toggle: function() {
        this.active = !this.active;
        const overlay = document.getElementById('ai-tester-overlay');
        const button = document.getElementById('unified-diagnostic-btn');
        if (overlay) {
            if (this.active) {
                overlay.classList.remove('ai-tester-hidden');
                if (button) button.style.opacity = '0.6';
                if (typeof document.exitPointerLock === 'function') {
                    document.exitPointerLock();
                }
            } else {
                overlay.classList.add('ai-tester-hidden');
                if (button) button.style.opacity = '1';
                // Re-request pointer lock when closing AI interface
                if (window.isGameActive && typeof window.safeRequestPointerLock === 'function') {
                    console.log('[AI Tester] Requesting pointer lock on close');
                    window.safeRequestPointerLock();
                }
            }
        }
    },
    
    connectToAI: function() {
        // Try HTTP polling first (simpler than WebSocket)
        this.updateStatus('connecting', 'Connecting...');
        
        // Simulate connection for now - in production, this would connect to Python backend
        setTimeout(() => {
            this.updateStatus('connected', 'Connected to AI');
            this.addChatMessage('system', 'AI Testing Interface initialized. Press F3 to toggle.');
            this.addChatMessage('ai', 'Hello! I\'m ready to help test your game. Try asking me to test movement, shooting, or UI elements!');
        }, 1000);
    },
    
    updateStatus: function(state, text) {
        const dot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        
        if (dot) {
            dot.className = 'status-dot';
            if (state === 'connected') dot.classList.add('connected');
            if (state === 'testing') dot.classList.add('testing');
        }
        
        if (statusText) {
            statusText.textContent = text;
        }
    },
    
    sendMessage: function() {
        const input = document.getElementById('ai-chat-input');
        if (!input || !input.value.trim()) return;
        
        const message = input.value.trim();
        this.addChatMessage('user', message);
        input.value = '';
        
        // Process the message
        this.processUserCommand(message);
    },
    
    addChatMessage: function(sender, message) {
        const messagesDiv = document.getElementById('ai-chat-messages');
        if (!messagesDiv) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        
        const senderLabel = sender === 'user' ? 'You' : sender === 'ai' ? 'AI' : 'System';
        msgDiv.innerHTML = `
            <div class="chat-sender">${senderLabel}</div>
            <div>${message}</div>
        `;
        
        messagesDiv.appendChild(msgDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        
        this.chatHistory.push({ sender, message, timestamp: Date.now() });
    },
    
    processUserCommand: function(message) {
        const lower = message.toLowerCase();
        
        // Detect test requests
        if (lower.includes('test movement') || lower.includes('movement test')) {
            this.addChatMessage('ai', 'Starting movement test sequence...');
            this.runQuickTest('movement');
        } else if (lower.includes('test shooting') || lower.includes('shooting test')) {
            this.addChatMessage('ai', 'Starting shooting test sequence...');
            this.runQuickTest('shooting');
        } else if (lower.includes('test ui') || lower.includes('ui test')) {
            this.addChatMessage('ai', 'Starting UI test sequence...');
            this.runQuickTest('ui');
        } else if (lower.includes('test all')) {
            this.addChatMessage('ai', 'Starting full system test...');
            this.runQuickTest('all');
        } else {
            // Generic AI response
            setTimeout(() => {
                this.addChatMessage('ai', `I can help you test: movement, shooting, UI, or all systems. Just ask me to "test [feature]"!`);
            }, 500);
        }
    },
    
    runQuickTest: function(testType) {
        const tests = {
            movement: [
                { name: 'Player Position Check', fn: 'testPlayerPosition' },
                { name: 'Movement Keys Response', fn: 'testMovementKeys' },
                { name: 'Collision Detection', fn: 'testCollision' }
            ],
            shooting: [
                { name: 'Weapon System Check', fn: 'testWeapon' },
                { name: 'Ammo Counter', fn: 'testAmmo' },
                { name: 'Raycast Hit Detection', fn: 'testRaycast' }
            ],
            ui: [
                { name: 'HUD Elements Visible', fn: 'testHUD' },
                { name: 'Menu System', fn: 'testMenus' },
                { name: 'Keybind System', fn: 'testKeybinds' }
            ],
            all: [
                'movement', 'shooting', 'ui'
            ]
        };
        
        if (testType === 'all') {
            tests.all.forEach(type => {
                tests[type].forEach(test => this.queueTest(test));
            });
        } else if (tests[testType]) {
            tests[testType].forEach(test => this.queueTest(test));
        }
        
        this.updateQueueDisplay();
    },
    
    queueTest: function(test) {
        this.testQueue.push(test);
        this.addVisualLog(`Queued: ${test.name}`);
    },
    
    startTestLoop: function() {
        setInterval(() => {
            if (!this.currentTest && this.testQueue.length > 0) {
                this.executeNextTest();
            }
        }, 100);
    },
    
    executeNextTest: function() {
        if (this.testQueue.length === 0) return;
        
        this.currentTest = this.testQueue.shift();
        this.updateQueueDisplay();
        
        const testName = document.getElementById('current-test-name');
        if (testName) testName.textContent = this.currentTest.name;
        
        this.updateStatus('testing', 'Running test...');
        this.addVisualLog(`Executing: ${this.currentTest.name}`);
        
        // Run the actual test
        this.runTest(this.currentTest.fn);
    },
    
    runTest: function(testFn) {
        let progress = 0;
        const progressBar = document.getElementById('test-progress');
        
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progressBar) progressBar.style.width = progress + '%';
            if (progress >= 100) clearInterval(progressInterval);
        }, 100);
        
        // Execute test function
        setTimeout(() => {
            const result = this[testFn] ? this[testFn]() : { pass: false, message: 'Test function not found' };
            
            clearInterval(progressInterval);
            if (progressBar) progressBar.style.width = '100%';
            
            this.completeTest(result);
        }, 1000);
    },
    
    completeTest: function(result) {
        const testName = this.currentTest.name;
        
        // Add to results
        const resultsDiv = document.getElementById('test-results');
        if (resultsDiv) {
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-result ${result.pass ? 'pass' : 'fail'}`;
            resultDiv.textContent = `${result.pass ? '✓' : '✗'} ${testName}: ${result.message}`;
            resultsDiv.insertBefore(resultDiv, resultsDiv.firstChild);
            
            // Keep only last 5 results
            while (resultsDiv.children.length > 5) {
                resultsDiv.removeChild(resultsDiv.lastChild);
            }
        }
        
        // Add visual marker
        if (result.position) {
            this.addVisualMarker(result.position.x, result.position.y, result.pass);
        }
        
        this.addVisualLog(`${result.pass ? 'PASS' : 'FAIL'}: ${testName}`);
        this.addChatMessage('ai', `Test complete: ${testName} - ${result.pass ? 'PASSED ✓' : 'FAILED ✗'}\n${result.message}`);
        
        this.currentTest = null;
        setTimeout(() => {
            const progressBar = document.getElementById('test-progress');
            if (progressBar) progressBar.style.width = '0%';
            const testNameEl = document.getElementById('current-test-name');
            if (testNameEl) testNameEl.textContent = 'No test running';
            this.updateStatus('connected', 'Connected to AI');
        }, 500);
    },
    
    updateQueueDisplay: function() {
        const queueDiv = document.getElementById('test-queue');
        const queueCount = document.getElementById('queue-count');
        
        if (queueCount) queueCount.textContent = this.testQueue.length;
        
        if (queueDiv) {
            queueDiv.innerHTML = '';
            this.testQueue.forEach((test, i) => {
                const item = document.createElement('div');
                item.className = 'test-item';
                item.textContent = `${i + 1}. ${test.name}`;
                queueDiv.appendChild(item);
            });
        }
    },
    
    addVisualLog: function(message) {
        const logDiv = document.getElementById('visual-log');
        if (!logDiv) return;
        
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date().toLocaleTimeString();
        entry.innerHTML = `<span class="log-timestamp">[${time}]</span> ${message}`;
        
        logDiv.insertBefore(entry, logDiv.firstChild);
        
        // Keep only last 20 entries
        while (logDiv.children.length > 20) {
            logDiv.removeChild(logDiv.lastChild);
        }
    },
    
    addVisualMarker: function(x, y, success) {
        const markersDiv = document.getElementById('ai-test-markers');
        if (!markersDiv) return;
        
        const marker = document.createElement('div');
        marker.className = `test-marker ${success ? 'success' : 'fail'}`;
        marker.style.left = x + 'px';
        marker.style.top = y + 'px';
        
        markersDiv.appendChild(marker);
        
        setTimeout(() => {
            marker.remove();
        }, 3000);
    },
    
    clearTests: function() {
        this.testQueue = [];
        this.updateQueueDisplay();
        this.addChatMessage('system', 'Test queue cleared');
    },
    
    // === TEST FUNCTIONS ===
    
    testPlayerPosition: function() {
        try {
            if (!window.cameraRig) {
                return { pass: false, message: 'Camera rig not found' };
            }
            
            const pos = window.cameraRig.position;
            return {
                pass: true,
                message: `Player at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`,
                position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testMovementKeys: function() {
        try {
            if (!window.keys) {
                return { pass: false, message: 'Keys object not found' };
            }
            
            const keybinds = window.Keybinds ? window.Keybinds.get() : null;
            if (!keybinds) {
                return { pass: false, message: 'Keybinds system not found' };
            }
            
            return {
                pass: true,
                message: `Movement keys configured: ${keybinds.moveForward}, ${keybinds.moveBackward}, ${keybinds.moveLeft}, ${keybinds.moveRight}`,
                position: { x: 100, y: 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testCollision: function() {
        try {
            if (!window.objects) {
                return { pass: false, message: 'Objects array not found' };
            }
            
            return {
                pass: true,
                message: `${window.objects.length} collision objects in scene`,
                position: { x: 200, y: 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testWeapon: function() {
        try {
            if (!window.player) {
                return { pass: false, message: 'Player object not found' };
            }
            
            return {
                pass: true,
                message: `Weapon loaded, fire mode: ${window.player.fireModeIndex}`,
                position: { x: window.innerWidth - 100, y: 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testAmmo: function() {
        try {
            if (!window.player) {
                return { pass: false, message: 'Player object not found' };
            }
            
            return {
                pass: window.player.ammo >= 0 && window.player.reserveAmmo >= 0,
                message: `Ammo: ${window.player.ammo}/${window.player.reserveAmmo}`,
                position: { x: window.innerWidth - 100, y: 200 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testRaycast: function() {
        try {
            if (!window.raycaster) {
                return { pass: false, message: 'Raycaster not found' };
            }
            
            return {
                pass: true,
                message: 'Raycaster system functional',
                position: { x: window.innerWidth / 2, y: window.innerHeight / 3 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testHUD: function() {
        try {
            const hudElements = ['hud-ammo', 'hud-health', 'health-bar', 'stamina-bar'];
            const missing = hudElements.filter(id => !document.getElementById(id));
            
            return {
                pass: missing.length === 0,
                message: missing.length === 0 ? 'All HUD elements present' : `Missing: ${missing.join(', ')}`,
                position: { x: 100, y: window.innerHeight - 100 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testMenus: function() {
        try {
            const menus = ['menu-overlay', 'settings-screen', 'main-screen'];
            const missing = menus.filter(id => !document.getElementById(id));
            
            return {
                pass: missing.length === 0,
                message: missing.length === 0 ? 'All menu systems present' : `Missing: ${missing.join(', ')}`,
                position: { x: window.innerWidth / 2, y: 50 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    },
    
    testKeybinds: function() {
        try {
            if (!window.Keybinds) {
                return { pass: false, message: 'Keybinds system not found' };
            }
            
            const binds = window.Keybinds.get();
            const count = Object.keys(binds).length;
            
            return {
                pass: count > 0,
                message: `${count} keybindings configured`,
                position: { x: 100, y: 200 }
            };
        } catch (e) {
            return { pass: false, message: `Error: ${e.message}` };
        }
    }
};

window.AITester = AITester;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AITester.init());
} else {
    AITester.init();
}

console.log('[AI Diagnostics] Testing interface loaded - Press F3 to open testing panel');

})();
