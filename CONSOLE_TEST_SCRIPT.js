// ===================================================
// OMNI-OPS COMPREHENSIVE CONTROL TEST SCRIPT
// ===================================================
// Paste this into your browser console after the game loads
// to verify all systems are working correctly

console.clear();
console.log('%c=== OMNI-OPS CONTROL TEST SUITE ===', 'color: #0f6; font-weight: bold; font-size: 18px');
console.log('%cRunning comprehensive system checks...', 'color: #ff0; font-size: 14px');

// Test Results Object
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

function logTest(name, passed, message = '') {
    if (passed) {
        console.log(`%c✓ ${name}`, 'color: #0f6; font-weight: bold', message);
        testResults.passed.push(name);
    } else {
        console.log(`%c✗ ${name}`, 'color: #f44; font-weight: bold', message);
        testResults.failed.push(name);
    }
}

function logWarn(name, message) {
    console.log(`%c⚠ ${name}`, 'color: #ff0; font-weight: bold', message);
    testResults.warnings.push(name);
}

// ===================================================
// STEP 1: VERIFY CORE MODULES
// ===================================================
console.log('\n%c[STEP 1] Checking Core Modules...', 'color: #0ff; font-weight: bold');

logTest('Three.js', typeof THREE !== 'undefined', typeof THREE !== 'undefined' ? `version: ${THREE.REVISION}` : 'Not loaded');
logTest('PeerJS', typeof Peerjs !== 'undefined' || typeof peerjs !== 'undefined');
logTest('GameStory', typeof GameStory !== 'undefined');
logTest('OmniDiagnostics', typeof OmniDiagnostics !== 'undefined');
logTest('LivingWorldNPCs', typeof LivingWorldNPCs !== 'undefined');

// ===================================================
// STEP 2: VERIFY GAME STATE
// ===================================================
console.log('\n%c[STEP 2] Checking Game State...', 'color: #0ff; font-weight: bold');

logTest('gameState exists', typeof gameState !== 'undefined');
if (typeof gameState !== 'undefined') {
    console.log('  - isGameActive:', gameState.isGameActive);
    console.log('  - timeOfDay:', gameState.timeOfDay);
    console.log('  - isInDialogue:', gameState.isInDialogue);
    console.log('  - isPipboyOpen:', gameState.isPipboyOpen);
    console.log('  - isInventoryOpen:', gameState.isInventoryOpen);
    console.log('  - reputation:', gameState.reputation);
}

logTest('player exists', typeof player !== 'undefined');
if (typeof player !== 'undefined') {
    console.log('  - health:', player.health);
    console.log('  - stamina:', player.stamina);
    console.log('  - ammo:', player.ammo, '/', player.reserveAmmo);
    console.log('  - position:', cameraRig ? cameraRig.position : 'N/A');
}

logTest('gameMode exists', typeof gameMode !== 'undefined', gameMode);
logTest('isGameActive', typeof isGameActive !== 'undefined', isGameActive);

// ===================================================
// STEP 3: VERIFY KEY CONTROL FUNCTIONS
// ===================================================
console.log('\n%c[STEP 3] Checking Control Functions...', 'color: #0ff; font-weight: bold');

logTest('togglePipboy()', typeof togglePipboy === 'function');
logTest('toggleCommanderMode()', typeof toggleCommanderMode === 'function');
logTest('launchGame()', typeof window.launchGame === 'function');
logTest('startMode()', typeof window.startMode === 'function');
logTest('handleInteraction()', typeof handleInteraction === 'function');
logTest('startReload()', typeof startReload === 'function');

// ===================================================
// STEP 4: VERIFY KEY BINDINGS
// ===================================================
console.log('\n%c[STEP 4] Verifying Key Bindings Setup...', 'color: #0ff; font-weight: bold');

logTest('keys object exists', typeof keys !== 'undefined');
if (typeof keys !== 'undefined') {
    console.log('  Current keys pressed:', Object.keys(keys).filter(k => keys[k]));
}

