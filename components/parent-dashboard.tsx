"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, Mail, ArrowLeft } from "lucide-react"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ParentDashboardProps {
  onBack: () => void
}

interface ParentDashboardProps {
  onBack: () => void
}

export default function ParentDashboard({ onBack }: ParentDashboardProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [progressData, setProgressData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load progress data from API
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/progress/parent`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setProgressData(data[0]) // Assuming first child for now
      } catch (e: any) {
        setError(e.message)
        console.error("Failed to load progress data:", e.message)
      } finally {
        setLoading(false)
      }
    }
    loadProgressData()
  }, [])

  // Default data structure for when API is not available
  const defaultData = {
    analytics: {
      weekly_progress: [
        { date: "Dec 18", completed: 8, assigned: 10, score: 85 },
        { date: "Dec 19", completed: 12, assigned: 12, score: 92 },
        { date: "Dec 20", completed: 6, assigned: 8, score: 78 },
        { date: "Dec 21", completed: 10, assigned: 10, score: 88 },
        { date: "Dec 22", completed: 15, assigned: 15, score: 94 },
        { date: "Dec 23", completed: 7, assigned: 10, score: 82 },
        { date: "Dec 24", completed: 5, assigned: 8, score: 90 },
      ],
      subject_performance: [
        { subject: "Math", thisWeek: 88, lastWeek: 82 },
        { subject: "Physics", thisWeek: 92, lastWeek: 89 },
        { subject: "Chemistry", thisWeek: 85, lastWeek: 87 },
      ]
    },
    recent_assignments: [
      {
        id: "1",
        title: "Algebra Practice Set 1",
        subject: "Mathematics",
        status: "In Progress",
        dueDate: "Dec 25, 2024",
        progress: 70,
        completed: 7,
        total: 10,
      },
      {
        id: "2",
        title: "Chemistry Basics",
        subject: "Chemistry",
        status: "Completed",
        completedDate: "Dec 20, 2024",
        score: 85,
      },
      {
        id: "3",
        title: "Physics Mechanics Quiz",
        subject: "Physics",
        status: "Pending",
        dueDate: "Dec 28, 2024",
        questions: 15,
      },
    ]
  }

  // Use API data if available, fallback to default for demo
  const currentData = progressData || defaultData
  const weeklyProgressData = currentData.analytics?.weekly_progress || defaultData.analytics.weekly_progress
  const subjectPerformanceData = currentData.analytics?.subject_performance || defaultData.analytics.subject_performance
  const assignmentHistory = currentData.recent_assignments || defaultData.recent_assignments

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  assigned: {
    label: "Assigned",
    color: "hsl(var(--chart-2))",
  },
  score: {
    label: "Score",
    color: "hsl(var(--chart-3))",
  },
  thisWeek: {
    label: "This Week",
    color: "hsl(var(--chart-1))",
  },
  lastWeek: {
    label: "Last Week",
    color: "hsl(var(--chart-2))",
  },
}

  const [selectedChild] = useState("Sarah Johnson")
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading progress data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Report
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Email Report</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to email a copy of this report to your registered email address?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => toast.success("Report has been sent successfully!")}>
                    Send Email
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="text-sm text-gray-500">Monitoring: {selectedChild}</div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Detailed Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">6/7</div>
                  <p className="text-xs text-muted-foreground">Days completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">+5% from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">88%</div>
                  <p className="text-xs text-muted-foreground">Excellent performance</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">Days in a row</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>Daily completion and performance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyProgressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} />
                        <Line type="monotone" dataKey="score" stroke="var(--color-score)" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Comparison between this week and last week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" />
                        <YAxis />
                        <Tooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="thisWeek" fill="var(--color-thisWeek)" />
                        <Bar dataKey="lastWeek" fill="var(--color-lastWeek)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest assignments and achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Chemistry Basics Completed</p>
                          <p className="text-sm text-gray-600">Score: 85% • 2 hours ago</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Completed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Math Practice In Progress</p>
                          <p className="text-sm text-gray-600">7 of 10 questions completed</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium">Physics Quiz Due Tomorrow</p>
                          <p className="text-sm text-gray-600">15 questions • Not started</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Insights</CardTitle>
                  <CardDescription>Key observations and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">Strong Performance</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Consistent improvement in Mathematics over the past 2 weeks
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Good Habits</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Maintains regular study schedule, typically completing tasks in the evening
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Area for Focus</span>
                    </div>
                    <p className="text-sm text-yellow-700">Could benefit from more practice in Chemistry concepts</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mathematics</CardTitle>
                  <CardDescription>Current progress and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>88%</span>
                    </div>
                    <Progress value={88} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Topics:</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Algebra</span>
                        <Badge variant="outline">92%</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Geometry</span>
                        <Badge variant="outline">85%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Physics</CardTitle>
                  <CardDescription>Current progress and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Topics:</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Mechanics</span>
                        <Badge variant="outline">95%</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Thermodynamics</span>
                        <Badge variant="outline">89%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chemistry</CardTitle>
                  <CardDescription>Current progress and performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Topics:</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Organic</span>
                        <Badge variant="outline">82%</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Inorganic</span>
                        <Badge variant="outline">88%</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assignment History</CardTitle>
                <CardDescription>Complete overview of all assignments and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignmentHistory.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{assignment.title}</h3>
                        <Badge
                          className={
                            assignment.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : assignment.status === "In Progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {assignment.subject} •{" "}
                        {assignment.status === "Completed"
                          ? `Completed: ${assignment.completedDate}`
                          : `Due: ${assignment.dueDate}`}
                      </div>
                      {assignment.status === "In Progress" && (
                        <div className="flex items-center justify-between">
                          <Progress value={assignment.progress} className="flex-1 mr-4" />
                          <span className="text-sm">
                            {assignment.completed}/{assignment.total} completed
                          </span>
                        </div>
                      )}
                      {assignment.status === "Completed" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Final Score: {assignment.score}%</span>
                          <Button variant="outline" size="sm" onClick={() => setSelectedAssignment(assignment)}>
                            View Details
                          </Button>
                        </div>
                      )}
                      {assignment.status === "Pending" && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{assignment.questions} questions • Not started</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.success(`Reminder sent for "${assignment.title}"!`)}
                          >
                            Remind Student
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={selectedAssignment !== null} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedAssignment?.title}</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.subject} • Completed: {selectedAssignment?.completedDate}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Final Score: <strong>{selectedAssignment?.score}%</strong>
              </p>
              <p>A more detailed breakdown of the assignment results would be displayed here.</p>
              <Button onClick={() => setSelectedAssignment(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

