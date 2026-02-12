// OMNI-OPS COMPREHENSIVE FEATURE TEST
// Run this in browser console to verify all systems

console.clear();
console.log('%c╔═══════════════════════════════════╗', 'color: #0f6');
console.log('%c║  OMNI-OPS FEATURE TEST   v1.0    ║', 'color: #0f6');
console.log('%c╚═══════════════════════════════════╝', 'color: #0f6');

const testResults = {
  loading: [],
  modules: [],
  gameState: [],
  controls: [],
  ui: [],
  rendering: [],
};

// Helper function
const test = (category, name, condition, details = '') => {
  const passed = !!condition;
  const icon = passed ? '✓' : '✗';
  const color = passed ? '#0f6' : '#f44';
  console.log(`%c${icon} ${category}: ${name}`, `color: ${color}; font-weight: bold`, details);
  if (!testResults[category]) testResults[category] = [];
  testResults[category].push({ name, passed, details });
};

// ===== LOADING TESTS =====
console.log('\n%c[LOADING SYSTEM]', 'color: #0ff; font-weight: bold');

test('loading', 'Loading screen hidden', document.getElementById('loading-screen')?.classList.contains('hidden') || !document.getElementById('loading-screen')?.style.display !== 'flex');
test('loading', 'Menu overlay visible', document.getElementById('menu-overlay')?.style.display === 'flex' || getComputedStyle(document.getElementById('menu-overlay')).display !== 'none');
test('loading', 'modulesReady flag', typeof window.modulesReady !== 'undefined', window.modulesReady ? 'TRUE' : 'FALSE');

// ===== MODULE TESTS =====
console.log('\n%c[MODULES]', 'color: #0ff; font-weight: bold');

test('modules', 'Three.js loaded', typeof THREE !== 'undefined', THREE?.REVISION || 'unknown');
test('modules', 'Core Game loaded', typeof gameState !== 'undefined', 'gameState defined');
test('modules', 'GameStory loaded', typeof GameStory !== 'undefined', 'Story system ready');
test('modules', 'LivingWorldNPCs', typeof LivingWorldNPCs !== 'undefined', 'NPCs ready');
test('modules', 'Diagnostics loaded', typeof OmniDiagnostics !== 'undefined', 'Diagnostics available');

// ===== GAME STATE TESTS =====
console.log('\n%c[GAME STATE]', 'color: #0ff; font-weight: bold');

test('gameState', 'gameState object', typeof gameState !== 'undefined');
test('gameState', 'player object', typeof player !== 'undefined');
test('gameState', 'keys tracking', typeof keys !== 'undefined');
test('gameState', 'scene exists', typeof scene !== 'undefined', scene instanceof THREE.Scene ? 'Valid THREE.Scene' : 'Invalid');
test('gameState', 'camera exists', typeof camera !== 'undefined', camera instanceof THREE.Camera ? 'Valid camera' : 'Invalid');
test('gameState', 'renderer exists', typeof renderer !== 'undefined', renderer instanceof THREE.WebGLRenderer ? 'Valid renderer' : 'Invalid');

// Game mode and state details
if (typeof gameState !== 'undefined') {
  console.log(`  - isPipboyOpen: ${gameState.isPipboyOpen}`);
  console.log(`  - isInventoryOpen: ${gameState.isInventoryOpen}`);
  console.log(`  - isInDialogue: ${gameState.isInDialogue}`);
  console.log(`  - timeOfDay: ${gameState.timeOfDay}`);
  console.log(`  - worldSeed: ${gameState.worldSeed}`);
}

if (typeof player !== 'undefined') {
  console.log(`  - Player Health: ${player.health}/${player.maxHealth}`);
  console.log(`  - Ammo: ${player.ammo}/${player.reserveAmmo}`);
  console.log(`  - Stamina: ${player.stamina}`);
}

// ===== CONTROL TESTS =====
console.log('\n%c[CONTROLS]', 'color: #0ff; font-weight: bold');

test('controls', 'togglePipboy function', typeof togglePipboy === 'function', 'Callable');
test('controls', 'toggleCommanderMode function', typeof toggleCommanderMode === 'function', 'Callable');
test('controls', 'handleInteraction function', typeof handleInteraction === 'function', 'Callable');
test('controls', 'startReload function', typeof startReload === 'function', 'Callable');
test('controls', 'launchGame function', typeof window.launchGame === 'function', 'Callable');
test('controls', 'startMode function', typeof window.startMode === 'function', 'Callable');

// ===== UI ELEMENT TESTS =====
console.log('\n%c[UI ELEMENTS]', 'color: #0ff; font-weight: bold');

const uiElements = {
  'game-container': 'Main game container',
  'menu-overlay': 'Menu overlay',
  'main-screen': 'Main menu screen',
  'ui-layer': 'HUD/UI layer',
  'pipboy-menu': 'Pip-Boy interface',
  'crosshair-container': 'Crosshair',
  'ammo-cur': 'Ammo display',
  'health-bar': 'Health bar',
  'editor-overlay': 'Editor overlay'
};

