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

import { toast } from "@/components/ui/use-toast"

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
}

export default function QuestionGenerator({ uploadedFiles }: QuestionGeneratorProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [vendor, setVendor] = useState<"openai" | "anthropic">("openai")
  const [model, setModel] = useState<string>("gpt-4o-mini")
  const vendorModels: Record<string, string[]> = {
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-4.1"],
    anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-haiku"],
  }

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

    try {
      setIsGenerating(true)
      const res = await fetch(`${API_BASE}/files/${selectedFile}/process`, { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      toast({ title: "Questions generated successfully" })
      // Upstream state can fetch batches/questions again or show in review
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message })
    } finally {
      setIsGenerating(false)
    }

    // No mock fallback: rely on backend to create question batches and display them elsewhere
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
                      onChange={(e) => setGenerationSettings((prev) => ({ ...prev, customPrompt: (e.target as HTMLTextAreaElement).value }))}
                      placeholder="e.g., 'Generate questions that test conceptual understanding rather than memorization'"
                      rows={4}
                    />

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">LLM Vendor</Label>
                  <Select value={vendor} onValueChange={(v: any) => setVendor(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-medium">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorModels[vendor].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

          {/* Since generation batches come from backend, omit local history when server is unavailable */}
          <div className="text-sm text-gray-500">History is loaded from the backend; none to display here.</div>

        <CardHeader>
          <CardTitle>Generation History</CardTitle>
          <CardDescription>Previously generated question batches (shown elsewhere)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">This component no longer maintains local history. Use the Question Bank to review backend-generated questions.</div>
        </CardContent>
      </Card>
    </div>
  )
}
