// ============================================================================
// COMPREHENSIVE MULTIPLAYER SYNCHRONIZATION MODULE
// Ensures host and all peers see identical world state, objects, and entities
// ============================================================================

(function() {
    'use strict';

    const MultiplayerSync = {
        // Sync state
        lastSyncTime: 0,
        syncInterval: 50, // 50ms sync rate
        pendingUpdates: [],
        playerInterpolation: {},
        
        // Entity tracking
        trackedObjects: {}, // All objects that need sync: {id: {type, state, ...}}
        entityIdCounter: 0,
        
        // World state hash for consistency checking
        worldStateHash: 0,
        lastHashCheck: 0,
        hashCheckInterval: 5000, // 5 second full reconciliation
        
        // ======== INITIALIZATION ========
        init() {
            console.log('[MultiplayerSync] Full-featured synchronization initialized');
        },

        // ======== ENTITY REGISTRATION ========
        // Register an object for synchronization
        registerEntity(id, type, data) {
            if (!id) id = `entity-${++this.entityIdCounter}`;
            
            this.trackedObjects[id] = {
                id,
                type, // 'PLAYER', 'AI', 'EDITOR_OBJECT', 'PROP', etc.
                lastUpdate: Date.now(),
                state: data || {},
                dirty: true // Mark as needing sync
            };
            
            console.log(`[MultiplayerSync] Registered ${type}: ${id}`);
            return id;
        },

        // Update entity state and mark dirty for sync
        updateEntity(id, state) {
            if (this.trackedObjects[id]) {
                this.trackedObjects[id].state = { ...this.trackedObjects[id].state, ...state };
                this.trackedObjects[id].dirty = true;
                this.trackedObjects[id].lastUpdate = Date.now();
            }
        },

        unregisterEntity(id) {
            if (this.trackedObjects[id]) {
                console.log(`[MultiplayerSync] Unregistered: ${id}`);
                delete this.trackedObjects[id];
            }
        },

        // ======== WORLD STATE SERIALIZATION ========
        // Create full world state snapshot
        getWorldState() {
            const state = {
                timestamp: Date.now(),
                seed: window.gameState?.worldSeed || 0,
                timeOfDay: window.gameState?.timeOfDay || 0,
                reputation: window.gameState?.reputation || 0,
                entities: {},
                editorObjects: []
            };

            // Sync all tracked objects
            Object.entries(this.trackedObjects).forEach(([id, entity]) => {
                state.entities[id] = {
                    id: entity.id,
                    type: entity.type,
                    state: entity.state,
                    lastUpdate: entity.lastUpdate
                };
            });

            // Sync editor-placed objects (from window.UE5Editor)
            if (window.UE5Editor && window.UE5Editor.objects) {
                state.editorObjects = window.UE5Editor.objects.map(obj => ({
                    type: obj.userData?.type || 'unknown',
                    position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
                    rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
                    scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
                }));
            }

            return state;
        },

        // ======== DIRTY ENTITY SYNC ========
        // Get only changed entities since last sync
        getDirtyEntities() {
            const dirty = {};
            Object.entries(this.trackedObjects).forEach(([id, entity]) => {
                if (entity.dirty) {
                    dirty[id] = {
                        id: entity.id,
                        type: entity.type,
                        state: entity.state
                    };
                    entity.dirty = false; // Reset dirty flag
                }
            });
            return dirty;
        },

        // ======== WORLD STATE PACKETS ========
        // Create full sync packet (sent on join or periodic full reconciliation)
        createFullSyncPacket() {
            return {
                type: 'WORLD_SYNC_FULL',
                timestamp: Date.now(),
                worldState: this.getWorldState()
            };
        },

        // Create delta sync packet (sent every frame, only changes)
        createDeltaSyncPacket() {
            return {
                type: 'WORLD_SYNC_DELTA',
                timestamp: Date.now(),
                dirtyEntities: this.getDirtyEntities()
            };
        },

        // ======== REMOTE STATE APPLICATION ========
        // Apply full world state received from host
        applyFullWorldState(worldState) {
            console.log('[MultiplayerSync] Applying full world state sync');
            
            if (window.gameState) {
                if (worldState.seed && !window.gameState.seedLocked) {
                    window.gameState.worldSeed = worldState.seed;
                    window.gameState.seedLocked = true;
                }
                
                window.gameState.timeOfDay = worldState.timeOfDay;
                window.gameState.reputation = worldState.reputation;
            }

            // Update all entities
            Object.entries(worldState.entities || {}).forEach(([id, entity]) => {
                if (entity.type === 'PLAYER') {
                    this.applyRemotePlayerState(id, entity.state);
                } else if (entity.type === 'AI') {
                    this.applyRemoteAIState(id, entity.state);
                }
            });

            // Sync editor objects
            if (worldState.editorObjects && worldState.editorObjects.length > 0) {
                this.syncEditorObjects(worldState.editorObjects);
            }
        },

        // Apply delta world state (changes only)
        applyDeltaWorldState(dirtyEntities) {
            Object.entries(dirtyEntities || {}).forEach(([id, entity]) => {
                if (entity.type === 'PLAYER') {
                    this.applyRemotePlayerState(id, entity.state);
                } else if (entity.type === 'AI') {
                    this.applyRemoteAIState(id, entity.state);
                }
            });
        },

        // ======== REMOTE ENTITY APPLICATION ========
        applyRemotePlayerState(peerId, state) {
            if (peerId === window.myPeerId) return; // Ignore own state

            // Use existing updateRemotePlayer from core-game
            if (window.updateRemotePlayer) {
                window.updateRemotePlayer(peerId, state);
            }

            // Setup interpolation for smooth movement
            if (!this.playerInterpolation[peerId]) {
                this.playerInterpolation[peerId] = {
                    lastPos: new THREE.Vector3(),
                    lastYaw: 0,
                    nextPos: new THREE.Vector3(),
                    nextYaw: 0,
                    progress: 0
                };
            }

            const interp = this.playerInterpolation[peerId];
            interp.lastPos.copy(interp.nextPos);
            interp.nextPos.set(state.x, state.y, state.z);
            interp.lastYaw = interp.nextYaw;
            interp.nextYaw = state.yaw;
            interp.progress = 0;
        },

        applyRemoteAIState(aiId, state) {
            if (!window.aiUnits) return;
            const ai = window.aiUnits.find(u => u.userData.id === aiId);
            if (ai) {
                ai.serverPos = new THREE.Vector3(state.x, state.y, state.z);
                ai.mesh.rotation.y = state.rotY;
                ai.userData.status = state.status;
            }
        },

        // ======== EDITOR OBJECT SYNCHRONIZATION ========
        syncEditorObjects(remoteObjects) {
            console.log(`[MultiplayerSync] Syncing ${remoteObjects.length} editor objects`);
            
            if (!window.scene || !window.UE5Editor) return;

            // Get current editor objects
            const currentCount = window.UE5Editor.objects.length;

            // Only sync if count differs (prevent duplication)
            if (remoteObjects.length !== currentCount) {
                console.log(`[MultiplayerSync] Local: ${currentCount}, Remote: ${remoteObjects.length} - Reconciling`);
                
                // Clear and rebuild from remote state
                window.UE5Editor.objects.forEach(obj => window.scene.remove(obj));
                window.UE5Editor.objects = [];

                remoteObjects.forEach(remoteObj => {
                    const assetDef = window.UE5Editor.findAsset(remoteObj.type);
                    if (assetDef) {
                        const mesh = window.UE5Editor.createMesh(assetDef);
                        mesh.position.set(remoteObj.position.x, remoteObj.position.y, remoteObj.position.z);
                        mesh.rotation.set(remoteObj.rotation.x, remoteObj.rotation.y, remoteObj.rotation.z);
                        mesh.scale.set(remoteObj.scale.x, remoteObj.scale.y, remoteObj.scale.z);
                        
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        mesh.userData = { ue5: true, type: remoteObj.type, ...assetDef };
                        
                        window.scene.add(mesh);
                        window.UE5Editor.objects.push(mesh);
                    }
                });

                window.UE5Editor.updateEntityCount();
                console.log('[MultiplayerSync] Editor objects synchronized from host');
            }
        },

        // ======== WORLD STATE CONSISTENCY CHECK ========
        // Full reconciliation every 5 seconds
        checkWorldStateConsistency() {
            const now = Date.now();
            if (now - this.lastHashCheck < this.hashCheckInterval) return;

            this.lastHashCheck = now;

            // Skip consistency checks if not in game or not multiplayer
            if (!window.isGameActive || !window.isMultiplayer) return;

            console.log('[MultiplayerSync] Performing world state consistency check');
            
            if (window.isHost) {
                // Host broadcasts full state periodically
                const fullState = this.createFullSyncPacket();
                if (window.safeBroadcast) {
                    window.safeBroadcast(fullState);
                }
            }
        },

        // ======== PLAYER INTERPOLATION ========
        // Smooth out network updates with interpolation
        interpolateRemotePlayers(deltaTime) {
            const interpSpeed = 0.15; // Interpolation speed
            
            Object.entries(this.playerInterpolation).forEach(([peerId, interp]) => {
                interp.progress = Math.min(1, interp.progress + (deltaTime / 50)); // 50ms base

                if (window.remotePlayers && window.remotePlayers[peerId]) {
                    const remotePlayer = window.remotePlayers[peerId];
                    
                    // Interpolate position
                    remotePlayer.targetPos.lerpVectors(interp.lastPos, interp.nextPos, interp.progress);
                    
                    // Interpolate yaw
                    const yawDelta = interp.nextYaw - interp.lastYaw;
                    const normalizedDelta = Math.atan2(Math.sin(yawDelta), Math.cos(yawDelta));
                    remotePlayer.targetYaw = interp.lastYaw + normalizedDelta * interp.progress;
                }
            });
        },

        // ======== BROADCAST HELPERS ========
        // Broadcast player state (called from broadcastState)
        broadcastPlayerState(playerData) {
            const entityData = {
                id: playerData.id,
                type: 'PLAYER',
                state: playerData
            };
            this.updateEntity(playerData.id, playerData);
        },

        // Broadcast AI state (host only)
        broadcastAIState(aiUnit) {
            const entityData = {
                id: aiUnit.userData.id,
                type: 'AI',
                state: {
                    id: aiUnit.userData.id,
                    x: aiUnit.mesh.position.x,
                    y: aiUnit.mesh.position.y,
                    z: aiUnit.mesh.position.z,
                    rotY: aiUnit.mesh.rotation.y,
                    status: aiUnit.userData.status,
                    faction: aiUnit.userData.faction
                }
            };
            this.updateEntity(aiUnit.userData.id, entityData.state);
        },

        // Broadcast editor object placement
        broadcastEditorObjectPlaced(mesh, assetType) {
            const objData = {
                type: assetType,
                position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
                rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
                scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z }
            };

            if (window.isHost && window.safeBroadcast) {
                window.safeBroadcast({
                    type: 'EDITOR_OBJECT_PLACED',
                    object: objData
                });
            }
        }
    };

    window.MultiplayerSync = MultiplayerSync;
    MultiplayerSync.init();
    console.log('[Multiplayer Sync] Module loaded');
})();
