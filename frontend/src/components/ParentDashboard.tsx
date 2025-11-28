"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, Mail, ArrowLeft, Users, Target } from "lucide-react"
import { toast } from "@/contexts/ToastContext"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import Announcements from "@/components/Announcements"
import EventCalendar from "@/components/EventCalendar"
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useParentProgress } from '@/hooks/useQueries'
import { useApiClient } from '@/lib/api-client'

interface ParentDashboardProps {
  onBack?: () => void
}

export default function ParentDashboard({ onBack }: ParentDashboardProps) {
  const [selectedChild, setSelectedChild] = useState<string>("Emma Wilson")

  // Use React Query for progress data
  const { data: progressDataArray, isLoading: loading, error } = useParentProgress()
  const progressData = progressDataArray?.[0] // Assuming first child for now

  // Use API data - no fallback to mock data
  const weeklyProgressData = progressData?.analytics?.weekly_progress || []
  const subjectPerformanceData = progressData?.analytics?.subject_performance || []
  const recentAssignments = progressData?.recent_assignments || []

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading progress data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">Failed to load data</p>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center w-full lg:w-auto">
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mr-2 sm:mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">Parent Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-1 hidden sm:block">Monitor your child's academic progress</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full lg:w-auto">
            <ThemeToggle />

            {/* Child Selector */}
            <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 shadow-sm flex-1 sm:flex-initial">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-slate-400" />
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:inline">Child:</label>
              <select
                value={selectedChild || ""}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="bg-transparent border-none text-xs sm:text-sm font-medium text-gray-900 dark:text-white focus:outline-none flex-1"
              >
                <option value="">Select Child</option>
                <option value="Emma Wilson">Emma Wilson</option>
                <option value="James Wilson">James Wilson</option>
              </select>
            </div>

            <Button
              variant="outline"
              onClick={() => toast.success("Report has been sent successfully!")}
              className="border-gray-300 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-800 text-xs sm:text-sm"
            >
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">Email Report</span>
              <span className="sm:hidden">Report</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 flex gap-4 sm:gap-6 flex-col md:flex-row">
        {/* LEFT */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4 sm:gap-6 lg:gap-8">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Overall Grade Card */}
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Overall Grade</p>
                    <p className="text-3xl font-bold">A-</p>
                    <p className="text-purple-100 text-xs mt-1">88% average</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            {/* Assignments Completed Card */}
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Assignments</p>
                    <p className="text-3xl font-bold">24/28</p>
                    <p className="text-green-100 text-xs mt-1">completed</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            {/* Attendance Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Attendance</p>
                    <p className="text-3xl font-bold">96%</p>
                    <p className="text-blue-100 text-xs mt-1">this month</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            {/* Study Hours Card */}
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Study Hours</p>
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-orange-100 text-xs mt-1">this week</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS SECTION */}
          <div className="flex gap-4 flex-col lg:flex-row">
            {/* WEEKLY ACTIVITY CHART */}
            <div className="w-full lg:w-1/2 h-[450px]">
              <Card className="bg-white rounded-lg p-4 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                    Weekly Activity
                  </CardTitle>
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
            </div>

            {/* SUBJECT PERFORMANCE CHART */}
            <div className="w-full lg:w-1/2 h-[450px]">
              <Card className="bg-white rounded-lg p-4 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2 text-purple-600" />
                    Subject Performance
                  </CardTitle>
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
          </div>

          {/* RECENT ACTIVITY */}
          <div className="w-full h-[300px]">
            <Card className="bg-white rounded-lg p-4 h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest assignments and achievements</CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="space-y-4">
                  {recentAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentAssignments.map((assignment: any) => {
                      const isCompleted = assignment.status === 'Completed' || assignment.status === 'completed'
                      const isInProgress = assignment.status === 'In Progress' || assignment.status === 'in_progress'
                      const isPending = assignment.status === 'Pending' || assignment.status === 'pending'

                      const bgColor = isCompleted ? 'bg-green-50 dark:bg-green-900/20' :
                                     isInProgress ? 'bg-blue-50 dark:bg-blue-900/20' :
                                     'bg-yellow-50 dark:bg-yellow-900/20'
                      const iconColor = isCompleted ? 'text-green-600' :
                                       isInProgress ? 'text-blue-600' :
                                       'text-yellow-600'
                      const badgeColor = isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                        isInProgress ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      const Icon = isCompleted ? CheckCircle : isInProgress ? Clock : AlertCircle

                      return (
                        <div key={assignment.id} className={`${bgColor} rounded-lg p-4 hover:shadow-md transition-all duration-200`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${iconColor}`} />
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{assignment.title}</p>
                                <p className="text-sm text-gray-600 dark:text-slate-400">
                                  {isCompleted && assignment.score ? `Score: ${assignment.score}%` : ''}
                                  {isInProgress && assignment.completed && assignment.total ? `${assignment.completed} of ${assignment.total} completed` : ''}
                                  {isPending && assignment.dueDate ? `Due: ${assignment.dueDate}` : ''}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${badgeColor} border-0`}>{assignment.status}</Badge>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Teacher Messages - Uses conversations from API */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Teacher Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData?.teacher_messages && progressData.teacher_messages.length > 0 ? (
                  progressData.teacher_messages.map((message: any, index: number) => {
                    const priorityColor = message.priority === 'high'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : message.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'

                    return (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">{message.teacher}</p>
                              <Badge className={`text-xs border-0 ${priorityColor}`}>
                                {message.priority || 'normal'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-slate-400">{message.subject}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-slate-300 mb-2">{message.message}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">{message.time}</p>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages from teachers</p>
                  </div>
                )}
              </div>
              <Button className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0">
                <Mail className="w-4 h-4 mr-2" />
                Contact Teachers
              </Button>
            </CardContent>
          </Card>

          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </div>
  )
}


