// OMNI-OPS: Act 1, Chapter 1 "Cold Boot" Controller
(function() {
    'use strict';

    window.OmniOpsChapter1 = {
        
        // ==========================================
        // STATE
        // ==========================================
        active: false,
        currentObjectiveIndex: 0,
        objectives: [],
        completedObjectives: [],
        tutorialsShown: {},
        
        // Player tracking
        playerHasMoved: false,
        playerHasLooked: false,
        playerMovedDistance: 0,
        lastPlayerPosition: null,
        
        // Interaction tracking
        interactablesSpawned: false,
        zoneTriggers: [],
        
        // Timers
        objectiveStartTime: 0,
        navigationWarningTimer: 0,
        
        // ==========================================
        // INITIALIZATION
        // ==========================================
        init: function() {
            console.log('[Chapter 1] Initializing "Cold Boot"...');
            
            if (!window.OmniOpsChapter1Data) {
                console.error('[Chapter 1] Data not loaded! Cannot initialize.');
                return;
            }
            
            // Clone objectives from data
            this.objectives = JSON.parse(JSON.stringify(window.OmniOpsChapter1Data.objectives));
            this.objectives.forEach(obj => {
                obj.state = 'locked';
                obj.startTime = 0;
                obj.completeTime = 0;
            });
            
            // Initialize first objective as active
            if (this.objectives.length > 0) {
                this.objectives[0].state = 'active';
            }
            
            // Setup event listeners
            this._setupEventListeners();
            
            // Spawn interactables
            this._spawnInteractables();
            
            // Setup zone triggers
            this._setupZoneTriggers();
            
            this.active = true;
            console.log('[Chapter 1] Initialized with', this.objectives.length, 'objectives');
            
            // Start first objective
            this.startObjective(0);
        },
        
        // ==========================================
        // SETUP EVENT LISTENERS
        // ==========================================
        _setupEventListeners: function() {
            // Listen for player input (first movement, first look)
            document.addEventListener('keydown', (e) => {
                if (!this.active) return;
                if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                    this._onFirstMovement();
                }
            });
            
            document.addEventListener('mousemove', () => {
                if (!this.active) return;
                this._onFirstLook();
            });
            
            // Listen for game events
            window.addEventListener('enemySpotted', () => this._onEnemySpotted());
            window.addEventListener('playerDamaged', () => this._onPlayerDamaged());
            window.addEventListener('lowAmmo', () => this._onLowAmmo());
        },
        
        // ==========================================
        // SPAWN INTERACTABLES
        // ==========================================
        _spawnInteractables: function() {
            if (this.interactablesSpawned || !window.scene) return;
            
            const interactables = window.OmniOpsChapter1Data.interactables;
            
            interactables.forEach(data => {
                this._createInteractable(data);
            });
            
            this.interactablesSpawned = true;
            console.log('[Chapter 1] Spawned', interactables.length, 'interactables');
        },
        
        _createInteractable: function(data) {
            if (!window.THREE || !window.scene) return;
            
            // Create visual marker
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.3
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(data.position.x, data.position.y + 1, data.position.z);
            mesh.userData = {
                type: 'interactable',
                interactableId: data.id,
                interactableType: data.type,
                linkedObjective: data.linkedObjective,
                interactText: data.interactText,
                onInteract: data.onInteract
            };
            window.scene.add(mesh);
            
            console.log('[Chapter 1] Created interactable:', data.id, 'at', data.position);
        },
        
        // ==========================================
        // SETUP ZONE TRIGGERS
        // ==========================================
        _setupZoneTriggers: function() {
            const triggers = window.OmniOpsChapter1Data.zoneTriggers;
            this.zoneTriggers = triggers.map(t => ({
                ...t,
                triggered: false
            }));
            console.log('[Chapter 1] Setup', this.zoneTriggers.length, 'zone triggers');
        },
        
        // ==========================================
        // UPDATE (Called from game loop)
        // ==========================================
        update: function(deltaTime) {
            if (!this.active) return;
            
            // Track player movement
            this._trackPlayerMovement();
            
            // Check zone triggers
            this._checkZoneTriggers();
            
            // Check navigation warnings
            this._checkNavigationWarnings(deltaTime);
        },
        
        _trackPlayerMovement: function() {
            if (!window.cameraRig) return;
            
            const currentPos = window.cameraRig.position.clone();
            
            if (this.lastPlayerPosition) {
                const distance = currentPos.distanceTo(this.lastPlayerPosition);
                this.playerMovedDistance += distance;
            }
            
            this.lastPlayerPosition = currentPos;
        },
        
        _checkZoneTriggers: function() {
            if (!window.cameraRig) return;
            
            const playerPos = window.cameraRig.position;
            
            this.zoneTriggers.forEach(trigger => {
                if (trigger.triggered) return;
                
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - trigger.position.x, 2) +
                    Math.pow(playerPos.z - trigger.position.z, 2)
                );
                
                if (distance < trigger.radius) {
                    trigger.triggered = true;
                    this._onZoneTrigger(trigger);
                }
            });
        },
        
        _checkNavigationWarnings: function(deltaTime) {
            // TODO: Implement off-course detection
            // Check if player is moving away from objective for extended time
        },
        
        // ==========================================
        // OBJECTIVE MANAGEMENT
        // ==========================================
        startObjective: function(index) {
            if (index >= this.objectives.length) {
                console.log('[Chapter 1] All objectives complete!');
                this._onChapterComplete();
                return;
            }
            
            const obj = this.objectives[index];
            if (obj.state !== 'locked' && obj.state !== 'active') return;
            
            console.log('[Chapter 1] Starting objective:', obj.id);
            
            obj.state = 'active';
            obj.startTime = Date.now();
            this.currentObjectiveIndex = index;
            this.objectiveStartTime = Date.now();
            
            // Update HUD
            this._updateObjectiveHUD(obj);
            
            // Play ARIA VO
            if (obj.voOnStart && window.AriaVoRouter) {
                window.AriaVoRouter.play(obj.voOnStart, { interrupt: false, queue: true });
            }
            
            // Show tutorial if applicable
            if (obj.isTutorial) {
                this._showTutorialFor(obj.id);
            }
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('objectiveStarted', { detail: obj }));
        },
        
        completeObjective: function(objectiveId) {
            const index = this.objectives.findIndex(o => o.id === objectiveId);
            if (index === -1) {
                console.warn('[Chapter 1] Objective not found:', objectiveId);
                return;
            }
            
            const obj = this.objectives[index];
            if (obj.state === 'completed') return;
            
            console.log('[Chapter 1] Completing objective:', obj.id);
            
            obj.state = 'completed';
            obj.completeTime = Date.now();
            this.completedObjectives.push(obj.id);
            
            // Play completion VO
            if (obj.voOnComplete && window.AriaVoRouter) {
                window.AriaVoRouter.play(obj.voOnComplete, { interrupt: false, queue: true });
            }
            
            // Update HUD
            this._updateObjectiveHUD(obj, true);
            
            // Start next objective
            setTimeout(() => {
                this.startObjective(index + 1);
            }, 2000);
            
            // Dispatch event
            window.dispatchEvent(new CustomEvent('objectiveCompleted', { detail: obj }));
        },
        
        getCurrentObjective: function() {
            return this.objectives[this.currentObjectiveIndex];
        },
        
        // ==========================================
        // HUD UPDATES
        // ==========================================
        _updateObjectiveHUD: function(objective, isComplete = false) {
            const objectiveEl = document.getElementById('omni-objective-text');
            const questLogEl = document.getElementById('omni-quest-log-text');
            
            if (objectiveEl) {
                if (isComplete) {
                    objectiveEl.innerHTML = `<span style="color: #0f6;">✓</span> ${objective.title}`;
                    setTimeout(() => {
                        objectiveEl.textContent = '';
                    }, 3000);
                } else {
                    objectiveEl.textContent = objective.title;
                }
            }
            
            if (questLogEl) {
                questLogEl.textContent = objective.questLog;
            }
            
            // Log to message system
            if (window.logMessage) {
                if (isComplete) {
                    window.logMessage(`[OBJECTIVE COMPLETE] ${objective.title}`);
                } else {
                    window.logMessage(`[NEW OBJECTIVE] ${objective.title}`);
                }
            }
        },
        
        // ==========================================
        // TUTORIAL SYSTEM
        // ==========================================
        _showTutorialFor: function(objectiveId) {
            const tutorials = window.OmniOpsChapter1Data.tutorials;
            const tutorial = tutorials.find(t => t.linkedObjective === objectiveId);
            
            if (!tutorial) return;
            if (tutorial.triggerOnce && this.tutorialsShown[tutorial.id]) return;
            
            this.showTutorial(tutorial.id);
        },
        
        showTutorial: function(tutorialId) {
            const tutorials = window.OmniOpsChapter1Data.tutorials;
            const tutorial = tutorials.find(t => t.id === tutorialId);
            
            if (!tutorial) {
                console.warn('[Chapter 1] Tutorial not found:', tutorialId);
                return;
            }
            
            if (tutorial.triggerOnce && this.tutorialsShown[tutorialId]) return;
            
            console.log('[Chapter 1] Showing tutorial:', tutorialId);
            this.tutorialsShown[tutorialId] = true;
            
            // Display tutorial
            const tutorialEl = document.getElementById('omni-tutorial');
            if (tutorialEl) {
                tutorialEl.querySelector('.tutorial-title').textContent = tutorial.title;
                tutorialEl.querySelector('.tutorial-body').textContent = tutorial.body;
                tutorialEl.style.display = 'block';
                tutorialEl.classList.add('active');
                
                // Auto-hide after 8 seconds
                setTimeout(() => {
                    tutorialEl.classList.remove('active');
                    setTimeout(() => {
                        tutorialEl.style.display = 'none';
                    }, 500);
                }, 8000);
            }
            
            // Play VO if applicable
            if (tutorial.voLine && window.AriaVoRouter) {
                window.AriaVoRouter.play(tutorial.voLine, { queue: true });
            }
        },
        
        // ==========================================
        // EVENT HANDLERS
        // ==========================================
        _onFirstLook: function() {
            if (this.playerHasLooked) return;
            this.playerHasLooked = true;
            
            // Complete OBJ_C1_WAKE after looking around for 2 seconds
            setTimeout(() => {
                if (this.getCurrentObjective()?.id === 'OBJ_C1_WAKE') {
                    this.completeObjective('OBJ_C1_WAKE');
                }
            }, 2000);
        },
        
        _onFirstMovement: function() {
            if (this.playerHasMoved) return;
            this.playerHasMoved = true;
            
            console.log('[Chapter 1] Player moved for first time');
            
            // Complete OBJ_C1_FIRST_MOVEMENT
            if (this.getCurrentObjective()?.id === 'OBJ_C1_FIRST_MOVEMENT') {
                setTimeout(() => {
                    this.completeObjective('OBJ_C1_FIRST_MOVEMENT');
                }, 3000);
            }
        },
        
        onInteract: function(interactableId) {
            const interactable = window.OmniOpsChapter1Data.interactables.find(i => i.id === interactableId);
            if (!interactable) return;
            
            console.log('[Chapter 1] Interacted with:', interactableId);
            
            // Complete linked objective
            if (interactable.linkedObjective) {
                this.completeObjective(interactable.linkedObjective);
            }
            
            // Handle specific interaction types
            if (interactable.onInteract === 'showTerminalLog') {
                this._showTerminalLog();
            }
        },
        
        _onZoneTrigger: function(trigger) {
            console.log('[Chapter 1] Zone trigger activated:', trigger.id);
            
            // Handle tutorial triggers
            if (trigger.tutorialId) {
                this.showTutorial(trigger.tutorialId);
            }
            
            if (trigger.triggerObjective) {
                const currentObj = this.getCurrentObjective();
                if (currentObj && currentObj.id === trigger.triggerObjective) {
                    this.completeObjective(trigger.triggerObjective);
                }
            }
            
            // Handle damage zones
            if (trigger.damagePerSecond > 0) {
                this._startCorruptionDamage(trigger);
            }
        },
        
        _onEnemySpotted: function() {
            if (window.AriaVoRouter) {
                window.AriaVoRouter.play('ARIA_C1_019', { interrupt: false, skipIfPlaying: true });
            }
        },
        
        _onPlayerDamaged: function() {
            if (!window.player) return;
            
            if (window.player.health < 30 && window.AriaVoRouter) {
                window.AriaVoRouter.play('ARIA_C1_023', { interrupt: true });
            }
        },
        
        _onLowAmmo: function() {
            if (window.AriaVoRouter) {
                window.AriaVoRouter.play('ARIA_C1_024', { skipIfPlaying: true });
            }
        },
        
        // ==========================================
        // SPECIAL INTERACTIONS
        // ==========================================
        _showTerminalLog: function() {
            // Show terminal screen overlay
            console.log('[Chapter 1] Displaying terminal log...');
            
            const logText = `
=== ARCHIVE SYSTEM LOG ===
TIMESTAMP: CYCLE 9247.33

ADMIN NOTICE: SECTOR PURGE INITIATED
REASON: Corruption threshold exceeded in Archive Beta-7
AFFECTED ENTITIES: All data constructs in sector
PROTOCOL: Delete-on-sight for corrupted processes

WARNING: System Runners detected in purge zone
CLASSIFICATION: Corrupted data / Preservation anomaly
ACTION: Terminate and defragment

ARIA NOTE: We're not corrupted. We're what keeps this place alive.
            `;
            
            // Display in dialogue box or custom UI
            if (window.logMessage) {
                window.logMessage('[TERMINAL] Access granted - Reading system logs...');
            }
            
            // TODO: Show full terminal UI overlay
        },
        
        _startCorruptionDamage: function(trigger) {
            // Apply damage over time while in corruption zone
            console.log('[Chapter 1] Player entered corruption field');
            
            if (window.AriaVoRouter) {
                window.AriaVoRouter.play('ARIA_C1_016', { interrupt: true });
            }
            
            // TODO: Implement actual damage-over-time
        },
        
        // ==========================================
        // CHAPTER COMPLETE
        // ==========================================
        _onChapterComplete: function() {
            console.log('[Chapter 1] "Cold Boot" complete!');
            this.active = false;
            
            // Final VO
            if (window.AriaVoRouter) {
                window.AriaVoRouter.play('ARIA_C1_027');
            }
            
            // Dispatch completion event
            window.dispatchEvent(new CustomEvent('chapterComplete', { 
                detail: { 
                    chapterId: 'ACT1_CH1',
                    objectivesCompleted: this.completedObjectives.length,
                    timeElapsed: Date.now() - this.objectives[0].startTime
                }
            }));
            
            // Show completion screen
            if (window.logMessage) {
                window.logMessage('[CHAPTER COMPLETE] Cold Boot - Act 1, Chapter 1');
            }
        },
        
        // ==========================================
        // DEBUG / UTILITY
        // ==========================================
        getStatus: function() {
            return {
                active: this.active,
                currentObjective: this.getCurrentObjective(),
                completedCount: this.completedObjectives.length,
                totalObjectives: this.objectives.length,
                tutorialsShown: Object.keys(this.tutorialsShown)
            };
        },
        
        skipToObjective: function(objectiveId) {
            const index = this.objectives.findIndex(o => o.id === objectiveId);
            if (index === -1) return;
            
            // Mark all previous as complete
            for (let i = 0; i < index; i++) {
                this.objectives[i].state = 'completed';
            }
            
            this.startObjective(index);
        }
    };
    
    console.log('[Chapter 1] Controller loaded');
})();
