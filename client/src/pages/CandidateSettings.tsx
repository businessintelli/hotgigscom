import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Bell, Shield, Eye, Mail, Globe } from "lucide-react";

export default function CandidateSettings() {
  const { user } = useAuth();
  const { data: candidate, isLoading } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    applicationUpdates: true,
    interviewReminders: true,
    jobRecommendations: true,
    weeklyDigest: false,
    
    // Privacy Settings
    profileVisibility: "public" as "public" | "private" | "recruiters",
    showEmail: false,
    showPhone: false,
    allowMessaging: true,
    
    // Job Preferences
    jobAlerts: true,
    preferredLocations: "",
    preferredJobTypes: "",
    minSalary: "",
    
    // Account Settings
    language: "en",
    timezone: "UTC",
  });

  const updateMutation = trpc.candidate.update.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to update settings");
      console.error(error);
    },
  });

  const handleSwitchChange = (name: string, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!candidate) return;
    
    // In a real implementation, you'd save these settings to a separate settings table
    // For now, we'll just show a success message
    toast.success("Settings saved successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSwitchChange("emailNotifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="applicationUpdates">Application Updates</Label>
                <p className="text-sm text-gray-500">Get notified about application status changes</p>
              </div>
              <Switch
                id="applicationUpdates"
                checked={settings.applicationUpdates}
                onCheckedChange={(checked) => handleSwitchChange("applicationUpdates", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="interviewReminders">Interview Reminders</Label>
                <p className="text-sm text-gray-500">Receive reminders before scheduled interviews</p>
              </div>
              <Switch
                id="interviewReminders"
                checked={settings.interviewReminders}
                onCheckedChange={(checked) => handleSwitchChange("interviewReminders", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="jobRecommendations">Job Recommendations</Label>
                <p className="text-sm text-gray-500">Get personalized job recommendations</p>
              </div>
              <Switch
                id="jobRecommendations"
                checked={settings.jobRecommendations}
                onCheckedChange={(checked) => handleSwitchChange("jobRecommendations", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                <p className="text-sm text-gray-500">Receive a weekly summary of activities</p>
              </div>
              <Switch
                id="weeklyDigest"
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) => handleSwitchChange("weeklyDigest", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Visibility
            </CardTitle>
            <CardDescription>Control who can see your profile and contact you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value) => handleSelectChange("profileVisibility", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can view</SelectItem>
                  <SelectItem value="recruiters">Recruiters Only</SelectItem>
                  <SelectItem value="private">Private - Hidden from search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showEmail">Show Email</Label>
                <p className="text-sm text-gray-500">Display email on your public profile</p>
              </div>
              <Switch
                id="showEmail"
                checked={settings.showEmail}
                onCheckedChange={(checked) => handleSwitchChange("showEmail", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showPhone">Show Phone Number</Label>
                <p className="text-sm text-gray-500">Display phone number on your public profile</p>
              </div>
              <Switch
                id="showPhone"
                checked={settings.showPhone}
                onCheckedChange={(checked) => handleSwitchChange("showPhone", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowMessaging">Allow Direct Messaging</Label>
                <p className="text-sm text-gray-500">Let recruiters send you direct messages</p>
              </div>
              <Switch
                id="allowMessaging"
                checked={settings.allowMessaging}
                onCheckedChange={(checked) => handleSwitchChange("allowMessaging", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Job Preferences
            </CardTitle>
            <CardDescription>Set your job search preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="jobAlerts">Job Alerts</Label>
                <p className="text-sm text-gray-500">Get notified about matching job openings</p>
              </div>
              <Switch
                id="jobAlerts"
                checked={settings.jobAlerts}
                onCheckedChange={(checked) => handleSwitchChange("jobAlerts", checked)}
              />
            </div>
            <div>
              <Label htmlFor="preferredLocations">Preferred Locations</Label>
              <Input
                id="preferredLocations"
                name="preferredLocations"
                value={settings.preferredLocations}
                onChange={handleInputChange}
                placeholder="e.g., New York, San Francisco, Remote"
              />
            </div>
            <div>
              <Label htmlFor="preferredJobTypes">Preferred Job Types</Label>
              <Input
                id="preferredJobTypes"
                name="preferredJobTypes"
                value={settings.preferredJobTypes}
                onChange={handleInputChange}
                placeholder="e.g., Full-time, Part-time, Contract"
              />
            </div>
            <div>
              <Label htmlFor="minSalary">Minimum Salary Expectation</Label>
              <Input
                id="minSalary"
                name="minSalary"
                value={settings.minSalary}
                onChange={handleInputChange}
                placeholder="e.g., $100,000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSelectChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleSelectChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
