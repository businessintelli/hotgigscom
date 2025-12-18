import { useState, useEffect } from "react";
import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Filter,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Globe,
  Trash2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function AdminLogs() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [resolvedFilter, setResolvedFilter] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [showRetentionDialog, setShowRetentionDialog] = useState(false);
  const limit = 20;

  // Fetch logs
  const logsQuery = trpc.admin.getLogs.useQuery({
    level: levelFilter !== "all" ? levelFilter : undefined,
    source: sourceFilter !== "all" ? sourceFilter : undefined,
    search: searchQuery || undefined,
    resolved: resolvedFilter === "all" ? undefined : resolvedFilter === "resolved",
    limit,
    offset: page * limit,
  });

  // Fetch stats
  const statsQuery = trpc.admin.getLogStats.useQuery();

  // Fetch retention policy
  const retentionQuery = trpc.admin.getLogRetentionDays.useQuery();

  // Update retention days when query loads
  useEffect(() => {
    if (retentionQuery.data?.days) {
      setRetentionDays(retentionQuery.data.days);
    }
  }, [retentionQuery.data]);

  // Resolve log mutation
  const resolveLogMutation = trpc.admin.resolveLog.useMutation();

  // Set retention days mutation
  const setRetentionMutation = trpc.admin.setLogRetentionDays.useMutation();

  // Cleanup old logs mutation
  const cleanupMutation = trpc.admin.cleanupOldLogs.useMutation();

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const handleResolve = async (id: number) => {
    try {
      await resolveLogMutation.mutateAsync({ id });
      toast({
        title: "Log Resolved",
        description: "The log entry has been marked as resolved",
      });
      logsQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve log entry",
        variant: "destructive",
      });
    }
  };

  const handleSaveRetention = async () => {
    try {
      await setRetentionMutation.mutateAsync({ days: retentionDays });
      toast({
        title: "Saved",
        description: `Log retention policy set to ${retentionDays} days`,
      });
      setShowRetentionDialog(false);
      retentionQuery.refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update retention policy",
        variant: "destructive",
      });
    }
  };

  const handleCleanupLogs = async () => {
    try {
      const result = await cleanupMutation.mutateAsync();
      toast({
        title: "Cleanup Complete",
        description: `Deleted ${result.deletedCount} old log entries`,
      });
      logsQuery.refetch();
      statsQuery.refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup old logs",
        variant: "destructive",
      });
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "debug":
        return <Bug className="h-4 w-4 text-gray-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "critical":
        return <XCircle className="h-4 w-4 text-red-700" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      debug: "bg-gray-100 text-gray-700 border-gray-200",
      info: "bg-blue-100 text-blue-700 border-blue-200",
      warn: "bg-yellow-100 text-yellow-700 border-yellow-200",
      error: "bg-red-100 text-red-700 border-red-200",
      critical: "bg-red-200 text-red-800 border-red-300",
    };
    return (
      <Badge variant="outline" className={variants[level] || ""}>
        {getLevelIcon(level)}
        <span className="ml-1 capitalize">{level}</span>
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  const stats = statsQuery.data || { total: 0, unresolvedCount: 0, byLevel: {} as Record<string, number>, bySource: {} as Record<string, number> };
  const logs = (logsQuery.data as any)?.logs || [];
  const totalLogs = (logsQuery.data as any)?.total || 0;
  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <AdminLayout title="Application Logs">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Unresolved</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unresolvedCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Errors</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(stats.byLevel?.error || 0) + (stats.byLevel?.critical || 0)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sources</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.bySource || {}).length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Log Retention Policy */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Log Retention Policy
                </CardTitle>
                <CardDescription>
                  Configure how long resolved logs are retained before automatic cleanup
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Retention:</span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
                    className="w-20 h-8"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleSaveRetention}
                  disabled={setRetentionMutation.isPending}
                >
                  {setRetentionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cleanup Now
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cleanup Old Logs?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all resolved logs older than {retentionDays} days.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCleanupLogs}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {cleanupMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Delete Old Logs
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {Object.keys(stats.bySource || {}).map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  logsQuery.refetch();
                  statsQuery.refetch();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Log Entries
                </CardTitle>
                <CardDescription>
                  Showing {logs.length} of {totalLogs} entries
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No log entries found</p>
                <p className="text-sm">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log: any) => (
                  <Collapsible
                    key={log.id}
                    open={expandedLogs.has(log.id)}
                    onOpenChange={() => toggleExpand(log.id)}
                  >
                    <div
                      className={`border rounded-lg ${
                        log.resolved ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"
                      } ${
                        log.level === "error" || log.level === "critical"
                          ? "border-l-4 border-l-red-500"
                          : log.level === "warn"
                          ? "border-l-4 border-l-yellow-500"
                          : ""
                      }`}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-3 flex-1">
                            {getLevelBadge(log.level)}
                            <Badge variant="outline" className="text-xs">
                              {log.source}
                            </Badge>
                            <span className={`text-sm flex-1 truncate ${log.resolved ? "text-gray-500" : ""}`}>
                              {log.message}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(log.createdAt)}
                            </span>
                            {log.resolved ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Resolve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Mark as Resolved?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark the log entry as resolved. You can still view it in the resolved logs.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleResolve(log.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Resolve
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {expandedLogs.has(log.id) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                          <div className="pt-3 grid gap-3 md:grid-cols-2">
                            {log.userId && (
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-500">User ID:</span>
                                <span>{log.userId}</span>
                              </div>
                            )}
                            {log.requestId && (
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-500">Request ID:</span>
                                <code className="bg-gray-200 px-1 rounded text-xs">{log.requestId}</code>
                              </div>
                            )}
                            {log.ipAddress && (
                              <div className="flex items-center gap-2 text-sm">
                                <Globe className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-500">IP:</span>
                                <span>{log.ipAddress}</span>
                              </div>
                            )}
                          </div>
                          {log.details && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Details:</p>
                              <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                {log.details}
                              </pre>
                            </div>
                          )}
                          {log.stackTrace && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Stack Trace:</p>
                              <pre className="bg-red-900 text-red-100 p-3 rounded text-xs overflow-x-auto max-h-48">
                                {log.stackTrace}
                              </pre>
                            </div>
                          )}
                          {log.userAgent && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">User Agent:</p>
                              <p className="text-xs text-gray-600 bg-gray-200 p-2 rounded">{log.userAgent}</p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
