/**
 * ConfigSidebar - Compact configuration panel for question generation
 * Inspired by Open Canvas's assistant sidebar
 */
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Settings2,
  ChevronDown,
  Paperclip,
  ArrowUp,
  Square,
  BookOpen,
  Target,
  Brain,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Material {
  _id: string
  title: string
  material_type: string
}

interface ConfigSidebarProps {
  // Form state
  prompt: string
  onPromptChange: (value: string) => void
  questionCount: number
  onQuestionCountChange: (value: number) => void
  questionType: string
  onQuestionTypeChange: (value: string) => void
  difficulty: string
  onDifficultyChange: (value: string) => void
  aiProvider: string
  onAiProviderChange: (value: string) => void
  bloomsLevels: string[]
  onBloomsLevelsChange: (value: string[]) => void
  
  // Materials
  selectedMaterials: Material[]
  onMaterialsClick: () => void
  
  // Actions
  isGenerating: boolean
  onGenerate: () => void
  onStop: () => void
}

const questionTypes = [
  { value: 'multiple-choice', label: 'Multiple Choice' },
  { value: 'true-false', label: 'True/False' },
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'essay', label: 'Essay' },
]

const difficulties = [
  { value: 'beginner', label: 'Easy', dotColor: 'bg-green-500' },
  { value: 'intermediate', label: 'Medium', dotColor: 'bg-yellow-500' },
  { value: 'advanced', label: 'Hard', dotColor: 'bg-red-500' },
]

const aiProviders = [
  { value: 'groq', label: 'Groq' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'google', label: 'Google' },
]

const bloomsOptions = [
  { value: 'REMEMBER', label: 'Remember', icon: '📚' },
  { value: 'UNDERSTAND', label: 'Understand', icon: '💡' },
  { value: 'APPLY', label: 'Apply', icon: '🔧' },
  { value: 'ANALYZE', label: 'Analyze', icon: '🔍' },
  { value: 'EVALUATE', label: 'Evaluate', icon: '⚖️' },
  { value: 'CREATE', label: 'Create', icon: '✨' },
]

export function ConfigSidebar({
  prompt,
  onPromptChange,
  questionCount,
  onQuestionCountChange,
  questionType,
  onQuestionTypeChange,
  difficulty,
  onDifficultyChange,
  aiProvider,
  onAiProviderChange,
  bloomsLevels,
  onBloomsLevelsChange,
  selectedMaterials,
  onMaterialsClick,
  isGenerating,
  onGenerate,
  onStop,
}: ConfigSidebarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '60px'
    const newHeight = Math.min(Math.max(60, textarea.scrollHeight), 200)
    textarea.style.height = `${newHeight}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [prompt, adjustHeight])

  const toggleBloomsLevel = (level: string) => {
    if (bloomsLevels.includes(level)) {
      onBloomsLevelsChange(bloomsLevels.filter(l => l !== level))
    } else {
      onBloomsLevelsChange([...bloomsLevels, level])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
      e.preventDefault()
      onGenerate()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Prompt Input */}
          <div className="relative rounded-xl border border-border bg-background/50 focus-within:border-primary/50 transition-colors">
            {/* Selected Materials */}
            {selectedMaterials.length > 0 && (
              <div className="flex flex-wrap gap-1 p-3 pb-0">
                {selectedMaterials.slice(0, 3).map(m => (
                  <Badge key={m._id} variant="secondary" className="text-xs">
                    {m.title.slice(0, 20)}...
                  </Badge>
                ))}
                {selectedMaterials.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedMaterials.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what questions you want to generate..."
              className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-3 text-sm"
            />

            {/* Bottom Actions */}
            <div className="flex items-center justify-between p-3 pt-0 border-t border-border/50 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-muted-foreground hover:text-foreground"
                onClick={onMaterialsClick}
              >
                <Paperclip className="h-4 w-4 mr-1.5" />
                {selectedMaterials.length > 0 ? `${selectedMaterials.length} files` : 'Attach'}
              </Button>

              <Button
                size="sm"
                className={cn(
                  'h-8 px-4',
                  isGenerating
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-primary hover:bg-primary/90'
                )}
                onClick={isGenerating ? onStop : onGenerate}
                disabled={!prompt.trim() && selectedMaterials.length === 0}
              >
                {isGenerating ? (
                  <>
                    <Square className="h-3 w-3 mr-1.5 fill-current" />
                    Stop
                  </>
                ) : (
                  <>
                    <ArrowUp className="h-4 w-4 mr-1.5" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-2 gap-3">
            {/* Question Count */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                Count: {questionCount}
              </label>
              <Slider
                value={[questionCount]}
                onValueChange={([v]) => onQuestionCountChange(v)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Difficulty
              </label>
              <Select value={difficulty} onValueChange={onDifficultyChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${d.dotColor}`} />
                        {d.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Question Type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Type
              </label>
              <Select value={questionType} onValueChange={onQuestionTypeChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Provider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Model
              </label>
              <Select value={aiProvider} onValueChange={onAiProviderChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-8 px-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings2 className="h-3 w-3" />
                  Advanced Settings
                </span>
                <ChevronDown className={cn('h-4 w-4 transition-transform', isAdvancedOpen && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Bloom's Taxonomy Levels
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {bloomsOptions.map(b => (
                    <Badge
                      key={b.value}
                      variant={bloomsLevels.includes(b.value) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer text-xs transition-colors',
                        bloomsLevels.includes(b.value) && 'bg-primary'
                      )}
                      onClick={() => toggleBloomsLevel(b.value)}
                    >
                      {b.icon} {b.label}
                    </Badge>
                  ))}
                </div>
                {bloomsLevels.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No levels selected = Auto-select based on difficulty
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  )
}

export default ConfigSidebar

