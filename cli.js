#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load .env if present
dotenv.config();

// Theme definitions matching the browser TUI
const THEMES = {
  cyberpunk: {
    name: 'Cyberpunk 2077',
    primary: '\x1b[38;5;220m', // Yellow
    accent: '\x1b[38;5;201m',  // Pink/Magenta
    secondary: '\x1b[38;5;51m', // Cyan
    text: '\x1b[97m',
    dim: '\x1b[90m',
    emerald: '\x1b[38;5;48m',
    amber: '\x1b[38;5;214m',
    sky: '\x1b[38;5;39m',
    purple: '\x1b[38;5;141m',
    red: '\x1b[38;5;196m',
    border: '\x1b[38;5;220m',
  },
  matrix: {
    name: 'Matrix Code',
    primary: '\x1b[38;5;46m',  // Neon Green
    accent: '\x1b[38;5;82m',   // Bright Lime
    secondary: '\x1b[38;5;29m', // Dark Green
    text: '\x1b[97m',
    dim: '\x1b[90m',
    emerald: '\x1b[38;5;46m',
    amber: '\x1b[38;5;226m',
    sky: '\x1b[38;5;51m',
    purple: '\x1b[38;5;135m',
    red: '\x1b[38;5;196m',
    border: '\x1b[38;5;46m',
  },
  dracula: {
    name: 'Dracula Dark',
    primary: '\x1b[38;5;141m', // Purple
    accent: '\x1b[38;5;212m',  // Pink
    secondary: '\x1b[38;5;84m', // Green
    text: '\x1b[97m',
    dim: '\x1b[90m',
    emerald: '\x1b[38;5;84m',
    amber: '\x1b[38;5;215m',
    sky: '\x1b[38;5;117m',
    purple: '\x1b[38;5;141m',
    red: '\x1b[38;5;203m',
    border: '\x1b[38;5;141m',
  },
  nord: {
    name: 'Nord Frost',
    primary: '\x1b[38;5;111m', // Frost Blue
    accent: '\x1b[38;5;117m',  // Cyan Blue
    secondary: '\x1b[38;5;150m',// Nord Green
    text: '\x1b[97m',
    dim: '\x1b[90m',
    emerald: '\x1b[38;5;150m',
    amber: '\x1b[38;5;222m',
    sky: '\x1b[38;5;117m',
    purple: '\x1b[38;5;139m',
    red: '\x1b[38;5;174m',
    border: '\x1b[38;5;111m',
  }
};

let currentThemeKey = 'cyberpunk';
let t = THEMES[currentThemeKey];

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
};

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Active State
let activeAgent = 'General Assistant';
let selectedModel = 'gemini-3.6-flash';
let agentMode = 'auto'; // 'auto' | 'plan' | 'interactive' | 'yolo'
let agentStatus = 'idle'; // 'idle' | 'thinking' | 'executing'
let sessionStats = {
  totalCost: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  messageCount: 0,
};

let history = [];
let activeHarnessesCount = 4;

const AVAILABLE_MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
];

const AGENT_MODES = ['auto', 'plan', 'interactive', 'yolo'];

// Helper: Scan Workspace Directories
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

  const mcpDir = fs.existsSync(path.join(root, 'mcp')) ? path.join(root, 'mcp') : path.join(root, 'mcps');
  if (fs.existsSync(mcpDir)) {
    mcpCount = fs.readdirSync(mcpDir).filter(f => !f.startsWith('.')).length;
  }

  if (fs.existsSync(path.join(root, 'AGENTS.md'))) {
    hasAgentsMd = true;
  }

  return { agentCount, skillCount, mcpCount, hasAgentsMd };
}

