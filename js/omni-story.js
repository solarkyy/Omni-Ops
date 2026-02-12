(function() {
    'use strict';

    // ====== FABLE-STYLE STORY & NARRATIVE SYSTEM ======
    // Immersive world narrative with character-driven plot and emotional arcs

    const StoryState = {
        INTRO_STARTED: 'INTRO_STARTED',
        INTRO_COMPLETE: 'INTRO_COMPLETE',
        ACT_ONE: 'ACT_ONE',
        ACT_TWO: 'ACT_TWO',
        ACT_THREE: 'ACT_THREE',
        EPILOGUE: 'EPILOGUE'
    };

    const GameStory = {
        currentState: StoryState.INTRO_STARTED,
        isPlayingIntro: false,
        introPhase: 0,
        introTimer: 0,
        dialogueLog: [],
        
        // Story tracking
        choices: {},
        questsCompleted: [],
        characterMet: {},
        facts: {},

        // ===== STORY DATA =====
        title: "THE HEROES OF ALBION",
        
        synopsis: `
            In a world where magic fades and darkness creeps across the land,
            five noble heroes arrive in the village of Millbrook to prevent
            catastrophe. But salvation requires sacrifice, trust, and the courage
            to choose between duty and heart.
        `,

        worldLore: `
            ALBION - A realm where heroes once walked freely, performing grand deeds
            and shaping destiny with sword and sorcery. But the Age of Heroes waned.
            Magic dimmed. The old roads fell silent.
            
            Now, in the quiet village of MILLBROOK, whispers of a darker age kindle—
            crops fail, livestock vanish, and the dead do not rest easy.
            
            You are not saviors of legend. You are soldiers. Mercenaries. Outcasts.
            Yet somehow, you may be exactly what this dying world needs.
        `,

        characters: {
            player: {
                name: "You",
                role: "The Wanderer",
                description: "A skilled fighter with mysterious origins. Haunted by your past."
            },
            elder_magnus: {
                name: "Elder Magnus",
                role: "Village Elder",
                description: "Wise but weary. Carries the weight of his people's suffering.",
                firstMeeting: "INTRO_PHASE_2"
            },
            priestess_alba: {
                name: "Priestess Alba",
                role: "Guardian of the Temple",
                description: "Keeper of ancient rites. Believes redemption lies in understanding the darkness.",
                firstMeeting: "ACT_ONE"
            },
            blacksmith_thorne: {
                name: "Blacksmith Thorne",
                role: "Master Smith",
                description: "A craftsman of legendary weapons. His forge burns with old magic.",
                firstMeeting: "ACT_ONE"
            },
            tavern_keeper_iris: {
                name: "Iris",
                role: "Tavern Keeper",
                description: "Eyes and ears of the village. Knows secrets that could shake the kingdom.",
                firstMeeting: "ACT_ONE"
            }
        },

        introSequence: [
            {
                phase: 0,
                duration: 4,
                text: "THE HEROES OF ALBION",
                subtitle: "A Tale of Fading Light and Rising Hope",
                camera: { position: [0, 50, -80], lookAt: [0, 5, 0] },
                bgColor: 0x1a1a2e,
                textColor: 0xffd700,
                effect: "fade_in"
            },
            {
                phase: 1,
                duration: 5,
                narrator: true,
                text: `"In days of old, heroes walked the earth. They slew dragons, sealed dark gates, 
                and saved kingdoms with valor and virtue. But all ages end..."`,
                camera: { position: [-40, 30, -50], lookAt: [0, 2, 0] },
                bgColor: 0x2a2a4a,
                effect: "pan_slow"
            },
            {
                phase: 2,
                duration: 5,
                narrator: true,
                text: `"The Age of Heroes faded like starlight at dawn. Magic grew thin. 
                The old roads fell silent. And in quiet places, new darkness stirred..."`,
                camera: { position: [40, 35, -60], lookAt: [0, 2, 0] },
                bgColor: 0x3a2a1a,
                effect: "pan_slow"
            },
            {
                phase: 3,
                duration: 4,
                text: "MILLBROOK VILLAGE - Present Day",
                subtitle: "Where hope is but a fading memory",
                camera: { position: [0, 40, -100], lookAt: [0, 2, 0] },
                bgColor: 0x444444,
                textColor: 0xcccccc,
                effect: "move_closer"
            },
            {
                phase: 4,
                duration: 6,
                narrator: true,
                text: `"You arrive at Millbrook as autumn winds carry whispers of dread. 
                Monks have fallen ill. Harvests wither. The very earth seems sick.
                
                An old man waits at the village gate. Hope and desperation in his eyes."`,
                camera: { position: [0, 25, -50], lookAt: [0, 1, 0] },
                bgColor: 0x555555,
                effect: "approach"
            }
        ],

        dialogues: {
            INTRO_MAGNUS: [
                {
                    speaker: "Elder Magnus",
                    text: "Stranger, thank the old gods you've come. We have little coin, but we have urgent need.",
                    emotion: "desperate"
                },
                {
                    speaker: "Elder Magnus",
                    text: "Three weeks past, Brother Aldwyn came from the monastery in the high hills. He collapsed at our temple door, muttering of shadows and sickness.",
                    emotion: "concerned"
                },
                {
                    speaker: "Elder Magnus",
                    text: "Now monks fall ill daily. The priestess says it's not mere fever—something unnatural curses them. Our crops fail. Our livestock vanish.",
                    emotion: "grave"
                },
                {
                    speaker: "Player",
                    text: "[Stay silent and listen]",
                    action: "nod",
                    emotion: "stoic"
                },
                {
                    speaker: "Elder Magnus",
                    text: "The monastery sits atop Raven's Peak. No one has returned from there in ten days. If you can discover what plagues them, perhaps Priestess Alba can craft a cure.",
                    emotion: "hopeful"
                }
            ],

            PRIESTESS_ALBA_FIRST: [
                {
                    speaker: "Priestess Alba",
                    text: "The darkness I sense... it is old. Older than memory. Not mere sickness of the flesh.",
                    emotion: "mystical"
                },
                {
                    speaker: "Priestess Alba",
                    text: "The wards we placed centuries ago—they weaken. Something stirs beyond them. Our ancestors feared this day.",
                    emotion: "worried"
                }
            ],

            BLACKSMITH_THORNE_FIRST: [
                {
                    speaker: "Blacksmith Thorne",
                    text: "Aye, I've heard the whispers. Dark times ahead. Fortunate for thee that my forge still burns with the old magic.",
                    emotion: "gruff"
                },
                {
                    speaker: "Blacksmith Thorne",
                    text: "I can craft thee weapons worthy of legend—but only if thou bringst me the materials. And courage. Thou'll need courage.",
                    emotion: "confident"
                }
            ],

            IRIS_FIRST: [
                {
                    speaker: "Iris",
                    text: "Welcome to the Prancing Pony, friend. First drink's on the house for any brave fool taking on the monastery curse.",
                    emotion: "wry"
                },
                {
                    speaker: "Iris",
                    text: "I hear tell of old ruins deeper in the mountains. Ancient things. If darkness came from the monastery, maybe it came from those ruins first.",
                    emotion: "mysterious"
                }
            ]
        },

        // Quest structure
        questsAvailable: [
            {
                id: 'INVESTIGATE_MONASTERY',
                title: 'The Monastery Curse',
                giver: 'Elder Magnus',
                description: 'Discover what plagues the monks at the high monastery. Bring back information—or a cure.',
                objectives: [
                    'Reach Raven\'s Peak monastery',
                    'Investigate the source of the sickness',
                    'Return to Elder Magnus'
                ],
                rewards: {
                    gold: 100,
                    reputation: 15,
                    story: 'Learn the truth about the darkness'
                }
            },
            {
                id: 'FORGE_LEGEND',
                title: 'Master Thorne\'s Commission',
                giver: 'Blacksmith Thorne',
                description: 'Gather rare materials to craft legendary weapons.',
                objectives: [
                    'Collect Ironwood from the deep forest',
                    'Find Crystal Shards in the ruins',
                    'Hunt Wyvern feathers from the peaks'
                ],
                rewards: {
                    gold: 200,
                    legendary_weapon: true,
                    reputation: 20
                }
            },
            {
                id: 'ANCIENT_SECRETS',
                title: 'Priestess Alba\'s Research',
                giver: 'Priestess Alba',
                description: 'Explore the ancient ruins to break the curse\'s source.',
                objectives: [
                    'Enter the Sunken Temple',
                    'Retrieve the Seal of Binding',
                    'Return to the priestess'
                ],
                rewards: {
                    gold: 150,
                    blessing: 'Divine Protection',
                    reputation: 25
                }
            }
        ],

        actOneTrivia: [
            "The monastery was built by monks fleeing a great war 300 years ago.",
            "Priestess Alba claims her bloodline traces back to the original mages who sealed away the darkness.",
            "Blacksmith Thorne's hammer was forged in starlight. It never dulls.",
            "Iris was once a knight, before she gave up the sword for ale and secrets.",
            "Elder Magnus lost his son to illness three years ago. The sickness took him in three days."
        ],

        init: function() {
            console.log('[Story] Initializing narrative system...');
            window.storySystem = this;
            this.setupIntroUI();
        },

        setupIntroUI: function() {
            // Create intro screen if not exists
            if (!document.getElementById('story-intro')) {
                const introDiv = document.createElement('div');
                introDiv.id = 'story-intro';
                introDiv.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: none;
                    z-index: 2000;
                    background: #000;
                    color: #fff;
                    font-family: 'Georgia', serif;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.5s;
                `;
                
                const contentDiv = document.createElement('div');
                contentDiv.id = 'story-intro-content';
                contentDiv.style.cssText = `
                    text-align: center;
                    max-width: 600px;
                    animation: fadeInUp 1s ease-out forwards;
                `;
                
                const titleEl = document.createElement('h1');
                titleEl.id = 'story-title';
                titleEl.style.cssText = `
                    font-size: 48px;
                    margin: 0;
                    color: #ffd700;
                    text-shadow: 0 0 20px rgba(255,215,0,0.5);
                    letter-spacing: 2px;
                `;
                
                const subtitleEl = document.createElement('p');
                subtitleEl.id = 'story-subtitle';
                subtitleEl.style.cssText = `
                    font-size: 18px;
                    margin-top: 10px;
                    color: #aaa;
                    font-style: italic;
                `;
                
                const narrationEl = document.createElement('p');
                narrationEl.id = 'story-narration';
                narrationEl.style.cssText = `
                    font-size: 16px;
                    margin-top: 40px;
                    line-height: 1.8;
                    color: #ddd;
                    white-space: pre-wrap;
                `;

                const skipEl = document.createElement('p');
                skipEl.id = 'story-skip';
                skipEl.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    font-size: 12px;
                    color: #666;
                    cursor: pointer;
                    transition: color 0.3s;
                `;
                skipEl.innerText = '[ Press SPACE to skip ]';
                skipEl.onmouseover = () => skipEl.style.color = '#aaa';
                skipEl.onmouseout = () => skipEl.style.color = '#666';
                skipEl.onclick = () => this.skipIntro();

                contentDiv.appendChild(titleEl);
                contentDiv.appendChild(subtitleEl);
                contentDiv.appendChild(narrationEl);

                introDiv.appendChild(contentDiv);
                introDiv.appendChild(skipEl);
                document.body.appendChild(introDiv);

                // Add CSS animation
                const style = document.createElement('style');
                style.innerText = `
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        },

        startIntro: function() {
            console.log('[Story] Starting introduction sequence...');
            this.isPlayingIntro = true;
            this.introPhase = 0;
            this.introTimer = 0;

            const menuOverlay = document.getElementById('menu-overlay');
            const storyIntro = document.getElementById('story-intro');
            if (menuOverlay) menuOverlay.style.display = 'none';
            if (storyIntro) {
                storyIntro.style.display = 'flex';
                storyIntro.style.opacity = '1';
            }

            // Input handling
            document.addEventListener('keydown', (e) => {
                if (this.isPlayingIntro && e.code === 'Space') {
                    e.preventDefault();
                    this.skipIntro();
                }
            });

            this.updateIntro();
        },

        updateIntro: function() {
            if (!this.isPlayingIntro) return;

            const phase = this.introSequence[this.introPhase];
            if (!phase) {
                this.completeIntro();
                return;
            }

            this.introTimer += 0.016; // ~60fps

            // Update phase content
            const titleEl = document.getElementById('story-title');
            const subtitleEl = document.getElementById('story-subtitle');
            const narrationEl = document.getElementById('story-narration');

            if (phase.text && !phase.narrator) {
                titleEl.innerText = phase.text;
                titleEl.style.color = phase.textColor ? '#' + phase.textColor.toString(16).padStart(6, '0') : '#ffd700';
            } else {
                titleEl.innerText = '';
            }

            if (phase.subtitle) {
                subtitleEl.innerText = phase.subtitle;
            } else {
                subtitleEl.innerText = '';
            }

            if (phase.narrator && phase.text) {
                narrationEl.innerText = phase.text;
            } else {
                narrationEl.innerText = '';
            }

            // Background color transition
            const bgColor = phase.bgColor || 0x000000;
            const bgColorHex = '#' + bgColor.toString(16).padStart(6, '0');
            const storyIntro = document.getElementById('story-intro');
            if (storyIntro) storyIntro.style.background = bgColorHex;

            // Camera simulation (text animation)
            if (phase.effect === 'fade_in') {
                const alpha = Math.min(1, this.introTimer / 1);
                const introContent = document.getElementById('story-intro-content');
                if (introContent) introContent.style.opacity = alpha;
            } else if (phase.effect === 'pan_slow') {
                const offset = (this.introTimer * 5) % 20;
                narrationEl.style.opacity = 0.9;
            }

            // Next phase
            if (this.introTimer >= phase.duration) {
                this.introPhase++;
                this.introTimer = 0;
                this.updateIntro();
            } else {
                requestAnimationFrame(() => this.updateIntro());
            }
        },

        completeIntro: function() {
            console.log('[Story] Intro sequence complete');
            this.isPlayingIntro = false;
            this.currentState = StoryState.INTRO_COMPLETE;
            
            const introDiv = document.getElementById('story-intro');
            if (introDiv) {
                introDiv.style.opacity = '0';
            }
            
            setTimeout(() => {
                if (introDiv) {
                    introDiv.style.display = 'none';
                }
                console.log('[Story] Launching game after intro completion...');
                // Call launchGame directly to avoid infinite loop with startMode
                if (window.launchGame) {
                    window.launchGame();
                } else {
                    console.error('[Story] launchGame not available!');
                }
            }, 500);
        },

        skipIntro: function() {
            console.log('[Story] Intro skipped');
            this.isPlayingIntro = false;
            this.currentState = StoryState.INTRO_COMPLETE;
            const introDiv = document.getElementById('story-intro');
            if (introDiv) {
                introDiv.style.opacity = '0';
            }
            
            setTimeout(() => {
                if (introDiv) {
                    introDiv.style.display = 'none';
                }
                console.log('[Story] Launching game after skip...');
                // Call launchGame directly instead of startMode
                if (window.launchGame) {
                    window.launchGame();
                } else {
                    console.error('[Story] launchGame not available!');
                }
            }, 300);
        },

        displayDialogue: function(dialogueKey, npcName) {
            if (!this.dialogues[dialogueKey]) {
                console.warn('[Story] Dialogue not found:', dialogueKey);
                return;
            }

            console.log(`[Story] Playing dialogue: ${dialogueKey}`);
            const dialogueLines = this.dialogues[dialogueKey];
            
            // Create dialogue UI if not exists
            if (!document.getElementById('story-dialogue-box')) {
                this.setupDialogueUI();
            }

            this.playDialogueSequence(dialogueLines);
        },

        setupDialogueUI: function() {
            const dialogueBox = document.createElement('div');
            dialogueBox.id = 'story-dialogue-box';
            dialogueBox.style.cssText = `
                position: fixed;
                bottom: 50px;
                left: 50%;
                transform: translateX(-50%);
                width: 600px;
                background: rgba(0,0,0,0.95);
                border: 2px solid #ffd700;
                border-radius: 10px;
                padding: 20px;
                z-index: 1500;
                color: #ddd;
                font-family: 'Georgia', serif;
                display: none;
            `;

            const speaker = document.createElement('div');
            speaker.id = 'story-dialogue-speaker';
            speaker.style.cssText = `
                font-size: 14px;
                color: #ffd700;
                font-weight: bold;
                margin-bottom: 8px;
            `;

            const text = document.createElement('div');
            text.id = 'story-dialogue-text';
            text.style.cssText = `
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 12px;
                min-height: 30px;
            `;

            const continue_hint = document.createElement('div');
            continue_hint.id = 'story-dialogue-continue';
            continue_hint.style.cssText = `
                text-align: right;
                font-size: 11px;
                color: #666;
            `;
            continue_hint.innerText = '[ Press SPACE or CLICK to continue ]';

            dialogueBox.appendChild(speaker);
            dialogueBox.appendChild(text);
            dialogueBox.appendChild(continue_hint);
            
            document.body.appendChild(dialogueBox);
        },

        playDialogueSequence: function(lines, index = 0) {
            if (index >= lines.length) {
                // Close dialogue
                const box = document.getElementById('story-dialogue-box');
                if (box) box.style.display = 'none';
                return;
            }

            const line = lines[index];
            const dialogueBox = document.getElementById('story-dialogue-box');
            const speaker = document.getElementById('story-dialogue-speaker');
            const text = document.getElementById('story-dialogue-text');

            dialogueBox.style.display = 'block';
            speaker.innerText = line.speaker;
            text.innerText = line.text;

            // Set emotion-based colors
            const emotionColors = {
                'desperate': '#ff6b6b',
                'concerned': '#ffa500',
                'grave': '#8b0000',
                'hopeful': '#90ee90',
                'stoic': '#a9a9a9',
                'mystical': '#9370db',
                'worried': '#ff8c00',
                'gruff': '#696969',
                'confident': '#4169e1',
                'wry': '#2e8b57',
                'mysterious': '#4b0082'
            };

            if (line.emotion && emotionColors[line.emotion]) {
                speaker.style.color = emotionColors[line.emotion];
            }

            // Continue on input
            const continueHandler = (e) => {
                if (e.code === 'Space' || e.type === 'click') {
                    e.preventDefault();
                    document.removeEventListener('keydown', continueHandler);
                    dialogueBox.removeEventListener('click', continueHandler);
                    this.playDialogueSequence(lines, index + 1);
                }
            };

            document.addEventListener('keydown', continueHandler);
            dialogueBox.addEventListener('click', continueHandler);
        },

        getRandomTrivia: function() {
            const triviaList = this.actOneTrivia;
            return triviaList[Math.floor(Math.random() * triviaList.length)];
        },

        addToLog: function(speaker, text) {
            this.dialogueLog.push({ speaker, text, timestamp: Date.now() });
        },

        completeQuest: function(questId) {
            if (!this.questsCompleted.includes(questId)) {
                this.questsCompleted.push(questId);
                console.log('[Story] Quest completed:', questId);
            }
        },

        getQuestByID: function(questId) {
            return this.questsAvailable.find(q => q.id === questId);
        }
    };

    // Export to window
    window.GameStory = GameStory;
    console.log('[Story] Module loaded - Story system ready');
})();
