/**
 * Question Bank Manager Component
 * Manages subjects, topics, and questions with a clean interface
 * Matches the design specifications from the mockups
 */

import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  ArrowLeft,
  Trash2,
  List,
  Grid
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Subject {
  id: string
  name: string
  topicCount: number
  createdAt: string
}

interface Topic {
  id: string
  name: string
  subjectId: string
  subjectName: string
  questionCount: number
  grade: string
}

interface Question {
  id: string
  text: string
  options: { label: string; value: string; isCorrect: boolean }[]
  points: number
  topicId: string
}

export default function QuestionBankManager() {
  const [activeTab, setActiveTab] = useState("subjects")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])

  // Mock data - replace with API calls
  const subjects: Subject[] = [
    { id: "1", name: "English", topicCount: 5, createdAt: "2024-05-07" },
    { id: "2", name: "Mathematics", topicCount: 14, createdAt: "2024-05-07" },
    { id: "3", name: "Economics", topicCount: 5, createdAt: "2024-05-07" },
    { id: "4", name: "Basic Science", topicCount: 5, createdAt: "2024-05-07" },
    { id: "5", name: "English Grade 10", topicCount: 10, createdAt: "2024-05-07" },
  ]

  const topics: Topic[] = [
    { id: "1", name: "Algebraic expression", subjectId: "2", subjectName: "Mathematics", questionCount: 20, grade: "Grade 8" },
    { id: "2", name: "Geometry", subjectId: "2", subjectName: "Mathematics", questionCount: 15, grade: "Grade 9" },
    { id: "3", name: "Trigonometry", subjectId: "2", subjectName: "Mathematics", questionCount: 20, grade: "Grade 9" },
    { id: "4", name: "Integration and Differentiation", subjectId: "2", subjectName: "Mathematics", questionCount: 24, grade: "Grade 10" },
    { id: "5", name: "Simultaneous Equations", subjectId: "2", subjectName: "Mathematics", questionCount: 24, grade: "Grade 10" },
    { id: "6", name: "Matrix", subjectId: "2", subjectName: "Mathematics", questionCount: 20, grade: "Grade 11" },
    { id: "7", name: "Indices", subjectId: "2", subjectName: "Mathematics", questionCount: 5, grade: "Grade 11" },
    { id: "8", name: "Quadratic Equations", subjectId: "2", subjectName: "Mathematics", questionCount: 6, grade: "Grade 11" },
  ]

  const mockQuestions: Question[] = [
    {
      id: "1",
      text: "A flagpole casts a shadow of 12 m. If the angle of elevation of the top of the pole from the tip of the shadow is 30 30^\\circ30, what is the height of the flagpole?",
      options: [
        { label: "A", value: "4 m", isCorrect: false },
        { label: "B", value: "6 m", isCorrect: true },
        { label: "C", value: "12^3 m", isCorrect: false },
        { label: "D", value: "12 m", isCorrect: false },
      ],
      points: 2,
      topicId: "3"
    },
    {
      id: "2",
      text: "A ladder 5 m long leans against a wall. If the foot of the ladder is 3 m from the wall, what is sin⁡θ\\sin\\thetasinθ, where θ\\thetaθ is the angle the ladder makes with the ground?",
      options: [
        { label: "A", value: "4/5", isCorrect: false },
        { label: "B", value: "3/5", isCorrect: true },
        { label: "C", value: "5/3", isCorrect: false },
        { label: "D", value: "5/4", isCorrect: false },
      ],
      points: 2,
      topicId: "3"
    },
  ]

  // Filter subjects based on search
  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter topics based on search and selected subject
  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject ? topic.subjectId === selectedSubject.id : true
    return matchesSearch && matchesSubject
  })

  // Handle subject click to view topics
  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
    setActiveTab("topics")
  }

  // Handle topic click to view questions
  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic)
    setQuestions(mockQuestions.filter(q => q.topicId === topic.id))
  }

  // Handle back navigation
  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null)
      setQuestions([])
    } else if (selectedSubject) {
      setSelectedSubject(null)
      setActiveTab("subjects")
    }
  }

  // Add new question
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: String(questions.length + 1),
      text: "",
      options: [
        { label: "A", value: "", isCorrect: false },
        { label: "B", value: "", isCorrect: false },
        { label: "C", value: "", isCorrect: false },
        { label: "D", value: "", isCorrect: false },
      ],
      points: 2,
      topicId: selectedTopic?.id || ""
    }
    setQuestions([...questions, newQuestion])
  }

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  // Add option to question
  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const nextLabel = String.fromCharCode(65 + q.options.length) // A, B, C, D, E...
        return {
          ...q,
          options: [...q.options, { label: nextLabel, value: "", isCorrect: false }]
        }
      }
      return q
    }))
  }

  // Delete option from question
  const handleDeleteOption = (questionId: string, optionLabel: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.filter(opt => opt.label !== optionLabel)
        }
      }
      return q
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-white">
          Subject Management
        </h2>
        <p className="text-slate-400 dark:text-slate-500 mt-1">
          Manage your subjects and keep every student on track
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-slate-200 dark:border-slate-700 px-6">
            <TabsList className="bg-transparent h-auto p-0 space-x-8">
              <TabsTrigger
                value="subjects"
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-slate-700 dark:data-[state=active]:border-slate-300 rounded-none px-0 pb-3 text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-300 font-medium"
              >
                Subjects
              </TabsTrigger>
              <TabsTrigger
                value="question-bank"
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-slate-700 dark:data-[state=active]:border-slate-300 rounded-none px-0 pb-3 text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-300 font-medium"
              >
                Question Bank
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-slate-700 dark:data-[state=active]:border-slate-300 rounded-none px-0 pb-3 text-slate-500 dark:text-slate-400 data-[state=active]:text-slate-700 dark:data-[state=active]:text-slate-300 font-medium"
              >
                Ai
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="p-6 space-y-6">
            {/* Search and Actions */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search for subject or topic"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="border-slate-300 dark:border-slate-600">
                  <List className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subject
                </Button>
              </div>
            </div>

            {/* Subjects Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="border-0 bg-slate-50 dark:bg-slate-800 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleSubjectClick(subject)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center relative">
                        <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded-br-lg rounded-tl-lg"></div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-semibold text-slate-700 dark:text-white mb-1 text-base">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {subject.topicCount} topics
                    </p>
                    {subject.createdAt && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        {subject.createdAt} at 19:09
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Question Bank Tab (Topics View) */}
          <TabsContent value="question-bank" className="p-6 space-y-6">
            {!selectedTopic ? (
              <>
                {/* Breadcrumb */}
                {selectedSubject && (
                  <div className="flex items-center gap-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="p-0 h-auto hover:bg-transparent text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Topics
                    </Button>
                    <span className="text-slate-400 dark:text-slate-500">›</span>
                    <span className="text-slate-500 dark:text-slate-400">Subject</span>
                    <span className="text-slate-400 dark:text-slate-500">›</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedSubject.name}</span>
                  </div>
                )}

                {/* Search and Actions */}
                <div className="flex items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search for topic"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Grade: All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Grade: All</SelectItem>
                        <SelectItem value="8">Grade 8</SelectItem>
                        <SelectItem value="9">Grade 9</SelectItem>
                        <SelectItem value="10">Grade 10</SelectItem>
                        <SelectItem value="11">Grade 11</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Topic
                    </Button>
                  </div>
                </div>

                {/* Topics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      className="border-0 bg-slate-50 dark:bg-slate-800 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => handleTopicClick(topic)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center relative">
                            <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 dark:bg-blue-500 rounded-br-lg rounded-tl-lg"></div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <h3 className="font-semibold text-slate-700 dark:text-white mb-1 text-base">
                          {topic.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {topic.questionCount} Questions · {topic.grade}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Questions View */}
                <div className="space-y-6">
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBack}
                      className="p-0 h-auto hover:bg-transparent text-slate-700 dark:text-slate-300 font-medium"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Topics
                    </Button>
                    <span className="text-slate-400 dark:text-slate-500">›</span>
                    <span className="text-slate-500 dark:text-slate-400">Subject</span>
                    <span className="text-slate-400 dark:text-slate-500">›</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedTopic.subjectName}</span>
                    <span className="text-slate-400 dark:text-slate-500">›</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedTopic.name}</span>
                  </div>

                  {/* Topic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-slate-600 dark:text-slate-400">Topic Name</Label>
                      <Input value={selectedTopic.name} readOnly className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm text-slate-600 dark:text-slate-400">Level</Label>
                      <Select defaultValue={selectedTopic.grade.toLowerCase().replace(' ', '')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grade8">Grade 8</SelectItem>
                          <SelectItem value="grade9">Grade 9</SelectItem>
                          <SelectItem value="grade10">Grade 10</SelectItem>
                          <SelectItem value="grade11">Grade 11</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={question.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Question {index + 1}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Question
                          </Button>
                        </div>

                        {/* Question Text */}
                        <Textarea
                          placeholder="Enter question text"
                          value={question.text}
                          className="mb-4 min-h-[80px]"
                          readOnly
                        />

                        {/* Set Options */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Set options
                          </Label>

                          <RadioGroup value={question.options.find(o => o.isCorrect)?.label}>
                            {question.options.map((option) => (
                              <div key={option.label} className="flex items-center gap-3">
                                <RadioGroupItem
                                  value={option.label}
                                  id={`q${question.id}-${option.label}`}
                                  className="border-2"
                                />
                                <Label
                                  htmlFor={`q${question.id}-${option.label}`}
                                  className="flex-1 flex items-center gap-2"
                                >
                                  <span className="font-medium">{option.label}</span>
                                  <Input
                                    value={option.value}
                                    readOnly
                                    className="flex-1"
                                  />
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOption(question.id, option.label)}
                                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </RadioGroup>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddOption(question.id)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add option
                          </Button>
                        </div>

                        {/* Points */}
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <Label className="text-sm text-slate-600 dark:text-slate-400">Points</Label>
                          <Select defaultValue={String(question.points)}>
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}

                    {/* Add Question Button */}
                    <Button
                      onClick={handleAddQuestion}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>

                    {/* Summary */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <div>
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {questions.length}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                            Questions Created
                          </span>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">
                            {questions.reduce((sum, q) => sum + q.points, 0)}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 ml-2">
                            Points
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="p-6">
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">AI features coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


