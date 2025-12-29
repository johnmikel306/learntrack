/**
 * OpenCanvasGenerator - Main Question Generator component
 * Inspired by LangChain's Open Canvas with split-screen layout
 */
import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigSidebar } from './ConfigSidebar'
import { QuestionCanvas } from './QuestionCanvas'
import { SessionDrawer } from './SessionDrawer'
import { Sparkles, PanelLeftClose, PanelLeft, FileText, Search } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { toast } from '@/contexts/ToastContext'
import { cn } from '@/lib/utils'
import { useMaterials } from '@/hooks/useQueries'
import { useIsMobile } from '@/hooks/use-mobile'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Mapping functions
const mapQuestionType = (type: string): string => {
  const map: Record<string, string> = {
    'multiple-choice': 'MCQ',
    'true-false': 'TRUE_FALSE',
    'short-answer': 'SHORT_ANSWER',
    'essay': 'ESSAY',
  }
  return map[type] || 'MCQ'
}

const mapDifficulty = (diff: string): string => {
  const map: Record<string, string> = {
    beginner: 'EASY',
    intermediate: 'MEDIUM',
    advanced: 'HARD',
  }
  return map[diff] || 'MEDIUM'
}

interface GeneratedQuestion {
  question_id: string
  session_id?: string  // Added to track which session this question belongs to
  type: string
  difficulty: string
  blooms_level?: string
  question_text: string
  options?: string[]
  correct_answer: string
  explanation?: string
  status?: 'pending' | 'approved' | 'rejected'
}

interface Session {
  session_id: string
  prompt: string
  original_prompt?: string  // Backend returns this
  created_at: string
  status: 'completed' | 'failed' | 'in_progress' | 'pending'
  question_count: number
  total_questions?: number  // Backend returns this
  approved_count: number
  pending_count: number
  rejected_count: number
  questions?: any[]
}

interface Material {
  _id: string
  title: string
  description?: string
  material_type: string
  tags: string[]
}

