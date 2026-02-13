/**
 * Example Test Script for Step 4: Behavior Patch System
 * 
 * Run this in the browser console after loading the game
 * to test the behavior patch request/approval workflow
 */

console.log('=== Step 4: Behavior Patch System Test ===\n');

// TEST 1: Request a behavior patch
console.log('TEST 1: Requesting a behavior patch...');
const request1 = window.AgentBridge.enqueueCommand(JSON.stringify({
    type: 'request_behavior',
    payload: {
        featureId: 'patrol_enhanced_awareness',
        summary: 'Add 360-degree awareness checks during patrol to detect enemies behind',
        code: `
// Enhanced patrol awareness
if (this.currentMode === 'patrol_area') {
    // Check behind every 3 seconds
    if (now > this.nextAwarenessCheck) {
        this.nextAwarenessCheck = now + 3000;
        const enemiesBehind = this.detectEnemiesBehind(state);
        if (enemiesBehind.length > 0) {
            this.logThought('Patrol: Enemy detected behind!', 'warn');
            this.enterMode('seek_enemies');
        }
    }
}
        `.trim(),
        targetFile: 'IntelligentAgent.js',
        targetSection: 'patrol_area mode - main loop'
    }
}));
console.log('Result:', request1);
console.log('');

// TEST 2: Request another patch
console.log('TEST 2: Requesting another behavior patch...');
const request2 = window.AgentBridge.enqueueCommand(JSON.stringify({
    type: 'request_behavior',
    payload: {
        featureId: 'seek_smarter_chase',
        summary: 'Add predictive targeting when chasing moving enemies',
        code: `
// Predictive chase logic
const enemyVelocity = this.estimateEnemyVelocity(enemy);
const predictedPos = {
    x: enemy.position.x + enemyVelocity.x * 0.5,
    z: enemy.position.z + enemyVelocity.z * 0.5
};
const targetYaw = Math.atan2(
    predictedPos.z - state.position.z,
    predictedPos.x - state.position.x
);
        `.trim(),
        targetFile: 'IntelligentAgent.js',
        targetSection: 'seek_enemies mode - targeting'
    }
}));
console.log('Result:', request2);
console.log('');

// TEST 3: List pending patches
console.log('TEST 3: Listing pending patches...');
const pending = window.AIBehaviorPatches.list('pending');
console.table(pending);
console.log('');

// TEST 4: Get full details of first patch
console.log('TEST 4: Getting full details of first patch...');
const patch1 = window.AIBehaviorPatches.get('patrol_enhanced_awareness');
console.log('Patch details:', {
    id: patch1.id,
    summary: patch1.summary,
    targetFile: patch1.targetFile,
    targetSection: patch1.targetSection,
    codeLength: patch1.code.length
});
console.log('Full code:');
console.log(patch1.code);
console.log('');

// TEST 5: Check snapshot includes patches
console.log('TEST 5: Checking exportSnapshot() includes behaviorPatches...');
const snapshot = window.AgentBridge.exportSnapshot();
console.log('Behavior patches in snapshot:', snapshot.behaviorPatches);
console.log('');

// TEST 6: Check stats
console.log('TEST 6: Getting patch statistics...');
const stats = window.AIBehaviorPatches.stats();
console.log('Stats:', stats);
console.log('');

// TEST 7: Approve first patch
console.log('TEST 7: Approving first patch...');
const approveResult = window.AIBehaviorPatches.apply('patrol_enhanced_awareness');
console.log('Approval result:', approveResult);
console.log('');

// TEST 8: Reject second patch
console.log('TEST 8: Rejecting second patch...');
const rejectResult = window.AIBehaviorPatches.reject(
    'seek_smarter_chase',
    'Needs more testing - velocity estimation not implemented yet'
);
console.log('Rejection result:', rejectResult);
console.log('');

// TEST 9: Check final stats
console.log('TEST 9: Final statistics...');
const finalStats = window.AIBehaviorPatches.stats();
console.log('Final stats:', finalStats);
console.log('Pending:', window.AIBehaviorPatches.list('pending'));
console.log('Approved:', window.AIBehaviorPatches.list('approved'));
console.log('Rejected:', window.AIBehaviorPatches.list('rejected'));
console.log('');

// TEST 10: Test validation (should fail)
console.log('TEST 10: Testing validation (empty featureId - should fail)...');
const invalidRequest = window.AgentBridge.enqueueCommand(JSON.stringify({
    type: 'request_behavior',
    payload: {
        featureId: '',  // Invalid
        summary: 'Test',
        code: 'console.log("test");'
    }
}));
console.log('Validation result:', invalidRequest);
console.log('');

console.log('=== All tests complete! ===');
console.log('\nQuick reference:');
console.log('- AIBehaviorPatches.list()        // List pending patches');
console.log('- AIBehaviorPatches.get(id)       // Get full patch details');
console.log('- AIBehaviorPatches.apply(id)     // Approve a patch');
console.log('- AIBehaviorPatches.reject(id)    // Reject a patch');
console.log('- AIBehaviorPatches.stats()       // Get statistics');
console.log('- AIBehaviorPatches.clear("all")  // Clear all patches');
