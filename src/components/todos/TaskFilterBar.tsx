import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { TaskCategory, TaskFilter, TaskSort } from '../../types/task';

interface TaskFilterBarProps {
  statusFilter: TaskFilter;
  onStatusFilterChange: (filter: TaskFilter) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  sortBy: TaskSort;
  onSortByChange: (sort: TaskSort) => void;
  taskCounts: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
    overdue: number;
  };
}

const statusTabs: { id: TaskFilter; label: string }[] = [
  { id: 'all', label: 'All Tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
];

const categories: (TaskCategory | 'All')[] = [
  'All',
  'Personal',
  'Study',
  'Work',
  'Projects',
  'Other',
];

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  taskCounts,
}) => {
  return (
    <div className="space-y-4 rounded-2xl bg-[#112541] border border-[#263F63] p-4 sm:p-5 shadow-lg shadow-black/20">
      {/* Top Row: Search Input + Sorting Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7890B2] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search tasks by title or description..."
            className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#162D4D] border border-[#263F63] text-sm text-[#F8FAFC] placeholder:text-[#7890B2] focus:outline-none focus:border-[#75A7FF] focus:ring-1 focus:ring-[#75A7FF] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7890B2] hover:text-white transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label htmlFor="sort-select" className="text-xs text-[#A9BAD4] font-medium flex items-center gap-1.5 hidden sm:flex">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#75A7FF]" />
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as TaskSort)}
            className="h-11 px-3.5 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] focus:outline-none focus:border-[#75A7FF] cursor-pointer"
          >
            <option value="due_date">Due Date</option>
            <option value="priority">Priority (High to Low)</option>
            <option value="created_at">Recently Created</option>
          </select>
        </div>
      </div>

      {/* Middle Row: Status Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[#263F63]/60 pt-1">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          const count = taskCounts[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#3B82F6] text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                  : 'text-[#A9BAD4] hover:text-white hover:bg-[#162D4D]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-[#162D4D] text-[#7890B2] border border-[#263F63]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Row: Category Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-[#7890B2] font-semibold flex items-center gap-1 mr-1 flex-shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#75A7FF]" /> Category:
        </span>
        {categories.map((cat) => {
          const isSelected = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryFilterChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[#162D4D] text-[#75A7FF] border border-[#3B82F6]'
                  : 'text-[#A9BAD4] hover:text-white bg-[#081426]/50 border border-[#263F63]/60 hover:border-[#263F63]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
