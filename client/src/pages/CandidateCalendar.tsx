import { useState, useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import CandidateLayout from "@/components/CandidateLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock, MapPin, Video, Phone, Building, Bot, Briefcase, ExternalLink } from "lucide-react";

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

  // Fetch candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch interviews for the candidate
  const { data: interviews, isLoading } = trpc.interview.getByCandidate.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

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
      },
    }));
  }, [interviews]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      scheduled: { label: "Scheduled", variant: "default" },
      completed: { label: "Completed", variant: "secondary" },
      cancelled: { label: "Cancelled", variant: "destructive" },
      "no-show": { label: "No Show", variant: "destructive" },
      "in-progress": { label: "In Progress", variant: "outline" },
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
          <DialogContent className="max-w-md">
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
              <div className="space-y-4">
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
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              {selectedEvent?.resource.type === "ai-interview" && selectedEvent.resource.status === "scheduled" && (
                <Button 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500"
                  onClick={() => {
                    window.location.href = `/ai-interview/${selectedEvent.id}`;
                  }}
                >
                  Start AI Interview
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CandidateLayout>
  );
}
