import React from 'react';
import { ModelConfig, AgentMode, TuiTheme, SessionStats } from '../types';
import { THEMES } from '../constants';
import { loadGeminiSsoState } from '../utils/storage';
import { 
  Cpu, 
  Terminal, 
  DollarSign, 
  FileCode, 
  Settings, 
  FolderKanban, 
  GitCompare, 
  Palette, 
  HelpCircle,
  Zap,
  Activity,
  Layers,
  History,
  ShieldCheck,
  Key,
  Target,
  Repeat,
  Globe,
  Users
} from 'lucide-react';

interface TuiHeaderProps {
  currentModel: ModelConfig;
  agentMode: AgentMode;
  setAgentMode: (mode: AgentMode) => void;
  agentStatus: 'idle' | 'thinking' | 'executing' | 'awaiting_approval';
  stats: SessionStats;
  currentTheme: TuiTheme;
  setTheme: (theme: TuiTheme) => void;
  onOpenModelModal: () => void;
  onOpenWorkspaceModal: () => void;
  onOpenCostModal: () => void;
  onOpenHelpModal: () => void;
  onOpenHistoryDrawer: () => void;
  onOpenApiKeyVaultModal: () => void;
  onOpenSkillsAndAgentsModal: () => void;
  onOpenMcpManagerModal: () => void;
  onOpenGoalModal?: () => void;
  onOpenLoopModal?: () => void;
  onOpenWebSearchModal?: () => void;
  onOpenHerderModal?: () => void;
  skillsCount?: number;
  mcpToolsCount?: number;
  activeGoalsCount?: number;
  activeLoopsCount?: number;
  activeHarnessesCount?: number;
}

