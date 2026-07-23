import React, { useState, useEffect } from 'react';
import { AgentLoopConfig, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { 
  Repeat, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  X, 
  Clock, 
  Check, 
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface TuiLoopManagerModalProps {
  loops: AgentLoopConfig[];
  onUpdateLoops: (loops: AgentLoopConfig[]) => void;
  onRunLoopIteration: (loop: AgentLoopConfig) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiLoopManagerModal({
  loops,
  onUpdateLoops,
  onRunLoopIteration,
  onClose,
  currentTheme,
}: TuiLoopManagerModalProps) {
  const theme = THEMES[currentTheme];

  const [isAdding, setIsAdding] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [intervalSec, setIntervalSec] = useState<number>(15);
  const [maxIterations, setMaxIterations] = useState<number>(5);

  const handleToggleLoopRun = (id: string) => {
    const updated = loops.map(l => (l.id === id ? { ...l, isRunning: !l.isRunning } : l));
    onUpdateLoops(updated);
  };

  const handleDeleteLoop = (id: string) => {
    onUpdateLoops(loops.filter(l => l.id !== id));
  };

  const handleCreateLoop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const newLoop: AgentLoopConfig = {
      id: `loop-${Date.now()}`,
      intervalSec,
      prompt: prompt.trim(),
      isRunning: true,
      currentIteration: 0,
      maxIterations,
      lastRunTime: Date.now(),
    };

    onUpdateLoops([...loops, newLoop]);
    setIsAdding(false);
    setPrompt('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Repeat className="w-5 h-5" />
            <span>RECURRING AGENT /LOOP CONTROLLER</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              PERIODIC SCHEDULER
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
              Configure recurring execution loops (e.g. periodically run tests, check git diffs, poll server endpoints, or auto-refactor).
            </p>
            <button
              onClick={() => setIsAdding(prev => !prev)}
              className="px-3 py-1.5 rounded font-bold text-xs bg-rose-500 text-black hover:bg-rose-400 shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Create Agent Loop
            </button>
          </div>

          {/* New Loop Form */}
          {isAdding && (
            <form onSubmit={handleCreateLoop} className="p-4 rounded-lg border bg-white/5 space-y-3" style={{ borderColor: theme.border }}>
              <div className="font-bold text-rose-400 text-xs uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Configure Recurring Loop (/loop)
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Agent Prompt or Command:</label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Inspect workspace code and fix any pending TypeScript errors"
                  required
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                  style={{ borderColor: theme.border }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Interval (seconds):</label>
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                    style={{ borderColor: theme.border }}
                  >
                    <option value={5}>Every 5 Seconds (Fast Test)</option>
                    <option value={10}>Every 10 Seconds</option>
                    <option value={15}>Every 15 Seconds</option>
                    <option value={30}>Every 30 Seconds</option>
                    <option value={60}>Every 60 Seconds (1 minute)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Max Iterations (0 = infinite):</label>
                  <input
                    type="number"
                    value={maxIterations}
                    onChange={(e) => setMaxIterations(Number(e.target.value))}
                    min={0}
                    max={100}
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
                  className="px-4 py-1 rounded bg-rose-600 text-white font-bold text-xs"
                >
                  Start Loop
                </button>
              </div>
            </form>
          )}

          {/* Active Loops List */}
          <div className="space-y-3">
            {loops.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg" style={{ borderColor: theme.border }}>
                No active recurring loops running. Type <code className="text-rose-400">/loop 15s check code build</code> to create one.
              </div>
            ) : (
              loops.map((loop) => (
                <div
                  key={loop.id}
                  className="p-4 rounded-lg border bg-black/40 flex flex-col gap-3 font-mono"
                  style={{ borderColor: theme.border }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Repeat className={`w-4 h-4 ${loop.isRunning ? 'text-rose-400 animate-spin' : 'text-slate-500'}`} />
                      <span className="font-bold text-slate-100">{loop.prompt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                        loop.isRunning ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {loop.isRunning ? 'RUNNING' : 'PAUSED'}
                      </span>

                      <button
                        onClick={() => handleToggleLoopRun(loop.id)}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-200"
                        title={loop.isRunning ? 'Pause Loop' : 'Resume Loop'}
                      >
                        {loop.isRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                      </button>

                      <button
                        onClick={() => {
                          onRunLoopIteration(loop);
                          onClose();
                        }}
                        className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1"
                        title="Trigger Instant Iteration"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Trigger Now</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLoop(loop.id)}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Delete Loop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 bg-white/5 p-2 rounded">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-400" />
                      <span>Interval: <strong className="text-slate-200">{loop.intervalSec}s</strong></span>
                    </div>

                    <div>
                      <span>Iterations: <strong className="text-slate-200">{loop.currentIteration} / {loop.maxIterations || '∞'}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
