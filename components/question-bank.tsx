"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, BookOpen, Folder, FileQuestion, Search } from "lucide-react"

import { useApiClient } from '@/lib/api-client'

export type Subject = {
  id: string
  name: string
  topics: string[]
}

export type Question = {
  id: string
  question_text: string
  question_type: "multiple-choice" | "true-false" | "short-answer" | "essay"
  topic: string
  difficulty: "easy" | "medium" | "hard"
  options?: { text: string; is_correct?: boolean }[]
}

export default function QuestionBank() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([])
  const [expandedTopicsBySubject, setExpandedTopicsBySubject] = useState<Record<string, string[]>>({})
  const client = useApiClient()

  const [questionsByKey, setQuestionsByKey] = useState<Record<string, Question[]>>({})


  type QuestionForm = {
    id?: string
    subject_id: string
    topic: string
    question_text: string
    question_type: "multiple-choice" | "true-false" | "short-answer" | "essay"
    difficulty: "easy" | "medium" | "hard"
    options: { text: string; is_correct: boolean }[]
    correct_answer?: string
  }

  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [questionForm, setQuestionForm] = useState<QuestionForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [inlineEditId, setInlineEditId] = useState<string | null>(null)
  const [inlineForm, setInlineForm] = useState<{ question_text: string; difficulty: QuestionForm["difficulty"] } | null>(null)

  const keyFor = (subjectId: string, topic: string) => `${subjectId}|${topic}`

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const method = (init?.method || 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    let res
    if (method === 'GET') res = await client.get<T>(path)
    else if (method === 'POST') res = await client.post<T>(path, body)
    else if (method === 'PUT') res = await client.put<T>(path, body)
    else if (method === 'DELETE') res = await client.delete<T>(path)
    else res = await client.get<T>(path)
    if (res.error) throw new Error(res.error)
    return res.data as T
  }

  async function loadSubjects() {
    try {
      setLoading(true)
      setError(null)
      const data = await apiFetch<Subject[]>(`/subjects`)
      setSubjects(data)
    } catch (e: any) {
      setError(e.message)
      toast({ title: "Failed to load subjects", description: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function loadQuestions(subjectId: string, topic: string) {
    try {
      const qs = await apiFetch<Question[]>(`/questions?subject_id=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(topic)}`)
      setQuestionsByKey((prev) => ({ ...prev, [keyFor(subjectId, topic)]: qs }))
    } catch (e: any) {
      toast({ title: "Failed to load questions", description: e.message })
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  // Subjects CRUD
  const handleAddSubject = async () => {
    const name = window.prompt("Subject name")
    if (!name) return
    try {
      const created = await apiFetch<Subject>(`/subjects`, { method: "POST", body: JSON.stringify({ name }) })
      setSubjects((prev) => [...prev, created])
      toast({ title: "Subject created" })
    } catch (e: any) {
      toast({ title: "Failed to create subject", description: e.message })
    }
  }

  const handleEditSubject = async (id: string) => {
    const subject = subjects.find((s) => s.id === id)
    if (!subject) return
    const name = window.prompt("New subject name", subject.name)
    if (!name || name === subject.name) return
    try {
      const updated = await apiFetch<Subject>(`/subjects/${id}`, { method: "PUT", body: JSON.stringify({ name }) })
      setSubjects((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast({ title: "Subject updated" })
    } catch (e: any) {
      toast({ title: "Failed to update subject", description: e.message })
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Delete this subject?")) return
    try {
      await apiFetch(`/subjects/${id}`, { method: "DELETE" })
      setSubjects((prev) => prev.filter((s) => s.id !== id))
      toast({ title: "Subject deleted" })
    } catch (e: any) {
      toast({ title: "Failed to delete subject", description: e.message })
    }
  }

  // Topics
  const handleAddTopic = async (subjectId: string) => {
    const topic = window.prompt("Topic name")
    if (!topic) return
    try {
      await apiFetch(`/subjects/${subjectId}/topics/${encodeURIComponent(topic)}`, { method: "POST" })
      await loadSubjects()
      toast({ title: "Topic added" })
    } catch (e: any) {
      toast({ title: "Failed to add topic", description: e.message })
    }
  }

  const handleEditTopic = async (_topic: string) => {
    toast({ title: "Edit topic not implemented", description: "Rename topic coming soon" })
  }

  const handleDeleteTopic = async (subjectId: string, topic: string) => {
    if (!window.confirm(`Remove topic "${topic}"?`)) return
    try {
      await apiFetch(`/subjects/${subjectId}/topics/${encodeURIComponent(topic)}`, { method: "DELETE" })
      await loadSubjects()
      toast({ title: "Topic removed" })
    } catch (e: any) {
      toast({ title: "Failed to remove topic", description: e.message })
    }
  }

  // Questions
  const handleAddQuestion = (subjectId: string, topic: string) => {
    setQuestionForm({
      subject_id: subjectId,
      topic,
      question_text: "",
      question_type: "multiple-choice",
      difficulty: "medium",
      options: [{ text: "", is_correct: false }, { text: "", is_correct: false }],
    })
    setQuestionModalOpen(true)
  }

  const handleEditQuestion = (q: Question, subjectId: string) => {
    setQuestionForm({
      id: q.id,
      subject_id: subjectId,
      topic: q.topic,
      question_text: q.question_text,
      question_type: q.question_type,
      difficulty: q.difficulty,
      options: (q.options || []).map((o) => ({ text: o.text, is_correct: !!o.is_correct })),
    })
    setQuestionModalOpen(true)
  }

  const handleDeleteQuestion = async (id: string, subjectId: string, topic: string) => {
    if (!window.confirm("Delete this question?")) return
    try {
      await apiFetch(`/questions/${id}`, { method: "DELETE" })
      setQuestionsByKey((prev) => {
        const key = keyFor(subjectId, topic)
        const arr = prev[key] || []
        return { ...prev, [key]: arr.filter((q) => q.id !== id) }
      })
      toast({ title: "Question deleted" })
    } catch (e: any) {
      toast({ title: "Failed to delete question", description: e.message })
    }
  }

  const saveQuestionModal = async () => {
    if (!questionForm) return
    setSaving(true)
    try {
      const payload: any = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        subject_id: questionForm.subject_id,
        topic: questionForm.topic,
        difficulty: questionForm.difficulty,
      }
      if (questionForm.question_type === "multiple-choice") {
        const cleaned = questionForm.options.filter((o) => o.text.trim())
        const correctCount = cleaned.filter((o) => o.is_correct).length
        if (cleaned.length < 2 || correctCount !== 1) {
          toast({ title: "Invalid options", description: "Provide at least 2 options and exactly 1 correct" })
          setSaving(false)
          return
        }
        payload.options = cleaned
      } else if (questionForm.correct_answer) {
        payload.correct_answer = questionForm.correct_answer
      }

      if (questionForm.id) {
        const updated = await apiFetch<Question>(`/questions/${questionForm.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
        setQuestionsByKey((prev) => {
          const key = keyFor(questionForm.subject_id, questionForm.topic)
          const arr = prev[key] || []
          return { ...prev, [key]: arr.map((q) => (q.id === updated.id ? updated : q)) }
        })
        toast({ title: "Question updated successfully" })
      } else {
        const created = await apiFetch<Question>(`/questions`, { method: "POST", body: JSON.stringify(payload) })
        setQuestionsByKey((prev) => {
          const key = keyFor(questionForm.subject_id, questionForm.topic)
          const arr = prev[key] || []
          return { ...prev, [key]: [created, ...arr] }
        })
        toast({ title: "Question created successfully" })
      }

      setQuestionModalOpen(false)
      setQuestionForm(null)
    } catch (e: any) {
      toast({ title: "Failed to save question", description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const startInlineEdit = (q: Question) => {
    setInlineEditId(q.id)
    setInlineForm({ question_text: q.question_text, difficulty: q.difficulty })
  }
  const cancelInlineEdit = () => {
    setInlineEditId(null)
    setInlineForm(null)
  }
  const saveInlineEdit = async (q: Question, subjectId: string) => {
    if (!inlineForm) return
    try {
      const updated = await apiFetch<Question>(`/questions/${q.id}`, {
        method: "PUT",
        body: JSON.stringify({ question_text: inlineForm.question_text, difficulty: inlineForm.difficulty }),
      })
      const key = keyFor(subjectId, q.topic)
      setQuestionsByKey((prev) => ({ ...prev, [key]: (prev[key] || []).map((qq) => (qq.id === q.id ? updated : qq)) }))
      toast({ title: "Question updated" })
      cancelInlineEdit()
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.message })
    }
  }

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects

    const term = searchTerm.toLowerCase()
    return subjects
      .map((subject) => {
        const filteredTopics = subject.topics.filter((t) => t.toLowerCase().includes(term))
        if (subject.name.toLowerCase().includes(term) || filteredTopics.length > 0) {
          return {
            ...subject,
            topics: subject.name.toLowerCase().includes(term) ? subject.topics : filteredTopics,
          }
        }
        return null
      })
      .filter((s): s is Subject => s !== null)
  }, [subjects, searchTerm])

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Question Bank</CardTitle>
            <CardDescription>Manage subjects, topics, and questions</CardDescription>
          </div>
          <Button onClick={handleAddSubject} variant="default">
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search subjects or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-gray-500">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Accordion type="multiple" className="w-full" defaultValue={filteredSubjects.map((s) => s.id)}>
          {filteredSubjects.map((subject) => (
            <AccordionItem value={subject.id} key={subject.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSubject(subject.id)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSubject(subject.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddTopic(subject.id)
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add Topic
                    </Button>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="w-full pl-8" defaultValue={subject.topics}>
                  {subject.topics.map((topic) => (
                    <AccordionItem value={topic} key={topic}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-amber-600" />
                            <span>{topic}</span>
                          </div>
                          <div className="flex items-center gap-2 mr-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTopic(topic)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTopic(subject.id, topic)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddQuestion(subject.id, topic)
                              }}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Add Question
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-8 space-y-2">
                          {(() => {
                            const key = keyFor(subject.id, topic)
                            const items = questionsByKey[key]
                            if (!items) {
                              return (
                                <Button variant="outline" size="sm" onClick={() => loadQuestions(subject.id, topic)}>
                                  Load questions
                                </Button>
                              )
                            }
                            if (items.length === 0) {
                              return <div className="text-sm text-gray-500">No questions yet.</div>
                            }
                            return (
                              <div className="space-y-2">
                                {items.map((q) => (
                                  <div key={q.id} className="flex items-start justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                                    <div className="flex-1 pr-4">
                                      {inlineEditId === q.id ? (
                                        <div className="space-y-2">
                                          <Input
                                            value={inlineForm?.question_text || ""}
                                            onChange={(e) => setInlineForm((f) => (f ? { ...f, question_text: e.target.value } : f))}
                                          />
                                          <div className="flex gap-2">
                                            <Select
                                              value={inlineForm?.difficulty || q.difficulty}
                                              onValueChange={(v: any) => setInlineForm((f) => (f ? { ...f, difficulty: v } : f))}
                                            >
                                              <SelectTrigger className="w-36">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="easy">Easy</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="hard">Hard</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Button size="sm" onClick={() => saveInlineEdit(q, subject.id)}>
                                              Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-sm text-gray-600">
                                            <span className="uppercase text-xs mr-2 px-2 py-0.5 bg-gray-100 rounded">{q.question_type}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">{q.difficulty}</span>
                                          </div>
                                          <div className="font-medium">{q.question_text}</div>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      {inlineEditId === q.id ? null : (
                                        <>
                                          <Button size="sm" variant="outline" onClick={() => startInlineEdit(q)}>
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => handleEditQuestion(q, subject.id)}>
                                            <FileQuestion className="h-4 w-4" />
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => handleDeleteQuestion(q.id, subject.id, topic)}>
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })()}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
