import React, { useState } from 'react';
import { SkillConfig, AgentInstructionsConfig, TuiTheme, CustomAgent, ModelConfig } from '../types';
import { THEMES } from '../constants';
import { 
  Sparkles, 
  FileText, 
  Check, 
  Plus, 
  Trash2, 
  X, 
  Sliders, 
  ShieldAlert, 
  Code2, 
  Terminal, 
  Wrench,
  BookOpen,
  Users,
  Bot,
  Brain,
  Shield,
  Zap,
  Bug
} from 'lucide-react';

interface TuiSkillsAndAgentsModalProps {
  skills: SkillConfig[];
  onUpdateSkills: (skills: SkillConfig[]) => void;
  agentConfig: AgentInstructionsConfig;
  onUpdateAgentConfig: (config: AgentInstructionsConfig) => void;
  customAgents?: CustomAgent[];
  onUpdateCustomAgents?: (agents: CustomAgent[]) => void;
  availableModels?: ModelConfig[];
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiSkillsAndAgentsModal({
  skills,
  onUpdateSkills,
  agentConfig,
  onUpdateAgentConfig,
  customAgents = [],
  onUpdateCustomAgents,
  availableModels = [],
  onClose,
  currentTheme,
}: TuiSkillsAndAgentsModalProps) {
  const theme = THEMES[currentTheme];
  const [activeTab, setActiveTab] = useState<'agents' | 'multi-agent' | 'skills'>('multi-agent');

  // AGENTS.md editing state
  const [agentsMdText, setAgentsMdText] = useState(agentConfig.agentsMdContent);
  const [activeProfile, setActiveProfile] = useState(agentConfig.activeAgentProfile);

  // New Skill form state
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<'code' | 'security' | 'devops' | 'custom'>('custom');
  const [newSkillContent, setNewSkillContent] = useState('');

  // Multi-Agent Creation Form state
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('Lead Architect');
  const [agentModelId, setAgentModelId] = useState('gemini-3.6-flash');
  const [agentSystemPrompt, setAgentSystemPrompt] = useState('');
  const [agentIcon, setAgentIcon] = useState<'bot' | 'code' | 'shield' | 'brain' | 'zap' | 'bug'>('bot');

  const handleToggleSkill = (id: string) => {
    const updated = skills.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onUpdateSkills(updated);
  };

  const handleDeleteSkill = (id: string) => {
    const updated = skills.filter(s => s.id !== id);
    onUpdateSkills(updated);
  };

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const newSkill: SkillConfig = {
      id: `skill-${Date.now()}`,
      name: newSkillName.trim(),
      description: newSkillDesc.trim() || 'Custom user defined agent skill.',
      category: newSkillCategory,
      enabled: true,
      content: newSkillContent.trim() || `# ${newSkillName}\n- Follow custom skill instructions during execution.`,
    };

    onUpdateSkills([...skills, newSkill]);
    setIsAddingSkill(false);
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillContent('');
  };

