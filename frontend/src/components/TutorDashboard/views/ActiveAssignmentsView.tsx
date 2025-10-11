import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  Plus
} from "lucide-react"
import { useApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { ServerError } from '@/components/ErrorScreen'
import { UpcomingDeadlines } from '../components/UpcomingDeadlines'

interface Assignment {
  id: string
  title: string
  subject: string
  topic: string
  dueDate: string
  status: 'draft' | 'published' | 'completed'
  studentCount: number
  completedCount: number
  questionCount: number
  averageScore?: number
}

export default function ActiveAssignmentsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const client = useApiClient()

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await client.get('/assignments/')
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      // Map API response to Assignment interface
      const assignmentsData = (response.data || []).map((assignment: any) => ({
        id: assignment._id,
        title: assignment.title,
        subject: assignment.subject_id?.name || "Unknown",
        topic: assignment.topic || "General",
        dueDate: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : "N/A",
        status: assignment.status || 'draft',
        studentCount: assignment.assigned_students?.length || 0,
        completedCount: 0, // TODO: Calculate from progress
        questionCount: assignment.questions?.length || 0,
        averageScore: assignment.average_score || undefined
      }))
      
      setAssignments(assignmentsData)

      if (assignmentsData.length > 0) {
        toast.success(`Loaded ${assignmentsData.length} assignment${assignmentsData.length > 1 ? 's' : ''}`)
      }
    } catch (err: any) {
      console.error('Failed to fetch assignments:', err)
      setError(err)
      toast.error('Failed to load assignments', {
        description: err.message || 'Please try again later'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'draft':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    const matchesSubject = subjectFilter === "all" || assignment.subject === subjectFilter
    return matchesSearch && matchesStatus && matchesSubject
  })

  const handleDelete = async (assignmentId: string, title: string) => {
    try {
      const response = await client.delete(`/assignments/${assignmentId}`)

      if (response.error) {
        throw new Error(response.error)
      }

      // Remove from local state
      setAssignments(assignments.filter(a => a.id !== assignmentId))

      toast.success('Assignment deleted', {
        description: `"${title}" has been deleted successfully`
      })
    } catch (err: any) {
      console.error('Failed to delete assignment:', err)
      toast.error('Failed to delete assignment', {
        description: err.message || 'Please try again later'
      })
    }
  }

  const handleView = (assignmentId: string) => {
    toast.info('View assignment', {
      description: 'Assignment details view coming soon'
    })
  }

  const handleEdit = (assignmentId: string) => {
    toast.info('Edit assignment', {
      description: 'Assignment editing coming soon'
    })
  }

  // Show error screen if there's an error
  if (error) {
    return <ServerError error={error} onRetry={fetchAssignments} />
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar - Deadlines */}
      <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto">
        <UpcomingDeadlines />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Active Assignments
            </h2>
            <p className="text-muted-foreground">
              Manage and track your assignments
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        {/* Filters */}
        <Card className="border border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse border border-border bg-card">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assignments Grid */}
      {!loading && filteredAssignments.length === 0 && (
        <Card className="border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No assignments found
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "all" || subjectFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first assignment to get started"}
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && filteredAssignments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="border border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <CardDescription>{assignment.subject}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(assignment.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(assignment.status)}
                      {assignment.status}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">
                      {assignment.completedCount}/{assignment.studentCount} students
                    </span>
                  </div>
                  <Progress
                    value={(assignment.completedCount / assignment.studentCount) * 100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{assignment.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{assignment.questionCount} questions</span>
                  </div>
                </div>

                {assignment.averageScore !== undefined && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Average Score</span>
                      <span className="font-semibold text-success">
                        {assignment.averageScore}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleView(assignment.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(assignment.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(assignment.id, assignment.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

