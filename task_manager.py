# Task Manager for AI Assistant

from agent_with_tracing import OmniAgent, setup_tracing
import os
import json
from datetime import datetime

class TaskManager:
    """Manages improvement tasks for the AI assistant"""
    
    def __init__(self, agent: OmniAgent):
        self.agent = agent
        self.tasks_file = os.path.join(agent.workspace_path, '.ai_tasks.json')
        self.tasks = self.load_tasks()
    
    def load_tasks(self):
        """Load tasks from file"""
        if os.path.exists(self.tasks_file):
            with open(self.tasks_file, 'r') as f:
                return json.load(f)
        return {
            "pending": [],
            "in_progress": [],
            "completed": []
        }
    
    def save_tasks(self):
        """Save tasks to file"""
        with open(self.tasks_file, 'w') as f:
            json.dump(self.tasks, f, indent=2)
    
    def add_task(self, title: str, description: str, priority: str = "medium", file_path: str = None):
        """Add a new improvement task"""
        task = {
            "id": len(self.tasks["pending"]) + len(self.tasks["completed"]) + 1,
            "title": title,
            "description": description,
            "priority": priority,
            "file_path": file_path,
            "created_at": datetime.now().isoformat(),
            "status": "pending"
        }
        self.tasks["pending"].append(task)
        self.save_tasks()
        return task
    
    def get_task(self, task_id: int):
        """Get task by ID"""
        for status in ["pending", "in_progress", "completed"]:
            for task in self.tasks[status]:
                if task["id"] == task_id:
                    return task
        return None
    
    def start_task(self, task_id: int):
        """Move task to in_progress"""
        task = self.get_task(task_id)
        if task and task["status"] == "pending":
            self.tasks["pending"].remove(task)
            task["status"] = "in_progress"
            task["started_at"] = datetime.now().isoformat()
            self.tasks["in_progress"].append(task)
            self.save_tasks()
            return True
        return False
    
    def complete_task(self, task_id: int, result: str = None):
        """Mark task as completed"""
        task = self.get_task(task_id)
        if task and task["status"] == "in_progress":
            self.tasks["in_progress"].remove(task)
            task["status"] = "completed"
            task["completed_at"] = datetime.now().isoformat()
            if result:
                task["result"] = result
            self.tasks["completed"].append(task)
            self.save_tasks()
            return True
        return False
    
    def list_tasks(self, status: str = None):
        """List tasks by status"""
        if status:
            return self.tasks.get(status, [])
        return self.tasks
    
    def suggest_next_task(self):
        """AI suggests the next task to work on"""
        if not self.tasks["pending"]:
            return None
        
        # Get high priority tasks
        high_priority = [t for t in self.tasks["pending"] if t["priority"] == "high"]
        if high_priority:
            return high_priority[0]
        
        return self.tasks["pending"][0]
    
    def auto_create_tasks_from_scan(self, issues: dict):
        """Automatically create tasks from issue scan"""
        created_tasks = []
        
        # Create tasks from critical issues
        for issue in issues.get("bugs", [])[:3]:
            task = self.add_task(
                title=f"Fix: {issue['message']}",
                description=f"Type: {issue['type']}\nFile: {issue['file']}",
                priority="high",
                file_path=issue['file']
            )
            created_tasks.append(task)
        
        # Create tasks from security issues
        for issue in issues.get("security", [])[:2]:
            task = self.add_task(
                title=f"Security: {issue['message']}",
                description=f"Type: {issue['type']}\nFile: {issue['file']}",
                priority="high",
                file_path=issue['file']
            )
            created_tasks.append(task)
        
        # Create tasks from code quality
        for issue in issues.get("code_quality", [])[:3]:
            task = self.add_task(
                title=f"Quality: {issue['message']}",
                description=f"Type: {issue['type']}\nFile: {issue['file']}",
                priority="medium",
                file_path=issue['file']
            )
            created_tasks.append(task)
        
        return created_tasks

def main():
    """Task manager interface"""
    
    setup_tracing()
    
    agent = OmniAgent(use_local=True, workspace_path=os.getcwd())
    manager = TaskManager(agent)
    
    print("="*70)
    print("📋 TASK MANAGER")
    print("="*70)
    
    print(f"\nPending: {len(manager.tasks['pending'])}")
    print(f"In Progress: {len(manager.tasks['in_progress'])}")
    print(f"Completed: {len(manager.tasks['completed'])}")
    
    # Scan for new issues
    print("\n🔍 Scanning for new improvement opportunities...")
    issues = agent.scan_for_issues()
    total_issues = sum(len(v) for v in issues.values())
    
    if total_issues > 0:
        print(f"✓ Found {total_issues} potential improvements")
        
        create = input("\nCreate tasks from these issues? (y/n): ").strip().lower()
        if create == 'y':
            new_tasks = manager.auto_create_tasks_from_scan(issues)
            print(f"✓ Created {len(new_tasks)} new tasks")
    
    # Show pending tasks
    print("\n📝 Pending Tasks:")
    for task in manager.tasks["pending"][:5]:
        priority_emoji = "🔴" if task["priority"] == "high" else "🟡" if task["priority"] == "medium" else "🟢"
        print(f"  {priority_emoji} [{task['id']}] {task['title']}")
    
    # Suggest next task
    next_task = manager.suggest_next_task()
    if next_task:
        print(f"\n💡 Suggested next task: [{next_task['id']}] {next_task['title']}")
        
        work = input("Work on this task? (y/n): ").strip().lower()
        if work == 'y':
            manager.start_task(next_task['id'])
            print(f"\n🚀 Working on: {next_task['title']}")
            
            # Get AI analysis
            if next_task['file_path']:
                print(f"📖 Analyzing {next_task['file_path']}...")
                analysis = agent.auto_improve_code(next_task['file_path'])
                print(f"\n{analysis['analysis']}")
                
                complete = input("\nMark as completed? (y/n): ").strip().lower()
                if complete == 'y':
                    result = input("Brief description of what was done: ").strip()
                    manager.complete_task(next_task['id'], result)
                    print("✓ Task completed!")

if __name__ == "__main__":
    main()
