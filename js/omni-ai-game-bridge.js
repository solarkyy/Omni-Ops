/**
 * AI Game Bridge - Exposes AIPlayerAPI to external systems
 * Allows Python scripts and HTTP requests to control the game
 */

window.AIGameBridgeAPI = {
    /**
     * Handle set input command
     */
    handleSetInput(action, pressed) {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.setInput(action, pressed);
            console.log(`[AI Bridge] setInput('${action}', ${pressed})`);
            return { success: true, action, pressed };
        } catch (e) {
            console.error('[AI Bridge] setInput error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Handle set look direction
     */
    handleSetLook(yaw, pitch) {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.setLook(yaw, pitch);
            console.log(`[AI Bridge] setLook(${yaw.toFixed(3)}, ${pitch.toFixed(3)})`);
            return { success: true, yaw, pitch };
        } catch (e) {
            console.error('[AI Bridge] setLook error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Handle press key
     */
    handlePressKey(action) {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.pressKey(action);
            console.log(`[AI Bridge] pressKey('${action}')`);
            return { success: true, action };
        } catch (e) {
            console.error('[AI Bridge] pressKey error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Handle release all inputs
     */
    handleReleaseAll() {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.releaseAllInputs();
            console.log(`[AI Bridge] releaseAllInputs()`);
            return { success: true };
        } catch (e) {
            console.error('[AI Bridge] releaseAll error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Activate AI mode
     */
    handleActivate() {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.activateAI();
            console.log(`[AI Bridge] ✓ AI activated`);
            return { success: true, aiActive: true };
        } catch (e) {
            console.error('[AI Bridge] activate error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Deactivate AI mode
     */
    handleDeactivate() {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.deactivateAI();
            console.log(`[AI Bridge] AI deactivated`);
            return { success: true, aiActive: false };
        } catch (e) {
            console.error('[AI Bridge] deactivate error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Get current game state
     */
    getGameState() {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            const state = window.AIPlayerAPI.getGameState();
            if (!state) {
                return { success: false, error: 'Game not active' };
            }
            return { success: true, ...state };
        } catch (e) {
            console.error('[AI Bridge] getGameState error:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Spawn a test bot at a position
     */
    handleSpawnTestBotAt(x, y, z) {
        if (!window.AIPlayerAPI || typeof window.AIPlayerAPI.spawnTestBotAt !== 'function') {
            return { success: false, error: 'AIPlayerAPI.spawnTestBotAt not available' };
        }
        try {
            const result = window.AIPlayerAPI.spawnTestBotAt(x, y, z);
            console.log('[AI Bridge] spawnTestBotAt', result);
            return result;
        } catch (e) {
            console.error('[AI Bridge] spawnTestBotAt error:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Run a path test by routeId
     */
    handleRunPathTest(routeId) {
        if (!window.AIPlayerAPI || typeof window.AIPlayerAPI.runPathTest !== 'function') {
            return { success: false, error: 'AIPlayerAPI.runPathTest not available' };
        }
        try {
            const result = window.AIPlayerAPI.runPathTest(routeId);
            console.log('[AI Bridge] runPathTest', result);
            return result;
        } catch (e) {
            console.error('[AI Bridge] runPathTest error:', e);
            return { success: false, error: e.message };
        }
    },

    /**
     * Run Chapter 1 story startup smoke test
     */
    handleRunStoryStartupSmokeTest(options = {}) {
        if (!window.AIPlayerAPI || typeof window.AIPlayerAPI.runStoryStartupSmokeTest !== 'function') {
            return { success: false, error: 'AIPlayerAPI.runStoryStartupSmokeTest not available' };
        }
        return window.AIPlayerAPI.runStoryStartupSmokeTest(options)
            .then((result) => {
                console.log('[AI Bridge] runStoryStartupSmokeTest', result);
                return result;
            })
            .catch((e) => {
                console.error('[AI Bridge] runStoryStartupSmokeTest error:', e);
                return { success: false, error: e.message };
            });
    },
    
    /**
     * Check if AI is controlling
     */
    isControlling() {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            const controlling = window.AIPlayerAPI.isAIControlling();
            return { success: true, isControlling: controlling };
        } catch (e) {
            console.error('[AI Bridge] isControlling error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Wait for APIto be available
     */
    waitForAPI(maxWait = 30000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkInterval = setInterval(() => {
                if (typeof window.AIPlayerAPI !== 'undefined') {
                    clearInterval(checkInterval);
                    console.log('[AI Bridge] ✓ AIPlayerAPI available after', Date.now() - startTime, 'ms');
                    resolve(true);
                } else if (Date.now() - startTime > maxWait) {
                    clearInterval(checkInterval);
                    console.warn('[AI Bridge] ⚠️ APIPlayerAPI timeout after', maxWait, 'ms');
                    resolve(false);
                }
            }, 100);
        });
    },
    
    /**
     * Get API status (for diagnostics)
     */
    getStatus() {
        return {
            apiAvailable: typeof window.AIPlayerAPI !== 'undefined',
            isInitialized: typeof window.AIPlayerAPI === 'object',
            timestamp: new Date().toISOString()
        };
    }
};

// Add initialization guard
window.AIGameBridgeReady = null;
window.AIGameBridgeAPI.waitForAPI().then((ready) => {
    window.AIGameBridgeReady = ready;
    console.log('[AI Game Bridge] Ready state:', ready);
});

console.log('[AI Game Bridge] ✓ API loaded and ready');
