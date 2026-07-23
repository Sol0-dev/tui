import React, { useState, useEffect } from 'react';
import { WorkspaceFile, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { Save, FileCode, Check, X, FileText } from 'lucide-react';

interface TuiFileEditorProps {
  file: WorkspaceFile | null;
  openFiles: WorkspaceFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onSaveFile: (path: string, newContent: string) => void;
  currentTheme: TuiTheme;
}

export function TuiFileEditor({
  file,
  openFiles,
  activeFilePath,
  onSelectFile,
  onCloseFile,
  onSaveFile,
  currentTheme,
}: TuiFileEditorProps) {
  const theme = THEMES[currentTheme];
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (file) {
      setContent(file.content);
      setIsSaved(false);
    }
  }, [file]);

  const handleSave = () => {
    if (!file) return;
    onSaveFile(file.path, content);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  if (!file || openFiles.length === 0) {
    return (
      <div 
        className="flex-1 flex flex-col items-center justify-center font-mono text-slate-500 text-sm p-6 select-none"
        style={{ backgroundColor: theme.bg }}
      >
        <FileCode className="w-12 h-12 mb-3 text-slate-600" />
        <p className="font-bold text-slate-400">No open files in editor</p>
        <p className="text-xs text-slate-600 mt-1 max-w-sm text-center">
          Click any file in the workspace directory sidebar to open it for editing.
        </p>
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div 
      className="flex-1 flex flex-col h-full font-mono text-xs select-none"
      style={{ backgroundColor: theme.bg }}
    >
      {/* File Tabs Bar */}
      <div 
        className="flex items-center overflow-x-auto border-b bg-black/40 scrollbar-none"
        style={{ borderColor: theme.border }}
      >
        {openFiles.map((openFile) => {
          const isActive = openFile.path === activeFilePath;
          return (
            <div
              key={openFile.path}
              onClick={() => onSelectFile(openFile.path)}
              className={`flex items-center gap-2 px-3 py-2 border-r cursor-pointer text-xs font-mono transition-colors group shrink-0 ${
                isActive
                  ? 'bg-white/10 text-slate-100 font-bold border-b-2 border-b-emerald-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
              style={{ borderColor: theme.border }}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className="truncate max-w-[160px]">{openFile.path}</span>

              {openFile.modified && (
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(openFile.path);
                }}
                className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-all ml-1"
                title={`Close ${openFile.path}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Header Bar for Active File */}
      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
        <div className="flex items-center gap-2 truncate">
          <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="font-bold text-slate-200 truncate">{file.path}</span>
          {file.modified && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold shrink-0">
              MODIFIED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1 rounded font-bold transition-all text-xs"
            style={{
              backgroundColor: isSaved ? '#10b981' : theme.primary,
              color: '#000',
            }}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Saved!' : 'Save Code'}</span>
          </button>

          <button
            onClick={() => onCloseFile(file.path)}
            className="p-1 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
            title="Close Active File"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers Column */}
        <div 
          className="w-12 py-3 select-none text-right pr-3 text-slate-600 border-r"
          style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          {lines.map((_, i) => (
            <div key={i} className="leading-5 h-5">{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent outline-none border-none text-slate-100 font-mono leading-5 resize-none overflow-y-auto whitespace-pre tab-4 text-xs sm:text-sm select-text"
        />
      </div>
    </div>
  );
}

