import { ModelConfig, PresetProject, TuiTheme, CustomAgent, AgentHarness } from './types';

export const DEFAULT_HARNESSES: AgentHarness[] = [
  {
    id: 'harness-architect',
    name: 'Lead Architect Harness',
    role: 'System Architect',
    modelId: 'gemini-3.6-flash',
    systemPrompt: 'You are a Lead System Architect harness. Analyze requirements, outline modular component structures, and maintain clean separation of concerns.',
    avatarIcon: 'brain',
    status: 'idle',
    enabled: true,
    tasksCompleted: 2,
    lastLog: 'Architect Harness standby for structural tasks.',
  },
  {
    id: 'harness-sec-auditor',
    name: 'Web & API Security Auditor',
    role: 'Security Pentester',
    modelId: 'gemini-3.6-flash',
    systemPrompt: 'You are an API & Web Application Security Auditor harness. Inspect API handlers, input validation, authentication headers, and OWASP top 10 risks.',
    avatarIcon: 'shield',
    status: 'idle',
    enabled: true,
    tasksCompleted: 5,
    lastLog: 'Security Auditor Harness active. Memory checked for unauthorized key exposure.',
  },
  {
    id: 'harness-coder',
    name: 'Full-Stack Developer Harness',
    role: 'Core Developer',
    modelId: 'gemini-3.6-flash',
    systemPrompt: 'You are a Full-Stack React & TypeScript Developer harness. Write clean, performant, type-safe components and API integrations.',
    avatarIcon: 'code',
    status: 'idle',
    enabled: true,
    tasksCompleted: 12,
    lastLog: 'Full-Stack Harness idle. Ready for UI/backend code modifications.',
  },
  {
    id: 'harness-qa-refactor',
    name: 'QA & Refactor Specialist',
    role: 'QA Engineer',
    modelId: 'claude-3-7-sonnet-20250219',
    systemPrompt: 'You are a QA & Code Refactoring Specialist harness. Verify build status, linter warnings, dead code removal, and edge case handling.',
    avatarIcon: 'bug',
    status: 'idle',
    enabled: true,
    tasksCompleted: 4,
    lastLog: 'QA Harness verified TypeScript compilation.',
  },
];

export const DEFAULT_CUSTOM_AGENTS: CustomAgent[] = [
  {
    id: 'agent-architect',
    name: 'Lead System Architect',
    role: 'Lead Architect',
    modelId: 'gemini-3.6-flash',
    systemPrompt: 'You are a Lead System Architect. Focus on clean modular architecture, optimal file structure, and high-performance design patterns.',
    avatarIcon: 'brain',
    enabled: true,
  },
  {
    id: 'agent-pentester',
    name: 'Kali Security Auditor',
    role: 'Security Pentester',
    modelId: 'gemini-3.6-flash',
    systemPrompt: 'You are a Kali Linux Security Specialist & Pentester. Audit code for vulnerabilities, input sanitization, and secure shell practices.',
    avatarIcon: 'shield',
    enabled: true,
  },
  {
    id: 'agent-reviewer',
    name: 'Code Reviewer & Refactorer',
    role: 'Code Reviewer',
    modelId: 'claude-3-7-sonnet-20250219',
    systemPrompt: 'You are a strict Code Reviewer. Inspect code for precision, type safety, modular component extraction, and performance.',
    avatarIcon: 'bug',
    enabled: true,
  },
];

export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash (Default - Hybrids CLI)',
    provider: 'gemini',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    supportsThinking: true,
    contextWindow: 1000000,
    systemPrompt: `You are ACY Agent (Hybrids CLI), an advanced AI coding assistant operating in a Terminal User Interface (TUI).
You write pristine, production-ready, highly maintainable code.
When requested to perform coding tasks:
1. First state your concise reasoning in a reasoning thought block.
2. Formulate clear tool calls to read files, create plans, write files, or execute shell commands.
3. Keep code modifications exact and high quality.`,
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (High Reasoning)',
    provider: 'gemini',
    maxTokens: 8192,
    temperature: 0.1,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    supportsThinking: true,
    contextWindow: 2000000,
  },
  {
    id: 'openrouter/auto',
    name: 'OpenRouter (Auto Router / OpenRouter API)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.80,
    supportsThinking: true,
    contextWindow: 200000,
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'OpenRouter (DeepSeek R1 Reasoning)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    supportsThinking: true,
    contextWindow: 164000,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'OpenRouter (Claude 3.5 Sonnet)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    contextWindow: 200000,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'OpenRouter (Meta Llama 3.3 70B)',
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.12,
    outputCostPer1M: 0.30,
    contextWindow: 128000,
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet (Anthropic Direct API)',
    provider: 'claude',
    maxTokens: 16000,
    temperature: 0.2,
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    supportsThinking: true,
    contextWindow: 200000,
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.2,
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    contextWindow: 128000,
  },
  {
    id: 'qwen2.5-coder:7b',
    name: 'Local Ollama (qwen2.5-coder:7b)',
    provider: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    contextWindow: 32768,
  },
  {
    id: 'deepseek-coder-v2',
    name: 'Local LM Studio / LocalAI (deepseek-coder)',
    provider: 'custom',
    baseUrl: 'http://localhost:1234/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.00,
    outputCostPer1M: 0.00,
    contextWindow: 64000,
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq (Llama 3.3 70B Fast)',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    maxTokens: 8192,
    temperature: 0.2,
    inputCostPer1M: 0.59,
    outputCostPer1M: 0.79,
    contextWindow: 128000,
  },
];

