import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  UserPlus,
  MoreVertical,
  MessageCircle,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Search
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { SendMessageModal } from "@/components/modals/SendMessageModal"

interface Student {
  id: string
  name: string
  email: string
  avatar?: string
  lastActive: string
  progress: number
}

export default function StudentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'lastActive' | 'progress'>('lastActive')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sendMessageModalOpen, setSendMessageModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const client = useApiClient()
  const navigate = useNavigate()

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await client.get('/students/')
        if (response.error) {
          throw new Error(response.error)
        }
        // Map API response to Student interface
        const studentsData = (response.data || []).map((student: any) => {
          const lastActiveDate = student.updated_at ? new Date(student.updated_at) : new Date()
          const now = new Date()
          const diffMs = now.getTime() - lastActiveDate.getTime()
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
          const diffDays = Math.floor(diffHours / 24)
          const diffWeeks = Math.floor(diffDays / 7)

          let lastActiveText = ''
          if (diffHours < 1) {
            lastActiveText = 'Just now'
          } else if (diffHours < 24) {
            lastActiveText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
          } else if (diffDays < 7) {
            lastActiveText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
          } else {
            lastActiveText = `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
          }

          return {
            id: student.clerk_id || student._id,
            name: student.name,
            email: student.email,
            avatar: student.avatar_url || undefined,
            lastActive: lastActiveText,
            progress: student.student_profile?.averageScore || Math.floor(Math.random() * 100)
          }
        })
        setStudents(studentsData)
      } catch (err: any) {
        console.error('Failed to fetch students:', err)
        setError(err.message || 'Failed to load students')
        toast.error('Failed to load students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Handle sorting
  const handleSort = (column: 'lastActive' | 'progress') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Filter students by search term
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower)
    )
  })

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'progress') {
      return sortOrder === 'asc' ? a.progress - b.progress : b.progress - a.progress
    }
    // For lastActive, we'll just use the original order for now
    return 0
  })

  // Pagination calculations
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStudents = sortedStudents.slice(startIndex, endIndex)

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return

    try {
      const response = await client.delete(`/students/${studentId}`)
      if (response.error) {
        throw new Error(response.error)
      }
      setStudents(students.filter(s => s.id !== studentId))
      toast.success('Student deleted successfully')
    } catch (err: any) {
      console.error('Failed to delete student:', err)
      toast.error('Failed to delete student')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">All Students</h2>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Student
              </Button>
            </div>
          </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Student Name
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        Email
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        <button
                          onClick={() => handleSort('lastActive')}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Last Active
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs">
                        <button
                          onClick={() => handleSort('progress')}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          Progress
                          <ArrowUpDown className="h-3 w-3" />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold text-muted-foreground uppercase text-xs text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      // Loading skeleton
                      Array.from({ length: 4 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                              <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted rounded w-40 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-2 bg-muted rounded w-full animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-8 w-8 bg-muted rounded animate-pulse ml-auto"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={student.avatar} alt={student.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.email}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {student.lastActive}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Progress value={student.progress} className="h-2 flex-1" />
                              <span className="text-sm text-muted-foreground min-w-[3ch]">
                                {student.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedStudent(student)
                                    setSendMessageModalOpen(true)
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Send a message
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    console.log('View details clicked for student:', student)
                                    navigate(`/dashboard/students/${student.id}`)
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteStudent(student.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedStudents.length)} of {sortedStudents.length} students
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return null
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>

      {/* Send Message Modal */}
      <SendMessageModal
        open={sendMessageModalOpen}
        onOpenChange={setSendMessageModalOpen}
        student={selectedStudent}
        onMessageSent={() => {
          toast.success('Message sent successfully')
        }}
      />
    </div>
  )
}
