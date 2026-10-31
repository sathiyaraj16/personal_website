import React, { useMemo } from 'react';
import { Zap, PieChart, Sparkles, Inbox } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskCategory } from '../types/task';

interface CategoryMetric {
  name: TaskCategory;
  count: number;
  percent: number;
  color: string;
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Work: 'bg-[#3B82F6]',
  Projects: 'bg-indigo-500',
  Study: 'bg-purple-500',
  Personal: 'bg-emerald-500',
  Other: 'bg-[#75A7FF]',
};

export const ProductivitySummaryCard: React.FC = () => {
  const { tasks, stats } = useTasks();

  const categoryDistribution = useMemo<CategoryMetric[]>(() => {
    if (tasks.length === 0) return [];

    const counts: Partial<Record<TaskCategory, number>> = {};
    for (const task of tasks) {
      const cat = task.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const categories = Object.entries(counts) as [TaskCategory, number][];
    // Sort descending by count
    categories.sort((a, b) => b[1] - a[1]);

    return categories.map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / tasks.length) * 100),
      color: CATEGORY_COLORS[name] || 'bg-[#75A7FF]',
    }));
  }, [tasks]);

  return (
    <div className="rounded-2xl bg-[#112541] text-[#F8FAFC] p-6 sm:p-7 shadow-lg shadow-black/20 border border-[#263F63] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#263F63]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
              Productivity Summary
            </h3>
            <span className="text-[11px] font-bold text-[#75A7FF] bg-[#162D4D] border border-[#263F63] px-2.5 py-0.5 rounded-full">
              Live
            </span>
          </div>
          <p className="text-xs text-[#A9BAD4] mt-0.5">
            Focus allocation across real work categories.
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#162D4D] text-[#75A7FF] border border-[#263F63] flex items-center justify-center flex-shrink-0">
          <PieChart className="w-5 h-5" />
        </div>
      </div>

      {/* Progress & Target Section */}
      <div className="my-5 p-4 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#75A7FF] flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#A9BAD4] block">Deliverables</span>
            <span className="text-lg font-black text-[#F8FAFC]">
              {stats.completed} / {stats.total} Tasks
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-xs font-bold block ${stats.rate >= 60 ? 'text-emerald-400' : 'text-[#75A7FF]'}`}>
            {stats.rate}% Completed
          </span>
          <span className="text-[11px] text-[#7890B2]">
            {stats.total === 0
              ? 'No active deliverables'
              : stats.rate === 100
              ? 'All deliverables finished'
              : `${stats.inProgress} in progress`}
          </span>
        </div>
      </div>

      {/* Category Distribution or Clean Empty State */}
      {categoryDistribution.length === 0 ? (
        <div className="py-8 px-4 rounded-xl border border-dashed border-[#263F63] flex flex-col items-center justify-center text-center space-y-2 bg-[#162D4D]/20">
          <div className="w-10 h-10 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#7890B2]">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-[#F8FAFC]">No category distribution</p>
          <p className="text-[11px] text-[#7890B2] max-w-xs leading-relaxed">
            Assign categories (Work, Projects, Study, Personal) when creating tasks to see your workload breakdown.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-[#081426] border border-[#263F63]/50">
            {categoryDistribution.map((c) => (
              <div
                key={c.name}
                className={`h-full ${c.color} transition-all duration-500`}
                style={{ width: `${c.percent}%` }}
                title={`${c.name}: ${c.count} tasks (${c.percent}%)`}
              />
            ))}
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            {categoryDistribution.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[#A9BAD4]">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${c.color} flex-shrink-0`} />
                  <span className="font-medium text-[#F8FAFC]">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-[#F8FAFC]">
                    {c.count} {c.count === 1 ? 'task' : 'tasks'}
                  </span>
                  <span className="text-[#7890B2] text-[11px]">({c.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 mt-4 border-t border-[#263F63] flex items-center justify-between text-[11px] text-[#A9BAD4]">
        <span className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#75A7FF]" />
          Authenticated category breakdown
        </span>
        <span className="font-mono text-[#7890B2]">
          {tasks.length} {tasks.length === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
};
