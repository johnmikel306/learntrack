import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function StudentManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Manager</CardTitle>
        <CardDescription>Manage your students and their information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button>Add New Student</Button>
          <p className="text-muted-foreground">Student management functionality coming soon...</p>
        </div>
      </CardContent>
    </Card>
  )
}
