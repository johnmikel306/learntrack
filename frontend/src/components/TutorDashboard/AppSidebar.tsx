import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Settings,
  ChevronRight,
  UserPlus,
  MessageSquare,
  Mail,
  Brain,
  CheckSquare,
  Library,
  FolderOpen,
  Calendar,
  ClipboardList,
  FileStack,
  GraduationCap,
  Bell,
  User,
  LogOut,
  Moon,
  Sun,
  Layers,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useUser, useClerk } from "@clerk/clerk-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useNavigate } from "react-router-dom"

interface AppSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    view: "overview",
  },
  {
    title: "Students",
    icon: Users,
    items: [
      {
        title: "All Students",
        icon: Users,
        view: "all-students",
      },
      {
        title: "Invitations",
        icon: UserPlus,
        view: "invitations",
      },
      {
        title: "Groups",
        icon: Users,
        view: "groups",
      },
      {
        title: "Relationships",
        icon: MessageSquare,
        view: "relationships",
      },
    ],
  },
  {
    title: "Content",
    icon: BookOpen,
    items: [
      {
        title: "Question Generator",
        icon: Brain,
        view: "ai-generator",
      },
      {
        title: "Review Questions",
        icon: CheckSquare,
        view: "review-questions",
      },
      {
        title: "Question Bank",
        icon: Library,
        view: "question-bank",
      },
      {
        title: "Materials",
        icon: FolderOpen,
        view: "resources",
      },
      {
        title: "Subjects",
        icon: BookOpen,
        view: "subjects",
      },
    ],
  },
  {
    title: "Assignments",
    icon: FileText,
    items: [
      {
        title: "Active Assignments",
        icon: Calendar,
        view: "active-assignments",
      },
      {
        title: "Create New",
        icon: ClipboardList,
        view: "create-new",
      },
      {
        title: "Templates",
        icon: FileStack,
        view: "templates",
      },
      {
        title: "Grading",
        icon: GraduationCap,
        view: "grading",
      },
    ],
  },
  {
    title: "Messages",
    icon: MessageSquare,
    items: [
      {
        title: "Chats",
        icon: MessageSquare,
        view: "chats",
      },
      {
        title: "Emails",
        icon: Mail,
        view: "emails",
      },
    ],
  },
]

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  const handleSettings = () => {
    navigate("/settings")
  }

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 py-6 flex items-center gap-2 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4 group-data-[collapsible=icon]:justify-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary font-lufga group-data-[collapsible=icon]:hidden">
              LearnTrack
            </h1>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                // Menu item with submenu
                if (item.items) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.items.some((subItem) => subItem.view === activeView)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={activeView === subItem.view}
                                  onClick={() => onViewChange(subItem.view)}
                                >
                                  <a href="#">
                                    {subItem.icon && <subItem.icon />}
                                    <span>{subItem.title}</span>
                                  </a>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                // Single menu item
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeView === item.view}
                      onClick={() => item.view && onViewChange(item.view)}
                      tooltip={item.title}
                    >
                      <a href="#">
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* Notifications */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip="Notifications"
                >
                  <div className="relative group-data-[collapsible=icon]:mx-auto">
                    <Bell className="h-4 w-4" />
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] group-data-[collapsible=icon]:-top-2 group-data-[collapsible=icon]:-right-2"
                    >
                      3
                    </Badge>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">Notifications</span>
                    <span className="truncate text-xs">3 unread</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Bell className="h-4 w-4" />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">Notifications</span>
                      <span className="truncate text-xs text-muted-foreground">3 unread messages</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">New assignment submitted</span>
                      <span className="text-xs text-muted-foreground">John Doe submitted Math Quiz 1</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">Question approved</span>
                      <span className="text-xs text-muted-foreground">Your question was approved</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">New student joined</span>
                      <span className="text-xs text-muted-foreground">Jane Smith accepted your invitation</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm font-medium">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          {/* User Profile */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip="Profile"
                >
                  <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:mx-auto">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user?.firstName?.charAt(0) || "U"}
                      {user?.lastName?.charAt(0) || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{user?.fullName || "User"}</span>
                    <span className="truncate text-xs">{user?.primaryEmailAddress?.emailAddress}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {user?.firstName?.charAt(0) || "U"}
                        {user?.lastName?.charAt(0) || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.fullName || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "dark" ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

