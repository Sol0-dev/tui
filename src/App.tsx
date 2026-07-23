import React, { useState, useEffect } from 'react';
import { 
  ModelConfig, 
  AgentMode, 
  WorkspaceFile, 
  ChatMessage, 
  ToolCall, 
  TuiTheme, 
  SessionStats, 
  PresetProject,
  ChatSession,
  ApiKeyEntry,
  SkillConfig,
  McpServerConfig,
  AgentInstructionsConfig,
  AgentGoal,
  AgentLoopConfig,
  GoalSubTask,
  CustomAgent,
  AgentHarness
} from './types';
import { DEFAULT_MODELS, PRESET_PROJECTS, THEMES, DEFAULT_SKILLS, DEFAULT_MCPS, DEFAULT_AGENTS_MD, DEFAULT_CUSTOM_AGENTS, DEFAULT_HARNESSES } from './constants';
import { 
  loadSavedSessions, 
  saveSessions, 
  getActiveSessionId, 
  setActiveSessionId,
  compactContextMessages,
  loadGeminiSsoState,
  loadApiKeyVault
} from './utils/storage';

import { TuiHeader } from './components/TuiHeader';
import { TuiTerminal } from './components/TuiTerminal';
import { TuiCommandBar } from './components/TuiCommandBar';
import { TuiWorkspaceSidebar } from './components/TuiWorkspaceSidebar';
import { TuiModelConfigModal } from './components/TuiModelConfigModal';
import { TuiCostTrackerModal } from './components/TuiCostTrackerModal';
import { TuiHelpModal } from './components/TuiHelpModal';
import { TuiWorkspacePresetModal } from './components/TuiWorkspacePresetModal';
import { TuiApiKeyVaultModal } from './components/TuiApiKeyVaultModal';
import { TuiChatHistoryDrawer } from './components/TuiChatHistoryDrawer';
import { TuiSkillsAndAgentsModal } from './components/TuiSkillsAndAgentsModal';
import { TuiMcpManagerModal } from './components/TuiMcpManagerModal';
import { TuiGoalManagerModal } from './components/TuiGoalManagerModal';
import { TuiLoopManagerModal } from './components/TuiLoopManagerModal';
import { TuiWebSearchModal } from './components/TuiWebSearchModal';
import { TuiHerderModal } from './components/TuiHerderModal';
import { TuiFileEditor } from './components/TuiFileEditor';

import { 
  Terminal, 
  FolderKanban, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Layers,
  Sparkles,
  FileCode
} from 'lucide-react';

