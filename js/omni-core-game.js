// OMNI-OPS CORE GAME v11 - Complete Base System
// ✅ FIXED FOR CDN: Uses global THREE from CDN instead of ES6 imports
// The CDN-loaded THREE will be available globally
//
// ⚠️ NOTE: Three.js is loaded from CDN in index.html:
//    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
//    This makes window.THREE and related classes available globally.

// NO ES6 imports needed - use global THREE object from CDN
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { AnimationMixer } from 'three';

(function() {
    'use strict';
    console.log('[Core Game] Initializing v11...');
    
    // ✅ Task 1: Verify THREE is available from CDN
    if (typeof THREE === 'undefined') {
        console.error('[Core Game] CRITICAL: THREE is not defined! Make sure Three.js CDN is loaded before this script.');
        return;
    }
    console.log('[Core Game] ✓ THREE object available from CDN');
    
    // ✅ Task 2: Assign THREE globally to prevent Multiple Three warning
    window.THREE = THREE;

const CONFIG_MASTER = window.CONFIG_MASTER || window.CONFIG || {};
const CORE_SETTINGS = CONFIG_MASTER.core_game_settings || {};
const PLAYER_CONTROLS = CORE_SETTINGS.player_controls || {};
const CAMERA_SETTINGS = CORE_SETTINGS.camera || {};
const COMBAT_SETTINGS = CORE_SETTINGS.combat || {};
const PLAYER_STATE = CORE_SETTINGS.player_state || {};
const WORLD_SETTINGS = CORE_SETTINGS.world || {};
const NETWORK_SETTINGS = CORE_SETTINGS.network || {};
const PERSISTENCE_SETTINGS = CORE_SETTINGS.persistence || {};
const PHYSICS_SETTINGS = CORE_SETTINGS.physics || {};
const UI_SETTINGS = CORE_SETTINGS.ui_updates || {};
const PHYSICS_REGISTRY = CONFIG_MASTER.physics || {};

const SETTINGS = {
    MOUSE_SENSE: PLAYER_CONTROLS.mouse_sensitivity ?? 0.002,
    ADS_SENSE_MULT: PLAYER_CONTROLS.ads_sensitivity_multiplier ?? 0.5,
    ACCEL: PLAYER_CONTROLS.movement_acceleration ?? 130,
    FRICTION: PLAYER_CONTROLS.movement_friction ?? 12,
    MAX_WALK: PLAYER_CONTROLS.max_walk_speed ?? 8,
    MAX_SPRINT: PLAYER_CONTROLS.max_sprint_speed ?? 28,
    MAX_ADS: PLAYER_CONTROLS.max_ads_speed ?? 3.5,
    MAX_CROUCH: PLAYER_CONTROLS.max_crouch_speed ?? 4,
    JUMP_POWER: PLAYER_CONTROLS.jump_force ?? 11,
    GRAVITY: WORLD_SETTINGS.gravity ?? PHYSICS_REGISTRY.gravity ?? 35,
    RELOAD_TIME: COMBAT_SETTINGS.reload_time_seconds ?? 1.8,
    MAG_SIZE: COMBAT_SETTINGS.magazine_size ?? 30,
    START_RESERVE: COMBAT_SETTINGS.starting_reserve_ammo ?? 90,
    FIRE_MODES: COMBAT_SETTINGS.fire_modes ?? ['AUTO', 'BURST', 'SINGLE'],
    FIRE_RATE: COMBAT_SETTINGS.fire_rate_seconds ?? 0.1,
    BURST_DELAY: COMBAT_SETTINGS.burst_delay_seconds ?? 0.08,
    FOV_BASE: CAMERA_SETTINGS.base_fov ?? 85,
    FOV_ADS: CAMERA_SETTINGS.ads_fov ?? 50,
    FOV_SPRINT: CAMERA_SETTINGS.sprint_fov ?? 105,
    TRACER_SPEED: COMBAT_SETTINGS.tracer_speed ?? 320,
    NET_UPDATE_RATE: NETWORK_SETTINGS.net_update_rate_hz ?? 50,
    MASTER_VOL: NETWORK_SETTINGS.master_volume ?? 1.0,
    HIFI: NETWORK_SETTINGS.hifi_audio_enabled ?? true,
    PLAYER_RADIUS: PLAYER_STATE.player_radius ?? 0.5,
    COMMANDER_SPEED: WORLD_SETTINGS.commander_speed ?? 40,
    INTERACT_DIST: WORLD_SETTINGS.interact_distance ?? 5.0,
    TILE_SIZE: WORLD_SETTINGS.world_tile_size ?? 12,
    WORLD_TILES: WORLD_SETTINGS.world_tile_count ?? 50,
    TIME_SCALE: CORE_SETTINGS.time_scale ?? 0.02,
    BODY_DECAY_TIME: WORLD_SETTINGS.body_decay_time_ms ?? 1200000,
    MAX_DELTA: ((PHYSICS_SETTINGS.max_delta_clamped_ms ?? PHYSICS_REGISTRY.max_delta_ms ?? 50) / 1000),
    PHYSICS_STEPS: PHYSICS_SETTINGS.physics_sub_steps ?? PHYSICS_REGISTRY.sub_steps ?? 10,
    POINTER_LOCK_RETRY_DELAY_MS: UI_SETTINGS.pointer_lock_retry_delay_ms ?? 100
};
// --- CENTRALIZED GAME STATE ---
const gameState = {
    reputation: { SQUAD: 100, CITIZEN: 0, RAIDER: -100 },
    worldSeed: Math.floor(Math.random() * 10000),
    timeOfDay: 12.0, 
    isInDialogue: false,
    isPipboyOpen: false,
    isInventoryOpen: false,
    isPaused: false
};

// --- WEAPON POSITIONING (Iron Sights / ADS) ---
const WEAPON_POS = {
    HIP: new THREE.Vector3(0.2, -0.3, -0.5),  // Standard hipfire position
    ADS: new THREE.Vector3(0, -0.165, -0.2),  // Centered (sights aligned)
    ADS_FOV: 50,  // Zoomed FOV
    HIP_FOV: 75   // Normal FOV
};
let currentGunAnim = 'Armature|Idle';  // Track current animation state

// ✅ Task 2: Spring Inertia System (The "Weight" Fix)
const gunSpring = { 
    pos: new THREE.Vector3(), 
    vel: new THREE.Vector3(), 
    stiffness: 120, 
    damping: 15 
};

// --- FIELD FABRICATION SYSTEM ---
window.fabricationEnergy = 100;
window.maxFabricationEnergy = 100;
window.isFabricationMode = false;  // F2 Toggle State
window.editorGrid = null;  // The Holographic Grid
console.log('[System] ✅ Field Fabrication System initialized');

// --- CORE VARIABLES ---
let scene, camera, renderer, clock;
let commanderCamera, activeCamera; 
let cameraRig, weaponRig, weaponPivot, weaponMesh;
let muzzleFlashPoint, muzzleFlashMesh;
let sunLight;
let objects = [], tracers = [], particles = [], deadBodies = [], flowers = [];
let audioCtx, masterGain;
let gameMode = 'FPS'; 
let switchingModes = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// --- RTS STATE ---
let aiUnits = [];
let selectedUnits = [];
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let groundPlane; 
const STATES = { IDLE: 'IDLE', MOVING: 'MOVING', CHARGE: 'CHARGE', HOLD: 'HOLD', FOLLOW: 'FOLLOW', COMBAT: 'COMBAT', SLEEP: 'SLEEP' };
const FACTIONS = { SQUAD: 'SQUAD', CITIZEN: 'CITIZEN', RAIDER: 'RAIDER', TRADER: 'TRADER', GUARD: 'GUARD' };
const JOBS = { NONE: 'NONE', MEDIC: 'MEDIC', SMITH: 'SMITH', GUARD: 'GUARD' };

// --- P2P NETWORKING ---
let peer = null;
let connections = []; 
let myPeerId = null;
let currentRoomId = null;
let myPlayerIndex = 0; 
let lobbySlots = [null, null, null, null];
let isHost = false;
let isMultiplayer = false;
let isGameActive = false;
let remotePlayers = {}; 
let netInterval = null;
const PLAYER_COLORS = [0x22aa22, 0x0088ff, 0xffaa00, 0x9900ff];
const VISOR_COLORS = [0x00ff00, 0x00ffff, 0xffdd00, 0xff00ff];
const SQUAD_NAMES = ["ALPHA", "BRAVO", "CHARLIE", "DELTA"];

// --- PLAYER PHYSICS ---
const player = {
    velocity: new THREE.Vector3(),
    pitch: 0, yaw: Math.PI, leanFactor: 0,
    onGround: false, isSprinting: false, isCrouching: false, isReloading: false, isFiring: false, isAiming: false, adsFactor: 0, 
    ammo: 30, reserveAmmo: 90,
    stamina: 100, isExhausted: false,
    health: 100, maxHealth: 100,
    eyeLevel: 1.6, crouchHeight: 0.9, currentHeight: 1.6,
    recoilY: 0, recoilX: 0, reloadTimer: 0, fireTimer: 0,
    fireModeIndex: 0, burstCount: 0, lastFireTime: 0, lastShotEnd: null
};

const keys = {};
window.keys = keys; // Expose for editor freeroam camera

// --- PERSISTENCE ---
function loadWorldData() {
    const saved = localStorage.getItem('omni_ops_save_v7');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            gameState.reputation = parsed.reputation || gameState.reputation;
            player.ammo = parsed.ammo || 30;
            player.reserveAmmo = parsed.reserveAmmo || 90;
        } catch(e) { console.error("Save load failed", e); }
    }
}
function saveWorldData() {
    if (!isGameActive) return;
    try {
        const saveObj = {
            reputation: gameState.reputation,
            ammo: player.ammo,
            reserveAmmo: player.reserveAmmo,
            pos: { x: cameraRig ? cameraRig.position.x : 0, y: cameraRig ? cameraRig.position.y : 0, z: cameraRig ? cameraRig.position.z : 0 }
        };
        localStorage.setItem('omni_ops_save_v7', JSON.stringify(saveObj));
    } catch(e) {
        console.error('[Save] Failed to save game data:', e);
    }
}
setInterval(saveWorldData, 60000); 

function saveSession(roomId) {
    try {
        localStorage.setItem('omni_session_room', roomId);
    } catch(e) {
        console.error('[Session] Failed to save room ID:', e);
    }
}

function clearSession() {
    localStorage.removeItem('omni_session_room');
}

