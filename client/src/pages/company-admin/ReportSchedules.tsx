import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Calendar, Clock, Mail, Trash2, Pause, Play, History } from "lucide-react";
import { format } from "date-fns";

export default function ReportSchedules() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("submissions");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [timeOfDay, setTimeOfDay] = useState("09:00");
  const [recipients, setRecipients] = useState("");

  const { data: schedules, isLoading, refetch } = trpc.companyAdmin.getReportSchedules.useQuery();
  const { data: customReports } = trpc.companyAdmin.getCustomReports.useQuery();

  const createScheduleMutation = trpc.companyAdmin.createReportSchedule.useMutation({
    onSuccess: () => {
      toast.success("Report schedule created successfully!");
      setIsCreateDialogOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create schedule: ${error.message}`);
    },
  });

  const updateScheduleMutation = trpc.companyAdmin.updateReportSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update schedule: ${error.message}`);
    },
  });

  const deleteScheduleMutation = trpc.companyAdmin.deleteReportSchedule.useMutation({
    onSuccess: () => {
      toast.success("Schedule deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete schedule: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedReportType("submissions");
    setFrequency("weekly");
    setDayOfWeek(1);
    setDayOfMonth(1);
    setTimeOfDay("09:00");
    setRecipients("");
  };

  const handleCreate = () => {
    const emailList = recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emailList.length === 0) {
      toast.error("Please enter at least one recipient email");
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
      return;
    }

    const reportId = selectedReportType === "custom" ? undefined : undefined; // TODO: Add custom report selection

    createScheduleMutation.mutate({
      reportId,
      reportType: selectedReportType,
      frequency,
      dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      timeOfDay: `${timeOfDay}:00`,
      recipients: emailList,
    });
  };

  const toggleSchedule = (scheduleId: number, currentStatus: boolean) => {
    updateScheduleMutation.mutate({
      scheduleId,
      isActive: !currentStatus,
    });
  };

  const handleDelete = (scheduleId: number) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      deleteScheduleMutation.mutate({ scheduleId });
    }
  };

  const getFrequencyDisplay = (schedule: any) => {
    if (schedule.frequency === "daily") {
      return "Daily";
    } else if (schedule.frequency === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `Weekly on ${days[schedule.dayOfWeek || 0]}`;
    } else if (schedule.frequency === "monthly") {
      return `Monthly on day ${schedule.dayOfMonth}`;
    }
    return schedule.frequency;
  };

  const getReportTypeDisplay = (reportType: string) => {
    const types: Record<string, string> = {
      submissions: "Total Submissions Report",
      placements: "Placements Report",
      by_job: "Submissions by Job Report",
      backed_out: "Backed Out Candidates Report",
      feedback: "Feedback Report",
      custom: "Custom Report",
    };
    return types[reportType] || reportType;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Report Schedules</h1>
          <p className="text-muted-foreground mt-2">
            Automate report delivery with daily, weekly, or monthly schedules
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Report Schedule</DialogTitle>
              <DialogDescription>
                Set up automated report delivery to specified email addresses
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submissions">Total Submissions Report</SelectItem>
                    <SelectItem value="placements">Placements Report</SelectItem>
                    <SelectItem value="by_job">Submissions by Job Report</SelectItem>
                    <SelectItem value="backed_out">Backed Out Candidates Report</SelectItem>
                    <SelectItem value="feedback">Feedback Report</SelectItem>
                    {customReports && customReports.length > 0 && (
                      <>
                        <SelectItem value="custom" disabled>
                          Custom Reports (Coming Soon)
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                  <SelectTrigger id="frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency === "weekly" && (
                <div>
                  <Label htmlFor="dayOfWeek">Day of Week</Label>
                  <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                    <SelectTrigger id="dayOfWeek">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {frequency === "monthly" && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="timeOfDay">Time of Day</Label>
                <Input
                  id="timeOfDay"
                  type="time"
                  value={timeOfDay}
                  onChange={(e) => setTimeOfDay(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                <Input
                  id="recipients"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="john@example.com, jane@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter multiple email addresses separated by commas
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createScheduleMutation.isPending}>
                {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : schedules && schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.isActive ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {getReportTypeDisplay(schedule.reportType)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {getFrequencyDisplay(schedule)} at {schedule.timeOfDay?.slice(0, 5) || "09:00"}
                    </CardDescription>
                  </div>
                  <Badge variant={schedule.isActive ? "default" : "secondary"}>
                    {schedule.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {Array.isArray(schedule.recipients) ? schedule.recipients.length : 0} recipient(s)
                    </span>
                  </div>

                  {schedule.lastSentAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <History className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last sent: {format(new Date(schedule.lastSentAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  )}

                  {schedule.nextSendAt && schedule.isActive && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Next send: {format(new Date(schedule.nextSendAt), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSchedule(schedule.id, schedule.isActive)}
                    disabled={updateScheduleMutation.isPending}
                  >
                    {schedule.isActive ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deleteScheduleMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Schedules Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first report schedule to automate report delivery to your team
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Schedule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
