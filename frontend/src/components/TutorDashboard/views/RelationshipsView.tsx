import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/contexts/ToastContext'
import {
  Search,
  Loader2,
  Link as LinkIcon,
  ChevronRight,
  Check,
  X,
  Phone,
  Mail as MailIcon
} from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import { formatDistanceToNow } from 'date-fns'
import { LinkParentModal } from '@/components/modals/LinkParentModal'

interface Student {
  id: string
  clerk_id: string
  name: string
  email: string
  avatar?: string
}

interface Parent {
  id: string
  clerk_id: string
  name: string
  email: string
  relationship?: string
  student_ids: string[]
  permissions?: {
    viewGrades: boolean
    seeAssignmentFeedback: boolean
    accessProgressReports: boolean
  }
  avatar?: string
}

interface CommunicationLog {
  id: string
  type: 'email' | 'phone' | 'message'
  title: string
  with: string
  date: string
  content: string
}

export default function RelationshipsView() {
  const { getToken } = useAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [parents, setParents] = useState<Parent[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [communications, setCommunications] = useState<CommunicationLog[]>([])
  const [showLinkParentModal, setShowLinkParentModal] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const NORMALIZED = RAW_BASE.replace(/\/+$/, '')
      const API_BASE = NORMALIZED.match(/\/api\/v\d+$/) ? NORMALIZED : `${NORMALIZED}/api/v1`

      // Load students
      const studentsResponse = await fetch(`${API_BASE}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!studentsResponse.ok) throw new Error('Failed to load students')
      const studentsData = await studentsResponse.json()
      setStudents(studentsData.items || studentsData.students || [])

      // Load parents
      const parentsResponse = await fetch(`${API_BASE}/parents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!parentsResponse.ok) throw new Error('Failed to load parents')
      const parentsData = await parentsResponse.json()
      setParents(parentsData.parents || [])

      // Select first student by default
      if (studentsData.students && studentsData.students.length > 0 && !selectedStudent) {
        setSelectedStudent(studentsData.students[0])
      }
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

  useEffect(() => {
    // Load communication logs when student is selected
    if (selectedStudent) {
      loadCommunications(selectedStudent.clerk_id)
    }
  }, [selectedStudent])

  const loadCommunications = async (studentId: string) => {
    // Mock communication data for now
    setCommunications([
      {
        id: '1',
        type: 'email',
        title: 'Progress Update for Q2',
        with: 'Sarah Johnson',
        date: new Date('2024-07-20').toISOString(),
        content: 'Alice has shown great improvement in Algebra. Her last test score was an A...'
      },
      {
        id: '2',
        type: 'phone',
        title: 'Phone Call regarding Assignment',
        with: 'Michael Johnson',
        date: new Date('2024-04-18').toISOString(),
        content: 'Discussed the upcoming science fair project requirements and deadlines.'
      }
    ])
  }

  const handleUnlinkParent = async (parentId: string) => {
    if (!selectedStudent) return
    if (!confirm('Are you sure you want to unlink this parent?')) return

    try {
      const token = await getToken()
      const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'
      const NORMALIZED = RAW_BASE.replace(/\/+$/, '')
      const API_BASE = NORMALIZED.match(/\/api\/v\d+$/) ? NORMALIZED : `${NORMALIZED}/api/v1`

      const response = await fetch(`${API_BASE}/parents/${parentId}/students/${selectedStudent.clerk_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Failed to unlink parent')

      toast.success('Parent unlinked successfully')
      loadData()
    } catch (error) {
      console.error('Failed to unlink parent:', error)
      toast.error('Failed to unlink parent')
    }
  }

  const handleLinkNewParent = () => {
    setShowLinkParentModal(true)
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get parents linked to selected student
  const getLinkedParents = () => {
    if (!selectedStudent) return []
    return parents.filter(parent =>
      parent.student_ids?.includes(selectedStudent.clerk_id)
    )
  }

  // Get parent count for a student
  const getParentCount = (student: Student) => {
    return parents.filter(parent =>
      parent.student_ids?.includes(student.clerk_id)
    ).length
  }

  // Filter students by search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Panel - Student List */}
      <div className="w-80 flex flex-col bg-card rounded-lg border border-border shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground mb-1">
            Parent-Student Relationships
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage parent access for your students.
          </p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for a student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border h-10"
              />
            </div>
            <Button
              onClick={handleLinkNewParent}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-muted-foreground text-sm">No students found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredStudents.map((student) => {
                const parentCount = getParentCount(student)
                const isSelected = selectedStudent?.clerk_id === student.clerk_id

                return (
                  <button
                    key={student.clerk_id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {parentCount === 0
                          ? 'No Parents Linked'
                          : `${parentCount} Parent${parentCount !== 1 ? 's' : ''} Linked`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Student Details */}
      <div className="flex-1 flex flex-col bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        {!selectedStudent ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a student to view details</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Student Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {getInitials(selectedStudent.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Managing Parent Links for</p>
                  <h2 className="text-xl font-bold text-foreground">{selectedStudent.name}</h2>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Linked Parents Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Linked Parents</h3>
                  <Button
                    onClick={handleLinkNewParent}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link New Parent
                  </Button>
                </div>

                {getLinkedParents().length === 0 ? (
                  <Card className="border-border bg-muted/30">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No parents linked to this student</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {getLinkedParents().map((parent) => (
                      <Card key={parent.clerk_id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {getInitials(parent.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium text-foreground">{parent.name}</p>
                                  <p className="text-sm text-muted-foreground">{parent.relationship || 'Parent'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    onClick={() => handleUnlinkParent(parent.clerk_id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Permissions */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary" />
                                  <span className="text-foreground">View Grades</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary" />
                                  <span className="text-foreground">See Assignment Feedback</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Check className="h-4 w-4 text-primary" />
                                  <span className="text-foreground">Access Progress Reports</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Communication Log */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Communication Log</h3>
                {communications.length === 0 ? (
                  <Card className="border-border bg-muted/30">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No communication history</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {communications.map((comm) => (
                      <Card key={comm.id} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {comm.type === 'email' ? (
                                <MailIcon className="h-5 w-5 text-primary" />
                              ) : (
                                <Phone className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground mb-1">{comm.title}</h4>
                              <p className="text-xs text-muted-foreground mb-2">
                                With {comm.with} • {formatDistanceToNow(new Date(comm.date), { addSuffix: true })}
                              </p>
                              <p className="text-sm text-foreground line-clamp-2">{comm.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Link Parent Modal */}
      <LinkParentModal
        open={showLinkParentModal}
        onOpenChange={setShowLinkParentModal}
        students={students.map(s => ({ _id: s.id, name: s.name }))}
        onParentLinked={() => {
          toast.success('Parent invitation sent successfully')
          loadData()
        }}
      />
    </div>
  )
}