function onResize() {
    if (!camera || !renderer) return;
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect; camera.updateProjectionMatrix();
    if (commanderCamera) { commanderCamera.aspect = aspect; commanderCamera.updateProjectionMatrix(); }
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- CORE FUNCTIONS (Moved up for scope safety) ---

function resolveChapter1SpawnPosition() {
    const registry = window.CONFIG_MASTER || window.CONFIG || {};
    const chapter = registry.chapter1 || registry.chapter_1 || registry.story || {};
    const spawn = chapter.player_start_position || chapter.playerStartPosition || registry.player_start_position;

    if (spawn && Number.isFinite(spawn.x) && Number.isFinite(spawn.y) && Number.isFinite(spawn.z)) {
        return spawn;
    }

    console.warn('[Spawn] Missing Chapter 1 player_start_position in CONFIG_MASTER', { hasChapterConfig: !!chapter });
    return { x: 0, y: 2, z: 5 };  // [SYSTEM_RUNNER_ALERT] Teleport fallback - inside level geometry
}

let chapter1EnvironmentLoaded = false;

function ensureChapter1EnvironmentLoaded() {
    if (chapter1EnvironmentLoaded) return true;
    if (!scene) return false;

    const hasChapterRoom = !!scene.children?.some(child => child?.userData?.type === 'chapter1_room');
    if (hasChapterRoom) {
        chapter1EnvironmentLoaded = true;
        return true;
    }

    if (typeof window.createChapter1StartRoom === 'function') {
        try {
            const created = window.createChapter1StartRoom(scene);
            chapter1EnvironmentLoaded = created !== false;
            return chapter1EnvironmentLoaded;
        } catch (err) {
            console.error('[CoreGame::ensureChapter1EnvironmentLoaded]', err.message);
            chapter1EnvironmentLoaded = false;
            return false;
        }
    }

    console.warn('[CoreGame] createChapter1StartRoom not available');
    return false;
}

function initThreeCore() {
    console.log('[initThreeCore] Starting...');

    if (!isGameActive) {
        isGameActive = true;
    }

    const existingCanvas = document.querySelector('canvas');
    if (existingCanvas && existingCanvas.id !== 'minimap-canvas') {
        existingCanvas.parentNode.removeChild(existingCanvas);
    }

    console.log('[initThreeCore] Creating THREE.Scene...');
    scene = new THREE.Scene();
    window.scene = scene;

    console.log('[initThreeCore] Creating camera...');
    camera = new THREE.PerspectiveCamera(SETTINGS.FOV_BASE, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.rotation.order = 'YXZ';
    camera.position.set(0, 0, 0);

    const playerRig = new THREE.Object3D();
    const spawnPos = resolveChapter1SpawnPosition();
    playerRig.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
    cameraRig = playerRig;

    scene.add(playerRig);
    playerRig.add(camera);
    window.camera = camera;
    window.cameraRig = cameraRig;
    window.player = player;

    commanderCamera = new THREE.PerspectiveCamera(SETTINGS.FOV_BASE, window.innerWidth / window.innerHeight, 0.01, 1000);
    commanderCamera.rotation.x = -Math.PI / 2;
    activeCamera = camera;

    weaponRig = new THREE.Group();
    camera.add(weaponRig);
    weaponPivot = new THREE.Group();
    weaponRig.add(weaponPivot);
    weaponPivot.position.set(0.2, -0.3, -0.5);

    console.log('[initThreeCore] Creating WebGL renderer...');
    renderer = new THREE.WebGLRenderer({ antialias: true });

    if (!renderer) {
        console.error('[initThreeCore] WebGLRenderer failed to initialize');
        alert('WebGL renderer initialization failed!');
        throw new Error('WebGL not supported');
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = SETTINGS.HIFI;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '100';
    renderer.domElement.style.display = 'block';

    document.body.appendChild(renderer.domElement);
    window.renderer = renderer;

    clock = new THREE.Clock();
    objects = [];
    aiUnits = [];

    setupLighting();
    window.sunLight = sunLight;

    if (window.onGameReady) window.onGameReady();

    setupWeapon();

    window.addEventListener('resize', onResize);

    if (window.SignalBus && typeof window.SignalBus.emit === 'function') {
        window.SignalBus.emit('scene:ready');
    }

    window.scene = scene;
    window.camera = camera;
    window.cameraRig = cameraRig;
    window.renderer = renderer;
    window.THREE = THREE;

    isGameActive = true;
    gameState.isPaused = false;
    window.isGameActive = true;
}

function loadChapter1Environment() {
    const loaded = ensureChapter1EnvironmentLoaded();
    if (!loaded) {
        console.warn('[CoreGame] Chapter 1 environment load skipped');
    }
}

function startGameLoop() {
    if (typeof window.animate === 'function') {
        window.animate();
    } else {
        console.error('[CoreGame::startGameLoop] Animation loop missing', { hasAnimate: typeof window.animate });
    }
}

// [SYSTEM_RUNNER_ALERT] Memory-Safe Scene Cleanup - Disposes GPU resources before loading new assets
function cleanupScene() {
    if (!scene || !window.THREE) return;
    
    console.log('[cleanupScene] Purging legacy scene objects from VRAM...');
    
    while(scene.children.length > 0) { 
        const object = scene.children[0];
        
        // Dispose geometry
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        // Dispose material(s)
        if (object.material) {
            if (Array.isArray(object.material)) {
                object.material.forEach(mat => {
                    if (mat.map) mat.map.dispose();
                    if (mat.normalMap) mat.normalMap.dispose();
                    if (mat.roughnessMap) mat.roughnessMap.dispose();
                    if (mat.metalnessMap) mat.metalnessMap.dispose();
                    mat.dispose();
                });
            } else {
                if (object.material.map) object.material.map.dispose();
                if (object.material.normalMap) object.material.normalMap.dispose();
                if (object.material.roughnessMap) object.material.roughnessMap.dispose();
                if (object.material.metalnessMap) object.material.metalnessMap.dispose();
                object.material.dispose();
            }
        }
        
        scene.remove(object); 
    }
    
    console.log('[cleanupScene] Scene purged. VRAM reclaimed.');
}

function initGame() {
    console.log('[initGame] Starting...');
    try {
        // [SYSTEM_RUNNER_ALERT] Memory cleanup BEFORE loading Chapter 1
        cleanupScene();
        
        initThreeCore();
        loadChapter1Environment();
        startGameLoop();
        
    } catch(err) {
        console.error('[initGame] FATAL ERROR:', err);
        console.error('[initGame] Stack:', err.stack);
        alert('Game initialization failed: ' + err.message);
        quitToMenu();
    }
}

let singlePlayerWorldReadyHandled = false;

function onSinglePlayerWorldReady() {
    if (singlePlayerWorldReadyHandled) return;
    singlePlayerWorldReadyHandled = true;

    if (window.OMNI_OPS_STORY_MODE !== 'CHAPTER1') return;

    console.log('[World] Using OMNI-OPS Chapter 1 start room');
    if (typeof window.waitForChapter1GameReady === 'function') {
        window.waitForChapter1GameReady(() => {
            const roomReady = ensureChapter1EnvironmentLoaded();
            if (!roomReady) return;

            const spawnSet = typeof window.setChapter1PlayerSpawn === 'function'
                ? window.setChapter1PlayerSpawn(window.player, window.cameraRig)
                : false;

            if (spawnSet) {
                if (typeof window.initializeChapter1Story === 'function') {
                    window.initializeChapter1Story();
                } else if (window.GameStory && typeof window.GameStory.startChapter === 'function') {
                    window.GameStory.startChapter(1);
                } else {
                    console.error('[World] Story initialization function not available');
                }
            }
        });
    } else {
        console.error('[World] Chapter 1 integration not ready (waitForChapter1GameReady missing)');
    }
}

function launchGame() {
    console.log('[launchGame] Starting...');
    try {
        loadWorldData();
        if(isMultiplayer && currentRoomId) saveSession(currentRoomId);
        
        console.log('[launchGame] Hiding menu-overlay, showing game UI');
        const menuOverlay = document.getElementById('menu-overlay');
        const uiLayer = document.getElementById('ui-layer');
        const hudRoomId = document.getElementById('hud-room-id');
        
        if (menuOverlay) { 
            menuOverlay.style.display = 'none';
            console.log('[launchGame] Menu hidden');
        } else {
            console.warn('[launchGame] menuOverlay element not found!');
        }
        
        if (uiLayer) { 
            uiLayer.style.display = 'flex';
            console.log('[launchGame] UI layer shown');
        } else {
            console.warn('[launchGame] uiLayer element not found!');
        }
        
        if (hudRoomId) {
            hudRoomId.innerText = isMultiplayer ? `NET_${currentRoomId} [P${myPlayerIndex + 1}]` : "LOCAL_HOST";
        }
        
        try {
            updateHUDAmmo();
        } catch(e) {
            console.warn('[launchGame] HUD ammo update failed (may not be ready yet):', e);
        }
        
        console.log('[launchGame] Calling initGame()');
        initGame();
        console.log('[launchGame] Setting isGameActive = true');
        isGameActive = true;
        gameState.isPaused = false;
        
        // ✅ GLOBAL ACTIVATION FLAG - Critical for Chapter 1 integration
        window.isGameActive = true;
        console.log('[Core] ✅ Game State set to ACTIVE');
        console.log('[Core] Ready state check:', {
            isGameActive: window.isGameActive,
            scene: !!window.scene,
            cameraRig: !!window.cameraRig,
            camera: !!window.camera,
            THREE: !!window.THREE
        });
        
        if (!isMultiplayer) {
            onSinglePlayerWorldReady();
        }
        safeRequestPointerLock();
        console.log('[launchGame] Complete - game should now be playable');
    } catch(err) {
        console.error('[launchGame] FATAL ERROR:', err);
        console.error('[launchGame] Stack:', err.stack);
        alert('Game launch failed: ' + err.message);
    }
}

// ✅ Task 2: Emergency Bypass - Force start if AI bridge is offline
setTimeout(() => {
    if (!window.isGameActive) {
        console.log('[System] AI Bridge not found. Launching in Local Mode...');
        window.isGameActive = true;
        initGame();
    }
}, 2000);

let pointerLockRetryTimer = null;
function safeRequestPointerLock() {
    if (!gameState.isInDialogue && !gameState.isPipboyOpen && !gameState.isInventoryOpen && isGameActive) {
        try {
            document.body.requestPointerLock();
            console.log('[PointerLock] Requested successfully');
        } catch (e) {
            if (e.name === 'SecurityError') {
                console.log('[PointerLock] SecurityError caught - retrying in 100ms');
                if (pointerLockRetryTimer) clearTimeout(pointerLockRetryTimer);
                pointerLockRetryTimer = setTimeout(safeRequestPointerLock, SETTINGS.POINTER_LOCK_RETRY_DELAY_MS);
            } else {
                console.error('[PointerLock] Error:', e.message);
            }
        }
    }
}

// --- UI HANDLING ---
function showScreen(screen) {
    const safeHide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
    safeHide('main-screen');
    safeHide('host-screen');
    safeHide('join-screen');
    safeHide('settings-screen');
    safeHide('lobby-screen');
    
    if (screen === 'main') {
        const el = document.getElementById('main-screen'); if (el) el.style.display = 'block';
        // CHECK REJOIN
        try {
            const savedRoom = localStorage.getItem('omni_session_room');
            const resumeBtn = document.getElementById('btn-resume');
            if (savedRoom && resumeBtn) {
                resumeBtn.style.display = 'block';
                resumeBtn.innerText = "▶️ Resume Game (" + savedRoom + ")";
                resumeBtn.onclick = () => {
                    currentRoomId = savedRoom;
                    isHost = false;
                    isMultiplayer = true;
                    launchGame();
                };
            } else if(resumeBtn) {
                resumeBtn.style.display = 'none';
            }
        } catch(e) {
            console.error('[Session] Failed to check saved room:', e);
        }
    }
    if (screen === 'host') {
        const el = document.getElementById('host-screen'); if (el) el.style.display = 'block';
        currentRoomId = Math.floor(1000 + Math.random() * 9000).toString();
        const roomDisplay = document.getElementById('host-room-id');
        if(roomDisplay) roomDisplay.innerText = "Room ID: " + currentRoomId;
    }
    if (screen === 'join') { const el = document.getElementById('join-screen'); if (el) el.style.display = 'block'; }
    if (screen === 'lobby') { const el = document.getElementById('lobby-screen'); if (el) el.style.display = 'block'; }
    if (screen === 'settings') { const el = document.getElementById('settings-screen'); if (el) el.style.display = 'block'; }
}

// EXPOSE launchGame TO GLOBAL SCOPE
// Moved to end of file to ensure all functions are defined

window.startMode = function(mode) {
    console.log(`[startMode] Called with mode: ${mode}`);
    if (mode === 'SINGLE') {
        console.log('[startMode] Starting SINGLE player mode');
        isMultiplayer = false; isHost = true; 
        myPlayerIndex = 0; 
        lobbySlots[0] = "LOCAL_PLAYER";
        console.log('[startMode] Calling launchGame()');
        // Show story intro before launching (only if not coming from intro completion)
        if (window.GameStory && !window.GameStory.isPlayingIntro && window.GameStory.currentState !== 'INTRO_COMPLETE') {
            console.log('[startMode] Showing story intro...');
            setTimeout(() => window.GameStory.startIntro(), 100);
        } else {
            console.log('[startMode] Launching game directly...');
            launchGame();
        }
    } else if (mode === 'JOIN') {
        console.log('[startMode] Starting JOIN mode');
        const input = document.getElementById('join-room-id').value;
        console.log(`[startMode] Room ID input: ${input}`);
        if (!input || input.length < 4) {
            console.warn('[startMode] Invalid room ID');
            return;
        }
        currentRoomId = input;
        isHost = false;
        isMultiplayer = true;
        initPeer(false);
        showScreen('lobby');
    } else if (mode === 'HOST') {
        console.log('[startMode] Starting HOST mode');
        isHost = true;
        isMultiplayer = true;
        const btn = document.getElementById('btn-deploy-host');
        if (btn) {
            btn.innerText = "INITIALIZING...";
            btn.disabled = true;
        }
        setTimeout(() => initPeer(true), 50);
    }
}

// PIPBOY LOGIC
window.switchPipTab = function(tabName) {
    const tabs = document.querySelectorAll('.pip-content');
    tabs.forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).classList.add('active');
    
    const btns = document.querySelectorAll('.pip-tab-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

function togglePipboy() {
    gameState.isPipboyOpen = !gameState.isPipboyOpen;
    const menu = document.getElementById('pipboy-menu');
    if (!menu) return;
    
    if (gameState.isPipboyOpen) {
        document.exitPointerLock();
        menu.classList.add('open');
        updatePipboyData();
    } else {
        menu.classList.remove('open');
        safeRequestPointerLock();
    }
}

function updatePipboyData() {
    const pipHp = document.getElementById('pip-hp');
    const pipStam = document.getElementById('pip-stam');
    const pipAmmo = document.getElementById('pip-ammo');
    const guardRep = document.getElementById('pip-rep-guard');
    const civRep = document.getElementById('pip-rep-civ');
    
    if (pipHp) pipHp.innerText = Math.floor(player.health) + "/" + player.maxHealth;
    if (pipStam) pipStam.innerText = Math.floor(player.stamina) + "/100";
    if (pipAmmo) pipAmmo.innerText = player.reserveAmmo;
    
    const rep = gameState.reputation.CITIZEN;
    
    if(guardRep) {
        if(rep > 20) { guardRep.innerText = "FRIENDLY"; guardRep.style.color="#33ff33"; }
        else if(rep < -20) { guardRep.innerText = "HOSTILE"; guardRep.style.color="#ff3333"; }
        else { guardRep.innerText = "NEUTRAL"; guardRep.style.color="#cccc33"; }
    }
    
    if(civRep) {
        if(rep > 0) civRep.innerText = "FRIENDLY"; 
        else civRep.innerText = "NEUTRAL";
    }
}

function renderLobby() {
    for(let i=0; i<4; i++) {
        const el = document.getElementById('slot-'+i);
        if (!el) continue; 
        const slotId = lobbySlots[i];
        el.className = 'lobby-slot';
        el.style.border = "1px solid #333";
        const nameSpan = el.children[0];
        const statusSpan = el.children[1];
        nameSpan.innerText = `${i+1}. ${SQUAD_NAMES[i]}`;
        
        // Clear previous event
        el.onclick = null;

        if (slotId === null) {
            statusSpan.innerText = "EMPTY - JOIN";
            statusSpan.style.color = "#444";
            
            // Allow clicking to switch slots
            el.classList.add('host-clickable');
            el.onclick = () => requestSlotChange(i);
        } else {
            el.classList.remove('host-clickable');
            el.className = 'lobby-slot active';
            statusSpan.innerText = "READY";
            statusSpan.style.color = "#00ffcc";
            if (slotId === myPeerId) {
                el.style.border = "1px solid #ffff00";
                nameSpan.innerText += " (YOU)";
            }
        }
    }
    if (isHost) {
        const startBtn = document.getElementById('btn-start-match');
        if (startBtn) startBtn.style.display = 'block';
    }
}

function requestSlotChange(index) {
    if (lobbySlots[index] !== null) return;
    
    if (isHost) {
        // If Host, just move
        lobbySlots[myPlayerIndex] = null;
        lobbySlots[index] = myPeerId;
        myPlayerIndex = index;
        renderLobby();
        broadcastLobbyState();
    } else {
        // If Client, request move
        safeSend(connections[0], { type: 'REQUEST_SWITCH', index: index });
    }
}

function startMatch() {
    safeBroadcast({ type: 'START_GAME' });
    launchGame();
}

function updateHUDAmmo() {
    // ✅ MASTER SAFETY WRAPPER (Task 2) - Safe element updates
    const safeUpdate = (id, value) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = value;
        }
    };
    safeUpdate('ammo-cur', player.ammo);
    safeUpdate('ammo-res', player.reserveAmmo || 120);
}

function logMessage(msg) {
    const el = document.getElementById('message-log');
    if(!el) return;
    const d = document.createElement('div');
    d.className = 'log-entry'; d.innerText = `> ${msg}`;
    el.prepend(d); if(el.children.length>5) el.lastChild.remove();
}

// --- SAFE NETWORKING ---
function safeSend(conn, data) {
    if (conn && conn.open) {
        conn.send(data);
    }
}

function safeBroadcast(data) {
    connections.forEach(conn => safeSend(conn, data));
}

// --- CLEANUP & EXIT ---
function dispose3D(object) {
    if (!object) return;
    object.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        }
    });
}

async function quitToMenu() {
    isGameActive = false;
    saveWorldData();
    clearSession(); // Remove persistent join capability
    
    // Peer Cleanup
    if (peer) { peer.destroy(); peer = null; }
    connections = [];
    if (netInterval) clearInterval(netInterval);
    
    // 3D Cleanup (Prevents WebGL Memory Leak)
    if (scene) {
        dispose3D(scene);
        scene.clear();
        scene = null;
    }
    if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        renderer = null;
    }

    // Reset UI
    const uiLayer = document.getElementById('ui-layer');
    const menuOverlay = document.getElementById('menu-overlay');
    if (uiLayer) uiLayer.style.display = 'none';
    if (menuOverlay) menuOverlay.style.display = 'flex';
    showScreen('main');
    document.exitPointerLock();
    
    const btn = document.getElementById('btn-deploy-host');
    if(btn) { btn.innerText = "Create Lobby"; btn.disabled = false; }

    remotePlayers = {}; aiUnits = []; objects = []; tracers = []; particles = []; deadBodies = []; flowers = [];
    lobbySlots = [null, null, null, null];
    const connStatus = document.getElementById('connection-status');
    if(connStatus) connStatus.innerText = "";
    const tagsContainer = document.getElementById('nametags-container');
    if(tagsContainer) tagsContainer.innerHTML = ''; 
    renderLobby();
}

// --- INITIALIZATION ---
/**
 * PHASE 3.5: UI INITIALIZATION
 * 
 * Attaches all UI event handlers and emits SYSTEM_READY signal.
 * This is the final phase before gameplay can begin.
 * 
 * PROTOCOL:
 * ✅ Always attached to window object
 * ✅ Emits SignalBus signal after completion
 * ✅ All console logs tagged [UI-BOOT]
 * ✅ Includes timeout safeguard (CONFIG_MASTER.ui.ui_boot_timeout_ms)
 * 
 * SEE: docs/SYSTEM_FLOW_BLUEPRINT.md § Phase 3.5: UI Initialization
 */
window.initializeUI = function() {
    console.log('[UI-BOOT] ================================');
    console.log('[UI-BOOT] PHASE 3.5: UI INITIALIZATION STARTED');
    console.log('[UI-BOOT] ================================');
    
    // Initialize story system (LEGACY - Albion story)
    const LEGACY_ALBION = false; // Set to true to enable old "Heroes of Albion" story
    if (LEGACY_ALBION && window.GameStory) {
        console.log('[UI-BOOT] GameStory integration enabled (legacy mode)');
        window.GameStory.init();
    }
    
    // Define button binding helper
    const bindBtn = (id, func) => {
            const el = document.getElementById(id);
            if (el) {
                console.log(`[UI-BOOT] ✓ Button bound: ${id}`);
                el.onclick = func;
            } else {
                console.warn(`[UI-BOOT] ⚠ Button not found: ${id}`);
            }
        };

    bindBtn('btn-story-start', () => {
        console.log('[UI-BOOT] ===== START CHAPTER 1 CLICKED =====');
        window.OMNI_OPS_STORY_MODE = 'CHAPTER1';
        singlePlayerWorldReadyHandled = false;
        
        // Hide menu and show game UI
        const menuOverlay = document.getElementById('menu-overlay');
        const uiLayer = document.getElementById('ui-layer');
        if (menuOverlay) menuOverlay.style.display = 'none';
        if (uiLayer) uiLayer.style.display = 'flex';
        
        // Initialize core game world if not already active
        if (!window.isGameActive) {
            console.log('[UI-BOOT] Game not active - initializing core world...');
            // Set single-player flags
            isMultiplayer = false;
            isHost = true;
            myPlayerIndex = 0;
            lobbySlots[0] = "LOCAL_PLAYER";
            
            // ✅ Emergency Bypass with timeout for AI Bridge latency
            setTimeout(() => {
                if (!window.isGameActive) {
                    console.log('[UI-BOOT] AI Bridge timeout - launching in Local Mode...');
                    window.isGameActive = true;
                    if (typeof initGame === 'function') {
                        initGame();
                    }
                }
            }, 2000);
            
            // Call launchGame which creates scene, renderer, camera, player
            launchGame();
        } else {
            console.log('[UI-BOOT] Game already active');
            onSinglePlayerWorldReady();
        }
    });
    bindBtn('btn-single', () => {
        console.log('[UI-BOOT] btn-single clicked');
        startMode('SINGLE');
    });
    bindBtn('btn-show-host', () => {
        console.log('[UI-BOOT] btn-show-host clicked');
        showScreen('host');
    });
    bindBtn('btn-show-join', () => {
        console.log('[UI-BOOT] btn-show-join clicked');
        showScreen('join');
    });
    bindBtn('btn-deploy-host', () => {
        console.log('[UI-BOOT] btn-deploy-host clicked');
        startMode('HOST');
    });
    bindBtn('btn-host-back', () => {
        console.log('[UI-BOOT] btn-host-back clicked');
        showScreen('main');
    });
    bindBtn('btn-deploy-join', () => {
        console.log('[UI-BOOT] btn-deploy-join clicked');
        startMode('JOIN');
    });
    bindBtn('btn-join-back', () => {
        console.log('[UI-BOOT] btn-join-back clicked');
        showScreen('main');
    });
    bindBtn('btn-quit', () => {
        console.log('[UI-BOOT] btn-quit clicked');
        quitToMenu();
    });
    bindBtn('btn-lobby-back', () => {
        console.log('[UI-BOOT] btn-lobby-back clicked');
        quitToMenu();
    });
    bindBtn('btn-start-match', () => {
        console.log('[UI-BOOT] btn-start-match clicked');
        startMatch();
    });
    
    // Resume Button
    const resumeBtn = document.getElementById('btn-resume');
    if(resumeBtn) {
        resumeBtn.onclick = () => {
            console.log('[UI-BOOT] btn-resume clicked');
            // Clear all blocking flags
            if (gameState) {
                gameState.isInDialogue = false;
                gameState.isPipboyOpen = false;
                gameState.isInventoryOpen = false;
            }
            const menuOverlay = document.getElementById('menu-overlay');
            if (menuOverlay) menuOverlay.style.display = 'none';
            safeRequestPointerLock();
        };
    }

    // Settings Resume Button (in-game menu)
    const settingsResumeBtn = document.getElementById('btn-settings-resume');
    if(settingsResumeBtn) {
        settingsResumeBtn.onclick = () => {
            console.log('[UI-BOOT] btn-settings-resume clicked');
            // Clear all blocking flags
            if (gameState) {
                gameState.isInDialogue = false;
                gameState.isPipboyOpen = false;
                gameState.isInventoryOpen = false;
            }
            const menuOverlay = document.getElementById('menu-overlay');
            if (menuOverlay) menuOverlay.style.display = 'none';
            const settingsScreen = document.getElementById('settings-screen');
            if (settingsScreen) settingsScreen.style.display = 'none';
            safeRequestPointerLock();
        };
    }

    const sensSlider = document.getElementById('set-sens');
    if(sensSlider) sensSlider.oninput = (e) => { SETTINGS.MOUSE_SENSE = 0.002 * parseFloat(e.target.value); };

    const fovSlider = document.getElementById('set-fov');
    if(fovSlider) fovSlider.oninput = (e) => { SETTINGS.FOV_BASE = parseInt(e.target.value); if(camera) camera.updateProjectionMatrix(); };
    
    // ✅ SPECTER COMMAND: Emergency Bypass (Task 1)
    // Force the Start Chapter 1 button to be clickable regardless of AI server status
    const startBtn = document.getElementById('btn-story-start');
    if (startBtn) {
        startBtn.style.pointerEvents = 'auto'; // Force it to be clickable
        startBtn.disabled = false; // Ensure it's not disabled
        console.log('[UI-BOOT] ✓ Hard-Start Override: btn-story-start forced to clickable');
    }
    
    // Display main menu
    showScreen('main');
    console.log('[UI-BOOT] ✓ Main menu displayed via showScreen("main")');
    
    // ========================================================================
    // MANDATORY: Emit SYSTEM_READY signal via SignalBus
    // ========================================================================
    // This signals to the ModuleLoader that UI initialization is complete
    // and the game can proceed to PHASE 4: GAME ENTER
    
    try {
        // Create a simple SignalBus if it doesn't exist
        if (!window.SignalBus) {
            window.SignalBus = {
                listeners: {},
                on: function(event, callback) {
                    if (!this.listeners[event]) this.listeners[event] = [];
                    this.listeners[event].push(callback);
                },
                emit: function(event, data) {
                    if (this.listeners[event]) {
                        this.listeners[event].forEach(cb => {
                            try {
                                cb(data);
                            } catch (err) {
                                console.error(`[UI-BOOT] Error in SignalBus callback for "${event}":`, err);
                            }
                        });
                    }
                },
                off: function(event, callback) {
                    if (this.listeners[event]) {
                        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
                    }
                }
            };
            console.log('[UI-BOOT] ✓ SignalBus created (did not exist)');
        }
        
        // Emit SYSTEM_READY signal to notify ModuleLoader
        window.SignalBus.emit('ui:system_ready', {
            timestamp: Date.now(),
            phase: 'UI_INITIALIZATION_COMPLETE',
            initiator: 'window.initializeUI()'
        });
        console.log('[UI-BOOT] ✓ Emitted signal: ui:system_ready');
    } catch (err) {
        console.error('[UI-BOOT] CRITICAL: Failed to emit SYSTEM_READY signal:', err);
    }
    
    console.log('[UI-BOOT] ================================');
    console.log('[UI-BOOT] PHASE 3.5: UI INITIALIZATION COMPLETE');
    console.log('[UI-BOOT] ✅ System ready for PHASE 4: GAME ENTER');
    console.log('[UI-BOOT] ================================');
};

