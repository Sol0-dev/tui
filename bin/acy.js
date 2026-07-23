#!/usr/bin/env node

import React, { useState, useEffect } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const h = React.createElement;

// Predefined Commands for Slash Popup
const COMMAND_LIST = [
  { cmd: '/agent', desc: 'Switch or load an autonomous agent persona' },
  { cmd: '/skills', desc: 'Manage or inspect enabled skills' },
  { cmd: '/mcp', desc: 'Configure Model Context Protocol servers' },
  { cmd: '/model', desc: 'Select active model (Gemini, Claude, GPT-4, Llama 3, DeepSeek)' },
  { cmd: '/key', desc: 'Set or update API keys (OpenRouter, Gemini, OpenAI, Anthropic)' },
  { cmd: '/exec', desc: 'Execute a native shell command directly on Kali Bash' },
  { cmd: '/cat', desc: 'Read file contents inside the workspace' },
  { cmd: '/clear', desc: 'Clear the terminal event stream' },
  { cmd: '/exit', desc: 'Exit the CLI' },
];

const MODEL_OPTIONS = [
  { label: 'gemini-3.6-flash (Google GenAI)', value: 'gemini-3.6-flash', provider: 'gemini' },
  { label: 'gemini-2.5-flash (Google GenAI)', value: 'gemini-2.5-flash', provider: 'gemini' },
  { label: 'gemini-2.5-pro (Google GenAI)', value: 'gemini-2.5-pro', provider: 'gemini' },
  { label: 'anthropic/claude-3.5-sonnet (OpenRouter)', value: 'anthropic/claude-3.5-sonnet', provider: 'openrouter' },
  { label: 'deepseek/deepseek-r1 (OpenRouter)', value: 'deepseek/deepseek-r1', provider: 'openrouter' },
  { label: 'openai/gpt-4o (OpenRouter)', value: 'openai/gpt-4o', provider: 'openrouter' },
  { label: 'meta-llama/llama-3.3-70b-instruct (OpenRouter)', value: 'meta-llama/llama-3.3-70b-instruct', provider: 'openrouter' },
  { label: 'google/gemini-2.5-pro (OpenRouter)', value: 'google/gemini-2.5-pro', provider: 'openrouter' },
];

const AGENT_MODES = ['auto', 'plan', 'interactive', 'yolo'];

// Helper to save API keys to .env and ~/.acy/config.json
function saveApiKey(provider, key) {
  const envKey = `${provider.toUpperCase()}_API_KEY`;
  process.env[envKey] = key;

  // 1. Write to local .env
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  const keyRegex = new RegExp(`^${envKey}=.*`, 'm');
  if (keyRegex.test(envContent)) {
    envContent = envContent.replace(keyRegex, `${envKey}=${key}`);
  } else {
    envContent += `\n${envKey}=${key}\n`;
  }
  fs.writeFileSync(envPath, envContent.trim() + '\n');

  // 2. Write to ~/.acy/config.json
  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/root';
    const acyDir = path.join(homeDir, '.acy');
    if (!fs.existsSync(acyDir)) fs.mkdirSync(acyDir, { recursive: true });
    const configPath = path.join(acyDir, 'config.json');
    let configData = {};
    if (fs.existsSync(configPath)) {
      try { configData = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch (e) {}
    }
    configData[envKey] = key;
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
  } catch (e) {}
}

function getApiKey(provider) {
  const envKey = `${provider.toUpperCase()}_API_KEY`;
  if (process.env[envKey]) return process.env[envKey];

  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '/root';
    const configPath = path.join(homeDir, '.acy', 'config.json');
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (configData[envKey]) {
        process.env[envKey] = configData[envKey];
        return configData[envKey];
      }
    }
  } catch (e) {}

  return null;
}

