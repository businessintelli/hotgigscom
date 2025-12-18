import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, TestTube, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

const NOTIFICATION_TYPES = [
  { id: "budget", label: "Budget Alerts" },
  { id: "llm_usage", label: "LLM Usage Alerts" },
  { id: "applications", label: "Application Status Updates" },
  { id: "interviews", label: "Interview Reminders" },
  { id: "system_health", label: "System Health Alerts" },
];

export default function IntegrationSettings() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [integrationType, setIntegrationType] = useState<"slack" | "teams">("slack");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(NOTIFICATION_TYPES.map(t => t.id));

  const { data: user } = trpc.auth.me.useQuery();
  const companyId = user?.companyId;
  const isCompanyAdmin = user?.role === "company_admin";
  const isAdmin = user?.role === "admin";

  // Get integrations
  const { data: integrations, isLoading, refetch } = isCompanyAdmin && companyId
    ? trpc.integrationSettings.getCompanyIntegrations.useQuery({ companyId })
    : trpc.integrationSettings.getUserIntegrations.useQuery();

  // Create integration mutation
  const createIntegration = trpc.integrationSettings.createIntegration.useMutation({
    onSuccess: () => {
      toast({
        title: "Integration Added",
        description: "Your integration has been configured successfully.",
      });
      setIsAddDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test integration mutation
  const testIntegration = trpc.integrationSettings.testIntegration.useMutation({
    onSuccess: () => {
      toast({
        title: "Test Successful",
        description: "Test notification sent successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete integration mutation
  const deleteIntegration = trpc.integrationSettings.deleteIntegration.useMutation({
    onSuccess: () => {
      toast({
        title: "Integration Deleted",
        description: "Integration has been removed.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update integration mutation
  const updateIntegration = trpc.integrationSettings.updateIntegration.useMutation({
    onSuccess: () => {
      toast({
        title: "Integration Updated",
        description: "Integration settings have been saved.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setWebhookUrl("");
    setChannelName("");
    setSelectedNotifications(NOTIFICATION_TYPES.map(t => t.id));
  };

  const handleAddIntegration = () => {
    createIntegration.mutate({
      companyId: isCompanyAdmin ? companyId : undefined,
      integrationType,
      webhookUrl,
      channelName: channelName || undefined,
      enabled: true,
      notificationTypes: selectedNotifications,
    });
  };

  const handleTestIntegration = (type: "slack" | "teams", url: string) => {
    testIntegration.mutate({
      integrationType: type,
      webhookUrl: url,
    });
  };

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    updateIntegration.mutate({
      id,
      enabled,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this integration?")) {
      deleteIntegration.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Integration Settings</h1>
          <p className="text-muted-foreground mt-2">
            Connect Slack and Microsoft Teams for real-time notifications
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Configure a new Slack or Microsoft Teams webhook integration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Integration Type</Label>
                <Select value={integrationType} onValueChange={(v: any) => setIntegrationType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="webhookUrl">Webhook URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={integrationType === "slack" 
                    ? "https://hooks.slack.com/services/..." 
                    : "https://xxxxx.webhook.office.com/..."}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {integrationType === "slack" 
                    ? "Create an incoming webhook in your Slack workspace settings" 
                    : "Create an incoming webhook in your Teams channel settings"}
                </p>
              </div>

              <div>
                <Label htmlFor="channelName">Channel Name (Optional)</Label>
                <Input
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="#notifications"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  For display purposes only
                </p>
              </div>

              <div>
                <Label className="mb-3 block">Notification Types</Label>
                <div className="space-y-2">
                  {NOTIFICATION_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedNotifications.includes(type.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNotifications([...selectedNotifications, type.id]);
                          } else {
                            setSelectedNotifications(selectedNotifications.filter(id => id !== type.id));
                          }
                        }}
                      />
                      <Label htmlFor={type.id} className="font-normal cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddIntegration} 
                disabled={!webhookUrl || createIntegration.isPending}
              >
                {createIntegration.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Integration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integrations List */}
      <div className="space-y-4">
        {integrations && integrations.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No integrations configured yet</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Integration
              </Button>
            </CardContent>
          </Card>
        )}

        {integrations && integrations.map((integration: any) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="capitalize">{integration.integrationType}</CardTitle>
                  {integration.channelName && (
                    <Badge variant="outline">{integration.channelName}</Badge>
                  )}
                  {integration.enabled ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      Disabled
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={integration.enabled}
                    onCheckedChange={(checked) => handleToggleEnabled(integration.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(integration.integrationType, integration.webhookUrl)}
                    disabled={testIntegration.isPending}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(integration.id)}
                    disabled={deleteIntegration.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label className="text-muted-foreground">Webhook URL</Label>
                  <p className="text-sm font-mono truncate">{integration.webhookUrl}</p>
                </div>
                {integration.notificationTypes && (
                  <div>
                    <Label className="text-muted-foreground">Enabled Notifications</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {JSON.parse(integration.notificationTypes).map((type: string) => (
                        <Badge key={type} variant="secondary">
                          {NOTIFICATION_TYPES.find(t => t.id === type)?.label || type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Slack Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to your Slack workspace settings</li>
                <li>Navigate to "Apps" → "Manage" → "Custom Integrations"</li>
                <li>Click "Incoming Webhooks" and "Add to Slack"</li>
                <li>Select a channel and copy the webhook URL</li>
                <li>Paste the URL above and configure notification types</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Microsoft Teams Setup:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Open your Teams channel</li>
                <li>Click "..." → "Manage channel" → "Edit"</li>
                <li>Search for "Incoming Webhook" and add it</li>
                <li>Provide a name and copy the webhook URL</li>
                <li>Paste the URL above and configure notification types</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
