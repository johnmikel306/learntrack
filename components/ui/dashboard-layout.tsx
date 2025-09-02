"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  onBack?: () => void
  children: ReactNode
  headerActions?: ReactNode
  className?: string
}

export function DashboardLayout({
  title,
  subtitle,
  onBack,
  children,
  headerActions,
  className
}: DashboardLayoutProps) {
  return (
    <div className={cn("dashboard-container", className)}>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-title-section">
            {onBack && (
              <Button 
                variant="ghost" 
                onClick={onBack} 
                className="dashboard-back-button focus-ring"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="dashboard-title">{title}</h1>
              {subtitle && (
                <p className="dashboard-subtitle mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-4">
              {headerActions}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

interface StatsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function StatsGrid({ children, columns = 4, className }: StatsGridProps) {
  const gridClass = {
    2: "grid md:grid-cols-2 gap-6",
    3: "grid md:grid-cols-3 gap-6", 
    4: "grid md:grid-cols-4 gap-6",
    5: "grid md:grid-cols-5 gap-6"
  }[columns]

  return (
    <div className={cn(gridClass, "mb-8", className)}>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  loading?: boolean
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon, 
  loading,
  trend 
}: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="loading-text w-20 h-4"></div>
          <div className="loading-text w-4 h-4"></div>
        </div>
        <div className="loading-text w-16 h-8 mt-2"></div>
        <div className="loading-text w-24 h-3 mt-2"></div>
      </div>
    )
  }

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <h3 className="stat-card-title">{title}</h3>
        {icon && <div className="stat-card-icon">{icon}</div>}
      </div>
      <div className="stat-card-value">{value}</div>
      {description && (
        <p className="stat-card-description">{description}</p>
      )}
      {trend && (
        <div className={cn(
          "flex items-center text-xs mt-2",
          trend.positive ? "text-green-600" : "text-red-600"
        )}>
          <span className="font-medium">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          <span className="ml-1 text-gray-500">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

interface ContentGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3
  className?: string
}

export function ContentGrid({ children, columns = 2, className }: ContentGridProps) {
  const gridClass = {
    1: "grid gap-6",
    2: "grid lg:grid-cols-2 gap-6",
    3: "grid lg:grid-cols-3 gap-6"
  }[columns]

  return (
    <div className={cn(gridClass, className)}>
      {children}
    </div>
  )
}

interface DashboardCardProps {
  children: ReactNode
  className?: string
  interactive?: boolean
  onClick?: () => void
}

export function DashboardCard({ 
  children, 
  className, 
  interactive = false,
  onClick 
}: DashboardCardProps) {
  const cardClass = interactive ? "interactive-card" : "dashboard-card"
  
  return (
    <div 
      className={cn(cardClass, className)}
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  )
}

interface LoadingStateProps {
  type?: "card" | "list" | "grid"
  count?: number
}

export function LoadingState({ type = "card", count = 3 }: LoadingStateProps) {
  if (type === "card") {
    return (
      <div className="loading-card">
        <div className="loading-title w-32"></div>
        <div className="loading-text w-full mt-4"></div>
        <div className="loading-text w-3/4 mt-2"></div>
        <div className="loading-text w-1/2 mt-2"></div>
      </div>
    )
  }

  if (type === "grid") {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <LoadingState key={i} type="card" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="loading-card">
          <div className="loading-title w-48"></div>
          <div className="loading-text w-full mt-2"></div>
        </div>
      ))}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  action?: ReactNode
}

export function ErrorState({ 
  title = "Something went wrong", 
  message, 
  action 
}: ErrorStateProps) {
  return (
    <div className="error-container">
      <h3 className="error-title">{title}</h3>
      <p className="error-text">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && action}
    </div>
  )
}
