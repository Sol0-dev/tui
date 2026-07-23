import React, { useState, useRef, useEffect } from 'react';
import { TuiTheme, AgentMode } from '../types';
import { THEMES } from '../constants';
import { Send, Terminal, Sparkles, HelpCircle, CornerDownLeft } from 'lucide-react';

interface TuiCommandBarProps {
  onSendMessage: (text: string) => void;
  currentTheme: TuiTheme;
  agentMode: AgentMode;
  agentStatus: 'idle' | 'thinking' | 'executing' | 'awaiting_approval';
  onExecuteSlashCommand: (cmd: string) => void;
}

const SLASH_COMMANDS = [
  { cmd: '/new', desc: 'Start a new session / reset terminal workspace chat' },
  { cmd: '/herder', desc: 'Manage & dispatch multi-agent harnesses in Agent Herder' },
  { cmd: '/goal', desc: 'Define multi-step development objective with automated task tracker' },
  { cmd: '/loop', desc: 'Schedule recurring agent execution loop (e.g. periodic tests, polling)' },
  { cmd: '/skills', desc: 'Manage AGENTS.md instructions & active custom skills' },
  { cmd: '/mcp', desc: 'Configure custom MCP (Model Context Protocol) servers & tools' },
  { cmd: '/history', desc: 'Open Chat History drawer to view & switch past sessions' },
  { cmd: '/vault', desc: 'Securely manage API key credentials for Claude, OpenAI, Groq, Gemini' },
  { cmd: '/model', desc: 'Open Model Selector (Gemini, Claude, OpenAI, Ollama, Groq)' },
  { cmd: '/config', desc: 'Configure API Keys, Endpoints, System Prompts' },
  { cmd: '/mode', desc: 'Toggle Agent Execution Mode (auto, plan, interactive, yolo)' },
  { cmd: '/compact', desc: 'Compact / Summarize current session context memory' },
  { cmd: '/clear', desc: 'Clear terminal screen & history' },
  { cmd: '/init', desc: 'Initialize project boilerplate / scaffold files' },
  { cmd: '/theme', desc: 'Cycle or set TUI visual theme' },
  { cmd: '/export', desc: 'Export conversation logs and patch files' },
  { cmd: '/help', desc: 'Show CLI command manual & hotkey guide' },
];

export function TuiCommandBar({
  onSendMessage,
  currentTheme,
  agentMode,
  agentStatus,
  onExecuteSlashCommand,
}: TuiCommandBarProps) {
  const theme = THEMES[currentTheme];
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showSlashPopup, setShowSlashPopup] = useState(false);
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSlash = SLASH_COMMANDS.filter(s => 
    s.cmd.toLowerCase().startsWith(input.toLowerCase().trim())
  );

  useEffect(() => {
    if (input.startsWith('/')) {
      setShowSlashPopup(true);
      setSelectedSlashIdx(0);
    } else {
      setShowSlashPopup(false);
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('/')) {
      onExecuteSlashCommand(trimmed);
    } else {
      onSendMessage(trimmed);
    }

    setHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);
    setInput('');
    setShowSlashPopup(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSlashPopup && filteredSlash.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIdx(prev => (prev + 1) % filteredSlash.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIdx(prev => (prev - 1 + filteredSlash.length) % filteredSlash.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const chosen = filteredSlash[selectedSlashIdx];
        if (chosen) {
          setInput(chosen.cmd + ' ');
          setShowSlashPopup(false);
        }
        return;
      }
    }

    if (e.key === 'ArrowUp' && !showSlashPopup) {
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown' && !showSlashPopup) {
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div 
      className="border-t p-3 relative font-mono text-sm select-none"
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      {/* Slash Command Autocomplete Popup */}
      {showSlashPopup && filteredSlash.length > 0 && (
        <div 
          className="absolute bottom-full left-4 mb-2 w-80 max-h-60 overflow-y-auto rounded-md border shadow-2xl z-50 p-1"
          style={{ backgroundColor: theme.bg, borderColor: theme.border }}
        >
          <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 border-b" style={{ borderColor: theme.border }}>
            OpenCode Commands (Press TAB to select)
          </div>
          {filteredSlash.map((s, idx) => (
            <button
              key={s.cmd}
              onClick={() => {
                setInput(s.cmd + ' ');
                setShowSlashPopup(false);
                inputRef.current?.focus();
              }}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex flex-col transition-colors ${
                selectedSlashIdx === idx ? 'bg-white/20 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400">{s.cmd}</span>
                <span className="text-[10px] text-slate-500 font-normal">Command</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal truncate">{s.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Prompt Form */}
      <div className="space-y-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 py-1">
          <div className="flex items-center gap-1.5 font-extrabold text-base shrink-0 select-none" style={{ color: theme.primary }}>
            <span>❯</span>
          </div>

          <div className="flex-1 flex items-center relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={agentStatus === 'thinking' || agentStatus === 'executing'}
              placeholder={
                agentStatus === 'thinking'
                  ? 'Hybrids CLI is executing reasoning...'
                  : 'Type a prompt or Kali VM command (e.g. ls, whoami, nmap, /goal, /loop)...'
              }
              className="w-full bg-transparent border-none outline-none text-slate-100 placeholder-slate-500 font-mono text-xs sm:text-sm tracking-wide"
            />
            {/* Blinking Solid Block Cursor indicator */}
            {!input && agentStatus !== 'thinking' && (
              <span className="w-2.5 h-4 bg-white/90 animate-pulse inline-block ml-0.5 shadow-sm"></span>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || agentStatus === 'thinking'}
            className="px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{
              backgroundColor: theme.primary,
              color: '#000',
            }}
          >
            <span className="hidden sm:inline">Run</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Bottom Footer Status Bar matching Screenshot */}
        <div className="pt-2 border-t flex items-center justify-between text-xs font-mono text-slate-500" style={{ borderColor: theme.border }}>
          <button 
            type="button" 
            onClick={() => onExecuteSlashCommand('/help')}
            className="hover:text-amber-400 cursor-pointer flex items-center gap-1 text-slate-400 font-mono"
          >
            <span className="font-bold text-amber-400">?</span> for shortcuts
          </button>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="hidden sm:inline">Terminal: <span className="text-emerald-400 font-bold">Kali VM (Bash)</span></span>
            <span>Model: <span className="text-sky-400 font-bold">Hybrids CLI</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
