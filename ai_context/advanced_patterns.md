# Advanced Implementation Patterns

## State Machine System

```javascript
// AUTO-FEATURE [state_machine]: Advanced State Machine
if (!window.stateMachine) {
    window.stateMachine = {
        states: {},
        currentState: null,
        context: {},
        
        defineState(name, config) {
            this.states[name] = {
                onEnter: config.onEnter || (() => {}),
                onUpdate: config.onUpdate || (() => {}),
                onExit: config.onExit || (() => {}),
                transitions: config.transitions || {}
            };
        },
        
        setState(name, force = false) {
            if (this.currentState === name && !force) return;
            
            if (this.currentState && this.states[this.currentState]) {
                this.states[this.currentState].onExit(this.context);
            }
            
            this.currentState = name;
            if (this.states[name]) {
                this.states[name].onEnter(this.context);
                console.log('[StateMachine] Entered state:', name);
            }
        },
        
        update(deltaTime) {
            if (!this.currentState || !this.states[this.currentState]) return;
            
            const state = this.states[this.currentState];
            state.onUpdate(deltaTime, this.context);
            
            // Auto-transition check
            for (const [targetState, condition] of Object.entries(state.transitions)) {
                if (typeof condition === 'function' && condition(this.context)) {
                    this.setState(targetState);
                    break;
                }
            }
        }
    };
    
    console.log('[StateMachine] Advanced state system ready');
}
```

## Object Pooling for Performance

```javascript
// AUTO-FEATURE [object_pool]: Object Pooling System
if (!window.objectPool) {
    window.objectPool = {
        pools: {},
        
        createPool(type, factory, initialSize = 10) {
            this.pools[type] = {
                available: [],
                inUse: [],
                factory: factory
            };
            
            for (let i = 0; i < initialSize; i++) {
                this.pools[type].available.push(factory());
            }
            
            console.log('[ObjectPool] Created pool:', type, 'Size:', initialSize);
        },
        
        acquire(type) {
            const pool = this.pools[type];
            if (!pool) return null;
            
            let obj;
            if (pool.available.length > 0) {
                obj = pool.available.pop();
            } else {
                obj = pool.factory();
                console.log('[ObjectPool] Pool exhausted, creating new:', type);
            }
            
            pool.inUse.push(obj);
            return obj;
        },
        
        release(type, obj) {
            const pool = this.pools[type];
            if (!pool) return;
            
            const index = pool.inUse.indexOf(obj);
            if (index > -1) {
                pool.inUse.splice(index, 1);
                pool.available.push(obj);
                
                // Reset object if it has a reset method
                if (obj.reset && typeof obj.reset === 'function') {
                    obj.reset();
                }
            }
        },
        
        getStats(type) {
            const pool = this.pools[type];
            if (!pool) return null;
            
            return {
                available: pool.available.length,
                inUse: pool.inUse.length,
                total: pool.available.length + pool.inUse.length
            };
        }
    };
    
    console.log('[ObjectPool] Pooling system initialized');
}
```

## Event System / Observer Pattern

```javascript
// AUTO-FEATURE [event_system]: Advanced Event System
if (!window.eventBus) {
    window.eventBus = {
        listeners: {},
        eventQueue: [],
        processing: false,
        
        on(event, callback, priority = 0) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            
            this.listeners[event].push({ callback, priority });
            this.listeners[event].sort((a, b) => b.priority - a.priority);
            
            return () => this.off(event, callback);
        },
        
        once(event, callback) {
            const wrapper = (...args) => {
                this.off(event, wrapper);
                callback(...args);
            };
            return this.on(event, wrapper);
        },
        
        off(event, callback) {
            if (!this.listeners[event]) return;
            
            this.listeners[event] = this.listeners[event].filter(
                listener => listener.callback !== callback
            );
        },
        
        emit(event, data = {}) {
            this.eventQueue.push({ event, data, timestamp: Date.now() });
            
            if (!this.processing) {
                this.processQueue();
            }
        },
        
        processQueue() {
            this.processing = true;
            
            while (this.eventQueue.length > 0) {
                const { event, data } = this.eventQueue.shift();
                
                if (this.listeners[event]) {
                    this.listeners[event].forEach(({ callback }) => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error('[EventBus] Error in listener:', event, error);
                        }
                    });
                }
            }
            
            this.processing = false;
        },
        
        clear(event) {
            if (event) {
                delete this.listeners[event];
            } else {
                this.listeners = {};
            }
        }
    };
    
    console.log('[EventBus] Advanced event system ready');
}
```

## Pathfinding (A* Algorithm)

