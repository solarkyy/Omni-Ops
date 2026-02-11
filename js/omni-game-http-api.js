/**
 * Game HTTP API Server
 * Allows Python and external systems to communicate with the JavaScript game
 * Runs on port 3000
 */

window.GameHTTPAPI = {
    port: 3000,
    server: null,
    handlers: {},
    
    /**
     * Create a simple HTTP server for game API
     * This runs alongside the game in WebWorker or simple server
     */
    startServer() {
        // Try to start server via Node.js/Electron
        if (typeof require !== 'undefined') {
            try {
                const http = require('http');
                const url = require('url');
                
                this.server = http.createServer((req, res) => {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                    
                    if (req.method === 'OPTIONS') {
                        res.writeHead(200);
                        res.end();
                        return;
                    }
                    
                    const pathname = url.parse(req.url).pathname;
                    
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', () => {
                        let response = { error: 'Unknown endpoint' };
                        
                        try {
                            const data = body ? JSON.parse(body) : {};
                            
                            if (pathname === '/api/gameState' && req.method === 'GET') {
                                response = window.AIGameBridgeAPI.getGameState();
                            } else if (pathname === '/api/setInput' && req.method === 'POST') {
                                response = window.AIGameBridgeAPI.handleSetInput(data.action, data.pressed);
                            } else if (pathname === '/api/setLook' && req.method === 'POST') {
                                response = window.AIGameBridgeAPI.handleSetLook(data.yaw, data.pitch);
                            } else if (pathname === '/api/pressKey' && req.method === 'POST') {
                                response = window.AIGameBridgeAPI.handlePressKey(data.action);
                            } else if (pathname === '/api/releaseAll' && req.method === 'POST') {
                                response = window.AIGameBridgeAPI.handleReleaseAll();
                            } else if (pathname === '/api/activate' && req.method === 'POST') {
                                response = window.AIGameBridgeAPI.handleActivate();
                            } else if (pathname === '/api/deactivate' && req.method === 'POST') {
                                response = window.AIGameBridgeAPI.handleDeactivate();
                            } else if (pathname === '/api/isControlling' && req.method === 'GET') {
                                response = window.AIGameBridgeAPI.isControlling();
                            }
                        } catch (e) {
                            console.error('[GameAPI] Error:', e);
                            response = { error: e.message };
                        }
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(response));
                    });
                });
                
                this.server.listen(this.port, 'localhost', () => {
                    console.log(`[Game API] Server running on http://localhost:${this.port}`);
                });
            } catch (e) {
                console.log('[Game API] Node.js not available - using fetch API fallback');
            }
        } else {
            console.log('[Game API] Browser environment - using fetch API for communication');
        }
    }
};

// Start API server when game loads
window.addEventListener('load', () => {
    try {
        if (window.GameHTTPAPI && window.AIGameBridgeAPI) {
            window.GameHTTPAPI.startServer();
        }
    } catch (e) {
        console.log('[Game API] Could not start HTTP server:', e.message);
    }
});

console.log('[Game HTTP API] Loaded');
