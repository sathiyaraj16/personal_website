import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Task } from '../../types/task';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  task,
  onClose,
  onConfirm,
}) => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#112541] border border-red-500/40 shadow-2xl p-6 relative text-[#F8FAFC]"
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

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 id="delete-confirm-title" className="text-lg font-bold text-[#F8FAFC] tracking-tight">
              Delete Task Confirmation
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Are you sure you want to permanently remove this deliverable from your workspace?
            </p>
          </div>
        </div>

        {/* Task Callout */}
        <div className="my-5 p-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#7890B2] tracking-wider block">
            Target Task
          </span>
          <p className="font-semibold text-[#F8FAFC] line-clamp-2">{task.title}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-white border border-[#263F63] text-sm font-semibold transition-colors cursor-pointer"
          >
            Keep Task
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(task.id);
              onClose();
            }}
            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-lg shadow-red-900/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
};
