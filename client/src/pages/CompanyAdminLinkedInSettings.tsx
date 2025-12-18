import { useState } from "react";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Linkedin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  TrendingUp,
  Mail,
  Users,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CompanyAdminLinkedInSettings() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState("daily");

  // Mock data - replace with actual API calls
  const linkedinStats = {
    accountName: "TechCorp Recruiting",
    inmailCreditsRemaining: 150,
    inmailCreditLimit: 200,
    searchCreditsRemaining: 450,
    searchCreditLimit: 500,
    lastSyncedAt: new Date().toISOString(),
    activeCampaigns: 3,
    responseRate: 24,
  };

  const handleConnect = () => {
    // Placeholder for LinkedIn OAuth flow
    toast({
      title: "LinkedIn Integration",
      description: "LinkedIn OAuth integration will be implemented here",
    });
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "LinkedIn account has been disconnected",
    });
  };

  const handleSync = () => {
    toast({
      title: "Syncing...",
      description: "Syncing data from LinkedIn",
    });
  };

  return (
    <CompanyAdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect and manage your LinkedIn Recruiter account
          </p>
        </div>

        {/* Connection Status */}
        <Card className={isConnected ? "border-green-200 bg-green-50/50" : "border-gray-200"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${isConnected ? "bg-green-100" : "bg-gray-100"}`}>
                  <Linkedin className={`h-6 w-6 ${isConnected ? "text-green-600" : "text-gray-600"}`} />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    LinkedIn Connection Status
                    {isConnected ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isConnected
                      ? `Connected as ${linkedinStats.accountName}`
                      : "Connect your LinkedIn Recruiter account to enable automated sourcing"}
                  </CardDescription>
                </div>
              </div>
              {isConnected ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSync}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button onClick={handleConnect}>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Connect LinkedIn
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {isConnected && (
          <>
            {/* Usage Statistics */}
            <div className="grid gap-6 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">InMail Credits</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{linkedinStats.inmailCreditsRemaining}</div>
                  <p className="text-xs text-muted-foreground">
                    of {linkedinStats.inmailCreditLimit} remaining
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{
                        width: `${(linkedinStats.inmailCreditsRemaining / linkedinStats.inmailCreditLimit) * 100}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Search Credits</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{linkedinStats.searchCreditsRemaining}</div>
                  <p className="text-xs text-muted-foreground">
                    of {linkedinStats.searchCreditLimit} remaining
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600"
                      style={{
                        width: `${(linkedinStats.searchCreditsRemaining / linkedinStats.searchCreditLimit) * 100}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{linkedinStats.activeCampaigns}</div>
                  <p className="text-xs text-muted-foreground">Currently running</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{linkedinStats.responseRate}%</div>
                  <p className="text-xs text-muted-foreground">Average response rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Sync Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Sync Settings</CardTitle>
                <CardDescription>
                  Configure how and when data is synchronized with LinkedIn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync">Automatic Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync data from LinkedIn at regular intervals
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="sync-frequency">Sync Frequency</Label>
                  <select
                    id="sync-frequency"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={syncFrequency}
                    onChange={(e) => setSyncFrequency(e.target.value)}
                    disabled={!autoSync}
                  >
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    How often to sync data from LinkedIn
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Last Synced</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(linkedinStats.lastSyncedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* API Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Advanced settings for LinkedIn API integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    type="text"
                    placeholder="Your LinkedIn Client ID"
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-secret">Client Secret</Label>
                  <Input
                    id="client-secret"
                    type="password"
                    placeholder="••••••••••••••••"
                    disabled
                  />
                </div>

                <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium">API credentials are managed securely</p>
                    <p className="text-blue-700 mt-1">
                      Contact support if you need to update your LinkedIn API credentials
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Getting Started Guide */}
        {!isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with LinkedIn Integration</CardTitle>
              <CardDescription>
                Follow these steps to connect your LinkedIn Recruiter account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4 list-decimal list-inside">
                <li className="text-sm">
                  <span className="font-medium">Click "Connect LinkedIn"</span> button above to start the OAuth flow
                </li>
                <li className="text-sm">
                  <span className="font-medium">Sign in to your LinkedIn Recruiter account</span> and authorize the application
                </li>
                <li className="text-sm">
                  <span className="font-medium">Configure sync settings</span> to automatically import candidate data
                </li>
                <li className="text-sm">
                  <span className="font-medium">Start using InMail templates</span> and automated sourcing campaigns
                </li>
              </ol>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-900">
                    <p className="font-medium">LinkedIn Recruiter License Required</p>
                    <p className="text-yellow-700 mt-1">
                      You need an active LinkedIn Recruiter license to use this integration. Contact LinkedIn sales if you don't have one.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CompanyAdminLayout>
  );
}
