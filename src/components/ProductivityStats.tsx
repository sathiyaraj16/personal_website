import React from 'react';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendColor?: string;
  progressPercent?: number;
  progressBarColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendColor = 'text-emerald-400',
  progressPercent,
  progressBarColor = 'bg-[#3B82F6]',
}) => {
  return (
    <div className="rounded-2xl bg-[#112541] text-[#F8FAFC] p-6 sm:p-7 shadow-lg shadow-black/20 border border-[#263F63] transition-all duration-200 hover:border-[#75A7FF]/40 hover:-translate-y-1 flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#A9BAD4]">
            {title}
          </span>
          <div
            className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} border border-[#263F63] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
            {value}
          </div>
          <p className="text-xs sm:text-sm text-[#7890B2] font-medium mt-1">
            {subtext}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-[#263F63]/80 flex flex-col gap-2">
        {progressPercent !== undefined && (
          <div className="w-full bg-[#162D4D] rounded-full h-1.5 overflow-hidden border border-[#263F63]/40">
            <div
              className={`h-1.5 rounded-full ${progressBarColor} transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[#7890B2] font-medium">Completion pace</span>
          {trend && (
            <span className={`font-bold flex items-center gap-0.5 ${trendColor}`}>
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProductivityStats: React.FC = () => {
  const { stats } = useTasks();
  const pendingCount = Math.max(0, stats.total - stats.completed);
  const pendingPercent = stats.total > 0 ? Math.round((pendingCount / stats.total) * 100) : 0;

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      subtext: stats.total === 0 ? 'No tasks in workspace' : stats.total === 1 ? '1 active deliverable' : `${stats.total} deliverables tracked`,
      icon: ListTodo,
      iconBg: 'bg-[#162D4D]',
      iconColor: 'text-[#75A7FF]',
      trend: stats.total > 0 ? `${stats.rate}% done` : 'No data',
      trendColor: stats.total > 0 ? 'text-[#75A7FF]' : 'text-[#7890B2]',
      progressPercent: stats.total > 0 ? 100 : 0,
      progressBarColor: 'bg-[#3B82F6]',
    },
    {
      title: 'Completed Tasks',
      value: stats.completed,
      subtext: stats.total === 0 ? '0 deliverables finished' : `${stats.completed} of ${stats.total} deliverables finished`,
      icon: CheckCircle2,
      iconBg: 'bg-[#162D4D]',
      iconColor: 'text-emerald-400',
      trend: stats.total > 0 ? (stats.rate === 100 ? 'All finished' : `${stats.completed} finished`) : 'None',
      trendColor: stats.completed > 0 ? 'text-emerald-400' : 'text-[#7890B2]',
      progressPercent: stats.rate,
      progressBarColor: 'bg-emerald-500',
    },
    {
      title: 'Pending Tasks',
      value: pendingCount,
      subtext: stats.total === 0 ? '0 in progress, 0 overdue' : `${stats.inProgress} in progress, ${stats.overdue} overdue`,
      icon: Clock,
      iconBg: 'bg-[#162D4D]',
      iconColor: 'text-amber-400',
      trend: stats.overdue > 0 ? `${stats.overdue} overdue` : (stats.total > 0 ? 'On schedule' : 'None'),
      trendColor: stats.overdue > 0 ? 'text-red-400' : (stats.total > 0 ? 'text-amber-400' : 'text-[#7890B2]'),
      progressPercent: pendingPercent,
      progressBarColor: 'bg-amber-500',
    },
    {
      title: 'Productivity Rate',
      value: `${stats.rate}%`,
      subtext: stats.total > 0 ? `${stats.completed} of ${stats.total} deliverables finished` : 'No task activity',
      icon: TrendingUp,
      iconBg: 'bg-[#162D4D]',
      iconColor: 'text-indigo-400',
      trend: stats.total > 0 ? (stats.rate >= 60 ? 'On pace' : 'In progress') : 'No data',
      trendColor: stats.rate >= 60 ? 'text-emerald-400' : 'text-[#7890B2]',
      progressPercent: stats.rate,
      progressBarColor: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Section Header with Real-Time Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-base sm:text-lg font-extrabold text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
          Productivity Overview
        </h3>
        <div className="flex items-center gap-2 text-xs text-[#A9BAD4] bg-[#112541] px-3 py-1.5 rounded-xl border border-[#263F63]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time metrics from authenticated Supabase account</span>
        </div>
      </div>

      {/* 4 Dark Navy Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtext={card.subtext}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            trend={card.trend}
            trendColor={card.trendColor}
            progressPercent={card.progressPercent}
            progressBarColor={card.progressBarColor}
          />
        ))}
      </div>
    </div>
  );
};
