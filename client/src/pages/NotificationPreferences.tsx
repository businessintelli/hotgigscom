import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Mail, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import CandidateLayout from "@/components/CandidateLayout";

export default function NotificationPreferences() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Notification preferences state
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [jobRecommendations, setJobRecommendations] = useState(true);
  const [applicationDeadlines, setApplicationDeadlines] = useState(true);
  const [recruiterMessages, setRecruiterMessages] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <CandidateLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading...</div>
        </div>
      </CandidateLayout>
    );
  }

  const handleSavePreferences = () => {
    // In a real implementation, this would save to the backend
    toast.success("Notification preferences saved successfully!");
  };

  return (
    <CandidateLayout>
      <div className="container mx-auto py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/candidate/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Preferences</h1>
            <p className="text-gray-600">
              Manage your email notification settings to stay informed about your applications and opportunities.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Choose which email notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Updates */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <Label htmlFor="status-updates" className="text-base font-medium">
                      Application Status Updates
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Get notified when your application status changes (reviewing, shortlisted, interview, etc.)
                  </p>
                </div>
                <Switch
                  id="status-updates"
                  checked={statusUpdates}
                  onCheckedChange={setStatusUpdates}
                />
              </div>

              {/* Interview Reminders */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <Label htmlFor="interview-reminders" className="text-base font-medium">
                      Interview Reminders
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Receive reminders 24 hours and 1 hour before scheduled interviews
                  </p>
                </div>
                <Switch
                  id="interview-reminders"
                  checked={interviewReminders}
                  onCheckedChange={setInterviewReminders}
                />
              </div>

              {/* Job Recommendations */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <Label htmlFor="job-recommendations" className="text-base font-medium">
                      Job Recommendations
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Get personalized job recommendations based on your profile and preferences
                  </p>
                </div>
                <Switch
                  id="job-recommendations"
                  checked={jobRecommendations}
                  onCheckedChange={setJobRecommendations}
                />
              </div>

              {/* Application Deadlines */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <Label htmlFor="application-deadlines" className="text-base font-medium">
                      Application Deadlines
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Reminders for upcoming job application deadlines
                  </p>
                </div>
                <Switch
                  id="application-deadlines"
                  checked={applicationDeadlines}
                  onCheckedChange={setApplicationDeadlines}
                />
              </div>

              {/* Recruiter Messages */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-600" />
                    <Label htmlFor="recruiter-messages" className="text-base font-medium">
                      Recruiter Messages
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Direct messages from recruiters about your applications
                  </p>
                </div>
                <Switch
                  id="recruiter-messages"
                  checked={recruiterMessages}
                  onCheckedChange={setRecruiterMessages}
                />
              </div>

              {/* Weekly Digest */}
              <div className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-600" />
                    <Label htmlFor="weekly-digest" className="text-base font-medium">
                      Weekly Digest
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    A weekly summary of your application activity and new opportunities
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                />
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/candidate/dashboard")}
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">About Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                • You can update these preferences at any time from your dashboard
              </p>
              <p>
                • Critical notifications (like interview confirmations) will always be sent
              </p>
              <p>
                • All emails include an unsubscribe link if you want to opt out completely
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </CandidateLayout>
  );
}
