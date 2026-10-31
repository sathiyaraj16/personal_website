import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle, PlusCircle, Check } from 'lucide-react';
import { Task, TaskCategory, TaskFormData, TaskPriority, TaskStatus } from '../../types/task';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  editingTask?: Task | null;
}

const categories: TaskCategory[] = ['Work', 'Projects', 'Study', 'Personal', 'Other'];
const priorities: TaskPriority[] = ['low', 'medium', 'high'];
const statuses: { id: TaskStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description);
        setCategory(editingTask.category);
        setPriority(editingTask.priority);
        setStatus(editingTask.status);
        setDueDate(editingTask.due_date || '');
        setDueTime(editingTask.due_time || '');
      } else {
        // Defaults for new task
        const todayStr = new Date().toISOString().split('T')[0];
        setTitle('');
        setDescription('');
        setCategory('Work');
        setPriority('medium');
        setStatus('pending');
        setDueDate(todayStr);
        setDueTime('05:00 PM');
      }
      setError(null);
    }
  }, [isOpen, editingTask]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Task title is required. Please enter a meaningful title.');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status,
      due_date: dueDate,
      due_time: dueTime,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#112541] border border-[#263F63] shadow-2xl p-6 sm:p-7 relative text-[#F8FAFC] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#A9BAD4] hover:text-white hover:bg-[#162D4D] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#75A7FF]">
            {editingTask ? <Check className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 id="task-modal-title" className="text-xl font-bold text-[#F8FAFC] tracking-tight">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <p className="text-xs text-[#A9BAD4] mt-0.5">
              {editingTask
                ? 'Update task properties, category and due dates.'
                : 'Define objectives and deadlines for your personal workspace.'}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-1.5">
            <label htmlFor="task-title" className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Prepare system design presentation"
              className="w-full h-11 px-4 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#F8FAFC] placeholder:text-[#7890B2] focus:outline-none focus:border-[#75A7FF] focus:ring-1 focus:ring-[#75A7FF] transition-all"
            />
          </div>

          {/* Task Description */}
          <div className="space-y-1.5">
            <label htmlFor="task-desc" className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
              Description (Optional)
            </label>
            <textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverables, links, or notes..."
              className="w-full p-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#F8FAFC] placeholder:text-[#7890B2] focus:outline-none focus:border-[#75A7FF] focus:ring-1 focus:ring-[#75A7FF] transition-all resize-none"
            />
          </div>

          {/* Category & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="task-category" className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#75A7FF] cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="task-status" className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#75A7FF] cursor-pointer"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Selector */}
          <div className="space-y-1.5">
            <span className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
              Priority Level
            </span>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`h-10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? p === 'high'
                          ? 'bg-red-500/20 text-red-300 border border-red-500 shadow-sm'
                          : p === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500 shadow-sm'
                          : 'bg-blue-500/20 text-[#75A7FF] border border-[#3B82F6] shadow-sm'
                        : 'bg-[#162D4D] text-[#A9BAD4] border border-[#263F63] hover:text-white hover:border-[#75A7FF]/40'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date & Due Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="task-due-date" className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7890B2] pointer-events-none" />
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#75A7FF] transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="task-due-time" className="block text-xs uppercase tracking-wider font-bold text-[#A9BAD4]">
                Due Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7890B2] pointer-events-none" />
                <input
                  id="task-due-time"
                  type="text"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  placeholder="e.g. 05:00 PM"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-mono text-[#F8FAFC] placeholder:text-[#7890B2] focus:outline-none focus:border-[#75A7FF] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-[#263F63]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-white border border-[#263F63] text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
