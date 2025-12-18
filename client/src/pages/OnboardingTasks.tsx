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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle, UserPlus, Calendar, FileText, Users, Briefcase } from "lucide-react";
import { useLocation } from "wouter";

export function OnboardingTasks() {
  const utils = trpc.useUtils();
  const [, navigate] = useLocation();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  
  // State for task assignment dialog
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [selectedRecruiters, setSelectedRecruiters] = useState<number[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // State for task completion dialog
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

  // Fetch all onboarding processes
  const { data: processes, isLoading: processesLoading } = trpc.onboarding.getAllOnboardingProcesses.useQuery();

  // Fetch tasks for selected process
  const { data: tasks, isLoading: tasksLoading } = trpc.onboarding.getTasksByProcess.useQuery(
    { processId: selectedProcessId! },
    { enabled: !!selectedProcessId }
  );

  // Fetch all recruiters for assignment
  const { data: recruiters } = trpc.onboarding.getAllRecruiters.useQuery();

  // Assign task mutation
  const assignTask = trpc.onboarding.assignTask.useMutation({
    onSuccess: () => {
      toast.success("Task assigned successfully");
      utils.onboarding.getTasksByProcess.invalidate();
      setIsAssignDialogOpen(false);
      resetAssignmentForm();
    },
    onError: (error) => {
      toast.error(`Failed to assign task: ${error.message}`);
    },
  });

  // Complete task mutation
  const completeTask = trpc.onboarding.completeTask.useMutation({
    onSuccess: () => {
      toast.success("Task marked as complete");
      utils.onboarding.getTasksByProcess.invalidate();
      setIsCompleteDialogOpen(false);
      setCompletionNotes("");
    },
    onError: (error) => {
      toast.error(`Failed to complete task: ${error.message}`);
    },
  });

  const resetAssignmentForm = () => {
    setSelectedTask(null);
    setSelectedRecruiters([]);
    setAssignmentNotes("");
  };

  const handleAssignTask = async () => {
    if (!selectedTask || selectedRecruiters.length === 0) {
      toast.error("Please select at least one recruiter");
      return;
    }

    // Assign task to each selected recruiter
    for (const recruiterId of selectedRecruiters) {
      await assignTask.mutateAsync({
        taskId: selectedTask,
        recruiterId: recruiterId,
      });
    }
  };

  const handleCompleteTask = () => {
    if (!selectedTask) return;

    completeTask.mutate({
      id: selectedTask,
      notes: completionNotes || undefined,
    });
  };

  const toggleRecruiter = (recruiterId: number) => {
    setSelectedRecruiters(prev =>
      prev.includes(recruiterId)
        ? prev.filter(id => id !== recruiterId)
        : [...prev, recruiterId]
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      completed: { variant: "default", icon: CheckCircle2 },
      pending: { variant: "secondary", icon: Clock },
      overdue: { variant: "destructive", icon: AlertCircle },
      "in-progress": { variant: "outline", icon: Clock },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getProcessTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "onboarding" ? "default" : "outline"}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Onboarding & Offboarding Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track onboarding/offboarding tasks across all processes
          </p>
        </div>
        <Button onClick={() => navigate("/recruiter/active-associates")}>
          <UserPlus className="h-4 w-4 mr-2" />
          View Associates
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Processes List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Active Processes</CardTitle>
            <CardDescription>Select a process to view tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {processesLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : processes && processes.length > 0 ? (
              <div className="space-y-2">
                {processes.map((process: any) => (
                  <div
                    key={process.onboardingProcesses?.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedProcessId === process.onboardingProcesses?.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedProcessId(process.onboardingProcesses?.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">
                        {process.users?.name || "Unknown Employee"}
                      </div>
                      {getProcessTypeBadge(process.onboardingProcesses?.processType || "onboarding")}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {process.associates?.jobTitle || "N/A"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {process.onboardingProcesses?.targetCompletionDate
                          ? new Date(process.onboardingProcesses.targetCompletionDate).toLocaleDateString()
                          : "N/A"}
                      </div>
                      {getStatusBadge(process.onboardingProcesses?.status || "pending")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No active processes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Process Tasks</CardTitle>
            <CardDescription>
              {selectedProcessId
                ? "Assign tasks to recruiters and track completion"
                : "Select a process to view tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedProcessId ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a process from the left to view tasks</p>
              </div>
            ) : tasksLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task: any) => (
                      <TableRow key={task.onboardingTasks?.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{task.onboardingTasks?.title}</div>
                            {task.onboardingTasks?.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {task.onboardingTasks.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {task.onboardingTasks?.taskType || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {task.onboardingTasks?.dueDate
                              ? new Date(task.onboardingTasks.dueDate).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className="text-sm">
                              {task.assignmentCount || 0} assigned
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(task.onboardingTasks?.status || "pending")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Assign Task Dialog */}
                            <Dialog
                              open={isAssignDialogOpen && selectedTask === task.onboardingTasks?.id}
                              onOpenChange={(open) => {
                                setIsAssignDialogOpen(open);
                                if (!open) resetAssignmentForm();
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTask(task.onboardingTasks?.id);
                                    setIsAssignDialogOpen(true);
                                  }}
                                >
                                  Assign
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Assign Task to Recruiters</DialogTitle>
                                  <DialogDescription>
                                    Select one or more recruiters to assign this task
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Select Recruiters</Label>
                                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                                      {recruiters?.map((recruiter: any) => (
                                        <div
                                          key={recruiter.id}
                                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                                        >
                                          <Checkbox
                                            id={`recruiter-${recruiter.id}`}
                                            checked={selectedRecruiters.includes(recruiter.id)}
                                            onCheckedChange={() => toggleRecruiter(recruiter.id)}
                                          />
                                          <label
                                            htmlFor={`recruiter-${recruiter.id}`}
                                            className="flex-1 cursor-pointer"
                                          >
                                            <div className="font-medium">{recruiter.users?.name || "Unknown"}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {recruiter.users?.email}
                                            </div>
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {selectedRecruiters.length} recruiter(s) selected
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="assignmentNotes">Notes (Optional)</Label>
                                    <Textarea
                                      id="assignmentNotes"
                                      placeholder="Add any additional instructions..."
                                      value={assignmentNotes}
                                      onChange={(e) => setAssignmentNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                </div>

                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setIsAssignDialogOpen(false);
                                      resetAssignmentForm();
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleAssignTask}
                                    disabled={assignTask.isPending || selectedRecruiters.length === 0}
                                  >
                                    {assignTask.isPending ? "Assigning..." : "Assign Task"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Complete Task Dialog */}
                            {task.onboardingTasks?.status !== "completed" && (
                              <Dialog
                                open={isCompleteDialogOpen && selectedTask === task.onboardingTasks?.id}
                                onOpenChange={(open) => {
                                  setIsCompleteDialogOpen(open);
                                  if (!open) {
                                    setSelectedTask(null);
                                    setCompletionNotes("");
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTask(task.onboardingTasks?.id);
                                      setIsCompleteDialogOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    Complete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Mark Task as Complete</DialogTitle>
                                    <DialogDescription>
                                      Confirm task completion and add any final notes
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="completionNotes">Completion Notes (Optional)</Label>
                                      <Textarea
                                        id="completionNotes"
                                        placeholder="Add any completion notes or outcomes..."
                                        value={completionNotes}
                                        onChange={(e) => setCompletionNotes(e.target.value)}
                                        rows={4}
                                      />
                                    </div>
                                  </div>

                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setIsCompleteDialogOpen(false);
                                        setSelectedTask(null);
                                        setCompletionNotes("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleCompleteTask}
                                      disabled={completeTask.isPending}
                                    >
                                      {completeTask.isPending ? "Completing..." : "Mark Complete"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks found for this process</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
