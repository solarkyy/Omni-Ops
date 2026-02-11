"""
Quick Start: AI In-Game Testing System
Launch this to start testing your game with AI
"""

from agent_with_tracing import OmniAgent, setup_tracing
import time
import sys

def main():
    print("\n" + "="*70)
    print("🤖 OMNI OPS - AI IN-GAME TESTING SYSTEM")
    print("="*70)
    print("\nThis system allows AI to test your game in real-time!")
    print("\n📋 What you can do:")
    print("  1. Visual testing interface (press F3 in-game)")
    print("  2. Real-time AI chat")
    print("  3. Automated test execution")
    print("  4. Visual markers showing test locations")
    print("="*70 + "\n")
    
    # Initialize tracing
    print("⏳ Initializing tracing...")
    setup_tracing()
    print("✓ Tracing ready\n")
    
    # Create AI agent
    print("⏳ Loading AI agent...")
    agent = OmniAgent(
        use_local=True,
        workspace_path='.'
    )
    print("✓ AI agent ready\n")
    
    # Start game testing server
    print("⏳ Starting game testing bridge...")
    bridge = agent.start_game_testing_server(port=8080)
    
    if not bridge:
        print("\n⚠ Could not start game testing bridge")
        print("💡 Make sure you have the required dependencies")
        sys.exit(1)
    
    print("\n" + "="*70)
    print("🎮 SYSTEM READY!")
    print("="*70)
    print("\n📌 Next Steps:")
    print("  1. Open your game: http://localhost:8000")
    print("  2. Press F3 to open AI testing interface")
    print("  3. Try these commands in the chat:")
    print("     - 'test movement'")
    print("     - 'test shooting'")
    print("     - 'test ui'")
    print("     - 'test all'")
    print("\n💡 Tips:")
    print("  - Visual markers show where tests are running")
    print("  - Green = Pass, Red = Fail, Cyan = Testing")
    print("  - Check the visual log for detailed activity")
    print("\n" + "="*70)
    print("\n🔴 Press Ctrl+C to stop the server")
    print("="*70 + "\n")
    
    # Keep the server running
    try:
        while True:
            time.sleep(1)
            
            # Show stats every 30 seconds
            if int(time.time()) % 30 == 0:
                results = agent.get_game_test_results(5)
                if results:
                    print(f"\n📊 Recent activity: {len(results)} tests completed")
    
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        if hasattr(agent, 'game_bridge'):
            agent.game_bridge.stop_server()
        print("✓ Server stopped")
        print("\n👋 Thanks for using AI In-Game Testing!\n")


if __name__ == "__main__":
    main()
