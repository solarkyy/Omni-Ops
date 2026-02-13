(function() {
    'use strict';

    // ====== LEGACY: STORY & WORLD INTEGRATION ======
    // DEPRECATED: This integrates the old "Heroes of Albion" story with the world
    // OMNI-OPS Chapter 1 has its own integration system
    // This file is disabled by default
    
    const LEGACY_ALBION = false; // Set to true to enable old Albion story integration
    
    if (!LEGACY_ALBION) {
        console.log('[Story Integration] LEGACY_ALBION disabled - skipping Albion story integration');
        return;
    }

    // Hooks story events to living world NPCs and game mechanics

    const StoryIntegration = {
        initialized: false,

        init: function() {
            console.log('[Story Integration] Initializing...');
            this.hookStoryTriggers();
            this.hookNPCFirstMeetings();
            this.initialized = true;
        },

        hookStoryTriggers: function() {
            // When intro completes, show first NPC dialogues
            if (window.GameStory) {
                window.addEventListener('storyIntroComplete', () => {
                    console.log('[Story Integration] Intro complete, releasing NPCs for dialogue');
                    // Flag allows living world NPCs to recognize and greet the player
                    if (window.LivingWorldNPCs) {
                        window.LivingWorldNPCs.playerMet = true;
                    }
                });
            }
        },

        hookNPCFirstMeetings: function() {
            // Ensure Elder Magnus is at town entrance for story opening
            if (window.LivingWorldNPCs && window.LivingWorldNPCs.buildings) {
                const tavernBuilding = Object.values(window.LivingWorldNPCs.buildings)
                    .find(b => b.type === 'TAVERN');
                
                if (tavernBuilding && window.scene) {
                    // Place Elder Magnus NPC at entrance
                    const elderMagnus = window.createAIUnit(
                        tavernBuilding.position.x,
                        tavernBuilding.position.z - 15,
                        window.FACTIONS ? window.FACTIONS.CITIZEN : null
                    );
                    
                    if (elderMagnus && elderMagnus.mesh) {
                        elderMagnus.characterName = 'Elder Magnus';
                        elderMagnus.role = 'Elder';
                        elderMagnus.characterDescription = 'The weary leader of Millbrook. Searching desperately for salvation.';
                        elderMagnus.storyKey = 'ELDER_MAGNUS';
                        
                        // Make him stationary at welcome position
                        elderMagnus.homePosition.copy(elderMagnus.mesh.position);
                        
                        if (window.aiUnits) window.aiUnits.push(elderMagnus);
                        console.log('[Story Integration] Placed Elder Magnus at town entrance');
                    }
                }
            }
        },

        // Check if player is near key story locations
        checkStoryProximity: function() {
            if (!window.cameraRig || !window.LivingWorldNPCs) return;

            const playerPos = window.cameraRig.position;
            const buildings = Object.values(window.LivingWorldNPCs.buildings);

            buildings.forEach(building => {
                const bx = building.position.x;
                const bz = building.position.z;
                const dist = Math.sqrt((playerPos.x - bx) ** 2 + (playerPos.z - bz) ** 2);

                if (dist < 30 && !building.playerVisited) {
                    building.playerVisited = true;
                    this.triggerLocationDiscovery(building);
                }
            });
        },

        triggerLocationDiscovery: function(building) {
            // Log discovery and update quest status
            console.log(`[Story] Discovered: ${building.name}`);

            const discoveryMessages = {
                'TAVERN': 'The Prancing Pony tavern sprawls before you—warmth and ale beckon from within.',
                'BLACKSMITH': 'The Ironsmith\'s Forge burns with ancient fire. You can feel the magic in the air.',
                'FARM': 'Fertile fields stretch out, but the crops look sickly and pale. Something is wrong here.',
                'TEMPLE': 'The Sacred Temple rises, elegant and serene. But a deep unease radiates from its halls.',
                'MARKET': 'The town market bustles with cautious commerce. Merchants eye you with uncertainty.',
                'ALCHEMIST_SHOP': 'The Potion Emporium smells of rare herbs and mystical compounds. Intriguing...'
            };

            const msg = discoveryMessages[building.type] || `You discover: ${building.name}`;
            if (window.logMessage) window.logMessage(`[DISCOVERED] ${building.name}`);
            console.log(`[Story] ${msg}`);
        },

        // Trigger major story events based on player actions
        recordPlayerAction: function(actionType, target) {
            if (!window.GameStory) return;

            const storyActions = {
                'HEALED_BY_MEDIC': { quest: 'HEALTHCARE_INITIATIVE', rep: 5, citizen: true },
                'TRADED_WITH_MERCHANT': { quest: 'COMMERCE', rep: 10, citizen: true },
                'HELPED_FARMER': { quest: 'HARVEST_AID', rep: 15, citizen: true },
                'PRAYED_AT_TEMPLE': { quest: 'SPIRITUAL_AWAKENING', rep: 10, citizen: true },
                'CRAFTED_WEAPON': { quest: 'FORGE_LEGEND', rep: 20, special: true },
                'RESEARCH_CURSE': { quest: 'ANCIENT_SECRETS', rep: 25, special: true }
            };

            const action = storyActions[actionType];
            if (action) {
                if (window.gameState && action.citizen) {
                    window.gameState.reputation.CITIZEN += action.rep;
                }
                console.log(`[Story] Action recorded: ${actionType} (+${action.rep} reputation)`);
            }
        },

        // Dynamic dialogue based on story state
        getDialogueForNPC: function(npcName, storyState) {
            const dialogues = {
                'Elder Magnus': {
                    'INTRO_COMPLETE': 'The monastery falls silent. Brother Aldwyn hasn\'t returned. Please, find out what plagues them.',
                    'FIRST_INVESTIGATION': 'Any sign of what\'s causing this? Our people are losing hope.',
                    'CURSE_DISCOVERED': 'Ancient magic... I feared this day would come. We need the priestess\'s wisdom.',
                    'CURSE_LIFTED': 'The monks recover. The sickness fades. Truly, you are the hero our village needed.'
                },
                'Priestess Alba': {
                    'INTRO_COMPLETE': 'I sense a disturbance in the ancient wards. Something old stirs.',
                    'RESEARCHING': 'Old tomes speak of seals placed to contain darkness. We must find them.',
                    'DISCOVERING_TRUTH': 'The darkness... it is not natural calamity. It is *purposeful*. Deliberate.',
                    'FINAL_CHOICE': 'To seal it again requires sacrifice. Are you prepared?'
                }
            };

            if (dialogues[npcName] && dialogues[npcName][storyState]) {
                return dialogues[npcName][storyState];
            }
            return 'The townsfolk nod respectfully in your presence.';
        },

        // Track story progression through quests
        updateStoryProgression: function() {
            if (!window.GameStory) return;

            const completedCount = window.GameStory.questsCompleted.length;

            if (completedCount === 0) {
                window.GameStory.currentState = 'ACT_ONE';
            } else if (completedCount >= 1) {
                window.GameStory.currentState = 'ACT_TWO';
            } else if (completedCount >= 2) {
                window.GameStory.currentState = 'ACT_THREE';
            } else if (completedCount >= 3) {
                window.GameStory.currentState = 'EPILOGUE';
            }

            console.log(`[Story] Progression: ${window.GameStory.currentState} (${completedCount} quests)`);
        }
    };

    // Export to window
    window.StoryIntegration = StoryIntegration;
    console.log('[Story Integration] Module loaded');
})();
