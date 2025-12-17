import { useState } from "react";
import RecruiterLayout from "@/components/RecruiterLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Linkedin, Calendar, Link as LinkIcon, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function IntegrationSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("linkedin");

  // LinkedIn integration state
  const linkedInResponseRate = trpc.recruiter.getInMailResponseRate.useQuery();

  // Calendar integration state  
  const schedulingStats = trpc.recruiter.getSchedulingLinkStats.useQuery();
  const calendlyEventTypes = trpc.recruiter.getCalendlyEventTypes.useQuery();

  const handleLinkedInConnect = () => {
    toast({
      title: "LinkedIn Integration",
      description: "LinkedIn Recruiter API requires enterprise access. Please contact your LinkedIn account manager or use the manual import feature.",
    });
  };

  const handleGoogleCalendarConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/integrations/callback/google`;
      const result = await trpc.recruiter.getGoogleCalendarAuthUrl.query({ redirectUri });
      window.location.href = result.authUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate Google Calendar connection",
        variant: "destructive",
      });
    }
  };

  const handleCalendlyConnect = async () => {
    try {
      const redirectUri = `${window.location.origin}/integrations/callback/calendly`;
      const result = await trpc.recruiter.getCalendlyAuthUrl.query({ redirectUri });
      window.location.href = result.authUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate Calendly connection",
        variant: "destructive",
      });
    }
  };

  return (
    <RecruiterLayout title="Integration Settings">
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integration Settings</h1>
        <p className="text-muted-foreground mt-2">
          Connect your recruitment tools to automate workflows and sync data
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="linkedin">
            <Linkedin className="w-4 h-4 mr-2" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="scheduling">
            <LinkIcon className="w-4 h-4 mr-2" />
            Scheduling
          </TabsTrigger>
        </TabsList>

        {/* LinkedIn Integration Tab */}
        <TabsContent value="linkedin" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    LinkedIn Recruiter
                  </CardTitle>
                  <CardDescription>
                    Import candidate profiles and track InMail outreach
                  </CardDescription>
                </div>
                <Badge variant="secondary">Mock Mode</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  LinkedIn Recruiter API requires enterprise-level access. This integration uses mock data for demonstration.
                  In production, you would need to apply for API access through LinkedIn's partner program.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">InMails Sent</div>
                  <div className="text-2xl font-bold">
                    {linkedInResponseRate.data?.totalSent || 0}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Response Rate</div>
                  <div className="text-2xl font-bold">
                    {linkedInResponseRate.data?.responseRate.toFixed(1) || 0}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Import candidate profiles from LinkedIn searches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Auto-fill candidate data (experience, education, skills)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Track InMail messages and response rates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Integrate with sourcing campaigns</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleLinkedInConnect} className="flex-1">
                  <Linkedin className="w-4 h-4 mr-2" />
                  Connect LinkedIn Recruiter
                </Button>
                <Button variant="outline" asChild>
                  <a href="/recruiter/linkedin-import" className="flex items-center">
                    Manual Import
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alternative Data Providers</CardTitle>
              <CardDescription>
                Third-party services that provide LinkedIn data without official API access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Proxycurl</h4>
                    <Badge variant="outline">Recommended</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Real-time LinkedIn profile data API with 99.9% uptime
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://nubela.co/proxycurl/" target="_blank" rel="noopener noreferrer">
                      Learn More
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">RocketReach</h4>
                    <Badge variant="outline">Popular</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Contact information and profile enrichment for 700M+ professionals
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://rocketreach.co/" target="_blank" rel="noopener noreferrer">
                      Learn More
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">People Data Labs</h4>
                    <Badge variant="outline">Enterprise</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Comprehensive people data API with 3B+ profiles
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://www.peopledatalabs.com/" target="_blank" rel="noopener noreferrer">
                      Learn More
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Integration Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Google Calendar
                  </CardTitle>
                  <CardDescription>
                    Sync interviews and automatically create calendar events
                  </CardDescription>
                </div>
                <Badge variant="outline">Not Connected</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Auto-create calendar events for interviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Check availability before scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Automatic Google Meet links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Two-way sync for updates and cancellations</span>
                  </li>
                </ul>
              </div>

              <Button onClick={handleGoogleCalendarConnect} className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Connect Google Calendar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Microsoft Outlook
                  </CardTitle>
                  <CardDescription>
                    Sync with Outlook Calendar and Microsoft Teams
                  </CardDescription>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Microsoft Outlook integration will be available in the next release. It will support both personal and work accounts.
              </p>
              <Button disabled className="w-full">
                Connect Outlook Calendar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Links Tab */}
        <TabsContent value="scheduling" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-purple-600" />
                    Calendly
                  </CardTitle>
                  <CardDescription>
                    Send self-service scheduling links to candidates
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {calendlyEventTypes.data && calendlyEventTypes.data.length > 0 ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedulingStats.data && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Links Sent</div>
                    <div className="text-2xl font-bold">{schedulingStats.data.totalLinks}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Clicked</div>
                    <div className="text-2xl font-bold">{schedulingStats.data.clicked}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Booked</div>
                    <div className="text-2xl font-bold">{schedulingStats.data.booked}</div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Conversion</div>
                    <div className="text-2xl font-bold">{schedulingStats.data.conversionRate.toFixed(1)}%</div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium">Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Send scheduling links via email or SMS</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Candidates pick their own time slots</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Automatic confirmation and reminders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Track booking conversions</span>
                  </li>
                </ul>
              </div>

              {calendlyEventTypes.data && calendlyEventTypes.data.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium">Your Event Types</h4>
                  <div className="space-y-2">
                    {calendlyEventTypes.data.map((eventType) => (
                      <div key={eventType.uri} className="border rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{eventType.name}</div>
                          <div className="text-sm text-muted-foreground">{eventType.duration} minutes</div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={eventType.scheduling_url} target="_blank" rel="noopener noreferrer">
                            View
                            <ExternalLink className="w-3 h-3 ml-2" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Button onClick={handleCalendlyConnect} className="w-full">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect Calendly
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-purple-600" />
                    Cal.com
                  </CardTitle>
                  <CardDescription>
                    Open-source scheduling alternative to Calendly
                  </CardDescription>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Cal.com integration will be available soon. It offers similar features to Calendly with more customization options.
              </p>
              <Button disabled className="w-full">
                Connect Cal.com
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </RecruiterLayout>
  );
}
