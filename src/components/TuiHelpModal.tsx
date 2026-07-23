import React from 'react';
import { TuiTheme } from '../types';
import { THEMES } from '../constants';
import { HelpCircle, X, Terminal, Command, Zap, Layers, Cpu } from 'lucide-react';

interface TuiHelpModalProps {
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiHelpModal({ onClose, currentTheme }: TuiHelpModalProps) {
  const theme = THEMES[currentTheme];

  const commands = [
    { cmd: '/new', desc: 'Start a new chat session / reset workspace memory' },
    { cmd: '/herder', desc: 'Open Agent Herder multi-harness orchestrator' },
    { cmd: '/goal', desc: 'Define multi-step development objectives with automated task checklist' },
    { cmd: '/loop', desc: 'Schedule recurring agent loops (e.g. periodic tests, polling, refactoring)' },
    { cmd: '/skills', desc: 'Manage custom AGENTS.md instructions and active skill files' },
    { cmd: '/mcp', desc: 'Configure custom MCP (Model Context Protocol) servers and tools' },
    { cmd: '/history', desc: 'Open Chat History drawer to switch sessions, rename or resume chats' },
    { cmd: '/vault', desc: 'Securely manage and test API keys for Claude, OpenAI, Groq, Gemini' },
    { cmd: '/model', desc: 'Load & switch active LLM Model API (Gemini, Claude, OpenAI, Ollama)' },
    { cmd: '/config', desc: 'Configure custom API keys, endpoints, system prompts, temperature' },
    { cmd: '/mode', desc: 'Switch agent execution mode: auto, plan, interactive, yolo' },
    { cmd: '/compact', desc: 'Compress conversation history to save token context window' },
    { cmd: '/clear', desc: 'Clear the terminal screen and chat session' },
    { cmd: '/init', desc: 'Generate starter boilerplate files for React or Python' },
    { cmd: '/theme', desc: 'Switch TUI visual theme (Tokyo Night, Monokai, CRT Amber, Hacker Green)' },
    { cmd: '/export', desc: 'Export conversation session logs & code diff patches' },
    { cmd: '/help', desc: 'Display this command manual' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <HelpCircle className="w-5 h-5" />
            <span>HYBRIDS CLI MANUAL</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Agent Modes Overview */}
          <div>
            <div className="font-bold text-amber-400 uppercase text-xs mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Agent Execution Modes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded border bg-white/5" style={{ borderColor: theme.border }}>
                <span className="font-bold text-emerald-400 uppercase">AUTO</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Executes read/write/bash tools autonomously without prompting.</p>
              </div>
              <div className="p-2.5 rounded border bg-white/5" style={{ borderColor: theme.border }}>
                <span className="font-bold text-sky-400 uppercase">PLAN MODE</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Generates a detailed step-by-step breakdown before writing code.</p>
              </div>
              <div className="p-2.5 rounded border bg-white/5" style={{ borderColor: theme.border }}>
                <span className="font-bold text-purple-400 uppercase">INTERACTIVE</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Asks user confirmation [Y/N] before modifying files or running commands.</p>
              </div>
              <div className="p-2.5 rounded border bg-white/5" style={{ borderColor: theme.border }}>
                <span className="font-bold text-pink-400 uppercase">YOLO</span>
                <p className="text-slate-400 text-[11px] mt-0.5">Ultra high-speed continuous tool execution mode.</p>
              </div>
            </div>
          </div>

          <hr style={{ borderColor: theme.border }} />

          {/* Slash Commands List */}
          <div>
            <div className="font-bold text-sky-400 uppercase text-xs mb-2 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" /> Available Slash Commands
            </div>
            <div className="space-y-1.5">
              {commands.map((c) => (
                <div 
                  key={c.cmd}
                  className="p-2 rounded border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs bg-black/30"
                  style={{ borderColor: theme.border }}
                >
                  <span className="font-bold text-emerald-400 font-mono">{c.cmd}</span>
                  <span className="text-slate-300 text-[11px]">{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold text-xs text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
