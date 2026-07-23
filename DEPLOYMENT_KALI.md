# ACY Agent Workspace - Kali Linux VM & TMUX Terminal Setup Guide

This guide details how to install, configure, build, and run the **ACY Hybrids Agent CLI** directly in your **Kali Linux Terminal / SSH / TMUX session** (without needing a web browser!), or run the background server.

---

## 💻 Running Directly in Native Kali Linux Terminal / TMUX (No Browser Required!)

You can launch the **ACY Agent Terminal CLI** directly inside `tmux` or any Kali Linux Bash/Zsh shell:

### 1. Launch Interactive Terminal REPL:
```bash
# Option A: Using npm script
npm run cli

# Option B: Running node executable directly
node cli.js

# Option C: Direct binary call (if symlinked / linked globally)
chmod +x cli.js
./cli.js
```

### 2. Running inside a TMUX Session on Kali Linux:
```bash
# Start a new tmux session named 'acy'
tmux new -s acy

# Run the interactive ACY CLI inside tmux
npm run cli

# Detach from tmux session anytime: Press Ctrl+B then D
# Re-attach to tmux session anytime:
tmux attach -t acy
```

### 3. Non-Interactive Single Command Execution in Bash:
```bash
# Run single prompt directly from terminal command line:
node cli.js "scan workspace directory and check AGENTS.md instructions"
```

---

## ⌨️ CLI Slash Commands Reference in Kali Terminal

Inside the `acy-agent> ` interactive prompt, use these built-in slash commands:

- `/help` - Show command reference
- `/files` or `/ls` - View agent workspace files (`AGENTS.md`, `agents/`, `skills/`, `mcp/`)
- `/agents` - List active persona files in `agents/`
- `/agent <name>` - Switch active agent persona
- `/skills` - List available skills in `skills/`
- `/mcp` - List active MCP configs in `mcp/`
- `/cat <file>` - Output file contents directly in terminal
- `/edit <file>` - Edit file in Kali terminal using `$EDITOR` (nano/vim/micro)
- `/exec <cmd>` - Execute native Kali Linux shell commands (e.g. `nmap`, `ip a`, `ls -la`)
- `/clear` - Clear terminal screen
- `/exit` - Exit CLI

---

## 📋 Prerequisites on Kali Linux VM

Install Node.js 20+, npm, git, python3, tmux, and pm2:

```bash
# 1. Update package repository
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x, npm, git, python3, tmux, curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git python3 python3-pip tmux curl build-essential

# 3. Install PM2 globally (Process Manager)
sudo npm install -g pm2
```

---

## 🛠️ Step 1: Clone or Transfer Codebase to Kali VM

```bash
mkdir -p ~/acy-workspace
cd ~/acy-workspace
# Ensure package.json, cli.js, server.ts are in this directory
```

---

## 📦 Step 2: Install Dependencies

```bash
npm install
```

---

## 🔑 Step 3: Configure Environment (.env)

```bash
nano .env
```

Paste your Gemini API Key:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Running Optional Web UI Server on Kali (Background PM2)

If you *also* want to run the web UI background server alongside the CLI:

```bash
# Build production bundle
npm run build

# Start background server in PM2
pm2 start dist/server.cjs --name "acy-agent-workspace"
pm2 save
pm2 startup
```

---

Done! Your **ACY Hybrids Agent CLI** is ready for native execution in your **Kali Linux TMUX / Bash terminal**.
