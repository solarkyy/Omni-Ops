// OMNI-OPS Diagnostics System
// Automated testing and validation

console.log('[Diagnostics] Loading diagnostics system...');

window.OmniDiagnostics = {
    
    // Run all diagnostic checks
    runAllChecks: function() {
        console.log('\n' + '='.repeat(60));
        console.log('OMNI-OPS DIAGNOSTICS - FULL SYSTEM CHECK');
        console.log('='.repeat(60) + '\n');
        
        const results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
        
        // Run all tests
        this.checkCoreSystem(results);
        this.checkThreeJS(results);
        this.checkGlobalFunctions(results);
        this.checkGameState(results);
        this.checkUIElements(results);
        this.checkControls(results);
        
        // Display summary
        this.displaySummary(results);
        
        return results;
    },
    
    // Check core game system
    checkCoreSystem: function(results) {
        console.log('📦 CORE SYSTEM CHECKS:');
        console.log('-'.repeat(60));
        
        this.test(results, 'GAME object exists', 
            typeof window.GAME !== 'undefined');
        
        this.test(results, 'PLAYER object exists', 
            typeof window.PLAYER !== 'undefined');
        
        this.test(results, 'launchGame function available', 
            typeof window.launchGame === 'function');
        
        this.test(results, 'startMode function available', 
            typeof window.startMode === 'function');
        
        console.log('');
    },
    
    // Check Three.js integration
    checkThreeJS: function(results) {
        console.log('🎨 THREE.JS CHECKS:');
        console.log('-'.repeat(60));
        
        this.test(results, 'Three.js library loaded', 
            typeof THREE !== 'undefined');
        
        if (window.GAME) {
            this.test(results, 'Scene initialized', 
                window.GAME.scene instanceof THREE.Scene, 'warning');
            
            this.test(results, 'Camera initialized', 
                window.GAME.camera instanceof THREE.Camera, 'warning');
            
            this.test(results, 'Renderer initialized', 
                window.GAME.renderer instanceof THREE.WebGLRenderer, 'warning');
        }
        
        console.log('');
    },
    
    // Check global functions
    checkGlobalFunctions: function(results) {
        console.log('⚙️  GLOBAL FUNCTION CHECKS:');
        console.log('-'.repeat(60));
        
        const functions = [
            'toggleEditor',
            'togglePipboy',
            'switchEditorTab',
            'editorSpawn',
            'editorSpawnNPC',
            'editorSetTime'
        ];
        
        functions.forEach(fn => {
            this.test(results, `${fn} function available`, 
                typeof window[fn] === 'function');
        });
        
        console.log('');
    },
    
    // Check game state
    checkGameState: function(results) {
        console.log('🎮 GAME STATE CHECKS:');
        console.log('-'.repeat(60));
        
        if (window.GAME) {
            this.test(results, 'Game mode set', 
                window.GAME.mode !== null, 'warning');
            
            this.test(results, 'Game not paused', 
                !window.GAME.paused);
            
            this.test(results, 'Buildings array exists', 
                Array.isArray(window.GAME.buildings));
            
            this.test(results, 'NPCs array exists', 
                Array.isArray(window.GAME.npcs));
        }
        
        if (window.PLAYER) {
            this.test(results, 'Player health valid', 
                window.PLAYER.health > 0 && window.PLAYER.health <= 100);
            
            this.test(results, 'Player stamina valid', 
                window.PLAYER.stamina >= 0 && window.PLAYER.stamina <= 100);
        }
        
        console.log('');
    },
    
    // Check UI elements
    checkUIElements: function(results) {
        console.log('🖥️  UI ELEMENT CHECKS:');
        console.log('-'.repeat(60));
        
        const elements = [
            'menu-overlay',
            'main-screen',
            'ui-layer',
            'editor-overlay',
            'pipboy-menu',
            'loading-screen',
            'game-container'
        ];
        
        elements.forEach(id => {
            this.test(results, `Element #${id} exists`, 
                document.getElementById(id) !== null);
        });
        
        console.log('');
    },
    
    // Check controls
    checkControls: function(results) {
        console.log('🎯 CONTROL CHECKS:');
        console.log('-'.repeat(60));
        
        const buttons = [
            'btn-story-start',
            'btn-single',
            'btn-show-host',
            'btn-show-join'
        ];
        
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            this.test(results, `Button #${id} exists and clickable`, 
                btn !== null && !btn.disabled);
        });
        
        console.log('');
    },
    
    // Helper: Run a test
    test: function(results, name, condition, severity = 'error') {
        const passed = Boolean(condition);
        const symbol = passed ? '✅' : (severity === 'warning' ? '⚠️' : '❌');
        const status = passed ? 'PASS' : (severity === 'warning' ? 'WARN' : 'FAIL');
        
        console.log(`${symbol} [${status}] ${name}`);
        
        results.tests.push({ name, passed, severity });
        
        if (passed) {
            results.passed++;
        } else if (severity === 'warning') {
            results.warnings++;
        } else {
            results.failed++;
        }
    },
    
    // Display summary
    displaySummary: function(results) {
        console.log('='.repeat(60));
        console.log('DIAGNOSTIC SUMMARY');
        console.log('='.repeat(60));
        console.log(`✅ Passed:   ${results.passed}`);
        console.log(`❌ Failed:   ${results.failed}`);
        console.log(`⚠️  Warnings: ${results.warnings}`);
        console.log(`📊 Total:    ${results.tests.length}`);
        console.log('='.repeat(60));
        
        if (results.failed === 0) {
            console.log('✨ ALL CRITICAL SYSTEMS OPERATIONAL!');
        } else {
            console.log('⚠️  SOME SYSTEMS NEED ATTENTION');
            console.log('\nFailed tests:');
            results.tests
                .filter(t => !t.passed && t.severity === 'error')
                .forEach(t => console.log(`  - ${t.name}`));
        }
        
        console.log('='.repeat(60) + '\n');
    },
    
    // Quick system status
    quickStatus: function() {
        console.log('\n🔍 QUICK STATUS CHECK:\n');
        
        console.log('Core Systems:');
        console.log('  GAME object:', typeof window.GAME !== 'undefined' ? '✅' : '❌');
        console.log('  PLAYER object:', typeof window.PLAYER !== 'undefined' ? '✅' : '❌');
        console.log('  Three.js:', typeof THREE !== 'undefined' ? '✅' : '❌');
        
        if (window.GAME) {
            console.log('\nGame State:');
            console.log('  Mode:', window.GAME.mode || 'Not set');
            console.log('  Scene:', window.GAME.scene ? '✅' : '❌');
            console.log('  Renderer:', window.GAME.renderer ? '✅' : '❌');
            console.log('  Buildings:', window.GAME.buildings?.length || 0);
            console.log('  NPCs:', window.GAME.npcs?.length || 0);
        }
        
        if (window.PLAYER) {
            console.log('\nPlayer Stats:');
            console.log('  Health:', window.PLAYER.health);
            console.log('  Stamina:', Math.floor(window.PLAYER.stamina));
            console.log('  Ammo:', `${window.PLAYER.ammo} / ${window.PLAYER.ammoReserve}`);
            console.log('  Fire Mode:', window.PLAYER.fireMode);
        }
        
        console.log('');
    },
    
    // Test specific system
    testSystem: function(systemName) {
        console.log(`\n🔬 Testing ${systemName}...\n`);
        
        const results = { passed: 0, failed: 0, warnings: 0, tests: [] };
        
        switch(systemName.toLowerCase()) {
            case 'core':
                this.checkCoreSystem(results);
                break;
            case 'threejs':
            case 'three':
                this.checkThreeJS(results);
                break;
            case 'ui':
                this.checkUIElements(results);
                break;
            case 'controls':
                this.checkControls(results);
                break;
            case 'state':
                this.checkGameState(results);
                break;
            default:
                console.log(`❌ Unknown system: ${systemName}`);
                console.log('Available systems: core, threejs, ui, controls, state');
                return;
        }
        
        this.displaySummary(results);
    },
    
    // List all available diagnostics
    help: function() {
        console.log('\n' + '='.repeat(60));
        console.log('OMNI-OPS DIAGNOSTICS - HELP');
        console.log('='.repeat(60));
        console.log('\nAvailable Commands:');
        console.log('  OmniDiagnostics.runAllChecks()    - Run complete diagnostic suite');
        console.log('  OmniDiagnostics.quickStatus()     - Quick system status overview');
        console.log('  OmniDiagnostics.testSystem(name)  - Test specific system');
        console.log('  OmniDiagnostics.help()             - Show this help message');
        console.log('\nAvailable Systems for testSystem():');
        console.log('  - core      (Core game systems)');
        console.log('  - threejs   (Three.js renderer)');
        console.log('  - ui        (UI elements)');
        console.log('  - controls  (Input controls)');
        console.log('  - state     (Game state)');
        console.log('='.repeat(60) + '\n');
    }
};

console.log('[Diagnostics] System loaded. Type OmniDiagnostics.help() for commands.');
