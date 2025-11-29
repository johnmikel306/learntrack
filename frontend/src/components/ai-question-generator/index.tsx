/**
 * AI Question Generator with LangGraph Streaming
 * 
 * Main component that orchestrates the question generation flow:
 * 1. User enters prompt and configuration
 * 2. Streams generation with thinking steps
 * 3. Displays questions with source citations
 * 4. Allows editing/reprompting
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FileText, History, Settings } from 'lucide-react'

import { GeneratorInput } from './GeneratorInput'
import { ThinkingDisplay } from './ThinkingDisplay'
import { QuestionDisplay } from './QuestionDisplay'
import { SourcePanel } from './SourcePanel'
import { useQuestionGenerator, GenerationConfig } from '@/hooks/useQuestionGenerator'

export function AIQuestionGenerator() {
  const [activeTab, setActiveTab] = useState('generate')
  const generator = useQuestionGenerator()
  
  const handleGenerate = async (config: GenerationConfig) => {
    await generator.startGeneration(config)
  }
  
  return (
    <div className="flex flex-col h-full gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Review ({generator.questions.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="flex-1 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Main generation area */}
            <div className="lg:col-span-2 space-y-4">
              <GeneratorInput 
                onGenerate={handleGenerate}
                isGenerating={generator.isGenerating}
                onStop={generator.stopGeneration}
              />
              
              {/* Thinking/Progress Display */}
              {(generator.isGenerating || generator.thinkingSteps.length > 0) && (
                <ThinkingDisplay
                  steps={generator.thinkingSteps}
                  isGenerating={generator.isGenerating}
                  progress={generator.progress}
                  currentContent={generator.currentContent}
                />
              )}
              
              {/* Error Display */}
              {generator.error && (
                <Card className="border-destructive">
                  <CardContent className="pt-4">
                    <p className="text-destructive">{generator.error}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Generated Questions Preview */}
              {generator.questions.length > 0 && (
                <QuestionDisplay 
                  questions={generator.questions}
                  onEdit={(questionId, instruction) => {
                    // TODO: Implement edit
                    console.log('Edit:', questionId, instruction)
                  }}
                />
              )}
            </div>
            
            {/* Source Panel */}
            <div className="lg:col-span-1">
              <SourcePanel sources={generator.sources} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="review" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Generated Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {generator.questions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No questions generated yet. Start by entering a prompt.
                </p>
              ) : (
                <QuestionDisplay 
                  questions={generator.questions}
                  showActions
                  onEdit={(questionId, instruction) => {
                    console.log('Edit:', questionId, instruction)
                  }}
                  onApprove={(questionId) => {
                    console.log('Approve:', questionId)
                  }}
                  onReject={(questionId) => {
                    console.log('Reject:', questionId)
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Generation history will be available after implementing session persistence.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AIQuestionGenerator

