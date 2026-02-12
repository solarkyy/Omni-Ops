# Interactive Coding Assistant

from agent_with_tracing import OmniAgent, setup_tracing
import os

def main():
    """Interactive coding assistant"""
    
    setup_tracing()
    
    print("="*70)
    print("🚀 OMNI OPS CODING EXPERT")
    print("="*70)
    print("\nInitializing agent...")
    
    agent = OmniAgent(
        use_local=True,
        workspace_path=os.getcwd()
    )
    
    print("\n" + "="*70)
    print("READY! Ask me anything about your code.")
    print("="*70)
    print("\nCommands:")
    print("  - Type your question")
    print("  - 'analyze <file>' - Deep code analysis")
    print("  - 'files' - List all files")
    print("  - 'quit' - Exit")
    print("\n" + "="*70 + "\n")
    
    while True:
        try:
            user_input = input("\n💬 You: ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            if user_input.lower() == 'files':
                print("\n📁 Workspace Files:")
                for file_path, info in list(agent.codebase_context['files'].items())[:20]:
                    print(f"  {file_path} ({info['lines']} lines)")
                if agent.codebase_context['file_count'] > 20:
                    print(f"  ... and {agent.codebase_context['file_count'] - 20} more files")
                continue
            
            if user_input.lower().startswith('analyze '):
                file_path = user_input[8:].strip()
                print(f"\n🔍 Analyzing {file_path}...")
                print("-" * 70)
                response = agent.analyze_code(file_path)
                print(f"\n{response}\n")
                print("=" * 70)
                continue
            
            # Regular query
            print("\n🤖 Assistant:")
            print("-" * 70)
            response = agent.process_query(user_input)
            print(f"\n{response}\n")
            print("=" * 70)
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()
