import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Award, TrendingUp } from "lucide-react"

interface Performer {
  name: string
  subject: string
  score: number
  trend: string
  avatar: string
  bgColor: string
  textColor: string
}

const topPerformers: Performer[] = [
  { name: "Sarah Kim", subject: "Mathematics", score: 98, trend: "+5%", avatar: "SK", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  { name: "Michael Brown", subject: "Physics", score: 96, trend: "+6%", avatar: "MB", bgColor: "bg-green-100", textColor: "text-green-600" },
  { name: "Lisa Wang", subject: "Chemistry", score: 94, trend: "+3%", avatar: "LW", bgColor: "bg-purple-100", textColor: "text-purple-600" },
  { name: "David Lee", subject: "Biology", score: 92, trend: "+12%", avatar: "DL", bgColor: "bg-orange-100", textColor: "text-orange-600" }
]

export function TopPerformers() {
  return (
    <Card className="border-0 shadow-sm bg-indigo-50 dark:bg-indigo-950/30">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-base sm:text-lg font-semibold">Top Performers This Week</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {topPerformers.map((performer, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className={`h-10 w-10 ${performer.bgColor} dark:bg-opacity-30`}>
                  <AvatarFallback className={performer.textColor}>
                    {performer.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{performer.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{performer.subject}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{performer.score}%</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {performer.trend}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

