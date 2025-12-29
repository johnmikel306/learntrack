/**
 * Document Statistics Component
 * Displays charts and breakdowns of document processing stats
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

interface DashboardStats {
  total_documents: number;
  total_chunks: number;
  total_tokens: number;
  by_status: Record<string, number>;
  by_format: Record<string, number>;
  by_processor: Record<string, number>;
  storage_used_mb: number;
  last_ingestion: string | null;
  pending_count: number;
  failed_count: number;
}

interface DocumentStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Completed', color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> },
  pending: { label: 'Pending', color: 'bg-yellow-500', icon: <Clock className="h-4 w-4" /> },
  processing: { label: 'Processing', color: 'bg-blue-500', icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  failed: { label: 'Failed', color: 'bg-red-500', icon: <XCircle className="h-4 w-4" /> },
};

const FORMAT_COLORS: Record<string, string> = {
  'application/pdf': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'text/plain': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'text/html': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

function getFormatLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'text/plain': 'TXT',
    'text/html': 'HTML',
    'text/markdown': 'MD',
  };
  return labels[mimeType] || mimeType.split('/').pop()?.toUpperCase() || 'Unknown';
}

export function DocumentStats({ stats, loading }: DocumentStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No statistics available
        </CardContent>
      </Card>
    );
  }

  const totalByStatus = Object.values(stats.by_status).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processing Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(stats.by_status).map(([status, count]) => {
            const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-500', icon: <FileText className="h-4 w-4" /> };
            const percentage = totalByStatus > 0 ? (count / totalByStatus) * 100 : 0;
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="capitalize">{config.label}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Format Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Document Formats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_format).map(([format, count]) => (
              <Badge
                key={format}
                variant="secondary"
                className={FORMAT_COLORS[format] || 'bg-gray-100 text-gray-800'}
              >
                {getFormatLabel(format)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processor Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Processors Used</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.by_processor).map(([processor, count]) => (
              <div key={processor} className="flex items-center justify-between">
                <span className="text-sm capitalize">{processor.replace('_', ' ')}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Token Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Tokens</span>
            <span className="font-bold text-lg">{stats.total_tokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg per Document</span>
            <span className="font-medium">
              {stats.total_documents > 0
                ? Math.round(stats.total_tokens / stats.total_documents).toLocaleString()
                : 0}
            </span>
          </div>
          {stats.last_ingestion && (
            <div className="pt-2 border-t">
              <span className="text-xs text-gray-400">
                Last ingestion: {new Date(stats.last_ingestion).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

