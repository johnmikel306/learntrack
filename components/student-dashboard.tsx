"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, BookOpen, Clock, CheckCircle, Star, Calendar, Trophy } from "lucide-react"

import { format } from "date-fns"
import { toast } from "sonner"

interface StudentDashboardProps {
  onBack: () => void
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
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load assignments from FastAPI
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/assignments/student`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setAssignments(data)
      } catch (e: any) {
        setError(e.message)
        toast("Failed to load assignments: " + e.message)
      } finally {
        setLoading(false)
      }
    }
    loadAssignments()
  }, [])

  // All assignments now come from API
  const displayAssignments = assignments

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showingQuestion, setShowingQuestion] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)

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
      <div className="min-h-screen bg-gray-50 p-4">
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          </div>
          <div className="text-sm text-gray-500">
            {loading ? "Welcome back!" : `Welcome back, ${studentName}!`}
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 pending, 1 in progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">78%</div>
              <p className="text-xs text-muted-foreground">+12% this week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">Great work!</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Assignments</CardTitle>
                <CardDescription>Complete your daily practice questions</CardDescription>
              </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(assignment.status)}
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span>
                              {assignment.subject} • {assignment.topic}
                            </span>
                            <span>Due: {format(assignment.dueDate, "MMM dd")}</span>
                          </div>
                          {assignment.status === "completed" && assignment.score && (
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-medium">Score: {assignment.score}%</span>
                            </div>
                          )}
                          {assignment.status !== "completed" && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span>
                                  {assignment.completedQuestions}/{assignment.questionCount} questions
                                </span>
                              </div>
                              <Progress
                                value={(assignment.completedQuestions / assignment.questionCount) * 100}
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          {assignment.status === "pending" && (
                            <Button onClick={() => startAssignment(assignment.id)}>Start</Button>
                          )}
                          {assignment.status === "in-progress" && (
                            <Button onClick={() => startAssignment(assignment.id)}>Continue</Button>
                          )}
                          {assignment.status === "completed" && <Button variant="outline" onClick={() => alert("Review functionality coming soon!")}>Review</Button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your learning plan for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">Math Practice</p>
                      <p className="text-sm text-gray-600">Algebra - 10 questions</p>
                    </div>
                    <Badge variant="outline">Due Today</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Physics Quiz</p>
                      <p className="text-sm text-gray-600">Mechanics - 15 questions</p>
                    </div>
                    <Badge variant="outline">Due Dec 28</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Your latest accomplishments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Trophy className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Perfect Score!</p>
                      <p className="text-sm text-gray-600">Chemistry Basics - 100%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Star className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Streak Master</p>
                      <p className="text-sm text-gray-600">7 days in a row</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Quick Learner</p>
                      <p className="text-sm text-gray-600">50 questions this week</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
