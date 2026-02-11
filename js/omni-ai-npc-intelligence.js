// AI-Powered NPC Intelligence Enhancement
// Integrates with AI bridge for intelligent NPC behavior

(function() {
    'use strict';

    const AI_BRIDGE_URL = 'http://localhost:5000';
    let bridgeConnected = false;
    let aiDecisionCache = new Map();
    let cacheExpiry = 5000; // 5 second cache

    const NPCAIEnhancement = {
        enabled: false,
        updateInterval: null,
        lastCheck: 0,
        decisionQueue: [],

        init: function() {
            console.log('[NPC AI] Initializing AI enhancement system...');
            this.checkBridgeConnection();
            this.enhanceNPCSystem();
            this.startAILoop();
            console.log('[NPC AI] Enhancement ready');
        },

        async checkBridgeConnection() {
            try {
                const response = await fetch(`${AI_BRIDGE_URL}/health`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                bridgeConnected = data.status === 'healthy' && data.agent_ready;
                this.enabled = bridgeConnected;
                
                if (bridgeConnected) {
                    console.log('[NPC AI] ✓ Connected to AI bridge - Enhanced intelligence active');
                } else {
                    console.log('[NPC AI] ⚠ AI bridge not ready - Using fallback logic');
                }
            } catch (error) {
                bridgeConnected = false;
                this.enabled = false;
                console.log('[NPC AI] Using local intelligence (Bridge offline)');
            }

            // Recheck every 30 seconds
            setTimeout(() => this.checkBridgeConnection(), 30000);
        },

        enhanceNPCSystem: function() {
            // Enhance existing createAIUnit if it exists
            if (window.createAIUnit) {
                const originalCreate = window.createAIUnit;
                window.createAIUnit = function(...args) {
                    const npc = originalCreate.apply(this, args);
                    if (npc) {
                        NPCAIEnhancement.enhanceNPC(npc);
                    }
                    return npc;
                };
            }

            // Enhance existing NPCs
            if (window.aiUnits) {
                window.aiUnits.forEach(npc => this.enhanceNPC(npc));
            }

            // Enhance LivingWorldNPCs if available
            if (window.LivingWorldNPCs && window.LivingWorldNPCs.npcs) {
                window.LivingWorldNPCs.npcs.forEach(npc => this.enhanceNPC(npc));
            }
        },

        enhanceNPC: function(npc) {
            if (!npc || npc.aiEnhanced) return;

            // Add AI properties
            npc.aiEnhanced = true;
            npc.memory = {
                recentEvents: [],
                playerInteractions: [],
                threats: [],
                lastDecision: null
            };
            npc.personality = this.generatePersonality(npc);
            npc.contextAwareness = {
                nearbyEnemies: [],
                nearbyAllies: [],
                nearbyPlayers: [],
                environmentalThreats: [],
                opportunities: []
            };

            // Store original state change if exists
            if (npc.changeState) {
                npc._originalChangeState = npc.changeState;
            }

            // Override with AI-powered state changes
            npc.changeState = function(newState, reason) {
                // Log to memory
                this.memory.recentEvents.push({
                    timestamp: Date.now(),
                    event: 'state_change',
                    oldState: this.state,
                    newState: newState,
                    reason: reason
                });

                // Keep memory manageable
                if (this.memory.recentEvents.length > 20) {
                    this.memory.recentEvents.shift();
                }

                // Call original if exists
                if (this._originalChangeState) {
                    this._originalChangeState.call(this, newState, reason);
                } else {
                    this.state = newState;
                }
            };

            console.log(`[NPC AI] Enhanced NPC with ${npc.job || 'UNKNOWN'} personality`);
        },

        generatePersonality: function(npc) {
            const type = npc.faction?.name || npc.job || 'CITIZEN';
            
            const personalityProfiles = {
                'GUARD': {
                    aggression: 0.7,
                    caution: 0.8,
                    bravery: 0.9,
                    friendliness: 0.3,
                    curiosity: 0.4
                },
                'CITIZEN': {
                    aggression: 0.2,
                    caution: 0.7,
                    bravery: 0.3,
                    friendliness: 0.8,
                    curiosity: 0.6
                },
                'RAIDER': {
                    aggression: 0.9,
                    caution: 0.4,
                    bravery: 0.7,
                    friendliness: 0.1,
                    curiosity: 0.5
                },
                'TRADER': {
                    aggression: 0.1,
                    caution: 0.6,
                    bravery: 0.4,
                    friendliness: 0.9,
                    curiosity: 0.7
                },
                'MERCHANT': {
                    aggression: 0.1,
                    caution: 0.6,
                    bravery: 0.4,
                    friendliness: 0.9,
                    curiosity: 0.7
                }
            };

            const base = personalityProfiles[type] || personalityProfiles['CITIZEN'];
            
            // Add randomness (±20%)
            const personality = {};
            for (const [key, value] of Object.entries(base)) {
                personality[key] = Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.2));
            }

            return personality;
        },

        startAILoop: function() {
            if (this.updateInterval) return;

            this.updateInterval = setInterval(() => {
                if (window.isGameActive && !window.gameState?.isPaused) {
                    this.updateAllNPCs();
                }
            }, 200); // Update 5 times per second
        },

        updateAllNPCs: function() {
            const npcs = this.getAllNPCs();
            const now = Date.now();

            // Only update NPCs near player for performance
            if (!window.player || !window.player.mesh) return;

            npcs.forEach(npc => {
                if (!npc || !npc.mesh || !npc.aiEnhanced) return;

                const distance = npc.mesh.position.distanceTo(window.player.mesh.position);
                
                // Full AI for NPCs within 50 units
                if (distance < 50) {
                    this.updateNPCContext(npc);
                    
                    // Request AI decision every 2-5 seconds depending on situation
                    const decisionInterval = npc.state === 'COMBAT' ? 2000 : 5000;
                    if (!npc._lastAIUpdate || now - npc._lastAIUpdate > decisionInterval) {
                        this.requestAIDecision(npc);
                        npc._lastAIUpdate = now;
                    }
                }
                // Simple logic for distant NPCs
                else if (distance < 100) {
                    this.updateNPCSimple(npc);
                }
            });
        },

        getAllNPCs: function() {
            const npcs = [];
            
            if (window.aiUnits) npcs.push(...window.aiUnits);
            if (window.LivingWorldNPCs?.npcs) npcs.push(...window.LivingWorldNPCs.npcs);
            if (window.LC?.citizens) npcs.push(...window.LC.citizens);
            
            return [...new Set(npcs)]; // Remove duplicates
        },

        updateNPCContext: function(npc) {
            if (!npc.contextAwareness) return;

            const nearbyRange = 30;
            const allNPCs = this.getAllNPCs();
            const playerPos = window.player?.mesh?.position;

            // Clear old context
            npc.contextAwareness.nearbyEnemies = [];
            npc.contextAwareness.nearbyAllies = [];
            npc.contextAwareness.nearbyPlayers = [];

            // Find nearby entities
            allNPCs.forEach(other => {
                if (!other || !other.mesh || other === npc) return;
                
                const distance = npc.mesh.position.distanceTo(other.mesh.position);
                if (distance < nearbyRange) {
                    if (other.faction !== npc.faction) {
                        npc.contextAwareness.nearbyEnemies.push({
                            npc: other,
                            distance: distance,
                            health: other.health || 100
                        });
                    } else {
                        npc.contextAwareness.nearbyAllies.push({
                            npc: other,
                            distance: distance,
                            health: other.health || 100
                        });
                    }
                }
            });

            // Check for nearby player
            if (playerPos) {
                const playerDist = npc.mesh.position.distanceTo(playerPos);
                if (playerDist < nearbyRange) {
                    npc.contextAwareness.nearbyPlayers.push({
                        distance: playerDist,
                        health: window.player.health || 100
                    });
                }
            }
        },

        async requestAIDecision(npc) {
            // Check cache first
            const cacheKey = this.getNPCStateKey(npc);
            const cached = aiDecisionCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < cacheExpiry) {
                this.applyDecision(npc, cached.decision);
                return;
            }

            if (!bridgeConnected) {
                // Use local intelligence
                const decision = this.generateLocalDecision(npc);
                this.applyDecision(npc, decision);
                return;
            }

            try {
                const state = this.getNPCState(npc);
                const context = this.getGameContext(npc);

                const response = await fetch(`${AI_BRIDGE_URL}/npc-decision`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ state, context })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'success' && data.decision) {
                        // Cache the decision
                        aiDecisionCache.set(cacheKey, {
                            decision: data.decision,
                            timestamp: Date.now()
                        });
                        
                        this.applyDecision(npc, data.decision);
                    }
                }
            } catch (error) {
                // Fallback to local on error
                const decision = this.generateLocalDecision(npc);
                this.applyDecision(npc, decision);
            }
        },

        getNPCStateKey: function(npc) {
            // Create a key based on significant state factors
            const health = Math.floor((npc.health || 100) / 20) * 20; // Round to nearest 20
            const enemies = npc.contextAwareness?.nearbyEnemies?.length || 0;
            const state = npc.state || 'IDLE';
            return `${npc.job || 'NPC'}_${health}_${enemies}_${state}`;
        },

        getNPCState: function(npc) {
            return {
                type: npc.job || npc.faction?.name || 'CITIZEN',
                health: npc.health || 100,
                state: npc.state || 'IDLE',
                position: {
                    x: npc.mesh?.position.x || 0,
                    y: npc.mesh?.position.y || 0,
                    z: npc.mesh?.position.z || 0
                },
                personality: npc.personality,
                needs: npc.needs,
                memory: {
                    recentThreats: npc.memory?.threats || [],
                    recentEvents: npc.memory?.recentEvents.slice(-5) || []
                }
            };
        },

        getGameContext: function(npc) {
            const timeOfDay = window.gameState?.timeOfDay || window.LivingWorldNPCs?.currentHour || 12;
            
            return {
                time_of_day: timeOfDay,
                threat_level: this.assessThreatLevel(npc),
                nearby_players: npc.contextAwareness?.nearbyPlayers || [],
                nearby_enemies: npc.contextAwareness?.nearbyEnemies.length || 0,
                nearby_allies: npc.contextAwareness?.nearbyAllies.length || 0,
                environment: this.getEnvironmentInfo(npc)
            };
        },

        assessThreatLevel: function(npc) {
            let threat = 0;
            
            // Enemy proximity
            const enemies = npc.contextAwareness?.nearbyEnemies || [];
            threat += enemies.length * 20;
            
            // Close enemies are more threatening
            enemies.forEach(e => {
                if (e.distance < 10) threat += 30;
                else if (e.distance < 20) threat += 15;
            });
            
            // Low health increases perceived threat
            const health = npc.health || 100;
            if (health < 30) threat += 40;
            else if (health < 60) threat += 20;
            
            // Recent combat
            if (npc.state === 'COMBAT' || npc.state === 'ALERT') {
                threat += 25;
            }
            
            return Math.min(100, threat);
        },

        getEnvironmentInfo: function(npc) {
            const building = npc.building?.name || 'outdoors';
            const weather = 'clear'; // Could be expanded
            
            return {
                location: building,
                weather: weather,
                lighting: this.getLightingCondition()
            };
        },

        getLightingCondition: function() {
            const hour = window.LivingWorldNPCs?.currentHour || 12;
            if (hour >= 20 || hour < 6) return 'dark';
            if (hour >= 6 && hour < 8) return 'dawn';
            if (hour >= 18 && hour < 20) return 'dusk';
            return 'bright';
        },

        generateLocalDecision: function(npc) {
            const threat = this.assessThreatLevel(npc);
            const health = npc.health || 100;
            const personality = npc.personality || {};
            const type = npc.job || npc.faction?.name || 'CITIZEN';

            let action = 'IDLE';
            let priority = 0;
            let reasoning = '';

            // Critical health - flee unless very brave
            if (health < 30 && personality.bravery < 0.7) {
                action = 'FLEE';
                priority = 10;
                reasoning = 'Low health - retreating to safety';
            }
            // High threat with combat readiness
            else if (threat > 60 && (type === 'GUARD' || type === 'RAIDER')) {
                action = 'COMBAT';
                priority = 9;
                reasoning = 'High threat detected - engaging';
            }
            // Moderate threat
            else if (threat > 40) {
                if (personality.aggression > 0.6) {
                    action = 'COMBAT';
                    priority = 8;
                    reasoning = 'Aggressive response to threat';
                } else {
                    action = 'ALERT';
                    priority = 7;
                    reasoning = 'Cautious response - monitoring situation';
                }
            }
            // Low threat - social behavior
            else if (threat < 20) {
                if (npc.contextAwareness?.nearbyPlayers?.length > 0) {
                    if (personality.friendliness > 0.6) {
                        action = type === 'TRADER' || type === 'MERCHANT' ? 'TRADE' : 'APPROACH';
                        priority = 6;
                        reasoning = 'Friendly interaction with player';
                    } else {
                        action = 'PATROL';
                        priority = 4;
                        reasoning = 'Maintaining distance from player';
                    }
                } else {
                    action = npc.currentActivity || 'PATROL';
                    priority = 3;
                    reasoning = 'Routine activity';
                }
            }
            // Default patrol
            else {
                action = 'PATROL';
                priority = 5;
                reasoning = 'Standard patrol behavior';
            }

            return { action, priority, reasoning };
        },

        applyDecision: function(npc, decision) {
            if (!npc || !decision) return;

            const newState = this.mapActionToState(decision.action);
            
            // Only change if different and important enough
            if (npc.state !== newState && decision.priority >= 5) {
                npc.changeState(newState, decision.reasoning);
                npc.memory.lastDecision = {
                    timestamp: Date.now(),
                    action: decision.action,
                    priority: decision.priority,
                    reasoning: decision.reasoning
                };
            }

            // Set behavior based on decision
            this.implementBehavior(npc, decision);
        },

        mapActionToState: function(action) {
            const stateMap = {
                'IDLE': 'AI_IDLE',
                'PATROL': 'AI_PATROL',
                'COMBAT': 'AI_COMBAT',
                'FLEE': 'AI_FLEE',
                'ALERT': 'AI_ALERT',
                'APPROACH': 'AI_MOVING',
                'TRADE': 'AI_IDLE',
                'SLEEP': 'AI_IDLE'
            };
            return stateMap[action] || 'AI_IDLE';
        },

        implementBehavior: function(npc, decision) {
            const action = decision.action;

            switch(action) {
                case 'FLEE':
                    this.flee(npc);
                    break;
                case 'COMBAT':
                    this.engageCombat(npc);
                    break;
                case 'PATROL':
                    this.patrol(npc);
                    break;
                case 'APPROACH':
                    this.approachPlayer(npc);
                    break;
                case 'ALERT':
                    this.alert(npc);
                    break;
            }
        },

        flee: function(npc) {
            const threats = npc.contextAwareness?.nearbyEnemies || [];
            if (threats.length === 0) return;

            // Run away from nearest threat
            const nearest = threats[0];
            if (nearest && nearest.npc && nearest.npc.mesh) {
                const fleeDir = new THREE.Vector3()
                    .subVectors(npc.mesh.position, nearest.npc.mesh.position)
                    .normalize();
                
                npc.destination = new THREE.Vector3()
                    .addVectors(npc.mesh.position, fleeDir.multiplyScalar(30));
            }
        },

        engageCombat: function(npc) {
            const enemies = npc.contextAwareness?.nearbyEnemies || [];
            if (enemies.length === 0) return;

            // Target nearest enemy
            const target = enemies[0];
            if (target && target.npc) {
                npc.target = target.npc;
                if (target.npc.mesh) {
                    npc.destination = target.npc.mesh.position.clone();
                }
            }
        },

        patrol: function(npc) {
            // Random patrol around home position
            if (!npc.destination || npc.mesh.position.distanceTo(npc.destination) < 2) {
                const homePos = npc.homePosition || npc.mesh.position;
                npc.destination = new THREE.Vector3(
                    homePos.x + (Math.random() - 0.5) * 20,
                    homePos.y,
                    homePos.z + (Math.random() - 0.5) * 20
                );
            }
        },

        approachPlayer: function(npc) {
            if (window.player && window.player.mesh) {
                const playerPos = window.player.mesh.position;
                const dir = new THREE.Vector3().subVectors(playerPos, npc.mesh.position);
                
                // Stop at comfortable distance (5 units)
                if (dir.length() > 5) {
                    npc.destination = playerPos.clone();
                } else {
                    npc.destination = null;
                }
            }
        },

        alert: function(npc) {
            // Stand and watch for threats
            npc.destination = null;
            
            // Look toward nearest threat
            const threats = npc.contextAwareness?.nearbyEnemies || [];
            if (threats.length > 0 && threats[0].npc && threats[0].npc.mesh) {
                const dir = new THREE.Vector3()
                    .subVectors(threats[0].npc.mesh.position, npc.mesh.position);
                npc.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            }
        },

        updateNPCSimple: function(npc) {
            // Simple behavior for distant NPCs
            if (!npc.destination || npc.mesh.position.distanceTo(npc.destination) < 2) {
                const homePos = npc.homePosition || npc.mesh.position;
                npc.destination = new THREE.Vector3(
                    homePos.x + (Math.random() - 0.5) * 15,
                    homePos.y,
                    homePos.z + (Math.random() - 0.5) * 15
                );
            }
        }
    };

    // Export to window
    window.NPCAIEnhancement = NPCAIEnhancement;

    // Auto-initialize when game is ready
    if (window.isGameActive) {
        NPCAIEnhancement.init();
    } else {
        window.addEventListener('gameReady', () => NPCAIEnhancement.init());
    }

    console.log('[NPC AI Enhancement] Module loaded');
})();
