import { TopPerformers } from "../components/TopPerformers"
import { StatsCards } from "../components/StatsCards"
import { PerformanceChart } from "../components/PerformanceChart"
import { SubjectPerformance } from "../components/SubjectPerformance"
import { RecentActivity } from "../components/RecentActivity"
import { UpcomingDeadlines } from "../components/UpcomingDeadlines"
import { QuickActions } from "../components/QuickActions"

interface OverviewViewProps {
  dashboardStats: any
  loading: boolean
  onViewChange: (view: string) => void
}

export function OverviewView({ dashboardStats, loading, onViewChange }: OverviewViewProps) {
  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto">
        {/* Top Performers Section */}
        <TopPerformers />

        {/* Stats Cards */}
        <StatsCards dashboardStats={dashboardStats} loading={loading} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <PerformanceChart />
          <SubjectPerformance />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </main>

      {/* Right Sidebar - Hidden on mobile, visible on lg screens */}
      <aside className="hidden lg:block w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
        {/* Upcoming Deadlines */}
        <UpcomingDeadlines />

        {/* Quick Actions */}
        <QuickActions onViewChange={onViewChange} />
      </aside>
    </div>
  )
}

