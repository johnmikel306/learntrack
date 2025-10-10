import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Activity {
  name: string
  action: string
  time: string
  avatar: string
  score: number | null
}

const recentActivity: Activity[] = [
  { name: "Emma Wilson", action: "completed Algebra Quiz - 92%", time: "5 min ago", avatar: "EW", score: 92 },
  { name: "James Chen", action: "submitted Physics Lab - 88%", time: "12 min ago", avatar: "JC", score: 88 },
  { name: "Sofia Rodriguez", action: "started Chemistry Test", time: "25 min ago", avatar: "SR", score: null },
  { name: "Alex Johnson", action: "completed Math Practice - 95%", time: "1 hour ago", avatar: "AJ", score: 95 }
]

const getScoreBadgeVariant = (score: number | null) => {
  if (score === null) return "outline"
  if (score >= 90) return "default"
  if (score >= 70) return "secondary"
  return "destructive"
}

export function RecentActivity() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors gap-2 sm:gap-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 dark:bg-blue-900">
                  <AvatarFallback className="text-blue-600 dark:text-blue-300 text-xs sm:text-sm">
                    {activity.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white text-xs sm:text-sm truncate">{activity.name}</p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{activity.action}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 ml-11 sm:ml-0">
                <span className="text-xs text-slate-400 dark:text-slate-500">{activity.time}</span>
                {activity.score !== null && (
                  <Badge variant={getScoreBadgeVariant(activity.score)} className="text-xs">
                    {activity.score}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

