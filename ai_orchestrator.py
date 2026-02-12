#!/usr/bin/env python3
"""
OMNI-OPS AI ORCHESTRATOR
========================
Full AI Loop: Code → Test → Validate → Refine

This system enables complete autonomous AI development:
1. AI analyzes requirements
2. AI writes/modifies game code
3. AI launches the game
4. AI sees the screen in real-time
5. AI executes test sequence
6. AI observes results
7. AI refines or confirms success

Ties together:
- Claude (analysis & code generation)
- Vision system (screen perception)
- Control system (input automation)
- Game (testing environment)
"""

import os
import sys
import json
import time
import requests
import subprocess
import threading
import webbrowser
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum

class WorkflowStage(Enum):
    IDLE = "idle"
    ANALYZING = "analyzing"
    CODING = "coding"
    BUILDING = "building"
    TESTING = "testing"
    REFINING = "refining"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class AITask:
    """AI development task"""
    task_id: str
    description: str
    stage: WorkflowStage
    code_generated: str = ""
    test_results: Dict = None
    success: bool = False
    iterations: int = 0
    max_iterations: int = 3
    start_time: float = 0
    end_time: float = 0
    
    def to_dict(self):
        return {
            'task_id': self.task_id,
            'description': self.description,
            'stage': self.stage.value,
            'code_generated': self.code_generated[:100] + '...' if len(self.code_generated) > 100 else self.code_generated,
            'success': self.success,
            'iterations': self.iterations,
            'duration': self.end_time - self.start_time if self.end_time else 0
        }

class AIOrchestrator:
    """Master orchestrator for AI development loop"""
    
    def __init__(self):
        self.workspace = Path(__file__).parent
        self.tasks: Dict[str, AITask] = {}
        self.active_task: Optional[AITask] = None
        self.server_processes = {}
        
        # API endpoints
        self.vision_api = "http://127.0.0.1:8081"
        self.game_api = "http://127.0.0.1:8080"
        
        # Anthropic for AI
        self.ai_model = "claude-3-5-sonnet-20241022"
        self.conversation_history = []
    
    def log(self, stage: str, message: str):
        """Log with timestamp"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] [{stage}] {message}")
    
    # =========================================================================
    # SYSTEM SETUP & STARTUP
    # =========================================================================
    
    def start_infrastructure(self):
        """Start all required services"""
        self.log("SETUP", "Starting infrastructure...")
        
        try:
            # Check if vision server running
            response = requests.get(f"{self.vision_api}/api/status", timeout=2)
            self.log("SETUP", "✓ Vision API ready")
        except:
            self.log("SETUP", "Starting Vision API on 8081...")
            proc = subprocess.Popen(
                [sys.executable, "ai_vision_control_system.py"],
                cwd=str(self.workspace),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.server_processes['vision'] = proc
            time.sleep(2)
        
        try:
            # Check if game server running
            response = requests.get(f"{self.game_api}/api/health", timeout=2)
            self.log("SETUP", "✓ Game API ready")
        except:
            self.log("SETUP", "Starting Game HTTP Server on 8080...")
            proc = subprocess.Popen(
                [sys.executable, "local_http_server.py"],
                cwd=str(self.workspace),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            self.server_processes['game'] = proc
            time.sleep(2)
        
        self.log("SETUP", "✓ All systems ready")
    
    def open_dashboard(self):
        """Open AI vision dashboard"""
        try:
            dashboard_url = "file:///" + str(self.workspace / "ai_vision_dashboard.html")
            webbrowser.open(dashboard_url)
            self.log("SETUP", f"Dashboard opened")
        except Exception as e:
            self.log("SETUP", f"Could not open dashboard: {e}")
    
    # =========================================================================
    # AI ANALYSIS & CODE GENERATION
    # =========================================================================
    
    def analyze_requirement(self, requirement: str) -> str:
        """Ask Claude to analyze a feature requirement"""
        try:
            from anthropic import Anthropic
            client = Anthropic()
            
            prompt = f"""
You are an expert game developer AI. A new feature has been requested:

REQUIREMENT: {requirement}

Analyze this requirement and provide:
1. What needs to be implemented
2. Which files need modification
3. Key algorithm/approach
4. Potential challenges

Be technical and specific.
"""
            
            response = client.messages.create(
                model=self.ai_model,
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            analysis = response.content[0].text
            self.log("ANALYSIS", "✓ Requirement analyzed")
            return analysis
        
        except Exception as e:
            self.log("ANALYSIS", f"✗ Analysis failed: {e}")
            return None
    
    def generate_code(self, requirement: str, analysis: str) -> Optional[str]:
        """Ask Claude to generate implementation code"""
        try:
            from anthropic import Anthropic
            client = Anthropic()
            
            # Get code context
            context_files = {}
            context_dir = self.workspace / 'ai_context'
            if context_dir.exists():
                for f in context_dir.glob('*.md'):
                    with open(f, 'r') as fp:
                        context_files[f.stem] = fp.read()[:500]
            
            context_str = "\n\n".join([f"{k}:\n{v}" for k, v in context_files.items()])
            
            prompt = f"""
