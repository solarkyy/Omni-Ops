// OMNI-OPS - Main Game Engine
// Phase 7 Ultimate Edition

console.log('[OMNI-OPS] Main engine loading...');

// ============================================================================
// GLOBAL STATE
// ============================================================================
const GAME = {
    mode: null, // 'SINGLE', 'HOST', 'CLIENT'
    scene: null,
    camera: null,
    renderer: null,
    player: null,
    world: null,
    npcs: [],
    buildings: [],
    clock: 0, // Game time in hours (0-24)
    paused: false,
    editorActive: false,
    pipboyOpen: false,
    inDialogue: false
};

// Player stats
const PLAYER = {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    ammo: 30,
    ammoReserve: 90,
    fireMode: 'SEMI',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0 }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    console.log('[Core Game] DOM loaded, initializing...');
    initializeGame();
});

function initializeGame() {
    console.log('[Core Game] Initializing game systems...');
    
    // Show loading screen
    showLoadingProgress(0, 'Initializing core systems...');
    
    // Simulate module loading
    const modules = [
        'Core Game Engine',
        'Three.js Renderer',
        'Physics System',
        'Input Controller',
        'UI System',
        'World Generator',
        'NPC System',
        'Audio System'
    ];
    
    let loaded = 0;
    modules.forEach((module, index) => {
        setTimeout(() => {
            loaded++;
            const progress = (loaded / modules.length) * 100;
            showLoadingProgress(progress, `Loading ${module}...`);
            addModuleToList(module, loaded === modules.length);
            
            if (loaded === modules.length) {
                setTimeout(() => {
                    hideLoadingScreen();
                    showMainMenu();
                }, 500);
            }
        }, (index + 1) * 200);
    });
    
    // Bind menu buttons
    bindMenuButtons();
    
    // Initialize keybinds
    initializeControls();
}

function showLoadingProgress(percent, status) {
    const bar = document.getElementById('loading-bar');
    const statusText = document.getElementById('loading-status');
    if (bar) bar.style.width = percent + '%';
    if (statusText) statusText.textContent = status;
}

function addModuleToList(module, isLast) {
    const list = document.getElementById('module-list');
    if (!list) return;
    
    const item = document.createElement('div');
    item.className = 'module-item loaded';
    item.textContent = `✓ ${module}`;
    list.appendChild(item);
}

function hideLoadingScreen() {
    const loading = document.getElementById('loading-screen');
    if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.style.display = 'none', 300);
    }
}

function showMainMenu() {
    const overlay = document.getElementById('menu-overlay');
    const mainScreen = document.getElementById('main-screen');
    if (overlay) overlay.style.display = 'flex';
    if (mainScreen) mainScreen.style.display = 'block';
}

// ============================================================================
// MENU SYSTEM
// ============================================================================
function bindMenuButtons() {
    console.log('[Core Game] Binding menu buttons...');
    
    // Main menu buttons
    const btnStory = document.getElementById('btn-story-start');
    const btnSingle = document.getElementById('btn-single');
    const btnShowHost = document.getElementById('btn-show-host');
    const btnShowJoin = document.getElementById('btn-show-join');
    
    if (btnStory) btnStory.addEventListener('click', () => startStoryMode());
    if (btnSingle) btnSingle.addEventListener('click', () => startMode('SINGLE'));
    if (btnShowHost) btnShowHost.addEventListener('click', () => showHostScreen());
    if (btnShowJoin) btnShowJoin.addEventListener('click', () => showJoinScreen());
    
    // Host screen buttons
    const btnDeployHost = document.getElementById('btn-deploy-host');
    const btnHostBack = document.getElementById('btn-host-back');
    if (btnDeployHost) btnDeployHost.addEventListener('click', () => deployHost());
    if (btnHostBack) btnHostBack.addEventListener('click', () => showMainMenu());
    
    // Join screen buttons
    const btnDeployJoin = document.getElementById('btn-deploy-join');
    const btnJoinBack = document.getElementById('btn-join-back');
    if (btnDeployJoin) btnDeployJoin.addEventListener('click', () => deployJoin());
    if (btnJoinBack) btnJoinBack.addEventListener('click', () => showMainMenu());
    
    // Lobby buttons
    const btnStartMatch = document.getElementById('btn-start-match');
    const btnLobbyBack = document.getElementById('btn-lobby-back');
    if (btnStartMatch) btnStartMatch.addEventListener('click', () => startMatch());
    if (btnLobbyBack) btnLobbyBack.addEventListener('click', () => quitLobby());
}

