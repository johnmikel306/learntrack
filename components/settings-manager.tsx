"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Settings, Brain, Upload, TestTube, Check, X, AlertCircle } from "lucide-react"

interface AIProvider {
  provider: string
  api_key?: string
  enabled: boolean
  models: string[]
  default_model?: string
  max_tokens: number
  temperature: number
}

interface AppSettings {
  ai: {
    providers: Record<string, AIProvider>
    default_provider: string
  }
  general: {
    app_name: string
    max_file_size_mb: number
    allowed_file_types: string[]
    default_question_count: number
    max_question_count: number
  }
  upload: {
    uploadthing_secret?: string
    uploadthing_app_id?: string
    max_file_size: number
    allowed_extensions: string[]
  }
}

interface SettingsManagerProps {
  onBack: () => void
}

export default function SettingsManager({ onBack }: SettingsManagerProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1"
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [providerTests, setProviderTests] = useState<Record<string, boolean>>({})

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || `Request failed: ${res.status}`)
    }
    return res.json()
  }

  async function loadSettings() {
    try {
      setLoading(true)
      const data = await apiFetch<AppSettings>("/settings/")
      setSettings(data)
    } catch (e: any) {
      toast({ title: "Failed to load settings", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function updateAIProvider(provider: string, updates: Partial<AIProvider>) {
    try {
      await apiFetch(`/settings/ai/${provider}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      })
      toast({ title: "AI provider updated successfully" })
      await loadSettings()
    } catch (e: any) {
      toast({ title: "Failed to update AI provider", description: e.message, variant: "destructive" })
    }
  }

  async function testAIProvider(provider: string) {
    try {
      setTestingProvider(provider)
      const result = await apiFetch<{ success: boolean; error?: string }>(`/settings/ai/${provider}/test`, {
        method: "POST",
      })
      
      setProviderTests(prev => ({ ...prev, [provider]: result.success }))
      
      if (result.success) {
        toast({ title: `${provider} connection successful` })
      } else {
        toast({ 
          title: `${provider} connection failed`, 
          description: result.error,
          variant: "destructive" 
        })
      }
    } catch (e: any) {
      setProviderTests(prev => ({ ...prev, [provider]: false }))
      toast({ title: "Test failed", description: e.message, variant: "destructive" })
    } finally {
      setTestingProvider(null)
    }
  }

  async function setDefaultProvider(provider: string) {
    try {
      await apiFetch(`/settings/ai/default/${provider}`, { method: "PUT" })
      toast({ title: `Default AI provider set to ${provider}` })
      await loadSettings()
    } catch (e: any) {
      toast({ title: "Failed to set default provider", description: e.message, variant: "destructive" })
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage application configuration</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Dashboard
        </Button>
      </div>

      <Tabs defaultValue="ai" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Providers
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            File Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Provider Configuration</CardTitle>
              <CardDescription>
                Configure AI providers for question generation. Default: {settings.ai.default_provider}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(settings.ai.providers).map(([providerName, provider]) => (
                <div key={providerName} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold capitalize">{providerName}</h3>
                      <Badge variant={provider.enabled ? "default" : "secondary"}>
                        {provider.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {settings.ai.default_provider === providerName && (
                        <Badge variant="outline">Default</Badge>
                      )}
                      {providerTests[providerName] !== undefined && (
                        <Badge variant={providerTests[providerName] ? "default" : "destructive"}>
                          {providerTests[providerName] ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testAIProvider(providerName)}
                        disabled={testingProvider === providerName || !provider.enabled}
                      >
                        {testingProvider === providerName ? (
                          <TestTube className="h-4 w-4 animate-spin" />
                        ) : (
                          <TestTube className="h-4 w-4" />
                        )}
                        Test
                      </Button>
                      {provider.enabled && settings.ai.default_provider !== providerName && (
                        <Button
                          size="sm"
                          onClick={() => setDefaultProvider(providerName)}
                        >
                          Set Default
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${providerName}-key`}>API Key</Label>
                      <Input
                        id={`${providerName}-key`}
                        type="password"
                        placeholder="Enter API key"
                        value={provider.api_key || ""}
                        onChange={(e) => {
                          const newProvider = { ...provider, api_key: e.target.value }
                          updateAIProvider(providerName, newProvider)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${providerName}-model`}>Default Model</Label>
                      <Select
                        value={provider.default_model || ""}
                        onValueChange={(value) => {
                          updateAIProvider(providerName, { ...provider, default_model: value })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {provider.models.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${providerName}-enabled`}
                      checked={provider.enabled}
                      onCheckedChange={(checked) => {
                        updateAIProvider(providerName, { ...provider, enabled: checked })
                      }}
                    />
                    <Label htmlFor={`${providerName}-enabled`}>Enable this provider</Label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Application Name</Label>
                  <Input value={settings.general.app_name} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input value={settings.general.max_file_size_mb} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Default Question Count</Label>
                  <Input value={settings.general.default_question_count} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Max Question Count</Label>
                  <Input value={settings.general.max_question_count} readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>File Upload Settings</CardTitle>
              <CardDescription>Configure file upload and processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>UploadThing App ID</Label>
                  <Input value={settings.upload.uploadthing_app_id || ""} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Max File Size (bytes)</Label>
                  <Input value={settings.upload.max_file_size} readOnly />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Allowed Extensions</Label>
                <div className="flex flex-wrap gap-2">
                  {settings.upload.allowed_extensions.map((ext) => (
                    <Badge key={ext} variant="outline">{ext}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
