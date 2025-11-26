import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import {
  Upload,
  Trash2,
  Edit,
  Share2,
  MoreVertical,
} from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface Material {
  _id: string
  title: string
  description?: string
  material_type: 'pdf' | 'doc' | 'video' | 'link' | 'image' | 'other'
  file_url?: string
  file_size?: number
  subject_id?: string
  topic?: string
  tags: string[]
  status: 'active' | 'archived' | 'draft'
  view_count: number
  download_count: number
  created_at: string
  shared_with_students: boolean
}

interface Subject {
  _id: string
  name: string
}

// Helper function to get subject badge color
const getSubjectColor = (subject: string) => {
  const colors: Record<string, string> = {
    'Mathematics': 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0',
    'History': 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-0',
    'Science': 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-0',
    'Literature': 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-0',
    'Physics': 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0',
    'Chemistry': 'bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border-0',
    'Biology': 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0',
    'Geography': 'bg-teal-100 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-0',
  }
  return colors[subject] || 'bg-muted text-muted-foreground border-0'
}

export default function MaterialManager() {
  const { getToken } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'pdf' as Material['material_type'],
    file_url: '',
    subject_id: '',
    topic: '',
    tags: '',
    shared_with_students: true
  })

  useEffect(() => {
    fetchMaterials()
    fetchSubjects()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/materials/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMaterials(data)
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/subjects/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSubjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  const handleCreateMaterial = async () => {
    try {
      const token = await getToken()
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      }

      const response = await fetch(`${API_BASE_URL}/materials/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        toast.success('Material created successfully')
        setIsCreateDialogOpen(false)
        setFormData({
          title: '',
          description: '',
          material_type: 'pdf',
          file_url: '',
          subject_id: '',
          topic: '',
          tags: '',
          shared_with_students: true
        })
        fetchMaterials()
      } else {
        toast.error('Failed to create material')
      }
    } catch (error) {
      console.error('Failed to create material:', error)
      toast.error('Failed to create material')
    }
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Material deleted')
        fetchMaterials()
      } else {
        toast.error('Failed to delete material')
      }
    } catch (error) {
      console.error('Failed to delete material:', error)
      toast.error('Failed to delete material')
    }
  }

  const filteredMaterials = materials.filter(material => {
    const matchesType = typeFilter === 'all' || material.material_type === typeFilter
    const matchesSubject = subjectFilter === 'all' || material.subject_id === subjectFilter

    return matchesType && matchesSubject && material.status === 'active'
  })

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    return a.title.localeCompare(b.title)
  })

  // Get subject name by ID
  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'N/A'
    const subject = subjects.find(s => s._id === subjectId)
    return subject?.name || 'Unknown'
  }

  // Toggle material selection
  const toggleMaterialSelection = (id: string) => {
    const newSelected = new Set(selectedMaterials)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMaterials(newSelected)
  }

  // Toggle all materials
  const toggleAllMaterials = () => {
    if (selectedMaterials.size === sortedMaterials.length) {
      setSelectedMaterials(new Set())
    } else {
      setSelectedMaterials(new Set(sortedMaterials.map(m => m._id)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Materials</h1>
          <p className="text-muted-foreground mt-1">
            Upload, organize, and control access to your learning materials.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Material</DialogTitle>
              <DialogDescription>
                Add a new reference material for your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Algebra Basics Guide"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the material"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Material Type *</Label>
                  <Select
                    value={formData.material_type}
                    onValueChange={(value: any) => setFormData({ ...formData, material_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="doc">Word Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="link">External Link</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_url">File URL *</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Provide a file URL or external link
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Tip: Upload files to cloud storage (Google Drive, Dropbox, OneDrive) and paste the share link here
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Linear Equations"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., algebra, basics, equations"
                />
              </div>

              <Button
                onClick={handleCreateMaterial}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={!formData.title || !formData.file_url}
              >
                Create Material
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-[200px] h-10 border-border bg-background">
              <SelectValue placeholder="Filter by Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject._id} value={subject._id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] h-10 border-border bg-background">
              <SelectValue placeholder="Sort by: Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by: Date</SelectItem>
              <SelectItem value="name">Sort by: Name</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] h-10 border-border bg-background">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="doc">Document</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Materials Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading materials...</p>
        </div>
      ) : sortedMaterials.length === 0 ? (
        <div className="border border-border rounded-lg bg-card p-12 text-center">
          <Upload className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No materials found
          </h3>
          <p className="text-muted-foreground mb-4">
            {typeFilter !== 'all' || subjectFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first material'}
          </p>
          {typeFilter === 'all' && subjectFilter === 'all' && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New Material
            </Button>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedMaterials.size === sortedMaterials.length && sortedMaterials.length > 0}
                    onChange={toggleAllMaterials}
                    className="w-4 h-4 accent-primary rounded focus:ring-primary"
                  />
                </TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs">Name</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs">Subject</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs">Date Uploaded</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs">Version</TableHead>
                <TableHead className="font-semibold text-muted-foreground uppercase text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.map((material) => (
                <TableRow key={material._id} className="hover:bg-muted/20">
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedMaterials.has(material._id)}
                      onChange={() => toggleMaterialSelection(material._id)}
                      className="w-4 h-4 accent-primary rounded focus:ring-primary"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {material.title}
                  </TableCell>
                  <TableCell>
                    <Badge className={getSubjectColor(getSubjectName(material.subject_id))}>
                      {getSubjectName(material.subject_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(material.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    v1.0
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => console.log('Edit material:', material._id)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => console.log('Share material:', material._id)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(material._id)}
                          className="text-red-600 dark:text-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

