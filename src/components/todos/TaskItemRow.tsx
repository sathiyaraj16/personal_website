import React from 'react';
import {
  Check,
  Clock,
  Tag,
  AlertTriangle,
  PlayCircle,
  CheckCircle,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { TaskActionMenu } from './TaskActionMenu';
import { usePreferences } from '../../context/PreferencesContext';

interface TaskItemRowProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onChangeStatus: (id: string, status: TaskStatus) => void;
}

export const TaskItemRow: React.FC<TaskItemRowProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewDetails,
  onChangePriority,
  onChangeStatus,
}) => {
  const { formatDate, formatTime } = usePreferences();
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = task.status !== 'completed' && task.due_date && task.due_date < todayStr;
  const isCompleted = task.status === 'completed';

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/15 text-[#75A7FF] border border-blue-500/30">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/15 text-[#75A7FF] border border-blue-500/30 flex items-center gap-1">
            <PlayCircle className="w-3 h-3 text-[#3B82F6]" /> In Progress
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#162D4D] text-[#A9BAD4] border border-[#263F63] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#7890B2]" /> Pending
          </span>
        );
    }
  };

  return (
    <div
      className={`group p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isCompleted
          ? 'bg-[#112541]/50 border-[#263F63]/50 opacity-80 hover:opacity-100'
          : 'bg-[#112541] border-[#263F63] hover:border-[#75A7FF]/40 shadow-md shadow-black/15'
      }`}
    >
      {/* Left Section: Checkbox + Title + Description Preview + Badges */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer flex-shrink-0 mt-0.5 ${
            isCompleted
              ? 'bg-[#3B82F6] text-white shadow-md border border-blue-400/40'
              : 'border-2 border-[#263F63] hover:border-[#3B82F6] bg-[#081426]'
          }`}
          aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'completed'}`}
        >
          {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Content Column */}
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              onClick={() => onViewDetails(task)}
              className={`text-base font-bold tracking-tight cursor-pointer hover:text-[#75A7FF] transition-colors leading-snug ${
                isCompleted ? 'line-through text-[#7890B2]' : 'text-[#F8FAFC]'
              }`}
            >
              {task.title}
            </h4>

            {isOverdue && (
              <span className="text-[11px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs sm:text-sm text-[#A9BAD4] line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Metadata Row: Category, Due Date, Time, Status */}
          <div className="flex items-center gap-3 pt-1 flex-wrap text-xs text-[#7890B2]">
            <span className="flex items-center gap-1 font-semibold text-[#A9BAD4] bg-[#162D4D] px-2.5 py-0.5 rounded-md border border-[#263F63]">
              <Tag className="w-3 h-3 text-[#75A7FF]" />
              {task.category}
            </span>

            {task.due_date && (
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-[#7890B2]" />
                <span className={isOverdue ? 'text-red-400 font-bold' : 'text-[#A9BAD4]'}>
                  {formatDate(task.due_date)} {task.due_time ? `at ${formatTime(task.due_time)}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Priority Badge + Status + Actions */}
      <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#263F63]/50">
        <div className="flex items-center gap-2">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
        </div>

        {/* Action Menu Portal */}
        <TaskActionMenu
          task={task}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onChangePriority={onChangePriority}
          onChangeStatus={onChangeStatus}
        />
      </div>
    </div>
  );
};