export function TuiHeader({
  currentModel,
  agentMode,
  setAgentMode,
  agentStatus,
  stats,
  currentTheme,
  setTheme,
  onOpenModelModal,
  onOpenWorkspaceModal,
  onOpenCostModal,
  onOpenHelpModal,
  onOpenHistoryDrawer,
  onOpenApiKeyVaultModal,
  onOpenSkillsAndAgentsModal,
  onOpenMcpManagerModal,
  onOpenGoalModal,
  onOpenLoopModal,
  onOpenWebSearchModal,
  onOpenHerderModal,
  skillsCount = 3,
  mcpToolsCount = 6,
  activeGoalsCount = 0,
  activeLoopsCount = 0,
  activeHarnessesCount = 4,
}: TuiHeaderProps) {
  const theme = THEMES[currentTheme];
  const ssoState = loadGeminiSsoState();

  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'thinking':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
            <Activity className="w-3 h-3 animate-spin" />
            THINKING
          </span>
        );
      case 'executing':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Zap className="w-3 h-3 animate-bounce" />
            EXECUTING TOOL
          </span>
        );
      case 'awaiting_approval':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
            <HelpCircle className="w-3 h-3" />
            APPROVAL REQ
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            READY
          </span>
        );
    }
  };

  return (
    <header 
      className="border-b px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm font-mono select-none"
      style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
    >
      {/* Brand & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5" style={{ color: theme.primary }} />
          <span className="font-extrabold tracking-wider text-base" style={{ color: theme.primary }}>
            HYBRIDS<span style={{ color: theme.accent }}>_CLI</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">v2.4</span>
        </div>

        {/* Status Indicator */}
        {getStatusBadge()}

        {/* Agent Mode Switcher */}
        <div className="hidden sm:flex items-center border rounded overflow-hidden text-xs" style={{ borderColor: theme.border }}>
          <span className="px-2 py-1 bg-white/5 text-slate-400 border-r flex items-center gap-1" style={{ borderColor: theme.border }}>
            <Layers className="w-3 h-3" /> Mode:
          </span>
          {(['auto', 'plan', 'interactive', 'yolo'] as AgentMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAgentMode(mode)}
              className={`px-2 py-1 uppercase font-bold transition-colors ${
                agentMode === mode
                  ? 'bg-emerald-500/30 text-emerald-300 border-b-2 border-emerald-400'
                  : 'hover:bg-white/10 text-slate-400'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Model & Stats Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Active Model Selector Button */}
        <button
          onClick={onOpenModelModal}
          className="flex items-center gap-2 px-2.5 py-1 rounded border hover:bg-white/5 transition-all text-xs"
          style={{ borderColor: theme.border }}
          title="Click to load/configure any Model API"
        >
          <Cpu className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          <span className="font-semibold max-w-[180px] truncate">{currentModel.name}</span>
          <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-white/10" style={{ color: theme.accent }}>
            {currentModel.provider}
          </span>
        </button>

        {/* Token & Cost Counter */}
        <button
          onClick={onOpenCostModal}
          className="flex items-center gap-2 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors text-xs"
          title="View Token & Cost breakdown"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>${stats.totalCost.toFixed(4)}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{((stats.totalInputTokens + stats.totalOutputTokens) / 1000).toFixed(1)}k tokens</span>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1 border-l pl-3" style={{ borderColor: theme.border }}>
          {/* Chat History Button */}
          <button
            onClick={onOpenHistoryDrawer}
            className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors text-xs font-bold"
            title="Open Chat Session History"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Herder Multi-Agent Button */}
          {onOpenHerderModal && (
            <button
              onClick={onOpenHerderModal}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors text-xs font-bold"
              title="Agent Herder Multi-Harness Orchestrator (/herder)"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Herder</span>
              <span className="text-[9px] px-1 bg-indigo-500/40 rounded text-indigo-200">{activeHarnessesCount}</span>
            </button>
          )}

          {/* AGENTS.md & Skills Button */}
          <button
            onClick={onOpenSkillsAndAgentsModal}
            className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors text-xs font-bold"
            title="Manage AGENTS.md & Custom Skills"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Skills</span>
            <span className="text-[9px] px-1 bg-purple-500/40 rounded text-purple-200">{skillsCount}</span>
          </button>

          {/* MCP Tools Button */}
          <button
            onClick={onOpenMcpManagerModal}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors text-xs font-bold"
            title="Manage Custom MCP (Model Context Protocol) Servers"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">MCP</span>
            <span className="text-[9px] px-1 bg-cyan-500/40 rounded text-cyan-200">{mcpToolsCount}</span>
          </button>

          {/* /goal Button */}
          {onOpenGoalModal && (
            <button
              onClick={onOpenGoalModal}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors text-xs font-bold"
              title="Agent Objective Goal Tracker (/goal)"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Goal</span>
              {activeGoalsCount > 0 && <span className="text-[9px] px-1 bg-amber-500/40 rounded text-amber-100">{activeGoalsCount}</span>}
            </button>
          )}

          {/* /loop Button */}
          {onOpenLoopModal && (
            <button
              onClick={onOpenLoopModal}
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors text-xs font-bold"
              title="Recurring Execution Scheduler (/loop)"
            >
              <Repeat className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden lg:inline">Loop</span>
              {activeLoopsCount > 0 && <span className="text-[9px] px-1 bg-rose-500/40 rounded text-rose-100 animate-pulse">{activeLoopsCount}</span>}
            </button>
          )}

          {/* Web Search Button */}
          {onOpenWebSearchModal && (
            <button
              onClick={onOpenWebSearchModal}
              className="flex items-center gap-1 px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors text-xs font-bold"
              title="Web Search & Web Page Reader"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Web</span>
            </button>
          )}

          {/* API Key Vault & Google SSO Button */}
          <button
            onClick={onOpenApiKeyVaultModal}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-xs font-bold border ${
              ssoState.isConnected
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
            }`}
            title="Open API Key Vault & Google Gemini SSO"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${ssoState.isConnected ? 'text-sky-400' : 'text-amber-400'}`} />
            <span className="hidden md:inline">{ssoState.isConnected ? 'SSO Active' : 'Vault'}</span>
            {ssoState.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
          </button>

          <button
            onClick={onOpenWorkspaceModal}
            className="p-1.5 rounded text-slate-400 hover:bg-white/10 transition-colors"
            title="Switch Preset Projects"
          >
            <FolderKanban className="w-4 h-4" />
          </button>

          {/* Theme Switcher Dropdown */}
          <div className="relative group">
            <button className="p-1.5 rounded text-slate-400 hover:bg-white/10 transition-colors">
              <Palette className="w-4 h-4" />
            </button>
            <div 
              className="absolute right-0 mt-1 w-44 rounded border shadow-xl hidden group-hover:block z-50 p-1"
              style={{ backgroundColor: theme.bg, borderColor: theme.border }}
            >
              <div className="text-[10px] uppercase tracking-wider px-2 py-1 text-slate-500">TUI Themes</div>
              {(Object.keys(THEMES) as TuiTheme[]).map((tKey) => (
                <button
                  key={tKey}
                  onClick={() => setTheme(tKey)}
                  className={`w-full text-left px-2 py-1 rounded text-xs transition-colors flex items-center justify-between ${
                    currentTheme === tKey ? 'bg-white/15 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>{THEMES[tKey].name}</span>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THEMES[tKey].primary }}></span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenModelModal}
            className="p-1.5 rounded text-slate-400 hover:bg-white/10 transition-colors"
            title="Model Settings & API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenHelpModal}
            className="p-1.5 rounded text-slate-400 hover:bg-white/10 transition-colors"
            title="Command Manual & Shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
