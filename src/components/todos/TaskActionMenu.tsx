import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical,
  Eye,
  Edit2,
  Trash2,
  Check,
  Clock,
  PlayCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../../types/task';

interface TaskActionMenuProps {
  task: Task;
  onViewDetails: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onChangePriority: (id: string, priority: TaskPriority) => void;
  onChangeStatus: (id: string, status: TaskStatus) => void;
}

export const TaskActionMenu: React.FC<TaskActionMenuProps> = ({
  task,
  onViewDetails,
  onEdit,
  onDelete,
  onChangePriority,
  onChangeStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position state for desktop floating portal
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    openAbove: boolean;
  }>({
    top: 0,
    left: 0,
    openAbove: false,
  });

  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  });

  // Check mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update positioning when opening
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 256; // 16rem / w-64
    const menuHeight = 360; // Estimated menu height

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Open above if space below is insufficient and space above is larger
    const openAbove = spaceBelow < menuHeight && spaceAbove > menuHeight;

    let top = openAbove
      ? triggerRect.top - menuHeight - 8
      : triggerRect.bottom + 8;

    // Clamp top to viewport bounds
    top = Math.max(12, Math.min(window.innerHeight - menuHeight - 12, top));

    // Right-align menu to trigger button
    let left = triggerRect.right - menuWidth;
    // Clamp horizontally to avoid off-screen overflow
    left = Math.max(16, Math.min(window.innerWidth - menuWidth - 16, left));

    setPosition({ top, left, openAbove });
  }, []);

  const toggleMenu = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on outside click, escape key, and scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScroll = () => {
      // Re-position or close on window scroll to maintain alignment
      updatePosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  return (
    <>
      {/* Anchor Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Actions for ${task.title}`}
        className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-[#203D63] text-[#F8FAFC] border border-[#29466B]'
            : 'text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D] border border-transparent hover:border-[#263F63]'
        }`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Portal-rendered Dropdown Menu to prevent any container clipping or layout shifting */}
      {isOpen &&
        createPortal(
          <>
            {/* Mobile Backdrop & Bottom Sheet */}
            {isMobile ? (
              <div
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-150"
                onClick={() => setIsOpen(false)}
              >
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label="Task Action Sheet"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-[#162D4D] border-t border-[#29466B] rounded-t-3xl p-5 shadow-2xl text-xs space-y-3.5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-[#F8FAFC]"
                >
                  {/* Sheet Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#29466B]">
                    <div className="min-w-0 pr-4">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#A9BAD4] block">
                        Task Actions
                      </span>
                      <h4 className="text-sm font-bold text-[#F8FAFC] truncate">
                        {task.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-lg text-[#A9BAD4] hover:text-white hover:bg-[#203D63] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onViewDetails(task);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#F8FAFC] hover:bg-[#203D63] transition-colors text-left"
                    >
                      <Eye className="w-4 h-4 text-[#75A7FF]" />
                      <span>View Full Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onEdit(task);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#F8FAFC] hover:bg-[#203D63] transition-colors text-left"
                    >
                      <Edit2 className="w-4 h-4 text-[#3B82F6]" />
                      <span>Edit Task</span>
                    </button>
                  </div>

                  {/* Status Selection */}
                  <div className="pt-2 border-t border-[#29466B] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#A9BAD4] tracking-wider block px-1">
                      Status
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'pending', label: 'Pending', icon: Clock },
                          { id: 'in_progress', label: 'In Progress', icon: PlayCircle },
                          { id: 'completed', label: 'Completed', icon: CheckCircle },
                        ] as const
                      ).map(({ id, label, icon: Icon }) => {
                        const isActive = task.status === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              onChangeStatus(task.id, id);
                              setIsOpen(false);
                            }}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                              isActive
                                ? 'bg-[#3B82F6] text-white border-blue-400 shadow-sm'
                                : 'bg-[#112541] text-[#A9BAD4] border-[#29466B] hover:bg-[#203D63] hover:text-white'
                            }`}
                          >
                            <Icon className="w-4 h-4 mb-1" />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div className="pt-2 border-t border-[#29466B] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#A9BAD4] tracking-wider block px-1">
                      Priority
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'low', label: 'Low', color: 'text-[#75A7FF]' },
                          { id: 'medium', label: 'Medium', color: 'text-amber-400' },
                          { id: 'high', label: 'High', color: 'text-red-400' },
                        ] as const
                      ).map(({ id, label }) => {
                        const isActive = task.priority === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              onChangePriority(task.id, id);
                              setIsOpen(false);
                            }}
                            className={`py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                              isActive
                                ? 'bg-[#203D63] text-white border-[#3B82F6] shadow-sm'
                                : 'bg-[#112541] text-[#A9BAD4] border-[#29466B] hover:bg-[#203D63] hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delete Option */}
                  <div className="pt-2 border-t border-[#29466B]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onDelete(task);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Floating Dropdown Menu */
              <div
                ref={menuRef}
                role="menu"
                aria-label="Task Action Menu"
                style={{
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                }}
                className="fixed w-64 rounded-2xl bg-[#162D4D] border border-[#29466B] shadow-2xl shadow-black/60 p-2 z-50 text-xs text-[#F8FAFC] space-y-1 animate-in fade-in zoom-in-95 duration-150 select-none"
              >
                {/* Section 1: Task Actions */}
                <div className="px-2 py-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A9BAD4]">
                    Task Actions
                  </span>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onViewDetails(task);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#F8FAFC] hover:bg-[#203D63] hover:text-white transition-colors cursor-pointer text-left font-medium"
                  >
                    <Eye className="w-4 h-4 text-[#75A7FF] flex-shrink-0" />
                    <span>View Full Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onEdit(task);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[#F8FAFC] hover:bg-[#203D63] hover:text-white transition-colors cursor-pointer text-left font-medium"
                  >
                    <Edit2 className="w-4 h-4 text-[#3B82F6] flex-shrink-0" />
                    <span>Edit Task</span>
                  </button>
                </div>

                {/* Section 2: Status */}
                <div className="border-t border-[#29466B] my-1 pt-1.5 px-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A9BAD4] block mb-1">
                    Status
                  </span>
                  <div className="space-y-0.5">
                    {(
                      [
                        { id: 'pending', label: 'Pending', icon: Clock, color: 'text-[#7890B2]' },
                        { id: 'in_progress', label: 'In Progress', icon: PlayCircle, color: 'text-[#3B82F6]' },
                        { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-emerald-400' },
                      ] as const
                    ).map(({ id, label, icon: Icon, color }) => {
                      const isActive = task.status === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            onChangeStatus(task.id, id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-[#203D63] text-white font-bold'
                              : 'text-[#A9BAD4] hover:bg-[#203D63]/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                            <span>{label}</span>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#3B82F6] stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Priority */}
                <div className="border-t border-[#29466B] my-1 pt-1.5 px-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#A9BAD4] block mb-1">
                    Priority
                  </span>
                  <div className="space-y-0.5">
                    {(
                      [
                        { id: 'low', label: 'Low Priority', dot: 'bg-blue-400' },
                        { id: 'medium', label: 'Medium Priority', dot: 'bg-amber-400' },
                        { id: 'high', label: 'High Priority', dot: 'bg-red-400' },
                      ] as const
                    ).map(({ id, label, dot }) => {
                      const isActive = task.priority === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            onChangePriority(task.id, id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isActive
                              ? 'bg-[#203D63] text-white font-bold'
                              : 'text-[#A9BAD4] hover:bg-[#203D63]/60 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
                            <span>{label}</span>
                          </div>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#75A7FF] stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: Danger Action (Delete Task) */}
                <div className="border-t border-[#29466B] mt-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onDelete(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer text-left font-semibold"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>Delete Task</span>
                  </button>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </>
  );
};
