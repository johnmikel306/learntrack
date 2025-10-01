"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  ArrowLeft,
  Plus,
  Bell,
  Brain,
  Home,
  Users,
  FileText,
  BookOpen,
  Calendar,
  BarChart3,
  Activity,
  Award,
  Clock,
  TrendingUp,
  User,
  LogOut,
  Settings,
  Palette,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import { Area, AreaChart, Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TutorDashboardProps {
  onBack?: () => void
}

// Top performers data
const topPerformers = [
  { name: "Sarah Kim", subject: "Mathematics", score: 98, trend: "+5%", avatar: "SK", bgColor: "bg-blue-100", textColor: "text-blue-600" },
  { name: "Michael Brown", subject: "Physics", score: 96, trend: "+6%", avatar: "MB", bgColor: "bg-green-100", textColor: "text-green-600" },
  { name: "Lisa Wang", subject: "Chemistry", score: 94, trend: "+3%", avatar: "LW", bgColor: "bg-purple-100", textColor: "text-purple-600" },
  { name: "David Lee", subject: "Biology", score: 92, trend: "+12%", avatar: "DL", bgColor: "bg-orange-100", textColor: "text-orange-600" }
]

// Stats cards data
const statsCards = [
  {
    title: "Total Students",
    value: "156",
    subtitle: "+12% this month",
    icon: Users,
    gradient: "from-blue-50 to-blue-100",
    iconBg: "bg-blue-600",
    textColor: "text-blue-900",
    subtextColor: "text-blue-600"
  },
  {
    title: "Active Assignments",
    value: "24",
    subtitle: "8 due this week",
    icon: BookOpen,
    gradient: "from-emerald-50 to-emerald-100",
    iconBg: "bg-emerald-600",
    textColor: "text-emerald-900",
    subtextColor: "text-emerald-600"
  },
  {
    title: "Avg. Performance",
    value: "91%",
    subtitle: "+5% vs last month",
    icon: BarChart3,
    gradient: "from-amber-50 to-amber-100",
    iconBg: "bg-amber-600",
    textColor: "text-amber-900",
    subtextColor: "text-amber-600"
  },
  {
    title: "Engagement Rate",
    value: "92%",
    subtitle: "Excellent",
    icon: Activity,
    gradient: "from-purple-50 to-purple-100",
    iconBg: "bg-purple-600",
    textColor: "text-purple-900",
    subtextColor: "text-purple-600"
  }
]

// Performance chart data
const performanceData = [
  { month: "Aug", avgScore: 82, engagement: 78 },
  { month: "Sep", avgScore: 85, engagement: 82 },
  { month: "Oct", avgScore: 87, engagement: 85 },
  { month: "Nov", avgScore: 89, engagement: 88 },
  { month: "Dec", avgScore: 91, engagement: 92 }
]

// Subject performance data
const subjectData = [
  { subject: "Math", avgScore: 87, completionRate: 92 },
  { subject: "Physics", avgScore: 82, completionRate: 88 },
  { subject: "Chemistry", avgScore: 89, completionRate: 94 },
  { subject: "Biology", avgScore: 85, completionRate: 90 }
]

// Recent activity data
const recentActivity = [
  { name: "Emma Wilson", action: "completed Algebra Quiz - 92%", time: "5 min ago", avatar: "EW", score: 92 },
  { name: "James Chen", action: "submitted Physics Lab - 88%", time: "12 min ago", avatar: "JC", score: 88 },
  { name: "Sofia Rodriguez", action: "started Chemistry Test", time: "25 min ago", avatar: "SR", score: null },
  { name: "Alex Johnson", action: "completed Math Practice - 95%", time: "1 hour ago", avatar: "AJ", score: 95 }
]

// Upcoming deadlines data
const upcomingDeadlines = [
  { title: "Calculus Quiz", subject: "Mathematics", dueDate: "Today", urgency: "urgent", completed: 18, total: 24 },
  { title: "Motion Problems", subject: "Physics", dueDate: "Tomorrow", urgency: "normal", completed: 12, total: 19 },
  { title: "Periodic Table", subject: "Chemistry", dueDate: "Dec 28", urgency: "future", completed: 8, total: 22 }
]

// Chart configuration
const chartConfig = {
  avgScore: {
    label: "Avg Score",
    color: "hsl(var(--chart-1))",
  },
  engagement: {
    label: "Engagement",
    color: "hsl(var(--chart-2))",
  },
  completionRate: {
    label: "Completion Rate",
    color: "hsl(var(--chart-2))",
  },
}

function TutorDashboard({ onBack }: TutorDashboardProps) {
  const [activeView, setActiveView] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useUser()

  // Navigation items
  const navItems = [
    {
      title: "Dashboard",
      icon: Home,
      items: [
        { title: "Overview", icon: ChevronRight },
        { title: "Quick Stats", icon: ChevronRight }
      ]
    },
    {
      title: "Students",
      icon: Users,
      items: [
        { title: "All Students", icon: ChevronRight },
        { title: "Performance", icon: ChevronRight },
        { title: "Attendance", icon: ChevronRight },
        { title: "Groups", icon: ChevronRight }
      ]
    },
    {
      title: "Assignments",
      icon: FileText,
      items: [
        { title: "Active Assignments", icon: ChevronRight },
        { title: "Create New", icon: ChevronRight },
        { title: "Templates", icon: ChevronRight },
        { title: "Grading", icon: ChevronRight }
      ]
    },
    {
      title: "Content",
      icon: BookOpen,
      items: [
        { title: "Question Bank", icon: ChevronRight },
        { title: "Subjects", icon: ChevronRight },
        { title: "AI Generator", icon: ChevronRight },
        { title: "Resources", icon: ChevronRight }
      ]
    }
  ]

  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return "outline"
    if (score >= 90) return "default"
    if (score >= 70) return "secondary"
    return "destructive"
  }

  const getUrgencyBadgeVariant = (urgency: string) => {
    if (urgency === "urgent") return "destructive"
    if (urgency === "normal") return "default"
    return "outline"
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full bg-slate-50">
        {/* Left Sidebar */}
        <Sidebar className="border-r border-slate-200">
          <SidebarContent>
            {/* Logo Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden">
                  <h1 className="font-semibold text-slate-900">LearnTrack</h1>
                  <p className="text-xs text-slate-500">Tutor Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            {navItems.map((group, idx) => (
              <Collapsible key={idx} defaultOpen={idx === 0} className="group/collapsible">
                <SidebarGroup>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <group.icon className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">{group.title}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item, itemIdx) => (
                          <SidebarMenuItem key={itemIdx}>
                            <SidebarMenuButton
                              onClick={() => setActiveView(item.title.toLowerCase().replace(" ", "-"))}
                              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <span className="ml-6 group-data-[collapsible=icon]:ml-0">{item.title}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            ))}
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 min-h-[60px] sm:h-20">
            <div className="flex items-center justify-between h-full">
              {/* Left Section */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <SidebarTrigger />
                <Button variant="ghost" size="sm" className="text-slate-600 hidden sm:flex" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-lg sm:text-2xl font-semibold text-slate-900">Dashboard</h1>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Welcome back, Professor Johnson</p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hidden sm:flex">
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </Button>
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white sm:hidden p-2">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full text-[10px] sm:text-xs text-white flex items-center justify-center">3</span>
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-medium">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-slate-500">{user?.primaryEmailAddress?.emailAddress}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Palette className="h-4 w-4 mr-2" />
                      Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Main Content Area */}
            <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-y-auto">
              {activeView === "overview" && (
                <>
                  {/* Top Performers Section */}
                  <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                          <CardTitle className="text-base sm:text-lg font-semibold">Top Performers This Week</CardTitle>
                        </div>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {topPerformers.map((performer, index) => (
                          <div key={index} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 mb-3">
                              <Avatar className={`h-10 w-10 ${performer.bgColor}`}>
                                <AvatarFallback className={performer.textColor}>
                                  {performer.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-slate-900 text-sm">{performer.name}</p>
                                <p className="text-xs text-slate-500">{performer.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-slate-900">{performer.score}%</span>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {performer.trend}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {statsCards.map((stat, index) => {
                      const IconComponent = stat.icon
                      return (
                        <Card key={index} className={`border-0 shadow-sm bg-gradient-to-br ${stat.gradient}`}>
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <div className={`h-10 w-10 sm:h-12 sm:w-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                              <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor} mb-1 sm:mb-2`}>{stat.value}</p>
                              <div className="flex items-center space-x-1">
                                <TrendingUp className={`h-3 w-3 ${stat.subtextColor}`} />
                                <p className={`text-xs ${stat.subtextColor}`}>{stat.subtitle}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Performance & Engagement Trends */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                          <CardTitle className="text-base sm:text-lg font-semibold">Performance & Engagement Trends</CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">Track student progress and engagement over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 sm:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                              <defs>
                                <linearGradient id="colorAvgScore" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.6}/>
                                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#64748b" fontSize={12} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Area
                                type="monotone"
                                dataKey="avgScore"
                                stroke="hsl(var(--chart-1))"
                                fillOpacity={1}
                                fill="url(#colorAvgScore)"
                                strokeWidth={2}
                              />
                              <Area
                                type="monotone"
                                dataKey="engagement"
                                stroke="hsl(var(--chart-2))"
                                fillOpacity={1}
                                fill="url(#colorEngagement)"
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>

                    {/* Subject Performance Overview */}
                    <Card className="border-0 shadow-sm">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                          <CardTitle className="text-base sm:text-lg font-semibold">Subject Performance Overview</CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">Compare performance across all subjects</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-64 sm:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={subjectData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#64748b" fontSize={12} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar
                                dataKey="avgScore"
                                fill="hsl(var(--chart-1))"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="completionRate"
                                fill="hsl(var(--chart-2))"
                                radius={[4, 4, 0, 0]}
                              />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="text-base sm:text-lg font-semibold">Recent Activity</CardTitle>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-slate-100">
                        {recentActivity.map((activity, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-6 hover:bg-slate-50 transition-colors gap-2 sm:gap-0">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100">
                                <AvatarFallback className="text-blue-600 text-xs sm:text-sm">
                                  {activity.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{activity.name}</p>
                                <p className="text-xs sm:text-sm text-slate-500 truncate">{activity.action}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3 ml-11 sm:ml-0">
                              <span className="text-xs text-slate-400">{activity.time}</span>
                              {activity.score !== null && (
                                <Badge variant={getScoreBadgeVariant(activity.score)} className="text-xs">
                                  {activity.score}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </main>

            {/* Right Sidebar - Hidden on mobile, visible on lg screens */}
            <aside className="hidden lg:block w-80 bg-white border-l border-slate-200 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
              {/* Upcoming Deadlines */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                    <CardTitle className="text-base sm:text-lg font-semibold">Upcoming Deadlines</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {upcomingDeadlines.map((deadline, index) => {
                    const percentage = Math.round((deadline.completed / deadline.total) * 100)
                    return (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-slate-900 text-sm">{deadline.title}</p>
                          <Badge variant={getUrgencyBadgeVariant(deadline.urgency)}>
                            {deadline.dueDate}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{deadline.subject}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span>Progress</span>
                            <span>{deadline.completed}/{deadline.total}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                          <p className="text-xs text-slate-500">{percentage}% completed</p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg font-semibold">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Add Student
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Questions
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default TutorDashboard