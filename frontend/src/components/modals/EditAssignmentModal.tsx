import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Edit } from 'lucide-react'
import { toast } from '@/contexts/ToastContext'
import { useApiClient } from '@/lib/api-client'

interface Assignment {
  _id: string
  title: string
  description?: string
  due_date?: string
  duration_minutes?: number
  passing_score: number
  settings: {
    allow_retakes: boolean
    shuffle_questions: boolean
    show_correct_answers: boolean
  }
}

interface EditAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: Assignment | null
  onAssignmentUpdated?: () => void
}

export function EditAssignmentModal({
  open,
  onOpenChange,
  assignment,
  onAssignmentUpdated
}: EditAssignmentModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [duration, setDuration] = useState('')
  const [passingScore, setPassingScore] = useState('')
  const [allowRetakes, setAllowRetakes] = useState(false)
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const client = useApiClient()

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title)
      setDescription(assignment.description || '')
      setDueDate(assignment.due_date?.split('T')[0] || '') // Format for date input
      setDuration(assignment.duration_minutes?.toString() || '')
      setPassingScore(assignment.passing_score.toString())
      setAllowRetakes(assignment.settings?.allow_retakes || false)
      setShuffleQuestions(assignment.settings?.shuffle_questions || false)
    }
  }, [assignment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !assignment) return

    try {
      setLoading(true)

      const updateData = {
        title,
        description: description || undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        duration_minutes: duration ? parseInt(duration) : undefined,
        passing_score: parseInt(passingScore) || 70,
        settings: {
          allow_retakes: allowRetakes,
          shuffle_questions: shuffleQuestions,
          show_correct_answers: assignment.settings?.show_correct_answers ?? true
        }
      }

      const response = await client.put(`/assignments/${assignment._id}`, updateData)

      if (response.error) {
        throw new Error(response.error)
      }

      toast.success('Assignment updated successfully!', {
        description: `Changes to "${title}" have been saved.`
      })

      onOpenChange(false)
      onAssignmentUpdated?.()
    } catch (error: any) {
      console.error('Failed to update assignment:', error)
      toast.error('Failed to update assignment', {
        description: error.message || 'Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Assignment
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              placeholder="Assignment title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              placeholder="Assignment description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-due-date">Due Date *</Label>
              <Input
                id="edit-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration (minutes)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-passing-score">Passing Score (%) *</Label>
            <Input
              id="edit-passing-score"
              type="number"
              min="0"
              max="100"
              placeholder="70"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Settings</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-allow-retakes" className="font-normal">
                  Allow Retakes
                </Label>
                <Switch
                  id="edit-allow-retakes"
                  checked={allowRetakes}
                  onCheckedChange={setAllowRetakes}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-shuffle" className="font-normal">
                  Shuffle Questions
                </Label>
                <Switch
                  id="edit-shuffle"
                  checked={shuffleQuestions}
                  onCheckedChange={setShuffleQuestions}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