```javascript
// AUTO-FEATURE [pathfinding]: A* Pathfinding System
if (!window.pathfinding) {
    window.pathfinding = {
        grid: null,
        gridSize: 50,
        cellSize: 2,
        
        initGrid(size = 50, cellSize = 2) {
            this.gridSize = size;
            this.cellSize = cellSize;
            this.grid = Array(size).fill(null).map(() => Array(size).fill(0));
            console.log('[Pathfinding] Grid initialized:', size + 'x' + size);
        },
        
        worldToGrid(x, z) {
            const gridX = Math.floor(x / this.cellSize + this.gridSize / 2);
            const gridZ = Math.floor(z / this.cellSize + this.gridSize / 2);
            return { x: gridX, z: gridZ };
        },
        
        gridToWorld(gridX, gridZ) {
            const x = (gridX - this.gridSize / 2) * this.cellSize;
            const z = (gridZ - this.gridSize / 2) * this.cellSize;
            return { x, z };
        },
        
        setObstacle(gridX, gridZ, isObstacle = true) {
            if (gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize) {
                this.grid[gridZ][gridX] = isObstacle ? 1 : 0;
            }
        },
        
        findPath(startX, startZ, endX, endZ) {
            const start = this.worldToGrid(startX, startZ);
            const end = this.worldToGrid(endX, endZ);
            
            const openSet = [start];
            const closedSet = [];
            const cameFrom = {};
            const gScore = {};
            const fScore = {};
            
            const key = (x, z) => `${x},${z}`;
            const heuristic = (x1, z1, x2, z2) => Math.abs(x1 - x2) + Math.abs(z1 - z2);
            
            gScore[key(start.x, start.z)] = 0;
            fScore[key(start.x, start.z)] = heuristic(start.x, start.z, end.x, end.z);
            
            while (openSet.length > 0) {
                openSet.sort((a, b) => fScore[key(a.x, a.z)] - fScore[key(b.x, b.z)]);
                const current = openSet.shift();
                
                if (current.x === end.x && current.z === end.z) {
                    // Reconstruct path
                    const path = [];
                    let curr = current;
                    while (cameFrom[key(curr.x, curr.z)]) {
                        const worldPos = this.gridToWorld(curr.x, curr.z);
                        path.unshift(worldPos);
                        curr = cameFrom[key(curr.x, curr.z)];
                    }
                    return path;
                }
                
                closedSet.push(current);
                
                // Check neighbors
                const neighbors = [
                    { x: current.x + 1, z: current.z },
                    { x: current.x - 1, z: current.z },
                    { x: current.x, z: current.z + 1 },
                    { x: current.x, z: current.z - 1 }
                ];
                
                for (const neighbor of neighbors) {
                    if (neighbor.x < 0 || neighbor.x >= this.gridSize || 
                        neighbor.z < 0 || neighbor.z >= this.gridSize ||
                        this.grid[neighbor.z][neighbor.x] === 1) continue;
                    
                    if (closedSet.some(n => n.x === neighbor.x && n.z === neighbor.z)) continue;
                    
                    const tentativeGScore = gScore[key(current.x, current.z)] + 1;
                    
                    if (!openSet.some(n => n.x === neighbor.x && n.z === neighbor.z)) {
                        openSet.push(neighbor);
                    } else if (tentativeGScore >= gScore[key(neighbor.x, neighbor.z)]) {
                        continue;
                    }
                    
                    cameFrom[key(neighbor.x, neighbor.z)] = current;
                    gScore[key(neighbor.x, neighbor.z)] = tentativeGScore;
                    fScore[key(neighbor.x, neighbor.z)] = tentativeGScore + heuristic(neighbor.x, neighbor.z, end.x, end.z);
                }
            }
            
            return null; // No path found
        }
    };
    
    window.pathfinding.initGrid();
    console.log('[Pathfinding] A* pathfinding ready');
}
```

## Particle System

