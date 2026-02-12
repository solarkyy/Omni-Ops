# AI Enemy Behaviors & Intelligence

## Smart Enemy AI with Multiple Behaviors

```javascript
// AUTO-FEATURE [smart_enemy_ai]: Intelligent Enemy System
if (!window.smartEnemyAI) {
    window.smartEnemyAI = {
        enemies: [],
        playerRef: null,
        
        createEnemy(position, type = 'aggressive') {
            const enemy = {
                id: 'enemy_' + Date.now() + '_' + Math.random(),
                mesh: null,
                position: position.clone(),
                velocity: new THREE.Vector3(),
                health: 100,
                maxHealth: 100,
                speed: 3,
                detectionRange: 20,
                attackRange: 3,
                damage: 10,
                type: type,
                state: 'idle',
                target: null,
                path: [],
                pathIndex: 0,
                lastPathUpdate: 0,
                attackCooldown: 0,
                maxAttackCooldown: 2,
                lastSeenPlayer: null,
                searchTimer: 0,
                patrolIndex: 0,
                patrolPoints: this.generatePatrolPoints(position, 5, 10)
            };
            
            // Create visual representation
            if (window.scene) {
                const geometry = new THREE.BoxGeometry(1, 2, 1);
                const material = new THREE.MeshStandardMaterial({ 
                    color: type === 'aggressive' ? 0xff0000 : type === 'defensive' ? 0x0000ff : 0xffff00
                });
                enemy.mesh = new THREE.Mesh(geometry, material);
                enemy.mesh.position.copy(position);
                window.scene.add(enemy.mesh);
                
                // Add health bar
                const barGeometry = new THREE.PlaneGeometry(1.5, 0.2);
                const barMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
                enemy.healthBar = new THREE.Mesh(barGeometry, barMaterial);
                enemy.healthBar.position.set(0, 1.5, 0);
                enemy.mesh.add(enemy.healthBar);
            }
            
            this.enemies.push(enemy);
            console.log('[SmartEnemyAI] Created', type, 'enemy at', position);
            return enemy;
        },
        
        generatePatrolPoints(center, count, radius) {
            const points = [];
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    center.x + Math.cos(angle) * radius,
                    center.y,
                    center.z + Math.sin(angle) * radius
                ));
            }
            return points;
        },
        
        update(deltaTime) {
            if (window.player) {
                this.playerRef = window.player;
            }
            
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                
                if (enemy.health <= 0) {
                    this.removeEnemy(enemy);
                    continue;
                }
                
                this.updateEnemy(enemy, deltaTime);
                this.updateVisuals(enemy);
                
                // Update attack cooldown
                if (enemy.attackCooldown > 0) {
                    enemy.attackCooldown -= deltaTime;
                }
            }
        },
        
        updateEnemy(enemy, deltaTime) {
            if (!this.playerRef) return;
            
            const playerPos = window.camera ? window.camera.position : new THREE.Vector3();
            const distToPlayer = enemy.position.distanceTo(playerPos);
            
            // State machine
            switch (enemy.state) {
                case 'idle':
                    if (distToPlayer < enemy.detectionRange) {
                        enemy.state = 'alert';
                        enemy.target = playerPos;
                    } else if (enemy.type === 'patrol') {
                        enemy.state = 'patrol';
                    }
                    break;
                    
                case 'patrol':
                    this.behaviorPatrol(enemy, deltaTime);
                    if (distToPlayer < enemy.detectionRange) {
                        enemy.state = 'alert';
                    }
                    break;
                    
                case 'alert':
                    if (distToPlayer > enemy.detectionRange * 1.5) {
                        enemy.state = 'search';
                        enemy.searchTimer = 5;
                    } else if (distToPlayer < enemy.attackRange) {
                        enemy.state = 'attack';
                    } else {
                        enemy.state = 'chase';
                        enemy.lastSeenPlayer = playerPos.clone();
                    }
                    break;
                    
                case 'chase':
                    this.behaviorChase(enemy, deltaTime, playerPos);
                    if (distToPlayer < enemy.attackRange) {
                        enemy.state = 'attack';
                    } else if (distToPlayer > enemy.detectionRange * 1.5) {
                        enemy.state = 'search';
                        enemy.searchTimer = 5;
                    }
                    break;
                    
                case 'attack':
                    this.behaviorAttack(enemy, deltaTime, playerPos);
                    if (distToPlayer > enemy.attackRange * 1.5) {
                        enemy.state = 'chase';
                    }
                    break;
                    
                case 'search':
                    this.behaviorSearch(enemy, deltaTime);
                    if (distToPlayer < enemy.detectionRange * 0.7) {
                        enemy.state = 'alert';
                    }
                    break;
                    
                case 'flee':
                    this.behaviorFlee(enemy, deltaTime, playerPos);
                    if (distToPlayer > enemy.detectionRange * 2) {
                        enemy.state = 'idle';
                    }
                    break;
            }
        },
        
        behaviorPatrol(enemy, deltaTime) {
            const target = enemy.patrolPoints[enemy.patrolIndex];
            const direction = new THREE.Vector3().subVectors(target, enemy.position);
            const distance = direction.length();
            
            if (distance < 1) {
                enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrolPoints.length;
            } else {
                direction.normalize();
                enemy.position.add(direction.multiplyScalar(enemy.speed * 0.5 * deltaTime));
            }
        },
        
        behaviorChase(enemy, deltaTime, playerPos) {
            // Use pathfinding if available
            if (window.pathfinding && Date.now() - enemy.lastPathUpdate > 500) {
                enemy.path = window.pathfinding.findPath(
                    enemy.position.x, enemy.position.z,
                    playerPos.x, playerPos.z
                ) || [];
                enemy.pathIndex = 0;
                enemy.lastPathUpdate = Date.now();
            }
            
            let targetPos = playerPos;
            if (enemy.path && enemy.path.length > 0 && enemy.pathIndex < enemy.path.length) {
                targetPos = new THREE.Vector3(
                    enemy.path[enemy.pathIndex].x,
                    enemy.position.y,
                    enemy.path[enemy.pathIndex].z
                );
                
                if (enemy.position.distanceTo(targetPos) < 1) {
                    enemy.pathIndex++;
                }
            }
            
            const direction = new THREE.Vector3().subVectors(targetPos, enemy.position);
            direction.y = 0;
            direction.normalize();
            
            const speedMultiplier = enemy.type === 'aggressive' ? 1.2 : 1.0;
            enemy.position.add(direction.multiplyScalar(enemy.speed * speedMultiplier * deltaTime));
        },
        
        behaviorAttack(enemy, deltaTime, playerPos) {
            if (enemy.attackCooldown <= 0) {
                // Perform attack
                if (window.player && enemy.position.distanceTo(playerPos) < enemy.attackRange) {
                    window.player.health = Math.max(0, (window.player.health || 100) - enemy.damage);
                    console.log('[SmartEnemyAI] Enemy attacked! Player health:', window.player.health);
                    
                    // Event system integration
                    if (window.eventBus) {
                        window.eventBus.emit('player.damaged', { 
                            damage: enemy.damage, 
                            source: enemy.id 
                        });
                    }
                }
                
                enemy.attackCooldown = enemy.maxAttackCooldown;
            }
            
            // Face player
            const direction = new THREE.Vector3().subVectors(playerPos, enemy.position);
            direction.y = 0;
            direction.normalize();
            enemy.position.add(direction.multiplyScalar(enemy.speed * 0.3 * deltaTime));
        },
        
        behaviorSearch(enemy, deltaTime) {
            enemy.searchTimer -= deltaTime;
            
            if (enemy.searchTimer <= 0) {
                enemy.state = 'idle';
                return;
            }
            
            if (enemy.lastSeenPlayer) {
                const direction = new THREE.Vector3().subVectors(enemy.lastSeenPlayer, enemy.position);
                const distance = direction.length();
                
                if (distance < 2) {
                    // Reached last known position, look around
                    const angle = (Date.now() / 1000) * Math.PI;
                    const lookDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
                    enemy.position.add(lookDir.multiplyScalar(enemy.speed * 0.3 * deltaTime));
                } else {
                    direction.normalize();
                    enemy.position.add(direction.multiplyScalar(enemy.speed * 0.7 * deltaTime));
                }
            }
        },
        
        behaviorFlee(enemy, deltaTime, playerPos) {
            const direction = new THREE.Vector3().subVectors(enemy.position, playerPos);
            direction.y = 0;
            direction.normalize();
            enemy.position.add(direction.multiplyScalar(enemy.speed * 1.5 * deltaTime));
        },
        
        updateVisuals(enemy) {
            if (enemy.mesh) {
                enemy.mesh.position.copy(enemy.position);
                
                // Update health bar
                if (enemy.healthBar) {
                    const healthPercent = enemy.health / enemy.maxHealth;
                    enemy.healthBar.scale.x = healthPercent;
                    enemy.healthBar.material.color.setHex(
                        healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000
                    );
                }
                
                // Face movement direction
                if (enemy.velocity.length() > 0.1) {
                    const angle = Math.atan2(enemy.velocity.x, enemy.velocity.z);
                    enemy.mesh.rotation.y = angle;
                }
            }
        },
        
        damageEnemy(enemyId, damage) {
            const enemy = this.enemies.find(e => e.id === enemyId);
            if (enemy) {
                enemy.health -= damage;
                
                if (enemy.health <= 0) {
                    console.log('[SmartEnemyAI] Enemy defeated:', enemyId);
                    if (window.eventBus) {
                        window.eventBus.emit('enemy.defeated', { id: enemyId });
                    }
                } else if (enemy.type === 'defensive' && enemy.health < enemy.maxHealth * 0.3) {
                    enemy.state = 'flee';
                }
            }
        },
        
        removeEnemy(enemy) {
            if (enemy.mesh && window.scene) {
                window.scene.remove(enemy.mesh);
            }
            const index = this.enemies.indexOf(enemy);
            if (index > -1) {
                this.enemies.splice(index, 1);
            }
        }
    };
    
    console.log('[SmartEnemyAI] Intelligent enemy system initialized');
}
```

