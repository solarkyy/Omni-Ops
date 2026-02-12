#!/usr/bin/env python3
"""
Easy Cline Task Submission
Quick CLI interface for submitting tasks to Cline
"""

import json
import sys
from datetime import datetime
from pathlib import Path
import subprocess


class ClineTaskSubmitter:
    """Submit tasks to Cline"""
    
    def __init__(self):
        self.config_file = 'CLINE_CONFIG.json'
        self.status_file = 'CLINE_STATUS.json'
    
    def submit_quick_task(self, objective: str, priority: str = "medium", category: str = "general"):
        """Quick task submission"""
        task = {
            "priority": priority.lower(),
            "category": category.lower(),
            "objective": objective,
            "status": "queued",
            "created_at": datetime.now().isoformat()
        }
        
        print("\n" + "="*60)
        print("📋 CLINE TASK SUBMISSION")
        print("="*60)
        print(f"Objective: {objective}")
        print(f"Priority:  {priority.upper()}")
        print(f"Category:  {category.upper()}")
        print("="*60)
        print("\nTask is ready for Cline!")
        print("\nCopy this format and paste into Cline:\n")
        
        self._print_task_format(task)
        
        print("\nOr run the command after submitting:")
        print("  python cline_collaboration_bridge.py submit")
        print("="*60 + "\n")
    
    def _print_task_format(self, task: dict):
        """Print task in submission format"""
        print(f"""[CLINE_TASK]
PRIORITY: {task['priority'].upper()}
CATEGORY: {task['category'].upper()}
OBJECTIVE: {task['objective']}

CONTEXT:
- [Add relevant context]
- [File paths and line numbers]
- [Status of related issues]

TESTING:
- [How to test]
- [Expected output]
- [Success criteria]

DEPENDENCIES:
- [Any prerequisites]
""")


def main():
    """Main CLI interface"""
    submitter = ClineTaskSubmitter()
    
    if len(sys.argv) < 2:
        print("🤖 Cline Quick Task Submission\n")
        print("Usage:")
        print("  python submit_cline_task.py 'objective' [priority] [category]\n")
        print("Examples:")
        print("  python submit_cline_task.py 'Fix AI movement' high bugfix")
        print("  python submit_cline_task.py 'Add pathfinding' medium feature")
        print("  python submit_cline_task.py 'Run tests' high testing\n")
        print("Priorities: high, medium, low")
        print("Categories: bugfix, feature, optimization, testing, integration")
        return
    
    objective = sys.argv[1]
    priority = sys.argv[2] if len(sys.argv) > 2 else "medium"
    category = sys.argv[3] if len(sys.argv) > 3 else "general"
    
    submitter.submit_quick_task(objective, priority, category)


if __name__ == "__main__":
    main()
