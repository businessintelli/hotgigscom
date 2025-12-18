import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, Clock, Video, MapPin, User, Briefcase, 
  CheckCircle, XCircle, MessageSquare, Loader2, Building, RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "wouter";

export default function PanelistDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [preferredDate1, setPreferredDate1] = useState("");
  const [preferredDate2, setPreferredDate2] = useState("");
  const [preferredDate3, setPreferredDate3] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get panelist's interviews
  const { data: interviews, isLoading } = (trpc as any).interview.getPanelistInterviews?.useQuery(
    { userId: user?.id },
    { enabled: !!user?.id }
  ) || { data: null, isLoading: false };

  const upcomingInterviews = interviews?.filter((i: any) => 
    new Date(i.scheduledAt) > new Date() && i.panelistStatus !== "declined"
  ) || [];

  const pastInterviews = interviews?.filter((i: any) => 
    new Date(i.scheduledAt) <= new Date()
  ) || [];

  const pendingFeedback = pastInterviews.filter((i: any) => !i.feedbackSubmitted) || [];

  // Reschedule request mutation
  const createRescheduleMutation = (trpc as any).reschedule?.createRequest?.useMutation({
    onSuccess: () => {
      toast.success("Reschedule request submitted successfully");
      setRescheduleModalOpen(false);
      resetRescheduleForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to submit request: ${error.message}`);
    },
  }) || { mutateAsync: async () => {}, isPending: false };

  const resetRescheduleForm = () => {
    setRescheduleReason("");
    setPreferredDate1("");
    setPreferredDate2("");
    setPreferredDate3("");
    setSelectedInterview(null);
  };

  const handleRequestReschedule = (interview: any) => {
    setSelectedInterview(interview);
    setRescheduleModalOpen(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleReason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }
    if (!preferredDate1) {
      toast.error("Please provide at least one preferred date/time");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRescheduleMutation.mutateAsync({
        interviewId: selectedInterview.id,
        panelistId: selectedInterview.panelistId,
        reason: rescheduleReason,
        preferredTimes: [
          preferredDate1,
          preferredDate2,
          preferredDate3,
        ].filter(Boolean),
      });
    } catch (error) {
      console.error("Reschedule request failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      case "attended":
        return <Badge className="bg-blue-100 text-blue-800">Attended</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Panel Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your interview assignments and feedback</p>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-gray-700">{user?.name || user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingInterviews.length}</p>
                  <p className="text-sm text-gray-500">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingFeedback.length}</p>
                  <p className="text-sm text-gray-500">Pending Feedback</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pastInterviews.filter((i: any) => i.feedbackSubmitted).length}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{interviews?.length || 0}</p>
                  <p className="text-sm text-gray-500">Total Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Feedback Alert */}
        {pendingFeedback.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  You have {pendingFeedback.length} interview{pendingFeedback.length > 1 ? "s" : ""} awaiting feedback
                </p>
                <p className="text-sm text-orange-600">
                  Please submit your feedback to help the hiring team make informed decisions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Feedback ({pendingFeedback.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({pastInterviews.filter((i: any) => i.feedbackSubmitted).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingInterviews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No upcoming interviews</h3>
                  <p className="text-gray-500">You'll see your interview assignments here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingInterviews.map((interview: any) => (
                  <Card key={interview.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{interview.jobTitle}</h3>
                            {getStatusBadge(interview.panelistStatus)}
                          </div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Candidate: {interview.candidateName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{interview.companyName || "Company"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(interview.scheduledAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(interview.scheduledAt)} ({interview.duration} min)</span>
                            </div>
                            {interview.type === "video" && interview.meetingLink && (
                              <div className="flex items-center gap-2 col-span-2">
                                <Video className="h-4 w-4" />
                                <a href={interview.meetingLink} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                  Join Meeting
                                </a>
                              </div>
                            )}
                            {interview.type === "in_person" && interview.location && (
                              <div className="flex items-center gap-2 col-span-2">
                                <MapPin className="h-4 w-4" />
                                <span>{interview.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {interview.meetingLink && (
                              <Button asChild>
                                <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                                  <Video className="h-4 w-4 mr-2" />
                                  Join
                                </a>
                              </Button>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestReschedule(interview)}
                            className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Request Reschedule
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingFeedback.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                  <p className="text-gray-500">No pending feedback to submit</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingFeedback.map((interview: any) => (
                  <Card key={interview.id} className="border-orange-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg">{interview.jobTitle}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Candidate: {interview.candidateName}</p>
                            <p>Interview Date: {formatDate(interview.scheduledAt)}</p>
                          </div>
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-700">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Submit Feedback
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {pastInterviews.filter((i: any) => i.feedbackSubmitted).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No completed interviews</h3>
                  <p className="text-gray-500">Your completed interviews with submitted feedback will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastInterviews.filter((i: any) => i.feedbackSubmitted).map((interview: any) => (
                  <Card key={interview.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{interview.jobTitle}</h3>
                            <Badge className="bg-green-100 text-green-800">Feedback Submitted</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Candidate: {interview.candidateName}</p>
                            <p>Interview Date: {formatDate(interview.scheduledAt)}</p>
                          </div>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Reschedule Request Modal */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
            <DialogDescription>
              Submit a request to reschedule this interview. The recruiter will be notified and will propose alternative times.
            </DialogDescription>
          </DialogHeader>
          
          {selectedInterview && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedInterview.jobTitle}</p>
                <p className="text-sm text-gray-600">Candidate: {selectedInterview.candidateName}</p>
                <p className="text-sm text-gray-600">
                  Current: {formatDate(selectedInterview.scheduledAt)} at {formatTime(selectedInterview.scheduledAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Rescheduling *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you need to reschedule..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Preferred Alternative Times</Label>
                <p className="text-sm text-gray-500">Provide up to 3 preferred date/times</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-6">1.</span>
                    <Input
                      type="datetime-local"
                      value={preferredDate1}
                      onChange={(e) => setPreferredDate1(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-6">2.</span>
                    <Input
                      type="datetime-local"
                      value={preferredDate2}
                      onChange={(e) => setPreferredDate2(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 w-6">3.</span>
                    <Input
                      type="datetime-local"
                      value={preferredDate3}
                      onChange={(e) => setPreferredDate3(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReschedule} 
              disabled={isSubmitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