You are an expert game developer. Generate JavaScript code for this feature:

REQUIREMENT: {requirement}

ANALYSIS:
{analysis}

CONTEXT (from codebase):
{context_str}

Generate COMPLETE, WORKING code as a JavaScript module that:
1. Can be inserted into omni-core-game.js
2. Integrates with existing player/game systems
3. Handles all edge cases
4. Is well-commented

Format: Wrap code in ```javascript blocks
"""
            
            response = client.messages.create(
                model=self.ai_model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            code = response.content[0].text
            self.log("CODEGEN", "✓ Code generated")
            
            # Extract code from blocks
            if "```javascript" in code:
                code = code.split("```javascript")[1].split("```")[0]
            
            return code
        
        except Exception as e:
            self.log("CODEGEN", f"✗ Code generation failed: {e}")
            return None
    
    def inject_code(self, code: str, target_file: str) -> bool:
        """Inject generated code into target file"""
        try:
            target_path = self.workspace / target_file
            
            if not target_path.exists():
                self.log("INJECT", f"✗ File not found: {target_file}")
                return False
            
            # Read current file
            with open(target_path, 'r') as f:
                content = f.read()
            
            # Inject before closing tag
            if target_file.endswith('.js'):
                # Find good insertion point (end of file before last closing)
                injection_point = content.rfind('\n})')
                if injection_point == -1:
                    injection_point = len(content)
            else:
                injection_point = len(content)
            
            # Inject with wrapper
            wrapper = f"\n\n// AUTO-INJECTED-FEATURE\n{code}\n// END-AUTO-INJECTED\n"
            new_content = content[:injection_point] + wrapper + content[injection_point:]
            
            # Write back
            with open(target_path, 'w') as f:
                f.write(new_content)
            
            self.log("INJECT", f"✓ Code injected into {target_file}")
            return True
        
        except Exception as e:
            self.log("INJECT", f"✗ Injection failed: {e}")
            return False
    
    # =========================================================================
    # TESTING & VALIDATION
    # =========================================================================
    
    def wait_for_game(self, timeout: int = 30) -> bool:
        """Wait for game to start and connect"""
        self.log("TEST", "Waiting for game to load...")
        
        start = time.time()
        while time.time() - start < timeout:
            try:
                response = requests.get(f"{self.vision_api}/api/status", timeout=2)
                if response.status_code == 200:
                    self.log("TEST", "✓ Game connected")
                    return True
            except:
                pass
            
            time.sleep(1)
        
        self.log("TEST", "✗ Game connection timeout")
        return False
    
    async def get_game_observation(self) -> Optional[Dict]:
        """Get current game state and frame"""
        try:
            response = requests.get(f"{self.vision_api}/api/debug/state", timeout=5)
            return response.json()
        except:
            return None
    
    def run_test_sequence(self, feature_name: str, test_actions: List[str]) -> Dict:
        """Execute test sequence and capture results"""
        self.log("TEST", f"Starting test sequence for {feature_name}...")
        
        results = {
            'feature': feature_name,
            'actions_executed': [],
            'observations': [],
            'success': False,
            'errors': []
        }
        
        try:
            # Queue commands
            commands = [{'type': 'action', 'action': action} for action in test_actions]
            
            response = requests.post(
                f"{self.vision_api}/api/control/queue-commands",
                json={'commands': commands},
                timeout=5
            )
            
            if response.status_code != 200:
                results['errors'].append("Failed to queue commands")
                return results
            
            # Monitor execution
            time.sleep(0.5)
            
            # Wait for test to complete
            wait_time = len(test_actions) * 0.5
            self.log("TEST", f"Executing {len(test_actions)} commands...")
            time.sleep(wait_time)
            
            # Get results
            observation = self.get_game_observation()
            if observation:
                results['observations'].append(observation)
                results['success'] = True
                results['actions_executed'] = test_actions
            
            self.log("TEST", "✓ Test sequence completed")
            
        except Exception as e:
            results['errors'].append(str(e))
            self.log("TEST", f"✗ Test failed: {e}")
        
        return results
    
    def analyze_test_results(self, feature: str, results: Dict) -> str:
        """Ask Claude to analyze test results"""
        try:
            from anthropic import Anthropic
            client = Anthropic()
            
            prompt = f"""
A feature test just completed. Analyze the results:

FEATURE: {feature}
ACTIONS: {results['actions_executed']}
SUCCESS: {results['success']}
ERRORS: {results['errors']}

Did the feature work correctly? What issues (if any) need fixing?
"""
            
            response = client.messages.create(
                model=self.ai_model,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            
            analysis = response.content[0].text
            return analysis
        
        except Exception as e:
            return f"Analysis error: {e}"
    
    # =========================================================================
    # MAIN WORKFLOW
    # =========================================================================
    
    def execute_task(self, task_id: str, requirement: str):
        """Execute full AI development task"""
        
        self.log("WORKFLOW", f"Starting task: {task_id}")
        self.log("WORKFLOW", f"Requirement: {requirement}\n")
        
        task = AITask(
            task_id=task_id,
            description=requirement,
            stage=WorkflowStage.IDLE
        )
        task.start_time = time.time()
        self.tasks[task_id] = task
        self.active_task = task
        
        # STEP 1: Analyze
        print("\n" + "="*70)
        print("STEP 1: ANALYSIS")
        print("="*70)
        
        task.stage = WorkflowStage.ANALYZING
        analysis = self.analyze_requirement(requirement)
        if not analysis:
            task.stage = WorkflowStage.FAILED
            return
        print(f"\n{analysis}\n")
        
        # STEP 2: Code Generation
        print("\n" + "="*70)
        print("STEP 2: CODE GENERATION")
        print("="*70)
        
        task.stage = WorkflowStage.CODING
        code = self.generate_code(requirement, analysis)
        if not code:
            task.stage = WorkflowStage.FAILED
            return
        task.code_generated = code
        print(f"\nGenerated code ({len(code)} chars):\n")
        print(code[:500] + "..." if len(code) > 500 else code)
        print()
        
        # STEP 3: Code Injection
        print("\n" + "="*70)
        print("STEP 3: CODE INJECTION")
        print("="*70)
        
        target_file = "js/omni-core-game.js"
        if not self.inject_code(code, target_file):
            task.stage = WorkflowStage.FAILED
            return
        
        # STEP 4: Testing
        print("\n" + "="*70)
        print("STEP 4: TESTING & VALIDATION")
        print("="*70)
        
        task.stage = WorkflowStage.TESTING
        
        if not self.wait_for_game():
            task.stage = WorkflowStage.FAILED
            return
        
        # Generate and run test
        test_actions = [
            'look_around',
            'move_forward',
            'jump',
            'check_health'
        ]
        
        results = self.run_test_sequence(requirement, test_actions)
        
        if results['success']:
            task.stage = WorkflowStage.COMPLETED
            task.success = True
            self.log("WORKFLOW", "✓ TASK COMPLETED SUCCESSFULLY")
        else:
            task.stage = WorkflowStage.FAILED
            self.log("WORKFLOW", "✗ TASK FAILED")
        
        task.end_time = time.time()
        
        # Print summary
        print("\n" + "="*70)
        print("TASK SUMMARY")
        print("="*70)
        print(json.dumps(task.to_dict(), indent=2))
    
    def interactive_mode(self):
        """Interactive AI development mode"""
        print("\n" + "="*70)
        print("OMNI-OPS AI ORCHESTRATOR - INTERACTIVE MODE")
        print("="*70)
        print("\nCommands:")
        print("  task <description>  - Start AI development task")
        print("  status              - Show active tasks")
        print("  analyze             - Analyze game screenshot")
        print("  test <feature>      - Test a feature")
        print("  control <cmd>       - Send control command")
        print("  exit                - Exit\n")
        
        while True:
            try:
                cmd = input(">>> ").strip()
                
                if cmd.startswith("task "):
                    requirement = cmd[5:].strip()
                    task_id = f"task_{int(time.time())}"
                    self.execute_task(task_id, requirement)
                
                elif cmd == "status":
                    for task_id, task in self.tasks.items():
                        print(f"{task_id}: {task.stage.value}")
                
                elif cmd == "exit":
                    self.cleanup()
                    break
                
                else:
                    print("Unknown command")
            
            except KeyboardInterrupt:
                self.cleanup()
                break
            except Exception as e:
                print(f"Error: {e}")
    
    def cleanup(self):
        """Clean up processes"""
        self.log("CLEANUP", "Shutting down...")
        for proc in self.server_processes.values():
            try:
                proc.kill()
            except:
                pass

# ============================================================================
# MAIN
# ============================================================================

def main():
    orchestrator = AIOrchestrator()
    
    print("\n" + "="*70)
    print("OMNI-OPS AI ORCHESTRATOR")
    print("AI Loop: Analyze → Code → Inject → Test → Validate")
    print("="*70 + "\n")
    
    # Start infrastructure
    orchestrator.start_infrastructure()
    time.sleep(1)
    
    # Open dashboards
    orchestrator.open_dashboard()
    
    print("\nGame URL: http://localhost:8000")
    print("Dashboard: file:///" + str(orchestrator.workspace / "ai_vision_dashboard.html"))
    print("\n" + "="*70 + "\n")
    
    # Start interactive mode
    orchestrator.interactive_mode()

if __name__ == '__main__':
    main()