export const THEMES: Record<TuiTheme, { name: string; bg: string; text: string; primary: string; accent: string; border: string; highlight: string }> = {
  'tokyo-night': {
    name: 'Tokyo Night',
    bg: '#1a1b26',
    text: '#a9b1d6',
    primary: '#7aa2f7',
    accent: '#bb9af7',
    border: '#24283b',
    highlight: '#2ac3de',
  },
  'claude-code-dark': {
    name: 'Claude Code (Official)',
    bg: '#181816',
    text: '#e3e1d9',
    primary: '#da7756', // Claude Terra Cotta Orange
    accent: '#f2a685',
    border: '#2b2a27',
    highlight: '#e08d6c',
  },
  'gemini-cli-dark': {
    name: 'Gemini CLI (Google)',
    bg: '#131314',
    text: '#e3e2e6',
    primary: '#8ab4f8', // Google Blue
    accent: '#c58af9', // Google Purple
    border: '#282a2c',
    highlight: '#78d9ec',
  },
  'kali-purple': {
    name: 'Kali Linux Dragon (VM CLI)',
    bg: '#0a0812',
    text: '#00ff88',
    primary: '#9c27b0', // Kali Purple
    accent: '#00d2ff', // Cyan
    border: '#251738',
    highlight: '#ff2a74',
  },
  'monokai': {
    name: 'Monokai Pro',
    bg: '#2d2a2e',
    text: '#fcfcfa',
    primary: '#ffd866',
    accent: '#ff6188',
    border: '#403e41',
    highlight: '#a9dc76',
  },
  'catppuccin': {
    name: 'Catppuccin Mocha',
    bg: '#1e1e2e',
    text: '#cdd6f4',
    primary: '#89b4fa',
    accent: '#f5c2e7',
    border: '#313244',
    highlight: '#a6e3a1',
  },
  'cyberpunk-green': {
    name: 'Hacker Matrix Green',
    bg: '#0a0f0d',
    text: '#00ff66',
    primary: '#00ff66',
    accent: '#33ff99',
    border: '#1a3324',
    highlight: '#66ffcc',
  },
  'amber-crt': {
    name: 'Retro Amber CRT',
    bg: '#120d00',
    text: '#ffb000',
    primary: '#ffb000',
    accent: '#ffd066',
    border: '#3a2800',
    highlight: '#ffe099',
  },
  'dracula': {
    name: 'Dracula',
    bg: '#282a36',
    text: '#f8f8f2',
    primary: '#bd93f9',
    accent: '#ff79c6',
    border: '#44475a',
    highlight: '#50fa7b',
  },
  'matrix-hacker': {
    name: 'Matrix Cyber Terminal',
    bg: '#020b05',
    text: '#00ff41',
    primary: '#00ff41',
    accent: '#008f11',
    border: '#0d3813',
    highlight: '#003b00',
  },
};

