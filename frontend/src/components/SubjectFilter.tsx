import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BookOpen } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface Subject {
  _id: string
  name: string
  description?: string
  studentCount?: number
}

interface SubjectFilterProps {
  selectedSubject: string
  onChange: (subjectId: string) => void
  onStudentCountChange?: (count: number) => void
  showStudentCount?: boolean
}

export default function SubjectFilter({ 
  selectedSubject, 
  onChange, 
  onStudentCountChange,
  showStudentCount = true 
}: SubjectFilterProps) {
  const { getToken } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchSubjects()
    if (showStudentCount) {
      fetchStudentCounts()
    }
  }, [])

  useEffect(() => {
    // Update student count when selection changes
    if (selectedSubject && studentCounts[selectedSubject] !== undefined) {
      onStudentCountChange?.(studentCounts[selectedSubject])
    } else {
      onStudentCountChange?.(0)
    }
  }, [selectedSubject, studentCounts])

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/subjects/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentCounts = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/students/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const students = await response.json()
        
        // Count students per subject
        const counts: Record<string, number> = {}
        students.forEach((student: any) => {
          if (student.subjects && Array.isArray(student.subjects)) {
            student.subjects.forEach((subjectId: string) => {
              counts[subjectId] = (counts[subjectId] || 0) + 1
            })
          }
        })
        
        setStudentCounts(counts)
      }
    } catch (error) {
      console.error('Failed to fetch student counts:', error)
    }
  }

  const selectedSubjectData = subjects.find(s => s._id === selectedSubject)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Assign by Subject
        </p>
        {selectedSubject && (
          <button
            onClick={() => onChange('')}
            className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            Clear
          </button>
        )}
      </div>

      <Select value={selectedSubject} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading subjects..." : "Select a subject"} />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((subject) => (
            <SelectItem key={subject._id} value={subject._id}>
              <div className="flex items-center justify-between w-full">
                <span>{subject.name}</span>
                {showStudentCount && studentCounts[subject._id] !== undefined && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {studentCounts[subject._id]} students
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedSubject && selectedSubjectData && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <div className="flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {selectedSubjectData.name}
              </p>
              {selectedSubjectData.description && (
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  {selectedSubjectData.description}
                </p>
              )}
              {showStudentCount && studentCounts[selectedSubject] !== undefined && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Will be assigned to <strong>{studentCounts[selectedSubject]}</strong> student
                  {studentCounts[selectedSubject] !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <div className="text-center py-4 text-gray-500 dark:text-slate-400">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No subjects found</p>
        </div>
      )}
    </div>
  )
}

