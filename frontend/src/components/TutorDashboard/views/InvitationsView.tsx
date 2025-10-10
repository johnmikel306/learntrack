import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import InviteUserModal from '@/components/InviteUserModal'
import InvitationsList from '@/components/InvitationsList'

export default function InvitationsView() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInviteSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Invitations
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Invite students and parents to join your account
          </p>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Invitations List */}
      <InvitationsList
        refreshTrigger={refreshTrigger}
        onInviteClick={() => setShowInviteModal(true)}
      />

      {/* Invite Modal */}
      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={handleInviteSuccess}
      />
    </div>
  )
}

