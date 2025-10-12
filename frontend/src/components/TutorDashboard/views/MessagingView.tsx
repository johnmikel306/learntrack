import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Search,
  MessageSquare,
  Mail,
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
  isUnread: boolean
}

interface MessagingViewProps {
  type: "chats" | "emails"
}

const mockChats: Message[] = [
  {
    id: "1",
    sender: "William Smith",
    senderAvatar: "WS",
    subject: "Meeting Tomorrow",
    preview: "Hi team, just a reminder about our meeting tomorrow at 10 AM...",
    timestamp: "09:34 AM",
    isRead: false,
    isUnread: true,
  },
  {
    id: "2",
    sender: "Alice Smith",
    senderAvatar: "AS",
    subject: "Re: Project Update",
    preview: "Thanks for the update. The progress looks great so far...",
    timestamp: "Yesterday",
    isRead: true,
    isUnread: false,
  },
  {
    id: "3",
    sender: "Bob Johnson",
    senderAvatar: "BJ",
    subject: "Weekend Plans",
    preview: "Hey everyone! I'm thinking of organizing a team outing this weekend...",
    timestamp: "2 days ago",
    isRead: true,
    isUnread: false,
  },
  {
    id: "4",
    sender: "Emily Davis",
    senderAvatar: "ED",
    subject: "Re: Question about Budget",
    preview: "I've reviewed the budget numbers you sent over...",
    timestamp: "2 days ago",
    isRead: true,
    isUnread: false,
  },
  {
    id: "5",
    sender: "Michael Wilson",
    senderAvatar: "MW",
    subject: "Important Announcement",
    preview: "Please join us for an all hands meeting this Friday at 3 PM...",
    timestamp: "1 week ago",
    isRead: true,
    isUnread: false,
  },
  {
    id: "6",
    sender: "Sarah Brown",
    senderAvatar: "SB",
    subject: "Re: Feedback on Proposal",
    preview: "Thank you for sending over the proposal. I've reviewed it and have some thoughts...",
    timestamp: "1 week ago",
    isRead: true,
    isUnread: false,
  },
  {
    id: "7",
    sender: "David Lee",
    senderAvatar: "DL",
    subject: "New Project Idea",
    preview: "I've been brainstorming and came up with an interesting project concept...",
    timestamp: "1 week ago",
    isRead: true,
    isUnread: false,
  },
]

const mockEmails: Message[] = [
  {
    id: "e1",
    sender: "John Doe",
    senderAvatar: "JD",
    subject: "Assignment Submission",
    preview: "I've completed the assignment and attached it to this email...",
    timestamp: "10:15 AM",
    isRead: false,
    isUnread: true,
  },
  {
    id: "e2",
    sender: "Jane Smith",
    senderAvatar: "JS",
    subject: "Question about Homework",
    preview: "I have a question about problem 5 in the homework assignment...",
    timestamp: "Yesterday",
    isRead: true,
    isUnread: false,
  },
  {
    id: "e3",
    sender: "Parent - Tom Wilson",
    senderAvatar: "TW",
    subject: "Progress Update Request",
    preview: "Could you please provide an update on my child's progress this semester...",
    timestamp: "3 days ago",
    isRead: true,
    isUnread: false,
  },
  {
    id: "e4",
    sender: "Sarah Johnson",
    senderAvatar: "SJ",
    subject: "Re: Test Results",
    preview: "Thank you for sharing the test results. I'm pleased with the improvement...",
    timestamp: "4 days ago",
    isRead: true,
    isUnread: false,
  },
  {
    id: "e5",
    sender: "Mark Davis",
    senderAvatar: "MD",
    subject: "Absence Notification",
    preview: "I wanted to inform you that I will be absent next week due to...",
    timestamp: "1 week ago",
    isRead: true,
    isUnread: false,
  },
]

export default function MessagingView({ type }: MessagingViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const messages = type === "chats" ? mockChats : mockEmails
  const unreadCount = messages.filter(m => m.isUnread).length
  const icon = type === "chats" ? MessageSquare : Mail

  const filteredMessages = messages.filter(message =>
    message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const Icon = icon

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background">
      <div className="w-80 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                Unreads {unreadCount}
              </Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1",
                  selectedMessage?.id === message.id ? "bg-primary/10" : "hover:bg-muted/50",
                  !message.isRead && "bg-muted/30"
                )}
              >
                <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                  <AvatarFallback className={cn(
                    "text-xs font-medium",
                    !message.isRead ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {message.senderAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={cn(
                      "text-sm truncate",
                      !message.isRead ? "font-semibold text-foreground" : "font-normal text-foreground"
                    )}>
                      {message.sender}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className={cn(
                    "text-sm mb-1 truncate",
                    !message.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                  )}>
                    {message.subject}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {message.preview}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex-1 flex items-center justify-center bg-background">
        {selectedMessage ? (
          <div className="p-8 max-w-4xl w-full">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedMessage.senderAvatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedMessage.sender}</span>
                    <span>•</span>
                    <span>{selectedMessage.timestamp}</span>
                  </div>
                </div>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-foreground">{selectedMessage.preview}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Icon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No message selected
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a message from the list to view its contents
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