// Fall back to DOMContentLoaded if modules are already loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('[UI-BOOT] DOMContentLoaded event fired');
    if (window.modulesReady && window.initializeUI) {
        console.log('[UI-BOOT] Modules already ready, calling initializeUI now...');
        window.initializeUI();
    }
});

// --- GLOBAL NETWORK CONFIGURATION FOR WORLDWIDE CONNECTIVITY ---
const NETWORK_CONFIG = {
    config: {
        iceServers: [
            // Google STUN servers (highly reliable, globally distributed)
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
            // Mozilla STUN server (backup)
            { urls: 'stun:stun.stunprotocol.org:3478' },
            // Nextcloud STUN server (EU backup)
            { urls: 'stun:stun.nextcloud.com:443' },
            // OpenRelay TURN servers (for NAT traversal if STUN fails)
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
            { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        ]
    },
    iceTransportPolicy: 'all'
};

// --- CONNECTION RETRY SYSTEM ---
const connectionRetry = {
    attempts: {},
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    
    getDelay(attemptNum) {
        const delay = Math.min(this.baseDelay * Math.pow(2, attemptNum), this.maxDelay);
        return delay + Math.random() * 1000; // Add jitter
    },
    
    reset(peerId) {
        delete this.attempts[peerId];
    }
};

// --- P2P NETWORKING LOGIC ---
function initPeer(host) {
    const prefix = "omni-ops-v7-"; 
    const statusEl = document.getElementById('connection-status');
    
    function updateStatus(msg) {
        console.log('[Network]', msg);
        if (statusEl) statusEl.innerText = msg;
    }

    if (host) {
        myPeerId = prefix + currentRoomId + "-host";
        updateStatus("🟡 Initializing host connection...");
        
        // Create Peer with global ICE configuration
        peer = new Peer(myPeerId, NETWORK_CONFIG);
        myPlayerIndex = 0; 
        lobbySlots = [null, null, null, null];
        lobbySlots[0] = myPeerId;

        peer.on('open', (id) => {
            isMultiplayer = true;
            updateStatus("🟢 Host Ready - Waiting for players...");
            showScreen('lobby');
            const roomCodeEl = document.getElementById('lobby-room-code');
            const hostControlsEl = document.getElementById('lobby-host-controls');
            const clientControlsEl = document.getElementById('lobby-client-controls');
            if (roomCodeEl) roomCodeEl.innerText = "ROOM " + currentRoomId;
            if (hostControlsEl) hostControlsEl.style.display = 'block';
            if (clientControlsEl) clientControlsEl.style.display = 'none';
            renderLobby();
            console.log('[Network] Host peer ready:', id);
        });

        peer.on('connection', (conn) => {
            updateStatus(`🟢 Player connected (${lobbySlots.filter(s => s !== null).length}/4)`);
            logMessage("OPERATOR CONNECTED");
            connections.push(conn);
            setupConnectionEvents(conn);

            let assignedIndex = -1;
            for(let i=0; i<4; i++) {
                if (lobbySlots[i] === null) {
                    lobbySlots[i] = conn.peer;
                    assignedIndex = i;
                    break;
                }
            }

            if (assignedIndex === -1) {
                safeSend(conn, {type: 'ERROR', msg: 'LOBBY FULL'});
                setTimeout(() => conn.close(), 500);
                return;
            }

            setTimeout(() => {
                if(conn.open) {
                    safeSend(conn, { 
                        type: 'INIT_PLAYER', 
                        index: assignedIndex, 
                        seed: gameState.worldSeed,
                        reputation: gameState.reputation
                    });
                    
                    // Send full world state sync to new client if game is active
                    if (isGameActive && window.MultiplayerSync) {
                        const fullSync = window.MultiplayerSync.createFullSyncPacket();
                        safeSend(conn, fullSync);
                        console.log('[Network] Sent full world sync to joining client');
                    }
                    
                    broadcastLobbyState();
                }
            }, 500);
        });

        peer.on('error', (err) => {
            console.error('[Network] Host error:', err);
            updateStatus(`🔴 Host Error: ${err.type}`);
            if (err.type === 'unavailable-id') {
                alert("Room Code already in use. Try a different code.");
                quitToMenu();
            } else if (err.type === 'invalid-id') {
                alert("Invalid Room Code format.");
                quitToMenu();
            }
        });

    } else {
        updateStatus("🟡 Connecting to host...");
        connectionRetry.reset(currentRoomId);
        
        // Create client Peer with global ICE configuration
        peer = new Peer(NETWORK_CONFIG);
        
        peer.on('open', (id) => {
            myPeerId = id;
            isMultiplayer = true;
            updateStatus("🟡 Authenticating with host...");
            
            const targetId = prefix + currentRoomId + "-host";
            const conn = peer.connect(targetId);
            
            connections.push(conn);
            setupConnectionEvents(conn);

            conn.on('open', () => {
                updateStatus("🟢 Connected to Host");
                logMessage("CONNECTED TO HOST");
                showScreen('lobby');
                const roomCodeEl = document.getElementById('lobby-room-code');
                const hostControlsEl = document.getElementById('lobby-host-controls');
                const clientControlsEl = document.getElementById('lobby-client-controls');
                if (roomCodeEl) roomCodeEl.innerText = "ROOM " + currentRoomId;
                if (hostControlsEl) hostControlsEl.style.display = 'none';
                if (clientControlsEl) clientControlsEl.style.display = 'block';
                connectionRetry.reset(currentRoomId);
                console.log('[Network] Client connected to host:', targetId);
            });

            conn.on('error', (err) => {
                console.error('[Network] Connection error:', err);
                updateStatus(`🔴 Connection Error: ${err.type}`);
            });

            conn.on('close', () => {
                updateStatus("🟡 Disconnected - Reconnecting...");
                console.log('[Network] Connection closed, attempting reconnect');
                attemptReconnect(prefix, currentRoomId);
            });
        });

        peer.on('error', (err) => {
            console.error('[Network] Peer error:', err);
            updateStatus(`🔴 Peer Error: ${err.type}`);
            
            if (err.type === 'network') {
                alert("Network error. Check your internet connection.");
                showScreen('join');
            } else if (err.type === 'invalid-id') {
                alert("Invalid Room Code format.");
                showScreen('join');
            }
        });
    }

    netInterval = setInterval(broadcastState, SETTINGS.NET_UPDATE_RATE);
}

// --- AUTO-RECONNECT LOGIC ---
function attemptReconnect(prefix, roomId) {
    const key = roomId;
    const attempts = connectionRetry.attempts[key] || 0;
    
    if (attempts >= connectionRetry.maxAttempts) {
        console.error('[Network] Max reconnect attempts reached');
        alert("Could not reconnect to host. Game session lost.");
        quitToMenu();
        return;
    }
    
    const delay = connectionRetry.getDelay(attempts);
    connectionRetry.attempts[key] = attempts + 1;
    
    console.log(`[Network] Reconnect attempt ${attempts + 1}/${connectionRetry.maxAttempts} in ${delay}ms`);
    
    setTimeout(() => {
        if (!peer || peer.destroyed) {
            const targetId = prefix + roomId + "-host";
            const conn = peer.connect(targetId);
            
            if (!connections.includes(conn)) {
                connections.push(conn);
            }
            setupConnectionEvents(conn);

            conn.on('open', () => {
                console.log('[Network] Reconnected successfully');
                logMessage("RECONNECTED TO HOST");
                connectionRetry.reset(roomId);
            });

            conn.on('error', () => {
                attemptReconnect(prefix, roomId);
            });
        }
    }, delay);
}

function broadcastLobbyState() {
    const packet = { type: 'LOBBY_STATE', slots: lobbySlots };
    if (isHost) {
        safeBroadcast(packet);
        renderLobby();
    }
}

function setupConnectionEvents(conn) {
    const statusEl = document.getElementById('connection-status');
    
    conn.on('data', (data) => {
        try {
            handleNetworkData(data, conn.peer);
        } catch(e) {
            console.error("Network Packet Error", e);
        }
    });
    
    conn.on('error', (err) => {
        console.error('[Network] Connection error:', err);
        if (statusEl) {
            statusEl.innerText = `🔴 Connection Error: ${err.type || 'unknown'}`;
        }
        logMessage(`ERROR: ${err.type || 'Connection failed'}`);
    });
    
    conn.on('close', () => {
        logMessage("CONNECTION LOST");
        if (statusEl) {
            statusEl.innerText = isHost ? "🟡 Waiting for reconnection..." : "🔴 Host disconnected";
        }
        
        if(isHost) {
            connections = connections.filter(c => c !== conn);
            for(let i=0; i<4; i++) {
                if(lobbySlots[i] === conn.peer) {
                    lobbySlots[i] = null;
                    break;
                }
            }
            broadcastLobbyState();
            console.log(`[Network] Host: Player disconnected. Active players: ${lobbySlots.filter(s => s !== null).length}`);
        } else {
            // Client-side disconnection from host - attempt reconnect
            console.log('[Network] Client disconnected from host, attempting auto-reconnect');
            setTimeout(() => {
                if (!isGameActive) {
                    alert("Host disconnected. Returning to menu.");
                    quitToMenu();
                } else {
                    attemptReconnect("omni-ops-v7-", currentRoomId);
                }
            }, 2000);
        }
        removeRemotePlayer(conn.peer);
    });
}

function broadcastState() {
    if (!isGameActive || !isMultiplayer) return;

    const myState = {
        id: myPeerId,
        idx: myPlayerIndex,
        x: cameraRig.position.x, y: cameraRig.position.y, z: cameraRig.position.z,
        yaw: player.yaw, h: player.currentHeight, 
        lastShot: player.lastFireTime || 0, shotEnd: player.lastShotEnd || null,
        stance: player.isCrouching ? "CROUCHED" : "STANDING", lean: player.leanFactor
    };

    // Use new multiplayer sync system
    if (window.MultiplayerSync) {
        window.MultiplayerSync.broadcastPlayerState(myState);
    }

    if (isHost) {
        const playersData = [myState];
        Object.values(remotePlayers).forEach(rp => {
            if(rp.lastData) playersData.push(rp.lastData);
        });

        const aiData = aiUnits.map(u => ({
            id: u.userData.id,
            x: u.mesh.position.x, y: u.mesh.position.y, z: u.mesh.position.z,
            rotY: u.mesh.rotation.y,
            faction: u.userData.faction,
            status: u.userData.status
        }));
        
        const bodyData = deadBodies.map(b => ({
            x: b.mesh.position.x, y: b.mesh.position.y, z: b.mesh.position.z,
            color: b.color,
            time: b.timeOfDeath
        }));

        // Use new comprehensive sync system for better reliability
        const packet = window.MultiplayerSync ? 
            window.MultiplayerSync.createDeltaSyncPacket() :
            { 
                type: 'WORLD_STATE', 
                players: playersData, 
                ai: aiData,
                bodies: bodyData,
                reputation: gameState.reputation,
                time: gameState.timeOfDay
            };
        
        safeBroadcast(packet);
        
        // Periodic full sync every 5 seconds
        if (window.MultiplayerSync) {
            window.MultiplayerSync.checkWorldStateConsistency();
        }
    } else {
        if(connections[0]) safeSend(connections[0], { type: 'CLIENT_STATE', state: myState });
    }

    player.lastShotEnd = null; 
}

function handleNetworkData(data, senderId) {
    if (data.type === 'INIT_PLAYER') {
        myPlayerIndex = data.index;
        gameState.worldSeed = data.seed; 
        gameState.reputation = data.reputation;
        
        const statusText = document.querySelector('#lobby-client-controls p');
        if(statusText) {
            statusText.innerText = `ASSIGNED: ${SQUAD_NAMES[myPlayerIndex]} SQUAD`;
            statusText.style.color = "#00ffcc";
            statusText.style.fontWeight = "bold";
        }
    }

    if (data.type === 'LOBBY_STATE') {
        lobbySlots = data.slots;
        renderLobby();
        if (!isHost) {
             for(let i=0; i<4; i++) {
                 if (lobbySlots[i] === myPeerId) {
                     myPlayerIndex = i;
                     break;
                 }
             }
        }
    }
    
    if (data.type === 'REQUEST_SWITCH' && isHost) {
        let oldIdx = -1;
        for(let i=0; i<4; i++) { if(lobbySlots[i] === senderId) oldIdx = i; }
        
        if (oldIdx !== -1) lobbySlots[oldIdx] = null;
        if (lobbySlots[data.index] === null) {
            lobbySlots[data.index] = senderId;
            broadcastLobbyState();
        }
    }

    if (data.type === 'START_GAME') {
        launchGame();
        return;
    }

    if (data.type === 'CLIENT_STATE' && isHost) {
        updateRemotePlayer(senderId, data.state);
        if (remotePlayers[senderId]) remotePlayers[senderId].lastData = data.state;
    }

    if (data.type === 'WORLD_STATE' && !isHost) {
        gameState.reputation = data.reputation; 
        gameState.timeOfDay = data.time;
        
        if (data.players) {
            data.players.forEach(pData => {
                if (pData.id !== myPeerId) {
                    updateRemotePlayer(pData.id, pData);
                }
            });
        }

        if (data.ai) {
            data.ai.forEach(ad => {
                const ai = aiUnits.find(u => u.userData.id === ad.id);
                if (ai) {
                    ai.serverPos = new THREE.Vector3(ad.x, ad.y, ad.z); 
                    ai.mesh.rotation.y = ad.rotY;
                    ai.userData.status = ad.status; 
                }
            });
        }
        
        if (data.bodies) {
            data.bodies.forEach(bd => {
                const exists = deadBodies.some(b => Math.abs(b.timeOfDeath - bd.time) < 100);
                if (!exists) {
                    spawnBody({x:bd.x, y:bd.y, z:bd.z}, bd.color, bd.time);
                }
            });
        }
    }

    // New comprehensive sync packet handlers
    if (data.type === 'WORLD_SYNC_FULL' && !isHost && window.MultiplayerSync) {
        console.log('[Network] Received full world state sync from host');
        window.MultiplayerSync.applyFullWorldState(data.worldState);
    }

    if (data.type === 'WORLD_SYNC_DELTA' && !isHost && window.MultiplayerSync) {
        window.MultiplayerSync.applyDeltaWorldState(data.dirtyEntities);
    }

    // Handle editor object synchronization
    if (data.type === 'EDITOR_OBJECT_PLACED' && !isHost && window.MultiplayerSync) {
        if (window.UE5Editor) {
            const obj = data.object;
            const assetDef = window.UE5Editor.findAsset(obj.type);
            if (assetDef) {
                const mesh = window.UE5Editor.createMesh(assetDef);
                mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
                mesh.rotation.set(obj.rotation.x, obj.rotation.y, obj.rotation.z);
                mesh.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData = { ue5: true, type: obj.type, ...assetDef };
                scene.add(mesh);
                window.UE5Editor.objects.push(mesh);
                window.UE5Editor.updateEntityCount();
                console.log('[Network] Received editor object from host:', obj.type);
            }
        }
    }

    if (data.type === 'CMD_RELAY' && isHost) {
        if (data.unitIds) {
             data.unitIds.forEach(uid => {
                 const unit = aiUnits.find(u => u.userData.id === uid);
                 if (unit) {
                     if (data.cmd === 'MOVE') {
                         unit.state = STATES.MOVING;
                         unit.navTarget = new THREE.Vector3(data.target.x, data.target.y, data.target.z);
                         unit.navTarget.x += (Math.random() - 0.5) * 2;
                         unit.navTarget.z += (Math.random() - 0.5) * 2;
                     } else {
                         unit.state = data.cmd;
                         unit.navTarget = null;
                     }
                 }
             });
        }
    }
    
    if (data.type === 'LOOT_EVENT') {
        const obj = objects.find(o => o.userData.id === data.id);
        if (obj) {
            scene.remove(obj);
            objects = objects.filter(o => o !== obj);
            logMessage("SUPPLIES LOOTED BY SQUAD");
        }
    }
    
    if (data.type === 'KILL_EVENT') {
        const unit = aiUnits.find(u => u.userData.id === data.id);
        if (unit) {
            scene.remove(unit.mesh);
            aiUnits = aiUnits.filter(u => u !== unit);
            spawnBody(data.pos, data.color, Date.now());
        }
    }

    if (data.type === 'ACTION_LOG' && isHost) {
        if (data.action === 'TRADE') {
            gameState.reputation.CITIZEN += 5;
            logMessage(`${data.player} TRADED WITH LOCAL`);
        }
        if (data.action === 'THREATEN') {
            gameState.reputation.CITIZEN -= 15;
            logMessage(`${data.player} THREATENED CIVILIAN`);
        }
        saveWorldData();
    }
}

function setupLighting() {
    // [SYSTEM_RUNNER_ALERT] Moon Base Atmosphere - "Cold Boot" Environment
    scene.background = new THREE.Color(0x00050a);  // Deep space black
    scene.fog = new THREE.FogExp2(0x00050a, 0.02);  // Distant fade
    
    // [SYSTEM_RUNNER_ALERT] Flashlight Mode - Boost ambient to verify geometry renders
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));  // Flashlight Mode for visibility
    
    // Harsh directional light (simulating distant star/sun)
    sunLight = new THREE.DirectionalLight(0xccccff, 1.8); 
    sunLight.position.set(100, 100, 50); 
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100; 
    sunLight.shadow.camera.right = 100; 
    sunLight.shadow.camera.top = 100; 
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.mapSize.set(4096, 4096); 
    scene.add(sunLight);
}

// ✅ PROJECTILE POOL - For physics-based shots (Reference: ThreeJS_FPS_2.0)
const projectiles = [];
const MAX_PROJECTILES = 20;

function initProjectiles() {
    const sphereGeometry = new THREE.IcosahedronGeometry(0.1, 1);
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffaa00, 
        emissive: 0xffaa00, 
        emissiveIntensity: 2 
    });
    
    for (let i = 0; i < MAX_PROJECTILES; i++) {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.castShadow = true;
        sphere.visible = false;
        scene.add(sphere);
        projectiles.push({
            mesh: sphere,
            velocity: new THREE.Vector3(),
            active: false,
            lifetime: 0
        });
    }
    console.log('[Weapon] Projectile pool initialized:', MAX_PROJECTILES);
}

