import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { TrendingUp } from "lucide-react"

const performanceData = [
  { month: "Aug", avgScore: 75, engagement: 68 },
  { month: "Sep", avgScore: 78, engagement: 72 },
  { month: "Oct", avgScore: 82, engagement: 75 },
  { month: "Nov", avgScore: 85, engagement: 80 },
  { month: "Dec", avgScore: 87, engagement: 85 }
]

const chartConfig = {
  avgScore: {
    label: "Avg Score",
    color: "hsl(var(--chart-1))",
  },
  engagement: {
    label: "Engagement",
    color: "hsl(var(--chart-2))",
  },
}

export function PerformanceChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-base sm:text-lg font-semibold">Performance & Engagement Trends</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">Track student progress and engagement over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ minHeight: '256px', height: '320px' }}>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvgScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  stroke="hsl(var(--chart-1))"
                  fillOpacity={1}
                  fill="url(#colorAvgScore)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(var(--chart-2))"
                  fillOpacity={1}
                  fill="url(#colorEngagement)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

