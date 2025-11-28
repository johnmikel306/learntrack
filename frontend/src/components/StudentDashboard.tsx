"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, BookOpen, Clock, CheckCircle, Star, Calendar, Trophy, Target, Flame } from "lucide-react"
import { toast } from "@/contexts/ToastContext"

import Announcements from "@/components/Announcements"
import EventCalendar from "@/components/EventCalendar"

import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useMyAssignments } from '@/hooks/useQueries'

interface StudentDashboardProps {
  onBack?: () => void
}

interface Assignment {
  id: string
  title: string
  subject: string
  topic: string
  dueDate: Date
  questionCount: number
  completedQuestions: number
  status: "pending" | "in-progress" | "completed"
  score?: number
}

interface Question {
  id: string
  question: string
  type: "multiple-choice" | "short-answer"
  options?: string[]
  userAnswer?: string
  isCorrect?: boolean
}

export default function StudentDashboard({ onBack }: StudentDashboardProps) {
  // Use React Query for assignments
  const { data: assignments = [], isLoading: loading, error } = useMyAssignments()

  // All assignments now come from API
  const displayAssignments = assignments as Assignment[]

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showingQuestion, setShowingQuestion] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

  // Placeholder data for student name
  const studentName = "Jane Doe";

  // Placeholder function for submitting an answer
  const submitAnswer = () => {
    handleNextQuestion();
  };

  // Questions should come from backend; empty default here
  const activeAssignmentQuestions: Question[] = []

  const startAssignment = (assignmentId: string) => {
    // In a real app, you'd fetch the questions for the assignment
    setShowingQuestion(true)
    setIsReviewing(false)
    setCurrentQuestionIndex(0)
  }

  const startReview = (assignmentId: string) => {
    setShowingQuestion(true)
    setIsReviewing(true)
    setCurrentQuestionIndex(0)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeAssignmentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // End of assignment
      setShowingQuestion(false)
      toast.success("Assignment submitted successfully!")
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const currentQuestion = activeAssignmentQuestions[currentQuestionIndex]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <BookOpen className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (showingQuestion) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => setShowingQuestion(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="text-sm text-gray-500">Question 8 of 10</div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Algebra Practice Set 1</CardTitle>
                  <CardDescription>Mathematics • Algebra</CardDescription>
                </div>
                <Badge variant="outline">Due: Dec 25</Badge>
              </div>
              <Progress value={70} className="mt-4" />
              <p className="text-sm text-gray-600">7 of 10 questions completed</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>

                {currentQuestion.type === "multiple-choice" && currentQuestion.options && (
                  <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="text-base">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {currentQuestion.type === "short-answer" && (
                  <Textarea
                    placeholder="Enter your answer here..."
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    rows={4}
                  />
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => alert("Going to the previous question is not yet implemented.")}>Previous Question</Button>
                <Button onClick={submitAnswer} disabled={!selectedAnswer}>
                  Next Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center w-full sm:w-auto">
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mr-2 sm:mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">Student Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mt-1 hidden sm:block">Welcome back, {studentName}! Ready to learn?</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto justify-end">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{studentName}</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">Student</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Average Card */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Overall Average</p>
                  <p className="text-3xl font-bold">87%</p>
                  <p className="text-purple-100 text-xs mt-1">+3% this week</p>
                </div>
                <Target className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          {/* Completed Assignments Card */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">24</p>
                  <p className="text-green-100 text-xs mt-1">assignments</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks Card */}
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold">5</p>
                  <p className="text-orange-100 text-xs mt-1">tasks due</p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          {/* Study Streak Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Study Streak</p>
                  <p className="text-3xl font-bold">12</p>
                  <p className="text-blue-100 text-xs mt-1">days in a row</p>
                </div>
                <Flame className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Assignments */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Assignments</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Algebra Quiz",
                      subject: "Mathematics",
                      dueDate: "Today",
                      difficulty: "Medium",
                      status: "pending",
                      progress: 0
                    },
                    {
                      title: "Physics Lab Report",
                      subject: "Physics",
                      dueDate: "Tomorrow",
                      difficulty: "Hard",
                      status: "in-progress",
                      progress: 60
                    },
                    {
                      title: "History Essay",
                      subject: "History",
                      dueDate: "Dec 28",
                      difficulty: "Easy",
                      status: "pending",
                      progress: 0
                    }
                  ].map((assignment, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-slate-400">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={assignment.dueDate === 'Today' ? 'destructive' : assignment.dueDate === 'Tomorrow' ? 'default' : 'secondary'}
                            className="mb-1"
                          >
                            {assignment.dueDate}
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-slate-500">
                            {assignment.difficulty} difficulty
                          </p>
                        </div>
                      </div>
                      {assignment.progress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-slate-400">Progress</span>
                            <span className="text-gray-900 dark:text-white">{assignment.progress}%</span>
                          </div>
                          <Progress value={assignment.progress} className="h-2" />
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <Badge
                          variant={assignment.status === 'pending' ? 'outline' : 'default'}
                          className="text-xs"
                        >
                          {assignment.status === 'pending' ? 'Not Started' : 'In Progress'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          {assignment.status === 'pending' ? 'Start' : 'Continue'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Subject Progress */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Subject Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { subject: "Mathematics", progress: 85, grade: "A-", color: "bg-blue-500" },
                    { subject: "Physics", progress: 78, grade: "B+", color: "bg-green-500" },
                    { subject: "Chemistry", progress: 92, grade: "A", color: "bg-purple-500" },
                    { subject: "History", progress: 73, grade: "B", color: "bg-orange-500" }
                  ].map((subject, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
                          <span className="font-medium text-gray-900 dark:text-white">{subject.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">{subject.grade}</Badge>
                          <span className="text-sm text-gray-600 dark:text-slate-400">{subject.progress}%</span>
                        </div>
                      </div>
                      <Progress value={subject.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Perfect Score",
                      description: "Scored 100% in Math Quiz",
                      icon: Trophy,
                      color: "text-yellow-500",
                      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
                      time: "2 days ago"
                    },
                    {
                      title: "Study Streak",
                      description: "10 days in a row",
                      icon: Flame,
                      color: "text-orange-500",
                      bgColor: "bg-orange-100 dark:bg-orange-900/20",
                      time: "Today"
                    },
                    {
                      title: "Quick Learner",
                      description: "Completed 5 assignments",
                      icon: Star,
                      color: "text-purple-500",
                      bgColor: "bg-purple-100 dark:bg-purple-900/20",
                      time: "1 week ago"
                    }
                  ].map((achievement, index) => {
                    const Icon = achievement.icon
                    return (
                      <div key={index} className={`flex items-center space-x-3 p-3 ${achievement.bgColor} rounded-lg hover:shadow-md transition-all duration-200`}>
                        <div className={`p-2 rounded-full bg-white dark:bg-slate-700 ${achievement.color} shadow-sm`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{achievement.title}</p>
                          <p className="text-xs text-gray-600 dark:text-slate-400 truncate">{achievement.description}</p>
                          <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">{achievement.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Grades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { assignment: "Algebra Test", grade: "A", score: 95, subject: "Math", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
                    { assignment: "Lab Report", grade: "B+", score: 87, subject: "Physics", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" },
                    { assignment: "Essay", grade: "A-", score: 91, subject: "English", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
                    { assignment: "Quiz", grade: "B", score: 83, subject: "History", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" }
                  ].map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{grade.assignment}</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{grade.subject}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`mb-1 border-0 ${grade.color}`}>
                          {grade.grade}
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-slate-500 font-medium">{grade.score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Star className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Start Study Session
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200">
                  <Trophy className="w-4 h-4 mr-2" />
                  View Achievements
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200">
                  <Target className="w-4 h-4 mr-2" />
                  Set Goals
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