// Helper to scan directory tree for workspace focus
function getWorkspaceTree(rootDir = process.cwd()) {
  const tree = [];
  const focusTargets = ['AGENTS.md', 'SETUP.md', 'DEPLOYMENT_KALI.md', 'agents', 'skills', 'mcp', 'mcps'];

  focusTargets.forEach(target => {
    const fullPath = path.join(rootDir, target);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const children = fs.readdirSync(fullPath).filter(f => !f.startsWith('.'));
        tree.push({
          name: target,
          isDir: true,
          children: children.map(c => {
            const childPath = path.join(fullPath, c);
            const childStat = fs.statSync(childPath);
            if (childStat.isDirectory()) {
              const subChildren = fs.readdirSync(childPath).filter(f => !f.startsWith('.'));
              return { name: c, isDir: true, children: subChildren.map(s => ({ name: s, isDir: false })) };
            }
            return { name: c, isDir: false };
          })
        });
      } else {
        tree.push({ name: target, isDir: false, size: stat.size });
      }
    }
  });

  return tree;
}

// Read Workspace Specs for System Prompt Context
function getWorkspaceContext(rootDir = process.cwd()) {
  let context = '';
  ['AGENTS.md', 'SETUP.md'].forEach(f => {
    const fp = path.join(rootDir, f);
    if (fs.existsSync(fp)) {
      context += `\n--- [${f}] ---\n${fs.readFileSync(fp, 'utf-8')}\n`;
    }
  });

  const readSubdir = (dirName) => {
    const dp = path.join(rootDir, dirName);
    if (fs.existsSync(dp)) {
      const items = fs.readdirSync(dp).filter(i => !i.startsWith('.'));
      context += `\n--- [Directory: ${dirName}/ (${items.length} items)] ---\n` + items.join(', ') + '\n';
    }
  };

  ['agents', 'skills', 'mcp', 'mcps'].forEach(readSubdir);
  return context;
}

