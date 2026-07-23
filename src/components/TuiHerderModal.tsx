import React, { useState } from 'react';
import { AgentHarness, ModelConfig, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { 
  Bot, 
  Cpu, 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  X, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Zap, 
  Shield, 
  Code, 
  Brain, 
  Bug, 
  Layers,
  Send,
  RefreshCw,
  Users
} from 'lucide-react';

interface TuiHerderModalProps {
  harnesses: AgentHarness[];
  models: ModelConfig[];
  onUpdateHarnesses: (harnesses: AgentHarness[]) => void;
  onDispatchTask: (taskPrompt: string, selectedHarnessIds: string[]) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiHerderModal({
  harnesses,
  models,
  onUpdateHarnesses,
  onDispatchTask,
  onClose,
  currentTheme,
}: TuiHerderModalProps) {
  const theme = THEMES[currentTheme];

  const [activeTab, setActiveTab] = useState<'harnesses' | 'orchestrate' | 'new'>('harnesses');
  const [globalTask, setGlobalTask] = useState('');
  const [selectedHarnessIds, setSelectedHarnessIds] = useState<string[]>(
    harnesses.filter(h => h.enabled).map(h => h.id)
  );

  // New harness state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Code Architect');
  const [newModelId, setNewModelId] = useState(models[0]?.id || 'gemini-2.5-flash');
  const [newPrompt, setNewPrompt] = useState('You are an expert autonomous sub-agent focusing on code quality, testing, and implementation.');
  const [newIcon, setNewIcon] = useState<AgentHarness['avatarIcon']>('bot');

  const handleToggleHarness = (id: string) => {
    const updated = harnesses.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h);
    onUpdateHarnesses(updated);
  };

  const handleDeleteHarness = (id: string) => {
    onUpdateHarnesses(harnesses.filter(h => h.id !== id));
  };

  const handleCreateHarness = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newHarness: AgentHarness = {
      id: `harness-${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim(),
      modelId: newModelId,
      systemPrompt: newPrompt.trim(),
      avatarIcon: newIcon,
      status: 'idle',
      enabled: true,
      tasksCompleted: 0,
      lastLog: 'Harness initialized and ready.',
    };

    onUpdateHarnesses([...harnesses, newHarness]);
    setNewName('');
    setActiveTab('harnesses');
  };

  const handleRunAllHarnesses = () => {
    if (!globalTask.trim()) return;
    onDispatchTask(globalTask.trim(), selectedHarnessIds);
    setGlobalTask('');
    onClose();
  };

  const getIcon = (iconType: AgentHarness['avatarIcon']) => {
    switch (iconType) {
      case 'code': return <Code className="w-4 h-4 text-sky-400" />;
      case 'shield': return <Shield className="w-4 h-4 text-purple-400" />;
      case 'brain': return <Brain className="w-4 h-4 text-amber-400" />;
      case 'zap': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'bug': return <Bug className="w-4 h-4 text-rose-400" />;
      case 'terminal': return <Terminal className="w-4 h-4 text-emerald-400" />;
      default: return <Bot className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getStatusBadge = (status: AgentHarness['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse">
            <Activity className="w-3 h-3 animate-spin" /> RUNNING
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> DONE
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" /> ERROR
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
            IDLE
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-4xl max-h-[85vh] rounded-lg border shadow-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header Bar */}
        <div 
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: theme.border }}
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: theme.primary }} />
            <span className="font-bold text-base" style={{ color: theme.primary }}>
              AGENT HARNESS HERDER
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Multi-Agent Orchestrator
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b px-5 pt-2 gap-2" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setActiveTab('harnesses')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'harnesses'
                ? 'bg-white/10 text-white border-white/20'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Active Harnesses ({harnesses.length})
          </button>

          <button
            onClick={() => setActiveTab('orchestrate')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'orchestrate'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Dispatch Swarm Task
          </button>

          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-xs font-bold rounded-t border-t border-x transition-colors flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Add Agent Harness
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'harnesses' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 bg-white/5 p-3 rounded border" style={{ borderColor: theme.border }}>
                🤖 <strong className="text-white">Agent Herder</strong> coordinates multiple specialized execution harnesses working simultaneously on codebase analysis, automated feature design, security validation, and QA refactoring.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {harnesses.map((harness) => (
                  <div
                    key={harness.id}
                    className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${
                      harness.enabled
                        ? 'bg-white/5 border-white/20'
                        : 'bg-black/20 border-white/5 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded bg-white/10 border border-white/10">
                            {getIcon(harness.avatarIcon)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                              {harness.name}
                            </h4>
                            <span className="text-[11px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">
                              {harness.role}
                            </span>
                          </div>
                        </div>
                        {getStatusBadge(harness.status)}
                      </div>

                      <div className="text-xs text-slate-300 my-2 line-clamp-2 bg-black/30 p-2 rounded border border-white/5">
                        <span className="text-slate-500 select-none">Prompt: </span>
                        {harness.systemPrompt}
                      </div>

                      {harness.assignedTask && (
                        <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20 mb-2">
                          <strong>Active Task:</strong> {harness.assignedTask}
                        </div>
                      )}

                      {harness.lastLog && (
                        <div className="text-[10px] text-slate-400 font-mono bg-black/50 p-2 rounded border border-white/5 truncate">
                          &gt; {harness.lastLog}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t pt-3 mt-3 text-xs" style={{ borderColor: theme.border }}>
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Cpu className="w-3 h-3 text-cyan-400" />
                        <span>{models.find(m => m.id === harness.modelId)?.name || harness.modelId}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleHarness(harness.id)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                            harness.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          {harness.enabled ? 'ACTIVE' : 'PAUSED'}
                        </button>
                        <button
                          onClick={() => handleDeleteHarness(harness.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Remove Harness"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orchestrate' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 space-y-3">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Dispatch Swarm Objective
                </h3>
                <p className="text-xs text-slate-300">
                  Broadcast a single development task or security goal across all selected sub-agent harnesses in the Herder swarm.
                </p>

                <textarea
                  value={globalTask}
                  onChange={(e) => setGlobalTask(e.target.value)}
                  placeholder="e.g. Audit all API route handlers, write unit tests for chat history storage, and refactor command menu layout..."
                  className="w-full h-28 p-3 rounded bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono resize-none"
                />

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold block">
                    Select Target Agent Harnesses to Dispatch:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {harnesses.map((h) => {
                      const isSelected = selectedHarnessIds.includes(h.id);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedHarnessIds(selectedHarnessIds.filter(id => id !== h.id));
                            } else {
                              setSelectedHarnessIds([...selectedHarnessIds, h.id]);
                            }
                          }}
                          className={`p-2.5 rounded text-left border transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-500/50 text-purple-200'
                              : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getIcon(h.avatarIcon)}
                            <span className="font-bold">{h.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                            {h.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleRunAllHarnesses}
                    disabled={!globalTask.trim() || selectedHarnessIds.length === 0}
                    className="px-5 py-2.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    DISPATCH TO {selectedHarnessIds.length} AGENT HARNESSES
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'new' && (
            <form onSubmit={handleCreateHarness} className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Custom Agent Harness
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Harness Name</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Bug Bounty API Audit Agent"
                      className="w-full p-2.5 rounded bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Specialized Role</label>
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="e.g. Code Reviewer / Pentester / QA"
                      className="w-full p-2.5 rounded bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">LLM Model API</label>
                    <select
                      value={newModelId}
                      onChange={(e) => setNewModelId(e.target.value)}
                      className="w-full p-2.5 rounded bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                          {m.name} ({m.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1 font-bold">Avatar Icon</label>
                    <div className="flex items-center gap-2 pt-1">
                      {(['bot', 'code', 'shield', 'brain', 'zap', 'bug', 'terminal'] as const).map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setNewIcon(ic)}
                          className={`p-2 rounded border transition-colors ${
                            newIcon === ic
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                              : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {getIcon(ic)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-bold">System Prompt / Instructions</label>
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    rows={4}
                    className="w-full p-3 rounded bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono resize-none"
                    placeholder="Describe agent focus, specialized knowledge, and instructions..."
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> ADD AGENT HARNESS TO HERDER
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