// Helper: Read Workspace Context
function getWorkspaceContext() {
  const root = process.cwd();
  let context = '';

  const setupMdPath = path.join(root, 'SETUP.md');
  if (fs.existsSync(setupMdPath)) {
    context += `\n--- [SETUP.md] ---\n${fs.readFileSync(setupMdPath, 'utf-8')}\n`;
  }

  const agentsMdPath = path.join(root, 'AGENTS.md');
  if (fs.existsSync(agentsMdPath)) {
    context += `\n--- [AGENTS.md] ---\n${fs.readFileSync(agentsMdPath, 'utf-8')}\n`;
  }

  // Recursive directory reader helper
  const readSubdirFiles = (dirPath, relPrefix = '') => {
    let result = [];
    if (!fs.existsSync(dirPath)) return result;
    const items = fs.readdirSync(dirPath).filter(f => !f.startsWith('.'));
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relPath = path.join(relPrefix, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        result = result.concat(readSubdirFiles(fullPath, relPath));
      } else {
        result.push({ relPath, fullPath });
      }
    }
    return result;
  };

  const agentsDir = path.join(root, 'agents');
  if (fs.existsSync(agentsDir)) {
    const files = readSubdirFiles(agentsDir, 'agents');
    context += `\n--- [Active Agents Directory: ${files.length} persona files] ---\n` + files.map(f => f.relPath).join('\n') + '\n';
  }

  const skillsDir = path.join(root, 'skills');
  if (fs.existsSync(skillsDir)) {
    const files = readSubdirFiles(skillsDir, 'skills');
    context += `\n--- [Available Skills: ${files.length} skill files] ---\n` + files.map(f => f.relPath).join('\n') + '\n';
  }

  const mcpDir = fs.existsSync(path.join(root, 'mcp')) ? path.join(root, 'mcp') : path.join(root, 'mcps');
  if (fs.existsSync(mcpDir)) {
    const files = readSubdirFiles(mcpDir, 'mcp');
    context += `\n--- [MCP Server Configs: ${files.length} configs] ---\n` + files.map(f => f.relPath).join('\n') + '\n';
  }

  return context;
}

// Draw Browser-Identical Header (Matching TuiHeader.tsx)
function renderHeader() {
  console.clear();
  const stats = getWorkspaceStats();
  const width = 88;
  const hLine = '─'.repeat(width - 2);

  // Status Badge
  let statusBadge = '';
  if (agentStatus === 'thinking') {
    statusBadge = `${t.amber}⚡ THINKING...${c.reset}`;
  } else if (agentStatus === 'executing') {
    statusBadge = `${t.sky}⚙ EXECUTING TOOL...${c.reset}`;
  } else {
    statusBadge = `${t.emerald}● READY${c.reset}`;
  }

  // Mode Buttons
  const modeButtons = AGENT_MODES.map(m => {
    if (m === agentMode) {
      return `${t.emerald}\x1b[7m [${m.toUpperCase()}] ${c.reset}`;
    } else {
      return `${t.dim} ${m} ${c.reset}`;
    }
  }).join(' ');

  console.log(`${t.border}╔${'═'.repeat(width - 2)}╗${c.reset}`);
  console.log(`${t.border}║${c.reset}  ${c.bold}${t.primary}HYBRIDS${c.reset}${c.bold}${t.accent}_CLI${c.reset} ${t.dim}v2.4${c.reset}  │  Status: ${statusBadge}  │  Mode: ${modeButtons} ${t.border}║${c.reset}`);
  console.log(`${t.border}╠${'═'.repeat(width - 2)}╣${c.reset}`);
  
  // Model, Provider, Cost & Token Bar
  const tokenStr = `${((sessionStats.totalInputTokens + sessionStats.totalOutputTokens) / 1000).toFixed(1)}k tokens`;
  const costStr = `$${sessionStats.totalCost.toFixed(4)}`;
  console.log(`${t.border}║${c.reset}  ${t.secondary}🤖 Model:${c.reset} ${c.bold}${t.text}${selectedModel}${c.reset} ${t.dim}(Google GenAI)${c.reset}   ${t.emerald}💰 ${costStr}${c.reset} ${t.dim}|${c.reset} ${t.text}${tokenStr}${c.reset} ${t.dim}|${c.reset} ${t.accent}Theme:${c.reset} ${t.name} ${t.border}║${c.reset}`);
  
  // Feature Badges Bar (Matching TuiHeader quick buttons)
  console.log(`${t.border}║${c.reset}  ${t.sky}📜 History: ${sessionStats.messageCount}${c.reset}  ${t.dim}│${c.reset}  ${t.purple}👥 Herder: ${activeHarnessesCount}${c.reset}  ${t.dim}│${c.reset}  ${t.purple}⚡ Skills: ${stats.skillCount}${c.reset}  ${t.dim}│${c.reset}  ${t.amber}🔌 MCP: ${stats.mcpCount}${c.reset}  ${t.dim}│${c.reset}  ${t.emerald}📄 AGENTS.md: ${stats.hasAgentsMd ? 'Present' : 'None'}${c.reset} ${t.border}║${c.reset}`);
  console.log(`${t.border}╚${'═'.repeat(width - 2)}╝${c.reset}\n`);

  // Prompt Command Tip Bar
  console.log(`${t.dim}  Type ${c.bold}${t.primary}/help${c.reset}${t.dim} for slash commands or enter your prompt below.${c.reset}\n`);
}

