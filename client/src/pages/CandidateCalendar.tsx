import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay, addHours, addDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import CandidateLayout from "@/components/CandidateLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Building, 
  Bot, 
  Briefcase, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
  FileText,
  Target,
  Loader2
} from "lucide-react";

// Setup date-fns localizer for react-big-calendar
const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Event interface for calendar
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "phone" | "video" | "in-person" | "ai-interview";
    jobTitle: string;
    companyName: string;
    status: string;
    location?: string;
    meetingLink?: string;
    notes?: string;
    jobDescription?: string;
  };
}

// Custom event component for calendar
const EventComponent = ({ event }: { event: CalendarEvent }) => {
  const typeIcons = {
    phone: <Phone className="h-3 w-3" />,
    video: <Video className="h-3 w-3" />,
    "in-person": <Building className="h-3 w-3" />,
    "ai-interview": <Bot className="h-3 w-3" />,
  };

  const typeColors = {
    phone: "bg-blue-500",
    video: "bg-purple-500",
    "in-person": "bg-emerald-500",
    "ai-interview": "bg-orange-500",
  };

  return (
    <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-white text-xs ${typeColors[event.resource.type]}`}>
      {typeIcons[event.resource.type]}
      <span className="truncate">{event.title}</span>
    </div>
  );
};

export default function CandidateCalendar() {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [preferredDate1, setPreferredDate1] = useState("");
  const [preferredDate2, setPreferredDate2] = useState("");
  const [preferredDate3, setPreferredDate3] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [preparationTips, setPreparationTips] = useState<string | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);

  // Fetch candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch interviews for the candidate
  const { data: interviews, isLoading, refetch } = trpc.interview.getByCandidate.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Reschedule request mutation
  const rescheduleRequestMutation = trpc.interview.requestRescheduleByCandidate.useMutation({
    onSuccess: () => {
      toast.success("Reschedule request submitted successfully!");
      setShowRescheduleDialog(false);
      setRescheduleReason("");
      setPreferredDate1("");
      setPreferredDate2("");
      setPreferredDate3("");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit reschedule request");
    }
  });

  // AI preparation tips mutation
  const generateTipsMutation = trpc.ai.generateInterviewPreparationTips.useMutation({
    onSuccess: (data) => {
      setPreparationTips(data.tips);
      setLoadingTips(false);
    },
    onError: (error) => {
      toast.error("Failed to generate preparation tips");
      setLoadingTips(false);
    }
  });

  // Transform interviews to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    if (!interviews) return [];
    
    return interviews.map((interview: any) => ({
      id: interview.id,
      title: interview.job?.title || "Interview",
      start: new Date(interview.scheduledAt),
      end: addHours(new Date(interview.scheduledAt), 1),
      resource: {
        type: interview.type,
        jobTitle: interview.job?.title || "Unknown Position",
        companyName: interview.job?.companyName || "Unknown Company",
        status: interview.status,
        location: interview.location,
        meetingLink: interview.meetingLink,
        notes: interview.notes,
        jobDescription: interview.job?.description,
      },
    }));
  }, [interviews]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setActiveTab("details");
    setPreparationTips(null);
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const handleRequestReschedule = () => {
    if (!selectedEvent || !rescheduleReason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    const preferredDates = [preferredDate1, preferredDate2, preferredDate3].filter(d => d);
    
    rescheduleRequestMutation.mutate({
      interviewId: selectedEvent.id,
      reason: rescheduleReason,
      preferredDates: preferredDates.length > 0 ? preferredDates : undefined
    });
  };

  const handleGenerateTips = () => {
    if (!selectedEvent) return;
    
    setLoadingTips(true);
    generateTipsMutation.mutate({
      jobTitle: selectedEvent.resource.jobTitle,
      companyName: selectedEvent.resource.companyName,
      interviewType: selectedEvent.resource.type,
      jobDescription: selectedEvent.resource.jobDescription
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Scheduled", variant: "default" },
      completed: { label: "Completed", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      "no-show": { label: "No Show", variant: "destructive" },
      "in-progress": { label: "In Progress", variant: "outline" },
      "reschedule-requested": { label: "Reschedule Requested", variant: "outline" },
    };
    
    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-4 w-4 text-blue-500" />;
      case "video":
        return <Video className="h-4 w-4 text-purple-500" />;
      case "in-person":
        return <Building className="h-4 w-4 text-emerald-500" />;
      case "ai-interview":
        return <Bot className="h-4 w-4 text-orange-500" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone: "Phone Interview",
      video: "Video Interview",
      "in-person": "In-Person Interview",
      "ai-interview": "AI Interview",
    };
    return labels[type] || type;
  };

  // Count upcoming interviews
  const upcomingInterviews = events.filter(
    (e) => e.start > new Date() && e.resource.status === "scheduled"
  ).length;

  // Check if interview can be rescheduled (only scheduled interviews, at least 24 hours before)
  const canReschedule = (event: CalendarEvent) => {
    const now = new Date();
    const interviewTime = event.start;
    const hoursUntilInterview = (interviewTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return event.resource.status === "scheduled" && hoursUntilInterview > 24;
  };

  return (
    <CandidateLayout title="Interview Calendar">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Interview Calendar</h1>
          <p className="text-muted-foreground">View and manage your upcoming interviews</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{upcomingInterviews}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter(e => 
                  e.start.getMonth() === new Date().getMonth() &&
                  e.start.getFullYear() === new Date().getFullYear()
                ).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Phone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>Video</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>In-Person</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span>AI Interview</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="h-[600px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : (
              <div className="h-[600px]">
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  date={date}
                  onNavigate={handleNavigate}
                  onView={handleViewChange}
                  onSelectEvent={handleSelectEvent}
                  components={{
                    event: EventComponent,
                  }}
                  style={{ height: "100%" }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedEvent && getTypeIcon(selectedEvent.resource.type)}
                Interview Details
              </DialogTitle>
              <DialogDescription>
                {selectedEvent && getTypeLabel(selectedEvent.resource.type)}
              </DialogDescription>
            </DialogHeader>
            
            {selectedEvent && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="preparation" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Prep Tips
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(selectedEvent.resource.status)}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedEvent.resource.jobTitle}</p>
                        <p className="text-sm text-muted-foreground">{selectedEvent.resource.companyName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{format(selectedEvent.start, "EEEE, MMMM d, yyyy")}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end, "h:mm a")}</span>
                    </div>

                    {selectedEvent.resource.location && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEvent.resource.location}</span>
                      </div>
                    )}

                    {selectedEvent.resource.meetingLink && (
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={selectedEvent.resource.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          Join Meeting
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {selectedEvent.resource.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{selectedEvent.resource.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    {selectedEvent.resource.type === "ai-interview" && selectedEvent.resource.status === "scheduled" && (
                      <Button 
                        className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
                        onClick={() => {
                          window.location.href = `/ai-interview/${selectedEvent.id}`;
                        }}
                      >
                        <Bot className="h-4 w-4 mr-2" />
                        Start AI Interview
                      </Button>
                    )}
                    {canReschedule(selectedEvent) && (
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowRescheduleDialog(true)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request Reschedule
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="preparation" className="mt-4">
                  <div className="space-y-4">
                    {!preparationTips && !loadingTips && (
                      <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                        <h3 className="font-semibold mb-2">AI Interview Preparation</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get personalized tips and advice to help you prepare for this interview
                        </p>
                        <Button onClick={handleGenerateTips} className="bg-gradient-to-r from-emerald-500 to-teal-500">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Preparation Tips
                        </Button>
                      </div>
                    )}

                    {loadingTips && (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-emerald-500 mb-4" />
                        <p className="text-sm text-muted-foreground">Generating personalized tips...</p>
                      </div>
                    )}

                    {preparationTips && (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="font-semibold">Your Personalized Preparation Guide</span>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {preparationTips}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleGenerateTips}
                            className="mt-4"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate Tips
                          </Button>
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Request Dialog */}
        <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-500" />
                Request Reschedule
              </DialogTitle>
              <DialogDescription>
                Submit a request to reschedule your interview. The recruiter will review and respond.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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

              <div className="space-y-2">
                <Label>Preferred Alternative Dates (Optional)</Label>
                <p className="text-xs text-muted-foreground">Suggest up to 3 alternative dates/times</p>
                <div className="space-y-2">
                  <Input
                    type="datetime-local"
                    value={preferredDate1}
                    onChange={(e) => setPreferredDate1(e.target.value)}
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                  />
                  <Input
                    type="datetime-local"
                    value={preferredDate2}
                    onChange={(e) => setPreferredDate2(e.target.value)}
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                  />
                  <Input
                    type="datetime-local"
                    value={preferredDate3}
                    onChange={(e) => setPreferredDate3(e.target.value)}
                    min={format(addDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleRequestReschedule}
                disabled={rescheduleRequestMutation.isPending || !rescheduleReason.trim()}
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                {rescheduleRequestMutation.isPending ? (
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
    </CandidateLayout>
  );
}
