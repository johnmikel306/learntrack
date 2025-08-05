"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Brain, Wand2, FileText, Settings, Loader2, Upload, Plus, X, File, Presentation, ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { format } from "date-fns"

interface UploadedFile {
  id: string
  name: string
  subject: string
  topic: string
  uploadDate: Date
  status: string
  questionCount: number
  size?: string
  type?: string
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
  sourceFile?: string
  sourcePrompt: string
  subject: string
  topic: string
  questions: GeneratedQuestion[]
  generatedDate: Date
  status: string
}

interface AIQuestionGeneratorProps {
  uploadedFiles: UploadedFile[]
  setUploadedFiles: (files: UploadedFile[]) => void
  generatedQuestions: QuestionBatch[]
  setGeneratedQuestions: (questions: QuestionBatch[]) => void
}

export default function AIQuestionGenerator({
  uploadedFiles,
  setUploadedFiles,
  generatedQuestions,
  setGeneratedQuestions,
}: AIQuestionGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [generationSettings, setGenerationSettings] = useState({
    subject: "",
    topic: "",
    questionTypes: {
      "multiple-choice": true,
      "true-false": true,
      "short-answer": false,
    },
    difficulty: ["easy", "medium"],
    questionCount: 10,
    customPrompt: "",
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  const subjects = ["Mathematics", "Physics", "Chemistry"]
  const topics = {
    Mathematics: ["Algebra", "Geometry", "Calculus"],
    Physics: ["Mechanics", "Thermodynamics", "Optics"],
    Chemistry: ["Organic", "Inorganic", "Physical"],
  }

  const processedFiles = uploadedFiles.filter((file) => file.status === "processed")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setNewFiles([...newFiles, ...files])
  }

  const removeFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index))
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />
      case "ppt":
      case "pptx":
        return <Presentation className="h-4 w-4 text-orange-600" />
      case "doc":
      case "docx":
        return <File className="h-4 w-4 text-blue-600" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-4 w-4 text-green-600" />
      default:
        return <File className="h-4 w-4 text-gray-600" />
    }
  }

  const simulateUpload = async (files: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 150))
    }

    // Add files to uploaded materials
    const newUploadedFiles = files.map((file) => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      subject: generationSettings.subject,
      topic: generationSettings.topic,
      uploadDate: new Date(),
      status: "processing",
      questionCount: 0,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      type: file.type,
    }))

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles])

    // Simulate processing
    setTimeout(() => {
      setUploadedFiles((prev) =>
        prev.map((file) =>
          newUploadedFiles.find((nf) => nf.id === file.id)
            ? { ...file, status: "processed", questionCount: Math.floor(Math.random() * 20) + 5 }
            : file,
        ),
      )
    }, 2000)

    setIsUploading(false)
    setUploadProgress(0)
    return newUploadedFiles
  }

  const generateQuestions = async () => {
    if (!prompt.trim() || !generationSettings.subject || !generationSettings.topic) return

    setIsGenerating(true)

    // Upload new files if any
    let uploadedNewFiles: UploadedFile[] = []
    if (newFiles.length > 0) {
      uploadedNewFiles = await simulateUpload(newFiles)
      setNewFiles([])
    }

    // Simulate AI question generation
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const mockQuestions: GeneratedQuestion[] = [
      {
        id: `q${Date.now()}_1`,
        question: `Based on the prompt: "${prompt.substring(0, 50)}..." - What is the primary concept?`,
        type: "multiple-choice",
        options: ["Linear equations", "Quadratic functions", "Polynomial operations", "Matrix algebra"],
        correctAnswer: "Linear equations",
        confidence: 0.92,
        status: "pending",
      },
      {
        id: `q${Date.now()}_2`,
        question: "The generated content covers advanced mathematical concepts.",
        type: "true-false",
        correctAnswer: "false",
        confidence: 0.85,
        status: "pending",
      },
      {
        id: `q${Date.now()}_3`,
        question: "Explain the main principle discussed in the provided context.",
        type: "short-answer",
        correctAnswer:
          "The fundamental principle relates to the systematic approach to problem-solving in the given domain.",
        confidence: 0.78,
        status: "pending",
      },
    ]

    const sourceFile = selectedMaterial
      ? uploadedFiles.find((f) => f.id === selectedMaterial)?.name
      : uploadedNewFiles[0]?.name

    const newBatch: QuestionBatch = {
      id: Date.now().toString(),
      sourceFile,
      sourcePrompt: prompt,
      subject: generationSettings.subject,
      topic: generationSettings.topic,
      questions: mockQuestions.slice(0, generationSettings.questionCount),
      generatedDate: new Date(),
      status: "pending-review",
    }

    setGeneratedQuestions([...generatedQuestions, newBatch])
    setIsGenerating(false)

    // Reset form
    setPrompt("")
    setSelectedMaterial("")
    setGenerationSettings((prev) => ({ ...prev, subject: "", topic: "" }))
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
              <CardDescription>Generate questions using AI with custom prompts and optional materials</CardDescription>
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
                  <DialogDescription>Fine-tune your AI question generation parameters</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Question Types</Label>
                    <div className="grid grid-cols-3 gap-3">
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
                    <div className="grid grid-cols-3 gap-3">
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

                  <div>
                    <Label className="text-base font-medium">
                      Number of Questions: {generationSettings.questionCount}
                    </Label>
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

                  <div>
                    <Label className="text-base font-medium">Additional Instructions</Label>
                    <Textarea
                      value={generationSettings.customPrompt}
                      onChange={(e) => setGenerationSettings((prev) => ({ ...prev, customPrompt: e.target.value }))}
                      placeholder="e.g., 'Focus on practical applications and real-world examples'"
                      rows={3}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Provide specific instructions to guide the AI generation process
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
          {/* Subject and Topic Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-medium">Subject *</Label>
              <Select
                value={generationSettings.subject}
                onValueChange={(value) => setGenerationSettings((prev) => ({ ...prev, subject: value, topic: "" }))}
              >
                <SelectTrigger className="mt-2">
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
              <Label className="text-base font-medium">Topic *</Label>
              <Select
                value={generationSettings.topic}
                onValueChange={(value) => setGenerationSettings((prev) => ({ ...prev, topic: value }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {generationSettings.subject &&
                    topics[generationSettings.subject as keyof typeof topics]?.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Prompt Input */}
          <div>
            <Label className="text-base font-medium">Generation Prompt *</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate questions about. For example: 'Create questions about solving quadratic equations using the quadratic formula, focusing on real-world applications like projectile motion and optimization problems.'"
              rows={4}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Be specific about the concepts, difficulty level, and context you want the questions to cover
            </p>
          </div>

          {/* Material Selection */}
          <div>
            <Label className="text-base font-medium">Reference Material (Optional)</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select existing material or upload new files below" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No material selected</SelectItem>
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
          </div>

          {/* File Upload Section */}
          <div>
            <Label className="text-base font-medium">Upload New Materials (Optional)</Label>
            <div className="mt-2 space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload documents to use as reference material for question generation
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PPTX, TXT files up to 10MB each</p>
              </div>

              {/* Selected Files Display */}
              {newFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Files to upload:</Label>
                  {newFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name)}
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeFile(index)} disabled={isUploading}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading and processing files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          </div>

          {/* Generation Button */}
          <div className="flex justify-end">
            <Button
              onClick={generateQuestions}
              disabled={
                !prompt.trim() ||
                !generationSettings.subject ||
                !generationSettings.topic ||
                isGenerating ||
                isUploading ||
                Object.values(generationSettings.questionTypes).every((v) => !v)
              }
              className="min-w-[160px]"
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

      {/* Generation History */}
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
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold">AI Generated Questions</h3>
                      <Badge variant="outline">{batch.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p className="font-medium">
                        Prompt: "{batch.sourcePrompt ? batch.sourcePrompt.substring(0, 100) : "No prompt provided"}
                        {batch.sourcePrompt && batch.sourcePrompt.length > 100 ? "..." : ""}"
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span>
                          {batch.subject} • {batch.topic}
                        </span>
                        <span>Generated: {format(batch.generatedDate, "MMM dd, yyyy 'at' HH:mm")}</span>
                        {batch.sourceFile && <span>Material: {batch.sourceFile}</span>}
                      </div>
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
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No questions generated yet.</p>
                <p className="text-sm">Enter a prompt above to generate your first batch of questions!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
