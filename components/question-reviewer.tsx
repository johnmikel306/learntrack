"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, Edit, FileText, Brain, AlertTriangle, ThumbsUp, ThumbsDown, Save } from "lucide-react"

interface GeneratedQuestion {
  id: string
  question: string
  type: "multiple-choice" | "true-false" | "short-answer"
  options?: string[]
  correctAnswer: string
  confidence: number
  status: "pending" | "approved" | "rejected"
}

interface QuestionBatch {
  id: string
  sourceFile: string
  subject: string
  topic: string
  questions: GeneratedQuestion[]
  generatedDate: Date
  status: string
}

interface QuestionReviewerProps {
  generatedQuestions: QuestionBatch[]
  setGeneratedQuestions: (questions: QuestionBatch[]) => void
}

export default function QuestionReviewer({ generatedQuestions, setGeneratedQuestions }: QuestionReviewerProps) {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editedQuestion, setEditedQuestion] = useState<GeneratedQuestion | null>(null)

  const pendingBatches = generatedQuestions.filter((batch) => batch.questions.some((q) => q.status === "pending"))

  const approveQuestion = (batchId: string, questionId: string) => {
    setGeneratedQuestions(
      generatedQuestions.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              questions: batch.questions.map((q) => (q.id === questionId ? { ...q, status: "approved" } : q)),
            }
          : batch,
      ),
    )
  }

  const rejectQuestion = (batchId: string, questionId: string) => {
    setGeneratedQuestions(
      generatedQuestions.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              questions: batch.questions.map((q) => (q.id === questionId ? { ...q, status: "rejected" } : q)),
            }
          : batch,
      ),
    )
  }

  const startEditing = (question: GeneratedQuestion) => {
    setEditingQuestion(question.id)
    setEditedQuestion({ ...question })
  }

  const saveEdit = (batchId: string) => {
    if (!editedQuestion) return

    setGeneratedQuestions(
      generatedQuestions.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              questions: batch.questions.map((q) =>
                q.id === editedQuestion.id ? { ...editedQuestion, status: "approved" } : q,
              ),
            }
          : batch,
      ),
    )
    setEditingQuestion(null)
    setEditedQuestion(null)
  }

  const cancelEdit = () => {
    setEditingQuestion(null)
    setEditedQuestion(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600"
    if (confidence >= 0.7) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>
    if (confidence >= 0.7) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>
    return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>
  }

  const bulkApprove = (batchId: string) => {
    setGeneratedQuestions(
      generatedQuestions.map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              questions: batch.questions.map((q) => (q.status === "pending" ? { ...q, status: "approved" } : q)),
            }
          : batch,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Question Review & Approval
          </CardTitle>
          <CardDescription>Review AI-generated questions and approve them for your question bank</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingBatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No questions pending review.</p>
              <p className="text-sm">Generate some questions first to start reviewing!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBatches.map((batch) => (
                <div key={batch.id} className="border rounded-lg">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <h3 className="font-semibold">{batch.sourceFile}</h3>
                          <Badge variant="outline">
                            {batch.subject} • {batch.topic}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{batch.questions.length} questions generated</span>
                          <span>{batch.questions.filter((q) => q.status === "pending").length} pending review</span>
                          <span>Generated: {batch.generatedDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => bulkApprove(batch.id)}
                          disabled={!batch.questions.some((q) => q.status === "pending")}
                        >
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          Approve All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBatch(selectedBatch === batch.id ? null : batch.id)}
                        >
                          {selectedBatch === batch.id ? "Collapse" : "Review Questions"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedBatch === batch.id && (
                    <div className="p-4">
                      <Tabs defaultValue="pending">
                        <TabsList className="mb-4">
                          <TabsTrigger value="pending">
                            Pending ({batch.questions.filter((q) => q.status === "pending").length})
                          </TabsTrigger>
                          <TabsTrigger value="approved">
                            Approved ({batch.questions.filter((q) => q.status === "approved").length})
                          </TabsTrigger>
                          <TabsTrigger value="rejected">
                            Rejected ({batch.questions.filter((q) => q.status === "rejected").length})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-4">
                          {batch.questions
                            .filter((q) => q.status === "pending")
                            .map((question, index) => (
                              <div key={question.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                                    <Badge variant="outline">{question.type}</Badge>
                                    {getConfidenceBadge(question.confidence)}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => startEditing(question)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => approveQuestion(batch.id, question.id)}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <ThumbsUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => rejectQuestion(batch.id, question.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {editingQuestion === question.id ? (
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Question</Label>
                                      <Textarea
                                        value={editedQuestion?.question || ""}
                                        onChange={(e) =>
                                          setEditedQuestion((prev) =>
                                            prev ? { ...prev, question: e.target.value } : null,
                                          )
                                        }
                                        rows={3}
                                      />
                                    </div>

                                    {question.type === "multiple-choice" && (
                                      <div>
                                        <Label>Answer Options</Label>
                                        <div className="space-y-2">
                                          {editedQuestion?.options?.map((option, optIndex) => (
                                            <Input
                                              key={optIndex}
                                              value={option}
                                              onChange={(e) => {
                                                if (!editedQuestion) return
                                                const newOptions = [...(editedQuestion.options || [])]
                                                newOptions[optIndex] = e.target.value
                                                setEditedQuestion({ ...editedQuestion, options: newOptions })
                                              }}
                                              placeholder={`Option ${optIndex + 1}`}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <Label>Correct Answer</Label>
                                      {question.type === "multiple-choice" ? (
                                        <Select
                                          value={editedQuestion?.correctAnswer || ""}
                                          onValueChange={(value) =>
                                            setEditedQuestion((prev) =>
                                              prev ? { ...prev, correctAnswer: value } : null,
                                            )
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {editedQuestion?.options?.map((option, optIndex) => (
                                              <SelectItem key={optIndex} value={option}>
                                                {option}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Textarea
                                          value={editedQuestion?.correctAnswer || ""}
                                          onChange={(e) =>
                                            setEditedQuestion((prev) =>
                                              prev ? { ...prev, correctAnswer: e.target.value } : null,
                                            )
                                          }
                                          rows={2}
                                        />
                                      )}
                                    </div>

                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={cancelEdit}>
                                        Cancel
                                      </Button>
                                      <Button onClick={() => saveEdit(batch.id)}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save & Approve
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div>
                                      <p className="font-medium mb-2">{question.question}</p>
                                      {question.type === "multiple-choice" && question.options && (
                                        <div className="space-y-1">
                                          {question.options.map((option, optIndex) => (
                                            <div
                                              key={optIndex}
                                              className={`text-sm p-2 rounded ${
                                                option === question.correctAnswer
                                                  ? "bg-green-50 text-green-800 font-medium"
                                                  : "bg-gray-50"
                                              }`}
                                            >
                                              {String.fromCharCode(65 + optIndex)}. {option}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      {question.type === "true-false" && (
                                        <div className="text-sm">
                                          <span className="font-medium">Correct Answer: </span>
                                          <span
                                            className={
                                              question.correctAnswer === "true" ? "text-green-600" : "text-red-600"
                                            }
                                          >
                                            {question.correctAnswer.charAt(0).toUpperCase() +
                                              question.correctAnswer.slice(1)}
                                          </span>
                                        </div>
                                      )}
                                      {question.type === "short-answer" && (
                                        <div className="text-sm bg-green-50 p-2 rounded">
                                          <span className="font-medium">Expected Answer: </span>
                                          {question.correctAnswer}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                      <span className={getConfidenceColor(question.confidence)}>
                                        AI Confidence: {Math.round(question.confidence * 100)}%
                                      </span>
                                      {question.confidence < 0.7 && (
                                        <div className="flex items-center gap-1 text-yellow-600">
                                          <AlertTriangle className="h-4 w-4" />
                                          <span>Review recommended</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="approved" className="space-y-4">
                          {batch.questions
                            .filter((q) => q.status === "approved")
                            .map((question, index) => (
                              <div key={question.id} className="border rounded-lg p-4 bg-green-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">{question.question}</span>
                                  </div>
                                  <Badge className="bg-green-100 text-green-800">Approved</Badge>
                                </div>
                              </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="rejected" className="space-y-4">
                          {batch.questions
                            .filter((q) => q.status === "rejected")
                            .map((question, index) => (
                              <div key={question.id} className="border rounded-lg p-4 bg-red-50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span className="font-medium">{question.question}</span>
                                  </div>
                                  <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                                </div>
                              </div>
                            ))}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