Object.entries(uiElements).forEach(([id, label]) => {
  const el = document.getElementById(id);
  test('ui', label, el !== null, el ? 'Present' : 'Missing');
});

// ===== RENDERING TESTS =====
console.log('\n%c[RENDERING]', 'color: #0ff; font-weight: bold');

test('rendering', 'Canvas element', document.querySelector('canvas') !== null, 'Rendered');
test('rendering', 'Scene has children', typeof scene !== 'undefined' && scene.children.length > 0, `${scene?.children?.length || 0} objects`);
test('rendering', 'Active camera set', typeof activeCamera !== 'undefined', activeCamera === camera ? 'FPS' : 'View');
test('rendering', 'Renderer size set', typeof renderer !== 'undefined' && renderer.domElement.width > 0, `${renderer?.domElement?.width}x${renderer?.domElement?.height}`);

// ===== DIAGNOSTICS =====
console.log('\n%c[RUNNING DIAGNOSTICS]', 'color: #0ff; font-weight: bold');

if (typeof OmniDiagnostics !== 'undefined' && OmniDiagnostics.runAllChecks) {
  OmniDiagnostics.runAllChecks().then(results => {
    console.log('\nDiagnostic Summary:');
    console.log(`  ✓ Passed: ${results.passed.length}`);
    console.log(`  ✗ Failed: ${results.failed.length}`);
    console.log(`  ⚠ Warnings: ${results.warnings.length}`);
  });
}

// ===== SUMMARY =====
const totalTests = Object.values(testResults).reduce((sum, arr) => sum + arr.length, 0);
const totalPassed = Object.values(testResults).reduce((sum, arr) => sum + arr.filter(t => t.passed).length, 0);
const totalFailed = totalTests - totalPassed;

console.log('\n%c╔═══════════════════════════════════╗', 'color: #0f6');
console.log('%c║        TEST SUMMARY               ║', 'color: #0f6');
console.log('%c╚═══════════════════════════════════╝', 'color: #0f6');

console.log(`%cTotal Tests: ${totalTests}`, 'color: #fff; font-weight: bold');
console.log(`%c✓ Passed: ${totalPassed}`, 'color: #0f6; font-weight: bold');
console.log(`%c✗ Failed: ${totalFailed}`, totalFailed > 0 ? 'color: #f44; font-weight: bold' : 'color: #888');

if (totalFailed === 0) {
  console.log('%c🎉 ALL TESTS PASSED! 🎉', 'color: #0f6; font-weight: bold; font-size: 16px');
} else {
  console.log('%c⚠ Some tests failed. Check above for details.', 'color: #ff0; font-weight: bold');
}

// ===== INTERACTIVE TEST FUNCTIONS =====
console.log('\n%c[INTERACTIVE TESTS - RUN THESE]', 'color: #0ff; font-weight: bold');
console.log('testMovement()      - Simulate W key press');
console.log('testTacticalView()  - Toggle tactical/commander view (M)');
console.log('testInventory()     - Toggle inventory (I)');
console.log('testPipBoy()        - Toggle Pip-Boy (Tab)');
console.log('startGameQuickPlay()- Start quick play mode');

window.testMovement = () => {
  console.log('%c[TEST] Movement - Pressing W...', 'color: #ff0; font-weight: bold');
  keys['KeyW'] = true;
  console.log('KeyW = true. Player should move forward.');
  console.log(`Player position: ${cameraRig?.position.x.toFixed(2)}, ${cameraRig?.position.z.toFixed(2)}`);
};

window.testTacticalView = () => {
  console.log('%c[TEST] Tactical View - Toggling...', 'color: #ff0; font-weight: bold');
  const before = gameMode;
  if (typeof toggleCommanderMode === 'function') {
    toggleCommanderMode();
    console.log(`Mode switched: ${before} → ${gameMode}`);
  }
};

window.testInventory = () => {
  console.log('%c[TEST] Inventory - Toggling...', 'color: #ff0; font-weight: bold');
  gameState.isInventoryOpen = !gameState.isInventoryOpen;
  console.log(`Inventory: ${gameState.isInventoryOpen ? 'OPEN' : 'CLOSED'}`);
};

window.testPipBoy = () => {
  console.log('%c[TEST] Pip-Boy - Toggling...', 'color: #ff0; font-weight: bold');
  if (typeof togglePipboy === 'function') {
    const before = gameState.isPipboyOpen;
    togglePipboy();
    console.log(`Pip-Boy: ${before ? 'CLOSED' : 'OPENED'}`);
  }
};

window.startGameQuickPlay = () => {
  console.log('%c[TEST] Starting Quick Play...', 'color: #ff0; font-weight: bold');
  if (typeof startMode === 'function') {
    startMode('SINGLE');
  }
};

console.log('\n%cTest script ready! Check results above.', 'color: #0f6; font-weight: bold');
