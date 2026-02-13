/**
 * aiClients.js
 * 
 * Routes AI requests to configured LLM providers (OpenAI, local, etc).
 * 
 * Environment Configuration:
 *   AI_PROVIDER: 'openai' | 'local' | 'mock' (default: 'mock')
 *   AI_MODEL_CODE: Model to use for Code-AI role (e.g., 'gpt-4')
 *   AI_MODEL_OMNIDEV: Model to use for Omni-Dev role (e.g., 'gpt-4')
 *   AI_API_KEY: API key for the provider (if needed)
 *   AI_API_BASE: (optional) Base URL for local/proxy endpoints
 * 
 * Supported Providers:
 *   - openai: Uses OpenAI API with AI_API_KEY
 *   - local: Calls local LLM server at AI_API_BASE
 *   - mock: Returns mock responses (development fallback)
 */

// ============================================================================
// Configuration
// ============================================================================

const AI_PROVIDER = process.env.AI_PROVIDER || 'mock';
const AI_MODEL_CODE = process.env.AI_MODEL_CODE || 'gpt-4';
const AI_MODEL_OMNIDEV = process.env.AI_MODEL_OMNIDEV || 'gpt-4';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_BASE = process.env.AI_API_BASE || 'http://localhost:5000';
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10);

// Log provider info (without exposing keys)
console.log(
  `[aiClients] Provider: ${AI_PROVIDER}, Code Model: ${AI_MODEL_CODE}, Omni Model: ${AI_MODEL_OMNIDEV}, Timeout: ${AI_TIMEOUT_MS}ms`
);

// ============================================================================
// Provider Abstraction
// ============================================================================

/**
 * Wrapper for different LLM provider backends.
 * Abstracts the specifics of calling each provider.
 */
class LLMProvider {
  constructor(provider = AI_PROVIDER) {
    this.provider = provider;
  }

  /**
   * Call the LLM with a prompt and return the response.
   * 
   * @param {string} model - Model ID to use
   * @param {array} messages - Array of { role, content } messages
   * @param {string} system - System prompt
   * @returns {Promise<{ text, raw }>} Response and raw provider data
   */
  async call(model, messages, system) {
    switch (this.provider) {
      case 'openai':
        return this._callOpenAI(model, messages, system);
      case 'local':
        return this._callLocal(model, messages, system);
      case 'mock':
      default:
        return this._callMock(model, messages, system);
    }
  }

  /**
   * Call OpenAI API (or compatible Azure endpoint)
   */
  async _callOpenAI(model, messages, system) {
    try {
      if (!AI_API_KEY) {
        throw new Error('AI_API_KEY not set for OpenAI provider');
      }

      const url = 'https://api.openai.com/v1/chat/completions';
      const response = await this._fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        text: content,
        raw: {
          provider: 'openai',
          model,
          usage: data.usage || {}
        }
      };
    } catch (error) {
      console.error(`[aiClients] OpenAI call failed: ${error.message}`);
      return {
        text: `Error: ${error.message}`,
        raw: { error: error.message, provider: 'openai' }
      };
    }
  }

  /**
   * Call a local LLM server (e.g., Ollama, LocalAI, etc)
   */
  async _callLocal(model, messages, system) {
    try {
      const url = `${AI_API_BASE}/v1/chat/completions`;
      const response = await this._fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            ...messages
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Local LLM error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      return {
        text: content,
        raw: {
          provider: 'local',
          model,
          base: AI_API_BASE
        }
      };
    } catch (error) {
      console.error(`[aiClients] Local LLM call failed: ${error.message}`);
      return {
        text: `Error: ${error.message}`,
        raw: { error: error.message, provider: 'local' }
      };
    }
  }

  /**
   * Return mock responses (for development/testing)
   */
  async _callMock(model, messages, system) {
    // Simulate a small delay to feel realistic
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockText = system.includes('JSON')
      ? '{"reply": "Mock Omni-Dev response", "commands": [{"type": "check_status"}]}'
      : 'This is a mock response from Code-AI. Try running a test to see real output.';

    return {
      text: mockText,
      raw: {
        provider: 'mock',
        model,
        note: 'Using mock provider. Set AI_PROVIDER env var to use real LLM.'
      }
    };
  }

  /**
   * Fetch with timeout
   */
  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }
}

const llmProvider = new LLMProvider(AI_PROVIDER);

// ============================================================================
// Prompt Builders
// ============================================================================

/**
 * Build a system prompt for Code-AI (senior engineer role)
 */
function buildCodeAISystemPrompt() {
  return `You are a senior full-stack engineer reviewing Omni-Ops AI system behavior.

Your role:
- Analyze game/AI state and test results
- Identify patterns, issues, and optimization opportunities
- Provide concise, actionable recommendations
- Keep responses under 150 words

Style:
- Be direct and practical
- Reference specific test names or metrics when available
- Suggest next steps or tests to run
- No fluff or preamble`;
}