// Help Command Palette
function showHelp() {
  console.log(`
${t.primary}┌── 🧰 HYBRIDS_CLI Browser-Matching Command Palette ────────────────────┐${c.reset}
  ${t.emerald}/mode <mode>${c.reset}   - Set Agent Mode (${t.dim}auto, plan, interactive, yolo${c.reset})
  ${t.emerald}/agent <name>${c.reset}  - Switch active Agent Persona
  ${t.emerald}/agents${c.reset}        - List agent personas in ${t.sky}agents/${c.reset}
  ${t.emerald}/skills${c.reset}        - List custom skills in ${t.sky}skills/${c.reset}
  ${t.emerald}/mcp${c.reset}           - List MCP server configs in ${t.sky}mcp/${c.reset}
  ${t.emerald}/herder${c.reset}        - View Agent Herder multi-harness status
  ${t.emerald}/model <name>${c.reset}  - Select Gemini AI model (${t.dim}gemini-3.6-flash, etc.${c.reset})
  ${t.emerald}/theme <name>${c.reset}  - Change TUI visual theme (${t.dim}cyberpunk, matrix, dracula, nord${c.reset})
  ${t.emerald}/files${c.reset}         - List workspace agent files
  ${t.emerald}/cat <path>${c.reset}    - Display file contents in styled box
  ${t.emerald}/edit <path>${c.reset}   - Edit file in Kali terminal ($EDITOR)
  ${t.emerald}/exec <cmd>${c.reset}    - Run shell command on Kali host
  ${t.emerald}/cost${c.reset}          - View detailed Token & Cost breakdown
  ${t.emerald}/new${c.reset} or ${t.emerald}/clear${c.reset}- Clear screen and reset session
  ${t.emerald}/exit${c.reset}          - Exit CLI
${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}
`);
}

// List workspace agent files
function listFiles() {
  const root = process.cwd();
  console.log(`\n${t.primary}┌── 📂 Workspace Agent Directory Structure ──────────────────────────────┐${c.reset}`);

  const checkAndList = (targetRel) => {
    const targetAbs = path.join(root, targetRel);
    if (fs.existsSync(targetAbs)) {
      const stat = fs.statSync(targetAbs);
      if (stat.isDirectory()) {
        console.log(`  ${t.sky}📁 ${targetRel}/${c.reset}:`);
        const items = fs.readdirSync(targetAbs).filter(f => !f.startsWith('.'));
        items.forEach(i => {
          const subAbs = path.join(targetAbs, i);
          const subStat = fs.statSync(subAbs);
          if (subStat.isDirectory()) {
            console.log(`     ├── ${t.amber}${i}/${c.reset}`);
            const innerItems = fs.readdirSync(subAbs).filter(f => !f.startsWith('.'));
            innerItems.forEach(inner => {
              console.log(`     │   └── ${targetRel}/${i}/${inner}`);
            });
          } else {
            console.log(`     ├── ${targetRel}/${i}`);
          }
        });
      } else {
        console.log(`  ${t.emerald}📄 ${targetRel}${c.reset} (${stat.size} bytes)`);
      }
    }
  };

  ['AGENTS.md', 'SETUP.md', 'DEPLOYMENT_KALI.md', 'config.json', 'mcp_config.json', 'agents', 'skills', 'mcp', 'mcps'].forEach(checkAndList);
  console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
}

// Shell Command Execution
function execCommand(cmdStr) {
  console.log(`${t.dim}[Executing in Kali shell]: ${cmdStr}${c.reset}\n`);
  const child = spawn(cmdStr, { shell: true, stdio: 'inherit' });
  return new Promise((resolve) => {
    child.on('close', (code) => {
      console.log(`\n${t.dim}[Command exited with code ${code}]${c.reset}\n`);
      resolve();
    });
  });
}

