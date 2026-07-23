#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load .env if present
dotenv.config();

// ANSI Styling & Color Codes for Kali / tmux Terminal
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  // Colors
  cyan: '\x1b[36m',
  emerald: '\x1b[32m',
  amber: '\x1b[33m',
  sky: '\x1b[38;5;39m',
  purple: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  brightWhite: '\x1b[97m',
  
  // Bold Colors
  boldCyan: '\x1b[1;36m',
  boldGreen: '\x1b[1;32m',
  boldAmber: '\x1b[1;33m',
  boldPurple: '\x1b[1;35m',
  boldWhite: '\x1b[1;97m',
  
  // Backgrounds
  bgDark: '\x1b[40m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
};

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Active State
let activeAgent = 'General Assistant';
let selectedModel = 'gemini-3.6-flash';
let systemPrompt = 'You are ACY Hybrids Agent CLI running natively in Kali Linux terminal.';
const history = [];

// Available Models
const AVAILABLE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

// Helper: Scan Workspace Stats
function getWorkspaceStats() {
  const root = process.cwd();
  let agentCount = 0;
  let skillCount = 0;
  let mcpCount = 0;
  let hasAgentsMd = false;

  const agentsDir = path.join(root, 'agents');
  if (fs.existsSync(agentsDir)) {
    agentCount = fs.readdirSync(agentsDir).filter(f => !f.startsWith('.')).length;
  }

  const skillsDir = path.join(root, 'skills');
  if (fs.existsSync(skillsDir)) {
    skillCount = fs.readdirSync(skillsDir).filter(f => !f.startsWith('.')).length;
  }

  const mcpDir = path.join(root, 'mcp');
  if (fs.existsSync(mcpDir)) {
    mcpCount = fs.readdirSync(mcpDir).filter(f => !f.startsWith('.')).length;
  } else {
    const mcpsDir = path.join(root, 'mcps');
    if (fs.existsSync(mcpsDir)) {
      mcpCount = fs.readdirSync(mcpsDir).filter(f => !f.startsWith('.')).length;
    }
  }

  if (fs.existsSync(path.join(root, 'AGENTS.md'))) {
    hasAgentsMd = true;
  }

  return { agentCount, skillCount, mcpCount, hasAgentsMd };
}

// Helper: Read Workspace Files Context for AI Prompts
function getWorkspaceContext() {
  const root = process.cwd();
  let context = '';

  // 1. Root AGENTS.md
  const agentsMdPath = path.join(root, 'AGENTS.md');
  if (fs.existsSync(agentsMdPath)) {
    context += `\n--- [AGENTS.md] ---\n${fs.readFileSync(agentsMdPath, 'utf-8')}\n`;
  }

  // 2. agents/ directory
  const agentsDir = path.join(root, 'agents');
  if (fs.existsSync(agentsDir)) {
    const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md') || f.endsWith('.json'));
    context += `\n--- [Active Agents Directory: ${files.length} personas] ---\n` + files.join(', ') + '\n';
  }

  // 3. skills/ directory
  const skillsDir = path.join(root, 'skills');
  if (fs.existsSync(skillsDir)) {
    const files = fs.readdirSync(skillsDir).filter(f => !f.startsWith('.'));
    context += `\n--- [Available Skills: ${files.length} skills] ---\n` + files.join(', ') + '\n';
  }

  // 4. mcp/ directory
  const mcpDir = fs.existsSync(path.join(root, 'mcp')) ? path.join(root, 'mcp') : path.join(root, 'mcps');
  if (fs.existsSync(mcpDir)) {
    const files = fs.readdirSync(mcpDir).filter(f => !f.startsWith('.'));
    context += `\n--- [MCP Server Configs: ${files.length} configs] ---\n` + files.join(', ') + '\n';
  }

  return context;
}

