#!/usr/bin/env python3
"""
Cline Collaboration Bridge
Provides integration between Cline AI and the Omni Ops project
Manages task queuing, status tracking, and execution
"""

import json
import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [CLINE] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler('CLINE_LOG.txt'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class ClineCollaborationBridge:
    """Bridge between Cline and Omni Ops project"""
    
    def __init__(self):
        self.config_file = 'CLINE_CONFIG.json'
        self.status_file = 'CLINE_STATUS.json'
        self.config = self._load_config()
        self.status = self._load_status()
        logger.info("✓ Cline Collaboration Bridge initialized")
    
    def _load_config(self) -> Dict:
        """Load configuration"""
        try:
            with open(self.config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file not found: {self.config_file}")
            return {}
    
    def _load_status(self) -> Dict:
        """Load current status"""
        try:
            with open(self.status_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Status file not found: {self.status_file}")
            return {"status": "idle", "activities": []}
    
    def _save_status(self):
        """Save current status"""
        self.status['last_update'] = datetime.now().isoformat()
        try:
            with open(self.status_file, 'w') as f:
                json.dump(self.status, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save status: {e}")
    
    def submit_task(self, task: Dict) -> bool:
        """Submit a task for Cline to process"""
        try:
            task_id = f"task-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            task['id'] = task_id
            task['created_at'] = datetime.now().isoformat()
            task['status'] = 'queued'
            
            logger.info(f"📋 Task submitted: {task_id}")
            logger.info(f"   Objective: {task.get('objective', 'N/A')}")
            logger.info(f"   Priority: {task.get('priority', 'medium')}")
            
            self.status['activities'].append({
                'timestamp': datetime.now().isoformat(),
                'event': 'task_submitted',
                'task_id': task_id
            })
            self._save_status()
            
            return True
        except Exception as e:
            logger.error(f"Failed to submit task: {e}")
            return False
    
    def update_task_status(self, task_id: str, status: str, progress: int = 0):
        """Update task status"""
        self.status['current_task'] = task_id
        self.status['status'] = status
        self.status['progress'] = progress
        
        activity_msg = f"Task {task_id} status: {status} ({progress}%)"
        logger.info(f"🔄 {activity_msg}")
        
        self.status['activities'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'status_update',
            'task_id': task_id,
            'status': status,
            'progress': progress
        })
        self._save_status()
    
    def log_activity(self, activity: str):
        """Log an activity"""
        logger.info(f"📝 {activity}")
        self.status['activities'].append({
            'timestamp': datetime.now().isoformat(),
            'event': 'activity',
            'message': activity
        })
        # Keep only last 100 activities
        if len(self.status['activities']) > 100:
            self.status['activities'] = self.status['activities'][-100:]
        self._save_status()
    
    def run_tests(self) -> bool:
        """Run test suite"""
        try:
            logger.info("🧪 Running tests...")
            self.log_activity("Starting test suite")
            
            # Run AI test
            logger.info("  - Testing AI connection...")
            result = subprocess.run(
                ['python', 'test_quick_final.py'],
                capture_output=True,
                timeout=30
            )
            
            if result.returncode == 0:
                logger.info("  ✓ Tests passed")
                self.log_activity("Tests passed successfully")
                return True
            else:
                logger.warning("  ⚠ Tests failed")
                self.log_activity("Tests failed")
                return False
                
        except Exception as e:
            logger.error(f"Test execution failed: {e}")
            self.log_activity(f"Test error: {e}")
            return False
    
    def git_commit(self, message: str) -> bool:
        """Create git commit for changes"""
        try:
            prefix = self.config.get('communication', {}).get('git_message_prefix', '[CLINE]')
            full_message = f"{prefix} {message}"
            
            logger.info(f"📦 Creating git commit: {full_message}")
            
            # Stage all changes
            subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
            
            # Commit
            result = subprocess.run(
                ['git', 'commit', '-m', full_message],
                capture_output=True
            )
            
            if result.returncode == 0:
                logger.info("  ✓ Commit created")
                self.log_activity(f"Git commit: {full_message}")
                return True
            else:
                logger.info("  ℹ No changes to commit")
                return False
                
        except Exception as e:
            logger.error(f"Git commit failed: {e}")
            return False
    
    def get_task_queue(self) -> List[Dict]:
        """Get pending task queue"""
        return self.status.get('task_queue', [])
    
    def mark_task_complete(self, task_id: str, success: bool = True):
        """Mark task as complete"""
        status = "completed" if success else "failed"
        self.update_task_status(task_id, status, 100)
        
        logger.info(f"✅ Task {task_id} marked as {status}")
        
        if success:
            self.status['completed_tasks'] = self.status.get('completed_tasks', 0) + 1
        else:
            self.status['failed_tasks'] = self.status.get('failed_tasks', 0) + 1
        
        self._save_status()
    
    def get_system_info(self) -> Dict:
        """Get system information"""
        return {
            'config': self.config,
            'status': self.status,
            'capabilities': self.config.get('capabilities', {}),
            'integration_points': self.config.get('integration_points', {})
        }
    
    def print_summary(self):
        """Print system summary"""
        logger.info("=" * 60)
        logger.info("🤖 CLINE COLLABORATION SYSTEM SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Status: {self.status.get('status', 'unknown')}")
        logger.info(f"Current Task: {self.status.get('current_task', 'none')}")
        logger.info(f"Progress: {self.status.get('progress', 0)}%")
        logger.info(f"Completed Tasks: {self.status.get('completed_tasks', 0)}")
        logger.info(f"Failed Tasks: {self.status.get('failed_tasks', 0)}")
        logger.info(f"Recent Activities: {len(self.status.get('activities', []))}")
        logger.info("=" * 60)


def main():
    """Main entry point"""
    bridge = ClineCollaborationBridge()
    
    if len(sys.argv) < 2:
        bridge.print_summary()
        logger.info("\nUsage:")
        logger.info("  python cline_collaboration_bridge.py submit <objective>")
        logger.info("  python cline_collaboration_bridge.py status")
        logger.info("  python cline_collaboration_bridge.py test")
        logger.info("  python cline_collaboration_bridge.py commit <message>")
        return
    
    command = sys.argv[1]
    
    if command == "submit":
        objective = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Automatic task"
        task = {
            "objective": objective,
            "priority": "medium",
            "category": "general"
        }
        bridge.submit_task(task)
        
    elif command == "status":
        bridge.print_summary()
        
    elif command == "test":
        bridge.run_tests()
        
    elif command == "commit":
        message = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "Automated changes"
        bridge.git_commit(message)
        
    else:
        logger.error(f"Unknown command: {command}")


if __name__ == "__main__":
    main()
