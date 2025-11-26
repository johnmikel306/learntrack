import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Brain, CheckCircle, Globe, Database, Sparkles, Wand2, RefreshCw, Trash2, Edit, FileText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useApiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface DocumentLibraryItem {
  id: string; filename: string; file_type: string; file_size: number
  uploaded_at: string; embedding_status: 'pending' | 'processing' | 'completed' | 'failed'
  chunk_count?: number; tags: string[]; category?: string
}

interface GeneratedQuestion {
  id: string; text: string; type: string; difficulty: string
  options?: string[]; correctAnswer: string; explanation: string
  points: number; tags: string[]; sources?: string[]
}

interface RAGStats {
  collection_stats: { vectors_count: number; points_count: number }
  web_search_credits: number; documents_by_status: Record<string, number>
}

export default function RAGQuestionGenerator() {
  const apiClient = useApiClient()
  const [activeTab, setActiveTab] = useState("generate")
  const [textContent, setTextContent] = useState("")
  const [subject, setSubject] = useState("")
  const [topic, setTopic] = useState("")
  const [questionCount, setQuestionCount] = useState([10])
  const [difficulty, setDifficulty] = useState("")
  const [questionTypes, setQuestionTypes] = useState<string[]>([])
  const [aiProvider, setAiProvider] = useState("groq")
  const [aiModel, setAiModel] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [useRAG, setUseRAG] = useState(true)
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [documentLibrary, setDocumentLibrary] = useState<DocumentLibraryItem[]>([])
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [ragStats, setRagStats] = useState<RAGStats | null>(null)
  const [availableProviders, setAvailableProviders] = useState<string[]>([])
  const [availableModels, setAvailableModels] = useState<Record<string, string>>({})
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)

  useEffect(() => { loadInitialData() }, [])
  useEffect(() => { if (aiProvider) loadModels(aiProvider) }, [aiProvider])

  const loadInitialData = async () => {
    setIsLoadingLibrary(true)
    try {
      const [libraryRes, statsRes, providersRes] = await Promise.all([
        apiClient.get<DocumentLibraryItem[]>('/rag/library'),
        apiClient.get<RAGStats>('/rag/stats'),
        apiClient.get<string[]>('/rag/providers')
      ])
      if (libraryRes.data) setDocumentLibrary(libraryRes.data)
      if (statsRes.data) setRagStats(statsRes.data)
      if (providersRes.data) setAvailableProviders(providersRes.data)
    } catch (error) { console.error('Failed to load initial data:', error) }
    finally { setIsLoadingLibrary(false) }
  }

  const loadModels = async (provider: string) => {
    try {
      const res = await apiClient.get<{ provider: string; models: Record<string, string> }>(`/rag/models/${provider}`)
      if (res.data) {
        setAvailableModels(res.data.models)
        const firstModel = Object.keys(res.data.models)[0]
        if (firstModel) setAiModel(firstModel)
      }
    } catch (error) { console.error('Failed to load models:', error) }
  }

  const handleGenerate = async () => {
    if (!subject || !topic) { toast.error('Please select a subject and enter a topic'); return }
    setIsGenerating(true)
    try {
      const res = await apiClient.post<{ questions: GeneratedQuestion[]; sources_used: string[] }>('/rag/generate', {
        content: textContent, subject, topic, question_count: questionCount[0], difficulty,
        question_types: questionTypes, provider: aiProvider, model: aiModel, custom_prompt: customPrompt,
        use_rag: useRAG, use_web_search: useWebSearch, selected_document_ids: selectedDocuments
      })
      if (res.data) {
        setGeneratedQuestions(res.data.questions || [])
        toast.success(`Generated ${res.data.questions?.length || 0} questions!`)
        setActiveTab("preview")
      } else if (res.error) { toast.error(res.error) }
    } catch (error) { toast.error('Failed to generate questions') }
    finally { setIsGenerating(false) }
  }

  const toggleQuestionType = (type: string) => {
    setQuestionTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }
  const toggleDocument = (docId: string) => {
    setSelectedDocuments(prev => prev.includes(docId) ? prev.filter(d => d !== docId) : [...prev, docId])
  }
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />RAG Question Generator
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1">Generate questions using your documents and AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-purple-100 text-sm">Documents</p><p className="text-2xl font-bold">{documentLibrary.length}</p></div>
            <Database className="w-6 h-6 text-purple-200" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-blue-100 text-sm">Vectors</p><p className="text-2xl font-bold">{ragStats?.collection_stats?.vectors_count || 0}</p></div>
            <Sparkles className="w-6 h-6 text-blue-200" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-green-100 text-sm">Embedded</p><p className="text-2xl font-bold">{ragStats?.documents_by_status?.completed || 0}</p></div>
            <CheckCircle className="w-6 h-6 text-green-200" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4"><div className="flex items-center justify-between">
            <div><p className="text-orange-100 text-sm">Search Credits</p><p className="text-2xl font-bold">{ragStats?.web_search_credits || 0}</p></div>
            <Globe className="w-6 h-6 text-orange-200" /></div></CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">Document Library</TabsTrigger>
          <TabsTrigger value="preview">Preview ({generatedQuestions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
              <CardHeader><CardTitle className="flex items-center"><Wand2 className="w-5 h-5 mr-2 text-purple-600" />Generation Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2"><Database className="w-4 h-4 text-purple-600" /><span className="font-medium">Use Document Context (RAG)</span></div>
                  <Switch checked={useRAG} onCheckedChange={setUseRAG} />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-blue-600" /><span className="font-medium">Include Web Search</span>
                    <Badge variant="outline" className="text-xs">{ragStats?.web_search_credits || 0} credits</Badge></div>
                  <Switch checked={useWebSearch} onCheckedChange={setUseWebSearch} />
                </div>
                <div className="space-y-2"><Label>Additional Content (Optional)</Label>
                  <Textarea placeholder="Paste additional content..." value={textContent} onChange={(e) => setTextContent(e.target.value)} className="min-h-[80px]" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Subject</Label>
                    <Select value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent><SelectItem value="mathematics">Mathematics</SelectItem><SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem><SelectItem value="english">English</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Topic</Label><Input placeholder="e.g., Algebra" value={topic} onChange={(e) => setTopic(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Questions: {questionCount[0]}</Label><Slider value={questionCount} onValueChange={setQuestionCount} max={50} min={1} step={1} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Provider</Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{availableProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Model</Label>
                    <Select value={aiModel} onValueChange={setAiModel}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(availableModels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Question Types</Label>
                  <div className="grid grid-cols-2 gap-2">{['multiple-choice', 'true-false', 'short-answer', 'essay'].map(t => (
                    <Button key={t} variant={questionTypes.includes(t) ? "default" : "outline"} size="sm" onClick={() => toggleQuestionType(t)}>{t}</Button>))}</div></div>
                <Button onClick={handleGenerate} disabled={isGenerating || !subject || !topic} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Brain className="w-4 h-4 mr-2" />Generate Questions</>}</Button>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
              <CardHeader><CardTitle className="flex items-center"><FileText className="w-5 h-5 mr-2 text-blue-600" />Selected Documents ({selectedDocuments.length})</CardTitle></CardHeader>
              <CardContent><div className="space-y-2 max-h-[400px] overflow-y-auto">
                {documentLibrary.filter(d => d.embedding_status === 'completed').map(doc => (
                  <div key={doc.id} onClick={() => toggleDocument(doc.id)} className={`p-3 rounded-lg cursor-pointer transition-all ${selectedDocuments.includes(doc.id) ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500' : 'bg-gray-50 dark:bg-slate-800 hover:bg-gray-100'}`}>
                    <div className="flex items-center justify-between"><span className="font-medium truncate">{doc.filename}</span>
                      <Badge className={getStatusColor(doc.embedding_status)}>{doc.chunk_count} chunks</Badge></div></div>))}
                {documentLibrary.filter(d => d.embedding_status === 'completed').length === 0 && (
                  <p className="text-gray-500 text-center py-4">No embedded documents. Process documents in the library tab.</p>)}</div></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader><CardTitle className="flex items-center"><Database className="w-5 h-5 mr-2 text-purple-600" />Document Library</CardTitle></CardHeader>
            <CardContent>{isLoadingLibrary ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : (
              <div className="space-y-3">{documentLibrary.map(doc => (
                <div key={doc.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-gray-500" />
                    <div><p className="font-medium">{doc.filename}</p><p className="text-sm text-gray-500">{(doc.file_size / 1024).toFixed(1)} KB</p></div></div>
                    <div className="flex items-center gap-2"><Badge className={getStatusColor(doc.embedding_status)}>{doc.embedding_status}</Badge>
                      {doc.embedding_status === 'pending' && <Button size="sm" variant="outline">Process</Button>}</div></div></div>))}
                {documentLibrary.length === 0 && <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>}</div>)}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card className="shadow-lg border-0 bg-white dark:bg-slate-900">
            <CardHeader><CardTitle className="flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-green-600" />Generated Questions</CardTitle></CardHeader>
            <CardContent><div className="space-y-4">{generatedQuestions.map((q, i) => (
              <Card key={q.id} className="border"><CardContent className="p-4">
                <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">Q{i + 1}</Badge><Badge variant="outline">{q.type}</Badge><Badge variant="outline">{q.difficulty}</Badge></div>
                  <div className="flex gap-1"><Button size="sm" variant="ghost"><Edit className="w-4 h-4" /></Button><Button size="sm" variant="ghost" className="text-red-600"><Trash2 className="w-4 h-4" /></Button></div></div>
                <p className="font-medium mb-2">{q.text}</p>
                {q.options && <div className="space-y-1 mb-2">{q.options.map((opt, oi) => (
                  <div key={oi} className={`p-2 rounded text-sm ${opt === q.correctAnswer ? 'bg-green-50 dark:bg-green-900/20 border border-green-300' : 'bg-gray-50 dark:bg-slate-800'}`}>
                    {String.fromCharCode(65 + oi)}. {opt} {opt === q.correctAnswer && <CheckCircle className="w-3 h-3 inline text-green-600 ml-1" />}</div>))}</div>}
                <p className="text-sm text-gray-600"><strong>Answer:</strong> {q.correctAnswer}</p>
                <p className="text-sm text-gray-500 mt-1">{q.explanation}</p></CardContent></Card>))}
              {generatedQuestions.length === 0 && <p className="text-gray-500 text-center py-8">No questions generated yet. Use the Generate tab to create questions.</p>}</div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

