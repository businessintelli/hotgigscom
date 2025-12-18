import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Activity,
  Zap,
  Settings,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LLMProvider = "manus" | "gemini" | "openai" | "ollama";

interface ProviderConfig {
  id: number;
  provider: LLMProvider;
  is_active: boolean;
  priority: number;
  api_key: string | null;
  api_url: string | null;
  model_name: string | null;
  max_tokens: number;
  temperature: number;
  timeout_seconds: number;
  total_requests: number;
  total_tokens_used: number;
  last_used_at: Date | null;
  status: "unconfigured" | "healthy" | "error" | "rate_limited";
  last_error: string | null;
  last_health_check: Date | null;
  configured_by: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

const providerInfo = {
  manus: {
    name: "Manus Forge",
    description: "Built-in AI service on Manus platform. Automatic configuration, no API key needed.",
    icon: "🔷",
    color: "blue",
  },
  gemini: {
    name: "Google Gemini",
    description: "Google's advanced AI model. Cost-efficient and fast. Requires API key from Google AI Studio.",
    icon: "💎",
    color: "purple",
  },
  openai: {
    name: "OpenAI GPT",
    description: "Industry-standard AI from OpenAI. Requires API key from OpenAI platform.",
    icon: "🤖",
    color: "green",
  },
  ollama: {
    name: "Ollama (Self-hosted)",
    description: "Run AI models locally or on your own infrastructure. Requires Ollama server URL.",
    icon: "🏠",
    color: "orange",
  },
};

export default function LLMSettings() {
  const { toast } = useToast();
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<LLMProvider | null>(null);
  
  // Form state for editing
  const [formData, setFormData] = useState<{
    api_key?: string;
    api_url?: string;
    model_name?: string;
    max_tokens?: number;
    temperature?: number;
    timeout_seconds?: number;
    notes?: string;
  }>({});

  // Queries
  const { data: configurations, isLoading, refetch } = trpc.llmConfig.getAllConfigurations.useQuery();
  const { data: activeProvider } = trpc.llmConfig.getActiveProvider.useQuery();
  const { data: usageStats } = trpc.llmConfig.getUsageStats.useQuery({});

  // Mutations
  const updateConfig = trpc.llmConfig.updateConfiguration.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Configuration Updated",
        description: data.message,
      });
      refetch();
      setEditingProvider(null);
      setFormData({});
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activateProvider = trpc.llmConfig.activateProvider.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Provider Activated",
        description: data.message,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnection = trpc.llmConfig.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `${data.message} (${data.responseTime}ms)`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message,
          variant: "destructive",
        });
      }
      refetch();
      setTestingProvider(null);
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
      setTestingProvider(null);
    },
  });

  const handleEdit = (config: ProviderConfig) => {
    setEditingProvider(config.provider);
    setFormData({
      api_key: "",
      api_url: config.api_url || "",
      model_name: config.model_name || "",
      max_tokens: config.max_tokens,
      temperature: config.temperature,
      timeout_seconds: config.timeout_seconds,
      notes: config.notes || "",
    });
  };

  const handleSave = (provider: LLMProvider) => {
    updateConfig.mutate({
      provider,
      ...formData,
    });
  };

  const handleActivate = (provider: LLMProvider) => {
    activateProvider.mutate({ provider });
  };

  const handleTest = (provider: LLMProvider) => {
    setTestingProvider(provider);
    const config = configurations?.find(c => c.provider === provider);
    testConnection.mutate({
      provider,
      api_key: formData.api_key || undefined,
      api_url: formData.api_url || config?.api_url || undefined,
      model_name: formData.model_name || config?.model_name || undefined,
    });
  };

  const getStatusBadge = (status: ProviderConfig["status"]) => {
    const variants = {
      unconfigured: { variant: "secondary" as const, icon: AlertCircle, text: "Not Configured" },
      healthy: { variant: "default" as const, icon: CheckCircle2, text: "Healthy" },
      error: { variant: "destructive" as const, icon: X, text: "Error" },
      rate_limited: { variant: "outline" as const, icon: AlertCircle, text: "Rate Limited" },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout title="LLM Settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="LLM Settings">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LLM Configuration</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage AI language model providers for your application
          </p>
        </div>

        {/* Active Provider Alert */}
        {activeProvider && (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertTitle>Active Provider</AlertTitle>
            <AlertDescription>
              Currently using <strong>{providerInfo[activeProvider.provider].name}</strong> for all AI operations.
              {activeProvider.last_used_at && (
                <span className="text-muted-foreground ml-2">
                  Last used: {new Date(activeProvider.last_used_at).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Usage Statistics */}
        {usageStats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.total_requests.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.total_tokens.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.success_rate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(usageStats.avg_response_time)}ms</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Provider Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {configurations?.map((config) => {
            const info = providerInfo[config.provider];
            const isEditing = editingProvider === config.provider;
            const isTesting = testingProvider === config.provider;
            const isActive = activeProvider?.provider === config.provider;

            return (
              <Card key={config.provider} className={cn(isActive && "border-primary")}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{info.icon}</div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {info.name}
                          {isActive && (
                            <Badge variant="default" className="gap-1">
                              <Check className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">{info.description}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(config.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Configuration Form */}
                  {isEditing ? (
                    <div className="space-y-4">
                      {config.provider !== "manus" && (
                        <>
                          {config.provider !== "ollama" && (
                            <div className="space-y-2">
                              <Label htmlFor={`${config.provider}-api-key`}>API Key</Label>
                              <Input
                                id={`${config.provider}-api-key`}
                                type="password"
                                placeholder="Enter new API key (leave blank to keep existing)"
                                value={formData.api_key || ""}
                                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                              />
                            </div>
                          )}
                          {config.provider === "ollama" && (
                            <div className="space-y-2">
                              <Label htmlFor={`${config.provider}-api-url`}>API URL</Label>
                              <Input
                                id={`${config.provider}-api-url`}
                                type="url"
                                placeholder="http://localhost:11434"
                                value={formData.api_url || ""}
                                onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor={`${config.provider}-model`}>Model Name</Label>
                            <Input
                              id={`${config.provider}-model`}
                              placeholder={config.model_name || "e.g., gpt-3.5-turbo"}
                              value={formData.model_name || ""}
                              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`${config.provider}-max-tokens`}>Max Tokens</Label>
                          <Input
                            id={`${config.provider}-max-tokens`}
                            type="number"
                            value={formData.max_tokens || config.max_tokens}
                            onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${config.provider}-temperature`}>Temperature</Label>
                          <Input
                            id={`${config.provider}-temperature`}
                            type="number"
                            step="0.1"
                            min="0"
                            max="2"
                            value={formData.temperature || config.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`${config.provider}-timeout`}>Timeout (s)</Label>
                          <Input
                            id={`${config.provider}-timeout`}
                            type="number"
                            value={formData.timeout_seconds || config.timeout_seconds}
                            onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`${config.provider}-notes`}>Notes</Label>
                        <Textarea
                          id={`${config.provider}-notes`}
                          placeholder="Admin notes about this configuration..."
                          value={formData.notes || ""}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(config.provider)}
                          disabled={updateConfig.isPending}
                        >
                          {updateConfig.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Configuration
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingProvider(null);
                            setFormData({});
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Configuration Display */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model:</span>
                          <span className="font-mono">{config.model_name || "default"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Priority:</span>
                          <span>{config.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Requests:</span>
                          <span>{config.total_requests.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Tokens:</span>
                          <span>{config.total_tokens_used.toLocaleString()}</span>
                        </div>
                        {config.last_health_check && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Health Check:</span>
                            <span>{new Date(config.last_health_check).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {config.last_error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Last Error</AlertTitle>
                          <AlertDescription className="text-xs font-mono">
                            {config.last_error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {config.notes && (
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {config.notes}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTest(config.provider)}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Test Connection
                        </Button>
                        {!isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleActivate(config.provider)}
                            disabled={activateProvider.isPending}
                          >
                            {activateProvider.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            Activate
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Guide</CardTitle>
            <CardDescription>How to obtain API keys and configure each provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">🔷 Manus Forge</h4>
              <p className="text-sm text-muted-foreground">
                Automatically configured on Manus platform. No additional setup required.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">💎 Google Gemini</h4>
              <p className="text-sm text-muted-foreground">
                1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a><br />
                2. Create a new API key<br />
                3. Paste the key in the configuration above<br />
                4. Recommended model: <code className="bg-muted px-1 py-0.5 rounded">gemini-1.5-flash</code>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🤖 OpenAI GPT</h4>
              <p className="text-sm text-muted-foreground">
                1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI Platform</a><br />
                2. Create a new API key<br />
                3. Paste the key in the configuration above<br />
                4. Recommended model: <code className="bg-muted px-1 py-0.5 rounded">gpt-3.5-turbo</code> or <code className="bg-muted px-1 py-0.5 rounded">gpt-4</code>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🏠 Ollama (Self-hosted)</h4>
              <p className="text-sm text-muted-foreground">
                1. Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary underline">ollama.ai</a><br />
                2. Start Ollama server: <code className="bg-muted px-1 py-0.5 rounded">ollama serve</code><br />
                3. Pull a model: <code className="bg-muted px-1 py-0.5 rounded">ollama pull deepseek-vl2</code><br />
                4. Enter your Ollama API URL (default: <code className="bg-muted px-1 py-0.5 rounded">http://localhost:11434</code>)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
