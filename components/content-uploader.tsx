"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, File, Presentation, ImageIcon, Trash2, Eye, Download } from "lucide-react"
import { format } from "date-fns"

interface UploadedFile {
  id: string
  name: string
  subject: string
  topic: string
  uploadDate: Date
  status: "uploading" | "processing" | "processed" | "error"
  questionCount: number
  size?: string
  type?: string
}

interface ContentUploaderProps {
  uploadedFiles: UploadedFile[]
  setUploadedFiles: (files: UploadedFile[]) => void
}

export default function ContentUploader({ uploadedFiles, setUploadedFiles }: ContentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newFile, setNewFile] = useState({
    subject: "",
    topic: "",
    file: null as File | null,
  })

  const subjects = ["Mathematics", "Physics", "Chemistry"]
  const topics = {
    Mathematics: ["Algebra", "Geometry", "Calculus"],
    Physics: ["Mechanics", "Thermodynamics", "Optics"],
    Chemistry: ["Organic", "Inorganic", "Physical"],
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        setNewFile({ ...newFile, file: files[0] })
      }
    },
    [newFile],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewFile({ ...newFile, file })
    }
  }

  const simulateUpload = async () => {
    if (!newFile.file || !newFile.subject || !newFile.topic) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
      const res = await fetch(`${API_BASE}/files/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: newFile.file.name,
          subject: newFile.subject,
          topic: newFile.topic,
          size: newFile.file.size,
          uploadthing_url: "",
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      const uploadedFile: UploadedFile = {
        id: data.file_id,
        name: data.filename,
        subject: newFile.subject,
        topic: newFile.topic,
        uploadDate: new Date(),
        status: data.status,
        questionCount: 0,
        size: `${(newFile.file.size / 1024 / 1024).toFixed(1)} MB`,
        type: newFile.file.type,
      }

      setUploadedFiles([uploadedFile, ...uploadedFiles])
      setNewFile({ subject: "", topic: "", file: null })

      // Trigger processing; ignore errors for UX
      try {
        await fetch(`${API_BASE}/files/${uploadedFile.id}/process`, { method: "POST" })
      } catch {}
    } catch (e: any) {
      // Keep UI consistent; bubble error to console
      console.error(e)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "ppt":
      case "pptx":
        return <Presentation className="h-5 w-5 text-orange-600" />
      case "doc":
      case "docx":
        return <File className="h-5 w-5 text-blue-600" />
      case "jpg":
      case "jpeg":
      case "png":
        return <ImageIcon className="h-5 w-5 text-green-600" />
      default:
        return <File className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case "uploading":
        return <Badge className="bg-yellow-100 text-yellow-800">Uploading</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const deleteFile = (fileId: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== fileId))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Learning Materials</CardTitle>
          <CardDescription>
            Upload documents, presentations, or other learning materials to generate questions automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Subject</Label>
              <Select
                value={newFile.subject}
                onValueChange={(value) => setNewFile({ ...newFile, subject: value, topic: "" })}
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
              <Select value={newFile.topic} onValueChange={(value) => setNewFile({ ...newFile, topic: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {newFile.subject &&
                    topics[newFile.subject as keyof typeof topics]?.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {newFile.file ? newFile.file.name : "Drop your files here, or click to browse"}
              </p>
              <p className="text-sm text-gray-500">Supports PDF, DOCX, PPTX, TXT files up to 10MB</p>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                  <span>Browse Files</span>
                </Button>
              </Label>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading {newFile.file?.name}...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={simulateUpload}
              disabled={!newFile.file || !newFile.subject || !newFile.topic || isUploading}
            >
              {isUploading ? "Uploading..." : "Upload & Process"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Materials</CardTitle>
          <CardDescription>Manage your uploaded learning materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getFileIcon(file.name)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{file.name}</h3>
                        {getStatusBadge(file.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span>
                          {file.subject} • {file.topic}
                        </span>
                        <span>Uploaded: {format(file.uploadDate, "MMM dd, yyyy")}</span>
                        {file.size && <span>{file.size}</span>}
                      </div>
                      {file.status === "processed" && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">
                            {file.questionCount} questions generated
                          </Badge>
                        </div>
                      )}
                      {file.status === "processing" && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-blue-600">Processing content...</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteFile(file.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {uploadedFiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No materials uploaded yet. Upload your first document to get started!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
