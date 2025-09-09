"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, BookOpen, Users, Calendar, BarChart3, TrendingUp, Target, Settings } from "lucide-react"

import AssignmentManager from "@/components/assignment-manager"
import ProgressReports from "@/components/progress-reports"
import StudentManager from "@/components/student-manager"
import IntegratedSubjectsManager from "@/components/integrated-subjects-manager"
import SettingsManager from "@/components/settings-manager"

interface TutorDashboardProps {
  onBack: () => void
}

export default function TutorDashboard({ onBack }: TutorDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [dashboardStats, setDashboardStats] = useState({
    totalSubjects: 0,
    activeStudents: 0,
    pendingAssignments: 0,
    avgScore: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(false)
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"

  // Load dashboard statistics from API
  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true)

        // In a real implementation, you'd have a dashboard stats endpoint
        // For now, we'll simulate with individual API calls
        const [subjectsRes, studentsRes] = await Promise.all([
          fetch(`${API_BASE}/subjects`).catch(() => ({ ok: false })),
          fetch(`${API_BASE}/students`).catch(() => ({ ok: false }))
        ])

        let totalSubjects = 0
        let activeStudents = 0

        if (subjectsRes.ok) {
          const subjects = await subjectsRes.json()
          totalSubjects = subjects.length
        }

        if (studentsRes.ok) {
          const students = await studentsRes.json()
          activeStudents = students.length
        }

        setDashboardStats({
          totalSubjects,
          activeStudents,
          pendingAssignments: 5, // Would come from assignments API
          avgScore: 85, // Would come from progress API
          completionRate: 78 // Would come from progress API
        })
      } catch (e) {
        console.error("Failed to load dashboard stats:", e)
        // Use default values on error
        setDashboardStats({
          totalSubjects: 8,
          activeStudents: 24,
          pendingAssignments: 5,
          avgScore: 85,
          completionRate: 78
        })
      } finally {
        setLoading(false)
      }
    }
    loadDashboardStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
          </div>
          <div className="text-sm text-gray-500">Welcome back, Teacher!</div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects & Questions</TabsTrigger>
            <TabsTrigger value="students">Student Management</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : dashboardStats.totalSubjects}</div>
                  <p className="text-xs text-muted-foreground">Active subjects</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : dashboardStats.activeStudents}</div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Assignments</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : dashboardStats.pendingAssignments}</div>
                  <p className="text-xs text-muted-foreground">Due this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : `${dashboardStats.avgScore}%`}</div>
                  <p className="text-xs text-muted-foreground">Class average</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? "..." : `${dashboardStats.completionRate}%`}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest student submissions and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded"></div>
                        ))}
                      </div>
                    ) : (
                      recentSubmissions.map((submission) => (
                        <div key={submission._id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {submission.studentName} {submission.status} {submission.subject} - {submission.topic}
                            </p>
                            <p className="text-sm text-gray-500">
                              Score: {submission.percentage}% • {formatTimeAgo(submission.submittedAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" onClick={() => setActiveTab("subjects")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Question
                  </Button>
                  <Button
                    className="w-full justify-start bg-transparent"
                    variant="outline"
                    onClick={() => setActiveTab("assignments")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </CardContent>
              </Card>
            </div>
            <ProgressReports />
          </TabsContent>

          <TabsContent value="subjects">
            <IntegratedSubjectsManager />
          </TabsContent>

          <TabsContent value="students">
            <StudentManager />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentManager />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManager onBack={onBack} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
