/**
 * Reusable card skeleton loader component
 */
import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CardSkeletonProps {
  /**
   * Number of skeleton cards to render
   */
  count?: number
  
  /**
   * Whether to show header skeleton
   */
  showHeader?: boolean
  
  /**
   * Number of content lines to show
   */
  contentLines?: number
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Single card skeleton
 */
export function CardSkeleton({ 
  showHeader = true, 
  contentLines = 3,
  className = ''
}: Omit<CardSkeletonProps, 'count'>) {
  return (
    <Card className={`animate-pulse ${className}`}>
      {showHeader && (
        <CardHeader>
          <div className="h-6 w-3/4 bg-gray-700 rounded"></div>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: contentLines }).map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-gray-700 rounded"
            style={{ width: `${100 - (i * 10)}%` }}
          ></div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Multiple card skeletons
 */
export function CardSkeletonGroup({ 
  count = 3, 
  showHeader = true, 
  contentLines = 3,
  className = ''
}: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton 
          key={i} 
          showHeader={showHeader} 
          contentLines={contentLines}
          className={className}
        />
      ))}
    </>
  )
}

/**
 * Stats card skeleton (for dashboard stats)
 */
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6 space-y-2">
            <div className="h-4 w-24 bg-gray-700 rounded"></div>
            <div className="h-8 w-16 bg-gray-700 rounded"></div>
            <div className="h-3 w-32 bg-gray-700 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

/**
 * Profile card skeleton (for student/user profiles)
 */
export function ProfileCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar skeleton */}
          <div className="h-16 w-16 bg-gray-700 rounded-full"></div>
          
          {/* Info skeleton */}
          <div className="flex-1 space-y-3">
            <div className="h-6 w-48 bg-gray-700 rounded"></div>
            <div className="h-4 w-64 bg-gray-700 rounded"></div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

