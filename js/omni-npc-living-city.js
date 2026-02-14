// OMNI-OPS LIVING NPC CITY
(function() {
	'use strict';

	const LC = {
		citizens: [],
		debug: false,
		updateInterval: null,
		uiReady: false,
		bootstrapped: false,

		init: function() {
			console.log('[Living City] Ready');
			this.waitForUiBoot();
		},

		waitForUiBoot: function() {
			const boot = () => {
				if (this.bootstrapped) return;
				this.bootstrapped = true;
				this.createUI();
				this.setupKeys();
				this.waitForReady();
			};

			if (window.SignalBus && typeof window.SignalBus.on === 'function') {
				window.SignalBus.on('ui:system_ready', () => {
					this.uiReady = true;
					boot();
				});
			}

			const pollUi = () => {
				if (this.uiReady || window.modulesReady) {
					this.uiReady = true;
					boot();
					return;
				}
				setTimeout(pollUi, 200);
			};
			pollUi();
		},

		waitForReady: function() {
			// ✅ PHASE 7: Wait for explicit 'scene:ready' signal from core game before spawning
			// This eliminates the race condition where NPCs spawn before physics/scene initialization
			
			const readyCheckFallback = () => {
				const sceneReady = !!window.scene && !!window.renderer;
				const createReady = typeof window.createAIUnit === 'function';
				const npcDataReady = !window.NPC_DATA || !!window.NPC_DATA.citizen_schedule;

				if (sceneReady && createReady && npcDataReady) {
					console.log('[Living City] Fallback readiness check passed, spawning NPCs');
					this.spawnCitizens();
					this.startUpdateLoop();
					return true;
				}

				if (!npcDataReady) {
					console.warn('[Living City] Waiting for NPC_DATA before spawning citizens');
				}
				return false;
			};

			// First, try to use SignalBus for explicit scene:ready signal
			if (window.SignalBus && typeof window.SignalBus.on === 'function') {
				console.log('[Living City] Listening for scene:ready signal from core game...');
				window.SignalBus.on('scene:ready', () => {
					console.log('[Living City] ✅ Received scene:ready signal, spawning NPCs');
					this.spawnCitizens();
					this.startUpdateLoop();
				});
			} else {
				console.warn('[Living City] SignalBus not available, falling back to polling');
			}

			// Also setup a safety timeout (fallback to polling if signal never arrives)
			let pollAttempts = 0;
			const pollReadiness = () => {
				pollAttempts++;
				if (readyCheckFallback()) {
					return; // Success, stop polling
				}
				if (pollAttempts < 120) { // ~30 seconds at 250ms intervals
					setTimeout(pollReadiness, 250);
				} else {
					console.error('[Living City] Timeout waiting for scene readiness');
				}
			};
			
			// Start polling immediately as backup
			setTimeout(pollReadiness, 500); // Delay slightly to allow signal subscriptions
		},

		createUI: function() {
			const html = `
				<div id="npc-debug-panel">
					<div class="npc-debug-title">🤖 NPC BEHAVIORS [N]</div>
					<div id="npc-debug-content"></div>
				</div>
			`;
			document.body.insertAdjacentHTML('beforeend', html);
		},

		setupKeys: function() {
			document.addEventListener('keydown', (e) => {
				if (e.key === 'n' || e.key === 'N') {
					this.debug = !this.debug;
					const panel = document.getElementById('npc-debug-panel');
					if (panel) panel.classList.toggle('visible');
				}
			});
		},

		spawnCitizens: function() {
			if (window.OMNI_OPS_STORY_MODE === 'CHAPTER1') {
				console.log('[World] Skipping LivingCity.spawnCitizens for Chapter 1 story mode');
				return;
			}
			if (!window.scene || !window.renderer) {
				console.warn('[Living City] Scene not initialized - delaying citizen spawn');
				return;
			}

			console.log('[Living City] Spawning 8 NPCs...');
			for (let i = 0; i < 5; i++) {
				const a = (i / 5) * Math.PI * 2;
				const r = 30;
				this.createCitizen(Math.cos(a) * r, Math.sin(a) * r, window.FACTIONS?.CITIZEN);
			}
			for (let i = 0; i < 2; i++) {
				const a = (i / 2) * Math.PI * 2;
				const r = 40;
				this.createCitizen(Math.cos(a) * r, Math.sin(a) * r, window.FACTIONS?.GUARD);
			}
			this.createCitizen(25, 25, window.FACTIONS?.TRADER);
			console.log('[Living City] All NPCs spawned');
		},

		createCitizen: function(x, z, faction) {
			// ✅ PHASE 8: Hard-sync NPC safety guards
			if (!window.createAIUnit || !window.scene) {
				console.warn('[SYSTEM_RUNNER_ALERT] Living City: createAIUnit unavailable - aborting citizen spawn');
				return null;
			}

			const citizen = window.createAIUnit(x, z, faction);
			if (!citizen) {
				console.warn('[SYSTEM_RUNNER_ALERT] Living City: createAIUnit returned null');
				return null;
			}

			// ✅ PHASE 8: Verify NPC_DATA exists before accessing schedule
			if (!window.NPC_DATA) {
				console.warn('[SYSTEM_RUNNER_ALERT] Living City: NPC_DATA not loaded, using fallback schedule');
			}

			const defaultSchedule = {
				0: 'sleeping',
				6: 'waking',
				7: 'breakfast',
				8: 'working',
				17: 'shopping',
				18: 'dinner',
				22: 'sleeping'
			};

			// Safe access with null coalescing
			const schedule = (window.NPC_DATA && window.NPC_DATA.citizen_schedule) 
				? window.NPC_DATA.citizen_schedule 
				: defaultSchedule;

			if (!schedule || typeof schedule !== 'object') {
				console.error('[SYSTEM_RUNNER_ALERT] Living City: Schedule data corrupted, using fallback');
				citizen.schedule = defaultSchedule;
			} else {
				citizen.schedule = schedule;
			}

			citizen.activity = 'idle';
			citizen.home = { x: x, z: z };
			citizen.workplace = { x: x + Math.random() * 50 - 25, z: z + Math.random() * 50 - 25 };
			citizen.needs = { hunger: 100, energy: 100, social: 100 };

			this.citizens.push(citizen);
			if (window.aiUnits) window.aiUnits.push(citizen);
			return citizen;
		},

		startUpdateLoop: function() {
			if (!this.updateInterval) {
				this.updateInterval = setInterval(() => {
					if (window.isGameActive && !window.gameState?.isPaused) LC.update();
				}, 100);
			}
		},

		stopUpdateLoop: function() {
			if (this.updateInterval) {
				clearInterval(this.updateInterval);
				this.updateInterval = null;
			}
		},

		update: function() {
			const hour = window.gameState?.timeOfDay || 12;
			this.citizens.forEach((citizen) => {
				if (!citizen.mesh) return;

				citizen.needs.hunger = Math.max(0, citizen.needs.hunger - 0.01);
				citizen.needs.energy = Math.max(0, citizen.needs.energy - 0.005);
				citizen.needs.social = Math.max(0, citizen.needs.social - 0.008);

				let activity = 'idle';
				for (let hr in citizen.schedule) {
					if (hour >= parseInt(hr)) activity = citizen.schedule[hr];
				}

				if (citizen.needs.hunger < 30) activity = 'eating';
				else if (citizen.needs.energy < 20) activity = 'sleeping';
				else if (citizen.needs.social < 30) activity = 'socializing';

				citizen.activity = activity;

				if (activity === 'sleeping') {
					citizen.mesh.position.x += (citizen.home.x - citizen.mesh.position.x) * 0.02;
					citizen.mesh.position.z += (citizen.home.z - citizen.mesh.position.z) * 0.02;
				} else if (activity === 'working') {
					citizen.mesh.position.x += (citizen.workplace.x - citizen.mesh.position.x) * 0.01;
					citizen.mesh.position.z += (citizen.workplace.z - citizen.mesh.position.z) * 0.01;
				} else if (activity === 'eating') {
					citizen.needs.hunger = Math.min(100, citizen.needs.hunger + 0.5);
				}
			});

			if (this.debug) this.updateDebug();
		},

		updateDebug: function() {
			const panel = document.getElementById('npc-debug-content');
			if (!panel) return;

			let html = '';
			this.citizens.slice(0, 5).forEach((citizen, index) => {
				html += `
					<div class="npc-debug-item">
						<strong>NPC #${index}</strong> - ${citizen.activity}<br>
						<small>H:${Math.round(citizen.needs.hunger)}% E:${Math.round(citizen.needs.energy)}% S:${Math.round(citizen.needs.social)}%</small>
					</div>
				`;
			});

			panel.innerHTML = html || 'No NPCs';
		}
	};

	window.LC = LC;
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => LC.init());
	} else {
		LC.init();
	}
})();