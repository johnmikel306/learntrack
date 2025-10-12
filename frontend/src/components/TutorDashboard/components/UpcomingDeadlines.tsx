import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar } from "lucide-react"

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
  { title: "Periodic Table", subject: "Chemistry", dueDate: "Dec 28", urgency: "normal", completed: 8, total: 22 },
  { title: "Essay Review", subject: "English", dueDate: "Dec 30", urgency: "normal", completed: 15, total: 20 }
]

const getUrgencyColor = (urgency: string) => {
  if (urgency === "urgent") return "text-destructive"
  return "text-muted-foreground"
}

export function UpcomingDeadlines() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
      </div>

      {/* Deadline Items */}
      <div className="space-y-2">
        {upcomingDeadlines.map((deadline, index) => {
          const percentage = Math.round((deadline.completed / deadline.total) * 100)
          return (
            <div
              key={index}
              className="bg-card border border-border rounded-lg p-3 hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-medium text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors">
                  {deadline.title}
                </p>
                <Badge
                  variant={deadline.urgency === "urgent" ? "destructive" : "secondary"}
                  className="text-[10px] px-1.5 py-0.5 h-auto shrink-0"
                >
                  {deadline.dueDate}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{deadline.subject}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  {deadline.completed}/{deadline.total} completed
                </span>
                <span className={`font-medium ${percentage < 50 ? 'text-destructive' : percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

