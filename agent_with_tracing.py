"""
AI Agent with OpenTelemetry Tracing
Configured to send traces to http://localhost:4318
Full implementation with code analysis, file scanning, and AI-powered improvements
"""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.requests import RequestsInstrumentor
import os
import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Any

# Configure OpenTelemetry with custom OTLP endpoint
def setup_tracing():
    """Initialize OpenTelemetry tracing with OTLP exporter"""
    
    # Create resource with service information
    resource = Resource.create({
        "service.name": "omni-ops-agent",
        "service.version": "1.0.0",
    })
    
    # Set up tracer provider
    provider = TracerProvider(resource=resource)
    
    # Configure OTLP exporter to use AI Toolkit endpoint
    otlp_exporter = OTLPSpanExporter(
        endpoint="http://localhost:4318/v1/traces",
        timeout=30,
    )
    
    # Add span processor
    processor = BatchSpanProcessor(otlp_exporter)
    provider.add_span_processor(processor)
    
    # Set as global tracer provider
    trace.set_tracer_provider(provider)
    
    # Auto-instrument HTTP requests
    RequestsInstrumentor().instrument()
    
    print("✓ Tracing initialized - sending to http://localhost:4318")


# Full AI Agent implementation with code analysis capabilities
class OmniAgent:
    def __init__(self, use_local: bool = True, workspace_path: str = None):
        self.tracer = trace.get_tracer(__name__)
        self.use_local = use_local
        self.workspace_path = workspace_path or os.getcwd()
        
        # Initialize codebase context
        self.codebase_context = self._scan_workspace()
        
        # Knowledge base for intelligent responses
        self.knowledge_base = {
            "game": {
                "controls": "WASD=move, Mouse=look, Tab=Pipboy, F2=Editor, M=Commander, I=Inventory",
                "features": "FPS gameplay, Multiplayer, NPC AI, Living world, Story system, UE5 editor",
                "tech": "Three.js, PeerJS, JavaScript ES6, modular architecture"
            },
            "code_patterns": {
                "best_practices": ["Use const/let", "Avoid global state", "Error handling", "Clean functions"],
                "anti_patterns": ["var usage", "Callback hell", "Memory leaks", "Magic numbers"]
            }
        }
        
        print(f"✓ Omni Agent initialized - Workspace: {self.workspace_path}")
        print(f"✓ Scanned {self.codebase_context['file_count']} files")
    
    def _scan_workspace(self) -> Dict[str, Any]:
        """Scan workspace and build codebase context"""
        with self.tracer.start_as_current_span("scan_workspace") as span:
            context = {
                "files": {},
                "file_count": 0,
                "total_lines": 0,
                "languages": {}
            }
            
            extensions = {'.js': 'javascript', '.py': 'python', '.html': 'html', 
                         '.css': 'css', '.json': 'json', '.md': 'markdown'}
            
            for ext, lang in extensions.items():
                for file_path in Path(self.workspace_path).rglob(f'*{ext}'):
                    if 'node_modules' in str(file_path) or '__pycache__' in str(file_path):
                        continue
                    
                    try:
                        relative_path = str(file_path.relative_to(self.workspace_path))
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = f.readlines()
                            context['files'][relative_path] = {
                                'lines': len(lines),
                                'language': lang,
                                'path': str(file_path)
                            }
                            context['total_lines'] += len(lines)
                            context['languages'][lang] = context['languages'].get(lang, 0) + 1
                    except Exception:
                        pass
            
            context['file_count'] = len(context['files'])
            span.set_attribute("files_scanned", context['file_count'])
            return context
    
    def get_file_content(self, file_path: str) -> str:
        """Get content of a file"""
        try:
            full_path = os.path.join(self.workspace_path, file_path)
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            return f"Error reading file: {e}"
    
    def scan_for_issues(self) -> Dict[str, List[Dict]]:
        """Scan codebase for common issues"""
        with self.tracer.start_as_current_span("scan_for_issues") as span:
            issues = {
                "performance": [],
                "bugs": [],
                "security": [],
                "code_quality": []
            }
            
            js_files = [f for f in self.codebase_context['files'].keys() if f.endswith('.js')]
            
            for file_path in js_files:
                content = self.get_file_content(file_path)
                
                # Performance issues
                if 'setInterval' in content and 'clearInterval' not in content:
                    issues['performance'].append({
                        'file': file_path,
                        'type': 'memory_leak',
                        'message': 'setInterval without clearInterval - memory leak risk'
                    })
                
                # Bug patterns
                if re.search(r'== null|!= null', content):
                    issues['bugs'].append({
                        'file': file_path,
                        'type': 'null_check',
                        'message': 'Use === or !== for null checks'
                    })
                
                # Security
                if 'eval(' in content:
                    issues['security'].append({
                        'file': file_path,
                        'type': 'eval_usage',
                        'message': 'eval() is dangerous - avoid using it'
                    })
                
                # Code quality
                if content.count('console.log') > 20:
                    issues['code_quality'].append({
                        'file': file_path,
                        'type': 'debug_code',
                        'message': f'Excessive console.log statements ({content.count("console.log")})'
                    })
            
            span.set_attribute("issues_found", sum(len(v) for v in issues.values()))
            return issues
    
    def analyze_code(self, file_path: str) -> str:
        """Deep analysis of a code file"""
        with self.tracer.start_as_current_span("analyze_code") as span:
            content = self.get_file_content(file_path)
            
            if "Error reading" in content:
                return content
            
            analysis = []
            analysis.append(f"📄 File Analysis: {file_path}\n")
            analysis.append(f"{'='*60}\n")
            
            # Size metrics
            lines = content.split('\n')
            analysis.append(f"\n📊 Metrics:")
            analysis.append(f"  Lines: {len(lines)}")
            analysis.append(f"  Characters: {len(content)}")
            analysis.append(f"  Functions: {content.count('function')} (approx)")
            
            # Identify patterns
            analysis.append(f"\n🔍 Patterns Found:")
            if 'class ' in content:
                classes = re.findall(r'class\s+(\w+)', content)
                analysis.append(f"  Classes: {', '.join(classes[:5])}")
            
            if 'function ' in content or '=>' in content:
                analysis.append(f"  Function declarations: {content.count('function')}")
                analysis.append(f"  Arrow functions: {content.count('=>')}")
            
            # Check for best practices
            analysis.append(f"\n✅ Best Practices:")
            if 'use strict' in content:
                analysis.append("  ✓ Strict mode enabled")
            if 'try {' in content or 'catch' in content:
                analysis.append("  ✓ Error handling present")
            if '// ' in content or '/* ' in content:
                analysis.append("  ✓ Code documentation found")
            
            # Warnings
            warnings = []
            if 'var ' in content:
                warnings.append("  ⚠ Using 'var' (prefer const/let)")
            if content.count('console.log') > 10:
                warnings.append(f"  ⚠ Many console.log statements ({content.count('console.log')})")
            
            if warnings:
                analysis.append(f"\n⚠️  Warnings:")
                analysis.extend(warnings)
            
            span.set_attribute("file_analyzed", file_path)
            return '\n'.join(analysis)
    
    def auto_improve_code(self, file_path: str) -> Dict[str, Any]:
        """Generate improvement suggestions for code"""
        with self.tracer.start_as_current_span("auto_improve_code") as span:
            content = self.get_file_content(file_path)
            
            suggestions = {
                "file": file_path,
                "improvements": [],
                "priority": "medium"
            }
            
            # Check various improvement opportunities
            if 'var ' in content:
                suggestions['improvements'].append({
                    "type": "modernization",
                    "description": "Replace 'var' with 'const' or 'let'",
                    "impact": "medium"
                })
            
            if content.count('console.log') > 15:
                suggestions['improvements'].append({
                    "type": "cleanup",
                    "description": "Remove or gate debug console.log statements",
                    "impact": "low"
                })
            
            if 'setInterval' in content and 'clearInterval' not in content:
                suggestions['improvements'].append({
                    "type": "bug_fix",
                    "description": "Add cleanup for setInterval to prevent memory leaks",
                    "impact": "high"
                })
                suggestions['priority'] = "high"
            
            if not any(x in content for x in ['try', 'catch']):
                suggestions['improvements'].append({
                    "type": "robustness",
                    "description": "Add error handling with try-catch blocks",
                    "impact": "medium"
                })
            
            span.set_attribute("suggestions_count", len(suggestions['improvements']))
            return suggestions
    
    def process_query(self, query: str, include_context: bool = False) -> str:
        """Process a query with automatic tracing and intelligent responses"""
        with self.tracer.start_as_current_span("process_query") as span:
            span.set_attribute("query.text", query)
            span.set_attribute("query.length", len(query))
            
            # Analyze query intent
            result = self._analyze_query(query)
            
            # Generate contextual response
            if include_context:
                result['context'] = self.codebase_context
            
            response = self._generate_response(result, query)
            
            span.set_attribute("response.length", len(response))
            return response
    
    def _analyze_query(self, query: str) -> dict:
        """Analyze the query (traced automatically as child span)"""
        with self.tracer.start_as_current_span("analyze_query") as span:
            query_lower = query.lower()
            
            # Determine intent
            intent = "information_request"
            if any(word in query_lower for word in ["fix", "bug", "error", "problem"]):
                intent = "debugging"
            elif any(word in query_lower for word in ["improve", "optimize", "better"]):
                intent = "optimization"
            elif any(word in query_lower for word in ["how", "what", "why", "explain"]):
                intent = "explanation"
            elif any(word in query_lower for word in ["create", "add", "implement"]):
                intent = "implementation"
            
            # Extract entities
            entities = []
            for key in self.knowledge_base.keys():
                if key in query_lower:
                    entities.append(key)
            
            analysis = {
                "intent": intent,
                "entities": entities,
                "sentiment": "neutral",
                "query": query
            }
            
            span.set_attribute("analysis.intent", analysis["intent"])
            return analysis
    
    def _generate_response(self, analysis: dict, original_query: str) -> str:
        """Generate intelligent response based on analysis"""
        with self.tracer.start_as_current_span("generate_response") as span:
            span.set_attribute("intent", analysis["intent"])
            
            intent = analysis["intent"]
            query_lower = original_query.lower()
            
            # Context-aware responses based on intent and content
            if intent == "debugging":
                response = self._generate_debug_response(query_lower)
            elif intent == "optimization":
                response = self._generate_optimization_response(query_lower)
            elif intent == "explanation":
                response = self._generate_explanation_response(query_lower)
            elif intent == "implementation":
                response = self._generate_implementation_response(query_lower)
            else:
                response = self._generate_general_response(query_lower)
            
            return response
    
    def _generate_debug_response(self, query: str) -> str:
        """Generate debugging-focused response"""
        if "memory" in query or "leak" in query:
            return """Memory Leak Prevention:
1. Always pair setInterval with clearInterval
2. Remove event listeners in cleanup (removeEventListener)
3. Clear timers on component unmount
4. Avoid circular references in closures
5. Use WeakMap/WeakSet for caching

Check files with: setInterval, addEventListener without cleanup."""
        
        return """Debug Checklist:
1. Check browser console for errors (F12)
2. Verify all dependencies loaded (Three.js, PeerJS)
3. Check network tab for failed requests
4. Use breakpoints in DevTools
5. Add strategic console.log statements
6. Use OmniDiagnostics.runAllChecks() in console"""
    
    def _generate_optimization_response(self, query: str) -> str:
        """Generate optimization-focused response"""
        if "performance" in query:
            return """Performance Optimization:
1. Reduce draw calls - merge geometries
2. Use frustum culling for off-screen objects
3. Implement LOD (Level of Detail) system
4. Optimize texture sizes (power of 2)
5. Use object pooling for frequently created/destroyed objects
6. Profile with browser Performance tab"""
        
        return """Code Quality Improvements:
1. Replace 'var' with 'const/let'
2. Add error handling (try-catch)
3. Remove excessive console.log
4. Document complex functions
5. Extract magic numbers to constants
6. Split large files into modules"""
    
    def _generate_explanation_response(self, query: str) -> str:
        """Generate explanation-focused response"""
        if "control" in query or "key" in query:
            return self.knowledge_base["game"]["controls"]
        
        if "feature" in query:
            return f"Omni-Ops Features: {self.knowledge_base['game']['features']}"
        
        if "tech" in query or "stack" in query:
            return f"Tech Stack: {self.knowledge_base['game']['tech']}"
        
        return f"""Omni-Ops is a modular FPS game with:
- Complete FPS controls and physics
- Multiplayer P2P networking
- UE5-style in-game editor
- Living world with AI NPCs
- Dynamic story system
- Pip-Boy interface

Files: {self.codebase_context['file_count']} | Lines: {self.codebase_context['total_lines']}"""
    
    def _generate_implementation_response(self, query: str) -> str:
        """Generate implementation-focused response"""
        if "npc" in query:
            return """NPC Implementation:
1. Use state machine (IDLE, PATROL, COMBAT, FLEE)
2. Add decision tree for behavior selection
3. Implement path finding (A* algorithm)
4. Add perception system (sight, hearing)
5. Create goal-oriented behavior
6. Sync state in multiplayer"""
        
        if "ai" in query:
            return """AI Integration:
1. Define behavior tree structure
2. Implement decision-making logic
3. Add context awareness
4. Create memory system
5. Enable learning from interactions
6. Balance challenge and fairness"""
        
        return """Implementation Steps:
1. Plan architecture and data structures
2. Create base classes/prototypes
3. Implement core logic
4. Add error handling
5. Test thoroughly
6. Document usage
7. Integrate with existing systems"""
    
    def _generate_general_response(self, query: str) -> str:
        """Generate general response"""
        return f"""I can help with:
- Code analysis and debugging
- Performance optimization
- Feature implementation
- Game mechanics explanation
- Architecture improvements

Workspace: {self.codebase_context['file_count']} files
Ask me anything specific about the codebase!"""


def main():
    """Main function to run the agent with tracing"""
    
    # Initialize tracing
    setup_tracing()
    
    # Create agent
    agent = OmniAgent()
    
    # Example queries with tracing
    queries = [
        "What is Omni Ops?",
        "How do I play the game?",
        "Tell me about the inventory system"
    ]
    
    print("\n" + "="*60)
    print("Running Agent with Tracing Visualization")
    print("="*60 + "\n")
    
    for query in queries:
        print(f"Query: {query}")
        response = agent.process_query(query)
        print(f"Response: {response}\n")
    
    print("="*60)
    print("✓ All operations traced to http://localhost:4318")
    print("="*60)


if __name__ == "__main__":
    main()
