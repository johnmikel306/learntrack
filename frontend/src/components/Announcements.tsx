import { ChevronRight } from "lucide-react"

interface Announcement {
  id: string
  title: string
  description: string
  date: string
  type: "info" | "warning" | "success"
}

interface AnnouncementsProps {
  announcements?: Announcement[]
  isLoading?: boolean
}

const Announcements = ({ announcements = [], isLoading = false }: AnnouncementsProps) => {
  const getBackgroundColor = (type: string, index: number) => {
    const typeColors = {
      info: "bg-lamaSkyLight",
      warning: "bg-lamaYellowLight", 
      success: "bg-lamaPurpleLight"
    }
    
    if (type in typeColors) {
      return typeColors[type as keyof typeof typeColors]
    }
    
    // Fallback to alternating colors
    const colors = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"]
    return colors[index % colors.length]
  }

  // Default announcements if none provided
  const defaultAnnouncements: Announcement[] = [
    {
      id: "1",
      title: "Welcome to the new semester!",
      description: "We're excited to start this new academic year with enhanced learning tools and resources.",
      date: "2025-01-15",
      type: "info"
    },
    {
      id: "2", 
      title: "Assignment deadline reminder",
      description: "Don't forget to submit your assignments by the end of this week.",
      date: "2025-01-14",
      type: "warning"
    },
    {
      id: "3",
      title: "Great progress this month!",
      description: "Students have shown excellent improvement in their performance metrics.",
      date: "2025-01-13", 
      type: "success"
    }
  ]

  const displayAnnouncements = announcements.length > 0 ? announcements : defaultAnnouncements

  return (
    <div className="bg-white p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
          View All
        </span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          displayAnnouncements.map((announcement, index) => (
            <div
              key={announcement.id}
              className={`${getBackgroundColor(announcement.type, index)} rounded-md p-4 hover:shadow-sm transition-shadow cursor-pointer`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium text-gray-800">{announcement.title}</h2>
                <span className="text-xs text-gray-400 bg-white rounded-md px-2 py-1">
                  {new Date(announcement.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {announcement.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Announcements