  const handleSaveAgentsConfig = () => {
    onUpdateAgentConfig({
      ...agentConfig,
      agentsMdContent: agentsMdText,
      activeAgentProfile: activeProfile,
    });
  };

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) return;

    const newAgent: CustomAgent = {
      id: `agent-${Date.now()}`,
      name: agentName.trim(),
      role: agentRole,
      modelId: agentModelId,
      systemPrompt: agentSystemPrompt.trim() || `You are ${agentName}, a specialized ${agentRole}. Provide high quality analysis and code updates.`,
      avatarIcon: agentIcon,
      enabled: true,
    };

    if (onUpdateCustomAgents) {
      onUpdateCustomAgents([...customAgents, newAgent]);
    }
    setIsCreatingAgent(false);
    setAgentName('');
    setAgentSystemPrompt('');
  };

  const handleToggleAgent = (id: string) => {
    if (!onUpdateCustomAgents) return;
    const updated = customAgents.map(a => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    onUpdateCustomAgents(updated);
  };

  const handleDeleteAgent = (id: string) => {
    if (!onUpdateCustomAgents) return;
    const updated = customAgents.filter(a => a.id !== id);
    onUpdateCustomAgents(updated);
  };

  const renderAgentIcon = (icon: CustomAgent['avatarIcon']) => {
    switch (icon) {
      case 'shield': return <Shield className="w-4 h-4 text-purple-400" />;
      case 'code': return <Code2 className="w-4 h-4 text-sky-400" />;
      case 'brain': return <Brain className="w-4 h-4 text-pink-400" />;
      case 'zap': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'bug': return <Bug className="w-4 h-4 text-rose-400" />;
      default: return <Bot className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Modal Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Users className="w-5 h-5 text-purple-400" />
            <span>MULTI-AGENT CREATOR & SKILLS MANAGER</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-4 pt-3 border-b flex gap-2 text-xs overflow-x-auto" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setActiveTab('multi-agent')}
            className={`px-3 py-1.5 rounded-t font-bold flex items-center gap-1.5 border-t border-x ${
              activeTab === 'multi-agent' 
                ? 'bg-white/10 text-amber-300 border-amber-500/40' 
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Multi-Agents ({customAgents.filter(a => a.enabled).length}/{customAgents.length})
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-3 py-1.5 rounded-t font-bold flex items-center gap-1.5 border-t border-x ${
              activeTab === 'agents' 
                ? 'bg-white/10 text-purple-300 border-purple-500/40' 
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> AGENTS.md Rules
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 rounded-t font-bold flex items-center gap-1.5 border-t border-x ${
              activeTab === 'skills' 
                ? 'bg-white/10 text-emerald-300 border-emerald-500/40' 
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Active Skills ({skills.filter(s => s.enabled).length}/{skills.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {activeTab === 'multi-agent' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-100 flex items-center gap-2">
                    <span>Multi-Agent Roster</span>
                  </h4>
                  <p className="text-xs text-slate-400">Create specialized AI sub-agents to assist in architecture, security, coding, and review.</p>
                </div>
                <button
                  onClick={() => setIsCreatingAgent(prev => !prev)}
                  className="px-3 py-1.5 rounded font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Create New Agent
                </button>
              </div>

              {/* Create Agent Form */}
              {isCreatingAgent && (
                <form onSubmit={handleCreateAgent} className="p-4 rounded-lg border bg-white/5 space-y-3" style={{ borderColor: theme.border }}>
                  <div className="font-bold text-amber-400 text-xs uppercase flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> New AI Agent Definition
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Agent Name:</label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="e.g. Kali Pentest Auditor"
                        required
                        className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                        style={{ borderColor: theme.border }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Specialized Role:</label>
                      <select
                        value={agentRole}
                        onChange={(e) => setAgentRole(e.target.value)}
                        className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                        style={{ borderColor: theme.border }}
                      >
                        <option value="Lead Architect">Lead System Architect</option>
                        <option value="Security Pentester">Security & Pentester</option>
                        <option value="Frontend Specialist">Frontend UI Specialist</option>
                        <option value="Backend Specialist">Backend & API Specialist</option>
                        <option value="Code Reviewer">Code Reviewer & Refactorer</option>
                        <option value="QA Test Engineer">QA & Unit Test Engineer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Model Engine:</label>
                      <select
                        value={agentModelId}
                        onChange={(e) => setAgentModelId(e.target.value)}
                        className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                        style={{ borderColor: theme.border }}
                      >
                        <option value="gemini-3.6-flash">Gemini 3.6 Flash (Fast reasoning)</option>
                        <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Precise coding)</option>
                        <option value="deepseek/deepseek-r1:free">OpenRouter DeepSeek R1 (Free)</option>
                        <option value="meta-llama/llama-3.3-70b-instruct:free">OpenRouter Llama 3.3 70B (Free)</option>
                        <option value="qwen-2.5-coder-32b">Local Ollama Qwen 2.5 Coder</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Avatar Badge Icon:</label>
                      <select
                        value={agentIcon}
                        onChange={(e) => setAgentIcon(e.target.value as any)}
                        className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                        style={{ borderColor: theme.border }}
                      >
                        <option value="bot">🤖 Bot</option>
                        <option value="shield">🛡️ Shield (Security)</option>
                        <option value="code">💻 Code</option>
                        <option value="brain">🧠 Brain (Architect)</option>
                        <option value="zap">⚡ Zap (Speed)</option>
                        <option value="bug">🐛 Bug (QA)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Agent System Prompt & Personality:</label>
                    <textarea
                      value={agentSystemPrompt}
                      onChange={(e) => setAgentSystemPrompt(e.target.value)}
                      rows={3}
                      placeholder="Custom instructions describing this sub-agent's perspective and responsibilities..."
                      className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono"
                      style={{ borderColor: theme.border }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingAgent(false)}
                      className="px-3 py-1 rounded text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded bg-amber-500 text-black font-bold text-xs"
                    >
                      Create Agent
                    </button>
                  </div>
                </form>
              )}

              {/* Roster List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-3.5 rounded-lg border bg-black/40 flex flex-col justify-between gap-2"
                    style={{ borderColor: theme.border }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={agent.enabled}
                            onChange={() => handleToggleAgent(agent.id)}
                            className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                          />
                          <div className="p-1 rounded bg-white/10">
                            {renderAgentIcon(agent.avatarIcon)}
                          </div>
                          <span className="font-bold text-slate-100">{agent.name}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteAgent(agent.id)}
                          className="p-1 text-slate-500 hover:text-red-400"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wide ml-6">
                        {agent.role} · <span className="text-sky-400">{agent.modelId}</span>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 bg-white/5 p-2 rounded text-[11px] font-mono line-clamp-3">
                        {agent.systemPrompt}
                      </p>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-[10px] text-slate-500" style={{ borderColor: theme.border }}>
                      <span>Status: {agent.enabled ? <span className="text-emerald-400 font-bold">Active</span> : 'Inactive'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'agents' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-100">Agent Persona Profile</h4>
                  <p className="text-xs text-slate-400">Custom workspace instructions without character or line limits</p>
                </div>
                <div className="flex gap-1">
                  {(['custom'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setActiveProfile(p)}
                      className="px-2.5 py-1 rounded text-xs capitalize font-bold border bg-purple-500/30 text-purple-300 border-purple-500 cursor-default"
                    >
                      Custom Profile
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-xs text-slate-300">
                    Workspace <code className="text-amber-400">AGENTS.md</code> System Rules
                  </label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    ✓ Unlimited Lines & Characters Supported
                  </span>
                </div>
                <textarea
                  value={agentsMdText}
                  onChange={(e) => setAgentsMdText(e.target.value)}
                  rows={14}
                  className="w-full bg-black/60 border rounded p-3 text-xs text-slate-200 font-mono outline-none focus:border-purple-500 min-h-[300px] resize-y overflow-y-auto"
                  style={{ borderColor: theme.border }}
                  placeholder="# Enter custom AGENTS.md system instructions (no line or character limits)..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveAgentsConfig}
                  className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save AGENTS.md Configuration
                </button>
              </div>
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400">
                    Custom skills extend ACY agent capabilities with domain instructions.
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ✓ Full unlimited skill instruction length & capacity
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingSkill(prev => !prev)}
                  className="px-3 py-1.5 rounded font-bold text-xs bg-emerald-500 text-black hover:bg-emerald-400 shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Create Custom Skill
                </button>
              </div>

              {/* Add Skill Form */}
              {isAddingSkill && (
                <form onSubmit={handleCreateSkill} className="p-4 rounded-lg border bg-white/5 space-y-3" style={{ borderColor: theme.border }}>
                  <div className="font-bold text-emerald-400 text-xs uppercase">New Skill Definition</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Skill Name:</label>
                      <input
                        type="text"
                        value={newSkillName}
                        onChange={(e) => setNewSkillName(e.target.value)}
                        placeholder="e.g. Custom Security Audit"
                        required
                        className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                        style={{ borderColor: theme.border }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Category:</label>
                      <select
                        value={newSkillCategory}
                        onChange={(e) => setNewSkillCategory(e.target.value as any)}
                        className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                        style={{ borderColor: theme.border }}
                      >
                        <option value="code">Code & Refactoring</option>
                        <option value="security">Security & Audit</option>
                        <option value="devops">DevOps & CI/CD</option>
                        <option value="custom">Custom Domain</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Description:</label>
                    <input
                      type="text"
                      value={newSkillDesc}
                      onChange={(e) => setNewSkillDesc(e.target.value)}
                      placeholder="Summary of when to apply this skill"
                      className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                      style={{ borderColor: theme.border }}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-slate-400">Skill Markdown Instructions:</label>
                      <span className="text-[10px] text-slate-500 font-mono">Unlimited lines & length</span>
                    </div>
                    <textarea
                      value={newSkillContent}
                      onChange={(e) => setNewSkillContent(e.target.value)}
                      rows={8}
                      placeholder="# Instructions for agent when this skill is invoked (no line or character limits)..."
                      className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono resize-y min-h-[160px] overflow-y-auto"
                      style={{ borderColor: theme.border }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingSkill(false)}
                      className="px-3 py-1 rounded text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded bg-emerald-600 text-white font-bold text-xs"
                    >
                      Save Skill
                    </button>
                  </div>
                </form>
              )}

              {/* Skills List */}
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-3.5 rounded-lg border bg-black/40 flex flex-col gap-2"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={skill.enabled}
                          onChange={() => handleToggleSkill(skill.id)}
                          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                        />
                        <span className="font-bold text-slate-100">{skill.name}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-white/10 text-emerald-400 font-bold">
                          {skill.category}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Delete Skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">{skill.description}</p>

                    <div className="bg-white/5 p-3 rounded text-[11px] font-mono text-slate-300 max-h-[500px] overflow-y-auto border border-white/5">
                      <pre className="whitespace-pre-wrap font-mono leading-relaxed">{skill.content}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold text-xs text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