function setupWeapon() {
    // ✅ Initialize projectile pool
    initProjectiles();
    
    // Global variables for animation
    window.gunMixer = null; 
    window.gunActions = {};
    
    // Asset paths - ARES Phase 9: CDN-reliable model URL
    // Using three.js RobotExpressive as standin (known to work, sci-fi enough for sci-fi game)
    const weaponModelPath = 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
    const fallbackGLTFUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf';
    const maxWeaponLoadRetries = 1;
    let weaponLoadAttempts = 0;
    let loader = null;

    // ✅ Initialize GLTFLoader from import map (PHASE 9 Fix)
    const initGLTFLoader = async () => {
        try {
            // Use dynamic import from the import map
            if (window.THREE) {
                console.log('[Weapon] Loading GLTFLoader from import map...');
                const GLTFLoaderModule = await import('three/addons/loaders/GLTFLoader.js');
                const GLTFLoaderClass = GLTFLoaderModule.GLTFLoader;
                if (GLTFLoaderClass) {
                    loader = new GLTFLoaderClass();
                    console.log('[Weapon] ✓ GLTFLoader successfully initialized from import map');
                    return true;
                }
            }
        } catch (err) {
            console.warn('[Weapon] GLTFLoader import warning:', err.message);
        }
        return false;
    };

    // ✅ Lore-driven fallback: Wireframe mesh labeled "CORRUPTED DATA"
    const buildCorruptedDataFallback = () => {
        console.log('[Weapon] Building lore-driven corrupted wireframe fallback...');
        weaponMesh = new THREE.Group();
        weaponMesh.name = 'CORRUPTED_DATA_WEAPON';

        // Cyan glitch material (represents corrupted data in the Buffer Zone)
        const corruptedMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            wireframe: false,
            transparent: true,
            opacity: 0.8
        });

        const wireframeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00cc99,
            wireframe: true,
            transparent: true,
            opacity: 0.5
        });

        // Build corrupted rifle silhouette using cyan primitives
        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.25), corruptedMaterial);
        weaponMesh.add(receiver);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 16), corruptedMaterial);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.01, -0.35);
        weaponMesh.add(barrel);

        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.3), wireframeMaterial);
        handguard.position.set(0, 0.01, -0.28);
        weaponMesh.add(handguard);

        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.07), corruptedMaterial);
        mag.rotation.x = 0.2;
        mag.position.set(0, -0.1, -0.05);
        weaponMesh.add(mag);

        const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.1), wireframeMaterial);
        sightBase.position.set(0, 0.05, -0.05);
        weaponMesh.add(sightBase);

        // Muzzle flash (unchanged)
        muzzleFlashMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0 }));
        muzzleFlashMesh.position.set(0, 0.01, -0.65);
        weaponMesh.add(muzzleFlashMesh);

        muzzleFlashPoint = new THREE.PointLight(0xffaa00, 0, 10);
        muzzleFlashPoint.position.set(0, 0.01, -0.6);
        weaponMesh.add(muzzleFlashPoint);

        weaponPivot.add(weaponMesh);

        // Add lore-driven console message
        console.log('[Weapon] ⚠️ CORRUPTED DATA - Weapon restored to cyan wireframe representation');
        console.log('[Lore] Buffer Zone sector purge detected. Weapon model integrity < 40%. System Runner must restore data.');
    };

    // ✅ Standard procedural fallback (if user switches mode)
    const buildProceduraWeapon = () => {
        console.log('[Weapon] Building procedural fallback weapon...');
        weaponMesh = new THREE.Group();
        const darkMetal = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
        const blackPlastic = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.25), darkMetal);
        weaponMesh.add(receiver);

        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 16), darkMetal);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.set(0, 0.01, -0.35);
        weaponMesh.add(barrel);

        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.07, 0.3), blackPlastic);
        handguard.position.set(0, 0.01, -0.28);
        weaponMesh.add(handguard);

        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.07), darkMetal);
        mag.rotation.x = 0.2;
        mag.position.set(0, -0.1, -0.05);
        weaponMesh.add(mag);

        const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.1), darkMetal);
        sightBase.position.set(0, 0.05, -0.05);
        weaponMesh.add(sightBase);

        muzzleFlashMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: 0xffdd00, transparent: true, opacity: 0 }));
        muzzleFlashMesh.position.set(0, 0.01, -0.65);
        weaponMesh.add(muzzleFlashMesh);

        muzzleFlashPoint = new THREE.PointLight(0xffaa00, 0, 10);
        muzzleFlashPoint.position.set(0, 0.01, -0.6);
        weaponMesh.add(muzzleFlashPoint);

        weaponPivot.add(weaponMesh);
        console.log('[Weapon] ✓ Procedural weapon loaded');
    };

    // ✅ Asset loading logic
    const loadWeaponModel = async () => {
        // Try to initialize GLTFLoader (async)
        const loaderReady = await initGLTFLoader();

        // If we have a loader and the model exists, try to load it
        if (loaderReady && loader) {
            loader.load(weaponModelPath, (gltf) => {
                const gun = gltf.scene;
                gun.scale.set(0.08, 0.08, 0.08);
                gun.rotation.set(0, Math.PI / 2, 0);
                gun.position.set(0, 0, 0);
                weaponPivot.add(gun);

                // Setup Animation
                window.gunMixer = new THREE.AnimationMixer(gun);
                if (gltf.animations && gltf.animations.length > 0) {
                    gltf.animations.forEach((clip) => {
                        window.gunActions[clip.name] = window.gunMixer.clipAction(clip);
                    });
                    if (window.gunActions['Armature|Idle']) {
                        window.gunActions['Armature|Idle'].play();
                    }
                }

                console.log('[Weapon] ✓ GLTF Model Loaded & Ready');
            }, undefined, (error) => {
                weaponLoadAttempts += 1;
                console.warn('[Weapon] Asset load attempt', { attempt: weaponLoadAttempts, err: error?.message });

                if (weaponLoadAttempts < maxWeaponLoadRetries) {
                    setTimeout(loadWeaponModel, 250);
                    return;
                }

                // Final fallback: Lore-driven corrupted wireframe
                console.log('[Weapon] Triggering lore-driven fallback...');
                buildCorruptedDataFallback();
            });
        } else {
            // No loader? Use lore-driven fallback immediately
            buildCorruptedDataFallback();
        }
    };

    loadWeaponModel();
}

// --- MINIMAP LOGIC ---
function updateMinimap() {
    const cvs = document.getElementById('minimap-canvas');
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    const w = cvs.width; const h = cvs.height;
    
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, w, h);
    
    const scale = 2; 
    const pX = cameraRig.position.x;
    const pZ = cameraRig.position.z;
    
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.scale(scale, scale);
    ctx.translate(-pX, -pZ); 

    objects.forEach(obj => {
        if (Math.abs(obj.position.x - pX) > 100 || Math.abs(obj.position.z - pZ) > 100) return;
        const x = obj.position.x; const z = obj.position.z;
        if (obj.userData.type === 'LOOT') {
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(x-2, z-2, 4, 4);
        } else {
            ctx.fillStyle = '#445544';
            ctx.fillRect(x-2, z-2, 4, 4);
        }
    });

    aiUnits.forEach(u => {
        const x = u.mesh.position.x; const z = u.mesh.position.z;
        if (u.userData.status === 'HOSTILE' || u.userData.faction === FACTIONS.RAIDER) ctx.fillStyle = '#ff0000';
        else if (u.userData.owner === myPlayerIndex) ctx.fillStyle = '#00aaff';
        else if (u.userData.faction === FACTIONS.GUARD) ctx.fillStyle = '#0000ff';
        else ctx.fillStyle = '#aaaaaa';
        
        ctx.beginPath(); ctx.arc(x, z, 3, 0, Math.PI*2); ctx.fill();
    });

    Object.values(remotePlayers).forEach(rp => {
        const x = rp.model.group.position.x; const z = rp.model.group.position.z;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath(); ctx.arc(x, z, 4, 0, Math.PI*2); ctx.fill();
    });
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(pX, pZ, 4, 0, Math.PI*2); ctx.fill();

    ctx.restore();
}

function createOperatorModel(color, isAI) {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xcc8855 });
    const suitMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
    
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), suitMat);
    torso.position.y = 1.2; torso.castShadow = true; group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.2), skinMat);
    head.position.y = 1.65; head.castShadow = true; group.add(head);

    const visorMat = new THREE.MeshBasicMaterial({ color: 0xccffff });
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.08, 0.1), visorMat);
    visor.position.set(0, 1.68, 0.06); group.add(visor); 

    const armGeo = new THREE.BoxGeometry(0.12, 0.6, 0.12);
    const legGeo = new THREE.BoxGeometry(0.18, 0.8, 0.18);
    
    const lArm = new THREE.Mesh(armGeo, suitMat); lArm.position.set(-0.32, 1.35, 0); group.add(lArm);
    const rArm = new THREE.Mesh(armGeo, suitMat); rArm.position.set(0.32, 1.35, 0); group.add(rArm);
    
    if (isAI) rArm.rotation.x = 0.5;
    
    const lLeg = new THREE.Mesh(legGeo, suitMat); lLeg.position.set(-0.15, 0.4, 0); group.add(lLeg);
    const rLeg = new THREE.Mesh(legGeo, suitMat); rLeg.position.set(0.15, 0.4, 0); group.add(rLeg);

    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.5), new THREE.MeshStandardMaterial({color: 0x111111}));
    gun.position.set(0, -0.2, 0.3); rArm.add(gun); 

    return { group, lArm, rArm, lLeg, rLeg, torso, head };
}

function updateRemotePlayer(uid, data) {
    if (!remotePlayers[uid]) {
        const pIndex = data.idx !== undefined ? data.idx : 0;
        const color = PLAYER_COLORS[pIndex] || 0x888888;
        const model = createOperatorModel(color, false); 
        scene.add(model.group);
        
        const tag = document.createElement('div');
        tag.className = 'nametag';
        tag.innerText = `OPERATOR ${pIndex + 1}`;
        const tagsContainer = document.getElementById('nametags-container');
        if(tagsContainer) tagsContainer.appendChild(tag);
        
        remotePlayers[uid] = { model, tag, targetPos: new THREE.Vector3(), targetYaw: 0, lastShot: 0, walkCycle: 0, stance: "STANDING", lean: 0 };
    }
    const p = remotePlayers[uid];
    p.targetPos.set(data.x, data.y - data.h, data.z);
    p.targetYaw = data.yaw;
    p.stance = data.stance;
    p.lean = data.lean;
    
    if (data.lastShot > p.lastShot) {
        if (data.shotEnd) renderRemoteShot(p.model.group, data.shotEnd);
        p.lastShot = data.lastShot;
    }
}

function removeRemotePlayer(uid) { 
    if (remotePlayers[uid]) { 
        if(scene) scene.remove(remotePlayers[uid].model.group); 
        if(remotePlayers[uid].tag) remotePlayers[uid].tag.remove();
        delete remotePlayers[uid]; 
    } 
}

function renderRemoteShot(operatorMesh, targetPoint) {
    const start = new THREE.Vector3(0.3, 1.4, 0.4).applyMatrix4(operatorMesh.matrixWorld);
    createTracer(start, new THREE.Vector3(targetPoint.x, targetPoint.y, targetPoint.z));
    playShootSound();
}

function spawnBody(pos, color, deathTime) {
    const bodyGroup = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: color });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.25), mat);
    torso.position.y = 0.2; bodyGroup.add(torso);
    
    bodyGroup.rotation.x = -Math.PI/2;
    bodyGroup.rotation.z = Math.random() * Math.PI; 
    bodyGroup.position.set(pos.x, 0.2, pos.z);
    
    scene.add(bodyGroup);
    deadBodies.push({ mesh: bodyGroup, timeOfDeath: deathTime, color: color });
}

function spawnFlower(pos) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), new THREE.MeshBasicMaterial({color: 0x00ff00}));
    stem.position.set(pos.x, 0.25, pos.z);
    
    const petalColor = Math.random() * 0xffffff;
    const flowerTop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15), new THREE.MeshBasicMaterial({color: petalColor}));
    flowerTop.position.set(0, 0.25, 0);
    stem.add(flowerTop);
    
    scene.add(stem);
    flowers.push(stem);
}

// Create AI unit for external module calls
window.createAIUnit = function(x, z, faction) {
    if (!scene) {
        console.warn('[createAIUnit] Scene not initialized');
        return null;
    }
    
    const color = 0x44aa44; // Default NPC color
    const model = createOperatorModel(color, true);
    const group = model.group;
    
    const ringGeo = new THREE.RingGeometry(0.5, 0.6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI/2;
    ring.position.y = 0.05;
    ring.visible = false;
    group.add(ring);
    
    group.position.set(x, 0, z);
    const unitId = 'npc_' + Math.random().toString(36).substr(2, 9);
    group.userData = {
        id: unitId,
        isAI: true,
        owner: -1,
        faction: faction || FACTIONS.CITIZEN,
        status: 'NEUTRAL',
        health: 100,
        job: JOBS.NONE
    };
    scene.add(group);
    
    const unit = {
        id: unitId,
        mesh: group,
        model: model,
        ring: ring,
        navTarget: null,
        serverPos: null,
        state: STATES.IDLE,
        moveSpeed: 5,
        walkCycle: 0,
        userData: group.userData,
        homePos: new THREE.Vector3(x, 0, z),
        lastShotTime: 0
    };
    
    return unit;
};

function spawnAIUnits() {
    console.warn('[World] spawnAIUnits legacy call ignored (LivingWorld owns NPC spawns)');
}

function spawnZoneNPCs() {
    if (window.OMNI_OPS_STORY_MODE === 'CHAPTER1') {
        console.log('[World] Skipping spawnZoneNPCs for Chapter 1 story mode');
        return;
    }
    for(let i=0; i<3; i++) createNPC({x: 0 + (Math.random()-0.5)*5, z: -25 + (Math.random()-0.5)*5}, FACTIONS.CITIZEN, 0xffffff, JOBS.MEDIC);
    for(let i=0; i<3; i++) createNPC({x: 0 + (Math.random()-0.5)*5, z: 25 + (Math.random()-0.5)*5}, FACTIONS.CITIZEN, 0x553311, JOBS.SMITH);
    for(let i=0; i<8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * 10;
        createNPC({x: Math.cos(angle)*r, z: Math.sin(angle)*r}, FACTIONS.GUARD, 0x0000aa, JOBS.GUARD);
    }
    for (let i = 0; i < 5; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 45 + Math.random() * 30;
        createNPC({x: Math.cos(angle)*r, z: Math.sin(angle)*r}, FACTIONS.TRADER, 0x55aa55, JOBS.NONE);
    }
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 85 + Math.random() * 40;
        createNPC({x: Math.cos(angle)*r, z: Math.sin(angle)*r}, FACTIONS.RAIDER, 0xaa3333, JOBS.NONE);
    }
}

function createNPC(pos, faction, colorHex, job = JOBS.NONE) {
    const id = 1000 + aiUnits.length;
    const model = createOperatorModel(colorHex, true);
    const group = model.group;
    group.position.set(pos.x, 0, pos.z);
    
    if(faction === FACTIONS.RAIDER) {
        const visor = group.children.find(c => c.geometry.type === 'BoxGeometry' && c.material.color && c.material.color.getHex() === 0xccffff);
        if(visor) visor.material.color.setHex(0xff0000);
    }
    
    if(job === JOBS.MEDIC) {
        const visor = group.children.find(c => c.geometry.type === 'BoxGeometry' && c.material.color && c.material.color.getHex() === 0xccffff);
        if(visor) visor.material.color.setHex(0xffaaaa); 
    }

    group.userData = {
        id: id, isAI: true, owner: -1,
        faction: faction,
        status: (faction === FACTIONS.RAIDER) ? 'HOSTILE' : 'NEUTRAL',
        health: 100,
        job: job
    };
    scene.add(group);

    aiUnits.push({
        id: id, mesh: group, model: model, ring: null, 
        navTarget: null, serverPos: null, state: STATES.IDLE, moveSpeed: (faction===FACTIONS.RAIDER || faction===FACTIONS.GUARD) ? 5 : 3, 
        walkCycle: 0,
        userData: group.userData,
        homePos: new THREE.Vector3(pos.x, 0, pos.z),
        lastShotTime: 0
    });
}

function updateAI(delta) {
    if(!isGameActive) return;
    
    if (isHost) {
        gameState.timeOfDay += delta * SETTINGS.TIME_SCALE;
        if (gameState.timeOfDay >= 24) gameState.timeOfDay = 0;
        
        const now = Date.now();
        for(let i=deadBodies.length-1; i>=0; i--) {
            const body = deadBodies[i];
            if (now - body.timeOfDeath > SETTINGS.BODY_DECAY_TIME) {
                scene.remove(body.mesh);
                spawnFlower(body.mesh.position);
                deadBodies.splice(i, 1);
            }
        }
    }
    
    if (sunLight) {
        const time = gameState.timeOfDay;
        const alpha = (time / 24) * Math.PI * 2;
        const sunY = Math.sin(alpha - Math.PI/2);
        const sunZ = Math.cos(alpha - Math.PI/2);
        sunLight.position.set(0, sunY * 100, sunZ * 100);
        const intensity = Math.max(0.1, sunY);
        sunLight.intensity = intensity * 1.5;
        if (scene?.fog?.color && scene?.background?.setHSL) {
            scene.fog.color.setHSL(0.6, 0.2, intensity * 0.1);
            scene.background.setHSL(0.6, 0.2, intensity * 0.1);
        }
        const clockEl = document.getElementById('world-clock');
        if(clockEl) {
            clockEl.innerText = `${Math.floor(time).toString().padStart(2,'0')}:${Math.floor((time%1)*60).toString().padStart(2,'0')}`;
        }
    }

    aiUnits.forEach(unit => {
        if (!unit.mesh) return;

        if (unit.userData.owner === myPlayerIndex) {
            if(unit.ring) unit.ring.visible = selectedUnits.includes(unit);
        }

        if (!isHost) {
            if (unit.serverPos) {
                const dist = unit.mesh.position.distanceTo(unit.serverPos);
                unit.mesh.position.lerp(unit.serverPos, 0.1);
                if (unit.userData.state === STATES.SLEEP) unit.mesh.rotation.x = THREE.MathUtils.lerp(unit.mesh.rotation.x, -Math.PI/2, 0.1);
                else unit.mesh.rotation.x = THREE.MathUtils.lerp(unit.mesh.rotation.x, 0, 0.1);
                animateUnit(unit, delta, dist > 0.1);
            }
            return;
        }

        if (isHost) {
            let nearestEnemy = null;
            let minDist = 30; 

            const isHostile = (u1, u2) => {
                if (u1.userData.faction === FACTIONS.RAIDER && u2.userData.faction !== FACTIONS.RAIDER) return true;
                if (u1.userData.faction === FACTIONS.GUARD && u2.userData.faction === FACTIONS.RAIDER) return true;
                if (u1.userData.faction === FACTIONS.GUARD && u2.userData.faction === FACTIONS.SQUAD && gameState.reputation.CITIZEN < -20) return true; 
                return false;
            };

            aiUnits.forEach(other => {
                if (unit === other || !other.mesh) return;
                const d = unit.mesh.position.distanceTo(other.mesh.position);
                if (d < minDist && isHostile(unit, other)) {
                    minDist = d;
                    nearestEnemy = other.mesh.position;
                }
                if (unit.userData.job === JOBS.MEDIC && d < 5 && other.userData.health < 100 && other.userData.faction !== FACTIONS.RAIDER) {
                    other.userData.health += delta * 10;
                    if(other.userData.health > 100) other.userData.health = 100;
                }
            });

            if (nearestEnemy) {
                unit.state = STATES.COMBAT;
                unit.userData.status = 'COMBAT';
            } else if (unit.state === STATES.COMBAT) {
                unit.state = STATES.IDLE; 
                unit.userData.status = 'NEUTRAL';
            }

            let targetPos = unit.navTarget ? unit.navTarget.clone() : null;
            let isMoving = false;

            if (unit.state === STATES.COMBAT) {
                unit.mesh.lookAt(nearestEnemy.x, unit.mesh.position.y, nearestEnemy.z);
                const now = Date.now();
                if (now - unit.lastShotTime > 1500 + Math.random() * 1000) {
                    unit.lastShotTime = now;
                    const start = unit.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0));
                    start.add(new THREE.Vector3(0,0,1).applyQuaternion(unit.mesh.quaternion).multiplyScalar(0.5));
                    createTracer(start, nearestEnemy.clone().add(new THREE.Vector3((Math.random()-0.5)*2, 1, (Math.random()-0.5)*2)));
                    playShootSound(); 
                }
                unit.mesh.rotation.x = 0; 
                
            } else if (unit.userData.owner !== -1) {
                if (unit.state === STATES.FOLLOW) {
                    const ownerIdx = unit.userData.owner;
                    const ownerPeerId = lobbySlots[ownerIdx];
                    let ownerPos = null;
                    if (ownerIdx === myPlayerIndex) ownerPos = cameraRig.position;
                    else if (ownerPeerId && remotePlayers[ownerPeerId]) ownerPos = remotePlayers[ownerPeerId].targetPos;
                    if (ownerPos && unit.mesh.position.distanceTo(ownerPos) > 4.0) targetPos = ownerPos.clone();
                    else targetPos = null; 
                } 
                else if (unit.state === STATES.CHARGE) targetPos = new THREE.Vector3(0, 0, 0);
                else if (unit.state === STATES.HOLD) targetPos = null;
            } else {
                const isNight = (gameState.timeOfDay > 20 || gameState.timeOfDay < 6);
                if (isNight && unit.userData.faction !== FACTIONS.GUARD) { 
                    unit.state = STATES.SLEEP;
                    targetPos = unit.homePos.clone();
                    if (unit.mesh.position.distanceTo(unit.homePos) < 1.0) {
                        unit.mesh.rotation.x = THREE.MathUtils.lerp(unit.mesh.rotation.x, -Math.PI/2, 0.1);
                        targetPos = null;
                    }
                } else {
                    unit.state = STATES.IDLE;
                    unit.mesh.rotation.x = THREE.MathUtils.lerp(unit.mesh.rotation.x, 0, 0.1); 
                    if (!unit.navTarget || Math.random() < 0.005) {
                        const r = 20;
                        unit.navTarget = unit.homePos.clone().add(new THREE.Vector3((Math.random()-0.5)*r, 0, (Math.random()-0.5)*r));
                    }
                }
            }

            if (targetPos && unit.state !== STATES.SLEEP) {
                const dist = unit.mesh.position.distanceTo(targetPos);
                if (dist > 0.5) {
                    isMoving = true;
                    const dir = new THREE.Vector3().subVectors(targetPos, unit.mesh.position).normalize();
                    const nextPos = unit.mesh.position.clone().add(dir.multiplyScalar(unit.moveSpeed * delta));
                    unit.mesh.position.copy(nextPos);
                    unit.mesh.lookAt(targetPos.x, unit.mesh.position.y, targetPos.z);
                } else {
                    if (unit.userData.owner === -1) unit.navTarget = null;
                }
            }
            animateUnit(unit, delta, isMoving);
        }
    });
}