// Interactive REPL Loop
async function startRepl() {
  renderHeader();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.bold}${t.primary}hybrids-cli [${agentMode.toUpperCase()}:${activeAgent}]> ${c.reset}`,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // Slash Command Handling
    if (input.startsWith('/')) {
      const parts = input.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      switch (cmd) {
        case '/help':
          showHelp();
          break;

        case '/clear':
        case '/new':
          renderHeader();
          break;

        case '/exit':
        case '/quit':
          console.log(`${t.emerald}Goodbye! Exiting HYBRIDS_CLI.${c.reset}`);
          process.exit(0);
          break;

        case '/mode':
          if (!arg) {
            console.log(`${t.amber}Current Mode: ${agentMode.toUpperCase()}. Available: auto, plan, interactive, yolo${c.reset}`);
          } else if (AGENT_MODES.includes(arg.toLowerCase())) {
            agentMode = arg.toLowerCase();
            renderHeader();
            console.log(`${t.emerald}Agent Mode set to: ${agentMode.toUpperCase()}${c.reset}`);
          } else {
            console.log(`${t.red}Invalid mode. Choose from: auto, plan, interactive, yolo${c.reset}`);
          }
          break;

        case '/theme':
          if (!arg) {
            console.log(`${t.amber}Available themes: ${Object.keys(THEMES).join(', ')}${c.reset}`);
          } else if (THEMES[arg.toLowerCase()]) {
            currentThemeKey = arg.toLowerCase();
            t = THEMES[currentThemeKey];
            renderHeader();
            console.log(`${t.emerald}Visual Theme set to: ${t.name}${c.reset}`);
          } else {
            console.log(`${t.red}Unknown theme. Choose from: ${Object.keys(THEMES).join(', ')}${c.reset}`);
          }
          break;

        case '/files':
        case '/ls':
          listFiles();
          break;

        case '/model':
          if (!arg) {
            console.log(`${t.amber}Current Model: ${selectedModel}. Available: ${AVAILABLE_MODELS.join(', ')}${c.reset}`);
          } else {
            selectedModel = arg;
            renderHeader();
            console.log(`${t.emerald}AI Model changed to: ${selectedModel}${c.reset}`);
          }
          break;

        case '/agents': {
          const dir = path.join(process.cwd(), 'agents');
          if (fs.existsSync(dir)) {
            console.log(`\n${t.primary}┌── 🤖 Registered Agent Personas (agents/) ─────────────────────────────┐${c.reset}`);
            const listDirContent = (d, prefix = '  ') => {
              fs.readdirSync(d).filter(f => !f.startsWith('.')).forEach(f => {
                const p = path.join(d, f);
                if (fs.statSync(p).isDirectory()) {
                  console.log(`${prefix}📁 ${t.amber}${f}/${c.reset}`);
                  listDirContent(p, prefix + '   ');
                } else {
                  console.log(`${prefix}├── ${t.accent}${f}${c.reset}`);
                }
              });
            };
            listDirContent(dir);
            console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
          } else {
            console.log(`${t.amber}No agents/ directory found.${c.reset}`);
          }
          break;
        }

        case '/agent':
          if (!arg) {
            console.log(`${t.amber}Current Persona: ${activeAgent}${c.reset}`);
          } else {
            activeAgent = arg;
            rl.setPrompt(`${c.bold}${t.primary}hybrids-cli [${agentMode.toUpperCase()}:${activeAgent}]> ${c.reset}`);
            console.log(`${t.emerald}Switched Agent Persona to: ${activeAgent}${c.reset}`);
          }
          break;

        case '/skills': {
          const dir = path.join(process.cwd(), 'skills');
          if (fs.existsSync(dir)) {
            console.log(`\n${t.primary}┌── ⚡ Installed Custom Skills (skills/) ────────────────────────────────┐${c.reset}`);
            const listDirContent = (d, prefix = '  ') => {
              fs.readdirSync(d).filter(f => !f.startsWith('.')).forEach(f => {
                const p = path.join(d, f);
                if (fs.statSync(p).isDirectory()) {
                  console.log(`${prefix}📁 ${t.sky}${f}/${c.reset}`);
                  listDirContent(p, prefix + '   ');
                } else {
                  console.log(`${prefix}├── ${t.emerald}${f}${c.reset}`);
                }
              });
            };
            listDirContent(dir);
            console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
          } else {
            console.log(`${t.amber}No skills/ directory found.${c.reset}`);
          }
          break;
        }

        case '/mcp': {
          const dir = fs.existsSync(path.join(process.cwd(), 'mcp')) ? path.join(process.cwd(), 'mcp') : path.join(process.cwd(), 'mcps');
          if (fs.existsSync(dir)) {
            console.log(`\n${t.primary}┌── 🔌 MCP Server Integrations ─────────────────────────────────────────┐${c.reset}`);
            const listDirContent = (d, prefix = '  ') => {
              fs.readdirSync(d).filter(f => !f.startsWith('.')).forEach(f => {
                const p = path.join(d, f);
                if (fs.statSync(p).isDirectory()) {
                  console.log(`${prefix}📁 ${t.amber}${f}/${c.reset}`);
                  listDirContent(p, prefix + '   ');
                } else {
                  console.log(`${prefix}├── ${t.purple}${f}${c.reset}`);
                }
              });
            };
            listDirContent(dir);
            console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
          } else {
            console.log(`${t.amber}No mcp/ directory found.${c.reset}`);
          }
          break;
        }

        case '/herder':
          console.log(`\n${t.primary}┌── 👥 Agent Herder Orchestrator Status ────────────────────────────────┐${c.reset}`);
          console.log(`  Active Multi-Agent Harnesses: ${t.emerald}${activeHarnessesCount}${c.reset}`);
          console.log(`  Harness 1: Lead Architect Agent (Active)`);
          console.log(`  Harness 2: Code Synthesis Agent (Active)`);
          console.log(`  Harness 3: Security & Audit Agent (Active)`);
          console.log(`  Harness 4: Verification & Test Agent (Active)`);
          console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
          break;

        case '/cost':
          console.log(`\n${t.primary}┌── 💰 Token & Cost Breakdown ──────────────────────────────────────────┐${c.reset}`);
          console.log(`  Input Tokens:  ${sessionStats.totalInputTokens}`);
          console.log(`  Output Tokens: ${sessionStats.totalOutputTokens}`);
          console.log(`  Estimated Cost: $${sessionStats.totalCost.toFixed(6)} USD`);
          console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
          break;

        case '/cat':
          if (!arg) {
            console.log(`${t.amber}Usage: /cat <filename>${c.reset}`);
          } else {
            const filePath = path.join(process.cwd(), arg);
            if (fs.existsSync(filePath)) {
              console.log(`\n${t.primary}┌── [📄 ${arg}] ─────────────────────────────────────────────────────────┐${c.reset}`);
              console.log(fs.readFileSync(filePath, 'utf-8'));
              console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);
            } else {
              console.log(`${t.red}File not found: ${arg}${c.reset}`);
            }
          }
          break;

        case '/edit':
          if (!arg) {
            console.log(`${t.amber}Usage: /edit <filename>${c.reset}`);
          } else {
            const editor = process.env.EDITOR || 'nano';
            await execCommand(`${editor} "${arg}"`);
          }
          break;

        case '/exec':
          if (!arg) {
            console.log(`${t.amber}Usage: /exec <shell command>${c.reset}`);
          } else {
            await execCommand(arg);
          }
          break;

        default:
          console.log(`${t.red}Unknown command: ${cmd}. Type /help for assistance.${c.reset}`);
          break;
      }

      rl.prompt();
      return;
    }

    // AI Query Execution with Gemini Stream
    if (!ai) {
      console.log(`\n${t.red}Error: GEMINI_API_KEY is not set in environment.${c.reset}`);
      console.log(`${t.amber}Set GEMINI_API_KEY in your .env file or run: export GEMINI_API_KEY="your_key"${c.reset}\n`);
      rl.prompt();
      return;
    }

    try {
      agentStatus = 'thinking';
      console.log(`\n${t.primary}┌── [🤖 AI Stream: ${selectedModel} | Mode: ${agentMode.toUpperCase()} | Agent: ${activeAgent}] ──┐${c.reset}`);

      const wsContext = getWorkspaceContext();
      const prompt = `[System Context / Mode: ${agentMode.toUpperCase()} / Persona: ${activeAgent}]
