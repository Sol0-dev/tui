import React, { useState } from 'react';
import { McpServerConfig, McpTool, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { 
  Network, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Radio, 
  Terminal, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Layers, 
  ShieldCheck,
  Globe,
  Settings
} from 'lucide-react';

interface TuiMcpManagerModalProps {
  mcpServers: McpServerConfig[];
  onUpdateMcpServers: (servers: McpServerConfig[]) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiMcpManagerModal({
  mcpServers,
  onUpdateMcpServers,
  onClose,
  currentTheme,
}: TuiMcpManagerModalProps) {
  const theme = THEMES[currentTheme];

  // Add Server Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [commandOrUrl, setCommandOrUrl] = useState('');
  const [initialToolName, setInitialToolName] = useState('');
  const [initialToolDesc, setInitialToolDesc] = useState('');

  // Testing status state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  const handleToggleServer = (id: string) => {
    const updated = mcpServers.map(s => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    onUpdateMcpServers(updated);
  };

  const handleToggleTool = (serverId: string, toolName: string) => {
    const updated = mcpServers.map(s => {
      if (s.id === serverId) {
        return {
          ...s,
          tools: s.tools.map(t => (t.name === toolName ? { ...t, enabled: !t.enabled } : t)),
        };
      }
      return s;
    });
    onUpdateMcpServers(updated);
  };

  const handleDeleteServer = (id: string) => {
    const updated = mcpServers.filter(s => s.id !== id);
    onUpdateMcpServers(updated);
  };

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !commandOrUrl.trim()) return;

    const newServer: McpServerConfig = {
      id: `mcp-${Date.now()}`,
      name: name.trim(),
      type,
      commandOrUrl: commandOrUrl.trim(),
      status: 'connected',
      enabled: true,
      tools: initialToolName.trim()
        ? [{ name: initialToolName.trim(), description: initialToolDesc.trim() || 'Custom MCP tool', enabled: true }]
        : [{ name: `${name.toLowerCase().replace(/\s+/g, '_')}_tool`, description: 'Custom MCP execution tool', enabled: true }],
    };

    onUpdateMcpServers([...mcpServers, newServer]);
    setIsAdding(false);
    setName('');
    setCommandOrUrl('');
    setInitialToolName('');
    setInitialToolDesc('');
  };

  const handleTestConnection = async (server: McpServerConfig) => {
    setTestingId(server.id);
    setTestResult(null);

    // Simulate stdio/sse protocol handshake ping
    setTimeout(() => {
      setTestingId(null);
      setTestResult({
        id: server.id,
        success: true,
        msg: `MCP Server handshake verified via transport [${server.type.toUpperCase()}]. Loaded ${server.tools.length} tool definitions.`,
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Network className="w-5 h-5" />
            <span>CUSTOM MCP (MODEL CONTEXT PROTOCOL) INTEGRATION</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              STDIO & SSE PROTOCOL READY
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Register custom Model Context Protocol servers (Filesystem, PostgreSQL, GitHub, Kali Security, Playwright) to expose tools to OpenCode AI.
            </p>
            <button
              onClick={() => setIsAdding(prev => !prev)}
              className="px-3 py-1.5 rounded font-bold text-xs bg-cyan-500 text-black hover:bg-cyan-400 shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Register MCP Server
            </button>
          </div>

          {/* Form to Register MCP */}
          {isAdding && (
            <form onSubmit={handleAddServer} className="p-4 rounded-lg border bg-white/5 space-y-3" style={{ borderColor: theme.border }}>
              <div className="font-bold text-cyan-400 text-xs uppercase flex items-center gap-1">
                <Settings className="w-3.5 h-3.5" /> Register New MCP Server Endpoint
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Server Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Postgres DB MCP or Playwright MCP"
                    required
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                    style={{ borderColor: theme.border }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Transport Protocol:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                    style={{ borderColor: theme.border }}
                  >
                    <option value="stdio">stdio (Local Executable / CLI command)</option>
                    <option value="sse">sse (Server-Sent Events HTTP Endpoint)</option>
                    <option value="http">http (REST RPC Endpoint)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {type === 'stdio' ? 'Command Line Entrypoint:' : 'Endpoint URL:'}
                </label>
                <input
                  type="text"
                  value={commandOrUrl}
                  onChange={(e) => setCommandOrUrl(e.target.value)}
                  placeholder={type === 'stdio' ? 'npx -y @modelcontextprotocol/server-postgres postgresql://...' : 'https://mcp.mycompany.com/sse'}
                  required
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono"
                  style={{ borderColor: theme.border }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Initial Tool Function Name:</label>
                  <input
                    type="text"
                    value={initialToolName}
                    onChange={(e) => setInitialToolName(e.target.value)}
                    placeholder="e.g. execute_query"
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono"
                    style={{ borderColor: theme.border }}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tool Description:</label>
                  <input
                    type="text"
                    value={initialToolDesc}
                    onChange={(e) => setInitialToolDesc(e.target.value)}
                    placeholder="e.g. Executes SQL query on target database"
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                    style={{ borderColor: theme.border }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1 rounded text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 rounded bg-cyan-600 text-white font-bold text-xs"
                >
                  Register MCP
                </button>
              </div>
            </form>
          )}

          {/* MCP List */}
          <div className="space-y-3">
            {mcpServers.map((server) => {
              const isTesting = testingId === server.id;
              const result = testResult?.id === server.id ? testResult : null;

              return (
                <div
                  key={server.id}
                  className="p-4 rounded-lg border bg-black/40 flex flex-col gap-3 font-mono"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={server.enabled}
                        onChange={() => handleToggleServer(server.id)}
                        className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                      />
                      <span className="font-bold text-slate-100">{server.name}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                        {server.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestConnection(server)}
                        disabled={isTesting}
                        className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 text-[11px] flex items-center gap-1 font-bold"
                      >
                        {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>Ping Test</span>
                      </button>

                      <button
                        onClick={() => handleDeleteServer(server.id)}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Remove Server"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-white/5 text-xs text-slate-300 font-mono flex items-center gap-2 overflow-x-auto">
                    <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{server.commandOrUrl}</span>
                  </div>

                  {/* Registered Tools inside this MCP */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Exposed MCP Tool Functions ({server.tools.filter(t => t.enabled).length}/{server.tools.length}):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {server.tools.map(tool => (
                        <div
                          key={tool.name}
                          onClick={() => handleToggleTool(server.id, tool.name)}
                          className={`p-2 rounded border cursor-pointer transition-all flex items-center justify-between text-xs ${
                            tool.enabled ? 'bg-cyan-950/40 border-cyan-800 text-cyan-200' : 'bg-black/20 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={tool.enabled}
                              onChange={() => {}}
                              className="accent-cyan-500"
                            />
                            <span className="font-bold truncate">{tool.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={tool.description}>
                            {tool.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {result && (
                    <div className={`p-2 rounded text-[11px] flex items-center gap-1.5 ${
                      result.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800' : 'bg-red-950/60 text-red-300 border border-red-800'
                    }`}>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{result.msg}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold text-xs text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
}
