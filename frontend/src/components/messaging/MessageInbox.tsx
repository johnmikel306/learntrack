import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Mail, 
  Search, 
  Star, 
  Archive, 
  Trash2, 
  Send,
  MailOpen,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  sender: string
  senderAvatar: string
  subject: string
  preview: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  category: "inbox" | "sent" | "archived"
}

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "William Smith",
    senderAvatar: "WS",
    subject: "Meeting Tomorrow",
    preview: "Hi team, just a reminder about our meeting tomorrow at 10 AM...",
    timestamp: "09:34 AM",
    isRead: false,
    isStarred: true,
    category: "inbox"
  },
  {
    id: "2",
    sender: "Alice Smith",
    senderAvatar: "AS",
    subject: "Re: Project Update",
    preview: "Thanks for the update. The progress looks great so far...",
    timestamp: "Yesterday",
    isRead: false,
    isStarred: false,
    category: "inbox"
  },
  {
    id: "3",
    sender: "Bob Johnson",
    senderAvatar: "BJ",
    subject: "Weekend Plans",
    preview: "Hey everyone! I'm thinking of organizing a team outing this weekend...",
    timestamp: "2 days ago",
    isRead: true,
    isStarred: false,
    category: "inbox"
  },
  {
    id: "4",
    sender: "Emily Davis",
    senderAvatar: "ED",
    subject: "Re: Question about Budget",
    preview: "I've reviewed the budget numbers you sent over...",
    timestamp: "2 days ago",
    isRead: true,
    isStarred: true,
    category: "inbox"
  },
  {
    id: "5",
    sender: "Michael Wilson",
    senderAvatar: "MW",
    subject: "Important Announcement",
    preview: "Please join us for an all-hands meeting this Friday at 3 PM...",
    timestamp: "1 week ago",
    isRead: true,
    isStarred: false,
    category: "inbox"
  }
]

export function MessageInbox() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const unreadCount = messages.filter(m => !m.isRead).length

  const filteredMessages = messages.filter(message =>
    message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleStar = (messageId: string) => {
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ))
  }

  const markAsRead = (messageId: string) => {
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ))
  }

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message)
    markAsRead(message.id)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Inbox</h3>
            {unreadCount > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {unreadCount} unread
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge variant="secondary" className="h-5 px-2">
            {unreadCount}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Message List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              onClick={() => handleMessageClick(message)}
              className={cn(
                "bg-card border border-border rounded-lg p-3 cursor-pointer transition-all duration-200 group",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm",
                !message.isRead && "bg-primary/5 border-primary/30",
                selectedMessage?.id === message.id && "border-primary shadow-sm"
              )}
            >
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {message.senderAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={cn(
                      "text-xs truncate",
                      !message.isRead ? "font-semibold text-foreground" : "font-medium text-foreground"
                    )}>
                      {message.sender}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {message.timestamp}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStar(message.id)
                        }}
                      >
                        <Star
                          className={cn(
                            "h-3 w-3",
                            message.isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                          )}
                        />
                      </Button>
                    </div>
                  </div>
                  <p className={cn(
                    "text-[11px] mb-1 truncate",
                    !message.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {message.subject}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {message.preview}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1">
          <MailOpen className="h-3 w-3 mr-1" />
          Mark all read
        </Button>
        <Button variant="ghost" size="sm" className="h-7 text-xs flex-1">
          <Archive className="h-3 w-3 mr-1" />
          Archive
        </Button>
      </div>
    </div>
  )
}

