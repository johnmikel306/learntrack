import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  FileText,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  File,
  Upload,
  Eye,
  Download,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter
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

export default function MaterialManager() {
  const { getToken } = useAuth()
  const [materials, setMaterials] = useState<Material[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
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

  const trackDownload = async (materialId: string) => {
    try {
      const token = await getToken()
      await fetch(`${API_BASE_URL}/materials/${materialId}/download`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Failed to track download:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
      case 'doc':
        return <FileText className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'image':
        return <ImageIcon className="w-5 h-5" />
      case 'link':
        return <LinkIcon className="w-5 h-5" />
      default:
        return <File className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      pdf: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      doc: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      video: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      image: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      link: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
    return colors[type] || colors.other
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || material.material_type === typeFilter
    const matchesSubject = subjectFilter === 'all' || material.subject_id === subjectFilter
    
    return matchesSearch && matchesType && matchesSubject && material.status === 'active'
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reference Materials</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">
            Manage educational resources and materials
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Material
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
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={!formData.title || !formData.file_url}
              >
                Create Material
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
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

            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subject" />
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
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600 dark:text-slate-400">Loading materials...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No materials found
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {searchTerm || typeFilter !== 'all' || subjectFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first material'}
            </p>
            {!searchTerm && typeFilter === 'all' && subjectFilter === 'all' && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Material
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <Card key={material._id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(material.material_type)}`}>
                      {getTypeIcon(material.material_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{material.title}</CardTitle>
                      <Badge className={`mt-1 ${getTypeColor(material.material_type)}`}>
                        {material.material_type.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {material.description && (
                  <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
                    {material.description}
                  </p>
                )}

                {material.topic && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {material.topic}
                    </Badge>
                  </div>
                )}

                {material.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {material.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {material.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{material.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {material.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {material.download_count}
                    </span>
                  </div>
                  <span>{formatFileSize(material.file_size)}</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      if (material.file_url) {
                        window.open(material.file_url, '_blank')
                        trackDownload(material._id)
                      }
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(material._id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

