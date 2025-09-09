"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Brain, Clock } from "lucide-react"
import ContentUploader from "@/components/content-uploader"
import QuestionGenerator from "@/components/question-generator"
import QuestionReviewer from "@/components/question-reviewer"
import { toast } from "@/components/ui/use-toast"
import { useApiClient } from '@/lib/api-client'


export default function ContentManager() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const client = useApiClient()

  const [error, setError] = useState<string | null>(null)

  const [generatedQuestions, setGeneratedQuestions] = useState([])

  // Load data from FastAPI
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [filesRes, questionsRes] = await Promise.all([
          client.get<any[]>('/files/'),
          client.get<any[]>('/questions/')
        ])

        if (!filesRes.error) {
          setUploadedFiles(filesRes.data || [])
        }

        if (!questionsRes.error) {
          setGeneratedQuestions(questionsRes.data || [])
        }
      } catch (e: any) {
        setError(e.message)
        toast({ title: "Failed to load data", description: e.message })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content & AI Question Generation</h2>
          <p className="text-gray-600">Upload materials and generate questions automatically</p>
        </div>
        <div className="flex gap-2">
          <div className="text-sm text-gray-500">
            <span className="font-medium">{uploadedFiles.length}</span> files uploaded
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium">
              {generatedQuestions.reduce((acc, batch) => acc + batch.questions.length, 0)}
            </span>{" "}
            questions generated
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploaded Materials</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadedFiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {uploadedFiles.filter((f) => f.status === "processed").length} processed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Questions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedQuestions.reduce((acc, batch) => acc + batch.questions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {generatedQuestions.reduce(
                (acc, batch) => acc + batch.questions.filter((q) => q.status === "approved").length,
                0,
              )}{" "}
              approved
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedQuestions.reduce(
                (acc, batch) => acc + batch.questions.filter((q) => q.status === "pending").length,
                0,
              )}
            </div>
            <p className="text-xs text-muted-foreground">Questions awaiting review</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Content</TabsTrigger>
          <TabsTrigger value="generate">Generate Questions</TabsTrigger>
          <TabsTrigger value="review">Review & Approve</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <ContentUploader uploadedFiles={uploadedFiles} setUploadedFiles={setUploadedFiles} />
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <QuestionGenerator
            uploadedFiles={uploadedFiles}
            generatedQuestions={generatedQuestions}
            setGeneratedQuestions={setGeneratedQuestions}
          />
        </TabsContent>

        <TabsContent value="review" className="space-y-6">
          <QuestionReviewer generatedQuestions={generatedQuestions} setGeneratedQuestions={setGeneratedQuestions} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
