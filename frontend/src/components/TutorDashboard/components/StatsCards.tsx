import { Card, CardContent } from "@/components/ui/card"
import { Users, FileText, BarChart3, TrendingUp } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface StatsCardsProps {
  dashboardStats: any
  loading: boolean
}

interface StatCard {
  title: string
  value: string
  subtitle: string
  subtitleColor: string
  icon: LucideIcon
}

export function StatsCards({ dashboardStats, loading }: StatsCardsProps) {
  const stats: StatCard[] = [
    {
      title: "Total Students",
      value: dashboardStats?.total_students?.toString() || "48",
      subtitle: "+2% this month",
      subtitleColor: "text-green-600",
      icon: Users
    },
    {
      title: "Active Assignments",
      value: dashboardStats?.active_assignments?.toString() || "12",
      subtitle: "-5% this month",
      subtitleColor: "text-red-600",
      icon: FileText
    },
    {
      title: "Average Performance",
      value: `${dashboardStats?.avg_performance || 85}%`,
      subtitle: "+1.5% this month",
      subtitleColor: "text-green-600",
      icon: BarChart3
    },
    {
      title: "Engagement Rate",
      value: `${dashboardStats?.engagement_rate || 92}%`,
      subtitle: "+3% this month",
      subtitleColor: "text-green-600",
      icon: TrendingUp
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-border bg-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-lg mb-4"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon
        return (
          <Card key={index} className="border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                <p className={`text-sm font-medium ${stat.subtitleColor}`}>{stat.subtitle}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