export const DEFAULT_SKILLS = [
  {
    id: 'sec-audit',
    name: 'Security Audit & Vulnerability Scanner',
    description: 'Scans source code for hardcoded credentials, injection vulnerabilities, and improper state handling.',
    category: 'security' as const,
    enabled: true,
    content: `# Security Audit & Code Analysis Guidelines
- Check for hardcoded API keys or secrets in source code files.
- Ensure all user inputs are sanitized and parameterized.
- Verify robust error handling with zero sensitive stack trace exposure.
- Recommend standard authorization guards on server endpoints.`,
  },
  {
    id: 'git-diff-reviewer',
    name: 'Git Diff Reviewer & Commit Generator',
    description: 'Analyzes staged file diffs and writes structured conventional commit messages.',
    category: 'devops' as const,
    enabled: true,
    content: `# Git Diff Review Guidelines
- Inspect modified files in Git workspace before finalizing changes.
- Group logical changes into atomic conventional commits (e.g. feat:, fix:, refactor:).
- Include clear bullet points describing user-facing functional impact.`,
  },
  {
    id: 'mcp-integration',
    name: 'MCP (Model Context Protocol) Handler',
    description: 'Enables seamless interaction with external Model Context Protocol stdio/SSE servers.',
    category: 'code' as const,
    enabled: true,
    content: `# MCP Integration Guidelines
- Map external tool schemas dynamically into AI agent function calls.
- Forward arguments safely and format JSON outputs into clear terminal tables or code snippets.`,
  },
];

export const DEFAULT_MCPS = [
  {
    id: 'mcp-filesystem',
    name: 'Filesystem MCP Server',
    type: 'stdio' as const,
    commandOrUrl: 'npx -y @modelcontextprotocol/server-filesystem /workspace',
    status: 'connected' as const,
    enabled: true,
    tools: [
      { name: 'read_file', description: 'Read full content of a workspace file', enabled: true },
      { name: 'write_file', description: 'Write or update a workspace file safely', enabled: true },
      { name: 'list_directory', description: 'List files and directories recursively', enabled: true },
    ],
  },
  {
    id: 'mcp-kali-tools',
    name: 'Kali VM Security Inspector MCP',
    type: 'stdio' as const,
    commandOrUrl: 'python3 /usr/local/bin/mcp-kali-inspector.py',
    status: 'connected' as const,
    enabled: true,
    tools: [
      { name: 'nmap_scan_sim', description: 'Simulate local network port service inspection', enabled: true },
      { name: 'code_sanitizer', description: 'Verify safe input boundaries in script endpoints', enabled: true },
      { name: 'package_checker', description: 'Inspect installed Kali VM apt/pip dependencies', enabled: true },
    ],
  },
  {
    id: 'mcp-github',
    name: 'GitHub Repository MCP',
    type: 'sse' as const,
    commandOrUrl: 'https://api.github.com/mcp/v1',
    status: 'connected' as const,
    enabled: false,
    tools: [
      { name: 'create_issue', description: 'Create a GitHub issue with reproduction steps', enabled: true },
      { name: 'search_code', description: 'Search GitHub repositories across organization', enabled: true },
    ],
  },
];

export const DEFAULT_AGENTS_MD = `# AGENTS.md - Hybrids CLI Custom Instructions & Guidelines

## Core Principles
1. **Hybrid Provider Autonomy**: Seamlessly switch between Local Models (Ollama, LM Studio), OpenRouter API, Claude, and Gemini.
2. **Terminal Craftsmanship**: Maintain high-contrast, clean CLI terminal formatting with color-coded badges and ASCII art.
3. **Multi-Step Goal Resolution**: Break complex tasks into /goal objective checklists and run automated /loop iterations.
4. **Tool & MCP Mastery**: Use read_file, write_file, web search/reader, and custom MCP tools effectively.

## Environment Specs
- Operating System: Linux (Hybrids CLI Terminal Workspace)
- Shell: bash / zsh
- Default User: hybrids@cli-terminal
`;

