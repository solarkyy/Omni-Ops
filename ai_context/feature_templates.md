# Feature Implementation Templates

## UI Overlay Template

```javascript
// AUTO-FEATURE [feature_id]: Feature Name
if (!window.yourFeatureUI) {
    window.yourFeatureUI = {
        element: null,
        
        init() {
            if (this.element) return; // Prevent duplicates
            
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 20px;
                left: 20px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #0f0;
                border-radius: 5px;
                color: #0f0;
                font: bold 14px monospace;
                z-index: 9000;
            `;
            container.textContent = 'Feature Ready';
            document.body.appendChild(container);
            this.element = container;
            console.log('[YourFeature] Initialized');
        },
        
        update(data) {
            if (this.element) {
                this.element.textContent = data;
            }
        },
        
        destroy() {
            if (this.element) {
                document.body.removeChild(this.element);
                this.element = null;
            }
        }
    };
    
    // Auto-initialize
    setTimeout(() => window.yourFeatureUI.init(), 500);
    
    // Update loop
    setInterval(() => {
        if (window.player) {
            window.yourFeatureUI.update('Updated: ' + Date.now());
        }
    }, 1000);
}
```

## Physics System Template

```javascript
// AUTO-FEATURE [feature_id]: Physics Feature
if (!window.yourPhysicsSystem) {
    window.yourPhysicsSystem = {
        active: false,
        data: {},
        
        init() {
            console.log('[YourPhysics] System ready');
        },
        
        update(deltaTime) {
            if (!this.active) return;
            
            // Physics calculations here
            if (window.player) {
                // Modify player.velocity, etc.
            }
        },
        
        activate() {
            this.active = true;
            console.log('[YourPhysics] Activated');
        },
        
        deactivate() {
            this.active = false;
            console.log('[YourPhysics] Deactivated');
        }
    };
    
    window.yourPhysicsSystem.init();
}
```

## Collectible/Powerup Template

```javascript
// AUTO-FEATURE [feature_id]: Collectible System
if (!window.collectibleSystem) {
    window.collectibleSystem = {
        items: [],
        
        spawn(position, type = 'default') {
            const geometry = new THREE.SphereGeometry(0.5, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: type === 'health' ? 0x00ff00 : 0x00ffff,
                emissive: type === 'health' ? 0x00ff00 : 0x00ffff,
                emissiveIntensity: 0.5
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.userData = { type, spinSpeed: 2 };
            
            if (window.scene) {
                window.scene.add(mesh);
                this.items.push(mesh);
                console.log('[Collectible] Spawned', type, 'at', position);
            }
        },
        
        update(deltaTime, playerPosition) {
            for (let i = this.items.length - 1; i >= 0; i--) {
                const item = this.items[i];
                
                // Spin animation
                item.rotation.y += item.userData.spinSpeed * deltaTime;
                item.position.y += Math.sin(Date.now() * 0.002) * 0.01;
                
                // Check collection
                const distance = playerPosition.distanceTo(item.position);
                if (distance < 1.5) {
                    this.collect(item.userData.type);
                    window.scene.remove(item);
                    this.items.splice(i, 1);
                }
            }
        },
        
        collect(type) {
            console.log('[Collectible] Collected:', type);
            
            if (type === 'health' && window.player) {
                window.player.health = Math.min(
                    window.player.health + 25,
                    window.player.maxHealth
                );
            } else if (type === 'speed' && window.SETTINGS) {
                const originalSpeed = window.SETTINGS.MAX_SPRINT;
                window.SETTINGS.MAX_SPRINT *= 1.5;
                setTimeout(() => {
                    window.SETTINGS.MAX_SPRINT = originalSpeed;
                }, 10000);
            }
        }
    };
    
    console.log('[Collectible] System initialized');
}
```

## HUD Element Template

```javascript
// AUTO-FEATURE [feature_id]: HUD Element
if (!window.yourHUDElement) {
    window.yourHUDElement = {
        container: null,
        valueDisplay: null,
        
        init() {
            if (this.container) return;
            
            // Container
            this.container = document.createElement('div');
            this.container.style.cssText = `
                position: fixed;
                top: 60px;
                left: 20px;
                width: 200px;
                height: 20px;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #0f0;
                border-radius: 3px;
                overflow: hidden;
                z-index: 9000;
            `;
            
            // Value bar
            const bar = document.createElement('div');
            bar.id = 'your-value-bar';
            bar.style.cssText = `
                height: 100%;
                background: linear-gradient(90deg, #f00, #0f0);
                width: 100%;
                transition: width 0.3s;
            `;
            
            // Text label
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font: bold 11px monospace;
                text-shadow: 0 0 3px black;
                pointer-events: none;
            `;
            label.textContent = 'Value: 100';
            this.valueDisplay = label;
            
            this.container.appendChild(bar);
            this.container.appendChild(label);
            document.body.appendChild(this.container);
            
            console.log('[YourHUD] Initialized');
        },
        
        update(current, max) {
            const bar = document.getElementById('your-value-bar');
            if (bar && this.valueDisplay) {
                const percent = (current / max) * 100;
                bar.style.width = percent + '%';
                this.valueDisplay.textContent = `Value: ${Math.floor(current)}`;
            }
        }
    };
    
    setTimeout(() => window.yourHUDElement.init(), 500);
    setInterval(() => {
        if (window.player) {
            window.yourHUDElement.update(
                window.player.stamina || 100,
                100
            );
        }
    }, 100);
}
```

## Best Practices

1. **Always check for existence**: `if (!window.feature)`
2. **Use unique IDs**: `feature_id` should be descriptive
3. **Add console logs**: Help debugging
4. **Handle null safely**: Check `if (window.player)` before access
5. **Clean up resources**: Remove event listeners, clear intervals
6. **Use setTimeout for init**: Let game fully load first
