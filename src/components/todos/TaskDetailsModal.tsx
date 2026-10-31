import React, { useEffect } from 'react';
import { X, Calendar, Clock, Shield, CheckCircle, Edit2, PlayCircle, AlertTriangle } from 'lucide-react';
import { Task } from '../../types/task';
import { usePreferences } from '../../context/PreferencesContext';

interface TaskDetailsModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onToggleComplete: (id: string) => void;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  task,
  onClose,
  onEdit,
  onToggleComplete,
}) => {
  const { formatDate, formatTime } = usePreferences();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'completed';
  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#112541] border border-[#263F63] shadow-2xl p-6 sm:p-7 relative text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#A9BAD4] hover:text-white hover:bg-[#162D4D] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#162D4D] text-[#75A7FF] border border-[#263F63]">
            {task.category}
          </span>
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
              task.priority === 'high'
                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                : task.priority === 'medium'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-blue-500/15 text-[#75A7FF] border border-blue-500/30'
            }`}
          >
            {task.priority} Priority
          </span>
          {isOverdue && (
            <span className="text-[11px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Overdue
            </span>
          )}
        </div>

        {/* Title */}
        <h3 id="task-detail-title" className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight leading-snug">
          {task.title}
        </h3>

        {/* Description */}
        <div className="my-5 p-4 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#A9BAD4] leading-relaxed">
          {task.description ? (
            <p className="whitespace-pre-wrap">{task.description}</p>
          ) : (
            <p className="italic text-[#7890B2]">No detailed notes provided for this task.</p>
          )}
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-6">
          <div className="p-3 rounded-xl bg-[#081426]/60 border border-[#263F63]/60 space-y-1">
            <span className="text-[#7890B2] uppercase font-bold text-[10px] tracking-wider block flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#75A7FF]" /> Due Date
            </span>
            <span className="font-mono font-semibold text-[#F8FAFC]">
              {task.due_date ? formatDate(task.due_date) : 'No deadline'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#081426]/60 border border-[#263F63]/60 space-y-1">
            <span className="text-[#7890B2] uppercase font-bold text-[10px] tracking-wider block flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#75A7FF]" /> Due Time
            </span>
            <span className="font-mono font-semibold text-[#F8FAFC]">
              {task.due_time ? formatTime(task.due_time) : '12:00 PM'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#081426]/60 border border-[#263F63]/60 space-y-1">
            <span className="text-[#7890B2] uppercase font-bold text-[10px] tracking-wider block flex items-center gap-1">
              <PlayCircle className="w-3 h-3 text-[#75A7FF]" /> Execution Status
            </span>
            <span className="capitalize font-semibold text-[#F8FAFC]">
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#081426]/60 border border-[#263F63]/60 space-y-1">
            <span className="text-[#7890B2] uppercase font-bold text-[10px] tracking-wider block flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#75A7FF]" /> Task ID
            </span>
            <span className="font-mono text-[10px] text-slate-400 truncate block">
              {task.id}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#263F63]">
          <button
            type="button"
            onClick={() => {
              onToggleComplete(task.id);
              onClose();
            }}
            className={`flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCompleted
                ? 'bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] border border-[#263F63]'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="h-11 px-5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
