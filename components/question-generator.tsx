"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Brain, Wand2, FileText, Settings, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

interface UploadedFile {
  id: string
  name: string
  subject: string
  topic: string
  uploadDate: Date
  status: string
  questionCount: number
}

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

interface QuestionGeneratorProps {
  uploadedFiles: UploadedFile[]
  generatedQuestions: QuestionBatch[]
  setGeneratedQuestions: (questions: QuestionBatch[]) => void
}

export default function QuestionGenerator({
  uploadedFiles,
  generatedQuestions,
  setGeneratedQuestions,
}: QuestionGeneratorProps) {
  const [selectedFile, setSelectedFile] = useState("")
  const [generationSettings, setGenerationSettings] = useState({
    questionTypes: {
      "multiple-choice": true,
      "true-false": true,
      "short-answer": false,
    },
    difficulty: ["easy", "medium"],
    questionCount: 10,
    focusAreas: "",
    customPrompt: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const processedFiles = uploadedFiles.filter((file) => file.status === "processed")

  const generateQuestions = async () => {
    if (!selectedFile) return

    setIsGenerating(true)

    // Simulate AI question generation
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const selectedFileData = uploadedFiles.find((f) => f.id === selectedFile)
    if (!selectedFileData) return

    const mockQuestions: GeneratedQuestion[] = [
      {
        id: `q${Date.now()}_1`,
        question: "What is the primary concept discussed in the uploaded material?",
        type: "multiple-choice",
        options: ["Linear equations", "Quadratic functions", "Polynomial operations", "Matrix algebra"],
        correctAnswer: "Linear equations",
        confidence: 0.92,
        status: "pending",
      },
      {
        id: `q${Date.now()}_2`,
        question: "The material covers advanced mathematical concepts.",
        type: "true-false",
        correctAnswer: "false",
        confidence: 0.85,
        status: "pending",
      },
      {
        id: `q${Date.now()}_3`,
        question: "Explain the main theorem presented in the document.",
        type: "short-answer",
        correctAnswer:
          "The fundamental theorem of algebra states that every polynomial equation has at least one complex root.",
        confidence: 0.78,
        status: "pending",
      },
    ]

    const newBatch: QuestionBatch = {
      id: Date.now().toString(),
      sourceFile: selectedFileData.name,
      subject: selectedFileData.subject,
      topic: selectedFileData.topic,
      questions: mockQuestions.slice(0, generationSettings.questionCount),
      generatedDate: new Date(),
      status: "pending-review",
    }

    setGeneratedQuestions([...generatedQuestions, newBatch])
    setIsGenerating(false)
    setSelectedFile("")
  }

  const toggleQuestionType = (type: string) => {
    setGenerationSettings((prev) => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: !prev.questionTypes[type as keyof typeof prev.questionTypes],
      },
    }))
  }

  const toggleDifficulty = (difficulty: string) => {
    setGenerationSettings((prev) => ({
      ...prev,
      difficulty: prev.difficulty.includes(difficulty)
        ? prev.difficulty.filter((d) => d !== difficulty)
        : [...prev.difficulty, difficulty],
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Question Generation
              </CardTitle>
              <CardDescription>Generate questions automatically from your uploaded materials using AI</CardDescription>
            </div>
            <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Advanced Generation Settings</DialogTitle>
                  <DialogDescription>Customize how AI generates questions from your materials</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Focus Areas (Optional)</Label>
                    <Textarea
                      value={generationSettings.focusAreas}
                      onChange={(e) => setGenerationSettings((prev) => ({ ...prev, focusAreas: e.target.value }))}
                      placeholder="e.g., 'Focus on practical applications and real-world examples'"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Specify particular aspects or topics you want the AI to emphasize
                    </p>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Custom AI Prompt</Label>
                    <Textarea
                      value={generationSettings.customPrompt}
                      onChange={(e) => setGenerationSettings((prev) => ({ ...prev, customPrompt: e.target.value }))}
                      placeholder="e.g., 'Generate questions that test conceptual understanding rather than memorization'"
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Provide specific instructions for the AI question generation
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setShowAdvancedSettings(false)}>Save Settings</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Select Source Material</Label>
            <Select value={selectedFile} onValueChange={setSelectedFile}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a processed file to generate questions from" />
              </SelectTrigger>
              <SelectContent>
                {processedFiles.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {file.subject} • {file.topic}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {processedFiles.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No processed files available. Upload and process materials first.
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-base font-medium mb-3 block">Question Types</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multiple-choice"
                    checked={generationSettings.questionTypes["multiple-choice"]}
                    onCheckedChange={() => toggleQuestionType("multiple-choice")}
                  />
                  <Label htmlFor="multiple-choice">Multiple Choice</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="true-false"
                    checked={generationSettings.questionTypes["true-false"]}
                    onCheckedChange={() => toggleQuestionType("true-false")}
                  />
                  <Label htmlFor="true-false">True/False</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="short-answer"
                    checked={generationSettings.questionTypes["short-answer"]}
                    onCheckedChange={() => toggleQuestionType("short-answer")}
                  />
                  <Label htmlFor="short-answer">Short Answer</Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">Difficulty Levels</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="easy"
                    checked={generationSettings.difficulty.includes("easy")}
                    onCheckedChange={() => toggleDifficulty("easy")}
                  />
                  <Label htmlFor="easy">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medium"
                    checked={generationSettings.difficulty.includes("medium")}
                    onCheckedChange={() => toggleDifficulty("medium")}
                  />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hard"
                    checked={generationSettings.difficulty.includes("hard")}
                    onCheckedChange={() => toggleDifficulty("hard")}
                  />
                  <Label htmlFor="hard">Hard</Label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-base font-medium">Number of Questions: {generationSettings.questionCount}</Label>
            <Slider
              value={[generationSettings.questionCount]}
              onValueChange={(value) => setGenerationSettings((prev) => ({ ...prev, questionCount: value[0] }))}
              max={25}
              min={5}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>5</span>
              <span>25</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={generateQuestions}
              disabled={
                !selectedFile || isGenerating || Object.values(generationSettings.questionTypes).every((v) => !v)
              }
              className="min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation History</CardTitle>
          <CardDescription>Previously generated question batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedQuestions.map((batch) => (
              <div key={batch.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold">{batch.sourceFile}</h3>
                      <Badge variant="outline">{batch.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {batch.subject} • {batch.topic} • Generated: {batch.generatedDate.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{batch.questions.length} questions</Badge>
                      <Badge className="bg-green-100 text-green-800">
                        {batch.questions.filter((q) => q.status === "approved").length} approved
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {batch.questions.filter((q) => q.status === "pending").length} pending
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Questions
                  </Button>
                </div>
              </div>
            ))}
            {generatedQuestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No questions generated yet. Select a file and generate your first batch!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
