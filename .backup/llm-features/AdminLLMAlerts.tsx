import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bell, Plus, Trash2, Edit, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AlertType = "usage_threshold" | "cost_threshold" | "error_rate" | "provider_failure";
type Period = "hourly" | "daily" | "weekly" | "monthly";

export default function AdminLLMAlerts() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<any>(null);

  // Form state
  const [alertType, setAlertType] = useState<AlertType>("usage_threshold");
  const [threshold, setThreshold] = useState("");
  const [period, setPeriod] = useState<Period>("daily");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Queries
  const { data: alerts, isLoading: loadingAlerts } = trpc.llmManagement.getAlerts.useQuery();
  const { data: alertHistory, isLoading: loadingHistory } = trpc.llmManagement.getAlertHistory.useQuery({
    limit: 50,
  });

  // Mutations
  const utils = trpc.useUtils();
  
  const createAlert = trpc.llmManagement.createAlert.useMutation({
    onSuccess: () => {
      toast({ title: "Alert created successfully" });
      utils.llmManagement.getAlerts.invalidate();
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Failed to create alert", description: error.message, variant: "destructive" });
    },
  });

  const updateAlert = trpc.llmManagement.updateAlert.useMutation({
    onSuccess: () => {
      toast({ title: "Alert updated successfully" });
      utils.llmManagement.getAlerts.invalidate();
      setEditingAlert(null);
    },
    onError: (error) => {
      toast({ title: "Failed to update alert", description: error.message, variant: "destructive" });
    },
  });

  const deleteAlert = trpc.llmManagement.deleteAlert.useMutation({
    onSuccess: () => {
      toast({ title: "Alert deleted successfully" });
      utils.llmManagement.getAlerts.invalidate();
    },
    onError: (error) => {
      toast({ title: "Failed to delete alert", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setAlertType("usage_threshold");
    setThreshold("");
    setPeriod("daily");
    setEmailRecipients("");
    setEnabled(true);
  };

  const handleCreateAlert = () => {
    if (!threshold || !emailRecipients) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    createAlert.mutate({
      alertType,
      threshold: parseFloat(threshold),
      period,
      emailRecipients,
      enabled,
    });
  };

  const handleUpdateAlert = (id: number, updates: any) => {
    updateAlert.mutate({ id, ...updates });
  };

  const handleDeleteAlert = (id: number) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteAlert.mutate({ id });
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      usage_threshold: "Token Usage",
      cost_threshold: "Cost Threshold",
      error_rate: "Error Rate",
      provider_failure: "Provider Failure",
    };
    return labels[type] || type;
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "usage_threshold":
        return <AlertCircle className="w-4 h-4" />;
      case "cost_threshold":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "error_rate":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "provider_failure":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LLM Usage Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Configure alerts for token usage, costs, and provider health
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
              <DialogDescription>
                Set up automated notifications for LLM usage monitoring
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Alert Type</Label>
                <Select value={alertType} onValueChange={(v) => setAlertType(v as AlertType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usage_threshold">Token Usage Threshold</SelectItem>
                    <SelectItem value="cost_threshold">Cost Threshold</SelectItem>
                    <SelectItem value="error_rate">Error Rate</SelectItem>
                    <SelectItem value="provider_failure">Provider Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Threshold</Label>
                <Input
                  type="number"
                  placeholder={alertType === "cost_threshold" ? "100.00" : "10000"}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {alertType === "usage_threshold" && "Number of tokens"}
                  {alertType === "cost_threshold" && "Dollar amount ($)"}
                  {alertType === "error_rate" && "Percentage (%)"}
                  {alertType === "provider_failure" && "Number of failures"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com, team@example.com"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated email addresses
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAlert} disabled={createAlert.isPending}>
                {createAlert.isPending ? "Creating..." : "Create Alert"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            Configured alert rules for system-wide monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAlerts ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getAlertTypeIcon(alert.alertType)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getAlertTypeLabel(alert.alertType)}</p>
                        <Badge variant={alert.enabled ? "default" : "secondary"}>
                          {alert.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {alert.companyId && (
                          <Badge variant="outline">Company-specific</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Threshold: {alert.threshold} | Period: {alert.period} | Recipients: {alert.emailRecipients}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={alert.enabled}
                      onCheckedChange={(checked) => handleUpdateAlert(alert.id, { enabled: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={deleteAlert.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No alerts configured yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                Create Your First Alert
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>
            Recent alert triggers and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : alertHistory && alertHistory.length > 0 ? (
            <div className="space-y-3">
              {alertHistory.map((history: any) => (
                <div key={history.history.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {history.history.emailSent ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">{getAlertTypeLabel(history.history.alertType)}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {history.history.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(history.history.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={history.history.emailSent ? "default" : "destructive"}>
                    {history.history.emailSent ? "Email Sent" : "Email Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No alerts triggered yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
