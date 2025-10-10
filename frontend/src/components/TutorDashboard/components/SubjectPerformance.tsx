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
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle className="text-base sm:text-lg font-semibold">Subject Performance Overview</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">Compare performance across all subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ minHeight: '256px', height: '320px' }}>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <RechartsBarChart data={subjectData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="avgScore"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="completionRate"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

