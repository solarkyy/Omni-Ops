// Quick Test - Run this in browser console after page loads
console.log('=== OMNI-OPS QUICK TEST ===');

// Test 1: Check if all critical functions are exposed
console.log('\n[TEST 1] Global Function Availability:');
const criticalFunctions = ['launchGame', 'startMode', 'initGame', 'handleInteraction'];
let missedFunctions = [];

criticalFunctions.forEach(fn => {
    if (typeof window[fn] === 'function') {
        console.log(`  ✓ window.${fn} available`);
    } else {
        console.log(`  ✗ window.${fn} MISSING`);
        missedFunctions.push(fn);
    }
});

// Test 2: Check game state
console.log('\n[TEST 2] Game State:');
console.log(`  Game Active: ${typeof gameState !== 'undefined' ? gameState.isGameActive : 'UNKNOWN'}`);
console.log(`  Story Module: ${typeof GameStory !== 'undefined' ? 'LOADED' : 'NOT LOADED'}`);
console.log(`  Living World: ${typeof LivingWorldNPCs !== 'undefined' ? 'LOADED' : 'NOT LOADED'}`);

// Test 3: Check DOM elements
console.log('\n[TEST 3] DOM Elements:');
const elements = ['game-container', 'ui-layer', 'dialogue-box', 'menu-overlay', 'interaction-prompt'];
elements.forEach(id => {
    const el = document.getElementById(id);
    console.log(`  ${id}: ${el ? '✓' : '✗'}`);
});

// Test 4: Simulate game launch
console.log('\n[TEST 4] Attempting Game Launch:');
if (missedFunctions.length === 0) {
    console.log('  All functions available - ready to launch!');
    console.log('  Run: window.launchGame() to start the game');
} else {
    console.log(`  ✗ Cannot launch - missing: ${missedFunctions.join(', ')}`);
}

console.log('\n=== TEST COMPLETE ===');
console.log('If all tests pass, click "Start Story" on the menu or run: window.launchGame()');
