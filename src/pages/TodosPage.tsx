import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Calendar as CalendarIcon,
  Inbox,
  FilterX,
  Layers,
  Database,
  Columns3,
  List,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { usePreferences } from '../context/PreferencesContext';
import { Task, TaskFilter, TaskFormData, TaskPriority, TaskSort, TaskStatus } from '../types/task';
import { TaskStatsHeader } from '../components/todos/TaskStatsHeader';
import { TaskFilterBar } from '../components/todos/TaskFilterBar';
import { TaskItemRow } from '../components/todos/TaskItemRow';
import { TaskKanbanBoard } from '../components/todos/TaskKanbanBoard';
import { TaskModal } from '../components/todos/TaskModal';
import { DeleteConfirmModal } from '../components/todos/DeleteConfirmModal';
import { TaskDetailsModal } from '../components/todos/TaskDetailsModal';
import { taskService } from '../services/taskService';

export const TodosPage: React.FC = () => {
  const { tasks, stats, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { preferences, formatDate, setDefaultTaskView } = usePreferences();

  // Active View Mode (Kanban vs List)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>(preferences.defaultTaskView);

  // Synchronize viewMode whenever preference updates
  useEffect(() => {
    setViewMode(preferences.defaultTaskView);
  }, [preferences.defaultTaskView]);

  // Filters & Search State
  const [statusFilter, setStatusFilter] = useState<TaskFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSort>('due_date');

  // Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);

  // Formatted Current Date using global preferences
  const formattedDate = formatDate(new Date());

  // Task Counts for Filter Tabs
  const todayStr = new Date().toISOString().split('T')[0];
  const taskCounts = useMemo(() => {
    return {
      all: tasks.length,
      today: tasks.filter((t) => t.due_date === todayStr).length,
      upcoming: tasks.filter((t) => t.due_date > todayStr && t.status !== 'completed').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue: tasks.filter((t) => taskService.isTaskOverdue(t, todayStr)).length,
    };
  }, [tasks, todayStr]);

  // Filtered & Sorted Tasks
  const displayedTasks = useMemo(() => {
    return taskService.filterAndSortTasks(
      tasks,
      statusFilter,
      categoryFilter,
      searchQuery,
      sortBy
    );
  }, [tasks, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Handlers
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskModalSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
  };

  const handleConfirmDelete = (id: string) => {
    deleteTask(id);
    if (detailsTask?.id === id) {
      setDetailsTask(null);
    }
  };

  const handleChangePriority = (id: string, priority: TaskPriority) => {
    updateTask(id, { priority });
  };

  const handleChangeStatus = (id: string, status: TaskStatus) => {
    updateTask(id, { status });
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('All');
    setSearchQuery('');
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. TO-DO PAGE HEADER                                                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#263F63]/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif]">
              My Tasks
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#75A7FF] bg-[#112541] px-3 py-1 rounded-full border border-[#263F63] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {stats.completed}/{stats.total} Finished
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#A9BAD4] bg-[#112541] px-3 py-1 rounded-full border border-[#263F63] font-mono">
                <CalendarIcon className="w-3.5 h-3.5 text-[#75A7FF]" />
                {formattedDate}
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[#A9BAD4] font-medium leading-relaxed">
            Organize your work, stay focused and get things done.
          </p>
        </div>

        {/* Actions & View Mode Controls */}
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {/* Kanban / List Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#112541] border border-[#263F63] shadow-xs">
            <button
              type="button"
              onClick={() => {
                setViewMode('kanban');
                setDefaultTaskView('kanban');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#A9BAD4] hover:text-[#F8FAFC]'
              }`}
              title="Kanban Board View"
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('list');
                setDefaultTaskView('list');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#3B82F6] text-white shadow-xs'
                  : 'text-[#A9BAD4] hover:text-[#F8FAFC]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-11 px-5 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Database Integration Status Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#112541] border border-[#263F63] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#A9BAD4]">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-[#75A7FF] flex-shrink-0" />
          <span>
            <strong className="text-[#F8FAFC]">Supabase Account Integration:</strong> Tasks and metrics are synchronized with your authenticated account.
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 whitespace-nowrap">
          Live Data
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 2. TASK STATISTICS CARDS                                                  */}
      {/* ========================================================================= */}
      <TaskStatsHeader stats={stats} />

      {/* ========================================================================= */}
      {/* 3. TASK ORGANIZATION & FILTER BAR                                         */}
      {/* ========================================================================= */}
      <TaskFilterBar
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        taskCounts={taskCounts}
      />

      {/* ========================================================================= */}
      {/* 4. TASK LIST & EMPTY STATES                                               */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {/* Task List Header Status Bar */}
        <div className="flex items-center justify-between px-1 text-xs text-[#A9BAD4]">
          <span className="font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#75A7FF]" />
            Showing {displayedTasks.length} {displayedTasks.length === 1 ? 'task' : 'tasks'}
            {categoryFilter !== 'All' ? ` in ${categoryFilter}` : ''}
            {statusFilter !== 'all' ? ` (${statusFilter})` : ''}
          </span>

          {(statusFilter !== 'all' || categoryFilter !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#75A7FF] hover:text-white flex items-center gap-1 cursor-pointer font-medium"
            >
              <FilterX className="w-3.5 h-3.5" /> Reset filters
            </button>
          )}
        </div>

        {/* Task Items or Empty State */}
        {displayedTasks.length === 0 ? (
          <div className="py-16 sm:py-20 rounded-2xl bg-[#112541] border border-[#263F63] flex flex-col items-center justify-center text-center p-6 space-y-4 shadow-lg shadow-black/20">
            <div className="w-16 h-16 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] shadow-inner">
              <Inbox className="w-8 h-8 text-[#7890B2]" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-xl font-bold text-[#F8FAFC] tracking-tight">
                {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks found'}
              </h3>
              <p className="text-xs sm:text-sm text-[#A9BAD4] leading-relaxed">
                {tasks.length === 0
                  ? 'Create your first task and start organizing your day.'
                  : 'Try clearing your search query or switching filter tabs to see more tasks.'}
              </p>
            </div>

            {tasks.length === 0 ? (
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="h-11 px-6 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Task</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-4 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#75A7FF] hover:text-white border border-[#263F63] font-semibold text-xs transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'kanban' ? (
          <TaskKanbanBoard
            tasks={displayedTasks}
            onToggleComplete={toggleTask}
            onEdit={handleOpenEditModal}
            onDelete={(t) => setDeletingTask(t)}
            onViewDetails={(t) => setDetailsTask(t)}
            onChangePriority={handleChangePriority}
            onChangeStatus={handleChangeStatus}
          />
        ) : (
          <div className="space-y-3">
            {displayedTasks.map((task) => (
              <TaskItemRow
                key={task.id}
                task={task}
                onToggleComplete={toggleTask}
                onEdit={handleOpenEditModal}
                onDelete={(t) => setDeletingTask(t)}
                onViewDetails={(t) => setDetailsTask(t)}
                onChangePriority={handleChangePriority}
                onChangeStatus={handleChangeStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS (Add/Edit, Delete Confirmation, Task Details)                   */}
      {/* ========================================================================= */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskModalSubmit}
        editingTask={editingTask}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deletingTask)}
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
      />

      <TaskDetailsModal
        isOpen={Boolean(detailsTask)}
        task={detailsTask}
        onClose={() => setDetailsTask(null)}
        onEdit={handleOpenEditModal}
        onToggleComplete={toggleTask}
      />
    </div>
  );
};
