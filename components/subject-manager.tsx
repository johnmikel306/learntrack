"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, Trash2, Edit } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

import { useApiClient } from '@/lib/api-client'

interface Subject {
  id: string
  name: string
  topics: string[]
  questionCount: number
}

export default function SubjectManager() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const client = useApiClient()

  const [error, setError] = useState<string | null>(null)

  // Load subjects from FastAPI
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await client.get<Subject[]>('/subjects/')
        if (res.error) throw new Error(res.error)
        setSubjects(res.data || [])
      } catch (e: any) {
        setError(e.message)
        toast({ title: "Failed to load subjects", description: e.message })
      } finally {
        setLoading(false)
      }
    }
    loadSubjects()
  }, [])


  const [newSubject, setNewSubject] = useState("")
  const [newTopic, setNewTopic] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [isAddingSubject, setIsAddingSubject] = useState(false)

  const addSubject = async () => {
    if (newSubject.trim()) {
      try {
        const subjectData = {
          name: newSubject,
          description: `Subject: ${newSubject}`,
          topics: []
        }
        const createdRes = await client.post<Subject>('/subjects/', subjectData)
        const created = createdRes.data as Subject
        if (!created) throw new Error(createdRes.error || 'Failed to create subject')
        setSubjects([...subjects, created])
        setNewSubject("")
        setIsAddingSubject(false)
        toast({ title: "Subject created successfully" })
      } catch (e: any) {
        toast({ title: "Failed to create subject", description: e.message })
      }
    }
  }

  const addTopic = async (subjectId: string) => {
    if (newTopic.trim()) {
      try {
        const subject = subjects.find(s => s.id === subjectId)
        if (!subject) return

        const updatedTopics = [...subject.topics, newTopic]
        const topicRes = await client.post(`/subjects/${subjectId}/topics`, { topic: newTopic })
        if (topicRes.error) throw new Error(topicRes.error)

        setSubjects(
          subjects.map((s) =>
            s.id === subjectId ? { ...s, topics: updatedTopics } : s,
          ),
        )
        setNewTopic("")
        setSelectedSubject(null)
        toast({ title: "Topic added successfully" })
      } catch (e: any) {
        toast({ title: "Failed to add topic", description: e.message })
      }
    }
  }

  const deleteSubject = async (subjectId: string) => {
    try {
      const delRes = await client.delete(`/subjects/${subjectId}`)
      if (delRes.error) throw new Error(delRes.error)
      setSubjects(subjects.filter((subject) => subject.id !== subjectId))
      toast({ title: "Subject deleted successfully" })
    } catch (e: any) {
      toast({ title: "Failed to delete subject", description: e.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subjects & Topics</CardTitle>
            <CardDescription>Manage your teaching subjects and topics</CardDescription>
          </div>
          <Dialog open={isAddingSubject} onOpenChange={setIsAddingSubject}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
                <DialogDescription>Create a new subject to organize your questions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject-name">Subject Name</Label>
                  <Input
                    id="subject-name"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingSubject(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addSubject}>Add Subject</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold">{subject.name}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {subject.questionCount} questions
                  </Badge>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteSubject(subject.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {subject.topics.map((topic, index) => (
                    <Badge key={`${subject.id}-topic-${topic}`} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              <Dialog
                open={selectedSubject === subject.id}
                onOpenChange={(open) => setSelectedSubject(open ? subject.id : null)}
              >
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-blue-600">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Topic
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Topic to {subject.name}</DialogTitle>
                    <DialogDescription>Add a new topic to organize questions within this subject</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topic-name">Topic Name</Label>
                      <Input
                        id="topic-name"
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        placeholder="e.g., Algebra, Mechanics, Organic Chemistry"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setSelectedSubject(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => addTopic(subject.id)}>Add Topic</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
