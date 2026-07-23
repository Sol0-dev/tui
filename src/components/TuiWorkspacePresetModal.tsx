import React from 'react';
import { PresetProject, TuiTheme } from '../types';
import { PRESET_PROJECTS, THEMES } from '../constants';
import { FolderKanban, X, Check, Code2, Sparkles } from 'lucide-react';

interface TuiWorkspacePresetModalProps {
  onLoadPreset: (preset: PresetProject) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiWorkspacePresetModal({
  onLoadPreset,
  onClose,
  currentTheme,
}: TuiWorkspacePresetModalProps) {
  const theme = THEMES[currentTheme];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-xl rounded-xl border shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <FolderKanban className="w-5 h-5" />
            <span>SWITCH WORKSPACE TEMPLATE</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs sm:text-sm">
          <p className="text-slate-400 text-xs">
            Choose a workspace starter project to test OpenCode AI Coding Agent capabilities:
          </p>

          <div className="space-y-3">
            {PRESET_PROJECTS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => {
                  onLoadPreset(preset);
                  onClose();
                }}
                className="p-4 rounded-lg border bg-white/5 hover:bg-white/10 cursor-pointer transition-all border-slate-700 hover:border-sky-400 group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-100 text-sm group-hover:text-sky-300">
                    {preset.name}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">
                    {preset.files.length} Files
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
                <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-2">
                  <span>Files:</span>
                  {preset.files.map(f => (
                    <span key={f.path} className="px-1.5 py-0.5 bg-black/40 rounded border border-white/5 text-slate-300">
                      {f.path}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button onClick={onClose} className="px-4 py-1.5 rounded text-slate-400 hover:text-white text-xs">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
