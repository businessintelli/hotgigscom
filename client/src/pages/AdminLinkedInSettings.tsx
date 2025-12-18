import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle, AlertCircle, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLinkedInSettings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings
  const { data: settings, refetch: refetchSettings } = trpc.admin.getLinkedInSettings.useQuery();
  const { data: creditUsage } = trpc.admin.getLinkedInCreditUsage.useQuery();
  const { data: recruiterLimits } = trpc.admin.getRecruiterCreditLimits.useQuery();

  // Mutations
  const saveSettings = trpc.admin.saveLinkedInSettings.useMutation({
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "LinkedIn API credentials have been updated successfully.",
      });
      refetchSettings();
      setIsSaving(false);
      setApiKey("");
      setClientId("");
      setClientSecret("");
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  const updateRecruiterLimit = trpc.admin.updateRecruiterCreditLimit.useMutation({
    onSuccess: () => {
      toast({
        title: "Limit updated",
        description: "Recruiter credit limit has been updated.",
      });
      refetchSettings();
    },
  });

  const handleSaveCredentials = () => {
    if (!apiKey || !clientId || !clientSecret) {
      toast({
        title: "Missing fields",
        description: "Please fill in all credential fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    saveSettings.mutate({
      apiKey,
      clientId,
      clientSecret,
    });
  };

  const isConfigured = settings?.configured || false;
  const totalCreditsUsed = creditUsage?.reduce((sum, usage) => sum + usage.creditsUsed, 0) || 0;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">LinkedIn Integration Settings</h1>
        <p className="text-muted-foreground">
          Manage LinkedIn Recruiter API credentials and monitor InMail credit usage across your team
        </p>
      </div>

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList>
          <TabsTrigger value="credentials">API Credentials</TabsTrigger>
          <TabsTrigger value="usage">Credit Usage</TabsTrigger>
          <TabsTrigger value="limits">Recruiter Limits</TabsTrigger>
        </TabsList>

        {/* API Credentials Tab */}
        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>LinkedIn Recruiter API</CardTitle>
                  <CardDescription>
                    Configure your company's LinkedIn Recruiter API credentials
                  </CardDescription>
                </div>
                {isConfigured && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Configured
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isConfigured && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    LinkedIn API credentials are currently configured. Update the fields below to change them.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter LinkedIn API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Enter LinkedIn Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    placeholder="Enter LinkedIn Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> These credentials will be used by all recruiters in your organization.
                  InMail credits will be pooled from your company's LinkedIn Recruiter account.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleSaveCredentials}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Credentials
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Get LinkedIn API Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ol className="list-decimal list-inside space-y-2">
                <li>Log in to your LinkedIn Recruiter account</li>
                <li>Navigate to Settings → API Access</li>
                <li>Create a new API application or select an existing one</li>
                <li>Copy the API Key, Client ID, and Client Secret</li>
                <li>Paste them into the fields above and save</li>
              </ol>
              <p className="text-xs">
                Note: You need a LinkedIn Recruiter Corporate or Recruiter Lite license to access the API.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Credits Used</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCreditsUsed}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Recruiters</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{creditUsage?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Using InMails</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. per Recruiter</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {creditUsage && creditUsage.length > 0
                    ? Math.round(totalCreditsUsed / creditUsage.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Credits per recruiter</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Credit Usage by Recruiter</CardTitle>
              <CardDescription>Monitor InMail credit consumption across your team</CardDescription>
            </CardHeader>
            <CardContent>
              {!creditUsage || creditUsage.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No credit usage data available yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recruiter</TableHead>
                      <TableHead>Credits Used</TableHead>
                      <TableHead>Usage Type</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditUsage.map((usage) => (
                      <TableRow key={usage.id}>
                        <TableCell className="font-medium">
                          Recruiter #{usage.recruiterId}
                        </TableCell>
                        <TableCell>{usage.creditsUsed}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{usage.usageType}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(usage.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recruiter Limits Tab */}
        <TabsContent value="limits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Per-Recruiter Credit Limits</CardTitle>
              <CardDescription>
                Set monthly InMail credit limits for individual recruiters to manage usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!recruiterLimits || recruiterLimits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recruiters found. Limits will appear once recruiters start using LinkedIn features.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recruiter</TableHead>
                      <TableHead>Current Usage</TableHead>
                      <TableHead>Monthly Limit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recruiterLimits.map((limit) => (
                      <TableRow key={limit.recruiterId}>
                        <TableCell className="font-medium">
                          {limit.recruiterName || `Recruiter #${limit.recruiterId}`}
                        </TableCell>
                        <TableCell>
                          {limit.currentUsage || 0} credits
                        </TableCell>
                        <TableCell>
                          {limit.creditLimit || "Unlimited"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newLimit = prompt(
                                "Enter new monthly credit limit:",
                                String(limit.creditLimit || 100)
                              );
                              if (newLimit) {
                                updateRecruiterLimit.mutate({
                                  recruiterId: limit.recruiterId,
                                  creditLimit: parseInt(newLimit),
                                });
                              }
                            }}
                          >
                            Update Limit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Recruiters who exceed their monthly limit will be prevented from sending InMails until the limit is increased or the month resets.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
