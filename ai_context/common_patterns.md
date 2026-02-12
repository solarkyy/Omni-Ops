# Common Implementation Patterns

## Pattern: Health/Status Bar

```javascript
if (!window.statusBarUI) {
    window.statusBarUI = {
        bar: null,
        fill: null,
        text: null,
        
        create(name, color, top) {
            const container = document.createElement('div');
            container.style.cssText = `position:fixed;top:${top}px;left:20px;width:200px;height:25px;background:#222;border:2px solid ${color};border-radius:5px;overflow:hidden;z-index:9000`;
            
            const fill = document.createElement('div');
            fill.id = name + '-fill';
            fill.style.cssText = `height:100%;background:${color};transition:width 0.3s;width:100%`;
            
            const text = document.createElement('div');
            text.id = name + '-text';
            text.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font:bold 12px monospace;text-shadow:0 0 3px #000`;
            
            container.appendChild(fill);
            container.appendChild(text);
            document.body.appendChild(container);
            
            return { container, fill, text };
        },
        
        update(id, current, max, label = '') {
            const fill = document.getElementById(id + '-fill');
            const text = document.getElementById(id + '-text');
            if (fill && text) {
                fill.style.width = ((current / max) * 100) + '%';
                text.textContent = label + Math.floor(current) + ' / ' + max;
            }
        }
    };
}
```

## Pattern: Ability with Cooldown

```javascript
if (!window.dashAbility) {
    window.dashAbility = {
        cooldown: 0,
        maxCooldown: 3.0,
        dashPower: 30,
        
        canUse() {
            return this.cooldown <= 0;
        },
        
        use() {
            if (!this.canUse()) return false;
            
            // Apply dash force
            if (window.player && window.camera) {
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyQuaternion(window.camera.quaternion);
                forward.y = 0;
                forward.normalize();
                forward.multiplyScalar(this.dashPower);
                
                window.player.velocity.add(forward);
                this.cooldown = this.maxCooldown;
                console.log('[Dash] Used!');
                return true;
            }
            return false;
        },
        
        update(deltaTime) {
            if (this.cooldown > 0) {
                this.cooldown -= deltaTime;
            }
        }
    };
    
    // Keybind: Press E to dash
    document.addEventListener('keydown', (e) => {
        if (e.key === 'e' || e.key === 'E') {
            window.dashAbility.use();
        }
    });
}
```

## Pattern: Toggled Feature (On/Off)

```javascript
if (!window.nightVision) {
    window.nightVision = {
        active: false,
        overlay: null,
        
        toggle() {
            this.active = !this.active;
            
            if (this.active) {
                this.enable();
            } else {
                this.disable();
            }
        },
        
        enable() {
            if (!this.overlay) {
                this.overlay = document.createElement('div');
                this.overlay.style.cssText = `
                    position:fixed;
                    top:0;left:0;right:0;bottom:0;
                    background:radial-gradient(circle, transparent 40%, rgba(0,255,0,0.2) 100%);
                    pointer-events:none;
                    z-index:8000;
                `;
                document.body.appendChild(this.overlay);
            }
            console.log('[NightVision] ON');
        },
        
        disable() {
            if (this.overlay) {
                document.body.removeChild(this.overlay);
                this.overlay = null;
            }
            console.log('[NightVision] OFF');
        }
    };
    
    // Press N to toggle
    document.addEventListener('keydown', (e) => {
        if (e.key === 'n' || e.key === 'N') {
            window.nightVision.toggle();
        }
    });
}
```

## Pattern: Timed Buff/Effect

```javascript
if (!window.speedBoost) {
    window.speedBoost = {
        active: false,
        duration: 0,
        multiplier: 1.5,
        
        activate(seconds = 10) {
            if (this.active) return;
            
            this.active = true;
            this.duration = seconds;
            
            if (window.SETTINGS) {
                window.SETTINGS.MAX_SPRINT *= this.multiplier;
            }
            
            console.log('[SpeedBoost] Activated for', seconds, 'seconds');
        },
        
        deactivate() {
            if (!this.active) return;
            
            this.active = false;
            this.duration = 0;
            
            if (window.SETTINGS) {
                window.SETTINGS.MAX_SPRINT /= this.multiplier;
            }
            
            console.log('[SpeedBoost] Expired');
        },
        
        update(deltaTime) {
            if (this.active) {
                this.duration -= deltaTime;
                if (this.duration <= 0) {
                    this.deactivate();
                }
            }
        }
    };
}
```

## Pattern: Spawner System

```javascript
if (!window.enemySpawner) {
    window.enemySpawner = {
        spawnPoints: [],
        enemies: [],
        spawnInterval: 5.0,
        timer: 0,
        
        addSpawnPoint(position) {
            this.spawnPoints.push(position.clone());
        },
        
        spawn() {
            if (this.spawnPoints.length === 0) return;
            
            const point = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            
            // Create enemy mesh
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const enemy = new THREE.Mesh(geometry, material);
            enemy.position.copy(point);
            
            if (window.scene) {
                window.scene.add(enemy);
                this.enemies.push(enemy);
                console.log('[Spawner] Enemy spawned at', point);
            }
        },
        
        update(deltaTime) {
            this.timer += deltaTime;
            if (this.timer >= this.spawnInterval) {
                this.spawn();
                this.timer = 0;
            }
            
            // Update enemy AI here
            this.enemies.forEach(enemy => {
                // Simple AI: move toward player
                if (window.camera) {
                    const direction = new THREE.Vector3();
                    direction.subVectors(window.camera.position, enemy.position);
                    direction.y = 0;
                    direction.normalize();
                    enemy.position.add(direction.multiplyScalar(deltaTime * 2));
                }
            });
        }
    };
    
    // Add some spawn points
    window.enemySpawner.addSpawnPoint(new THREE.Vector3(20, 0, 20));
    window.enemySpawner.addSpawnPoint(new THREE.Vector3(-20, 0, -20));
}
```

## Pattern: Notification System

```javascript
if (!window.notificationSystem) {
    window.notificationSystem = {
        notifications: [],
        
        show(message, duration = 3000, color = '#0f0') {
            const notif = document.createElement('div');
            notif.style.cssText = `
                position:fixed;
                top:${100 + this.notifications.length * 50}px;
                right:20px;
                padding:12px 20px;
                background:rgba(0,0,0,0.9);
                border:2px solid ${color};
                border-radius:5px;
                color:${color};
                font:bold 14px monospace;
                z-index:10000;
                animation: slideIn 0.3s ease-out;
            `;
            notif.textContent = message;
            document.body.appendChild(notif);
            
            this.notifications.push(notif);
            
            setTimeout(() => {
                notif.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    document.body.removeChild(notif);
                    const index = this.notifications.indexOf(notif);
                    if (index > -1) this.notifications.splice(index, 1);
                }, 300);
            }, duration);
        }
    };
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Test notification
    setTimeout(() => {
        window.notificationSystem.show('System Ready!', 2000);
    }, 1000);
}
```

## Pattern: Mini-map / Radar

```javascript
if (!window.miniMap) {
    window.miniMap = {
        canvas: null,
        ctx: null,
        size: 150,
        range: 50,
        
        init() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.size;
            this.canvas.height = this.size;
            this.canvas.style.cssText = `
                position:fixed;
                bottom:20px;
                right:20px;
                border:3px solid #0f0;
                border-radius:50%;
                z-index:9000;
            `;
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d');
        },
        
        draw() {
            if (!this.ctx || !window.camera) return;
            
            const ctx = this.ctx;
            const center = this.size / 2;
            
            // Clear
            ctx.clearRect(0, 0, this.size, this.size);
            
            // Background circle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(center, center, center, 0, Math.PI * 2);
            ctx.fill();
            
            // Player (center dot)
            ctx.fillStyle = '#0f0';
            ctx.beginPath();
            ctx.arc(center, center, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Direction indicator
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(center, center);
            const angle = window.camera.rotation.y;
            ctx.lineTo(
                center + Math.sin(angle) * 15,
                center - Math.cos(angle) * 15
            );
            ctx.stroke();
            
            // Border
            ctx.strokeStyle = '#0f0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center, center, center - 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    };
    
    window.miniMap.init();
    setInterval(() => window.miniMap.draw(), 50);
}
```