function startStoryMode() {
    console.log('[Core Game] Starting story mode...');
    // For now, just launch the game directly
    // TODO: Implement story intro cutscene
    hideMenus();
    launchGame();
}

function startMode(mode) {
    console.log('[Core Game] Starting mode:', mode);
    GAME.mode = mode;
    hideMenus();
    launchGame();
}

function showHostScreen() {
    hideAllMenuScreens();
    const hostScreen = document.getElementById('host-screen');
    if (hostScreen) hostScreen.style.display = 'block';
    
    // Generate room ID
    const roomId = generateRoomId();
    const roomEl = document.getElementById('host-room-id');
    if (roomEl) roomEl.textContent = roomId;
}

function showJoinScreen() {
    hideAllMenuScreens();
    const joinScreen = document.getElementById('join-screen');
    if (joinScreen) joinScreen.style.display = 'block';
}

function hideAllMenuScreens() {
    const screens = document.querySelectorAll('.menu-screen');
    screens.forEach(s => s.style.display = 'none');
}

function hideMenus() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) overlay.style.display = 'none';
}

function generateRoomId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 4; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

function deployHost() {
    console.log('[Multiplayer] Deploying as host...');
    // TODO: Implement multiplayer host logic
    startMode('HOST');
}

function deployJoin() {
    console.log('[Multiplayer] Joining game...');
    const roomId = document.getElementById('join-room-id')?.value;
    const name = document.getElementById('join-name')?.value;
    console.log('[Multiplayer] Room:', roomId, 'Name:', name);
    // TODO: Implement multiplayer join logic
    startMode('CLIENT');
}

function startMatch() {
    console.log('[Multiplayer] Starting match...');
    launchGame();
}

function quitLobby() {
    console.log('[Core Game] Quitting lobby...');
    showMainMenu();
}

// ============================================================================
// GAME LAUNCH
// ============================================================================
window.launchGame = function() {
    console.log('[Core Game] Launching game...');
    
    try {
        // Initialize Three.js scene
        initializeThreeJS();
        
        // Generate world
        generateWorld();
        
        // Create player
        createPlayer();
        
        // Show UI
        showGameUI();
        
        // Start game loop
        startGameLoop();
        
        console.log('[Core Game] Game launched successfully!');
    } catch (error) {
        console.error('[Core Game] Error launching game:', error);
        alert('Failed to launch game. Check console for details.');
    }
};

function initializeThreeJS() {
    console.log('[Renderer] Initializing Three.js...');
    
    // Create scene
    GAME.scene = new THREE.Scene();
    GAME.scene.background = new THREE.Color(0x87CEEB); // Sky blue
    GAME.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    
    // Create camera
    GAME.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    GAME.camera.position.set(0, 1.6, 5);
    
    // Create renderer
    GAME.renderer = new THREE.WebGLRenderer({ antialias: true });
    GAME.renderer.setSize(window.innerWidth, window.innerHeight);
    GAME.renderer.shadowMap.enabled = true;
    GAME.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add to DOM
    const container = document.getElementById('game-container');
    if (container) {
        container.innerHTML = '';
        container.appendChild(GAME.renderer.domElement);
    }
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    GAME.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    GAME.scene.add(directionalLight);
}

function generateWorld() {
    console.log('[World] Generating world...');
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x228B22,
        roughness: 0.8 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    GAME.scene.add(ground);
    
    // Add some buildings
    for (let i = 0; i < 5; i++) {
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        createBuilding(x, z);
    }
    
    // Add some trees
    for (let i = 0; i < 20; i++) {
        const x = (Math.random() - 0.5) * 150;
        const z = (Math.random() - 0.5) * 150;
        createTree(x, z);
    }
}

function createBuilding(x, z) {
    const width = 5 + Math.random() * 5;
    const height = 5 + Math.random() * 10;
    const depth = 5 + Math.random() * 5;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7 
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    GAME.scene.add(building);
    GAME.buildings.push(building);
}

function createTree(x, z) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    GAME.scene.add(trunk);
    
    // Foliage
    const foliageGeometry = new THREE.SphereGeometry(2, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 4, z);
    foliage.castShadow = true;
    GAME.scene.add(foliage);
}

function createPlayer() {
    console.log('[Player] Creating player...');
    
    // Player is the camera in first-person view
    GAME.player = {
        camera: GAME.camera,
        velocity: new THREE.Vector3(),
        moveSpeed: 8,
        jumpPower: 11,
        onGround: true
    };
    
    PLAYER.position = {
        x: GAME.camera.position.x,
        y: GAME.camera.position.y,
        z: GAME.camera.position.z
    };
}

function showGameUI() {
    const uiLayer = document.getElementById('ui-layer');
    if (uiLayer) uiLayer.style.display = 'block';
    
    updateHUD();
}

