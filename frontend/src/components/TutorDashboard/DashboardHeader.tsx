import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Plus,
  Bell,
  User,
  LogOut,
  Settings,
} from "lucide-react"
import { useUser, useClerk } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"

interface DashboardHeaderProps {
  onCreateAssignment: () => void
}

export function DashboardHeader({ onCreateAssignment }: DashboardHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New submission",
      message: "Sarah Kim submitted Calculus Quiz",
      time: "2 minutes ago",
      unread: true
    },
    {
      id: 2,
      title: "Assignment due soon",
      message: "Motion Problems due tomorrow",
      time: "1 hour ago",
      unread: true
    },
    {
      id: 3,
      title: "Student question",
      message: "Michael Brown asked a question",
      time: "3 hours ago",
      unread: false
    }
  ])
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  const unreadCount = notifications.filter(n => n.unread).length
  const allRead = unreadCount === 0

  // Mark all notifications as read/unread
  const handleMarkAllToggle = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: !allRead })))
  }

  // Navigation handlers
  const handleProfileClick = () => {
    navigate('/profile')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Get user display name
  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.fullName) {
      return user.fullName
    }
    if (user?.firstName) {
      return user.firstName
    }
    return 'User'
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
              Welcome back, {getUserDisplayName()}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* New Assignment Button - Desktop */}
          <Button
            onClick={onCreateAssignment}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white hidden sm:flex"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Assignment
          </Button>

          {/* New Assignment Button - Mobile */}
          <Button
            onClick={onCreateAssignment}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white sm:hidden p-2"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Notifications Popover */}
          <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 rounded-full text-[10px] sm:text-xs text-white flex items-center justify-center font-medium">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllToggle}
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {allRead ? 'Mark all unread' : 'Mark all read'}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                        notification.unread ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                  <Button variant="ghost" className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950/30">
                    See more notifications
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 dark:bg-blue-500 text-white">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettingsClick}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