## Decision Tree AI

```javascript
// AUTO-FEATURE [decision_tree]: Decision Tree AI System
if (!window.decisionTree) {
    window.decisionTree = {
        trees: {},
        
        createTree(name) {
            this.trees[name] = {
                root: null
            };
            return this.trees[name];
        },
        
        createNode(type, config) {
            return {
                type: type, // 'decision', 'action', 'sequence', 'selector'
                condition: config.condition || null,
                action: config.action || null,
                children: config.children || [],
                ...config
            };
        },
        
        evaluate(treeName, context) {
            const tree = this.trees[treeName];
            if (!tree || !tree.root) return null;
            
            return this.evaluateNode(tree.root, context);
        },
        
        evaluateNode(node, context) {
            switch (node.type) {
                case 'decision':
                    if (node.condition && node.condition(context)) {
                        return node.children[0] ? this.evaluateNode(node.children[0], context) : null;
                    } else {
                        return node.children[1] ? this.evaluateNode(node.children[1], context) : null;
                    }
                    
                case 'action':
                    return node.action ? node.action(context) : null;
                    
                case 'sequence':
                    for (const child of node.children) {
                        const result = this.evaluateNode(child, context);
                        if (result === false) return false;
                    }
                    return true;
                    
                case 'selector':
                    for (const child of node.children) {
                        const result = this.evaluateNode(child, context);
                        if (result === true) return true;
                    }
                    return false;
                    
                default:
                    return null;
            }
        }
    };
    
    // Example: Create combat AI tree
    const combatTree = window.decisionTree.createTree('combat');
    combatTree.root = window.decisionTree.createNode('selector', {
        children: [
            window.decisionTree.createNode('sequence', {
                children: [
                    window.decisionTree.createNode('decision', {
                        condition: (ctx) => ctx.health < 30,
                        children: [
                            window.decisionTree.createNode('action', {
                                action: (ctx) => { console.log('AI: Health low, retreating'); return 'retreat'; }
                            })
                        ]
                    })
                ]
            }),
            window.decisionTree.createNode('sequence', {
                children: [
                    window.decisionTree.createNode('decision', {
                        condition: (ctx) => ctx.distanceToEnemy < 5,
                        children: [
                            window.decisionTree.createNode('action', {
                                action: (ctx) => { console.log('AI: Enemy close, attacking'); return 'attack'; }
                            })
                        ]
                    })
                ]
            }),
            window.decisionTree.createNode('action', {
                action: (ctx) => { console.log('AI: Default patrol'); return 'patrol'; }
            })
        ]
    });
    
    console.log('[DecisionTree] AI decision tree system ready');
}
```

These AI systems provide:
- Multi-state enemy behaviors (patrol, chase, attack, search, flee)
- Smart pathfinding integration
- Health management and visual feedback
- Decision-making with decision trees
- Dynamic behavior based on player actions
- Event-driven damage system
