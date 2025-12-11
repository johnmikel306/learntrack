/**
 * SessionDrawer - Collapsible drawer showing previous generation sessions
 * Styled like Open Canvas's artifact history panel
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  History,
  FileQuestion,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  MoreVertical,
  Trash2,
  Eye,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface SessionQuestion {
  question_id: string
  question_text: string
  type: string
  difficulty: string
  status: 'pending' | 'approved' | 'rejected'
}

interface Session {
  session_id: string
  prompt: string
  created_at: string
  status: 'completed' | 'failed' | 'in_progress'
  question_count: number
  approved_count: number
  pending_count: number
  rejected_count: number
  questions?: SessionQuestion[]
}

interface SessionDrawerProps {
  sessions: Session[]
  isLoading: boolean
  onRefresh: () => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession?: (sessionId: string) => Promise<void>
  selectedSessionId?: string | null
}

export function SessionDrawer({
  sessions,
  isLoading,
  onRefresh,
  onSelectSession,
  onDeleteSession,
  selectedSessionId,
}: SessionDrawerProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!sessionToDelete || !onDeleteSession) return

    setIsDeleting(true)
    try {
      await onDeleteSession(sessionToDelete)
      toast.success('Session deleted')
    } catch {
      toast.error('Failed to delete session')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            History
            {sessions.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {sessions.length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Generation History
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-3 space-y-1">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileQuestion className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No generation history yet
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {sessions.map((session, index) => (
                    <SessionCard
                      key={session.session_id}
                      session={session}
                      index={index}
                      isSelected={selectedSessionId === session.session_id}
                      onClick={() => onSelectSession(session.session_id)}
                      onDelete={(e) => handleDeleteClick(session.session_id, e)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Generation Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this generation session and all its questions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface SessionCardProps {
  session: Session
  index: number
  isSelected: boolean
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
}

function SessionCard({ session, index, isSelected, onClick, onDelete }: SessionCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const timeAgo = formatDistanceToNow(new Date(session.created_at), { addSuffix: true })

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(session.prompt || '')
    toast.success('Prompt copied to clipboard')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        onClick={onClick}
        className={cn(
          'group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer',
          'transition-all duration-150 ease-out',
          'hover:bg-accent/50',
          isSelected && 'bg-accent ring-1 ring-primary/20'
        )}
      >
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg',
          'bg-primary/10 text-primary',
          isSelected && 'bg-primary/20'
        )}>
          <FileQuestion className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {session.prompt || 'Untitled Generation'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {session.question_count} {session.question_count === 1 ? 'question' : 'questions'}
            </span>
            {session.pending_count > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-amber-500 font-medium">
                  {session.pending_count} pending
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status indicator */}
        {session.approved_count > 0 && session.approved_count === session.question_count && (
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        )}

        {/* Actions menu - appears on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              className="absolute right-2"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/80 backdrop-blur-sm shadow-sm"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={onClick}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyPrompt}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Prompt
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default SessionDrawer

