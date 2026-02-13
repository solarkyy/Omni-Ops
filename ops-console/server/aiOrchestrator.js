/**
 * aiOrchestrator.js
 *
 * Central router that coordinates Code-AI and Omni-Dev.
 * Maintains a shared conversation history in memory.
 *
 * Run instructions (dev):
 * 1) Start the game server: `python local_http_server.py`
 * 2) Start Ops Console API server: `cd ops-console && npm start`
 * 3) Open http://127.0.0.1:8080/ (game)
 * 4) Open http://127.0.0.1:8080/ops-console/ (console)
 */

const aiClients = require('./aiClients');

const conversationHistory = [];
const MAX_HISTORY = 200;

function appendHistory(entry) {
  conversationHistory.push(entry);
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY);
  }
}

function buildSummary(codeText, omniReply) {
  const cleanCode = (codeText || '').trim();
  const cleanOmni = (omniReply || '').trim();
  const base = `Summary: ${cleanCode}${cleanCode && cleanOmni ? ' | ' : ''}${cleanOmni ? `Omni-Dev: ${cleanOmni}` : ''}`;
  return base.length > 320 ? `${base.slice(0, 317)}...` : base;
}

async function routeChat(message, extraContext = {}) {
  const timestamp = Date.now();
  const { snapshot, lastTest } = extraContext;

  appendHistory({
    role: 'user',
    agent: 'user',
    text: message,
    timestamp,
    meta: {}
  });

  const [codeAIResponse, omniDevResponse] = await Promise.all([
    aiClients.callCodeAI(conversationHistory, message),
    aiClients.callOmniDevAI(conversationHistory, message, snapshot, lastTest)
  ]);

  appendHistory({
    role: 'assistant',
    agent: 'codeAI',
    text: codeAIResponse.text || '',
    timestamp: Date.now(),
    meta: codeAIResponse.raw || {}
  });

  appendHistory({
    role: 'assistant',
    agent: 'omniDev',
    text: omniDevResponse.reply || '',
    timestamp: Date.now(),
    meta: {
      commands: omniDevResponse.commands || [],
      ...(omniDevResponse.raw || {})
    }
  });

  return {
    reply: buildSummary(codeAIResponse.text, omniDevResponse.reply),
    agents: {
      code: {
        text: codeAIResponse.text || '',
        raw: codeAIResponse.raw
      },
      omniDev: {
        reply: omniDevResponse.reply || '',
        commands: omniDevResponse.commands || [],
        raw: omniDevResponse.raw
      }
    }
  };
}

module.exports = {
  routeChat
};