You are HYBRIDS_CLI running in Kali Linux terminal environment.

Workspace Context & Active Specs:
${wsContext}

User Query:
${input}`;

      const responseStream = await ai.models.generateContentStream({
        model: selectedModel,
        contents: prompt,
      });

      process.stdout.write(`${t.text}`);
      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          process.stdout.write(chunk.text);
          fullText += chunk.text;
        }
      }
      process.stdout.write(`${c.reset}\n`);
      console.log(`${t.primary}└───────────────────────────────────────────────────────────────────────┘${c.reset}\n`);

      // Update Session Stats
      sessionStats.messageCount += 1;
      sessionStats.totalInputTokens += Math.ceil(prompt.length / 4);
      sessionStats.totalOutputTokens += Math.ceil(fullText.length / 4);
      sessionStats.totalCost = (sessionStats.totalInputTokens * 0.00000015) + (sessionStats.totalOutputTokens * 0.0000006);

      agentStatus = 'idle';
      history.push({ role: 'user', content: input });
    } catch (err) {
      agentStatus = 'idle';
      console.log(`\n${t.red}Error generating response: ${err.message}${c.reset}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log(`\n${t.emerald}HYBRIDS_CLI session ended.${c.reset}`);
    process.exit(0);
  });
}

// Single command execution mode
const args = process.argv.slice(2);
if (args.length > 0) {
  const query = args.join(' ');
  if (!ai) {
    console.error('GEMINI_API_KEY missing in environment.');
    process.exit(1);
  }

  const wsContext = getWorkspaceContext();
  const prompt = `Workspace Context:\n${wsContext}\n\nQuery: ${query}`;

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
