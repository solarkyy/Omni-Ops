"""
Smart In-Game AI Helper
Automatically analyzes the game and asks the external AI for help when needed
"""

(function() {
    'use strict';

    const SmartInGameAI = {
        initialized: false,
        checkInterval: null,
        questionCooldown: 0,
        lastQuestionTime: 0,
        minQuestionInterval: 10000, // 10 seconds between questions

        init: function() {
            if (this.initialized) return;
            this.initialized = true;

            console.log('[Smart AI] Smart AI Helper loaded but automatic monitoring is DISABLED');
            console.log('[Smart AI] Use Quick Commands or Chat to ask questions manually');

            // DISABLED: Automatic monitoring to prevent duplicate messages
            // User will manually trigger questions via Quick Commands or Chat
            // Uncomment below to re-enable automatic monitoring:
            /*
            setTimeout(() => {
                if (window.UnifiedAIPanel && window.UnifiedAIPanel.connected) {
                    this.startIntelligentMonitoring();
                } else {
                    console.log('[Smart AI] Waiting for unified AI panel connection...');
                    setTimeout(() => this.init(), 5000);
                }
            }, 2000);
            */
        },

        startIntelligentMonitoring: function() {
            console.log('[Smart AI] 🧠 Smart AI monitoring started!');
            console.log('[Smart AI] Will automatically ask external AI for help when needed');

            // Check game state every 5 seconds
            this.checkInterval = setInterval(() => {
                this.analyzeAndAskIfNeeded();
            }, 5000);
        },

        analyzeAndAskIfNeeded: function() {
            // Don't ask if we recently asked a question
            const now = Date.now();
            if (now - this.lastQuestionTime < this.minQuestionInterval) {
                return;
            }

            if (!window.AIPlayerAPI || !window.UnifiedAIPanel) return;
            if (!window.UnifiedAIPanel.connected) return;

            const gameState = window.AIPlayerAPI.getGameState();
            if (!gameState) return;

            const player = gameState.player;
            if (!player) return;

            // Analyze situations that need external AI help
            const velocity = player.velocity || { x: 0, y: 0, z: 0 };
            const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

            // Situation 1: Player seems stuck (low velocity for extended period)
            if (speed < 0.1 && player.onGround) {
                this.askExternalAI(
                    "I notice the player has very low velocity and is on the ground. Can you see if they're stuck or blocked by something? What should I do?",
                    true
                );
                return;
            }

            // Situation 2: Player is falling (negative Y velocity)
            if (velocity.y < -5) {
                this.askExternalAI(
                    "The player is falling rapidly (Y velocity: " + velocity.y.toFixed(2) + "). Can you see what's below them? Should I be concerned?",
                    true
                );
                return;
            }

            // Situation 3: Player position seems unusual (very low Y)
            if (player.y < -5) {
                this.askExternalAI(
                    "The player's Y position is " + player.y.toFixed(2) + " which seems very low. Have they fallen through the world? What do you see?",
                    true
                );
                return;
            }

            // Situation 4: Periodic environmental scan (every 30 seconds)
            if (now - this.lastQuestionTime > 30000) {
                this.askExternalAI(
                    "Can you describe what you see in the game environment right now? Are there any threats, obstacles, or points of interest the player should know about?",
                    true
                );
                return;
            }
        },

        askExternalAI: function(question, includeVisual) {
            this.lastQuestionTime = Date.now();

            console.log(`[Smart AI] 🤔 Asking external AI: "${question}"`);

            if (window.UnifiedAIPanel && window.UnifiedAIPanel.askExternalAI) {
                window.UnifiedAIPanel.askExternalAI(question, includeVisual);
            }
        },

        stop: function() {
            if (this.checkInterval) {
                clearInterval(this.checkInterval);
                this.checkInterval = null;
            }
            console.log('[Smart AI] Monitoring stopped');
        }
    };

    // Auto-initialize when script loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SmartInGameAI.init());
    } else {
        SmartInGameAI.init();
    }

    // Expose globally
    window.SmartInGameAI = SmartInGameAI;

    console.log('[Smart AI] Smart In-Game AI Helper loaded');
})();
