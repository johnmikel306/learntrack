import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  Trash2,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface Student {
  id: string
  clerk_id: string
  name: string
  email: string
}

interface Parent {
  id: string
  clerk_id: string
  name: string
  email: string
  student_ids: string[]
}

interface ParentStudentRelation {
  parent: Parent
  students: Student[]
}

export default function RelationshipsView() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [relations, setRelations] = useState<ParentStudentRelation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      // Load students
      const studentsResponse = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!studentsResponse.ok) throw new Error('Failed to load students')
      const studentsData = await studentsResponse.json()
      setStudents(studentsData.students || [])

      // Load parents
      const parentsResponse = await fetch(`${API_BASE}/parents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!parentsResponse.ok) throw new Error('Failed to load parents')
      const parentsData = await parentsResponse.json()
      setParents(parentsData.parents || [])

      // Build relations
      const relationsData = (parentsData.parents || []).map((parent: Parent) => ({
        parent,
        students: (studentsData.students || []).filter((student: Student) =>
          parent.student_ids?.includes(student.clerk_id)
        )
      }))
      setRelations(relationsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load relationships')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleLinkStudents = (parent: Parent) => {
    setSelectedParent(parent)
    setSelectedStudentIds(parent.student_ids || [])
    setShowLinkModal(true)
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSaveLinks = async () => {
    if (!selectedParent) return

    try {
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${API_BASE}/parents/${selectedParent.clerk_id}/students`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ student_ids: selectedStudentIds })
      })

      if (!response.ok) throw new Error('Failed to update relationships')

      toast.success('Relationships updated successfully')
      setShowLinkModal(false)
      loadData()
    } catch (error) {
      console.error('Failed to update relationships:', error)
      toast.error('Failed to update relationships')
    }
  }

  const handleUnlinkStudent = async (parentId: string, studentId: string) => {
    try {
      const token = await getToken()
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

      const response = await fetch(`${API_BASE}/parents/${parentId}/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to unlink student')

      toast.success('Student unlinked successfully')
      loadData()
    } catch (error) {
      console.error('Failed to unlink student:', error)
      toast.error('Failed to unlink student')
    }
  }

  const filteredRelations = relations.filter(relation =>
    relation.parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    relation.students.some(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Parent-Student Relationships
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage connections between parents and students
          </p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          className="border-slate-300 dark:border-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Parents</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{parents.length}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Links</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {relations.reduce((acc, r) => acc + r.students.length, 0)}
                </p>
              </div>
              <LinkIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search parents or students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Relationships List */}
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Relationships
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            View and manage parent-student connections
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredRelations.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">No relationships found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRelations.map((relation) => (
                <div
                  key={relation.parent.clerk_id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {relation.parent.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {relation.parent.email}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleLinkStudents(relation.parent)}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-slate-700"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Manage Links
                    </Button>
                  </div>

                  {relation.students.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                        Linked Students:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {relation.students.map((student) => (
                          <Badge
                            key={student.clerk_id}
                            variant="outline"
                            className="border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300 flex items-center gap-2"
                          >
                            {student.name}
                            <button
                              onClick={() => handleUnlinkStudent(relation.parent.clerk_id, student.clerk_id)}
                              className="hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-500 italic">
                      No students linked
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Students Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <LinkIcon className="w-5 h-5 text-purple-600" />
              Link Students to {selectedParent?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Select which students should be linked to this parent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {students.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No students available
              </p>
            ) : (
              <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-3 max-h-[300px] overflow-y-auto space-y-2">
                {students.map((student) => (
                  <div key={student.clerk_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`student-${student.clerk_id}`}
                      checked={selectedStudentIds.includes(student.clerk_id)}
                      onCheckedChange={() => toggleStudent(student.clerk_id)}
                      className="border-slate-300 dark:border-slate-700"
                    />
                    <label
                      htmlFor={`student-${student.clerk_id}`}
                      className="text-sm text-slate-900 dark:text-white cursor-pointer flex-1"
                    >
                      {student.name} ({student.email})
                    </label>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLinkModal(false)}
                className="border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveLinks}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Save Links
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

