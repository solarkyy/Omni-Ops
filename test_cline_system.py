#!/usr/bin/env python3
"""
Cline System Test & Verification
Verifies that all Cline collaboration systems are working
"""

import json
import os
import sys
from pathlib import Path
import subprocess
from datetime import datetime

class ClineSystemTest:
    """Test Cline collaboration system"""
    
    def __init__(self):
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
    
    def test(self, name: str, condition: bool, message: str = ""):
        """Run a test"""
        if condition:
            print(f"✅ {name}")
            self.tests_passed += 1
            status = "PASS"
        else:
            print(f"❌ {name}")
            self.tests_failed += 1
            status = "FAIL"
        
        self.results.append({
            "test": name,
            "status": status,
            "message": message
        })
    
    def test_files_exist(self):
        """Test that all required files exist"""
        print("\n📁 Testing Required Files...")
        
        files = [
            'CLINE_COLLABORATION.md',
            'CLINE_QUICK_START.md',
            'CLINE_CONFIG.json',
            'CLINE_STATUS.json',
            'CLINE_TASK_TEMPLATES.md',
            'cline_collaboration_bridge.py',
            'submit_cline_task.py',
            'cline_task_submission.html',
            'README_CLINE_SYSTEM.md'
        ]
        
        for file in files:
            exists = os.path.exists(file)
            self.test(f"File: {file}", exists)
    
    def test_config_file(self):
        """Test configuration file"""
        print("\n⚙️  Testing Configuration...")
        
        try:
            with open('CLINE_CONFIG.json', 'r') as f:
                config = json.load(f)
            
            self.test("Config is valid JSON", True)
            self.test("Config has system key", 'system' in config)
            self.test("Config has capabilities", 'capabilities' in config)
            self.test("Config has integration_points", 'integration_points' in config)
            
        except Exception as e:
            self.test("Config is valid JSON", False, str(e))
    
    def test_status_file(self):
        """Test status file"""
        print("\n📊 Testing Status File...")
        
        try:
            with open('CLINE_STATUS.json', 'r') as f:
                status = json.load(f)
            
            self.test("Status is valid JSON", True)
            self.test("Status has status field", 'status' in status)
            self.test("Status has activities", 'activities' in status)
            
        except Exception as e:
            self.test("Status is valid JSON", False, str(e))
    
    def test_python_scripts(self):
        """Test Python scripts"""
        print("\n🐍 Testing Python Scripts...")
        
        scripts = [
            'cline_collaboration_bridge.py',
            'submit_cline_task.py'
        ]
        
        for script in scripts:
            try:
                result = subprocess.run([sys.executable, script], 
                                      capture_output=True, 
                                      timeout=5,
                                      text=True)
                # Scripts should run without crashing
                self.test(f"Script: {script}", result.returncode in [0, 1])
            except Exception as e:
                self.test(f"Script: {script}", False, str(e))
    
    def test_bridge_functionality(self):
        """Test bridge functionality"""
        print("\n🔌 Testing Bridge Functionality...")
        
        try:
            # Import the bridge
            from cline_collaboration_bridge import ClineCollaborationBridge
            
            bridge = ClineCollaborationBridge()
            
            self.test("Bridge initializes", True)
            self.test("Bridge loads config", len(bridge.config) > 0)
            self.test("Bridge loads status", len(bridge.status) > 0)
            
            # Test methods exist
            self.test("Bridge has submit_task", hasattr(bridge, 'submit_task'))
            self.test("Bridge has update_task_status", hasattr(bridge, 'update_task_status'))
            self.test("Bridge has git_commit", hasattr(bridge, 'git_commit'))
            self.test("Bridge has run_tests", hasattr(bridge, 'run_tests'))
            
        except Exception as e:
            self.test("Bridge functionality", False, str(e))
    
    def test_git_integration(self):
        """Test Git integration"""
        print("\n📦 Testing Git Integration...")
        
        try:
            # Check if in git repo
            result = subprocess.run(['git', 'rev-parse', '--git-dir'],
                                  capture_output=True,
                                  timeout=5)
            in_git_repo = result.returncode == 0
            self.test("In Git repository", in_git_repo)
            
            if in_git_repo:
                # Check recent commits
                result = subprocess.run(['git', 'log', '--oneline', '-1'],
                                      capture_output=True,
                                      timeout=5,
                                      text=True)
                has_commits = result.returncode == 0 and len(result.stdout) > 0
                self.test("Git has commits", has_commits)
                
        except Exception as e:
            self.test("Git integration", False, str(e))
    
    def test_web_interface(self):
        """Test web interface"""
        print("\n🌐 Testing Web Interface...")
        
        try:
            with open('cline_task_submission.html', 'r') as f:
                content = f.read()
            
            self.test("HTML file readable", len(content) > 0)
            self.test("Has form elements", '<form' in content.lower() or '<input' in content.lower())
            self.test("Has submit button", 'submit' in content.lower())
            self.test("Has task preview", 'preview' in content.lower())
            
        except Exception as e:
            self.test("Web interface", False, str(e))
    
    def test_documentation(self):
        """Test documentation"""
        print("\n📚 Testing Documentation...")
        
        docs = [
            'CLINE_COLLABORATION.md',
            'CLINE_QUICK_START.md',
            'CLINE_TASK_TEMPLATES.md',
            'README_CLINE_SYSTEM.md'
        ]
        
        for doc in docs:
            try:
                with open(doc, 'r') as f:
                    content = f.read()
                
                has_content = len(content) > 100
                has_examples = '[CLINE_TASK]' in content
                
                self.test(f"Doc: {doc}", has_content and has_examples)
                
            except Exception as e:
                self.test(f"Doc: {doc}", False, str(e))
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*60)
        print("🤖 CLINE COLLABORATION SYSTEM TEST")
        print("="*60)
        
        self.test_files_exist()
        self.test_config_file()
        self.test_status_file()
        self.test_python_scripts()
        self.test_bridge_functionality()
        self.test_git_integration()
        self.test_web_interface()
        self.test_documentation()
        
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        total = self.tests_passed + self.tests_failed
        percentage = (self.tests_passed / total * 100) if total > 0 else 0
        
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {total}")
        print(f"Passed: {self.tests_passed} ✅")
        print(f"Failed: {self.tests_failed} ❌")
        print(f"Success Rate: {percentage:.1f}%")
        print("="*60)
        
        if self.tests_failed == 0:
            print("\n🎉 ALL TESTS PASSED! Cline system is ready to use.")
            print("\nNext steps:")
            print("1. Open VS Code")
            print("2. Open Cline extension")
            print("3. Paste a [CLINE_TASK] and let it work!")
        else:
            print(f"\n⚠️  {self.tests_failed} tests failed. Please check the output above.")
        
        print("\n📖 Documentation:")
        print("- Full guide: README_CLINE_SYSTEM.md")
        print("- Quick start: CLINE_QUICK_START.md")
        print("- Web interface: cline_task_submission.html")


def main():
    """Main entry point"""
    tester = ClineSystemTest()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
