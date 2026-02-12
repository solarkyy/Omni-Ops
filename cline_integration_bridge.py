#!/usr/bin/env python3
"""
Cline Integration Bridge - Simplified
Monitors tasks from Copilot via polling instead of watchdog
"""

import os
import json
import time
from pathlib import Path
from datetime import datetime

WORKSPACE_DIR = Path(__file__).parent
CLINE_INBOX_DIR = WORKSPACE_DIR / 'cline_inbox'
CLINE_OUTBOX_DIR = WORKSPACE_DIR / 'cline_outbox'

# Ensure directories exist
CLINE_INBOX_DIR.mkdir(exist_ok=True)
CLINE_OUTBOX_DIR.mkdir(exist_ok=True)

def process_task(task_file):
    """Process a task from Copilot"""
    try:
        print(f"\n{'='*60}")
        print(f"📥 NEW TASK: {task_file.name}")
        print(f"{'='*60}")
        
        with open(task_file, 'r') as f:
            task = json.load(f)
        
        task_id = task.get('id')
        task_text = task.get('task', '')
        task_type = task.get('type', 'implementation')
        
        print(f"Task ID: {task_id}")
        print(f"Type: {task_type}")
        print(f"Request: {task_text}")
        print()
        
        # Create instruction file for Cline
        instruction_file = WORKSPACE_DIR / f'CLINE_TASK_{task_id}.md'
        
        instruction_content = f"""# Task from Copilot

## Task ID: {task_id}
## Type: {task_type}
## Timestamp: {datetime.now().isoformat()}

## Request:
{task_text}

## Instructions:
1. Read this task specification
2. Analyze relevant files in the codebase
3. Implement the requested feature
4. Test the implementation
5. Create response file (see below)

## Response Format:
Create: `{CLINE_OUTBOX_DIR / f'response_{task_id}.json'}`

```json
{{
    "task_id": {task_id},
    "status": "completed",
    "message": "Description of what was done",
    "files_modified": ["list", "of", "files"],
    "timestamp": "{datetime.now().isoformat()}"
}}
```

---
**Ready to implement!**
"""
        
        with open(instruction_file, 'w', encoding='utf-8') as f:
            f.write(instruction_content)
        
        print(f"✅ Created: {instruction_file.name}")
        print(f"📣 CLINE: Check workspace for task file!")
        print(f"⏳ Waiting for response in: {CLINE_OUTBOX_DIR}")
        print()
        
        # Move task file to mark as processed
        task_file.unlink()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def monitor_inbox():
    """Poll inbox for new tasks"""
    print("👀 Monitoring inbox for tasks...")
    
    while True:
        try:
            task_files = sorted(CLINE_INBOX_DIR.glob('task_*.json'))
            
            for task_file in task_files:
                process_task(task_file)
            
            time.sleep(2)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Monitor error: {e}")
            time.sleep(5)

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║       CLINE INTEGRATION BRIDGE                               ║
╚══════════════════════════════════════════════════════════════╝

📁 Workspace: {}
📥 Inbox: {}
📤 Outbox: {}

✅ Bridge active!
✅ Polling for tasks every 2 seconds...

