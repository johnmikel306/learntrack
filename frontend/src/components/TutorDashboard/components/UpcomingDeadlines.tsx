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
    <Card className="border border-border bg-card h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">Deadlines</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingDeadlines.map((deadline, index) => {
          const percentage = Math.round((deadline.completed / deadline.total) * 100)
          return (
            <div
              key={index}
              className="pb-3 border-b border-border last:border-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-foreground text-xs line-clamp-1">{deadline.title}</p>
                <Badge
                  variant={deadline.urgency === "urgent" ? "destructive" : "secondary"}
                  className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                >
                  {deadline.dueDate}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{deadline.subject}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">
                  {deadline.completed}/{deadline.total}
                </span>
                <span className={`font-medium ${percentage < 50 ? 'text-destructive' : 'text-success'}`}>
                  {percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

