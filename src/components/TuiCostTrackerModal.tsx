import React from 'react';
import { SessionStats, ModelConfig, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { DollarSign, X, Cpu, Zap, Activity, Layers, PieChart } from 'lucide-react';

interface TuiCostTrackerModalProps {
  stats: SessionStats;
  currentModel: ModelConfig;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiCostTrackerModal({
  stats,
  currentModel,
  onClose,
  currentTheme,
}: TuiCostTrackerModalProps) {
  const theme = THEMES[currentTheme];

  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
  const contextPct = Math.min(100, Math.round((totalTokens / currentModel.contextWindow) * 100));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <DollarSign className="w-5 h-5" />
            <span>TOKEN & COST ANALYTICS</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Total Cost Highlight */}
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800 flex justify-between items-center">
            <div>
              <div className="text-xs text-emerald-400 uppercase font-bold">Estimated Session Cost</div>
              <div className="text-3xl font-extrabold text-white mt-1">${stats.totalCost.toFixed(5)}</div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <div>Input Rate: ${currentModel.inputCostPer1M}/1M</div>
              <div>Output Rate: ${currentModel.outputCostPer1M}/1M</div>
            </div>
          </div>

          {/* Context Window Usage Bar */}
          <div className="p-3 rounded border space-y-1.5" style={{ borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Context Window Utilization:</span>
              <span className="text-sky-400">{totalTokens.toLocaleString()} / {currentModel.contextWindow.toLocaleString()} tokens ({contextPct}%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.max(5, contextPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 pt-0.5">
              Tip: Use <span className="font-bold underline text-amber-400">/compact</span> command if context window usage gets high.
            </div>
          </div>

          {/* Detailed Metric Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded border" style={{ borderColor: theme.border }}>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Input Tokens</div>
              <div className="text-lg font-bold text-sky-400 mt-0.5">{stats.totalInputTokens.toLocaleString()}</div>
            </div>

            <div className="p-3 rounded border" style={{ borderColor: theme.border }}>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Output Tokens</div>
              <div className="text-lg font-bold text-purple-400 mt-0.5">{stats.totalOutputTokens.toLocaleString()}</div>
            </div>

            <div className="p-3 rounded border" style={{ borderColor: theme.border }}>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Messages Exchanged</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{stats.messagesCount}</div>
            </div>

            <div className="p-3 rounded border" style={{ borderColor: theme.border }}>
              <div className="text-slate-400 text-[10px] uppercase font-bold">Tool Calls Executed</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">{stats.toolCallsCount}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold text-xs text-black"
            style={{ backgroundColor: theme.primary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
