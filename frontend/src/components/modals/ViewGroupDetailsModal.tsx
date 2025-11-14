import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Calendar, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Student {
  _id: string
  name: string
  email: string
}

interface Group {
  _id: string
  name: string
  description?: string
  student_ids: Student[]
  created_at: string
  updated_at: string
}

interface ViewGroupDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
}

export function ViewGroupDetailsModal({
  open,
  onOpenChange,
  group
}: ViewGroupDetailsModalProps) {
  if (!group) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {group.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Info */}
          <div className="space-y-3">
            {group.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-foreground">{group.description}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  Created {formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{group.student_ids?.length || 0} students</span>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Students</h3>
              <Badge variant="secondary">
                {group.student_ids?.length || 0} members
              </Badge>
            </div>

            {group.student_ids && group.student_ids.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {group.student_ids.map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    </div>
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No students in this group yet</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

