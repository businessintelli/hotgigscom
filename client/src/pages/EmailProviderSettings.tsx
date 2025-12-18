import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Mail, Settings, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmailProviderSettings() {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const { data: providerData, isLoading, refetch } = trpc.admin.getEmailProvider.useQuery();
  const setProviderMutation = trpc.admin.setEmailProvider.useMutation({
    onSuccess: () => {
      toast({
        title: "Email provider updated",
        description: "The email service provider has been successfully changed.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to update provider",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set initial selected provider when data loads
  if (providerData && !selectedProvider) {
    setSelectedProvider(providerData.provider);
  }

  const handleSave = () => {
    if (!selectedProvider) {
      toast({
        title: "No provider selected",
        description: "Please select an email provider before saving.",
        variant: "destructive",
      });
      return;
    }

    setProviderMutation.mutate({ provider: selectedProvider as any });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Email Settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Email Settings">
      <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Email Provider Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure which email service provider to use for sending campaign emails and notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Email Provider</CardTitle>
          <CardDescription>
            Select the email service to use for all outgoing emails. Make sure the API key is configured before switching providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {providerData && (
            <>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Current provider: <strong className="capitalize">{providerData.provider}</strong>
                </AlertDescription>
              </Alert>

              <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
                <div className="space-y-4">
                  {providerData.availableProviders.map((provider) => (
                    <div
                      key={provider.value}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
                        selectedProvider === provider.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={provider.value} id={provider.value} className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor={provider.value} className="cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-base">{provider.label}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {provider.value === "sendgrid" && "Professional email delivery with advanced analytics"}
                                {provider.value === "resend" && "Modern email API with developer-friendly interface"}
                                {provider.value === "mock" && "Testing mode - emails are logged but not sent"}
                              </div>
                            </div>
                            {provider.configured ? (
                              <div className="flex items-center gap-1 text-green-600 text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Configured
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-orange-600 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                API Key Missing
                              </div>
                            )}
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={setProviderMutation.isPending || selectedProvider === providerData.provider}
                  className="w-full sm:w-auto"
                >
                  {setProviderMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                {selectedProvider !== providerData.provider && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You have unsaved changes
                  </p>
                )}
              </div>

              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> To configure API keys for SendGrid or Resend, please add them as environment variables:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><code className="text-sm bg-muted px-1 py-0.5 rounded">SENDGRID_API_KEY</code> for SendGrid</li>
                    <li><code className="text-sm bg-muted px-1 py-0.5 rounded">RESEND_API_KEY</code> for Resend</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
