import React, { useState } from 'react';
import { ChatSession, TuiTheme, ModelConfig } from '../types';
import { THEMES } from '../constants';
import { 
  History, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Zap, 
  Cpu, 
  DollarSign, 
  Layers, 
  Download,
  Brain
} from 'lucide-react';

interface TuiChatHistoryDrawerProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onCompactSession: (id: string) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
  currentModel: ModelConfig;
}

export function TuiChatHistoryDrawer({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  onRenameSession,
  onCompactSession,
  onClose,
  currentTheme,
  currentModel,
}: TuiChatHistoryDrawerProps) {
  const theme = THEMES[currentTheme];
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.messages.some(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end font-mono select-none">
      <div 
        className="w-full max-w-md h-full border-l flex flex-col shadow-2xl animate-slide-left"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <History className="w-5 h-5" />
            <span>CHAT HISTORY & CONTEXT</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
              {sessions.length} Saved
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Search Bar */}
        <div className="p-3 border-b space-y-2" style={{ borderColor: theme.border }}>
          <button
            onClick={() => {
              onCreateNewSession();
              onClose();
            }}
            className="w-full py-2 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all text-black"
            style={{ backgroundColor: theme.primary }}
          >
            <Plus className="w-4 h-4" /> Start New AI Chat Session
          </button>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chat history..."
              className="w-full bg-black/40 border rounded px-3 py-1.5 pl-8 text-xs text-slate-100 outline-none"
              style={{ borderColor: theme.border }}
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingId === session.id;

            const totalTokens = (session.stats?.totalInputTokens || 0) + (session.stats?.totalOutputTokens || 0);

            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1.5 ${
                  isActive
                    ? 'bg-white/15 border-sky-400 font-bold shadow-md'
                    : 'bg-black/30 hover:bg-white/5 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  {isEditing ? (
                    <form onSubmit={(e) => handleSaveRename(session.id, e)} className="flex items-center gap-1 flex-1 mr-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        autoFocus
                        className="bg-black/60 border rounded px-2 py-0.5 text-xs text-white outline-none flex-1 font-mono"
                        style={{ borderColor: theme.border }}
                      />
                      <button type="submit" className="p-1 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <span className="font-bold text-slate-100 text-xs truncate flex-1 pr-2">
                      {session.title}
                    </span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleStartRename(session, e)}
                      className="p-1 text-slate-500 hover:text-slate-300"
                      title="Rename Title"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete session "${session.title}"?`)) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Session Meta Stats */}
                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-sky-400" />
                    {session.modelId}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    {session.messages.length} msgs
                  </span>
                  <span className="text-amber-400">
                    ${session.stats?.totalCost?.toFixed(4) || '0.0000'}
                  </span>
                </div>

                {/* Compact Context Memory Trigger */}
                {isActive && session.messages.length > 3 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompactSession(session.id);
                    }}
                    className="mt-1 w-full py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Compact Context Memory ({totalTokens} tokens)
                  </button>
                )}
              </div>
            );
          })}

          {filteredSessions.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching chat sessions found.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t text-[11px] text-slate-500 flex justify-between" style={{ borderColor: theme.border }}>
          <span>Session Auto-Saved</span>
          <span className="text-emerald-400 font-bold">READY</span>
        </div>
      </div>
    </div>
  );
}
