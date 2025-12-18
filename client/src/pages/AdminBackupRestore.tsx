import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Database, 
  Server, 
  Download, 
  Upload, 
  Trash2, 
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AdminBackupRestore() {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [backupDescription, setBackupDescription] = useState("");

  const utils = trpc.useUtils();

  // Database backups
  const { data: databaseBackups, isLoading: loadingDbBackups } = 
    trpc.backup.listDatabaseBackups.useQuery();
  
  const { data: backupStats } = 
    trpc.backup.getDatabaseBackupStats.useQuery();

  const createDbBackup = trpc.backup.createDatabaseBackup.useMutation({
    onSuccess: () => {
      toast.success("Database backup created successfully");
      utils.backup.listDatabaseBackups.invalidate();
      utils.backup.getDatabaseBackupStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create backup: ${error.message}`);
    },
  });

  const restoreDbBackup = trpc.backup.restoreDatabaseBackup.useMutation({
    onSuccess: () => {
      toast.success("Database restored successfully");
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast.error(`Failed to restore backup: ${error.message}`);
    },
  });

  const deleteDbBackup = trpc.backup.deleteDatabaseBackup.useMutation({
    onSuccess: () => {
      toast.success("Backup deleted successfully");
      utils.backup.listDatabaseBackups.invalidate();
      utils.backup.getDatabaseBackupStats.invalidate();
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete backup: ${error.message}`);
    },
  });

  // Environment backups
  const { data: envBackups, isLoading: loadingEnvBackups } = 
    trpc.backup.listEnvironmentBackups.useQuery();

  const createEnvBackup = trpc.backup.createEnvironmentBackup.useMutation({
    onSuccess: () => {
      toast.success("Environment backup created successfully");
      utils.backup.listEnvironmentBackups.invalidate();
      setBackupDescription("");
    },
    onError: (error) => {
      toast.error(`Failed to create environment backup: ${error.message}`);
    },
  });

  const restoreEnvBackup = trpc.backup.restoreEnvironmentBackup.useMutation({
    onSuccess: (data) => {
      toast.success(`Environment restored: ${data.restored} variables restored, ${data.skipped} skipped`);
      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast.error(`Failed to restore environment: ${error.message}`);
    },
  });

  const deleteEnvBackup = trpc.backup.deleteEnvironmentBackup.useMutation({
    onSuccess: () => {
      toast.success("Environment backup deleted successfully");
      utils.backup.listEnvironmentBackups.invalidate();
      setDeleteDialogOpen(false);
      setSelectedBackup(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete backup: ${error.message}`);
    },
  });

  const handleCreateDatabaseBackup = () => {
    createDbBackup.mutate({});
  };

  const handleCreateEnvironmentBackup = () => {
    createEnvBackup.mutate({ description: backupDescription || undefined });
  };

  const handleRestore = () => {
    if (!selectedBackup) return;

    if (selectedBackup.type === "database") {
      restoreDbBackup.mutate({ backupId: selectedBackup.id });
    } else {
      restoreEnvBackup.mutate({ backupId: selectedBackup.id });
    }
  };

  const handleDelete = () => {
    if (!selectedBackup) return;

    if (selectedBackup.type === "database") {
      deleteDbBackup.mutate({ backupId: selectedBackup.id });
    } else {
      deleteEnvBackup.mutate({ backupId: selectedBackup.id });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Backup & Restore">
      <div className="space-y-6">
        {/* Statistics */}
        {backupStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Backups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupStats.totalBackups}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBytes(backupStats.totalSize)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backupStats.successRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Last Backup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {backupStats.lastBackup 
                    ? formatDistanceToNow(new Date(backupStats.lastBackup), { addSuffix: true })
                    : "Never"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Database Backups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Backups
                </CardTitle>
                <CardDescription>
                  Create and manage full database backups
                </CardDescription>
              </div>
              <Button 
                onClick={handleCreateDatabaseBackup}
                disabled={createDbBackup.isPending}
              >
                {createDbBackup.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4 mr-2" />
                    Create Backup
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDbBackups ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : databaseBackups && databaseBackups.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {databaseBackups.map((backup: any) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.filename}</TableCell>
                      <TableCell>{formatBytes(backup.filesize)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.backup_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{backup.created_by_name || "System"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {backup.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBackup({ ...backup, type: "database" });
                                setRestoreDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup({ ...backup, type: "database" });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No database backups yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Backups */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Environment Backups
                </CardTitle>
                <CardDescription>
                  Backup and restore environment variables and configuration
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Description (optional)"
                  value={backupDescription}
                  onChange={(e) => setBackupDescription(e.target.value)}
                  className="w-64"
                />
                <Button 
                  onClick={handleCreateEnvironmentBackup}
                  disabled={createEnvBackup.isPending}
                >
                  {createEnvBackup.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <HardDrive className="h-4 w-4 mr-2" />
                      Create Backup
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEnvBackups ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : envBackups && envBackups.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {envBackups.map((backup: any) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.filename}</TableCell>
                      <TableCell>{backup.description || "-"}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(backup.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{backup.created_by_name || "System"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup({ ...backup, type: "environment" });
                              setRestoreDialogOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup({ ...backup, type: "environment" });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Server className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No environment backups yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore Confirmation Dialog */}
        <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Confirm Restore
              </DialogTitle>
              <DialogDescription>
                This action will restore the {selectedBackup?.type} from the backup. 
                {selectedBackup?.type === "database" && (
                  <span className="block mt-2 text-red-600 font-semibold">
                    Warning: This will overwrite all current database data!
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Backup:</strong> {selectedBackup?.filename}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Created:</strong> {selectedBackup?.created_at && formatDistanceToNow(new Date(selectedBackup.created_at), { addSuffix: true })}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRestoreDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRestore}
                disabled={restoreDbBackup.isPending || restoreEnvBackup.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {(restoreDbBackup.isPending || restoreEnvBackup.isPending) ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Restore
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Delete Backup
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this backup? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                <strong>Backup:</strong> {selectedBackup?.filename}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteDbBackup.isPending || deleteEnvBackup.isPending}
                variant="destructive"
              >
                {(deleteDbBackup.isPending || deleteEnvBackup.isPending) ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
