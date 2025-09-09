"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Brain, CheckCircle } from "lucide-react"
import QuestionBank from "@/components/question-bank"
import AIQuestionGenerator from "@/components/ai-question-generator"
import QuestionReviewer from "@/components/question-reviewer"

import { useApiClient } from '@/lib/api-client'

export default function IntegratedSubjectsManager() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState([] as any[])
  const client = useApiClient()

  const [generatedQuestions, setGeneratedQuestions] = useState([] as any[])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await client.get<any[]>('/files/')
        if (res.error) throw new Error(res.error)
        setUploadedFiles(res.data || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const [activeTab, setActiveTab] = useState("bank")

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
