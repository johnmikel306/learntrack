"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, HelpCircle, Edit, Trash2, Brain, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface Question {
  id: string
  subject: string
  topic: string
  question: string
  type: "multiple-choice" | "short-answer" | "essay" | "true-false"
  options?: string[]
  correctAnswer: string
  difficulty: "easy" | "medium" | "hard"
  sourceFile?: string // Add this field
  aiGenerated?: boolean // Add this field
  confidence?: number // Add this field
}

export default function QuestionManager() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load questions from FastAPI
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/questions`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setQuestions(data)
      } catch (e: any) {
        setError(e.message)
        toast({ title: "Failed to load questions", description: e.message })
      } finally {
        setLoading(false)
      }
    }
    loadQuestions()
  }, [])

  const [isAddingQuestion, setIsAddingQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    subject: "",
    topic: "",
    question: "",
    type: "multiple-choice" as const,
    options: ["", "", "", ""],
    correctAnswer: "",
    difficulty: "medium" as const,
  })

  const subjects = ["Mathematics", "Physics", "Chemistry"]
  const topics = {
    Mathematics: ["Algebra", "Geometry", "Calculus"],
    Physics: ["Mechanics", "Thermodynamics", "Optics"],
    Chemistry: ["Organic", "Inorganic", "Physical"],
  }

  const addQuestion = () => {
    if (newQuestion.question.trim() && newQuestion.subject && newQuestion.topic) {
      const question: Question = {
        id: Date.now().toString(),
        ...newQuestion,
        options: newQuestion.type === "multiple-choice" ? newQuestion.options.filter((opt) => opt.trim()) : undefined,
      }
      setQuestions([...questions, question])
      setNewQuestion({
        subject: "",
        topic: "",
        question: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        difficulty: "medium",
      })
      setIsAddingQuestion(false)
    }
  }

  const deleteQuestion = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Question Bank</CardTitle>
            <CardDescription>Create and manage your questions</CardDescription>
          </div>
          <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Question</DialogTitle>
                <DialogDescription>Create a new question for your question bank</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={newQuestion.subject}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, subject: value, topic: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="topic">Topic</Label>
                    <Select
                      value={newQuestion.topic}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, topic: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {newQuestion.subject &&
                          topics[newQuestion.subject as keyof typeof topics]?.map((topic) => (
                            <SelectItem key={topic} value={topic}>
                              {topic}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="question-text">Question</Label>
                  <Textarea
                    id="question-text"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    placeholder="Enter your question here..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={newQuestion.type}
                      onValueChange={(value: any) => setNewQuestion({ ...newQuestion, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                        <SelectItem value="short-answer">Short Answer</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select
                      value={newQuestion.difficulty}
                      onValueChange={(value: any) => setNewQuestion({ ...newQuestion, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newQuestion.type === "multiple-choice" && (
                  <div>
                    <Label>Answer Options</Label>
                    <div className="space-y-2">
                      {newQuestion.options.map((option, index) => (
                        <Input
                          key={`option-input-${index}`}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options]
                            newOptions[index] = e.target.value
                            setNewQuestion({ ...newQuestion, options: newOptions })
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="correct-answer">Correct Answer</Label>
                  {newQuestion.type === "multiple-choice" ? (
                    <Select
                      value={newQuestion.correctAnswer}
                      onValueChange={(value) => setNewQuestion({ ...newQuestion, correctAnswer: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {newQuestion.options
                          .filter((opt) => opt.trim())
                          .map((option, index) => (
                            <SelectItem key={`correct-answer-${index}-${option}`} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Textarea
                      id="correct-answer"
                      value={newQuestion.correctAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}
                      placeholder="Enter the correct answer..."
                      rows={2}
                    />
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingQuestion(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addQuestion}>Add Question</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline">{question.subject}</Badge>
                    <Badge variant="secondary">{question.topic}</Badge>
                    <Badge
                      variant={
                        question.difficulty === "easy"
                          ? "default"
                          : question.difficulty === "medium"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {question.difficulty}
                    </Badge>
                  </div>
                  {question.sourceFile && (
                    <div className="text-xs text-blue-600 mb-1">
                      <FileText className="h-3 w-3 inline mr-1" />
                      Source: {question.sourceFile}
                    </div>
                  )}
                  {question.aiGenerated && (
                    <Badge variant="outline" className="text-purple-600 border-purple-200">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Generated
                      {question.confidence && ` (${Math.round(question.confidence * 100)}%)`}
                    </Badge>
                  )}
                  <p className="font-medium mb-2">{question.question}</p>
                  {question.type === "multiple-choice" && question.options && (
                    <div className="text-sm text-gray-600">
                      <p className="mb-1">Options:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {question.options.map((option, index) => (
                          <li
                            key={index}
                            className={option === question.correctAnswer ? "text-green-600 font-medium" : ""}
                          >
                            {option}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {question.type !== "multiple-choice" && (
                    <p className="text-sm text-green-600">
                      <strong>Answer:</strong> {question.correctAnswer}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteQuestion(question.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
