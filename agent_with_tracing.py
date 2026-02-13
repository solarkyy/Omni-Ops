"""
OMNI-OPS BRAIN SERVER v2.0
Production-grade AI Backend for Electron Game

Serves on localhost:8080 with CORS headers.
Zero telemetry. Zero dependencies. Pure HTTP.
Endpoints:
  GET  /health     → Returns {"status": "ready"}
  POST /chat       → Accepts {"prompt": "..."}, returns AI response
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
import os
from typing import Dict, Any
from urllib.parse import urlparse, parse_qs
import traceback

# ============================================================================
# CONFIGURATION — No magic numbers
# ============================================================================
CONFIG = {
    "SERVER": {
        "HOST": "127.0.0.1",
        "PORT": 8080,
        "TIMEOUT": 30,
    },
    "CORS": {
        "ALLOW_ORIGIN": "*",
        "ALLOW_METHODS": "GET, POST, OPTIONS",
        "ALLOW_HEADERS": "Content-Type, Authorization",
    },
    "AI": {
        "ENABLED": True,
        "MODEL": "fallback",  # Can be extended for real LLM integration
        "MAX_PROMPT_LENGTH": 2000,
    }
}

# ============================================================================
# FALLBACK RESPONSES — Ensures game never crashes
# ============================================================================
FALLBACK_RESPONSES = {
    "chat": {
        "response": "ARIA: Acknowledged, soldier. Systems online. Standing by for orders.",
        "status": "fallback",
    },
    "health": {
        "status": "ready",
        "uptime_ms": 0,
    }
}
# ============================================================================
# HTTP REQUEST HANDLER — All endpoints here
# ============================================================================
class BrainRequestHandler(BaseHTTPRequestHandler):
    """HTTP handler for game ↔ AI server communication."""
    
    def log_message(self, format, *args):
        """Suppress default logging noise."""
        pass
    
    def _send_json_response(self, status_code: int, data: Dict[str, Any]):
        """
        Send a JSON response with MANDATORY CORS, MIME-Type, and JSON encoding.
        
        PROTOCOL ENFORCEMENT:
          1. Use json.dumps() → Double quotes (RFC 8259)
          2. Send Access-Control-Allow-Origin: * CORS header
          3. Send Content-Type: application/json header
          
        This is called in every endpoint. Strict enforcement prevents Electron hangs.
        """
        try:
            # 1. Send HTTP status code
            self.send_response(status_code)
            
            # 2. Send MANDATORY CORS headers
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            
            # 3. Send MANDATORY MIME-Type header
            self.send_header("Content-Type", "application/json; charset=utf-8")
            
            # 4. Terminate header section
            self.end_headers()
            
            # 5. Encode response as JSON (using json.dumps for double quotes, RFC 8259)
            response_json = json.dumps(data, ensure_ascii=False)
            response_bytes = response_json.encode('utf-8')
            
            # 6. Write JSON body to client
            self.wfile.write(response_bytes)
            
        except Exception as err:
            print(f"[BrainServer::_send_json_response] CRITICAL ERROR: {err}")
            traceback.print_exc()
    
    def do_GET(self):
        """
        Handle GET requests with STRICT protocol enforcement.
        
        PROTOCOL CHECKLIST (per RFC 7231 + CORS):
          ✓ JSON Response: jsonify with json.dumps() → double quotes
          ✓ CORS Headers: Access-Control-Allow-Origin: *
          ✓ MIME Type: Content-Type: application/json
          
        All endpoints below MUST use _send_json_response() to guarantee compliance.
        """
        parsed = urlparse(self.path)
        path = parsed.path
        
        # Route to appropriate handler
        if path == "/health" or path == "/alive":
            self._handle_health()
        elif path.startswith("/api/"):
            self._handle_api_universal(path)
        else:
            # 404 response MUST also include CORS + JSON
            self._send_json_response(404, {
                "error": "Not Found",
                "path": path,
                "status": "error",
            })
    
    def do_POST(self):
        """
        Handle POST requests with STRICT protocol enforcement.
        
        PROTOCOL CHECKLIST (per RFC 7231 + CORS):
          ✓ JSON Response: jsonify with json.dumps() → double quotes
          ✓ CORS Headers: Access-Control-Allow-Origin: *
          ✓ MIME Type: Content-Type: application/json
          
        All POST endpoints MUST use _send_json_response() to guarantee compliance.
        """
        parsed = urlparse(self.path)
        path = parsed.path
        
        if path == "/chat":
            self._handle_chat()
        elif path.startswith("/api/"):
            self._handle_api_universal(path)
        else:
            # 404 response MUST also include CORS + JSON
            self._send_json_response(404, {
                "error": "Not Found",
                "path": path,
                "status": "error",
            })
    
    def do_OPTIONS(self):
        """
        Handle CORS preflight requests (OPTIONS).
        
        PROTOCOL ENFORCEMENT:
          ✓ Respond with 200 OK
          ✓ Send Access-Control-Allow-Origin: *
          ✓ Send CORS method/header whitelist
          ✓ No body required for preflight, but include JSON content-type for consistency
        """
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        # Send empty JSON object for consistency with other endpoints
        self.wfile.write(b'{}')
    
    def _handle_health(self):
        """
        GET /health and GET /alive → Returns server readiness.
        
        PROTOCOL ENFORCEMENT:
          ✓ Response: {"status": "ready", ...} using json.dumps() (double quotes)
          ✓ CORS Headers: Access-Control-Allow-Origin: * (via _send_json_response)
          ✓ MIME Type: Content-Type: application/json; charset=utf-8 (via _send_json_response)
          
        This endpoint is called by the Electron client during startup handshake.
        If this is malformed, the client will hang or fail silently.
        """
        response = {
            "status": "ready",
            "service": "omni-ops-brain",
            "version": "2.0",
            "protocols": ["json", "cors", "mime-type"],
        }
        self._send_json_response(200, response)
        print("[BrainServer::Health] GET /health → 200 OK (JSON + CORS + MIME enforced)")
    
    def _handle_api_universal(self, path: str):
        """
        GET /api/* → Universal handler for all /api/ routes.
        
        PROTOCOL ENFORCEMENT:
          ✓ Response uses json.dumps() with double quotes
          ✓ CORS headers automatically attached via _send_json_response()
          ✓ MIME type automatically set to application/json
          
        This prevents 404 errors that cause game startup hangs.
        REF: SYSTEM_FLOW_BLUEPRINT.md § Phase 3: Brain Connection
        """
        # Extract requested resource (e.g., /api/context → context)
        resource = path.replace("/api/", "").split("?")[0] or "status"
        
        response = {
            "status": "ready",
            "service": "omni-ops-brain",
            "resource": resource,
            "timestamp": __import__('time').time(),
        }
        self._send_json_response(200, response)
        print(f"[BrainServer::API] {path} → 200 OK (CORS + JSON enforced)")
    
    def _handle_chat(self):
        """
        POST /chat → Accept prompt, return AI response.
        
        PROTOCOL ENFORCEMENT:
          ✓ All error responses include CORS + JSON + MIME-Type
          ✓ Success responses use json.dumps() for {"response": "..."} format
          ✓ No response ever violates RFC 8259 (double quotes required)
          
        This is the primary endpoint for Electron client ↔ AI Brain communication.
        """
        try:
            # Read request body
            content_length = self.headers.get("Content-Length")
            if not content_length:
                self._send_json_response(400, {
                    "error": "Missing Content-Length header",
                    "status": "error",
                })
                return
            
            content_length = int(content_length)
            if content_length > 1024 * 100:  # 100KB limit
                self._send_json_response(413, {
                    "error": "Payload too large (max 100KB)",
                    "status": "error",
                })
                return
            
            body = self.rfile.read(content_length)
            
            # Parse JSON
            try:
                data = json.loads(body.decode('utf-8'))
            except json.JSONDecodeError as err:
                self._send_json_response(400, {
                    "error": f"Invalid JSON: {str(err)}",
                    "status": "error",
                })
                return
            
            # Validate prompt
            prompt = data.get("prompt")
            if not prompt or not isinstance(prompt, str):
                self._send_json_response(400, {
                    "error": "Missing or invalid 'prompt' field",
                    "status": "error",
                })
                return
            
            if len(prompt) > CONFIG["AI"]["MAX_PROMPT_LENGTH"]:
                self._send_json_response(400, {
                    "error": f"Prompt exceeds {CONFIG['AI']['MAX_PROMPT_LENGTH']} characters",
                    "status": "error",
                })
                return
            
            # Generate response (with fallback)
            response = self._generate_ai_response(prompt)
            self._send_json_response(200, response)
            print(f"[BrainServer::Chat] POST /chat → 200 OK (JSON + CORS enforced) | Prompt: {prompt[:50]}...")
        
        except Exception as err:
            print(f"[BrainServer::_handle_chat] CRITICAL ERROR: {err}")
            traceback.print_exc()
            # Even on exception, send properly-formatted JSON response
            self._send_json_response(500, {
                "response": "ARIA: Critical system error. Retrying connection...",
                "status": "error",
                "error": str(err)[:100],
            })
    
    def _generate_ai_response(self, prompt: str) -> Dict[str, Any]:
        """Generate AI response with fallback."""
        try:
            # For now, use intelligent fallback responses based on prompt context.
            # This can be extended with real LLM integration (OpenAI, local model, etc.)
            
            prompt_lower = prompt.lower()
            
            # Simple keyword-based responses for flavor
            if any(word in prompt_lower for word in ["hello", "hi", "greet", "start"]):
                return {
                    "response": "ARIA: Greetings, soldier. All systems nominal. Ready for deployment.",
                    "status": "ok",
                    "confidence": 1.0,
                }
            elif any(word in prompt_lower for word in ["help", "command", "order", "mission"]):
                return {
                    "response": "ARIA: Mission parameters received. Standing by for tactical update.",
                    "status": "ok",
                    "confidence": 1.0,
                }
            elif any(word in prompt_lower for word in ["status", "report", "check"]):
                return {
                    "response": "ARIA: All systems green. Weapons hot. Awaiting your command.",
                    "status": "ok",
                    "confidence": 1.0,
                }
            else:
                # Default fallback for unknown prompts
                return {
                    "response": "ARIA: Affirmative, soldier. Command acknowledged. Standing by.",
                    "status": "ok",
                    "confidence": 0.8,
                }
        
        except Exception as err:
            print(f"[BrainServer::_generate_ai_response] Error: {err}")
            return FALLBACK_RESPONSES["chat"]


# ============================================================================
# SERVER LIFECYCLE
# ============================================================================
class GracefulBrainServer(HTTPServer):
    """HTTP Server for OMNI-OPS BRAIN."""
    
    def server_bind(self):
        """Allow immediate reuse of socket."""
        import socket
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        super().server_bind()


def start_brain_server():
    """Start the OMNI-OPS Brain Server."""
    host = CONFIG["SERVER"]["HOST"]
    port = CONFIG["SERVER"]["PORT"]
    
    try:
        server = GracefulBrainServer((host, port), BrainRequestHandler)
        print("\n" + "="*70)
        print("✓ OMNI-OPS BRAIN ONLINE: Listening on Port 8080")
        print("="*70)
        print(f"  Host: {host}")
        print(f"  Port: {port}")
        print(f"  Endpoints:")
        print(f"    GET  /health     → Check server status (HUD bar GREEN)")
        print(f"    POST /chat       → Send prompt, get AI response")
        print(f"    POST /chat       → (ARIA talks)")
        print("="*70 + "\n")
        
        # Serve until Ctrl+C
        server.serve_forever()
    
    except OSError as err:
        print(f"\n[FATAL] Could not start server on {host}:{port}")
        print(f"  Error: {err}")
        print(f"  → Is another process using port {port}?")
        print(f"  → Try: lsof -i :{port} (macOS/Linux) or netstat -ano | findstr :{port} (Windows)")
        sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n[BrainServer] Shutdown signal received. Goodbye.")
        sys.exit(0)
    
    except Exception as err:
        print(f"\n[FATAL] Unexpected error: {err}")
        traceback.print_exc()
        sys.exit(1)


# ============================================================================
# ENTRY POINT
# ============================================================================
if __name__ == "__main__":
    start_brain_server()