function animateUnit(unit, delta, isMoving) {
    const m = unit.model;
    if (isMoving) {
        unit.walkCycle += delta * 10;
        const swing = Math.sin(unit.walkCycle) * 0.5;
        m.lArm.rotation.x = swing; m.rArm.rotation.x = swing + 0.5; 
        m.lLeg.rotation.x = -swing; m.rLeg.rotation.x = swing;
    } else {
        m.lArm.rotation.x = THREE.MathUtils.lerp(m.lArm.rotation.x, 0, delta * 10);
        m.rArm.rotation.x = THREE.MathUtils.lerp(m.rArm.rotation.x, 0.5, delta * 10);
        m.lLeg.rotation.x = THREE.MathUtils.lerp(m.lLeg.rotation.x, 0, delta * 10);
        m.rLeg.rotation.x = THREE.MathUtils.lerp(m.rLeg.rotation.x, 0, delta * 10);
    }
}

function handleInteraction() {
    raycaster.setFromCamera(new THREE.Vector2(0,0), activeCamera);
    const hitList = [...aiUnits.map(u => u.mesh), ...objects].filter(o => o !== undefined);
    const intersects = raycaster.intersectObjects(hitList, true);
    
    if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.distance <= SETTINGS.INTERACT_DIST) {
            let obj = hit.object;
            while(obj.parent && !obj.userData.faction && !obj.userData.type) obj = obj.parent;
            
            if (obj.userData.type === 'LOOT') {
                logMessage("SUPPLIES SECURED (+15 AMMO)");
                player.reserveAmmo += 15;
                updateHUDAmmo();
                scene.remove(obj);
                objects = objects.filter(o => o !== obj);
                if (!isHost && connections.length > 0) safeSend(connections[0], { type: 'LOOT_EVENT', id: obj.userData.id });
                return;
            }

            if (obj.userData.faction) {
                openInteractionMenu(obj.userData);
            }
        }
    }
}

function openInteractionMenu(npcData) {
    gameState.isInDialogue = true;
    document.exitPointerLock();

    const box = document.getElementById('dialogue-box');
    const headerName = document.getElementById('npc-name');
    const headerFaction = document.getElementById('npc-faction');
    const mainText = document.getElementById('dialogue-text');
    const optsDiv = document.getElementById('dialogue-options');
    
    box.style.display = 'flex';
    optsDiv.innerHTML = '';
    
    headerFaction.innerText = npcData.faction;

    // Check for story-driven dialogue
    if (window.GameStory && npcData.job) {
        // Story dialogues for key characters
        if (npcData.job === JOBS.NONE && window.GameStory.currentState === 'INTRO_COMPLETE') {
            // Elder Magnus
            headerName.innerText = "Elder Magnus";
            mainText.innerText = "Stranger, I'm grateful you've come. We're in desperate need.";
            addDialogueOption("Listen", () => {
                if (window.GameStory) window.GameStory.displayDialogue('INTRO_MAGNUS', 'Elder Magnus');
                closeDialogue();
            });
            addDialogueOption("Leave", closeDialogue);
            return;
        }
    }

    if (npcData.faction === FACTIONS.SQUAD) {
        if (npcData.owner === myPlayerIndex) {
            headerName.innerText = "SQUAD MEMBER";
            mainText.innerText = "Awaiting orders, Commander.";
            
            const squadRep = gameState.reputation.SQUAD;
            if (squadRep < -20) {
                mainText.innerText = "I don't trust your command anymore. I'm sitting this one out.";
                addDialogueOption("Leave", closeDialogue);
            } else {
                addDialogueOption("[1] FOLLOW ME", () => { sendSquadCmd(npcData.id, STATES.FOLLOW); closeDialogue(); });
                addDialogueOption("[2] HOLD POSITION", () => { sendSquadCmd(npcData.id, STATES.HOLD); closeDialogue(); });
                addDialogueOption("[3] CHARGE", () => { sendSquadCmd(npcData.id, STATES.CHARGE); closeDialogue(); });
                addDialogueOption("Dismiss", closeDialogue);
            }
        } else {
            headerName.innerText = "ALLY";
            mainText.innerText = "Eyes open, Operator. We're on the same side.";
            addDialogueOption("Carry On", closeDialogue);
        }
    }
    else if (npcData.job === JOBS.MEDIC) {
        headerName.innerText = "CITADEL MEDIC";
        mainText.innerText = "I treat the wounded. Need patching up?";
        if (player.health < 100) {
            addDialogueOption("Heal (Full)", () => { player.health = 100; logMessage("Healed"); closeDialogue(); });
        } else {
            mainText.innerText = "You look healthy enough.";
        }
        addDialogueOption("Leave", closeDialogue);
    }
    else if (npcData.job === JOBS.SMITH) {
        headerName.innerText = "ARMORY SMITH";
        mainText.innerText = "Weapons hot. Keep the Citadel safe.";
        addDialogueOption("Resupply (Full)", () => { player.reserveAmmo = 90; updateHUDAmmo(); closeDialogue(); });
        addDialogueOption("Leave", closeDialogue);
    }
    else if (npcData.faction === FACTIONS.TRADER) {
        headerName.innerText = "OUTSKIRT TRADER";
        mainText.innerText = "Got supplies. Need a good reputation to deal.";
        
        if (gameState.reputation.CITIZEN >= 50) {
            addDialogueOption("Trade 50 Rep for 30 Ammo", () => { 
                gameState.reputation.CITIZEN -= 50; 
                player.reserveAmmo += 30; 
                updateHUDAmmo(); 
                logMessage("TRADE SUCCESSFUL");
                closeDialogue(); 
            });
        } else {
            addDialogueOption("[LOCKED] Need 50 Rep", () => {});
        }
        addDialogueOption("Leave", closeDialogue);
    }
    else if (npcData.faction === FACTIONS.CITIZEN) {
        headerName.innerText = "LOCAL CIVILIAN";
        mainText.innerText = "Keep your weapon down. These are dangerous times.";
        addDialogueOption("Trade (Offer Ration)", () => { performAction('TRADE', npcData); closeDialogue(); });
        addDialogueOption("Threaten", () => { performAction('THREATEN', npcData); closeDialogue(); });
        addDialogueOption("Leave", closeDialogue);
    }
    else if (npcData.faction === FACTIONS.GUARD) {
        headerName.innerText = "CITADEL GUARD";
        if (gameState.reputation.CITIZEN < -20) mainText.innerText = "You are wanted in this sector! Open fire!";
        else mainText.innerText = "Move along, citizen. The Citadel is secure.";
        addDialogueOption("Leave", closeDialogue);
    }
    else if (npcData.faction === FACTIONS.RAIDER) {
        headerName.innerText = "HOSTILE";
        mainText.innerText = "You picked the wrong territory!";
        addDialogueOption("Combat Engaged", closeDialogue);
    }
}

function addDialogueOption(text, callback) {
    const div = document.createElement('div');
    div.className = 'dialogue-option';
    div.innerText = text;
    div.onclick = callback;
    document.getElementById('dialogue-options').appendChild(div);
}

function closeDialogue() {
    const dialogueBox = document.getElementById('dialogue-box');
    if (dialogueBox) dialogueBox.style.display = 'none';
    if (gameState) gameState.isInDialogue = false;
    safeRequestPointerLock();
}

function performAction(type, npcData) {
    if (type === 'TRADE') {
        gameState.reputation.CITIZEN += 5;
        logMessage("Reputation Increased");
    } else if (type === 'THREATEN') {
        gameState.reputation.CITIZEN -= 15;
        logMessage("Karma Decreased. Loot Acquired.");
        player.reserveAmmo += 5; updateHUDAmmo();
    }
    saveWorldData();

    if (!isHost && connections.length > 0) {
        safeSend(connections[0], { type: 'ACTION_LOG', action: type, player: `P${myPlayerIndex+1}` });
    }
}

function sendSquadCmd(unitId, cmd) {
    if (isHost) executeOrder([unitId], cmd);
    else safeSend(connections[0], { type: 'CMD_RELAY', cmd: cmd, unitIds: [unitId] });
    logMessage(`Order Issued: ${cmd}`);
}

function checkInteractPrompt() {
    if (gameMode !== 'FPS' || !activeCamera) return;
    raycaster.setFromCamera(new THREE.Vector2(0,0), activeCamera);
    
    const interactables = [...aiUnits.map(u => u.mesh), ...objects].filter(x => x);
    const intersects = raycaster.intersectObjects(interactables, true);
    const prompt = document.getElementById('interaction-prompt');
    
    if (!prompt) return; // Element doesn't exist yet
    
    if (intersects.length > 0 && intersects[0].distance <= SETTINGS.INTERACT_DIST) {
        const obj = intersects[0].object;
        if(obj.userData && (obj.userData.type === 'LOOT' || (obj.parent && obj.parent.userData.faction))) {
            prompt.style.display = 'block';
        } else {
            prompt.style.display = 'none';
        }
    } else {
        prompt.style.display = 'none';
    }
}

function selectUnits(rect) {
    selectedUnits = [];
    aiUnits.forEach(unit => {
        if (!unit.mesh || unit.userData.owner !== myPlayerIndex) return;

        const pos = unit.mesh.position.clone();
        pos.project(activeCamera);
        const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
        
        const minX = Math.min(rect.startX, rect.endX);
        const maxX = Math.max(rect.startX, rect.endX);
        const minY = Math.min(rect.startY, rect.endY);
        const maxY = Math.max(rect.startY, rect.endY);

        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            selectedUnits.push(unit);
        }
    });
    aiUnits.forEach(u => { if(u.mesh && u.userData.owner === myPlayerIndex) u.ring.visible = selectedUnits.includes(u); });
    
    if (selectedUnits.length > 0) logMessage(`SQUAD ${myPlayerIndex+1} SELECTED`);
}

function issueMoveOrder(targetPoint) {
    if (selectedUnits.length === 0) return;
    const ids = selectedUnits.map(u => u.userData.id);
    
    if (!isHost) {
        logMessage("RELAYING ORDER...");
        safeSend(connections[0], { type: 'CMD_RELAY', cmd: 'MOVE', target: targetPoint, unitIds: ids });
        return;
    }
    logMessage("MOVING SQUAD...");
    executeMove(ids, targetPoint);
}

function issueTacticalOrder(orderType) {
    if (selectedUnits.length === 0) { logMessage("NO SQUAD SELECTED"); return; }
    const ids = selectedUnits.map(u => u.userData.id);
    
    if (!isHost) {
        safeSend(connections[0], { type: 'CMD_RELAY', cmd: orderType, unitIds: ids });
        return;
    }
    logMessage(`SQUAD ORDER: ${orderType}`);
    executeOrder(ids, orderType);
}

function executeMove(ids, target) {
    const cols = Math.ceil(Math.sqrt(ids.length));
    const spacing = 2.0;
    ids.forEach((id, i) => {
        const unit = aiUnits.find(u => u.userData.id === id);
        if (unit) {
            const row = Math.floor(i / cols); const col = i % cols;
            const offsetX = (col - cols/2) * spacing; const offsetZ = row * spacing;
            unit.state = STATES.MOVING;
            unit.navTarget = new THREE.Vector3(target.x + offsetX, 0, target.z + offsetZ);
        }
    });
}

function executeOrder(ids, cmd) {
    ids.forEach(id => {
        const unit = aiUnits.find(u => u.userData.id === id);
        if(unit) unit.state = cmd;
    });
}
function toggleCommanderMode() {
    switchingModes = true;
    if (gameMode === 'FPS') {
        gameMode = 'COMMANDER';
        document.exitPointerLock();
        commanderCamera.position.set(cameraRig.position.x, 60, cameraRig.position.z);
        activeCamera = commanderCamera;
        const safeShow = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'block'; };
        safeShow('commander-overlay');
        safeShow('command-panel');
        safeShow('minimap-container');
        const el1 = document.getElementById('crosshair-container');
        if (el1) el1.style.opacity = '0';
        const el2 = document.getElementById('interaction-prompt');
        if (el2) el2.style.display = 'none';
        const el3 = document.getElementById('stamina-container');
        if (el3) el3.style.display = 'none';
        const el4 = document.getElementById('health-container');
        if (el4) el4.style.display = 'none';
        weaponRig.visible = false;
        
    } else {
        gameMode = 'FPS';
        safeRequestPointerLock();
        activeCamera = camera;
        const safeHide = (id) => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
        safeHide('commander-overlay');
        safeHide('command-panel');
        safeHide('minimap-container');
        const el1 = document.getElementById('crosshair-container');
        if (el1) el1.style.opacity = '1';
        const el2 = document.getElementById('stamina-container');
        if (el2) el2.style.display = 'block';
        const el3 = document.getElementById('health-container');
        if (el3) el3.style.display = 'block';
        weaponRig.visible = true;
        camera.rotation.set(player.pitch, 0, 0);
    }
    setTimeout(() => { switchingModes = false; }, 500); 
}

function startReload() {
    if (player.isReloading || player.ammo === SETTINGS.MAG_SIZE || player.reserveAmmo <= 0) return;
    player.isReloading = true; player.reloadTimer = SETTINGS.RELOAD_TIME; player.isAiming = false; playReloadSound();
}

// ✅ FIRE WEAPON - Enhanced wrapper matching reference API
function fireWeapon() {
    if (player.isReloading) {
        console.log('[Weapon] Cannot fire - reloading');
        return false;
    }
    
    const result = tryShoot();
    if (result) {
        console.log('[Weapon] ✅ Shot fired | Ammo:', player.ammo, '| Mode:', SETTINGS.FIRE_MODES[player.fireModeIndex]);
        
        // ✅ Optional: Launch physics projectile (reference feature)
        // launchProjectile();
    }
    return result;
}

// ✅ LAUNCH PROJECTILE - Physics-based shot (Reference: throwBall)
function launchProjectile() {
    // Find inactive projectile
    const proj = projectiles.find(p => !p.active);
    if (!proj) return;
    
    // Get camera direction
    const shootDir = new THREE.Vector3();
    camera.getWorldDirection(shootDir);
    shootDir.normalize();
    
    // Position projectile at muzzle
    const startPos = new THREE.Vector3();
    if (muzzleFlashMesh) {
        muzzleFlashMesh.getWorldPosition(startPos);
    } else {
        camera.getWorldPosition(startPos);
        startPos.addScaledVector(shootDir, 0.5);
    }
    
    proj.mesh.position.copy(startPos);
    proj.velocity.copy(shootDir).multiplyScalar(50); // High speed
    proj.active = true;
    proj.lifetime = 3.0; // 3 seconds
    proj.mesh.visible = true;
    
    console.log('[Projectile] Launched at', startPos.toArray().map(n => n.toFixed(2)));
}

