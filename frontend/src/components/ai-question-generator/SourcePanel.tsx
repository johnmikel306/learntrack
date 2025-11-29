/**
 * Source Panel Component
 * 
 * Displays source materials used for question generation.
 * Shows transparency about where questions come from.
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, BookOpen, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Source {
  id: string
  title: string
  excerpt: string
}

interface SourcePanelProps {
  sources: Source[]
}

export function SourcePanel({ sources }: SourcePanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Source Materials
          {sources.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {sources.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No sources retrieved yet</p>
            <p className="text-xs mt-1">
              Sources will appear here as the agent retrieves relevant materials
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-2">
              {sources.map((source, index) => (
                <div 
                  key={source.id}
                  className={cn(
                    "p-3 rounded-lg border bg-muted/30",
                    "hover:bg-muted/50 transition-colors"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {source.title}
                      </p>
                      {source.excerpt && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                          "{source.excerpt}"
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

