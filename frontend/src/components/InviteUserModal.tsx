import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { UserPlus, Mail, MessageSquare, Loader2, Users } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'

interface Student {
  id: string
  clerk_id: string
  name: string
  email: string
}

interface Invitation {
  id: string
  invitee_email: string
  invitee_name?: string
  role: 'student' | 'parent'
  message?: string
  student_ids: string[]
}

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  editMode?: boolean
  invitation?: Invitation
}

export default function InviteUserModal({ open, onOpenChange, onSuccess, editMode = false, invitation }: InviteUserModalProps) {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [formData, setFormData] = useState({
    invitee_email: '',
    invitee_name: '',
    role: 'student',
    message: '',
    student_ids: [] as string[]
  })

  // Load students when modal opens and role is parent
  useEffect(() => {
    if (open && formData.role === 'parent') {
      loadStudents()
    }
  }, [open, formData.role])

  // Populate form when editing
  useEffect(() => {
    if (editMode && invitation) {
      setFormData({
        invitee_email: invitation.invitee_email,
        invitee_name: invitation.invitee_name || '',
        role: invitation.role,
        message: invitation.message || '',
        student_ids: invitation.student_ids || []
      })
    } else if (!open) {
      // Reset form when modal closes
      setFormData({
        invitee_email: '',
        invitee_name: '',
        role: 'student',
        message: '',
        student_ids: []
      })
    }
  }, [editMode, invitation, open])

  const loadStudents = async () => {
    try {
      setLoadingStudents(true)
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${API_BASE}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load students')

      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      if (editMode && invitation) {
        // Update invitation (re-send with new details)
        const response = await fetch(`${API_BASE}/invitations/${invitation.id}/resend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || 'Failed to update invitation')
        }

        toast.success('Invitation updated!', {
          description: `The invitation has been updated`
        })
      } else {
        // Create new invitation
        const response = await fetch(`${API_BASE}/invitations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || 'Failed to send invitation')
        }

        toast.success('Invitation sent!', {
          description: `An invitation has been sent to ${formData.invitee_email}`
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      console.error('Failed to send invitation:', error)
      toast.error(editMode ? 'Failed to update invitation' : 'Failed to send invitation', {
        description: error.message || 'Please try again later'
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleStudent = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      student_ids: prev.student_ids.includes(studentId)
        ? prev.student_ids.filter(id => id !== studentId)
        : [...prev.student_ids, studentId]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <UserPlus className="w-5 h-5 text-blue-600" />
            {editMode ? 'Edit Invitation' : 'Invite User'}
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            {editMode ? 'Update invitation details' : 'Send an invitation to a student or parent to join your account'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-900 dark:text-white">
              Role *
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value, student_ids: [] })}
              disabled={editMode}
            >
              <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800">
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-900 dark:text-white">
              Email Address *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.invitee_email}
                onChange={(e) => setFormData({ ...formData, invitee_email: e.target.value })}
                className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-900 dark:text-white">
              Name (Optional)
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={formData.invitee_name}
              onChange={(e) => setFormData({ ...formData, invitee_name: e.target.value })}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Student Selection for Parents */}
          {formData.role === 'parent' && (
            <div className="space-y-2">
              <Label className="text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4" />
                Link to Students (Optional)
              </Label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Select which students this parent should be linked to
              </p>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                  No students found. Add students first before inviting parents.
                </p>
              ) : (
                <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={formData.student_ids.includes(student.id)}
                        onCheckedChange={() => toggleStudent(student.id)}
                        className="border-slate-300 dark:border-slate-700"
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="text-sm text-slate-900 dark:text-white cursor-pointer flex-1"
                      >
                        {student.name} ({student.email})
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Custom Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.invitee_email}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editMode ? 'Updating...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  {editMode ? 'Update Invitation' : 'Send Invitation'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

