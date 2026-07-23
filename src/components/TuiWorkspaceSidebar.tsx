import React, { useState } from 'react';
import { WorkspaceFile, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { 
  FileCode, 
  Folder, 
  FolderOpen, 
  Trash2, 
  FilePlus, 
  ChevronRight, 
  ChevronDown,
  FolderKanban,
  CheckCircle,
  Bot,
  Sparkles,
  Layers,
  FileText
} from 'lucide-react';

interface TuiWorkspaceSidebarProps {
  files: WorkspaceFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onOpenWorkspaceModal: () => void;
  currentTheme: TuiTheme;
}

export function TuiWorkspaceSidebar({
  files,
  activeFilePath,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onOpenWorkspaceModal,
  currentTheme,
}: TuiWorkspaceSidebarProps) {
  const theme = THEMES[currentTheme];
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderName: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const getLanguageColor = (lang: string, path: string) => {
    if (path.endsWith('.md')) return 'text-purple-400';
    if (path.endsWith('.json')) return 'text-amber-400';
    switch (lang.toLowerCase()) {
      case 'typescript':
      case 'tsx':
        return 'text-sky-400';
      case 'javascript':
      case 'jsx':
        return 'text-yellow-400';
      case 'python':
        return 'text-emerald-400';
      default:
        return 'text-slate-400';
    }
  };

  // Filter out non-workspace files like src/ or package.json
  const displayFiles = files.filter(
    f =>
      !f.path.startsWith('src/') &&
      f.path !== 'package.json' &&
      f.path !== 'package-lock.json' &&
      !f.path.startsWith('dist/') &&
      !f.path.startsWith('node_modules/')
  );

  // Group files into root vs directory sections
  const rootFiles: WorkspaceFile[] = [];
  const agentsFiles: WorkspaceFile[] = [];
  const skillsFiles: WorkspaceFile[] = [];
  const mcpFiles: WorkspaceFile[] = [];
  const otherFiles: WorkspaceFile[] = [];

  displayFiles.forEach(f => {
    if (f.path.startsWith('agents/')) {
      agentsFiles.push(f);
    } else if (f.path.startsWith('skills/')) {
      skillsFiles.push(f);
    } else if (f.path.startsWith('mcp/') || f.path.startsWith('mcps/')) {
      mcpFiles.push(f);
    } else if (!f.path.includes('/')) {
      rootFiles.push(f);
    } else {
      otherFiles.push(f);
    }
  });

  const renderFileItem = (file: WorkspaceFile, prefixToRemove?: string) => {
    const isActive = file.path === activeFilePath;
    const displayName = prefixToRemove && file.path.startsWith(prefixToRemove)
      ? file.path.slice(prefixToRemove.length)
      : file.path;

    return (
      <div
        key={file.path}
        onClick={() => onSelectFile(file.path)}
        className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer group transition-colors text-xs ml-2 ${
          isActive
            ? 'bg-white/15 font-bold border-l-2 text-white'
            : 'hover:bg-white/5 text-slate-300'
        }`}
        style={{ borderColor: isActive ? theme.primary : 'transparent' }}
      >
        <div className="flex items-center gap-2 truncate">
          <FileText className={`w-3.5 h-3.5 shrink-0 ${getLanguageColor(file.language, file.path)}`} />
          <span className="truncate">{displayName}</span>
          {file.modified && (
            <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold shrink-0">
              M
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete workspace file ${file.path}?`)) {
              onDeleteFile(file.path);
            }
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
          title="Delete File"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <aside 
      className="w-64 border-r flex flex-col h-full font-mono text-xs select-none"
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
    >
      {/* Workspace Header */}
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <FolderKanban className="w-4 h-4 text-emerald-400" />
          <span>DIRECTORY WORKSPACE</span>
          <span className="text-[10px] text-slate-500 font-normal">({files.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(prev => !prev)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Create File in Directory"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenWorkspaceModal}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Switch Preset Directory Workspace"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-2 border-b bg-white/5" style={{ borderColor: theme.border }}>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. agents/new-agent/AGENTS.md"
            autoFocus
            className="w-full bg-black/40 border rounded px-2 py-1 text-xs text-slate-100 outline-none"
            style={{ borderColor: theme.border }}
          />
          <div className="flex justify-between items-center mt-1.5 text-[10px]">
            <span className="text-slate-500">agents/ | skills/ | mcp/</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-0.5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold rounded"
              >
                Create
              </button>
            </div>
          </div>
        </form>
      )}

      {/* File List Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Root Directory Files */}
        {rootFiles.length > 0 && (
          <div className="space-y-1">
            <div className="px-1 text-[10px] font-bold text-slate-500 tracking-wider">ROOT DIRECTORY</div>
            {rootFiles.map(f => renderFileItem(f))}
          </div>
        )}

        {/* agents/ Directory */}
        <div className="space-y-1">
          <div 
            onClick={() => toggleFolder('agents')}
            className="flex items-center justify-between px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer text-purple-300 font-bold"
          >
            <div className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>agents/</span>
              <span className="text-[10px] font-normal text-slate-500">({agentsFiles.length})</span>
            </div>
            {collapsedFolders['agents'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {!collapsedFolders['agents'] && (
            <div className="space-y-0.5 pl-1">
              {agentsFiles.map(f => renderFileItem(f, 'agents/'))}
            </div>
          )}
        </div>

        {/* skills/ Directory */}
        <div className="space-y-1">
          <div 
            onClick={() => toggleFolder('skills')}
            className="flex items-center justify-between px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer text-emerald-300 font-bold"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>skills/</span>
              <span className="text-[10px] font-normal text-slate-500">({skillsFiles.length})</span>
            </div>
            {collapsedFolders['skills'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {!collapsedFolders['skills'] && (
            <div className="space-y-0.5 pl-1">
              {skillsFiles.map(f => renderFileItem(f, 'skills/'))}
            </div>
          )}
        </div>

        {/* mcp/ Directory */}
        <div className="space-y-1">
          <div 
            onClick={() => toggleFolder('mcp')}
            className="flex items-center justify-between px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 cursor-pointer text-amber-300 font-bold"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>mcp/</span>
              <span className="text-[10px] font-normal text-slate-500">({mcpFiles.length})</span>
            </div>
            {collapsedFolders['mcp'] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
          {!collapsedFolders['mcp'] && (
            <div className="space-y-0.5 pl-1">
              {mcpFiles.map(f => renderFileItem(f, f.path.startsWith('mcps/') ? 'mcps/' : 'mcp/'))}
            </div>
          )}
        </div>

        {/* Other Custom Files */}
        {otherFiles.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="px-1 text-[10px] font-bold text-slate-500 tracking-wider">OTHER FILES</div>
            {otherFiles.map(f => renderFileItem(f))}
          </div>
        )}

        {files.length === 0 && (
          <div className="text-center text-slate-500 p-4">
            No files in workspace.<br />
            Click <span className="text-slate-300 underline cursor-pointer" onClick={() => setIsCreating(true)}>Create File</span> to add one.
          </div>
        )}
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-2.5 border-t text-[11px] text-slate-500 flex items-center justify-between" style={{ borderColor: theme.border }}>
        <span>ACY Workspace Directory</span>
        <span className="text-emerald-400 flex items-center gap-1 font-bold">
          <CheckCircle className="w-3 h-3" /> ACTIVE
        </span>
      </div>
    </aside>
  );
}

