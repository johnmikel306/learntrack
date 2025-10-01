import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  BookOpen,
  Users,
  FileText,
  Target,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  FolderOpen,
  Tag,
  Calendar,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Subject {
  id: string
  name: string
  description: string
  color: string
  topics: string[]
  studentCount: number
  questionCount: number
  assignmentCount: number
  averageScore: number
  isActive: boolean
  createdDate: string
  lastUpdated: string
}

interface Topic {
  id: string
  name: string
  subjectId: string
  questionCount: number
  assignmentCount: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completionRate: number
}

export default function IntegratedSubjectsManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("subjects")

  // Sample subjects data
  const subjects: Subject[] = [
    {
      id: "1",
      name: "Mathematics",
      description: "Comprehensive mathematics curriculum covering algebra, geometry, and calculus",
      color: "bg-blue-500",
      topics: ["Algebra", "Geometry", "Calculus", "Statistics"],
      studentCount: 45,
      questionCount: 120,
      assignmentCount: 15,
      averageScore: 87,
      isActive: true,
      createdDate: "2023-09-01",
      lastUpdated: "2024-01-10"
    },
    {
      id: "2",
      name: "Physics",
      description: "Physics fundamentals including mechanics, thermodynamics, and electromagnetism",
      color: "bg-green-500",
      topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics"],
      studentCount: 38,
      questionCount: 95,
      assignmentCount: 12,
      averageScore: 82,
      isActive: true,
      createdDate: "2023-09-01",
      lastUpdated: "2024-01-08"
    },
    {
      id: "3",
      name: "Chemistry",
      description: "General chemistry covering atomic structure, bonding, and reactions",
      color: "bg-purple-500",
      topics: ["Atomic Structure", "Chemical Bonding", "Reactions", "Organic Chemistry"],
      studentCount: 42,
      questionCount: 88,
      assignmentCount: 10,
      averageScore: 85,
      isActive: true,
      createdDate: "2023-09-01",
      lastUpdated: "2024-01-05"
    },
    {
      id: "4",
      name: "English Literature",
      description: "Study of classic and contemporary literature with focus on analysis and writing",
      color: "bg-orange-500",
      topics: ["Shakespeare", "Modern Literature", "Poetry", "Essay Writing"],
      studentCount: 35,
      questionCount: 65,
      assignmentCount: 8,
      averageScore: 89,
      isActive: true,
      createdDate: "2023-09-01",
      lastUpdated: "2024-01-12"
    },
    {
      id: "5",
      name: "History",
      description: "World history from ancient civilizations to modern times",
      color: "bg-red-500",
      topics: ["Ancient History", "Medieval Period", "Modern History", "World Wars"],
      studentCount: 28,
      questionCount: 45,
      assignmentCount: 6,
      averageScore: 84,
      isActive: false,
      createdDate: "2023-09-01",
      lastUpdated: "2023-12-15"
    }
  ]

  // Sample topics data
  const topics: Topic[] = [
    { id: "1", name: "Algebra", subjectId: "1", questionCount: 35, assignmentCount: 5, difficulty: "intermediate", completionRate: 92 },
    { id: "2", name: "Geometry", subjectId: "1", questionCount: 28, assignmentCount: 4, difficulty: "beginner", completionRate: 88 },
    { id: "3", name: "Calculus", subjectId: "1", questionCount: 42, assignmentCount: 4, difficulty: "advanced", completionRate: 75 },
    { id: "4", name: "Mechanics", subjectId: "2", questionCount: 25, assignmentCount: 3, difficulty: "intermediate", completionRate: 85 },
    { id: "5", name: "Thermodynamics", subjectId: "2", questionCount: 22, assignmentCount: 3, difficulty: "advanced", completionRate: 78 },
    { id: "6", name: "Atomic Structure", subjectId: "3", questionCount: 20, assignmentCount: 2, difficulty: "beginner", completionRate: 94 },
    { id: "7", name: "Chemical Bonding", subjectId: "3", questionCount: 24, assignmentCount: 3, difficulty: "intermediate", completionRate: 82 }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "active" && subject.isActive) ||
                         (statusFilter === "inactive" && !subject.isActive)

    return matchesSearch && matchesStatus
  })

  const filteredTopics = topics.filter(topic => {
    const subject = subjects.find(s => s.id === topic.subjectId)
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (subject && subject.name.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects Manager</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Organize subjects, topics, and educational content</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Subjects</p>
                <p className="text-3xl font-bold">{subjects.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Subjects</p>
                <p className="text-3xl font-bold">{subjects.filter(s => s.isActive).length}</p>
              </div>
              <Target className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Topics</p>
                <p className="text-3xl font-bold">{topics.length}</p>
              </div>
              <Tag className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Questions</p>
                <p className="text-3xl font-bold">{subjects.reduce((acc, s) => acc + s.questionCount, 0)}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Subjects and Topics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
        </TabsList>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-6">
          {/* Filters and Search */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search subjects..."
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
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Subjects List */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                Subjects ({filteredSubjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-lg transition-all duration-200 border-0 bg-gray-50 dark:bg-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${subject.color}`}></div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{subject.name}</h3>
                        </div>
                        <Badge className={subject.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}>
                          {subject.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {subject.description}
                      </p>

                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                            <Users className="w-4 h-4" />
                            Students
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{subject.studentCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                            <FileText className="w-4 h-4" />
                            Questions
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">{subject.questionCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                            <Target className="w-4 h-4" />
                            Avg. Score
                          </span>
                          <span className="font-semibold text-green-600">{subject.averageScore}%</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-gray-500 dark:text-slate-500 mb-2">Topics ({subject.topics.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {subject.topics.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                          {subject.topics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{subject.topics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-green-50 dark:hover:bg-green-900/20">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredSubjects.length === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-slate-400">No subjects found matching your criteria.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          {/* Topics Search */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search topics..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Topics List */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Tag className="w-5 h-5 mr-2 text-purple-600" />
                Topics ({filteredTopics.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTopics.map((topic) => {
                  const subject = subjects.find(s => s.id === topic.subjectId)
                  return (
                    <div key={topic.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{topic.name}</h3>
                            <Badge className={getDifficultyColor(topic.difficulty)}>
                              {topic.difficulty}
                            </Badge>
                            {subject && (
                              <Badge variant="outline" className="text-xs">
                                {subject.name}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-slate-400 mb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {topic.questionCount} questions
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4" />
                              {topic.assignmentCount} assignments
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              {topic.completionRate}% completion rate
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-slate-400">Completion Progress</span>
                              <span className="text-gray-600 dark:text-slate-400">{topic.completionRate}%</span>
                            </div>
                            <Progress value={topic.completionRate} className="h-2" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <Eye className="w-4 h-4" />
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
                  )
                })}

                {filteredTopics.length === 0 && (
                  <div className="text-center py-8">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-slate-400">No topics found matching your criteria.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
