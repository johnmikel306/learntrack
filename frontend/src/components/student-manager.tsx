import React, { useState } from 'react'
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

  // Sample students data
  const students: Student[] = [
    {
      id: "1",
      name: "Emma Wilson",
      email: "emma.wilson@email.com",
      avatar: "/api/placeholder/40/40",
      grade: "10th Grade",
      enrollmentDate: "2023-09-01",
      status: "active",
      overallGrade: "A",
      averageScore: 92,
      assignmentsCompleted: 24,
      totalAssignments: 28,
      subjects: ["Mathematics", "Physics", "Chemistry"],
      lastActivity: "2 hours ago"
    },
    {
      id: "2",
      name: "James Smith",
      email: "james.smith@email.com",
      avatar: "/api/placeholder/40/40",
      grade: "11th Grade",
      enrollmentDate: "2023-09-01",
      status: "active",
      overallGrade: "B+",
      averageScore: 87,
      assignmentsCompleted: 22,
      totalAssignments: 25,
      subjects: ["Mathematics", "English", "History"],
      lastActivity: "1 day ago"
    },
    {
      id: "3",
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      avatar: "/api/placeholder/40/40",
      grade: "9th Grade",
      enrollmentDate: "2023-09-01",
      status: "active",
      overallGrade: "A-",
      averageScore: 89,
      assignmentsCompleted: 18,
      totalAssignments: 20,
      subjects: ["Biology", "Chemistry", "Mathematics"],
      lastActivity: "3 hours ago"
    },
    {
      id: "4",
      name: "Michael Brown",
      email: "michael.brown@email.com",
      avatar: "/api/placeholder/40/40",
      grade: "12th Grade",
      enrollmentDate: "2022-09-01",
      status: "graduated",
      overallGrade: "A+",
      averageScore: 95,
      assignmentsCompleted: 45,
      totalAssignments: 45,
      subjects: ["Physics", "Mathematics", "Computer Science"],
      lastActivity: "1 week ago"
    },
    {
      id: "5",
      name: "Lisa Davis",
      email: "lisa.davis@email.com",
      avatar: "/api/placeholder/40/40",
      grade: "10th Grade",
      enrollmentDate: "2023-09-01",
      status: "inactive",
      overallGrade: "B",
      averageScore: 82,
      assignmentsCompleted: 15,
      totalAssignments: 28,
      subjects: ["English", "History", "Art"],
      lastActivity: "2 weeks ago"
    }
  ]

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Manager</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Manage student profiles and track their progress</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Students</p>
                <p className="text-3xl font-bold">{students.filter(s => s.status === 'active').length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg. Score</p>
                <p className="text-3xl font-bold">
                  {Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / students.length)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Graduated</p>
                <p className="text-3xl font-bold">{students.filter(s => s.status === 'graduated').length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
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
                    <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400">No students found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
