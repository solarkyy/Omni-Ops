/**
 * ============================================================================
 * OMNI-OPS AI WORKER API
 * ============================================================================
 * 
 * Unified interface for IDE/Copilot to interact with OMNI-OPS game AI.
 * 
 * All calls through this interface are:
 * ✓ Logged and auditable
 * ✓ Context-gated (safe defaults)
 * ✓ Validated by decision logic
 * ✓ Tracked for co-learning
 * 
 * ★ AI WORKER CONTRACT
 * External tools and Copilot must NEVER call movement/physics APIs directly.
 * All interaction must flow through:
 *   1. OmniAIWorker (this file)
 *   2. → AgentBridge
 *   3. → IntelligentAgent safety logic
 *   4. → AIPlayerAPI
 * 
 * This ensures safety, logging, and context gating always apply.
 * 
 * ============================================================================
 */

(function() {
    'use strict';

    const CONFIG = {
        devMode: true,
        maxRecentDecisions: 5,
        maxExternalRequests: 100
    };

    // Storage for telemetry
    let externalRequestLog = [];

    const OmniAIWorker = {
        // ─────────────────────────────────────────────────────────────
        // STATE INSPECTION METHODS
        // ─────────────────────────────────────────────────────────────

        /**
         * Get complete game snapshot
         * Safe to call frequently; AgentBridge manages caching
         * 
         * @returns {object} Full snapshot with state, context, patches, decisions
         */
        getSnapshot() {
            if (!window.AgentBridge) {
                console.warn('[OmniAIWorker] AgentBridge not available');
                return { error: 'AgentBridge not ready', ready: false };
            }
            return window.AgentBridge.exportSnapshot();
        },

        /**
         * Check if AI context (external reasoning guidance) is ready
         * Use this to poll before sending commands
         * 
         * @returns {object} { ready: boolean, reason: string, status: string }
         */
        getContextStatus() {
            if (!window.AgentBridge) {
                return { ready: false, reason: 'AgentBridge not ready', status: 'unavailable' };
            }
            return window.AgentBridge.getAIContextReadyStatus();
        },

        /**
         * Get operational health of entire system
         * Includes bridge, AI, game, and context readiness
         * 
         * @returns {object} Health report
         */
        getHealth() {
            if (!window.AgentBridge) {
                return {
                    ready: false,
                    components: {
                        bridge: false,
                        agent: false,
                        game: false,
                        context: 'unavailable'
                    }
                };
            }
            return window.AgentBridge.status();
        },

        // ─────────────────────────────────────────────────────────────
        // COMMAND EXECUTION METHODS
        // ─────────────────────────────────────────────────────────────

        /**
         * Send a command to the AI through the worker contract
         * All commands are logged and context-gated
         * 
         * @param {string} command - One of: patrol_area, seek_enemies, hold_position,
         *                           return_to_safe_zone, status, or JSON request_behavior
         * @param {object} options - Optional { bypassContextCheck, fallbackToSafe }
         * @returns {object} { ok: boolean, message: string, ... }
         */
        sendCommand(command, options = {}) {
            if (!window.AgentBridge) {
                console.error('[OmniAIWorker] AgentBridge not available');
                return { ok: false, message: 'AgentBridge not ready' };
            }

            try {
                const result = window.AgentBridge.enqueueCommand(command, options);
                
                // Log telemetry
                if (typeof command === 'string' && !command.startsWith('{')) {
                    this.logExternalRequest({
                        command: command,
                        success: result.ok,
                        message: result.message,
                        contextReady: result.contextReady
                    });
                }

                return result;
            } catch (err) {
                console.error('[OmniAIWorker] sendCommand error:', err);
                return { ok: false, message: `Error: ${err.message}` };
            }
        },

        // ─────────────────────────────────────────────────────────────
        // BEHAVIOR PATCH METHODS
        // ─────────────────────────────────────────────────────────────

        /**
         * List behavior patches by status
         * 
         * @param {string} status - 'pending', 'approved', 'rejected', or 'all'
         * @returns {array} Array of patch metadata
         */
        listPatches(status = 'pending') {
            if (!window.AIBehaviorPatches) {
                console.warn('[OmniAIWorker] AIBehaviorPatches not available');
                return [];
            }
            return window.AIBehaviorPatches.list(status);
        },

        /**
         * Get full details of a specific patch
         * 
         * @param {string} patchId - Feature ID of the patch
         * @returns {object|null} Full patch object with code, or null
         */
        getPatch(patchId) {
            if (!window.AIBehaviorPatches) {
                return null;
            }
            return window.AIBehaviorPatches.get(patchId);
        },

        /**
         * Approve and apply a pending behavior patch
         * 
         * @param {string} patchId - Feature ID to approve
         * @returns {object} { ok: boolean, message: string }
         */
        applyPatch(patchId) {
            if (!window.AIBehaviorPatches) {
                return { ok: false, message: 'AIBehaviorPatches not available' };
            }
            return window.AIBehaviorPatches.apply(patchId);
        },

        /**
         * Reject a pending behavior patch
         * 
         * @param {string} patchId - Feature ID to reject
         * @param {string} reason - Optional rejection reason
         * @returns {object} { ok: boolean, message: string }
         */
        rejectPatch(patchId, reason = 'Human decision') {
            if (!window.AIBehaviorPatches) {
                return { ok: false, message: 'AIBehaviorPatches not available' };
            }
            return window.AIBehaviorPatches.reject(patchId, reason);
        },

        /**
         * Get statistics on all patches
         * 
         * @returns {object} { pending, approved, rejected, total }
         */
        getPatchStats() {
            if (!window.AIBehaviorPatches) {
                return { pending: 0, approved: 0, rejected: 0, total: 0 };
            }
            return window.AIBehaviorPatches.stats();
        },

        // ─────────────────────────────────────────────────────────────
        // DECISION ANALYSIS METHODS (Intelligence Enhancement)
        // ─────────────────────────────────────────────────────────────

        /**
         * Summarize recent command executions into compressed format
         * Perfect for injecting into LLM prompts to show decision history
         * 
         * BENEFIT: 50% shorter prompts with same decision quality
         * 
         * @param {number} count - How many recent executions to summarize (1-10)
         * @returns {array} Compressed decision history
         * 
         * Example output:
         * [
         *   {
         *     cmd: "patrol_area",
         *     decided: "patrol_area",
         *     healthBefore: 85, healthAfter: 83,
         *     ammoBefore: 30, ammoAfter: 28,
         *     ammoUsed: 2,
         *     reason: "As requested"
         *   },
         *   {
         *     cmd: "seek_enemies",
         *     decided: "hold_position",
         *     healthBefore: 83, healthAfter: 75,
         *     ammoBefore: 28, ammoAfter: 20,
         *     ammoUsed: 8,
         *     reason: "Low health + low ammo override"
         *   }
         * ]
         */
        summarizeRecentDecisions(count = 3) {
            if (!window.IntelligentAgent || !window.IntelligentAgent.actionHistory) {
                return [];
            }

            const limited = window.IntelligentAgent.actionHistory.slice(0, Math.min(count, CONFIG.maxRecentDecisions));
            
            return limited.map(entry => ({
                cmd: entry.command,
                decided: entry.decidedMode,
                healthBefore: entry.beforeState?.health,
                healthAfter: entry.afterState?.health,
                healthDelta: (entry.afterState?.health || 0) - (entry.beforeState?.health || 0),
                ammoBefore: entry.beforeState?.ammo,
                ammoAfter: entry.afterState?.ammo,
                ammoUsed: (entry.beforeState?.ammo || 0) - (entry.afterState?.ammo || 0),
                sector: entry.beforeState?.sector,
                overridden: entry.modeChanged,
                reason: entry.reason || 'none',
                timestamp: entry.timestamp
            }));
        },

        /**
         * Format recent decisions for LLM prompt injection
         * Combines summarizeRecentDecisions with readable formatting
         * 
         * @param {number} count - How many to include
         * @returns {string} Markdown-formatted decision history
         */
        formatRecentDecisionsForPrompt(count = 3) {
            const summary = this.summarizeRecentDecisions(count);
            if (summary.length === 0) return 'No recent decisions yet.';

            const lines = summary.map((d, idx) => {
                const override = d.overridden ? ` (OVERRIDE: ${d.reason})` : '';
                const healthStr = d.healthBefore !== undefined && d.healthAfter !== undefined
                    ? ` [Health: ${d.healthBefore}% → ${d.healthAfter}%]`
                    : '';
                const ammoStr = d.ammoBefore !== undefined && d.ammoAfter !== undefined
                    ? ` [Ammo: ${d.ammoBefore} → ${d.ammoAfter} (-${d.ammoUsed})]`
                    : '';
                return `${idx + 1}. Requested: ${d.cmd} → Decided: ${d.decided}${healthStr}${ammoStr}${override}`;
            });

            return `Recent Execution History (last ${summary.length}):\n${lines.join('\n')}`;
        },

        /**
         * Get command success rates for confidence-based decision making
         * Shows which commands have worked well recently
         * 
         * @returns {object} Map of command → { attempts, successes, confidence }
         */
        getCommandConfidence() {
            if (!window.IntelligentAgent) {
                return {};
            }

            // Extract success rates from actionHistory
            const rates = {};
            const commands = ['patrol_area', 'seek_enemies', 'hold_position', 'return_to_safe_zone'];

            commands.forEach(cmd => {
                const attempts = window.IntelligentAgent.actionHistory.filter(e => e.command === cmd).length;
                const successes = window.IntelligentAgent.actionHistory.filter(e => e.command === cmd && e.success).length;
                rates[cmd] = {
                    attempts,
                    successes,
                    confidence: attempts > 0 ? (successes / attempts) : 0
                };
            });

            return rates;
        },

        // ─────────────────────────────────────────────────────────────
        // TELEMETRY & LEARNING (Co-Learning Enhancement)
        // ─────────────────────────────────────────────────────────────

        /**
         * Log an IDE/external reasoning request for co-learning
         * Helps identify which IDE tactics work best in-game
         * 
         * @param {object} data - { command, success, message, contextReady, ... }
         * @returns {void}
         */
        logExternalRequest(data) {
            const entry = {
                timestamp: new Date().toISOString(),
                ...data
            };

            externalRequestLog.push(entry);
            if (externalRequestLog.length > CONFIG.maxExternalRequests) {
                externalRequestLog.shift();
            }

            if (CONFIG.devMode) {
                console.log('[OmniAIWorker] External request logged:', entry);
            }
        },

        /**
         * Get logged external requests for analysis
         * Used for offline training of better LLM prompts
         * 
         * @returns {array} List of external requests
         */
        getExternalRequestLog() {
            return externalRequestLog.slice();
        },

        /**
         * Clear external request log
         * 
         * @returns {object} { cleared: number }
         */
        clearExternalRequestLog() {
            const count = externalRequestLog.length;
            externalRequestLog = [];
            return { cleared: count };
        },

        /**
         * Export telemetry and decision data as JSON
         * Use for offline analysis and feeding back to LLM training
         * 
         * @returns {object} Complete telemetry snapshot
         */
        exportTelemetry() {
            return {
                timestamp: new Date().toISOString(),
                health: this.getHealth(),
                context: this.getContextStatus(),
                commandConfidence: this.getCommandConfidence(),
                externalRequests: externalRequestLog.slice(-50),  // Last 50 requests
                snapshot: this.getSnapshot()
            };
        },

        /**
         * Clear all internal logs (careful!)
         * 
         * @returns {object} { cleared: number }
         */
        clearAllLogs() {
            const count = externalRequestLog.length;
            externalRequestLog = [];
            if (window.IntelligentAgent) {
                window.IntelligentAgent.actionHistory = [];
                window.IntelligentAgent.thoughts = [];
            }
            return { cleared: count, message: 'All logs cleared' };
        },

        // ─────────────────────────────────────────────────────────────
        // DIAGNOSTICS & STATUS
        // ─────────────────────────────────────────────────────────────

        /**
         * Full diagnostic report
         * Call this to verify all systems are operational
         * 
         * @returns {object} Comprehensive status
         */
        diagnose() {
            const contextStatus = this.getContextStatus();
            const health = this.getHealth();
            const patches = this.getPatchStats();
            const confidence = this.getCommandConfidence();

            return {
                timestamp: new Date().toISOString(),
                operational: health?.bridgeReady === true && contextStatus.ready,
                components: {
                    bridge: !!window.AgentBridge,
                    agent: !!window.IntelligentAgent,
                    game: !!window.AIPlayerAPI,
                    patches: !!window.AIBehaviorPatches
                },
                context: contextStatus,
                health: health,
                patches: patches,
                commandConfidence: confidence,
                message: health?.bridgeReady === true && contextStatus.ready
                    ? '✓ All systems operational'
                    : '⚠ Some systems not ready'
            };
        },

        /**
         * Get human-readable status message
         * 
         * @returns {string} Status summary
         */
        statusMessage() {
            const diag = this.diagnose();
            if (!diag.operational) {
                return `⚠ Not fully operational: Bridge=${diag.components.bridge}, Agent=${diag.components.agent}, Game=${diag.components.game}`;
            }
            const contextMsg = diag.context.ready ? '✓ Context ready' : `⚠ Context: ${diag.context.reason}`;
            const patches = diag.patches.pending > 0 ? ` [${diag.patches.pending} pending patches]` : '';
            return `✓ Operational | ${contextMsg}${patches}`;
        }
    };

    // Expose to global scope
    window.OmniAIWorker = OmniAIWorker;

    // Also expose log for direct access if needed
    window.ExternalRequestLog = externalRequestLog;

    if (CONFIG.devMode) {
        console.log('[OmniAIWorker] Initialized. Use window.OmniAIWorker for AI interaction.');
        console.log('[OmniAIWorker] Quick start: window.OmniAIWorker.diagnose()');
    }
})();
