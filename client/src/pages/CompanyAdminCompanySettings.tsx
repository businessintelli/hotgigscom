import { useState } from "react";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Building2, Save, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CompanyAdminCompanySettings() {
  const { toast } = useToast();
  const { data: settings, isLoading, refetch } = trpc.companyAdmin.getSettings.useQuery();
  const updateMutation = trpc.companyAdmin.updateSettings.useMutation();

  const [fromEmail, setFromEmail] = useState(settings?.fromEmail || "");
  const [fromName, setFromName] = useState(settings?.fromName || "");
  const [replyToEmail, setReplyToEmail] = useState(settings?.replyToEmail || "");
  const [emailNotifications, setEmailNotifications] = useState(settings?.enableEmailNotifications || false);
  const [smsNotifications, setSmsNotifications] = useState(settings?.enableSmsNotifications || false);
  const [companyLogo, setCompanyLogo] = useState(settings?.companyLogo || "");
  const [primaryColor, setPrimaryColor] = useState(settings?.primaryColor || "#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState(settings?.secondaryColor || "#10B981");

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        fromEmail: fromEmail || undefined,
        fromName: fromName || undefined,
        replyToEmail: replyToEmail || undefined,
        enableEmailNotifications: emailNotifications,
        enableSmsNotifications: smsNotifications,
        companyLogo: companyLogo || undefined,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
      });

      toast({
        title: "Settings saved",
        description: "Your company settings have been updated successfully",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to save settings",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <CompanyAdminLayout>
        <div className="space-y-6 p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
        </div>
      </CompanyAdminLayout>
    );
  }

  return (
    <CompanyAdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your company profile and preferences
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Company Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Company Profile</CardTitle>
            </div>
            <CardDescription>
              Basic information about your company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-logo">Company Logo URL</Label>
              <Input
                id="company-logo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Enter the URL of your company logo
              </p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Secondary Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#10B981"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Configure email settings for automated communications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from-name">From Name</Label>
              <Input
                id="from-name"
                placeholder="Your Company Name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                The name that appears in the "From" field of emails
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from-email">From Email</Label>
              <Input
                id="from-email"
                type="email"
                placeholder="noreply@yourcompany.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                The email address that emails are sent from
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-to-email">Reply-To Email</Label>
              <Input
                id="reply-to-email"
                type="email"
                placeholder="recruiting@yourcompany.com"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Where replies to automated emails should go
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Control how and when notifications are sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for important events
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS notifications for urgent updates
                </p>
              </div>
              <Switch
                id="sms-notifications"
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Keys (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys & Integrations</CardTitle>
            <CardDescription>
              Manage third-party integrations and API keys
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>SendGrid API Key</Label>
              <Input
                type="password"
                value={settings?.sendgridApiKey ? "••••••••••••••••" : "Not configured"}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>Resend API Key</Label>
              <Input
                type="password"
                value={settings?.resendApiKey ? "••••••••••••••••" : "Not configured"}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input
                type="password"
                value={settings?.openaiApiKey ? "••••••••••••••••" : "Not configured"}
                disabled
              />
            </div>

            <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">API keys are managed securely</p>
                <p className="text-blue-700 mt-1">
                  Contact support if you need to update your API keys
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CompanyAdminLayout>
  );
}
