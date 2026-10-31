import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Clock, AlertCircle, Tag, CheckCircle, Inbox, Plus } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { usePreferences } from '../context/PreferencesContext';

export const TodoPreview: React.FC = () => {
  const { tasks, toggleTask } = useTasks();
  const { formatDate, formatTime } = usePreferences();

  const todayStr = new Date().toISOString().split('T')[0];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
            High Priority
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-[#75A7FF] border border-blue-500/30">
            Low
          </span>
        );
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="rounded-2xl bg-[#112541] text-[#F8FAFC] p-6 sm:p-7 shadow-lg shadow-black/20 border border-[#263F63] flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#263F63] gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
              Today's Tasks
            </h3>
            <span className="text-xs font-bold text-[#75A7FF] bg-[#162D4D] px-3 py-1 rounded-full border border-[#263F63] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              {tasks.length === 0
                ? '0 Tasks'
                : `${completedCount} of ${tasks.length} Completed`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#A9BAD4] mt-1">
            Focus queue for your high-impact daily deliverables.
          </p>
        </div>

        <Link
          to="/todos"
          className="text-xs sm:text-sm font-bold text-[#75A7FF] hover:text-white transition-colors flex items-center gap-1.5 group cursor-pointer"
        >
          <span>{tasks.length === 0 ? 'Go to My Tasks' : 'View All Tasks'}</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Task List or Clean Empty State */}
      {tasks.length === 0 ? (
        <div className="py-12 px-4 my-2 rounded-xl border border-dashed border-[#263F63] flex flex-col items-center justify-center text-center space-y-3 bg-[#162D4D]/20">
          <div className="w-12 h-12 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
            <Inbox className="w-6 h-6 text-[#7890B2]" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#F8FAFC]">No tasks scheduled</p>
            <p className="text-xs text-[#7890B2] max-w-sm leading-relaxed">
              Your focus queue is empty. Create tasks in the To-Do Manager to begin tracking your deliverables.
            </p>
          </div>
          <Link
            to="/todos"
            className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Task</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#263F63]/60 my-2">
          {tasks.slice(0, 5).map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;

            return (
              <div
                key={task.id}
                className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#1B365B]/60 rounded-xl transition-all"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-0.5 sm:mt-0 ${
                      isCompleted
                        ? 'bg-[#3B82F6] text-white shadow-sm border border-blue-400/40'
                        : 'border-2 border-[#263F63] hover:border-[#3B82F6] bg-[#081426]'
                    }`}
                    aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'complete'}`}
                  >
                    {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  {/* Title & Metadata */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm sm:text-base font-semibold leading-snug transition-all ${
                        isCompleted
                          ? 'line-through text-[#7890B2]'
                          : 'text-[#F8FAFC] group-hover:text-white'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.category && (
                        <span className="text-[11px] text-[#A9BAD4] font-semibold tracking-wide flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#75A7FF]" />
                          {task.category}
                        </span>
                      )}
                      <span className="text-[#263F63] text-xs font-bold">•</span>
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className={isOverdue ? 'text-red-400 font-bold' : 'text-[#7890B2]'}>
                          Due {task.due_date ? formatDate(task.due_date) : 'today'}{' '}
                          {task.due_time ? `at ${formatTime(task.due_time)}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Priority Indicator */}
                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center pl-9 sm:pl-0">
                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#263F63] flex flex-col sm:flex-row items-center justify-between text-xs text-[#A9BAD4] gap-2">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-[#75A7FF] flex-shrink-0" />
          Synchronized live with authenticated account
        </span>
        <span className="font-semibold text-slate-400 hidden sm:inline">
          {tasks.length === 0
            ? '0 tasks in queue'
            : `Showing ${Math.min(5, tasks.length)} of ${tasks.length} tasks`}
        </span>
      </div>
    </div>
  );
};
