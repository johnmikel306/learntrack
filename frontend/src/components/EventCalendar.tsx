import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

interface Event {
  id: string
  title: string
  date: string
  time: string
  type: "assignment" | "meeting" | "deadline"
}

interface EventCalendarProps {
  events?: Event[]
  isLoading?: boolean
}

const EventCalendar = ({ events = [], isLoading = false }: EventCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Default events if none provided
  const defaultEvents: Event[] = [
    {
      id: "1",
      title: "Math Assignment Due",
      date: "2025-01-20",
      time: "11:59 PM",
      type: "deadline"
    },
    {
      id: "2",
      title: "Parent-Teacher Meeting",
      date: "2025-01-22",
      time: "2:00 PM",
      type: "meeting"
    },
    {
      id: "3",
      title: "Science Project",
      date: "2025-01-25",
      time: "9:00 AM",
      type: "assignment"
    }
  ]

  const displayEvents = events.length > 0 ? events : defaultEvents

  const getEventColor = (type: string) => {
    switch (type) {
      case "assignment":
        return "bg-lamaSkyLight border-l-4 border-lamaSky"
      case "meeting":
        return "bg-lamaPurpleLight border-l-4 border-lamaPurple"
      case "deadline":
        return "bg-lamaYellowLight border-l-4 border-lamaYellow"
      default:
        return "bg-gray-50 border-l-4 border-gray-300"
    }
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  return (
    <div className="bg-white p-4 rounded-md">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Events
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-md p-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : displayEvents.length > 0 ? (
          displayEvents.map((event) => (
            <div
              key={event.id}
              className={`${getEventColor(event.type)} rounded-md p-3 hover:shadow-sm transition-shadow cursor-pointer`}
            >
              <h3 className="font-medium text-gray-800 text-sm">{event.title}</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-500">{event.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No events scheduled</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventCalendar
