import { Bell, AlertCircle } from "lucide-react"
import { useAnnouncements } from "@/hooks/useQueries"

interface Announcement {
  id: string
  title: string
  description: string
  date: string
  type: "info" | "warning" | "success"
}

const Announcements = () => {
  const { data: announcements, isLoading, isError } = useAnnouncements()

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

  // Transform API data to Announcement format
  const displayAnnouncements: Announcement[] = (announcements || []).map((item: any) => ({
    id: item._id || item.id,
    title: item.title || item.message || 'Notification',
    description: item.description || item.message || '',
    date: item.created_at || item.date || new Date().toISOString(),
    type: item.type || 'info'
  }))

  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Announcements</h1>
        <span className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
          View All
        </span>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 dark:bg-slate-800 rounded-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Failed to load announcements</p>
          </div>
        ) : displayAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No announcements</p>
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
