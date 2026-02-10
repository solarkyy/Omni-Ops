// Module Loader
const ModuleLoader = {
    modules: [
        { name: 'Core Game', file: 'js/omni-core-game.js', required: true },
        { name: 'Multiplayer Sync', file: 'js/omni-multiplayer-sync.js', required: true },
        { name: 'Story System', file: 'js/omni-story.js', required: true },
        { name: 'Living World', file: 'js/omni-living-world.js', required: true },
        { name: 'Story Integration', file: 'js/omni-story-integration.js', required: true },
        { name: 'UE5 Editor', file: 'js/omni-ue5-editor.js', required: true },
        { name: 'Pip-Boy System', file: 'js/omni-pipboy-system.js', required: true },
        { name: 'Living NPC City', file: 'js/omni-npc-living-city.js', required: true },
        { name: 'Integration Layer', file: 'js/omni-integration.js', required: true }
    ],
    loaded: 0,
    total: 0,
    failedModules: [],
    init: function () {
        console.log('[ModuleLoader] Initializing module loader...');
        this.total = this.modules.filter(m => m.required).length;
        this.updateStatus('Loading modules...');
        this.renderModuleList();
        this.loadModules();
    },
    renderModuleList: function () {
        document.getElementById('module-list').innerHTML = this.modules
            .map(m => `<div class="module-item" id="module-${m.name.replace(/\s+/g, '-')}">${m.required ? '●' : '○'} ${m.name}</div>`)
            .join('');
    },
    loadModules: function () {
        let index = 0;
        const loadNext = () => {
            if (index >= this.modules.length) {
                this.complete();
                return;
            }
            const module = this.modules[index];
            this.updateModuleStatus(module.name, 'loading');
            this.updateStatus(`Loading ${module.name}...`);
            const script = document.createElement('script');
            script.src = module.file;
            script.async = false;
            script.type = 'text/javascript';
            
            script.onload = () => {
                try {
                    if (module.required) this.loaded++;
                    this.updateModuleStatus(module.name, 'loaded');
                    this.updateProgress();
                    console.log(`[ModuleLoader] ✓ Successfully loaded: ${module.name}`);
                } catch (err) {
                    console.error(`[ModuleLoader] Error after loading ${module.name}:`, err);
                }
                index++;
                setTimeout(loadNext, 100);
            };
            
            script.onerror = (e) => {
                const err = `Failed to load ${module.name}: ${module.file}`;
                console.error(`[ModuleLoader] ✗ ${err}`, e);
                this.failedModules.push(module.name);
                this.updateModuleStatus(module.name, 'failed');
                index++;
                setTimeout(loadNext, 100);
            };
            
            document.body.appendChild(script);
        };
        loadNext();
    },
    updateModuleStatus: function (name, status) {
        const el = document.getElementById(`module-${name.replace(/\s+/g, '-')}`);
        if (el) {
            el.className = `module-item ${status}`;
            if (status === 'loaded') el.textContent = '✓ ' + name;
            else if (status === 'failed') el.textContent = '✗ ' + name;
        }
    },
    updateProgress: function () {
        const percent = (this.loaded / this.total) * 100;
        document.getElementById('loading-bar').style.width = percent + '%';
    },
    updateStatus: function (text) {
        document.getElementById('loading-status').textContent = text;
    },
    complete: function () {
        this.updateStatus('All systems ready!');
        this.updateProgress();
        
        if (this.failedModules.length > 0) {
            console.error('[ModuleLoader] WARNING: Some modules failed to load:', this.failedModules);
        }
        
        setTimeout(() => {
            try {
                document.getElementById('loading-screen').classList.add('hidden');
                window.modulesReady = true;
                console.log('[ModuleLoader] Setting modulesReady = true');
                
                // Initialize button bindings and UI - wait for initializeUI to be defined
                let attempts = 0;
                const waitForInit = () => {
                    if (window.initializeUI) {
                        console.log('[ModuleLoader] Calling initializeUI');
                        window.initializeUI();
                    } else {
                        attempts++;
                        if (attempts < 20) {
                            console.log(`[ModuleLoader] Waiting for initializeUI... attempt ${attempts}`);
                            setTimeout(waitForInit, 100);
                        } else {
                            console.error('[ModuleLoader] FATAL: window.initializeUI never became available!');
                            console.error('[ModuleLoader] Available globals:', Object.keys(window).filter(k => k.includes('init')));
                        }
                    }
                };
                waitForInit();
                console.log('%c✅ All modules loaded', 'color:#0f6');
            } catch (err) {
                console.error('[ModuleLoader] Error in complete():', err);
            }
        }, 500);
    }
};
window.addEventListener('load', () => ModuleLoader.init());

// Global error handler to catch any uncaught errors
window.addEventListener('error', (event) => {
    console.error('[Global Error Handler] Uncaught error:', event.error);
    if (event.error && event.error.stack) {
        console.error('[Stack]', event.error.stack);
    }
});

// Handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]', event.reason);
});

// Editor System
window.editorActive = false;

window.toggleEditor = function () {
    window.editorActive = !window.editorActive;
    const overlay = document.getElementById('editor-overlay');

    if (window.editorActive) {
        overlay.classList.add('active');
        document.exitPointerLock();
        console.log('Editor opened - Press F2 to close');
    } else {
        overlay.classList.remove('active');
        console.log('Editor closed');
    }
};

window.switchEditorTab = function (tabName) {
    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[onclick*="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-' + tabName).classList.add('active');
};

// Editor Functions
window.editorSpawn = function (type) {
    console.log(`Spawning object of type: ${type}`);
    // Add logic to spawn objects in the game world
};

window.editorSpawnNPC = function (faction) {
    console.log(`Spawning NPC of faction: ${faction}`);
    // Add logic to spawn NPCs in the game world
};

window.editorRegenWorld = function () {
    const seed = document.getElementById('world-seed').value || Date.now();
    console.log(`Regenerating world with seed: ${seed}`);
    // Add logic to regenerate the game world
};

window.editorWeather = function (type) {
    console.log(`Changing weather to: ${type}`);
    // Add logic to change the weather in the game
};

window.editorSetTime = function (hour) {
    console.log(`Setting time to: ${hour}`);
    // Add logic to update the game time
};

window.editorApplySettings = function () {
    const gravity = document.getElementById('set-gravity').value;
    const speed = document.getElementById('set-speed').value;
    const jump = document.getElementById('set-jump').value;
    console.log(`Applying settings: Gravity=${gravity}, Speed=${speed}, Jump=${jump}`);
    // Add logic to apply physics settings
};

window.editorSave = function () {
    console.log('Saving world...');
    // Add logic to save the game world
};

window.editorLoad = function () {
    console.log('Loading world...');
    // Add logic to load the game world
};

window.editorExport = function () {
    console.log('Exporting world...');
    // Add logic to export the game world as JSON
};

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
        e.preventDefault();
        window.toggleEditor();
    }
});