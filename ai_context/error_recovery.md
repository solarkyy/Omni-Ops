# Error Handling & Recovery Patterns

## Robust Error Handling

### Always wrap risky operations:

```javascript
// AUTO-FEATURE [safe_wrapper]: Safe Operation Wrapper
if (!window.safeExecute) {
    window.safeExecute = {
        try(fn, fallback = null, context = 'Unknown') {
            try {
                return fn();
            } catch (error) {
                console.error(`[SafeExecute] Error in ${context}:`, error);
                if (window.eventBus) {
                    window.eventBus.emit('error.caught', { context, error: error.message });
                }
                return fallback ? fallback() : null;
            }
        },
        
        async tryAsync(fn, fallback = null, context = 'Unknown') {
            try {
                return await fn();
            } catch (error) {
                console.error(`[SafeExecute] Async error in ${context}:`, error);
                if (window.eventBus) {
                    window.eventBus.emit('error.caught', { context, error: error.message });
                }
                return fallback ? await fallback() : null;
            }
        },
        
        wrap(object, methodName, context = null) {
            const original = object[methodName];
            if (typeof original !== 'function') return;
            
            object[methodName] = function(...args) {
                try {
                    return original.apply(this, args);
                } catch (error) {
                    console.error(`[SafeExecute] Error in ${context || methodName}:`, error);
                    return null;
                }
            };
        }
    };
    
    console.log('[SafeExecute] Error handling system ready');
}
```

## Null-Safe Property Access

```javascript
// AUTO-FEATURE [safe_access]: Safe Property Access
if (!window.safe) {
    window.safe = {
        get(obj, path, defaultValue = null) {
            if (!obj) return defaultValue;
            
            const keys = path.split('.');
            let current = obj;
            
            for (const key of keys) {
                if (current[key] === undefined || current[key] === null) {
                    return defaultValue;
                }
                current = current[key];
            }
            
            return current;
        },
        
        set(obj, path, value) {
            if (!obj) return false;
            
            const keys = path.split('.');
            const lastKey = keys.pop();
            let current = obj;
            
            for (const key of keys) {
                if (!current[key]) {
                    current[key] = {};
                }
                current = current[key];
            }
            
            current[lastKey] = value;
            return true;
        },
        
        call(obj, methodName, ...args) {
            if (!obj || typeof obj[methodName] !== 'function') {
                console.warn('[SafeAccess] Method not found:', methodName);
                return null;
            }
            
            try {
                return obj[methodName](...args);
            } catch (error) {
                console.error('[SafeAccess] Error calling method:', methodName, error);
                return null;
            }
        }
    };
    
    console.log('[SafeAccess] Safe property access ready');
}
```

## Automatic Recovery

```javascript
// AUTO-FEATURE [auto_recovery]: Automatic Error Recovery System
if (!window.autoRecovery) {
    window.autoRecovery = {
        systems: {},
        checkInterval: 5000,
        checking: false,
        
        register(name, config) {
            this.systems[name] = {
                check: config.check || (() => true),
                recover: config.recover || (() => {}),
                healthy: true,
                failCount: 0,
                maxFails: config.maxFails || 3
            };
            
            console.log('[AutoRecovery] Registered system:', name);
        },
        
        start() {
            if (this.checking) return;
            this.checking = true;
            
            this.checkSystems();
            setInterval(() => this.checkSystems(), this.checkInterval);
            console.log('[AutoRecovery] Monitoring started');
        },
        
        checkSystems() {
            for (const [name, system] of Object.entries(this.systems)) {
                try {
                    const isHealthy = system.check();
                    
                    if (!isHealthy) {
                        system.failCount++;
                        console.warn(`[AutoRecovery] System unhealthy: ${name} (${system.failCount}/${system.maxFails})`);
                        
                        if (system.failCount >= system.maxFails) {
                            console.error(`[AutoRecovery] Attempting recovery: ${name}`);
                            system.recover();
                            system.failCount = 0;
                        }
                    } else {
                        if (!system.healthy) {
                            console.log(`[AutoRecovery] System recovered: ${name}`);
                        }
                        system.healthy = true;
                        system.failCount = 0;
                    }
                } catch (error) {
                    console.error(`[AutoRecovery] Error checking ${name}:`, error);
                }
            }
        }
    };
    
    // Register critical systems
    window.autoRecovery.register('player', {
        check: () => window.player && window.player.health !== undefined,
        recover: () => {
            if (!window.player) window.player = {};
            window.player.health = window.player.health || 100;
            console.log('[AutoRecovery] Player object restored');
        }
    });
    
    window.autoRecovery.register('scene', {
        check: () => window.scene && window.scene.children && window.scene.children.length > 0,
        recover: () => {
            console.error('[AutoRecovery] Scene corrupted - manual intervention required');
        },
        maxFails: 1
    });
    
    window.autoRecovery.start();
    console.log('[AutoRecovery] System monitoring initialized');
}
```

## Debug Mode & Logging

