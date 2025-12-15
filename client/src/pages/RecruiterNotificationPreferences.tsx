import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Bell, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Users, 
  Mail, 
  Settings,
  Save,
  Loader2
} from "lucide-react";

type NotificationPreferences = {
  newApplications: boolean;
  applicationStatusChanges: boolean;
  applicationFrequency: 'immediate' | 'daily' | 'weekly';
  interviewScheduled: boolean;
  interviewReminders: boolean;
  interviewCompleted: boolean;
  panelistResponses: boolean;
  candidateFeedback: boolean;
  panelistFeedbackSubmitted: boolean;
  weeklyDigest: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
};

const defaultPreferences: NotificationPreferences = {
  newApplications: true,
  applicationStatusChanges: true,
  applicationFrequency: 'immediate',
  interviewScheduled: true,
  interviewReminders: true,
  interviewCompleted: true,
  panelistResponses: true,
  candidateFeedback: true,
  panelistFeedbackSubmitted: true,
  weeklyDigest: true,
  systemUpdates: false,
  marketingEmails: false,
};

export default function RecruiterNotificationPreferences() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedPrefs, isLoading } = trpc.recruiterPrefs.getNotificationPreferences.useQuery();
  const updateMutation = trpc.recruiterPrefs.updateNotificationPreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved!");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Failed to save preferences");
    },
  });

  useEffect(() => {
    if (savedPrefs) {
      setPreferences({
        newApplications: savedPrefs.newApplications ?? true,
        applicationStatusChanges: savedPrefs.applicationStatusChanges ?? true,
        applicationFrequency: savedPrefs.applicationFrequency ?? 'immediate',
        interviewScheduled: savedPrefs.interviewScheduled ?? true,
        interviewReminders: savedPrefs.interviewReminders ?? true,
        interviewCompleted: savedPrefs.interviewCompleted ?? true,
        panelistResponses: savedPrefs.panelistResponses ?? true,
        candidateFeedback: savedPrefs.candidateFeedback ?? true,
        panelistFeedbackSubmitted: savedPrefs.panelistFeedbackSubmitted ?? true,
        weeklyDigest: savedPrefs.weeklyDigest ?? true,
        systemUpdates: savedPrefs.systemUpdates ?? false,
        marketingEmails: savedPrefs.marketingEmails ?? false,
      });
    }
  }, [savedPrefs]);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'recruiter') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">This page is only accessible to recruiters.</p>
            <Button className="mt-4" onClick={() => setLocation('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/recruiter')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </h1>
                <p className="text-sm text-gray-500">
                  Manage how you receive alerts and updates
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Application Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Application Notifications
            </CardTitle>
            <CardDescription>
              Stay informed about new applications and status changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">New Applications</Label>
                <p className="text-sm text-gray-500">
                  Get notified when candidates apply to your jobs
                </p>
              </div>
              <Switch
                checked={preferences.newApplications}
                onCheckedChange={(checked) => updatePreference('newApplications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Application Status Changes</Label>
                <p className="text-sm text-gray-500">
                  Notifications when application statuses are updated
                </p>
              </div>
              <Switch
                checked={preferences.applicationStatusChanges}
                onCheckedChange={(checked) => updatePreference('applicationStatusChanges', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Notification Frequency</Label>
                <p className="text-sm text-gray-500">
                  How often to receive application notifications
                </p>
              </div>
              <Select
                value={preferences.applicationFrequency}
                onValueChange={(value: 'immediate' | 'daily' | 'weekly') => 
                  updatePreference('applicationFrequency', value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interview Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Interview Notifications
            </CardTitle>
            <CardDescription>
              Manage alerts for interview scheduling and completion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interview Scheduled</Label>
                <p className="text-sm text-gray-500">
                  Get notified when interviews are scheduled
                </p>
              </div>
              <Switch
                checked={preferences.interviewScheduled}
                onCheckedChange={(checked) => updatePreference('interviewScheduled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interview Reminders</Label>
                <p className="text-sm text-gray-500">
                  Receive reminders before upcoming interviews
                </p>
              </div>
              <Switch
                checked={preferences.interviewReminders}
                onCheckedChange={(checked) => updatePreference('interviewReminders', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Interview Completed</Label>
                <p className="text-sm text-gray-500">
                  Notifications when interviews are marked complete
                </p>
              </div>
              <Switch
                checked={preferences.interviewCompleted}
                onCheckedChange={(checked) => updatePreference('interviewCompleted', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Panel & Feedback Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Panel & Feedback Notifications
            </CardTitle>
            <CardDescription>
              Stay updated on panel member responses and feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Panelist Responses</Label>
                <p className="text-sm text-gray-500">
                  Get notified when panel members accept/decline invitations
                </p>
              </div>
              <Switch
                checked={preferences.panelistResponses}
                onCheckedChange={(checked) => updatePreference('panelistResponses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Candidate Feedback</Label>
                <p className="text-sm text-gray-500">
                  Notifications when candidates submit interview feedback
                </p>
              </div>
              <Switch
                checked={preferences.candidateFeedback}
                onCheckedChange={(checked) => updatePreference('candidateFeedback', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Panelist Feedback Submitted</Label>
                <p className="text-sm text-gray-500">
                  Get notified when panel members submit their evaluations
                </p>
              </div>
              <Switch
                checked={preferences.panelistFeedbackSubmitted}
                onCheckedChange={(checked) => updatePreference('panelistFeedbackSubmitted', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Other Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-600" />
              Other Notifications
            </CardTitle>
            <CardDescription>
              Digest emails and system updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Weekly Digest</Label>
                <p className="text-sm text-gray-500">
                  Receive a weekly summary of your recruitment activity
                </p>
              </div>
              <Switch
                checked={preferences.weeklyDigest}
                onCheckedChange={(checked) => updatePreference('weeklyDigest', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Updates</Label>
                <p className="text-sm text-gray-500">
                  Notifications about new features and platform updates
                </p>
              </div>
              <Switch
                checked={preferences.systemUpdates}
                onCheckedChange={(checked) => updatePreference('systemUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Marketing Emails</Label>
                <p className="text-sm text-gray-500">
                  Promotional content and special offers
                </p>
              </div>
              <Switch
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button (Mobile) */}
        <div className="lg:hidden">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
