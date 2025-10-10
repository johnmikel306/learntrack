import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface PlaceholderViewProps {
  title: string
  description: string
  icon: LucideIcon
  message: string
  submessage: string
}

export function PlaceholderView({ title, description, icon: Icon, message, submessage }: PlaceholderViewProps) {
  return (
    <div className="space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-1">{description}</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>This feature is coming soon</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center text-slate-500 dark:text-slate-400">
            <Icon className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium">{message}</p>
            <p className="text-sm mt-2">{submessage}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

