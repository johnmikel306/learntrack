import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function SubjectPerformance() {
  const [currentMonth] = useState("October 2024")

  // Calendar data - October 2024
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
  const calendarDays = [
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true, isToday: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 31, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
  ]

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">Upcoming Deadlines</CardTitle>
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium text-foreground">{currentMonth}</p>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="space-y-3">
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
                  aspect-square flex items-center justify-center text-sm rounded-full transition-colors
                  ${!dayData.isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                  ${dayData.isToday ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted/50"}
                `}
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

