# Omni Ops Coding Expert - AI Assistant

## 🚀 Features

Your AI agent is now a **coding expert** trained on your entire Omni Ops codebase!

### Capabilities

✅ **Code Analysis** - Understand your entire codebase structure  
✅ **File Reading** - Access and analyze any file  
✅ **Bug Detection** - Identify issues and suggest fixes  
✅ **Optimization** - Improve performance and efficiency  
✅ **Architecture** - Design patterns and best practices  
✅ **Debugging** - Help solve complex problems  
✅ **Code Review** - Quality assessments and improvements  
✅ **Feature Development** - Plan and implement new features  

## 📖 Usage

### Interactive Mode (Recommended)
```powershell
python coding_assistant.py
```

Then ask questions like:
- "How can I optimize the game loop?"
- "Review the multiplayer sync code"
- "Find potential memory leaks"
- "Explain how the NPC AI works"
- "analyze js/omni-core-game.js"

### Programmatic Mode
```python
from agent_with_tracing import OmniAgent, setup_tracing
import os

setup_tracing()
agent = OmniAgent(use_local=True, workspace_path=os.getcwd())

# Ask a question
response = agent.process_query("What's causing the Tab key conflict?")
print(response)

# Analyze specific file
analysis = agent.analyze_code("js/omni-pipboy-system.js")
print(analysis)

# Get file content
content = agent.get_file_content("index.html")
```

## 🎯 Example Questions

### Code Review
- "Review js/omni-core-game.js for best practices"
- "What are potential issues in the multiplayer code?"
- "Check for security vulnerabilities"

### Optimization
- "How can I improve FPS performance?"
- "What's the best way to reduce memory usage?"
- "Optimize the NPC pathfinding algorithm"

### Debugging
- "Why is the Pip-Boy not opening correctly?"
- "Debug the pointer lock conflict"
- "Find race conditions in multiplayer sync"

### Architecture
- "Explain the game's module system"
- "How should I add a new feature?"
- "Suggest better code organization"

### Feature Development
- "How do I add a new weapon type?"
- "Implement a save/load system"
- "Add weather effects to the game"

## 🔍 Codebase Context

The agent automatically loads:
- All JavaScript files (game logic)
- HTML files (UI structure)
- CSS files (styling)
- Python files (AI systems)

**Total analyzed:** {file_count} files, {total_lines} lines

## 💡 Advanced Features

### With Context (Default)
```python
response = agent.process_query("How does the inventory work?", include_context=True)
```
Includes codebase structure in the prompt for better answers.

### Without Context (Faster)
```python
response = agent.process_query("Explain React hooks", include_context=False)
```
For general programming questions not specific to your code.

### File Analysis
```python
analysis = agent.analyze_code("js/omni-pipboy-system.js")
```
Deep dive into specific file with:
- Purpose and functionality
- Key components
- Potential issues
- Quality assessment

## 📊 Tracing

All operations are traced in AI Toolkit:
- **load_codebase_context** - How long it takes to scan files
- **process_query** - Full question-answer flow
- **get_file_content** - File reads
- **analyze_code** - Code analysis spans

View performance metrics to optimize your workflow!

## 🎓 Training

The agent is trained with:

**System Prompt:**
```
Expert in:
- JavaScript/ES6+ (Three.js, game development)
- HTML5/CSS3 (game UI/UX) 
- Python (AI agents, backend)
- Game development (FPS mechanics, multiplayer, NPCs)
- Code optimization and debugging
- Architecture and design patterns
```

**Codebase Knowledge:**
- Scans your entire workspace
- Understands file structure
- Knows about all modules
- Can read any file on demand

## 🔥 Pro Tips

1. **Be Specific** - "Optimize the enemy AI in omni-npc-living-city.js" vs "Make game faster"

2. **Use Commands** - In interactive mode:
   - `analyze <file>` for deep analysis
   - `files` to see all available files

3. **Iterate** - Ask follow-up questions to dive deeper

4. **Code Examples** - Ask "Show me code for..." to get implementations

5. **Context Control** - Disable context for general questions to save time

## 🛠️ Troubleshooting

**"No files found"**
- Make sure you're in the Omni Ops directory
- Check workspace_path parameter

**Slow responses**
- Use `include_context=False` for general questions
- Consider using a smaller model for faster inference

**Out of memory**
- Don't include entire large files in queries
- The agent auto-truncates to 3000 chars for analysis

## 🚀 Next Steps

Your coding assistant is ready! It's like having a senior developer who knows your entire codebase sitting next to you.

Start with:
```powershell
python coding_assistant.py
```

Then ask it to help with your current development task!
