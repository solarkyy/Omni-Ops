"""
AI Coding Agent with OpenTelemetry Tracing
Coding expert trained on your Omni Ops codebase
Now with in-game testing capabilities!
"""

import os
import json
import glob
from pathlib import Path
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.requests import RequestsInstrumentor
import requests

# Import game testing bridge
try:
    from ai_game_bridge import GameTestingBridge, AIGameTester
    GAME_TESTING_AVAILABLE = True
except ImportError:
    GAME_TESTING_AVAILABLE = False
    print("⚠ Game testing bridge not available (optional)")

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
    # Use 4319 as specified, or try 4318 (standard HTTP) if connection fails
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


# Coding Expert AI Agent with traced operations
class OmniAgent:
    def __init__(self, api_key=None, use_local=False, local_model="llama3.2", workspace_path=None):
        self.tracer = trace.get_tracer(__name__)
        self.api_key = api_key or os.getenv("MOONSHOT_API_KEY")
        self.local_model = local_model
        self.use_local = use_local
        self.workspace_path = workspace_path or os.getcwd()
        
        # Load codebase context
        self.codebase_context = self._load_codebase_context()
        
        # Try to detect Ollama if use_local is True
        if use_local:
            if self._check_ollama():
                print(f"✓ Coding Agent initialized with LOCAL model: {local_model}")
                print(f"✓ Workspace: {self.workspace_path}")
                print(f"✓ Analyzed {self.codebase_context['file_count']} files")
                self.mode = "local"
                self.local_endpoint = "http://localhost:11434/api/chat"
            else:
                print("⚠ Ollama not detected. Install: https://ollama.com")
                print("⚠ Falling back to demo mode")
                self.mode = "demo"
        elif self.api_key:
            print("✓ Coding Agent initialized with Kimi k2 (cloud)")
            print(f"✓ Workspace: {self.workspace_path}")
            print(f"✓ Analyzed {self.codebase_context['file_count']} files")
            self.mode = "kimi"
            self.api_endpoint = "https://api.moonshot.cn/v1/chat/completions"
            self.model = "moonshot-v1-8k"
        else:
            print("⚠ No API key or local model - running in demo mode")
            print("💡 Tip: Set use_local=True or MOONSHOT_API_KEY")
            self.mode = "demo"
    
    def _check_ollama(self) -> bool:
        """Check if Ollama is running"""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False
    
    def _load_codebase_context(self) -> dict:
        """Load and analyze the codebase structure"""
        with self.tracer.start_as_current_span("load_codebase_context") as span:
            context = {
                "files": {},
                "structure": {},
                "file_count": 0,
                "total_lines": 0
            }
            
            try:
                # Scan JavaScript files
                js_files = glob.glob(os.path.join(self.workspace_path, "**/*.js"), recursive=True)
                html_files = glob.glob(os.path.join(self.workspace_path, "**/*.html"), recursive=True)
                css_files = glob.glob(os.path.join(self.workspace_path, "**/*.css"), recursive=True)
                py_files = glob.glob(os.path.join(self.workspace_path, "**/*.py"), recursive=True)
                
                all_files = js_files + html_files + css_files + py_files
                
                for file_path in all_files:
                    rel_path = os.path.relpath(file_path, self.workspace_path)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            lines = content.count('\n')
                            context["files"][rel_path] = {
                                "lines": lines,
                                "size": len(content),
                                "type": Path(file_path).suffix
                            }
                            context["total_lines"] += lines
                            context["file_count"] += 1
                    except:
                        pass
                
                # Build file structure summary
                context["structure"] = {
                    "js_files": len(js_files),
                    "html_files": len(html_files),
                    "css_files": len(css_files),
                    "py_files": len(py_files)
                }
                
                span.set_attribute("files.total", context["file_count"])
                span.set_attribute("lines.total", context["total_lines"])
                
            except Exception as e:
                span.set_attribute("error", str(e))
            
            return context
    
    def get_file_content(self, file_path: str) -> str:
        """Read a file from the workspace"""
        with self.tracer.start_as_current_span("get_file_content") as span:
            span.set_attribute("file_path", file_path)
            try:
                full_path = os.path.join(self.workspace_path, file_path)
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    span.set_attribute("file_size", len(content))
                    return content
            except Exception as e:
                span.set_attribute("error", str(e))
                return f"Error reading file: {e}"
    
    def write_file(self, file_path: str, content: str, backup: bool = True) -> dict:
        """Write content to a file with optional backup"""
        with self.tracer.start_as_current_span("write_file") as span:
            span.set_attribute("file_path", file_path)
            span.set_attribute("content_size", len(content))
            span.set_attribute("backup", backup)
            
            try:
                full_path = os.path.join(self.workspace_path, file_path)
                
                # Create backup if requested and file exists
                if backup and os.path.exists(full_path):
                    backup_path = f"{full_path}.backup"
                    import shutil
                    shutil.copy2(full_path, backup_path)
                    span.set_attribute("backup_path", backup_path)
                
                # Write the new content
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                span.set_attribute("success", True)
                return {
                    "success": True,
                    "file": file_path,
                    "bytes_written": len(content),
                    "backup_created": backup and os.path.exists(full_path)
                }
            except Exception as e:
                span.set_attribute("error", str(e))
                span.set_attribute("success", False)
                return {
                    "success": False,
                    "error": str(e)
                }
    
    def analyze_code(self, file_path: str) -> str:
        """Analyze a specific code file"""
        content = self.get_file_content(file_path)
        if content.startswith("Error"):
            return content
        
        query = f"""Analyze this {file_path} file and provide:
1. Purpose and main functionality
2. Key functions/components
3. Potential issues or improvements
4. Code quality assessment

Code:
```
{content[:3000]}  # First 3000 chars
```
"""
        return self.process_query(query)
    
    def auto_improve_code(self, file_path: str, apply_changes: bool = False) -> dict:
        """Automatically analyze and suggest improvements for a file"""
        with self.tracer.start_as_current_span("auto_improve_code") as span:
            span.set_attribute("file_path", file_path)
            span.set_attribute("apply_changes", apply_changes)
            
            content = self.get_file_content(file_path)
            if content.startswith("Error"):
                return {"error": content}
            
            # Ask AI for improvements
            query = f"""Analyze this code and provide SPECIFIC improvements:

File: {file_path}
```
{content[:4000]}
```

Provide:
1. List of specific issues found
2. Concrete improvement suggestions
3. If applicable, provide the improved code sections

Focus on:
- Performance optimization
- Bug fixes
- Code clarity
- Best practices
"""
            
            analysis = self.process_query(query, include_context=True)
            
            result = {
                "file": file_path,
                "analysis": analysis,
                "changes_applied": False
            }
            
            span.set_attribute("analysis_length", len(analysis))
            return result
    
    def scan_for_issues(self) -> dict:
        """Scan entire codebase for common issues"""
        with self.tracer.start_as_current_span("scan_for_issues") as span:
            issues = {
                "performance": [],
                "bugs": [],
                "security": [],
                "code_quality": []
            }
            
            # Focus on key files
            key_files = [
                f for f in self.codebase_context['files'].keys()
                if f.endswith('.js') and 'omni' in f.lower()
            ]
            
            span.set_attribute("files_to_scan", len(key_files))
            
            # Scan up to 5 most important files
            for file_path in key_files[:5]:
                content = self.get_file_content(file_path)
                if len(content) < 100:
                    continue
                
                # Quick pattern matching for common issues
                if 'console.log' in content:
                    issues['code_quality'].append({
                        "file": file_path,
                        "type": "debug_code",
                        "message": "Contains console.log statements that should be removed in production"
                    })
                
                if 'setTimeout' in content and 'clearTimeout' not in content:
                    issues['bugs'].append({
                        "file": file_path,
                        "type": "memory_leak",
                        "message": "setTimeout without clearTimeout may cause memory leaks"
                    })
                
                if 'innerHTML' in content:
                    issues['security'].append({
                        "file": file_path,
                        "type": "xss_risk",
                        "message": "Using innerHTML could be an XSS vulnerability"
                    })
            
            total_issues = sum(len(v) for v in issues.values())
            span.set_attribute("total_issues_found", total_issues)
            
            return issues
    
    def process_query(self, query: str, include_context: bool = True) -> str:
        """Process a query with automatic tracing and code context"""
        with self.tracer.start_as_current_span("process_query") as span:
            span.set_attribute("query.text", query[:200])  # Truncate for viewing
            span.set_attribute("query.length", len(query))
            span.set_attribute("mode", self.mode)
            span.set_attribute("include_context", include_context)
            
            # Add codebase context if requested
            if include_context and self.codebase_context["file_count"] > 0:
                context_str = self._build_context_string()
                enhanced_query = f"""{context_str}

User Question:
{query}
"""
            else:
                enhanced_query = query
            
            if self.mode == "local":
                span.set_attribute("model", self.local_model)
                response = self._call_local_llm(enhanced_query)
            elif self.mode == "kimi":
                span.set_attribute("model", self.model)
                response = self._call_kimi_k2(enhanced_query)
            else:
                # Demo mode
                result = self._analyze_query(query)
                response = self._generate_response(result)
            
            span.set_attribute("response.length", len(response))
            return response
    
    def _build_context_string(self) -> str:
        """Build context string about the codebase"""
        ctx = self.codebase_context
        files_list = "\n".join([f"  - {path} ({info['lines']} lines)" 
                                for path, info in list(ctx['files'].items())[:10]])
        
        return f"""CODEBASE CONTEXT:
Project: Omni Ops - Tactical FPS Game
Total Files: {ctx['file_count']}
Total Lines: {ctx['total_lines']}
Structure: {ctx['structure']['js_files']} JS, {ctx['structure']['html_files']} HTML, {ctx['structure']['css_files']} CSS, {ctx['structure']['py_files']} Python

Key Files:
{files_list}

You are an expert coding assistant. Use this context to provide accurate, codebase-specific answers.
"""
    
    def _call_local_llm(self, query: str) -> str:
        """Call local Ollama model"""
        with self.tracer.start_as_current_span("call_local_llm") as span:
            span.set_attribute("model", self.local_model)
            span.set_attribute("api_endpoint", self.local_endpoint)
            
            try:
                payload = {
                    "model": self.local_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are an expert coding assistant specializing in:
- JavaScript/ES6+ (Three.js, game development)
- HTML5/CSS3 (game UI/UX)
- Python (AI agents, backend)
- Game development (FPS mechanics, multiplayer, NPCs)
- Code optimization and debugging
- Architecture and design patterns

Provide detailed, actionable advice with code examples when relevant.
Focus on efficiency, best practices, and maintainability.
"""
                        },
                        {
                            "role": "user",
                            "content": query
                        }
                    ],
                    "stream": False
                }
                
                span.set_attribute("request.streaming", False)
                
                response = requests.post(
                    self.local_endpoint,
                    json=payload,
                    timeout=60
                )
                
                span.set_attribute("response.status_code", response.status_code)
                
                if response.status_code == 200:
                    result = response.json()
                    answer = result["message"]["content"]
                    
                    # Ollama provides token counts in eval_count
                    if "eval_count" in result:
                        span.set_attribute("tokens.completion", result.get("eval_count", 0))
                    if "prompt_eval_count" in result:
                        span.set_attribute("tokens.prompt", result.get("prompt_eval_count", 0))
                    
                    return answer
                else:
                    error_msg = f"Ollama Error: {response.status_code} - {response.text}"
                    span.set_attribute("error", error_msg)
                    return f"Error calling local model: {error_msg}"
                    
            except Exception as e:
                error_msg = str(e)
                span.set_attribute("error", error_msg)
                return f"Error: {error_msg}"
    
    def _analyze_query(self, query: str) -> dict:
        """Analyze the query (traced automatically as child span)"""
        with self.tracer.start_as_current_span("analyze_query") as span:
            # Simulate analysis
            analysis = {
                "intent": "information_request",
                "entities": ["omni-ops", "game"],
                "sentiment": "neutral"
            }
            span.set_attribute("analysis.intent", analysis["intent"])
            return analysis
    
    def _call_kimi_k2(self, query: str) -> str:
        """Call Kimi k2 model via Moonshot AI API"""
        with self.tracer.start_as_current_span("call_kimi_k2") as span:
            span.set_attribute("model", self.model)
            span.set_attribute("api_endpoint", self.api_endpoint)
            
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are an expert coding assistant specializing in:
- JavaScript/ES6+ (Three.js, game development)
- HTML5/CSS3 (game UI/UX)
- Python (AI agents, backend)
- Game development (FPS mechanics, multiplayer, NPCs)
- Code optimization and debugging
- Architecture and design patterns

Provide detailed, actionable advice with code examples when relevant.
Focus on efficiency, best practices, and maintainability.
"""
                        },
                        {
                            "role": "user",
                            "content": query
                        }
                    ],
                    "temperature": 0.7
                }
                
                span.set_attribute("request.token_estimate", len(query.split()))
                
                response = requests.post(
                    self.api_endpoint,
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                span.set_attribute("response.status_code", response.status_code)
                
                if response.status_code == 200:
                    result = response.json()
                    answer = result["choices"][0]["message"]["content"]
                    
                    if "usage" in result:
                        span.set_attribute("tokens.prompt", result["usage"].get("prompt_tokens", 0))
                        span.set_attribute("tokens.completion", result["usage"].get("completion_tokens", 0))
                        span.set_attribute("tokens.total", result["usage"].get("total_tokens", 0))
                    
                    return answer
                else:
                    error_msg = f"API Error: {response.status_code} - {response.text}"
                    span.set_attribute("error", error_msg)
                    return f"Error calling Kimi k2: {error_msg}"
                    
            except Exception as e:
                error_msg = str(e)
                span.set_attribute("error", error_msg)
                return f"Error: {error_msg}"
    
    def _generate_response(self, analysis: dict) -> str:
        """Generate response based on analysis (demo mode)"""
        with self.tracer.start_as_current_span("generate_response") as span:
            span.set_attribute("intent", analysis["intent"])
            
            response = f"[DEMO MODE] Processing request with intent: {analysis['intent']}"
            return response
    
    def start_game_testing_server(self, port=8080):
        """Start the game testing bridge server"""
        if not GAME_TESTING_AVAILABLE:
            print("⚠ Game testing bridge not available. Run: pip install flask")
            return None
        
        self.game_bridge = GameTestingBridge(port=port)
        self.game_bridge.start_server()
        self.game_tester = AIGameTester(self.game_bridge)
        print(f"\n🎮 Game testing server started on port {port}")
        print("   Open game and press F3 for testing interface")
        return self.game_bridge
    
    def run_game_tests(self):
        """Run automated game tests"""
        if not hasattr(self, 'game_tester'):
            print("⚠ Game testing not initialized. Call start_game_testing_server() first.")
            return
        
        return self.game_tester.run_automated_tests()
    
    def get_game_test_results(self, limit=10):
        """Get recent game test results"""
        if not hasattr(self, 'game_bridge'):
            return []
        return self.game_bridge.get_test_results(limit)
    
    def chat_with_game_tester(self, message: str):
        """Send a message to the game testing AI"""
        if not hasattr(self, 'game_bridge'):
            print("⚠ Game testing not initialized. Call start_game_testing_server() first.")
            return None
        
        response = self.game_bridge.process_user_message(message)
        return response


def main():
    """Main function to run the coding agent with tracing"""
    
    # Initialize tracing
    setup_tracing()
    
    # Create coding agent with workspace context
    agent = OmniAgent(
        use_local=True,
        workspace_path=os.getcwd()
    )
    
    print("\n" + "="*60)
    print("OMNI OPS CODING ASSISTANT")
    print("Expert in game development, optimization, and debugging")
    print("="*60 + "\n")
    
    # Example coding queries
    queries = [
        "Review the Tab key implementation in omni-pipboy-system.js and suggest improvements",
        "What are potential performance bottlenecks in the game loop?",
        "How can I optimize the NPC AI system for better performance?"
    ]
    
    print("\n" + "="*60)
    print("Running Agent with Tracing Visualization")
    print("="*60 + "\n")
    
    for query in queries:
        print(f"\n🔍 Query: {query}")
        print("-" * 60)
        response = agent.process_query(query)
        print(f"\n💡 Response:\n{response}\n")
        print("=" * 60)
    
    print("="*60)
    print("✓ All operations traced to http://localhost:4318")
    print("="*60)


if __name__ == "__main__":
    main()
