/**
 * QuestionCanvas - Main canvas area for displaying generated questions
 * Inspired by Open Canvas's artifact view with real-time streaming
 */
import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AgentStatusBar } from './AgentStatusBar'
import { QuestionCard } from './QuestionCard'
import { Sparkles, FileQuestion, Download, CheckCircle, Loader2 } from 'lucide-react'

interface GeneratedQuestion {
  question_id: string
  type: string
  difficulty: string
  blooms_level?: string
  question_text: string
  options?: string[]
  correct_answer: string
  explanation?: string
  status?: 'pending' | 'approved' | 'rejected'
}

interface QuestionCanvasProps {
  // Generation state
  isGenerating: boolean
  currentAction: string | null
  thinkingSteps: string[]
  progress: { current: number; total: number }
  foundSources: Array<{ id: string; title: string; excerpt: string }>

  // Questions
  questions: GeneratedQuestion[]
  streamingContent?: string

  // Actions
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onEdit?: (id: string, data: Partial<GeneratedQuestion>) => void
  onRegenerate?: (id: string) => void
  onDelete?: (id: string) => void
  onApproveAll?: () => void
  onExport?: () => void
}

export function QuestionCanvas({
  isGenerating,
  currentAction,
  thinkingSteps,
  progress,
  foundSources,
  questions,
  streamingContent,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  onDelete,
  onApproveAll,
  onExport,
}: QuestionCanvasProps) {
  const pendingCount = questions.filter(q => q.status === 'pending' || !q.status).length
  const approvedCount = questions.filter(q => q.status === 'approved').length
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new questions arrive or streaming
  useEffect(() => {
    if (scrollRef.current && (isGenerating || questions.length > 0)) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [questions.length, streamingContent, isGenerating])

  return (
    <div className="flex flex-col h-full">
      {/* Status Bar */}
      <div className="p-4 border-b">
        <AgentStatusBar
          isGenerating={isGenerating}
          currentAction={currentAction}
          thinkingSteps={thinkingSteps}
          progress={progress}
          foundSources={foundSources}
        />
      </div>

      {/* Canvas Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {questions.length === 0 && !isGenerating ? (
              <EmptyCanvasState />
            ) : (
              <>
                {questions.map((question, index) => (
                  <motion.div
                    key={question.question_id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    <QuestionCard
                      question={question}
                      index={index}
                      isStreaming={false}
                      onApprove={onApprove}
                      onReject={onReject}
                      onEdit={onEdit}
                      onRegenerate={onRegenerate}
                      onDelete={onDelete}
                    />
                  </motion.div>
                ))}

                {/* Streaming content preview - shows while generating next question */}
                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-4 bg-zinc-900/95 border-zinc-800 border-dashed border-2">
                      {/* Header matching QuestionCard style */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20">
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        </div>
                        <span className="text-xs text-zinc-400">
                          Generating Question {progress.current + 1} of {progress.total}
                        </span>
                      </div>

                      {streamingContent ? (
                        <div className="space-y-3">
                          {/* Question text streaming */}
                          <p className="text-sm text-zinc-200 leading-relaxed">
                            {streamingContent}
                            <span className="inline-block w-2 h-4 ml-1 bg-primary/60 animate-pulse" />
                          </p>

                          {/* Skeleton for options */}
                          <div className="space-y-1 mt-4">
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Question skeleton */}
                          <div className="space-y-2">
                            <div className="h-4 bg-zinc-800/50 rounded animate-pulse w-3/4" />
                            <div className="h-4 bg-zinc-800/50 rounded animate-pulse w-full" />
                          </div>

                          {/* Options skeleton */}
                          <div className="space-y-1 mt-4">
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                            <div className="h-8 bg-zinc-800/50 rounded animate-pulse w-full" />
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer Actions */}
      {questions.length > 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 border-t bg-muted/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{questions.length} questions</span>
              <span className="text-yellow-600">{pendingCount} pending</span>
              <span className="text-green-600">{approvedCount} approved</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              {pendingCount > 0 && (
                <Button size="sm" onClick={onApproveAll}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve All ({pendingCount})
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function EmptyCanvasState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="rounded-full bg-primary/10 p-6 mb-4">
        <FileQuestion className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Configure your generation settings and click "Generate" to create AI-powered questions.
        Questions will appear here in real-time.
      </p>
    </motion.div>
  )
}

export default QuestionCanvas

