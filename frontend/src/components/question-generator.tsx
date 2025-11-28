import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Brain,
  FileText,
  Upload,
  Settings,
  Wand2,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  RefreshCw,
  Trash2,
  Plus,
  BookOpen,
  Target,
  Zap,
  Edit
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useGenerationHistory } from "@/hooks/useQueries"

interface GenerationRequest {
  id: string
  subject: string
  topic: string
  questionCount: number
  difficulty: string
  questionTypes: string[]
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  aiProvider: string
  createdAt: string
  questionsGenerated?: number
}

interface GeneratedQuestion {
  id: string
  text: string
  type: string
  difficulty: string
  options?: string[]
  correctAnswer: string
  explanation: string
  points: number
  tags: string[]
}

export default function QuestionGenerator() {
  const [activeTab, setActiveTab] = useState("generate")
  const [textContent, setTextContent] = useState("")
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState([10])
  const [difficulty, setDifficulty] = useState("")
  const [questionTypes, setQuestionTypes] = useState<string[]>([])
  const [aiProvider, setAiProvider] = useState("openai")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  // Fetch generation history from API
  const { data: historyData, isLoading: historyLoading, isError: historyError } = useGenerationHistory()

  // Transform API data to GenerationRequest format
  const generationHistory: GenerationRequest[] = useMemo(() => {
    if (!historyData || !Array.isArray(historyData)) return []

    return historyData.map((item: any) => ({
      id: item._id || item.id,
      subject: item.subject || 'Unknown',
      topic: item.topic || 'Unknown',
      questionCount: item.question_count || item.questionCount || 0,
      difficulty: item.difficulty || 'intermediate',
      questionTypes: item.question_types || item.questionTypes || [],
      status: item.status || 'pending',
      progress: item.progress || 0,
      aiProvider: item.ai_provider || item.aiProvider || 'openai',
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      questionsGenerated: item.questions_generated || item.questionsGenerated
    }))
  }, [historyData])

  // Generated questions will be fetched when viewing a specific generation
  const [sampleQuestions, setSampleQuestions] = useState<GeneratedQuestion[]>([])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success'
      case 'generating':
        return 'bg-info/10 text-info'
      case 'pending':
        return 'bg-warning/10 text-warning'
      case 'failed':
        return 'bg-destructive/10 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'generating':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false)
    }, 3000)
  }

  const toggleQuestionType = (type: string) => {
    setQuestionTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Brain className="w-8 h-8 mr-3 text-primary" />
            AI Question Generator
          </h1>
          <p className="text-muted-foreground mt-1">Generate educational questions using artificial intelligence</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Generated</p>
                <p className="text-2xl font-bold text-foreground">1,247</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
              <div className="p-2 bg-info/10 rounded-lg">
                <Zap className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-foreground">94%</p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <Target className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Avg. Quality</p>
                <p className="text-2xl font-bold text-foreground">4.8/5</p>
              </div>
              <div className="p-2 bg-warning/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Questions</TabsTrigger>
          <TabsTrigger value="history">Generation History</TabsTrigger>
          <TabsTrigger value="preview">Preview & Review</TabsTrigger>
        </TabsList>

        {/* Generate Questions Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wand2 className="w-5 h-5 mr-2 text-primary" />
                  Generation Settings
                </CardTitle>
                <CardDescription>Configure your question generation parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Content Input */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content Source</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your educational content here or upload a file..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                    <span className="text-xs text-muted-foreground">Supports PDF, DOC, TXT files</span>
                  </div>
                </div>

                {/* Subject and Topic */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mathematics">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Algebra, Mechanics"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                </div>

                {/* Question Count */}
                <div className="space-y-2">
                  <Label>Number of Questions: {questionCount[0]}</Label>
                  <Slider
                    value={questionCount}
                    onValueChange={setQuestionCount}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>50</span>
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Types */}
                <div className="space-y-2">
                  <Label>Question Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "multiple-choice", label: "Multiple Choice" },
                      { id: "true-false", label: "True/False" },
                      { id: "short-answer", label: "Short Answer" },
                      { id: "essay", label: "Essay" }
                    ].map((type) => (
                      <Button
                        key={type.id}
                        variant={questionTypes.includes(type.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleQuestionType(type.id)}
                        className="justify-start"
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* AI Provider */}
                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select AI provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Custom Prompt (Optional)</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Add specific instructions for question generation..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !textContent || !subject || !topic}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Questions...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview/Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-primary" />
                  Generation Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Quality Content</p>
                      <p className="text-sm text-muted-foreground">Provide clear, well-structured educational content for better question generation.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Specific Topics</p>
                      <p className="text-sm text-muted-foreground">Be specific about the topic to generate more focused and relevant questions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Mixed Types</p>
                      <p className="text-sm text-muted-foreground">Select multiple question types for a comprehensive assessment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Custom Prompts</p>
                      <p className="text-sm text-muted-foreground">Use custom prompts to guide the AI towards specific learning objectives.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Generation History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Generation History
              </CardTitle>
              <CardDescription>Track your question generation requests and results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historyLoading ? (
                  // Loading skeleton
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-5 w-20" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-4 w-48" />
                          </div>
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyError ? (
                  // Error state
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Failed to load generation history</p>
                  </div>
                ) : generationHistory.length === 0 ? (
                  // Empty state
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No generation history yet</p>
                    <p className="text-xs mt-1">Generate some questions to see them here</p>
                  </div>
                ) : (
                  generationHistory.map((request) => (
                    <div key={request.id} className="p-4 bg-muted rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {request.subject} - {request.topic}
                            </h3>
                            <Badge className={`border-0 ${getStatusColor(request.status)}`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {request.status}
                              </div>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                            <div>Questions: {request.questionsGenerated || 0}/{request.questionCount}</div>
                            <div>Difficulty: {request.difficulty}</div>
                            <div>Provider: {request.aiProvider}</div>
                          </div>

                          <div className="text-sm text-muted-foreground mb-2">
                            Types: {request.questionTypes.join(', ')}
                          </div>

                          {request.status === 'generating' && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="text-muted-foreground">{request.progress}%</span>
                              </div>
                              <Progress value={request.progress} className="h-2" />
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {request.status === 'completed' && (
                            <>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {request.status === 'failed' && (
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview & Review Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2 text-primary" />
                Generated Questions Preview
              </CardTitle>
              <CardDescription>Review and edit generated questions before saving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sampleQuestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No questions generated yet</p>
                    <p className="text-sm">Use the form above to generate questions from your content</p>
                  </div>
                ) : sampleQuestions.map((question, index) => (
                  <Card key={question.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                            Q{index + 1}
                          </span>
                          <Badge variant="outline">{question.type}</Badge>
                          <Badge variant="outline">{question.difficulty}</Badge>
                          <span className="text-sm text-muted-foreground">{question.points} pts</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-2">Question:</h4>
                          <p className="text-muted-foreground">{question.text}</p>
                        </div>

                        {question.options && (
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Options:</h4>
                            <div className="space-y-2">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className={`p-2 rounded ${option === question.correctAnswer ? 'bg-success/10 border border-success/20' : 'bg-muted'}`}>
                                  <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                  {option}
                                  {option === question.correctAnswer && (
                                    <CheckCircle className="w-4 h-4 text-success inline ml-2" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-foreground mb-2">Correct Answer:</h4>
                          <p className="text-success font-medium">{question.correctAnswer}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-foreground mb-2">Explanation:</h4>
                          <p className="text-muted-foreground">{question.explanation}</p>
                        </div>

                        <div>
                          <h4 className="font-medium text-foreground mb-2">Tags:</h4>
                          <div className="flex flex-wrap gap-2">
                            {question.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {sampleQuestions.length > 0 && (
                  <div className="flex items-center justify-between pt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {sampleQuestions.length} of {sampleQuestions.length} questions
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export All
                      </Button>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Save to Question Bank
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
