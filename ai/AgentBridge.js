/**
 * Agent Bridge - Connects external reasoning layers (LLM/Copilot) to IntelligentAgent
 * 
 * DEV-ONLY MODE: Opt-in bridge for external tool integration
 * 
 * ============================================================================
 * EXTERNAL TOOL USAGE
 * ============================================================================
 * 
 * 1. SEND COMMANDS (from external AI/LLM):
 *    window.AgentBridge.enqueueCommand('move forward');
 *    window.AgentBridge.enqueueCommand('look up and jump');
 *    window.AgentBridge.enqueueCommand('reload weapon');
 *    
 *    The command text is forwarded to IntelligentAgent.onCommand() and logged
 *    to the AI Dev Log with timestamp. Returns { ok: boolean, message: string }.
 * 
 * 2. READ STATE SNAPSHOT (to inform LLM decisions):
 *    const snapshot = window.AgentBridge.exportSnapshot();
 *    console.log(JSON.stringify(snapshot, null, 2));
 *    
 *    Snapshot structure:
 *    {
 *      playerState: {
 *        position: { x, y, z },
 *        health, ammo, stamina, mode,
 *        isAiming, isReloading
 *      },
 *      sectorState: {
 *        currentSectorId,
 *        isInSafeZone,
 *        isInCorruptedZone,
 *        areaLabel
 *      },
 *      aiContext: {
 *        status,
 *        loadedAt,
 *        files: [ { name, excerpt, truncated, length } ]
 *      },
 *      recentActions: [
 *        { time: "12:34:56", message: "Command: status", level: "info" },
 *        { time: "12:34:57", message: "Moved forward", level: "info" },
 *        ...
 *      ],
 *      bridgeReady: true
 *    }
 * 
 * RECOMMENDED WORKFLOW:
 * - External AI reads exportSnapshot()
 * - Analyzes game state & recent actions
 * - Formulates natural language command
 * - Sends via enqueueCommand()
 * - Loop back to read next state
 * 
 * ============================================================================
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        maxOutputEntries: 8,  // Return last N log entries in snapshot
        enabled: true,
        devMode: true
    };

    const AI_CONTEXT_CONFIG = {
        enabled: true,
        baseUrl: 'http://127.0.0.1:8080/ai_context',
        refreshIntervalMs: 5 * 60 * 1000,
        maxCharsPerFile: 4000,
        files: [
            'README.md',
            'Ai Context.txt',
            'AI Vision and systems.txt',
            'Omni\u2011Ops \u2013 Self\u2011Improving AI Developer Loop.txt',
            'coding_standards.md',
            'common_patterns.md',
            'advanced_patterns.md',
            'ai_behaviors.md',
            'game_architecture.md',
            'error_recovery.md',
            'feature_requests.md',
            'feature_templates.md'
        ]
    };

    const AgentBridge = {
        _aiContextCache: null,
        _aiContextPromise: null,
        _aiContextError: null,
        /**
         * Check if bridge is properly initialized
         */
        isReady() {
            return CONFIG.enabled && window.IntelligentAgent && window.AIPlayerAPI;
        },

        /**
         * Forward a natural-language command to IntelligentAgent
         * Logs the command to AI Dev Log with timestamp
         * 
         * @param {string} commandText - Natural language instruction (e.g., "move forward")
         * @returns {object} { ok: boolean, message: string, result?: any }
         */
        enqueueCommand(commandText) {
            if (!this.isReady()) {
                const msg = 'AgentBridge not ready - IntelligentAgent or AIPlayerAPI missing';
                console.warn('[AgentBridge]', msg);
                return { ok: false, message: msg };
            }

            const cmd = (commandText || '').trim();
            if (!cmd) {
                return { ok: false, message: 'Empty command text' };
            }

            // Log to AI Dev Log first
            if (CONFIG.devMode) {
                console.log(`[AgentBridge] Enqueueing: "${cmd}"`);
            }

            // Forward to IntelligentAgent's command handler
            try {
                const result = window.IntelligentAgent.onCommand(cmd);
                return {
                    ok: result?.ok !== false,
                    message: result?.message || 'Command processed',
                    result: result
                };
            } catch (err) {
                const errMsg = `Command processing error: ${err.message}`;
                console.error('[AgentBridge]', errMsg);
                if (window.IntelligentAgent) {
                    window.IntelligentAgent.logThought(errMsg, 'error');
                }
                return { ok: false, message: errMsg };
            }
        },

        /**
         * Export a compact snapshot of current game state + recent AI actions
         * Suitable for feeding back to external LLM/reasoning layer
         * 
         * @returns {object} Compact state snapshot with game data + log entries
         */
        exportSnapshot() {
            if (!this.isReady()) {
                return {
                    error: 'AgentBridge not ready',
                    bridgeReady: false
                };
            }

            // Get current game state from AIPlayerAPI
            const gameState = window.AIPlayerAPI.getGameState();
            if (!gameState) {
                return {
                    error: 'Game not active',
                    bridgeReady: false
                };
            }

            // Extract recent AI Dev Log entries
            const recentActions = (window.IntelligentAgent.thoughts || [])
                .slice(0, CONFIG.maxOutputEntries)
                .map(entry => ({
                    time: entry.time || 'unknown',
                    message: entry.message || '',
                    level: entry.level || 'info'
                }));

            this.ensureAIContext();

            // Compile compact snapshot
            const sectorState = window.IntelligentAgent?.getSectorContext
                ? window.IntelligentAgent.getSectorContext(gameState)
                : null;
            const snapshot = {
                timestamp: new Date().toISOString(),
                playerState: {
                    position: gameState.position || { x: 0, y: 0, z: 0 },
                    yaw: gameState.yaw,
                    pitch: gameState.pitch,
                    health: gameState.health,
                    ammo: gameState.ammo,
                    reserveAmmo: gameState.reserveAmmo,
                    stamina: gameState.stamina,
                    mode: gameState.mode,
                    isAiming: gameState.isAiming,
                    isReloading: gameState.isReloading
                },
                sectorState: sectorState ? {
                    currentSectorId: sectorState.currentSectorId,
                    isInSafeZone: sectorState.isInSafeZone,
                    isInCorruptedZone: sectorState.isInCorruptedZone,
                    areaLabel: sectorState.areaLabel
                } : null,
                aiContext: this.getAIContextSnapshot(),
                agentState: {
                    enabled: window.IntelligentAgent?.enabled || false,
                    currentMode: window.IntelligentAgent?.currentMode || 'unknown',
                    currentObjective: window.IntelligentAgent?.currentObjective || null
                },
                recentActions: recentActions,
                bridgeReady: true
            };

            return snapshot;
        },

        /**
         * Pretty-print snapshot to console (for debugging)
         */
        debugPrintSnapshot() {
            const snapshot = this.exportSnapshot();
            console.group('[AgentBridge] Game State Snapshot');
            console.log(JSON.stringify(snapshot, null, 2));
            console.groupEnd();
        },

        /**
         * Check status of bridge and dependencies
         */
        status() {
            const status = {
                bridgeReady: this.isReady(),
                intelligentAgentReady: !!window.IntelligentAgent,
                aiPlayerAPIReady: !!window.AIPlayerAPI,
                gameActive: window.AIPlayerAPI?.getGameState() !== null,
                devMode: CONFIG.devMode,
                aiContextStatus: this.getAIContextSnapshot()?.status || 'disabled'
            };
            console.table(status);
            return status;
        },

        getAIContextSnapshot() {
            if (!AI_CONTEXT_CONFIG.enabled) {
                return { status: 'disabled', loadedAt: null, files: [] };
            }

            if (this._aiContextCache) {
                return {
                    status: 'ready',
                    loadedAt: this._aiContextCache.loadedAt,
                    files: this._aiContextCache.files
                };
            }

            if (this._aiContextPromise) {
                return { status: 'loading', loadedAt: null, files: [] };
            }

            if (this._aiContextError) {
                return { status: 'error', loadedAt: null, files: [], error: this._aiContextError };
            }

            return { status: 'idle', loadedAt: null, files: [] };
        },

        ensureAIContext() {
            if (!AI_CONTEXT_CONFIG.enabled) return;

            const now = Date.now();
            const cachedAt = this._aiContextCache?.loadedAt ? Date.parse(this._aiContextCache.loadedAt) : 0;
            const cacheFresh = cachedAt && (now - cachedAt < AI_CONTEXT_CONFIG.refreshIntervalMs);

            if (cacheFresh || this._aiContextPromise) return;

            this._aiContextPromise = this.loadAIContext()
                .catch((err) => {
                    this._aiContextError = err?.message || String(err);
                })
                .finally(() => {
                    this._aiContextPromise = null;
                });
        },

        async loadAIContext() {
            const baseUrl = (AI_CONTEXT_CONFIG.baseUrl || '').replace(/\/$/, '');
            const files = AI_CONTEXT_CONFIG.files || [];

            if (!baseUrl || files.length === 0) return;

            const fetches = files.map(async (name) => {
                const url = `${baseUrl}/${encodeURIComponent(name)}`;
                const response = await fetch(url, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`Context fetch failed for ${name}: ${response.status}`);
                }
                const text = await response.text();
                const trimmed = text.slice(0, AI_CONTEXT_CONFIG.maxCharsPerFile);
                return {
                    name,
                    excerpt: trimmed,
                    truncated: text.length > trimmed.length,
                    length: text.length
                };
            });

            const filesData = await Promise.all(fetches);
            this._aiContextCache = {
                loadedAt: new Date().toISOString(),
                files: filesData
            };
            this._aiContextError = null;
            if (window.IntelligentAgent?.setExternalContext) {
                window.IntelligentAgent.setExternalContext(this._aiContextCache);
            }
        }
    };

    // Expose to global scope
    window.AgentBridge = AgentBridge;

    // Log initialization
    if (CONFIG.devMode) {
        console.log('[AgentBridge] Initialized. Call window.AgentBridge.status() for info.');
    }

    // Hook into IntelligentAgent initialization to ensure proper load order
    const originalInit = window.IntelligentAgent?.init;
    if (originalInit) {
        window.IntelligentAgent.init = function() {
            const result = originalInit.call(this);
            if (CONFIG.devMode && AgentBridge.isReady()) {
                console.log('[AgentBridge] Ready for external integration');
            }
            return result;
        };
    }
})();
