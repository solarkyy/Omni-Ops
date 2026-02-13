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
 * ============================================================================
 * SAFE TEST COMMANDS (AIPlayerAPI)
 * ============================================================================
 * 
 * These commands are exposed on window.AIPlayerAPI for automated smoke tests
 * and non-invasive validation. They do NOT alter story data or game balance.
 * 
 *   window.AIPlayerAPI.spawnTestBotAt(x, y, z)
 *   window.AIPlayerAPI.runPathTest(routeId)
 *   window.AIPlayerAPI.runStoryStartupSmokeTest({ timeoutMs: 10000 })
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
        devMode: true,
        testMode: false  // When true, bypass context checks and enable test-specific logging
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
        // Bootstrap and readiness state flags
        _bootstrapped: false,
        _wasReady: false,
        _diagnosticLogged: false,
        
        // AI context state
        _aiContextCache: null,
        _aiContextPromise: null,
        _aiContextError: null,
        _lastContextWarningAt: 0,
        _contextWarningThrottleMs: 5000,  // Warn at most once every 5s

        /**
         * Check if bridge is properly initialized
         * Returns diagnostic info about what's ready and what's missing
         */
        isReady() {
            const enabled = CONFIG.enabled;
            const hasAgent = !!window.IntelligentAgent;
            const hasAPI = !!window.AIPlayerAPI;
            const ready = enabled && hasAgent && hasAPI;
            
            // Diagnostic logging (only once per readiness state change)
            if (ready && !this._wasReady) {
                console.log('[AgentBridge] ✅ READY - All dependencies available (IntelligentAgent + AIPlayerAPI)');
                this._wasReady = true;
            } else if (!ready && this._wasReady) {
                console.warn('[AgentBridge] ⚠️ LOST READINESS - Missing components:', {
                    enabled, hasAgent, hasAPI
                });
                this._wasReady = false;
            } else if (!ready && !this._wasReady) {
                // Only log detailed diagnostic on first check
                if (!this._diagnosticLogged) {
                    console.warn('[AgentBridge] ⏳ NOT YET READY. Status:', {
                        enabled: CONFIG.enabled ? '✓' : '✗',
                        IntelligentAgent: hasAgent ? '✓ loaded' : '✗ missing',
                        AIPlayerAPI: hasAPI ? '✓ loaded' : '✗ missing'
                    });
                    this._diagnosticLogged = true;
                }
            }
            
            return ready;
        },

        /**
         * Check if AI context is ready and return readiness status + reason
         * 
         * This can be called by external LLMs/agents to poll and wait for context.
         * 
         * @returns {object} { ready: boolean, reason: string, status: string }
         *   - ready: true if context is fully loaded and ready to use
         *   - reason: human-readable explanation (e.g., "Loading ai_context files...")
         *   - status: technical status ('disabled', 'idle', 'loading', 'ready', 'error')
         */
        getAIContextReadyStatus() {
            const snapshot = this.getAIContextSnapshot();
            const status = snapshot.status || 'unknown';

            // Status disabled → not required
            if (status === 'disabled') {
                return {
                    ready: true,  // Context not required, so effectively ready
                    reason: 'AI context disabled (not required)',
                    status: 'disabled'
                };
            }

            // Status ready → all good
            if (status === 'ready') {
                const fileCount = snapshot.files?.length || 0;
                return {
                    ready: true,
                    reason: `AI context ready (${fileCount} files loaded)`,
                    status: 'ready'
                };
            }

            // Status loading → still fetching
            if (status === 'loading') {
                return {
                    ready: false,
                    reason: 'AI context loading... please wait',
                    status: 'loading'
                };
            }

            // Status error → something went wrong
            if (status === 'error') {
                return {
                    ready: false,
                    reason: `AI context error: ${snapshot.error || 'unknown error'}`,
                    status: 'error'
                };
            }

            // Status idle → hasn't started loading yet
            return {
                ready: false,
                reason: 'AI context not yet loaded',
                status: 'idle'
            };
        },

        /**
         * Forward a natural-language command to IntelligentAgent
         * Validates AI context before forwarding gameplay commands
         * Logs the command to AI Dev Log with timestamp
         * 
         * Special handling:
         * - request_behavior commands are routed to AIBehaviorPatches
         * - Structured commands (JSON objects) are parsed for specialized routing
         * 
         * @param {string|object} commandText - Natural language instruction or structured command object
         * @param {object} options - Optional { bypassContextCheck: boolean, fallbackToSafe: boolean }
         * @returns {object} { ok: boolean, message: string, contextReady?: boolean, result?: any }
         */
        enqueueCommand(commandText, options = {}) {
            if (!this.isReady()) {
                const msg = 'AgentBridge not ready - IntelligentAgent or AIPlayerAPI missing';
                console.warn('[AgentBridge]', msg);
                return { ok: false, message: msg };
            }

            let cmd = commandText;
            let structuredCommand = null;

            // Parse structured commands (JSON objects)
            if (typeof cmd === 'string') {
                cmd = cmd.trim();
                if (cmd.startsWith('{')) {
                    try {
                        structuredCommand = JSON.parse(cmd);
                        cmd = structuredCommand.type || '';
                    } catch (err) {
                        // Not valid JSON, treat as plain text command
                    }
                }
            } else if (typeof cmd === 'object' && cmd !== null) {
                structuredCommand = cmd;
                cmd = structuredCommand.type || '';
            }

            if (!cmd) {
                return { ok: false, message: 'Empty command text' };
            }

            // ─────────────────────────────────────────────────────────
            // SPECIAL COMMAND ROUTING
            // ─────────────────────────────────────────────────────────

            // Route request_behavior to AIBehaviorPatches (approval pipeline)
            if (cmd === 'request_behavior' || cmd.toLowerCase() === 'request_behavior') {
                if (!window.AIBehaviorPatches) {
                    return {
                        ok: false,
                        message: 'AIBehaviorPatches module not loaded'
                    };
                }

                if (!structuredCommand || !structuredCommand.payload) {
                    return {
                        ok: false,
                        message: 'request_behavior requires structured command with payload'
                    };
                }

                const patchResult = window.AIBehaviorPatches.createPatchRequest(structuredCommand.payload);
                return {
                    ok: patchResult.ok,
                    type: 'behavior_request_recorded',
                    patchId: patchResult.patchId,
                    message: patchResult.message
                };
            }

            // ─────────────────────────────────────────────────────────
            // AI CONTEXT VALIDATION GUARD
            // ─────────────────────────────────────────────────────────

            const bypassContextCheck = options.bypassContextCheck === true;
            const fallbackToSafe = options.fallbackToSafe !== false;  // Default true

            // Only check context for non-informational commands
            const isInformationalCommand = cmd === 'status' || cmd === 'info' || cmd === 'state';

            // Skip context check in test mode
            if (!bypassContextCheck && !isInformationalCommand && !CONFIG.testMode) {
                const contextReady = this.getAIContextReadyStatus();

                if (!contextReady.ready) {
                    const now = Date.now();
                    const shouldWarn = (now - this._lastContextWarningAt) >= this._contextWarningThrottleMs;

                    if (shouldWarn) {
                        this._lastContextWarningAt = now;
                        if (window.IntelligentAgent) {
                            window.IntelligentAgent.logThought(
                                `⚠️  Context Guard: ${contextReady.reason}. Command blocked: "${cmd}"`,
                                'warn'
                            );
                        }
                    }

                    // Option 1: Fallback to safe command
                    if (fallbackToSafe && cmd !== 'patrol_area' && cmd !== 'patrol' && cmd !== 'hold_position') {
                        if (CONFIG.devMode) {
                            console.log(`[AgentBridge] Context not ready. Falling back to hold_position.`);
                        }
                        
                        // Log this as an overridden execution
                        if (window.IntelligentAgent?.logCommandExecution) {
                            const beforeState = window.IntelligentAgent.captureStateSnapshot?.() || {};
                            window.IntelligentAgent.logCommandExecution({
                                requestedCommand: cmd,
                                decidedMode: 'hold_position',
                                contextReady: false,
                                beforeState: beforeState,
                                afterState: beforeState,
                                success: true,
                                reason: `Context guard: ${contextReady.reason} → fallback to hold_position`
                            });
                        }
                        
                        // Recursively call with hold_position and bypass check (since hold is always safe)
                        return this.enqueueCommand('hold_position', { bypassContextCheck: true });
                    }

                    // Option 2: Reject command
                    return {
                        ok: false,
                        message: `AI context not ready: ${contextReady.reason}. Awaiting context...`,
                        contextReady: false,
                        status: contextReady.status
                    };
                }
            }

            // ─────────────────────────────────────────────────────────
            // CONTEXT READY → FORWARD COMMAND
            // ─────────────────────────────────────────────────────────

            // Capture state BEFORE command execution
            const beforeState = window.IntelligentAgent?.captureStateSnapshot?.() || {};

            // Log to AI Dev Log first
            if (CONFIG.devMode) {
                console.log(`[AgentBridge] Enqueueing: "${cmd}"`);
            }

            // Forward to IntelligentAgent's command handler
            try {
                const result = window.IntelligentAgent.onCommand(cmd);
                
                // Capture state AFTER command execution
                const afterState = window.IntelligentAgent?.captureStateSnapshot?.() || {};
                const decidedMode = window.IntelligentAgent?.currentMode || 'unknown';

                // Log rich command execution to action history
                if (window.IntelligentAgent?.logCommandExecution) {
                    window.IntelligentAgent.logCommandExecution({
                        requestedCommand: cmd,
                        decidedMode: decidedMode,
                        contextReady: true,
                        beforeState: beforeState,
                        afterState: afterState,
                        success: result?.ok !== false,
                        reason: result?.message || ''
                    });
                }

                return {
                    ok: result?.ok !== false,
                    message: result?.message || 'Command processed',
                    contextReady: true,
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

            // Extract recent AI Dev Log entries (simple thoughts)
            const recentActions = (window.IntelligentAgent.thoughts || [])
                .slice(0, CONFIG.maxOutputEntries)
                .map(entry => ({
                    time: entry.time || 'unknown',
                    message: entry.message || '',
                    level: entry.level || 'info'
                }));

            // CRIT-2: Extract rich command execution history for LLM analysis
            const commandExecutions = (window.IntelligentAgent.actionHistory || [])
                .slice(0, CONFIG.maxOutputEntries)
                .map(entry => ({
                    time: entry.time,
                    timestamp: entry.timestamp,
                    command: entry.command,
                    decidedMode: entry.decidedMode,
                    modeChanged: entry.modeChanged,
                    contextReady: entry.contextReady,
                    success: entry.success,
                    reason: entry.reason,
                    beforeState: {
                        health: entry.beforeState?.health,
                        ammo: entry.beforeState?.ammo,
                        sector: entry.beforeState?.sector,
                        areaLabel: entry.beforeState?.areaLabel
                    },
                    afterState: {
                        health: entry.afterState?.health,
                        ammo: entry.afterState?.ammo,
                        sector: entry.afterState?.sector,
                        areaLabel: entry.afterState?.areaLabel
                    }
                }));

            const lastExecution = window.IntelligentAgent?.actionHistory?.[0] || null;
            const lastCommandExecution = lastExecution ? {
                time: lastExecution.time,
                timestamp: lastExecution.timestamp,
                command: lastExecution.command,
                decidedMode: lastExecution.decidedMode,
                modeChanged: lastExecution.modeChanged,
                contextReady: lastExecution.contextReady,
                success: lastExecution.success,
                reason: lastExecution.reason
            } : null;
            const decisionSummary = lastExecution && window.IntelligentAgent?.formatDecisionSummary
                ? window.IntelligentAgent.formatDecisionSummary(lastExecution)
                : null;

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
                behaviorPatches: window.AIBehaviorPatches
                    ? window.AIBehaviorPatches.exportSnapshot()
                    : { pending: [], appliedCount: 0, rejectedCount: 0 },
                recentActions: recentActions,
                commandExecutions: commandExecutions,
                lastCommandExecution: lastCommandExecution,
                decisionSummary: decisionSummary,
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

        /**
         * Manage the readiness banner UI
         * Shows/hides error banner based on AgentBridge.isReady() state
         */
        updateReadinessBanner() {
            let banner = document.getElementById('agent-bridge-error-banner');
            const shouldShow = !this.isReady();
            
            // Create banner if it doesn't exist
            if (!banner && shouldShow) {
                banner = document.createElement('div');
                banner.id = 'agent-bridge-error-banner';
                banner.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: rgba(255, 0, 0, 0.9);
                    color: #fff;
                    padding: 12px 20px;
                    font-family: monospace;
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                    z-index: 10000;
                    border-bottom: 2px solid #fff;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    animation: slideDown 0.3s ease-out;
                `;
                banner.innerHTML = `
                    <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
                        <span style="font-size:18px;">⚠️</span>
                        <div>
                            <strong>AgentBridge not ready</strong>
                            <div style="font-size:12px;opacity:0.9;">Loading AI components...</div>
                        </div>
                    </div>
                `;
                document.body.insertBefore(banner, document.body.firstChild);
            }
            
            // Show/hide banner
            if (banner) {
                banner.style.display = shouldShow ? 'block' : 'none';
                if (!shouldShow && this._wasReady) {
                    if (CONFIG.devMode) {
                        console.log('[AgentBridge] Banner: ✓ Hidden (ready)');
                    }
                }
            }
        },

        /**
         * Setup continuous readiness monitoring for banner update
         * Call this after AgentBridge is initialized
         */
        startReadinessMonitoring() {
            // Update banner immediately
            this.updateReadinessBanner();
            
            // Monitor readiness state and update banner as it changes
            let lastReady = this.isReady();
            this._readinessMonitorInterval = setInterval(() => {
                const nowReady = this.isReady();
                if (nowReady !== lastReady) {
                    this.updateReadinessBanner();
                    lastReady = nowReady;
                }
            }, 100);
        },

        /**
         * Stop the readiness monitoring interval
         */
        stopReadinessMonitoring() {
            if (this._readinessMonitorInterval) {
                clearInterval(this._readinessMonitorInterval);
                this._readinessMonitorInterval = null;
            }
        },

        getAIContextSnapshot() {
            if (!AI_CONTEXT_CONFIG.enabled) {
                return { status: 'disabled', loadedAt: null, files: [] };
            }

            if (this._aiContextCache && this._aiContextCache.status === 'ready') {
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

            // CRIT-3: Add 30s timeout for context load
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Context load timeout (30s)')), 30000)
            );

            try {
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

                const filesData = await Promise.race([Promise.all(fetches), timeoutPromise]);
                this._aiContextCache = {
                    loadedAt: new Date().toISOString(),
                    files: filesData,
                    status: 'ready'  // Explicitly set status to ready
                };
                this._aiContextError = null;
                
                if (window.IntelligentAgent?.setExternalContext) {
                    window.IntelligentAgent.setExternalContext(this._aiContextCache);
                }
                
                if (CONFIG.devMode) {
                    console.log(`[AgentBridge] AI context loaded: ${filesData.length} files ready`);
                }
            } catch (err) {
                // Timeout or fetch error - fall back to ready anyway
                const errorMsg = err?.message || String(err);
                if (CONFIG.devMode) {
                    console.warn(`[AgentBridge] Context load failed: ${errorMsg}. Proceeding without context.`);
                }
                // Mark as ready without files (fallback)
                this._aiContextCache = {
                    loadedAt: new Date().toISOString(),
                    files: [],
                    status: 'ready'
                };
                this._aiContextError = errorMsg;
            }
        },

        // ─────────────────────────────────────────────────────────────────────
        // Test Mode API
        // ─────────────────────────────────────────────────────────────────────

        /**
         * Enable test mode - bypasses context readiness checks and enables verbose logging
         * Used by test harness to ensure deterministic test execution
         */
        enableTestMode() {
            CONFIG.testMode = true;
            console.log('[AgentBridge] ✓ Test mode enabled - context checks bypassed');
            return { ok: true, message: 'Test mode enabled' };
        },

        /**
         * Disable test mode - restore normal operation
         */
        disableTestMode() {
            CONFIG.testMode = false;
            console.log('[AgentBridge] Test mode disabled - normal operation restored');
            return { ok: true, message: 'Test mode disabled' };
        },

        /**
         * Get test readiness status for all required components
         * @returns {object} { ready, components, missingComponents, recommendations, wiring }
         */
        getTestReadiness() {
            const components = {
                agentBridge: !!window.AgentBridge,
                intelligentAgent: !!window.IntelligentAgent && !window.IntelligentAgent._initializing,
                intelligentAgentInitialized: !!window.IntelligentAgent?._initialized,
                aiPlayerAPI: !!window.AIPlayerAPI,
                omniAIWorker: !!window.OmniAIWorker
            };

            // Check if IntelligentAgent is wired to AIPlayerAPI (critical for tests)
            const agentWired = !!(window.IntelligentAgent?._aiPlayerAPI);
            const bridgeBootstrapped = this._bootstrapped;

            const missingComponents = [];
            const recommendations = [];

            if (!components.agentBridge) {
                missingComponents.push('AgentBridge');
                recommendations.push('Load ai/AgentBridge.js');
            }
            if (!components.intelligentAgent) {
                if (window.IntelligentAgent?._initializing) {
                    missingComponents.push('IntelligentAgent (still loading)');
                    recommendations.push('Wait for IntelligentAgent.js to finish executing');
                } else {
                    missingComponents.push('IntelligentAgent');
                    recommendations.push('Load ai/IntelligentAgent.js');
                }
            }
            if (components.intelligentAgent && !components.intelligentAgentInitialized) {
                missingComponents.push('IntelligentAgent (not initialized)');
                recommendations.push('Wait for IntelligentAgent.init() to complete');
            }
            if (!components.aiPlayerAPI) {
                missingComponents.push('AIPlayerAPI');
                recommendations.push('Load js/omni-core-game.js or wait for ModuleLoader');
            }
            if (!components.omniAIWorker) {
                missingComponents.push('OmniAIWorker');
                recommendations.push('Load ai/ai_worker_api.js');
            }

            // Check wiring even if components exist
            if (components.intelligentAgent && components.aiPlayerAPI && !agentWired) {
                recommendations.push('Wait for AgentBridge bootstrap to complete');
            }

            const ready = missingComponents.length === 0 && agentWired;

            return {
                ready,
                components,
                wiring: {
                    agentWired,
                    bridgeBootstrapped
                },
                missingComponents,
                recommendations
            };
        }
    };

    // Expose to global scope
    window.AgentBridge = AgentBridge;

    // Log initialization
    if (CONFIG.devMode) {
        console.log('[AgentBridge] Initialized. Call window.AgentBridge.status() for info.');
    }

    // Add CSS for banner animation
    const agentBridgeStyle = document.createElement('style');
    agentBridgeStyle.textContent = `
        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        @keyframes slideUp {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(-100%);
                opacity: 0;
            }
        }
        #agent-bridge-error-banner {
            transition: all 0.3s ease-out;
        }
    `;
    document.head.appendChild(agentBridgeStyle);

    // Start monitoring readiness state for banner updates
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AgentBridge.startReadinessMonitoring();
        });
    } else {
        AgentBridge.startReadinessMonitoring();
    }

    // Bootstrap function to wire AI components together
    // This is called when both IntelligentAgent and AIPlayerAPI are ready
    AgentBridge._bootstrap = function() {
        if (this._bootstrapped) return;
        
        if (!window.IntelligentAgent || !window.AIPlayerAPI) {
            if (CONFIG.devMode) {
                console.log('[AgentBridge] Bootstrap waiting... IntelligentAgent:', !!window.IntelligentAgent, 'AIPlayerAPI:', !!window.AIPlayerAPI);
            }
            return false;
        }
        
        this._bootstrapped = true;
        
        // Wire IntelligentAgent to use AIPlayerAPI
        if (window.IntelligentAgent.setAIPlayerAPI) {
            window.IntelligentAgent.setAIPlayerAPI(window.AIPlayerAPI);
            if (CONFIG.devMode) console.log('[AgentBridge] ✓ Wired IntelligentAgent.setAIPlayerAPI');
        }
        
        // Set up bidirectional reference for command routing
        if (!window.IntelligentAgent._aiPlayerAPI) {
            window.IntelligentAgent._aiPlayerAPI = window.AIPlayerAPI;
            if (CONFIG.devMode) console.log('[AgentBridge] ✓ Linked IntelligentAgent._aiPlayerAPI');
        }
        
        // Clear diagnostic flag so we can see readiness change
        this._diagnosticLogged = false;
        
        // Force readiness check with updated diagnostics
        if (CONFIG.devMode) {
            const ready = this.isReady();
            console.log('[AgentBridge] Bootstrap complete. Bridge ready:', ready);
        }
        
        // Update banner to reflect new readiness state
        this.updateReadinessBanner();
        
        return true;

    };
    
    // Hook into IntelligentAgent initialization to bootstrap wiring
    const originalInit = window.IntelligentAgent?.init;
    if (originalInit) {
        window.IntelligentAgent.init = function() {
            const result = originalInit.call(this);
            // Try to bootstrap after IntelligentAgent initializes
            if (CONFIG.devMode) {
                console.log('[AgentBridge] IntelligentAgent.init() called, attempting bootstrap...');
            }
            setTimeout(() => {
                AgentBridge._bootstrap();
            }, 100);
            return result;
        };
    }
    
    // Also try bootstrap on window load as fallback
    window.addEventListener('load', () => {
        if (CONFIG.devMode) {
            console.log('[AgentBridge] Window load event, attempting bootstrap...');
        }
        AgentBridge._bootstrap();
    });
})();