// Print TUI Dashboard Header (Matching Web UI aesthetic)
function printDashboardHeader() {
  console.clear();
  const stats = getWorkspaceStats();

  const width = 80;
  const line = '─'.repeat(width - 2);

  console.log(`${c.cyan}┌${line}┐${c.reset}`);
  console.log(`${c.cyan}│${c.reset}  ${c.boldCyan}ACY HYBRIDS AGENT WORKSPACE${c.reset} ${c.gray}│ Terminal UI (Kali Linux & tmux)${c.reset}${' '.repeat(20)}${c.cyan}│${c.reset}`);
  console.log(`${c.cyan}├${line}┤${c.reset}`);
  
  // Status Bar
  const statusBadge = apiKey
    ? `${c.emerald}● ONLINE (API Active)${c.reset}`
    : `${c.red}● OFFLINE (Missing GEMINI_API_KEY)${c.reset}`;
  
  console.log(`${c.cyan}│${c.reset}  Status: ${statusBadge}   ${c.gray}Model:${c.reset} ${c.sky}${selectedModel}${c.reset}   ${c.gray}Agent:${c.reset} ${c.amber}${activeAgent}${c.reset}`);
  
  // Workspace Stats Bar
  console.log(`${c.cyan}│${c.reset}  ${c.purple}🤖 Agents:${c.reset} ${c.boldWhite}${stats.agentCount}${c.reset}  ${c.gray}|${c.reset}  ${c.sky}⚡ Skills:${c.reset} ${c.boldWhite}${stats.skillCount}${c.reset}  ${c.gray}|${c.reset}  ${c.amber}🔌 MCP Servers:${c.reset} ${c.boldWhite}${stats.mcpCount}${c.reset}  ${c.gray}|${c.reset}  ${c.emerald}📄 AGENTS.md:${c.reset} ${stats.hasAgentsMd ? c.emerald + 'Present' + c.reset : c.gray + 'None' + c.reset}`);
  console.log(`${c.cyan}└${line}┘${c.reset}\n`);

  console.log(`${c.gray}  Type ${c.boldCyan}/help${c.reset}${c.gray} for command palette or enter your prompt below.${c.reset}\n`);
}

// Help Menu
function showHelp() {
  console.log(`
${c.boldCyan}╭─── 🧰 ACY Agent Terminal Command Palette ─────────────────────────────╮${c.reset}
  ${c.emerald}/agents${c.reset}        - List agent persona files in ${c.sky}agents/${c.reset}
  ${c.emerald}/agent <name>${c.reset}  - Switch active agent persona
  ${c.emerald}/skills${c.reset}        - List available skills in ${c.sky}skills/${c.reset}
  ${c.emerald}/mcp${c.reset}           - List MCP server configurations in ${c.sky}mcp/${c.reset}
  ${c.emerald}/models${c.reset}        - List & select Gemini AI models
  ${c.emerald}/model <name>${c.reset}  - Change AI model (e.g. gemini-3.6-flash, gemini-2.5-pro)
  ${c.emerald}/files${c.reset}         - Inspect workspace files (${c.sky}AGENTS.md, agents/, skills/, mcp/${c.reset})
  ${c.emerald}/cat <path>${c.reset}    - Display file contents in terminal
  ${c.emerald}/edit <path>${c.reset}   - Open file in Kali editor ($EDITOR or nano/vim)
  ${c.emerald}/exec <cmd>${c.reset}    - Execute shell command on Kali Linux host
  ${c.emerald}/status${c.reset}        - Show current system telemetry & workspace stats
  ${c.emerald}/clear${c.reset}         - Clear screen and redraw TUI workspace dashboard
  ${c.emerald}/exit${c.reset}          - Exit CLI
${c.boldCyan}╰────────────────────────────────────────────────────────────────────────╯${c.reset}
`);
}

