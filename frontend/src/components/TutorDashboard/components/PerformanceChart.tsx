import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Data for different time periods
const performanceData7Days = [
  { period: "Day 1", performance: 75 },
  { period: "Day 2", performance: 82 },
  { period: "Day 3", performance: 78 },
  { period: "Day 4", performance: 85 },
  { period: "Day 5", performance: 88 },
  { period: "Day 6", performance: 84 },
  { period: "Day 7", performance: 90 }
]

const performanceData30Days = [
  { period: "Week 1", performance: 65 },
  { period: "Week 2", performance: 78 },
  { period: "Week 3", performance: 72 },
  { period: "Week 4", performance: 85 }
]

const performanceData90Days = [
  { period: "Month 1", performance: 68 },
  { period: "Month 2", performance: 75 },
  { period: "Month 3", performance: 82 }
]

const chartConfig = {
  performance: {
    label: "Performance",
    color: "#C8A882",
  },
}

export function PerformanceChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("30days")

  // Get the appropriate data based on selected period
  const getChartData = () => {
    switch (selectedPeriod) {
      case "7days":
        return performanceData7Days
      case "30days":
        return performanceData30Days
      case "90days":
        return performanceData90Days
      default:
        return performanceData30Days
    }
  }

  // Get the description text based on selected period
  const getDescription = () => {
    switch (selectedPeriod) {
      case "7days":
        return "Overall progress in the last 7 days."
      case "30days":
        return "Overall progress in the last 30 days."
      case "90days":
        return "Overall progress in the last 90 days."
      default:
        return "Overall progress in the last 30 days."
    }
  }

  const chartData = getChartData()

  return (
    <Card className="border-0 shadow-sm bg-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Class Performance Trends</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{getDescription()}</CardDescription>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1 flex items-center">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="0"
                stroke="hsl(var(--border))"
                vertical={false}
                opacity={0.3}
              />
              <XAxis
                dataKey="period"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
              />
              <Line
                type="natural"
                dataKey="performance"
                stroke="#C8A882"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, fill: "#C8A882" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

