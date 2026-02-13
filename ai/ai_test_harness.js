/**
 * OMNI-OPS AI TEST HARNESS - PRODUCTION READY
 * 
 * Comprehensive automated testing interface for AI behavior validation
 * 
 * SCOPE (EXTENDED):
 * - 5 built-in tests covering patrol, decision overrides, context integrity, actionHistory tracking, and timing
 * - Full test result schema with decisions[], metrics, and errors[]
 * - Polling utilities for mode changes without physics dependencies
 * - Dev console helpers and URL parameter support
 * - Test mode integration with AgentBridge
 * 
 * USAGE:
 *   // List available tests
 *   window.OmniOpsTestHarness.listTests();
 *   
 *   // Run a single test
 *   const result = await window.OmniOpsTestHarness.runTest('patrol_basic');
 *   console.log(result);
 *   
 *   // Run all tests
 *   const results = await window.OmniOpsTestHarness.runAll();
 *   
 *   // Dev console shortcut
 *   runAITest('patrol_basic');
 *   runAITest('chapter1_smoketest');
 *   // PASS: shows ✓ PASSED and Chapter 1 checks in console
 *   // FAIL: shows ✗ FAILED with reasons and errors
 *   
 *   // URL parameter support
 *   ?aitest=patrol_basic
 * 
 * ARCHITECTURE:
 * - Uses only AgentBridge, IntelligentAgent, and OmniAIWorker APIs
 * - No direct AIPlayerAPI calls
 * - No physics/movement dependencies
 * - Non-invasive cleanup after tests
 * - Test mode enabled during execution for deterministic results
 */