// List workspace files
function listFiles() {
  const root = process.cwd();
  console.log(`\n${c.boldCyan}📂 Workspace Agent Directory Structure:${c.reset}`);

  const checkAndList = (targetRel) => {
    const targetAbs = path.join(root, targetRel);
    if (fs.existsSync(targetAbs)) {
      const stat = fs.statSync(targetAbs);
      if (stat.isDirectory()) {
        const items = fs.readdirSync(targetAbs).filter(f => !f.startsWith('.'));
        console.log(`  ${c.sky}📁 ${targetRel}/${c.reset} (${items.length} items):`);
        items.forEach(i => console.log(`     ├── ${targetRel}/${i}`));
      } else {
        console.log(`  ${c.emerald}📄 ${targetRel}${c.reset} (${stat.size} bytes)`);
      }
    } else {
      console.log(`  ${c.gray}❌ ${targetRel} (not found)${c.reset}`);
    }
  };

  ['AGENTS.md', 'DEPLOYMENT_KALI.md', 'config.json', 'mcp_config.json', 'agents', 'skills', 'mcp', 'mcps'].forEach(checkAndList);
  console.log();
}

// Execute Shell Command
function execCommand(cmdStr) {
  console.log(`${c.gray}[Executing in Kali Linux shell]: ${cmdStr}${c.reset}\n`);
  const child = spawn(cmdStr, { shell: true, stdio: 'inherit' });
  return new Promise((resolve) => {
    child.on('close', (code) => {
      console.log(`\n${c.gray}[Command finished with exit code ${code}]${c.reset}\n`);
      resolve();
    });
  });
}