// Check if keydown listeners are registered
const listeners = getEventListeners ? getEventListeners(document) : null;
if (listeners && listeners.keydown) {
    logTest('Keydown listeners registered', listeners.keydown.length > 0, `${listeners.keydown.length} listeners`);
} else {
    logWarn('Cannot verify listeners', 'getEventListeners not available (Chrome only)');
}

// ===================================================
// STEP 5: VERIFY DOM ELEMENTS
// ===================================================
console.log('\n%c[STEP 5] Checking DOM Elements...', 'color: #0ff; font-weight: bold');

const elements = {
    'game-container': '#game-container',
    'menu-overlay': '#menu-overlay',
    'ui-layer': '#ui-layer',
    'dialogue-box': '#dialogue-box',
    'pipboy-menu': '#pipboy-menu',
    'crosshair-container': '#crosshair-container',
    'hud-top': '#hud-top',
    'ammo-cur': '#ammo-cur',
    'commander-overlay': '#commander-overlay'
};

Object.entries(elements).forEach(([name, selector]) => {
    const el = document.querySelector(selector);
    logTest(`DOM: ${name}`, el !== null);
});

// ===================================================
// STEP 6: VERIFY 3D SCENE
// ===================================================
console.log('\n%c[STEP 6] Checking 3D Scene...', 'color: #0ff; font-weight: bold');

logTest('scene exists', typeof scene !== 'undefined');
logTest('camera exists', typeof camera !== 'undefined');
logTest('commanderCamera exists', typeof commanderCamera !== 'undefined');
logTest('renderer exists', typeof renderer !== 'undefined');
logTest('cameraRig exists', typeof cameraRig !== 'undefined');

if (typeof scene !== 'undefined' && scene) {
    console.log('  - Scene children:', scene.children.length);
}

// ===================================================
// STEP 7: TEST CONTROL MAPPINGS
// ===================================================
console.log('\n%c[STEP 7] Control Mapping Reference...', 'color: #0ff; font-weight: bold');
console.log(`
  %cMOVEMENT CONTROLS:%c
    W          - Move Forward (KeyW)
    A          - Strafe Left (KeyA)
    S          - Move Back (KeyS)
    D          - Strafe Right (KeyD)
    Space      - Jump
    Shift      - Sprint
    Ctrl       - Crouch
    
  %cINTERFACE CONTROLS:%c
    Tab        - Toggle Pip-Boy (NOT TACTICAL VIEW!)
    I          - Toggle Inventory
    M          - Toggle Tactical/Commander View
    F2         - Toggle Editor
    Escape     - Close menus
    
  %cCOMBAT CONTROLS:%c
    R          - Reload
    V          - Change fire mode
    F          - Interact
    Left Click - Fire weapon
    Right Click- Aim down sights
`, 'color: #0ff; font-weight: bold', 'color: #fff',
   'color: #0ff; font-weight: bold', 'color: #fff',
   'color: #0ff; font-weight: bold', 'color: #fff');

// ===================================================
// STEP 8: INTERACTIVE CONTROL TESTS
// ===================================================
console.log('\n%c[STEP 8] Interactive Control Test Functions...', 'color: #0ff; font-weight: bold');
console.log('Use these functions to test controls:');

window.testMovement = function() {
    console.log('%c[TEST] Simulating W key press...', 'color: #ff0');
    if (typeof keys !== 'undefined') {
        keys['KeyW'] = true;
        console.log('KeyW set to true. Check if player moves forward.');
        setTimeout(() => {
            keys['KeyW'] = false;
            console.log('KeyW released.');
        }, 1000);
    }
};

window.testTacticalView = function() {
    console.log('%c[TEST] Toggling Tactical View...', 'color: #ff0');
    if (typeof toggleCommanderMode === 'function') {
        console.log('Current mode:', gameMode);
        toggleCommanderMode();
        setTimeout(() => {
            console.log('New mode:', gameMode);
            console.log('Expected: Should switch between FPS and COMMANDER');
        }, 100);
    }
};

window.testInventory = function() {
    console.log('%c[TEST] Toggling Inventory...', 'color: #ff0');
    if (typeof gameState !== 'undefined') {
        console.log('Current inventory state:', gameState.isInventoryOpen);
        gameState.isInventoryOpen = !gameState.isInventoryOpen;
        console.log('New inventory state:', gameState.isInventoryOpen);
    }
};

