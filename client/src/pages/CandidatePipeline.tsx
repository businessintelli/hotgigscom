import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, TrendingUp, Users, Calendar, Star, MapPin, Briefcase, CalendarPlus, Clock, MessageSquare, Activity } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PipelineStage = "pending" | "screening" | "interview_scheduled" | "offer" | "hired" | "rejected";

const STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: "pending", label: "Applied", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { id: "interview_scheduled", label: "Interview", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "offer", label: "Offer", color: "bg-green-100 text-green-800 border-green-200" },
  { id: "hired", label: "Hired", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "rejected", label: "Rejected", color: "bg-red-100 text-red-800 border-red-200" },
];

interface CandidateCardProps {
  application: any;
  isDragging?: boolean;
  onScheduleInterview?: (application: any) => void;
}

function CandidateCard({ application, isDragging, onScheduleInterview }: CandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const candidate = application.candidate;
  const resumeProfile = application.resumeProfile;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-move mb-3"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-gray-900">
            {candidate?.firstName} {candidate?.lastName}
          </h4>
          <p className="text-sm text-gray-600">{candidate?.email}</p>
        </div>
        {resumeProfile && (
          <Badge variant="secondary" className="ml-2">
            {resumeProfile.overallScore}%
          </Badge>
        )}
      </div>

      {candidate?.location && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
          <MapPin className="h-3 w-3" />
          {candidate.location}
        </div>
      )}

      {candidate?.currentJobTitle && (
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
          <Briefcase className="h-3 w-3" />
          {candidate.currentJobTitle}
        </div>
      )}

      {resumeProfile && (
        <div className="flex flex-wrap gap-1 mb-2">
          {resumeProfile.topSkills?.slice(0, 3).map((skill: any, idx: number) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {skill.skill}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(application.submittedAt).toLocaleDateString()}
        </span>
        {application.feedback && application.feedback.length > 0 && (
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {application.feedback.length} reviews
          </span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-3 border-t flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onScheduleInterview?.(application);
          }}
        >
          <CalendarPlus className="h-3 w-3 mr-1" />
          Schedule
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <Activity className="h-3 w-3 mr-1" />
              Activity
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Recent Activity</h4>
              
              {/* Timeline */}
              <div className="space-y-3">
                {/* Application Submitted */}
                <div className="flex gap-2 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="h-full w-px bg-gray-200 mt-1" />
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-muted-foreground">
                      {new Date(application.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Feedback */}
                {application.feedback && application.feedback.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <div className="h-full w-px bg-gray-200 mt-1" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium">
                        {application.feedback.length} Team Review{application.feedback.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-muted-foreground">
                        Latest: {application.feedback[0].recruiterName}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < application.feedback[0].rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Interviews */}
                {application.interviews && application.interviews.length > 0 && (
                  <div className="flex gap-2 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <div className="h-full w-px bg-gray-200 mt-1" />
                    </div>
                    <div className="flex-1 pb-3">
                      <p className="font-medium">
                        {application.interviews.length} Interview{application.interviews.length > 1 ? 's' : ''}
                      </p>
                      <p className="text-muted-foreground">
                        Latest: {new Date(application.interviews[0].scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Status */}
                <div className="flex gap-2 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Current Status</p>
                    <Badge variant="outline" className="mt-1">
                      {STAGES.find(s => s.id === application.status)?.label || application.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function PipelineColumn({ stage, applications, jobFilter, onScheduleInterview }: { stage: typeof STAGES[0]; applications: any[]; jobFilter: string; onScheduleInterview: (app: any) => void }) {
  const filteredApps = applications.filter(app => {
    if (jobFilter && jobFilter !== "all") {
      return app.jobId === parseInt(jobFilter);
    }
    return true;
  });

  return (
    <div className={`flex-1 min-w-[280px] ${stage.color} rounded-lg p-4 border-2`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{stage.label}</h3>
        <Badge variant="secondary">{filteredApps.length}</Badge>
      </div>

      <SortableContext items={filteredApps.map(app => app.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px]">
          {filteredApps.map(app => (
            <CandidateCard key={app.id} application={app} onScheduleInterview={onScheduleInterview} />
          ))}
          {filteredApps.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No candidates
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function CandidatePipeline() {
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");

  const { data: applications, isLoading, refetch } = trpc.application.list.useQuery();
  const { data: jobs } = trpc.recruiter.getJobs.useQuery();
  const updateStatusMutation = trpc.application.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Candidate moved successfully");
    },
    onError: () => {
      toast.error("Failed to update candidate status");
    },
  });

  const scheduleInterviewMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      refetch();
      setScheduleModalOpen(false);
      setInterviewDate("");
      setInterviewTime("");
      setInterviewNotes("");
      toast.success("Interview scheduled successfully");
    },
    onError: () => {
      toast.error("Failed to schedule interview");
    },
  });

  const handleScheduleInterview = (application: any) => {
    setSelectedApplication(application);
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = () => {
    if (!selectedApplication || !interviewDate || !interviewTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const scheduledAt = new Date(`${interviewDate}T${interviewTime}`);

    scheduleInterviewMutation.mutate({
      applicationId: selectedApplication.id,
      candidateId: selectedApplication.candidateId,
      jobId: selectedApplication.jobId,
      type: "video",
      scheduledAt: scheduledAt.toISOString(),
      duration: 60,
      location: "Online",
      notes: interviewNotes,
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const applicationsByStage = useMemo(() => {
    if (!applications) return {};
    
    const grouped: Record<PipelineStage, any[]> = {
      pending: [],
      screening: [],
      interview_scheduled: [],
      offer: [],
      hired: [],
      rejected: [],
    };

    applications.forEach((app: any) => {
      const stage = app.status as PipelineStage;
      if (grouped[stage]) {
        grouped[stage].push(app);
      }
    });

    return grouped;
  }, [applications]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeApp = applications?.find((app: any) => app.id === active.id);
    if (!activeApp) return;

    // Find which stage the card was dropped into
    const overStage = STAGES.find(stage => {
      const stageApps = (applicationsByStage as any)[stage.id];
      return stageApps.some((app: any) => app.id === over.id) || over.id === stage.id;
    });

    if (!overStage) return;

    // Update status if changed
    if (activeApp.status !== overStage.id) {
      updateStatusMutation.mutate({
        id: activeApp.id,
        status: overStage.id as any,
      });
    }
  };

  const activeApplication = applications?.find((app: any) => app.id === activeId);

  // Calculate conversion rates
  const conversionRates = useMemo(() => {
    if (!applications || applications.length === 0) return {} as Record<PipelineStage, number>;

    const total = applications.length;
    const rates: Record<PipelineStage, number> = {} as Record<PipelineStage, number>;

    STAGES.forEach(stage => {
      const count = (applicationsByStage as any)[stage.id]?.length || 0;
      rates[stage.id] = Math.round((count / total) * 100);
    });

    return rates;
  }, [applications, applicationsByStage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Candidate Pipeline
        </h1>
        <p className="text-muted-foreground mt-2">
          Track candidates through your hiring funnel with drag-and-drop
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="job-filter" className="text-sm font-medium mb-2 block">
                Filter by Job
              </Label>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger id="job-filter">
                  <SelectValue placeholder="All jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  {jobs?.map(job => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {STAGES.map(stage => (
              <div key={stage.id} className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {(conversionRates as any)[stage.id] || 0}%
                </div>
                <div className="text-sm text-muted-foreground">{stage.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(applicationsByStage as any)[stage.id]?.length || 0} candidates
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              applications={(applicationsByStage as any)[stage.id] || []}
              jobFilter={jobFilter}
              onScheduleInterview={handleScheduleInterview}
            />
          ))}
        </div>

        <DragOverlay>
          {activeApplication && <CandidateCard application={activeApplication} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Interview Scheduling Modal */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview with {selectedApplication?.candidate?.firstName} {selectedApplication?.candidate?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="interview-date">Interview Date *</Label>
              <Input
                id="interview-date"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview-time">Interview Time *</Label>
              <Input
                id="interview-time"
                type="time"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview-notes">Notes (Optional)</Label>
              <Textarea
                id="interview-notes"
                placeholder="Add any notes or instructions for the interview..."
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-medium">Interview Details</p>
                  <p className="text-xs mt-1">Type: Video Call • Duration: 60 minutes</p>
                  <p className="text-xs">Location: Online</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSchedule} disabled={scheduleInterviewMutation.isPending}>
              {scheduleInterviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


