// AI VISION & CONTROL INTEGRATION
// Connects game to AI perception/control system
// Captures screen frames and sends to Claude for analysis
// Receives input commands from AI to control player

(function() {
    'use strict';
    
    const AI_VISION_API = 'http://127.0.0.1:8081';
    const CAPTURE_INTERVAL = 500; // ms between frame captures
    
    window.AIVisionControl = {
        
        enabled: true,
        captureTimer: null,
        commandCheckTimer: null,
        renderer: null,
        
        async init() {
            console.log('[AI Vision] Initializing...');
            
            // Wait for game to be ready
            const waitForGame = setInterval(() => {
                if (window.renderer && window.player) {
                    clearInterval(waitForGame);
                    this.npstart();
                }
            }, 500);
        },
        
        start() {
            console.log('[AI Vision] Starting frame capture...');
            
            // Start periodic frame capture
            this.captureTimer = setInterval(() => {
                this.captureFrame();
            }, CAPTURE_INTERVAL);
            
            // Start checking for AI commands
            this.commandCheckTimer = setInterval(() => {
                this.checkForCommands();
            }, 100);
        },
        
        async captureFrame() {
            if (!this.enabled || !window.renderer) return;
            
            try {
                // Capture canvas as image
                const canvas = window.renderer.domElement;
                const imageData = canvas.toDataURL('image/png').split(',')[1];
                
                // Gather game state
                const gameInfo = {
                    player: {
                        health: window.player?.health || 100,
                        maxHealth: window.player?.maxHealth || 100,
                        position: window.cameraRig ? 
                            [window.cameraRig.position.x, window.cameraRig.position.y, window.cameraRig.position.z] :
                            [0, 0, 0],
                        velocity: window.player?.velocity ?
                            [window.player.velocity.x, window.player.velocity.y, window.player.velocity.z] :
                            [0, 0, 0],
                        onGround: window.player?.onGround || false,
                        sprinting: window.player?.isSprinting || false,
                        crouching: window.player?.isCrouching || false
                    },
                    weapon: {
                        ammo: window.player?.ammo || 0,
                        reserve: window.player?.reserveAmmo || 0,
                        fireMode: window.player?.fireModeIndex || 0
                    },
                    world: {
                        timeOfDay: window.gameState?.timeOfDay || 12,
                        objectCount: (window.objects || []).length,
                        aiUnitsCount: (window.aiUnits || []).length
                    }
                };
                
                // Send to AI
                const response = await fetch(`${AI_VISION_API}/api/vision/capture`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        frame: imageData,
                        game_info: gameInfo,
                        timestamp: Date.now()
                    })
                });
                
                if (!response.ok) {
                    console.warn('[AI Vision] Capture failed:', response.status);
                }
            } catch (e) {
                console.warn('[AI Vision] Capture error:', e.message);
            }
        },
        
        async checkForCommands() {
            if (!this.enabled || !window.player) return;
            
            try {
                const response = await fetch(`${AI_VISION_API}/api/control/next-commands`);
                const data = await response.json();
                
                if (data.commands && data.commands.length > 0) {
                    for (const cmd of data.commands) {
                        this.executeCommand(cmd);
                    }
                }
            } catch (e) {
                // Silent fail - AI not responding yet
            }
        },
        
        executeCommand(cmd) {
            if (!window.player || !window.keys) return;
            
            // Convert AI command to game input
            if (cmd.type === 'move') {
                this.movePlayer(cmd.direction, cmd.duration);
            } else if (cmd.type === 'action') {
                this.executeAction(cmd.action);
            } else if (cmd.type === 'look') {
                this.lookDirection(cmd.x, cmd.y);
            }
        },
        
        movePlayer(direction, duration = 0.5) {
            const keyMap = {
                'forward': 'w',
                'back': 's',
                'left': 'a',
                'right': 'd'
            };
            
            const key = keyMap[direction];
            if (!key) return;
            
            // Press key
            window.keys[key] = true;
            
            // Release after duration
            setTimeout(() => {
                window.keys[key] = false;
            }, duration * 1000);
        },
        
        executeAction(action) {
            const actions = {
                'jump': () => { window.keys[' '] = true; setTimeout(() => { window.keys[' '] = false; }, 100); },
                'sprint': () => { window.keys['shift'] = true; },
                'crouch': () => { window.keys['ctrl'] = true; },
                'stop_sprint': () => { window.keys['shift'] = false; },
                'stop_crouch': () => { window.keys['ctrl'] = false; },
                'shoot': () => { window.keys['mouse0'] = true; setTimeout(() => { window.keys['mouse0'] = false; }, 50); },
                'reload': () => { window.keys['r'] = true; setTimeout(() => { window.keys['r'] = false; }, 100); },
                'look_up': () => { this.lookDirection(0, -0.3); },
                'look_down': () => { this.lookDirection(0, 0.3); },
                'look_left': () => { this.lookDirection(-0.3, 0); },
                'look_right': () => { this.lookDirection(0.3, 0); },
                'look_around': () => { 
                    this.lookDirection(0.2, 0.1); 
                    setTimeout(() => this.lookDirection(-0.4, -0.2), 200);
                    setTimeout(() => this.lookDirection(0.2, 0.1), 400);
                },
                'wait_1_second': () => { /* Just wait */ },
                'wait_2_seconds': () => { /* Just wait */ },
                'check_health': () => { 
                    console.log(`[AI] Current health: ${window.player?.health || 100}`); 
                }
            };
            
            const fn = actions[action];
            if (fn) fn();
        },
        
        lookDirection(dx, dy) {
            if (!window.player) return;
            
            // Apply mouse movement to camera
            const sensitivity = 0.002;
            window.player.yaw += dx * sensitivity * 1000;
            window.player.pitch += dy * sensitivity * 1000;
            
            // Clamp pitch
            window.player.pitch = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, window.player.pitch));
        },
        
        // Testing interface
        async requestAnalysis() {
            try {
                const response = await fetch(`${AI_VISION_API}/api/vision/analyze`, {
                    method: 'POST'
                });
                const data = await response.json();
                console.log('[AI Analysis]:', data.analysis);
                return data.analysis;
            } catch (e) {
                console.error('Analysis failed:', e);
            }
        },
        
        async startFeatureTest(featureName, featureCode) {
            try {
                const response = await fetch(`${AI_VISION_API}/api/test/start-feature-test`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        feature_name: featureName,
                        feature_code: featureCode
                    })
                });
                const data = await response.json();
                console.log('[AI Test Started]:', data);
                return data;
            } catch (e) {
                console.error('Test start failed:', e);
            }
        }
    };
    
    // Auto-initialize when document ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AIVisionControl.init());
    } else {
        window.AIVisionControl.init();
    }
    
    console.log('[AI Vision] Integration loaded - awaiting game start...');
    
})();
