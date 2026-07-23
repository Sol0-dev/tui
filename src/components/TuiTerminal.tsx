import React, { useRef, useEffect } from 'react';
import { ChatMessage, ToolCall, TuiTheme, AgentMode } from '../types';
import { THEMES } from '../constants';
import { 
  Bot, 
  User, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  FileText, 
  Edit3, 
  Search, 
  Play, 
  ListOrdered, 
  Globe, 
  Brain,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Check,
  X
} from 'lucide-react';

interface TuiTerminalProps {
  messages: ChatMessage[];
  currentTheme: TuiTheme;
  agentMode: AgentMode;
  agentStatus?: 'idle' | 'thinking' | 'executing' | 'awaiting_approval';
  pendingToolCall: ToolCall | null;
  onApproveTool: (toolId: string) => void;
  onRejectTool: (toolId: string) => void;
  onAlwaysApprove: () => void;
  onViewDiff?: (filePath?: string) => void;
  currentModelName?: string;
  onExecuteSlashCommand?: (cmd: string) => void;
}

export function TuiTerminal({
  messages,
  currentTheme,
  agentMode,
  agentStatus = 'idle',
  pendingToolCall,
  onApproveTool,
  onRejectTool,
  onAlwaysApprove,
  onViewDiff,
  currentModelName,
  onExecuteSlashCommand,
}: TuiTerminalProps) {
  const theme = THEMES[currentTheme];
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [expandedThoughts, setExpandedThoughts] = React.useState<Record<string, boolean>>({});

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingToolCall]);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'read_file':
        return <FileText className="w-3.5 h-3.5 text-sky-400" />;
      case 'write_file':
        return <Edit3 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'grep_search':
      case 'list_dir':
        return <Search className="w-3.5 h-3.5 text-purple-400" />;
      case 'bash_run':
        return <Play className="w-3.5 h-3.5 text-amber-400" />;
      case 'create_plan':
        return <ListOrdered className="w-3.5 h-3.5 text-pink-400" />;
      case 'web_search':
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs sm:text-sm select-text"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* macOS Window Title Bar Frame */}
      <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-black/50 rounded-t border border-b-0" style={{ borderColor: theme.primary }}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block shadow-sm"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block shadow-sm"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shadow-sm"></span>
          <span className="ml-2 font-bold text-slate-200 flex items-center gap-1.5">
            <span className="text-amber-400">✳</span> Hybrids CLI v2.1.87 (Kali Linux VM)
          </span>
        </div>
        <div className="text-slate-500 text-[10px] font-mono flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
            {agentMode.toUpperCase()} MODE
          </span>
          <span>⌥⌘1</span>
        </div>
      </div>

      {/* Terracotta Orange Main Box Banner */}
      <div 
        className="relative border rounded-b p-4 space-y-3 font-mono text-xs shadow-lg" 
        style={{ 
          borderColor: theme.primary, 
          backgroundColor: 'rgba(255, 255, 255, 0.02)' 
        }}
      >
        {/* Cutout Title Tag in top border */}
        <div 
          className="absolute -top-3 left-4 px-2 py-0.5 text-[11px] font-bold tracking-wider rounded" 
          style={{ backgroundColor: theme.bg, color: theme.primary, border: `1px solid ${theme.primary}` }}
        >
          — Hybrids CLI v2.1.87 —
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Left Column: Welcome & 8-bit Invader Logo */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 py-2 md:border-r border-dashed" style={{ borderColor: theme.border }}>
            <div className="font-extrabold text-base text-slate-100 tracking-wide">
              Welcome back my Thane!
            </div>
            
            {/* 8-bit Pixel Invader / Dragon Icon */}
            <div className="my-1" style={{ color: theme.primary }}>
              <pre className="text-[11px] leading-[11px] font-bold select-none tracking-tighter inline-block">
{`   ▄▀▄▀▄
  ███████
  █ █ █ █
  ███████
  ▀ ▀ ▀ ▀`}
              </pre>
            </div>

            <div className="text-slate-300 text-xs">
              <span className="font-bold text-amber-400">{currentModelName || 'Sonnet 4.6'}</span> · Claude Pro / Gemini · <span className="text-slate-400">xzialao's Organization</span>
            </div>
            <div className="text-slate-400 text-[11px] font-mono flex items-center justify-center gap-1">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span>~/kali-vm/workspace</span>
            </div>
          </div>

          {/* Right Column: Tips & Recent Activity */}
          <div className="space-y-3 py-1 pl-2">
            <div>
              <div className="text-amber-500/90 font-bold text-xs mb-1 flex items-center gap-1">
                <span>Tips for getting started</span>
              </div>
              <div className="text-slate-300 text-xs leading-relaxed">
                Run <button onClick={() => onExecuteSlashCommand?.('/init')} className="text-amber-400 font-bold underline hover:text-amber-300">/init</button> to create an AGENTS.md file with instructions...
              </div>
            </div>
            <div className="pt-1 border-t border-dashed" style={{ borderColor: theme.border }}>
              <div className="text-amber-500/90 font-bold text-xs mb-1">Recent activity</div>
              <div className="text-slate-400 text-xs flex items-center justify-between">
                <span>Kali Linux VM Shell active</span>
                <span className="text-[10px] text-emerald-400 font-bold">● Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mid Announcement Status Banner Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-1 px-1 text-slate-300 font-mono border-b border-dashed" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">✳</span>
          <span>ACY Agent Active · System Ready</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Autonomous Agent Harness Active</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Auto Web Knowledge & Tools Enabled</span>
        </div>
      </div>

      {/* Message List */}
      {messages.map((msg) => (
        <div key={msg.id} className="space-y-2">
          {/* USER MESSAGE */}
          {msg.role === 'user' && (
            <div className="flex items-start gap-2 pt-2 border-t border-dashed" style={{ borderColor: theme.border }}>
              <span className="font-bold flex items-center gap-1.5 shrink-0" style={{ color: theme.primary }}>
                <User className="w-4 h-4" /> ❯ user:
              </span>
              <div className="whitespace-pre-wrap font-sans text-slate-100 flex-1 leading-relaxed">
                {msg.content}
              </div>
            </div>
          )}

          {/* ASSISTANT MESSAGE */}
          {msg.role === 'assistant' && (
            <div className="space-y-2 pl-2 border-l-2" style={{ borderColor: theme.primary }}>
              <div className="flex items-center justify-between text-xs opacity-75">
                <span className="font-bold flex items-center gap-1.5" style={{ color: theme.accent }}>
                  <Bot className="w-4 h-4" /> 🤖 ACY Agent:
                </span>
                {msg.tokens && (
                  <span className="text-[10px] text-slate-400">
                    {msg.tokens.input + msg.tokens.output} tokens • ${msg.cost?.toFixed(5) || '0.00000'}
                  </span>
                )}
              </div>

              {/* Claude / OpenCode Reasoning Thought Stream */}
              {msg.thought && (
                <div className="border rounded overflow-hidden" style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.2)' }}>
                  <button
                    onClick={() => toggleThought(msg.id)}
                    className="w-full flex items-center justify-between p-2 text-xs font-semibold text-amber-400/90 hover:bg-white/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reasoning Thought Process</span>
                    </span>
                    {expandedThoughts[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {(expandedThoughts[msg.id] ?? true) && (
                    <div className="p-2.5 pt-0 text-xs text-amber-200/80 font-mono whitespace-pre-wrap leading-relaxed border-t border-dashed" style={{ borderColor: theme.border }}>
                      {msg.thought}
                    </div>
                  )}
                </div>
              )}

              {/* Content Body */}
              {msg.content && (
                <div className="whitespace-pre-wrap leading-relaxed font-mono bg-white/5 p-3 rounded border text-slate-200" style={{ borderColor: theme.border }}>
                  {msg.content}
                </div>
              )}

              {/* Tool Calls Executed in this message */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {msg.toolCalls.map((tc) => (
                    <div
                      key={tc.id}
                      className="flex flex-col gap-1 p-2 rounded border text-xs bg-slate-900/60 font-mono"
                      style={{ borderColor: theme.border }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getToolIcon(tc.name)}
                          <span className="font-bold text-sky-300">{tc.name}</span>
                          <span className="text-slate-400 truncate max-w-[280px]">
                            {tc.args.path || tc.args.command || JSON.stringify(tc.args)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tc.status === 'executing' && (
                            <span className="flex items-center gap-1 text-amber-400">
                              <Loader2 className="w-3 h-3 animate-spin" /> Running
                            </span>
                          )}
                          {tc.status === 'success' && (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          )}
                          {tc.status === 'failed' && (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle className="w-3 h-3" /> Failed
                            </span>
                          )}
                          {tc.name === 'write_file' && tc.status === 'success' && (
                            <button
                              onClick={() => onViewDiff(tc.args.path)}
                              className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/40 text-[10px]"
                            >
                              Diff
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tool Result Preview */}
                      {tc.result && (
                        <div className="text-[11px] text-slate-400 bg-black/40 p-2 rounded border border-white/5 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono mt-1">
                          {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Live Agent Background Reasoning & Tool Execution Stream */}
      {(agentStatus === 'thinking' || agentStatus === 'executing') && (
        <div className="p-3.5 rounded-lg border bg-black/60 space-y-2 font-mono text-xs border-amber-500/40 shadow-xl animate-pulse">
          <div className="flex items-center justify-between text-amber-300 font-bold">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span>🧠 Agent Reasoning & Background Tool Stream...</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {agentStatus.toUpperCase()}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 pl-6 space-y-1">
            <div className="flex items-center gap-2 text-sky-300">
              <Brain className="w-3.5 h-3.5" />
              <span>Evaluating task objectives against AGENTS.md rules & active skills...</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <Globe className="w-3.5 h-3.5" />
              <span>Checking web knowledge / executing autonomous tool harness calls...</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Tool Approval Dialog when Agent Mode is 'interactive' */}
      {pendingToolCall && (
        <div className="p-4 rounded-lg border-2 border-purple-500 bg-purple-950/40 space-y-3 font-mono text-xs shadow-2xl animate-fade-in">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-purple-400 animate-pulse" />
            <span>Interactive Tool Call Approval Required</span>
          </div>
          <div className="p-3 bg-black/60 rounded border border-purple-800 space-y-1">
            <div className="text-amber-300 font-bold">Tool Action: {pendingToolCall.name}</div>
            <div className="text-slate-300 font-mono text-[11px]">
              Args: {JSON.stringify(pendingToolCall.args, null, 2)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => onApproveTool(pendingToolCall.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              <Check className="w-4 h-4" /> [Y] Approve Action
            </button>
            <button
              onClick={() => onRejectTool(pendingToolCall.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors"
            >
              <X className="w-4 h-4" /> [N] Reject Action
            </button>
            <button
              onClick={onAlwaysApprove}
              className="px-3 py-1.5 rounded bg-sky-700 hover:bg-sky-600 text-white font-bold transition-colors"
            >
              [A] Auto-Approve (Switch to AUTO)
            </button>
          </div>
        </div>
      )}

      <div ref={terminalEndRef} />
    </div>
  );
}