```javascript
// AUTO-FEATURE [debug_system]: Advanced Debug System
if (!window.debugSystem) {
    window.debugSystem = {
        enabled: false,
        logLevel: 'info', // 'debug', 'info', 'warn', 'error'
        logs: [],
        maxLogs: 1000,
        overlay: null,
        
        levels: {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        },
        
        log(level, context, message, data = null) {
            if (this.levels[level] < this.levels[this.logLevel]) return;
            
            const entry = {
                timestamp: Date.now(),
                level: level,
                context: context,
                message: message,
                data: data
            };
            
            this.logs.push(entry);
            if (this.logs.length > this.maxLogs) {
                this.logs.shift();
            }
            
            const color = {
                debug: '#888',
                info: '#0ff',
                warn: '#ff0',
                error: '#f00'
            }[level] || '#fff';
            
            console.log(
                `%c[${context}] ${message}`,
                `color: ${color}`,
                data || ''
            );
            
            if (this.enabled && this.overlay) {
                this.updateOverlay();
            }
        },
        
        debug(context, message, data) {
            this.log('debug', context, message, data);
        },
        
        info(context, message, data) {
            this.log('info', context, message, data);
        },
        
        warn(context, message, data) {
            this.log('warn', context, message, data);
        },
        
        error(context, message, data) {
            this.log('error', context, message, data);
        },
        
        enable() {
            this.enabled = true;
            if (!this.overlay) {
                this.createOverlay();
            }
            this.overlay.style.display = 'block';
        },
        
        disable() {
            this.enabled = false;
            if (this.overlay) {
                this.overlay.style.display = 'none';
            }
        },
        
        toggle() {
            if (this.enabled) {
                this.disable();
            } else {
                this.enable();
            }
        },
        
        createOverlay() {
            this.overlay = document.createElement('div');
            this.overlay.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                max-height: 300px;
                background: rgba(0, 0, 0, 0.9);
                color: #0f0;
                font: 11px monospace;
                padding: 10px;
                overflow-y: auto;
                z-index: 10001;
                border-top: 2px solid #0f0;
            `;
            document.body.appendChild(this.overlay);
            
            // Add close button
            const close = document.createElement('button');
            close.textContent = 'X';
            close.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: #f00;
                color: #fff;
                border: none;
                padding: 5px 10px;
                cursor: pointer;
            `;
            close.onclick = () => this.disable();
            this.overlay.appendChild(close);
        },
        
        updateOverlay() {
            if (!this.overlay) return;
            
            const recentLogs = this.logs.slice(-50).reverse();
            let html = '<b>Debug Console</b> (Press F4 to toggle)<br><hr>';
            
            for (const log of recentLogs) {
                const time = new Date(log.timestamp).toLocaleTimeString();
                const color = {
                    debug: '#888',
                    info: '#0ff',
                    warn: '#ff0',
                    error: '#f00'
                }[log.level];
                
                html += `<div style="color:${color};margin:2px 0">`;
                html += `[${time}] [${log.context}] ${log.message}`;
                if (log.data) {
                    html += ` ${JSON.stringify(log.data)}`;
                }
                html += `</div>`;
            }
            
            this.overlay.innerHTML = html;
        },
        
        getRecentLogs(count = 50) {
            return this.logs.slice(-count);
        },
        
        clear() {
            this.logs = [];
            if (this.overlay) {
                this.updateOverlay();
            }
        }
    };
    
    // Keyboard shortcut - F4 toggles debug
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F4') {
            e.preventDefault();
            window.debugSystem.toggle();
        }
    });
    
    console.log('[DebugSystem] Advanced debugging ready (F4 to toggle)');
}
```

## Validation & Assertions

```javascript
// AUTO-FEATURE [validation]: Input Validation System
if (!window.validate) {
    window.validate = {
        number(value, min = -Infinity, max = Infinity, defaultValue = 0) {
            const num = Number(value);
            if (isNaN(num) || num < min || num > max) {
                console.warn('[Validate] Invalid number:', value, 'using default:', defaultValue);
                return defaultValue;
            }
            return num;
        },
        
        string(value, minLength = 0, maxLength = Infinity, defaultValue = '') {
            const str = String(value);
            if (str.length < minLength || str.length > maxLength) {
                console.warn('[Validate] Invalid string length:', str.length, 'using default');
                return defaultValue;
            }
            return str;
        },
        
        vector3(value, defaultValue = null) {
            if (!value || typeof value.x !== 'number' || typeof value.y !== 'number' || typeof value.z !== 'number') {
                console.warn('[Validate] Invalid Vector3:', value);
                return defaultValue || new THREE.Vector3();
            }
            return value;
        },
        
        object(value, requiredKeys = [], defaultValue = null) {
            if (!value || typeof value !== 'object') {
                console.warn('[Validate] Invalid object:', value);
                return defaultValue || {};
            }
            
            for (const key of requiredKeys) {
                if (!(key in value)) {
                    console.warn('[Validate] Missing required key:', key);
                    return defaultValue || {};
                }
            }
            
            return value;
        },
        
        assert(condition, message = 'Assertion failed') {
            if (!condition) {
                console.error('[Validate] Assertion failed:', message);
                if (window.debugSystem) {
                    window.debugSystem.error('Validation', 'Assertion failed: ' + message);
                }
                throw new Error(message);
            }
        }
    };
    
    console.log('[Validate] Validation system ready');
}
```

These patterns ensure:
- Graceful error handling without crashes
- Automatic recovery from common failures
- Safe property access preventing null errors
- Comprehensive logging and debugging
- Input validation preventing bad data
- System health monitoring
