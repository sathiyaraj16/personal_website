import React from 'react';
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Tag,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { TaskActionMenu } from './TaskActionMenu';
import { usePreferences } from '../../context/PreferencesContext';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onViewDetails: (task: Task) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onChangeStatus: (id: string, status: TaskStatus) => void;
}

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

const columns: ColumnConfig[] = [
  {
    id: 'pending',
    title: 'To Do',
    icon: Clock,
    accentColor: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: PlayCircle,
    accentColor: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-[#75A7FF]',
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: CheckCircle2,
    accentColor: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-400',
  },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onToggleComplete,
  onEdit,
  onDelete,
  onViewDetails,
  onChangePriority,
  onChangeStatus,
}) => {
  const { formatDate, formatTime } = usePreferences();
  const todayStr = new Date().toISOString().split('T')[0];

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Med
          </span>
        );
      case 'low':
      default:
        return (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-[#75A7FF] border border-blue-500/30">
            Low
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
      {columns.map((col) => {
        const ColumnIcon = col.icon;
        const columnTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="rounded-2xl bg-[#112541] border border-[#263F63] flex flex-col min-h-[500px] shadow-lg shadow-black/15 overflow-hidden"
          >
            {/* Column Header */}
            <div className={`p-4 border-b border-[#263F63] flex items-center justify-between ${col.accentColor} border-t-2`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${col.badgeBg} ${col.badgeBorder} border flex items-center justify-center ${col.badgeText}`}>
                  <ColumnIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC]">
                  {col.title}
                </h3>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${col.badgeBg} ${col.badgeBorder} border ${col.badgeText}`}>
                {columnTasks.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[750px]">
              {columnTasks.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-[#263F63] rounded-xl bg-[#162D4D]/20">
                  <p className="text-xs text-[#A9BAD4] font-medium">No tasks in {col.title}</p>
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isOverdue =
                    task.status !== 'completed' && task.due_date && task.due_date < todayStr;
                  const isCompleted = task.status === 'completed';

                  const formattedDueDate = formatDate(task.due_date);
                  const formattedDueTime = formatTime(task.due_time);

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all space-y-3 group ${
                        isCompleted
                          ? 'bg-[#162D4D]/40 border-[#263F63]/60 opacity-80 hover:opacity-100'
                          : 'bg-[#162D4D]/70 border-[#263F63] hover:border-[#75A7FF]/50 shadow-sm'
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-[#A9BAD4] bg-[#112541] px-2 py-0.5 rounded-md border border-[#263F63] flex items-center gap-1">
                          <Tag className="w-3 h-3 text-[#75A7FF]" />
                          {task.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {getPriorityBadge(task.priority)}
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

                      {/* Title & Description */}
                      <div className="space-y-1">
                        <h4
                          onClick={() => onViewDetails(task)}
                          className={`text-sm font-bold tracking-tight cursor-pointer hover:text-[#75A7FF] transition-colors leading-snug ${
                            isCompleted ? 'line-through text-[#7890B2]' : 'text-[#F8FAFC]'
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-[#A9BAD4] line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Due Date & Time Display */}
                      {task.due_date && (
                        <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[#263F63]/40">
                          <div className="flex items-center gap-1 text-[#7890B2]">
                            <Clock className="w-3 h-3" />
                            <span className={isOverdue ? 'text-red-400 font-bold' : 'text-[#A9BAD4]'}>
                              {formattedDueDate} {formattedDueTime ? `at ${formattedDueTime}` : ''}
                            </span>
                          </div>

                          {isOverdue && (
                            <span className="text-[10px] font-bold text-red-400 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom Status Shift Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#263F63]/30 text-xs">
                        {/* Checkbox Complete */}
                        <button
                          type="button"
                          onClick={() => onToggleComplete(task.id)}
                          className={`flex items-center gap-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                            isCompleted
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-[#A9BAD4] hover:text-[#F8FAFC]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-400 text-white'
                                : 'border-[#263F63] bg-[#112541]'
                            }`}
                          >
                            {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{isCompleted ? 'Done' : 'Mark done'}</span>
                        </button>

                        {/* Move Status Flow Buttons */}
                        <div className="flex items-center gap-1">
                          {task.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onChangeStatus(task.id, 'in_progress')}
                              className="px-2 py-0.5 rounded bg-[#1B365B] hover:bg-[#264573] text-[10px] font-bold text-[#75A7FF] flex items-center gap-1 cursor-pointer transition-all border border-[#263F63]"
                              title="Start working on this task"
                            >
                              <span>Start</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}

                          {task.status === 'in_progress' && (
                            <>
                              <button
                                type="button"
                                onClick={() => onChangeStatus(task.id, 'pending')}
                                className="px-1.5 py-0.5 rounded bg-[#112541] hover:bg-[#1B365B] text-[10px] text-[#A9BAD4] flex items-center gap-0.5 cursor-pointer transition-all border border-[#263F63]"
                                title="Move back to To Do"
                              >
                                <ArrowLeft className="w-2.5 h-2.5" />
                                <span>Back</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onChangeStatus(task.id, 'completed')}
                                className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/60 text-[10px] font-bold text-emerald-300 flex items-center gap-1 cursor-pointer transition-all border border-emerald-800/40"
                                title="Mark as Completed"
                              >
                                <span>Finish</span>
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}

                          {task.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => onChangeStatus(task.id, 'in_progress')}
                              className="px-2 py-0.5 rounded bg-[#112541] hover:bg-[#1B365B] text-[10px] text-[#75A7FF] flex items-center gap-1 cursor-pointer transition-all border border-[#263F63]"
                              title="Reopen task into In Progress"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                              <span>Reopen</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
