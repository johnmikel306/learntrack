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
import { Edit } from 'lucide-react'

interface Group {
  _id: string
  name: string
  description?: string
}

interface EditGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onGroupUpdated?: () => void
}

export function EditGroupModal({
  open,
  onOpenChange,
  group,
  onGroupUpdated
}: EditGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description || '')
    }
  }, [group])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !group) return

    try {
      setLoading(true)
      // TODO: Implement API call to update group
      console.log('Updating group:', { id: group._id, name, description })
      
      onOpenChange(false)
      onGroupUpdated?.()
    } catch (error) {
      console.error('Failed to update group:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Group
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">Group Name *</Label>
            <Input
              id="edit-group-name"
              placeholder="e.g., Advanced Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-group-description">Description</Label>
            <Textarea
              id="edit-group-description"
              placeholder="Describe the purpose of this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
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
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

