/**
 * Thinking Display Component
 * 
 * Shows the agent's thinking process and generation progress.
 * Minimal display as per user preference.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Brain, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface ThinkingDisplayProps {
  steps: string[]
  isGenerating: boolean
  progress: { current: number; total: number }
  currentContent: string
}

export function ThinkingDisplay({ 
  steps, 
  isGenerating, 
  progress, 
  currentContent 
}: ThinkingDisplayProps) {
  const progressPercent = progress.total > 0 
    ? (progress.current / progress.total) * 100 
    : 0
  
  // Get the last few steps for minimal display
  const recentSteps = steps.slice(-3)
  
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Complete
              </>
            )}
          </CardTitle>
          <Badge variant="secondary">
            {progress.current}/{progress.total} questions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <Progress value={progressPercent} className="h-2" />
        
        {/* Minimal Thinking Steps */}
        <div className="space-y-1">
          {recentSteps.map((step, i) => (
            <div 
              key={i}
              className={cn(
                "text-xs text-muted-foreground flex items-center gap-2",
                i === recentSteps.length - 1 && isGenerating && "text-foreground font-medium"
              )}
            >
              <Brain className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{step}</span>
            </div>
          ))}
        </div>
        
        {/* Current Content Stream */}
        {currentContent && (
          <div className="mt-3 p-3 bg-background rounded-md border">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {currentContent}
              </ReactMarkdown>
              {isGenerating && (
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

