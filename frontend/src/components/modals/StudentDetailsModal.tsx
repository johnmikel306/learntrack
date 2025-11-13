import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface StudentDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string
  onSendMessage?: () => void
  onEditProfile?: () => void
}

interface StudentDetails {
  id: string
  name: string
  email: string
  avatar?: string
  joinedDate: string
  studentId: string
  grade?: string
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
  status: string
  score?: number
}

interface Group {
  id: string
  name: string
  color: string
}

interface Activity {
  id: string
  type: 'assignment' | 'submission'
  title: string
  timestamp: string
  score?: number
  status?: string
}

interface ProgressData {
  month: string
  score: number
}

export function StudentDetailsModal({
  open,
  onOpenChange,
  studentId,
  onSendMessage,
  onEditProfile
}: StudentDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])

  const client = useApiClient()

  const fetchStudentDetails = async () => {
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

      // Generate mock progress data (replace with real API call)
      const mockProgress: ProgressData[] = [
        { month: 'Jan', score: 78 },
        { month: 'Feb', score: 82 },
        { month: 'Mar', score: 80 },
        { month: 'Apr', score: 88 },
        { month: 'May', score: 85 },
        { month: 'Jun', score: 92 }
      ]
      setProgressData(mockProgress)

      // Fetch assignments (mock for now)
      const mockAssignments: Assignment[] = [
        {
          id: '1',
          title: 'Geometry Homework 5.3',
          subject: 'Mathematics',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'pending'
        },
        {
          id: '2',
          title: 'Biology Lab Report',
          subject: 'Biology',
          dueDate: new Date(Date.now() + 259200000).toISOString(),
          status: 'pending'
        }
      ]
      setAssignments(mockAssignments)

      // Fetch groups (mock for now)
      const mockGroups: Group[] = [
        { id: '1', name: 'History Study Group', color: 'blue' }
      ]
      setGroups(mockGroups)

      // Fetch recent activity (mock for now)
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'assignment',
          title: 'Algebra Basics Quiz',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          score: 95,
          status: 'completed'
        },
        {
          id: '2',
          type: 'submission',
          title: 'World War II Essay',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: 'awaiting_grade'
        }
      ]
      setActivities(mockActivities)

    } catch (error: any) {
      console.error('Failed to fetch student details:', error)
      toast.error('Failed to load student details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && studentId) {
      console.log('StudentDetailsModal opened with studentId:', studentId)
      fetchStudentDetails()
    }
  }, [open, studentId])

  if (!student && !loading) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const pendingAssignments = assignments.filter(a => a.status === 'pending')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] dark:bg-[#1a1a1a] border-gray-800 text-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C8A882]"></div>
          </div>
        ) : student ? (
          <>
            {/* Header */}
            <DialogHeader className="border-b border-gray-800 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={student.avatar} alt={student.name} />
                    <AvatarFallback className="bg-[#C8A882] text-black text-lg">
                      {getInitials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white mb-1">
                      {student.name}
                    </DialogTitle>
                    <p className="text-sm text-gray-400">
                      Joined: {format(new Date(student.joinedDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="border-[#C8A882] text-[#C8A882] hover:bg-[#C8A882] hover:text-black"
                    onClick={onSendMessage}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    className="bg-[#C8A882] text-black hover:bg-[#B89872]"
                    onClick={onEditProfile}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Academic Progress Summary */}
              <Card className="bg-[#0f0f0f] border-gray-800 col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Academic Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis
                        dataKey="month"
                        stroke="#888"
                        tick={{ fill: '#888' }}
                      />
                      <YAxis
                        stroke="#888"
                        tick={{ fill: '#888' }}
                        domain={[60, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#2a2a2a',
                          border: '1px solid #444',
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

              {/* Personal Information */}
              <Card className="bg-[#0f0f0f] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Full Name:</span>
                    <span className="text-white font-medium">{student.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Student ID:</span>
                    <span className="text-white font-medium">{student.studentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white font-medium">{student.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Parent/Guardian:</span>
                    <span className="text-[#C8A882] font-medium">{student.parentName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Grade Level:</span>
                    <span className="text-white font-medium">{student.grade}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Assignments & Groups */}
              <Card className="bg-[#0f0f0f] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Assignments & Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Pending Assignments */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Pending Assignments ({pendingAssignments.length})
                    </h4>
                    <div className="space-y-2">
                      {pendingAssignments.length > 0 ? (
                        pendingAssignments.map(assignment => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between p-2 rounded bg-[#1a1a1a] border border-gray-800"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">{assignment.title}</p>
                              <p className="text-xs text-gray-400">{assignment.subject}</p>
                            </div>
                            <Badge variant="destructive" className="text-xs">
                              Due {format(new Date(assignment.dueDate), 'MMM dd')}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No pending assignments</p>
                      )}
                    </div>
                  </div>

                  {/* Active Groups */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">
                      Active Groups ({groups.length})
                    </h4>
                    <div className="space-y-2">
                      {groups.length > 0 ? (
                        groups.map(group => (
                          <div
                            key={group.id}
                            className="flex items-center gap-2 p-2 rounded bg-[#1a1a1a] border border-gray-800"
                          >
                            <Users className="h-4 w-4 text-[#C8A882]" />
                            <span className="text-sm text-white">{group.name}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No active groups</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-[#0f0f0f] border-gray-800 col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.length > 0 ? (
                      activities.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded bg-[#1a1a1a] border border-gray-800"
                        >
                          {activity.type === 'assignment' && activity.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {activity.type === 'assignment' ? 'Completed Assignment: ' : 'Submitted: '}
                                  "{activity.title}"
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {format(new Date(activity.timestamp), 'PPp')}
                                  {activity.status === 'awaiting_grade' && ' · Awaiting Grade'}
                                </p>
                              </div>
                              {activity.score !== undefined && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  Score: {activity.score}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