export default function App() {
  // Application State
  const [currentModel, setCurrentModel] = useState<ModelConfig>(DEFAULT_MODELS[0]);
  const [agentMode, setAgentMode] = useState<AgentMode>('auto');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'thinking' | 'executing' | 'awaiting_approval'>('idle');
  const [currentTheme, setTheme] = useState<TuiTheme>('tokyo-night');

  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>(
    PRESET_PROJECTS[0].files.map(f => ({ ...f, originalContent: f.content }))
  );
  const [activeFilePath, setActiveFilePath] = useState<string | null>(PRESET_PROJECTS[0].files[0]?.path || null);
  const [openFilePaths, setOpenFilePaths] = useState<string[]>(
    PRESET_PROJECTS[0].files.map(f => f.path)
  );
  const [activeTab, setActiveTab] = useState<'terminal' | 'editor' | 'diff'>('terminal');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // Modals & Drawers
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isApiKeyVaultOpen, setIsApiKeyVaultOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isSkillsAndAgentsModalOpen, setIsSkillsAndAgentsModalOpen] = useState(false);
  const [isMcpManagerModalOpen, setIsMcpManagerModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);
  const [isWebSearchModalOpen, setIsWebSearchModalOpen] = useState(false);
  const [isHerderModalOpen, setIsHerderModalOpen] = useState(false);

  // Goals, Loops & Agent Harnesses State
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  const [loops, setLoops] = useState<AgentLoopConfig[]>([]);
  const [harnesses, setHarnesses] = useState<AgentHarness[]>(DEFAULT_HARNESSES);

  // Skills, MCP, AGENTS.md & Custom Multi-Agents State
  const [skills, setSkills] = useState<SkillConfig[]>(DEFAULT_SKILLS);
  const [mcpServers, setMcpServers] = useState<McpServerConfig[]>(DEFAULT_MCPS);
  const [customAgents, setCustomAgents] = useState<CustomAgent[]>(DEFAULT_CUSTOM_AGENTS);
  const [agentConfig, setAgentConfig] = useState<AgentInstructionsConfig>({
    agentsMdContent: DEFAULT_AGENTS_MD,
    customRules: [],
    activeAgentProfile: 'custom',
  });

  // Sessions Management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionStateId] = useState<string>('');

  // Stats
  const [stats, setStats] = useState<SessionStats>({
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    messagesCount: 1,
    toolCallsCount: 0,
    filesModifiedCount: 0,
  });

  // Interactive Pending Tool Call
  const [pendingToolCall, setPendingToolCall] = useState<ToolCall | null>(null);

  // Active Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Initialize Sessions on Mount
  useEffect(() => {
    const loadedSessions = loadSavedSessions();
    setSessions(loadedSessions);

    const savedActiveId = getActiveSessionId();
    const existing = loadedSessions.find(s => s.id === savedActiveId) || loadedSessions[0];

    if (existing) {
      setActiveSessionStateId(existing.id);
      setMessages(existing.messages || []);
      setStats(existing.stats || {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        messagesCount: existing.messages?.length || 0,
        toolCallsCount: 0,
        filesModifiedCount: 0,
      });
    } else {
      createNewChatSession('New AI Agent Session');
    }

    // Auto-load Google OAuth SSO token or default vault credential if active
    const ssoState = loadGeminiSsoState();
    if (ssoState.isConnected && ssoState.accessToken) {
      setCurrentModel(prev => ({
        ...prev,
        authType: 'oauth_sso',
        oauthToken: ssoState.accessToken,
      }));
    } else {
      const vault = loadApiKeyVault();
      const defaultEntry = vault.find(v => v.authType === 'oauth_sso' || v.isDefault);
      if (defaultEntry) {
        setCurrentModel(prev => ({
          ...prev,
          provider: defaultEntry.provider,
          apiKey: defaultEntry.key,
          authType: defaultEntry.authType || (defaultEntry.oauthToken ? 'oauth_sso' : 'api_key'),
          oauthToken: defaultEntry.oauthToken || (defaultEntry.authType === 'oauth_sso' ? defaultEntry.key : undefined),
          baseUrl: defaultEntry.baseUrl || prev.baseUrl,
        }));
      }
    }

    // Sync Workspace Files from Disk on Mount (for Kali VM & local server deployment)
    fetch('/api/fs/files')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data.files) && data.files.length > 0) {
          const diskFiles: WorkspaceFile[] = data.files.map((f: any) => ({
            path: f.path,
            content: f.content,
            originalContent: f.content,
            language: f.language || 'typescript',
          }));
          setWorkspaceFiles(diskFiles);
          setOpenFilePaths(diskFiles.map(f => f.path));
          if (!activeFilePath || !diskFiles.some(f => f.path === activeFilePath)) {
            setActiveFilePath(diskFiles[0]?.path || null);
          }
        }
      })
      .catch(err => console.log('Disk FS auto-sync skipped:', err));
  }, []);

  // Synchronize Active Session Changes to Persistence
  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;

    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          // Generate active title if default
          let title = s.title;
          if (title === 'New AI Agent Session' && messages.length > 1) {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 30) + '...';
            }
          }

          return {
            ...s,
            title,
            messages,
            stats,
            updatedAt: Date.now(),
            modelId: currentModel.id,
            provider: currentModel.provider,
          };
        }
        return s;
      });

      saveSessions(updated);
      return updated;
    });
  }, [messages, stats, activeSessionId, currentModel]);

  // Recurring Agent Loop Execution Timer Effect (/loop)
  useEffect(() => {
    const activeLoops = loops.filter(l => l.isRunning);
    if (activeLoops.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setLoops(prev =>
        prev.map(l => {
          if (!l.isRunning) return l;

          const elapsedSec = (now - (l.lastRunTime || now)) / 1000;
          if (elapsedSec >= l.intervalSec) {
            const nextIteration = l.currentIteration + 1;
            const reachedMax = l.maxIterations && nextIteration >= l.maxIterations;

            // Trigger loop prompt execution
            handleSendMessage(`[🔁 Agent Loop Iteration #${nextIteration}]: ${l.prompt}`);

            return {
              ...l,
              currentIteration: nextIteration,
              isRunning: !reachedMax,
              lastRunTime: now,
            };
          }
          return l;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [loops]);

  const theme = THEMES[currentTheme];

  // Helper: Find File
  const activeFile = workspaceFiles.find(f => f.path === activeFilePath) || null;

  // Session Handlers
  const createNewChatSession = (titleName?: string) => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: titleName || `Coding Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modelId: currentModel.id,
      provider: currentModel.provider,
      stats: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        messagesCount: 1,
        toolCallsCount: 0,
        filesModifiedCount: 0,
      },
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `New OpenCode Session Started.\nActive Model: ${currentModel.name} (${currentModel.provider.toUpperCase()})\n\nHow can I help you build or edit code today?`,
          timestamp: Date.now(),
        },
      ],
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    saveSessions(updatedSessions);

    setActiveSessionStateId(newId);
    setActiveSessionId(newId);
    setMessages(newSession.messages);
    setStats(newSession.stats);
  };

  const handleSelectSession = (id: string) => {
    const target = sessions.find(s => s.id === id);
    if (target) {
      setActiveSessionStateId(id);
      setActiveSessionId(id);
      setMessages(target.messages || []);
      setStats(target.stats || {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
        messagesCount: target.messages?.length || 0,
        toolCallsCount: 0,
        filesModifiedCount: 0,
      });
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    saveSessions(updated);

    if (activeSessionId === id && updated.length > 0) {
      handleSelectSession(updated[0].id);
    } else if (updated.length === 0) {
      createNewChatSession('New AI Agent Session');
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = sessions.map(s => (s.id === id ? { ...s, title: newTitle } : s));
    setSessions(updated);
    saveSessions(updated);
  };

  const handleCompactSession = (id: string) => {
    const { compactedMessages, summaryText } = compactContextMessages(messages);
    setMessages(compactedMessages);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: `⚡ Context Memory Compacted. Older turns compressed into abstract summary.\n${summaryText}`,
        timestamp: Date.now(),
      },
    ]);
  };

  // API Key Vault Selection
  const handleSelectApiKeyFromVault = (entry: ApiKeyEntry) => {
    const isSso = entry.authType === 'oauth_sso' || !!entry.oauthToken;
    const resolvedToken = entry.oauthToken || (isSso ? entry.key : undefined);

    setCurrentModel(prev => ({
      ...prev,
      provider: entry.provider,
      apiKey: entry.key,
      authType: entry.authType || (isSso ? 'oauth_sso' : 'api_key'),
      oauthToken: resolvedToken,
      baseUrl: entry.baseUrl || prev.baseUrl,
    }));

    setIsApiKeyVaultOpen(false);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: isSso
          ? `🔐 Google OAuth SSO Applied: Connected as "${entry.label}". Free Gemini rate limits active.`
          : `🔑 API Key Vault Applied: Loaded key "${entry.label}" for provider [${entry.provider.toUpperCase()}].`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Workspace File Synchronization Effect (agents/, skills/, mcp/, AGENTS.md)
  useEffect(() => {
    // 1. Sync Root AGENTS.md
    const rootAgentsMd = workspaceFiles.find(f => f.path === 'AGENTS.md');
    if (rootAgentsMd && rootAgentsMd.content !== agentConfig.agentsMdContent) {
      setAgentConfig(prev => ({ ...prev, agentsMdContent: rootAgentsMd.content }));
    }

    // 2. Sync agents/ directory -> customAgents
    const agentFiles = workspaceFiles.filter(f => f.path.startsWith('agents/') && f.path.endsWith('.md'));
    if (agentFiles.length > 0) {
      const parsedAgents: CustomAgent[] = agentFiles.map((f, idx) => {
        const folderName = f.path.split('/')[1] || `agent-${idx}`;
        const cleanName = folderName.replace(/-/g, ' ').toUpperCase();
        return {
          id: `agent-${folderName}`,
          name: `${cleanName} Agent`,
          role: `${cleanName} Specialist`,
          description: `Configured in ${f.path}`,
          systemPrompt: f.content,
          enabled: true,
        };
      });
      setCustomAgents(parsedAgents);
    }

    // 3. Sync skills/ directory -> skills
    const skillFiles = workspaceFiles.filter(f => f.path.startsWith('skills/') && f.path.endsWith('.md'));
    if (skillFiles.length > 0) {
      const parsedSkills: SkillConfig[] = skillFiles.map((f, idx) => {
        const folderName = f.path.split('/')[1] || `skill-${idx}`;
        const cleanName = folderName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return {
          id: `skill-${folderName}`,
          name: cleanName,
          description: `Custom workspace skill in ${f.path}`,
          category: 'code' as const,
          enabled: true,
          content: f.content,
        };
      });
      setSkills(parsedSkills);
    }

    // 4. Sync mcp/ directory -> mcpServers
    const mcpFiles = workspaceFiles.filter(f => f.path.startsWith('mcp/') && f.path.endsWith('.json'));
    if (mcpFiles.length > 0) {
      const parsedMcps: McpServerConfig[] = [];
      mcpFiles.forEach((f) => {
        try {
          const parsed = JSON.parse(f.content);
          if (parsed && parsed.id && parsed.name) {
            parsedMcps.push(parsed as McpServerConfig);
          }
        } catch (e) {
          // ignore draft json syntax errors during typing
        }
      });
      if (parsedMcps.length > 0) {
        setMcpServers(parsedMcps);
      }
    }
  }, [workspaceFiles]);

  // File Handlers
  const handleSelectFile = (path: string) => {
    if (!openFilePaths.includes(path)) {
      setOpenFilePaths(prev => [...prev, path]);
    }
    setActiveFilePath(path);
    setActiveTab('editor');

    const targetFile = workspaceFiles.find(f => f.path === path);
    if (targetFile) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `[📄 Selected Workspace File]: ${path} (${targetFile.content.length} bytes loaded into agent context)`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const handleCloseFile = (path: string) => {
    setOpenFilePaths(prev => {
      const next = prev.filter(p => p !== path);
      if (activeFilePath === path) {
        const closingIndex = prev.indexOf(path);
        const newActive = next[closingIndex] || next[closingIndex - 1] || next[0] || null;
        setActiveFilePath(newActive);
      }
      return next;
    });
  };

  const handleSaveFile = (path: string, newContent: string) => {
    setWorkspaceFiles(prev =>
      prev.map(f => {
        if (f.path === path) {
          const isModified = f.originalContent !== undefined && f.originalContent !== newContent;
          return { ...f, content: newContent, modified: isModified };
        }
        return f;
      })
    );

    // Sync save to disk
    fetch('/api/fs/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content: newContent }),
    }).catch(err => console.error('Disk save sync error:', err));
  };

  const handleCreateFile = (path: string) => {
    if (workspaceFiles.some(f => f.path === path)) return;
    const ext = path.split('.').pop()?.toLowerCase() || 'markdown';
    let lang = 'markdown';
    if (['js', 'jsx'].includes(ext)) lang = 'javascript';
    if (['ts', 'tsx'].includes(ext)) lang = 'typescript';
    if (['py'].includes(ext)) lang = 'python';
    if (['json'].includes(ext)) lang = 'json';
    if (['md', 'markdown'].includes(ext)) lang = 'markdown';

    let initialContent = `# ${path}\n\nAdd custom instructions or configuration here...`;
    if (lang === 'json') {
      initialContent = `{\n  "id": "mcp-custom",\n  "name": "Custom MCP",\n  "type": "stdio",\n  "commandOrUrl": "python3 mcp.py",\n  "status": "connected",\n  "enabled": true,\n  "tools": []\n}`;
    }

    const newFile: WorkspaceFile = {
      path,
      content: initialContent,
      language: lang,
      modified: true,
      originalContent: '',
    };

    setWorkspaceFiles(prev => [...prev, newFile]);
    setOpenFilePaths(prev => (prev.includes(path) ? prev : [...prev, path]));
    setActiveFilePath(path);

    // Sync create to disk
    fetch('/api/fs/file', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content: initialContent }),
    }).catch(err => console.error('Disk create sync error:', err));
  };

  const handleDeleteFile = (path: string) => {
    setWorkspaceFiles(prev => prev.filter(f => f.path !== path));
    handleCloseFile(path);

    // Sync delete to disk
    fetch(`/api/fs/file?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    }).catch(err => console.error('Disk delete sync error:', err));
  };

  const handleAcceptDiff = (path: string) => {
    setWorkspaceFiles(prev =>
      prev.map(f => (f.path === path ? { ...f, modified: false, originalContent: f.content } : f))
    );
  };

  const handleRevertDiff = (path: string) => {
    setWorkspaceFiles(prev =>
      prev.map(f => (f.path === path ? { ...f, content: f.originalContent || '', modified: false } : f))
    );
  };

  const handleLoadPreset = (preset: PresetProject) => {
    const formatted = preset.files.map(f => ({ ...f, originalContent: f.content }));
    setWorkspaceFiles(formatted);
    setOpenFilePaths(formatted.map(f => f.path));
    setActiveFilePath(formatted[0]?.path || null);

    setMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: `Loaded Workspace Template: "${preset.name}". Created ${preset.files.length} project files.`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Agent Chat Processor
  const handleSendMessage = async (userText: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    let payloadMessages = [...messages, userMsg];

    // Automatic Context Compaction when memory/token length grows
    if (payloadMessages.length > 8) {
      const { compactedMessages } = compactContextMessages(payloadMessages);
      payloadMessages = compactedMessages;
    }

    setMessages(payloadMessages);
    setAgentStatus('executing');

    const trimmed = userText.trim();
    const isBashCmd =
      trimmed.startsWith('$') ||
      /^(ls|pwd|whoami|uname|cat|git|npm|node|python3|python|nmap|ip|ifconfig|ps|echo|curl|mkdir|touch|date|env|clear|help)(\s|$)/i.test(trimmed);

    // Direct Kali VM Terminal Shell Execution
    if (isBashCmd) {
      const actualCmd = trimmed.replace(/^\$\s*/, '');
      if (actualCmd === 'clear') {
        setMessages([]);
        setAgentStatus('idle');
        return;
      }

      try {
        const res = await fetch('/api/execute-bash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: actualCmd, files: workspaceFiles }),
        });
        const data = await res.json();
        const outputText = data.stdout || data.stderr || 'Command completed with exit code 0.';

        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: outputText,
            toolCalls: [
              {
                id: `tool-${Date.now()}`,
                name: 'bash_run',
                args: { command: actualCmd },
                status: data.exitCode === 0 ? 'success' : 'failed',
                result: outputText,
              },
            ],
            timestamp: Date.now(),
          },
        ]);
        setAgentStatus('idle');
        return;
      } catch (err: any) {
        console.error('Terminal execution error:', err);
      }
    }

    setAgentStatus('thinking');

    // Build enriched system prompt with AGENTS.md, Active Skills & MCP tools
    const activeSkillsText = skills
      .filter(s => s.enabled)
      .map(s => `[SKILL: ${s.name}]\n${s.content}`)
      .join('\n\n');

    const activeMcpToolsText = mcpServers
      .filter(s => s.enabled)
      .flatMap(s => s.tools.filter(t => t.enabled).map(t => `- ${t.name}: ${t.description} (MCP: ${s.name})`))
      .join('\n');

    const activeAgentsText = customAgents
      .filter(a => a.enabled)
      .map(a => `[SUB-AGENT: ${a.name} (${a.role})] Model: ${a.modelId}\n${a.systemPrompt}`)
      .join('\n\n');

    const combinedSystemPrompt = `
${currentModel.systemPrompt || 'You are an autonomous AI coding agent.'}

# AGENT HARNESS PROTOCOL
You are operating in the Hybrids CLI TUI agent harness. Every model must follow these strict operational standards:

1. REASONING THOUGHT PROCESS:
Always express step-by-step reasoning inside a <thought> block prior to outputting your final response:
<thought>
1. Analyze user request...
2. Evaluate workspace files & required documentation...
3. Determine if web knowledge or tools are needed...
</thought>

2. AUTONOMOUS WEB SEARCH FOR KNOWLEDGE:
If you do NOT have complete knowledge, library specifications, documentation, or data needed to perform the user task, you MUST autonomously issue a web_search tool call:
\`\`\`json
{
  "tool": "web_search",
  "args": { "query": "search query here" }
}
\`\`\`
Do NOT ask the user to search the web for you. Search it yourself, read the snippets, and synthesize the knowledge directly.

3. FILESYSTEM & BASH TOOL ACTIONS:
- To write/modify files, output a codeblock with filepath parameter: \`\`\`typescript filepath="src/App.tsx" ... \`\`\` or \`\`\`json {"tool": "write_file", "args": {"path": "src/App.tsx", "content": "..."}} \`\`\`
- To execute shell commands, output: \`\`\`json {"tool": "bash_run", "args": {"command": "npm test"}} \`\`\`

# ACTIVE MULTI-AGENT TEAM & ROLES
${activeAgentsText || 'Standard single agent mode.'}

# AGENTS.md CUSTOM INSTRUCTIONS
${agentConfig.agentsMdContent}

# ACTIVE USER SKILLS
${activeSkillsText || 'No custom skills loaded.'}

# AVAILABLE MCP TOOLS
${activeMcpToolsText || 'Standard filesystem and bash tools enabled.'}
    `.trim();

    try {
      const ssoState = loadGeminiSsoState();
      const effectiveModel = {
        ...currentModel,
        oauthToken: currentModel.oauthToken || (ssoState.isConnected ? ssoState.accessToken : undefined),
        authType: currentModel.authType || (ssoState.isConnected ? 'oauth_sso' : 'api_key'),
      };

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelConfig: effectiveModel,
          messages: payloadMessages,
          workspaceFiles,
          systemPrompt: combinedSystemPrompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const rawText: string = data.text || '';

      // Extract reasoning thought block if present
      let thought = '';
      let cleanContent = rawText;

      const thoughtMatch = rawText.match(/<thought>([\s\S]*?)<\/thought>/);
      if (thoughtMatch) {
        thought = thoughtMatch[1].trim();
        cleanContent = rawText.replace(/<thought>[\s\S]*?<\/thought>/, '').trim();
      }

      // Parse Tool Calls
      const toolCallsExecuted: ToolCall[] = [];

      // Pattern 1: Code block file edits like ```typescript filepath="src/App.tsx"
      const fileCodeBlockRegex = /```(?:[a-zA-Z]+)?\s+(?:filepath|file|filename)=["']?([^"'\s]+)["']?\n([\s\S]*?)```/g;
      let match;
      while ((match = fileCodeBlockRegex.exec(rawText)) !== null) {
        const targetPath = match[1];
        const newCode = match[2];

        toolCallsExecuted.push({
          id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: 'write_file',
          args: { path: targetPath, content: newCode },
          status: agentMode === 'interactive' ? 'pending' : 'success',
          timestamp: Date.now(),
        });
      }

      // Pattern 2: JSON Tool Calls (web_search, bash_run, read_file, etc.)
      const jsonToolRegex = /```json\s*(\{[\s\S]*?"tool":\s*"([^"]+)"[\s\S]*?\})\s*```/g;
      let jsonMatch;
      while ((jsonMatch = jsonToolRegex.exec(rawText)) !== null) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          const toolName = parsed.tool || 'write_file';
          const toolArgs = parsed.args || {};

          toolCallsExecuted.push({
            id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: toolName,
            args: toolArgs,
            status: 'executing',
            timestamp: Date.now(),
          });
        } catch (e) {
          // ignore parse errors
        }
      }

      // Execute background tool calls (web_search, write_file, bash_run)
      for (const tc of toolCallsExecuted) {
        if (tc.name === 'web_search' && tc.args.query) {
          setAgentStatus('executing');
          try {
            const searchRes = await fetch('/api/web-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: tc.args.query }),
            });
            const searchData = await searchRes.json();
            tc.status = 'success';
            tc.result = searchData.results;
          } catch (sErr: any) {
            tc.status = 'failed';
            tc.result = `Web search failed: ${sErr.message}`;
          }
        } else if (tc.name === 'write_file' && tc.args.path) {
          if (agentMode !== 'interactive') {
            handleSaveFile(tc.args.path, tc.args.content);
            tc.status = 'success';
            tc.result = `Successfully written ${tc.args.content?.length || 0} bytes to ${tc.args.path}`;
          } else {
            tc.status = 'pending';
          }
        } else if (tc.name === 'bash_run' && tc.args.command) {
          try {
            const bashRes = await fetch('/api/execute-bash', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ command: tc.args.command, files: workspaceFiles }),
            });
            const bashData = await bashRes.json();
            tc.status = bashData.exitCode === 0 ? 'success' : 'failed';
            tc.result = bashData.stdout || bashData.stderr || 'Executed.';
          } catch (bErr: any) {
            tc.status = 'failed';
            tc.result = `Bash execution error: ${bErr.message}`;
          }
        } else {
          tc.status = 'success';
        }
      }

      if (agentMode === 'interactive' && toolCallsExecuted.some(t => t.status === 'pending')) {
        const pending = toolCallsExecuted.find(t => t.status === 'pending');
        if (pending) {
          setPendingToolCall(pending);
          setAgentStatus('awaiting_approval');
        }
      }

      // Calculate token and cost stats
      const inTokens = data.usage?.inputTokens || Math.round(userText.length / 4);
      const outTokens = data.usage?.outputTokens || Math.round(cleanContent.length / 4);
      const messageCost = 
        (inTokens / 1000000) * (currentModel.inputCostPer1M || 1) + 
        (outTokens / 1000000) * (currentModel.outputCostPer1M || 3);

      setStats(prev => ({
        totalInputTokens: prev.totalInputTokens + inTokens,
        totalOutputTokens: prev.totalOutputTokens + outTokens,
        totalCost: prev.totalCost + messageCost,
        messagesCount: prev.messagesCount + 2,
        toolCallsCount: prev.toolCallsCount + toolCallsExecuted.length,
        filesModifiedCount: workspaceFiles.filter(f => f.modified).length,
      }));

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: cleanContent || 'Task completed successfully.',
        thought,
        toolCalls: toolCallsExecuted,
        tokens: { input: inTokens, output: outTokens },
        cost: messageCost,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (agentMode !== 'interactive') {
        setAgentStatus('idle');
      }
    } catch (err: any) {
      console.error('Agent chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `✖ Error executing agent query: ${err.message}`,
          timestamp: Date.now(),
        },
      ]);
      setAgentStatus('idle');
    }
  };

  // Interactive Tool Approval Controls
  const handleApproveTool = (toolId: string) => {
    if (pendingToolCall) {
      if (pendingToolCall.name === 'write_file' && pendingToolCall.args.path) {
        handleSaveFile(pendingToolCall.args.path, pendingToolCall.args.content);
      }
      setPendingToolCall(null);
      setAgentStatus('idle');
    }
  };

  const handleRejectTool = (toolId: string) => {
    setPendingToolCall(null);
    setAgentStatus('idle');
  };

  // Slash Commands Dispatcher
  const handleExecuteSlashCommand = (cmdStr: string) => {
    const parts = cmdStr.trim().split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case '/goal':
        const goalQuery = parts.slice(1).join(' ');
        if (goalQuery.trim()) {
          const newGoal: AgentGoal = {
            id: `goal-${Date.now()}`,
            title: goalQuery.trim(),
            status: 'active',
            progress: 0,
            tasks: [
              { id: `task-${Date.now()}-1`, title: 'Inspect workspace context & code requirements', status: 'in_progress' },
              { id: `task-${Date.now()}-2`, title: `Implement feature: ${goalQuery.trim()}`, status: 'pending' },
              { id: `task-${Date.now()}-3`, title: 'Run tests and verify build integrity', status: 'pending' },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setGoals(prev => [newGoal, ...prev]);
          setMessages(prev => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              role: 'system',
              content: `🎯 New Goal Objective Initialized: "${goalQuery.trim()}". Multi-step checklist created with 3 sub-tasks.`,
              timestamp: Date.now(),
            },
          ]);
        }
        setIsGoalModalOpen(true);
        break;
      case '/loop':
        const loopQuery = parts.slice(1).join(' ');
        let intervalSec = 15;
        let promptText = loopQuery;

        if (parts[1] && parts[1].endsWith('s')) {
          intervalSec = parseInt(parts[1].replace('s', '')) || 15;
          promptText = parts.slice(2).join(' ');
        }

        if (promptText.trim()) {
          const newLoop: AgentLoopConfig = {
            id: `loop-${Date.now()}`,
            intervalSec,
            prompt: promptText.trim(),
            isRunning: true,
            currentIteration: 0,
            maxIterations: 5,
            lastRunTime: Date.now(),
          };
          setLoops(prev => [...prev, newLoop]);
          setMessages(prev => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              role: 'system',
              content: `🔁 Recurring Agent Loop Scheduled: Every ${intervalSec}s running "${promptText.trim()}". Max iterations: 5.`,
              timestamp: Date.now(),
            },
          ]);
        }
        setIsLoopModalOpen(true);
        break;
      case '/herder':
      case '/harness':
        setIsHerderModalOpen(true);
        break;
      case '/skills':
      case '/agents':
        setIsSkillsAndAgentsModalOpen(true);
        break;
      case '/mcp':
        setIsMcpManagerModalOpen(true);
        break;
      case '/history':
        setIsHistoryDrawerOpen(true);
        break;
      case '/vault':
        setIsApiKeyVaultOpen(true);
        break;
      case '/model':
      case '/config':
        setIsModelModalOpen(true);
        break;
      case '/mode':
        const modes: AgentMode[] = ['auto', 'plan', 'interactive', 'yolo'];
        const nextIdx = (modes.indexOf(agentMode) + 1) % modes.length;
        setAgentMode(modes[nextIdx]);
        setMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'system',
            content: `Agent Mode updated to: UPPERCASE[${modes[nextIdx].toUpperCase()}]`,
            timestamp: Date.now(),
          },
        ]);
        break;
      case '/new':
        createNewChatSession('New AI Agent Session');
        break;
      case '/compact':
        handleCompactSession(activeSessionId);
        break;
      case '/clear':
        setMessages([]);
        break;
      case '/init':
        setIsPresetModalOpen(true);
        break;
      case '/theme':
        const themesList = Object.keys(THEMES) as TuiTheme[];
        const tIdx = (themesList.indexOf(currentTheme) + 1) % themesList.length;
        setTheme(themesList[tIdx]);
        break;
      case '/export':
        const blob = new Blob([JSON.stringify({ messages, workspaceFiles, stats, skills, mcpServers, agentConfig }, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opencode-session-${Date.now()}.json`;
        a.click();
        break;
      case '/help':
        setIsHelpModalOpen(true);
        break;
      default:
        handleSendMessage(cmdStr);
        break;
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden font-mono antialiased"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Top Header */}
      <TuiHeader
        currentModel={currentModel}
        agentMode={agentMode}
        setAgentMode={setAgentMode}
        agentStatus={agentStatus}
        stats={stats}
        currentTheme={currentTheme}
        setTheme={setTheme}
        onOpenModelModal={() => setIsModelModalOpen(true)}
        onOpenWorkspaceModal={() => setIsPresetModalOpen(true)}
        onOpenCostModal={() => setIsCostModalOpen(true)}
        onOpenHelpModal={() => setIsHelpModalOpen(true)}
        onOpenHistoryDrawer={() => setIsHistoryDrawerOpen(true)}
        onOpenApiKeyVaultModal={() => setIsApiKeyVaultOpen(true)}
        onOpenSkillsAndAgentsModal={() => setIsSkillsAndAgentsModalOpen(true)}
        onOpenMcpManagerModal={() => setIsMcpManagerModalOpen(true)}
        onOpenGoalModal={() => setIsGoalModalOpen(true)}
        onOpenLoopModal={() => setIsLoopModalOpen(true)}
        onOpenWebSearchModal={() => setIsWebSearchModalOpen(true)}
        onOpenHerderModal={() => setIsHerderModalOpen(true)}
        skillsCount={skills.filter(s => s.enabled).length}
        mcpToolsCount={mcpServers.filter(s => s.enabled).flatMap(s => s.tools.filter(t => t.enabled)).length}
        activeGoalsCount={goals.filter(g => g.status === 'active').length}
        activeLoopsCount={loops.filter(l => l.isRunning).length}
        activeHarnessesCount={harnesses.filter(h => h.enabled).length}
      />

      {/* Main Workspace Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Sidebar */}
        {showSidebar && (
          <TuiWorkspaceSidebar
            files={workspaceFiles}
            activeFilePath={activeFilePath}
            onSelectFile={handleSelectFile}
            onCreateFile={(path) => {
              handleCreateFile(path);
              setActiveTab('editor');
            }}
            onDeleteFile={handleDeleteFile}
            onOpenWorkspaceModal={() => setIsPresetModalOpen(true)}
            currentTheme={currentTheme}
          />
        )}

        {/* Center Main View Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Main View Top Bar with Tabs */}
          <div 
            className="px-3 py-1.5 border-b flex items-center justify-between text-xs select-none"
            style={{ backgroundColor: theme.bg, borderColor: theme.border }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(prev => !prev)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 mr-1"
                title="Toggle Workspace Sidebar"
              >
                {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>

              {/* View View Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-white/10">
                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-colors ${
                    activeTab === 'terminal' 
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Terminal CLI</span>
                </button>

                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-colors ${
                    activeTab === 'editor' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>File Editor</span>
                  {activeFilePath && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] ml-1 opacity-80">
                      ({activeFilePath})
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 hidden md:flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓ Workspace Live Edit Enabled</span>
              <span>·</span>
              <span>Press <span className="font-bold underline text-slate-300">Tab</span> for autocomplete</span>
            </div>
          </div>

          {/* Main View Area: Terminal vs File Editor */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === 'terminal' ? (
              <TuiTerminal
                messages={messages}
                currentTheme={currentTheme}
                agentMode={agentMode}
                agentStatus={agentStatus}
                pendingToolCall={pendingToolCall}
                onApproveTool={handleApproveTool}
                onRejectTool={handleRejectTool}
                onAlwaysApprove={() => {
                  setAgentMode('auto');
                  if (pendingToolCall) handleApproveTool(pendingToolCall.id);
                }}
                currentModelName={currentModel.name}
                onExecuteSlashCommand={handleExecuteSlashCommand}
              />
            ) : (
              <TuiFileEditor
                file={workspaceFiles.find(f => f.path === activeFilePath) || null}
                openFiles={workspaceFiles.filter(f => openFilePaths.includes(f.path))}
                activeFilePath={activeFilePath}
                onSelectFile={handleSelectFile}
                onCloseFile={handleCloseFile}
                onSaveFile={handleSaveFile}
                currentTheme={currentTheme}
              />
            )}
          </div>

          {/* Bottom Command Prompt Bar */}
          <TuiCommandBar
            onSendMessage={handleSendMessage}
            currentTheme={currentTheme}
            agentMode={agentMode}
            agentStatus={agentStatus}
            onExecuteSlashCommand={handleExecuteSlashCommand}
          />
        </div>
      </div>

      {/* Modals & Drawers */}
      {isModelModalOpen && (
        <TuiModelConfigModal
          currentModel={currentModel}
          onSelectModel={setCurrentModel}
          onSaveCustomModel={(m) => setCurrentModel(m)}
          onClose={() => setIsModelModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isCostModalOpen && (
        <TuiCostTrackerModal
          stats={stats}
          currentModel={currentModel}
          onClose={() => setIsCostModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isHelpModalOpen && (
        <TuiHelpModal
          onClose={() => setIsHelpModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isPresetModalOpen && (
        <TuiWorkspacePresetModal
          onLoadPreset={handleLoadPreset}
          onClose={() => setIsPresetModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isApiKeyVaultOpen && (
        <TuiApiKeyVaultModal
          onSelectApiKey={handleSelectApiKeyFromVault}
          onClose={() => setIsApiKeyVaultOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isSkillsAndAgentsModalOpen && (
        <TuiSkillsAndAgentsModal
          skills={skills}
          onUpdateSkills={setSkills}
          agentConfig={agentConfig}
          onUpdateAgentConfig={setAgentConfig}
          customAgents={customAgents}
          onUpdateCustomAgents={setCustomAgents}
          availableModels={DEFAULT_MODELS}
          onClose={() => setIsSkillsAndAgentsModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isMcpManagerModalOpen && (
        <TuiMcpManagerModal
          mcpServers={mcpServers}
          onUpdateMcpServers={setMcpServers}
          onClose={() => setIsMcpManagerModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isGoalModalOpen && (
        <TuiGoalManagerModal
          goals={goals}
          onUpdateGoals={setGoals}
          onExecuteGoalStep={(goal, task) => {
            handleSendMessage(`[🎯 Executing Goal Step - ${goal.title}]: Step: ${task.title}. Please complete this task and update workspace state.`);
          }}
          onClose={() => setIsGoalModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isLoopModalOpen && (
        <TuiLoopManagerModal
          loops={loops}
          onUpdateLoops={setLoops}
          onRunLoopIteration={(loop) => {
            handleSendMessage(`[🔁 Agent Loop Iteration - Manual Trigger]: ${loop.prompt}`);
          }}
          onClose={() => setIsLoopModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isWebSearchModalOpen && (
        <TuiWebSearchModal
          onSendMessage={handleSendMessage}
          onClose={() => setIsWebSearchModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isHerderModalOpen && (
        <TuiHerderModal
          harnesses={harnesses}
          models={DEFAULT_MODELS}
          onUpdateHarnesses={setHarnesses}
          onDispatchTask={(taskPrompt, selectedHarnessIds) => {
            const activeHarnessNames = harnesses
              .filter(h => selectedHarnessIds.includes(h.id))
              .map(h => `${h.name} (${h.role})`)
              .join(', ');

            handleSendMessage(`[🤖 Agent Herder Swarm Dispatch]:
Task Objective: ${taskPrompt}
Assigned Harnesses: ${activeHarnessNames}

Please coordinate execution across all assigned sub-agent harnesses, execute required file edits, security checks, and report outputs.`);
          }}
          onClose={() => setIsHerderModalOpen(false)}
          currentTheme={currentTheme}
        />
      )}

      {isHistoryDrawerOpen && (
        <TuiChatHistoryDrawer
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onCreateNewSession={() => createNewChatSession()}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onCompactSession={handleCompactSession}
          onClose={() => setIsHistoryDrawerOpen(false)}
          currentTheme={currentTheme}
          currentModel={currentModel}
        />
      )}
    </div>
  );
}
