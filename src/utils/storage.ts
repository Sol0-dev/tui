import { ChatSession, ApiKeyEntry, ChatMessage, SessionStats, ModelProvider, GeminiSsoState } from '../types';

const CHAT_SESSIONS_STORAGE_KEY = 'opencode_tui_chat_sessions_v1';
const ACTIVE_SESSION_ID_KEY = 'opencode_tui_active_session_id';
const API_KEYS_VAULT_KEY = 'opencode_tui_api_keys_vault_v1';
const GEMINI_SSO_KEY = 'opencode_tui_gemini_sso_state_v1';

// Initial default demo sessions if storage is empty
const INITIAL_DEMO_SESSIONS: ChatSession[] = [
  {
    id: 'session-demo-1',
    title: 'React Router & Express Integration',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2,
    modelId: 'gemini-3.6-flash',
    provider: 'gemini',
    stats: {
      totalInputTokens: 1420,
      totalOutputTokens: 2850,
      totalCost: 0.00096,
      messagesCount: 4,
      toolCallsCount: 2,
      filesModifiedCount: 1,
    },
    messages: [
      {
        id: 'msg-demo-1',
        role: 'user',
        content: 'Help me optimize the TaskList React component and add API routes to server.ts',
        timestamp: Date.now() - 3600000 * 24,
      },
      {
        id: 'msg-demo-2',
        role: 'assistant',
        content: `I analyzed your project layout. Let's optimize TaskList.tsx and update server.ts to add RESTful endpoint proxies.`,
        thought: `Inspected TaskList.tsx. Checked server.ts express endpoints. Writing modified versions with clean TypeScript interfaces.`,
        timestamp: Date.now() - 3600000 * 23,
      },
    ],
  },
  {
    id: 'session-demo-2',
    title: 'Python Data Science Benchmark Script',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 20,
    modelId: 'claude-3-7-sonnet-20250219',
    provider: 'claude',
    stats: {
      totalInputTokens: 3100,
      totalOutputTokens: 4200,
      totalCost: 0.0723,
      messagesCount: 6,
      toolCallsCount: 3,
      filesModifiedCount: 2,
    },
    messages: [
      {
        id: 'msg-demo-3',
        role: 'user',
        content: 'Write a unit test for main.py benchmark suite',
        timestamp: Date.now() - 3600000 * 48,
      },
      {
        id: 'msg-demo-4',
        role: 'assistant',
        content: `Created test_main.py using Python's built-in unittest module.`,
        thought: `Tested run_benchmark function output structure and verified assertions.`,
        timestamp: Date.now() - 3600000 * 47,
      },
    ],
  },
];

// Load Chat Sessions from localStorage
export function loadSavedSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    if (!raw) {
      saveSessions(INITIAL_DEMO_SESSIONS);
      return INITIAL_DEMO_SESSIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load chat sessions:', err);
    return INITIAL_DEMO_SESSIONS;
  }
}

// Save Chat Sessions to localStorage
export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save chat sessions:', err);
  }
}

// Get or Save Active Session ID
export function getActiveSessionId(): string | null {
  return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
}

// API Key Vault Storage
export function loadApiKeyVault(): ApiKeyEntry[] {
  try {
    const raw = localStorage.getItem(API_KEYS_VAULT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load API keys vault:', err);
    return [];
  }
}

export function saveApiKeyVault(vault: ApiKeyEntry[]): void {
  try {
    localStorage.setItem(API_KEYS_VAULT_KEY, JSON.stringify(vault));
  } catch (err) {
    console.error('Failed to save API keys vault:', err);
  }
}

// Gemini OAuth SSO Storage
export function loadGeminiSsoState(): GeminiSsoState {
  try {
    const raw = localStorage.getItem(GEMINI_SSO_KEY);
    if (!raw) {
      return {
        isConnected: false,
        quotaTier: 'Free Tier (15 RPM / 1M TPM)',
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load Gemini SSO state:', err);
    return {
      isConnected: false,
      quotaTier: 'Free Tier (15 RPM / 1M TPM)',
    };
  }
}

export function saveGeminiSsoState(state: GeminiSsoState): void {
  try {
    localStorage.setItem(GEMINI_SSO_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save Gemini SSO state:', err);
  }
}

// Helper: Mask API Key for Security Display (e.g., sk-ant...x9A4)
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  const start = key.slice(0, 6);
  const end = key.slice(-4);
  return `${start}••••••••${end}`;
}

// Helper: Context Window Summarizer / Compacter
export function compactContextMessages(messages: ChatMessage[]): {
  compactedMessages: ChatMessage[];
  summaryText: string;
} {
  if (messages.length <= 4) {
    return {
      compactedMessages: messages,
      summaryText: 'Context window is short, compaction not required.',
    };
  }

  // Preserve initial system/welcome message and recent 3 messages
  const initialMsg = messages[0];
  const recentMsgs = messages.slice(-3);
  const middleMsgs = messages.slice(1, -3);

  const keyTopics = middleMsgs
    .map(m => `[${m.role.toUpperCase()}]: ${m.content.slice(0, 100)}...`)
    .join('\n');

  const summaryText = `[COMPACTED CONTEXT MEMORY SUMMARY]\nSummarized ${middleMsgs.length} prior conversation turns:\n${keyTopics}`;

  const summaryMessage: ChatMessage = {
    id: `msg-compacted-${Date.now()}`,
    role: 'system',
    content: summaryText,
    timestamp: Date.now(),
  };

  return {
    compactedMessages: [initialMsg, summaryMessage, ...recentMsgs],
    summaryText,
  };
}
