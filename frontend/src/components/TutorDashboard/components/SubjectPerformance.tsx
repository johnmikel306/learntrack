import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useApiClient } from "@/lib/api-client"

interface CalendarDay {
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  hasDeadline: boolean
  date: Date
}

export function SubjectPerformance() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const client = useApiClient()

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)
        const response = await client.get('/assignments/')

        if (response.error) {
          throw new Error(response.error)
        }

        setAssignments((response.data as any[]) || [])
      } catch (err: any) {
        console.error('Failed to fetch assignments:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()

    // Refresh every 5 minutes
    const interval = setInterval(fetchAssignments, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  // Generate calendar days for current month
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    const firstDayOfWeek = firstDay.getDay()

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    const lastDate = lastDay.getDate()

    // Previous month's last date
    const prevMonthLastDay = new Date(year, month, 0)
    const prevMonthLastDate = prevMonthLastDay.getDate()

    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get assignment deadlines for highlighting
    const deadlineDates = new Set(
      assignments
        .filter(a => a.due_date)
        .map(a => {
          const date = new Date(a.due_date)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
    )

    // Previous month's days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDate - i
      const date = new Date(year, month - 1, day)
      date.setHours(0, 0, 0, 0)
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        hasDeadline: deadlineDates.has(date.getTime()),
        date
      })
    }

    // Current month's days
    for (let day = 1; day <= lastDate; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      const isToday = date.getTime() === today.getTime()
      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        hasDeadline: deadlineDates.has(date.getTime()),
        date
      })
    }

    // Next month's days to fill the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      date.setHours(0, 0, 0, 0)
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        hasDeadline: deadlineDates.has(date.getTime()),
        date
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const currentMonthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`

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

  if (loading) {
    return (
      <Card className="border-0 shadow-sm bg-card h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">Upcoming Deadlines</CardTitle>
          <div className="flex items-center justify-between mt-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-medium text-foreground">Loading...</p>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-6 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm bg-card h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Upcoming Deadlines</CardTitle>
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium text-foreground">{currentMonthYear}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-6 flex-1 flex items-center">
        <div className="space-y-3 w-full">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayData, index) => (
              <button
                key={index}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-full transition-all duration-200
                  ${!dayData.isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                  ${dayData.isToday ? "bg-primary text-primary-foreground font-semibold ring-2 ring-primary ring-offset-2" : ""}
                  ${dayData.hasDeadline && !dayData.isToday ? "bg-primary/20 font-bold text-primary" : ""}
                  ${!dayData.isToday && !dayData.hasDeadline ? "hover:bg-muted/50" : ""}
                `}
                title={dayData.hasDeadline ? "Has assignment deadline" : ""}
              >
                {dayData.day}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

