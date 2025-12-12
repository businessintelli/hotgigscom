import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, UserMinus, Calendar, Briefcase, Building, Mail, Phone, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function ActiveAssociates() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // State for onboarding/offboarding dialogs
  const [selectedAssociate, setSelectedAssociate] = useState<number | null>(null);
  const [processType, setProcessType] = useState<"onboarding" | "offboarding">("onboarding");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch all associates
  const { data: associates, isLoading } = trpc.onboarding.getAllAssociates.useQuery();

  // Fetch onboarding stats
  const { data: stats } = trpc.onboarding.getOnboardingStats.useQuery();

  // Initiate onboarding/offboarding mutation
  const initiateProcess = trpc.onboarding.initiateOnboarding.useMutation({
    onSuccess: () => {
      toast.success(`${processType === "onboarding" ? "Onboarding" : "Offboarding"} process initiated successfully`);
      utils.onboarding.getAllAssociates.invalidate();
      utils.onboarding.getOnboardingStats.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to initiate process: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedAssociate(null);
    setProcessType("onboarding");
    setDueDate("");
    setNotes("");
  };

  const handleInitiateProcess = () => {
    if (!selectedAssociate || !dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    initiateProcess.mutate({
      associateId: selectedAssociate,
      processType,
      dueDate: new Date(dueDate),
      notes: notes || undefined,
    });
  };

  // Filter associates based on search and status
  const filteredAssociates = associates?.filter((assoc: any) => {
    const matchesSearch =
      assoc.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assoc.associates?.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assoc.associates?.department?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || assoc.associates?.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      active: { variant: "default", icon: CheckCircle2 },
      onboarding: { variant: "secondary", icon: Clock },
      offboarding: { variant: "outline", icon: AlertCircle },
      terminated: { variant: "destructive", icon: AlertCircle },
    };

    const config = variants[status] || variants.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header with Stats */}
      <div>
        <h1 className="text-3xl font-bold">Active Associates</h1>
        <p className="text-muted-foreground mt-2">
          Manage onboarded employees and track onboarding/offboarding processes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Associates</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeAssociates || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.onboardingProcesses || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offboarding</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offboardingProcesses || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProcesses || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Associates List</CardTitle>
          <CardDescription>View and manage all onboarded employees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, job title, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="offboarding">Offboarding</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Associates Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAssociates && filteredAssociates.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssociates.map((assoc: any) => (
                    <TableRow key={assoc.associates?.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {assoc.users?.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          {assoc.users?.name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {assoc.associates?.jobTitle || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {assoc.associates?.department || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {assoc.associates?.startDate
                            ? new Date(assoc.associates.startDate).toLocaleDateString()
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assoc.associates?.status || "active")}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {assoc.users?.email && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {assoc.users.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isDialogOpen && selectedAssociate === assoc.associates?.id} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) resetForm();
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAssociate(assoc.associates?.id || null);
                                setIsDialogOpen(true);
                              }}
                            >
                              Initiate Process
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Initiate Onboarding/Offboarding Process</DialogTitle>
                              <DialogDescription>
                                Start a new onboarding or offboarding process for {assoc.users?.name}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="processType">Process Type</Label>
                                <Select
                                  value={processType}
                                  onValueChange={(value) => setProcessType(value as "onboarding" | "offboarding")}
                                >
                                  <SelectTrigger id="processType">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="onboarding">Onboarding</SelectItem>
                                    <SelectItem value="offboarding">Offboarding</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="dueDate">Target Completion Date *</Label>
                                <Input
                                  id="dueDate"
                                  type="date"
                                  value={dueDate}
                                  onChange={(e) => setDueDate(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add any additional notes or instructions..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsDialogOpen(false);
                                  resetForm();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleInitiateProcess}
                                disabled={initiateProcess.isPending}
                              >
                                {initiateProcess.isPending ? "Initiating..." : "Initiate Process"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No associates found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
