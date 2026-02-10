(function() {
    'use strict';

    // ====== FABLE-STYLE LIVING WORLD SYSTEM ======
    // NPCs with jobs, daily routines, building interactions, and realistic behavior
    
    const JobType = {
        NONE: 'NONE',
        BLACKSMITH: 'BLACKSMITH',        // Works at forge, repairs/crafts
        FARMER: 'FARMER',                // Works in fields or market
        MERCHANT: 'MERCHANT',            // Works at stalls, trades goods
        GUARD: 'GUARD',                  // Patrols, guards buildings
        PRIEST: 'PRIEST',                // Works at temple/shrine
        INNKEEPER: 'INNKEEPER',          // Manages tavern/inn
        WOODCUTTER: 'WOODCUTTER',       // Works in forest
        ALCHEMIST: 'ALCHEMIST',         // Works in shop/lab
        FLETCHER: 'FLETCHER',           // Crafts arrows
        LAWYER: 'LAWYER'                // Trades, negotiates
    };

    const BuildingType = {
        TAVERN: 'TAVERN',
        BLACKSMITH: 'BLACKSMITH',
        FARM: 'FARM',
        TEMPLE: 'TEMPLE',
        MARKET: 'MARKET',
        HOUSE: 'HOUSE',
        GUARD_POST: 'GUARD_POST',
        ALCHEMIST: 'ALCHEMIST_SHOP',
        MILL: 'MILL'
    };

    const ActivitySchedule = {
        SLEEPING: { start: 22, end: 6 },
        WORKING: { start: 7, end: 17 },
        EATING: { start: 12, end: 13 },
        RESTING: { start: 17, end: 21 },
        SOCIALIZING: { start: 19, end: 22 }
    };

    // Building definitions
    const buildingDatabase = {
        tavern_0: {
            name: 'The Prancing Pony',
            type: BuildingType.TAVERN,
            position: { x: 0, z: -35 },
            size: { w: 12, h: 8, d: 12 },
            color: 0x8b4513,
            jobs: [JobType.INNKEEPER],
            interiorSize: { w: 10, h: 6, d: 10 },
            npcsExpected: 3
        },
        blacksmith_0: {
            name: 'Ironsmith\'s Forge',
            type: BuildingType.BLACKSMITH,
            position: { x: 25, z: 0 },
            size: { w: 15, h: 10, d: 12 },
            color: 0x556655,
            jobs: [JobType.BLACKSMITH, JobType.FLETCHER],
            interiorSize: { w: 12, h: 8, d: 10 },
            npcsExpected: 2
        },
        farm_0: {
            name: 'Fertile Fields',
            type: BuildingType.FARM,
            position: { x: -30, z: 15 },
            size: { w: 20, h: 4, d: 20 },
            color: 0x228b22,
            jobs: [JobType.FARMER],
            interiorSize: null, // Farm has no interior
            npcsExpected: 4
        },
        temple_0: {
            name: 'Sacred Temple',
            type: BuildingType.TEMPLE,
            position: { x: 0, z: 35 },
            size: { w: 14, h: 16, d: 14 },
            color: 0x4a4a4a,
            jobs: [JobType.PRIEST],
            interiorSize: { w: 12, h: 14, d: 12 },
            npcsExpected: 2
        },
        market_0: {
            name: 'Town Market',
            type: BuildingType.MARKET,
            position: { x: -20, z: -20 },
            size: { w: 18, h: 6, d: 18 },
            color: 0xaa8866,
            jobs: [JobType.MERCHANT, JobType.FARMER],
            interiorSize: null,
            npcsExpected: 5
        },
        alchemist_0: {
            name: 'Potion Emporium',
            type: BuildingType.ALCHEMIST,
            position: { x: 15, z: -15 },
            size: { w: 10, h: 9, d: 10 },
            color: 0x2d5016,
            jobs: [JobType.ALCHEMIST],
            interiorSize: { w: 8, h: 7, d: 8 },
            npcsExpected: 1
        }
    };

    const jobAppearances = {
        [JobType.BLACKSMITH]: { colorBody: 0x443344, colorVisor: 0xff6600, equipment: 'hammer' },
        [JobType.FARMER]: { colorBody: 0x556633, colorVisor: 0x88cc00, equipment: 'scythe' },
        [JobType.MERCHANT]: { colorBody: 0x665544, colorVisor: 0xffdd00, equipment: 'scales' },
        [JobType.GUARD]: { colorBody: 0x1a1a4a, colorVisor: 0x0099ff, equipment: 'sword' },
        [JobType.PRIEST]: { colorBody: 0x2a2a2a, colorVisor: 0xff99ff, equipment: 'staff' },
        [JobType.INNKEEPER]: { colorBody: 0x443333, colorVisor: 0xffaaaa, equipment: 'bottle' },
        [JobType.WOODCUTTER]: { colorBody: 0x553333, colorVisor: 0x99ff99, equipment: 'axe' },
        [JobType.ALCHEMIST]: { colorBody: 0x331133, colorVisor: 0x00ff99, equipment: 'potion' },
        [JobType.FLETCHER]: { colorBody: 0x443355, colorVisor: 0x00ffff, equipment: 'bow' }
    };

    // Living World NPC Manager
    const LivingWorldNPCs = {
        npcs: [],
        buildings: {},
        currentHour: 12,
        currentDay: 0,
        worldState: {},

        init: function() {
            console.log('[Living World] Initializing...');
            this.buildings = JSON.parse(JSON.stringify(buildingDatabase));
            this.createVillage();
            this.startDayNightCycle();
            console.log('[Living World] Ready - spawned', this.npcs.length, 'NPCs');
        },

        createVillage: function() {
            // Spawn buildings and populate with NPCs
            Object.entries(this.buildings).forEach(([key, building]) => {
                this.spawnBuilding(building);
                
                // Assign NPCs to this building
                for (let i = 0; i < building.npcsExpected; i++) {
                    const job = building.jobs[i % building.jobs.length];
                    const npc = this.createNPC({
                        job: job,
                        building: building,
                        slotIndex: i
                    });
                    this.npcs.push(npc);
                }
            });
        },

        spawnBuilding: function(building) {
            if (!window.scene) return;

            const mat = new THREE.MeshStandardMaterial({ color: building.color });
            const w = building.size.w;
            const h = building.size.h;
            const d = building.size.d;
            const pos = building.position;

            // Floor
            const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), mat);
            floor.position.set(pos.x, 0.15, pos.z);
            floor.receiveShadow = true;
            window.scene.add(floor);
            if (window.objects) window.objects.push(floor);

            // Walls
            const walls = [
                { size: [w, h, 0.3], pos: [0, h/2, d/2] },     // Front
                { size: [w, h, 0.3], pos: [0, h/2, -d/2] },    // Back
                { size: [0.3, h, d], pos: [w/2, h/2, 0] },     // Right
                { size: [0.3, h, d], pos: [-w/2, h/2, 0] }     // Left
            ];

            walls.forEach(w => {
                const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), mat);
                wall.position.set(pos.x + w.pos[0], pos.y + w.pos[1], pos.z + w.pos[2]);
                wall.castShadow = true;
                wall.receiveShadow = true;
                window.scene.add(wall);
                if (window.objects) window.objects.push(wall);
            });

            // Roof
            const roofMat = new THREE.MeshStandardMaterial({ color: building.color - 0x222222 });
            const roof = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), roofMat);
            roof.position.set(pos.x, h, pos.z);
            roof.castShadow = true;
            window.scene.add(roof);
            if (window.objects) window.objects.push(roof);

            // Sign with building name
            this.createBuildingSign(building);

            // Interior reference
            building.interior = {
                id: 'interior_' + building.name.replace(/\s/g, '_'),
                occupied: false,
                occupants: []
            };
        },

        createBuildingSign: function(building) {
            if (!window.scene) return;

            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');

            // Background
            const bgColor = building.color.toString(16).padStart(6, '0');
            ctx.fillStyle = '#' + bgColor;
            ctx.fillRect(0, 0, 256, 128);

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(building.name, 128, 64);

            const tex = new THREE.CanvasTexture(canvas);
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), new THREE.MeshBasicMaterial({ map: tex }));
            
            const pos = building.position;
            sign.position.set(pos.x, building.size.h + 2, pos.z + building.size.d/2 + 0.5);
            sign.lookAt(pos.x, building.size.h + 2, 0);
            window.scene.add(sign);
        },

        createNPC: function(config) {
            const job = config.job || JobType.NONE;
            const appearance = jobAppearances[job] || jobAppearances[JobType.NONE];

            // Create mesh with job-specific appearance
            const npc = window.createAIUnit(
                config.building.position.x + (Math.random() - 0.5) * 5,
                config.building.position.z + (Math.random() - 0.5) * 5,
                window.FACTIONS ? window.FACTIONS.CITIZEN : null
            );

            if (npc && npc.mesh) {
                // Apply job-specific colors
                const visorChild = npc.mesh.children.find(c => 
                    c.geometry && c.geometry.type === 'BoxGeometry'
                );
                if (visorChild && visorChild.material) {
                    visorChild.material.color.setHex(appearance.colorVisor);
                }

                // Color the torso
                const torsoChild = npc.mesh.children.find(c => 
                    c.geometry && c.geometry.type === 'BoxGeometry' && 
                    c.position.y > 1 && c.position.y < 1.5
                );
                if (torsoChild && torsoChild.material) {
                    torsoChild.material.color.setHex(appearance.colorBody);
                }
            }

            const npcData = {
                ...npc,
                job: job,
                building: config.building,
                homePosition: new THREE.Vector3(
                    config.building.position.x,
                    0,
                    config.building.position.z
                ),
                schedule: this.getScheduleForJob(job),
                currentActivity: 'IDLE',
                activityTimer: 0,
                needs: {
                    hunger: 100,
                    energy: 100,
                    social: 100
                },
                destination: null,
                pathTimer: 0
            };

            if (window.aiUnits) window.aiUnits.push(npcData);
            return npcData;
        },

        getScheduleForJob: function(job) {
            // Different jobs have different schedules
            const baseSchedule = {
                SLEEPING: { start: 22, end: 6 },
                BREAKFAST: { start: 6, end: 7 },
                WORKING: { start: 7, end: 17 },
                LUNCH: { start: 12, end: 13 },
                RESTING: { start: 17, end: 18 },
                DINNER: { start: 18, end: 19 },
                SOCIALIZING: { start: 19, end: 22 }
            };

            // Guards have different schedule
            if (job === JobType.GUARD) {
                return {
                    SLEEPING: { start: 2, end: 6 },
                    PATROLLING: { start: 6, end: 22 },
                    RESTING: { start: 22, end: 2 }
                };
            }

            // Innkeepers stay late
            if (job === JobType.INNKEEPER) {
                return {
                    SLEEPING: { start: 3, end: 8 },
                    WORKING: { start: 8, end: 23 },
                    RESTING: { start: 23, end: 3 }
                };
            }

            return baseSchedule;
        },

        startDayNightCycle: function() {
            setInterval(() => {
                this.currentHour = (this.currentHour + 1) % 24;
                if (this.currentHour === 0) this.currentDay++;

                // Update world state
                this.updateDayNightLighting();
                this.updateNPCBehavior();

                // Update HUD clock
                const clockEl = document.getElementById('world-clock');
                if (clockEl) {
                    const h = Math.floor(this.currentHour).toString().padStart(2, '0');
                    const m = '00';
                    clockEl.innerText = h + ':' + m;
                }
            }, 3000); // 3 seconds = 1 hour in game
        },

        updateDayNightLighting: function() {
            if (!window.sunLight) return;

            const hour = this.currentHour;
            let intensity = 1.0;
            let color = 0xffdca0;

            if (hour >= 6 && hour < 8) {
                // Sunrise
                intensity = 0.3 + (hour - 6) * 0.35;
                color = 0xff9933;
            } else if (hour >= 8 && hour < 18) {
                // Day
                intensity = 3.0;
                color = 0xffdca0;
            } else if (hour >= 18 && hour < 20) {
                // Sunset
                intensity = 3.0 - (hour - 18) * 1.5;
                color = 0xff6633;
            } else if (hour >= 20 || hour < 6) {
                // Night
                intensity = 0.2;
                color = 0x4466ff;
            }

            window.sunLight.intensity = intensity;
            window.sunLight.color.setHex(color);

            // Generate light dynamic effect
            if (window.scene && hour >= 20 || hour < 6) {
                // Add torches/lanterns at night
                if (!this.nightLightsAdded) {
                    this.addNightLights();
                    this.nightLightsAdded = true;
                }
            }
        },

        addNightLights: function() {
            // Add point lights near buildings for night atmosphere
            Object.values(this.buildings).forEach(building => {
                const light = new THREE.PointLight(0xffaa66, 1.5, 20);
                light.position.set(
                    building.position.x,
                    building.size.h * 0.5,
                    building.position.z
                );
                window.scene.add(light);
            });
        },

        updateNPCBehavior: function() {
            this.npcs.forEach(npc => {
                if (!npc || !npc.mesh) return;

                const activity = this.getActivityForTime(npc.schedule, this.currentHour);
                npc.currentActivity = activity;

                // NPCs move toward their workplaces during work hours
                if (activity === 'WORKING' && npc.building && npc.building.position) {
                    npc.destination = new THREE.Vector3(
                        npc.building.position.x + (Math.random() - 0.5) * 3,
                        0,
                        npc.building.position.z + (Math.random() - 0.5) * 3
                    );
                }

                // NPCs return home at night
                if (activity === 'SLEEPING') {
                    npc.destination = npc.homePosition;
                }

                // Update needs based on activity
                if (activity === 'WORKING') npc.needs.hunger -= 0.5;
                if (activity === 'SLEEPING') npc.needs.energy += 2;
                if (activity === 'SOCIALIZING') npc.needs.social += 1;

                // Clamp needs
                npc.needs.hunger = Math.max(0, Math.min(100, npc.needs.hunger));
                npc.needs.energy = Math.max(0, Math.min(100, npc.needs.energy));
                npc.needs.social = Math.max(0, Math.min(100, npc.needs.social));
            });
        },

        getActivityForTime: function(schedule, hour) {
            for (const [activity, timeRange] of Object.entries(schedule)) {
                if (timeRange.start <= timeRange.end) {
                    if (hour >= timeRange.start && hour < timeRange.end) return activity;
                } else {
                    // Wraps around midnight
                    if (hour >= timeRange.start || hour < timeRange.end) return activity;
                }
            }
            return 'IDLE';
        },

        update: function(deltaTime) {
            // Update NPC positions/animations each frame
            this.npcs.forEach(npc => {
                if (!npc || !npc.mesh) return;

                // Move toward destination if set
                if (npc.destination) {
                    const dir = new THREE.Vector3().subVectors(npc.destination, npc.mesh.position);
                    const dist = dir.length();

                    if (dist > 0.5) {
                        dir.normalize();
                        npc.mesh.position.addScaledVector(dir, npc.moveSpeed * deltaTime * 0.5);
                        npc.mesh.rotation.y = Math.atan2(dir.x, dir.z);
                    } else {
                        npc.destination = null;
                    }
                }

                // Walking animation
                npc.walkCycle += deltaTime * (npc.destination ? 5 : 1);
                if (npc.model && npc.model.lArm && npc.model.rArm) {
                    npc.model.lArm.rotation.x = Math.sin(npc.walkCycle) * 0.3;
                    npc.model.rArm.rotation.x = -Math.sin(npc.walkCycle) * 0.3;
                }
            });
        }
    };

    // Export to window
    window.LivingWorldNPCs = LivingWorldNPCs;
    console.log('[Living World] Module loaded');
})();
