'use client'

// CLERK DISABLED: import { useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  BarChart3, 
  MessageCircle,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react'

export default function ParentDashboardPage() {
  // CLERK DISABLED: const { user, isLoaded } = useUser()
  // CLERK DISABLED: const { organization, membership, isLoaded: orgLoaded } = useOrganization()

  // NO-AUTH: Mock data for testing
  const user = { firstName: 'Demo', lastName: 'Parent' }
  const organization = { name: 'Demo School' }
  const membership = { role: 'org:parent' }
  const isLoaded = true
  const orgLoaded = true
  const router = useRouter()
  const [children, setChildren] = useState([
    {
      id: '1',
      name: 'Emma Johnson',
      grade: '5th Grade',
      overallProgress: 85,
      recentGrade: 'A-',
      assignmentsDue: 2
    },
    {
      id: '2', 
      name: 'Alex Johnson',
      grade: '3rd Grade',
      overallProgress: 78,
      recentGrade: 'B+',
      assignmentsDue: 1
    }
  ])

  useEffect(() => {
    // NO-AUTH: Mock data is already set in state
  }, [])

  // NO-AUTH: Remove loading state since we're not checking authentication

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {organization?.name || 'Your School'}
                </h1>
                <p className="text-sm text-gray-500">Parent Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName}
              </span>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Tutor
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Children Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Children's Progress</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {children.map((child) => (
              <Card key={child.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{child.name}</CardTitle>
                      <CardDescription>{child.grade}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{child.recentGrade}</div>
                      <p className="text-xs text-gray-500">Current Grade</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span>{child.overallProgress}%</span>
                      </div>
                      <Progress value={child.overallProgress} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {child.assignmentsDue} assignments due
                      </span>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{children.length}</div>
              <p className="text-xs text-muted-foreground">
                Enrolled in school
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(children.reduce((acc, child) => acc + child.overallProgress, 0) / children.length)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all children
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {children.reduce((acc, child) => acc + child.assignmentsDue, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Assignments due
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Communication */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your children</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Emma completed Math Quiz #5</p>
                    <p className="text-sm text-gray-600">Score: 95% • 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Alex submitted Science Report</p>
                    <p className="text-sm text-gray-600">Awaiting grade • Yesterday</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">New assignment assigned</p>
                    <p className="text-sm text-gray-600">English Essay due Friday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>Messages and updates from tutors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Ms. Rodriguez</span>
                    <span className="text-xs text-gray-500">2 days ago</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Emma is doing excellent work in mathematics. She's showing great improvement in problem-solving skills.
                  </p>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium">Mr. Thompson</span>
                    <span className="text-xs text-gray-500">1 week ago</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Alex needs to focus more on reading comprehension. I recommend 15 minutes of daily reading practice.
                  </p>
                </div>
              </div>
              
              <Button className="w-full mt-4" variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message to Tutor
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
