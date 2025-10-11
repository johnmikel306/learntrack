import { Card, CardContent } from "@/components/ui/card"
import { Users, BookOpen, BarChart3, TrendingUp } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface StatsCardsProps {
  dashboardStats: any
  loading: boolean
}

interface StatCard {
  title: string
  value: string
  subtitle: string
  icon: LucideIcon
  bgColor: string
  iconBg: string
  textColor: string
  subtextColor: string
}

export function StatsCards({ dashboardStats, loading }: StatsCardsProps) {
  const stats: StatCard[] = [
    {
      title: "Total Students",
      value: dashboardStats?.total_students?.toString() || "0",
      subtitle: "+12% this month",
      icon: Users,
      bgColor: "bg-card",
      iconBg: "bg-primary",
      textColor: "text-foreground",
      subtextColor: "text-muted-foreground"
    },
    {
      title: "Active Assignments",
      value: dashboardStats?.active_assignments?.toString() || "0",
      subtitle: "8 due this week",
      icon: BookOpen,
      bgColor: "bg-card",
      iconBg: "bg-primary",
      textColor: "text-foreground",
      subtextColor: "text-muted-foreground"
    },
    {
      title: "Avg. Performance",
      value: `${dashboardStats?.avg_performance || 0}%`,
      subtitle: "+5% vs last month",
      icon: BarChart3,
      bgColor: "bg-card",
      iconBg: "bg-primary",
      textColor: "text-foreground",
      subtextColor: "text-muted-foreground"
    },
    {
      title: "Engagement Rate",
      value: `${dashboardStats?.engagement_rate || 0}%`,
      subtitle: "Excellent!",
      icon: TrendingUp,
      bgColor: "bg-card",
      iconBg: "bg-primary",
      textColor: "text-foreground",
      subtextColor: "text-muted-foreground"
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
          <Card key={index} className={`border border-border ${stat.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                <p className={`text-3xl font-bold ${stat.textColor} mb-2`}>{stat.value}</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-3 w-3 ${stat.subtextColor}`} />
                  <p className={`text-xs ${stat.subtextColor}`}>{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

