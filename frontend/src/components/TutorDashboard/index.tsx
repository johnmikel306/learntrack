import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { useApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { AppSidebar } from "./AppSidebar"
import { OverviewView } from "./views/OverviewView"
import { PlaceholderView } from "./views/PlaceholderView"
import InvitationsView from "./views/InvitationsView"
import RelationshipsView from "./views/RelationshipsView"
import StudentManager from "@/components/student-manager"
import AssignmentManager from "@/components/assignment-manager"
import IntegratedSubjectsManager from "@/components/integrated-subjects-manager"
import QuestionReviewer from "@/components/question-reviewer"
import MaterialManager from "@/components/MaterialManager"
import ActiveAssignmentsView from "./views/ActiveAssignmentsView"
import CreateAssignmentView from "./views/CreateAssignmentView"
import MessagingView from "./views/MessagingView"
import { Users, FileText, BookOpen, Brain, Calendar, BarChart3, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface TutorDashboardProps {
  onBack?: () => void
}

export default function TutorDashboard({ onBack }: TutorDashboardProps) {
  const [activeView, setActiveView] = useState("overview")
  const client = useApiClient()
  const navigate = useNavigate()

  // Dashboard data state
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await client.get('/dashboard/stats')
        if (response.error) {
          throw new Error(response.error)
        }
        setDashboardStats(response.data)
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Render the appropriate view based on activeView state
  const renderView = () => {
    switch (activeView) {
      case "overview":
        return (
          <OverviewView
            dashboardStats={dashboardStats}
            loading={loading}
            onViewChange={handleViewChange}
          />
        )

      case "all-students":
        return <StudentManager />

      case "invitations":
        return <InvitationsView />

      case "relationships":
        return <RelationshipsView />

      case "performance":
        return (
          <PlaceholderView
            title="Performance Analytics"
            description="Detailed insights into student performance and progress"
            icon={BarChart3}
            message="Performance analytics will be available soon"
            submessage="Track detailed student performance metrics"
          />
        )

      case "attendance":
        return (
          <PlaceholderView
            title="Attendance Tracking"
            description="Monitor student attendance and participation"
            icon={Calendar}
            message="Attendance tracking will be available soon"
            submessage="Keep track of student attendance records"
          />
        )

      case "groups":
        return (
          <PlaceholderView
            title="Groups Management"
            description="Organize students into groups"
            icon={Users}
            message="Group management will be available soon"
            submessage="Create and manage student groups for collaborative learning"
          />
        )

      case "active-assignments":
        return <ActiveAssignmentsView />

      case "create-new":
        return <CreateAssignmentView />

      case "templates":
        return (
          <PlaceholderView
            title="Assignment Templates"
            description="Reusable assignment templates"
            icon={FileText}
            message="Assignment templates will be available soon"
            submessage="Create and manage reusable assignment templates"
          />
        )

      case "grading":
        return (
          <PlaceholderView
            title="Grading Center"
            description="Grade and review student submissions"
            icon={FileText}
            message="Grading center will be available soon"
            submessage="Review and grade student assignments"
          />
        )

      case "question-bank":
        return (
          <PlaceholderView
            title="Question Library"
            description="Manage your question bank"
            icon={FileText}
            message="Question bank will be available soon"
            submessage="Access and organize your collection of questions"
          />
        )

      case "subjects":
        return <IntegratedSubjectsManager />

      case "review-questions":
        return <QuestionReviewer />

      case "ai-generator":
        return (
          <PlaceholderView
            title="AI Generator"
            description="Generate questions with AI"
            icon={Brain}
            message="AI question generator will be available soon"
            submessage="Create custom questions with AI assistance"
          />
        )

      case "resources":
        return <MaterialManager />

      case "chats":
        return <MessagingView type="chats" />

      case "emails":
        return <MessagingView type="emails" />

      default:
        return (
          <OverviewView
            dashboardStats={dashboardStats}
            loading={loading}
          />
        )
    }
  }

  // Handle settings navigation
  const handleViewChange = (view: string) => {
    if (view === "settings") {
      navigate("/settings")
    } else {
      setActiveView(view)
    }
  }

  // Get breadcrumb title
  const getBreadcrumbTitle = () => {
    const titles: Record<string, string> = {
      "overview": "Dashboard",
      "all-students": "All Students",
      "invitations": "Invitations",
      "groups": "Groups",
      "relationships": "Relationships",
      "ai-generator": "Question Generator",
      "review-questions": "Review Questions",
      "question-bank": "Question Bank",
      "resources": "Materials",
      "subjects": "Subjects",
      "active-assignments": "Active Assignments",
      "create-new": "Create Assignment",
      "templates": "Templates",
      "grading": "Grading",
      "chats": "Chats",
      "emails": "Emails",
    }
    return titles[activeView] || "Dashboard"
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={handleViewChange} />
      <SidebarInset className="bg-background">
        {/* Header with breadcrumb */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  LearnTrack
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{getBreadcrumbTitle()}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4 bg-background">
          {renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