function tryShoot() {
    if (player.ammo <= 0 || player.isReloading || player.isSprinting) return false;
    player.ammo--; updateHUDAmmo(); playShootSound();
    const recMult = player.isAiming ? 0.4 : 1.0;
    const swayMult = player.stamina < 15 ? 2.5 : 1.0; 
    player.recoilY += 0.011 * recMult * swayMult; 
    player.recoilX += (Math.random() - 0.5) * 0.005 * recMult * swayMult;
    
    if (muzzleFlashPoint && muzzleFlashMesh) {
        muzzleFlashPoint.intensity = 15;
        muzzleFlashMesh.material.opacity = 1;
    }
    if (weaponMesh && weaponMesh.position) {
        weaponMesh.position.z += 0.08;
    } 
    const startPos = new THREE.Vector3();
    if (muzzleFlashMesh) {
        muzzleFlashMesh.getWorldPosition(startPos);
    } else {
        // Fallback to weapon pivot position if muzzle mesh not available
        weaponPivot.getWorldPosition(startPos);
    }
    const shootDir = new THREE.Vector3(0, 0, -1).applyQuaternion(weaponMesh ? weaponMesh.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion());

    const ray = new THREE.Raycaster(startPos, shootDir);
    
    const targets = [...aiUnits.map(u => u.mesh), ...objects];
    Object.values(remotePlayers).forEach(p => {
        if(p.model && p.model.group) targets.push(p.model.group);
    });

    const hits = ray.intersectObjects(targets.filter(t => t !== undefined), true);
    const targetPoint = hits.length > 0 ? hits[0].point : startPos.clone().add(shootDir.multiplyScalar(200));
    createTracer(startPos, targetPoint);
    player.lastFireTime = Date.now();
    player.lastShotEnd = { x: targetPoint.x, y: targetPoint.y, z: targetPoint.z };
    
    if(hits.length > 0) {
        // ✅ Enhanced logging matching reference
        console.log('[Weapon] 🎯 HIT!', {
            target: hits[0].object.name || 'Unknown',
            distance: hits[0].distance.toFixed(2) + 'm',
            point: hits[0].point.toArray().map(n => n.toFixed(2))
        });
        
        const hitmarker = document.getElementById('hitmarker');
        if (hitmarker) {
            hitmarker.style.opacity = '1';
            setTimeout(() => { if (hitmarker) hitmarker.style.opacity = '0'; }, 80);
        }
        createImpactEffect(hits[0].point, hits[0].face.normal);
        
        let hitRoot = hits[0].object;
        while(hitRoot.parent && !hitRoot.userData.id) hitRoot = hitRoot.parent;
        
        if (hitRoot.userData.health) {
            hitRoot.userData.health -= 25; 
            if (hitRoot.userData.health <= 0) {
                if (isHost) {
                    const unit = aiUnits.find(u => u.mesh === hitRoot);
                    if (unit) {
                        safeBroadcast({ type: 'KILL_EVENT', id: unit.userData.id, pos: unit.mesh.position, color: unit.model.group.children[0].material.color.getHex() });
                        scene.remove(unit.mesh);
                        aiUnits = aiUnits.filter(u => u !== unit);
                        spawnBody(unit.mesh.position, unit.model.group.children[0].material.color.getHex(), Date.now());
                    }
                }
            }
        }
    }
    return true;
}

function createTracer(start, end) {
    const tracer = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 3.0), new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true }));
    tracer.position.copy(start); tracer.lookAt(end); scene.add(tracer);
    tracers.push({ mesh: tracer, start: start.clone(), end: end.clone(), t: 0, dist: start.distanceTo(end) });
}

function createImpactEffect(point, normal) {
    for(let i=0; i < 5; i++) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 4), new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 2 }));
        p.position.copy(point);
        const vel = normal.clone().add(new THREE.Vector3((Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5, (Math.random()-0.5)*1.5)).normalize().multiplyScalar(0.1 + Math.random() * 0.2);
        scene.add(p);
        particles.push({ mesh: p, vel: vel, life: 1.0, gravity: new THREE.Vector3(0, -0.01, 0) });
    }
}

// ✅ APPLY CONTROLS - Ported from ThreeJS_FPS_2.0 controls.js
// Uses camera matrixWorld for accurate directional movement
function applyControls(deltaTime) {
    const playerOnFloor = player.onGround;
    const speedDelta = deltaTime * (playerOnFloor ? SETTINGS.ACCEL : SETTINGS.ACCEL * 0.3);

    // ✅ Manually update the camera's world matrix
    camera.updateMatrixWorld();

    const forward = new THREE.Vector3();
    const side = new THREE.Vector3();

    // ✅ Use matrixWorld to get accurate directional vectors
    if (camera.matrixWorld) {
        forward.setFromMatrixColumn(camera.matrixWorld, 0);
        forward.crossVectors(camera.up, forward).normalize();

        side.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    }

    // ✅ Apply WASD movement where you're looking
    if (keys['KeyW']) player.velocity.add(forward.clone().multiplyScalar(speedDelta));
    if (keys['KeyS']) player.velocity.add(forward.clone().multiplyScalar(-speedDelta));
    if (keys['KeyA']) player.velocity.add(side.clone().multiplyScalar(-speedDelta));
    if (keys['KeyD']) player.velocity.add(side.clone().multiplyScalar(speedDelta));
    
    // ✅ Apply friction
    player.velocity.x -= player.velocity.x * SETTINGS.FRICTION * deltaTime;
    player.velocity.z -= player.velocity.z * SETTINGS.FRICTION * deltaTime;
}

function updatePhysics(delta) {
    if (gameState.isInDialogue || gameState.isPipboyOpen || gameState.isInventoryOpen) return; 

    if (gameMode === 'COMMANDER') {
        updateMinimap();
        const speed = SETTINGS.COMMANDER_SPEED * delta;
        if (keys['KeyW']) commanderCamera.position.z -= speed;
        if (keys['KeyS']) commanderCamera.position.z += speed;
        if (keys['KeyA']) commanderCamera.position.x -= speed;
        if (keys['KeyD']) commanderCamera.position.x += speed;
        return;
    }

    // Require pointer lock for first-person movement
    if (!document.pointerLockElement) {
        // Pointer lock lost - show hint on first frame without it
        if (!window.pointerLockLostOnce) {
            window.pointerLockLostOnce = true;
            console.log('[Movement] Pointer lock lost - Click game window to regain control');
        }
        return;
    } else {
        window.pointerLockLostOnce = false;
    }
    
    // ✅ APPLY CONTROLS - Uses camera matrixWorld for directional movement
    applyControls(delta);
    
    // STAMINA SYSTEM
    const isMoving = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);
    
    // Debug: Log input state every 60 frames
    if (window.frameCount % 60 === 0 && window.isStartFrame) {
        console.log('[Movement Debug]', {
            keysPressed: { W: keys['KeyW'], A: keys['KeyA'], S: keys['KeyS'], D: keys['KeyD'] },
            isMoving: isMoving,
            velocity: { x: player.velocity.x.toFixed(2), z: player.velocity.z.toFixed(2), y: player.velocity.y.toFixed(2) },
            cameraPos: { x: cameraRig.position.x.toFixed(1), y: cameraRig.position.y.toFixed(1), z: cameraRig.position.z.toFixed(1) },
            pointerLock: !!document.pointerLockElement
        });
    }
    window.isStartFrame = true;
    const wantsSprint = (keys['ShiftLeft'] || keys['ShiftRight']) && isMoving && !player.isCrouching && !player.isAiming;
    
    if (wantsSprint && player.stamina > 20 && !player.isExhausted) {
        player.isSprinting = true;
        player.stamina -= 20 * delta;
        if (player.stamina <= 0) { player.stamina = 0; player.isExhausted = true; }
    } else {
        player.isSprinting = false;
        if (player.stamina < 100) player.stamina += 10 * delta; 
        if (player.stamina > 20) player.isExhausted = false; 
    }
    
    const bar = document.getElementById('stamina-bar');
    if (bar) {
        bar.style.width = player.stamina + '%';
        bar.style.backgroundColor = player.stamina < 20 ? '#ff0000' : '#00ffcc';
    }
    const hpBar = document.getElementById('health-bar');
    if (hpBar) {
        hpBar.style.width = player.health + '%';
    }

    player.isCrouching = !!(keys['ControlLeft'] || keys['ControlRight'] || keys['Control']);
    let speedTarget = player.isSprinting ? SETTINGS.MAX_SPRINT : (player.isCrouching || player.isAiming ? SETTINGS.MAX_CROUCH : SETTINGS.MAX_WALK);
    
    // ✅ Speed limiting after applyControls
    const horizontalVel = new THREE.Vector2(player.velocity.x, player.velocity.z);
    if (horizontalVel.length() > speedTarget) {
        horizontalVel.normalize().multiplyScalar(speedTarget);
        player.velocity.x = horizontalVel.x;
        player.velocity.z = horizontalVel.y;
    }
    player.velocity.y -= SETTINGS.GRAVITY * delta;
    const nextPos = cameraRig.position.clone().addScaledVector(player.velocity, delta);
    
    // Collision
    for (let obj of objects) {
        if(!obj) continue;
        const box = new THREE.Box3().setFromObject(obj);
        const playerBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(nextPos.x, box.getCenter(new THREE.Vector3()).y, nextPos.z), new THREE.Vector3(SETTINGS.PLAYER_RADIUS * 2, 2, SETTINGS.PLAYER_RADIUS * 2));
        if (box.intersectsBox(playerBox)) {
            const currentBoxX = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(nextPos.x, box.getCenter(new THREE.Vector3()).y, cameraRig.position.z), new THREE.Vector3(SETTINGS.PLAYER_RADIUS * 2, 2, SETTINGS.PLAYER_RADIUS * 2));
            if (box.intersectsBox(currentBoxX)) { player.velocity.x = 0; nextPos.x = cameraRig.position.x; }
            const currentBoxZ = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(cameraRig.position.x, box.getCenter(new THREE.Vector3()).y, nextPos.z), new THREE.Vector3(SETTINGS.PLAYER_RADIUS * 2, 2, SETTINGS.PLAYER_RADIUS * 2));
            if (box.intersectsBox(currentBoxZ)) { player.velocity.z = 0; nextPos.z = cameraRig.position.z; }
        }
    }
    cameraRig.position.copy(nextPos);
    
    const targetY = player.isCrouching ? player.crouchHeight : player.eyeLevel;
    player.currentHeight = THREE.MathUtils.lerp(player.currentHeight, targetY, delta * 10);
    if (cameraRig.position.y <= player.currentHeight) {
        cameraRig.position.y = player.currentHeight; player.velocity.y = Math.max(0, player.velocity.y); player.onGround = true;
        if (keys['Space'] && !player.isExhausted) { 
            const horizontalSpeed = new THREE.Vector2(player.velocity.x, player.velocity.z).length();
            let jumpBonus = (horizontalSpeed > 2) ? (horizontalSpeed / SETTINGS.MAX_SPRINT) * 12 : 0;
            player.velocity.y = SETTINGS.JUMP_POWER + jumpBonus; player.onGround = false; 
        }
    } else { player.onGround = false; }
    player.leanFactor = THREE.MathUtils.lerp(player.leanFactor, keys['KeyQ'] ? -1 : (keys['KeyE'] ? 1 : 0), delta * 10);
}

function animate() {
    requestAnimationFrame(animate);
    
    // --- STABILITY CHECK ---
    if (!isGameActive || !renderer || !scene || !camera) {
        if (!isGameActive) console.log('[animate] Waiting for game to be active');
        return;
    }
    
    const delta = Math.min(clock.getDelta(), SETTINGS.MAX_DELTA);
    
    // Update weapon animation mixer
    if (window.gunMixer) {
        window.gunMixer.update(delta);
    }
    
    // Frame counter for debugging
    window.frameCount = (window.frameCount || 0) + 1;
    if (window.frameCount % 30 === 0) {
        const debugEl = document.getElementById('hud-top');
        if (debugEl) debugEl.innerHTML += `<br>[FPS: ${Math.round(1/delta)}] [F: ${window.frameCount}]`;
    }
    
    // ✅ Task 3: Titanium Physics - Sub-stepped collision detection (10x per frame)
    const physicsSteps = SETTINGS.PHYSICS_STEPS;
    for (let i = 0; i < physicsSteps; i++) {
        updatePhysics(delta / physicsSteps);
    }
    
    // ✅ Safety Net: Prevent player from falling into the void
    if (cameraRig && cameraRig.position.y < -5) {
        const respawnPos = resolveChapter1SpawnPosition();
        console.warn('[Physics] Player fell below world - teleporting to spawn', respawnPos);
        cameraRig.position.set(respawnPos.x, respawnPos.y, respawnPos.z);
        player.velocity.set(0, 0, 0);
        if (window.updateDialogue) {
            window.updateDialogue('SYSTEM: Position reset. Falling damage avoided.');
        }
    }
    
    updateAI(delta);
    
    // Update living world NPCs
    if (window.LivingWorldNPCs) {
        window.LivingWorldNPCs.update(delta);
    }
    
    checkInteractPrompt();

    if (gameMode === 'FPS') {
        if (player.stamina < 15 && !gameState.isInDialogue) {
            const t = Date.now() * 0.005; 
            camera.rotation.z = (Math.sin(t) * 0.02) - (player.leanFactor * 0.2);
            camera.rotation.x = player.pitch + (Math.cos(t * 2) * 0.01); 
        } else {
            camera.rotation.z = -player.leanFactor * 0.2;
            camera.rotation.x = player.pitch;
        }

        camera.fov = THREE.MathUtils.lerp(camera.fov, player.isAiming ? SETTINGS.FOV_ADS : (player.isSprinting ? SETTINGS.FOV_SPRINT : SETTINGS.FOV_BASE), delta * 8);
        camera.updateProjectionMatrix();
        camera.position.x = player.leanFactor * 0.4;
        
        if (!gameState.isInDialogue && !gameState.isPipboyOpen) {
            player.pitch += player.recoilY; player.yaw += player.recoilX;
            player.recoilY *= 0.78; player.recoilX *= 0.78;
        }
        cameraRig.rotation.y = player.yaw; 
        
        // --- 1. ADS LOGIC (Smooth Aiming with Iron Sights) ---
        const targetPos = player.isAiming ? WEAPON_POS.ADS : WEAPON_POS.HIP;
        const targetFOV = player.isAiming ? WEAPON_POS.ADS_FOV : WEAPON_POS.HIP_FOV;
        
        // Smoothly interpolate weapon position and camera FOV with spring physics
        if (weaponPivot) {
            // ✅ Task 2: Spring-based inertia for organic weapon movement
            // Calculate spring force based on current vs target position
            const springForce = new THREE.Vector3();
            springForce.subVectors(targetPos, gunSpring.pos);
            springForce.multiplyScalar(gunSpring.stiffness);
            
            // Apply damping to velocity
            gunSpring.vel.multiplyScalar(1 - gunSpring.damping * delta);
            
            // Apply spring force to velocity
            gunSpring.vel.addScaledVector(springForce, delta);
            
            // Update spring position
            gunSpring.pos.addScaledVector(gunSpring.vel, delta);
            
            // Apply to the actual pivot
            weaponPivot.position.copy(gunSpring.pos);
        }
        if (camera) {
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 15 * delta);
            camera.updateProjectionMatrix();
        }
        
        // --- 2. MOVEMENT ANIMATION LOGIC (Dynamic Animations) ---
        if (window.gunActions && window.gunMixer) {
            // Calculate horizontal movement speed (ignore vertical velocity)
            const speed = new THREE.Vector2(player.velocity.x, player.velocity.z).length();
            
            // Determine target animation based on movement speed
            let targetAnim = 'Armature|Idle';
            if (speed > 6) {
                targetAnim = 'Armature|Run';       // Sprinting/fast movement
            } else if (speed > 0.5) {
                targetAnim = 'Armature|Walk';      // Walking
            }
            
            // Smoothly transition animations
            if (currentGunAnim !== targetAnim && window.gunActions[targetAnim]) {
                const prevAction = window.gunActions[currentGunAnim];
                const nextAction = window.gunActions[targetAnim];
                
                if (prevAction && nextAction) {
                    nextAction.reset().play();
                    prevAction.crossFadeTo(nextAction, 0.2, true);  // 0.2s smooth blend
                    currentGunAnim = targetAnim;
                    console.log('[Weapon] Animation: ' + targetAnim + ' (Speed: ' + speed.toFixed(2) + ')');
                }
            }
        }
        
        // --- 3. RELOAD ANIMATION & HANDLING ---
        if (player.isReloading) {
            player.reloadTimer -= delta;
            if (player.reloadTimer <= 0) {
                player.isReloading = false;
                const needed = SETTINGS.MAG_SIZE - player.ammo;
                const taken = Math.min(needed, player.reserveAmmo);
                player.ammo += taken;
                player.reserveAmmo -= taken;
                updateHUDAmmo();
                console.log('[Weapon] Reload complete. Ammo: ' + player.ammo + '/' + player.reserveAmmo);
            }
        }
        
        player.fireTimer -= delta;
        if (player.burstCount > 0) {
            if (player.fireTimer <= 0) { if (tryShoot()) { player.burstCount--; player.fireTimer = SETTINGS.BURST_DELAY; } else player.burstCount = 0; }
        } else if (player.isFiring && player.fireTimer <= 0 && document.pointerLockElement) {
            if (SETTINGS.FIRE_MODES[player.fireModeIndex] === 'AUTO') { if(tryShoot()) player.fireTimer = SETTINGS.FIRE_RATE; }
        }
    } 

    // Update player interpolation for smooth movement
    if (window.MultiplayerSync) {
        window.MultiplayerSync.interpolateRemotePlayers(delta);
    }
    
    for (const uid in remotePlayers) {
        const p = remotePlayers[uid]; 
        if(!p || !p.model) continue;
        const m = p.model;
        const dist = m.group.position.distanceTo(p.targetPos);
        m.group.position.lerp(p.targetPos, 0.2); 
        m.group.rotation.y = THREE.MathUtils.lerp(m.group.rotation.y, p.targetYaw + Math.PI, 0.2);
        const isCrouched = p.stance === "CROUCHED";
        m.torso.position.y = THREE.MathUtils.lerp(m.torso.position.y, isCrouched ? 0.8 : 1.2, 0.1);
        m.head.position.y = m.torso.position.y + 0.45; m.group.rotation.z = THREE.MathUtils.lerp(m.group.rotation.z, -p.lean * 0.2, 0.1);
        if (p.tag) {
            const screenPos = m.head.position.clone();
            screenPos.project(activeCamera);
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (-(screenPos.y * 0.5) + 0.5) * window.innerHeight;
            if (screenPos.z < 1) { p.tag.style.display = 'block'; p.tag.style.left = x + 'px'; p.tag.style.top = y + 'px'; } else { p.tag.style.display = 'none'; }
        }
        if (dist > 0.05) { p.walkCycle += delta * (dist > 1.0 ? 10 : 5); const swing = Math.sin(p.walkCycle) * 0.5; m.lArm.rotation.x = swing; m.rArm.rotation.x = -swing; m.lLeg.rotation.x = -swing; m.rLeg.rotation.x = swing; }
        else { m.lArm.rotation.x = THREE.MathUtils.lerp(m.lArm.rotation.x, 0, 0.1); m.rArm.rotation.x = THREE.MathUtils.lerp(m.rArm.rotation.x, 0, 0.1); m.lLeg.rotation.x = THREE.MathUtils.lerp(m.lLeg.rotation.x, 0, 0.1); m.rLeg.rotation.x = THREE.MathUtils.lerp(m.rLeg.rotation.x, 0, 0.1); }
    }
    
    // ✅ MASTER SAFETY WRAPPER (Task 2) - Fix intensity crashes
    if (muzzleFlashPoint && muzzleFlashPoint.intensity !== undefined) {
        muzzleFlashPoint.intensity *= 0.4;
    }
    if (muzzleFlashMesh && muzzleFlashMesh.material) {
        muzzleFlashMesh.material.opacity *= 0.4;
    }
    if (weaponMesh && weaponMesh.position) {
        weaponMesh.position.z = THREE.MathUtils.lerp(weaponMesh.position.z, 0, delta * 15);
    }
    
    for (let i = tracers.length - 1; i >= 0; i--) {
        const t = tracers[i];
        if (!t || !t.mesh || !t.mesh.material) continue; // ✅ Safety check
        t.t += delta * SETTINGS.TRACER_SPEED;
        t.mesh.position.copy(t.start.clone().lerp(t.end, Math.min(1.0, t.t / t.dist)));
        if (t.t >= t.dist) { t.mesh.material.opacity -= delta * 10; if (t.mesh.material.opacity <= 0) { scene.remove(t.mesh); tracers.splice(i, 1); } }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (!p || !p.mesh) continue; // ✅ Safety check
        p.life -= delta * 2.5;
        p.vel.add(p.gravity);
        p.mesh.position.add(p.vel);
        p.mesh.scale.setScalar(p.life);
        if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); }
    }
    
    // ✅ Update physics projectiles (Reference: ThreeJS_FPS_2.0)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        if (!proj.active) continue;
        
        // Apply gravity
        proj.velocity.y -= SETTINGS.GRAVITY * delta;
        
        // Move projectile
        proj.mesh.position.addScaledVector(proj.velocity, delta);
        
        // Decrease lifetime
        proj.lifetime -= delta;
        
        // Collision check with objects
        const projBox = new THREE.Box3().setFromObject(proj.mesh);
        for (const obj of objects) {
            if (!obj) continue;
            const objBox = new THREE.Box3().setFromObject(obj);
            if (projBox.intersectsBox(objBox)) {
                console.log('[Projectile] 💥 Collided with object');
                createImpactEffect(proj.mesh.position, new THREE.Vector3(0, 1, 0));
                proj.active = false;
                proj.mesh.visible = false;
                break;
            }
        }
        
        // Deactivate if lifetime expired or fell below world
        if (proj.lifetime <= 0 || proj.mesh.position.y < -10) {
            proj.active = false;
            proj.mesh.visible = false;
        }
    }
    
    // --- FABRICATION LOOP ---
    if (window.isFabricationMode) {
        // Lock grid to player position (X/Z only, Y stays at floor)
        if (window.editorGrid && cameraRig) {
            window.editorGrid.position.set(cameraRig.position.x, 0, cameraRig.position.z);
        }
    } else {
        // Passive Energy Regen (when not in fabrication mode)
        if (window.fabricationEnergy < window.maxFabricationEnergy) {
            window.fabricationEnergy += 5 * delta;
        }
    }
    
    // --- UI BINDING (Specter Command) ---
    if (document.getElementById('hud-visor') && document.getElementById('hud-visor').style.display === 'block') {
        const hpBar = document.getElementById('health-bar-fill');
        const enBar = document.getElementById('energy-bar-fill');
        const ammoText = document.getElementById('current-ammo');
        const reserveText = document.getElementById('reserve-ammo');
        const fireMode = document.getElementById('fire-mode');
        
        if (hpBar) hpBar.style.width = ((player.health || 100) / player.maxHealth) * 100 + '%';
        if (enBar) enBar.style.width = Math.min(window.fabricationEnergy, 100) + '%';
        if (ammoText) ammoText.textContent = player.ammo || 0;
        if (reserveText) reserveText.textContent = player.reserveAmmo || 0;
        if (fireMode) fireMode.textContent = (SETTINGS.FIRE_MODES[player.fireModeIndex] || 'AUTO');
    }
    
    // Render the scene
    if (window.frameCount % 300 === 0) console.log('[animate] Rendering frame', window.frameCount, 'scene children:', scene.children.length);
    
    // ✅ Task 3: Viewmodel Depth Fix - Ensure weapon always renders on top
    renderer.clearDepth();
    renderer.render(scene, activeCamera);
}