// Main Interactive REPL
async function startRepl() {
  printDashboardHeader();

  const rl = readline.createInterface({
    input: process.stdin, output: process.stdout,
    prompt: `${c.boldCyan}acy-agent [${activeAgent}]> ${c.reset}`,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Slash Commands
    if (input.startsWith('/')) {
      const parts = input.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      switch (cmd) {
        case '/help':
          showHelp();
          break;

        case '/clear':
          printDashboardHeader();
          break;

        case '/status':
          printDashboardHeader();
          break;

        case '/exit':
        case '/quit':
          console.log(`${c.emerald}Goodbye! Exiting ACY Terminal CLI.${c.reset}`);
          process.exit(0);
          break;

        case '/files':
        case '/ls':
          listFiles();
          break;

        case '/models':
          console.log(`\n${c.boldCyan}🤖 Available Gemini AI Models:${c.reset}`);
          AVAILABLE_MODELS.forEach(m => {
            const isSelected = m === selectedModel;
            console.log(`  ${isSelected ? c.emerald + '● ' + m + ' (Active)' + c.reset : c.gray + '○ ' + m + c.reset}`);
          });
          console.log(`${c.gray}Use /model <name> to switch models.${c.reset}\n`);
          break;

        case '/model':
          if (!arg) {
            console.log(`${c.amber}Current Model: ${selectedModel}${c.reset}`);
          } else {
            selectedModel = arg;
            console.log(`${c.emerald}Switched active AI model to: ${selectedModel}${c.reset}`);
          }
          break;

        case '/agents': {
          const dir = path.join(process.cwd(), 'agents');
          if (fs.existsSync(dir)) {
            console.log(`\n${c.boldCyan}🤖 Registered Agent Personas (agents/):${c.reset}`);
            fs.readdirSync(dir).filter(f => !f.startsWith('.')).forEach(f => console.log(`  ├── ${c.purple}${f}${c.reset}`));
          } else {
            console.log(`${c.amber}No agents/ directory found.${c.reset}`);
          }
          console.log();
          break;
        }

        case '/agent': {
          if (!arg) {
            console.log(`${c.amber}Current Agent Persona: ${activeAgent}${c.reset}`);
          } else {
            activeAgent = arg;
            rl.setPrompt(`${c.boldCyan}acy-agent [${activeAgent}]> ${c.reset}`);
            console.log(`${c.emerald}Switched active agent persona to: ${activeAgent}${c.reset}`);
          }
          break;
        }

        case '/skills': {
          const dir = path.join(process.cwd(), 'skills');
          if (fs.existsSync(dir)) {
            console.log(`\n${c.boldCyan}⚡ Installed Skills (skills/):${c.reset}`);
            fs.readdirSync(dir).filter(f => !f.startsWith('.')).forEach(f => console.log(`  ├── ${c.sky}${f}${c.reset}`));
          } else {
            console.log(`${c.amber}No skills/ directory found.${c.reset}`);
          }
          console.log();
          break;
        }

        case '/mcp': {
          const dir = fs.existsSync(path.join(process.cwd(), 'mcp')) ? path.join(process.cwd(), 'mcp') : path.join(process.cwd(), 'mcps');
          if (fs.existsSync(dir)) {
            console.log(`\n${c.boldCyan}🔌 MCP Server Integrations:${c.reset}`);
            fs.readdirSync(dir).filter(f => !f.startsWith('.')).forEach(f => console.log(`  ├── ${c.amber}${f}${c.reset}`));
          } else {
            console.log(`${c.amber}No mcp/ directory found.${c.reset}`);
          }
          console.log();
          break;
        }

        case '/cat': {
          if (!arg) {
            console.log(`${c.amber}Usage: /cat <filename>${c.reset}`);
          } else {
            const filePath = path.join(process.cwd(), arg);
            if (fs.existsSync(filePath)) {
              console.log(`\n${c.boldCyan}┌── [📄 ${arg}] ───────────────────────────────────────────────┐${c.reset}`);
              console.log(fs.readFileSync(filePath, 'utf-8'));
              console.log(`${c.boldCyan}└───────────────────────────────────────────────────────────────┘${c.reset}\n`);
            } else {
              console.log(`${c.red}File not found: ${arg}${c.reset}`);
            }
          }
          break;
        }

        case '/edit': {
          if (!arg) {
            console.log(`${c.amber}Usage: /edit <filename>${c.reset}`);
          } else {
            const editor = process.env.EDITOR || 'nano';
            await execCommand(`${editor} "${arg}"`);
          }
          break;
        }

        case '/exec': {
          if (!arg) {
            console.log(`${c.amber}Usage: /exec <shell command>${c.reset}`);
          } else {
            await execCommand(arg);
          }
          break;
        }

        default:
          console.log(`${c.red}Unknown command: ${cmd}. Type /help for guidance.${c.reset}`);
          break;
      }

      rl.prompt();
      return;
    }

    // AI Query Handling
    if (!ai) {
      console.log(`\n${c.red}Error: GEMINI_API_KEY environment variable is not set.${c.reset}`);
      console.log(`${c.amber}Please set GEMINI_API_KEY in your .env file or run: export GEMINI_API_KEY="your_key"${c.reset}\n`);
      rl.prompt();
      return;
    }

    try {
      console.log(`\n${c.boldCyan}┌── [🤖 AI Response: ${selectedModel} | Agent: ${activeAgent}] ──┐${c.reset}`);

      const wsContext = getWorkspaceContext();
      const prompt = `[System Instructions / Persona: ${activeAgent}]
${systemPrompt}

Workspace Files & Specs:
${wsContext}

User Query:
${input}`;

      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: prompt,
      });

      process.stdout.write(`${c.white}`);
      for await (const chunk of responseStream) {
        if (chunk.text) {
          process.stdout.write(chunk.text);
        }
      }
      process.stdout.write(`${c.reset}\n`);
      console.log(`${c.boldCyan}└────────────────────────────────────────────────────────────────────────┘${c.reset}\n`);

      history.push({ role: 'user', content: input });
    } catch (err) {
      console.log(`\n${c.red}Error generating AI response: ${err.message}${c.reset}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${c.emerald}ACY Terminal CLI session closed.${c.reset}`);
    process.exit(0);
  });
}

// Single Prompt Execution if arguments provided directly
const args = process.argv.slice(2);
if (args.length > 0) {
  const query = args.join(' ');
  if (!ai) {
    console.error('GEMINI_API_KEY missing in environment.');
    process.exit(1);
  }

  const wsContext = getWorkspaceContext();
  const prompt = `[System Instructions]
${systemPrompt}

Workspace Context:
${wsContext}

Query: ${query}`;

  try {
    const res = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
    });
    console.log(res.text);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
} else {
  startRepl();
}
