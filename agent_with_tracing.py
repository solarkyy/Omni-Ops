"""
AI Agent with OpenTelemetry Tracing
Configured to send traces to http://localhost:4319
"""

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.requests import RequestsInstrumentor

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


# Example AI Agent with traced operations
class OmniAgent:
    def __init__(self):
        self.tracer = trace.get_tracer(__name__)
        print("✓ Omni Agent initialized")
    
    def process_query(self, query: str) -> str:
        """Process a query with automatic tracing"""
        with self.tracer.start_as_current_span("process_query") as span:
            span.set_attribute("query.text", query)
            span.set_attribute("query.length", len(query))
            
            # Simulate agent processing
            result = self._analyze_query(query)
            response = self._generate_response(result)
            
            span.set_attribute("response.length", len(response))
            return response
    
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
    
    def _generate_response(self, analysis: dict) -> str:
        """Generate response based on analysis"""
        with self.tracer.start_as_current_span("generate_response") as span:
            span.set_attribute("intent", analysis["intent"])
            
            response = f"Processing request with intent: {analysis['intent']}"
            return response


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
