"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, CalendarIcon, Users, Clock, CheckCircle, XCircle, Archive } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"

interface Assignment {
  id: string
  title: string
  subject: string
  topic: string
  students: string[]
  dueDate: Date
  creationDate: Date
  questionCount: number
  status: "scheduled" | "active" | "completed" | "archived"
  completionRate: number
}

export default function AssignmentManager() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/assignments`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setAssignments(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false)
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    subject: "",
    topic: "",
    students: [] as string[],
    dueDate: new Date(),
    questionCount: 10,
  })

  const [filters, setFilters] = useState({
    status: "all",
    subject: "all",
    dateRange: {
      start: null,
      end: null,
    },
    searchTerm: "",
  })

  const students = [
    "Sarah Johnson",
    "Mike Chen",
    "Emma Davis",
    "John Smith",
    "Lisa Wang",
    "Alex Brown",
    "Sophie Wilson",
  ]
  const subjects = ["Mathematics", "Physics", "Chemistry"]
  const topics = {
    Mathematics: ["Algebra", "Geometry", "Calculus"],
    Physics: ["Mechanics", "Thermodynamics", "Optics"],
    Chemistry: ["Organic", "Inorganic", "Physical"],
  }

  const createAssignment = () => {
    if (newAssignment.title && newAssignment.subject && newAssignment.topic && newAssignment.students.length > 0) {
      const assignment: Assignment = {
        id: Date.now().toString(),
        ...newAssignment,
        status: "scheduled",
        completionRate: 0,
        creationDate: new Date(),
      }
      setAssignments([...assignments, assignment])
      setNewAssignment({
        title: "",
        subject: "",
        topic: "",
        students: [],
        dueDate: new Date(),
        questionCount: 10,
      })
      setIsCreatingAssignment(false)
    }
  }

  const toggleStudentSelection = (student: string) => {
    setNewAssignment((prev) => ({
      ...prev,
      students: prev.students.includes(student)
        ? prev.students.filter((s) => s !== student)
        : [...prev.students, student],
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "active":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "scheduled":
        return <CalendarIcon className="h-4 w-4 text-gray-600" />
      case "archived":
        return <Archive className="h-4 w-4 text-gray-400" />
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "scheduled":
        return "bg-gray-100 text-gray-800"
      case "archived":
        return "bg-gray-200 text-gray-600"
      default:
        return "bg-red-100 text-red-800"
    }
  }

  const handleArchiveAssignment = (id: string) => {
    setAssignments((prevAssignments) =>
      prevAssignments.map((assignment) => (assignment.id === id ? { ...assignment, status: "archived" } : assignment)),
    )
  }

  const filteredAssignments = assignments.filter((assignment) => {
    if (filters.status !== "all" && assignment.status !== filters.status) {
      return false
    }

    if (filters.subject !== "all" && assignment.subject !== filters.subject) {
      return false
    }

    if (filters.dateRange.start && assignment.dueDate < filters.dateRange.start) {
      return false
    }

    if (filters.dateRange.end && assignment.dueDate > filters.dateRange.end) {
      return false
    }

    if (filters.searchTerm && !assignment.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assignment Management</CardTitle>
              <CardDescription>Create and manage student assignments</CardDescription>
            </div>
            <Dialog open={isCreatingAssignment} onOpenChange={setIsCreatingAssignment}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Assignment</DialogTitle>
                  <DialogDescription>Set up a new assignment for your students</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="assignment-title">Assignment Title</Label>
                    <Input
                      id="assignment-title"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                      placeholder="e.g., Algebra Practice Set 1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subject</Label>
                      <Select
                        value={newAssignment.subject}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, subject: value, topic: "" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Topic</Label>
                      <Select
                        value={newAssignment.topic}
                        onValueChange={(value) => setNewAssignment({ ...newAssignment, topic: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {newAssignment.subject &&
                            topics[newAssignment.subject as keyof typeof topics]?.map((topic) => (
                              <SelectItem key={topic} value={topic}>
                                {topic}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Select Students</Label>
                    <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {students.map((student) => (
                          <div key={student} className="flex items-center space-x-2">
                            <Checkbox
                              id={student}
                              checked={newAssignment.students.includes(student)}
                              onCheckedChange={() => toggleStudentSelection(student)}
                            />
                            <Label htmlFor={student} className="text-sm font-normal">
                              {student}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{newAssignment.students.length} student(s) selected</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Due Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-transparent"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(newAssignment.dueDate, "PPP")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={newAssignment.dueDate}
                            onSelect={(date) => date && setNewAssignment({ ...newAssignment, dueDate: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label htmlFor="question-count">Number of Questions</Label>
                      <Input
                        id="question-count"
                        type="number"
                        value={newAssignment.questionCount}
                        onChange={(e) =>
                          setNewAssignment({ ...newAssignment, questionCount: Number.parseInt(e.target.value) || 10 })
                        }
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreatingAssignment(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createAssignment}>Create Assignment</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtering and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div>
              <Label>Subject</Label>
              <Select value={filters.subject} onValueChange={(value) => setFilters({ ...filters, subject: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter (Basic - can be expanded with a date range picker) */}
            <div>
              <Label>Date Range</Label>
              {/* Placeholder for date range picker */}
              <Input type="text" placeholder="Date Range (Coming Soon)" disabled />
            </div>

            {/* Search Filter */}
            <div>
              <Label>Search</Label>
              <Input
                type="text"
                placeholder="Search assignments..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(assignment.status)}
                      <h3 className="font-semibold">{assignment.title}</h3>
                      <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>
                        {assignment.subject} • {assignment.topic}
                      </span>
                      <span>{assignment.questionCount} questions</span>
                      <span>Due: {format(assignment.dueDate, "MMM dd, yyyy")}</span>
                      <span>Created: {format(assignment.creationDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{assignment.students.length} students assigned</span>
                    </div>
                    {assignment.status === "active" && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${assignment.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{assignment.completionRate}% completed</span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                    {assignment.status !== "archived" && (
                      <Button size="sm" variant="outline" onClick={() => handleArchiveAssignment(assignment.id)}>
                        Archive
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
