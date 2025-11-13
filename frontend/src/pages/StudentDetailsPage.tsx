import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  MessageCircle, 
  Edit, 
  CheckCircle2, 
  Clock,
  Users,
  FileText,
  Calendar
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useApiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { AppSidebar } from '@/components/TutorDashboard/AppSidebar'
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

export default function StudentDetailsPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [activeView, setActiveView] = useState('all-students')
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false)

  const client = useApiClient()

  const fetchStudentDetails = async () => {
    if (!studentId) return

    try {
      setLoading(true)

      // Fetch student details
      const studentRes = await client.get(`/users/${studentId}`)
      if (studentRes.error) throw new Error(studentRes.error)

      const userData = studentRes.data

      setStudent({
        id: userData.clerk_id || userData._id,
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
        const progressRes = await client.get(`/progress/student/${studentId}/analytics`)
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
        const assignmentsRes = await client.get(`/assignments/student/${studentId}?status=pending`)
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
        const groupsRes = await client.get(`/groups/student/${studentId}`)
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
        const activityRes = await client.get(`/activity/student/${studentId}`)
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
    } catch (err: any) {
      console.error('Failed to fetch student details:', err)
      toast.error('Failed to load student details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (studentId) {
      console.log('StudentDetailsPage loaded with studentId:', studentId)
      fetchStudentDetails()
    }
  }, [studentId])

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

  const handleViewChange = (view: string) => {
    // Map view names to routes
    const viewToRoute: Record<string, string> = {
      'overview': '/dashboard',
      'all-students': '/dashboard/students',
      'invitations': '/dashboard/invitations',
      'groups': '/dashboard/groups',
      'relationships': '/dashboard/relationships',
      'ai-generator': '/dashboard/content/generator',
      'review-questions': '/dashboard/content/review',
      'question-bank': '/dashboard/content/bank',
      'resources': '/dashboard/content/materials',
      'subjects': '/dashboard/content/subjects',
      'active-assignments': '/dashboard/assignments',
      'create-new': '/dashboard/assignments/create',
      'templates': '/dashboard/assignments/templates',
      'grading': '/dashboard/assignments/grading',
      'chats': '/dashboard/messages/chats',
      'emails': '/dashboard/messages/emails',
      'settings': '/settings',
    }

    const route = viewToRoute[view] || '/dashboard'
    navigate(route)
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending')

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8A882]"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Student not found</h2>
          <Button onClick={() => navigate('/dashboard/students')}>Back to Students</Button>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={handleViewChange} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink onClick={() => navigate('/dashboard/students')} className="cursor-pointer">
                  All Students
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{student.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#1a1a1a] dark:bg-[#1a1a1a] text-white p-6">
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
              <Card className="bg-[#0f0f0f] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Academic Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" domain={[60, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #333',
                          borderRadius: '8px',
                          color: '#fff'
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
              <Card className="bg-[#0f0f0f] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        {activity.type === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {activity.type === 'completed' ? 'Completed Assignment: ' : 'Submitted: '}
                            "{activity.title}"
                          </p>
                          <p className="text-gray-400 text-sm">
                            {format(new Date(activity.timestamp), 'PPp')}
                            {activity.score && ` · Score: ${activity.score}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Personal Info & Assignments */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card className="bg-[#0f0f0f] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Full Name:</p>
                    <p className="text-white font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Student ID:</p>
                    <p className="text-white font-medium">{student.studentId}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email:</p>
                    <p className="text-white font-medium">{student.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Parent/Guardian:</p>
                    <p className="text-[#C8A882] font-medium">{student.parentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Grade Level:</p>
                    <p className="text-white font-medium">{student.grade}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Assignments & Groups */}
              <Card className="bg-[#0f0f0f] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Assignments & Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pending Assignments */}
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      Pending Assignments ({pendingAssignments.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingAssignments.map((assignment) => {
                        const dueDate = new Date(assignment.dueDate)
                        const now = new Date()
                        const diffMs = dueDate.getTime() - now.getTime()
                        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

                        let dueDateText = ''
                        let dueDateColor = 'text-gray-400'

                        if (diffDays === 0) {
                          dueDateText = 'Due Today'
                          dueDateColor = 'text-orange-500'
                        } else if (diffDays === 1) {
                          dueDateText = 'Due Tomorrow'
                          dueDateColor = 'text-red-500'
                        } else if (diffDays > 1) {
                          dueDateText = `Due in ${diffDays} days`
                          dueDateColor = 'text-gray-400'
                        } else {
                          dueDateText = 'Overdue'
                          dueDateColor = 'text-red-500'
                        }

                        return (
                          <div key={assignment.id} className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{assignment.title}</p>
                              <p className="text-gray-400 text-xs">{assignment.subject}</p>
                            </div>
                            <p className={`text-xs ${dueDateColor}`}>{dueDateText}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Active Groups */}
                  <div>
                    <h3 className="text-white font-semibold mb-3">
                      Active Groups ({groups.length})
                    </h3>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div key={group.id} className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#C8A882]" />
                          <p className="text-white text-sm">{group.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Send Message Modal */}
      {student && (
        <SendMessageModal
          open={sendMessageModalOpen}
          onOpenChange={setSendMessageModalOpen}
          recipient={{
            id: student.id,
            name: student.name,
            avatar: student.avatar
          }}
          onMessageSent={() => {
            toast.success('Message sent successfully')
          }}
        />
      )}
    </SidebarProvider>
  )
}

