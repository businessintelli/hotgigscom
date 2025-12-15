import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Bell, Mail, Briefcase, Calendar, MessageSquare, Megaphone, Newspaper, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function NotificationPreferences() {
  const [, setLocation] = useLocation();
  const { data: preferences, isLoading } = trpc.user.getNotificationPreferences.useQuery();
  const updatePreferences = trpc.user.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences saved successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save preferences");
    },
  });

  // Local state for form
  const [formData, setFormData] = useState({
    statusUpdatesEnabled: true,
    statusUpdatesFrequency: "immediate" as "immediate" | "daily" | "weekly",
    interviewRemindersEnabled: true,
    interviewReminder24h: true,
    interviewReminder1h: true,
    jobRecommendationsEnabled: true,
    jobRecommendationsFrequency: "weekly" as "immediate" | "daily" | "weekly",
    marketingEmailsEnabled: false,
    weeklyDigestEnabled: true,
    messageNotificationsEnabled: true,
  });

  // Update form when preferences load
  useEffect(() => {
    if (preferences) {
      setFormData({
        statusUpdatesEnabled: preferences.statusUpdatesEnabled ?? true,
        statusUpdatesFrequency: preferences.statusUpdatesFrequency ?? "immediate",
        interviewRemindersEnabled: preferences.interviewRemindersEnabled ?? true,
        interviewReminder24h: preferences.interviewReminder24h ?? true,
        interviewReminder1h: preferences.interviewReminder1h ?? true,
        jobRecommendationsEnabled: preferences.jobRecommendationsEnabled ?? true,
        jobRecommendationsFrequency: preferences.jobRecommendationsFrequency ?? "weekly",
        marketingEmailsEnabled: preferences.marketingEmailsEnabled ?? false,
        weeklyDigestEnabled: preferences.weeklyDigestEnabled ?? true,
        messageNotificationsEnabled: preferences.messageNotificationsEnabled ?? true,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences.mutate(formData);
  };

  const handleToggle = (key: keyof typeof formData, value: boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFrequencyChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/candidate-dashboard?view=settings")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Notification Preferences</h1>
              <p className="text-gray-500">Manage how and when you receive notifications</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Application Status Updates */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Application Status Updates</CardTitle>
                  <CardDescription>
                    Get notified when your application status changes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="statusUpdates" className="flex-1">
                  Enable status update notifications
                </Label>
                <Switch
                  id="statusUpdates"
                  checked={formData.statusUpdatesEnabled}
                  onCheckedChange={(checked) => handleToggle("statusUpdatesEnabled", checked)}
                />
              </div>
              {formData.statusUpdatesEnabled && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200">
                  <Label htmlFor="statusFrequency">Notification frequency</Label>
                  <Select
                    value={formData.statusUpdatesFrequency}
                    onValueChange={(value) => handleFrequencyChange("statusUpdatesFrequency", value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interview Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Interview Reminders</CardTitle>
                  <CardDescription>
                    Receive reminders before your scheduled interviews
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="interviewReminders" className="flex-1">
                  Enable interview reminders
                </Label>
                <Switch
                  id="interviewReminders"
                  checked={formData.interviewRemindersEnabled}
                  onCheckedChange={(checked) => handleToggle("interviewRemindersEnabled", checked)}
                />
              </div>
              {formData.interviewRemindersEnabled && (
                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder24h">24 hours before</Label>
                    <Switch
                      id="reminder24h"
                      checked={formData.interviewReminder24h}
                      onCheckedChange={(checked) => handleToggle("interviewReminder24h", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reminder1h">1 hour before</Label>
                    <Switch
                      id="reminder1h"
                      checked={formData.interviewReminder1h}
                      onCheckedChange={(checked) => handleToggle("interviewReminder1h", checked)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Job Recommendations</CardTitle>
                  <CardDescription>
                    Get personalized job suggestions based on your profile
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="jobRecommendations" className="flex-1">
                  Enable job recommendations
                </Label>
                <Switch
                  id="jobRecommendations"
                  checked={formData.jobRecommendationsEnabled}
                  onCheckedChange={(checked) => handleToggle("jobRecommendationsEnabled", checked)}
                />
              </div>
              {formData.jobRecommendationsEnabled && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200">
                  <Label htmlFor="jobFrequency">Recommendation frequency</Label>
                  <Select
                    value={formData.jobRecommendationsFrequency}
                    onValueChange={(value) => handleFrequencyChange("jobRecommendationsFrequency", value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">As they match</SelectItem>
                      <SelectItem value="daily">Daily digest</SelectItem>
                      <SelectItem value="weekly">Weekly digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Messages</CardTitle>
                  <CardDescription>
                    Notifications for new messages from recruiters
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="messages" className="flex-1">
                  Enable message notifications
                </Label>
                <Switch
                  id="messages"
                  checked={formData.messageNotificationsEnabled}
                  onCheckedChange={(checked) => handleToggle("messageNotificationsEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Weekly Digest */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Newspaper className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Weekly Digest</CardTitle>
                  <CardDescription>
                    A summary of your job search activity and new opportunities
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="weeklyDigest" className="flex-1">
                  Receive weekly digest email
                </Label>
                <Switch
                  id="weeklyDigest"
                  checked={formData.weeklyDigestEnabled}
                  onCheckedChange={(checked) => handleToggle("weeklyDigestEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Marketing Emails */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <CardTitle>Marketing & Promotions</CardTitle>
                  <CardDescription>
                    Tips, career advice, and special offers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing" className="flex-1">
                  Receive marketing emails
                </Label>
                <Switch
                  id="marketing"
                  checked={formData.marketingEmailsEnabled}
                  onCheckedChange={(checked) => handleToggle("marketingEmailsEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/candidate-dashboard?view=settings")}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updatePreferences.isPending}
            >
              {updatePreferences.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can unsubscribe from all emails at any time by clicking the 
              unsubscribe link at the bottom of any email we send you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
