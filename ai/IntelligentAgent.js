// IntelligentAgent - Dev/Test AI driver (opt-in)
// Provides a unified onCommand handler, thought stream, and basic agent loop

(function() {
    'use strict';

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

        // -------------------------
        // Command Routing (LLM-Driven)
        // -------------------------
        /**
         * Process commands from external sources (LLM/browser console)
         * Only accepts commands from COMMAND_VOCABULARY
         * Logs command mode to AI Dev Log for visibility
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
                return {
                    ok: false,
                    message: `Unknown command: "${cmd}". Available: ${availableCommands}`
                };
            }

            // ─────────────────────────────────────────────────────────
            // VOCABULARY COMMANDS
            // ─────────────────────────────────────────────────────────

            const state = window.AIPlayerAPI ? window.AIPlayerAPI.getGameState() : {};
            const sectorLabel = this.formatSectorContext(state);

            switch (matchedCmd) {

                case 'patrol_area':
                    this.enterMode('patrol_area');
                    this.patrolDirection = 'left';
                    this.logThought(`Mode: PATROL_AREA | ${sectorLabel}`, 'info');
                    return { ok: true, message: 'Patrol active' };

                case 'seek_enemies':
                    this.enterMode('seek_enemies');
                    this.logThought(`Mode: SEEK_ENEMIES | ${sectorLabel}`, 'warn');
                    return { ok: true, message: 'Hunting active' };

                case 'hold_position':
                    this.enterMode('hold_position');
                    this.logThought(`Mode: HOLD_POSITION | ${sectorLabel} | Defensive stance`, 'info');
                    return { ok: true, message: 'Hold position' };

                case 'return_to_safe_zone':
                    this.enterMode('return_to_safe_zone');
                    this.logThought(`Mode: RETURN_TO_SAFE_ZONE | ${sectorLabel}`, 'warn');
                    return { ok: true, message: 'Retreating to base' };

                case 'status':
                    const summary = this.buildStatusSummary();
                    this.logThought(summary, 'info');
                    return { ok: true, message: summary };

                default:
                    return { ok: false, message: `Command not implemented: ${matchedCmd}` };
            }
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

        logModeUpdate(message, level, minIntervalMs = MODE_UPDATE_INTERVAL_MS) {
            const now = Date.now();
            if (now - this.lastModeUpdateAt < minIntervalMs) return;
            this.lastModeUpdateAt = now;
            this.logThought(message, level);
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

    window.IntelligentAgent = IntelligentAgent;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => IntelligentAgent.init());
    } else {
        IntelligentAgent.init();
    }
})();
