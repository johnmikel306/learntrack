"use client"

import { useState, useMemo } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, BookOpen, Folder, FileQuestion, Search } from "lucide-react"

// Mock data
const initialSubjects = [
  {
    id: "subj-1",
    name: "Mathematics",
    topics: [
      {
        id: "topic-1-1",
        name: "Algebra",
        questions: [
          { id: "q-1-1-1", text: "What is 2 + 2?" },
          { id: "q-1-1-2", text: "Solve for x: 3x - 5 = 10" },
        ],
      },
      {
        id: "topic-1-2",
        name: "Geometry",
        questions: [{ id: "q-1-2-1", text: "What is the area of a circle?" }],
      },
    ],
  },
  {
    id: "subj-2",
    name: "Physics",
    topics: [
      {
        id: "topic-2-1",
        name: "Mechanics",
        questions: [{ id: "q-2-1-1", text: "What is Newton's second law?" }],
      },
    ],
  },
]

export default function QuestionBank() {
  const [subjects, setSubjects] = useState(initialSubjects)
  const [searchTerm, setSearchTerm] = useState("")

  // Handlers for CRUD operations (to be implemented)
  const handleAddSubject = () => console.log("Add Subject")
  const handleEditSubject = (id: string) => console.log("Edit Subject", id)
  const handleDeleteSubject = (id: string) => console.log("Delete Subject", id)

  const handleAddTopic = (subjectId: string) => console.log("Add Topic to", subjectId)
  const handleEditTopic = (id: string) => console.log("Edit Topic", id)
  const handleDeleteTopic = (id: string) => console.log("Delete Topic", id)

  const handleAddQuestion = (topicId: string) => console.log("Add Question to", topicId)
  const handleEditQuestion = (id: string) => console.log("Edit Question", id)
  const handleDeleteQuestion = (id: string) => console.log("Delete Question", id)

  const filteredSubjects = useMemo(() => {
    if (!searchTerm) return subjects

    return subjects
      .map((subject) => {
        const filteredTopics = subject.topics.filter((topic) =>
          topic.name.toLowerCase().includes(searchTerm.toLowerCase()),
        )

        if (subject.name.toLowerCase().includes(searchTerm.toLowerCase()) || filteredTopics.length > 0) {
          return {
            ...subject,
            topics: subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ? subject.topics : filteredTopics,
          }
        }
        return null
      })
      .filter((subject): subject is NonNullable<typeof subject> => subject !== null)
  }, [subjects, searchTerm])

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <CardTitle>Question Bank</CardTitle>
          <Button onClick={handleAddSubject}>
            <Plus className="mr-2 h-4 w-4" /> Add Subject
          </Button>
        </div>
        <CardDescription>
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
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full" defaultValue={filteredSubjects.map((s) => s.id)}>
          {filteredSubjects.map((subject) => (
            <AccordionItem value={subject.id} key={subject.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span className="font-semibold">{subject.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mr-4">
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
                <Accordion type="multiple" className="w-full pl-8" defaultValue={subject.topics.map((t) => t.id)}>
                  {subject.topics.map((topic) => (
                    <AccordionItem value={topic.id} key={topic.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5" />
                            <span>{topic.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mr-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTopic(topic.id)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTopic(topic.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAddQuestion(topic.id)
                              }}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Add Question
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-8">
                          {topic.questions.map((question) => (
                            <div key={question.id} className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <FileQuestion className="h-5 w-5" />
                                <p>{question.text}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditQuestion(question.id)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteQuestion(question.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
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
