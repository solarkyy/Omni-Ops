#!/usr/bin/env python3
"""
Cline Direct Chat Bridge
Enables real-time chat communication with Cline through a web interface
Routes messages, manages conversation history, and handles task delegation
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
import threading
import logging

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)


class ClineDirectChatBridge:
    """Direct chat bridge to Cline"""
    
    def __init__(self):
        self.chat_file = 'CLINE_CHAT_HISTORY.json'
        self.status_file = 'CLINE_CHAT_STATUS.json'
        self.inbox_dir = 'cline_messages'
        self.outbox_dir = 'cline_responses'
        
        # Create directories
        os.makedirs(self.inbox_dir, exist_ok=True)
        os.makedirs(self.outbox_dir, exist_ok=True)
        
        self.load_chat_history()
    
    def load_chat_history(self):
        """Load existing chat history"""
        try:
            with open(self.chat_file, 'r') as f:
                self.chat_history = json.load(f)
        except:
            self.chat_history = {
                "messages": [],
                "created": datetime.now().isoformat(),
                "version": 1
            }
    
    def save_chat_history(self):
        """Save chat history"""
        try:
            with open(self.chat_file, 'w') as f:
                json.dump(self.chat_history, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save chat history: {e}")
    
    def send_message_to_cline(self, user_message: str, message_type: str = "chat") -> dict:
        """
        Send a message to Cline
        
        message_type: "chat" (conversation), "task" (delegation), "query" (question)
        """
        
        timestamp = datetime.now().isoformat()
        message_id = f"msg-{int(time.time() * 1000)}"
        
        message = {
            "id": message_id,
            "timestamp": timestamp,
            "type": message_type,
            "content": user_message,
            "status": "sent",
            "response": None
        }
        
        # Add to history
        self.chat_history["messages"].append(message)
        self.save_chat_history()
        
        # Save to outbox for Cline to read
        outbox_file = os.path.join(self.outbox_dir, f"{message_id}.json")
        with open(outbox_file, 'w') as f:
            json.dump({
                "message": user_message,
                "type": message_type,
                "timestamp": timestamp
            }, f)
        
        logger.info(f"[SENT TO CLINE] {message_type.upper()}: {user_message[:60]}...")
        
        return {
            "success": True,
            "message_id": message_id,
            "timestamp": timestamp
        }
    
    def receive_response_from_cline(self, message_id: str) -> dict:
        """Receive response from Cline"""
        response_file = os.path.join(self.inbox_dir, f"{message_id}_response.json")
        
        try:
            if os.path.exists(response_file):
                with open(response_file, 'r') as f:
                    response = json.load(f)
                
                # Update history
                for msg in self.chat_history["messages"]:
                    if msg["id"] == message_id:
                        msg["status"] = "received"
                        msg["response"] = response
                        break
                self.save_chat_history()
                
                logger.info(f"[RECEIVED FROM CLINE] {response.get('content', 'Response')[:60]}...")
                
                return {
                    "success": True,
                    "response": response
                }
        except:
            pass
        
        return {
            "success": False,
            "response": None
        }
    
    def get_chat_history(self, limit: int = 50) -> list:
        """Get recent chat history"""
        return self.chat_history["messages"][-limit:]
    
    def format_for_display(self, message: dict) -> str:
        """Format message for display"""
        timestamp = message["timestamp"].split("T")[1][:5]
        msg_type = message["type"].upper()
        content = message["content"]
        status = message["status"]
        
        return f"[{timestamp}] {msg_type} ({status}): {content}"
    
    def create_task_from_chat(self, chat_message: str) -> str:
        """Convert chat message to task format"""
        task_format = f"""[CLINE_TASK]
PRIORITY: Medium
CATEGORY: General
OBJECTIVE: {chat_message}

CONTEXT:
- User request via direct chat

TESTING:
- Verify implementation meets objective

DEPENDENCIES: None
"""
        return task_format
    
    def update_status(self, status: str, message: str = ""):
        """Update chat status"""
        status_data = {
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "messages_sent": len([m for m in self.chat_history["messages"] if m["status"] == "sent"]),
            "messages_received": len([m for m in self.chat_history["messages"] if m["status"] == "received"])
        }
        
        try:
            with open(self.status_file, 'w') as f:
                json.dump(status_data, f, indent=2)
        except:
            pass
    
    def print_chat_status(self):
        """Print current chat status"""
        print("\n" + "="*70)
        print("💬 CLINE DIRECT CHAT STATUS")
        print("="*70)
        
        total_messages = len(self.chat_history["messages"])
        sent = len([m for m in self.chat_history["messages"] if m["status"] == "sent"])
        received = len([m for m in self.chat_history["messages"] if m["status"] == "received"])
        
        print(f"Total Messages: {total_messages}")
        print(f"Sent: {sent}")
        print(f"Received: {received}")
        print(f"Pending: {sent - received}")
        
        if self.chat_history["messages"]:
            print("\nRecent Messages:")
            print("-"*70)
            for msg in self.chat_history["messages"][-5:]:
                print(self.format_for_display(msg))
        
        print("="*70 + "\n")


def main():
    """CLI interface"""
    if len(sys.argv) < 2:
        print("""
💬 Cline Direct Chat Bridge

Usage:
  python cline_chat_bridge.py send "<message>" [type]
  python cline_chat_bridge.py receive <message_id>
  python cline_chat_bridge.py history [limit]
  python cline_chat_bridge.py status
  python cline_chat_bridge.py task "<message>"

Message Types: chat, task, query (default: chat)

Examples:
  python cline_chat_bridge.py send "What's the current bug?" query
  python cline_chat_bridge.py send "Fix the AI" task
  python cline_chat_bridge.py history 10
        """)
        return
    
    bridge = ClineDirectChatBridge()
    command = sys.argv[1]
    
    if command == "send":
        message = sys.argv[2] if len(sys.argv) > 2 else "Hello"
        msg_type = sys.argv[3] if len(sys.argv) > 3 else "chat"
        
        result = bridge.send_message_to_cline(message, msg_type)
        print(f"\n✅ Message sent!")
        print(f"ID: {result['message_id']}")
        print(f"Time: {result['timestamp']}")
        
    elif command == "receive":
        message_id = sys.argv[2] if len(sys.argv) > 2 else None
        if message_id:
            result = bridge.receive_response_from_cline(message_id)
            if result["success"]:
                print(f"\n✅ Response received:")
                print(json.dumps(result["response"], indent=2))
            else:
                print("\n❌ No response yet")
        
    elif command == "history":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        history = bridge.get_chat_history(limit)
        
        print("\n📋 Chat History:")
        print("="*70)
        for msg in history:
            print(bridge.format_for_display(msg))
        print("="*70 + "\n")
        
    elif command == "status":
        bridge.print_chat_status()
        
    elif command == "task":
        message = sys.argv[2] if len(sys.argv) > 2 else "Complete the task"
        task = bridge.create_task_from_chat(message)
        print("\n" + "="*70)
        print("📝 TASK FORMAT:")
        print("="*70)
        print(task)
        print("="*70 + "\n")


if __name__ == "__main__":
    main()
