# ACY Hybrids Setup & Customization Guide

This guide explains how to customize and expand your ACY Hybrids agent workspace with custom Agent Personas, Skills, and Model Context Protocol (MCP) servers.

---

## 1. Customizing Root `AGENTS.md`
The `AGENTS.md` file at the workspace root acts as the primary system instruction set for the AI model.
- Add global coding standards, safety rules, or project goals.
- The CLI and Browser TUI automatically inject `AGENTS.md` into prompt context.

---

## 2. Adding Custom Agent Personas (`agents/`)
To add a new agent persona:
1. Create a subdirectory under `agents/` (e.g., `agents/my-custom-agent/`).
2. Create an `AGENTS.md` file inside that folder:
```markdown
# My Custom Agent Persona

## Role
Specialized agent for data analysis and reporting.

## Directives
- Parse JSON/CSV data streams.
- Generate concise summary tables.
```
3. In CLI or Browser TUI, switch active agent using `/agent my-custom-agent` or via the Agent Herder dropdown.

---

## 3. Adding Custom Skills (`skills/`)
Skills provide modular operational guidelines and procedural workflows for specific tasks:
1. Create a directory in `skills/` (e.g., `skills/api-testing/`).
2. Add a `SKILLS.md` file:
```markdown
# Skill: API Integration Testing

## Overview
Workflow for verifying REST and GraphQL endpoints.

## Steps
1. Execute curl or fetch requests.
2. Inspect HTTP status codes and response headers.
3. Validate payload schema against specifications.
```
3. The AI model will automatically leverage active skills when executing matching tasks.

---

## 4. Configuring MCP Servers (`mcp/`)
Model Context Protocol (MCP) servers enable standard tool connections (databases, external APIs, terminal tools).
1. Create a JSON config in `mcp/` (e.g., `mcp/custom-api-mcp.json`):
```json
{
  "name": "Custom API MCP Server",
  "version": "1.0.0",
  "type": "rest_mcp",
  "endpoint": "http://localhost:3000/api/mcp",
  "tools": [
    {
      "name": "query_database",
      "description": "Execute read query on local database",
      "parameters": {
        "type": "object",
        "properties": {
          "sql": { "type": "string" }
        }
      }
    }
  ]
}
```

---

## 5. Launching the Workspace
- **Browser TUI**: Access via local server on `http://localhost:3000`.
- **Kali CLI / TMUX**: Run `npm run cli` or `node cli.js` directly in your terminal.
