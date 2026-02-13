// OMNI-OPS: Chapter 1 Integration with Core Game
(function() {
    'use strict';

    console.log('[Chapter 1 Integration] Loading...');

    // ==========================================
    // HOOK INTO GAME START
    // ==========================================
    
    // Define startStoryMode for OMNI-OPS Chapter 1
    window.startStoryMode = function() {
        console.log('[Chapter 1 Integration] Story mode triggered - starting OMNI-OPS Chapter 1');
        if (window.OmniOpsChapter1) {
            window.OmniOpsChapter1.init();
        } else {
            console.error('[Chapter 1 Integration] Chapter 1 controller not loaded!');
        }
    };

    let startRoomCreated = false;
    let spawnConfigured = false;

    // ==========================================
    // CHAPTER 1 LEVEL GENERATION
    // ==========================================
    
    function createChapter1StartRoom(targetScene) {
        // This function should only be called when scene is ready
        if (targetScene && targetScene !== window.scene) {
            window.scene = targetScene;
        }
        if (!window.THREE || !window.scene) {
            console.error('[Chapter 1 Integration] CRITICAL: createChapter1StartRoom called but THREE or scene not available');
            console.error('[Chapter 1 Integration] THREE exists:', !!window.THREE, 'scene exists:', !!window.scene);
            return false;
        }

        if (startRoomCreated) return true;
        
        console.log('[Chapter 1 Integration] ✓ Scene available, creating start room geometry...');
        console.log('[Chapter 1 Integration] THREE.Scene object count before:', window.scene.children.length);
        
        let meshCount = 0;
        
        // Material for greybox geometry
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            roughness: 0.8,
            metalness: 0.2
        });
        
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.9,
            metalness: 0.1
        });
        
        const accentMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00ff88, 
            emissive: 0x00ff88,
            emissiveIntensity: 0.2
        });
        
        // Floor (20m x 80m corridor)
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.5, 80),
            floorMaterial
        );
        floor.position.set(0, -0.25, 40);
        floor.receiveShadow = true;
        floor.userData = { type: 'chapter1_room', name: 'floor' };
        window.scene.add(floor);
        meshCount++;
        
        // Left wall
        const leftWall = new THREE.Mesh(
            new THREE.BoxGeometry(1, 6, 80),
            wallMaterial
        );
        leftWall.position.set(-10, 3, 40);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        leftWall.userData = { type: 'chapter1_room', name: 'left_wall' };
        window.scene.add(leftWall);
        meshCount++;
        
        // Right wall
        const rightWall = new THREE.Mesh(
            new THREE.BoxGeometry(1, 6, 80),
            wallMaterial
        );
        rightWall.position.set(10, 3, 40);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        rightWall.userData = { type: 'chapter1_room', name: 'right_wall' };
        window.scene.add(rightWall);
        meshCount++;
        
        // Back wall (behind player)
        const backWall = new THREE.Mesh(
            new THREE.BoxGeometry(20, 6, 1),
            wallMaterial
        );
        backWall.position.set(0, 3, 0);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        backWall.userData = { type: 'chapter1_room', name: 'back_wall' };
        window.scene.add(backWall);
        meshCount++;
        
        // Doorway frame at far end (player's goal landmark)
        const doorFrameLeft = new THREE.Mesh(
            new THREE.BoxGeometry(1, 6, 2),
            accentMaterial
        );
        doorFrameLeft.position.set(-6, 3, 78);
        doorFrameLeft.userData = { type: 'chapter1_room', name: 'door_frame_left' };
        window.scene.add(doorFrameLeft);
        meshCount++;
        
        const doorFrameRight = new THREE.Mesh(
            new THREE.BoxGeometry(1, 6, 2),
            accentMaterial
        );
        doorFrameRight.position.set(6, 3, 78);
        doorFrameRight.userData = { type: 'chapter1_room', name: 'door_frame_right' };
        window.scene.add(doorFrameRight);
        meshCount++;
        
        const doorFrameTop = new THREE.Mesh(
            new THREE.BoxGeometry(12, 1, 2),
            accentMaterial
        );
        doorFrameTop.position.set(0, 6, 78);
        doorFrameTop.userData = { type: 'chapter1_room', name: 'door_frame_top' };
        window.scene.add(doorFrameTop);
        meshCount++;
        
        // Ceiling panels (partial coverage for atmosphere)
        for (let i = 0; i < 4; i++) {
            const ceiling = new THREE.Mesh(
                new THREE.BoxGeometry(18, 0.3, 15),
                wallMaterial
            );
            ceiling.position.set(0, 6, i * 20 + 10);
            ceiling.castShadow = true;
            ceiling.userData = { type: 'chapter1_room', name: `ceiling_${i}` };
            window.scene.add(ceiling);
            meshCount++;
        }
        
        // Add ambient light sources (glowing cubes)
        const light1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ 
                color: 0x00ffcc, 
                emissive: 0x00ffcc, 
                emissiveIntensity: 1.0 
            })
        );
        light1.position.set(-8, 5, 20);
        window.scene.add(light1);
        meshCount++;
        
        const pointlight1 = new THREE.PointLight(0x00ffcc, 1.5, 15);
        pointlight1.position.copy(light1.position);
        window.scene.add(pointlight1);
        
        const light2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ 
                color: 0x00ffcc, 
                emissive: 0x00ffcc, 
                emissiveIntensity: 1.0 
            })
        );
        light2.position.set(8, 5, 40);
        window.scene.add(light2);
        meshCount++;
        
        const pointlight2 = new THREE.PointLight(0x00ffcc, 1.5, 15);
        pointlight2.position.copy(light2.position);
        window.scene.add(pointlight2);
        
        const light3 = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ 
                color: 0x00ffcc, 
                emissive: 0x00ffcc, 
                emissiveIntensity: 1.0 
            })
        );
        light3.position.set(-8, 5, 60);
        window.scene.add(light3);
        meshCount++;
        
        const pointlight3 = new THREE.PointLight(0x00ffcc, 1.5, 15);
        pointlight3.position.copy(light3.position);
        window.scene.add(pointlight3);
        
        // Add visual hint - glowing path to doorway
        const pathMarker = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.1, 4),
            new THREE.MeshStandardMaterial({ 
                color: 0x00ff88, 
                emissive: 0x00ff88, 
                emissiveIntensity: 0.4,
                transparent: true,
                opacity: 0.6
            })
        );
        pathMarker.position.set(0, 0.05, 70);
        pathMarker.userData = { type: 'chapter1_room', name: 'path_marker' };
        window.scene.add(pathMarker);
        meshCount++;
        
        startRoomCreated = true;
        console.log('[Chapter 1 Integration] ✓✓✓ START ROOM SUCCESSFULLY CREATED ✓✓✓');
        console.log('[Chapter 1 Integration] Total meshes added:', meshCount);
        console.log('[Chapter 1 Integration] Scene now contains:', window.scene.children.length, 'total objects');
        console.log('[Chapter 1 Integration] Room bounds: X[-10, 10], Y[0, 6], Z[0, 80]');
        
        return true;
    }
    
    function setChapter1PlayerSpawn(playerRef, cameraRigRef) {
        // This function should only be called when cameraRig is ready
        const rig = cameraRigRef || window.cameraRig;
        if (!rig) {
            console.error('[Chapter 1 Integration] CRITICAL: setChapter1PlayerSpawn called but cameraRig not available');
            return false;
        }

        if (spawnConfigured) return true;
        
        console.log('[Chapter 1 Integration] ✓ cameraRig available, setting player spawn...');
        
        // Spawn player at back of room, facing forward toward doorway
        rig.position.set(0, 1.6, 5);
        
        // Set camera to look forward (toward the doorway)
        if (window.camera) {
            window.camera.rotation.set(0, 0, 0);
        }
        
        // Update scene background to dark/corrupted
        if (window.scene) {
            window.scene.background = new THREE.Color(0x0a0a0a);
            window.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.02);
            console.log('[Chapter 1 Integration] Scene atmosphere updated (dark background + fog)');
        }
        
        spawnConfigured = true;
        console.log('[Chapter 1 Integration] ✓✓✓ PLAYER SPAWN CONFIGURED (0, 1.6, 5) ✓✓✓');
        console.log('[Chapter 1 Integration] Position:', rig.position);
        console.log('[Chapter 1 Integration] Facing: +Z (toward doorway at z=78)');
        
        // Prevent standard spawn position overrides
        window.chapter1SpawnOverride = true;
        
        return true;
    }

    const MAX_INIT_CHECKS = 100; // 10 seconds max
    function waitForGameReady(onReady) {
        if (typeof onReady !== 'function') return;

        let initCheckAttempts = 0;
        const checkReady = () => {
            initCheckAttempts++;
            const isReady = window.isGameActive && window.scene && window.cameraRig && window.THREE;

            if (isReady) {
                console.log('[Chapter 1 Integration] ✓ Game is ready (isGameActive, scene, cameraRig, THREE all exist)');
                console.log('[Chapter 1 Integration] Took', initCheckAttempts * 100, 'ms to become ready');
                onReady();
                return;
            }

            if (initCheckAttempts >= MAX_INIT_CHECKS) {
                console.error('[Chapter 1 Integration] ERROR: Game never reached ready state (isGameActive=' + window.isGameActive + ', scene=' + !!window.scene + ', cameraRig=' + !!window.cameraRig + ', THREE=' + !!window.THREE + ')');
                return;
            }

            setTimeout(checkReady, 100);
        };

        checkReady();
    }

    // ==========================================
    // EXPLICIT STORY STARTUP - Chapter 1 initialization orchestration
    // ==========================================
    function initializeChapter1Story() {
        console.log('[Story] Mode set: CHAPTER1');
        window.OMNI_OPS_STORY_MODE = 'CHAPTER1';

        if (!window.OmniOpsChapter1) {
            console.error('[Story] OmniOpsChapter1 controller not loaded!');
            return;
        }

        // Step 1: Initialize controller if not active
        if (!window.OmniOpsChapter1.active) {
            window.OmniOpsChapter1.init();
        }

        // Step 2: Explicitly start first objective
        // This ensures currentObjectiveIndex is set, HUD is updated, and ARIA VO is queued
        window.OmniOpsChapter1.startObjective(0);
        
        const currentObj = window.OmniOpsChapter1.getCurrentObjective();
        if (currentObj && currentObj.id === 'OBJ_C1_WAKE') {
            console.log('[Objectives] Created and activated OBJ_C1_WAKE');
        } else {
            console.warn('[Objectives] First objective is not OBJ_C1_WAKE');
        }

        // Step 3: Verify ARIA VO was queued (queuing happens inside startObjective via voOnStart)
        if (window.AriaVoRouter) {
            const ariaLineId = currentObj?.voOnStart || 'unknown';
            console.log('[VO] Queued ' + ariaLineId);
        }
    }

    window.createChapter1StartRoom = createChapter1StartRoom;
    window.setChapter1PlayerSpawn = setChapter1PlayerSpawn;
    window.waitForChapter1GameReady = waitForGameReady;
    window.initializeChapter1Story = initializeChapter1Story;

    // ==========================================
    // HOOK INTO GAME UPDATE LOOP
    // ==========================================
    
    // Inject Chapter 1 update into game loop
    const originalAnimate = window.animate;
    if (originalAnimate) {
        window.animate = function() {
            // Call original animate
            originalAnimate.call(this);
            
            // Update Chapter 1
            if (window.OmniOpsChapter1 && window.OmniOpsChapter1.active && window.clock) {
                const delta = window.clock.getDelta();
                window.OmniOpsChapter1.update(delta);
            }
        };
    } else {
        // If animate doesn't exist yet, set up a watcher
        let checkCount = 0;
        const checkInterval = setInterval(() => {
            if (window.animate) {
                const originalAnimateDelayed = window.animate;
                window.animate = function() {
                    originalAnimateDelayed.call(this);
                    if (window.OmniOpsChapter1 && window.OmniOpsChapter1.active && window.clock) {
                        const delta = window.clock.getDelta();
                        window.OmniOpsChapter1.update(delta);
                    }
                };
                clearInterval(checkInterval);
                console.log('[Chapter 1 Integration] Hooked into animate loop');
            }
            checkCount++;
            if (checkCount > 50) clearInterval(checkInterval);
        }, 100);
    }

    // ==========================================
    // HOOK INTO INTERACTION SYSTEM
    // ==========================================
    
    // Listen for F key for interactions
    document.addEventListener('keydown', (e) => {
        if (e.code !== 'KeyF') return;
        if (!window.OmniOpsChapter1 || !window.OmniOpsChapter1.active) return;
        
        // Check for nearby interactables
        if (window.raycaster && window.camera && window.scene) {
            const raycaster = window.raycaster;
            const camera = window.camera;
            
            // Raycast forward from camera
            raycaster.setFromCamera({ x: 0, y: 0 }, camera);
            const intersects = raycaster.intersectObjects(window.scene.children, true);
            
            for (let intersect of intersects) {
                const obj = intersect.object;
                if (obj.userData.type === 'interactable') {
                    const distance = intersect.distance;
                    if (distance < 5) { // Within interaction range
                        console.log('[Chapter 1 Integration] Interacting with:', obj.userData.interactableId);
                        window.OmniOpsChapter1.onInteract(obj.userData.interactableId);
                        break;
                    }
                }
            }
        }
    });

    // ==========================================
    // PROXIMITY INTERACTION PROMPT
    // ==========================================
    
    // Show "Press F" prompt when near interactables
    if (window.requestAnimationFrame) {
        function checkInteractionProximity() {
            if (!window.OmniOpsChapter1 || !window.OmniOpsChapter1.active) {
                requestAnimationFrame(checkInteractionProximity);
                return;
            }
            
            const promptEl = document.getElementById('interaction-prompt');
            if (!promptEl || !window.cameraRig || !window.scene) {
                requestAnimationFrame(checkInteractionProximity);
                return;
            }
            
            let nearestInteractable = null;
            let nearestDistance = 5;
            
            // Check all interactables
            window.scene.traverse((obj) => {
                if (obj.userData.type === 'interactable') {
                    const distance = window.cameraRig.position.distanceTo(obj.position);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestInteractable = obj.userData;
                    }
                }
            });
            
            if (nearestInteractable) {
                promptEl.textContent = nearestInteractable.interactText || 'Press F to interact';
                promptEl.style.display = 'block';
            } else {
                promptEl.style.display = 'none';
            }
            
            requestAnimationFrame(checkInteractionProximity);
        }
        
        // Start checking after game initializes
        setTimeout(() => {
            checkInteractionProximity();
        }, 2000);
    }

    // ==========================================
    // COMBAT EVENT HOOKS
    // ==========================================
    
    // Hook into enemy spawning to trigger events
    const originalCreateAIUnit = window.createAIUnit;
    if (originalCreateAIUnit) {
        window.createAIUnit = function(x, z, faction) {
            const unit = originalCreateAIUnit.call(this, x, z, faction);
            
            // Check if player can see this enemy
            if (unit && window.cameraRig && window.OmniOpsChapter1 && window.OmniOpsChapter1.active) {
                const distance = Math.sqrt(
                    Math.pow(window.cameraRig.position.x - x, 2) +
                    Math.pow(window.cameraRig.position.z - z, 2)
                );
                
                if (distance < 30) {
                    window.dispatchEvent(new CustomEvent('enemySpotted'));
                }
            }
            
            return unit;
        };
    }

    // Hook into damage system
    const originalDamagePlayer = window.damagePlayer;
    if (originalDamagePlayer) {
        window.damagePlayer = function(amount) {
            originalDamagePlayer.call(this, amount);
            window.dispatchEvent(new CustomEvent('playerDamaged'));
        };
    }

    // Hook into ammo system
    if (window.player) {
        Object.defineProperty(window.player, 'ammo', {
            get: function() { return this._ammo || 30; },
            set: function(value) {
                this._ammo = value;
                if (value < 10) {
                    window.dispatchEvent(new CustomEvent('lowAmmo'));
                }
            }
        });
    }

    // ==========================================
    // TUTORIAL DISMISS
    // ==========================================
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Escape') {
            const tutorialEl = document.getElementById('omni-tutorial');
            if (tutorialEl && tutorialEl.style.display === 'block') {
                tutorialEl.classList.remove('active');
                setTimeout(() => {
                    tutorialEl.style.display = 'none';
                }, 500);
            }
        }
    });

    // ==========================================
    // CONSOLE HELPERS
    // ==========================================
    
    window.OmniOpsDebug = {
        startChapter1: function() {
            if (window.OmniOpsChapter1) {
                window.OmniOpsChapter1.init();
            } else {
                console.error('Chapter 1 controller not loaded');
            }
        },
        
        skipToObjective: function(objectiveId) {
            if (window.OmniOpsChapter1) {
                window.OmniOpsChapter1.skipToObjective(objectiveId);
            }
        },
        
        playAriaLine: function(lineId) {
            if (window.AriaVoRouter) {
                window.AriaVoRouter.play(lineId);
            }
        },
        
        showTutorial: function(tutorialId) {
            if (window.OmniOpsChapter1) {
                window.OmniOpsChapter1.showTutorial(tutorialId);
            }
        },
        
        getChapterStatus: function() {
            if (window.OmniOpsChapter1) {
                console.table(window.OmniOpsChapter1.getStatus());
            }
        },
        
        getAriaStatus: function() {
            if (window.AriaVoRouter) {
                console.table(window.AriaVoRouter.getStatus());
            }
        }
    };

    console.log('[Chapter 1 Integration] Ready');
    console.log('[DEBUG] Use OmniOpsDebug.startChapter1() to manually start Chapter 1');
    console.log('[DEBUG] Use OmniOpsDebug.getChapterStatus() to check objective progress');
})();
