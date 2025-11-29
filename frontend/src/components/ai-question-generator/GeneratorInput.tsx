/**
 * Generator Input Component
 * 
 * Chat-style input with configuration options for question generation.
 */

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Wand2, Settings, StopCircle, Paperclip, Plus,
  FileText, BookOpen, Target
} from 'lucide-react'
import { GenerationConfig } from '@/hooks/useQuestionGenerator'
import { cn } from '@/lib/utils'

interface GeneratorInputProps {
  onGenerate: (config: GenerationConfig) => Promise<void>
  isGenerating: boolean
  onStop: () => void
}

const QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple Choice' },
  { value: 'TRUE_FALSE', label: 'True/False' },
  { value: 'SHORT_ANSWER', label: 'Short Answer' },
  { value: 'ESSAY', label: 'Essay' },
]

const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
  { value: 'MIXED', label: 'Mixed' },
]

export function GeneratorInput({ onGenerate, isGenerating, onStop }: GeneratorInputProps) {
  const [prompt, setPrompt] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['MCQ'])
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [showSettings, setShowSettings] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px'
    }
  }, [prompt])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return
    
    await onGenerate({
      prompt: prompt.trim(),
      question_count: questionCount,
      question_types: selectedTypes,
      difficulty,
    })
  }
  
  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          {/* Configuration Bar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {questionCount} questions
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {difficulty}
            </Badge>
            {selectedTypes.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace('_', '/')}
              </Badge>
            ))}
            
            <Popover open={showSettings} onOpenChange={setShowSettings}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Number of Questions: {questionCount}</Label>
                    <Slider
                      value={[questionCount]}
                      onValueChange={([v]) => setQuestionCount(v)}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map(d => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Question Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUESTION_TYPES.map(type => (
                        <label key={type.value} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={selectedTypes.includes(type.value)}
                            onCheckedChange={() => toggleType(type.value)}
                          />
                          {type.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Input Area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what questions you want to generate... e.g., 'Create 10 MCQs about photosynthesis for 10th grade biology'"
              className="min-h-[56px] max-h-[200px] pr-24 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {isGenerating ? (
                <Button type="button" size="sm" variant="destructive" onClick={onStop}>
                  <StopCircle className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              ) : (
                <Button type="submit" size="sm" disabled={!prompt.trim()}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

