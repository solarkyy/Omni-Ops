// OMNI-OPS Diagnostic System
// Validates game initialization and system status

const OmniDiagnostics = {
    checks: [],
    
    log(message, level = 'INFO') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}] [${level}]`;
        console.log(`${prefix} ${message}`);
        return `${prefix} ${message}`;
    },

    registerCheck(name, testFn) {
        this.checks.push({ name, testFn });
    },

    async runAllChecks() {
        console.clear();
        this.log('====== OMNI-OPS DIAGNOSTIC SUITE ======', 'SYSTEM');
        
        const results = {
            passed: [],
            failed: [],
            warnings: []
        };

        for (const check of this.checks) {
            try {
                const result = await check.testFn();
                if (result.status === 'PASS') {
                    results.passed.push(check.name);
                    this.log(`✓ ${check.name}`, 'PASS');
                } else if (result.status === 'WARN') {
                    results.warnings.push(check.name);
                    this.log(`⚠ ${check.name}: ${result.message}`, 'WARN');
                } else {
                    results.failed.push(check.name);
                    this.log(`✗ ${check.name}: ${result.message}`, 'FAIL');
                }
            } catch (error) {
                results.failed.push(check.name);
                this.log(`✗ ${check.name}: ${error.message}`, 'ERROR');
            }
        }

        this.log('====== DIAGNOSTIC SUMMARY ======', 'SYSTEM');
        this.log(`Passed: ${results.passed.length}`, 'INFO');
        this.log(`Failed: ${results.failed.length}`, 'INFO');
        this.log(`Warnings: ${results.warnings.length}`, 'INFO');
        
        return results;
    }
};

// Register diagnostic checks
OmniDiagnostics.registerCheck('Module Load - Three.js', () => {
    return Promise.resolve(
        typeof THREE !== 'undefined' ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'THREE not defined' }
    );
});

OmniDiagnostics.registerCheck('DOM Element - Game Container', () => {
    return Promise.resolve(
        document.getElementById('game-container') ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'game-container missing' }
    );
});

OmniDiagnostics.registerCheck('DOM Element - UI Layer', () => {
    return Promise.resolve(
        document.getElementById('ui-layer') ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'ui-layer missing' }
    );
});

OmniDiagnostics.registerCheck('DOM Element - Dialogue Box', () => {
    const box = document.getElementById('dialogue-box');
    const name = document.getElementById('npc-name');
    const faction = document.getElementById('npc-faction');
    const text = document.getElementById('dialogue-text');
    const options = document.getElementById('dialogue-options');
    
    if (!box || !name || !faction || !text || !options) {
        return Promise.resolve({
            status: 'FAIL',
            message: 'Missing dialogue box elements'
        });
    }
    return Promise.resolve({ status: 'PASS' });
});

OmniDiagnostics.registerCheck('Game State Initialization', () => {
    return Promise.resolve(
        typeof gameState !== 'undefined' && gameState ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'gameState not initialized' }
    );
});

OmniDiagnostics.registerCheck('Story System Module', () => {
    return Promise.resolve(
        typeof GameStory !== 'undefined' && GameStory ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'GameStory module not loaded' }
    );
});

OmniDiagnostics.registerCheck('Living World System', () => {
    return Promise.resolve(
        typeof LivingWorldNPCs !== 'undefined' && LivingWorldNPCs ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'LivingWorldNPCs not loaded' }
    );
});

OmniDiagnostics.registerCheck('Three.js Scene Creation', () => {
    return Promise.resolve(
        typeof scene !== 'undefined' && scene instanceof THREE.Scene ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'scene not created or invalid' }
    );
});

OmniDiagnostics.registerCheck('Renderer Initialization', () => {
    return Promise.resolve(
        typeof renderer !== 'undefined' && renderer instanceof THREE.WebGLRenderer ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'renderer not initialized' }
    );
});

OmniDiagnostics.registerCheck('Camera Setup', () => {
    return Promise.resolve(
        typeof camera !== 'undefined' && camera instanceof THREE.Camera ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'camera not initialized' }
    );
});

OmniDiagnostics.registerCheck('Player Object', () => {
    return Promise.resolve(
        typeof player !== 'undefined' && player && player.position ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'player not initialized' }
    );
});

OmniDiagnostics.registerCheck('Lighting System', () => {
    return Promise.resolve(
        typeof sunLight !== 'undefined' && sunLight ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'sunLight not initialized' }
    );
});

OmniDiagnostics.registerCheck('HUD Ammo Display', () => {
    const el = document.getElementById('hud-ammo');
    return Promise.resolve(
        el ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'hud-ammo missing' }
    );
});

OmniDiagnostics.registerCheck('HUD Health Display', () => {
    const el = document.getElementById('hud-health');
    return Promise.resolve(
        el ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'hud-health missing' }
    );
});

OmniDiagnostics.registerCheck('Animation Loop Running', () => {
    return Promise.resolve(
        typeof isGameActive !== 'undefined' ? 
        { status: 'PASS' } : 
        { status: 'WARN', message: 'isGameActive flag not found (may be in gameState)' }
    );
});

OmniDiagnostics.registerCheck('Story Intro Can Complete', () => {
    return Promise.resolve(
        typeof GameStory !== 'undefined' && 
        typeof GameStory.completeIntro === 'function' &&
        typeof GameStory.startIntro === 'function' ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'Story intro functions missing' }
    );
});

OmniDiagnostics.registerCheck('Game Launch Function', () => {
    return Promise.resolve(
        typeof window.launchGame === 'function' ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'launchGame function missing' }
    );
});

OmniDiagnostics.registerCheck('Interaction Handler', () => {
    return Promise.resolve(
        typeof handleInteraction === 'function' ? 
        { status: 'PASS' } : 
        { status: 'FAIL', message: 'handleInteraction function missing' }
    );
});

OmniDiagnostics.registerCheck('Menu System', () => {
    const overlay = document.getElementById('menu-overlay');
    const mainScreen = document.getElementById('main-screen');
    
    if (!overlay || !mainScreen) {
        return Promise.resolve({
            status: 'FAIL',
            message: 'Menu UI elements missing'
        });
    }
    return Promise.resolve({ status: 'PASS' });
});

OmniDiagnostics.registerCheck('Interaction Prompt Element', () => {
    const el = document.getElementById('interaction-prompt');
    return Promise.resolve(
        el && el.innerText.includes('Press F') ? 
        { status: 'PASS' } : 
        { status: 'WARN', message: 'interaction-prompt may not show correct text' }
    );
});

// Export for use
window.OmniDiagnostics = OmniDiagnostics;
