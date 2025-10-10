import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Mail, User, Calendar, Clock, CheckCircle, XCircle, Ban, MessageSquare } from 'lucide-react'

interface Invitation {
  id: string
  invitee_email: string
  invitee_name?: string
  role: 'student' | 'parent'
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  token: string
  message?: string
  student_ids: string[]
  created_at: string
  expires_at: string
  accepted_at?: string
}

interface InvitationDetailsModalProps {
  invitation: Invitation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InvitationDetailsModal({ invitation, open, onOpenChange }: InvitationDetailsModalProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'expired':
        return <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      case 'revoked':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><Ban className="w-3 h-3 mr-1" />Revoked</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Mail className="w-5 h-5 text-blue-600" />
            Invitation Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
            {getStatusBadge(invitation.status)}
          </div>

          {/* Name */}
          {invitation.invitee_name && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <User className="w-4 h-4" />
                Name
              </div>
              <p className="text-slate-900 dark:text-white pl-6">{invitation.invitee_name}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4" />
              Email
            </div>
            <p className="text-slate-900 dark:text-white pl-6">{invitation.invitee_email}</p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4" />
              Role
            </div>
            <p className="text-slate-900 dark:text-white pl-6 capitalize">{invitation.role}</p>
          </div>

          {/* Message */}
          {invitation.message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <MessageSquare className="w-4 h-4" />
                Custom Message
              </div>
              <p className="text-slate-900 dark:text-white pl-6 italic">"{invitation.message}"</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4" />
                Created
              </div>
              <p className="text-slate-900 dark:text-white text-sm pl-6">
                {format(new Date(invitation.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Clock className="w-4 h-4" />
                Expires
              </div>
              <p className="text-slate-900 dark:text-white text-sm pl-6">
                {format(new Date(invitation.expires_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Accepted Date */}
          {invitation.accepted_at && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle className="w-4 h-4" />
                Accepted
              </div>
              <p className="text-slate-900 dark:text-white text-sm pl-6">
                {format(new Date(invitation.accepted_at), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Invitation Link */}
          {invitation.status === 'pending' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4" />
                Invitation Link
              </div>
              <div className="pl-6">
                <code className="text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block break-all text-slate-900 dark:text-white">
                  {window.location.origin}/accept-invitation/{invitation.token}
                </code>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

