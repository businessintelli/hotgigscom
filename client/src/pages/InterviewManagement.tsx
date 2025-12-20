import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Plus, Calendar, Video, Phone, MapPin, Clock, Edit, Trash2, CheckCircle, XCircle, Play, Users, ChevronDown, ChevronUp } from "lucide-react";
import InterviewPanelSection from "@/components/InterviewPanelSection";
import { PanelFeedbackSummary } from "@/components/PanelFeedbackSummary";
import { FeedbackPDFPreview } from "@/components/FeedbackPDFPreview";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/PaginationControls";

export default function InterviewManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const ITEMS_PER_PAGE = 10;
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [expandedInterviewId, setExpandedInterviewId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    applicationId: 0,
    candidateId: 0,
    jobId: 0,
    scheduledAt: "",
    duration: 60,
    type: "video" as "phone" | "video" | "in-person" | "ai-interview",
    meetingLink: "",
    location: "",
    notes: "",
  });

  const utils = trpc.useUtils();

  // Fetch interviews
  const { data: interviews = [], isLoading: interviewsLoading } = trpc.interview.listByRecruiter.useQuery();

  // Filter interviews (must be done before pagination hook)
  const filteredInterviews = interviews.filter((item: any) => {
    const interview = item?.interview || item; // Support both nested and flat structure
    const candidate = item?.candidate;
    const job = item?.job;
    
    // If no interview data at all, skip
    if (!interview || !interview.id) {
      return false;
    }
    
    const matchesSearch = !searchQuery ||
      candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || interview?.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination hook - MUST be called before any early returns
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedInterviews,
    setCurrentPage: goToPage,
  } = usePagination({ data: filteredInterviews, pageSize: ITEMS_PER_PAGE });

  // Create interview mutation
  const createMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      utils.interview.listByRecruiter.invalidate();
      setIsScheduleDialogOpen(false);
      resetForm();
      toast.success("Interview scheduled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to schedule interview: ${error.message}`);
    },
  });

  // Update interview mutation
  const updateMutation = trpc.interview.update.useMutation({
    onSuccess: () => {
      utils.interview.listByRecruiter.invalidate();
      toast.success("Interview updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update interview: ${error.message}`);
    },
  });

  // Delete interview mutation
  const deleteMutation = trpc.interview.delete.useMutation({
    onSuccess: () => {
      utils.interview.listByRecruiter.invalidate();
      toast.success("Interview cancelled successfully");
    },
    onError: (error) => {
      toast.error(`Failed to cancel interview: ${error.message}`);
    },
  });

  if (authLoading || interviewsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const resetForm = () => {
    setFormData({
      applicationId: 0,
      candidateId: 0,
      jobId: 0,
      scheduledAt: "",
      duration: 60,
      type: "video",
      meetingLink: "",
      location: "",
      notes: "",
    });
  };

  const handleSchedule = () => {
    if (!formData.applicationId || !formData.candidateId || !formData.jobId || !formData.scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateStatus = (id: number, status: "scheduled" | "in-progress" | "completed" | "cancelled" | "no-show") => {
    updateMutation.mutate({ id, status });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to cancel this interview?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Statistics
  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i: any) => i.interview?.status === "scheduled").length,
    completed: interviews.filter((i: any) => i.interview?.status === "completed").length,
    cancelled: interviews.filter((i: any) => i.interview?.status === "cancelled").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "in-progress": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "no-show": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      case "in-person": return <MapPin className="h-4 w-4" />;
      case "ai-interview": return <Play className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <RecruiterLayout title="Interviews">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation("/recruiter/dashboard")}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Management</h1>
                <p className="text-sm text-gray-600">Schedule and manage candidate interviews</p>
              </div>
            </div>
            <Button 
              onClick={() => setLocation("/recruiter/applications")}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule from Applications
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Interviews</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
                  <p className="text-sm text-gray-600">Scheduled</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  <p className="text-sm text-gray-600">Completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                  <p className="text-sm text-gray-600">Cancelled</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by candidate or job title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Interviews ({filteredInterviews.length})</CardTitle>
            <CardDescription>Manage scheduled and completed interviews</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInterviews.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchQuery || statusFilter !== "all" ? "No interviews found" : "No interviews scheduled yet"}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Debug: Total interviews: {interviews.length}, Filtered: {filteredInterviews.length}, Status filter: {statusFilter}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button onClick={() => setLocation("/recruiter/applications")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                {paginatedInterviews?.map((item: any) => {
                  const interview = item.interview;
                  const candidate = item.candidate;
                  const job = item.job;
                  
                  return (
                    <Card key={interview.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              {getTypeIcon(interview.type)}
                              <h3 className="text-lg font-semibold">{candidate?.fullName || "Unknown Candidate"}</h3>
                              <Badge className={getStatusColor(interview.status)}>
                                {interview.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Position:</strong> {job?.title || "Unknown Position"}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <strong>Date:</strong> {new Date(interview.scheduledAt).toLocaleDateString()}
                              </div>
                              <div>
                                <strong>Time:</strong> {new Date(interview.scheduledAt).toLocaleTimeString()}
                              </div>
                              <div>
                                <strong>Duration:</strong> {interview.duration} min
                              </div>
                              <div>
                                <strong>Type:</strong> {interview.type}
                              </div>
                            </div>
                            {interview.meetingLink && (
                              <div className="mt-2">
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                >
                                  Join Meeting →
                                </a>
                              </div>
                            )}
                            {interview.notes && (
                              <p className="text-sm text-gray-600 mt-2">
                                <strong>Notes:</strong> {interview.notes}
                              </p>
                            )}
                            
                            {/* Panel Feedback Summary */}
                            {interview.status === "completed" && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <PanelFeedbackSummary interviewId={interview.id} compact={true} />
                                <div className="mt-2">
                                  <FeedbackPDFPreview
                                    interviewId={interview.id}
                                    candidateName={candidate?.fullName}
                                    jobTitle={job?.title}
                                    interviewDate={interview.scheduledAt}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Panel Toggle Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-primary"
                              onClick={() => setExpandedInterviewId(
                                expandedInterviewId === interview.id ? null : interview.id
                              )}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Interview Panel
                              {expandedInterviewId === interview.id ? (
                                <ChevronUp className="h-4 w-4 ml-1" />
                              ) : (
                                <ChevronDown className="h-4 w-4 ml-1" />
                              )}
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {interview.status === "scheduled" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(interview.id, "in-progress")}
                                >
                                  Start
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(interview.id, "completed")}
                                >
                                  Complete
                                </Button>
                              </>
                            )}
                            {interview.status === "in-progress" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(interview.id, "completed")}
                              >
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(interview.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* Expandable Panel Section */}
                        {expandedInterviewId === interview.id && (
                          <div className="mt-4 pt-4 border-t">
                            <InterviewPanelSection interviewId={interview.id} canManage={true} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                 })}
                </div>
                {totalPages > 1 && (
                <div className="mt-6">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredInterviews.length}
                    pageSize={ITEMS_PER_PAGE}
                    onPageChange={goToPage}
                  />
                </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </RecruiterLayout>
  );
}
