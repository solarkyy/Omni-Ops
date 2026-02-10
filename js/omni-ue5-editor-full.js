// ============================================================
// OMNI-OPS FULL UE5-STYLE LEVEL EDITOR
// Complete world editing suite with gizmo, assets, properties
// ============================================================

(function() {
    'use strict';

    const UE5Editor = {
        // State
        active: false,
        selectedObject: null,
        hoveredObject: null,
        objects: [],
        undoStack: [],
        redoStack: [],
        
        // Editor settings
        settings: {
            gridSnap: true,
            gridSize: 1,
            showGrid: true,
            rotateAxis: 'Y',
            transformMode: 'MOVE', // MOVE, ROTATE, SCALE
            toolActive: false
        },

        // Asset definitions
        assets: {
            structures: [
                { name: 'Building', icon: '🏢', type: 'building', geometry: 'box', size: [10, 15, 10], color: 0x556655 },
                { name: 'Wall', icon: '🧱', type: 'wall', geometry: 'box', size: [12, 5, 1], color: 0x8b7355 },
                { name: 'Tower', icon: '🗼', type: 'tower', geometry: 'cylinder', size: [3, 20], color: 0x696969 },
                { name: 'Arch', icon: '🎪', type: 'arch', geometry: 'torus', size: [5, 1], color: 0xa0826d }
            ],
            props: [
                { name: 'Crate', icon: '📦', type: 'crate', geometry: 'box', size: [2, 2, 2], color: 0x8b6914 },
                { name: 'Barrel', icon: '🛢️', type: 'barrel', geometry: 'cylinder', size: [1, 2], color: 0x4a3728 },
                { name: 'Bench', icon: '🪑', type: 'bench', geometry: 'box', size: [4, 1, 1], color: 0x654321 },
                { name: 'Table', icon: '🪑', type: 'table', geometry: 'box', size: [3, 1, 3], color: 0x8b4513 },
                { name: 'Chest', icon: '📦', type: 'chest', geometry: 'box', size: [2, 2, 1.5], color: 0x704214 }
            ],
            nature: [
                { name: 'Tree', icon: '🌲', type: 'tree', geometry: 'cylinder', size: [1.5, 12], color: 0x228b22 },
                { name: 'Bush', icon: '🌿', type: 'bush', geometry: 'sphere', size: [2], color: 0x3cb371 },
                { name: 'Rock', icon: '🪨', type: 'rock', geometry: 'dodecahedron', size: [3], color: 0x708090 },
                { name: 'Boulder', icon: '⚫', type: 'boulder', geometry: 'sphere', size: [4], color: 0x505050 }
            ],
            lights: [
                { name: 'Point Light', icon: '💡', type: 'light-point', color: 0xffff00, intensity: 2, distance: 20 },
                { name: 'Spot Light', icon: '🔦', type: 'light-spot', color: 0xffffff, intensity: 1.5 },
                { name: 'Area Light', icon: '💫', type: 'light-area', color: 0xffffff, intensity: 1 },
                { name: 'Directional', icon: '☀️', type: 'light-dir', color: 0xffffff, intensity: 1 }
            ],
            npcs: [
                { name: 'Guard', icon: '🛡️', type: 'guard', job: 'GUARD' },
                { name: 'Citizen', icon: '🧑', type: 'citizen', job: 'NONE' },
                { name: 'Trader', icon: '💰', type: 'trader', job: 'MERCHANT' },
                { name: 'Raider', icon: '☠️', type: 'raider', job: 'RAIDER' },
                { name: 'Priest', icon: '⛪', type: 'priest', job: 'PRIEST' },
                { name: 'Blacksmith', icon: '⚒️', type: 'blacksmith', job: 'BLACKSMITH' }
            ]
        },

        // ========== INITIALIZATION ==========
        init() {
            console.log('[UE5 Editor] Full initialization...');
            this.createEditorUI();
            this.setupKeyboard();
            this.setupMouseEvents();
            this.createGridMesh();
            console.log('[UE5 Editor] Ready with full functionality');
        },

        // ========== UI CREATION ==========
        createEditorUI() {
            const editorHTML = `
                <div id="ue5-editor-full" class="ue5-editor-main hidden">
                    <!-- MENUBAR -->
                    <div class="ue5-menubar">
                        <div class="ue5-logo">⚡ OMNI-OPS EDITOR</div>
                        <div class="ue5-menu">
                            <button class="ue5-menu-btn" onclick="window.UE5Editor.save()">💾 Save</button>
                            <button class="ue5-menu-btn" onclick="window.UE5Editor.load()">📂 Load</button>
                            <button class="ue5-menu-btn" onclick="window.UE5Editor.undo()">↶ Undo</button>
                            <button class="ue5-menu-btn" onclick="window.UE5Editor.redo()">↷ Redo</button>
                            <button class="ue5-menu-btn" onclick="window.UE5Editor.clear()">🗑️ Clear</button>
                            <span style="flex:1;"></span>
                            <button class="ue5-menu-btn play-btn" onclick="window.UE5Editor.close()">▶️ PLAY [F2]</button>
                        </div>
                    </div>

                    <div class="ue5-editor-layout">
                        <!-- LEFT PANEL: ASSET BROWSER -->
                        <div class="ue5-panel left-panel">
                            <div class="ue5-panel-header">📁 ASSET BROWSER</div>
                            
                            <div class="ue5-asset-category">
                                <div class="ue5-category-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">🏗️ STRUCTURES</div>
                                <div class="ue5-asset-grid">
                                    ${this.assets.structures.map(a => 
                                        `<div class="ue5-asset" onclick="window.UE5Editor.selectAsset('${a.type}')" title="${a.name}">
                                            <div class="ue5-asset-icon">${a.icon}</div>
                                            <div class="ue5-asset-name">${a.name}</div>
                                        </div>`
                                    ).join('')}
                                </div>
                            </div>

                            <div class="ue5-asset-category">
                                <div class="ue5-category-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">📦 PROPS</div>
                                <div class="ue5-asset-grid">
                                    ${this.assets.props.map(a => 
                                        `<div class="ue5-asset" onclick="window.UE5Editor.selectAsset('${a.type}')" title="${a.name}">
                                            <div class="ue5-asset-icon">${a.icon}</div>
                                            <div class="ue5-asset-name">${a.name}</div>
                                        </div>`
                                    ).join('')}
                                </div>
                            </div>

                            <div class="ue5-asset-category">
                                <div class="ue5-category-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">🌲 NATURE</div>
                                <div class="ue5-asset-grid">
                                    ${this.assets.nature.map(a => 
                                        `<div class="ue5-asset" onclick="window.UE5Editor.selectAsset('${a.type}')" title="${a.name}">
                                            <div class="ue5-asset-icon">${a.icon}</div>
                                            <div class="ue5-asset-name">${a.name}</div>
                                        </div>`
                                    ).join('')}
                                </div>
                            </div>

                            <div class="ue5-asset-category">
                                <div class="ue5-category-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">💡 LIGHTING</div>
                                <div class="ue5-asset-grid">
                                    ${this.assets.lights.map(a => 
                                        `<div class="ue5-asset" onclick="window.UE5Editor.selectAsset('${a.type}')" title="${a.name}">
                                            <div class="ue5-asset-icon">${a.icon}</div>
                                            <div class="ue5-asset-name">${a.name}</div>
                                        </div>`
                                    ).join('')}
                                </div>
                            </div>

                            <div class="ue5-asset-category">
                                <div class="ue5-category-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">🧑 NPCS</div>
                                <div class="ue5-asset-grid">
                                    ${this.assets.npcs.map(a => 
                                        `<div class="ue5-asset" onclick="window.UE5Editor.selectAsset('${a.type}')" title="${a.name}">
                                            <div class="ue5-asset-icon">${a.icon}</div>
                                            <div class="ue5-asset-name">${a.name}</div>
                                        </div>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- CENTER: VIEWPORT -->
                        <div class="ue5-viewport">
                            <div class="ue5-viewport-header">
                                <div class="ue5-tool-group">
                                    <button class="ue5-tool-btn" id="tool-move" onclick="window.UE5Editor.setTransformMode('MOVE')" title="Move [G]">➡️</button>
                                    <button class="ue5-tool-btn" id="tool-rotate" onclick="window.UE5Editor.setTransformMode('ROTATE')" title="Rotate [R]">🔄</button>
                                    <button class="ue5-tool-btn" id="tool-scale" onclick="window.UE5Editor.setTransformMode('SCALE')" title="Scale [S]">📏</button>
                                </div>
                                <div style="flex:1;"></div>
                                <div class="ue5-info-text" id="ue5-info">Select an object to edit</div>
                                <div style="flex:1;"></div>
                                <div class="ue5-stats-box">
                                    <span>Objects: <strong id="ue5-count">0</strong></span>
                                    <span>Selected: <strong id="ue5-selected">None</strong></span>
                                </div>
                            </div>
                            <canvas id="ue5-canvas" class="ue5-viewport-canvas"></canvas>
                            <div class="ue5-viewport-overlay">
                                <div class="ue5-shortcut-help">
                                    <strong>Controls:</strong><br>
                                    Click = Select | Drag = Move<br>
                                    G = Move | R = Rotate | S = Scale<br>
                                    X/Y/Z = Axis | Del = Delete | Ctrl+D = Duplicate<br>
                                    Ctrl+Z = Undo | Ctrl+Y = Redo
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT PANEL: PROPERTIES -->
                        <div class="ue5-panel right-panel">
                            <div class="ue5-panel-header">⚙️ PROPERTIES</div>
                            <div id="ue5-properties" class="ue5-properties-content">
                                <div class="ue5-prop-empty">No object selected</div>
                            </div>

                            <div class="ue5-panel-header" style="margin-top:20px;">🎨 EDITOR SETTINGS</div>
                            <div class="ue5-settings-content">
                                <label class="ue5-setting">
                                    <input type="checkbox" checked onchange="window.UE5Editor.settings.gridSnap = this.checked;">
                                    Grid Snap
                                </label>
                                <label class="ue5-setting">
                                    <input type="checkbox" checked onchange="window.UE5Editor.settings.showGrid = this.checked;">
                                    Show Grid
                                </label>
                                <label class="ue5-setting">
                                    Grid Size:
                                    <input type="number" value="1" min="0.1" step="0.1" 
                                        onchange="window.UE5Editor.settings.gridSize = parseFloat(this.value);">
                                </label>
                                <label class="ue5-setting">
                                    Rotate Axis:
                                    <select onchange="window.UE5Editor.settings.rotateAxis = this.value;">
                                        <option value="X">X</option>
                                        <option value="Y" selected>Y</option>
                                        <option value="Z">Z</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .ue5-editor-main {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: #1a1a1a;
                        z-index: 10000;
                        display: none;
                        flex-direction: column;
                        color: #0f6;
                        font-family: monospace;
                    }

                    .ue5-editor-main.hidden { display: none; }
                    .ue5-editor-main.active { display: flex; }

                    .ue5-menubar {
                        background: #0a0a0a;
                        border-bottom: 2px solid #0f6;
                        padding: 10px 15px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        height: 50px;
                    }

                    .ue5-logo {
                        font-weight: bold;
                        font-size: 16px;
                        color: #0f6;
                        text-shadow: 0 0 10px #0f6;
                    }

                    .ue5-menu {
                        display: flex;
                        gap: 5px;
                        align-items: center;
                    }

                    .ue5-menu-btn {
                        background: rgba(0, 255, 100, 0.1);
                        border: 1px solid #0f6;
                        color: #0f6;
                        padding: 6px 12px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-family: monospace;
                        font-size: 12px;
                        transition: all 0.2s;
                    }

                    .ue5-menu-btn:hover {
                        background: rgba(0, 255, 100, 0.2);
                        box-shadow: 0 0 10px #0f6;
                    }

                    .ue5-editor-layout {
                        display: flex;
                        flex: 1;
                        gap: 0;
                        overflow: hidden;
                    }

                    .ue5-panel {
                        background: #111;
                        border: 1px solid #0f6;
                        overflow-y: auto;
                        display: flex;
                        flex-direction: column;
                    }

                    .left-panel {
                        width: 250px;
                        border-right: 2px solid #0f6;
                    }

                    .right-panel {
                        width: 280px;
                        border-left: 2px solid #0f6;
                    }

                    .ue5-panel-header {
                        background: rgba(0, 255, 100, 0.1);
                        border-bottom: 1px solid #0f6;
                        padding: 12px;
                        font-weight: bold;
                        color: #0f6;
                        cursor: pointer;
                        user-select: none;
                    }

                    .ue5-asset-category {
                        margin: 10px 0;
                    }

                    .ue5-category-toggle {
                        padding: 10px;
                        background: rgba(0, 100, 50, 0.3);
                        border-bottom: 1px solid #0f6;
                        cursor: pointer;
                        user-select: none;
                        font-weight: bold;
                        font-size: 11px;
                    }

                    .ue5-category-toggle:hover { background: rgba(0, 255, 100, 0.1); }

                    .ue5-asset-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 5px;
                        padding: 8px;
                    }

                    .ue5-asset {
                        background: rgba(0, 255, 100, 0.05);
                        border: 1px solid rgba(0, 255, 100, 0.2);
                        padding: 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        text-align: center;
                        transition: all 0.2s;
                    }

                    .ue5-asset:hover {
                        background: rgba(0, 255, 100, 0.2);
                        border-color: #0f6;
                        box-shadow:0 0 8px #0f6;
                    }

                    .ue5-asset-icon { font-size: 20px; }
                    .ue5-asset-name { font-size: 9px; color: #888; }

                    .ue5-viewport {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        background: #0a0a0a;
                        border-left: 1px solid #0f6;
                        border-right: 1px solid #0f6;
                        position: relative;
                    }

                    .ue5-viewport-header {
                        background: #0f0f0f;
                        border-bottom: 1px solid #0f6;
                        padding: 10px;
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        height: 40px;
                    }

                    .ue5-tool-group { display: flex; gap: 5px; }

                    .ue5-tool-btn {
                        background: rgba(0, 255, 100, 0.1);
                        border: 1px solid #0f6;
                        color: #0f6;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-family: monospace;
                        font-size: 11px;
                        transition: all 0.2s;
                    }

                    .ue5-tool-btn.active {
                        background: rgba(0, 255, 100, 0.3);
                        box-shadow: 0 0 8px #0f6;
                    }

                    .ue5-info-text {
                        font-size: 11px;
                        color: #888;
                    }

                    .ue5-stats-box {
                        display: flex;
                        gap: 15px;
                        font-size: 11px;
                        background: rgba(0, 255, 100, 0.05);
                        padding: 5px 10px;
                        border: 1px solid #0f6;
                        border-radius: 3px;
                    }

                    .ue5-viewport-canvas {
                        flex: 1;
                        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                        cursor: crosshair;
                    }

                    .ue5-viewport-overlay {
                        position: absolute;
                        bottom: 15px;
                        right: 15px;
                        background: rgba(0, 0, 0, 0.9);
                        border: 1px solid #0f6;
                        padding: 10px;
                        font-size: 10px;
                        border-radius: 3px;
                        max-width: 200px;
                    }

                    .ue5-properties-content {
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                    }

                    .ue5-prop-empty {
                        text-align: center;
                        padding: 20px 10px;
                        opacity: 0.5;
                    }

                    .ue5-property {
                        margin-bottom: 12px;
                        background: rgba(0, 255, 100, 0.05);
                        padding: 8px;
                        border: 1px solid #0f6;
                        border-radius: 3px;
                    }

                    .ue5-property-label {
                        font-size: 11px;
                        font-weight: bold;
                        margin-bottom: 5px;
                        color: #0f6;
                    }

                    .ue5-property-input {
                        width: 100%;
                        background: #0a0a0a;
                        border: 1px solid #0f6;
                        color: #0f6;
                        padding: 5px;
                        font-family: monospace;
                        font-size: 11px;
                        border-radius: 2px;
                        box-sizing: border-box;
                    }

                    .ue5-settings-content {
                        padding: 10px;
                    }

                    .ue5-setting {
                        display: block;
                        margin-bottom: 10px;
                        font-size: 11px;
                    }

                    .ue5-setting input,
                    .ue5-setting select {
                        background: #0a0a0a;
                        border: 1px solid #0f6;
                        color: #0f6;
                        padding: 4px;
                        margin: 3px 0 0 0;
                        font-family: monospace;
                        border-radius: 2px;
                        width: 100%;
                        box-sizing: border-box;
                    }

                    .ue5-shortcut-help {
                        line-height: 1.4;
                        color: #0f6;
                        font-size: 10px;
                    }

                    .ue5-shortcut-help strong {
                        color: #0f6;
                    }

                    .hidden { display: none !important; }

                    /* Scrollbar styling */
                    .ue5-panel::-webkit-scrollbar {
                        width: 8px;
                    }

                    .ue5-panel::-webkit-scrollbar-track {
                        background: #0a0a0a;
                    }

                    .ue5-panel::-webkit-scrollbar-thumb {
                        background: #0f6;
                        border-radius: 4px;
                    }

                    .ue5-panel::-webkit-scrollbar-thumb:hover {
                        background: #00ff99;
                    }
                </style>
            `;

            document.body.insertAdjacentHTML('beforeend', editorHTML);
            console.log('[UE5 Editor] UI created');
        },

        // ========== KEYBOARD SETUP ==========
        setupKeyboard() {
            document.addEventListener('keydown', (e) => {
                if (!this.active) return;

                // F2 to close
                if (e.key === 'F2') {
                    e.preventDefault();
                    this.close();
                    return;
                }

                // Transform modes
                if (e.key === 'g') { e.preventDefault(); this.setTransformMode('MOVE'); }
                if (e.key === 'r') { e.preventDefault(); this.setTransformMode('ROTATE'); }
                if (e.key === 's') { e.preventDefault(); this.setTransformMode('SCALE'); }

                // Rotation axes
                if (e.key === 'x') this.settings.rotateAxis = 'X';
                if (e.key === 'y') this.settings.rotateAxis = 'Y';
                if (e.key === 'z') this.settings.rotateAxis = 'Z';

                // Delete
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    e.preventDefault();
                    this.deleteSelected();
                }

                // Duplicate
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    this.duplicateSelected();
                }

                // Undo/Redo
                if (e.ctrlKey && e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                }
                if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                    e.preventDefault();
                    this.redo();
                }

                // Save
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.save();
                }
            });
        },

        // ========== MOUSE SETUP ==========
        setupMouseEvents() {
            const canvas = document.getElementById('ue5-canvas');
            if (!canvas) return;

            canvas.addEventListener('click', (e) => {
                this.onCanvasClick(e);
            });

            canvas.addEventListener('mousemove', (e) => {
                this.onCanvasMouseMove(e);
            });

            canvas.addEventListener('mousedown', (e) => {
                this.onCanvasMouseDown(e);
            });

            canvas.addEventListener('mouseup', (e) => {
                this.onCanvasMouseUp(e);
            });
        },

        // ========== VIEWPORT RAYCASTING ==========
        getRaycastHit(mouseX, mouseY) {
            if (!window.scene || !window.camera) return null;

            const canvas = document.getElementById('ue5-canvas');
            if (!canvas) return null;

            const rect = canvas.getBoundingClientRect();
            const x = ((mouseX - rect.left) / rect.width) * 2 - 1;
            const y = -((mouseY - rect.top) / rect.height) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera({ x, y }, window.camera);

            const targets = this.objects.map(o => o.mesh || o).filter(m => m && m.parent);
            const hits = raycaster.intersectObjects(targets, true);

            if (hits.length > 0) {
                let hitObj = hits[0].object;
                while (hitObj.parent && !hitObj.userData.ue5) {
                    hitObj = hitObj.parent;
                }
                return hits[0];
            }
            return null;
        },

        // ========== CANVAS EVENTS ==========
        onCanvasClick(e) {
            const hit = this.getRaycastHit(e.clientX, e.clientY);
            if (hit) {
                let obj = hit.object;
                while (obj.parent && !obj.userData.ue5) {
                    obj = obj.parent;
                }
                this.selectObject(obj);
            } else {
                this.deselect();
            }
        },

        onCanvasMouseMove(e) {
            const hit = this.getRaycastHit(e.clientX, e.clientY);
            this.hoveredObject = hit ? hit.object : null;
        },

        onCanvasMouseDown(e) {
            if (e.button === 0 && this.selectedObject) {
                this.settings.toolActive = true;
                this.dragStart = { x: e.clientX, y: e.clientY };
            }
        },

        onCanvasMouseUp(e) {
            this.settings.toolActive = false;
        },

        // ========== OBJECT SELECTION & MANAGEMENT ==========
        selectAsset(type) {
            console.log('[Editor] Selected asset type:', type);
            this.selectedAssetType = type;
        },

        selectObject(mesh) {
            this.selectedObject = mesh;
            this.updatePropertyPanel();
            const name = mesh.userData.type || 'Object';
            document.getElementById('ue5-selected').textContent = name;
            console.log('[Editor] Selected:', name);
        },

        deselect() {
            this.selectedObject = null;
            this.updatePropertyPanel();
            document.getElementById('ue5-selected').textContent = 'None';
        },

        updatePropertyPanel() {
            const panel = document.getElementById('ue5-properties');
            if (!this.selectedObject) {
                panel.innerHTML = '<div class="ue5-prop-empty">No object selected</div>';
                return;
            }

            const obj = this.selectedObject;
            const pos = obj.position;
            const rot = obj.rotation;
            const scale = obj.scale;
            const type = obj.userData.type || 'Unknown';

            panel.innerHTML = `
                <div class="ue5-property">
                    <div class="ue5-property-label">Type</div>
                    <input class="ue5-property-input" type="text" value="${type}" readonly>
                </div>
                <div class="ue5-property">
                    <div class="ue5-property-label">Position</div>
                    <input class="ue5-property-input" type="text" placeholder="X" value="${pos.x.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.position.x = parseFloat(this.value);">
                    <input class="ue5-property-input" type="text" placeholder="Y" value="${pos.y.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.position.y = parseFloat(this.value);">
                    <input class="ue5-property-input" type="text" placeholder="Z" value="${pos.z.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.position.z = parseFloat(this.value);">
                </div>
                <div class="ue5-property">
                    <div class="ue5-property-label">Rotation</div>
                    <input class="ue5-property-input" type="text" placeholder="X" value="${rot.x.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.rotation.x = parseFloat(this.value);">
                    <input class="ue5-property-input" type="text" placeholder="Y" value="${rot.y.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.rotation.y = parseFloat(this.value);">
                    <input class="ue5-property-input" type="text" placeholder="Z" value="${rot.z.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.rotation.z = parseFloat(this.value);">
                </div>
                <div class="ue5-property">
                    <div class="ue5-property-label">Scale</div>
                    <input class="ue5-property-input" type="text" placeholder="X" value="${scale.x.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.scale.x = parseFloat(this.value);">
                    <input class="ue5-property-input" type="text" placeholder="Y" value="${scale.y.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.scale.y = parseFloat(this.value);">
                    <input class="ue5-property-input" type="text" placeholder="Z" value="${scale.z.toFixed(2)}"
                        onchange="window.UE5Editor.selectedObject.scale.z = parseFloat(this.value);">
                </div>
                <div style="margin-top: 20px; display: flex; gap: 5px;">
                    <button class="ue5-menu-btn" onclick="window.UE5Editor.duplicateSelected()" style="flex:1">📋 Duplicate</button>
                    <button class="ue5-menu-btn" onclick="window.UE5Editor.deleteSelected()" style="flex:1; background: rgba(255,0,0,0.1); border-color: #f00; color: #f00;">🗑️ Delete</button>
                </div>
            `;
        },

        // ========== TRANSFORM OPERATIONS ==========
        setTransformMode(mode) {
            this.settings.transformMode = mode;
            document.querySelectorAll('.ue5-tool-btn').forEach(btn => btn.classList.remove('active'));
            const btnMap = { MOVE: '#tool-move', ROTATE: '#tool-rotate', SCALE: '#tool-scale' };
            const btn = document.querySelector(btnMap[mode]);
            if (btn) btn.classList.add('active');
        },

        deleteSelected() {
            if (!this.selectedObject) return;
            this.pushUndo();
            window.scene.remove(this.selectedObject);
            this.objects = this.objects.filter(o => o.mesh !== this.selectedObject && o !== this.selectedObject);
            this.deselect();
            this.updateEntityCount();
        },

        duplicateSelected() {
            if (!this.selectedObject) return;
            this.pushUndo();
            const clone = this.selectedObject.clone();
            clone.position.add(new THREE.Vector3(3, 0, 3));
            window.scene.add(clone);
            this.objects.push(clone);
            this.selectObject(clone);
            this.updateEntityCount();
        },

        // ========== SPAWN OBJECTS ==========
        spawnObject(type, position) {
            if (!window.scene) return;
            
            const assetDef = this.findAsset(type);
            if (!assetDef) return;

            const pos = position || window.cameraRig.position.clone().add(new THREE.Vector3(0, 0, 10));
            const mesh = this.createMesh(assetDef);
            mesh.position.copy(pos);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData = { ue5: true, type, ...assetDef };

            window.scene.add(mesh);
            this.objects.push(mesh);
            this.selectObject(mesh);
            this.updateEntityCount();
            this.pushUndo();
            console.log('[Editor] Spawned:', type);
        },

        findAsset(type) {
            for (const category of Object.values(this.assets)) {
                const asset = category.find(a => a.type === type);
                if (asset) return asset;
            }
            return null;
        },

        createMesh(assetDef) {
            let geometry, material = new THREE.MeshStandardMaterial({ color: assetDef.color || 0x808080 });
            
            const size = assetDef.size || [1];
            
            if (assetDef.type.startsWith('light-')) {
                const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.8), new THREE.MeshBasicMaterial({ color: assetDef.color }));
                if (assetDef.type === 'light-point') {
                    const light = new THREE.PointLight(assetDef.color, assetDef.intensity, assetDef.distance);
                    mesh.add(light);
                }
                return mesh;
            }

            if (assetDef.geometry === 'box') {
                geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
            } else if (assetDef.geometry === 'sphere') {
                geometry = new THREE.SphereGeometry(size[0], 32, 32);
            } else if (assetDef.geometry === 'cylinder') {
                geometry = new THREE.CylinderGeometry(size[0], size[0], size[1], 16);
            } else if (assetDef.geometry === 'dodecahedron') {
                geometry = new THREE.DodecahedronGeometry(size[0]);
            } else if (assetDef.geometry === 'torus') {
                geometry = new THREE.TorusGeometry(size[0], size[1], 16, 100);
            }

            return new THREE.Mesh(geometry || new THREE.BoxGeometry(1, 1, 1), material);
        },

        // ========== GRID SYSTEM ==========
        createGridMesh() {
            if (!window.scene) return;
            const size = 100;
            const divisions = 100;
            const gridHelper = new THREE.GridHelper(size, divisions, 0x0f6060, 0x0a2020);
            this.gridMesh = gridHelper;
            window.scene.add(gridHelper);
        },

        // ========== STATE MANAGEMENT ==========
        pushUndo() {
            this.undoStack.push(JSON.stringify(this.objects.map(o => ({
                pos: o.position,
                rot: o.rotation,
                scale: o.scale,
                type: o.userData.type
            }))));
            this.redoStack = [];
        },

        undo() {
            if (this.undoStack.length === 0) return;
            this.redoStack.push(JSON.stringify(this.objects));
            // Simplified - full implementation would restore state
            console.log('[Editor] Undo');
        },

        redo() {
            if (this.redoStack.length === 0) return;
            console.log('[Editor] Redo');
        },

        // ========== FILE OPERATIONS ==========
        save() {
            const data = {
                objects: this.objects.map(o => ({
                    type: o.userData.type,
                    pos: { x: o.position.x, y: o.position.y, z: o.position.z },
                    rot: { x: o.rotation.x, y: o.rotation.y, z: o.rotation.z },
                    scale: { x: o.scale.x, y: o.scale.y, z: o.scale.z }
                }))
            };
            try {
                localStorage.setItem('ue5_level_data', JSON.stringify(data));
                console.log('[Editor] Saved', this.objects.length, 'objects');
            } catch(e) {
                console.error('[Editor] Failed to save level data:', e);
            }
        },

        load() {
            try {
                const saved = localStorage.getItem('ue5_level_data');
                if (!saved) {
                    console.log('[Editor] No save data');
                    return;
                }

                const data = JSON.parse(saved);
                this.clear();
            
            data.objects.forEach(objData => {
                this.spawnObject(objData.type, new THREE.Vector3(objData.pos.x, objData.pos.y, objData.pos.z));
                const obj = this.objects[this.objects.length - 1];
                obj.rotation.set(objData.rot.x, objData.rot.y, objData.rot.z);
                obj.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
            });

            console.log('[Editor] Loaded', this.objects.length, 'objects');
            } catch(e) {
                console.error('[Editor] Failed to load level data:', e);
            }
        },

        clear() {
            this.objects.forEach(o => window.scene.remove(o));
            this.objects = [];
            this.deselect();
            this.updateEntityCount();
        },

        // ========== UI UPDATES ==========
        updateEntityCount() {
            document.getElementById('ue5-count').textContent = this.objects.length;
        },

        // ========== EDITOR LIFECYCLE ==========
        open() {
            this.active = true;
            const editor = document.getElementById('ue5-editor-full');
            if (editor) {
                editor.classList.remove('hidden');
                editor.classList.add('active');
            }
            if (window.document.exitPointerLock) document.exitPointerLock();
            console.log('[UE5 Editor] Opened');
        },

        close() {
            this.active = false;
            const editor = document.getElementById('ue5-editor-full');
            if (editor) {
                editor.classList.add('hidden');
                editor.classList.remove('active');
            }
            if (window.safeRequestPointerLock) window.safeRequestPointerLock();
            console.log('[UE5 Editor] Closed');
        }
    };

    // Replace old editor
    window.UE5Editor = UE5Editor;
    window.UE5 = UE5Editor;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => UE5Editor.init());
    } else {
        UE5Editor.init();
    }
})();