export function OpenCanvasGenerator() {
  const { getToken } = useAuth()
  const isMobile = useIsMobile()

  // Sidebar state - collapsed by default on mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true)
    }
  }, [isMobile])
  
  // Form state - defaults will be loaded from settings
  const [prompt, setPrompt] = useState('')
  const [questionCount, setQuestionCount] = useState(1)
  const [questionType, setQuestionType] = useState('multiple-choice')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [aiProvider, setAiProvider] = useState('')  // Will be loaded from settings
  const [selectedModel, setSelectedModel] = useState('')  // Will be loaded from settings
  const [bloomsLevels, setBloomsLevels] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([])
  const [isMaterialsDialogOpen, setIsMaterialsDialogOpen] = useState(false)
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true)

  // Fetch AI defaults from settings on mount
  useEffect(() => {
    const fetchAIDefaults = async () => {
      try {
        const token = await getToken()
        const response = await fetch(`${API_BASE_URL}/settings/ai/defaults`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          // Set provider and model from saved settings
          if (data.default_provider) {
            setAiProvider(data.default_provider)
          } else {
            setAiProvider('groq')  // Fallback
          }
          if (data.default_model) {
            setSelectedModel(data.default_model)
          } else {
            setSelectedModel('llama-3.3-70b-versatile')  // Fallback
          }
        } else {
          // Fallback to defaults if settings not available
          setAiProvider('groq')
          setSelectedModel('llama-3.3-70b-versatile')
        }
      } catch (error) {
        console.error('Failed to fetch AI defaults:', error)
        // Fallback to defaults
        setAiProvider('groq')
        setSelectedModel('llama-3.3-70b-versatile')
      } finally {
        setIsLoadingDefaults(false)
      }
    }
    fetchAIDefaults()
  }, [getToken])

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentAction, setCurrentAction] = useState<string | null>(null)
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([])
  const [foundSources, setFoundSources] = useState<Array<{ id: string; title: string; excerpt: string }>>([])
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  
  // Materials query
  const { data: materialsData, isLoading: isLoadingMaterials } = useMaterials()
  const materials = materialsData?.materials || []

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true)
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/question-generator/sessions-with-questions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        // Map backend response to frontend Session interface
        const items = data.items || data.sessions || []
        const mappedSessions: Session[] = items.map((s: any) => ({
          session_id: s.session_id,
          prompt: s.original_prompt || s.prompt || 'Untitled Generation',
          original_prompt: s.original_prompt,
          created_at: s.created_at,
          status: s.status || 'completed',
          question_count: s.total_questions || s.question_count || 0,
          total_questions: s.total_questions,
          approved_count: s.approved_count || 0,
          pending_count: s.pending_count || 0,
          rejected_count: s.rejected_count || 0,
          questions: s.questions || [],
        }))
        setSessions(mappedSessions)
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setIsLoadingSessions(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Load session questions
  const handleSelectSession = useCallback(async (selectedId: string) => {
    setSelectedSessionId(selectedId)
    setSessionId(selectedId)  // Also set the active sessionId
    const session = sessions.find(s => s.session_id === selectedId)
    if (session?.questions) {
      setQuestions(session.questions.map(q => ({
        ...q,
        session_id: selectedId,  // Attach session_id to each question
        status: q.status || 'pending',
      })))
      setPrompt(session.prompt || '')
    }
  }, [sessions])

  // Toggle material selection
  const toggleMaterial = (material: Material) => {
    setSelectedMaterials(prev => {
      const exists = prev.find(m => m._id === material._id)
      if (exists) {
        return prev.filter(m => m._id !== material._id)
      }
      return [...prev, material]
    })
  }

  // Handle generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() && selectedMaterials.length === 0) {
      toast.error('Please enter a prompt or select materials')
      return
    }

    // Reset state
    setIsGenerating(true)
    setThinkingSteps([])
    setFoundSources([])
    setQuestions([])
    setStreamingContent('')
    setCurrentAction(null)
    setProgress({ current: 0, total: questionCount })
    setSelectedSessionId(null)

    try {
      const token = await getToken()
      const requestBody = {
        prompt: prompt || `Generate ${questionCount} questions about the selected materials`,
        question_count: questionCount,
        question_types: [mapQuestionType(questionType)],
        difficulty: mapDifficulty(difficulty),
        material_ids: selectedMaterials.map(m => m._id),
        ai_provider: aiProvider,
        model_name: selectedModel,
        blooms_levels: bloomsLevels.length > 0 ? bloomsLevels : undefined,
      }

      const response = await fetch(`${API_BASE_URL}/question-generator/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              handleStreamEvent(data)
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      toast.success('Questions generated successfully!')
      fetchSessions() // Refresh sessions
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate questions')
    } finally {
      setIsGenerating(false)
      setCurrentAction(null)
    }
  }, [prompt, questionCount, questionType, difficulty, aiProvider, bloomsLevels, selectedMaterials, getToken, fetchSessions])

  // Handle stream events
  const handleStreamEvent = useCallback((data: any) => {
    const eventType = data.event_type || data.type

    switch (eventType) {
      case 'session:created':
        setSessionId(data.session_id)
        break

      case 'agent:thinking':
        if (data.step) {
          setThinkingSteps(prev => [...prev.slice(-4), data.step])
        }
        break

      case 'agent:action':
        setCurrentAction(data.step || null)
        break

      case 'source:found':
        setFoundSources(prev => [...prev, {
          id: data.source_id || `src-${prev.length}`,
          title: data.source_title || 'Source',
          excerpt: data.source_excerpt || '',
        }])
        break

      case 'generation:chunk':
        if (data.content) {
          setStreamingContent(prev => prev + data.content)
        }
        break

      case 'generation:question_complete':
        if (data.question_data) {
          // Capture sessionId in closure for the question
          setQuestions(prev => [...prev, {
            ...data.question_data,
            session_id: sessionId || data.session_id,
            status: 'pending',
          }])
          setStreamingContent('')
          setProgress(prev => ({ ...prev, current: prev.current + 1 }))
        }
        break

      case 'done':
        setIsGenerating(false)
        break
    }
  }, [])

  // Question actions
  const handleApprove = useCallback(async (questionId: string) => {
    try {
      // Find the question to get its session_id
      const question = questions.find(q => q.question_id === questionId)
      const qSessionId = question?.session_id || sessionId

      if (!qSessionId) {
        toast.error('Session ID not found')
        return
      }

      const token = await getToken()
      await fetch(`${API_BASE_URL}/question-generator/sessions/${qSessionId}/questions/${questionId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setQuestions(prev => prev.map(q =>
        q.question_id === questionId ? { ...q, status: 'approved' as const } : q
      ))
      toast.success('Question approved')
    } catch (error) {
      toast.error('Failed to approve question')
    }
  }, [getToken, questions, sessionId])

  const handleReject = useCallback(async (questionId: string) => {
    try {
      // Find the question to get its session_id
      const question = questions.find(q => q.question_id === questionId)
      const qSessionId = question?.session_id || sessionId

      if (!qSessionId) {
        toast.error('Session ID not found')
        return
      }

      const token = await getToken()
      await fetch(`${API_BASE_URL}/question-generator/sessions/${qSessionId}/questions/${questionId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setQuestions(prev => prev.map(q =>
        q.question_id === questionId ? { ...q, status: 'rejected' as const } : q
      ))
      toast.success('Question rejected')
    } catch (error) {
      toast.error('Failed to reject question')
    }
  }, [getToken, questions, sessionId])

  const handleApproveAll = useCallback(async () => {
    const pendingQuestions = questions.filter(q => q.status === 'pending' || !q.status)
    for (const q of pendingQuestions) {
      await handleApprove(q.question_id)
    }
  }, [questions, handleApprove])

  const handleEdit = useCallback(async (questionId: string, data: Partial<GeneratedQuestion>) => {
    try {
      // Find the question to get its session_id
      const question = questions.find(q => q.question_id === questionId)
      const qSessionId = question?.session_id || sessionId

      if (!qSessionId) {
        toast.error('Session ID not found')
        return
      }

      const token = await getToken()
      await fetch(`${API_BASE_URL}/question-generator/sessions/${qSessionId}/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })
      setQuestions(prev => prev.map(q =>
        q.question_id === questionId ? { ...q, ...data } : q
      ))
      toast.success('Question updated')
    } catch (error) {
      toast.error('Failed to update question')
    }
  }, [getToken, questions, sessionId])

  const handleStop = useCallback(() => {
    // TODO: Implement abort controller
    setIsGenerating(false)
  }, [])

  const handleDeleteSession = useCallback(async (sessionIdToDelete: string) => {
    const token = await getToken()
    const response = await fetch(`${API_BASE_URL}/question-generator/sessions/${sessionIdToDelete}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to delete session')
    }

    // Remove from local state
    setSessions(prev => prev.filter(s => s.session_id !== sessionIdToDelete))

    // If this was the selected session, clear it
    if (selectedSessionId === sessionIdToDelete) {
      setSelectedSessionId(null)
      setSessionId(null)
      setQuestions([])
    }
  }, [getToken, selectedSessionId])

  // Responsive sidebar width: full on mobile when open, 320px on tablet, 360px on desktop
  const sidebarWidth = isMobile ? (typeof window !== 'undefined' ? window.innerWidth : 320) : 360

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden rounded-lg border bg-background relative">
      {/* Mobile overlay backdrop */}
      {isMobile && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Left Sidebar - Configuration */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarCollapsed ? 0 : sidebarWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'border-r bg-muted/30 overflow-hidden',
          isMobile ? 'fixed left-0 top-0 h-full z-30' : 'relative'
        )}
      >
        <div className={cn('h-full', isMobile ? 'w-[100vw] max-w-[360px]' : 'w-[360px]')}>
          <div className="flex items-center justify-between p-3 sm:p-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">AI Generator</span>
            </div>
            <SessionDrawer
              sessions={sessions}
              isLoading={isLoadingSessions}
              onRefresh={fetchSessions}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              selectedSessionId={selectedSessionId}
            />
          </div>
          <ConfigSidebar
            prompt={prompt}
            onPromptChange={setPrompt}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            questionType={questionType}
            onQuestionTypeChange={setQuestionType}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            aiProvider={aiProvider}
            onAiProviderChange={setAiProvider}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            bloomsLevels={bloomsLevels}
            onBloomsLevelsChange={setBloomsLevels}
            selectedMaterials={selectedMaterials}
            onMaterialsClick={() => setIsMaterialsDialogOpen(true)}
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onStop={handleStop}
          />
        </div>
      </motion.div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'z-10 h-8 w-8 sm:w-6 rounded-l-none border border-l-0 bg-background hover:bg-muted',
          isMobile
            ? 'fixed left-0 top-20 rounded-r-md'
            : 'absolute top-1/2 -translate-y-1/2'
        )}
        style={{ left: isMobile ? (isSidebarCollapsed ? 0 : 'auto') : (isSidebarCollapsed ? 0 : sidebarWidth) }}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        {isSidebarCollapsed ? (
          <PanelLeft className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>

      {/* Right Canvas - Questions */}
      <div className="flex-1 overflow-hidden">
        <QuestionCanvas
          isGenerating={isGenerating}
          currentAction={currentAction}
          thinkingSteps={thinkingSteps}
          progress={progress}
          foundSources={foundSources}
          questions={questions}
          streamingContent={streamingContent}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
          onApproveAll={handleApproveAll}
        />
      </div>

      {/* Materials Selection Dialog */}
      <Dialog open={isMaterialsDialogOpen} onOpenChange={setIsMaterialsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Materials
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {isLoadingMaterials ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No materials available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {materials.map((material: Material) => {
                  const isSelected = selectedMaterials.some(m => m._id === material._id)
                  return (
                    <div
                      key={material._id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        isSelected ? 'bg-primary/5 border-primary/50' : 'hover:bg-muted/50'
                      )}
                      onClick={() => toggleMaterial(material)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{material.title}</p>
                        {material.description && (
                          <p className="text-xs text-muted-foreground truncate">{material.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {material.material_type}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedMaterials.length} selected
            </span>
            <Button onClick={() => setIsMaterialsDialogOpen(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OpenCanvasGenerator