import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Settings, Activity, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLLMFallback() {
  const { toast } = useToast();
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [priority, setPriority] = useState("");
  const [maxRetries, setMaxRetries] = useState("3");
  const [retryDelay, setRetryDelay] = useState("1000");

  // Queries
  const { data: fallbackChain, isLoading: loadingChain } = trpc.llmManagement.getFallbackChain.useQuery();
  const { data: providerHealth, isLoading: loadingHealth } = trpc.llmManagement.getProviderHealth.useQuery();
  const { data: fallbackStats, isLoading: loadingStats } = trpc.llmManagement.getFallbackStats.useQuery({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
  });

  // Mutations
  const utils = trpc.useUtils();
  
  const updateConfig = trpc.llmManagement.updateFallbackConfig.useMutation({
    onSuccess: () => {
      toast({ title: "Fallback configuration updated" });
      utils.llmManagement.getFallbackChain.invalidate();
      utils.llmManagement.getProviderHealth.invalidate();
      setEditingConfig(null);
    },
    onError: (error) => {
      toast({ title: "Failed to update configuration", description: error.message, variant: "destructive" });
    },
  });

  const triggerHealthCheck = trpc.llmManagement.triggerHealthCheck.useMutation({
    onSuccess: () => {
      toast({ title: "Health check completed" });
      utils.llmManagement.getProviderHealth.invalidate();
    },
    onError: (error) => {
      toast({ title: "Health check failed", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateConfig = () => {
    if (!editingConfig) return;

    updateConfig.mutate({
      priority: parseInt(priority) || editingConfig.priority,
      provider: editingConfig.provider,
      enabled: editingConfig.enabled,
      maxRetries: parseInt(maxRetries) || 3,
      retryDelayMs: parseInt(retryDelay) || 1000,
    });
  };

  const handleToggleProvider = (provider: string, enabled: boolean, currentPriority: number) => {
    updateConfig.mutate({
      provider: provider as any,
      priority: currentPriority,
      enabled,
    });
  };

  const openEditDialog = (config: any) => {
    setEditingConfig(config);
    setPriority(config.priority.toString());
    setMaxRetries(config.maxRetries.toString());
    setRetryDelay(config.retryDelayMs.toString());
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Fallback Chain</h1>
          <p className="text-muted-foreground mt-1">
            Configure automatic failover between LLM providers
          </p>
        </div>
        <Button
          onClick={() => triggerHealthCheck.mutate()}
          disabled={triggerHealthCheck.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${triggerHealthCheck.isPending ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
      </div>

      {/* Fallback Chain Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Fallback Priority Order</CardTitle>
          <CardDescription>
            Providers are tried in order of priority when the active provider fails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingChain || loadingHealth ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : fallbackChain && fallbackChain.length > 0 ? (
            <div className="space-y-3">
              {fallbackChain.map((config, index) => {
                const health = providerHealth?.find(p => p.provider === config.provider);
                return (
                  <div key={config.id} className="relative">
                    {index < fallbackChain.length - 1 && (
                      <div className="absolute left-6 top-20 w-0.5 h-3 bg-border" />
                    )}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            config.enabled && health?.isHealthy 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {config.priority}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium capitalize text-lg">{config.provider}</p>
                            <Badge variant={config.enabled ? "default" : "secondary"}>
                              {config.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {health?.isHealthy ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Max retries: {config.maxRetries} | Retry delay: {config.retryDelayMs}ms | 
                            Failures: {config.failureCount}
                          </p>
                          {config.lastFailureAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last failure: {new Date(config.lastFailureAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.enabled}
                          onCheckedChange={(checked) => handleToggleProvider(config.provider, checked, config.priority)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(config)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fallback configuration found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fallback Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Fallback Events (Last 30 Days)</CardTitle>
          <CardDescription>
            History of provider failures and successful failovers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : fallbackStats && fallbackStats.length > 0 ? (
            <div className="space-y-3">
              {fallbackStats.map((stat: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{stat.fromProvider}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium capitalize">{stat.toProvider}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">Total Events</p>
                      <p className="text-2xl font-bold">{stat.totalEvents}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">Successful</p>
                      <p className="text-2xl font-bold text-green-600">{stat.successfulFallbacks}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{stat.failedFallbacks}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fallback events recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Configuration Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={(open) => !open && setEditingConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fallback Configuration</DialogTitle>
            <DialogDescription>
              Adjust retry settings for {editingConfig?.provider}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers are tried first (1 = highest priority)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Retries</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={maxRetries}
                onChange={(e) => setMaxRetries(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Number of retry attempts before moving to next provider
              </p>
            </div>

            <div className="space-y-2">
              <Label>Retry Delay (ms)</Label>
              <Input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={retryDelay}
                onChange={(e) => setRetryDelay(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Wait time between retry attempts
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateConfig} disabled={updateConfig.isPending}>
              {updateConfig.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