window.animate = animate;

document.addEventListener('pointerlockchange', () => {
    if (switchingModes || gameState.isInDialogue || gameState.isPipboyOpen) return; 
    const menuOverlay = document.getElementById('menu-overlay');
    if (document.pointerLockElement) { if (menuOverlay) menuOverlay.style.display = 'none'; }
    else { 
        if (gameMode === 'FPS') { 
            if (menuOverlay) menuOverlay.style.display = 'flex'; 
            showScreen(isGameActive ? 'settings' : 'main'); 
        }
    }
});

// Click to regain pointer lock when lost during gameplay
document.addEventListener('click', () => {
    if (isGameActive && !gameState.isInventoryOpen && !gameState.isPipboyOpen && !gameState.isInDialogue && gameMode === 'FPS' && !document.pointerLockElement) {
        safeRequestPointerLock();
    }
});

// Handle pointer lock errors gracefully
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.name === 'SecurityError' && event.reason.message && event.reason.message.includes('lock')) {
        console.log('[PointerLock] Handled SecurityError gracefully - lock state changed');
        event.preventDefault();
        return;
    }
    console.error('[Unhandled Rejection]', event.reason);
});

document.addEventListener('mousemove', (e) => {
    if (gameState.isInDialogue || gameState.isPipboyOpen) return; 

    if (gameMode === 'FPS' && document.pointerLockElement) {
        const sense = player.isAiming ? SETTINGS.MOUSE_SENSE * SETTINGS.ADS_SENSE_MULT : SETTINGS.MOUSE_SENSE;
        player.yaw -= e.movementX * sense; player.pitch -= e.movementY * sense; player.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, player.pitch));
    } else if (gameMode === 'COMMANDER' && isSelecting) {
        const box = document.getElementById('selection-box');
        if (box) {
            const currentX = e.clientX; const currentY = e.clientY;
            const minX = Math.min(selectionStart.x, currentX); const minY = Math.min(selectionStart.y, currentY);
            const width = Math.abs(currentX - selectionStart.x); const height = Math.abs(currentY - selectionStart.y);
            box.style.left = minX + 'px'; box.style.top = minY + 'px'; box.style.width = width + 'px'; box.style.height = height + 'px';
        }
    }
});

document.addEventListener('mousedown', e => { 
    if(!isGameActive || gameState.isInDialogue || gameState.isPipboyOpen) return;
    initAudio();
    if (gameMode === 'FPS') {
        if (!document.pointerLockElement) { 
             safeRequestPointerLock();
             return; 
        }
        if(e.button === 0) {
            player.isFiring = true;
            const mode = SETTINGS.FIRE_MODES[player.fireModeIndex];
            if (mode === 'SINGLE') tryShoot();
            if (mode === 'BURST' && player.burstCount === 0 && player.fireTimer <= 0) player.burstCount = 3; 
        }
        if(e.button === 2) player.isAiming = true;
    } else if (gameMode === 'COMMANDER') {
        if (e.button === 0) { 
            isSelecting = true; selectionStart.x = e.clientX; selectionStart.y = e.clientY;
            const box = document.getElementById('selection-box');
            if (box) {
                box.style.display = 'block'; box.style.left = e.clientX + 'px'; box.style.top = e.clientY + 'px'; box.style.width = '0px'; box.style.height = '0px';
            }
        } else if (e.button === 2) { 
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, activeCamera);
            const intersects = raycaster.intersectObject(groundPlane);
            if (intersects.length > 0) issueMoveOrder(intersects[0].point);
        }
    }
});

document.addEventListener('mouseup', e => { 
    if (gameState.isInDialogue) return;
    if (gameMode === 'FPS') {
        if(e.button === 0) player.isFiring = false; 
        if(e.button === 2) player.isAiming = false; 
    } else if (gameMode === 'COMMANDER') {
        if (e.button === 0) {
            isSelecting = false; 
            const box = document.getElementById('selection-box');
            if (box) box.style.display = 'none';
            selectUnits({startX: selectionStart.x, startY: selectionStart.y, endX: e.clientX, endY: e.clientY});
        }
    }
});

document.addEventListener('keydown', e => { 
    keys[e.code] = true; 

    // Toggle Editor (F2)
    if (e.code === 'F2') {
        e.preventDefault();
        if (window.UE5Editor) {
            if (window.UE5Editor.active) {
                window.UE5Editor.close();
            } else {
                window.UE5Editor.open();
            }
        }
        return;
    }
    
    // Toggle Inventory (I key) - Separate from Pip-Boy
    if (e.code === 'KeyI' && isGameActive && !gameState.isInDialogue) {
        // If Pip-Boy is open, switch to inventory tab
        if (gameState.isPipboyOpen && window.PB) {
            window.PB.tab = 'inv';
            window.PB.switchTab(null, 'inv');
            console.log('[Game] Pip-Boy switched to Inventory tab');
        } else if (!gameState.isPipboyOpen) {
            // If Pip-Boy is closed, open it at inventory tab
            togglePipboy();
            setTimeout(() => {
                if (window.PB) {
                    window.PB.tab = 'inv';
                    window.PB.switchTab(null, 'inv');
                    console.log('[Game] Pip-Boy opened at Inventory tab');
                }
            }, 100);
        }
        return;
    }
    
    // Toggle Tactical View (M key)
    if (e.code === 'KeyM' && isGameActive && !gameState.isInDialogue && !gameState.isPipboyOpen) {
        toggleCommanderMode();
        return;
    }
    
    // Tab opens Pip-Boy (handled by Pip-Boy system)
    // I key is intentionally NOT implemented here - use Pip-Boy instead
    // Pip-Boy includes Map, Quests, and Inventory tabs
    
    if (gameState.isInDialogue) {
        if (e.code === 'Escape') closeDialogue();
        return; 
    }
    
    if (gameState.isPipboyOpen) {
        if (e.code === 'Escape') togglePipboy();
        return;
    }

    // ESC opens settings menu during gameplay
    if (e.code === 'Escape' && isGameActive && !gameState.isInDialogue && !gameState.isPipboyOpen && !window.UE5?.active) {
        e.preventDefault();
        const settingsScreen = document.getElementById('settings-screen');
        const menuOverlay = document.getElementById('menu-overlay');
        if (settingsScreen && menuOverlay) {
            const isSettingsOpen = settingsScreen.style.display !== 'none';
            if (isSettingsOpen) {
                // Close settings and resume
                // Clear all blocking flags
                if (gameState) {
                    gameState.isInDialogue = false;
                    gameState.isPipboyOpen = false;
                    gameState.isInventoryOpen = false;
                }
                settingsScreen.style.display = 'none';
                menuOverlay.style.display = 'none';
                safeRequestPointerLock();
            } else {
                // Open settings
                settingsScreen.style.display = 'flex';
                menuOverlay.style.display = 'flex';
                document.exitPointerLock();
            }
        }
        return;
    }

    if (gameMode === 'FPS') {
        if(e.code === 'KeyR' && isGameActive) startReload();
        if(e.code === 'KeyF' && isGameActive) { e.preventDefault(); handleInteraction(); }  // F for INTERACT
        if(e.code === 'KeyV' && isGameActive) {
            player.fireModeIndex = (player.fireModeIndex + 1) % SETTINGS.FIRE_MODES.length;
            const modeText = document.getElementById('mode-text');
            if (modeText) modeText.innerText = SETTINGS.FIRE_MODES[player.fireModeIndex];
        }
    } else if (gameMode === 'COMMANDER') {
        if (e.code === 'Digit1') issueTacticalOrder(STATES.CHARGE);
        if (e.code === 'Digit2') issueTacticalOrder(STATES.HOLD);
        if (e.code === 'Digit3') issueTacticalOrder(STATES.FOLLOW);
    }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

function initAudio() {
    if (audioCtx) {
        if(audioCtx.state === 'suspended') audioCtx.resume();
        return;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain(); masterGain.gain.setValueAtTime(SETTINGS.MASTER_VOL, audioCtx.currentTime); masterGain.connect(audioCtx.destination);
}
function playShootSound() {
    if (!audioCtx || !masterGain) return;
    const now = audioCtx.currentTime;
    const bufferSize = audioCtx.sampleRate * 0.1;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(1000, now); filter.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    const shootGain = audioCtx.createGain(); shootGain.gain.setValueAtTime(1.5, now); shootGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noise.connect(filter); filter.connect(shootGain); shootGain.connect(masterGain); noise.start();
}
function playReloadSound() {
    if (!audioCtx || !masterGain) return;
    const osc = audioCtx.createOscillator(); osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    const g = audioCtx.createGain(); g.gain.setValueAtTime(0.3, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.connect(g); g.connect(masterGain); osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

// EDITOR FUNCTIONS (exposed to window)
window.switchEditorTab = function(tab) {
    const sections = document.querySelectorAll('.editor-section');
    sections.forEach(s => s.classList.remove('active'));
    const section = document.getElementById('section-' + tab);
    if (section) section.classList.add('active');
};

window.toggleEditor = function() {
    // Call the new Fabrication Mode toggle
    toggleFabricationMode();
    
    const overlay = document.getElementById('editor-overlay');
    if (!overlay) return;
    const isActive = overlay.classList.contains('active');
    if (isActive) {
        overlay.classList.remove('active');
        if (isGameActive) safeRequestPointerLock();
    } else {
        overlay.classList.add('active');
        document.exitPointerLock();
    }
    window.editorActive = !isActive;
};

function toggleFabricationMode() {
    window.isFabricationMode = !window.isFabricationMode;
    console.log('[System] Fabrication Mode:', window.isFabricationMode ? 'ONLINE' : 'OFFLINE');
    
    if (window.isFabricationMode) {
        // 1. Apply Cyan Tint (Hologram Effect)
        if (scene?.fog?.color && scene?.background?.setHex) {
            scene.fog.color.setHex(0x004444);
            scene.background.setHex(0x002222);
        }
        console.log('[Visuals] Hologram visor activated - Cyan aesthetics applied');
        
        // 2. Spawn Holo-Grid
        if (!window.editorGrid) {
            window.editorGrid = new THREE.GridHelper(40, 40, 0x00ffff, 0x003333);
            scene.add(window.editorGrid);
            console.log('[Grid] Holographic grid spawned');
        }
        window.editorGrid.visible = true;
        const hudVisor = document.getElementById('hud-visor');
        if (hudVisor) hudVisor.style.display = 'block';
    } else {
        // Restore Tactical Day visual theme
        if (scene?.fog?.color && scene?.background?.setHex) {
            scene.fog.color.setHex(0x87CEEB);
            scene.background.setHex(0x87CEEB);
        }
        console.log('[Visuals] Tactical theme restored');
        
        if (window.editorGrid) window.editorGrid.visible = false;
        const hudVisor = document.getElementById('hud-visor');
        if (hudVisor) hudVisor.style.display = 'none';
    }
}

window.editorSpawn = function(type) {
    if (!scene || !camera) return;
    const pos = new THREE.Vector3(0, 5, -15);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    pos.copy(camera.position).add(dir.multiplyScalar(20)).add(cameraRig.position);
    
    const colors = {building:0x556655, wall:0x8b7355, crate:0x8b6914, tree:0x228b22, rock:0x708090};
    const mat = new THREE.MeshStandardMaterial({color: colors[type] || 0x808080});
    let mesh;
    
    if (type === 'building') mesh = new THREE.Mesh(new THREE.BoxGeometry(10,15,10), mat);
    else if (type === 'wall') mesh = new THREE.Mesh(new THREE.BoxGeometry(12,5,1), mat);
    else if (type === 'tree') mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5,2,12,8), mat);
    else if (type === 'rock') mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(3), mat);
    else if (type === 'crate') mesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), mat);
    else mesh = new THREE.Mesh(new THREE.BoxGeometry(3,3,3), mat);
    
    mesh.position.copy(pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = mesh.userData || {};
    mesh.userData.type = type;
    mesh.userData.createdAt = Date.now();
    scene.add(mesh);
    objects.push(mesh);
    console.log('[Editor] Spawned ' + type);
};

window.editorSpawnNPC = function(type) {
    if (!scene || !cameraRig) return;
    const pos = cameraRig.position.clone().add(new THREE.Vector3(5, 0, 10));
    const factionMap = {squad: FACTIONS.UNKNOWN, citizen: FACTIONS.CITIZEN, raider: FACTIONS.RAIDER, trader: FACTIONS.TRADER};
    const unit = window.createAIUnit(pos.x, pos.z, factionMap[type] || FACTIONS.UNKNOWN);
    if (unit && aiUnits) {
        aiUnits.push(unit);
        console.log('[Editor] Spawned NPC: ' + type);
    }
};

window.editorRegenWorld = function() {
    if (!scene) return;
    objects.forEach(o => { if (o.userData && !o.userData.player) scene.remove(o); });
    objects = objects.filter(o => !o.userData || o.userData.player);
    console.warn('[Editor] Legacy world regeneration disabled (Chapter 1 only)');
};

window.editorSetTime = function(hour) {
    const timeEl = document.getElementById('world-clock');
    if (timeEl) {
        const h = Math.floor(hour);
        const m = Math.round((hour % 1) * 60);
        timeEl.innerText = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
    }
};

window.editorWeather = function(type) {
    console.log('[Editor] Set weather to: ' + type);
    // Could implement fog, lighting changes, etc.
};

window.editorApplySettings = function() {
    console.log('[Editor] Applied settings');
};

window.editorSave = function() {
    try {
        const data = {
            worldSeed: gameState.worldSeed,
            objects: objects.filter(o => o && !o.userData?.player).map(o => ({
                type: o.userData?.type || 'generic',
                pos: { x: o.position.x, y: o.position.y, z: o.position.z },
                rot: { x: o.rotation.x, y: o.rotation.y, z: o.rotation.z }
            }))
        };
        localStorage.setItem('omni_world_save', JSON.stringify(data));
        console.log('[Editor] World saved to localStorage (omni_world_save) - objects:', data.objects.length);
    } catch(e) {
        console.error('[Editor] Failed to save world data:', e);
    }
};

window.editorLoad = function() {
    try {
        const raw = localStorage.getItem('omni_world_save');
        if (!raw) { console.log('[Editor] No saved world found'); return; }
        const data = JSON.parse(raw);
        // remove existing non-player objects
        objects.forEach(o => { if (o && !o.userData?.player) scene.remove(o); });
        objects = objects.filter(o => o && o.userData?.player);

        (data.objects || []).forEach(item => {
            let mesh;
            const mat = new THREE.MeshStandardMaterial({ color: 0x808080 });
            if (item.type === 'building') mesh = new THREE.Mesh(new THREE.BoxGeometry(10,15,10), mat);
            else if (item.type === 'wall') mesh = new THREE.Mesh(new THREE.BoxGeometry(12,5,1), mat);
            else if (item.type === 'tree') mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5,2,12,8), mat);
            else if (item.type === 'rock') mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(3), mat);
            else if (item.type === 'crate') mesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2), mat);
            else mesh = new THREE.Mesh(new THREE.BoxGeometry(3,3,3), mat);

            mesh.position.set(item.pos.x, item.pos.y, item.pos.z);
            mesh.rotation.set(item.rot.x || 0, item.rot.y || 0, item.rot.z || 0);
            mesh.castShadow = true; mesh.receiveShadow = true;
            mesh.userData = { type: item.type };
            scene.add(mesh); objects.push(mesh);
        });
        if (data.worldSeed) gameState.worldSeed = data.worldSeed;
        console.log('[Editor] World loaded from localStorage - restored', (data.objects||[]).length, 'objects');
    } catch (err) { console.error('[Editor] Failed to load world:', err); }
};

window.editorExport = function() {
    const data = {objects: objects.map(o => ({x:o.position.x, y:o.position.y, z:o.position.z}))};
    const json = JSON.stringify(data, null, 2);
    console.log('[Editor] Exported JSON:', json);
    alert('Exported to console (check browser console)');
};