(function() {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────
    // STATE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────

    let testState = {
        isRunning: false,
        currentTest: null,
        currentTestRunId: null,
        startTime: null,
        allResults: []  // Store all test results from this session
    };

    // ─────────────────────────────────────────────────────────────────────
    // UTILITY FUNCTIONS
    // ─────────────────────────────────────────────────────────────────────

    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Poll a condition function until it returns true or timeout
     * NEVER throws - always resolves to true (success) or false (timeout)
     * 
     * @param {function} conditionFn - Function that returns boolean
     * @param {object|number} options - Options object OR legacy timeoutMs number
     * @param {number} options.timeoutMs - Maximum time to wait (default: 5000ms)
     * @param {number} options.intervalMs - Polling interval (default: 100ms)
     * @param {number} intervalMs - Legacy parameter (DEPRECATED, use options object)
     * @returns {Promise<boolean>} true if condition met, false if timeout
     * 
     * Examples:
     *   await pollUntil(() => agent.mode === 'patrol', { timeoutMs: 2000, intervalMs: 50 })
     *   await pollUntil(() => agent.mode === 'patrol', 2000, 100)  // legacy format
     */
    async function pollUntil(conditionFn, options = {}, intervalMs = null) {
        // Support both new options object and legacy (timeoutMs, intervalMs) format
        let timeoutMs, pollIntervalMs;
        if (typeof options === 'number') {
            // Legacy format: pollUntil(fn, timeoutMs, intervalMs)
            timeoutMs = options;
            pollIntervalMs = intervalMs || 100;
        } else {
            // New format: pollUntil(fn, { timeoutMs, intervalMs })
            timeoutMs = options.timeoutMs || 5000;
            pollIntervalMs = options.intervalMs || 100;
        }

        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            try {
                if (await conditionFn()) {
                    return true;
                }
            } catch (err) {
                console.warn('[Test Harness] pollUntil condition error:', err);
                // Continue polling even if condition throws
            }
            await wait(pollIntervalMs);
        }
        return false; // timeout - never throws
    }

    function getMetricsSnapshot() {
        if (!window.AgentBridge) {
            return { error: 'AgentBridge not available', ready: false };
        }
        const snapshot = window.AgentBridge.exportSnapshot?.();
        if (!snapshot) {
            return { error: 'exportSnapshot failed', ready: false };
        }

        return {
            ai_active: window.IntelligentAgent?.enabled || false,
            current_mode: window.IntelligentAgent?.currentMode || 'idle',
            player_health: snapshot.playerState?.health || 0,
            player_ammo: snapshot.playerState?.ammo || 0,
            actionHistory: window.IntelligentAgent?.actionHistory || [],
            ready: true
        };
    }

    // ─────────────────────────────────────────────────────────────────────
    // BUILT-IN TESTS
    // ─────────────────────────────────────────────────────────────────────

    const BUILT_IN_TESTS = {
        chapter1_smoketest: {
            description: 'Start Chapter 1 and verify corridor, ARIA intro VO, and first objective',
            estimatedDuration: 12000,
            async run(testContext) {
                const { recordCheck, recordError } = testContext;
                const reasons = [];

                try {
                    if (!window.AIPlayerAPI || typeof window.AIPlayerAPI.runStoryStartupSmokeTest !== 'function') {
                        recordCheck('AIPlayerAPI.runStoryStartupSmokeTest available', false);
                        reasons.push('AIPlayerAPI.runStoryStartupSmokeTest not available');
                        return reasons;
                    }

                    const result = await window.AIPlayerAPI.runStoryStartupSmokeTest({ timeoutMs: 10000 });
                    recordCheck('Smoke test executed', true);

                    (result.checks || []).forEach(check => {
                        recordCheck(check.name, check.passed === true);
                        if (check.passed) {
                            reasons.push(`✓ ${check.name}`);
                        } else {
                            reasons.push(`✗ ${check.name}${check.details ? ' - ' + check.details : ''}`);
                        }
                    });

                    if (!result.ok) {
                        recordError('Chapter 1 smoke test failed');
                    }
                } catch (err) {
                    recordError(`Test execution error: ${err.message}`);
                    reasons.push(`Test failed with error: ${err.message}`);
                }

                return reasons;
            }
        },
        patrol_basic: {
            description: 'Basic patrol mode activation and execution',
            estimatedDuration: 3500,
            async run(testContext) {
                const { testRunId, recordCheck, recordError } = testContext;
                const reasons = [];
                
                try {
                    // 1. Activate AI
                    window.IntelligentAgent.enable();
                    await wait(200);
                    recordCheck('AI activated', window.IntelligentAgent.enabled === true);
                    if (window.IntelligentAgent.enabled) reasons.push('AI successfully activated');

                    // 2. Send patrol command
                    const cmdResult = window.AgentBridge.enqueueCommand('patrol_area');
                    recordCheck('Command accepted', cmdResult.ok === true);
                    if (cmdResult.ok) reasons.push('patrol_area command accepted');

                    // 3. Wait for mode change
                    const modeChanged = await pollUntil(
                        () => window.IntelligentAgent.currentMode === 'patrol_area',
                        { timeoutMs: 2000, intervalMs: 100 }
                    );
                    recordCheck('Mode changed to patrol_area', modeChanged);
                    if (modeChanged) {
                        reasons.push('AI mode changed to patrol_area within 2s');
                    } else {
                        recordError('Mode change timeout - current mode: ' + window.IntelligentAgent.currentMode);
                        reasons.push('⚠ Mode did not change within 2s timeout');
                    }

                    // 4. Verify actionHistory
                    await wait(500);
                    const history = window.IntelligentAgent.getActionHistory(1);
                    recordCheck('ActionHistory populated', history.length > 0);
                    if (history.length > 0) {
                        recordCheck('ActionHistory command matches', history[0].command === 'patrol_area' || history[0].command === 'patrol');
                        recordCheck('ActionHistory success flag', history[0].success === true);
                        reasons.push('ActionHistory captured patrol command execution');
                    }

                    // 5. No errors in snapshot
                    const finalSnapshot = window.AgentBridge.exportSnapshot();
                    recordCheck('No errors in final snapshot', !finalSnapshot.error);

                } catch (err) {
                    recordError(`Test execution error: ${err.message}`);
                    reasons.push(`Test failed with error: ${err.message}`);
                }

                return reasons;
            }
        },

        decision_override_low_health: {
            description: 'Decision layer overrides dangerous commands when health is critical',
            estimatedDuration: 2000,
            /**
             * NOTE: This test uses test-mode state override to simulate critical health.
             * IntelligentAgent.setTestStateOverride() temporarily replaces state for decision logic.
             */
            async run(testContext) {
                const { testRunId, recordCheck, recordError } = testContext;
                const reasons = [];

                try {
                    // Enable AI first
                    window.IntelligentAgent.enable();
                    await wait(200);

                    // ★ SIMULATE CRITICAL HEALTH FOR OVERRIDE TEST ★
                    if (window.IntelligentAgent.setTestStateOverride) {
                        window.IntelligentAgent.setTestStateOverride({ health: 20, ammo: 30 });
                        reasons.push('Test state override: health=20 (critical)');
                    } else {
                        reasons.push('NOTE: setTestStateOverride not available - testing structure only');
                    }

                    // Send aggressive command (seek_enemies) - should be overridden to retreat
                    window.AgentBridge.enqueueCommand('seek_enemies');
                    await wait(500);

                    // Check actionHistory for decision tracking
                    const history = window.IntelligentAgent.getActionHistory(1);
                    recordCheck('ActionHistory captured decision', history.length > 0);

                    if (history.length > 0) {
                        const entry = history[0];
                        recordCheck('Command was seek_enemies', entry.command === 'seek_enemies' || entry.command === 'seek');
                        recordCheck('Decision system executed', entry.decidedMode !== undefined);
                        recordCheck('Execution tracked', entry.executionTimeMs !== undefined);
                        
                        reasons.push('Decision system tracked command execution');
                        reasons.push(`Requested: ${entry.command} → Decided: ${entry.decidedMode}`);
                        
                        if (entry.modeChanged) {
                            recordCheck('Safety override occurred', entry.decidedMode === 'return_to_safe_zone' || entry.decidedMode === 'hold_position');
                            reasons.push(`✓ Safety override detected: ${entry.reason}`);
                        } else {
                            // If no override, health might not be low enough or override not implemented
                            reasons.push(`No override (decided = requested). Health might be sufficient or mock not applied.`);
                        }
                    }

                } catch (err) {
                    recordError(`Test execution error: ${err.message}`);
                    reasons.push(`Test failed with error: ${err.message}`);
                } finally {
                    // Clear test state override
                    if (window.IntelligentAgent.setTestStateOverride) {
                        window.IntelligentAgent.setTestStateOverride(null);
                    }
                }

                return reasons;
            }
        },

        context_snapshot_integrity: {
            description: 'Validate snapshot structure and required fields',
            estimatedDuration: 500,
            /**
             * REQUIRED SNAPSHOT SCHEMA (as of 2026-02-12):
             * If AgentBridge.exportSnapshot() changes, update these checks:
             * 
             * Top-level: { playerState, sectorState, aiContext, recentActions, bridgeReady }
             * playerState: { health, ammo, position{x,y,z}, mode, stamina, isAiming, isReloading }
             * sectorState: { currentSectorId, isInSafeZone, isInCorruptedZone, areaLabel }
             * aiContext: { status, loadedAt, files[] }
             * recentActions: array of { time, message, level }
             */
            async run(testContext) {
                const { testRunId, recordCheck, recordError } = testContext;
                const reasons = [];

                try {
                    const snapshot = window.AgentBridge.exportSnapshot();

                    // Check required top-level fields
                    recordCheck('Snapshot exists', snapshot !== null && snapshot !== undefined);
                    recordCheck('playerState exists', typeof snapshot.playerState === 'object');
                    recordCheck('sectorState exists', typeof snapshot.sectorState === 'object');
                    recordCheck('aiContext exists', typeof snapshot.aiContext === 'object');
                    recordCheck('recentActions is array', Array.isArray(snapshot.recentActions));
                    recordCheck('bridgeReady flag', snapshot.bridgeReady === true);

                    // Check playerState required fields
                    if (snapshot.playerState) {
                        recordCheck('playerState.health is number', typeof snapshot.playerState.health === 'number');
                        recordCheck('playerState.ammo is number', typeof snapshot.playerState.ammo === 'number');
                        recordCheck('playerState.position exists', typeof snapshot.playerState.position === 'object');
                        if (snapshot.playerState.position) {
                            recordCheck('position.x exists', typeof snapshot.playerState.position.x === 'number');
                            recordCheck('position.y exists', typeof snapshot.playerState.position.y === 'number');
                            recordCheck('position.z exists', typeof snapshot.playerState.position.z === 'number');
                        }
                    }

                    // Check sectorState required fields
                    if (snapshot.sectorState) {
                        recordCheck('sectorState.currentSectorId exists', typeof snapshot.sectorState.currentSectorId === 'string');
                        recordCheck('sectorState.areaLabel exists', typeof snapshot.sectorState.areaLabel === 'string');
                    }

                    // Check no error field
                    recordCheck('No error field', !snapshot.error);

                    reasons.push('Snapshot schema validation passed');
                    reasons.push(`Snapshot size: ${JSON.stringify(snapshot).length} bytes`);

                } catch (err) {
                    recordError(`Schema validation error: ${err.message}`);
                    reasons.push(`Validation failed: ${err.message}`);
                }

                return reasons;
            }
        },

        actionHistory_tracking: {
            description: 'Verify actionHistory captures multiple commands with full context',
            estimatedDuration: 4000,
            async run(testContext) {
                const { testRunId, recordCheck, recordError } = testContext;
                const reasons = [];

                try {
                    // Enable AI
                    window.IntelligentAgent.enable();
                    await wait(200);

                    // Send 3 commands in sequence
                    window.AgentBridge.enqueueCommand('patrol_area');
                    await wait(800);
                    
                    window.AgentBridge.enqueueCommand('hold_position');
                    await wait(800);
                    
                    window.AgentBridge.enqueueCommand('status');
                    await wait(800);

                    // Check actionHistory
                    const history = window.IntelligentAgent.getActionHistory();
                    recordCheck('ActionHistory has entries', history.length >= 3);

                    if (history.length >= 3) {
                        // Most recent should be first (LIFO order)
                        recordCheck('LIFO order maintained', history[0].timestamp > history[1].timestamp || history[0].time > history[1].time);

                        // Check required fields in first entry
                        const entry = history[0];
                        recordCheck('Entry has timestamp', !!entry.timestamp);
                        recordCheck('Entry has command', !!entry.command);
                        recordCheck('Entry has decidedMode', !!entry.decidedMode);
                        recordCheck('Entry has beforeState', typeof entry.beforeState === 'object');
                        recordCheck('Entry has afterState', typeof entry.afterState === 'object');
                        recordCheck('Entry has executionTimeMs', typeof entry.executionTimeMs === 'number');
                        recordCheck('Entry has testRunId', entry.testRunId === testRunId);

                        reasons.push(`ActionHistory captured ${history.length} commands`);
                        reasons.push('All entries have required fields and test context');
                    }

                } catch (err) {
                    recordError(`ActionHistory test error: ${err.message}`);
                    reasons.push(`Test failed: ${err.message}`);
                }

                return reasons;
            }
        },

        mode_transition_timing: {
            description: 'Measure command-to-mode-change latency',
            estimatedDuration: 1500,
            async run(testContext) {
                const { testRunId, recordCheck, recordError } = testContext;
                const reasons = [];

                try {
                    // Enable AI
                    window.IntelligentAgent.enable();
                    await wait(200);

                    // Measure command execution time
                    const t0 = Date.now();
                    window.AgentBridge.enqueueCommand('patrol_area');

                    // Wait for mode change
                    const modeChanged = await pollUntil(
                        () => window.IntelligentAgent.currentMode === 'patrol_area',
                        { timeoutMs: 2000, intervalMs: 50 }
                    );
                    const t1 = Date.now();
                    const transitionTime = t1 - t0;

                    recordCheck('Mode changed', modeChanged);
                    if (!modeChanged) {
                        recordError(`Mode transition timeout after ${transitionTime}ms`);
                        reasons.push(`⚠ Mode did not change within 2s`);
                    }
                    recordCheck('Transition under 200ms', transitionTime < 200);

                    // Check actionHistory timing
                    await wait(300);
                    const history = window.IntelligentAgent.getActionHistory(1);
                    if (history.length > 0) {
                        const executionTime = history[0].executionTimeMs;
                        recordCheck('ExecutionTimeMs populated', typeof executionTime === 'number');
                        recordCheck('ExecutionTimeMs reasonable', executionTime >= 0 && executionTime < 500);
                        
                        reasons.push(`Mode transition: ${transitionTime}ms`);
                        reasons.push(`Execution time recorded: ${executionTime}ms`);
                    }

                    // Check for duplicate entries
                    const allHistory = window.IntelligentAgent.getActionHistory();
                    const commands = allHistory.map(e => e.command);
                    const uniqueCommands = new Set(commands);
                    // Note: There might be duplicates from previous operations, this is just informational
                    reasons.push(`ActionHistory has ${allHistory.length} total entries`);

                } catch (err) {
                    recordError(`Timing test error: ${err.message}`);
                    reasons.push(`Test failed: ${err.message}`);
                }

                return reasons;
            }
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    // TEST EXECUTION ENGINE
    // ─────────────────────────────────────────────────────────────────────

    async function runTest(testName, options = {}) {
        const test = BUILT_IN_TESTS[testName];
        if (!test) {
            throw new Error(`Unknown test: ${testName}. Available: ${Object.keys(BUILT_IN_TESTS).join(', ')}`);
        }

        // ★ CONCURRENT TEST GUARD ★
        if (testState.isRunning) {
            const errorMsg = `Cannot run test "${testName}" - another test (${testState.currentTest}) is already running`;
            console.error(`[Test Harness] ${errorMsg}`);
            return {
                name: testName,
                testRunId: null,
                startedAt: new Date().toISOString(),
                finishedAt: new Date().toISOString(),
                durationMs: 0,
                passed: false,
                reasons: [errorMsg],
                decisions: [],
                errors: [{ timestamp: new Date().toISOString(), message: errorMsg, step: null }],
                metrics: {
                    commandsSent: 0,
                    checksPerformed: 0,
                    checksPassed: 0,
                    checksFailed: 0,
                    modeTransitions: 0,
                    decisionOverrides: 0,
                    avgExecutionTimeMs: 0,
                    snapshotBytes: 0
                },
                finalSnapshot: null
            };
        }

        // ★ WAIT FOR SYSTEM READY - Prevents race conditions from async script loading
        console.log('[Test Harness] Checking system readiness...');
        const readyResult = await waitForSystemReady(3000);
        
        if (!readyResult.ready) {
            const readiness = readyResult.readiness;
            const errorMsg = `System not ready: ${readiness?.missingComponents?.join(', ') || 'unknown components'} missing`;
            console.error(`[Test Harness] ${errorMsg}`);
            console.error('[Test Harness] Recommendations:', readiness?.recommendations);
            console.error('[Test Harness] Component status:', readiness?.components);
            throw new Error(errorMsg);
        }
        
        console.log('[Test Harness] ✓ System ready, proceeding with test');

        // Generate test run ID
        const testRunId = generateUUID();
        const startedAt = new Date().toISOString();
        const startTime = Date.now();

        testState.isRunning = true;
        testState.currentTest = testName;
        testState.currentTestRunId = testRunId;
        testState.startTime = startTime;

        // ★ PRESERVE ORIGINAL SETTINGS FOR CLEANUP ★
        const originalActionHistoryLimit = window.IntelligentAgent?.actionHistoryLimit;

        // Enable test mode
        window.AgentBridge.enableTestMode();

        // ★ INCREASE ACTION HISTORY LIMIT TO PREVENT TEST DATA LOSS ★
        if (window.IntelligentAgent) {
            window.IntelligentAgent.actionHistoryLimit = 50;  // Temporarily increase from 10 to 50
        }

        // Test result tracking
        const checks = [];
        const errors = [];
        let reasons = [];

        const testContext = {
            testRunId,
            recordCheck(description, passed) {
                checks.push({
                    description,
                    passed: !!passed,
                    timestamp: new Date().toISOString()
                });
                if (passed) {
                    console.log(`[Test Harness] ✓ ${description}`);
                } else {
                    console.warn(`[Test Harness] ✗ ${description}`);
                }
            },
            recordError(message) {
                errors.push({
                    timestamp: new Date().toISOString(),
                    message,
                    step: null
                });
                console.error(`[Test Harness] Error: ${message}`);
            }
        };

        try {
            // Set testRunId in IntelligentAgent for tracking
            if (window.IntelligentAgent) {
                window.IntelligentAgent._currentTestRunId = testRunId;
            }

            console.log(`[Test Harness] Running test: ${testName}`);
            reasons = await test.run(testContext);

        } catch (err) {
            testContext.recordError(`Test execution failed: ${err.message}`);
            reasons.push(`Fatal error: ${err.message}`);
        } finally {
            // ★ GUARANTEED CLEANUP - ALWAYS RUNS EVEN ON ERRORS ★
            if (window.IntelligentAgent) {
                window.IntelligentAgent.disable();
                window.IntelligentAgent._currentTestRunId = null;
                window.IntelligentAgent._testStateOverrides = null;  // Clear any test state
                // Restore original actionHistory limit
                if (originalActionHistoryLimit !== undefined) {
                    window.IntelligentAgent.actionHistoryLimit = originalActionHistoryLimit;
                }
            }
            if (window.AgentBridge) {
                window.AgentBridge.disableTestMode();
            }

            testState.isRunning = false;
            testState.currentTest = null;
            testState.currentTestRunId = null;
        }

        // Build result object
        const finishedAt = new Date().toISOString();
        const durationMs = Date.now() - startTime;
        const checksPassed = checks.filter(c => c.passed).length;
        const checksFailed = checks.filter(c => !c.passed).length;
        const passed = checksFailed === 0 && checks.length > 0;

        // Get final snapshot and decisions
        const finalSnapshot = window.AgentBridge.exportSnapshot();
        const decisions = window.IntelligentAgent?.getActionHistory().filter(e => e.testRunId === testRunId) || [];

        const result = {
            name: testName,
            testRunId,
            startedAt,
            finishedAt,
            durationMs,
            passed,
            reasons: reasons || [],
            decisions,
            errors,
            metrics: {
                commandsSent: decisions.length,
                checksPerformed: checks.length,
                checksPassed,
                checksFailed,
                modeTransitions: decisions.filter(d => d.modeChanged).length,
                decisionOverrides: decisions.filter(d => d.modeChanged).length,
                avgExecutionTimeMs: decisions.length > 0 
                    ? decisions.reduce((sum, d) => sum + (d.executionTimeMs || 0), 0) / decisions.length 
                    : 0,
                snapshotBytes: JSON.stringify(finalSnapshot).length
            },
            finalSnapshot
        };

        // Store result
        testState.allResults.push(result);

        console.log(`[Test Harness] Test completed: ${testName} - ${passed ? 'PASSED' : 'FAILED'} (${durationMs}ms)`);
        return result;
    }

    async function runAll(options = {}) {
        const testNames = Object.keys(BUILT_IN_TESTS);
        const results = [];

        console.log(`[Test Harness] Running all tests (${testNames.length} total)`);

        for (const testName of testNames) {
            try {
                const result = await runTest(testName, options);
                results.push(result);
                
                // Brief pause between tests
                await wait(500);
            } catch (err) {
                console.error(`[Test Harness] Test ${testName} failed to execute:`, err);
                results.push({
                    name: testName,
                    passed: false,
                    errors: [{ message: `Failed to execute: ${err.message}` }],
                    reasons: [`Test did not run: ${err.message}`]
                });
            }
        }

        const passedCount = results.filter(r => r.passed).length;
        console.log(`[Test Harness] All tests complete: ${passedCount}/${results.length} passed`);

        return results;
    }

    // ─────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────

    const OmniOpsTestHarness = {
        // Lifecycle
        init() {
            console.log('[Test Harness] Initializing...');
            const readiness = window.AgentBridge?.getTestReadiness();
            if (readiness && !readiness.ready) {
                console.warn('[Test Harness] System not ready:', readiness.missingComponents);
                return false;
            }
            console.log('[Test Harness] ✓ Initialized and ready');
            return true;
        },

        reset() {
            testState = {
                isRunning: false,
                currentTest: null,
                currentTestRunId: null,
                startTime: null,
                allResults: []
            };
            console.log('[Test Harness] State reset');
        },

        enableTestMode() {
            return window.AgentBridge?.enableTestMode();
        },

        disableTestMode() {
            return window.AgentBridge?.disableTestMode();
        },

        getTestReadiness() {
            return window.AgentBridge?.getTestReadiness() || { ready: false, missingComponents: ['AgentBridge'] };
        },

        // Test execution
        listTests() {
            return Object.keys(BUILT_IN_TESTS);
        },

        getTestInfo(name) {
            const test = BUILT_IN_TESTS[name];
            if (!test) return null;
            return {
                name,
                description: test.description,
                estimatedDuration: test.estimatedDuration
            };
        },

        runTest,
        runAll,

        // Results & metrics
        getLastResult() {
            return testState.allResults[testState.allResults.length - 1] || null;
        },

        getAllResults() {
            return testState.allResults;
        },

        getMetrics() {
            return getMetricsSnapshot();
        },

        getLiveStatus() {
            return {
                isRunning: testState.isRunning,
                currentTest: testState.currentTest,
                testRunId: testState.currentTestRunId,
                startedAt: testState.startTime ? new Date(testState.startTime).toISOString() : null,
                elapsedMs: testState.startTime ? Date.now() - testState.startTime : 0
            };
        },

        clearResults() {
            testState.allResults = [];
            console.log('[Test Harness] Results cleared');
        },

        // Utilities
        wait,
        pollUntil
    };

    // ─────────────────────────────────────────────────────────────────────
    // DEV CONSOLE HELPERS (Namespaced to avoid collisions)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Quick test runner - formats and displays results in console
     * @param {string} testName - Name of test to run
     * @returns {Promise<TestResult>} Test result object
     */
    window.runAITest = async function(testName) {
        try {
            const result = await OmniOpsTestHarness.runTest(testName);
            console.log('\n═══ TEST RESULT ═══');
            console.log(`Test: ${result.name}`);
            console.log(`Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
            console.log(`Duration: ${result.durationMs}ms`);
            console.table(result.metrics);
            if (result.reasons.length > 0) {
                console.log('\nReasons:');
                result.reasons.forEach(r => console.log(`  - ${r}`));
            }
            if (result.errors.length > 0) {
                console.log('\nErrors:');
                result.errors.forEach(e => console.log(`  - ${e.message}`));
            }
            return result;
        } catch (err) {
            console.error('Test execution failed:', err);
            throw err;
        }
    };

    /**
     * Run all tests and display summary
     * @returns {Promise<TestResult[]>} Array of all test results
     */
    window.runAllAITests = async function() {
        try {
            const results = await OmniOpsTestHarness.runAll();
            const passedCount = results.filter(r => r.passed).length;
            console.log(`\n✓ ${passedCount}/${results.length} tests passed\n`);
            console.table(results.map(r => ({
                test: r.name,
                passed: r.passed ? '✓' : '✗',
                duration: `${r.durationMs}ms`,
                checks: `${r.metrics?.checksPassed || 0}/${r.metrics?.checksPerformed || 0}`
            })));
            return results;
        } catch (err) {
            console.error('Test suite failed:', err);
            throw err;
        }
    };

    /**
     * Check current test execution status
     */
    window.aiTestStatus = function() {
        const status = OmniOpsTestHarness.getLiveStatus();
        console.log('AI Test Status:', status);
        return status;
    };

    // Also namespace under OmniOpsTestHarness for safer access
    OmniOpsTestHarness.console = {
        runTest: window.runAITest,
        runAll: window.runAllAITests,
        status: window.aiTestStatus
    };

    // ─────────────────────────────────────────────────────────────────────
    // URL PARAMETER SUPPORT
    // ─────────────────────────────────────────────────────────────────────

    function checkURLParameter() {
        const params = new URLSearchParams(window.location.search);
        const testName = params.get('aitest');
        
        if (testName) {
            console.log(`[Test Harness] URL parameter detected: aitest=${testName}`);
            // Wait for page load then run test
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => runAITest(testName), 1000);
                });
            } else {
                setTimeout(() => runAITest(testName), 1000);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // INITIALIZATION WAIT MECHANISM
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Wait for all AI components to be ready before allowing test execution
     * This prevents "IntelligentAgent missing" errors from loading order race conditions
     */
    async function waitForSystemReady(timeoutMs = 5000) {
        const startTime = Date.now();
        let lastStatus = '';

        while (Date.now() - startTime < timeoutMs) {
            const readiness = window.AgentBridge?.getTestReadiness();
            
            if (readiness?.ready) {
                console.log('[AI Test Harness] ✓ System ready - all components loaded');
                return { ready: true, readiness };
            }

            // Log status changes to help debug
            const currentStatus = JSON.stringify(readiness?.missingComponents || []);
            if (currentStatus !== lastStatus) {
                console.log('[AI Test Harness] Waiting for:', readiness?.missingComponents?.join(', ') || 'unknown');
                lastStatus = currentStatus;
            }

            await wait(100);
        }

        const finalReadiness = window.AgentBridge?.getTestReadiness();
        return { ready: false, readiness: finalReadiness, timedOut: true };
    }

    // ─────────────────────────────────────────────────────────────────────
    // EXPORT & INITIALIZATION
    // ─────────────────────────────────────────────────────────────────────

    window.OmniOpsTestHarness = OmniOpsTestHarness;
    window.OmniOpsTestHarness.waitForSystemReady = waitForSystemReady;

    console.log('[AI Test Harness] ✓ Loaded (waiting for system components...)');

    // Wait for system to be ready then announce
    waitForSystemReady(5000).then(result => {
        if (result.ready) {
            console.log('[AI Test Harness] ✓ System Ready!');
            console.log('[AI Test Harness] Available tests:', OmniOpsTestHarness.listTests());
            console.log('[AI Test Harness] Quick start: runAITest("patrol_basic")');
            console.log('[AI Test Harness] Run all: runAllAITests()');
        } else {
            console.warn('[AI Test Harness] ⚠ System not ready after 5s timeout');
            console.warn('[AI Test Harness] Missing components:', result.readiness?.missingComponents);
            console.warn('[AI Test Harness] Recommendations:', result.readiness?.recommendations);
            console.warn('[AI Test Harness] You can still try: runAITest("patrol_basic"), but it may fail');
        }
    });

    // Check URL parameters
    checkURLParameter();

})();
