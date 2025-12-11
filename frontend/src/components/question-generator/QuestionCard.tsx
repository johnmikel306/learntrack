/**
 * QuestionCard - Interactive card for displaying and editing a single question
 * Features: inline editing, quick actions on hover, status indicators
 * Design: Dark themed card matching reference design
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Check,
  X,
  Edit3,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface QuestionData {
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

interface QuestionCardProps {
  question: QuestionData
  index: number
  isStreaming?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onEdit?: (id: string, data: Partial<QuestionData>) => void
  onRegenerate?: (id: string) => void
  onDelete?: (id: string) => void
}

const difficultyColors: Record<string, string> = {
  EASY: 'bg-green-600/80 text-white',
  MEDIUM: 'bg-amber-600/80 text-white',
  HARD: 'bg-red-600/80 text-white',
}

const typeLabels: Record<string, string> = {
  MCQ: 'Multiple Choice',
  TRUE_FALSE: 'True/False',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
}

export function QuestionCard({
  question,
  index,
  isStreaming,
  onApprove,
  onReject,
  onEdit,
  onRegenerate,
  onDelete,
}: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(question.question_text)
  const [editedOptions, setEditedOptions] = useState<string[]>(question.options || [])
  const [editedAnswer, setEditedAnswer] = useState(question.correct_answer)
  const [editedExplanation, setEditedExplanation] = useState(question.explanation || '')
  const [isHovered, setIsHovered] = useState(false)

  // Sync state when question prop changes
  useEffect(() => {
    setEditedText(question.question_text)
    setEditedOptions(question.options || [])
    setEditedAnswer(question.correct_answer)
    setEditedExplanation(question.explanation || '')
  }, [question])

  const handleSaveEdit = () => {
    onEdit?.(question.question_id, {
      question_text: editedText,
      options: editedOptions,
      correct_answer: editedAnswer,
      explanation: editedExplanation,
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedText(question.question_text)
    setEditedOptions(question.options || [])
    setEditedAnswer(question.correct_answer)
    setEditedExplanation(question.explanation || '')
    setIsEditing(false)
  }

  const handleOptionChange = (idx: number, value: string) => {
    const newOptions = [...editedOptions]
    newOptions[idx] = value
    setEditedOptions(newOptions)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'relative transition-all duration-200 bg-zinc-900/95 border-zinc-800',
          isHovered && 'shadow-lg ring-1 ring-zinc-700',
          isStreaming && 'animate-pulse'
        )}
      >
        {/* Quick Actions Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered && !isEditing ? 1 : 0 }}
          className="absolute top-2 right-2 z-10 flex gap-1"
        >
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-background/80 backdrop-blur"
            onClick={() => onApprove?.(question.question_id)}
          >
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-background/80 backdrop-blur"
            onClick={() => onReject?.(question.question_id)}
          >
            <X className="h-3.5 w-3.5 text-red-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-background/80 backdrop-blur"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-background/80 backdrop-blur"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRegenerate?.(question.question_id)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(question.question_text)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(question.question_id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-zinc-300">
              {index + 1}
            </span>
            <Badge className={cn('text-xs rounded-md px-2 py-0.5', difficultyColors[question.difficulty])}>
              {question.difficulty}
            </Badge>
            <Badge className="text-xs bg-emerald-600/80 text-white rounded-md px-2 py-0.5">
              {typeLabels[question.type] || question.type}
            </Badge>
            {question.blooms_level && (
              <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700">
                {question.blooms_level}
              </Badge>
            )}
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-zinc-200"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Question Text */}
          {isEditing ? (
            <div className="space-y-4">
              {/* Editable Question Text */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Question</label>
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[80px] resize-none bg-zinc-800 border-zinc-700 text-zinc-100"
                  autoFocus
                />
              </div>

              {/* Editable Options */}
              {editedOptions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400">Options</label>
                  {editedOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => handleOptionChange(i, e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                      />
                      {opt.charAt(0) === editedAnswer && (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Editable Correct Answer */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Correct Answer</label>
                <Input
                  value={editedAnswer}
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-green-400"
                />
              </div>

              {/* Editable Explanation */}
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Explanation</label>
                <Textarea
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  className="min-h-[60px] resize-none bg-zinc-800 border-zinc-700 text-zinc-300"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="border-zinc-700">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-200 leading-relaxed">{question.question_text}</p>
          )}

          {/* Options & Answer (Collapsible) */}
          {isExpanded && !isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {/* Options for MCQ */}
              {question.options && question.options.length > 0 && (
                <div className="space-y-1">
                  {question.options.map((option, i) => {
                    const optionLetter = option.charAt(0)
                    const answerLetter = question.correct_answer.charAt(0).toUpperCase()
                    const isCorrect = optionLetter.toUpperCase() === answerLetter
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-center gap-2 rounded px-3 py-2 text-sm',
                          isCorrect
                            ? 'bg-green-600/20 text-green-400'
                            : 'text-zinc-300 hover:bg-zinc-800/50'
                        )}
                      >
                        {isCorrect && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                        <span>{option}</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Correct Answer */}
              <div className="flex items-center gap-2 text-sm pt-2">
                <span className="text-zinc-500">Answer:</span>
                <span className="font-medium text-green-400">
                  {question.correct_answer}
                </span>
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="rounded bg-zinc-800/50 p-3 mt-2">
                  <p className="text-xs text-zinc-400 italic">{question.explanation}</p>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default QuestionCard

