#!/usr/bin/env node

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load .env if present
dotenv.config();

// ANSI Styling codes for Kali/tmux Terminal
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  emerald: '\x1b[32m',
  amber: '\x1b[33m',
  sky: '\x1b[38;5;39m',
  purple: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  boldCyan: '\x1b[1;36m',
  boldGreen: '\x1b[1;32m',
  bgDark: '\x1b[40m',
};

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Active Agent State
let activeAgent = 'General Assistant';
let systemPrompt = 'You are ACY Hybrids Agent CLI running in Kali Linux terminal.';
const history = [];

// Helper: Read Workspace Files (AGENTS.md, agents/, skills/, mcp/)
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
    const files = fs.readdirSync(skillsDir);
    context += `\n--- [Available Skills: ${files.length} skills] ---\n` + files.join(', ') + '\n';
  }

  // 4. mcp/ directory
  const mcpDir = path.join(root, 'mcp');
  if (fs.existsSync(mcpDir)) {
    const files = fs.readdirSync(mcpDir);
    context += `\n--- [MCP Server Configs: ${files.length} configs] ---\n` + files.join(', ') + '\n';
  }

  return context;
}

// Print Banner
function printBanner() {
  console.clear();
  console.log(`${c.boldCyan}
 ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄   ▄▄    ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄ ▄▄bd    ▄▄▄▄▄▄▄ ▄▄▄   ▄▄ ▄▄▄▄▄▄▄ 
█   ▄   █       █   █ █   █  █   ▄   █  ▄    █       █   █   █       █   █ █  █       █
█  █ █  █       █   █▄█   █  █  █ █  █ █▄█   █    ▄▄▄█   █   █   ▄   █   █▄█  █   ▄   █
█  █▄█  █     ▄▄█      ▄▀   █  █▄█  █   ▄▄▄▄█   █▄▄▄█   █   █  █ █  █      █ █  █ █  █
█   ▄   █    █  █  ▄   █    █   ▄   █  █  ▄ █    ▄▄▄█   █▄▄▄█  █▄█  █  ▄   █ █  █▄█  █
█  █ █  █    █▄▄█ █  █  █   █  █ █  █  █▄█ ██   █▄▄▄█       █       █ █  █  █ █       █
█▄█ █▄█ █▄▄▄▄▄▄▄█▄█  █▄█   █▄█ █▄█ █▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█▄▄▄▄▄▄▄█▄█  █▄█ █▄▄▄▄▄▄▄█
${c.reset}`);
  console.log(`${c.sky}  ACY Hybrids Terminal CLI ${c.gray}| Native Kali Linux & tmux Shell Interface${c.reset}`);
  console.log(`${c.gray}  Workspace: ${process.cwd()}${c.reset}`);
  console.log(`${c.emerald}  Status: ${apiKey ? 'API Key Active (Gemini 3.6 Flash)' : '⚠️ GEMINI_API_KEY missing in .env'}${c.reset}\n`);
  console.log(`${c.amber}  Type ${c.bright}/help${c.reset}${c.amber} to view terminal slash commands or enter your prompt below.${c.reset}\n`);
}

// Help Menu
function showHelp() {
  console.log(`
${c.boldCyan}=== ACY Terminal CLI Command Reference ===${c.reset}
  ${c.emerald}/agents${c.reset}        - List agent persona files in agents/
  ${c.emerald}/agent <name>${c.reset}  - Switch active agent persona
  ${c.emerald}/skills${c.reset}        - List available skills in skills/
  ${c.emerald}/mcp${c.reset}           - List MCP server configurations in mcp/
  ${c.emerald}/files${c.reset}         - List workspace files (AGENTS.md, agents/, skills/, mcp/)
  ${c.emerald}/cat <path>${c.reset}    - Display contents of a workspace file
  ${c.emerald}/edit <path>${c.reset}   - Open a file in $EDITOR (nano/vim) or prompt
  ${c.emerald}/exec <cmd>${c.reset}    - Execute a local shell command on Kali Linux
  ${c.emerald}/clear${c.reset}         - Clear the terminal screen
  ${c.emerald}/exit${c.reset}          - Exit the CLI terminal
`);
}

// List files in workspace directory
function listFiles() {
  const root = process.cwd();
  console.log(`\n${c.boldCyan}📂 Workspace Agent Directory Files:${c.reset}`);

  const checkAndList = (targetRel) => {
    const targetAbs = path.join(root, targetRel);
    if (fs.existsSync(targetAbs)) {
      const stat = fs.statSync(targetAbs);
      if (stat.isDirectory()) {
        const items = fs.readdirSync(targetAbs);
        console.log(`  ${c.sky}📁 ${targetRel}/${c.reset} (${items.length} items):`);
        items.forEach(i => console.log(`     - ${targetRel}/${i}`));
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
  console.log(`${c.gray}[Executing in Kali shell]: ${cmdStr}${c.reset}\n`);
  const child = spawn(cmdStr, { shell: true, stdio: 'inherit' });
  return new Promise((resolve) => {
    child.on('close', (code) => {
      console.log(`\n${c.gray}[Command finished with code ${code}]${c.reset}\n`);
      resolve();
    });
  });
}

// Main Interactive REPL
async function startRepl() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
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
          printBanner();
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

        case '/agents': {
          const dir = path.join(process.cwd(), 'agents');
          if (fs.existsSync(dir)) {
            console.log(`\n${c.boldCyan}🤖 Agent Personas in agents/:${c.reset}`);
            fs.readdirSync(dir).forEach(f => console.log(`  - ${f}`));
          } else {
            console.log(`${c.amber}No agents/ directory found.${c.reset}`);
          }
          console.log();
          break;
        }

        case '/agent': {
          if (!arg) {
            console.log(`${c.amber}Current Agent: ${activeAgent}${c.reset}`);
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
            console.log(`\n${c.boldCyan}⚡ Skills in skills/:${c.reset}`);
            fs.readdirSync(dir).forEach(f => console.log(`  - ${f}`));
          } else {
            console.log(`${c.amber}No skills/ directory found.${c.reset}`);
          }
          console.log();
          break;
        }

        case '/mcp': {
          const dir = path.join(process.cwd(), 'mcp');
          if (fs.existsSync(dir)) {
            console.log(`\n${c.boldCyan}🔌 MCP Configs in mcp/:${c.reset}`);
            fs.readdirSync(dir).forEach(f => console.log(`  - ${f}`));
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
              console.log(`\n${c.boldCyan}--- ${arg} ---${c.reset}`);
              console.log(fs.readFileSync(filePath, 'utf-8'));
              console.log(`${c.boldCyan}--- END ---${c.reset}\n`);
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
      process.stdout.write(`\n${c.emerald}🤖 [ACY Agent thinking...]${c.reset}\n`);

      const wsContext = getWorkspaceContext();
      const prompt = `[System Instructions / Persona: ${activeAgent}]
${systemPrompt}

Workspace Files & Specs:
${wsContext}

User Query:
${input}`;

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      process.stdout.write(`${c.sky}`);
      for await (const chunk of responseStream) {
        if (chunk.text) {
          process.stdout.write(chunk.text);
        }
      }
      process.stdout.write(`${c.reset}\n\n`);

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

// Single Prompt CLI execution if arguments passed
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
      model: 'gemini-3.6-flash',
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
