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
  const [bloomsLevels, setBloomsLevels] = useState<string[]>([]) // Empty = AUTO
  const [aiProvider, setAiProvider] = useState("groq") // Default to groq since it's configured
  const [selectedModel, setSelectedModel] = useState("openai/gpt-oss-120b") // Default model
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null) // For submenu
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Streaming state
  const [streamingSessionId, setStreamingSessionId] = useState<string | null>(null)
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([])
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [foundSources, setFoundSources] = useState<Array<{id: string, title: string, excerpt: string}>>([])
  const [streamingQuestions, setStreamingQuestions] = useState<Map<string, { text: string, complete: boolean, data?: any }>>(new Map())

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

  // Review & Approve tab state
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([])
  const [pendingQuestionsCount, setPendingQuestionsCount] = useState(0)
  const [isLoadingPending, setIsLoadingPending] = useState(false)
  const [pendingPage, setPendingPage] = useState(1)
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState<any | null>(null)

  // Sessions view state
  const [reviewViewMode, setReviewViewMode] = useState<'sessions' | 'pending'>('sessions')
  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsCount, setSessionsCount] = useState(0)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

  // Note: Generated questions are shown in the live preview canvas during generation
  // and stored in the database for later review in the Review & Approve tab

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

  // Fetch pending questions from API
  const fetchPendingQuestions = async (page: number = 1) => {
    setIsLoadingPending(true)
    try {
      const token = await getToken()
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
      const apiRoot = normalizedBase.match(/\/api\/v\d+$/) ? normalizedBase : `${normalizedBase}/api/v1`

      const response = await fetch(`${apiRoot}/question-generator/pending-questions?page=${page}&per_page=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPendingQuestions(data.items || [])
        setPendingQuestionsCount(data.total || 0)
        setPendingPage(page)
      }
    } catch (error) {
      console.error('Error fetching pending questions:', error)
    } finally {
      setIsLoadingPending(false)
    }
  }

  // Fetch sessions with questions
  const fetchSessionsWithQuestions = async (page: number = 1) => {
    setIsLoadingSessions(true)
    try {
      const token = await getToken()
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
      const apiRoot = normalizedBase.match(/\/api\/v\d+$/) ? normalizedBase : `${normalizedBase}/api/v1`

      const response = await fetch(`${apiRoot}/question-generator/sessions-with-questions?page=${page}&per_page=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.items || [])
        setSessionsCount(data.total || 0)
        setSessionsPage(page)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }

  // Toggle session expansion
  const toggleSessionExpanded = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev)
      if (next.has(sessionId)) {
        next.delete(sessionId)
      } else {
        next.add(sessionId)
      }
      return next
    })
  }

  // Fetch data when review tab becomes active
  useEffect(() => {
    if (activeTab === 'review') {
      if (reviewViewMode === 'sessions') {
        fetchSessionsWithQuestions(1)
      } else {
        fetchPendingQuestions(1)
      }
    }
  }, [activeTab, reviewViewMode])

  // Handle approve question
  const handleApproveQuestion = async (sessionId: string, questionId: string) => {
    try {
      const token = await getToken()
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
      const apiRoot = normalizedBase.match(/\/api\/v\d+$/) ? normalizedBase : `${normalizedBase}/api/v1`

      const response = await fetch(`${apiRoot}/question-generator/sessions/${sessionId}/questions/${questionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Question approved!')
        setPendingQuestions(prev => prev.filter(q => q.question_id !== questionId))
        setPendingQuestionsCount(prev => Math.max(0, prev - 1))
        // Refresh sessions if in sessions view
        if (reviewViewMode === 'sessions') {
          fetchSessionsWithQuestions(sessionsPage)
        }
      } else {
        throw new Error('Failed to approve question')
      }
    } catch (error: any) {
      console.error('Error approving question:', error)
      toast.error(error.message || 'Failed to approve question')
    }
  }

  // Handle reject question
  const handleRejectQuestion = async (sessionId: string, questionId: string) => {
    try {
      const token = await getToken()
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
      const apiRoot = normalizedBase.match(/\/api\/v\d+$/) ? normalizedBase : `${normalizedBase}/api/v1`

      const response = await fetch(`${apiRoot}/question-generator/sessions/${sessionId}/questions/${questionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Question rejected')
        setPendingQuestions(prev => prev.filter(q => q.question_id !== questionId))
        setPendingQuestionsCount(prev => Math.max(0, prev - 1))
        // Refresh sessions if in sessions view
        if (reviewViewMode === 'sessions') {
          fetchSessionsWithQuestions(sessionsPage)
        }
      } else {
        throw new Error('Failed to reject question')
      }
    } catch (error: any) {
      console.error('Error rejecting question:', error)
      toast.error(error.message || 'Failed to reject question')
    }
  }

  // Start editing a question
  const startEditingQuestion = (question: any) => {
    setEditingQuestion(question)
    setEditFormData({
      question_text: question.question_text,
      options: question.options || [],
      correct_answer: question.correct_answer,
      explanation: question.explanation || ''
    })
  }

  // Handle update question
  const handleUpdateQuestion = async (sessionId: string, questionId: string, data: any) => {
    try {
      const token = await getToken()
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
      const apiRoot = normalizedBase.match(/\/api\/v\d+$/) ? normalizedBase : `${normalizedBase}/api/v1`

      const response = await fetch(`${apiRoot}/question-generator/sessions/${sessionId}/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast.success('Question updated!')
        setEditingQuestion(null)
        setEditFormData(null)
        // Refresh the list
        fetchPendingQuestions(pendingPage)
      } else {
        throw new Error('Failed to update question')
      }
    } catch (error: any) {
      console.error('Error updating question:', error)
      toast.error(error.message || 'Failed to update question')
    }
  }

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

    // Reset streaming state
    setIsGenerating(true)
    setGenerationError(null)
    setThinkingSteps([])
    setCurrentAction(null)
    setFoundSources([])
    setStreamingQuestions(new Map())
    setStreamingSessionId(null)

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
        model_name: selectedModel,
        blooms_levels: bloomsLevels.length > 0 ? bloomsLevels : undefined // Empty = AUTO
      }

      // Get auth token
      const token = await getToken()

      // API base URL
      const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const normalizedBase = apiBaseUrl.replace(/\/+$/, '')
      const apiRoot = normalizedBase.match(/\/api\/v\d+$/) ? normalizedBase : `${normalizedBase}/api/v1`

      // Use fetch with SSE streaming
      const response = await fetch(`${apiRoot}/question-generator/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(generateRequest)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body for streaming')
      }

      // Read SSE stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sessionId: string | null = null
      const questionsMap = new Map<string, { text: string, complete: boolean, data?: any }>()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        let currentEventType = ''
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6)

            if (currentEventType && currentData) {
              try {
                const data = JSON.parse(currentData)

                // Handle different event types
                switch (currentEventType) {
                  case 'session:created':
                    sessionId = data.session_id
                    setStreamingSessionId(data.session_id)
                    break

                  case 'agent:thinking':
                    if (data.step) {
                      setThinkingSteps(prev => [...prev.slice(-4), data.step]) // Keep last 5
                    }
                    break

                  case 'agent:action':
                    setCurrentAction(data.step || null)
                    break

                  case 'source:found':
                    setFoundSources(prev => [...prev, {
                      id: data.source_id || `src-${prev.length}`,
                      title: data.source_title || 'Source',
                      excerpt: data.source_excerpt || ''
                    }])
                    break

                  case 'generation:chunk':
                    if (data.question_id && data.content) {
                      questionsMap.set(data.question_id, {
                        text: (questionsMap.get(data.question_id)?.text || '') + data.content,
                        complete: false
                      })
                      setStreamingQuestions(new Map(questionsMap))
                    }
                    break

                  case 'generation:question_complete':
                    if (data.question_id && data.question_data) {
                      questionsMap.set(data.question_id, {
                        text: data.question_data.question_text || '',
                        complete: true,
                        data: data.question_data
                      })
                      setStreamingQuestions(new Map(questionsMap))
                    }
                    break

                  case 'error:message':
                    throw new Error(data.error_message || 'Generation error')

                  case 'done':
                    // Generation complete - fetch final session data
                    if (sessionId) {
                      const sessionResponse = await apiClient.get<any>(`/question-generator/sessions/${sessionId}`)
                      const questionCount = sessionResponse.data?.questions?.length || 0
                      toast.success(`Generated ${questionCount} questions! Click "Review All" to approve them.`)
                      // Refresh pending questions count
                      fetchPendingQuestions(1)
                    }
                    break
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', currentData)
              }
            }

            currentEventType = ''
            currentData = ''
          } else if (line.trim() === '') {
            // Event boundary
            currentEventType = ''
            currentData = ''
          }
        }
      }

    } catch (error: any) {
      console.error('Generation failed:', error)
      const errorMessage = error.message || 'Failed to generate questions'
      setGenerationError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
      setCurrentAction(null)
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

      {/* Main Content Tabs - Simplified to 2 tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Generate Questions
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Review & Approve
            {pendingQuestionsCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-warning/20 text-warning">
                {pendingQuestionsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Generate Questions Tab - Split Screen Layout */}
        <TabsContent value="generate" className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)] min-h-[500px]">
            {/* Left Panel - Input & Configuration */}
            <Card className="flex flex-col h-full overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-primary" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-4">
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

                    {/* Bloom's Taxonomy Levels */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Bloom's Taxonomy Levels</Label>
                        <span className="text-xs text-muted-foreground">
                          {bloomsLevels.length === 0 ? 'AUTO (based on difficulty)' : `${bloomsLevels.length} selected`}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          { value: 'REMEMBER', label: 'Remember', desc: 'Recall facts' },
                          { value: 'UNDERSTAND', label: 'Understand', desc: 'Explain ideas' },
                          { value: 'APPLY', label: 'Apply', desc: 'Use in new situations' },
                          { value: 'ANALYZE', label: 'Analyze', desc: 'Draw connections' },
                          { value: 'EVALUATE', label: 'Evaluate', desc: 'Justify decisions' },
                          { value: 'CREATE', label: 'Create', desc: 'Produce new work' }
                        ].map((level) => (
                          <div
                            key={level.value}
                            className={cn(
                              "p-3 border rounded-lg cursor-pointer transition-all duration-200",
                              bloomsLevels.includes(level.value)
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => {
                              if (bloomsLevels.includes(level.value)) {
                                setBloomsLevels(bloomsLevels.filter(l => l !== level.value))
                              } else {
                                setBloomsLevels([...bloomsLevels, level.value])
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center",
                                bloomsLevels.includes(level.value)
                                  ? "bg-primary border-primary"
                                  : "border-muted-foreground"
                              )}>
                                {bloomsLevels.includes(level.value) && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                              <span className="font-medium text-sm">{level.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 ml-6">{level.desc}</p>
                          </div>
                        ))}
                      </div>
                      {bloomsLevels.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setBloomsLevels([])}
                        >
                          Clear selection (use AUTO)
                        </Button>
                      )}
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
              </CardContent>
            </Card>

            {/* Right Panel - Live Preview Canvas */}
            <Card className="flex flex-col h-full overflow-hidden border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-muted/30">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5 text-primary" />
                    Live Preview
                  </CardTitle>
                  {streamingQuestions.size > 0 && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {[...streamingQuestions.values()].filter(q => q.complete).length}/{streamingQuestions.size} complete
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4">
                {/* Empty State */}
                {!isGenerating && streamingQuestions.size === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Brain className="w-10 h-10 text-primary/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Ready to Generate</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Configure your settings and click Generate to see questions appear here in real-time
                    </p>
                  </div>
                )}

                {/* Generating State - AI Thinking */}
                {isGenerating && (
                  <div className="space-y-4">
                    {/* AI Status Header */}
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="relative">
                        <Brain className="w-8 h-8 text-primary" />
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">AI is working...</p>
                        {streamingSessionId && (
                          <p className="text-xs text-muted-foreground">Session: {streamingSessionId.slice(0, 8)}...</p>
                        )}
                      </div>
                    </div>

                    {/* Thinking Steps */}
                    {thinkingSteps.length > 0 && (
                      <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Thinking Process
                        </p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {thinkingSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-left-2">
                              <ChevronRight className="w-3 h-3 mt-1 text-purple-400 flex-shrink-0" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Action */}
                    {currentAction && (
                      <div className="flex items-center gap-2 text-sm text-primary p-2 bg-primary/5 rounded-lg animate-in fade-in">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="font-medium">{currentAction}</span>
                      </div>
                    )}

                    {/* Found Sources */}
                    {foundSources.length > 0 && (
                      <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          📚 Sources Found ({foundSources.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {foundSources.slice(0, 5).map((source) => (
                            <Badge key={source.id} variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 animate-in fade-in zoom-in">
                              <FileText className="w-3 h-3 mr-1" />
                              {source.title.slice(0, 20)}{source.title.length > 20 ? '...' : ''}
                            </Badge>
                          ))}
                          {foundSources.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{foundSources.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fallback if no streaming data yet */}
                    {thinkingSteps.length === 0 && foundSources.length === 0 && streamingQuestions.size === 0 && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-8">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Connecting to AI...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Generated Questions - Canvas Style */}
                {streamingQuestions.size > 0 && (
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" />
                        Generated Questions
                      </p>
                      {!isGenerating && streamingQuestions.size > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActiveTab('review')
                            fetchPendingQuestions(1)
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Review All
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {[...streamingQuestions.entries()].map(([id, q], index) => (
                        <div
                          key={id}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                            q.complete
                              ? "bg-card border-green-300 dark:border-green-700 shadow-sm"
                              : "bg-muted/30 border-primary/30"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                              q.complete
                                ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                                : "bg-primary/10 text-primary"
                            )}>
                              {q.complete ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {q.data?.type && (
                                  <Badge variant="outline" className="text-xs">{q.data.type}</Badge>
                                )}
                                {q.data?.difficulty && (
                                  <Badge variant="outline" className="text-xs">{q.data.difficulty}</Badge>
                                )}
                                {!q.complete && (
                                  <RefreshCw className="w-3 h-3 text-primary animate-spin" />
                                )}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {q.text || 'Generating...'}
                                {!q.complete && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse rounded" />}
                              </p>
                              {q.data?.options && q.complete && (
                                <div className="mt-3 space-y-1.5">
                                  {q.data.options.map((opt: string, optIdx: number) => (
                                    <div
                                      key={optIdx}
                                      className={cn(
                                        "text-xs p-2 rounded",
                                        opt === q.data?.correct_answer
                                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium"
                                          : "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      <span className="font-medium mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                      {opt}
                                      {opt === q.data?.correct_answer && (
                                        <CheckCircle className="w-3 h-3 inline ml-2" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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

        {/* Review & Approve Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-primary" />
                    Review & Approve Questions
                  </CardTitle>
                  <CardDescription>
                    {reviewViewMode === 'sessions'
                      ? 'Browse all generation sessions and their questions'
                      : 'Review pending questions from all generation sessions'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center border rounded-lg p-1 bg-muted/50">
                    <Button
                      variant={reviewViewMode === 'sessions' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setReviewViewMode('sessions')}
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Sessions
                    </Button>
                    <Button
                      variant={reviewViewMode === 'pending' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-3"
                      onClick={() => setReviewViewMode('pending')}
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Pending
                      {pendingQuestionsCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-warning/20 text-warning">
                          {pendingQuestionsCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reviewViewMode === 'sessions'
                      ? fetchSessionsWithQuestions(sessionsPage)
                      : fetchPendingQuestions(pendingPage)}
                    disabled={isLoadingSessions || isLoadingPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${(isLoadingSessions || isLoadingPending) ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sessions View */}
                {reviewViewMode === 'sessions' && (
                  <>
                    {isLoadingSessions ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Card key={i}>
                            <CardContent className="p-6">
                              <div className="space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-6 w-16" />
                                  <Skeleton className="h-6 w-16" />
                                  <Skeleton className="h-6 w-16" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No generation sessions yet</p>
                        <p className="text-sm mb-4">Generate some questions to see them here</p>
                        <Button variant="outline" onClick={() => setActiveTab('generate')}>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Generate Questions
                        </Button>
                      </div>
                    ) : (
                      <>
                        {sessions.map((session) => (
                          <Card key={session.session_id} className="overflow-hidden">
                            {/* Session Header - Clickable */}
                            <div
                              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => toggleSessionExpanded(session.session_id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center",
                                    session.status === 'completed' ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                                  )}>
                                    {expandedSessions.has(session.session_id)
                                      ? <ChevronDown className="w-4 h-4" />
                                      : <ChevronRight className="w-4 h-4" />
                                    }
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm line-clamp-1">
                                      {session.original_prompt?.slice(0, 60) || 'Generation Session'}
                                      {(session.original_prompt?.length || 0) > 60 ? '...' : ''}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(session.created_at).toLocaleDateString()} at{' '}
                                      {new Date(session.created_at).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {session.total_questions || 0} questions
                                  </Badge>
                                  {session.pending_count > 0 && (
                                    <Badge className="bg-warning/20 text-warning hover:bg-warning/30">
                                      {session.pending_count} pending
                                    </Badge>
                                  )}
                                  {session.approved_count > 0 && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      {session.approved_count} approved
                                    </Badge>
                                  )}
                                  {session.rejected_count > 0 && (
                                    <Badge variant="destructive" className="opacity-70">
                                      {session.rejected_count} rejected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Questions */}
                            {expandedSessions.has(session.session_id) && session.questions && (
                              <div className="border-t bg-muted/20">
                                <div className="p-4 space-y-3">
                                  {session.questions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      No questions in this session
                                    </p>
                                  ) : (
                                    session.questions.map((q: any, qIndex: number) => (
                                      <div
                                        key={q.question_id}
                                        className={cn(
                                          "p-4 rounded-lg border bg-card",
                                          q.status === 'pending' && "border-l-4 border-l-warning",
                                          q.status === 'approved' && "border-l-4 border-l-green-500",
                                          q.status === 'rejected' && "border-l-4 border-l-destructive opacity-60"
                                        )}
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-xs font-medium text-muted-foreground">
                                                Q{qIndex + 1}
                                              </span>
                                              <Badge variant="outline" className="text-xs">{q.type}</Badge>
                                              <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
                                              <Badge
                                                variant={q.status === 'approved' ? 'default' : q.status === 'rejected' ? 'destructive' : 'secondary'}
                                                className={cn(
                                                  "text-xs",
                                                  q.status === 'approved' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                                  q.status === 'pending' && "bg-warning/20 text-warning"
                                                )}
                                              >
                                                {q.status}
                                              </Badge>
                                            </div>
                                            <p className="text-sm">{q.question_text}</p>
                                            {q.options && q.options.length > 0 && (
                                              <div className="mt-2 space-y-1">
                                                {q.options.map((opt: string, optIdx: number) => (
                                                  <div
                                                    key={optIdx}
                                                    className={cn(
                                                      "text-xs p-1.5 rounded",
                                                      opt === q.correct_answer
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                                        : "bg-muted text-muted-foreground"
                                                    )}
                                                  >
                                                    <span className="font-medium mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                                                    {opt}
                                                    {opt === q.correct_answer && <CheckCircle className="w-3 h-3 inline ml-1" />}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          {/* Action Buttons */}
                                          {q.status === 'pending' && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  startEditingQuestion({...q, session_id: session.session_id})
                                                }}
                                              >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleApproveQuestion(session.session_id, q.question_id)
                                                }}
                                              >
                                                <Check className="w-3 h-3 mr-1" />
                                                Approve
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleRejectQuestion(session.session_id, q.question_id)
                                                }}
                                              >
                                                <X className="w-3 h-3 mr-1" />
                                                Reject
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}

                        {/* Sessions Pagination */}
                        {sessionsCount > 10 && (
                          <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">
                              Showing {sessions.length} of {sessionsCount} sessions
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={sessionsPage <= 1}
                                onClick={() => fetchSessionsWithQuestions(sessionsPage - 1)}
                              >
                                Previous
                              </Button>
                              <span className="text-sm">Page {sessionsPage}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={sessionsPage * 10 >= sessionsCount}
                                onClick={() => fetchSessionsWithQuestions(sessionsPage + 1)}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Pending Questions View */}
                {reviewViewMode === 'pending' && (
                  <>
                    {isLoadingPending ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <Card key={i}>
                            <CardContent className="p-6">
                              <div className="space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <div className="flex gap-2">
                                  <Skeleton className="h-8 w-24" />
                                  <Skeleton className="h-8 w-24" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : pendingQuestions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">All caught up!</p>
                        <p className="text-sm">No pending questions to review</p>
                      </div>
                    ) : (
                      <>
                        {pendingQuestions.map((question) => (
                          <Card key={question.question_id} className="border-l-4 border-l-warning">
                            <CardContent className="p-6">
                              {editingQuestion?.question_id === question.question_id ? (
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Question Text</label>
                                    <textarea
                                      className="w-full p-3 border rounded-lg resize-none min-h-[80px]"
                                      value={editFormData?.question_text || ''}
                                      onChange={(e) => setEditFormData((prev: any) => prev ? {...prev, question_text: e.target.value} : null)}
                                    />
                                  </div>
                                  {question.type === 'MCQ' && editFormData?.options && (
                                    <div>
                                      <label className="text-sm font-medium mb-1 block">Options</label>
                                      {editFormData.options.map((opt: string, optIdx: number) => (
                                        <div key={optIdx} className="flex items-center gap-2 mb-2">
                                          <span className="font-medium w-6">{String.fromCharCode(65 + optIdx)}.</span>
                                          <input
                                            type="text"
                                            className="flex-1 p-2 border rounded"
                                            value={opt}
                                            onChange={(e) => {
                                              const newOptions = [...editFormData.options]
                                              newOptions[optIdx] = e.target.value
                                              setEditFormData((prev: any) => prev ? {...prev, options: newOptions} : null)
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Correct Answer</label>
                                    <input
                                      type="text"
                                      className="w-full p-2 border rounded"
                                      value={editFormData?.correct_answer || ''}
                                      onChange={(e) => setEditFormData((prev: any) => prev ? {...prev, correct_answer: e.target.value} : null)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Explanation</label>
                                    <textarea
                                      className="w-full p-3 border rounded-lg resize-none min-h-[60px]"
                                      value={editFormData?.explanation || ''}
                                      onChange={(e) => setEditFormData((prev: any) => prev ? {...prev, explanation: e.target.value} : null)}
                                    />
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateQuestion(question.session_id, question.question_id, editFormData)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Save Changes
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingQuestion(null)
                                        setEditFormData(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <span className="bg-warning/10 text-warning px-2 py-1 rounded text-sm font-medium">
                                        Pending
                                      </span>
                                      <Badge variant="outline">{question.type}</Badge>
                                      <Badge variant="outline">{question.difficulty}</Badge>
                                      {question.blooms_level && (
                                        <Badge variant="outline" className="text-purple-600">{question.blooms_level}</Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {question.session_created_at && new Date(question.session_created_at).toLocaleDateString()}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium text-foreground mb-2">Question:</h4>
                                      <p className="text-muted-foreground">{question.question_text}</p>
                                    </div>

                                    {question.options && question.options.length > 0 && (
                                      <div>
                                        <h4 className="font-medium text-foreground mb-2">Options:</h4>
                                        <div className="space-y-2">
                                          {question.options.map((option: string, optIndex: number) => (
                                            <div
                                              key={optIndex}
                                              className={`p-2 rounded ${option === question.correct_answer ? 'bg-success/10 border border-success/20' : 'bg-muted'}`}
                                            >
                                              <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                              {option}
                                              {option === question.correct_answer && (
                                                <CheckCircle className="w-4 h-4 text-success inline ml-2" />
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <h4 className="font-medium text-foreground mb-2">Correct Answer:</h4>
                                      <p className="text-success font-medium">{question.correct_answer}</p>
                                    </div>

                                    {question.explanation && (
                                      <div>
                                        <h4 className="font-medium text-foreground mb-2">Explanation:</h4>
                                        <p className="text-muted-foreground">{question.explanation}</p>
                                      </div>
                                    )}

                                    {question.session_prompt && (
                                      <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
                                        <span className="font-medium">From prompt:</span> {question.session_prompt.substring(0, 100)}...
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                                    <Button
                                      size="sm"
                                      className="bg-success hover:bg-success/90"
                                      onClick={() => handleApproveQuestion(question.session_id, question.question_id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEditingQuestion(question)}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleRejectQuestion(question.session_id, question.question_id)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        ))}

                        {/* Pagination */}
                        {pendingQuestionsCount > 20 && (
                          <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">
                              Showing {pendingQuestions.length} of {pendingQuestionsCount} pending questions
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pendingPage <= 1}
                                onClick={() => fetchPendingQuestions(pendingPage - 1)}
                              >
                                Previous
                              </Button>
                              <span className="text-sm">Page {pendingPage}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pendingPage * 20 >= pendingQuestionsCount}
                                onClick={() => fetchPendingQuestions(pendingPage + 1)}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
