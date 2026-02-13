// OMNI-OPS: ARIA Voice-Over Router
(function() {
    'use strict';

    window.AriaVoRouter = {
        
        // ==========================================
        // STATE
        // ==========================================
        currentLine: null,
        lastPlayedLine: null,
        lastPlayedAt: 0,
        isPlaying: false,
        queue: [],
        subtitleElement: null,
        audioEnabled: true,
        masterVolume: 0.7,
        
        // ==========================================
        // INITIALIZATION
        // ==========================================
        init: function() {
            console.log('[ARIA VO] Initializing voice-over router...');
            
            // Find or create subtitle element
            this.subtitleElement = document.getElementById('aria-subtitle');
            if (!this.subtitleElement) {
                console.warn('[ARIA VO] Subtitle element not found in DOM, creating fallback');
                this.subtitleElement = document.createElement('div');
                this.subtitleElement.id = 'aria-subtitle';
                document.body.appendChild(this.subtitleElement);
            }
            
            // Initialize audio context (for future implementation)
            // TODO: Initialize Web Audio API or audio sprites system here
            
            console.log('[ARIA VO] Router initialized');
        },
        
        // ==========================================
        // PLAY ARIA LINE (Main Entry Point)
        // ==========================================
        play: function(lineId, options = {}) {
            if (!window.OmniOpsChapter1Data || !window.OmniOpsChapter1Data.ariaVoLines) {
                console.error('[ARIA VO] Chapter 1 data not loaded!');
                return;
            }
            
            const lineData = window.OmniOpsChapter1Data.ariaVoLines[lineId];
            if (!lineData) {
                console.error('[ARIA VO] Line not found:', lineId);
                return;
            }
            
            const config = {
                interrupt: options.interrupt !== undefined ? options.interrupt : false,
                queue: options.queue !== undefined ? options.queue : true,
                skipIfPlaying: options.skipIfPlaying !== undefined ? options.skipIfPlaying : false
            };
            
            // Handle conflicts
            if (this.isPlaying) {
                if (config.skipIfPlaying) {
                    console.log('[ARIA VO] Skipping', lineId, '- already playing');
                    return;
                }
                if (config.interrupt) {
                    console.log('[ARIA VO] Interrupting current line for', lineId);
                    this.stop();
                } else if (config.queue) {
                    console.log('[ARIA VO] Queuing', lineId);
                    this.queue.push({ lineId, lineData, options });
                    return;
                }
            }
            
            // Play the line
            this.lastPlayedLine = lineId;
            this.lastPlayedAt = Date.now();
            this._playLine(lineId, lineData);
        },
        
        // ==========================================
        // INTERNAL: PLAY LINE
        // ==========================================
        _playLine: function(lineId, lineData) {
            console.log('[ARIA VO] Playing:', lineId, '-', lineData.subtitle);
            
            this.currentLine = lineId;
            this.isPlaying = true;
            
            // Show subtitle
            this.showSubtitle(lineData.subtitle, lineData.duration);
            
            // TODO: Play audio file
            // Example: this._playAudioFile(lineData.audioId);
            // For now, just simulate with setTimeout
            
            // Auto-advance after duration
            setTimeout(() => {
                this._onLineComplete();
            }, lineData.duration * 1000);
        },
        
        // ==========================================
        // SUBTITLE DISPLAY
        // ==========================================
        showSubtitle: function(text, duration) {
            if (!this.subtitleElement) return;
            
            this.subtitleElement.textContent = text;
            this.subtitleElement.style.display = 'block';
            this.subtitleElement.classList.add('active');
            
            // Log to message system if available
            if (window.logMessage) {
                window.logMessage(`[ARIA] ${text}`);
            }
        },
        
        hideSubtitle: function() {
            if (!this.subtitleElement) return;
            
            this.subtitleElement.classList.remove('active');
            setTimeout(() => {
                if (!this.isPlaying) {
                    this.subtitleElement.style.display = 'none';
                    this.subtitleElement.textContent = '';
                }
            }, 500);
        },
        
        // ==========================================
        // STOP CURRENT LINE
        // ==========================================
        stop: function() {
            if (!this.isPlaying) return;
            
            console.log('[ARIA VO] Stopping current line');
            this.isPlaying = false;
            this.currentLine = null;
            this.hideSubtitle();
            
            // TODO: Stop audio playback
        },
        
        // ==========================================
        // ON LINE COMPLETE
        // ==========================================
        _onLineComplete: function() {
            console.log('[ARIA VO] Line complete:', this.currentLine);
            
            this.isPlaying = false;
            this.currentLine = null;
            this.hideSubtitle();
            
            // Process queue
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                setTimeout(() => {
                    this._playLine(next.lineId, next.lineData);
                }, 500); // Small gap between lines
            }
        },
        
        // ==========================================
        // QUEUE MANAGEMENT
        // ==========================================
        clearQueue: function() {
            console.log('[ARIA VO] Clearing queue');
            this.queue = [];
        },
        
        getQueueLength: function() {
            return this.queue.length;
        },
        
        // ==========================================
        // AUDIO CONTROLS (TODO: Implement with actual audio)
        // ==========================================
        _playAudioFile: function(audioId) {
            // TODO: Implement Web Audio API or Howler.js audio playback
            // Example path: /audio/vo/aria/${audioId}.ogg
            console.log('[ARIA VO] TODO: Play audio file:', audioId);
        },
        
        setVolume: function(volume) {
            this.masterVolume = Math.max(0, Math.min(1, volume));
            console.log('[ARIA VO] Volume set to:', this.masterVolume);
            // TODO: Apply to audio system
        },
        
        toggleAudio: function() {
            this.audioEnabled = !this.audioEnabled;
            console.log('[ARIA VO] Audio', this.audioEnabled ? 'enabled' : 'disabled');
            if (!this.audioEnabled && this.isPlaying) {
                // TODO: Mute current audio but keep subtitles
            }
        },
        
        // ==========================================
        // UTILITY
        // ==========================================
        getStatus: function() {
            return {
                isPlaying: this.isPlaying,
                currentLine: this.currentLine,
                queueLength: this.queue.length,
                audioEnabled: this.audioEnabled,
                volume: this.masterVolume
            };
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.AriaVoRouter.init();
        });
    } else {
        window.AriaVoRouter.init();
    }
    
    console.log('[ARIA VO] Module loaded');
})();
