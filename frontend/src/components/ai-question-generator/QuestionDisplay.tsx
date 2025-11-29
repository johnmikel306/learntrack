/**
 * Question Display Component
 * 
 * Renders generated questions with markdown/LaTeX support.
 * Supports editing, approval, and rejection actions.
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  CheckCircle, XCircle, Edit, ChevronDown, ChevronUp,
  BookOpen, Target, Lightbulb, FileText
} from 'lucide-react'
import { GeneratedQuestion } from '@/hooks/useQuestionGenerator'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface QuestionDisplayProps {
  questions: GeneratedQuestion[]
  showActions?: boolean
  onEdit?: (questionId: string, instruction: string) => void
  onApprove?: (questionId: string) => void
  onReject?: (questionId: string) => void
}

const DIFFICULTY_COLORS = {
  EASY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  HARD: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function QuestionDisplay({ 
  questions, 
  showActions = false,
  onEdit,
  onApprove,
  onReject
}: QuestionDisplayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editInstruction, setEditInstruction] = useState('')
  
  const handleEdit = (questionId: string) => {
    if (editInstruction.trim() && onEdit) {
      onEdit(questionId, editInstruction)
      setEditingId(null)
      setEditInstruction('')
    }
  }
  
  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3 pr-4">
        {questions.map((question, index) => (
          <Card key={question.question_id} className="overflow-hidden">
            <Collapsible
              open={expandedId === question.question_id}
              onOpenChange={(open) => setExpandedId(open ? question.question_id : null)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="secondary">{question.type.replace('_', '/')}</Badge>
                      <Badge className={cn('text-xs', DIFFICULTY_COLORS[question.difficulty])}>
                        {question.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {question.blooms_level}
                      </Badge>
                    </div>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {question.question_text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedId === question.question_id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {/* Options for MCQ */}
                  {question.options && question.options.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Options:</p>
                      <div className="grid gap-1">
                        {question.options.map((opt, i) => (
                          <div 
                            key={i}
                            className={cn(
                              "text-sm p-2 rounded border",
                              opt === question.correct_answer && "border-green-500 bg-green-50 dark:bg-green-950"
                            )}
                          >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              className="inline"
                            >
                              {opt}
                            </ReactMarkdown>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Correct Answer */}
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Answer: </span>
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        className="inline"
                      >
                        {question.correct_answer}
                      </ReactMarkdown>
                    </div>
                  </div>
                  
                  {/* Explanation */}
                  <div className="flex items-start gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="font-medium">Explanation: </span>
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        className="inline prose prose-sm dark:prose-invert"
                      >
                        {question.explanation}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Source Citations */}
                  {question.source_citations && question.source_citations.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Sources:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {question.source_citations.map((source, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {source.material_title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit Input */}
                  {editingId === question.question_id && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="Describe what to change..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEdit(question.question_id)
                        }}
                      />
                      <Button size="sm" onClick={() => handleEdit(question.question_id)}>
                        Apply
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Actions */}
                  {showActions && !editingId && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(question.question_id)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => onApprove?.(question.question_id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onReject?.(question.question_id)}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