// Main Ink TUI App Component
const AcyTuiApp = () => {
  const { exit } = useApp();

  // State
  const [activeAgent, setActiveAgent] = useState('Lead Architect');
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [agentMode, setAgentMode] = useState('auto');
  const [agentStatus, setAgentStatus] = useState('idle'); // 'idle' | 'thinking' | 'executing'
  const [inputVal, setInputVal] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [isModelSelectMode, setIsModelSelectMode] = useState(false);
  const [logs, setLogs] = useState([
    { type: 'sys', text: chalk.cyan('Welcome to ACY Hybrids Native Ink CLI / TUI SDK v2.5') },
    { type: 'sys', text: chalk.gray('Connected to Kali Linux host process. Type / for instant command suggestions.') }
  ]);
  const [stats, setStats] = useState({ tokens: 0, cost: 0 });
  const [workspaceTree, setWorkspaceTree] = useState([]);

  useEffect(() => {
    setWorkspaceTree(getWorkspaceTree());
  }, []);

  // Calculate command suggestions
  const isTypingCmd = inputVal.startsWith('/') && !inputVal.includes(' ');
  const typedWord = isTypingCmd ? inputVal : '';
  const filteredCmds = isTypingCmd
    ? COMMAND_LIST.filter(c => c.cmd.toLowerCase().startsWith(typedWord.toLowerCase()))
    : [];
  const showSuggestions = isTypingCmd && filteredCmds.length > 0;

  // Reset suggestion index when suggestions list changes
  useEffect(() => {
    setSuggestionIndex(0);
  }, [inputVal]);

  // Handle keyboard arrow navigation for slash command popup
  useInput((input, key) => {
    if (showSuggestions) {
      if (key.upArrow) {
        setSuggestionIndex(prev => (prev > 0 ? prev - 1 : filteredCmds.length - 1));
      } else if (key.downArrow) {
        setSuggestionIndex(prev => (prev < filteredCmds.length - 1 ? prev + 1 : 0));
      } else if (key.tab) {
        const sel = filteredCmds[suggestionIndex];
        if (sel) {
          setInputVal(sel.cmd + ' ');
        }
      }
    }
  });

  const addLog = (type, text) => {
    setLogs(prev => [...prev.slice(-100), { type, text }]);
  };

  // Command & Query Submission
  const handleSubmit = async (value) => {
    let trimVal = value.trim();

    // If suggestions are active and user pressed Enter on a partial command, complete it
    if (showSuggestions && filteredCmds.length > 0 && !filteredCmds.some(c => c.cmd === trimVal)) {
      const sel = filteredCmds[suggestionIndex] || filteredCmds[0];
      if (sel) {
        trimVal = sel.cmd;
      }
    }

    setInputVal('');
    if (!trimVal) return;

    addLog('user', chalk.bold.green(`acy-agent [${agentMode.toUpperCase()}:${activeAgent}]> `) + trimVal);

    if (trimVal.startsWith('/')) {
      const parts = trimVal.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      switch (cmd) {
        case '/help':
          addLog('sys', chalk.bold.cyan('╭── ACY Command Palette ──────────────────────────────╮'));
          addLog('sys', '  /agent <name>                      - Switch or load Agent persona');
          addLog('sys', '  /skills                            - List or inspect workspace skills');
          addLog('sys', '  /mcp                               - List MCP server integrations');
          addLog('sys', '  /model [name]                      - Select active model (Gemini/OpenRouter)');
          addLog('sys', '  /key [provider] [key]              - Set or view API keys (OpenRouter/Gemini)');
          addLog('sys', '  /mode <auto|plan|interactive|yolo> - Set execution mode');
          addLog('sys', '  /exec <cmd>                        - Execute shell command on Kali host');
          addLog('sys', '  /cat <path>                        - Print file contents');
          addLog('sys', '  /clear                             - Clear terminal event stream');
          addLog('sys', '  /exit                              - Exit CLI SDK');
          addLog('sys', chalk.bold.cyan('╰─────────────────────────────────────────────────────╯'));
          break;

        case '/exit':
        case '/quit':
          addLog('sys', chalk.yellow('Exiting ACY Native CLI...'));
          setTimeout(() => exit(), 300);
          break;

        case '/clear':
          setLogs([]);
          break;

        case '/key':
          if (!arg) {
            addLog('sys', chalk.bold.yellow('╭── API Key Statuses ───────────────────────────────╮'));
            const gemKey = getApiKey('GEMINI');
            const orKey = getApiKey('OPENROUTER');
            const oaKey = getApiKey('OPENAI');
            const antKey = getApiKey('ANTHROPIC');
            addLog('sys', `  GEMINI_API_KEY:     ${gemKey ? chalk.green('✓ SET (' + gemKey.slice(0, 6) + '...)') : chalk.red('✗ NOT SET')}`);
            addLog('sys', `  OPENROUTER_API_KEY: ${orKey ? chalk.green('✓ SET (' + orKey.slice(0, 6) + '...)') : chalk.red('✗ NOT SET')}`);
            addLog('sys', `  OPENAI_API_KEY:     ${oaKey ? chalk.green('✓ SET (' + oaKey.slice(0, 6) + '...)') : chalk.red('✗ NOT SET')}`);
            addLog('sys', `  ANTHROPIC_API_KEY:  ${antKey ? chalk.green('✓ SET (' + antKey.slice(0, 6) + '...)') : chalk.red('✗ NOT SET')}`);
            addLog('sys', chalk.gray('  Set a key with: /key <provider> <YOUR_KEY> (e.g. /key openrouter sk-or-...)'));
            addLog('sys', chalk.bold.yellow('╰───────────────────────────────────────────────────╯'));
          } else {
            const keyParts = arg.split(' ');
            const provider = keyParts[0].toLowerCase();
            const keyValue = keyParts.slice(1).join(' ').trim();
            if (!keyValue) {
              addLog('sys', chalk.yellow(`Usage: /key ${provider} <YOUR_API_KEY>`));
            } else {
              saveApiKey(provider, keyValue);
              addLog('sys', chalk.green(`✓ Saved ${provider.toUpperCase()}_API_KEY to .env and ~/.acy/config.json`));
            }
          }
          break;

        case '/model':
          if (!arg) {
            setIsModelSelectMode(true);
            addLog('sys', chalk.yellow('Use Arrow keys & Enter to select a model below:'));
          } else {
            setSelectedModel(arg);
            addLog('sys', chalk.green(`Model set to: ${arg}`));
          }
          break;

        case '/mode':
          if (AGENT_MODES.includes(arg.toLowerCase())) {
            setAgentMode(arg.toLowerCase());
            addLog('sys', chalk.green(`Agent Mode set to: ${arg.toUpperCase()}`));
          } else {
            addLog('sys', chalk.red(`Invalid mode. Use: ${AGENT_MODES.join(', ')}`));
          }
          break;

        case '/agent':
          if (arg) {
            setActiveAgent(arg);
            addLog('sys', chalk.green(`Active Agent persona set to: ${arg}`));
          } else {
            addLog('sys', chalk.yellow(`Current Agent persona: ${activeAgent}`));
            const agentsDir = path.join(process.cwd(), 'agents');
            if (fs.existsSync(agentsDir)) {
              addLog('sys', chalk.cyan('Available Agents:'));
              fs.readdirSync(agentsDir).forEach(a => addLog('sys', `  🤖 ${a}`));
            }
          }
          break;

        case '/exec':
          if (!arg) {
            addLog('sys', chalk.yellow('Usage: /exec <shell command>'));
            return;
          }
          addLog('sys', chalk.gray(`[Executing on Kali Host]: ${arg}`));
          setAgentStatus('executing');

          const proc = spawn(arg, { shell: true });

          proc.stdout.on('data', (data) => {
            data.toString().split('\n').forEach(line => {
              if (line) addLog('exec', chalk.white(`  ${line}`));
            });
          });

          proc.stderr.on('data', (data) => {
            data.toString().split('\n').forEach(line => {
              if (line) addLog('exec', chalk.red(`  ${line}`));
            });
          });

          proc.on('close', (code) => {
            setAgentStatus('idle');
            addLog('sys', chalk.gray(`[Process exited with code ${code}]`));
          });
          break;

        case '/cat':
          if (!arg) {
            addLog('sys', chalk.yellow('Usage: /cat <filepath>'));
          } else {
            const fp = path.join(process.cwd(), arg);
            if (fs.existsSync(fp)) {
              addLog('sys', chalk.cyan(`--- Content of ${arg} ---`));
              const content = fs.readFileSync(fp, 'utf-8');
              content.split('\n').forEach(l => addLog('file', l));
            } else {
              addLog('sys', chalk.red(`File not found: ${arg}`));
            }
          }
          break;

        case '/skills':
          const skillsDir = path.join(process.cwd(), 'skills');
          if (fs.existsSync(skillsDir)) {
            addLog('sys', chalk.cyan('Installed Skills:'));
            fs.readdirSync(skillsDir).forEach(s => addLog('sys', `  ⚡ ${s}`));
          } else {
            addLog('sys', chalk.yellow('No skills/ directory found.'));
          }
          break;

        case '/mcp':
          const mcpDir = fs.existsSync(path.join(process.cwd(), 'mcp')) ? path.join(process.cwd(), 'mcp') : path.join(process.cwd(), 'mcps');
          if (fs.existsSync(mcpDir)) {
            addLog('sys', chalk.yellow('MCP Integrations:'));
            fs.readdirSync(mcpDir).forEach(m => addLog('sys', `  🔌 ${m}`));
          } else {
            addLog('sys', chalk.yellow('No mcp/ directory found.'));
          }
          break;

        default:
          addLog('sys', chalk.red(`Unknown command: ${cmd}. Type /help for options.`));
          break;
      }
      return;
    }

    // Process AI Query (Multi-Provider Routing)
    const wsContext = getWorkspaceContext();
    const promptText = `[Mode: ${agentMode.toUpperCase()} | Persona: ${activeAgent}]
Workspace Context:
${wsContext}

User Query:
${trimVal}`;

    const isOpenRouterModel = selectedModel.includes('/') || selectedModel.startsWith('anthropic') || selectedModel.startsWith('deepseek') || selectedModel.startsWith('openai') || selectedModel.startsWith('meta-llama');

    if (isOpenRouterModel) {
      const openRouterKey = getApiKey('OPENROUTER');
      if (!openRouterKey) {
        addLog('sys', chalk.red(`Error: OPENROUTER_API_KEY is not set for model '${selectedModel}'.`));
        addLog('sys', chalk.yellow('Configure it using: /key openrouter <YOUR_OPENROUTER_KEY>'));
        return;
      }

      try {
        setAgentStatus('thinking');
        addLog('ai', chalk.bold.cyan(`🤖 OpenRouter AI (${selectedModel}) thinking...`));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://acy-hybrids.local',
            'X-Title': 'ACY Hybrids CLI',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: `[Mode: ${agentMode.toUpperCase()} | Persona: ${activeAgent}]\n${wsContext}` },
              { role: 'user', content: trimVal }
            ],
            stream: true
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error ${response.status}: ${errText}`);
        }

        let responseText = '';
        if (response.body && typeof response.body.getReader === 'function') {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(dataStr);
                  const chunk = parsed.choices?.[0]?.delta?.content || '';
                  responseText += chunk;
                } catch (e) {}
              }
            }
          }
        } else {
          const data = await response.json();
          responseText = data.choices?.[0]?.message?.content || '';
        }

        setAgentStatus('idle');
        responseText.split('\n').forEach(line => addLog('ai', line));

        const newTokens = Math.ceil((promptText.length + responseText.length) / 4);
        setStats(prev => ({
          tokens: prev.tokens + newTokens,
          cost: prev.cost + (newTokens * 0.0000005)
        }));

      } catch (err) {
        setAgentStatus('idle');
        addLog('sys', chalk.red(`OpenRouter Error: ${err.message}`));
      }

    } else {
      // Native Google Gemini Model
      const geminiKey = getApiKey('GEMINI');
      if (!geminiKey) {
        addLog('sys', chalk.red(`Error: GEMINI_API_KEY is not set for model '${selectedModel}'.`));
        addLog('sys', chalk.yellow('Configure it using: /key gemini <YOUR_GEMINI_KEY>'));
        return;
      }

      try {
        setAgentStatus('thinking');
        addLog('ai', chalk.bold.cyan(`🤖 Google Gemini (${selectedModel}) thinking...`));

        const aiInstance = new GoogleGenAI({ apiKey: geminiKey });
        const responseStream = await aiInstance.models.generateContentStream({
          model: selectedModel,
          contents: promptText,
        });

        let responseText = '';
        for await (const chunk of responseStream) {
          if (chunk.text) {
            responseText += chunk.text;
          }
        }

        setAgentStatus('idle');
        responseText.split('\n').forEach(line => addLog('ai', line));

        const newTokens = Math.ceil((promptText.length + responseText.length) / 4);
        setStats(prev => ({
          tokens: prev.tokens + newTokens,
          cost: prev.cost + (newTokens * 0.0000003)
        }));

      } catch (err) {
        setAgentStatus('idle');
        addLog('sys', chalk.red(`Gemini Error: ${err.message}`));
      }
    }
  };

  return h(Box, { flexDirection: 'column', padding: 1 },
    // Top Header Banner
    h(Box, { borderStyle: 'double', borderColor: 'cyan', flexDirection: 'column', paddingX: 1 },
      h(Box, { justifyContent: 'space-between' },
        h(Text, { bold: true, color: 'yellow' },
          'HYBRIDS_CLI ',
          h(Text, { color: 'gray' }, 'v2.5 (Ink Multi-Model SDK)')
        ),
        h(Text, { color: agentStatus === 'thinking' ? 'yellow' : agentStatus === 'executing' ? 'blue' : 'green' },
          agentStatus === 'thinking' ? '⚡ THINKING...' : agentStatus === 'executing' ? '⚙ EXECUTING...' : '● ONLINE'
        )
      ),
      h(Box, { justifyContent: 'space-between', marginTop: 0 },
        h(Text, null,
          h(Text, { color: 'gray' }, 'Model: '),
          h(Text, { color: 'cyan' }, selectedModel),
          h(Text, { color: 'gray' }, ' | Agent: '),
          h(Text, { color: 'magenta' }, activeAgent),
          h(Text, { color: 'gray' }, ' | Mode: '),
          h(Text, { color: 'green' }, agentMode.toUpperCase())
        ),
        h(Text, null,
          h(Text, { color: 'yellow' }, `Cost: $${stats.cost.toFixed(4)}`),
          h(Text, { color: 'gray' }, ` | Tokens: ${stats.tokens}`)
        )
      )
    ),

    // Main Body Grid
    h(Box, { flexDirection: 'row', marginY: 1 },
      // Left Box: Workspace Directory Explorer
      h(Box, { borderStyle: 'single', borderColor: 'gray', flexDirection: 'column', width: 32, paddingX: 1 },
        h(Text, { bold: true, color: 'cyan' }, '📁 Workspace Tree'),
        h(Text, { color: 'gray' }, '───────────────'),
        workspaceTree.map((item, idx) =>
          h(Box, { key: idx, flexDirection: 'column' },
            h(Text, { color: item.isDir ? 'yellow' : 'white' },
              (item.isDir ? '📂 ' : '📄 ') + item.name
            ),
            item.isDir && item.children && item.children.map((child, cIdx) =>
              h(Box, { key: cIdx, paddingLeft: 2, flexDirection: 'column' },
                h(Text, { color: child.isDir ? 'yellow' : 'gray' },
                  (child.isDir ? '📁 ' : '├── ') + child.name
                ),
                child.isDir && child.children && child.children.map((sub, sIdx) =>
                  h(Text, { key: sIdx, color: 'gray' },
                    '   └── ' + sub.name
                  )
                )
              )
            )
          )
        )
      ),

      // Right Box: Output / Event Log Stream
      h(Box, { borderStyle: 'single', borderColor: 'blue', flexDirection: 'column', flexGrow: 1, paddingX: 1, minHeight: 16 },
        h(Text, { bold: true, color: 'blue' }, '📜 Event Stream & Conversation Log'),
        h(Text, { color: 'gray' }, '─────────────────────────────────────────────────────'),
        logs.slice(-14).map((log, i) =>
          h(Text, { key: i, color: log.type === 'user' ? 'green' : log.type === 'ai' ? 'white' : log.type === 'exec' ? 'cyan' : 'yellow' },
            log.text
          )
        ),
        agentStatus === 'thinking' && h(Box, { marginTop: 1 },
          h(Text, { color: 'yellow' },
            h(Spinner, { type: 'dots' }),
            ' Generating AI response...'
          )
        )
      )
    ),

    // Interactive Model Select Mode Component (if active)
    isModelSelectMode && h(Box, { borderStyle: 'round', borderColor: 'yellow', flexDirection: 'column', paddingX: 1, marginY: 1 },
      h(Text, { bold: true, color: 'yellow' }, '🎯 Select AI Model:'),
      h(SelectInput, {
        items: MODEL_OPTIONS,
        onSelect: (item) => {
          setSelectedModel(item.value);
          setIsModelSelectMode(false);
          addLog('sys', chalk.green(`Active model switched to: ${item.value}`));
        }
      })
    ),

    // Dynamic Slash Command Suggestion Popup Box (above prompt)
    showSuggestions && h(Box, { borderStyle: 'round', borderColor: 'cyan', flexDirection: 'column', paddingX: 1 },
      h(Text, { bold: true, color: 'cyan' }, '💡 Available Commands (Tab to autocomplete, Up/Down to navigate):'),
      filteredCmds.map((cmdObj, idx) => {
        const isSelected = idx === suggestionIndex;
        return h(Box, { key: idx },
          h(Text, { color: isSelected ? 'yellow' : 'white', bold: isSelected },
            isSelected ? '▶ ' : '  ',
            cmdObj.cmd,
            ' '
          ),
          h(Text, { color: 'gray' }, `- ${cmdObj.desc}`)
        );
      })
    ),

    // Bottom Command Prompt Bar
    h(Box, { borderStyle: 'round', borderColor: 'green', paddingX: 1 },
      h(Text, { bold: true, color: 'green' }, `acy-agent [${agentMode.toUpperCase()}:${activeAgent}]> `),
      h(TextInput, {
        value: inputVal,
        onChange: setInputVal,
        onSubmit: handleSubmit,
        placeholder: 'Enter prompt or / for command list...'
      })
    )
  );
};

// Check if running directly
const isDirectRun = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('acy.js');

if (isDirectRun || process.env.INK_RUN) {
  render(React.createElement(AcyTuiApp));
}

export default AcyTuiApp;
