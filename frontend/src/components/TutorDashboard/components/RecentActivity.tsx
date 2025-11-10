import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, UserPlus, FileText } from "lucide-react"

interface Activity {
  student: string
  action: string
  assignment: string
  time: string
  type: "submitted" | "enrolled"
  icon: "check" | "user" | "file"
  iconBg: string
  iconColor: string
}

const recentActivity: Activity[] = [
  {
    student: "Ethan Martinez",
    action: "submitted",
    assignment: "Algebra II - Chapter 5 Quiz",
    time: "25 minutes ago",
    type: "submitted",
    icon: "check",
    iconBg: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    student: "Chloe Davis",
    action: "has enrolled in your",
    assignment: "Creative Writing",
    time: "2 hours ago",
    type: "enrolled",
    icon: "user",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    student: "Liam Thompson",
    action: "submitted",
    assignment: "History - The Roman Empire Essay",
    time: "Yesterday at 4:30 PM",
    type: "submitted",
    icon: "check",
    iconBg: "bg-green-50",
    iconColor: "text-green-600"
  }
]

export function RecentActivity() {
  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => {
            const Icon = activity.icon === "check" ? CheckCircle2 : activity.icon === "user" ? UserPlus : FileText
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={`h-10 w-10 ${activity.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${activity.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.student}</span> {activity.action}{" "}
                    <span className="text-orange-600 font-medium">{activity.assignment}</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}





