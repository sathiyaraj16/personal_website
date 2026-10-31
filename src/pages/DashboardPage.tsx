import React from 'react';
import { WelcomeSection } from '../components/WelcomeSection';
import { MotivationCard } from '../components/MotivationCard';
import { ProductivityStats } from '../components/ProductivityStats';
import { TodoPreview } from '../components/TodoPreview';
import { WeeklyProductivityChart } from '../components/WeeklyProductivityChart';
import { ProductivitySummaryCard } from '../components/ProductivitySummaryCard';
import { RecentActivity } from '../components/RecentActivity';

export const DashboardPage: React.FC = () => {
  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. WELCOME & DAILY FOCUS HEADER ROW (12-Column Grid)                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
          <WelcomeSection />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <MotivationCard />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRODUCTIVITY OVERVIEW (4 Large Metric Cards Across Full Viewport)      */}
      {/* ========================================================================= */}
      <ProductivityStats />

      {/* ========================================================================= */}
      {/* 3. BALANCED TWO-COLUMN 12-GRID MAIN DASHBOARD CONTENT                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT – Main Content (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6 sm:space-y-8">
          {/* Today's Tasks Large Panel */}
          <TodoPreview />

          {/* Weekly Productivity Trend Chart */}
          <WeeklyProductivityChart />
        </div>

        {/* RIGHT – Secondary Content (5 cols on lg, 4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6 sm:space-y-8">
          {/* Productivity Summary & Daily Goal Allocation */}
          <ProductivitySummaryCard />

          {/* Real Authenticated Session Activity */}
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};
