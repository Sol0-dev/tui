import React, { useState } from 'react';
import { AgentGoal, GoalSubTask, TuiTheme } from '../types';
import { THEMES } from '../constants';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  X, 
  ListTodo, 
  Sparkles, 
  Check, 
  ArrowRight
} from 'lucide-react';

interface TuiGoalManagerModalProps {
  goals: AgentGoal[];
  onUpdateGoals: (goals: AgentGoal[]) => void;
  onExecuteGoalStep: (goal: AgentGoal, task: GoalSubTask) => void;
  onClose: () => void;
  currentTheme: TuiTheme;
}

export function TuiGoalManagerModal({
  goals,
  onUpdateGoals,
  onExecuteGoalStep,
  onClose,
  currentTheme,
}: TuiGoalManagerModalProps) {
  const theme = THEMES[currentTheme];

  const [isAdding, setIsAdding] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [initialTaskInputs, setInitialTaskInputs] = useState<string>('Inspect project files\nImplement core requested feature\nVerify linting and build outputs\nFinalize documentation');

  const handleToggleTaskStatus = (goalId: string, taskId: string) => {
    const updated = goals.map(g => {
      if (g.id === goalId) {
        const nextTasks = g.tasks.map(t => {
          if (t.id === taskId) {
            const nextStatus: GoalSubTask['status'] = 
              t.status === 'completed' ? 'pending' : t.status === 'pending' ? 'in_progress' : 'completed';
            return { ...t, status: nextStatus };
          }
          return t;
        });

        const completedCount = nextTasks.filter(t => t.status === 'completed').length;
        const progress = nextTasks.length > 0 ? Math.round((completedCount / nextTasks.length) * 100) : 0;
        const status = progress === 100 ? 'completed' as const : 'active' as const;

        return { ...g, tasks: nextTasks, progress, status, updatedAt: Date.now() };
      }
      return g;
    });

    onUpdateGoals(updated);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    const rawTasks = initialTaskInputs
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    const subTasks: GoalSubTask[] = rawTasks.map((title, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      title,
      status: idx === 0 ? 'in_progress' : 'pending',
    }));

    const newGoal: AgentGoal = {
      id: `goal-${Date.now()}`,
      title: goalTitle.trim(),
      status: 'active',
      progress: 0,
      tasks: subTasks,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onUpdateGoals([newGoal, ...goals]);
    setIsAdding(false);
    setGoalTitle('');
  };

  const handleDeleteGoal = (goalId: string) => {
    onUpdateGoals(goals.filter(g => g.id !== goalId));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div 
        className="w-full max-w-3xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Target className="w-5 h-5" />
            <span>AGENT /GOAL OBJECTIVES & MULTI-STEP TRACKER</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Break down complex development objectives into sequential sub-tasks that the OpenCode AI agent executes step-by-step.
            </p>
            <button
              onClick={() => setIsAdding(prev => !prev)}
              className="px-3 py-1.5 rounded font-bold text-xs bg-amber-500 text-black hover:bg-amber-400 shrink-0 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> New Goal Objective
            </button>
          </div>

          {/* Goal Creation Form */}
          {isAdding && (
            <form onSubmit={handleCreateGoal} className="p-4 rounded-lg border bg-white/5 space-y-3" style={{ borderColor: theme.border }}>
              <div className="font-bold text-amber-400 text-xs uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Define Goal Objective (/goal)
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Goal Objective Title:</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Build dark mode toggle and persist user preferences in localStorage"
                  required
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none"
                  style={{ borderColor: theme.border }}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Sequential Sub-Tasks Breakdown (one per line):</label>
                <textarea
                  value={initialTaskInputs}
                  onChange={(e) => setInitialTaskInputs(e.target.value)}
                  rows={4}
                  className="w-full bg-black/40 border rounded p-2 text-xs text-slate-100 outline-none font-mono"
                  style={{ borderColor: theme.border }}
                />
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
                  className="px-4 py-1 rounded bg-amber-600 text-white font-bold text-xs"
                >
                  Save Goal
                </button>
              </div>
            </form>
          )}

          {/* Goals List */}
          <div className="space-y-4">
            {goals.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed rounded-lg" style={{ borderColor: theme.border }}>
                No active multi-step goals set. Type <code className="text-amber-400">/goal &lt;your objective&gt;</code> in the command bar to start tracking.
              </div>
            ) : (
              goals.map((goal) => {
                const nextPendingTask = goal.tasks.find(t => t.status === 'in_progress' || t.status === 'pending');

                return (
                  <div
                    key={goal.id}
                    className="p-4 rounded-lg border bg-black/40 flex flex-col gap-3 font-mono"
                    style={{ borderColor: theme.border }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-bold text-slate-100">{goal.title}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                          goal.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {goal.progress}% Completed
                        </span>

                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1 text-slate-500 hover:text-red-400"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-1.5 pt-1">
                      {goal.tasks.map((task, idx) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors text-xs"
                        >
                          <div 
                            onClick={() => handleToggleTaskStatus(goal.id, task.id)}
                            className="flex items-center gap-2 cursor-pointer select-none truncate"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : task.status === 'in_progress' ? (
                              <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className={task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200 font-bold'}>
                              {idx + 1}. {task.title}
                            </span>
                          </div>

                          {task.status !== 'completed' && (
                            <button
                              onClick={() => {
                                onExecuteGoalStep(goal, task);
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 shrink-0"
                            >
                              <span>Agent Run Step</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
