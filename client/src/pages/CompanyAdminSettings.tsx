import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Key, Mail, Brain, Save, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function CompanyAdminSettings() {
  const { toast } = useToast();
  const { data: settings, isLoading } = trpc.companyAdmin.getSettings.useQuery();
  const updateSettings = trpc.companyAdmin.updateSettings.useMutation({
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your company settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // API Keys state
  const [sendgridKey, setSendgridKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [linkedinKey, setLinkedinKey] = useState("");

  // Visibility toggles
  const [showSendgrid, setShowSendgrid] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showLinkedin, setShowLinkedin] = useState(false);

  // Load settings when data arrives
  useEffect(() => {
    if (settings) {
      setSendgridKey(settings.sendgridApiKey || "");
      setResendKey(settings.resendApiKey || "");
      setOpenaiKey(settings.openaiApiKey || "");
      setLinkedinKey(settings.linkedinApiKey || "");
    }
  }, [settings]);

  const handleSaveApiKeys = () => {
    updateSettings.mutate({
      sendgridApiKey: sendgridKey,
      resendApiKey: resendKey,
      openaiApiKey: openaiKey,
      linkedinApiKey: linkedinKey,
    });
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + "•".repeat(key.length - 8) + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <CompanyAdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground mt-2">Loading settings...</p>
          </div>
        </div>
      </CompanyAdminLayout>
    );
  }

  return (
    <CompanyAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Company Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your company's API keys and configuration
          </p>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="email">Email Configuration</TabsTrigger>
            <TabsTrigger value="ai">AI Configuration</TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Configure third-party service API keys for your company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* SendGrid API Key */}
                <div className="space-y-2">
                  <Label htmlFor="sendgrid" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    SendGrid API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="sendgrid"
                      type={showSendgrid ? "text" : "password"}
                      placeholder="SG.xxxxxxxxxxxxxxxxxxxxx"
                      value={sendgridKey}
                      onChange={(e) => setSendgridKey(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSendgrid(!showSendgrid)}
                    >
                      {showSendgrid ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for sending transactional emails and campaigns
                  </p>
                </div>

                {/* Resend API Key */}
                <div className="space-y-2">
                  <Label htmlFor="resend" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Resend API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="resend"
                      type={showResend ? "text" : "password"}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxx"
                      value={resendKey}
                      onChange={(e) => setResendKey(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowResend(!showResend)}
                    >
                      {showResend ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alternative email service provider
                  </p>
                </div>

                {/* OpenAI API Key */}
                <div className="space-y-2">
                  <Label htmlFor="openai" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    OpenAI API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="openai"
                      type={showOpenai ? "text" : "password"}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxx"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowOpenai(!showOpenai)}
                    >
                      {showOpenai ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Powers AI features like resume parsing and matching
                  </p>
                </div>

                {/* LinkedIn API Key */}
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    LinkedIn Recruiter API Key
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="linkedin"
                      type={showLinkedin ? "text" : "password"}
                      placeholder="Enter LinkedIn API key"
                      value={linkedinKey}
                      onChange={(e) => setLinkedinKey(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowLinkedin(!showLinkedin)}
                    >
                      {showLinkedin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Required for LinkedIn candidate sourcing and InMail
                  </p>
                </div>

                <Button
                  onClick={handleSaveApiKeys}
                  disabled={updateSettings.isPending}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSettings.isPending ? "Saving..." : "Save API Keys"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Configuration Tab */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure email settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Email Provider</Label>
                    <p className="text-sm text-muted-foreground">
                      Current: {settings?.emailProvider || "SendGrid"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>From Email Address</Label>
                    <Input
                      placeholder="noreply@yourcompany.com"
                      defaultValue={settings?.fromEmail || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>From Name</Label>
                    <Input
                      placeholder="Your Company Name"
                      defaultValue={settings?.fromName || ""}
                    />
                  </div>
                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Email Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Configuration Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>
                  Configure AI-powered features and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <p className="text-sm text-muted-foreground">
                      Current: GPT-4 (Recommended)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Resume Parsing</Label>
                    <p className="text-sm text-muted-foreground">
                      Status: {settings?.aiEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>AI Matching</Label>
                    <p className="text-sm text-muted-foreground">
                      Status: {settings?.aiMatchingEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Button className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save AI Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CompanyAdminLayout>
  );
}