function updateHUD() {
    // Health
    const healthEl = document.getElementById('hud-health-value');
    const healthBar = document.getElementById('health-bar');
    if (healthEl) healthEl.textContent = PLAYER.health;
    if (healthBar) healthBar.style.width = (PLAYER.health / PLAYER.maxHealth * 100) + '%';
    
    // Stamina
    const staminaEl = document.getElementById('stamina-value');
    const staminaBar = document.getElementById('stamina-bar');
    if (staminaEl) staminaEl.textContent = Math.floor(PLAYER.stamina);
    if (staminaBar) staminaBar.style.width = (PLAYER.stamina / PLAYER.maxStamina * 100) + '%';
    
    // Ammo
    const ammoCur = document.getElementById('ammo-cur');
    const ammoRes = document.getElementById('ammo-res');
    if (ammoCur) ammoCur.textContent = PLAYER.ammo;
    if (ammoRes) ammoRes.textContent = PLAYER.ammoReserve;
    
    // Fire mode
    const modeText = document.getElementById('mode-text');
    if (modeText) modeText.textContent = PLAYER.fireMode;
    
    // Game clock
    updateGameClock();
}

function updateGameClock() {
    const clockEl = document.getElementById('world-clock');
    if (clockEl) {
        const hours = Math.floor(GAME.clock);
        const minutes = Math.floor((GAME.clock % 1) * 60);
        clockEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
}

function onWindowResize() {
    if (!GAME.camera || !GAME.renderer) return;
    
    GAME.camera.aspect = window.innerWidth / window.innerHeight;
    GAME.camera.updateProjectionMatrix();
    GAME.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================================================
// GAME LOOP
// ============================================================================
let lastTime = performance.now();

function startGameLoop() {
    console.log('[Core Game] Starting game loop...');
    gameLoop();
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
    
    if (GAME.paused || !GAME.renderer) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Update game systems
    updatePlayer(deltaTime);
    updateWorld(deltaTime);
    updateNPCs(deltaTime);
    updateHUD();
    
    // Render
    GAME.renderer.render(GAME.scene, GAME.camera);
}

function updatePlayer(delta) {
    // Stamina regeneration
    if (PLAYER.stamina < PLAYER.maxStamina) {
        PLAYER.stamina = Math.min(PLAYER.maxStamina, PLAYER.stamina + 20 * delta);
    }
}

function updateWorld(delta) {
    // Update game clock
    GAME.clock += delta / 60; // 1 minute per second
    if (GAME.clock >= 24) GAME.clock = 0;
    
    // Update sky color based on time
    updateSkyColor();
}

function updateSkyColor() {
    if (!GAME.scene) return;
    
    const time = GAME.clock;
    let color;
    
    if (time >= 6 && time < 18) {
        // Day: bright blue sky
        color = new THREE.Color(0x87CEEB);
    } else if (time >= 18 && time < 20) {
        // Evening: orange sky
        color = new THREE.Color(0xFF8C42);
    } else if (time >= 20 && time < 22) {
        // Dusk: purple sky
        color = new THREE.Color(0x4B0082);
    } else {
        // Night: dark blue
        color = new THREE.Color(0x191970);
    }
    
    GAME.scene.background = color;
    if (GAME.scene.fog) GAME.scene.fog.color = color;
}

function updateNPCs(delta) {
    // TODO: Implement NPC AI and movement
}

// ============================================================================
// CONTROLS
// ============================================================================
const keys = {};
let mouseMovement = { x: 0, y: 0 };
let pointerLocked = false;

function initializeControls() {
    console.log('[Input] Initializing controls...');
    
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Mouse
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onMouseClick);
    
    // Pointer lock
    document.addEventListener('click', () => {
        if (GAME.renderer && !pointerLocked && !GAME.paused) {
            GAME.renderer.domElement.requestPointerLock();
        }
    });
    
    document.addEventListener('pointerlockchange', () => {
        pointerLocked = document.pointerLockElement === GAME.renderer?.domElement;
    });
}

function onKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    
    // Special keys
    if (e.key === 'Escape') {
        togglePause();
    } else if (e.key === 'F2') {
        toggleEditor();
    } else if (e.key.toLowerCase() === 'i') {
        togglePipboy();
    } else if (e.key.toLowerCase() === 'v') {
        toggleFireMode();
    } else if (e.key.toLowerCase() === 'r') {
        reload();
    }
}

function onKeyUp(e) {
    keys[e.key.toLowerCase()] = false;
}

