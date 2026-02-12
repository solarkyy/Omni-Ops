// OMNI-OPS Startup Verification
// Run this after the game loads to verify all systems are initialized

console.log('%c=== OMNI-OPS STARTUP VERIFICATION ===', 'color: #0f6; font-weight: bold; font-size: 16px');

// Step 1: Check if modules are loaded
console.group('Step 1: Module Availability');
const modules = {
    'Three.js': typeof THREE !== 'undefined',
    'PeerJS': typeof Peerjs !== 'undefined',
    'GameStory': typeof GameStory !== 'undefined',
    'ModuleLoader': typeof ModuleLoader !== 'undefined',
    'OmniDiagnostics': typeof OmniDiagnostics !== 'undefined',
    'LivingWorldNPCs': typeof LivingWorldNPCs !== 'undefined',
    'AIPlayerAPI': typeof window.AIPlayerAPI !== 'undefined',
    'AIGameBridgeAPI': typeof window.AIGameBridgeAPI !== 'undefined',
    'OmniUnifiedPanel': typeof window.OmniUnifiedPanel !== 'undefined'
};

Object.entries(modules).forEach(([name, loaded]) => {
    console.log(`${loaded ? '✓' : '✗'} ${name}:`, loaded);
});
console.groupEnd();

// Step 2: Check if global functions exist
console.group('Step 2: Global Functions');
const functions = {
    'launchGame': typeof window.launchGame,
    'startMode': typeof window.startMode,
    'showScreen': typeof window.showScreen,
    'initializeUI': typeof window.initializeUI
};

Object.entries(functions).forEach(([name, type]) => {
    const available = type === 'function';
    console.log(`${available ? '✓' : '✗'} ${name}:`, type);
});
console.groupEnd();

// Step 3: Check game state
console.group('Step 3: Game State');
if (typeof gameState !== 'undefined') {
    console.log('✓ gameState exists');
    console.log('  - isGameActive:', gameState.isGameActive);
    console.log('  - timeOfDay:', gameState.timeOfDay);
} else {
    console.log('✗ gameState not defined');
}
if (typeof player !== 'undefined') {
    console.log('✓ player exists');
    console.log('  - health:', player.health);
    console.log('  - ammo:', player.ammo);
} else {
    console.log('✗ player not defined');
}
console.groupEnd();

// Step 4: Check DOM elements
console.group('Step 4: Critical DOM Elements');
const elements = {
    'game-container': '#game-container',
    'menu-overlay': '#menu-overlay',
    'ui-layer': '#ui-layer',
    'dialogue-box': '#dialogue-box',
    'loading-screen': '#loading-screen',
    'pipboy-menu': '#pipboy-menu'
};

Object.entries(elements).forEach(([name, selector]) => {
    const el = document.querySelector(selector);
    console.log(`${el ? '✓' : '✗'} ${name}:`, el ? 'found' : 'missing');
});
console.groupEnd();

// Step 5: Run diagnostics
console.group('Step 5: Full Diagnostics');
console.log('Running OmniDiagnostics.runAllChecks()...');
if (typeof OmniDiagnostics !== 'undefined' && OmniDiagnostics.runAllChecks) {
    OmniDiagnostics.runAllChecks().then(results => {
        console.log('Diagnostic Results:', results);
    });
} else {
    console.error('✗ OmniDiagnostics.runAllChecks not available');
}
console.groupEnd();

// Step 6: Final status
console.log('%c=== STARTUP VERIFICATION COMPLETE ===', 'color: #0f6; font-weight: bold; font-size: 16px');
console.log('If all checks pass (✓), the game should be working.');
console.log('If any checks fail (✗), check the console for specific error messages.');