```javascript
// AUTO-FEATURE [particle_system]: Advanced Particle System
if (!window.particleSystem) {
    window.particleSystem = {
        emitters: [],
        particles: [],
        maxParticles: 1000,
        
        createEmitter(config) {
            const emitter = {
                position: config.position || new THREE.Vector3(),
                rate: config.rate || 10,
                life: config.life || 2,
                velocity: config.velocity || new THREE.Vector3(0, 5, 0),
                velocityVariance: config.velocityVariance || 2,
                size: config.size || 0.2,
                color: config.color || 0xffffff,
                gravity: config.gravity !== undefined ? config.gravity : -9.8,
                timer: 0,
                active: true,
                burst: config.burst || false,
                burstCount: config.burstCount || 50
            };
            
            this.emitters.push(emitter);
            return emitter;
        },
        
        emit(emitter) {
            if (this.particles.length >= this.maxParticles) {
                this.particles.shift(); // Remove oldest
            }
            
            const particle = {
                position: emitter.position.clone(),
                velocity: new THREE.Vector3(
                    emitter.velocity.x + (Math.random() - 0.5) * emitter.velocityVariance,
                    emitter.velocity.y + (Math.random() - 0.5) * emitter.velocityVariance,
                    emitter.velocity.z + (Math.random() - 0.5) * emitter.velocityVariance
                ),
                life: emitter.life,
                maxLife: emitter.life,
                size: emitter.size,
                color: emitter.color,
                gravity: emitter.gravity,
                mesh: null
            };
            
            // Create visual mesh
            if (window.scene) {
                const geometry = new THREE.SphereGeometry(particle.size, 8, 8);
                const material = new THREE.MeshBasicMaterial({ color: particle.color });
                particle.mesh = new THREE.Mesh(geometry, material);
                particle.mesh.position.copy(particle.position);
                window.scene.add(particle.mesh);
            }
            
            this.particles.push(particle);
        },
        
        update(deltaTime) {
            // Update emitters
            for (const emitter of this.emitters) {
                if (!emitter.active) continue;
                
                if (emitter.burst) {
                    for (let i = 0; i < emitter.burstCount; i++) {
                        this.emit(emitter);
                    }
                    emitter.active = false;
                } else {
                    emitter.timer += deltaTime;
                    const emitInterval = 1 / emitter.rate;
                    
                    while (emitter.timer >= emitInterval) {
                        this.emit(emitter);
                        emitter.timer -= emitInterval;
                    }
                }
            }
            
            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                
                p.life -= deltaTime;
                if (p.life <= 0) {
                    if (p.mesh && window.scene) {
                        window.scene.remove(p.mesh);
                    }
                    this.particles.splice(i, 1);
                    continue;
                }
                
                p.velocity.y += p.gravity * deltaTime;
                p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
                
                if (p.mesh) {
                    p.mesh.position.copy(p.position);
                    
                    // Fade out
                    const alpha = p.life / p.maxLife;
                    p.mesh.material.opacity = alpha;
                    p.mesh.material.transparent = true;
                }
            }
        },
        
        clear() {
            for (const p of this.particles) {
                if (p.mesh && window.scene) {
                    window.scene.remove(p.mesh);
                }
            }
            this.particles = [];
            this.emitters = [];
        }
    };
    
    console.log('[ParticleSystem] Advanced particle system ready');
}
```

## Performance Monitoring

```javascript
// AUTO-FEATURE [performance_monitor]: Performance Monitoring System
if (!window.perfMonitor) {
    window.perfMonitor = {
        metrics: {},
        history: {},
        maxHistory: 60,
        displayElement: null,
        
        init() {
            this.displayElement = document.createElement('div');
            this.displayElement.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #0f0;
                font: 10px monospace;
                padding: 10px;
                border: 1px solid #0f0;
                border-radius: 3px;
                z-index: 10000;
                min-width: 200px;
            `;
            document.body.appendChild(this.displayElement);
        },
        
        mark(name) {
            this.metrics[name] = performance.now();
        },
        
        measure(name, startMark) {
            if (!this.metrics[startMark]) return;
            
            const duration = performance.now() - this.metrics[startMark];
            
            if (!this.history[name]) {
                this.history[name] = [];
            }
            
            this.history[name].push(duration);
            if (this.history[name].length > this.maxHistory) {
                this.history[name].shift();
            }
            
            return duration;
        },
        
        getAverage(name) {
            if (!this.history[name] || this.history[name].length === 0) return 0;
            
            const sum = this.history[name].reduce((a, b) => a + b, 0);
            return sum / this.history[name].length;
        },
        
        getStats() {
            const stats = {};
            for (const name in this.history) {
                const values = this.history[name];
                if (values.length === 0) continue;
                
                const avg = this.getAverage(name);
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                stats[name] = { avg, min, max };
            }
            return stats;
        },
        
        display() {
            if (!this.displayElement) return;
            
            const stats = this.getStats();
            let html = '<b>Performance Monitor</b><br>';
            html += `FPS: ${Math.round(1000 / this.getAverage('frame'))}<br>`;
            html += '<hr style="border-color:#0f0">';
            
            for (const [name, data] of Object.entries(stats)) {
                html += `${name}:<br>`;
                html += `  Avg: ${data.avg.toFixed(2)}ms<br>`;
                html += `  Min: ${data.min.toFixed(2)}ms<br>`;
                html += `  Max: ${data.max.toFixed(2)}ms<br>`;
            }
            
            this.displayElement.innerHTML = html;
        },
        
        clearHistory(name) {
            if (name) {
                delete this.history[name];
            } else {
                this.history = {};
            }
        }
    };
    
    window.perfMonitor.init();
    console.log('[PerfMonitor] Performance monitoring initialized');
}
```

These advanced patterns provide:
- State management for complex behaviors
- Performance optimization through pooling
- Event-driven architecture
- Intelligent pathfinding
- Visual effects system
- Real-time performance tracking
