import { StatsCards } from "../components/StatsCards"
import { PerformanceChart } from "../components/PerformanceChart"
import { SubjectPerformance } from "../components/SubjectPerformance"
import { RecentActivity } from "../components/RecentActivity"

interface OverviewViewProps {
  dashboardStats: any
  loading: boolean
}

export function OverviewView({ dashboardStats, loading }: OverviewViewProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards dashboardStats={dashboardStats} loading={loading} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PerformanceChart />
          <SubjectPerformance />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  )
}

