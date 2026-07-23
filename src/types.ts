export type ModelProvider = 
  | 'gemini' 
  | 'claude' 
  | 'openai' 
  | 'ollama' 
  | 'openrouter' 
  | 'groq' 
  | 'custom';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  apiKey?: string;
  baseUrl?: string;
  authType?: 'api_key' | 'oauth_sso';
  oauthToken?: string;
  maxTokens: number;
  temperature: number;
  inputCostPer1M: number;  // In USD
  outputCostPer1M: number; // In USD
  supportsThinking?: boolean;
  contextWindow: number;   // e.g. 128000, 200000, 1000000
  systemPrompt?: string;
}

export type AgentMode = 'auto' | 'plan' | 'interactive' | 'yolo';

export interface CustomAgent {
  id: string;
  name: string;
  role: string; // e.g. 'Lead Architect', 'Security Pentester', 'Frontend Expert', 'QA Engineer'
  modelId: string;
  systemPrompt: string;
  avatarIcon: 'bot' | 'code' | 'shield' | 'brain' | 'zap' | 'bug';
  enabled: boolean;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  language: string;
  modified?: boolean;
  originalContent?: string;
  isProtected?: boolean;
}

export type ToolName = 
  | 'read_file' 
  | 'write_file' 
  | 'list_dir' 
  | 'grep_search' 
  | 'bash_run' 
  | 'create_plan' 
  | 'web_search'
  | 'web_read';

export interface ToolCall {
  id: string;
  name: ToolName;
  args: Record<string, any>;
  status: 'pending' | 'executing' | 'success' | 'failed' | 'rejected';
  result?: any;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  thought?: string; // Claude Code / OpenCode style reasoning stream
  toolCalls?: ToolCall[];
  tokens?: {
    input: number;
    output: number;
  };
  cost?: number;
  timestamp: number;
}

export type TuiTheme = 
  | 'tokyo-night' 
  | 'claude-code-dark'
  | 'gemini-cli-dark'
  | 'kali-purple'
  | 'monokai' 
  | 'catppuccin' 
  | 'cyberpunk-green' 
  | 'amber-crt' 
  | 'dracula'
  | 'matrix-hacker';

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  content: string; // Markdown instructions
  enabled: boolean;
  category: 'code' | 'security' | 'devops' | 'custom';
}

export interface McpTool {
  name: string;
  description: string;
  parametersSchema?: string;
  enabled: boolean;
}

export interface McpServerConfig {
  id: string;
  name: string;
  type: 'stdio' | 'sse' | 'http';
  commandOrUrl: string;
  args?: string[];
  status: 'connected' | 'disconnected' | 'error';
  tools: McpTool[];
  enabled: boolean;
}

export interface AgentInstructionsConfig {
  agentsMdContent: string;
  customRules: string[];
  activeAgentProfile: 'custom' | 'claude-code' | 'gemini-cli' | 'kali-pentester';
}

export interface SessionStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  messagesCount: number;
  toolCallsCount: number;
  filesModifiedCount: number;
}

export interface ApiKeyEntry {
  id: string;
  provider: ModelProvider;
  label: string;
  key: string;
  baseUrl?: string;
  authType?: 'api_key' | 'oauth_sso';
  oauthToken?: string;
  isDefault?: boolean;
  createdAt: number;
}

export interface GeminiSsoState {
  isConnected: boolean;
  userEmail?: string;
  userName?: string;
  userPicture?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  quotaTier: 'Free Tier (15 RPM / 1M TPM)' | 'Pay-As-You-Go' | 'Enterprise';
  lastConnectedAt?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  modelId: string;
  provider: ModelProvider;
  messages: ChatMessage[];
  stats: SessionStats;
  compactedSummary?: string;
}

export interface GoalSubTask {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
}

export interface AgentGoal {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100 percentage
  tasks: GoalSubTask[];
  createdAt: number;
  updatedAt: number;
}

export interface AgentLoopConfig {
  id: string;
  intervalSec: number;
  prompt: string;
  isRunning: boolean;
  currentIteration: number;
  maxIterations?: number;
  lastRunTime?: number;
}

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface PresetProject {
  id: string;
  name: string;
  description: string;
  files: WorkspaceFile[];
}

export interface AgentHarness {
  id: string;
  name: string;
  role: string;
  modelId: string;
  systemPrompt: string;
  avatarIcon: 'bot' | 'code' | 'shield' | 'brain' | 'zap' | 'bug' | 'terminal';
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused';
  assignedTask?: string;
  lastLog?: string;
  enabled: boolean;
  tasksCompleted: number;
}
