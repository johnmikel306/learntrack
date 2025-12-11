import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  Edit,
  Globe,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FolderOpen,
  File,
  FileImage,
  FileVideo,
  Link as LinkIcon,
  Search,
  X,
  SlidersHorizontal,
  Paperclip,
  ArrowUp,
  Wrench,
  Check
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useGenerationHistory, useMaterials, useGenerationStats } from "@/hooks/useQueries"
import { useAuth } from '@clerk/clerk-react'
import { toast } from '@/contexts/ToastContext'
import { cn } from "@/lib/utils"
import { useApiClient } from "@/lib/api-client"

// Mapping functions for frontend to backend values
const mapQuestionType = (frontendType: string): string => {
  const typeMap: Record<string, string> = {
    'multiple-choice': 'MCQ',
    'true-false': 'TRUE_FALSE',
    'short-answer': 'SHORT_ANSWER',
    'essay': 'ESSAY'
  }
  return typeMap[frontendType] || 'MCQ'
}

const mapDifficulty = (frontendDifficulty: string): string => {
  const difficultyMap: Record<string, string> = {
    'beginner': 'EASY',
    'intermediate': 'MEDIUM',
    'advanced': 'HARD'
  }
  return difficultyMap[frontendDifficulty] || 'MEDIUM'
}

const mapAiProvider = (frontendProvider: string): string => {
  // Backend uses lowercase provider names
  const providerMap: Record<string, string> = {
    'openai': 'openai',
    'anthropic': 'anthropic',
    'google': 'google',
    'groq': 'groq'
  }
  return providerMap[frontendProvider] || 'groq'
}

// Auto-resize textarea hook (V0-style)
function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return

      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }

      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      )
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = `${minHeight}px`
    }
  }, [minHeight])

  useEffect(() => {
    const handleResize = () => adjustHeight()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [adjustHeight])

  return { textareaRef, adjustHeight }
}

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

