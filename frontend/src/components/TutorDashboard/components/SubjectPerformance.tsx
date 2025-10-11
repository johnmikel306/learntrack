import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { BarChart3 } from "lucide-react"

const subjectData = [
  { subject: "Math", avgScore: 85, completionRate: 92 },
  { subject: "Physics", avgScore: 78, completionRate: 88 },
  { subject: "Biology", avgScore: 82, completionRate: 90 }
]

const chartConfig = {
  avgScore: {
    label: "Avg Score",
    color: "hsl(var(--chart-1))",
  },
  completionRate: {
    label: "Completion Rate",
    color: "hsl(var(--chart-2))",
  },
}

export function SubjectPerformance() {
  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Subject Performance Overview</CardTitle>
        </div>
        <CardDescription>Compare performance across all subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={subjectData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="subject"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="avgScore"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="completionRate"
                fill="hsl(var(--secondary))"
                radius={[4, 4, 0, 0]}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

