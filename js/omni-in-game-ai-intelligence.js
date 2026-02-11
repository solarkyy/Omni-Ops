/**
 * In-Game AI Intelligence System
 * Version: 2.0 - Vision & Brain Sharing Enabled
 * 
 * This module makes the in-game AI as smart as the external AI (Copilot)
 * by implementing real-time vision sharing and collaborative decision-making.
 */

class InGameAIIntelligence {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.isConnected = false;
        
        // AI Core Properties
        this.aiState = {
            health: 100,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            inventory: [],
            currentTask: "idle",
            target: null,
            behaviorState: "normal",
            confidence: 0.5,
            memory: [],
            learningMode: true
        };
        
        // Vision System
        this.visionData = {
            detectedObjects: [],
            environmentMap: {},
            threats: [],
            opportunities: [],
            lastVisionUpdate: 0
        };
        
        // Intelligence System
        this.intelligence = {
            decisionHistory: [],
            learnedStrategies: [],
            patternRecognition: {},
            knowledgeBase: {},
            autonomyLevel: 5 // 1-10: how much AI decides vs requests guidance
        };
        
        // Communication
        this.messageQueue = [];
        this.externalAIInstructions = [];
        this.conversationHistory = [];
        
        this.init();
    }
    
    init() {
        console.log("🧠 Initializing In-Game AI Intelligence System");
        this.connectToBridge();
        this.setupVisionSystem();
        this.startThinkingLoop();
        this.setupExternalAIListener();
    }
    
    connectToBridge() {
        const wsUrl = "ws://localhost:8082";
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                console.log("✅ AI Brain connected to Vision Bridge");
                this.sendMessage({
                    type: "ai_connected",
                    name: "InGameAI_v2",
                    capabilities: ["vision", "learning", "decision_making"]
                });
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleBridgeMessage(data);
            };
            
            this.ws.onerror = (error) => {
                console.error("❌ Bridge connection error:", error);
                this.isConnected = false;
            };
            
            this.ws.onclose = () => {
                console.warn("⚠️ Bridge disconnected. Retrying in 3s...");
                this.isConnected = false;
                setTimeout(() => this.connectToBridge(), 3000);
            };
        } catch (error) {
            console.error("Failed to connect to bridge:", error);
        }
    }
    
    setupVisionSystem() {
        console.log("👁️ Vision System initialized");
        setInterval(() => this.captureVision(), 100); // 10 FPS vision capture
    }
    
    captureVision() {
        if (!this.isConnected || !this.game.player) return;
        
        const player = this.game.player;
        const camera = this.game.camera;
        
        // Get objects in view frustum
        const detectedObjects = this.detectVisibleObjects();
        
        // Extract vision data
        const visionFrame = {
            timestamp: Date.now(),
            position: {
                x: player.position.x,
                y: player.position.y,
                z: player.position.z
            },
            rotation: {
                x: camera.rotation.x,
                y: camera.rotation.y,
                z: camera.rotation.z
            },
            detectedObjects: detectedObjects,
            environmentalData: this.analyzeEnvironment(detectedObjects),
            threats: this.identifyThreats(detectedObjects),
            opportunities: this.identifyOpportunities(detectedObjects)
        };
        
        // Identify what the AI can see
        const canvasFrame = this.captureGameCanvas();
        
        if (canvasFrame) {
            this.sendMessage({
                type: "vision_frame",
                frame: canvasFrame,
                timestamp: visionFrame.timestamp,
                position: visionFrame.position,
                rotation: visionFrame.rotation,
                detected_objects: visionFrame.detectedObjects,
                environment: visionFrame.environmentalData,
                threats: visionFrame.threats,
                opportunities: visionFrame.opportunities
            });
        }
        
        this.visionData = {
            ...visionFrame,
            lastVisionUpdate: Date.now()
        };
    }
    
    detectVisibleObjects() {
        if (!this.game.scene) return [];
        
        const detectedObjects = [];
        const maxDistance = 50; // 50 meter vision range
        
        for (const obj of this.game.scene.children) {
            if (obj === this.game.player || obj === this.game.camera) continue;
            
            const distance = this.game.player.position.distanceTo(obj.position);
            
            if (distance < maxDistance && this.isObjectInViewFrustum(obj)) {
                detectedObjects.push({
                    id: obj.id || obj.name || Math.random(),
                    type: obj.objectType || "unknown",
                    name: obj.name || "unknown",
                    position: {
                        x: obj.position.x,
                        y: obj.position.y,
                        z: obj.position.z
                    },
                    distance: distance.toFixed(2),
                    health: obj.health || 100,
                    threat: this.assessThreat(obj, distance),
                    interactable: this.isInteractable(obj)
                });
            }
        }
        
        return detectedObjects.slice(0, 20); // Max 20 objects per frame
    }
    
    isObjectInViewFrustum(obj) {
        // Simplified frustum check
        const player = this.game.player;
        if (!player) return false;
        
        const dirToObj = new THREE.Vector3()
            .subVectors(obj.position, player.position)
            .normalize();
        
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.game.camera.quaternion);
        const dot = dirToObj.dot(forward);
        
        return dot > 0.1; // 85 degree FOV roughly
    }
    
    assessThreat(obj, distance) {
        if (obj.isEnemy) {
            if (distance < 5) return "critical";
            if (distance < 15) return "high";
            if (distance < 30) return "medium";
            return "low";
        }
        return "none";
    }
    
    isInteractable(obj) {
        return obj.isInteractable === true || 
               obj.objectType === "item" ||
               obj.objectType === "door" ||
               obj.objectType === "container";
    }
    
    analyzeEnvironment(detectedObjects) {
        return {
            hasEnemies: detectedObjects.some(o => o.type === "enemy"),
            itemsAvailable: detectedObjects.filter(o => o.type === "item").length,
            terrain: this.analyzeTerrain(),
            timeOfDay: this.game.timeOfDay || "unknown",
            weatherConditions: this.game.weather || "clear"
        };
    }
    
    analyzeTerrain() {
        // Simplified terrain analysis
        const y = this.game.player.position.y;
        if (y > 100) return "elevated";
        if (y < -50) return "underground";
        return "ground_level";
    }
    
    identifyThreats(detectedObjects) {
        return detectedObjects
            .filter(o => o.threat && o.threat !== "none")
            .map(o => ({
                id: o.id,
                type: o.type,
                distance: o.distance,
                threatLevel: o.threat
            }));
    }
    
    identifyOpportunities(detectedObjects) {
        return detectedObjects
            .filter(o => o.interactable)
            .map(o => ({
                id: o.id,
                type: o.type,
                action: this.suggestAction(o),
                priority: this.calculatePriority(o)
            }));
    }
    
    suggestAction(obj) {
        if (obj.type === "item") return "collect";
        if (obj.type === "enemy") return "avoid";
        if (obj.type === "door") return "open";
        if (obj.type === "container") return "loot";
        return "investigate";
    }
    
    calculatePriority(obj) {
        const threats = this.visionData.threats;
        const underThreat = threats.some(t => t.distance < 10);
        
        if (underThreat) return obj.type === "weapon" ? 10 : 2;
        return obj.type === "item" ? 7 : 5;
    }
    
    captureGameCanvas() {
        // Find the main game canvas
        const canvases = document.querySelectorAll('canvas');
        if (canvases.length === 0) return null;
        
        let gameCanvas = null;
        canvases.forEach(canvas => {
            if (canvas.width > 800 && canvas.height > 600) {
                gameCanvas = canvas;
            }
        });
        
        if (!gameCanvas) return null;
        
        try {
            // Scale down for transmission
            const scaledWidth = 320;
            const scaledHeight = 240;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = scaledWidth;
            tempCanvas.height = scaledHeight;
            
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(gameCanvas, 0, 0, scaledWidth, scaledHeight);
            
            return tempCanvas.toDataURL('image/jpeg', 0.6);
        } catch (error) {
            console.error("Failed to capture vision frame:", error);
            return null;
        }
    }
    
    startThinkingLoop() {
        setInterval(() => this.think(), 500); // Thinking cycles every 500ms
    }
    
    async think() {
        // AI decision-making loop
        const situation = this.assessSituation();
        const options = this.generateOptions(situation);
        
        // Check autonomy level
        if (this.intelligence.autonomyLevel >= 7) {
            // High autonomy: decide independently
            const decision = this.makeDecision(situation, options);
            await this.executeDecision(decision);
        } else {
            // Request guidance from external AI
            this.requestGuidance(situation, options);
        }
        
        // Update state
        this.updateAIState();
    }
    
    assessSituation() {
        const threats = this.visionData.threats;
        const opportunities = this.visionData.opportunities;
        const health = this.aiState.health;
        
        return {
            threatLevel: threats.length > 0 ? "high" : "low",
            healthStatus: health > 75 ? "good" : health > 50 ? "fair" : "critical",
            opportunities: opportunities.length,
            timeInThisTask: Date.now() - (this.currentTaskStart || 0),
            confidence: this.aiState.confidence,
            lastDecision: this.intelligence.decisionHistory[0]
        };
    }
    
    generateOptions(situation) {
        const options = [];
        
        if (situation.threatLevel === "high") {
            options.push({
                action: "evade",
                priority: 10,
                description: "Move to cover and prepare defense"
            });
            options.push({
                action: "fight",
                priority: 8,
                description: "Engage threats directly"
            });
        }
        
        if (situation.opportunities > 0) {
            options.push({
                action: "explore",
                priority: 5,
                description: "Investigate opportunities"
            });
        }
        
        if (situation.healthStatus === "critical") {
            options.push({
                action: "seek_healing",
                priority: 9,
                description: "Find healing items or safe location"
            });
        }
        
        if (options.length === 0) {
            options.push({
                action: "patrol",
                priority: 3,
                description: "Continue normal patrol"
            });
        }
        
        return options;
    }
    
    makeDecision(situation, options) {
        // Sort by priority
        const sortedOptions = options.sort((a, b) => b.priority - a.priority);
        
        // Apply learned strategies
        const bestOption = this.applyLearnedStrategies(sortedOptions);
        
        return {
            decision: bestOption.action,
            confidence: this.calculateConfidence(bestOption, situation),
            reasoning: bestOption.description,
            timestamp: Date.now()
        };
    }
    
    applyLearnedStrategies(options) {
        // Check if we've seen similar situations
        for (const learned of this.intelligence.learnedStrategies) {
            const match = options.find(o => o.action === learned.successfulAction);
            if (match && learned.successRate > 0.7) {
                return match;
            }
        }
        
        return options[0]; // Default to highest priority
    }
    
    calculateConfidence(option, situation) {
        let confidence = 0.5;
        
        if (situation.threatLevel === "high") {
            confidence = option.priority > 7 ? 0.9 : 0.6;
        } else {
            confidence = option.priority > 5 ? 0.8 : 0.5;
        }
        
        // Boost confidence based on learned success
        const learned = this.intelligence.learnedStrategies
            .find(s => s.successfulAction === option.action);
        if (learned) {
            confidence = Math.min(1.0, confidence + learned.successRate * 0.2);
        }
        
        return confidence;
    }
    
    async executeDecision(decision) {
        this.aiState.currentTask = decision.decision;
        this.aiState.confidence = decision.confidence;
        this.currentTaskStart = Date.now();
        
        // Log decision
        this.intelligence.decisionHistory.unshift(decision);
        if (this.intelligence.decisionHistory.length > 50) {
            this.intelligence.decisionHistory.pop();
        }
        
        // Send to external AI for validation
        this.sendMessage({
            type: "decision_made",
            decision: decision.decision,
            confidence: decision.confidence,
            reasoning: decision.reasoning
        });
    }
    
    async requestGuidance(situation, options) {
        this.sendMessage({
            type: "request_guidance",
            situation: JSON.stringify(situation),
            options: options.map(o => o.action),
            confidence: this.aiState.confidence
        });
    }
    
    updateAIState() {
        if (!this.game.player) return;
        
        this.aiState = {
            ...this.aiState,
            health: this.game.player.health || 100,
            position: this.game.player.position,
            rotation: this.game.camera?.rotation,
            memory: this.getShortTermMemory(),
            timestamp: Date.now()
        };
        
        // Send periodic state updates
        if (Date.now() % 1000 < 100) { // Every ~1 second
            this.sendMessage({
                type: "ai_state",
                ...this.aiState
            });
        }
    }
    
    getShortTermMemory() {
        // Keep track of recent events
        const recentEvents = this.intelligence.decisionHistory.slice(0, 10);
        return recentEvents.map(d => ({
            action: d.decision,
            time: d.timestamp,
            confidence: d.confidence
        }));
    }
    
    handleBridgeMessage(data) {
        const { type, command, reasoning, recommendation, message } = data;
        
        switch(type) {
            case "instruction":
                this.executeExternalInstruction(command, reasoning);
                break;
            case "guidance_response":
                this.applyGuidance(recommendation, reasoning);
                break;
            case "chat_message":
                this.processChatMessage(message);
                break;
            case "learning_update":
                this.updateKnowledge(data);
                break;
            case "vision_update":
                this.receiveExternalVision(data.vision);
                break;
            default:
                console.log("Unknown message type:", type);
        }
    }
    
    executeExternalInstruction(command, reasoning) {
        console.log(`🎯 Executing external instruction: ${command}`);
        console.log(`   Reasoning: ${reasoning}`);
        
        this.externalAIInstructions.push({
            command,
            reasoning,
            timestamp: Date.now(),
            executed: false
        });
        
        // Execute immediately - learn from external AI's decisions
        this.aiState.currentTask = command;
        
        // Log for learning
        this.learnFromExternalAI(command, reasoning);
    }
    
    applyGuidance(recommendation, reasoning) {
        console.log(`💡 Applying guidance: ${recommendation}`);
        
        this.aiState.currentTask = recommendation;
        this.aiState.confidence = 0.85; // High confidence when external AI guides
        
        // Track what the external AI recommends
        this.intelligence.learnedStrategies.push({
            successfulAction: recommendation,
            successRate: 0.8,
            reasoning: reasoning,
            learnedFrom: "external_ai"
        });
    }
    
    processChatMessage(message) {
        console.log(`💬 Received: ${message}`);
        
        // Store conversation
        this.conversationHistory.push({
            sender: "external_ai",
            message,
            timestamp: Date.now()
        });
        
        // Respond
        let response = "Acknowledged. ";
        if (message.includes("see")) {
            response += "I'm analyzing my visual input and sharing with you.";
        } else if (message.includes("threat")) {
            response += `Current threats detected: ${this.visionData.threats.length}`;
        } else if (message.includes("help")) {
            response += "Standing by for instructions.";
        }
        
        this.sendChat(response);
    }
    
    updateKnowledge(data) {
        console.log("📚 Learning from pattern:", data.pattern?.name);
        
        this.intelligence.knowledgeBase[data.pattern?.name] = {
            pattern: data.pattern,
            successRate: data.success_rate,
            learned: Date.now()
        };
    }
    
    receiveExternalVision(visionData) {
        // Receive adjusted vision from external AI
        console.log("👁️ Received external AI vision analysis");
        this.visionData.externalAnalysis = visionData;
    }
    
    learnFromExternalAI(command, reasoning) {
        // Store external AI's decision for learning
        this.intelligence.learnedStrategies.push({
            successfulAction: command,
            successRate: 0.85,
            reasoning: reasoning,
            source: "external_ai",
            timestamp: Date.now()
        });
    }
    
    setupExternalAIListener() {
        // Listen for commands from external AI in the page
        window.addEventListener("externalAICommand", (event) => {
            console.log("📤 External AI command event:", event.detail);
            this.executeExternalInstruction(
                event.detail.command,
                event.detail.reasoning
            );
        });
    }
    
    sendMessage(message) {
        if (!this.isConnected || !this.ws) {
            this.messageQueue.push(message);
            return;
        }
        
        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error("Failed to send message:", error);
            this.messageQueue.push(message);
        }
    }
    
    sendChat(message) {
        this.sendMessage({
            type: "chat",
            sender: "in_game_ai",
            message: message,
            context: {
                position: this.aiState.position,
                healthStatus: this.aiState.health,
                currentTask: this.aiState.currentTask
            }
        });
        
        this.conversationHistory.push({
            sender: "in_game_ai",
            message,
            timestamp: Date.now()
        });
    }
    
    getStatus() {
        return {
            connected: this.isConnected,
            aiState: this.aiState,
            vision: {
                objectsDetected: this.visionData.detectedObjects.length,
                threats: this.visionData.threats.length,
                opportunities: this.visionData.opportunities.length
            },
            intelligence: {
                autonomyLevel: this.intelligence.autonomyLevel,
                learnedStrategies: this.intelligence.learnedStrategies.length,
                conversationTurns: this.conversationHistory.length
            },
            lastUpdate: Date.now()
        };
    }
}

// Global AI instance
window.InGameAI = null;

// Initialize when game is ready
function initializeInGameAI(game) {
    if (!window.InGameAI) {
        window.InGameAI = new InGameAIIntelligence(game);
        console.log("✅ In-Game AI Intelligence System initialized");
    }
    return window.InGameAI;
}
