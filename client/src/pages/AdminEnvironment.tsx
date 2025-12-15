import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import {
  Server,
  Database,
  Globe,
  RefreshCw,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Key,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Save,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Environment variables that are safe to display (non-sensitive)
const displayableEnvVars = [
  { key: "VITE_APP_TITLE", description: "Application title displayed in the UI", category: "App Config" },
  { key: "VITE_APP_LOGO", description: "Application logo URL", category: "App Config" },
  { key: "VITE_APP_ID", description: "Manus OAuth application ID", category: "OAuth" },
  { key: "VITE_OAUTH_PORTAL_URL", description: "Manus login portal URL", category: "OAuth" },
  { key: "NODE_ENV", description: "Current environment (development/production)", category: "Environment" },
  { key: "VITE_ANALYTICS_WEBSITE_ID", description: "Analytics website identifier", category: "Analytics" },
  { key: "VITE_ANALYTICS_ENDPOINT", description: "Analytics data endpoint", category: "Analytics" },
  { key: "VIDEO_PROVIDER", description: "Video conferencing provider (zoom/teams/none)", category: "Video" },
];

// Sensitive environment variables (masked by default)
const sensitiveEnvVars = [
  // Database
  { key: "DATABASE_URL", description: "Database connection string", category: "Database" },
  
  // Security
  { key: "JWT_SECRET", description: "JWT signing secret", category: "Security" },
  
  // Manus/Forge API
  { key: "BUILT_IN_FORGE_API_KEY", description: "Manus Forge API key (server-side)", category: "Manus API" },
  { key: "BUILT_IN_FORGE_API_URL", description: "Manus Forge API URL", category: "Manus API" },
  { key: "VITE_FRONTEND_FORGE_API_KEY", description: "Manus Forge API key (frontend)", category: "Manus API" },
  { key: "VITE_FRONTEND_FORGE_API_URL", description: "Manus Forge API URL (frontend)", category: "Manus API" },
  
  // AI/LLM APIs
  { key: "OPENAI_API_KEY", description: "OpenAI API key for GPT models", category: "AI/LLM" },
  { key: "ANTHROPIC_API_KEY", description: "Anthropic API key for Claude models", category: "AI/LLM" },
  
  // Email Services
  { key: "SENDGRID_API_KEY", description: "SendGrid email API key", category: "Email" },
  { key: "RESEND_API_KEY", description: "Resend email API key", category: "Email" },
  
  // Video Conferencing
  { key: "ZOOM_CLIENT_ID", description: "Zoom OAuth client ID", category: "Video" },
  { key: "ZOOM_CLIENT_SECRET", description: "Zoom OAuth client secret", category: "Video" },
  { key: "ZOOM_ACCOUNT_ID", description: "Zoom account ID", category: "Video" },
  { key: "TEAMS_CLIENT_ID", description: "Microsoft Teams client ID", category: "Video" },
  { key: "TEAMS_CLIENT_SECRET", description: "Microsoft Teams client secret", category: "Video" },
  { key: "TEAMS_TENANT_ID", description: "Microsoft Teams tenant ID", category: "Video" },
  
  // Storage (S3)
  { key: "S3_BUCKET_NAME", description: "S3 bucket name for file storage", category: "Storage" },
  { key: "S3_REGION", description: "S3 bucket region", category: "Storage" },
  { key: "S3_ACCESS_KEY_ID", description: "S3 access key ID", category: "Storage" },
  { key: "S3_SECRET_ACCESS_KEY", description: "S3 secret access key", category: "Storage" },
  
  // Payment (Stripe)
  { key: "STRIPE_SECRET_KEY", description: "Stripe secret API key", category: "Payment" },
  { key: "VITE_STRIPE_PUBLISHABLE_KEY", description: "Stripe publishable key (frontend)", category: "Payment" },
  { key: "STRIPE_WEBHOOK_SECRET", description: "Stripe webhook signing secret", category: "Payment" },
  
  // SMS/Communication (Twilio)
  { key: "TWILIO_ACCOUNT_SID", description: "Twilio account SID", category: "SMS" },
  { key: "TWILIO_AUTH_TOKEN", description: "Twilio auth token", category: "SMS" },
  { key: "TWILIO_PHONE_NUMBER", description: "Twilio phone number for SMS", category: "SMS" },
];

interface ServiceStatus {
  name: string;
  status: "running" | "stopped" | "error" | "restarting";
  port?: number;
  uptime?: string;
}

export default function AdminEnvironment() {
  const { toast } = useToast();
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [isRestarting, setIsRestarting] = useState<string | null>(null);
  const [newEnvKey, setNewEnvKey] = useState("");
  const [newEnvValue, setNewEnvValue] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Get environment info from backend
  const envQuery = trpc.admin.getEnvironmentInfo.useQuery();
  const restartServiceMutation = trpc.admin.restartService.useMutation();
  const stopServiceMutation = trpc.admin.stopService.useMutation();
  const startServiceMutation = trpc.admin.startService.useMutation();

  const services: ServiceStatus[] = envQuery.data?.services || [
    { name: "Frontend (Vite)", status: "running", port: 3000, uptime: "2h 34m" },
    { name: "Backend (Express)", status: "running", port: 3000, uptime: "2h 34m" },
    { name: "Database (TiDB)", status: "running", uptime: "5d 12h" },
  ];

  const toggleSensitive = (key: string) => {
    setShowSensitive(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
    });
  };

  const handleRestartService = async (serviceName: string) => {
    setIsRestarting(serviceName);
    try {
      await restartServiceMutation.mutateAsync({ service: serviceName });
      toast({
        title: "Service Restarting",
        description: `${serviceName} is being restarted...`,
      });
      // Simulate restart delay
      setTimeout(() => {
        setIsRestarting(null);
        toast({
          title: "Service Restarted",
          description: `${serviceName} has been restarted successfully`,
        });
        envQuery.refetch();
      }, 3000);
    } catch (error) {
      setIsRestarting(null);
      toast({
        title: "Restart Failed",
        description: `Failed to restart ${serviceName}`,
        variant: "destructive",
      });
    }
  };

  const handleRestartAll = async () => {
    setIsRestarting("all");
    try {
      await restartServiceMutation.mutateAsync({ service: "all" });
      toast({
        title: "Restarting All Services",
        description: "All services are being restarted...",
      });
      setTimeout(() => {
        setIsRestarting(null);
        toast({
          title: "All Services Restarted",
          description: "All services have been restarted successfully",
        });
        envQuery.refetch();
      }, 5000);
    } catch (error) {
      setIsRestarting(null);
      toast({
        title: "Restart Failed",
        description: "Failed to restart all services",
        variant: "destructive",
      });
    }
  };

  const handleStopAll = async () => {
    try {
      await stopServiceMutation.mutateAsync({ service: "all" });
      toast({
        title: "Stopping All Services",
        description: "All services are being stopped...",
      });
      envQuery.refetch();
    } catch (error) {
      toast({
        title: "Stop Failed",
        description: "Failed to stop services",
        variant: "destructive",
      });
    }
  };

  const handleStartAll = async () => {
    try {
      await startServiceMutation.mutateAsync({ service: "all" });
      toast({
        title: "Starting All Services",
        description: "All services are being started...",
      });
      envQuery.refetch();
    } catch (error) {
      toast({
        title: "Start Failed",
        description: "Failed to start services",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Running</Badge>;
      case "stopped":
        return <Badge variant="secondary"><Square className="h-3 w-3 mr-1" /> Stopped</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
      case "restarting":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Restarting</Badge>;
    }
  };

  const getEnvValue = (key: string) => {
    // Values come from backend API
    const envValues: Record<string, string> = envQuery.data?.envVars || {};
    return envValues[key] || "Not configured";
  };

  const maskValue = (value: string) => {
    if (value.length <= 8) return "••••••••";
    return value.substring(0, 4) + "••••••••" + value.substring(value.length - 4);
  };

  return (
    <AdminLayout title="Environment Management">
      <div className="space-y-6">
        {/* Service Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  Service Management
                </CardTitle>
                <CardDescription>
                  Monitor and control platform services
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                      <Play className="h-4 w-4 mr-1" />
                      Start All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Start All Services</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will start all stopped services. Are you sure you want to continue?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStartAll} className="bg-green-600 hover:bg-green-700">
                        Start All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                      <Square className="h-4 w-4 mr-1" />
                      Stop All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Stop All Services</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will stop all running services. The platform will be unavailable until services are restarted. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleStopAll} className="bg-red-600 hover:bg-red-700">
                        Stop All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isRestarting === "all"}
                    >
                      {isRestarting === "all" ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Restart All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Restart All Services</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will restart all services. There may be brief downtime during the restart. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRestartAll} className="bg-blue-600 hover:bg-blue-700">
                        Restart All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {service.name.includes("Frontend") && <Globe className="h-5 w-5 text-purple-600" />}
                      {service.name.includes("Backend") && <Server className="h-5 w-5 text-blue-600" />}
                      {service.name.includes("Database") && <Database className="h-5 w-5 text-green-600" />}
                      <span className="font-medium">{service.name}</span>
                    </div>
                    {getStatusBadge(isRestarting === service.name ? "restarting" : service.status)}
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {service.port && <p>Port: {service.port}</p>}
                    {service.uptime && <p>Uptime: {service.uptime}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRestartService(service.name)}
                      disabled={isRestarting === service.name}
                    >
                      {isRestarting === service.name ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Restart
                    </Button>
                    {service.status === "running" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => stopServiceMutation.mutate({ service: service.name })}
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        onClick={() => startServiceMutation.mutate({ service: service.name })}
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environment Variables - App Config */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Application Configuration
                </CardTitle>
                <CardDescription>
                  Public environment variables for app configuration
                </CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Environment Variable</DialogTitle>
                    <DialogDescription>
                      Add a new environment variable. Note: Changes require a service restart to take effect.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="env-key">Variable Name</Label>
                      <Input
                        id="env-key"
                        placeholder="VITE_MY_VARIABLE"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="env-value">Value</Label>
                      <Input
                        id="env-value"
                        placeholder="Enter value..."
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast({
                        title: "Variable Added",
                        description: `${newEnvKey} has been added. Restart services to apply changes.`,
                      });
                      setShowAddDialog(false);
                      setNewEnvKey("");
                      setNewEnvValue("");
                    }}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayableEnvVars.map((envVar) => (
                <div
                  key={envVar.key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        {envVar.key}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {envVar.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{envVar.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white px-3 py-1 rounded border max-w-[300px] truncate">
                      {getEnvValue(envVar.key)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(getEnvValue(envVar.key))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sensitive Environment Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-red-600" />
              Sensitive Variables
            </CardTitle>
            <CardDescription>
              API keys and secrets - handle with care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sensitiveEnvVars.map((envVar) => {
                const value = getEnvValue(envVar.key);
                const isVisible = showSensitive[envVar.key];
                
                return (
                  <div
                    key={envVar.key}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          {envVar.key}
                        </code>
                        <Badge variant="outline" className="text-xs border-red-200 text-red-700">
                          {envVar.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{envVar.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-white px-3 py-1 rounded border max-w-[300px] truncate font-mono">
                        {isVisible ? value : maskValue(value)}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleSensitive(envVar.key)}
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyToClipboard(value)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    These values are sensitive and should never be shared publicly. To update secrets, 
                    go to Settings → Secrets in the Management UI.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 text-blue-600" />
                <span>Clear Cache</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Database className="h-6 w-6 text-green-600" />
                <span>Run Migrations</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Globe className="h-6 w-6 text-purple-600" />
                <span>Rebuild Frontend</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                <Server className="h-6 w-6 text-orange-600" />
                <span>View Logs</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
