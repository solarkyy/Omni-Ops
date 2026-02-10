# Comprehensive Diagnostics System

from agent_with_tracing import OmniAgent, setup_tracing
import os
import re
import json
from datetime import datetime

class GameDiagnostics:
    """Comprehensive diagnostics for Omni Ops game"""
    
    def __init__(self, agent: OmniAgent):
        self.agent = agent
        self.report = {
            "timestamp": datetime.now().isoformat(),
            "status": "running",
            "checks": {},
            "errors": [],
            "warnings": [],
            "recommendations": []
        }
    
    def check_syntax_errors(self):
        """Check for JavaScript syntax errors"""
        print("\n🔍 Checking for syntax errors...")
        
        issues = []
        js_files = [f for f in self.agent.codebase_context['files'].keys() if f.endswith('.js')]
        
        for file in js_files:
            content = self.agent.get_file_content(file)
            
            # Common syntax error patterns
            if 'function(' in content:  # Missing space
                issues.append({"file": file, "type": "syntax", "message": "Possible function syntax issue"})
            
            # Unclosed brackets
            open_braces = content.count('{')
            close_braces = content.count('}')
            if open_braces != close_braces:
                issues.append({"file": file, "type": "critical", "message": f"Unmatched braces: {open_braces} open, {close_braces} close"})
            
            # Unclosed parentheses
            open_parens = content.count('(')
            close_parens = content.count(')')
            if open_parens != close_parens:
                issues.append({"file": file, "type": "critical", "message": f"Unmatched parentheses: {open_parens} open, {close_parens} close"})
        
        self.report['checks']['syntax_errors'] = {
            "passed": len(issues) == 0,
            "issues_found": len(issues),
            "details": issues
        }
        
        return issues
    
    def check_memory_leaks(self):
        """Check for potential memory leak patterns"""
        print("\n💧 Checking for memory leaks...")
        
        issues = []
        js_files = [f for f in self.agent.codebase_context['files'].keys() if f.endswith('.js')]
        
        for file in js_files:
            content = self.agent.get_file_content(file)
            
            # Event listeners without cleanup
            if 'addEventListener' in content and 'removeEventListener' not in content:
                if file not in ['scripts/omni-main.js']:  # Exclude setup files
                    issues.append({
                        "file": file,
                        "type": "memory_leak",
                        "severity": "medium",
                        "message": "addEventListener without removeEventListener - potential memory leak"
                    })
            
            # setInterval without clearInterval
            if 'setInterval' in content and 'clearInterval' not in content:
                issues.append({
                    "file": file,
                    "type": "memory_leak",
                    "severity": "high",
                    "message": "setInterval without clearInterval - will cause memory leak"
                })
            
            # setTimeout without clearTimeout in loops
            if 'setTimeout' in content and 'for' in content:
                if 'clearTimeout' not in content:
                    issues.append({
                        "file": file,
                        "type": "memory_leak",
                        "severity": "medium",
                        "message": "setTimeout in loop without cleanup"
                    })
        
        self.report['checks']['memory_leaks'] = {
            "passed": len(issues) == 0,
            "potential_leaks": len(issues),
            "details": issues
        }
        
        return issues
    
    def check_undefined_variables(self):
        """Check for potentially undefined variable access"""
        print("\n❓ Checking for undefined variable risks...")
        
        issues = []
        js_files = [f for f in self.agent.codebase_context['files'].keys() if f.endswith('.js')]
        
        for file in js_files:
            content = self.agent.get_file_content(file)
            
            # Check for direct property access without checks
            risky_patterns = [
                (r'window\.\w+\.\w+', "Accessing nested window properties without checks"),
                (r'document\.getElementById\([^)]+\)\.\w+', "Accessing element properties without null check"),
                (r'\.children\[\d+\]\.', "Accessing array element without bounds check")
            ]
            
            for pattern, message in risky_patterns:
                matches = re.findall(pattern, content)
                if matches:
                    # Check if there's a preceding check
                    for match in matches[:3]:  # Limit to first 3 instances
                        issues.append({
                            "file": file,
                            "type": "undefined_access",
                            "severity": "medium",
                            "message": f"{message}: {match}"
                        })
        
        self.report['checks']['undefined_variables'] = {
            "passed": len(issues) == 0,
            "risky_accesses": len(issues),
            "details": issues[:10]  # Limit output
        }
        
        return issues
    
    def check_race_conditions(self):
        """Check for potential race conditions"""
        print("\n⚡ Checking for race conditions...")
        
        issues = []
        js_files = [f for f in self.agent.codebase_context['files'].keys() if f.endswith('.js')]
        
        for file in js_files:
            content = self.agent.get_file_content(file)
            
            # Async operations without proper handling
            if 'async' in content and 'await' not in content:
                issues.append({
                    "file": file,
                    "type": "race_condition",
                    "severity": "low",
                    "message": "Async function without await usage"
                })
            
            # Shared state modification in callbacks
            if 'setTimeout' in content and ('window.' in content or 'document.' in content):
                issues.append({
                    "file": file,
                    "type": "race_condition",
                    "severity": "medium",
                    "message": "Global state modification in async callback"
                })
        
        self.report['checks']['race_conditions'] = {
            "passed": len(issues) == 0,
            "potential_races": len(issues),
            "details": issues
        }
        
        return issues
    
    def check_system_integration(self):
        """Check if all systems are properly integrated"""
        print("\n🔗 Checking system integration...")
        
        issues = []
        
        # Check if key systems exist
        required_systems = [
            'omni-core-game.js',
            'omni-pipboy-system.js',
            'omni-multiplayer-sync.js',
            'omni-npc-living-city.js'
        ]
        
        for system in required_systems:
            matching_files = [f for f in self.agent.codebase_context['files'].keys() if system in f]
            if not matching_files:
                issues.append({
                    "system": system,
                    "type": "missing_system",
                    "severity": "critical",
                    "message": f"Required system {system} not found"
                })
            else:
                # Check if system is initialized
                content = self.agent.get_file_content(matching_files[0])
                if 'init' not in content.lower() and 'ready' not in content.lower():
                    issues.append({
                        "system": system,
                        "type": "initialization",
                        "severity": "medium",
                        "message": "System may not have proper initialization"
                    })
        
        self.report['checks']['system_integration'] = {
            "passed": len(issues) == 0,
            "systems_checked": len(required_systems),
            "issues_found": len(issues),
            "details": issues
        }
        
        return issues
    
    def check_error_handling(self):
        """Check for proper error handling"""
        print("\n🛡️ Checking error handling...")
        
        issues = []
        js_files = [f for f in self.agent.codebase_context['files'].keys() if f.endswith('.js')]
        
        for file in js_files:
            content = self.agent.get_file_content(file)
            
            # Check for try-catch blocks
            has_risky_operations = any(op in content for op in ['fetch', 'JSON.parse', 'localStorage', 'querySelector'])
            has_try_catch = 'try' in content and 'catch' in content
            
            if has_risky_operations and not has_try_catch:
                issues.append({
                    "file": file,
                    "type": "no_error_handling",
                    "severity": "high",
                    "message": "Risky operations without try-catch blocks"
                })
        
        self.report['checks']['error_handling'] = {
            "passed": len(issues) == 0,
            "files_without_handling": len(issues),
            "details": issues
        }
        
        return issues
    
    def check_performance_issues(self):
        """Check for performance bottlenecks"""
        print("\n⚡ Checking for performance issues...")
        
        issues = []
        js_files = [f for f in self.agent.codebase_context['files'].keys() if f.endswith('.js')]
        
        for file in js_files:
            content = self.agent.get_file_content(file)
            
            # Inefficient DOM queries
            if content.count('querySelector') > 10:
                issues.append({
                    "file": file,
                    "type": "performance",
                    "severity": "medium",
                    "message": f"High number of querySelector calls ({content.count('querySelector')}) - consider caching"
                })
            
            # Nested loops
            if content.count('for (') > 3 or content.count('forEach') > 5:
                issues.append({
                    "file": file,
                    "type": "performance",
                    "severity": "low",
                    "message": "Multiple loops detected - verify O(n) complexity"
                })
        
        self.report['checks']['performance'] = {
            "passed": len(issues) == 0,
            "potential_bottlenecks": len(issues),
            "details": issues
        }
        
        return issues
    
    def run_ai_analysis(self):
        """Use AI to analyze critical files"""
        print("\n🤖 Running AI code analysis...")
        
        critical_files = [
            f for f in self.agent.codebase_context['files'].keys()
            if 'omni-core-game' in f or 'omni-pipboy' in f
        ]
        
        ai_findings = []
        
        for file in critical_files[:2]:  # Analyze top 2 most critical
            print(f"   Analyzing {file}...")
            query = f"""Analyze this file for crash-prone issues:

1. Null pointer dereferences
2. Unhandled exceptions
3. Race conditions
4. Memory leaks
5. Infinite loops

File: {file}

Provide ONLY critical issues that could cause crashes. Be specific about line/function.
"""
            
            analysis = self.agent.process_query(query, include_context=False)
            ai_findings.append({
                "file": file,
                "analysis": analysis[:500]  # Truncate for report
            })
        
        self.report['checks']['ai_analysis'] = {
            "files_analyzed": len(ai_findings),
            "findings": ai_findings
        }
        
        return ai_findings
    
    def generate_report(self):
        """Generate final diagnostics report"""
        print("\n" + "="*70)
        print("📊 DIAGNOSTICS REPORT")
        print("="*70)
        
        # Calculate overall health score
        total_checks = len(self.report['checks'])
        passed_checks = sum(1 for check in self.report['checks'].values() 
                          if isinstance(check, dict) and check.get('passed', False))
        
        health_score = (passed_checks / total_checks * 100) if total_checks > 0 else 0
        
        # Determine status
        if health_score >= 80:
            status = "✅ HEALTHY"
            status_emoji = "🟢"
        elif health_score >= 60:
            status = "⚠️ NEEDS ATTENTION"
            status_emoji = "🟡"
        else:
            status = "❌ CRITICAL"
            status_emoji = "🔴"
        
        print(f"\n{status_emoji} Overall Health: {health_score:.1f}%")
        print(f"Status: {status}\n")
        
        # Summary of issues
        critical_issues = []
        high_issues = []
        medium_issues = []
        
        for check_name, check_data in self.report['checks'].items():
            if isinstance(check_data, dict) and 'details' in check_data:
                for issue in check_data['details']:
                    if isinstance(issue, dict):
                        severity = issue.get('severity', 'unknown')
                        if severity == 'critical':
                            critical_issues.append(issue)
                        elif severity == 'high':
                            high_issues.append(issue)
                        elif severity == 'medium':
                            medium_issues.append(issue)
        
        print(f"🔴 Critical Issues: {len(critical_issues)}")
        print(f"🟠 High Priority: {len(high_issues)}")
        print(f"🟡 Medium Priority: {len(medium_issues)}")
        
        # Show critical issues
        if critical_issues:
            print("\n" + "="*70)
            print("🚨 CRITICAL ISSUES (Must Fix)")
            print("="*70)
            for issue in critical_issues:
                print(f"\n❌ {issue.get('file', 'Unknown')}")
                print(f"   {issue.get('message', 'No details')}")
        
        # Show high priority
        if high_issues:
            print("\n" + "="*70)
            print("⚠️ HIGH PRIORITY (Should Fix)")
            print("="*70)
            for issue in high_issues[:5]:  # Top 5
                print(f"\n⚠️  {issue.get('file', 'Unknown')}")
                print(f"   {issue.get('message', 'No details')}")
        
        # Recommendations
        print("\n" + "="*70)
        print("💡 RECOMMENDATIONS")
        print("="*70)
        
        if len(critical_issues) > 0:
            print("\n1. Fix critical issues immediately - these can cause crashes")
        if len(high_issues) > 0:
            print("2. Address high priority issues - memory leaks and error handling")
        print("3. Run diagnostics regularly during development")
        print("4. Use AI assistant for detailed code review of problem files")
        
        # Save report
        report_file = 'diagnostics_report.json'
        with open(report_file, 'w') as f:
            json.dump(self.report, f, indent=2)
        
        print(f"\n📄 Full report saved to: {report_file}")
        
        return self.report

def main():
    """Run comprehensive diagnostics"""
    
    print("="*70)
    print("🏥 OMNI OPS - COMPREHENSIVE DIAGNOSTICS")
    print("="*70)
    
    setup_tracing()
    
    agent = OmniAgent(use_local=True, workspace_path=os.getcwd())
    diagnostics = GameDiagnostics(agent)
    
    print(f"\n📋 Checking {agent.codebase_context['file_count']} files...")
    
    # Run all checks
    diagnostics.check_syntax_errors()
    diagnostics.check_memory_leaks()
    diagnostics.check_undefined_variables()
    diagnostics.check_race_conditions()
    diagnostics.check_system_integration()
    diagnostics.check_error_handling()
    diagnostics.check_performance_issues()
    diagnostics.run_ai_analysis()
    
    # Generate report
    report = diagnostics.generate_report()
    
    print("\n" + "="*70)
    print("✓ Diagnostics Complete!")
    print("="*70)

if __name__ == "__main__":
    main()
