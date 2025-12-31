import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  MessageCircle,
  Edit,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Calendar,
  Link as LinkIcon,
  X,
  UserPlus,
  Mail,
  Loader2
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApiClient } from '@/lib/api-client'
import { toast } from '@/contexts/ToastContext'
import { format } from 'date-fns'
import { SendMessageModal } from '@/components/modals/SendMessageModal'

interface StudentDetails {
  id: string
  name: string
  email: string
  avatar?: string
  joinedDate: string
  studentId: string
  grade: string
  parentEmail?: string
  parentName?: string
  averageScore: number
  completionRate: number
  totalAssignments: number
  completedAssignments: number
}

interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
}

interface Group {
  id: string
  name: string
  color: string
}

interface Activity {
  id: string
  type: 'completed' | 'submitted'
  title: string
  timestamp: string
  score?: string
}

interface ProgressData {
  month: string
  score: number
}

interface LinkedParent {
  id: string
  name: string
  email: string
}

export default function StudentDetailsPage() {
  const { studentSlug } = useParams<{ studentSlug: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false)

  // Parent management state
  const [linkedParents, setLinkedParents] = useState<LinkedParent[]>([])
  const [linkParentModalOpen, setLinkParentModalOpen] = useState(false)
  const [parentEmail, setParentEmail] = useState('')
  const [parentName, setParentName] = useState('')
  const [availableParents, setAvailableParents] = useState<LinkedParent[]>([])
  const [loadingParents, setLoadingParents] = useState(false)
  const [parentSelection, setParentSelection] = useState('new')
  const [linkingParent, setLinkingParent] = useState(false)
  const [unlinkingParentId, setUnlinkingParentId] = useState<string | null>(null)

  const client = useApiClient()
  const queryClient = useQueryClient()

  const selectableParents = availableParents.filter(
    (parent) => !linkedParents.some((linked) => linked.id === parent.id)
  )

  const fetchStudentDetails = async () => {
    if (!studentSlug) return

    try {
      setLoading(true)

      // Fetch student details by slug
      const studentRes = await client.get(`/students/by-slug/${studentSlug}`)
      if (studentRes.error) throw new Error(studentRes.error)

      const userData = studentRes.data as any
      const studentClerkId = userData.clerk_id || userData._id

      setStudent({
        id: studentClerkId,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar_url,
        joinedDate: userData.created_at,
        studentId: userData._id?.slice(-6).toUpperCase() || 'ST84321',
        grade: userData.student_profile?.grade || '10th Grade',
        parentEmail: userData.student_profile?.parentEmail,
        parentName: userData.student_profile?.parentName || 'Sarah Reed',
        averageScore: userData.student_profile?.averageScore || 0,
        completionRate: userData.student_profile?.completionRate || 0,
        totalAssignments: userData.student_profile?.totalAssignments || 0,
        completedAssignments: userData.student_profile?.completedAssignments || 0
      })

      // Fetch progress data from API
      try {
        const progressRes = await client.get(`/progress/student/${studentClerkId}/analytics`)
        if (progressRes.data?.monthly_scores) {
          setProgressData(progressRes.data.monthly_scores)
        }
      } catch (err) {
        console.error('Failed to fetch progress data:', err)
        // Set empty array if API fails
        setProgressData([])
      }

      // Fetch assignments from API
      try {
        const assignmentsRes = await client.get(`/assignments/student/${studentClerkId}?status=pending`)
        if (assignmentsRes.data) {
          const mappedAssignments = assignmentsRes.data.map((a: any) => ({
            id: a._id,
            title: a.title,
            subject: a.subject_id?.name || 'Unknown',
            dueDate: a.due_date,
            status: a.status
          }))
          setAssignments(mappedAssignments)
        }
      } catch (err) {
        console.error('Failed to fetch assignments:', err)
        setAssignments([])
      }

      // Fetch groups from API
      try {
        const groupsRes = await client.get(`/groups/student/${studentClerkId}`)
        if (groupsRes.data) {
          const mappedGroups = groupsRes.data.map((g: any) => ({
            id: g._id,
            name: g.name,
            color: g.color || 'blue'
          }))
          setGroups(mappedGroups)
        }
      } catch (err) {
        console.error('Failed to fetch groups:', err)
        setGroups([])
      }

      // Fetch recent activity from API
      try {
        const activityRes = await client.get(`/activity/student/${studentClerkId}`)
        if (activityRes.data) {
          const mappedActivities = activityRes.data.map((a: any) => ({
            id: a._id,
            type: a.type,
            title: a.title,
            timestamp: a.timestamp,
            score: a.score
          }))
          setActivities(mappedActivities)
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err)
        setActivities([])
      }
      // Fetch linked parents for this student
      try {
        const parentsRes = await client.get(`/students/${studentClerkId}/parents`)
        if (parentsRes.data) {
          const mappedParents = parentsRes.data.map((p: any) => ({
            id: p.clerk_id || p._id,
            name: p.name,
            email: p.email
          }))
          setLinkedParents(mappedParents)
        }
      } catch (err) {
        console.error('Failed to fetch linked parents:', err)
        setLinkedParents([])
      }
    } catch (err: any) {
      console.error('Failed to fetch student details:', err)
      toast.error('Failed to load student details')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!parentEmail.trim() || !parentName.trim() || !student) return

    try {
      setLinkingParent(true)
      const res = await client.post(`/students/${student.id}/parents`, {
        parent_email: parentEmail.trim(),
        parent_name: parentName.trim()
      })

      if (res.error) throw new Error(res.error)

      toast.success('Parent linked successfully!', {
        description: `${parentName} has been linked to ${student.name}.`
      })

      // Refresh parents list
      const parentsRes = await client.get(`/students/${student.id}/parents`)
      if (parentsRes.data) {
        const mappedParents = parentsRes.data.map((p: any) => ({
          id: p.clerk_id || p._id,
          name: p.name,
          email: p.email
        }))
        setLinkedParents(mappedParents)
      }

      // Reset form and close modal
      setParentEmail('')
      setParentName('')
      setLinkParentModalOpen(false)
    } catch (error: any) {
      console.error('Failed to link parent:', error)
      toast.error('Failed to link parent', {
        description: error.message || 'Please try again or contact support.'
      })
    } finally {
      setLinkingParent(false)
    }
  }

  const handleUnlinkParent = async (parentId: string) => {
    if (!student) return

    try {
      setUnlinkingParentId(parentId)
      const res = await client.delete(`/students/${student.id}/parents/${parentId}`)

      if (res.error) throw new Error(res.error)

      toast.success('Parent unlinked successfully')
      setLinkedParents(prev => prev.filter(p => p.id !== parentId))
    } catch (error: any) {
      console.error('Failed to unlink parent:', error)
      toast.error('Failed to unlink parent', {
        description: error.message || 'Please try again.'
      })
    } finally {
      setUnlinkingParentId(null)
    }
  }

  useEffect(() => {
    if (studentSlug) {
      console.log('StudentDetailsPage loaded with studentSlug:', studentSlug)
      fetchStudentDetails()
    }
  }, [studentSlug])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSendMessage = () => {
    setSendMessageModalOpen(true)
  }

  const handleEditProfile = () => {
    toast.info('Edit profile feature coming soon')
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending')

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
          {loading ? (
            // Loading skeleton
            <div className="space-y-6">
              {/* Header skeleton */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-700 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Stats cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <div className="h-4 w-24 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Content cards skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-6 space-y-4">
                    <div className="h-6 w-32 bg-gray-700 rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !student ? (
            // Error state
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Student not found</h2>
                <Button onClick={() => navigate('/dashboard/students')}>Back to Students</Button>
              </div>
            </div>
          ) : (
            // Actual content
            <>
              {/* Header */}
              <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {student.avatar ? (
                    <AvatarImage src={student.avatar} alt={student.name} />
                  ) : (
                    <AvatarFallback className="bg-[#C8A882] text-white text-xl">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-white">{student.name}</h1>
                  <p className="text-gray-400 mt-1">
                    Joined: {format(new Date(student.joinedDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSendMessage}
                  className="border-[#C8A882] text-[#C8A882] hover:bg-[#C8A882] hover:text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  onClick={handleEditProfile}
                  className="bg-[#C8A882] text-white hover:bg-[#B89872]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Academic Progress & Recent Activity */}
            <div className="lg:col-span-2 space-y-6">
              {/* Academic Progress Summary */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Academic Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="month"
                        className="text-muted-foreground"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        className="text-muted-foreground"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        domain={[60, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#C8A882"
                        strokeWidth={2}
                        dot={{ fill: '#C8A882', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.length > 0 ? (
                      activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                          {activity.type === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-medium">
                              {activity.type === 'completed' ? 'Completed Assignment: ' : 'Submitted: '}
                              "{activity.title}"
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {format(new Date(activity.timestamp), 'PPp')}
                              {activity.score && ` · Score: ${activity.score}`}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Personal Info & Assignments */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Full Name:</p>
                    <p className="text-foreground font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Student ID:</p>
                    <p className="text-foreground font-medium">{student.studentId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Email:</p>
                    <p className="text-foreground font-medium break-all">{student.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Grade Level:</p>
                    <p className="text-foreground font-medium">{student.grade}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Parent Management */}
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Linked Parents
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => setLinkParentModalOpen(true)}
                    className="bg-[#C8A882] text-white hover:bg-[#B89872]"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Link Parent
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {linkedParents.length > 0 ? (
                    linkedParents.map((parent) => (
                      <div
                        key={parent.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground font-medium text-sm">{parent.name}</p>
                          <p className="text-muted-foreground text-xs flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {parent.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkParent(parent.id)}
                          disabled={unlinkingParentId === parent.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                        >
                          {unlinkingParentId === parent.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No parents linked to this student
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Assignments & Groups */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-foreground">Assignments & Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pending Assignments */}
                  <div>
                    <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Pending Assignments ({pendingAssignments.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingAssignments.length > 0 ? (
                        pendingAssignments.map((assignment) => {
                          const dueDate = new Date(assignment.dueDate)
                          const now = new Date()
                          const diffMs = dueDate.getTime() - now.getTime()
                          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

                          let dueDateText = ''
                          let dueDateColor = 'text-muted-foreground'

                          if (diffDays === 0) {
                            dueDateText = 'Due Today'
                            dueDateColor = 'text-orange-500'
                          } else if (diffDays === 1) {
                            dueDateText = 'Due Tomorrow'
                            dueDateColor = 'text-red-500'
                          } else if (diffDays > 1) {
                            dueDateText = `Due in ${diffDays} days`
                            dueDateColor = 'text-muted-foreground'
                          } else {
                            dueDateText = 'Overdue'
                            dueDateColor = 'text-red-500'
                          }

                          return (
                            <div key={assignment.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border">
                              <div className="flex-1 min-w-0">
                                <p className="text-foreground font-medium text-sm">{assignment.title}</p>
                                <p className="text-muted-foreground text-xs">{assignment.subject}</p>
                              </div>
                              <Badge variant="outline" className={`text-xs ${dueDateColor} ml-2 flex-shrink-0`}>
                                {dueDateText}
                              </Badge>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">No pending assignments</p>
                      )}
                    </div>
                  </div>

                  {/* Active Groups */}
                  <div>
                    <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Active Groups ({groups.length})
                    </h3>
                    <div className="space-y-2">
                      {groups.length > 0 ? (
                        groups.map((group) => (
                          <div key={group.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                            <Users className="h-4 w-4 text-[#C8A882] flex-shrink-0" />
                            <p className="text-foreground text-sm">{group.name}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm text-center py-4">No active groups</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
            </>
          )}

      {/* Send Message Modal */}
      {student && (
        <SendMessageModal
          open={sendMessageModalOpen}
          onOpenChange={setSendMessageModalOpen}
          student={{
            id: student.id,
            name: student.name,
            email: student.email,
            avatar: student.avatar
          }}
          onMessageSent={() => {
            toast.success('Message sent successfully')
          }}
        />
      )}

      {/* Link Parent Modal */}
      <Dialog open={linkParentModalOpen} onOpenChange={setLinkParentModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Link Parent to {student?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLinkParent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parent-name">Parent Name *</Label>
              <Input
                id="parent-name"
                placeholder="Enter parent's full name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-email">Parent Email *</Label>
              <Input
                id="parent-email"
                type="email"
                placeholder="parent@example.com"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                required
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                The parent will be linked to this student and can view their progress.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkParentModalOpen(false)}
                disabled={linkingParent}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={linkingParent || !parentEmail.trim() || !parentName.trim()}
                className="bg-[#C8A882] text-white hover:bg-[#B89872]"
              >
                {linkingParent ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Linking...
                  </>
                ) : (
                  'Link Parent'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
