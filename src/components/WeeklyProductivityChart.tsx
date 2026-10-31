import React, { useState, useMemo } from 'react';
import { TrendingUp, Calendar, AlertCircle, Inbox } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface DayMetric {
  day: string;
  fullDay: string;
  dateStr: string;
  completed: number;
  planned: number;
  rate: number;
}

export const WeeklyProductivityChart: React.FC = () => {
  const { tasks } = useTasks();

  // Compute 7 days of the current week (Monday to Sunday)
  const weeklyData = useMemo<DayMetric[]>(() => {
    const today = new Date();
    // Monday as day 1 of week
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const dayNames = [
      { day: 'Mon', fullDay: 'Monday' },
      { day: 'Tue', fullDay: 'Tuesday' },
      { day: 'Wed', fullDay: 'Wednesday' },
      { day: 'Thu', fullDay: 'Thursday' },
      { day: 'Fri', fullDay: 'Friday' },
      { day: 'Sat', fullDay: 'Saturday' },
      { day: 'Sun', fullDay: 'Sunday' },
    ];

    return dayNames.map((d, index) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + index);
      const dateStr = dayDate.toISOString().split('T')[0];

      // Match tasks due on this date
      const plannedTasks = tasks.filter((t) => t.due_date === dateStr);
      const completedTasks = plannedTasks.filter((t) => t.status === 'completed');

      const planned = plannedTasks.length;
      const completed = completedTasks.length;
      const rate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

      return {
        day: d.day,
        fullDay: d.fullDay,
        dateStr,
        completed,
        planned,
        rate,
      };
    });
  }, [tasks]);

  // Determine current day of week to default selection
  const todayDayIndex = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1; // 0 (Mon) to 6 (Sun)
  }, []);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(todayDayIndex);

  const activeDay = weeklyData[selectedDayIndex] || weeklyData[0];

  const totalCompleted = weeklyData.reduce((acc, d) => acc + d.completed, 0);
  const totalPlanned = weeklyData.reduce((acc, d) => acc + d.planned, 0);
  const weeklyAverageRate = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;

  const maxPlanned = useMemo(() => {
    const maxVal = Math.max(1, ...weeklyData.map((d) => d.planned));
    return Math.max(maxVal, 5); // Minimum scale of 5 for visual balance
  }, [weeklyData]);

  const hasAnyWeeklyTasks = totalPlanned > 0;

  return (
    <div className="rounded-2xl bg-[#112541] text-[#F8FAFC] p-6 sm:p-7 shadow-lg shadow-black/20 border border-[#263F63] flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#263F63] gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg sm:text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
              Weekly Productivity Trend
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                weeklyAverageRate >= 60
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
                  : 'text-[#75A7FF] bg-[#162D4D] border-[#263F63]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              {weeklyAverageRate}% avg
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A9BAD4] mt-0.5">
            Completed versus planned task execution over the current 7-day week.
          </p>
        </div>

        {/* Legend in Dark Theme */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#3B82F6]" />
            <span className="text-[#A9BAD4] font-medium">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#162D4D] border border-[#263F63]" />
            <span className="text-[#7890B2] font-medium">Target</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="py-6 relative">
        {/* Subtle Horizontal Guide Lines */}
        <div className="absolute inset-x-0 top-12 bottom-12 flex flex-col justify-between pointer-events-none opacity-30">
          <div className="border-b border-dashed border-[#263F63] w-full" />
          <div className="border-b border-dashed border-[#263F63] w-full" />
          <div className="border-b border-dashed border-[#263F63] w-full" />
        </div>

        {!hasAnyWeeklyTasks ? (
          /* Accurate Empty State for Weekly Tasks */
          <div className="h-56 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed border-[#263F63]/80 bg-[#162D4D]/10 space-y-2 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#7890B2]">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-[#F8FAFC]">No tasks scheduled this week</p>
            <p className="text-xs text-[#7890B2] max-w-sm leading-relaxed">
              As you set due dates on your deliverables, daily target and completion columns will automatically populate here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-56 pt-6 pb-2 relative z-10">
            {weeklyData.map((d, idx) => {
              const isSelected = selectedDayIndex === idx;
              const completedHeight = d.planned > 0 ? Math.round((d.completed / maxPlanned) * 100) : 0;
              const plannedHeight = d.planned > 0 ? Math.round((d.planned / maxPlanned) * 100) : 0;

              return (
                <div
                  key={d.day}
                  onClick={() => setSelectedDayIndex(idx)}
                  className="flex flex-col items-center h-full justify-end cursor-pointer group"
                >
                  {/* Bar Visual Column */}
                  <div className="relative w-full max-w-[44px] h-full flex items-end justify-center">
                    {/* Background Target Bar */}
                    {d.planned > 0 ? (
                      <div
                        className="absolute bottom-0 w-full rounded-t-xl bg-[#162D4D] border border-[#263F63]/60 group-hover:bg-[#1B365B] transition-all duration-300"
                        style={{ height: `${Math.max(8, plannedHeight)}%` }}
                      />
                    ) : (
                      <div className="w-full h-1 rounded-full bg-[#162D4D] opacity-40" />
                    )}

                    {/* Foreground Completed Bar */}
                    {d.completed > 0 && (
                      <div
                        className={`relative z-10 w-full rounded-t-xl transition-all duration-300 ${
                          isSelected
                            ? 'bg-[#3B82F6] shadow-lg shadow-blue-500/40 border-t border-x border-[#93C5FD]/40'
                            : 'bg-[#3B82F6]/85 group-hover:bg-[#60A5FA]'
                        }`}
                        style={{ height: `${Math.max(8, completedHeight)}%` }}
                      >
                        {/* Tooltip Badge on Hover */}
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-bold text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[#10223D] px-2 py-0.5 rounded-md shadow-md border border-[#263F63]">
                          {d.completed}/{d.planned}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Day Label */}
                  <span
                    className={`mt-2.5 text-xs font-semibold transition-colors ${
                      isSelected ? 'text-[#75A7FF] font-bold' : 'text-[#7890B2] group-hover:text-[#F8FAFC]'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Day Detail Callout */}
      <div className="p-4 rounded-xl bg-[#162D4D] border border-[#263F63] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#75A7FF] flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-[#F8FAFC]">{activeDay.fullDay} Metrics:</span>{' '}
            <span className="text-[#A9BAD4]">
              {activeDay.completed} of {activeDay.planned} tasks completed{' '}
              {activeDay.planned > 0 ? `(${activeDay.rate}% rate)` : '(No tasks scheduled)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#7890B2] text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 text-[#75A7FF] flex-shrink-0" />
          <span>Real-time execution telemetry from your Supabase account</span>
        </div>
      </div>
    </div>
  );
};