window.testPipBoy = function() {
    console.log('%c[TEST] Toggling Pip-Boy...', 'color: #ff0');
    if (typeof togglePipboy === 'function') {
        console.log('Current Pip-Boy state:', gameState.isPipboyOpen);
        togglePipboy();
        setTimeout(() => {
            console.log('New Pip-Boy state:', gameState.isPipboyOpen);
        }, 100);
    }
};

console.log('  testMovement()     - Simulates W key press');
console.log('  testTacticalView() - Toggles tactical/commander view (M key)');
console.log('  testInventory()    - Toggles inventory (I key)');
console.log('  testPipBoy()       - Toggles Pip-Boy (Tab key)');

// ===================================================
// STEP 9: RUN FULL DIAGNOSTICS
// ===================================================
if (typeof OmniDiagnostics !== 'undefined' && OmniDiagnostics.runAllChecks) {
    console.log('\n%c[STEP 9] Running Full Diagnostics...', 'color: #0ff; font-weight: bold');
    OmniDiagnostics.runAllChecks().then(results => {
        console.log('\n%cDiagnostic Results:', 'color: #0f6; font-weight: bold');
        console.log('  Passed:', results.passed);
        console.log('  Failed:', results.failed);
        console.log('  Warnings:', results.warnings);
    });
}

// ===================================================
// FINAL SUMMARY
// ===================================================
console.log('\n%c=== TEST SUMMARY ===', 'color: #0f6; font-weight: bold; font-size: 16px');
console.log(`%c✓ Passed: ${testResults.passed.length}`, 'color: #0f6; font-weight: bold');
console.log(`%c✗ Failed: ${testResults.failed.length}`, 'color: #f44; font-weight: bold');
console.log(`%c⚠ Warnings: ${testResults.warnings.length}`, 'color: #ff0; font-weight: bold');

if (testResults.failed.length === 0) {
    console.log('\n%c🎉 ALL SYSTEMS OPERATIONAL! 🎉', 'color: #0f6; font-weight: bold; font-size: 16px');
    console.log('%cYou can now test the controls manually:', 'color: #fff');
    console.log('%c1. Press W to move forward', 'color: #0ff');
    console.log('%c2. Press M to toggle tactical view', 'color: #0ff');
    console.log('%c3. Press I to toggle inventory', 'color: #0ff');
} else {
    console.log('\n%c⚠ Some tests failed. Check the results above.', 'color: #ff0; font-weight: bold');
}

console.log('\n%cFor detailed help, type: help()', 'color: #888');

window.help = function() {
    console.log(`
%c=== OMNI-OPS HELP ===
%cCOMMON ISSUES:%c

1. Game not loading?
   - Make sure all modules loaded (check loading screen)
   - Run: OmniDiagnostics.runAllChecks()

2. Controls not working?
   - Click on the game canvas to enable pointer lock
   - Check: isGameActive should be true
   - Check: gameState.isInDialogue should be false

3. Can't move?
   - Ensure you've started a game (Quick Play or Story)
   - Press W and check if keys['KeyW'] becomes true
   - Run: testMovement()

4. Tactical view not working?
   - Press M (NOT Tab!)
   - Tab opens Pip-Boy, not tactical view
   - Run: testTacticalView()

5. Inventory not opening?
   - Press I (NOT Tab!)
   - Tab opens Pip-Boy
   - Run: testInventory()

%cUSEFUL COMMANDS:%c
- OmniDiagnostics.runAllChecks()  - Full diagnostic
- testMovement()                  - Test movement
- testTacticalView()             - Test tactical view
- testInventory()                - Test inventory
- testPipBoy()                   - Test Pip-Boy
- console.log(player)            - View player state
- console.log(gameState)         - View game state
- console.log(keys)              - View pressed keys
`, 'color: #0f6; font-weight: bold; font-size: 14px',
   'color: #ff0; font-weight: bold', 'color: #fff',
   'color: #0ff; font-weight: bold', 'color: #fff');
};

console.log('\n%cTesting complete! Type help() for assistance.', 'color: #0f6; font-weight: bold');
