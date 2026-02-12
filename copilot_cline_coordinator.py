#!/usr/bin/env python3
"""
Copilot-Cline Coordinator
Allows GitHub Copilot to delegate tasks to Cline for execution
Maximizes efficiency by distributing work appropriately
"""

import json
import sys
import subprocess
from datetime import datetime
from pathlib import Path
import time
import logging

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


class CopilotClineCoordinator:
    """Coordinates between Copilot and Cline for efficient task execution"""
    
    def __init__(self):
        self.config_file = 'CLINE_CONFIG.json'
        self.status_file = 'CLINE_STATUS.json'
        self.coordinator_log = 'COPILOT_CLINE_COORDINATION.log'
        self.load_config()
    
    def load_config(self):
        """Load system configuration"""
        try:
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        except:
            self.config = {}
    
    def delegate_to_cline(self, task_title: str, objective: str, priority: str = "high", 
                         category: str = "general", context: str = "", 
                         testing: str = "", dependencies: str = ""):
        """
        Delegate a task to Cline
        
        Usage:
            coordinator.delegate_to_cline(
                task_title="Fix AI Movement",
                objective="Fix forward movement in AIPlayerAPI",
                priority="high",
                category="bugfix",
                context="File: js/omni-core-game.js (line 2918)",
                testing="Run test_ai_connection.html and verify movement",
                dependencies="None"
            )
        """
        
        task_format = f"""[CLINE_TASK]
PRIORITY: {priority.upper()}
CATEGORY: {category.upper()}
OBJECTIVE: {objective}

CONTEXT:
{chr(10).join(f'- {line}' for line in context.split(chr(10)) if line.strip())}

TESTING:
{chr(10).join(f'- {line}' for line in testing.split(chr(10)) if line.strip())}

DEPENDENCIES:
- {dependencies if dependencies else 'None'}
"""
        
        self.log_coordination(f"DELEGATING TO CLINE: {task_title}")
        self.log_coordination(f"Priority: {priority.upper()}, Category: {category.upper()}")
        
        return {
            "task_title": task_title,
            "formatted_task": task_format,
            "status": "ready_for_cline",
            "timestamp": datetime.now().isoformat()
        }
    
    def log_coordination(self, message: str):
        """Log coordination activity"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}"
        
        try:
            with open(self.coordinator_log, 'a', encoding='utf-8') as f:
                f.write(log_entry + '\n')
        except:
            # Fallback for Windows encoding issues
            with open(self.coordinator_log, 'a') as f:
                f.write(log_entry.encode('ascii', 'replace').decode('ascii') + '\n')
        
        logger.info(message)
    
    def get_cline_status(self) -> dict:
        """Get current Cline status"""
        try:
            with open(self.status_file, 'r') as f:
                return json.load(f)
        except:
            return {}
    
    def wait_for_cline_completion(self, max_wait_minutes: int = 30) -> bool:
        """Wait for Cline to complete current task"""
        start = time.time()
        max_wait = max_wait_minutes * 60
        
        self.log_coordination(f"WAITING FOR CLINE (max {max_wait_minutes} min)")
        
        while (time.time() - start) < max_wait:
            status = self.get_cline_status()
            current_status = status.get('status', 'unknown')
            
            if current_status == 'idle' or current_status == 'completed':
                self.log_coordination("CLINE TASK COMPLETED")
                return True
            
            time.sleep(2)
        
        self.log_coordination("WARNING: CLINE TASK TIMED OUT")
        return False
    
    def print_task_for_cline(self, task: dict):
        """Print formatted task for copying to Cline"""
        print("\n" + "="*70)
        print("📋 TASK FOR CLINE - COPY AND PASTE INTO CLINE")
        print("="*70 + "\n")
        print(task['formatted_task'])
        print("\n" + "="*70)
        print("Ready to paste into Cline! (Ctrl+Shift+A to open)")
        print("="*70 + "\n")
    
    def print_coordination_summary(self):
        """Print coordination summary"""
        try:
            with open(self.coordinator_log, 'r') as f:
                lines = f.readlines()
            
            print("\n" + "="*70)
            print("📊 COORDINATION SUMMARY")
            print("="*70)
            print(f"Last 20 delegations:")
            print("-"*70)
            
            for line in lines[-20:]:
                print(line.rstrip())
            
            print("="*70 + "\n")
            
        except:
            logger.warning("Could not read coordination log")


def main():
    """Main entry point for coordinator"""
    
    if len(sys.argv) < 2:
        print("""
🤖 Copilot-Cline Coordinator

Usage:
  python copilot_cline_coordinator.py delegate "<title>" "<objective>" [priority] [category]
  python copilot_cline_coordinator.py status
  python copilot_cline_coordinator.py summary
  python copilot_cline_coordinator.py wait [minutes]

Example:
  python copilot_cline_coordinator.py delegate "Fix AI" "Fix forward movement" high bugfix

The coordinator will format your task and tell you what to paste into Cline.
        """)
        return
    
    coordinator = CopilotClineCoordinator()
    command = sys.argv[1]
    
    if command == "delegate":
        title = sys.argv[2] if len(sys.argv) > 2 else "Task"
        objective = sys.argv[3] if len(sys.argv) > 3 else "Complete the task"
        priority = sys.argv[4] if len(sys.argv) > 4 else "high"
        category = sys.argv[5] if len(sys.argv) > 5 else "general"
        
        task = coordinator.delegate_to_cline(
            task_title=title,
            objective=objective,
            priority=priority,
            category=category
        )
        
        coordinator.print_task_for_cline(task)
        
    elif command == "status":
        status = coordinator.get_cline_status()
        print("\n📊 Cline Status:")
        print(json.dumps(status, indent=2))
        
    elif command == "summary":
        coordinator.print_coordination_summary()
        
    elif command == "wait":
        wait_time = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        coordinator.wait_for_cline_completion(wait_time)


if __name__ == "__main__":
    main()