Press Ctrl+C to stop
""".format(WORKSPACE_DIR, CLINE_INBOX_DIR, CLINE_OUTBOX_DIR))
    
    try:
        monitor_inbox()
    except KeyboardInterrupt:
        print("\n\n🛑 Bridge stopped")

if __name__ == '__main__':
    main()

## Timestamp: {datetime.now().isoformat()}

## Request:
{task_text}

## Instructions for Cline:
1. Read this task specification
2. Analyze the codebase to understand relevant files
3. Implement the requested feature
4. Test the implementation
5. Report completion status

## Workspace:
{WORKSPACE_DIR}

## Response:
When complete, create a response file at:
`{CLINE_OUTBOX_DIR / f'response_{task_id}.json'}`

With format:
```json
{{
    "task_id": {task_id},
    "status": "completed|failed",
    "message": "Description of what was done",
    "files_modified": ["list", "of", "files"],
    "timestamp": "ISO timestamp"
}}
```

---

**Start implementing now!**
"""
        
        with open(instruction_file, 'w', encoding='utf-8') as f:
            f.write(instruction_content)
        
        print(f"✅ Instruction file created: {instruction_file.name}")
        print()
        print("📣 CLINE: Please open this file in VS Code and implement the task!")
        print(f"   File: {instruction_file}")
        print()
        print("⏳ Waiting for Cline to complete the task...")
        print(f"   Watching for response in: {CLINE_OUTBOX_DIR}")
        print()
        
        # Send notification to Cline (if Cline MCP is configured)
        self.notify_cline(task_id, task_text, instruction_file)
    
    def notify_cline(self, task_id, task_text, instruction_file):
        """Attempt to notify Cline via VS Code API or file system"""
        
        # Method 1: Create a VS Code notification file
        notification_file = WORKSPACE_DIR / '.vscode' / 'cline_notification.json'
        notification_file.parent.mkdir(exist_ok=True)
        
        notification = {
            'task_id': task_id,
            'task': task_text,
            'instruction_file': str(instruction_file),
            'timestamp': datetime.now().isoformat(),
            'status': 'pending'
        }
        
        with open(notification_file, 'w') as f:
            json.dump(notification, f, indent=2)
        
        print(f"🔔 Notification sent to Cline: {notification_file}")
        
        # Method 2: If Cline is running as a process, we could interact directly
        # This would require Cline's API/MCP to be configured
        # For now, we rely on file-based communication

def monitor_cline_responses():
    """Monitor for Cline's responses in outbox"""
    print("\n👀 Monitoring for Cline responses...")
    
    while True:
        try:
            response_files = sorted(CLINE_OUTBOX_DIR.glob('response_*.json'))
            
            for response_file in response_files:
                try:
                    with open(response_file, 'r') as f:
                        response = json.load(f)
                    
                    task_id = response.get('task_id')
                    status = response.get('status')
                    message = response.get('message')
                    files = response.get('files_modified', [])
                    
                    print(f"\n{'='*60}")
                    print(f"✅ CLINE RESPONSE RECEIVED")
                    print(f"{'='*60}")
                    print(f"Task ID: {task_id}")
                    print(f"Status: {status}")
                    print(f"Message: {message}")
                    if files:
                        print(f"Files Modified: {', '.join(files)}")
                    print(f"{'='*60}\n")
                    
                    # Response is handled by the HTTP server
                    # Just log it here
                    
                except Exception as e:
                    print(f"❌ Error reading response: {e}")
            
            time.sleep(2)
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error monitoring responses: {e}")
            time.sleep(5)

def main():
    print("""
╔══════════════════════════════════════════════════════════════╗
║       CLINE INTEGRATION BRIDGE                               ║
║       Copilot ↔ Cline Communication Layer                    ║
╚══════════════════════════════════════════════════════════════╝

📁 Workspace: {workspace}
📥 Inbox: {inbox}
📤 Outbox: {outbox}

🚀 Starting bridge...
""".format(
        workspace=WORKSPACE_DIR,
        inbox=CLINE_INBOX_DIR,
        outbox=CLINE_OUTBOX_DIR
    ))
    
    # Set up file system observer for inbox
    event_handler = ClineTaskHandler()
    observer = Observer()
    observer.schedule(event_handler, str(CLINE_INBOX_DIR), recursive=False)
    observer.start()
    
    print("✅ Watching for tasks from Copilot...")
    print("✅ Ready to delegate to Cline!")
    print("\nPress Ctrl+C to stop\n")
    
    try:
        # Also monitor responses
        monitor_cline_responses()
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping bridge...")
        observer.stop()
    
    observer.join()
    print("✅ Bridge stopped")

if __name__ == '__main__':
    main()