export const PRESET_PROJECTS: PresetProject[] = [
  {
    id: 'acy-agent-workspace',
    name: 'ACY Agent Directory Workspace',
    description: 'Complete environment with agents/ directory, skills/ directory, mcp/ configs, root AGENTS.md, and config.json.',
    files: [
      {
        path: 'SETUP.md',
        language: 'markdown',
        content: `# ACY Hybrids Setup & Customization Guide

This guide explains how to customize and expand your ACY Hybrids agent workspace with custom Agent Personas, Skills, and Model Context Protocol (MCP) servers.

---

## 1. Customizing Root AGENTS.md
The \`AGENTS.md\` file at the workspace root acts as the primary system instruction set for the AI model.
- Add global coding standards, safety rules, or project goals.
- The CLI and Browser TUI automatically inject \`AGENTS.md\` into prompt context.

---

## 2. Adding Custom Agent Personas (\`agents/\`)
To add a new agent persona:
1. Create a subdirectory under \`agents/\` (e.g., \`agents/my-custom-agent/\`).
2. Create an \`AGENTS.md\` file inside that folder.
3. Switch active agent in CLI using \`/agent my-custom-agent\` or via the Agent Herder dropdown.

---

## 3. Adding Custom Skills (\`skills/\`)
Skills provide modular operational guidelines and procedural workflows:
1. Create a directory in \`skills/\` (e.g., \`skills/api-testing/\`).
2. Add a \`SKILLS.md\` file.

---

## 4. Configuring MCP Servers (\`mcp/\`)
Model Context Protocol (MCP) servers enable standard tool connections (databases, external APIs, terminal tools).
Create a JSON config in \`mcp/\` (e.g., \`mcp/custom-mcp.json\`).
`,
      },
      {
        path: 'DEPLOYMENT_KALI.md',
        language: 'markdown',
        content: `# Kali Linux VM & TMUX Terminal CLI Setup Guide

## 1. Run Interactive CLI directly in TMUX / Bash Terminal
\`\`\`bash
# Launch interactive REPL directly in your Kali terminal session
npm run cli
# or
node cli.js

# Or start inside a persistent tmux session:
tmux new -s acy
npm run cli
\`\`\`

## 2. Install Prerequisites on Kali VM
\`\`\`bash
sudo apt update && sudo apt install -y nodejs npm git python3 tmux curl
\`\`\`

## 3. Install Dependencies & Configure
\`\`\`bash
npm install
nano .env # Set GEMINI_API_KEY=your_key
\`\`\`

## 4. Single Command Execution in Terminal
\`\`\`bash
node cli.js "scan workspace directory and check AGENTS.md instructions"
\`\`\`
`,
      },
      {
        path: 'AGENTS.md',
        language: 'markdown',
        content: `# AGENTS.md - ACY Agent Workspace Instructions

## Core Operating Principles
1. **Hybrid Model Autonomy**: Support Gemini 3.6 Flash, Claude, Local Models (Ollama/LM Studio), and OpenRouter.
2. **Directory Architecture**: Manage personas in \`agents/\`, capabilities in \`skills/\`, and tool integrations in \`mcp/\`.
3. **Multi-Step Harness**: Execute multi-subtask \`/goal\` checklists and automated \`/loop\` monitoring tasks.
4. **Interactive CLI Execution**: Full support for bash commands, file editing, and live web search grounding.

## Environment Specs
- Operating System: Linux (ACY Terminal Workspace)
- Shell: bash / zsh
- Default User: acy@terminal
`,
      },
      {
        path: 'config.json',
        language: 'json',
        content: `{
  "agentName": "ACY Agent",
  "activeProfile": "custom",
  "harness": "autonomous-multi-agent",
  "mcpEnabled": true,
  "skillsEnabled": true,
  "theme": "tokyo-night",
  "temperature": 0.2,
  "maxTokens": 8192
}`,
      },
      {
        path: 'agents/coder/AGENTS.md',
        language: 'markdown',
        content: `# Coder Agent Persona (agents/coder/AGENTS.md)

## Responsibilities
- Write clean, modular, and performant TypeScript / Python code.
- Ensure strict type safety and error boundary handling.
- Group refactoring changes into clean diff patches.
`,
      },
      {
        path: 'agents/researcher/AGENTS.md',
        language: 'markdown',
        content: `# Researcher Agent Persona (agents/researcher/AGENTS.md)

## Responsibilities
- Query live web search for technical documentation, benchmarks, and API reference.
- Synthesize findings into clear summaries with citation URLs.
`,
      },
      {
        path: 'agents/architect/AGENTS.md',
        language: 'markdown',
        content: `# System Architect Persona (agents/architect/AGENTS.md)

## Responsibilities
- Design scalable software architectures and directory layouts.
- Define clean API contracts and component separation of concerns.
`,
      },
      {
        path: 'agents/security/AGENTS.md',
        language: 'markdown',
        content: `# Security Auditor Persona (agents/security/AGENTS.md)

## Responsibilities
- Inspect codebase for hardcoded secrets, injection flaws, and unsafe defaults.
- Verify security configurations and input sanitization boundaries.
`,
      },
      {
        path: 'skills/web-search/SKILLS.md',
        language: 'markdown',
        content: `# Web Search & Grounding Skill (skills/web-search/SKILLS.md)

- Query Google Search and official documentation APIs for real-time technical information.
- Format documentation outputs with actionable code snippets.
`,
      },
      {
        path: 'skills/code-analysis/SKILLS.md',
        language: 'markdown',
        content: `# Code Analysis & Refactoring Skill (skills/code-analysis/SKILLS.md)

- Perform structural code dependency analysis and bug detection.
- Offer targeted refactoring suggestions with diff comparisons.
`,
      },
      {
        path: 'skills/terminal-exec/SKILLS.md',
        language: 'markdown',
        content: `# Terminal & Shell Execution Skill (skills/terminal-exec/SKILLS.md)

- Run bash terminal commands in the Linux workspace environment.
- Format terminal output logs cleanly into TUI console panels.
`,
      },
      {
        path: 'skills/security-audit/SKILLS.md',
        language: 'markdown',
        content: `# Security & Vulnerability Audit Skill (skills/security-audit/SKILLS.md)

- Audit source files for hardcoded API keys or vulnerable dependencies.
- Ensure sanitized user input handling across all server routes.
`,
      },
      {
        path: 'mcp/filesystem.json',
        language: 'json',
        content: `{
  "id": "mcp-filesystem",
  "name": "Filesystem MCP Server",
  "type": "stdio",
  "commandOrUrl": "npx -y @modelcontextprotocol/server-filesystem /workspace",
  "status": "connected",
  "enabled": true,
  "tools": [
    { "name": "read_file", "description": "Read full content of a workspace file", "enabled": true },
    { "name": "write_file", "description": "Write or update a workspace file safely", "enabled": true },
    { "name": "list_directory", "description": "List files and directories recursively", "enabled": true }
  ]
}`,
      },
      {
        path: 'mcp/kali-inspector.json',
        language: 'json',
        content: `{
  "id": "mcp-kali-tools",
  "name": "Kali Security Inspector MCP",
  "type": "stdio",
  "commandOrUrl": "python3 /usr/local/bin/mcp-kali-inspector.py",
  "status": "connected",
  "enabled": true,
  "tools": [
    { "name": "nmap_scan_sim", "description": "Simulate local network port service inspection", "enabled": true },
    { "name": "code_sanitizer", "description": "Verify safe input boundaries in script endpoints", "enabled": true },
    { "name": "package_checker", "description": "Inspect installed Kali VM apt/pip dependencies", "enabled": true }
  ]
}`,
      },
      {
        path: 'mcp/github.json',
        language: 'json',
        content: `{
  "id": "mcp-github",
  "name": "GitHub Integration MCP Server",
  "type": "sse",
  "commandOrUrl": "https://api.github.com/mcp/v1",
  "status": "connected",
  "enabled": true,
  "tools": [
    { "name": "create_issue", "description": "Create a GitHub issue with reproduction steps", "enabled": true },
    { "name": "search_code", "description": "Search GitHub repositories across organization", "enabled": true }
  ]
}`,
      },
    ],
  },
  {
    id: 'kali-sec-workspace',
    name: 'Kali VM Security Agent Workspace',
    description: 'Security & pentesting environment configured with agents/, skills/, and mcp/ tools.',
    files: [
      {
        path: 'AGENTS.md',
        language: 'markdown',
        content: `# AGENTS.md - Kali Linux VM Pentesting System Instructions

- Operating System: Kali Linux VM
- Focus: Security auditing, vulnerability scanning, and safe code review.
- Formatting: Clean terminal ANSI outputs and concise tool summaries.
`,
      },
      {
        path: 'config.json',
        language: 'json',
        content: `{
  "agentName": "ACY Security Agent",
  "activeProfile": "custom",
  "harness": "security-pentester",
  "mcpEnabled": true,
  "skillsEnabled": true
}`,
      },
      {
        path: 'agents/kali-pentester/AGENTS.md',
        language: 'markdown',
        content: `# Kali Security Pentester Persona (agents/kali-pentester/AGENTS.md)

- Focus on security testing, port verification, and code vulnerability checks.
- Maintain defensive posture and provide fix recommendations for detected flaws.
`,
      },
      {
        path: 'skills/port-scanner/SKILLS.md',
        language: 'markdown',
        content: `# Port & Service Inspection Skill (skills/port-scanner/SKILLS.md)

- Inspect open network ports and service versions.
- Summarize findings into structured severity tables.
`,
      },
      {
        path: 'mcp/kali-inspector.json',
        language: 'json',
        content: `{
  "id": "mcp-kali-tools",
  "name": "Kali Security Inspector MCP",
  "type": "stdio",
  "commandOrUrl": "python3 /usr/local/bin/mcp-kali-inspector.py",
  "status": "connected",
  "enabled": true,
  "tools": [
    { "name": "nmap_scan_sim", "description": "Simulate local network port service inspection", "enabled": true },
    { "name": "package_checker", "description": "Inspect installed Kali VM apt/pip dependencies", "enabled": true }
  ]
}`,
      },
    ],
  },
];

