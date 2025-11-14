/**
 * Reusable list skeleton loader component
 */
import React from 'react'

interface ListSkeletonProps {
  /**
   * Number of list items
   */
  count?: number
  
  /**
   * Whether to show avatar
   */
  showAvatar?: boolean
  
  /**
   * Number of text lines per item
   */
  lines?: number
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * List item skeleton
 */
export function ListItemSkeleton({ 
  showAvatar = true, 
  lines = 2 
}: Omit<ListSkeletonProps, 'count' | 'className'>) {
  return (
    <div className="flex items-start gap-3 p-4 border-b last:border-b-0 animate-pulse">
      {showAvatar && (
        <div className="h-10 w-10 bg-gray-700 rounded-full flex-shrink-0"></div>
      )}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-gray-700 rounded"
            style={{ width: i === 0 ? '80%' : '60%' }}
          ></div>
        ))}
      </div>
    </div>
  )
}

/**
 * List skeleton
 */
export function ListSkeleton({ 
  count = 5, 
  showAvatar = true, 
  lines = 2,
  className = ''
}: ListSkeletonProps) {
  return (
    <div className={`rounded-md border ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} showAvatar={showAvatar} lines={lines} />
      ))}
    </div>
  )
}

/**
 * Notification list skeleton
 */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-gray-800 animate-pulse">
          <div className="h-10 w-10 bg-gray-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-gray-700 rounded"></div>
            <div className="h-4 w-full bg-gray-700 rounded"></div>
            <div className="h-3 w-24 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Activity list skeleton
 */
export function ActivityListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 animate-pulse">
          <div className="h-8 w-8 bg-gray-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-gray-700 rounded"></div>
            <div className="h-3 w-32 bg-gray-700 rounded"></div>
          </div>
          <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
        </div>
      ))}
    </div>
  )
}

/**
 * Assignment list skeleton
 */
export function AssignmentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border border-gray-700 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="h-5 w-48 bg-gray-700 rounded"></div>
            <div className="h-6 w-20 bg-gray-700 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-700 rounded"></div>
            <div className="h-4 w-40 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Message list skeleton
 */
export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3 hover:bg-gray-800 rounded-lg animate-pulse">
          <div className="h-10 w-10 bg-gray-700 rounded-full flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-700 rounded"></div>
              <div className="h-3 w-16 bg-gray-700 rounded"></div>
            </div>
            <div className="h-4 w-full bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

