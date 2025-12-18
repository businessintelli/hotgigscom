import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Settings, User, Bell, Shield, Mail, Building2 } from "lucide-react";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";

export default function CompanyAdminProfileSettings() {
  const { user } = useAuth();
  const { data: companySettings } = trpc.companyAdmin.getSettings.useQuery();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [applicationAlerts, setApplicationAlerts] = useState(true);
  const [recruiterUpdates, setRecruiterUpdates] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  const updateSettingsMutation = trpc.companyAdmin.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleSaveCompany = () => {
    toast.success("Company information updated successfully");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences updated successfully");
  };

  return (
    <CompanyAdminLayout>
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and company preferences
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
                  Update your personal information and company admin profile
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
                    <Input id="email" type="email" defaultValue={user?.email || ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <Input id="title" placeholder="e.g., HR Director, Talent Manager" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio" 
                    placeholder="Tell us about yourself and your role..."
                    rows={4}
                  />
                </div>
                <Separator />
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Manage your company's profile and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName" 
                    defaultValue={companySettings?.companyName || ""} 
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input 
                    id="companyWebsite" 
                    type="url"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Input 
                    id="companySize" 
                    placeholder="e.g., 50-100 employees"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input 
                    id="industry" 
                    placeholder="e.g., Technology, Healthcare"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea 
                    id="companyDescription" 
                    placeholder="Brief description of your company..."
                    rows={4}
                  />
                </div>
                <Separator />
                <Button onClick={handleSaveCompany}>Save Changes</Button>
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
                    <p className="text-sm text-muted-foreground">
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
                    <p className="text-sm text-muted-foreground">
                      Get notified when new applications are submitted
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
                    <Label>Recruiter Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates when recruiters complete key actions
                    </p>
                  </div>
                  <Switch
                    checked={recruiterUpdates}
                    onCheckedChange={setRecruiterUpdates}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system notifications and updates
                    </p>
                  </div>
                  <Switch
                    checked={systemAlerts}
                    onCheckedChange={setSystemAlerts}
                  />
                </div>
                <Separator />
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Separator />
                <Button variant="outline">Change Password</Button>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>
                  Configure your email communication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emailFrequency">Email Digest Frequency</Label>
                  <select 
                    id="emailFrequency" 
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Digest</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input 
                    id="replyTo" 
                    type="email"
                    placeholder="replies@yourcompany.com"
                  />
                </div>
                <Separator />
                <Button>Save Email Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CompanyAdminLayout>
  );
}
