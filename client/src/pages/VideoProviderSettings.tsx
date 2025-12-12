import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Video, Check, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function VideoProviderSettings() {
  const { toast } = useToast();
  const { data: config, isLoading, refetch } = trpc.admin.getVideoProvider.useQuery();
  const setProviderMutation = trpc.admin.setVideoProvider.useMutation();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selectedProvider) return;

    try {
      await setProviderMutation.mutateAsync({
        provider: selectedProvider as "zoom" | "teams" | "none",
      });
      
      toast({
        title: "Settings saved",
        description: `Video provider updated to ${selectedProvider}`,
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video provider settings",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const currentProvider = selectedProvider || config?.provider || "none";

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Provider Settings</h1>
        <p className="text-muted-foreground">
          Configure which video conferencing platform to use for interview scheduling
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Video Conferencing Provider
          </CardTitle>
          <CardDescription>
            Select the video platform for automatic meeting link generation when scheduling interviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Current provider: <strong>{config?.provider || "none"}</strong>
            </AlertDescription>
          </Alert>

          {/* Provider Selection */}
          <RadioGroup
            value={currentProvider}
            onValueChange={setSelectedProvider}
            className="space-y-4"
          >
            {/* None Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent">
              <RadioGroupItem value="none" id="none" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="none" className="text-base font-semibold cursor-pointer">
                  None (Manual Links)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  No automatic meeting links. Recruiters can manually add meeting links when scheduling interviews.
                </p>
              </div>
            </div>

            {/* Zoom Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent">
              <RadioGroupItem value="zoom" id="zoom" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="zoom" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                  Zoom
                  {config?.hasZoomCredentials && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically generate Zoom meeting links with cloud recording enabled.
                </p>
                {!config?.hasZoomCredentials && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Zoom credentials not configured. Please set ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, and ZOOM_ACCOUNT_ID environment variables.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Teams Option */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent">
              <RadioGroupItem value="teams" id="teams" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="teams" className="text-base font-semibold cursor-pointer flex items-center gap-2">
                  Microsoft Teams
                  {config?.hasTeamsCredentials && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically generate Microsoft Teams meeting links with calendar integration.
                </p>
                {!config?.hasTeamsCredentials && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-xs">
                      Teams credentials not configured. Please set TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, and TEAMS_TENANT_ID environment variables.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </RadioGroup>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedProvider(config?.provider || null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedProvider || selectedProvider === config?.provider || setProviderMutation.isPending}
            >
              {setProviderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> After changing the provider, all new video interviews will automatically generate meeting links using the selected platform. Existing interviews will not be affected.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
