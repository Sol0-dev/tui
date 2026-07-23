import React from 'react';
import { WorkspaceFile, TuiTheme } from '../types';
import { THEMES } from '../constants';
import * as Diff from 'diff';
import { GitCompare, Check, RotateCcw, X, FileCode } from 'lucide-react';

interface TuiDiffViewerProps {
  files: WorkspaceFile[];
  onAcceptDiff: (filePath: string) => void;
  onRevertDiff: (filePath: string) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
  selectedFilePath?: string;
}

export function TuiDiffViewer({
  files,
  onAcceptDiff,
  onRevertDiff,
  onClose,
  currentTheme,
  selectedFilePath,
}: TuiDiffViewerProps) {
  const theme = THEMES[currentTheme];
  const modifiedFiles = files.filter(f => f.modified || f.originalContent !== undefined);

  const [activeFile, setActiveFile] = React.useState<string>(
    selectedFilePath || (modifiedFiles[0]?.path || files[0]?.path || '')
  );

  const file = files.find(f => f.path === activeFile);

  const diffChunks = file ? Diff.diffLines(file.originalContent || '', file.content) : [];

  return (
    <div 
      className="flex-1 flex flex-col h-full font-mono text-xs select-none"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Header Bar */}
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2 font-bold text-sky-400">
          <GitCompare className="w-4 h-4" />
          <span>GIT DIFF VIEWER</span>
          <span className="text-[10px] text-slate-400">({modifiedFiles.length} modified files)</span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Modified Files Sidebar List */}
        <div className="w-56 border-r flex flex-col overflow-y-auto p-2 space-y-1" style={{ borderColor: theme.border }}>
          <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1">Modified Files</div>
          {modifiedFiles.map((mFile) => (
            <button
              key={mFile.path}
              onClick={() => setActiveFile(mFile.path)}
              className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                mFile.path === activeFile ? 'bg-white/15 text-white font-bold' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <span className="truncate">{mFile.path}</span>
              <span className="text-[10px] text-amber-400 font-bold">M</span>
            </button>
          ))}

          {modifiedFiles.length === 0 && (
            <div className="text-slate-500 p-3 text-center text-xs">
              No pending git diff changes in workspace.
            </div>
          )}
        </div>

        {/* Diff Content View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {file ? (
            <>
              {/* File Control Actions */}
              <div className="p-2 border-b bg-white/5 flex items-center justify-between" style={{ borderColor: theme.border }}>
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>{file.path}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRevertDiff(file.path)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Revert
                  </button>
                  <button
                    onClick={() => onAcceptDiff(file.path)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept Code
                  </button>
                </div>
              </div>

              {/* Diff Code Container */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm select-text whitespace-pre">
                {diffChunks.map((part, index) => {
                  const color = part.added
                    ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                    : part.removed
                    ? 'bg-red-950/60 text-red-300 border-l-2 border-red-500 line-through'
                    : 'text-slate-300';
                  const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';

                  return (
                    <div key={index} className={`${color} px-2 py-0.5 leading-relaxed`}>
                      {part.value.split('\n').filter(Boolean).map((line, lIdx) => (
                        <div key={lIdx}>
                          {prefix}{line}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Select a modified file to view diff patch.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