interface Material {
  _id: string
  title: string
  description?: string
  material_type: 'pdf' | 'doc' | 'video' | 'link' | 'image' | 'other'
  file_url?: string
  file_size?: number
  subject_id?: string
  subject?: string
  topic?: string
  tags: string[]
  status: 'active' | 'archived' | 'draft'
  created_at: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

import { useSubjects } from "@/hooks/useQueries"

export default function QuestionGenerator() {
  const { getToken } = useAuth()
  const apiClient = useApiClient()
  const [activeTab, setActiveTab] = useState("generate")
  const [customPrompt, setCustomPrompt] = useState("")
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState([10])
  const [difficulty, setDifficulty] = useState("intermediate")
  const [questionType, setQuestionType] = useState("multiple-choice") // Single select
  const [aiProvider, setAiProvider] = useState("groq") // Default to groq since it's configured
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b") // Default model
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null) // For submenu
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // AI Provider and Model Configuration
  const aiProviderModels = {
    groq: {
      name: "Groq",
      description: "Ultra-fast inference",
      models: [
        { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", description: "Most capable open model" },
        { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B", description: "Fast and efficient" },
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Versatile tasks" },
        { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Instant responses" },
        { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "Balanced performance" },
      ]
    },
    openai: {
      name: "OpenAI",
      description: "GPT models",
      models: [
        { id: "gpt-4o", name: "GPT-4o", description: "Most capable" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast and affordable" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "High performance" },
      ]
    },
    anthropic: {
      name: "Anthropic",
      description: "Claude models",
      models: [
        { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", description: "Best for most tasks" },
        { id: "claude-3-opus", name: "Claude 3 Opus", description: "Most powerful" },
        { id: "claude-3-haiku", name: "Claude 3 Haiku", description: "Fast and light" },
      ]
    },
    google: {
      name: "Google",
      description: "Gemini models",
      models: [
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Best for complex tasks" },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Fast and efficient" },
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Latest experimental" },
      ]
    },
  }

  // Get current model display info
  const getCurrentModelDisplay = () => {
    const provider = aiProviderModels[aiProvider as keyof typeof aiProviderModels]
    if (!provider) return { provider: "Unknown", model: "Unknown" }
    const model = provider.models.find(m => m.id === selectedModel)
    return {
      provider: provider.name,
      model: model?.name || provider.models[0]?.name || "Default"
    }
  }

  // Handle model selection
  const handleModelSelect = (providerId: string, modelId: string) => {
    setAiProvider(providerId)
    setSelectedModel(modelId)
    setExpandedProvider(null)
    setIsModelMenuOpen(false)
  }

  // Material selection state
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [materialSearchQuery, setMaterialSearchQuery] = useState("")

  // Configuration expanded state
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)

  // Tools popover state
  const [isToolsOpen, setIsToolsOpen] = useState(false)

  // Fetch subjects from API
  const { data: subjectsData } = useSubjects()

  // Auto-resize textarea hook (V0-style)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })

  // Fetch materials
  const { data: materialsData, isLoading: materialsLoading } = useMaterials()

  // Fetch generation stats from API
  const { data: generationStats, isLoading: statsLoading } = useGenerationStats()

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

  // Get available materials from API response
  const availableMaterials: Material[] = useMemo(() => {
    if (!materialsData) return []
    return materialsData.items || (Array.isArray(materialsData) ? materialsData : [])
  }, [materialsData])

  // Filter materials based on search query
  const filteredMaterials = useMemo(() => {
    if (!materialSearchQuery) return availableMaterials
    const query = materialSearchQuery.toLowerCase()
    return availableMaterials.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.topic?.toLowerCase().includes(query) ||
      m.tags.some(t => t.toLowerCase().includes(query))
    )
  }, [availableMaterials, materialSearchQuery])

  const handleGenerate = async () => {
    // Require either materials or a prompt
    if (selectedMaterials.length === 0 && !customPrompt.trim()) {
      toast.error('Please select materials or enter a prompt')
      setIsMaterialModalOpen(true)
      return
    }

    // Use material's subject/topic if available
    let finalSubject = subject
    let finalTopic = topic
    if (selectedMaterials.length > 0) {
      const firstMaterial = selectedMaterials[0]
      if (firstMaterial.subject) {
        finalSubject = firstMaterial.subject
        setSubject(firstMaterial.subject)
      }
      if (firstMaterial.topic) {
        finalTopic = firstMaterial.topic
        setTopic(firstMaterial.topic)
      }
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      // Build the generation request
      const generateRequest = {
        prompt: customPrompt || `Generate ${questionCount[0]} ${questionType} questions about ${finalTopic || 'the selected materials'}`,
        question_count: questionCount[0],
        question_types: [mapQuestionType(questionType)],
        difficulty: mapDifficulty(difficulty),
        material_ids: selectedMaterials.length > 0 ? selectedMaterials.map(m => m._id) : [],
        subject: finalSubject || undefined,
        topic: finalTopic || undefined,
        ai_provider: mapAiProvider(aiProvider),
        model_name: selectedModel
      }

      // Call the generation endpoint
      const response = await apiClient.post<{ session_id: string; status: string; questions_count: number; message: string }>(
        '/question-generator/generate',
        generateRequest
      )

      if (response.error) {
        throw new Error(response.error)
      }

      if (response.data?.session_id) {
        // Fetch the session to get the generated questions
        const sessionResponse = await apiClient.get<any>(`/question-generator/sessions/${response.data.session_id}`)

        if (sessionResponse.error) {
          throw new Error(sessionResponse.error)
        }

        if (sessionResponse.data?.questions) {
          // Transform backend questions to frontend format
          const transformedQuestions: GeneratedQuestion[] = sessionResponse.data.questions.map((q: any, index: number) => ({
            id: q.question_id || `q-${index}`,
            text: q.question_text || q.text,
            type: q.type || questionType,
            difficulty: q.difficulty?.toLowerCase() || difficulty,
            options: q.options || [],
            correctAnswer: q.correct_answer || '',
            explanation: q.explanation || '',
            points: q.points || 10,
            tags: q.tags || []
          }))

          setSampleQuestions(transformedQuestions)
          toast.success(`Generated ${transformedQuestions.length} questions successfully!`)
          setActiveTab('preview') // Switch to preview tab
        } else {
          toast.success(response.data?.message || 'Questions generated!')
        }
      }
    } catch (error: any) {
      console.error('Generation failed:', error)
      const errorMessage = error.message || 'Failed to generate questions'
      setGenerationError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleMaterialSelection = (material: Material) => {
    setSelectedMaterials(prev => {
      const isSelected = prev.some(m => m._id === material._id)
      if (isSelected) {
        return prev.filter(m => m._id !== material._id)
      } else {
        // Auto-update subject/topic from selected material
        if (material.subject && !subject) {
          setSubject(material.subject)
        }
        if (material.topic && !topic) {
          setTopic(material.topic)
        }
        return [...prev, material]
      }
    })
  }

  const removeMaterial = (materialId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m._id !== materialId))
  }

  const getMaterialIcon = (type: Material['material_type']) => {
    switch (type) {
      case 'pdf':
      case 'doc':
        return <FileText className="w-4 h-4" />
      case 'image':
        return <FileImage className="w-4 h-4" />
      case 'video':
        return <FileVideo className="w-4 h-4" />
      case 'link':
        return <LinkIcon className="w-4 h-4" />
      default:
        return <File className="w-4 h-4" />
    }
  }

  // Get question type label for display
  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'multiple-choice': 'MCQ',
      'true-false': 'T/F',
      'short-answer': 'Short',
      'essay': 'Essay'
    }
    return types[type] || type
  }

