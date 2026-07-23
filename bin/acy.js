#!/usr/bin/env node

import React, { useState, useEffect, useRef } from 'react';
import { render, Text, Box, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Available AI Models & Modes
const AVAILABLE_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
const AGENT_MODES = ['auto', 'plan', 'interactive', 'yolo'];

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
  const [logs, setLogs] = useState([
    { type: 'sys', text: chalk.cyan('Welcome to ACY Hybrids Native Ink CLI / TUI SDK v2.4') },
    { type: 'sys', text: chalk.gray('Connected to Kali Linux host process. Type /help for commands.') }
  ]);
  const [stats, setStats] = useState({ tokens: 0, cost: 0 });
  const [workspaceTree, setWorkspaceTree] = useState([]);

  useEffect(() => {
    setWorkspaceTree(getWorkspaceTree());
  }, []);

  const addLog = (type, text) => {
    setLogs(prev => [...prev.slice(-100), { type, text }]);
  };

  // Command & Query Submission
  const handleSubmit = async (value) => {
    const trimVal = value.trim();
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
          addLog('sys', '  /mode <auto|plan|interactive|yolo> - Set execution mode');
          addLog('sys', '  /agent <name>                      - Switch Agent persona');
          addLog('sys', '  /skills                            - List workspace skills');
          addLog('sys', '  /mcp                               - List MCP servers');
          addLog('sys', '  /model <name>                      - Switch Gemini AI model');
          addLog('sys', '  /exec <cmd>                        - Execute shell command on Kali host');
          addLog('sys', '  /cat <path>                        - Print file contents');
          addLog('sys', '  /clear                             - Clear screen logs');
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
          }
          break;

        case '/model':
          if (AVAILABLE_MODELS.includes(arg)) {
            setSelectedModel(arg);
            addLog('sys', chalk.green(`Model set to: ${arg}`));
          } else {
            addLog('sys', chalk.yellow(`Available models: ${AVAILABLE_MODELS.join(', ')}`));
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

    // Process AI Query
    if (!ai) {
      addLog('sys', chalk.red('Error: GEMINI_API_KEY environment variable is not set.'));
      return;
    }

    try {
      setAgentStatus('thinking');
      addLog('ai', chalk.bold.cyan(`🤖 AI Assistant (${selectedModel}) thinking...`));

      const wsContext = getWorkspaceContext();
      const prompt = `[Mode: ${agentMode.toUpperCase()} | Persona: ${activeAgent}]
Workspace Context:
${wsContext}

User Query:
${trimVal}`;

      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: prompt,
      });

      let responseText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          responseText += chunk.text;
        }
      }

      setAgentStatus('idle');
      responseText.split('\n').forEach(line => {
        addLog('ai', line);
      });

      // Update tokens & cost estimates
      const newTokens = Math.ceil((prompt.length + responseText.length) / 4);
      setStats(prev => ({
        tokens: prev.tokens + newTokens,
        cost: prev.cost + (newTokens * 0.0000003)
      }));

    } catch (err) {
      setAgentStatus('idle');
      addLog('sys', chalk.red(`AI Error: ${err.message}`));
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Top Header Banner */}
      <Box borderStyle="double" borderColor="cyan" flexDirection="column" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold color="yellow">
            HYBRIDS_CLI <Text color="gray">v2.4 (Ink Terminal SDK)</Text>
          </Text>
          <Text color={agentStatus === 'thinking' ? 'yellow' : agentStatus === 'executing' ? 'blue' : 'green'}>
            {agentStatus === 'thinking' ? '⚡ THINKING...' : agentStatus === 'executing' ? '⚙ EXECUTING...' : '● ONLINE'}
          </Text>
        </Box>
        <Box justifyContent="space-between" marginTop={0}>
          <Text>
            <Text color="gray">Model: </Text>
            <Text color="cyan">{selectedModel}</Text>
            <Text color="gray"> | Agent: </Text>
            <Text color="magenta">{activeAgent}</Text>
            <Text color="gray"> | Mode: </Text>
            <Text color="green">{agentMode.toUpperCase()}</Text>
          </Text>
          <Text>
            <Text color="yellow">Cost: ${stats.cost.toFixed(4)}</Text>
            <Text color="gray"> | Tokens: {stats.tokens}</Text>
          </Text>
        </Box>
      </Box>

      {/* Main Body Grid */}
      <Box flexDirection="row" marginY={1}>
        {/* Left Box: Workspace Directory Explorer */}
        <Box borderStyle="single" borderColor="gray" flexDirection="column" width={32} paddingX={1}>
          <Text bold color="cyan">📁 Workspace Tree</Text>
          <Text color="gray">───────────────</Text>
          {workspaceTree.map((item, idx) => (
            <Box key={idx} flexDirection="column">
              <Text color={item.isDir ? 'yellow' : 'white'}>
                {item.isDir ? '📂 ' : '📄 '}{item.name}
              </Text>
              {item.isDir && item.children && item.children.map((child, cIdx) => (
                <Box key={cIdx} paddingLeft={2} flexDirection="column">
                  <Text color={child.isDir ? 'yellow' : 'gray'}>
                    {child.isDir ? '📁 ' : '├── '}{child.name}
                  </Text>
                  {child.isDir && child.children && child.children.map((sub, sIdx) => (
                    <Text key={sIdx} color="gray">
                      {'   └── '}{sub.name}
                    </Text>
                  ))}
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        {/* Right Box: Output / Event Log Stream */}
        <Box borderStyle="single" borderColor="blue" flexDirection="column" flexGrow={1} paddingX={1} minHeight={16}>
          <Text bold color="blue">📜 Event Stream & Conversation Log</Text>
          <Text color="gray">─────────────────────────────────────────────────────</Text>
          {logs.slice(-14).map((log, i) => (
            <Text key={i} color={log.type === 'user' ? 'green' : log.type === 'ai' ? 'white' : log.type === 'exec' ? 'cyan' : 'yellow'}>
              {log.text}
            </Text>
          ))}
          {agentStatus === 'thinking' && (
            <Box marginTop={1}>
              <Text color="yellow">
                <Spinner type="dots" /> Generating AI response...
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Bottom Command Prompt Bar */}
      <Box borderStyle="round" borderColor="green" paddingX={1}>
        <Text bold color="green">
          acy-agent [{agentMode.toUpperCase()}:{activeAgent}]&gt;{' '}
        </Text>
        <TextInput
          value={inputVal}
          onChange={setInputVal}
          onSubmit={handleSubmit}
          placeholder="Enter prompt or /help..."
        />
      </Box>
    </Box>
  );
};

// Check if running directly
const isDirectRun = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('acy.js');

if (isDirectRun || process.env.INK_RUN) {
  render(<AcyTuiApp />);
}

export default AcyTuiApp;