/**
 * Build a system prompt for Omni-Dev AI (in-game AI developer)
 */
function buildOmniDevSystemPrompt() {
  return `You are Omni-Dev, an in-game AI systems engineer for Omni-Ops.

You work with these commands:
- run_test: Run a test by name (e.g., patrol_basic)
- check_status: Get current AI status
- inspect_snapshot: Get full game/AI state snapshot
- explain_last_test: Analyze the last test result
- send_command: Send a command to the AI agent

Your task:
1. Analyze the user's question/problem
2. Decide which commands will help investigate/fix it
3. Respond with a JSON object: {"reply": "Your explanation", "commands": [{...}]}

Always return valid JSON. Be proactive but safe—avoid commands that could destabilize the AI.

Example response:
{"reply": "I'll check the patrol logic by running the patrol_basic test.", "commands": [{"type": "run_test", "name": "patrol_basic"}]}`;
}

/**
 * Truncate conversation history to keep it manageable for the LLM
 */
function buildContext(history = [], maxMessages = 5) {
  if (!history || history.length === 0) return [];

  // Take the most recent messages
  const recent = history.slice(-maxMessages);

  return recent.map(entry => {
    const role = entry.role === 'user' ? 'user' : 'assistant';
    const content = entry.text || '';
    return { role, content };
  });
}

/**
 * Add game context to messages
 */
function buildSnapshotContext(snapshot) {
  if (!snapshot) return '';

  const gameState = snapshot.gameState || {};
  const aiState = snapshot.aiState || {};

  return `\n\n[Current Game Context]
- Player Health: ${gameState.playerHealth}%
- Ammo: ${gameState.playerAmmo}
- Position: (${gameState.playerPosition?.x}, ${gameState.playerPosition?.y}, ${gameState.playerPosition?.z})
- Sector: ${gameState.sector}
- Active Threats: ${gameState.activeThreats}

[AI State]
- Mode: ${aiState.currentMode}
- Last Command: ${aiState.lastCommand}
- Target: (${aiState.targetLocation?.x}, ${aiState.targetLocation?.y}, ${aiState.targetLocation?.z})
- Nearby Threats: ${aiState.threatsNearby?.length || 0}`;
}

/**
 * Add test result context to messages
 */
function buildTestContext(lastTest) {
  if (!lastTest) return '';

  return `\n\n[Last Test Result]
- Test: ${lastTest.name}
- Passed: ${lastTest.passed ? 'Yes' : 'No'}
- Metrics: ${JSON.stringify(lastTest.metrics || {})}
- Reasons: ${(lastTest.reasons || []).join('; ')}`;
}

// ============================================================================
// Public API: Code-AI
// ============================================================================

/**
 * Call Code-AI with senior engineer perspective
 */
async function callCodeAI(history = [], message = '') {
  const system = buildCodeAISystemPrompt();
  const context = buildContext(history, 5);

  const messages = [
    ...context,
    { role: 'user', content: message }
  ];

  const response = await llmProvider.call(AI_MODEL_CODE, messages, system);

  // Truncate response if too long
  const text = response.text.length > 500
    ? response.text.slice(0, 497) + '...'
    : response.text;

  return {
    text,
    raw: response.raw
  };
}

// ============================================================================
// Public API: Omni-Dev AI
// ============================================================================

/**
 * Call Omni-Dev AI with JSON protocol
 */
async function callOmniDevAI(history = [], message = '', snapshot = null, lastTestResult = null) {
  const system = buildOmniDevSystemPrompt();
  const context = buildContext(history, 4);

  let userMessage = message;
  if (snapshot) {
    userMessage += buildSnapshotContext(snapshot);
  }
  if (lastTestResult) {
    userMessage += buildTestContext(lastTestResult);
  }

  const messages = [
    ...context,
    { role: 'user', content: userMessage }
  ];

  const response = await llmProvider.call(AI_MODEL_OMNIDEV, messages, system);

  // Parse the JSON response
  let reply = '';
  let commands = [];

  try {
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (typeof parsed.reply !== 'string') {
      throw new Error('Invalid reply format');
    }

    reply = parsed.reply;
    commands = Array.isArray(parsed.commands) ? parsed.commands : [];
  } catch (error) {
    console.error(`[aiClients] Failed to parse Omni-Dev response: ${error.message}`);
    console.error(`[aiClients] Raw response: ${response.text.slice(0, 200)}`);

    // Graceful fallback
    reply = `I encountered an issue parsing my response. The issue was: ${error.message}. Please try again or run a test to get state.`;
    commands = [];
  }

  return {
    reply,
    commands,
    raw: {
      ...response.raw,
      parseError: commands.length === 0 && !reply.includes('Mock') ? true : false
    }
  };
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  callCodeAI,
  callOmniDevAI,
  // Expose for testing/debugging
  LLMProvider,
  buildCodeAISystemPrompt,
  buildOmniDevSystemPrompt
};