  const getConfigSummary = () => {
    const parts = []
    parts.push(`${questionCount[0]} questions`)
    parts.push(difficulty)
    parts.push(getQuestionTypeLabel(questionType))
    return parts.join(' • ')
  }

  // Auto-correct subject/topic before generation based on materials
  const syncSubjectTopicFromMaterials = useCallback(() => {
    if (selectedMaterials.length > 0) {
      // Use the first material's subject/topic if not already set or if inconsistent
      const firstMaterial = selectedMaterials[0]
      if (firstMaterial.subject) {
        setSubject(firstMaterial.subject)
      }
      if (firstMaterial.topic) {
        setTopic(firstMaterial.topic)
      }
    }
  }, [selectedMaterials])

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
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    generationStats?.total_generated?.toLocaleString() || '0'
                  )}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    generationStats?.this_month?.toLocaleString() || '0'
                  )}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    `${generationStats?.success_rate || 0}%`
                  )}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-14" />
                  ) : (
                    `${generationStats?.avg_quality || 0}/5`
                  )}
                </p>
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

        {/* Generate Questions Tab - V0-style Interface */}
        <TabsContent value="generate" className="flex-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Generation Settings
              </CardTitle>
              <CardDescription>
                Configure and generate AI-powered questions from your materials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* V0-style Chat Input */}
              <div className="relative rounded-xl border border-border bg-muted/30">
                {/* Selected Materials Display (above input) */}
                {/* Materials Selection - Always show, with different states */}
                <div className="flex flex-wrap gap-2 p-3 pb-0">
                  {selectedMaterials.length > 0 ? (
                    <>
                      {selectedMaterials.map((material) => (
                        <Badge
                          key={material._id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1 bg-primary/10 text-primary border-primary/20"
                        >
                          {getMaterialIcon(material.material_type)}
                          <span className="max-w-[120px] truncate text-xs">{material.title}</span>
                          <button
                            type="button"
                            className="ml-1 p-0.5 rounded hover:bg-destructive/20 transition-colors"
                            onClick={() => removeMaterial(material._id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      <button
                        type="button"
                        onClick={() => setIsMaterialModalOpen(true)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add more
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsMaterialModalOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors border border-dashed border-border hover:border-primary/50"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Select materials to generate questions from</span>
                    </button>
                  )}
                </div>

                {/* Auto-resizing Textarea */}
                <div className="overflow-y-auto">
                  <Textarea
                    ref={textareaRef}
                    value={customPrompt}
                    onChange={(e) => {
                      setCustomPrompt(e.target.value)
                      adjustHeight()
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && (selectedMaterials.length > 0 || customPrompt.trim())) {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                    placeholder="Describe what kind of questions you want to generate..."
                    className={cn(
                      "w-full px-4 py-3",
                      "resize-none",
                      "bg-transparent",
                      "border-none",
                      "text-foreground text-sm",
                      "focus:outline-none",
                      "focus-visible:ring-0 focus-visible:ring-offset-0",
                      "placeholder:text-muted-foreground placeholder:text-sm",
                      "min-h-[60px]"
                    )}
                    style={{ overflow: "hidden" }}
                  />
                </div>

                {/* Bottom Toolbar */}
                <div className="flex items-center justify-between p-3 border-t border-border/50">
                  {/* Left side - Tools Menu (ChatGPT-style) */}
                  <div className="flex items-center gap-2">
                    {/* Plus Button with Popover Menu */}
                    <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-56 p-2"
                        align="start"
                        side="top"
                        sideOffset={8}
                      >
                        <div className="space-y-1">
                          {/* Search the Web */}
                          <button
                            type="button"
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left",
                              webSearchEnabled && "bg-primary/10"
                            )}
                            onClick={() => {
                              setWebSearchEnabled(!webSearchEnabled)
                              setIsToolsOpen(false)
                            }}
                          >
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Search the web</span>
                            {webSearchEnabled && (
                              <CheckCircle className="w-3.5 h-3.5 ml-auto text-primary" />
                            )}
                          </button>

                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* AI Model Selector - ChatGPT Style */}
                    <Popover open={isModelMenuOpen} onOpenChange={setIsModelMenuOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-xs">{getCurrentModelDisplay().model}</span>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-64 p-0"
                        align="start"
                        side="top"
                        sideOffset={8}
                      >
                        <div className="p-2 border-b border-border">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Models</span>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {Object.entries(aiProviderModels).map(([providerId, provider]) => (
                            <div key={providerId} className="border-b border-border/50 last:border-0">
                              {/* Provider Header - Expandable */}
                              <button
                                type="button"
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-left",
                                  expandedProvider === providerId && "bg-muted/50"
                                )}
                                onClick={() => setExpandedProvider(expandedProvider === providerId ? null : providerId)}
                              >
                                <div>
                                  <div className="font-medium text-sm">{provider.name}</div>
                                  <div className="text-xs text-muted-foreground">{provider.description}</div>
                                </div>
                                <ChevronRight className={cn(
                                  "w-4 h-4 text-muted-foreground transition-transform",
                                  expandedProvider === providerId && "rotate-90"
                                )} />
                              </button>

                              {/* Models Submenu */}
                              {expandedProvider === providerId && (
                                <div className="bg-muted/30 py-1">
                                  {provider.models.map((model) => (
                                    <button
                                      key={model.id}
                                      type="button"
                                      className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left",
                                        selectedModel === model.id && aiProvider === providerId && "bg-primary/10"
                                      )}
                                      onClick={() => handleModelSelect(providerId, model.id)}
                                    >
                                      <div className="flex-1">
                                        <div className="text-sm">{model.name}</div>
                                        <div className="text-xs text-muted-foreground">{model.description}</div>
                                      </div>
                                      {selectedModel === model.id && aiProvider === providerId && (
                                        <Check className="w-4 h-4 text-primary" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Tools Summary Button */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      onClick={() => setIsToolsOpen(true)}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span className="text-xs">Tools</span>
                    </button>
                  </div>

                  {/* Right side - Send Button */}
                  <div className="flex items-center gap-2">
                    {/* Show hint when no materials and no prompt */}
                    {selectedMaterials.length === 0 && !customPrompt.trim() && (
                      <span className="text-xs text-muted-foreground mr-2">
                        Select materials or enter a prompt
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isGenerating || (selectedMaterials.length === 0 && !customPrompt.trim())}
                      onClick={handleGenerate}
                      className={cn(
                        "p-2 rounded-full transition-all flex items-center justify-center",
                        (selectedMaterials.length > 0 || customPrompt.trim()) && !isGenerating
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      {isGenerating ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowUp className="w-4 h-4" />
                      )}
                      <span className="sr-only">Generate</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Configuration Section - Collapsible */}
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Configure Generation</span>
                    <span className="text-xs text-muted-foreground">(Advanced)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{getConfigSummary()}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isConfigExpanded && "rotate-180"
                    )} />
                  </div>
                </Button>

                {/* Expanded Configuration Options */}
                {isConfigExpanded && (
                  <div className="space-y-6 p-4 border border-border rounded-lg bg-muted/30 animate-in slide-in-from-top-2 duration-200">
                    {/* Question Type - Single Select */}
                    <div className="space-y-3">
                      <Label>Question Type</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "multiple-choice", label: "Multiple Choice" },
                          { id: "true-false", label: "True/False" },
                          { id: "short-answer", label: "Short Answer" },
                          { id: "essay", label: "Essay" }
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            className={cn(
                              "px-3 py-2 rounded-lg text-sm transition-colors border",
                              questionType === type.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                            )}
                            onClick={() => setQuestionType(type.id)}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Number of Questions - Max 10 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Number of Questions</Label>
                        <span className="text-sm font-medium bg-muted px-2 py-1 rounded">{questionCount[0]}</span>
                      </div>
                      <Slider
                        value={questionCount}
                        onValueChange={setQuestionCount}
                        max={10}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>10</span>
                      </div>
                    </div>

                    {/* Two Column Layout for Selects */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Difficulty Level */}
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

                      {/* Subject - Auto-populated from materials */}
                      <div className="space-y-2">
                        <Label>
                          Subject
                          {selectedMaterials.length > 0 && selectedMaterials[0].subject && (
                            <span className="text-xs text-muted-foreground ml-2">(from material)</span>
                          )}
                        </Label>
                        <Select value={subject} onValueChange={setSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjectsData && Array.isArray(subjectsData) && subjectsData.length > 0 ? (
                              subjectsData.map((s: any) => (
                                <SelectItem key={s.id || s._id} value={s.name.toLowerCase()}>
                                  {s.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>No subjects available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Topic - Auto-populated from materials */}
                    <div className="space-y-2">
                      <Label>
                        Topic
                        {selectedMaterials.length > 0 && selectedMaterials[0].topic && (
                          <span className="text-xs text-muted-foreground ml-2">(from material)</span>
                        )}
                      </Label>
                      <Input
                        placeholder="e.g., Algebra, Mechanics"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {generationError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Generation Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">{generationError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setGenerationError(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Generation Progress (when generating) */}
              {isGenerating && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Generating questions...</p>
                      <p className="text-sm text-muted-foreground">This may take a few moments depending on the AI provider</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Material Selection Modal */}
        <Dialog open={isMaterialModalOpen} onOpenChange={setIsMaterialModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                Select Materials
              </DialogTitle>
              <DialogDescription>
                Choose materials from your library to generate questions from
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Materials List */}
            <ScrollArea className="h-[400px] pr-4">
              {materialsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Skeleton className="w-10 h-10 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMaterials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {materialSearchQuery ? "No materials match your search" : "No materials found"}
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Material
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMaterials.map((material) => {
                    const isSelected = selectedMaterials.some(m => m._id === material._id)
                    return (
                      <div
                        key={material._id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                        }`}
                        onClick={() => toggleMaterialSelection(material)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className={`p-2 rounded ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                          {getMaterialIcon(material.material_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{material.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="uppercase">{material.material_type}</span>
                            {material.topic && (
                              <>
                                <span>•</span>
                                <span>{material.topic}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <Button variant="outline" onClick={() => setIsMaterialModalOpen(false)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload New
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedMaterials.length} selected
                </span>
                <Button onClick={() => setIsMaterialModalOpen(false)}>
                  Done
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
