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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Top Performers This Week</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          View All
        </Button>
      </div>

      {/* Performer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topPerformers.map((performer, index) => (
          <Card key={index} className="border border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className={`h-10 w-10 ${performer.bgColor} dark:bg-opacity-30`}>
                  <AvatarFallback className={performer.textColor}>
                    {performer.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{performer.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{performer.subject}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-foreground">{performer.score}%</span>
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {performer.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

