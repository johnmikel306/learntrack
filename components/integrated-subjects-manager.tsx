"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Brain, CheckCircle } from "lucide-react"
import QuestionBank from "@/components/question-bank"
import AIQuestionGenerator from "@/components/ai-question-generator"
import QuestionReviewer from "@/components/question-reviewer"

export default function IntegratedSubjectsManager() {
  const [activeTab, setActiveTab] = useState("bank")
  const [uploadedFiles, setUploadedFiles] = useState([
    {
      id: "1",
      name: "Algebra Fundamentals.pdf",
      subject: "Mathematics",
      topic: "Algebra",
      uploadDate: new Date(2024, 11, 20),
      status: "processed",
      questionCount: 15,
    },
    {
      id: "2",
      name: "Physics Mechanics Slides.pptx",
      subject: "Physics",
      topic: "Mechanics",
      uploadDate: new Date(2024, 11, 22),
      status: "processing",
      questionCount: 0,
    },
  ])

  const [generatedQuestions, setGeneratedQuestions] = useState([
    {
      id: "1",
      sourceFile: "Algebra Fundamentals.pdf",
      subject: "Mathematics",
      topic: "Algebra",
      questions: [
        {
          id: "q1",
          question: "What is the solution to the equation 2x + 5 = 13?",
          type: "multiple-choice",
          options: ["x = 3", "x = 4", "x = 5", "x = 6"],
          correctAnswer: "x = 4",
          confidence: 0.95,
          status: "pending",
        },
        {
          id: "q2",
          question: "Linear equations have a constant rate of change.",
          type: "true-false",
          correctAnswer: "true",
          confidence: 0.88,
          status: "pending",
        },
      ],
      generatedDate: new Date(2024, 11, 20),
      status: "pending-review",
    },
  ])

  const pendingReviewCount = generatedQuestions.reduce(
    (acc, batch) => acc + batch.questions.filter((q) => q.status === "pending").length,
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subjects & Questions Management</h2>
          <p className="text-gray-600">
            Manage subjects, upload content, generate questions with AI, and build your question bank
          </p>
        </div>
        <div className="flex gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium">{uploadedFiles.length}</span> files uploaded
          </div>
          <div>
            <span className="font-medium">
              {generatedQuestions.reduce((acc, batch) => acc + batch.questions.length, 0)}
            </span>{" "}
            questions generated
          </div>
          {pendingReviewCount > 0 && (
            <div className="text-orange-600">
              <span className="font-medium">{pendingReviewCount}</span> pending review
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bank" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Question Bank
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Generation
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2 relative">
            <CheckCircle className="h-4 w-4" />
            Review & Approve
            {pendingReviewCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {pendingReviewCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bank">
          <QuestionBank />
        </TabsContent>

        <TabsContent value="generate">
          <AIQuestionGenerator
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            generatedQuestions={generatedQuestions}
            setGeneratedQuestions={setGeneratedQuestions}
          />
        </TabsContent>

        <TabsContent value="review">
          <QuestionReviewer generatedQuestions={generatedQuestions} setGeneratedQuestions={setGeneratedQuestions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
