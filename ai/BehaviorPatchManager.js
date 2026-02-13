/**
 * Behavior Patch Manager
 * Safe request/approval pipeline for AI-proposed behavior changes
 * 
 * USAGE:
 * - External LLM requests a behavior change via AgentBridge.enqueueCommand()
 * - Patch is stored as "pending" with full metadata
 * - Human developer reviews via AIBehaviorPatches.list()
 * - Human approves via AIBehaviorPatches.apply(id)
 * - NO EVAL OR DYNAMIC EXECUTION - approval pipeline only
 * 
 * EXAMPLE:
 *   window.AgentBridge.enqueueCommand(JSON.stringify({
 *     type: 'request_behavior',
 *     payload: {
 *       featureId: 'seek_ai_tweak_1',
 *       summary: 'More aggressive enemy pursuit',
 *       code: '// Enhanced seek logic...',
 *       targetFile: 'IntelligentAgent.js',
 *       targetSection: 'seek_enemies mode'
 *     }
 *   }));
 * 
 *   AIBehaviorPatches.list()  // See all pending patches
 *   AIBehaviorPatches.apply('seek_ai_tweak_1')  // Approve and log
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        maxPendingPatches: 20,
        maxCodeLength: 10000,
        minCodeLength: 10,
        maxSummaryLength: 500,
        devMode: true
    };

    // Patch storage (in-memory only, resets on page reload)
    const patchStore = {
        pending: new Map(),
        approved: new Map(),
        rejected: new Map(),
        nextId: 1
    };

    const AIBehaviorPatches = {

        /**
         * Create a new behavior patch request
         * Called internally by AgentBridge when request_behavior command arrives
         * 
         * @param {object} payload - { featureId, summary, code, targetFile?, targetSection? }
         * @returns {object} { ok: boolean, patchId?: string, message: string }
         */
        createPatchRequest(payload) {
            // ─────────────────────────────────────────────────────────
            // VALIDATION
            // ─────────────────────────────────────────────────────────

            if (!payload || typeof payload !== 'object') {
                return { ok: false, message: 'Invalid payload: must be an object' };
            }

            const { featureId, summary, code, targetFile, targetSection } = payload;

            // Validate featureId
            if (!featureId || typeof featureId !== 'string' || featureId.trim().length === 0) {
                return { ok: false, message: 'Invalid featureId: must be a non-empty string' };
            }

            // Validate summary
            if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
                return { ok: false, message: 'Invalid summary: must be a non-empty string' };
            }

            if (summary.length > CONFIG.maxSummaryLength) {
                return {
                    ok: false,
                    message: `Summary too long: ${summary.length} chars (max ${CONFIG.maxSummaryLength})`
                };
            }

            // Validate code
            if (!code || typeof code !== 'string') {
                return { ok: false, message: 'Invalid code: must be a string' };
            }

            if (code.length < CONFIG.minCodeLength) {
                return {
                    ok: false,
                    message: `Code too short: ${code.length} chars (min ${CONFIG.minCodeLength})`
                };
            }

            if (code.length > CONFIG.maxCodeLength) {
                return {
                    ok: false,
                    message: `Code too long: ${code.length} chars (max ${CONFIG.maxCodeLength})`
                };
            }

            // Check if featureId already exists
            if (patchStore.pending.has(featureId) || patchStore.approved.has(featureId)) {
                return {
                    ok: false,
                    message: `Patch with featureId "${featureId}" already exists`
                };
            }

            // Check pending limit
            if (patchStore.pending.size >= CONFIG.maxPendingPatches) {
                return {
                    ok: false,
                    message: `Too many pending patches (max ${CONFIG.maxPendingPatches}). Review and apply/reject existing patches first.`
                };
            }

            // ─────────────────────────────────────────────────────────
            // CREATE PATCH ENTRY
            // ─────────────────────────────────────────────────────────

            const patch = {
                id: featureId,
                featureId: featureId,
                summary: summary.trim(),
                code: code,
                targetFile: targetFile || null,
                targetSection: targetSection || null,
                proposer: 'external_llm',
                createdAt: new Date().toISOString(),
                status: 'pending',
                internalId: patchStore.nextId++
            };

            patchStore.pending.set(featureId, patch);

            // Log to AI Dev Log
            if (window.IntelligentAgent) {
                window.IntelligentAgent.logThought(
                    `📝 Behavior patch requested: "${featureId}" – ${summary.substring(0, 80)}${summary.length > 80 ? '...' : ''}. Awaiting approval (AIBehaviorPatches.list/apply).`,
                    'info'
                );
            }

            if (CONFIG.devMode) {
                console.log(`[AIBehaviorPatches] Patch created: ${featureId}`);
            }

            return {
                ok: true,
                patchId: featureId,
                message: `Patch "${featureId}" created and awaiting approval`
            };
        },

        /**
         * List all patches, optionally filtered by status
         * 
         * @param {string} status - Optional filter: 'pending', 'approved', 'rejected', or null for all
         * @returns {array} Array of patch objects with metadata (no full code bodies)
         */
        list(status = 'pending') {
            const result = [];

            const addFromStore = (store, statusLabel) => {
                for (const patch of store.values()) {
                    result.push({
                        id: patch.id,
                        featureId: patch.featureId,
                        summary: patch.summary,
                        targetFile: patch.targetFile,
                        targetSection: patch.targetSection,
                        proposer: patch.proposer,
                        createdAt: patch.createdAt,
                        status: statusLabel,
                        codeLength: patch.code.length
                    });
                }
            };

            if (!status || status === 'all') {
                addFromStore(patchStore.pending, 'pending');
                addFromStore(patchStore.approved, 'approved');
                addFromStore(patchStore.rejected, 'rejected');
            } else if (status === 'pending') {
                addFromStore(patchStore.pending, 'pending');
            } else if (status === 'approved') {
                addFromStore(patchStore.approved, 'approved');
            } else if (status === 'rejected') {
                addFromStore(patchStore.rejected, 'rejected');
            }

            // Sort by createdAt descending (newest first)
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            return result;
        },

        /**
         * Get full details of a specific patch (including code)
         * 
         * @param {string} id - Patch featureId
         * @returns {object|null} Full patch object or null if not found
         */
        get(id) {
            return patchStore.pending.get(id) ||
                   patchStore.approved.get(id) ||
                   patchStore.rejected.get(id) ||
                   null;
        },

        /**
         * Apply (approve) a pending patch
         * Moves patch from pending to approved, logs the action
         * NO CODE EXECUTION - this is approval metadata only
         * 
         * @param {string} id - Patch featureId to approve
         * @returns {object} { ok: boolean, message: string }
         */
        apply(id) {
            const patch = patchStore.pending.get(id);

            if (!patch) {
                return {
                    ok: false,
                    message: `Patch "${id}" not found in pending patches`
                };
            }

            // Move to approved store
            patch.status = 'approved';
            patch.approvedAt = new Date().toISOString();
            patchStore.approved.set(id, patch);
            patchStore.pending.delete(id);

            // Log to AI Dev Log
            if (window.IntelligentAgent) {
                window.IntelligentAgent.logThought(
                    `✅ Behavior patch APPROVED: "${patch.featureId}" – ${patch.summary}. Target: ${patch.targetFile || 'unspecified'} (${patch.code.length} chars).`,
                    'info'
                );
            }

            if (CONFIG.devMode) {
                console.log(`[AIBehaviorPatches] Patch approved: ${id}`);
                console.log('Patch details:', {
                    featureId: patch.featureId,
                    summary: patch.summary,
                    targetFile: patch.targetFile,
                    targetSection: patch.targetSection,
                    codeLength: patch.code.length
                });
                console.log('Code to apply:');
                console.log(patch.code);
            }

            return {
                ok: true,
                message: `Patch "${id}" approved and logged. Review console for code details.`,
                patch: {
                    id: patch.id,
                    summary: patch.summary,
                    targetFile: patch.targetFile,
                    codeLength: patch.code.length
                }
            };
        },

        /**
         * Reject a pending patch
         * Moves patch from pending to rejected, logs the action
         * 
         * @param {string} id - Patch featureId to reject
         * @param {string} reason - Optional reason for rejection
         * @returns {object} { ok: boolean, message: string }
         */
        reject(id, reason = 'Human decision') {
            const patch = patchStore.pending.get(id);

            if (!patch) {
                return {
                    ok: false,
                    message: `Patch "${id}" not found in pending patches`
                };
            }

            // Move to rejected store
            patch.status = 'rejected';
            patch.rejectedAt = new Date().toISOString();
            patch.rejectionReason = reason;
            patchStore.rejected.set(id, patch);
            patchStore.pending.delete(id);

            // Log to AI Dev Log
            if (window.IntelligentAgent) {
                window.IntelligentAgent.logThought(
                    `❌ Behavior patch REJECTED: "${patch.featureId}" – ${reason}`,
                    'warn'
                );
            }

            if (CONFIG.devMode) {
                console.log(`[AIBehaviorPatches] Patch rejected: ${id} (${reason})`);
            }

            return {
                ok: true,
                message: `Patch "${id}" rejected: ${reason}`
            };
        },

        /**
         * Clear all patches of a given status or all
         * 
         * @param {string} status - 'pending', 'approved', 'rejected', or 'all'
         * @returns {object} { ok: boolean, cleared: number }
         */
        clear(status = 'all') {
            let cleared = 0;

            if (status === 'all' || status === 'pending') {
                cleared += patchStore.pending.size;
                patchStore.pending.clear();
            }

            if (status === 'all' || status === 'approved') {
                cleared += patchStore.approved.size;
                patchStore.approved.clear();
            }

            if (status === 'all' || status === 'rejected') {
                cleared += patchStore.rejected.size;
                patchStore.rejected.clear();
            }

            if (CONFIG.devMode) {
                console.log(`[AIBehaviorPatches] Cleared ${cleared} patches (status: ${status})`);
            }

            return { ok: true, cleared };
        },

        /**
         * Get statistics about patch store
         * 
         * @returns {object} Counts by status
         */
        stats() {
            return {
                pending: patchStore.pending.size,
                approved: patchStore.approved.size,
                rejected: patchStore.rejected.size,
                total: patchStore.pending.size + patchStore.approved.size + patchStore.rejected.size
            };
        },

        /**
         * Export lightweight snapshot for AgentBridge.exportSnapshot()
         * Only includes safe metadata, no full code bodies
         * 
         * @returns {object} Compact patch summary
         */
        exportSnapshot() {
            const pending = [];
            for (const patch of patchStore.pending.values()) {
                pending.push({
                    id: patch.id,
                    featureId: patch.featureId,
                    summary: patch.summary,
                    createdAt: patch.createdAt,
                    codeLength: patch.code.length,
                    targetFile: patch.targetFile
                });
            }

            return {
                pending: pending,
                appliedCount: patchStore.approved.size,
                rejectedCount: patchStore.rejected.size
            };
        }
    };

    // Expose to global scope
    window.AIBehaviorPatches = AIBehaviorPatches;

    if (CONFIG.devMode) {
        console.log('[AIBehaviorPatches] Initialized. Use AIBehaviorPatches.list() to see pending patches.');
    }
})();