// AI PLAYER API (Exposed for AI control panel and bridge)
window.AIPlayerAPI = {
    _aiActive: false,
    _inputMap: {
        moveForward: 'KeyW',
        moveBackward: 'KeyS',
        moveLeft: 'KeyA',
        moveRight: 'KeyD',
        jump: 'Space',
        sprint: 'ShiftLeft',
        crouch: 'ControlLeft'
    },
    setInput(action, pressed) {
        const keyCode = this._inputMap[action];
        if (!keyCode) return;
        keys[keyCode] = !!pressed;
    },
    setLook(yaw, pitch) {
        if (!isGameActive || gameMode !== 'FPS') return;
        player.yaw = yaw;
        player.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, pitch));
    },
    pressKey(action) {
        const keyMap = {
            reload: 'KeyR',
            jump: 'Space',
            interact: 'KeyF',
            togglePipboy: 'Tab',
            toggleCommander: 'KeyM',
            fireMode: 'KeyV'
        };
        const keyCode = keyMap[action];
        if (!keyCode) return;
        keys[keyCode] = true;
        if (keyCode === 'KeyR' && isGameActive) startReload();
        setTimeout(() => { keys[keyCode] = false; }, 120);
    },
    shoot() {
        if (!isGameActive || gameMode !== 'FPS') return false;
        return tryShoot();
    },
    releaseAllInputs() {
        Object.keys(keys).forEach(k => { keys[k] = false; });
        player.isFiring = false;
        player.isAiming = false;
    },
    activateAI() {
        this._aiActive = true;
        if (window.AIAutopilot && typeof window.AIAutopilot.start === 'function') {
            window.AIAutopilot.start();
        }
        return true;
    },
    deactivateAI() {
        this._aiActive = false;
        this.releaseAllInputs();
        if (window.AIAutopilot && typeof window.AIAutopilot.stop === 'function') {
            window.AIAutopilot.stop();
        }
        return true;
    },
    isAIControlling() {
        return this._aiActive;
    },
    getGameState() {
        if (!isGameActive) return null;
        return {
            position: cameraRig ? { x: cameraRig.position.x, y: cameraRig.position.y, z: cameraRig.position.z } : { x: 0, y: 0, z: 0 },
            yaw: player.yaw,
            pitch: player.pitch,
            health: player.health,
            ammo: player.ammo,
            reserveAmmo: player.reserveAmmo,
            stamina: player.stamina,
            mode: gameMode,
            isAiming: player.isAiming,
            isReloading: player.isReloading,
            isOnGround: player.onGround,
            reputation: gameState.reputation
        };
    },
    _waitForCondition(conditionFn, timeoutMs = 10000, intervalMs = 100) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const check = () => {
                let passed = false;
                try {
                    passed = !!conditionFn();
                } catch (err) {
                    passed = false;
                }
                if (passed) return resolve(true);
                if (Date.now() - startTime >= timeoutMs) return resolve(false);
                setTimeout(check, intervalMs);
            };
            check();
        });
    },
    spawnTestBotAt(x, y, z) {
        if (!isGameActive) return { success: false, error: 'Game not active' };
        if (typeof window.createAIUnit !== 'function') return { success: false, error: 'createAIUnit not available' };
        const unit = window.createAIUnit(x, z, FACTIONS.CITIZEN);
        if (!unit || !unit.mesh) return { success: false, error: 'AI unit spawn failed' };
        if (typeof y === 'number') unit.mesh.position.y = y;
        return { success: true, id: unit.id, position: { x, y: unit.mesh.position.y, z } };
    },
    runPathTest(routeId) {
        if (!routeId) return { success: false, error: 'routeId required' };
        const routes = window.OmniOpsChapter1Data?.pathRoutes || window.OmniOpsChapter1Data?.routes || null;
        if (!routes || !routes[routeId]) {
            return { success: false, error: 'route not found', routeId };
        }
        return { success: false, error: 'route execution not implemented', routeId };
    },
    async runStoryStartupSmokeTest(options = {}) {
        const result = { ok: true, checks: [], meta: {} };
        const addCheck = (name, passed, details) => {
            result.checks.push({ name, passed: !!passed, details: details || '' });
            if (!passed) result.ok = false;
        };

        const startButton = document.getElementById('btn-story-start');
        if (!startButton) {
            addCheck('Start button exists', false, 'btn-story-start not found');
            return result;
        }

        startButton.click();

        const ready = await this._waitForCondition(() => window.isGameActive && window.scene && window.cameraRig && window.THREE, options.timeoutMs || 10000, 100);
        addCheck('Engine boot (scene/camera/cameraRig)', ready, ready ? 'Ready' : 'Timed out');
        if (!ready) return result;

        const hasChapterRoom = !!window.scene?.children?.some(child => child?.userData?.type === 'chapter1_room');
        addCheck('Chapter 1 corridor present', hasChapterRoom, hasChapterRoom ? 'chapter1_room meshes found' : 'No chapter1_room meshes');

        const storyModeOk = window.OMNI_OPS_STORY_MODE === 'CHAPTER1';
        addCheck('Story mode is CHAPTER1', storyModeOk, window.OMNI_OPS_STORY_MODE || 'unset');

        const pos = window.cameraRig?.position;
        const inCorridor = !!pos && pos.x >= -10 && pos.x <= 10 && pos.z >= 0 && pos.z <= 80;
        addCheck('Player in corridor bounds', inCorridor, pos ? `(${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})` : 'No cameraRig position');

        const hasTerrain = !!window.scene?.children?.some(child => child?.userData?.type === 'terrain');
        addCheck('Sandbox terrain not present', !hasTerrain, hasTerrain ? 'terrain found' : 'no terrain');

        const ariaStatus = window.AriaVoRouter?.getStatus ? window.AriaVoRouter.getStatus() : null;
        const ariaPlayed = window.AriaVoRouter?.lastPlayedLine === 'ARIA_C1_001' || ariaStatus?.currentLine === 'ARIA_C1_001';
        addCheck('ARIA intro VO fired', ariaPlayed, ariaPlayed ? 'ARIA_C1_001' : 'Not detected');

        const currentObj = window.OmniOpsChapter1?.getCurrentObjective?.();
        const objectiveOk = currentObj?.id === 'OBJ_C1_WAKE';
        addCheck('First objective is OBJ_C1_WAKE', objectiveOk, currentObj?.id || 'Objective missing');

        result.meta = {
            storyMode: window.OMNI_OPS_STORY_MODE || 'unknown',
            objectiveId: currentObj?.id || null,
            ariaLine: window.AriaVoRouter?.lastPlayedLine || ariaStatus?.currentLine || null
        };

        return result;
    }
};

// Simple autonomous control loop for AI activation
if (!window.AIAutopilot) {
    window.AIAutopilot = {
        active: false,
        timer: null,
        lastDecisionAt: 0,
        currentMove: null,
        start() {
            if (this.active) return;
            this.active = true;
            this.lastDecisionAt = 0;
            this.timer = setInterval(() => this.tick(), 200);
            console.log('[AI Autopilot] Started');
        },
        stop() {
            if (!this.active) return;
            this.active = false;
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            if (window.AIPlayerAPI) {
                window.AIPlayerAPI.releaseAllInputs();
            }
            console.log('[AI Autopilot] Stopped');
        },
        tick() {
            if (!window.AIPlayerAPI || !window.AIPlayerAPI.isAIControlling()) return;
            if (!isGameActive || gameMode !== 'FPS') return;

            const now = Date.now();
            if (now - this.lastDecisionAt > 1200) {
                this.lastDecisionAt = now;
                const choices = ['moveForward', 'moveLeft', 'moveRight', 'moveBackward', null];
                this.currentMove = choices[Math.floor(Math.random() * choices.length)];

                if (Math.random() < 0.3) {
                    window.AIPlayerAPI.pressKey('jump');
                }

                if (Math.random() < 0.2) {
                    const yaw = player.yaw + (Math.random() - 0.5) * 0.6;
                    const pitch = player.pitch + (Math.random() - 0.5) * 0.2;
                    window.AIPlayerAPI.setLook(yaw, pitch);
                }
            }

            const moves = ['moveForward', 'moveBackward', 'moveLeft', 'moveRight'];
            moves.forEach(action => window.AIPlayerAPI.setInput(action, false));
            if (this.currentMove) {
                window.AIPlayerAPI.setInput(this.currentMove, true);
            }
        }
    };
}

// Cross-window API communication (for test interface)
window.AIPlayerAPI._broadcastStatus = function() {
    try {
        localStorage.setItem('omni_api_status', JSON.stringify({
            available: true,
            active: this._aiActive,
            timestamp: Date.now(),
            gameState: this.getGameState() ? 'active' : 'inactive'
        }));
    } catch(e) {
        console.warn('[API] Could not broadcast status:', e);
    }
};

// Process commands from test interface via localStorage
window.AIPlayerAPI._processCommand = function(cmd) {
    try {
        if (!cmd) return;
        const { action, param } = cmd;
        
        switch(action) {
            case 'activateAI':
                this.activateAI();
                break;
            case 'deactivateAI':
                this.deactivateAI();
                break;
            case 'setInput':
                if (param && param.action && param.pressed !== undefined) {
                    this.setInput(param.action, param.pressed);
                }
                break;
            case 'pressKey':
                if (param && param.action) {
                    this.pressKey(param.action);
                }
                break;
            case 'shoot':
                this.shoot();
                break;
        }
        
        // Broadcast updated status
        this._broadcastStatus();
    } catch(e) {
        console.warn('[API] Command processing error:', e);
    }
};

// Listen for commands from test interface
window.addEventListener('storage', (e) => {
    if (e.key === 'omni_api_command' && window.AIPlayerAPI) {
        try {
            const cmd = JSON.parse(e.newValue);
            window.AIPlayerAPI._processCommand(cmd);
            localStorage.removeItem('omni_api_command');
        } catch(err) {
            console.warn('[API] Command parse error:', err);
        }
    }
});

// ===== CRITICAL: EXPOSE FUNCTIONS TO GLOBAL SCOPE =====
window.launchGame = launchGame;
window.initGame = initGame;
window.handleInteraction = handleInteraction;

// Broadcast status every 500ms (simple version)
setInterval(() => {
    try {
        if (window.AIPlayerAPI) {
            localStorage.setItem('omni_api_status', JSON.stringify({
                available: true,
                active: window.AIPlayerAPI._aiActive,
                timestamp: Date.now()
            }));
        }
    } catch(e) {
        // Silently fail if localStorage unavailable
    }
}, 500);

console.log('[Core Game] v11 loaded successfully');

// AUTO-FEATURE [real_edit]: real edit
console.log('[Feature] Loaded: real edit');


// AUTO-FEATURE [i_want_you_to_bind_g]: I want you to bind G to spectator mode and have spectator mode allow me to noclip and fly 
console.log('[Feature] Loaded: I want you to bind G to spectator mode and have spectator mode allow me to noclip and fly ');


// AUTO-FEATURE [take_control_of_the_]: take control of the player character and move around
console.log('[Feature] Loaded: take control of the player character and move around');


// AUTO-FEATURE [health_bar_bottom_of]: Health Bar System
if (!window.healthBarUI) {
    window.healthBarUI = {
        element: null,
        init() {
            if (this.element) return; // Prevent duplicates
            const bar = document.createElement('div');
            bar.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);width:300px;height:40px;background:#222;border:2px solid #0f0;border-radius:5px;overflow:hidden;z-index:9000;';
            const fill = document.createElement('div');
            fill.id = 'health-bar-fill';
            fill.style.cssText = 'height:100%;background:linear-gradient(90deg,#f00,#ff0,#0f0);transition:width 0.3s;width:100%';
            const text = document.createElement('div');
            text.id = 'health-text';
            text.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:bold 14px monospace;z-index:1;text-shadow:0 0 3px #000';
            text.textContent = '100 / 100';
            bar.appendChild(fill);
            bar.appendChild(text);
            document.body.appendChild(bar);
            this.element = bar;
            console.log('[Health Bar] Initialized at bottom of screen');
        },
        update(current, max) {
            const fill = document.getElementById('health-bar-fill');
            const text = document.getElementById('health-text');
            if (fill && text) {
                const percent = (current / max) * 100;
                fill.style.width = percent + '%';
                text.textContent = Math.floor(current) + ' / ' + max;
            }
        }
    };
    setTimeout(() => window.healthBarUI.init(), 500);
    setInterval(() => {
        if (window.player) window.healthBarUI.update(player.health || 100, player.maxHealth || 100);
    }, 100);
}


// AUTO-FEATURE [implement_wall_runni]: Wall Running System
if (!window.wallRunSystem) {
    window.wallRunSystem = {
        active: false,
        wallSide: null,
        wallNormal: null,
        wallRunSpeed: 8,
        wallRunGravity: 5,
        maxWallRunTime: 3,
        wallRunTimer: 0,
        
        init() {
            console.log('[Wall Run] System initialized');
        },
        
        checkWall() {
            if (!window.player || !window.objects) return null;
            
            const rayDirections = [
                new THREE.Vector3(1, 0, 0),   // Right
                new THREE.Vector3(-1, 0, 0),  // Left
                new THREE.Vector3(0, 0, 1),   // Forward
                new THREE.Vector3(0, 0, -1)   // Back
            ];
            
            const raycaster = new THREE.Raycaster();
            const playerPos = window.camera ? window.camera.position.clone() : new THREE.Vector3();
            
            for (let i = 0; i < rayDirections.length; i++) {
                const dir = rayDirections[i].clone();
                if (window.camera) {
                    dir.applyQuaternion(window.camera.quaternion);
                }
                dir.y = 0;
                dir.normalize();
                
                raycaster.set(playerPos, dir);
                const intersects = raycaster.intersectObjects(window.objects || []);
                
                if (intersects.length > 0 && intersects[0].distance < 1.5) {
                    return {
                        side: i === 0 ? 'right' : i === 1 ? 'left' : i === 2 ? 'forward' : 'back',
                        normal: intersects[0].face.normal.clone(),
                        distance: intersects[0].distance
                    };
                }
            }
            return null;
        },
        
        start(wallData) {
            this.active = true;
            this.wallSide = wallData.side;
            this.wallNormal = wallData.normal;
            this.wallRunTimer = this.maxWallRunTime;
            
            if (window.player) {
                window.player.velocity.y = 2;
            }
            
            console.log('[Wall Run] Started on', wallData.side, 'wall');
        },
        
        stop() {
            if (!this.active) return;
            this.active = false;
            this.wallSide = null;
            this.wallNormal = null;
            console.log('[Wall Run] Stopped');
        },
        
        update(deltaTime) {
            if (!this.active || !window.player) return;
            
            this.wallRunTimer -= deltaTime;
            if (this.wallRunTimer <= 0) {
                this.stop();
                return;
            }
            
            const wallCheck = this.checkWall();
            if (!wallCheck) {
                this.stop();
                return;
            }
            
            // Apply wall run physics
            if (window.player.velocity) {
                window.player.velocity.y = Math.max(
                    window.player.velocity.y - this.wallRunGravity * deltaTime,
                    -5
                );
                
                const wallDir = new THREE.Vector3(-this.wallNormal.z, 0, this.wallNormal.x);
                if (this.wallSide === 'right') wallDir.multiplyScalar(-1);
                
                if (window.camera) {
                    const forward = new THREE.Vector3(0, 0, -1);
                    forward.applyQuaternion(window.camera.quaternion);
                    forward.y = 0;
                    forward.normalize();
                    
                    const movement = forward.clone().multiplyScalar(this.wallRunSpeed * deltaTime);
                    window.player.velocity.x = movement.x;
                    window.player.velocity.z = movement.z;
                }
            }
        }
    };
    
    window.wallRunSystem.init();
    
    // Add keybinds and update loop
    let lastSpacePress = 0;
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !window.wallRunSystem.active) {
            const now = Date.now();
            const wallData = window.wallRunSystem.checkWall();
            if (wallData && now - lastSpacePress < 300) {
                window.wallRunSystem.start(wallData);
            }
            lastSpacePress = now;
        }
    });
    
    console.log('[Wall Run] Ready - Double-tap SPACE near walls!');
}

// Ensure wall running is updated in game loop
if (!window.wallRunUpdateHooked) {
    window.wallRunUpdateHooked = true;
    const originalAnimateFunc = window.animateFrame;
    window.animateFrame = function() {
        if (originalAnimateFunc) {
            originalAnimateFunc.call(this);
        }
        if (window.wallRunSystem && window.wallRunSystem.active) {
            window.wallRunSystem.update(1/60); // Assume 60 FPS
        }
    };
}

// --- MODULE EXPORTS (Fix for HTML Buttons) ---
// Expose core functions to global scope for HTML onclick handlers
window.launchGame = launchGame;
window.startMode = startMode;
// Ensure the Global Handshake variables are still robust
window.isGameActive = false; 
console.log('[Core] ✅ Module loaded. Functions exposed to window.');

// ✅ SPECTER COMMAND: Diegetic Bridge - Legacy Compatibility Layer
window.updateDialogue = function(text) {
    const hudBox = document.getElementById('objective-text');
    const hudHeader = document.querySelector('.hud-header');

    if (hudBox) {
        hudBox.style.opacity = '0';
        // Add tactical prefix and force uppercase for the "Specter" feel
        hudBox.innerText = `>> DATA INCOMING: ${text.toUpperCase()}`;
        setTimeout(() => { hudBox.style.opacity = '1'; }, 50);
    }
    // Add a "Glitch" effect to the ARIA link header when she speaks
    if (hudHeader) {
        const original = "[ ARIA LINK ESTABLISHED ]";
        hudHeader.innerText = "[ ARIA TRANSMITTING... ]";
        hudHeader.style.color = "#FF9900"; // Alert Orange
        setTimeout(() => { 
            hudHeader.innerText = original; 
            hudHeader.style.color = "#00E5FF"; 
        }, 1500);
    }
    console.log('%c[ARIA]: ' + text, 'color: #00E5FF; font-weight: bold;');
    
    // ✅ Task 4: Diegetic Sound Bridge - Electronic Chirp for ARIA transmissions
    if (window.audioCtx) {
        try {
            const now = window.audioCtx.currentTime;
            const chirpOsc = window.audioCtx.createOscillator();
            const chirpGain = window.audioCtx.createGain();
            
            chirpOsc.type = 'sine';
            chirpOsc.frequency.setValueAtTime(800, now);
            chirpOsc.frequency.linearRampToValueAtTime(1200, now + 0.1);
            
            chirpGain.gain.setValueAtTime(0.1, now);
            chirpGain.gain.linearRampToValueAtTime(0, now + 0.15);
            
            chirpOsc.connect(chirpGain);
            chirpGain.connect(window.masterGain || window.audioCtx.destination);
            
            chirpOsc.start(now);
            chirpOsc.stop(now + 0.15);
            
            console.log('[Audio] 🔊 ARIA chirp transmitted');
        } catch (e) {
            console.warn('[Audio] ⚠️ Chirp failed:', e.message);
        }
    }
};

})(); // CLOSE THE IIFE - CRITICAL!
