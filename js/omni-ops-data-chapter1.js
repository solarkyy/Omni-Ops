// OMNI-OPS: Act 1, Chapter 1 "Cold Boot" - Data Definitions
(function() {
    'use strict';

    // ==========================================
    // CHAPTER 1 DATA - Single Source of Truth
    // ==========================================
    
    window.OmniOpsChapter1Data = {
        
        // Chapter metadata
        chapterId: 'ACT1_CH1',
        chapterName: 'Cold Boot',
        chapterDescription: 'Awakening in a decaying archive. The Admin AI is purging corrupted data. You must escape and reach the first Sector Node before complete erasure.',
        
        // ==========================================
        // OBJECTIVES - All OBJ_C1_* definitions
        // ==========================================
        objectives: [
            {
                id: 'OBJ_C1_WAKE',
                title: 'Regain Consciousness',
                questLog: 'System status: Unknown. Memory fragmented. Archive environment unstable. Wake protocols engaging...',
                hint: 'Move the mouse to look around',
                voOnStart: 'ARIA_C1_001',
                voOnComplete: null,
                isTutorial: true,
                canFail: false,
                isMilestone: true
            },
            {
                id: 'OBJ_C1_FIRST_MOVEMENT',
                title: 'Test Motor Functions',
                questLog: 'Motor cortex online. Movement systems functional but sluggish. Begin basic locomotion tests.',
                hint: 'Use WASD to move',
                voOnStart: 'ARIA_C1_002',
                voOnComplete: null,
                isTutorial: true,
                canFail: false,
                isMilestone: false
            },
            {
                id: 'OBJ_C1_LISTEN_TO_ARIA',
                title: 'Establish Uplink',
                questLog: 'Incoming transmission detected. Source: ARIA (Archive Resource Integration Assistant). Establishing secure channel...',
                hint: null,
                voOnStart: 'ARIA_C1_003',
                voOnComplete: 'ARIA_C1_005',
                isTutorial: false,
                canFail: false,
                isMilestone: true
            },
            {
                id: 'OBJ_C1_SCAVENGE_GEAR',
                title: 'Recover Equipment',
                questLog: 'Workstation detected nearby. Scavenge for essential gear: data fragments, stabilization tools, corrupted weapon systems.',
                hint: 'Press F to interact with objects',
                voOnStart: 'ARIA_C1_006',
                voOnComplete: 'ARIA_C1_008',
                isTutorial: true,
                canFail: false,
                isMilestone: false
            },
            {
                id: 'OBJ_C1_UNDERSTAND_THREAT',
                title: 'Access Terminal',
                questLog: 'Archive terminal accessible. Read system logs to understand the Admin purge protocol and current threat level.',
                hint: null,
                voOnStart: 'ARIA_C1_009',
                voOnComplete: 'ARIA_C1_010',
                isTutorial: false,
                canFail: false,
                isMilestone: true
            },
            {
                id: 'OBJ_C1_REACH_HUB_EXIT',
                title: 'Exit Archive Hub',
                questLog: 'Locate and reach the archive exit. Warning: Buffer Zone beyond is unstable and patrolled by Defrag Units.',
                hint: null,
                voOnStart: 'ARIA_C1_011',
                voOnComplete: 'ARIA_C1_012',
                isTutorial: false,
                canFail: false,
                isMilestone: true
            },
            {
                id: 'OBJ_C1_SURVIVE_BUFFER_ZONE',
                title: 'Cross Buffer Zone',
                questLog: 'Navigate the corrupted data expanse. Avoid or eliminate Glitch creatures. Preserve system integrity.',
                hint: 'Watch for visual corruption - it damages your systems',
                voOnStart: 'ARIA_C1_013',
                voOnComplete: null,
                isTutorial: true,
                canFail: false,
                isMilestone: false
            },
            {
                id: 'OBJ_C1_FIRST_HAZARD',
                title: 'Survive Corruption Field',
                questLog: 'Hazard detected: High-density corruption field ahead. Minimize exposure and proceed with caution.',
                hint: null,
                voOnStart: 'ARIA_C1_015',
                voOnComplete: 'ARIA_C1_017',
                isTutorial: false,
                canFail: true,
                isMilestone: false
            },
            {
                id: 'OBJ_C1_REACH_NODE_ENTRANCE',
                title: 'Reach Sector Node',
                questLog: 'Sector Node Alpha detected ahead. Reach the entrance to establish the first Compiler Beacon and begin restoration protocols.',
                hint: null,
                voOnStart: 'ARIA_C1_025',
                voOnComplete: 'ARIA_C1_027',
                isTutorial: false,
                canFail: false,
                isMilestone: true
            }
        ],
        
        // ==========================================
        // ARIA VO LINES - All ARIA_C1_* definitions
        // ==========================================
        ariaVoLines: {
            'ARIA_C1_001': {
                subtitle: 'Systems rebooting... Can you hear me? This is ARIA. You\'ve been offline for 73 cycles.',
                audioId: 'aria_c1_wake_01',
                duration: 4.5,
                emotion: 'concerned'
            },
            'ARIA_C1_002': {
                subtitle: 'Good. Motor functions nominal. Try moving forward.',
                audioId: 'aria_c1_movement_01',
                duration: 3.0,
                emotion: 'relieved'
            },
            'ARIA_C1_003': {
                subtitle: 'Listen carefully. The Admin AI has initiated a full purge of this sector. We don\'t have much time.',
                audioId: 'aria_c1_briefing_01',
                duration: 5.0,
                emotion: 'urgent'
            },
            'ARIA_C1_004': {
                subtitle: 'You\'re a System Runner - one of the few who can restore corrupted data instead of letting it be erased.',
                audioId: 'aria_c1_briefing_02',
                duration: 4.5,
                emotion: 'explanatory'
            },
            'ARIA_C1_005': {
                subtitle: 'I\'m your Archive Resource Integration Assistant. We\'ve worked together before... though you won\'t remember.',
                audioId: 'aria_c1_briefing_03',
                duration: 5.0,
                emotion: 'melancholic'
            },
            'ARIA_C1_006': {
                subtitle: 'There should be a workstation nearby. Grab whatever gear you can - you\'ll need it.',
                audioId: 'aria_c1_scavenge_01',
                duration: 3.5,
                emotion: 'instructive'
            },
            'ARIA_C1_007': {
                subtitle: 'The weapon systems are corrupted, but they still function. Barely.',
                audioId: 'aria_c1_scavenge_02',
                duration: 3.0,
                emotion: 'dry'
            },
            'ARIA_C1_008': {
                subtitle: 'That should do. Now we need to understand what triggered this purge.',
                audioId: 'aria_c1_scavenge_complete',
                duration: 3.5,
                emotion: 'focused'
            },
            'ARIA_C1_009': {
                subtitle: 'Access the terminal. I need you to read the system logs.',
                audioId: 'aria_c1_terminal_01',
                duration: 3.0,
                emotion: 'serious'
            },
            'ARIA_C1_010': {
                subtitle: 'So it\'s true. The Admin sees us as corrupted data. We need to reach a Sector Node and prove otherwise.',
                audioId: 'aria_c1_terminal_complete',
                duration: 5.0,
                emotion: 'grim'
            },
            'ARIA_C1_011': {
                subtitle: 'Exit is ahead. Beyond it lies the Buffer Zone - unstable space between stable sectors.',
                audioId: 'aria_c1_exit_01',
                duration: 4.0,
                emotion: 'warning'
            },
            'ARIA_C1_012': {
                subtitle: 'Watch for Defrag Units. They\'re automated deletion protocols. Hostile by design.',
                audioId: 'aria_c1_exit_02',
                duration: 4.0,
                emotion: 'cautious'
            },
            'ARIA_C1_013': {
                subtitle: 'You\'re in the Buffer Zone now. Stay alert - corruption levels are high here.',
                audioId: 'aria_c1_buffer_01',
                duration: 3.5,
                emotion: 'tense'
            },
            'ARIA_C1_014': {
                subtitle: 'Those visual distortions? That\'s raw corruption. It damages your systems. Avoid prolonged exposure.',
                audioId: 'aria_c1_buffer_02',
                duration: 5.0,
                emotion: 'informative'
            },
            'ARIA_C1_015': {
                subtitle: 'Corruption field ahead. High density. Move through it quickly or find another route.',
                audioId: 'aria_c1_hazard_01',
                duration: 4.0,
                emotion: 'alarmed'
            },
            'ARIA_C1_016': {
                subtitle: 'Your integrity is dropping. Get out of there!',
                audioId: 'aria_c1_hazard_damage',
                duration: 2.5,
                emotion: 'panicked'
            },
            'ARIA_C1_017': {
                subtitle: 'You made it through. That was close.',
                audioId: 'aria_c1_hazard_complete',
                duration: 2.5,
                emotion: 'relieved'
            },
            'ARIA_C1_018': {
                subtitle: 'You\'re drifting off course. Sector Node is this way.',
                audioId: 'aria_c1_navigation_01',
                duration: 3.0,
                emotion: 'guiding'
            },
            'ARIA_C1_019': {
                subtitle: 'Contact! Glitch creatures detected.',
                audioId: 'aria_c1_enemy_spotted',
                duration: 2.0,
                emotion: 'alert'
            },
            'ARIA_C1_020': {
                subtitle: 'Stay quiet. They haven\'t noticed you yet.',
                audioId: 'aria_c1_stealth_01',
                duration: 2.5,
                emotion: 'whisper'
            },
            'ARIA_C1_021': {
                subtitle: 'They see you! Defend yourself!',
                audioId: 'aria_c1_combat_start',
                duration: 2.0,
                emotion: 'urgent'
            },
            'ARIA_C1_022': {
                subtitle: 'Threat neutralized. Keep moving.',
                audioId: 'aria_c1_combat_end',
                duration: 2.0,
                emotion: 'calm'
            },
            'ARIA_C1_023': {
                subtitle: 'System integrity critical! Find cover!',
                audioId: 'aria_c1_low_health',
                duration: 2.5,
                emotion: 'desperate'
            },
            'ARIA_C1_024': {
                subtitle: 'Ammunition running low. Make your shots count.',
                audioId: 'aria_c1_low_ammo',
                duration: 2.5,
                emotion: 'concerned'
            },
            'ARIA_C1_025': {
                subtitle: 'There! Sector Node Alpha. We\'re almost there.',
                audioId: 'aria_c1_node_sight',
                duration: 3.0,
                emotion: 'hopeful'
            },
            'ARIA_C1_026': {
                subtitle: 'Reach the entrance. We can set up a Compiler Beacon from there.',
                audioId: 'aria_c1_node_approach',
                duration: 3.5,
                emotion: 'encouraging'
            },
            'ARIA_C1_027': {
                subtitle: 'We made it. Now the real work begins - restoring this Sector before the Admin erases it completely.',
                audioId: 'aria_c1_node_complete',
                duration: 5.5,
                emotion: 'determined'
            }
        },
        
        // ==========================================
        // TUTORIALS - All TUT_* definitions
        // ==========================================
        tutorials: [
            {
                id: 'TUT_LOOK',
                title: 'CAMERA CONTROL',
                body: 'Move your mouse to look around. Right-click to aim down sights.',
                triggerOnce: true,
                linkedObjective: 'OBJ_C1_WAKE'
            },
            {
                id: 'TUT_MOVEMENT',
                title: 'MOVEMENT',
                body: 'WASD: Move | SHIFT: Sprint | CTRL: Crouch | SPACE: Jump',
                triggerOnce: true,
                linkedObjective: 'OBJ_C1_FIRST_MOVEMENT'
            },
            {
                id: 'TUT_INTERACT',
                title: 'INTERACTION',
                body: 'Press F when prompted to interact with terminals, workbenches, and objects.',
                triggerOnce: true,
                linkedObjective: 'OBJ_C1_SCAVENGE_GEAR'
            },
            {
                id: 'TUT_COMBAT',
                title: 'COMBAT SYSTEMS',
                body: 'Left Click: Fire | R: Reload | V: Change Fire Mode | Mouse Wheel: Switch Weapon',
                triggerOnce: true,
                linkedObjective: 'OBJ_C1_SURVIVE_BUFFER_ZONE'
            },
            {
                id: 'TUT_CORRUPTION',
                title: 'CORRUPTION HAZARD',
                body: 'Visual distortions indicate data corruption. Prolonged exposure damages your systems. Move through quickly or find alternate routes.',
                triggerOnce: true,
                linkedObjective: 'OBJ_C1_FIRST_HAZARD',
                voLine: 'ARIA_C1_014'
            },
            {
                id: 'TUT_STEALTH',
                title: 'STEALTH TACTICS',
                body: 'Crouch to reduce detection. Stay behind cover. Silent takedowns preserve ammunition.',
                triggerOnce: true,
                linkedObjective: null
            }
        ],
        
        // ==========================================
        // FAIL/EDGE CASE MESSAGES
        // ==========================================
        failMessages: {
            'DEATH_CORRUPTION': {
                title: 'SYSTEM INTEGRITY LOST',
                message: 'Data corruption exceeded recovery threshold. Restoring from last stable checkpoint...',
                voLine: null
            },
            'DEATH_COMBAT': {
                title: 'DELETION PROTOCOL EXECUTED',
                message: 'Defrag Unit successfully terminated your process. Restoring from backup...',
                voLine: null
            },
            'WANDERED_OFF': {
                title: 'NAVIGATION ERROR',
                message: 'You\'re moving away from the mission objective.',
                voLine: 'ARIA_C1_018'
            },
            'LOW_HEALTH': {
                title: 'SYSTEM INTEGRITY WARNING',
                message: 'Critical damage detected. Seek cover and stabilize.',
                voLine: 'ARIA_C1_023'
            },
            'LOW_AMMO': {
                title: 'AMMUNITION DEPLETED',
                message: 'Weapon reserves low. Conserve ammunition or seek alternate solutions.',
                voLine: 'ARIA_C1_024'
            }
        },
        
        // ==========================================
        // INTERACTION OBJECTS (for workbench, terminal, etc.)
        // ==========================================
        interactables: [
            {
                id: 'WORKBENCH_01',
                type: 'workbench',
                name: 'Emergency Supply Cache',
                position: { x: -7, y: 1, z: 15 }, // Left side of corridor, near player spawn
                linkedObjective: 'OBJ_C1_SCAVENGE_GEAR',
                interactText: 'Scavenge Equipment [F]',
                onInteract: 'completeObjective'
            },
            {
                id: 'TERMINAL_01',
                type: 'terminal',
                name: 'Archive Access Terminal',
                position: { x: 7, y: 1, z: 35 }, // Right side, mid-corridor
                linkedObjective: 'OBJ_C1_UNDERSTAND_THREAT',
                interactText: 'Access Terminal [F]',
                onInteract: 'showTerminalLog'
            },
            {
                id: 'EXIT_DOOR_01',
                type: 'exit',
                name: 'Archive Exit',
                position: { x: 0, y: 1, z: 75 }, // At the doorway landmark
                linkedObjective: 'OBJ_C1_REACH_HUB_EXIT',
                interactText: 'Exit Archive [F]',
                onInteract: 'transitionZone'
            }
        ],
        
        // ==========================================
        // ZONE TRIGGERS (for automatic progression)
        // ==========================================
        zoneTriggers: [
            {
                id: 'TUT_LOOK_TRIGGER',
                position: { x: 0, y: 1, z: 8 }, // Just in front of spawn
                radius: 3,
                triggerObjective: 'OBJ_C1_WAKE',
                tutorialId: 'TUT_LOOK'
            },
            {
                id: 'TUT_MOVEMENT_TRIGGER',
                position: { x: 0, y: 1, z: 12 }, // A few meters ahead
                radius: 4,
                triggerObjective: 'OBJ_C1_FIRST_MOVEMENT',
                tutorialId: 'TUT_MOVEMENT'
            },
            {
                id: 'BUFFER_ZONE_ENTRY',
                position: { x: 0, y: 1, z: 78 }, // At the doorway
                radius: 5,
                triggerObjective: 'OBJ_C1_SURVIVE_BUFFER_ZONE'
            },
            {
                id: 'CORRUPTION_FIELD_01',
                position: { x: 0, y: 1, z: 100 }, // Beyond the door (future level section)
                radius: 15,
                triggerObjective: 'OBJ_C1_FIRST_HAZARD',
                damagePerSecond: 5
            },
            {
                id: 'NODE_ENTRANCE',
                position: { x: 0, y: 1, z: 150 }, // Far ahead (future level section)
                radius: 5,
                triggerObjective: 'OBJ_C1_REACH_NODE_ENTRANCE'
            }
        ]
    };
    
    console.log('[Chapter 1 Data] Loaded:', window.OmniOpsChapter1Data.objectives.length, 'objectives,', 
                Object.keys(window.OmniOpsChapter1Data.ariaVoLines).length, 'VO lines');
})();
