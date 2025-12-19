import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BulkUploadHistory() {
  const { data: uploadHistory, isLoading } = trpc.recruiter.getBulkUploadHistory.useQuery();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Upload History</h1>
        <p className="text-muted-foreground">
          Track your bulk candidate uploads and download failed records for correction
        </p>
      </div>

      {!uploadHistory || uploadHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upload History</h3>
              <p className="text-muted-foreground">
                Your bulk candidate uploads will appear here
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {uploadHistory.map((upload) => (
            <Card key={upload.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {upload.fileName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Uploaded {formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })}
                      {' • '}
                      {formatFileSize(upload.fileSize)}
                    </CardDescription>
                  </div>
                  {getStatusBadge(upload.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Records</p>
                    <p className="text-2xl font-bold">{upload.totalRecords}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Successfully Imported</p>
                    <p className="text-2xl font-bold text-green-600">{upload.successCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{upload.failureCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">
                      {upload.totalRecords > 0 
                        ? Math.round((upload.successCount / upload.totalRecords) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>

                {upload.status === 'processing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="font-medium">Processing in background...</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      You'll receive an email when processing completes
                    </p>
                  </div>
                )}

                {upload.status === 'failed' && upload.errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-red-800">Error:</p>
                    <p className="text-sm text-red-700 mt-1">{upload.errorMessage}</p>
                  </div>
                )}

                {upload.status === 'completed' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Upload completed successfully</span>
                    </div>
                    {upload.processingCompletedAt && (
                      <p className="text-sm text-green-700 mt-1">
                        Completed {formatDistanceToNow(new Date(upload.processingCompletedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                )}

                {upload.failureCount > 0 && upload.failedRecordsUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={upload.failedRecordsUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download Failed Records CSV
                      </a>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Review and correct the failed records, then re-upload
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
