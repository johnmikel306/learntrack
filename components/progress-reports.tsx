"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Download } from "lucide-react"
import { unparse } from "papaparse"

// Default data for when API is not available
const defaultStudentPerformanceData = [
  { name: "Sarah Johnson", math: 85, physics: 78, chemistry: 92 },
  { name: "Mike Chen", math: 92, physics: 88, chemistry: 85 },
  { name: "Emma Davis", math: 78, physics: 82, chemistry: 89 },
  { name: "John Smith", math: 88, physics: 95, chemistry: 76 },
  { name: "Lisa Wang", math: 94, physics: 87, chemistry: 91 },
]

const defaultWeeklyProgressData = [
  { week: "Week 1", completed: 45, assigned: 50 },
  { week: "Week 2", completed: 52, assigned: 55 },
  { week: "Week 3", completed: 48, assigned: 50 },
  { week: "Week 4", completed: 58, assigned: 60 },
]

const chartConfig = {
  math: {
    label: "Mathematics",
    color: "hsl(var(--chart-1))",
  },
  physics: {
    label: "Physics",
    color: "hsl(var(--chart-2))",
  },
  chemistry: {
    label: "Chemistry",
    color: "hsl(var(--chart-3))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  assigned: {
    label: "Assigned",
    color: "hsl(var(--chart-2))",
  },
}

export default function ProgressReports() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [studentPerformanceData, setStudentPerformanceData] = useState<typeof defaultStudentPerformanceData>([])
  const [weeklyProgressData, setWeeklyProgressData] = useState<typeof defaultWeeklyProgressData>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load progress data from API
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/progress/reports`)
        if (!res.ok) {
          throw new Error(`Failed to fetch progress reports: ${res.status} ${res.statusText}`)
        }

        const data = await res.json()
        setStudentPerformanceData(data.student_performance || [])
        setWeeklyProgressData(data.weekly_progress || [])

      } catch (e: any) {
        setError(e.message)
        console.error("Failed to load progress data:", e.message)

        // Fallback to default data when API fails
        setStudentPerformanceData(defaultStudentPerformanceData)
        setWeeklyProgressData(defaultWeeklyProgressData)
      } finally {
        setLoading(false)
      }
    }
    loadProgressData()
  }, [])

  const handleExport = () => {
    const csv = unparse(studentPerformanceData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "student_performance.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Progress Reports</h2>
            <p className="text-gray-600">Loading progress data...</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Progress Reports</h2>
          <p className="text-gray-600">
            {error ? `Error loading data: ${error}` : "Track student performance and engagement"}
          </p>
        </div>
        <Button onClick={handleExport} disabled={studentPerformanceData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Student Performance by Subject</CardTitle>
            <CardDescription>Average scores across different subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="math" fill="var(--color-math)" />
                  <Bar dataKey="physics" fill="var(--color-physics)" />
                  <Bar dataKey="chemistry" fill="var(--color-chemistry)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Assignment Progress</CardTitle>
            <CardDescription>Completion rates over the past 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} />
                  <Line type="monotone" dataKey="assigned" stroke="var(--color-assigned)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Individual Student Progress</CardTitle>
          <CardDescription>Detailed breakdown of each student's performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentPerformanceData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No student performance data available.</p>
                {error && <p className="text-sm mt-2">Please check your connection and try again.</p>}
              </div>
            ) : (
              studentPerformanceData.map((student, index) => (
              <div key={`student-${student.name}-${index}`} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{student.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">Math: {student.math}%</Badge>
                    <Badge variant="outline">Physics: {student.physics}%</Badge>
                    <Badge variant="outline">Chemistry: {student.chemistry}%</Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round((student.math + student.physics + student.chemistry) / 3)}%</span>
                  </div>
                  <Progress
                    value={Math.round((student.math + student.physics + student.chemistry) / 3)}
                    className="h-2"
                  />
                </div>
              </div>
            ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

