# Personal Coding Assistant - Autonomous Mode

from agent_with_tracing import OmniAgent, setup_tracing
import os
import time

def main():
    """Autonomous personal assistant that improves your code"""
    
    setup_tracing()
    
    print("="*70)
    print("🤖 PERSONAL CODING ASSISTANT")
    print("Autonomous game improvement system")
    print("="*70)
    
    agent = OmniAgent(
        use_local=True,
        workspace_path=os.getcwd()
    )
    
    print("\n" + "="*70)
    print("SCANNING CODEBASE FOR IMPROVEMENTS...")
    print("="*70 + "\n")
    
    # Step 1: Scan for issues
    print("📊 Step 1: Scanning for common issues...")
    issues = agent.scan_for_issues()
    
    total_issues = sum(len(v) for v in issues.values())
    print(f"\n✓ Found {total_issues} potential issues")
    
    # Display issues by category
    for category, issue_list in issues.items():
        if issue_list:
            print(f"\n🔍 {category.upper()}: {len(issue_list)} issues")
            for issue in issue_list[:3]:  # Show first 3
                print(f"  - {issue['file']}: {issue['message']}")
    
    # Step 2: Deep analysis of problem files
    print("\n" + "="*70)
    print("📋 Step 2: Analyzing key files...")
    print("="*70 + "\n")
    
    # Get most important files to analyze
    js_files = [f for f in agent.codebase_context['files'].keys() 
                if 'omni-core-game.js' in f or 'omni-pipboy-system.js' in f]
    
    improvements = {}
    for file_path in js_files[:2]:  # Analyze top 2 files
        print(f"\n🔧 Analyzing: {file_path}")
        result = agent.auto_improve_code(file_path)
        improvements[file_path] = result
        print(f"✓ Analysis complete")
    
    # Step 3: Generate improvement plan
    print("\n" + "="*70)
    print("📝 Step 3: Creating improvement plan...")
    print("="*70 + "\n")
    
    plan_query = f"""Based on the codebase scan, create a prioritized improvement plan:

Issues found:
- Performance: {len(issues['performance'])}
- Bugs: {len(issues['bugs'])}
- Security: {len(issues['security'])}
- Code Quality: {len(issues['code_quality'])}

Provide:
1. Top 5 priority improvements (most impactful)
2. Quick wins (easy fixes with high value)
3. Long-term architectural improvements
4. Estimated time to implement each

Focus on game performance, user experience, and code maintainability.
"""
    
    print("🤔 Thinking...")
    improvement_plan = agent.process_query(plan_query, include_context=True)
    
    print("\n" + "="*70)
    print("📋 IMPROVEMENT PLAN")
    print("="*70)
    print(f"\n{improvement_plan}\n")
    print("="*70)
    
    # Step 4: Interactive mode
    print("\n🎯 What would you like me to do?")
    print("  1. Show detailed analysis of any file")
    print("  2. Implement a specific improvement")
    print("  3. Auto-fix code quality issues")
    print("  4. Continue to interactive assistant")
    print("  5. Exit")
    
    choice = input("\nChoice (1-5): ").strip()
    
    if choice == "1":
        file_name = input("Enter file name: ").strip()
        print(f"\n📖 Detailed Analysis of {file_name}:")
        print("-" * 70)
        analysis = agent.analyze_code(file_name)
        print(analysis)
    
    elif choice == "2":
        improvement = input("Describe the improvement: ").strip()
        print(f"\n💡 Planning implementation...")
        response = agent.process_query(f"Create implementation plan for: {improvement}")
        print(response)
    
    elif choice == "3":
        print("\n🔧 Auto-fixing code quality issues...")
        for issue in issues['code_quality'][:3]:
            print(f"\n  Analyzing: {issue['file']}")
            result = agent.auto_improve_code(issue['file'])
            print(f"  ✓ Suggestions ready")
    
    elif choice == "4":
        print("\n🚀 Launching interactive assistant...")
        import coding_assistant
        coding_assistant.main()
    
    print("\n✓ Session complete!")

if __name__ == "__main__":
    main()
