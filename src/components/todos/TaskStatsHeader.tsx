import React from 'react';
import { ListTodo, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { TaskStats } from '../../types/task';

interface TaskStatsHeaderProps {
  stats: TaskStats;
}

export const TaskStatsHeader: React.FC<TaskStatsHeaderProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      subtext: stats.total > 0 ? `${stats.rate}% completion velocity` : 'No tasks in workspace',
      icon: ListTodo,
      iconColor: 'text-[#75A7FF]',
      barColor: 'bg-[#3B82F6]',
      percent: stats.total > 0 ? 100 : 0,
    },
    {
      title: 'Completed',
      value: stats.completed,
      subtext: stats.total > 0 ? `${stats.completed} of ${stats.total} deliverables finished` : '0 deliverables finished',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      percent: stats.rate,
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      subtext: stats.inProgress > 0 ? `${stats.inProgress} actively being executed` : '0 in progress',
      icon: Clock,
      iconColor: 'text-[#75A7FF]',
      barColor: 'bg-[#60A5FA]',
      percent: stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0,
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      subtext: stats.overdue > 0 ? `${stats.overdue} require immediate action` : (stats.total > 0 ? 'All deadlines on schedule' : '0 overdue deliverables'),
      icon: AlertTriangle,
      iconColor: stats.overdue > 0 ? 'text-red-400' : 'text-emerald-400',
      barColor: stats.overdue > 0 ? 'bg-red-500' : 'bg-emerald-500',
      percent: stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="rounded-2xl bg-[#112541] text-[#F8FAFC] p-5 sm:p-6 shadow-lg shadow-black/20 border border-[#263F63] flex flex-col justify-between transition-all duration-200 hover:border-[#75A7FF]/40 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A9BAD4]">
                  {card.title}
                </span>
                <div className="text-3xl sm:text-4xl font-black font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight mt-1">
                  {card.value}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#263F63]/80 space-y-2">
              <div className="w-full bg-[#162D4D] rounded-full h-1.5 overflow-hidden border border-[#263F63]/40">
                <div
                  className={`h-1.5 rounded-full ${card.barColor} transition-all duration-500`}
                  style={{ width: `${card.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-[#7890B2] font-medium truncate">
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