function onMouseMove(e) {
    if (!pointerLocked || !GAME.camera) return;
    
    const sensitivity = 0.002;
    mouseMovement.x -= e.movementX * sensitivity;
    mouseMovement.y -= e.movementY * sensitivity;
    
    // Limit vertical rotation
    mouseMovement.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseMovement.y));
    
    // Apply rotation
    GAME.camera.rotation.order = 'YXZ';
    GAME.camera.rotation.y = mouseMovement.x;
    GAME.camera.rotation.x = mouseMovement.y;
}

function onMouseClick(e) {
    if (!pointerLocked) return;
    
    if (e.button === 0) { // Left click
        shoot();
    }
}

function shoot() {
    if (PLAYER.ammo <= 0) {
        console.log('[Weapon] Out of ammo!');
        return;
    }
    
    PLAYER.ammo--;
    console.log('[Weapon] Firing! Ammo:', PLAYER.ammo);
    
    // Show hit marker briefly
    showHitMarker();
}

function reload() {
    if (PLAYER.ammo >= 30 || PLAYER.ammoReserve <= 0) return;
    
    const needed = 30 - PLAYER.ammo;
    const available = Math.min(needed, PLAYER.ammoReserve);
    
    PLAYER.ammo += available;
    PLAYER.ammoReserve -= available;
    
    console.log('[Weapon] Reloaded! Ammo:', PLAYER.ammo, '/', PLAYER.ammoReserve);
}

function toggleFireMode() {
    PLAYER.fireMode = PLAYER.fireMode === 'SEMI' ? 'AUTO' : 'SEMI';
    console.log('[Weapon] Fire mode:', PLAYER.fireMode);
}

function showHitMarker() {
    const marker = document.getElementById('hitmarker');
    if (marker) {
        marker.style.opacity = '1';
        setTimeout(() => marker.style.opacity = '0', 100);
    }
}

function togglePause() {
    GAME.paused = !GAME.paused;
    console.log('[Core Game] Paused:', GAME.paused);
    
    if (GAME.paused) {
        document.getElementById('menu-overlay')?.style.display = 'flex';
        document.getElementById('settings-screen')?.style.display = 'block';
    } else {
        document.getElementById('menu-overlay')?.style.display = 'none';
    }
}

function toggleEditor() {
    GAME.editorActive = !GAME.editorActive;
    const editor = document.getElementById('editor-overlay');
    if (editor) {
        editor.classList.toggle('active');
    }
    console.log('[Editor] Active:', GAME.editorActive);
}

window.toggleEditor = toggleEditor;

function togglePipboy() {
    GAME.pipboyOpen = !GAME.pipboyOpen;
    const pipboy = document.getElementById('pipboy-menu');
    if (pipboy) {
        pipboy.classList.toggle('open');
        pipboy.style.display = GAME.pipboyOpen ? 'flex' : 'none';
    }
    console.log('[Pipboy] Open:', GAME.pipboyOpen);
}

window.togglePipboy = togglePipboy;

// ============================================================================
// EDITOR FUNCTIONS
// ============================================================================
window.switchEditorTab = function(tab) {
    console.log('[Editor] Switching to tab:', tab);
    
    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(btn => btn.classList.remove('active'));
    event.target?.classList.add('active');
    
    // Show section
    document.querySelectorAll('.editor-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('section-' + tab)?.classList.add('active');
};

window.editorSpawn = function(type) {
    console.log('[Editor] Spawning:', type);
    // TODO: Implement object spawning
};

window.editorSpawnNPC = function(type) {
    console.log('[Editor] Spawning NPC:', type);
    // TODO: Implement NPC spawning
};

window.editorRegenWorld = function() {
    console.log('[Editor] Regenerating world...');
    // TODO: Implement world regeneration
};

window.editorWeather = function(weather) {
    console.log('[Editor] Setting weather:', weather);
    // TODO: Implement weather system
};

window.editorSetTime = function(time) {
    GAME.clock = parseFloat(time);
    console.log('[Editor] Set time:', time);
};

window.editorApplySettings = function() {
    console.log('[Editor] Applying settings...');
    // TODO: Apply editor settings
};

window.editorSave = function() {
    console.log('[Editor] Saving world...');
    // TODO: Implement save system
};

window.editorLoad = function() {
    console.log('[Editor] Loading world...');
    // TODO: Implement load system
};

window.editorExport = function() {
    console.log('[Editor] Exporting world...');
    // TODO: Implement export system
};

// ============================================================================
// EXPORT GLOBALS
// ============================================================================
window.GAME = GAME;
window.PLAYER = PLAYER;
window.startMode = startMode;

console.log('[OMNI-OPS] Main engine loaded successfully!');
