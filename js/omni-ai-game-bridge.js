/**
 * AI Game Bridge - HTTP API for Python AI to control the game
 * Exposes the AIPlayerAPI methods via HTTP POST endpoints
 */

window.AIGameBridgeAPI = {
    /**
     * Set input action (button press/release)
     * POST /ai/setInput - { action: string, pressed: boolean }
     */
    async handleSetInput(action, pressed) {
        if (!window.AIPlayerAPI) {
            console.error('[AI Bridge] AIPlayerAPI not available');
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
     * Set camera look direction
     * POST /ai/setLook - { yaw: number, pitch: number }
     */
    async handleSetLook(yaw, pitch) {
        if (!window.AIPlayerAPI) {
            console.error('[AI Bridge] AIPlayerAPI not available');
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
     * Press a key once
     * POST /ai/pressKey - { action: string }
     */
    async handlePressKey(action) {
        if (!window.AIPlayerAPI) {
            console.error('[AI Bridge] AIPlayerAPI not available');
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
     * Release all inputs
     * POST /ai/releaseAll
     */
    async handleReleaseAll() {
        if (!window.AIPlayerAPI) {
            console.error('[AI Bridge] AIPlayerAPI not available');
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
     * POST /ai/activate
     */
    async handleActivate() {
        if (!window.AIPlayerAPI) {
            console.error('[AI Bridge] AIPlayerAPI not available');
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.activateAI();
            console.log(`[AI Bridge] activateAI()`);
            return { success: true, aiActive: true };
        } catch (e) {
            console.error('[AI Bridge] activate error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Deactivate AI mode
     * POST /ai/deactivate
     */
    async handleDeactivate() {
        if (!window.AIPlayerAPI) {
            console.error('[AI Bridge] AIPlayerAPI not available');
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            window.AIPlayerAPI.deactivateAI();
            console.log(`[AI Bridge] deactivateAI()`);
            return { success: true, aiActive: false };
        } catch (e) {
            console.error('[AI Bridge] deactivate error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Get current game state
     * GET /ai/gameState
     */
    getGameState() {
        if (!window.AIPlayerAPI) {
            return { success: false, error: 'AIPlayerAPI not available' };
        }
        
        try {
            const state = window.AIPlayerAPI.getGameState();
            return { success: true, ...state };
        } catch (e) {
            console.error('[AI Bridge] getGameState error:', e);
            return { success: false, error: e.message };
        }
    },
    
    /**
     * Check if AI is currently controlling
     * GET /ai/isControlling
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
    }
};

// Register HTTP handlers if game bridge server is available
if (window.setupHTTPHandlers) {
    window.setupHTTPHandlers({
        AI_SETINPUT: async (params) => window.AIGameBridgeAPI.handleSetInput(params.action, params.pressed),
        AI_SETLOOK: async (params) => window.AIGameBridgeAPI.handleSetLook(params.yaw, params.pitch),
        AI_PRESSKEY: async (params) => window.AIGameBridgeAPI.handlePressKey(params.action),
        AI_RELEASEALL: async () => window.AIGameBridgeAPI.handleReleaseAll(),
        AI_ACTIVATE: async () => window.AIGameBridgeAPI.handleActivate(),
        AI_DEACTIVATE: async () => window.AIGameBridgeAPI.handleDeactivate(),
        AI_GAMESTATE: () => window.AIGameBridgeAPI.getGameState(),
        AI_ISCONTROLLING: () => window.AIGameBridgeAPI.isControlling()
    });
}

console.log('[AI Bridge] Game Bridge API loaded and ready');
