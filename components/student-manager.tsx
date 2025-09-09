"use client"

import { useState, useEffect } from "react"
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
import { api as apiClient } from "@/lib/api-client"

// --- NEW DATA STRUCTURES ---
interface StudentProfile {
  grade?: string
  subjects: string[]
  averageScore: number
  completionRate: number
  notes?: string
}

interface StudentUser {
  _id: string
  clerk_id: string
  name: string
  email: string
  role: "student"
  is_active: boolean
  tutor_id: string
  parent_ids: string[]
  student_profile: StudentProfile
  created_at: string
  last_login?: string
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
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentUser | null>(null)
  const ALL = "all"
  const [filterSubject, setFilterSubject] = useState(ALL)
  const [filterStatus, setFilterStatus] = useState(ALL)

  const [students, setStudents] = useState<StudentUser[]>([])
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [filterGrade, setFilterGrade] = useState(ALL)
  const [loading, setLoading] = useState(true)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get<StudentUser[]>('/students/')
      if (response.data) {
        setStudents(response.data)
      }
    } catch (e: any) {
      console.error('Failed to load students:', e)
      toast({ title: "Failed to load students", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])


  // Modal states
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [isEditingStudent, setIsEditingStudent] = useState<string | null>(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  
  const [editingStudentData, setEditingStudentData] = useState<Partial<StudentUser> | null>(null)

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English"]
  const grades = ["9th", "10th", "11th", "12th"]

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const profile = student.student_profile
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = filterSubject === ALL || profile.subjects.includes(filterSubject)
    const matchesStatus = filterStatus === ALL || (filterStatus === 'active' ? student.is_active : !student.is_active)
    const matchesGrade = filterGrade === ALL || profile.grade === filterGrade
    return matchesSearch && matchesSubject && matchesStatus && matchesGrade
  })

  // Student management functions
  const addStudent = async () => {
    if (!editingStudentData?.name || !editingStudentData?.email) return
    try {
      const payload = {
        ...editingStudentData,
        clerk_id: `user_${Math.random().toString(36).substr(2, 9)}`, // Mock clerk_id for new users
        role: 'student',
        student_profile: editingStudentData.student_profile || {}
      }
      const response = await apiClient.post('/students/', payload)
      if (response.data) {
        await fetchStudents() // Refetch the list
        setIsAddingStudent(false)
        setEditingStudentData(null)
        toast({ title: "Student created" })
      }
    } catch (e: any) {
      toast({ title: "Failed to create student", description: e.message, variant: "destructive" })
    }
  }

  const startEditingStudent = (student: StudentUser) => {
    setEditingStudentData({ ...student })
    setIsEditingStudent(student.clerk_id)
  }
  
  const startAddingStudent = () => {
    setEditingStudentData({
      name: "",
      email: "",
      student_profile: {
        grade: "",
        subjects: [],
        notes: "",
        averageScore: 0,
        completionRate: 0,
      }
    })
    setIsAddingStudent(true)
  }

  const saveEditedStudent = async () => {
    if (!editingStudentData?.clerk_id) return
    try {
      const response = await apiClient.put(`/students/${editingStudentData.clerk_id}`, editingStudentData)
      if (response.data) {
        await fetchStudents()
        setIsEditingStudent(null)
        setEditingStudentData(null)
        toast({ title: "Student updated" })
      }
    } catch (e: any) {
      toast({ title: "Failed to update student", description: e.message, variant: "destructive" })
    }
  }

  const deleteStudent = async (studentId: string) => {
    // This endpoint needs to be implemented in the backend based on the new schema
    toast({ title: "Delete functionality not yet implemented for new schema.", variant: "destructive" })
  }

  const getStudentInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleProfileChange = (field: keyof StudentProfile, value: any) => {
    if (editingStudentData) {
      setEditingStudentData(prev => ({
        ...prev,
        student_profile: {
          ...(prev?.student_profile as StudentProfile),
          [field]: value
        }
      }))
    }
  }

  const toggleSubjectForStudent = (subject: string) => {
    if (editingStudentData?.student_profile) {
      const currentSubjects = editingStudentData.student_profile.subjects || []
      const newSubjects = currentSubjects.includes(subject)
        ? currentSubjects.filter((s) => s !== subject)
        : [...currentSubjects, subject]
      handleProfileChange('subjects', newSubjects)
    }
  }

  if (loading) {
    return <div>Loading student data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-gray-600">Manage student profiles based on the new unified schema.</p>
        </div>
        <Button onClick={startAddingStudent}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {students.filter((s) => s.is_active).length} active
            </p>
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
                ? Math.round(students.reduce((acc, s) => acc + s.student_profile.averageScore, 0) / students.length)
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
                ? Math.round(students.reduce((acc, s) => acc + s.student_profile.completionRate, 0) / students.length)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Profiles</CardTitle>
          <CardDescription>
            Showing {filteredStudents.length} of {students.length} students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div key={student.clerk_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getStudentInitials(student.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        {student.student_profile.grade && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {student.student_profile.grade}
                          </Badge>
                        )}
                        <Badge
                          className={
                            student.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {student.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Subjects:{" "}
                        {student.student_profile.subjects.map((subject) => (
                          <Badge key={subject} variant="secondary" className="mr-1 text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEditingStudent(student)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
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
                          <AlertDialogAction onClick={() => deleteStudent(student.clerk_id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Student Dialog */}
      <Dialog open={isAddingStudent || isEditingStudent !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddingStudent(false)
          setIsEditingStudent(null)
          setEditingStudentData(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isAddingStudent ? 'Add New Student' : 'Edit Student Profile'}</DialogTitle>
          </DialogHeader>
          {editingStudentData && (
            <div className="space-y-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={editingStudentData.name || ""}
                  onChange={(e) => setEditingStudentData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editingStudentData.email || ""}
                  onChange={(e) => setEditingStudentData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>Grade/Level</Label>
                <Select
                  value={editingStudentData.student_profile?.grade || ""}
                  onValueChange={(value) => handleProfileChange('grade', value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subjects</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {subjects.map((subject) => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-subject-${subject}`}
                        checked={editingStudentData.student_profile?.subjects?.includes(subject)}
                        onCheckedChange={() => toggleSubjectForStudent(subject)}
                      />
                      <Label htmlFor={`edit-subject-${subject}`}>{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editingStudentData.student_profile?.notes || ""}
                  onChange={(e) => handleProfileChange('notes', e.target.value)}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsAddingStudent(false)
                  setIsEditingStudent(null)
                  setEditingStudentData(null)
                }}>
                  Cancel
                </Button>
                <Button onClick={isAddingStudent ? addStudent : saveEditedStudent}>
                  {isAddingStudent ? 'Add Student' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
