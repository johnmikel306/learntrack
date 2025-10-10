import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"

interface Deadline {
  title: string
  subject: string
  dueDate: string
  urgency: string
  completed: number
  total: number
}

const upcomingDeadlines: Deadline[] = [
  { title: "Calculus Quiz", subject: "Mathematics", dueDate: "Today", urgency: "urgent", completed: 18, total: 24 },
  { title: "Motion Problems", subject: "Physics", dueDate: "Tomorrow", urgency: "urgent", completed: 12, total: 19 },
  { title: "Periodic Table", subject: "Chemistry", dueDate: "Dec 28", urgency: "normal", completed: 8, total: 22 }
]

const getUrgencyBadgeVariant = (urgency: string) => {
  if (urgency === "urgent") return "destructive"
  if (urgency === "normal") return "default"
  return "outline"
}

export function UpcomingDeadlines() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-500" />
          <CardTitle className="text-base sm:text-lg font-semibold">Upcoming Deadlines</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {upcomingDeadlines.map((deadline, index) => {
          const percentage = Math.round((deadline.completed / deadline.total) * 100)
          return (
            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-slate-900 dark:text-white text-sm">{deadline.title}</p>
                <Badge variant={getUrgencyBadgeVariant(deadline.urgency)}>
                  {deadline.dueDate}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{deadline.subject}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Progress</span>
                  <span>{deadline.completed}/{deadline.total}</span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">{percentage}% completed</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

