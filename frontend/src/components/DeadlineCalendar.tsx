import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useApiClient } from '@/lib/api-client'
import { toast } from "sonner"
import { CalendarDays } from 'lucide-react'

export function DeadlineCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
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
        // Don't show error toast to avoid annoying users
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAssignments, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Get assignments for selected date
  const selectedDateAssignments = assignments.filter(assignment => {
    if (!assignment.due_date || !selectedDate) return false
    const dueDate = new Date(assignment.due_date)
    const selected = new Date(selectedDate)
    return dueDate.toDateString() === selected.toDateString()
  })

  // Get dates with deadlines for highlighting
  const datesWithDeadlines = assignments
    .filter(a => a.due_date)
    .map(a => new Date(a.due_date))

  return (
    <Card className="border-0 shadow-sm bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Assignment Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{
                deadline: datesWithDeadlines
              }}
              modifiersClassNames={{
                deadline: 'bg-primary/20 font-bold text-primary'
              }}
              className="rounded-md border border-border"
            />

            {/* Show assignments for selected date */}
            {selectedDate && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                {selectedDateAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDateAssignments.map(assignment => (
                      <div key={assignment._id} className="p-3 bg-muted/50 rounded-md border border-border hover:bg-muted transition-colors">
                        <p className="font-medium text-sm text-foreground">{assignment.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {assignment.subject_id?.name || 'General'}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {new Date(assignment.due_date).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-md">
                    No assignments due on this date
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

