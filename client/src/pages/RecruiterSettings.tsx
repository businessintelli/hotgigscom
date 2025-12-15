import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Bell, Settings } from "lucide-react";
import { toast } from "sonner";

export default function RecruiterSettings() {
  const { data: recruiter, isLoading } = trpc.recruiter.getProfile.useQuery();
  const [digestFrequency, setDigestFrequency] = useState<'never' | 'daily' | 'weekly'>('weekly');
  
  const updateDigestMutation = trpc.recruiter.updateDigestPreferences.useMutation({
    onSuccess: () => {
      toast.success('Email preferences updated successfully');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  // Set initial value when data loads
  if (recruiter && digestFrequency !== recruiter.emailDigestFrequency && !updateDigestMutation.isPending) {
    setDigestFrequency(recruiter.emailDigestFrequency || 'weekly');
  }

  const handleSave = async () => {
    await updateDigestMutation.mutateAsync({ frequency: digestFrequency });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Recruiter Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account preferences and notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Digest Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Digest
            </CardTitle>
            <CardDescription>
              Receive regular summaries of your recruitment activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="digest-frequency">Digest Frequency</Label>
                <Select value={digestFrequency} onValueChange={(value: 'never' | 'daily' | 'weekly') => setDigestFrequency(value)}>
                  <SelectTrigger id="digest-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never - Don't send me digests</SelectItem>
                    <SelectItem value="daily">Daily - Every morning at 9 AM</SelectItem>
                    <SelectItem value="weekly">Weekly - Every Monday at 9 AM</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Your digest will include new applications, top-rated candidates, upcoming interviews, and recent team feedback.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  What's included in your digest?
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• New applications received for your job postings</li>
                  <li>• Top-rated candidates (4+ star average from team)</li>
                  <li>• Upcoming interviews in the next 7 days</li>
                  <li>• Recent feedback from your team members</li>
                </ul>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={updateDigestMutation.isPending || digestFrequency === recruiter?.emailDigestFrequency}
                className="w-full sm:w-auto"
              >
                {updateDigestMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Manage how you receive notifications within the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You currently receive in-app notifications for new applications, team feedback, and interview reminders.
              Additional notification settings will be available in future updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
