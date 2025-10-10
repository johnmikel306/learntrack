import React, { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Star,
  Filter,
  Search,
  BookOpen,
  Target,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Flag,
  Clock,
  User
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface Question {
  id: string
  text: string
  type: string
  difficulty: string
  subject: string
  topic: string
  options?: string[]
  correctAnswer: string
  explanation: string
  points: number
  tags: string[]
  status: 'pending' | 'approved' | 'rejected' | 'needs-revision'
  createdBy: string
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  reviewComments?: string
  rating?: number
  usageCount: number
  successRate: number
}

interface ReviewStats {
  totalQuestions: number
  pendingReview: number
  approved: number
  rejected: number
  averageRating: number
}

export default function QuestionReviewer() {
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState("review")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [reviewComment, setReviewComment] = useState("")
  const [rating, setRating] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())

  // Fetch pending questions from backend
  useEffect(() => {
    fetchPendingQuestions()
  }, [])

  const fetchPendingQuestions = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/questions/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      } else {
        console.error('Failed to fetch pending questions')
      }
    } catch (error) {
      console.error('Error fetching pending questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (questionId: string) => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/questions/${questionId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove from pending list
        setQuestions(questions.filter(q => q.id !== questionId))
        console.log('Question approved:', questionId)
      } else {
        console.error('Failed to approve question')
      }
    } catch (error) {
      console.error('Error approving question:', error)
    }
  }

  const handleReject = async (questionId: string, reason?: string) => {
    try {
      const token = await getToken()
      const url = reason
        ? `${API_BASE_URL}/questions/${questionId}/reject?reason=${encodeURIComponent(reason)}`
        : `${API_BASE_URL}/questions/${questionId}/reject`

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove from pending list
        setQuestions(questions.filter(q => q.id !== questionId))
        console.log('Question rejected:', questionId)
      } else {
        console.error('Failed to reject question')
      }
    } catch (error) {
      console.error('Error rejecting question:', error)
    }
  }

  const handleRequestRevision = async (questionId: string, notes: string) => {
    try {
      const token = await getToken()
      const response = await fetch(
        `${API_BASE_URL}/questions/${questionId}/request-revision?notes=${encodeURIComponent(notes)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        console.log('Revision requested for question:', questionId)
        // Optionally refresh the list
        fetchPendingQuestions()
      } else {
        console.error('Failed to request revision')
      }
    } catch (error) {
      console.error('Error requesting revision:', error)
    }
  }

  const handleBulkApprove = async () => {
    try {
      const token = await getToken()
      const questionIds = Array.from(selectedQuestions)

      const response = await fetch(`${API_BASE_URL}/questions/bulk-approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionIds)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Bulk approved ${result.approved_count} questions`)
        // Remove approved questions from list
        setQuestions(questions.filter(q => !selectedQuestions.has(q.id)))
        setSelectedQuestions(new Set())
      } else {
        console.error('Failed to bulk approve questions')
      }
    } catch (error) {
      console.error('Error bulk approving questions:', error)
    }
  }

  const toggleQuestionSelection = (questionId: string) => {
    const newSelection = new Set(selectedQuestions)
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId)
    } else {
      newSelection.add(questionId)
    }
    setSelectedQuestions(newSelection)
  }

  // Sample questions for demo (will be replaced by API data)
  const sampleQuestions: Question[] = [
    {
      id: "1",
      text: "What is the solution to the equation 2x + 5 = 13?",
      type: "multiple-choice",
      difficulty: "intermediate",
      subject: "Mathematics",
      topic: "Algebra",
      options: ["x = 3", "x = 4", "x = 5", "x = 6"],
      correctAnswer: "x = 4",
      explanation: "To solve 2x + 5 = 13, subtract 5 from both sides to get 2x = 8, then divide by 2 to get x = 4.",
      points: 2,
      tags: ["algebra", "linear-equations"],
      status: "pending",
      createdBy: "AI Generator",
      createdAt: "2024-01-10T10:30:00Z",
      usageCount: 0,
      successRate: 0
    },
    {
      id: "2",
      text: "Explain the process of photosynthesis in plants.",
      type: "short-answer",
      difficulty: "intermediate",
      subject: "Biology",
      topic: "Photosynthesis",
      correctAnswer: "Photosynthesis is the process by which plants convert light energy into chemical energy using chlorophyll.",
      explanation: "This process involves the conversion of carbon dioxide and water into glucose and oxygen using sunlight.",
      points: 3,
      tags: ["biology", "photosynthesis", "plants"],
      status: "approved",
      createdBy: "Dr. Smith",
      createdAt: "2024-01-09T14:20:00Z",
      reviewedBy: "Prof. Johnson",
      reviewedAt: "2024-01-09T16:45:00Z",
      reviewComments: "Excellent question with clear explanation.",
      rating: 5,
      usageCount: 15,
      successRate: 87
    },
    {
      id: "3",
      text: "What is the capital of France?",
      type: "multiple-choice",
      difficulty: "beginner",
      subject: "Geography",
      topic: "European Capitals",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "Paris",
      explanation: "Paris is the capital and largest city of France.",
      points: 1,
      tags: ["geography", "capitals", "europe"],
      status: "needs-revision",
      createdBy: "AI Generator",
      createdAt: "2024-01-08T09:15:00Z",
      reviewedBy: "Prof. Wilson",
      reviewedAt: "2024-01-08T11:30:00Z",
      reviewComments: "Too basic for the target audience. Consider adding more context or complexity.",
      rating: 2,
      usageCount: 3,
      successRate: 95
    },
    {
      id: "4",
      text: "Calculate the derivative of f(x) = x^3 + 2x^2 - 5x + 1",
      type: "short-answer",
      difficulty: "advanced",
      subject: "Mathematics",
      topic: "Calculus",
      correctAnswer: "f'(x) = 3x^2 + 4x - 5",
      explanation: "Using the power rule: d/dx(x^n) = nx^(n-1), we get 3x^2 + 4x - 5.",
      points: 4,
      tags: ["calculus", "derivatives", "power-rule"],
      status: "rejected",
      createdBy: "AI Generator",
      createdAt: "2024-01-07T16:45:00Z",
      reviewedBy: "Dr. Brown",
      reviewedAt: "2024-01-07T18:20:00Z",
      reviewComments: "Calculation error in the explanation. The derivative is correct but explanation needs revision.",
      rating: 1,
      usageCount: 0,
      successRate: 0
    }
  ]

  // Review statistics
  const reviewStats: ReviewStats = {
    totalQuestions: questions.length,
    pendingReview: questions.filter(q => q.status === 'pending').length,
    approved: questions.filter(q => q.status === 'approved').length,
    rejected: questions.filter(q => q.status === 'rejected').length,
    averageRating: questions.filter(q => q.rating).reduce((acc, q) => acc + (q.rating || 0), 0) / questions.filter(q => q.rating).length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'needs-revision':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'needs-revision':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  // Use actual questions from API or sample for demo
  const displayQuestions = questions.length > 0 ? questions : sampleQuestions

  const filteredQuestions = displayQuestions.filter(question => {
    const matchesSearch = question.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || question.status === statusFilter
    const matchesSubject = subjectFilter === "all" || question.subject === subjectFilter

    return matchesSearch && matchesStatus && matchesSubject
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
            Question Reviewer
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Review and approve questions for quality assurance</p>
        </div>
        {selectedQuestions.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {selectedQuestions.size} selected
            </span>
            <Button
              onClick={handleBulkApprove}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Approve Selected
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Questions</p>
                <p className="text-3xl font-bold">{reviewStats.totalQuestions}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
                <p className="text-3xl font-bold">{reviewStats.pendingReview}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold">{reviewStats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold">{reviewStats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg. Rating</p>
                <p className="text-3xl font-bold">{reviewStats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="review">Review Queue</TabsTrigger>
          <TabsTrigger value="approved">Approved Questions</TabsTrigger>
          <TabsTrigger value="analytics">Review Analytics</TabsTrigger>
        </TabsList>

        {/* Review Queue Tab */}
        <TabsContent value="review" className="space-y-6">
          {/* Filters and Search */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search questions..."
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="needs-revision">Needs Revision</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                    <SelectItem value="Geography">Geography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Questions List */}
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Questions for Review ({filteredQuestions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  <p className="mt-4 text-gray-600 dark:text-slate-400">Loading questions...</p>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">All caught up!</p>
                  <p className="text-gray-600 dark:text-slate-400 mt-2">No pending questions to review.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredQuestions.map((question) => (
                    <Card key={question.id} className="border border-gray-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {question.status === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedQuestions.has(question.id)}
                                onChange={() => toggleQuestionSelection(question.id)}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                              />
                            )}
                            <Badge className={`border-0 ${getStatusColor(question.status)}`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(question.status)}
                                {question.status.replace('-', ' ')}
                              </div>
                            </Badge>
                            <Badge className={getDifficultyColor(question.difficulty)}>
                              {question.difficulty}
                            </Badge>
                            <Badge variant="outline">{question.type}</Badge>
                            <span className="text-sm text-gray-500">{question.points} pts</span>
                          </div>
                        <div className="flex items-center gap-2">
                          {question.rating && (
                            <div className="flex items-center gap-1">
                              {renderStars(question.rating)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Question:</h4>
                          <p className="text-gray-700 dark:text-slate-300">{question.text}</p>
                        </div>

                        {question.options && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Options:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className={`p-2 rounded text-sm ${option === question.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-800'}`}>
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                  {option}
                                  {option === question.correctAnswer && (
                                    <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Correct Answer:</h4>
                            <p className="text-green-700 dark:text-green-400 font-medium">{question.correctAnswer}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Subject & Topic:</h4>
                            <p className="text-gray-600 dark:text-slate-400">{question.subject} - {question.topic}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Explanation:</h4>
                          <p className="text-gray-600 dark:text-slate-400">{question.explanation}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-slate-500">
                            Created by {question.createdBy} • {new Date(question.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {question.reviewComments && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Review Comments:
                            </h4>
                            <p className="text-gray-700 dark:text-slate-300 text-sm">{question.reviewComments}</p>
                            {question.reviewedBy && (
                              <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                                Reviewed by {question.reviewedBy} • {question.reviewedAt && new Date(question.reviewedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {question.status === 'pending' && (
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <Button
                              onClick={() => handleApprove(question.id)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0"
                            >
                              <ThumbsUp className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleRequestRevision(question.id)}
                              className="hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Request Revision
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleReject(question.id)}
                              className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                            >
                              <ThumbsDown className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button variant="outline" className="ml-auto">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved Questions Tab */}
        <TabsContent value="approved" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Approved Questions
              </CardTitle>
              <CardDescription>Questions that have been reviewed and approved for use</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400">Approved questions will be displayed here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
                Review Analytics
              </CardTitle>
              <CardDescription>Insights and statistics about question review process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-slate-400">Review analytics and charts will be displayed here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
