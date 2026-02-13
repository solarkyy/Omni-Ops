// IntelligentAgent - Dev/Test AI driver (opt-in)
// Provides a unified onCommand handler, thought stream, and basic agent loop

(function() {
    'use strict';

    // ★ EARLY REGISTRATION - Export to window immediately to prevent test harness race conditions
    window.IntelligentAgent = window.IntelligentAgent || { _initializing: true };

    const DEFAULT_THOUGHT_LIMIT = 10;
    const SECTOR_SIZE = 100;
    const SAFE_ZONE_RADIUS = 30;
    const MODE_UPDATE_INTERVAL_MS = 5000;
    const LOOK_MAX_STEP = 0.12;
    const LOOK_MAX_PITCH_STEP = 0.08;

    function nowTime() {
        return new Date().toLocaleTimeString();
    }

    // ─────────────────────────────────────────────────────────────────────
    // ★ COMMAND VOCABULARY ★
    // These are the only commands external LLMs should use
    // ─────────────────────────────────────────────────────────────────────
    const COMMAND_VOCABULARY = {
        'patrol_area': {
            description: 'Slow loop around current sector, stay alert',
            aliases: ['patrol', 'patrol_sector']
        },
        'seek_enemies': {
            description: 'Move toward nearest visible enemy and engage',
            aliases: ['seek', 'hunt', 'hunt_enemies']
        },
        'hold_position': {
            description: 'Stay near current spot, shoot threats',
            aliases: ['hold', 'defend', 'defensive']
        },
        'return_to_safe_zone': {
            description: 'Navigate to base or safe area',
            aliases: ['retreat', 'return', 'go_home']
        },
        'status': {
            description: 'Brief summary of current state',
            aliases: ['info', 'state']
        }
    };

    const IntelligentAgent = {
        enabled: false,
        thoughts: [],
        thoughtLimit: DEFAULT_THOUGHT_LIMIT,
        actionHistory: [],
        actionHistoryLimit: 10,  // Keep last 10 command executions
        currentObjective: null,
        currentMode: 'idle',
        loopTimer: null,
        lastTick: 0,
        patrolDirection: 'left',  // Track patrol sweep direction
        lastEnemyPos: null,       // Cache of last spotted enemy
        safeZonePos: { x: 0, y: 50, z: 0 },  // Default safe zone at origin
        modeStartedAt: 0,
        lastModeUpdateAt: 0,
        moveLockUntil: 0,
        nextPatrolTurnAt: 0,
        nextPatrolMoveAt: 0,
        nextPatrolStrafeAt: 0,
        nextSeekLookAt: 0,
        nextSeekFireAt: 0,
        nextHoldLookAt: 0,
        nextHoldFireAt: 0,
        nextReturnLogAt: 0,
        externalContext: null,
        externalContextSignature: null,

        init() {
            if (this._initialized) return;
            this._initialized = true;

            this.createThoughtOverlay();
            this.hookUnifiedPanel();
            this.bindDevToggle();
            this.checkUrlDevMode();

            this.logThought('IntelligentAgent ready. Press F9 to toggle.', 'info');
        },

        // -------------------------
        // Enable/Disable
        // -------------------------
        enable() {
            if (this.enabled) return;
            this.enabled = true;
            this.startLoop();
            if (window.AIPlayerAPI) window.AIPlayerAPI.activateAI();
            this.logThought('AI dev mode enabled.', 'info');
        },

        disable() {
            if (!this.enabled) return;
            this.enabled = false;
            this.stopLoop();
            if (window.AIPlayerAPI) window.AIPlayerAPI.deactivateAI();
            this.logThought('AI dev mode disabled.', 'info');
        },

        toggle() {
            if (this.enabled) this.disable();
            else this.enable();
        },

        /**
         * Wire IntelligentAgent to use AIPlayerAPI (called by AgentBridge bootstrap)
         * Ensures bidirectional reference for command routing
         */
        setAIPlayerAPI(aiPlayerAPI) {
            if (!aiPlayerAPI) {
                console.warn('[IntelligentAgent] setAIPlayerAPI called with null/undefined');
                return;
            }
            this._aiPlayerAPI = aiPlayerAPI;
            if (window.AgentBridge?.CONFIG?.devMode) {
                console.log('[IntelligentAgent] ✓ Wired AIPlayerAPI reference');
            }
        },

        // -------------------------
        // Smart Decision Layer (NEW)
        // -------------------------
        /**
         * Evaluate current game state and decide best mode
         * Implements safety rules + strategic preferences
         * 
         * Rules (in order of priority):
         * 1. CRITICAL HEALTH (< 25%) → always retreat
         * 2. LOW HEALTH + LOW AMMO → retreat
         * 3. OUT OF AMMO + IN THREAT ZONE → hold position
         * 4. Good resources → allow requested mode
         * 5. Otherwise → prefer hold_position (unsafe) or patrol_area (safe)
         * 
         * @param {string} requestedMode - Command sent by LLM (e.g., 'seek_enemies')
         * @param {object} playerState - From AIPlayerAPI.getGameState()
         * @param {object} sectorState - From getSectorContext()
         * @returns {string} Decided mode to enter
         */
        decideBestMode(requestedMode, playerState, sectorState) {
            if (!playerState) return requestedMode;

            const health = playerState.health || 100;
            const ammo = playerState.ammo || 0;
            const stamina = playerState.stamina || 100;
            const inSafeZone = sectorState?.isInSafeZone || false;
            const inCorruptedZone = sectorState?.isInCorruptedZone || false;

            // ─────────────────────────────────────────────────────────
            // SAFETY OVERRIDES (These cannot be violated)
            // ─────────────────────────────────────────────────────────

            // Rule 1: CRITICAL HEALTH → MUST RETREAT
            if (health < 25) {
                this.logThought(
                    `🔴 DECISION: health=${health}% < 25 (CRITICAL) → OVERRIDE to return_to_safe_zone`,
                    'error'
                );
                return 'return_to_safe_zone';
            }

            // Rule 2: LOW HEALTH + LOW AMMO → RETREAT
            if (health < 40 && ammo < 5) {
                this.logThought(
                    `🟠 DECISION: health=${health}% < 40 + ammo=${ammo} < 5 → OVERRIDE to return_to_safe_zone`,
                    'warn'
                );
                return 'return_to_safe_zone';
            }

            // Rule 3: OUT OF AMMO + IN CORRUPTED ZONE → HOLD POSITION
            if (ammo < 1 && inCorruptedZone) {
                this.logThought(
                    `🟡 DECISION: ammo=${ammo} (out) + corrupted_zone=true → OVERRIDE to hold_position`,
                    'warn'
                );
                return 'hold_position';
            }

            // ─────────────────────────────────────────────────────────
            // STRATEGIC PREFERENCES (Suggest LLM command if safe)
            // ─────────────────────────────────────────────────────────

            // Strong resources → allow aggressive modes
            if (health > 60 && ammo > 20) {
                this.logThought(
                    `🟢 DECISION: health=${health}% + ammo=${ammo} (good) ✓ Allow "${requestedMode}"`,
                    'info'
                );
                return requestedMode;
            }

            // Moderate resources → allow if not too risky
            if (health >= 40 && health <= 60 && ammo >= 5) {
                this.logThought(
                    `🟡 DECISION: health=${health}% + ammo=${ammo} (moderate) ✓ Allow "${requestedMode}" (caution)`,
                    'info'
                );
                return requestedMode;
            }

            // ─────────────────────────────────────────────────────────
            // FALLBACK: Default to safe behavior
            // ─────────────────────────────────────────────────────────

            // In safe zone → patrol (active but safe)
            if (inSafeZone) {
                this.logThought(
                    `🔵 DECISION: Low resources + safe_zone=true → Default to patrol_area`,
                    'info'
                );
                return 'patrol_area';
            }

            // In threat zone with low resources → hold defensively
            this.logThought(
                `🔵 DECISION: Low resources + corrupted_zone=true → Default to hold_position`,
                'info'
            );
            return 'hold_position';
        },

        // -------------------------
        // Command Routing (LLM-Driven)
        // -------------------------
        /**
         * Process commands from external sources (LLM/browser console)
         * Only accepts commands from COMMAND_VOCABULARY
         * Applies smart decision layer before entering mode
         * Logs command + decision to AI Dev Log for visibility
         * 
         * @param {string} command - Command text (matched against vocabulary)
         * @param {any} args - Optional arguments (unused for now)
         * @returns {object} { ok: boolean, message: string }
         */
        onCommand(command, args) {
            const cmd = (command || '').trim().toLowerCase();
            this.logThought(`[CMD] Received: "${cmd}"`, 'info');

            if (!cmd) return { ok: false, message: 'Empty command' };

            // ─────────────────────────────────────────────────────────
            // SPECIAL COMMANDS (not in vocabulary, but system-level)
            // ─────────────────────────────────────────────────────────

            if (cmd === 'enable' || cmd === 'start') {
                this.enable();
                return { ok: true, message: 'AI enabled' };
            }

            if (cmd === 'disable' || cmd === 'stop') {
                this.disable();
                return { ok: true, message: 'AI disabled' };
            }

            if (cmd === 'explain_last_decision' || cmd === 'why') {
                const last = this.actionHistory[0];
                if (!last) {
                    const msg = 'No command history yet. Run a command first.';
                    this.logThought(msg, 'warn');
                    return { ok: false, message: msg };
                }

                const summary = this.formatDecisionSummary(last);
                this.logThought(summary, last.modeChanged ? 'warn' : 'info');
                return { ok: true, message: summary };
            }

            // ─────────────────────────────────────────────────────────
            // CAPTURE STATE BEFORE COMMAND
            // ─────────────────────────────────────────────────────────

            const beforeState = this.captureStateSnapshot();

            // ─────────────────────────────────────────────────────────
            // COMMAND VOCABULARY
            // ─────────────────────────────────────────────────────────

            // Match exact command or any alias
            let matchedCmd = null;
            for (const [vocabCmd, vocabData] of Object.entries(COMMAND_VOCABULARY)) {
                if (cmd === vocabCmd || vocabData.aliases.includes(cmd)) {
                    matchedCmd = vocabCmd;
                    break;
                }
            }

            if (!matchedCmd) {
                const availableCommands = Object.keys(COMMAND_VOCABULARY).join(', ');
                this.logCommandExecution({
                    requestedCommand: cmd,
                    decidedMode: 'none',
                    contextReady: true,
                    beforeState: beforeState,
                    afterState: beforeState,
                    success: false,
                    reason: `Unknown command: "${cmd}"`
                });
                return {
                    ok: false,
                    message: `Unknown command: "${cmd}". Available: ${availableCommands}`
                };
            }

            // ─────────────────────────────────────────────────────────
            // INVOKE SMART DECISION LAYER
            // ─────────────────────────────────────────────────────────

            // Use test-aware state getter (applies _testStateOverrides if present)
            const state = this._getGameStateForDecisions();
            const sectorContext = this.getSectorContext(state);
            const decidedMode = this.decideBestMode(matchedCmd, state, sectorContext);

            // Build decision reason
            let reason = decidedMode === matchedCmd 
                ? `Executed as requested` 
                : `Override: ${this.getDecisionReason(matchedCmd, decidedMode, state, sectorContext)}`;

            // Log if decision differs from request
            if (decidedMode !== matchedCmd) {
                this.logThought(
                    `→ FINAL DECISION: requested="${matchedCmd}" → decided="${decidedMode}"`,
                    'warn'
                );
                matchedCmd = decidedMode;
            }

            const sectorLabel = this.formatSectorContext(state);

            // ─────────────────────────────────────────────────────────
            // VOCABULARY COMMANDS (execute decided mode)
            // ─────────────────────────────────────────────────────────

            let result;
            switch (matchedCmd) {

                case 'patrol_area':
                    this.enterMode('patrol_area');
                    this.patrolDirection = 'left';
                    this.logThought(`Mode: PATROL_AREA | ${sectorLabel}`, 'info');
                    result = { ok: true, message: 'Patrol active' };
                    break;

                case 'seek_enemies':
                    this.enterMode('seek_enemies');
                    this.logThought(`Mode: SEEK_ENEMIES | ${sectorLabel}`, 'warn');
                    result = { ok: true, message: 'Hunting active' };
                    break;

                case 'hold_position':
                    this.enterMode('hold_position');
                    this.logThought(`Mode: HOLD_POSITION | ${sectorLabel} | Defensive stance`, 'info');
                    result = { ok: true, message: 'Hold position' };
                    break;

                case 'return_to_safe_zone':
                    this.enterMode('return_to_safe_zone');
                    this.logThought(`Mode: RETURN_TO_SAFE_ZONE | ${sectorLabel}`, 'warn');
                    result = { ok: true, message: 'Retreating to base' };
                    break;

                case 'status':
                    const summary = this.buildStatusSummary();
                    this.logThought(summary, 'info');
                    result = { ok: true, message: summary };
                    break;

                default:
                    result = { ok: false, message: `Command not implemented: ${matchedCmd}` };
                    break;
            }

            // ─────────────────────────────────────────────────────────
            // CAPTURE STATE AFTER COMMAND & LOG EXECUTION
            // ─────────────────────────────────────────────────────────

            const afterState = this.captureStateSnapshot();

            this.logCommandExecution({
                requestedCommand: cmd,
                decidedMode: matchedCmd,
                contextReady: true,
                beforeState: beforeState,
                afterState: afterState,
                success: result?.ok !== false,
                reason: reason,
                testRunId: this._currentTestRunId || null,  // Link to test run if in test context
                startTime: Date.now()  // For execution time tracking
            });

            return result;
        },

        /**
         * Get a human-readable reason for why a command was overridden
         */
        getDecisionReason(requested, decided, state, sectorContext) {
            if (decided === 'hold_position') {
                if (state.health < 30) return 'Low health + unsafe zone';
                if (state.ammo < 10 && sectorContext.isInCorruptedZone) return 'Low ammo + corrupted zone';
                return 'Safety override';
            }
            return 'Strategic decision';
        },

        formatDecisionSummary(entry) {
            if (!entry) return 'Last decision: n/a';
            const reason = entry.reason || 'n/a';
            const overrideLabel = entry.modeChanged ? 'override' : 'as requested';
            return `Last decision: requested="${entry.command}" → decided="${entry.decidedMode}" | ${overrideLabel} | reason="${reason}" | contextReady=${entry.contextReady}`;
        },

        buildStatusSummary() {
            const state = window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : null;
            const pos = state?.position ? `${state.position.x.toFixed(1)}, ${state.position.y.toFixed(1)}, ${state.position.z.toFixed(1)}` : 'n/a';
            const sectorLabel = this.formatSectorContext(state);
            const health = state?.health !== undefined ? state.health : 'n/a';
            const ammo = state?.ammo !== undefined ? `${state.ammo}/${state.reserveAmmo}` : 'n/a';
            const mode = state?.mode || 'n/a';
            const objective = this.currentObjective || 'none';
            const enabled = this.enabled ? 'on' : 'off';
            return `Status: AI ${enabled} | mode=${this.currentMode} | sector=${sectorLabel} | obj=${objective} | hp=${health} | ammo=${ammo} | pos=${pos} | game=${mode}`;
        },

        setExternalContext(context) {
            if (!context || !Array.isArray(context.files)) return;
            const signature = `${context.loadedAt || ''}|${context.files.map(file => file.name).join(',')}`;
            if (signature === this.externalContextSignature) return;
            this.externalContextSignature = signature;
            this.externalContext = {
                loadedAt: context.loadedAt || null,
                fileCount: context.files.length
            };
            this.logThought(`Context loaded: ${context.files.length} files (LLM guidance active)`, 'info');
        },

        enterMode(nextMode) {
            if (this.currentMode !== nextMode) {
                this.currentMode = nextMode;
                this.modeStartedAt = Date.now();
                this.lastModeUpdateAt = 0;
            }
        },

        /**
         * Capture key player state for logging purposes
         * @returns {object} State snapshot { health, ammo, sector, mode }
         */
        captureStateSnapshot() {
            const state = window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : {};
            const sector = this.getSectorContext(state);
            return {
                health: state.health || 100,
                ammo: state.ammo || 0,
                reserveAmmo: state.reserveAmmo || 0,
                stamina: state.stamina || 100,
                sector: sector?.currentSectorId || 'unknown',
                areaLabel: sector?.areaLabel || 'unknown',
                mode: state.mode || 'unknown'
            };
        },

        /**
         * Log a rich command execution with full context and state tracking
         * Called whenever a command is processed through onCommand
         * 
         * @param {object} executionData - {
         *   requestedCommand: string,
         *   decidedMode: string,
         *   contextReady: boolean,
         *   beforeState: object,
         *   afterState: object,
         *   success: boolean,
         *   reason?: string
         * }
         */
        logCommandExecution(executionData) {
            const {
                requestedCommand,
                decidedMode,
                contextReady,
                beforeState,
                afterState,
                success,
                reason,
                testRunId  // Optional: links execution to specific test run
            } = executionData;

            const startTime = executionData.startTime || Date.now();
            const endTime = Date.now();
            const executionTimeMs = endTime - startTime;
            const modeTransitionDelay = this.modeStartedAt && startTime ? (this.modeStartedAt - startTime) : 0;

            const entry = {
                time: nowTime(),
                timestamp: new Date().toISOString(),
                command: requestedCommand,
                decidedMode: decidedMode,
                contextReady: contextReady,
                beforeState: beforeState || {},
                afterState: afterState || {},
                success: success !== false,
                reason: reason || '',
                modeChanged: decidedMode !== requestedCommand,
                // ★ NEW TEST FIELDS ★
                testRunId: testRunId || null,
                executionTimeMs: executionTimeMs,
                modeTransitionDelay: modeTransitionDelay
            };

            this.actionHistory.unshift(entry);
            if (this.actionHistory.length > this.actionHistoryLimit) {
                this.actionHistory.length = this.actionHistoryLimit;
            }

            // Add compact summary to AI Dev Log for last 3 executions
            if (this.actionHistory.length <= 3) {
                const overrideStr = entry.modeChanged ? ` (override: ${entry.reason})` : '';
                const summaryLine = `Exec: ${requestedCommand} → ${decidedMode}${overrideStr}`;
                // Don't log to thoughts to avoid spam - it's already captured in actionHistory
                // The exportSnapshot will show this data
            }
        },

        logModeUpdate(message, level, minIntervalMs = MODE_UPDATE_INTERVAL_MS) {
            const now = Date.now();
            if (now - this.lastModeUpdateAt < minIntervalMs) return;
            this.lastModeUpdateAt = now;
            this.logThought(message, level);
        },

        // ─────────────────────────────────────────────────────────────────────
        // Test Helper Methods
        // ─────────────────────────────────────────────────────────────────────

        /**
         * Get action history with optional count limit
         * @param {number} count - Number of entries to return (default: all)
         * @returns {array} Action history entries
         */
        getActionHistory(count = null) {
            if (count === null || count >= this.actionHistory.length) {
                return this.actionHistory;
            }
            return this.actionHistory.slice(0, count);
        },

        /**
         * Compare two state snapshots and return delta analysis
         * @param {object} before - State snapshot before command
         * @param {object} after - State snapshot after command
         * @returns {object} Delta analysis
         */
        compareSnapshots(before, after) {
            const healthChange = (after.health || 0) - (before.health || 0);
            const ammoChange = (after.ammo || 0) - (before.ammo || 0);
            const modeChanged = before.mode !== after.mode;
            const sectorChanged = before.sector !== after.sector;

            const significantChanges = [];

            if (healthChange !== 0) {
                significantChanges.push(`health ${healthChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(healthChange)}%`);
            }
            if (healthChange < 0 && after.health < 25) {
                significantChanges.push('health dropped below 25% (CRITICAL)');
            }
            if (ammoChange !== 0) {
                significantChanges.push(`ammo ${ammoChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(ammoChange)}`);
            }
            if (modeChanged) {
                significantChanges.push(`mode changed from ${before.mode} to ${after.mode}`);
            }
            if (sectorChanged) {
                significantChanges.push(`sector changed from ${before.sector} to ${after.sector}`);
            }

            return {
                healthChange,
                ammoChange,
                modeChanged,
                sectorChanged,
                significantChanges
            };
        },

        /**
         * Get command vocabulary for external validation
         * @returns {object} Command vocabulary with descriptions and aliases
         */
        getCommandVocabulary() {
            return COMMAND_VOCABULARY;
        },

        /**
         * Set test-mode state overrides for decision layer testing
         * TEST MODE ONLY - allows tests to simulate specific game states
         * @param {object|null} overrides - State overrides like { health: 20, ammo: 5 } or null to clear
         */
        setTestStateOverride(overrides) {
            this._testStateOverrides = overrides;
            if (overrides) {
                console.log('[IntelligentAgent] Test state override applied:', overrides);
            } else {
                console.log('[IntelligentAgent] Test state override cleared');
            }
        },

        /**
         * Get current game state with test overrides applied (if in test mode)
         * @returns {object} Game state (possibly overridden for tests)
         */
        _getGameStateForDecisions() {
            if (!this._aiPlayerAPI) return {};
            const realState = this._aiPlayerAPI.getGameState();
            
            // Apply test overrides if present
            if (this._testStateOverrides) {
                return { ...realState, ...this._testStateOverrides };
            }
            return realState;
        },

        getSectorContext(state) {
            const pos = state?.position;
            const sectorX = pos ? Math.floor(pos.x / SECTOR_SIZE) : 0;
            const sectorZ = pos ? Math.floor(pos.z / SECTOR_SIZE) : 0;
            const currentSectorId = `SECTOR_${sectorX}_${sectorZ}`;
            const dx = pos ? this.safeZonePos.x - pos.x : 0;
            const dz = pos ? this.safeZonePos.z - pos.z : 0;
            const distanceToSafeZone = pos ? Math.hypot(dx, dz) : null;
            const isInSafeZone = distanceToSafeZone !== null ? distanceToSafeZone <= SAFE_ZONE_RADIUS : false;
            const rep = state?.reputation?.CITIZEN;
            const isInCorruptedZone = rep !== undefined ? rep < -20 : !isInSafeZone;
            const areaLabel = isInSafeZone ? 'safe zone' : (isInCorruptedZone ? 'corrupted zone' : 'field');

            return {
                currentSectorId,
                isInSafeZone,
                isInCorruptedZone,
                areaLabel,
                distanceToSafeZone
            };
        },

        formatSectorContext(state) {
            if (!state) return 'unknown';
            const sector = this.getSectorContext(state);
            return `${sector.currentSectorId} (${sector.areaLabel})`;
        },

        isSafeToMove(state) {
            if (!state) return false;
            if (state.isOnGround === false) return false;
            return true;
        },

        queueMove(action, durationMs = 450) {
            const now = Date.now();
            if (now < this.moveLockUntil) return false;
            window.AIPlayerAPI.setInput(action, true);
            this.moveLockUntil = now + durationMs + 150;
            setTimeout(() => window.AIPlayerAPI.setInput(action, false), durationMs);
            return true;
        },

        applyLookSmooth(state, targetYaw, targetPitch) {
            const currentYaw = state.yaw || 0;
            const currentPitch = state.pitch || 0;
            const deltaYaw = Math.max(-LOOK_MAX_STEP, Math.min(LOOK_MAX_STEP, targetYaw - currentYaw));
            const deltaPitch = Math.max(-LOOK_MAX_PITCH_STEP, Math.min(LOOK_MAX_PITCH_STEP, targetPitch - currentPitch));
            window.AIPlayerAPI.setLook(currentYaw + deltaYaw, currentPitch + deltaPitch);
        },

        fireBurst(count = 2, spacingMs = 120) {
            for (let i = 0; i < count; i++) {
                setTimeout(() => window.AIPlayerAPI.shoot(), i * spacingMs);
            }
        },

        // -------------------------
        // Thought Stream
        // -------------------------
        logThought(message, level) {
            const entry = {
                time: nowTime(),
                level: level || 'info',
                message
            };
            this.thoughts.unshift(entry);
            if (this.thoughts.length > this.thoughtLimit) {
                this.thoughts.length = this.thoughtLimit;
            }
            this.renderThoughts();
        },

        renderThoughts() {
            const overlayList = document.getElementById('ai-thought-list');
            if (overlayList) {
                overlayList.innerHTML = this.thoughts
                    .map(t => `<div class="ai-thought ai-${t.level}">[${t.time}] ${t.message}</div>`)
                    .join('');
            }

            const panelList = document.getElementById('ai-dev-log');
            if (panelList) {
                panelList.innerHTML = this.thoughts
                    .map(t => `<div class="ai-thought ai-${t.level}">[${t.time}] ${t.message}</div>`)
                    .join('');
            }
        },

        createThoughtOverlay() {
            if (document.getElementById('ai-thought-overlay')) return;

            const overlay = document.createElement('div');
            overlay.id = 'ai-thought-overlay';
            overlay.style.cssText = [
                'position:fixed',
                'top:10px',
                'left:10px',
                'width:320px',
                'max-height:200px',
                'overflow:hidden',
                'background:rgba(0,0,0,0.7)',
                'border:1px solid #0f6',
                'border-radius:6px',
                'padding:8px',
                'font-family:monospace',
                'font-size:11px',
                'color:#0f6',
                'z-index:5000'
            ].join(';');

            overlay.innerHTML = `
                <div style="font-weight:bold;margin-bottom:6px;">AI THOUGHTS</div>
                <div id="ai-thought-list"></div>
            `;

            document.body.appendChild(overlay);

            const style = document.createElement('style');
            style.textContent = `
                .ai-thought { margin-bottom: 4px; }
                .ai-info { color: #0f6; }
                .ai-warn { color: #ff0; }
                .ai-error { color: #f66; }
            `;
            document.head.appendChild(style);
        },

        hookUnifiedPanel() {
            // Add log container to AI tab if panel exists
            const tryInject = () => {
                const panel = document.getElementById('omni-unified-panel');
                if (!panel) return false;
                const aiTab = panel.querySelector('.omni-tab-content[data-tab="ai"]');
                if (!aiTab) return false;

                if (!document.getElementById('ai-dev-log')) {
                    const section = document.createElement('div');
                    section.style.cssText = 'margin-top:12px;border-top:1px solid rgba(0,255,102,0.2);padding-top:10px;';
                    section.innerHTML = `
                        <h4 style="margin:0 0 8px;color:#0f6;">AI Dev Log</h4>
                        <div id="ai-dev-log" style="max-height:140px;overflow-y:auto;font-size:11px;background:rgba(0,0,0,0.3);border:1px solid #333;border-radius:3px;padding:6px;"></div>
                    `;
                    aiTab.appendChild(section);
                }

                return true;
            };

            let attempts = 0;
            const timer = setInterval(() => {
                attempts += 1;
                if (tryInject() || attempts > 20) {
                    clearInterval(timer);
                    this.renderThoughts();
                }
            }, 500);
        },

        bindDevToggle() {
            document.addEventListener('keydown', (e) => {
                if (e.code === 'F9') {
                    e.preventDefault();
                    this.toggle();
                }
            });
        },

        checkUrlDevMode() {
            try {
                const params = new URLSearchParams(window.location.search);
                if (params.get('aiDev') === '1') {
                    this.enable();
                }
            } catch (e) {
                // Ignore
            }
        },

        // -------------------------
        // Agent Loop (simple placeholder)
        // -------------------------
        startLoop() {
            if (this.loopTimer) return;
            this.loopTimer = setInterval(() => this.tick(), 300);
        },

        stopLoop() {
            if (this.loopTimer) {
                clearInterval(this.loopTimer);
                this.loopTimer = null;
            }
        },

        tick() {
            if (!this.enabled) return;
            if (!window.AIPlayerAPI || !window.AIPlayerAPI.isAIControlling()) return;

            const now = Date.now();
            if (now - this.lastTick < 600) return;
            this.lastTick = now;

            const state = window.AIPlayerAPI.getGameState();
            if (!state) return;

            // ─────────────────────────────────────────────────────────────
            // MODE: PATROL_AREA
            // Slowly scan left/right while staying in one area
            // ─────────────────────────────────────────────────────────────
            if (this.currentMode === 'patrol_area') {
                const canMove = this.isSafeToMove(state);
                if (canMove && now > this.nextPatrolMoveAt) {
                    this.nextPatrolMoveAt = now + 1800;
                    this.queueMove('moveForward', 420);
                }

                if (canMove && now > this.nextPatrolStrafeAt) {
                    this.nextPatrolStrafeAt = now + 4200;
                    const strafe = this.patrolDirection === 'left' ? 'moveLeft' : 'moveRight';
                    this.queueMove(strafe, 300);
                }

                const scanStep = this.patrolDirection === 'left' ? -0.06 : 0.06;
                this.applyLookSmooth(state, state.yaw + scanStep, state.pitch);

                if (now > this.nextPatrolTurnAt) {
                    this.nextPatrolTurnAt = now + 6000;
                    this.patrolDirection = this.patrolDirection === 'left' ? 'right' : 'left';
                    this.logThought('Patrol: Scanning direction reversed', 'info');
                }

                this.logModeUpdate('Patrol: Holding perimeter scan', 'info');
            }

            // ─────────────────────────────────────────────────────────────
            // MODE: SEEK_ENEMIES
            // Move forward with periodic shooting
            // Simulates searching and engaging
            // ─────────────────────────────────────────────────────────────
            else if (this.currentMode === 'seek_enemies') {
                const canMove = this.isSafeToMove(state);
                if (canMove) {
                    this.queueMove('moveForward', 520);
                }

                if (now > this.nextSeekLookAt) {
                    this.nextSeekLookAt = now + 1500;
                    const yawOffset = (Math.random() - 0.5) * 0.25;
                    const pitchOffset = (Math.random() - 0.5) * 0.12;
                    this.applyLookSmooth(state, state.yaw + yawOffset, state.pitch + pitchOffset);
                }

                if (now > this.nextSeekFireAt) {
                    this.nextSeekFireAt = now + 2200 + Math.random() * 1200;
                    this.fireBurst(2, 120);
                    this.logThought('Seek: Suppressing hostile area', 'warn');
                }

                this.logModeUpdate('Seek: Sweeping for targets', 'info');
            }

            // ─────────────────────────────────────────────────────────────
            // MODE: HOLD_POSITION
            // Stay in place, minimal movement, shoot on command
            // ─────────────────────────────────────────────────────────────
            else if (this.currentMode === 'hold_position') {
                if (now > this.nextHoldLookAt) {
                    this.nextHoldLookAt = now + 2200;
                    const yawOffset = (Math.random() - 0.5) * 0.12;
                    const pitchOffset = (Math.random() - 0.5) * 0.08;
                    this.applyLookSmooth(state, state.yaw + yawOffset, state.pitch + pitchOffset);
                }

                if (now > this.nextHoldFireAt) {
                    this.nextHoldFireAt = now + 4200 + Math.random() * 1200;
                    this.fireBurst(1, 0);
                    this.logThought('Hold: Covering fire', 'warn');
                }

                this.logModeUpdate('Hold: Defensive posture maintained', 'info');
            }

            // ─────────────────────────────────────────────────────────────
            // MODE: RETURN_TO_SAFE_ZONE
            // Move steadily toward safe zone (base)
            // ─────────────────────────────────────────────────────────────
            else if (this.currentMode === 'return_to_safe_zone') {
                const canMove = this.isSafeToMove(state);
                const dx = this.safeZonePos.x - state.position.x;
                const dz = this.safeZonePos.z - state.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist > 2) {
                    if (canMove) {
                        this.queueMove('moveForward', 520);
                    } else {
                        this.logModeUpdate('Return: Waiting for stable ground', 'warn', 6000);
                    }

                    const targetYaw = Math.atan2(dz, dx);
                    this.applyLookSmooth(state, targetYaw, state.pitch);

                    if (now > this.nextReturnLogAt) {
                        this.nextReturnLogAt = now + 3500;
                        this.logThought(`Return: Moving to base (${dist.toFixed(1)}m away)`, 'warn');
                    }
                } else {
                    this.logThought('Return: Reached safe zone!', 'info');
                    this.enterMode('hold_position');
                }
            }

            // ─────────────────────────────────────────────────────────────
            // IDLE MODE (default)
            // ─────────────────────────────────────────────────────────────
            else {
                this.logModeUpdate('Idle. Awaiting command.', 'info');
            }
        }
    };

    // ★ COMPLETE REGISTRATION - Replace placeholder with full object
    window.IntelligentAgent = IntelligentAgent;
    window.IntelligentAgent._initializing = false;
    window.IntelligentAgent._initialized = false;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            IntelligentAgent.init();
            window.IntelligentAgent._initialized = true;
            console.log('[IntelligentAgent] ✓ Fully initialized and ready for tests');
        });
    } else {
        IntelligentAgent.init();
        window.IntelligentAgent._initialized = true;
        console.log('[IntelligentAgent] ✓ Fully initialized and ready for tests');
    }
})();
