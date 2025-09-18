import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AssignmentManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignment Manager</CardTitle>
        <CardDescription>Create and manage assignments for your students</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button>Create New Assignment</Button>
          <p className="text-muted-foreground">Assignment management functionality coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}
