"use client"

import { useState, useEffect } from "react"
import { useStudents, useCreateStudent, useMutation } from "@/hooks/use-api"
import { useApiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Target,
  TrendingUp,
  BookOpen,
  UserPlus,
  Search,
  Eye,
  Filter,
  Clock,
  GraduationCap,
  Activity,
} from "lucide-react"
import { format } from "date-fns"

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  grade?: string
  subjects: string[]
  enrollmentDate: Date
  status: "active" | "inactive"
  parentEmail?: string
  parentPhone?: string
  averageScore: number
  completionRate: number
  totalAssignments: number
  completedAssignments: number
  lastActivity?: Date
  notes?: string
}

interface StudentGroup {
  id: string
  name: string
  description: string
  studentIds: string[]
  subjects: string[]
  createdDate: Date
  color: string
}

export default function StudentManager() {
  const [activeTab, setActiveTab] = useState("students")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null)
  const ALL = "all"
  const [filterSubject, setFilterSubject] = useState(ALL)
  const [filterStatus, setFilterStatus] = useState(ALL)

  // Use authenticated API hooks
  const { data: studentsData, loading, error, refetch } = useStudents()
  const { mutate: createStudentMutation } = useCreateStudent()
  const apiClient = useApiClient()

  // Local state for UI
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [filterGrade, setFilterGrade] = useState(ALL)

  // Update local state when API data changes
  useEffect(() => {
    if (studentsData) {
      setStudents(studentsData)
    }
  }, [studentsData])

  // Modal states
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [isEditingStudent, setIsEditingStudent] = useState<string | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [contactDraft, setContactDraft] = useState<{ channel: "email" | "sms"; toEmail?: string; toPhone?: string; subject?: string; body: string }>({ channel: "email", body: "" })

  const openContactModal = (student: Student) => {
    setSelectedStudentForDetails(student)
    setContactDraft({
      channel: student.parentEmail ? "email" : "sms",
      toEmail: student.parentEmail,
      toPhone: student.parentPhone,
      subject: `Update about ${student.name}`,
      body: `Hello${student.parentEmail ? "" : ""},\n\nI wanted to share an update about ${student.name}'s recent progress...`,
    })
    setContactOpen(true)
  }

  const sendContactMessage = async () => {
    try {
      const response = await apiClient.post('/communications/send', {
        student_id: selectedStudentForDetails?.id,
        to_email: contactDraft.channel === "email" ? contactDraft.toEmail : undefined,
        to_phone: contactDraft.channel === "sms" ? contactDraft.toPhone : undefined,
        channel: contactDraft.channel,
        subject: contactDraft.subject,
        body: contactDraft.body,
      })

      if (response.data) {
        setContactOpen(false)
        toast({ title: "Message sent", description: "Your message has been queued for delivery." })
      }
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message })
    }
  }
  const [isEditingGroup, setIsEditingGroup] = useState<StudentGroup | null>(null)

  // Form states
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    subjects: [] as string[],
    parentEmail: "",
    parentPhone: "",
    notes: "",
  })

  const [editingStudentData, setEditingStudentData] = useState<Student | null>(null)

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    studentIds: [] as string[],
    subjects: [] as string[],
    color: "blue",
  })

  // Load groups from API (students are loaded via useStudents hook)
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await apiClient.get<StudentGroup[]>('/students/groups')
        if (response.data) {
          setGroups(response.data)
        }
      } catch (e: any) {
        console.error('Failed to load groups:', e)
        // Groups are optional, so don't show error toast
      }
    }
    loadGroups()
  }, [])


  const subjects = ["Mathematics", "Physics", "Chemistry"]
  const groupColors = ["blue", "green", "purple", "orange", "red", "pink"]
  const grades = ["Grade 9", "Grade 10", "Grade 11", "Grade 12"]

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = filterSubject === ALL || student.subjects.includes(filterSubject)
    const matchesStatus = filterStatus === ALL || student.status === filterStatus
    const matchesGrade = filterGrade === ALL || student.grade === filterGrade
    return matchesSearch && matchesSubject && matchesStatus && matchesGrade
  })

  // Student management functions (Authenticated API)
  const addStudent = async () => {
    if (!(newStudent.name && newStudent.email)) return
    try {
      const created = await createStudentMutation(newStudent)
      if (created) {
        setStudents((prev) => [created, ...prev])
        resetNewStudent()
        setIsAddingStudent(false)
        toast({ title: "Student created" })
      }
    } catch (e: any) {
      toast({ title: "Failed to create student", description: e.message })
    }
  }

  const startEditingStudent = (student: Student) => {
    setEditingStudentData({ ...student })
    setIsEditingStudent(student.id)
  }

  const saveEditedStudent = async () => {
    if (!editingStudentData) return
    try {
      const response = await apiClient.put(`/students/${editingStudentData.id}`, editingStudentData)
      if (response.data) {
        setStudents((prev) => prev.map((s) => (s.id === response.data.id ? response.data : s)))
        setIsEditingStudent(null)
        setEditingStudentData(null)
        toast({ title: "Student updated" })
      }
    } catch (e: any) {
      toast({ title: "Failed to update student", description: e.message })
    }
  }

  const deleteStudent = async (studentId: string) => {
    try {
      // Validate studentId
      if (!studentId) {
        toast({ title: "Error", description: "Invalid student ID" })
        return
      }

      // Find the student to get their name for confirmation
      const student = students.find(s => s.id === studentId)
      const studentName = student?.name || "Unknown Student"

      // Call the API to delete the student
      const response = await apiClient.delete(`/students/${studentId}`)

      // Only update local state if the API call was successful
      setStudents((prev) => {
        const filtered = prev.filter((s) => s.id !== studentId)
        console.log(`Removed student ${studentId} from local state. Remaining students:`, filtered.length)
        return filtered
      })

      // Also remove from groups
      setGroups((prev) => prev.map((g) => ({
        ...g,
        studentIds: g.studentIds.filter((id) => id !== studentId)
      })))

      toast({
        title: "Student deleted",
        description: `${studentName} has been successfully removed from the system.`
      })

    } catch (e: any) {
      console.error("Delete student error:", e)
      toast({
        title: "Failed to delete student",
        description: e.message || "An unexpected error occurred while deleting the student."
      })
    }
  }

  const resetNewStudent = () => {
    setNewStudent({
      name: "",
      email: "",
      phone: "",
      grade: "",
      subjects: [],
      parentEmail: "",
      parentPhone: "",
      notes: "",
    })
  }

  // Group management functions
  const createGroup = () => {
    if (newGroup.name && newGroup.studentIds.length > 0) {
      const group: StudentGroup = {
        id: Date.now().toString(),
        ...newGroup,
        createdDate: new Date(),
      }
      setGroups([...groups, group])
      setNewGroup({
        name: "",
        description: "",
        studentIds: [],
        subjects: [],
        color: "blue",
      })
      setIsCreatingGroup(false)
    }
  }

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId))
  }

  const startEditingGroup = (group: StudentGroup) => {
    setIsEditingGroup(group)
  }

  const saveEditedGroup = () => {
    if (isEditingGroup) {
      setGroups(groups.map((g) => (g.id === isEditingGroup.id ? isEditingGroup : g)))
      setIsEditingGroup(null)
    }
  }

  // Toggle functions
  const toggleSubjectForStudent = (subject: string) => {
    if (editingStudentData) {
      setEditingStudentData({
        ...editingStudentData,
        subjects: editingStudentData.subjects.includes(subject)
          ? editingStudentData.subjects.filter((s) => s !== subject)
          : [...editingStudentData.subjects, subject],
      })
    } else {
      setNewStudent((prev) => ({
        ...prev,
        subjects: prev.subjects.includes(subject)
          ? prev.subjects.filter((s) => s !== subject)
          : [...prev.subjects, subject],
      }))
    }
  }

  const toggleSubjectForGroup = (subject: string) => {
    setNewGroup((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  const toggleStudentForGroup = (studentId: string) => {
    setNewGroup((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter((id) => id !== studentId)
        : [...prev.studentIds, studentId],
    }))
  }

  const getStudentInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getActivityStatus = (lastActivity?: Date) => {
    if (!lastActivity) return { status: "Never", color: "text-gray-500" }

    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return { status: "Today", color: "text-green-600" }
    if (diffInDays === 1) return { status: "Yesterday", color: "text-green-500" }
    if (diffInDays <= 7) return { status: `${diffInDays} days ago`, color: "text-yellow-600" }
    if (diffInDays <= 30) return { status: `${diffInDays} days ago`, color: "text-orange-600" }
    return { status: `${diffInDays} days ago`, color: "text-red-600" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-gray-600">Manage student profiles and groups</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Create a comprehensive student profile</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <Label>Grade/Level</Label>
                    <Select
                      value={newStudent.grade}
                      onValueChange={(value) => setNewStudent({ ...newStudent, grade: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                      placeholder="student@email.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <Label>Subjects</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {subjects.map((subject) => (
                      <div key={subject} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-subject-${subject}`}
                          checked={newStudent.subjects.includes(subject)}
                          onCheckedChange={() => toggleSubjectForStudent(subject)}
                        />
                        <Label htmlFor={`new-subject-${subject}`}>{subject}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Parent Email</Label>
                    <Input
                      type="email"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                      placeholder="parent@email.com"
                    />
                  </div>
                  <div>
                    <Label>Parent Phone</Label>
                    <Input
                      value={newStudent.parentPhone}
                      onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newStudent.notes}
                    onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                    placeholder="Additional notes about the student..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingStudent(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addStudent} disabled={!newStudent.name || !newStudent.email}>
                    Add Student
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {students.filter((s) => s.status === "active").length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Groups</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">Active learning groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0
                ? Math.round(students.reduce((acc, s) => acc + s.averageScore, 0) / students.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0
                ? Math.round(students.reduce((acc, s) => acc + s.completionRate, 0) / students.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-6">
          {/* Enhanced Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex-1 min-w-64 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All Subjects</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterGrade} onValueChange={setFilterGrade}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All Grades</SelectItem>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streamlined Students List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Profiles</CardTitle>
                  <CardDescription>
                    Showing {filteredStudents.length} of {students.length} students
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  const activityStatus = getActivityStatus(student.lastActivity)
                  return (
                    <div key={student.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={`/placeholder.svg?height=40&width=40&text=${getStudentInitials(student.name)}`}
                            />
                            <AvatarFallback>{getStudentInitials(student.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{student.name}</h3>
                              {student.grade && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {student.grade}
                                </Badge>
                              )}
                              <Badge
                                className={
                                  student.status === "active"
                                    ? "bg-green-100 text-green-800 flex items-center gap-1"
                                    : "bg-gray-100 text-gray-800 flex items-center gap-1"
                                }
                              >
                                <Activity className="h-3 w-3" />
                                {student.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last active: <span className={activityStatus.color}>{activityStatus.status}</span>
                              </span>
                              <span>
                                Subjects:{" "}
                                {student.subjects.map((subject) => (
                                  <Badge key={subject} variant="secondary" className="mr-1 text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedStudentForDetails(student)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View More
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => startEditingStudent(student)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openContactModal(student)}>
                            <Mail className="h-4 w-4 mr-1" />
                            Contact Parent
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {student.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteStudent(student.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No students found matching your criteria.</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Groups</CardTitle>
                  <CardDescription>Organize students into groups for targeted assignments</CardDescription>
                </div>
                <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Student Group</DialogTitle>
                      <DialogDescription>Group students for targeted learning</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Group Name *</Label>
                          <Input
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                            placeholder="e.g., Advanced Mathematics"
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <Select
                            value={newGroup.color}
                            onValueChange={(value) => setNewGroup({ ...newGroup, color: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {groupColors.map((color) => (
                                <SelectItem key={color} value={color}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                                    <span className="capitalize">{color}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newGroup.description}
                          onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                          placeholder="Brief description of the group"
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Subjects</Label>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {subjects.map((subject) => (
                            <div key={subject} className="flex items-center space-x-2">
                              <Checkbox
                                id={`group-subject-${subject}`}
                                checked={newGroup.subjects.includes(subject)}
                                onCheckedChange={() => toggleSubjectForGroup(subject)}
                              />
                              <Label htmlFor={`group-subject-${subject}`}>{subject}</Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Select Students *</Label>
                        <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                          <div className="space-y-2">
                            {students
                              .filter((s) => s.status === "active")
                              .map((student) => (
                                <div key={student.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`group-student-${student.id}`}
                                    checked={newGroup.studentIds.includes(student.id)}
                                    onCheckedChange={() => toggleStudentForGroup(student.id)}
                                  />
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getStudentInitials(student.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Label htmlFor={`group-student-${student.id}`} className="text-sm font-normal">
                                    {student.name} ({student.subjects.join(", ")})
                                  </Label>
                                </div>
                              ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{newGroup.studentIds.length} student(s) selected</p>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createGroup} disabled={!newGroup.name || newGroup.studentIds.length === 0}>
                          Create Group
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {groups.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-4 h-4 rounded-full bg-${group.color}-500`}></div>
                          <h3 className="font-semibold">{group.name}</h3>
                          <Badge variant="outline">{group.studentIds.length} students</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Created: {format(group.createdDate, "MMM dd, yyyy")}</span>
                          <span>
                            Subjects:{" "}
                            {group.subjects.map((subject) => (
                              <Badge key={subject} variant="secondary" className="mr-1">
                                {subject}
                              </Badge>
                            ))}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditingGroup(group)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the group "{group.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteGroup(group.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Group Members:</h4>
                      <div className="flex flex-wrap gap-2">
                        {group.studentIds.map((studentId) => {
                          const student = students.find((s) => s.id === studentId)
                          return student ? (
                            <div key={studentId} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">{getStudentInitials(student.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{student.name}</span>
                            </div>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {groups.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No student groups created yet.</p>
                    <p className="text-sm">Create your first group to organize students for targeted learning.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Details Modal */}
      <Dialog
        open={selectedStudentForDetails !== null}
        onOpenChange={(open) => !open && setSelectedStudentForDetails(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Student Details
            </DialogTitle>
            <DialogDescription>Comprehensive view of student information and performance</DialogDescription>
          </DialogHeader>
          {selectedStudentForDetails && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={`/placeholder.svg?height=64&width=64&text=${getStudentInitials(selectedStudentForDetails.name)}`}
                  />
                  <AvatarFallback className="text-lg">
                    {getStudentInitials(selectedStudentForDetails.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold">{selectedStudentForDetails.name}</h2>
                    {selectedStudentForDetails.grade && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {selectedStudentForDetails.grade}
                      </Badge>
                    )}
                    <Badge
                      className={
                        selectedStudentForDetails.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {selectedStudentForDetails.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Enrolled: {format(selectedStudentForDetails.enrollmentDate, "MMM dd, yyyy")}
                    {selectedStudentForDetails.lastActivity && (
                      <span className="ml-4">
                        Last active: {format(selectedStudentForDetails.lastActivity, "MMM dd, yyyy")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedStudentForDetails.email}</span>
                      </div>
                      {selectedStudentForDetails.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{selectedStudentForDetails.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedStudentForDetails.parentEmail || selectedStudentForDetails.parentPhone) && (
                    <div>
                      <h3 className="font-semibold mb-2">Parent/Guardian Contact</h3>
                      <div className="space-y-2 text-sm">
                        {selectedStudentForDetails.parentEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>{selectedStudentForDetails.parentEmail}</span>
                          </div>
                        )}
                        {selectedStudentForDetails.parentPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{selectedStudentForDetails.parentPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold mb-2">Subjects</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedStudentForDetails.subjects.map((subject) => (
                        <Badge key={subject} variant="secondary">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Performance Overview</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="text-sm text-gray-600">{selectedStudentForDetails.averageScore}%</span>
                        </div>
                        <Progress value={selectedStudentForDetails.averageScore} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Completion Rate</span>
                          <span className="text-sm text-gray-600">{selectedStudentForDetails.completionRate}%</span>
                        </div>
                        <Progress value={selectedStudentForDetails.completionRate} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">Assignment Progress</span>
                          <span className="text-sm text-gray-600">
                            {selectedStudentForDetails.completedAssignments}/
                            {selectedStudentForDetails.totalAssignments}
                          </span>
                        </div>
                        <Progress
                          value={
                            selectedStudentForDetails.totalAssignments > 0
                              ? (selectedStudentForDetails.completedAssignments /
                                  selectedStudentForDetails.totalAssignments) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedStudentForDetails.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    {selectedStudentForDetails.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedStudentForDetails(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    startEditingStudent(selectedStudentForDetails)
                    setSelectedStudentForDetails(null)
                  }}
                >
                  Edit Student
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditingStudent !== null} onOpenChange={(open) => !open && setIsEditingStudent(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
            <DialogDescription>Update student information and settings</DialogDescription>
          </DialogHeader>
          {editingStudentData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={editingStudentData.name}
                    onChange={(e) => setEditingStudentData({ ...editingStudentData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Grade/Level</Label>
                  <Select
                    value={editingStudentData.grade || ""}
                    onValueChange={(value) => setEditingStudentData({ ...editingStudentData, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={editingStudentData.email}
                    onChange={(e) => setEditingStudentData({ ...editingStudentData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editingStudentData.phone || ""}
                    onChange={(e) => setEditingStudentData({ ...editingStudentData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Subjects</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {subjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-subject-${subject}`}
                        checked={editingStudentData.subjects.includes(subject)}
                        onCheckedChange={() => toggleSubjectForStudent(subject)}
                      />
                      <Label htmlFor={`edit-subject-${subject}`}>{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Parent Email</Label>
                  <Input
                    type="email"
                    value={editingStudentData.parentEmail || ""}
                    onChange={(e) => setEditingStudentData({ ...editingStudentData, parentEmail: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Parent Phone</Label>
                  <Input
                    value={editingStudentData.parentPhone || ""}
                    onChange={(e) => setEditingStudentData({ ...editingStudentData, parentPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={editingStudentData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setEditingStudentData({ ...editingStudentData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editingStudentData.notes || ""}
                  onChange={(e) => setEditingStudentData({ ...editingStudentData, notes: e.target.value })}
                  placeholder="Additional notes about the student..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditingStudent(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedStudent} disabled={!editingStudentData.name || !editingStudentData.email}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={isEditingGroup !== null} onOpenChange={(open) => !open && setIsEditingGroup(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Student Group</DialogTitle>
            <DialogDescription>Update the details for this group</DialogDescription>
          </DialogHeader>
          {isEditingGroup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Group Name *</Label>
                  <Input
                    value={isEditingGroup.name}
                    onChange={(e) => setIsEditingGroup({ ...isEditingGroup, name: e.target.value })}
                    placeholder="e.g., Advanced Mathematics"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Select
                    value={isEditingGroup.color}
                    onValueChange={(value) => setIsEditingGroup({ ...isEditingGroup, color: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full bg-${color}-500`}></div>
                            <span className="capitalize">{color}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={isEditingGroup.description}
                  onChange={(e) => setIsEditingGroup({ ...isEditingGroup, description: e.target.value })}
                  placeholder="Brief description of the group"
                  rows={2}
                />
              </div>

              <div>
                <Label>Subjects</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {subjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-group-subject-${subject}`}
                        checked={isEditingGroup.subjects.includes(subject)}
                        onCheckedChange={() => {
                          const newSubjects = isEditingGroup.subjects.includes(subject)
                            ? isEditingGroup.subjects.filter((s) => s !== subject)
                            : [...isEditingGroup.subjects, subject]
                          setIsEditingGroup({ ...isEditingGroup, subjects: newSubjects })
                        }}
                      />
                      <Label htmlFor={`edit-group-subject-${subject}`}>{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Select Students *</Label>
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    {students
                      .filter((s) => s.status === "active")
                      .map((student) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-group-student-${student.id}`}
                            checked={isEditingGroup.studentIds.includes(student.id)}
                            onCheckedChange={() => {
                              const newStudentIds = isEditingGroup.studentIds.includes(student.id)
                                ? isEditingGroup.studentIds.filter((id) => id !== student.id)
                                : [...isEditingGroup.studentIds, student.id]
                              setIsEditingGroup({ ...isEditingGroup, studentIds: newStudentIds })
                            }}
                          />
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{getStudentInitials(student.name)}</AvatarFallback>
                          </Avatar>
                          <Label htmlFor={`edit-group-student-${student.id}`} className="text-sm font-normal">
                            {student.name} ({student.subjects.join(", ")})
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{isEditingGroup.studentIds.length} student(s) selected</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditingGroup(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedGroup}
                  disabled={!isEditingGroup.name || isEditingGroup.studentIds.length === 0}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Parent Modal */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Parent/Guardian</DialogTitle>
            <DialogDescription>Send a quick update about the student's progress or behavior.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Channel</Label>
                <Select value={contactDraft.channel} onValueChange={(v: any) => setContactDraft((d) => ({ ...d, channel: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {contactDraft.channel === "email" ? (
                <div>
                  <Label>To Email</Label>
                  <Input value={contactDraft.toEmail || ""} onChange={(e) => setContactDraft((d) => ({ ...d, toEmail: e.target.value }))} />
                </div>
              ) : (
                <div>
                  <Label>To Phone</Label>
                  <Input value={contactDraft.toPhone || ""} onChange={(e) => setContactDraft((d) => ({ ...d, toPhone: e.target.value }))} />
                </div>
              )}
            </div>
            {contactDraft.channel === "email" && (
              <div>
                <Label>Subject</Label>
                <Input value={contactDraft.subject || ""} onChange={(e) => setContactDraft((d) => ({ ...d, subject: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea rows={6} value={contactDraft.body} onChange={(e) => setContactDraft((d) => ({ ...d, body: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button>
              <Button onClick={sendContactMessage} disabled={contactDraft.channel === "email" ? !contactDraft.toEmail : !contactDraft.toPhone}>Send Message</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
