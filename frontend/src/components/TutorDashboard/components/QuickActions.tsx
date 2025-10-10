import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Brain, BarChart3 } from "lucide-react"

interface QuickActionsProps {
  onViewChange: (view: string) => void
}

export function QuickActions({ onViewChange }: QuickActionsProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <Button
          onClick={() => onViewChange("create-new")}
          variant="outline"
          className="w-full justify-start"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
        <Button
          onClick={() => onViewChange("all-students")}
          variant="outline"
          className="w-full justify-start"
        >
          <Users className="h-4 w-4 mr-2" />
          View Students
        </Button>
        <Button
          onClick={() => onViewChange("ai-generator")}
          variant="outline"
          className="w-full justify-start"
        >
          <Brain className="h-4 w-4 mr-2" />
          Generate Questions
        </Button>
        <Button
          onClick={() => onViewChange("performance")}
          variant="outline"
          className="w-full justify-start"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Reports
        </Button>
      </CardContent>
    </Card>
  )
}

