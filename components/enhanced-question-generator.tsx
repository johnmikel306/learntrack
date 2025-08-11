"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Brain, Wand2, FileText, Settings, Loader2, History, CheckCircle, XCircle, Clock } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AIProvider {
  provider: string
  enabled: boolean
  models: string[]
  default_model?: string
}

interface GeneratedQuestion {
  id: string
  question: string
  type: "multiple-choice" | "true-false" | "short-answer"
  options?: string[]
  correctAnswer: string
  difficulty: "easy" | "medium" | "hard"
  status: "pending" | "approved" | "rejected"
}

interface GenerationBatch {
  generation_id: string
  ai_provider: string
  source_file?: string
  total_generated: number
  status: string
  questions: GeneratedQuestion[]
  created_at: Date
  subject: string
  topic: string
}

interface UploadedFile {
  id: string
  name: string
  subject: string
  topic: string
  uploadDate: Date
  status: string
  questionCount: number
}

interface EnhancedQuestionGeneratorProps {
  uploadedFiles: UploadedFile[]
}

export default function EnhancedQuestionGenerator({ uploadedFiles }: EnhancedQuestionGeneratorProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  
  // Settings and providers
  const [providers, setProviders] = useState<Record<string, AIProvider>>({})
  const [defaultProvider, setDefaultProvider] = useState<string>("openai")
  
  // Generation settings
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedFile, setSelectedFile] = useState<string>("none")
  const [textContent, setTextContent] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [topic, setTopic] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [questionTypes, setQuestionTypes] = useState<string[]>(["multiple-choice"])
  const [difficulty, setDifficulty] = useState<string>("medium")
  const [customPrompt, setCustomPrompt] = useState<string>("")
  
  // State
  const [generating, setGenerating] = useState(false)
  const [generationHistory, setGenerationHistory] = useState<GenerationBatch[]>([])
  const [activeTab, setActiveTab] = useState("generate")

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json()
  }

  async function loadProviders() {
    try {
      const data = await apiFetch<{
        providers: Record<string, AIProvider>
        default_provider: string
      }>("/settings/ai/providers")
      
      setProviders(data.providers)
      setDefaultProvider(data.default_provider)
      setSelectedProvider(data.default_provider)
      
      // Set default model for selected provider
      const defaultProviderConfig = data.providers[data.default_provider]
      if (defaultProviderConfig?.default_model) {
        setSelectedModel(defaultProviderConfig.default_model)
      }
    } catch (e: any) {
      toast({ title: "Failed to load AI providers", description: e.message, variant: "destructive" })
    }
  }

  async function generateQuestions() {
    if (!selectedProvider) {
      toast({ title: "Please select an AI provider", variant: "destructive" })
      return
    }

    if (!textContent && selectedFile === "none") {
      toast({ title: "Please provide text content or select a file", variant: "destructive" })
      return
    }

    if (!subject || !topic) {
      toast({ title: "Please specify subject and topic", variant: "destructive" })
      return
    }

    try {
      setGenerating(true)
      
      const requestData = {
        file_id: selectedFile !== "none" ? selectedFile : undefined,
        text_content: textContent || undefined,
        subject,
        topic,
        question_count: questionCount,
        question_types: questionTypes,
        difficulty_levels: [difficulty],
        ai_provider: selectedProvider,
        custom_prompt: customPrompt || undefined
      }

      const result = await apiFetch<GenerationBatch>("/questions/generate", {
        method: "POST",
        body: JSON.stringify(requestData),
      })

      // Add to generation history
      const newBatch: GenerationBatch = {
        ...result,
        created_at: new Date(),
        subject,
        topic
      }
      
      setGenerationHistory(prev => [newBatch, ...prev])
      setActiveTab("history")
      
      toast({ 
        title: "Questions generated successfully", 
        description: `Generated ${result.total_generated} questions using ${result.ai_provider}` 
      })
      
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  async function approveQuestion(batchId: string, questionId: string) {
    // TODO: Implement question approval
    setGenerationHistory(prev => 
      prev.map(batch => 
        batch.generation_id === batchId 
          ? {
              ...batch,
              questions: batch.questions.map(q => 
                q.id === questionId ? { ...q, status: "approved" as const } : q
              )
            }
          : batch
      )
    )
    toast({ title: "Question approved" })
  }

  async function rejectQuestion(batchId: string, questionId: string) {
    // TODO: Implement question rejection
    setGenerationHistory(prev => 
      prev.map(batch => 
        batch.generation_id === batchId 
          ? {
              ...batch,
              questions: batch.questions.map(q => 
                q.id === questionId ? { ...q, status: "rejected" as const } : q
              )
            }
          : batch
      )
    )
    toast({ title: "Question rejected" })
  }

  useEffect(() => {
    loadProviders()
  }, [])

  useEffect(() => {
    if (selectedProvider && providers[selectedProvider]) {
      const providerConfig = providers[selectedProvider]
      if (providerConfig.default_model) {
        setSelectedModel(providerConfig.default_model)
      }
    }
  }, [selectedProvider, providers])

  const enabledProviders = Object.entries(providers).filter(([_, config]) => config.enabled)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Question Generator</h2>
          <p className="text-muted-foreground">Generate questions using AI from your content</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History & Review ({generationHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {enabledProviders.map(([name, config]) => (
                          <SelectItem key={name} value={name}>
                            <div className="flex items-center gap-2">
                              <Brain className="h-4 w-4" />
                              {name}
                              {name === defaultProvider && <Badge variant="outline">Default</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvider && providers[selectedProvider]?.models.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Algebra"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question Count: {questionCount}</Label>
                  <Slider
                    value={[questionCount]}
                    onValueChange={(value) => setQuestionCount(value[0])}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Question Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {["multiple-choice", "true-false", "short-answer"].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={questionTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setQuestionTypes(prev => [...prev, type])
                            } else {
                              setQuestionTypes(prev => prev.filter(t => t !== type))
                            }
                          }}
                        />
                        <Label htmlFor={type} className="text-sm">
                          {type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
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
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Source
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select File (Optional)</Label>
                  <Select value={selectedFile} onValueChange={setSelectedFile}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a file or enter text below" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None - Use text input</SelectItem>
                      {uploadedFiles.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name} ({file.subject} - {file.topic})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Or Enter Text Content</Label>
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste your content here..."
                    className="min-h-[200px]"
                    disabled={selectedFile !== "none"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custom Prompt (Optional)</Label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Additional instructions for the AI..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={generateQuestions} 
                  disabled={generating || enabledProviders.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="space-y-4">
            {generationHistory.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Generation History</h3>
                    <p className="text-muted-foreground">Generate some questions to see them here for review and approval.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              generationHistory.map((batch) => (
                <Card key={batch.generation_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5" />
                          {batch.subject} - {batch.topic}
                        </CardTitle>
                        <CardDescription>
                          Generated {batch.total_generated} questions using {batch.ai_provider} • 
                          {new Date(batch.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{batch.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {batch.questions.map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{question.type}</Badge>
                                <Badge variant="outline">{question.difficulty}</Badge>
                                <Badge 
                                  variant={
                                    question.status === "approved" ? "default" :
                                    question.status === "rejected" ? "destructive" : "secondary"
                                  }
                                >
                                  {question.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {question.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                                  {question.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                                  {question.status}
                                </Badge>
                              </div>
                              <p className="font-medium mb-2">{question.question}</p>
                              {question.options && (
                                <div className="space-y-1">
                                  {question.options.map((option, optIndex) => (
                                    <div
                                      key={`${question.id}-option-${optIndex}-${option}`}
                                      className={`text-sm p-2 rounded ${
                                        option === question.correctAnswer
                                          ? "bg-green-50 border border-green-200"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + optIndex)}. {option}
                                      {option === question.correctAnswer && " ✓"}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {question.type !== "multiple-choice" && (
                                <p className="text-sm text-green-600 font-medium">
                                  Answer: {question.correctAnswer}
                                </p>
                              )}
                            </div>
                            {question.status === "pending" && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => approveQuestion(batch.generation_id, question.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectQuestion(batch.generation_id, question.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
