import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, User, Bell, Shield, Mail, Building2 } from "lucide-react";
import RecruiterLayout from "@/components/RecruiterLayout";

export default function RecruiterSettings() {
  const { user } = useAuth();
  const { data: profile } = trpc.recruiter.getProfile.useQuery();
  const { data: companyData } = trpc.companyAdmin.getCompanySettings.useQuery(undefined, {
    enabled: !!user?.companyId,
  });
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [applicationAlerts, setApplicationAlerts] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [candidateMatches, setCandidateMatches] = useState(true);

  return (
    <RecruiterLayout>
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and recruiter profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ""} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue={profile?.phoneNumber || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" placeholder="e.g., Senior Recruiter" />
                </div>
                <Separator />
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings - Read Only for Recruiters */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  View your company profile (contact your company admin to make changes)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" value={companyData?.companyName || profile?.companyName || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-website">Company Website</Label>
                  <Input id="company-website" type="url" value={companyData?.companyWebsite || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-size">Company Size</Label>
                  <Input id="company-size" value={companyData?.companySize || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" value={companyData?.industry || ""} disabled />
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground bg-muted p-4 rounded-md">
                  <p className="font-medium mb-1">📝 Note:</p>
                  <p>Company information can only be modified by company administrators. Contact your company admin if you need to update these details.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Applications</Label>
                    <p className="text-sm text-gray-500">
                      Get notified when candidates apply to your jobs
                    </p>
                  </div>
                  <Switch
                    checked={applicationAlerts}
                    onCheckedChange={setApplicationAlerts}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Interview Reminders</Label>
                    <p className="text-sm text-gray-500">
                      Get reminders for upcoming interviews
                    </p>
                  </div>
                  <Switch
                    checked={interviewReminders}
                    onCheckedChange={setInterviewReminders}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>AI Candidate Matches</Label>
                    <p className="text-sm text-gray-500">
                      Receive AI-powered candidate recommendations
                    </p>
                  </div>
                  <Switch
                    checked={candidateMatches}
                    onCheckedChange={setCandidateMatches}
                  />
                </div>
                <Separator />
                <Button>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Manage your privacy and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-gray-500">
                      Allow candidates to see your recruiter profile
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Company Info</Label>
                    <p className="text-sm text-gray-500">
                      Display company information on job postings
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Preferences */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>
                  Manage your email subscription preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Daily Activity Digest</Label>
                    <p className="text-sm text-gray-500">
                      Receive a daily summary of recruitment activities
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Analytics Report</Label>
                    <p className="text-sm text-gray-500">
                      Get weekly recruitment performance insights
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Product Updates</Label>
                    <p className="text-sm text-gray-500">
                      Stay informed about new features and improvements
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <Button>Save Email Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RecruiterLayout>
  );
}
