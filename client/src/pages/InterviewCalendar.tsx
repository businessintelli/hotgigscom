import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin, User, Video, Phone, Building, Bot, Mail } from "lucide-react";
import { useLocation } from "wouter";

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

const DnDCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

// Event interface for calendar
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: "phone" | "video" | "in-person" | "ai-interview";
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    status: string;
    location?: string;
    meetingLink?: string;
    notes?: string;
    videoJoinUrl?: string;
    videoStartUrl?: string;
    videoPassword?: string;
    videoProvider?: string;
  };
}

export default function InterviewCalendar() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const utils = trpc.useUtils();

  // Fetch interviews
  const { data: interviews, isLoading } = trpc.interview.listByRecruiter.useQuery();

  // Reschedule mutation
  const rescheduleMutation = trpc.interview.reschedule.useMutation({
    onSuccess: () => {
      utils.interview.listByRecruiter.invalidate();
      setRescheduleDialogOpen(false);
      setDetailsDialogOpen(false);
      toast.success("Interview rescheduled successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to reschedule: ${error.message}`);
    },
  });

  // Transform interviews to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    if (!interviews) return [];

    return interviews.map((interview) => {
      const startDate = new Date(interview.interview.scheduledAt);
      const endDate = new Date(startDate.getTime() + (interview.interview.duration || 60) * 60000);

      return {
        id: interview.interview.id,
        title: `${interview.candidateUser?.name || "Unknown"} - ${interview.job?.title || "Unknown Position"}`,
        start: startDate,
        end: endDate,
        resource: {
          type: interview.interview.type || "video",
          candidateName: interview.candidateUser?.name || "Unknown",
          candidateEmail: interview.candidateUser?.email || "",
          jobTitle: interview.job?.title || "Unknown Position",
          status: interview.interview.status || "scheduled",
          location: interview.interview.location || undefined,
          meetingLink: interview.interview.meetingLink || undefined,
          notes: interview.interview.notes || undefined,
          videoJoinUrl: interview.interview.videoJoinUrl || undefined,
          videoStartUrl: interview.interview.videoStartUrl || undefined,
          videoPassword: interview.interview.videoPassword || undefined,
          videoProvider: interview.interview.videoProvider || undefined,
        },
      };
    });
  }, [interviews]);

  // Event style getter for color coding
  const eventStyleGetter = useCallback((event: CalendarEvent | object) => {
    if (!('resource' in event)) return { style: {} };
    const calEvent = event as CalendarEvent;
    const typeColors = {
      "ai-interview": { backgroundColor: "#3b82f6", borderColor: "#2563eb" },
      video: { backgroundColor: "#8b5cf6", borderColor: "#7c3aed" },
      phone: { backgroundColor: "#10b981", borderColor: "#059669" },
      "in-person": { backgroundColor: "#f59e0b", borderColor: "#d97706" },
    };

    const colors = typeColors[event.resource.type] || { backgroundColor: "#6b7280", borderColor: "#4b5563" };

    return {
      style: {
        ...colors,
        borderRadius: "5px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  }, []);

  // Handle event drop (drag and drop rescheduling)
  const handleEventDrop = useCallback(
    (args: any) => {
      const { event, start, end } = args;
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      
      rescheduleMutation.mutate({
        id: event.id,
        scheduledAt: startDate.toISOString(),
        duration: Math.round((endDate.getTime() - startDate.getTime()) / 60000),
      });
    },
    [rescheduleMutation]
  );

  // Handle reschedule from dialog
  const handleReschedule = () => {
    if (!selectedEvent || !newDate || !newTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const scheduledDateTime = new Date(`${newDate}T${newTime}`);
    rescheduleMutation.mutate({
      id: selectedEvent.id,
      scheduledAt: scheduledDateTime.toISOString(),
    });
  };

  // Get interview type icon and label
  const getInterviewTypeInfo = (type: string) => {
    const typeInfo = {
      "ai-interview": { icon: Bot, label: "AI Bot Interview", color: "text-blue-600" },
      video: { icon: Video, label: "Video Interview", color: "text-purple-600" },
      phone: { icon: Phone, label: "Phone Interview", color: "text-green-600" },
      "in-person": { icon: Building, label: "In-Person Interview", color: "text-orange-600" },
    };
    return typeInfo[type as keyof typeof typeInfo] || typeInfo.video;
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl">
            <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            Interview Calendar
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            View and manage all scheduled interviews. <span className="hidden sm:inline">Drag and drop to reschedule.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="mb-4 flex gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-600" />
              <span className="text-sm">AI Bot Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-purple-600" />
              <span className="text-sm">Video Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              <span className="text-sm">Phone Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-600" />
              <span className="text-sm">In-Person Interview</span>
            </div>
          </div>

          <div className="h-[400px] sm:h-[500px] lg:h-[600px]">
            <DnDCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              eventPropGetter={eventStyleGetter}
              draggableAccessor={() => true}
              resizable
              style={{ height: "100%" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Interview Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interview Details</DialogTitle>
            <DialogDescription>
              {selectedEvent?.resource.candidateName} - {selectedEvent?.resource.jobTitle}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-4">
              {/* Interview Type */}
              <div className="flex items-center gap-3">
                {(() => {
                  const typeInfo = getInterviewTypeInfo(selectedEvent.resource.type);
                  const Icon = typeInfo.icon;
                  return (
                    <>
                      <Icon className={`h-5 w-5 ${typeInfo.color}`} />
                      <div>
                        <p className="text-sm font-semibold">{typeInfo.label}</p>
                        <Badge variant="outline">{selectedEvent.resource.status}</Badge>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Date and Time */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {format(selectedEvent.start, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end, "h:mm a")}
                  </p>
                </div>
              </div>

              {/* Candidate */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Candidate</p>
                  <p className="text-sm text-gray-600">{selectedEvent.resource.candidateName}</p>
                  {selectedEvent.resource.candidateEmail && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedEvent.resource.candidateEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Video Meeting Link */}
              {selectedEvent.resource.videoJoinUrl && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Video className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      {selectedEvent.resource.videoProvider === 'zoom' ? 'Zoom' : selectedEvent.resource.videoProvider === 'teams' ? 'Microsoft Teams' : 'Video'} Meeting
                    </p>
                    <Button
                      onClick={() => window.open(selectedEvent.resource.videoJoinUrl, '_blank')}
                      className="w-full mb-2"
                      size="sm"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join Meeting
                    </Button>
                    {selectedEvent.resource.videoPassword && (
                      <p className="text-xs text-gray-600">
                        Password: <span className="font-mono font-semibold">{selectedEvent.resource.videoPassword}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Location or Meeting Link (fallback) */}
              {!selectedEvent.resource.videoJoinUrl && (selectedEvent.resource.location || selectedEvent.resource.meetingLink) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">
                      {selectedEvent.resource.type === "in-person" ? "Location" : "Meeting Link"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedEvent.resource.location || selectedEvent.resource.meetingLink}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedEvent.resource.notes && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {selectedEvent.resource.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setDetailsDialogOpen(false);
                setRescheduleDialogOpen(true);
                if (selectedEvent) {
                  setNewDate(format(selectedEvent.start, "yyyy-MM-dd"));
                  setNewTime(format(selectedEvent.start, "HH:mm"));
                }
              }}
            >
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            <DialogDescription>
              Select a new date and time for this interview
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-date">New Date</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-time">New Time</Label>
              <Input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule} disabled={!newDate || !newTime}>
              Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
