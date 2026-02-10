# AI Agent with OpenTelemetry Tracing

## Setup Instructions

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Start the OTLP Collector (if needed)
Make sure you have an OTLP receiver running at `http://localhost:4319`

### 3. Run the Agent with Tracing
```powershell
python agent_with_tracing.py
```

## Tracing Configuration

- **OTLP Endpoint**: `http://localhost:4319/v1/traces`
- **Service Name**: `omni-ops-agent`
- **Protocol**: HTTP
- **Export Format**: OTLP (OpenTelemetry Protocol)

## What Gets Traced

The agent automatically traces:
- Query processing operations
- Query analysis steps
- Response generation
- HTTP requests (auto-instrumented)

## Viewing Traces

Open the AI Toolkit trace viewer in VS Code to visualize:
- Span hierarchies
- Operation durations
- Attributes and metadata
- Performance bottlenecks

## Customization

To modify the OTLP endpoint, edit line 31 in `agent_with_tracing.py`:
```python
endpoint="http://localhost:4319/v1/traces"
```
