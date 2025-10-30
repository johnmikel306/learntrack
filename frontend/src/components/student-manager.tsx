import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Users,
  GraduationCap,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Target,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { TopPerformers } from "@/components/TutorDashboard/components/TopPerformers"

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  grade: string
  enrollmentDate: string
  status: 'active' | 'inactive' | 'graduated'
  overallGrade: string
  averageScore: number
  assignmentsCompleted: number
  totalAssignments: number
  subjects: string[]
  lastActivity: string
}

export default function StudentManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [gradeFilter, setGradeFilter] = useState("all")
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const client = useApiClient()

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await client.get('/students/')
        if (response.error) {
          throw new Error(response.error)
        }
        // Map API response to Student interface
        const studentsData = (response.data || []).map((student: any) => ({
          id: student.clerk_id || student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar_url || undefined,
          grade: student.student_profile?.grade || "N/A",
          enrollmentDate: student.created_at ? new Date(student.created_at).toISOString().split('T')[0] : "N/A",
          status: student.is_active ? 'active' : 'inactive',
          overallGrade: "A", // TODO: Calculate from progress
          averageScore: student.student_profile?.averageScore || 0,
          assignmentsCompleted: 0, // TODO: Get from progress
          totalAssignments: 0, // TODO: Get from assignments
          subjects: student.student_profile?.subjects || [],
          lastActivity: student.updated_at ? new Date(student.updated_at).toLocaleString() : "N/A"
        }))
        setStudents(studentsData)
      } catch (err: any) {
        console.error('Failed to fetch students:', err)
        setError(err.message || 'Failed to load students')
        toast.error('Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'graduated':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 font-semibold'
    if (grade.startsWith('B')) return 'text-blue-600 font-semibold'
    if (grade.startsWith('C')) return 'text-yellow-600 font-semibold'
    return 'text-gray-600 font-semibold'
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter

    return matchesSearch && matchesStatus && matchesGrade
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Student Manager</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage student profiles and track their progress</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Top Performers Section */}
      <TopPerformers />

      {/* Filters and Search */}
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="9th Grade">9th Grade</SelectItem>
                <SelectItem value="10th Grade">10th Grade</SelectItem>
                <SelectItem value="11th Grade">11th Grade</SelectItem>
                <SelectItem value="12th Grade">12th Grade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" />
            Students ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-slate-700 rounded-full"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-300 dark:bg-slate-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-300 dark:bg-slate-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-slate-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            // Error state
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : filteredStudents.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No students found</h3>
              <p className="text-gray-600 dark:text-slate-400 mb-4">
                {searchTerm || statusFilter !== "all" || gradeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first student"}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
              <div key={student.id} className="p-4 bg-card border border-border rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-blue-600 dark:bg-blue-700 text-white font-semibold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <Badge className={`border-0 ${getStatusColor(student.status)}`}>
                          {student.status}
                        </Badge>
                        <span className={`text-sm ${getGradeColor(student.overallGrade)}`}>
                          {student.overallGrade}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-slate-400 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {student.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            {student.grade}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Average Score: <span className="font-semibold text-green-600">{student.averageScore}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Subjects: {student.subjects.join(', ')}
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Last Activity: {student.lastActivity}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-slate-400">
                            Assignment Progress: {student.assignmentsCompleted}/{student.totalAssignments}
                          </span>
                          <span className="text-gray-600 dark:text-slate-400">
                            {Math.round((student.assignmentsCompleted / student.totalAssignments) * 100)}%
                          </span>
                        </div>
                        <Progress value={(student.assignmentsCompleted / student.totalAssignments) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
