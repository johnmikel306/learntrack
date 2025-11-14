import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { CreateGroupModal } from '@/components/modals/CreateGroupModal'
import { EditGroupModal } from '@/components/modals/EditGroupModal'
import { ViewGroupDetailsModal } from '@/components/modals/ViewGroupDetailsModal'
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal'

interface StudentGroup {
  _id: string
  name: string
  description: string
  studentIds: string[]
  subjects: string[]
  color: string
  averageScore?: number
}

export default function GroupsManagementView() {
  const { getToken } = useAuth()
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${API_BASE}/students/groups`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to load groups')

      const data = await response.json()
      setGroups(data || [])
    } catch (error) {
      console.error('Failed to load groups:', error)
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return

    try {
      setDeleting(true)
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${API_BASE}/students/groups/${selectedGroup._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete group')

      toast.success('Group deleted successfully')
      setShowDeleteModal(false)
      setSelectedGroup(null)
      loadGroups()
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast.error('Failed to delete group')
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteModal = (group: any) => {
    setSelectedGroup(group)
    setShowDeleteModal(true)
  }

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group)
    setShowEditModal(true)
  }

  const handleViewDetails = (group: any) => {
    setSelectedGroup(group)
    setShowViewModal(true)
  }

  // Filter groups by search term
  const filteredGroups = groups.filter(group => {
    const searchLower = searchTerm.toLowerCase()
    return group.name.toLowerCase().includes(searchLower)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          Manage Student Groups
        </h1>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Group
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Find a group by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-muted/50"
        />
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-0 shadow-sm bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                  <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">No groups found</p>
              <p className="text-sm mt-2">
                {searchTerm ? 'Try a different search term' : 'Create your first group to get started'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Card key={group._id} className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Group Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground truncate">
                        {group.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.studentIds.length} Student{group.studentIds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        onClick={() => handleEditGroup(group)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => openDeleteModal(group)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Average Score */}
                  {group.averageScore !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Avg. Score: <span className="font-semibold text-foreground">{group.averageScore}%</span>
                      </p>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button
                    onClick={() => handleViewDetails(group)}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onGroupCreated={() => {
          toast.success('Group created successfully')
          loadGroups()
        }}
      />

      <EditGroupModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        group={selectedGroup}
        onGroupUpdated={() => {
          toast.success('Group updated successfully')
          loadGroups()
        }}
      />

      <ViewGroupDetailsModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        group={selectedGroup}
      />

      <ConfirmDeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteGroup}
        title="Delete Group?"
        description="Are you sure you want to delete this group? This action cannot be undone."
        itemName={selectedGroup?.name}
        loading={deleting}
      />
    </div>
  )
}

