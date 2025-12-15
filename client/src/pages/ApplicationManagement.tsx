import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Filter, Download, Mail, Phone, FileText, CheckCircle2, XCircle, Clock, Users, TrendingUp, Calendar, MessageSquare, Share2, Bot, User, CalendarDays, Send, Video, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResumeViewer } from "@/components/ResumeViewer";
import SkillMatrixDisplay from "@/components/SkillMatrixDisplay";
import { SkillMatrixComparison } from "@/components/SkillMatrixComparison";

export default function ApplicationManagement() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [interviewType, setInterviewType] = useState<"ai-interview" | "phone" | "video" | "in-person">("ai-interview");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewDuration, setInterviewDuration] = useState("60");
  const [panelEmails, setPanelEmails] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState("");
  const [selectedResumeFilename, setSelectedResumeFilename] = useState("");
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");
  const [selectedVideoDuration, setSelectedVideoDuration] = useState(0);
  
  // Smart filtering state
  const [minOverallScore, setMinOverallScore] = useState(0);
  const [minDomainScore, setMinDomainScore] = useState(0);
  const [minSkillScore, setMinSkillScore] = useState(0);
  const [minExperienceScore, setMinExperienceScore] = useState(0);

  const utils = trpc.useUtils();

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch all jobs
  const { data: jobs = [] } = trpc.job.list.useQuery(undefined, {
    enabled: !!recruiter?.id,
  });

  // Fetch all applications
  const { data: applications = [], isLoading: applicationsLoading } = trpc.application.list.useQuery(
    undefined,
    { enabled: !!recruiter?.id }
  );

  // Update application status mutation
  const updateStatusMutation = trpc.application.updateStatus.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      toast.success("Application status updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = trpc.application.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      setSelectedApplications([]);
      toast.success("Applications updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update applications: ${error.message}`);
    },
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      utils.application.list.invalidate();
      utils.interview.listByRecruiter.invalidate();
      setScheduleDialogOpen(false);
      resetScheduleForm();
      toast.success("Interview scheduled successfully! Invitation email sent to candidate.");
    },
    onError: (error: any) => {
      toast.error(`Failed to schedule interview: ${error.message}`);
    },
  });

  if (authLoading || applicationsLoading) {
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

  // Filter applications
  const filteredApplications = applications.filter((app: any) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesJob = !selectedJobId || app.jobId === selectedJobId;
    const matchesSearch = !searchQuery || 
      app.candidate?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Smart score filtering
    const matchesOverallScore = !app.resumeProfile || (app.resumeProfile.overallScore || 0) >= minOverallScore;
    const matchesDomainScore = !app.resumeProfile || (app.resumeProfile.domainMatchScore || 0) >= minDomainScore;
    const matchesSkillScore = !app.resumeProfile || (app.resumeProfile.skillMatchScore || 0) >= minSkillScore;
    const matchesExperienceScore = !app.resumeProfile || (app.resumeProfile.experienceScore || 0) >= minExperienceScore;
    
    return matchesStatus && matchesJob && matchesSearch && 
           matchesOverallScore && matchesDomainScore && matchesSkillScore && matchesExperienceScore;
  });

  const handleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map((app: any) => app.id));
    }
  };

  const handleSelectApplication = (id: number) => {
    setSelectedApplications(prev =>
      prev.includes(id) ? prev.filter(appId => appId !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = (status: "submitted" | "reviewing" | "shortlisted" | "interviewing" | "offered" | "rejected" | "withdrawn") => {
    if (selectedApplications.length === 0) {
      toast.error("Please select at least one application");
      return;
    }
    bulkUpdateMutation.mutate({
      applicationIds: selectedApplications,
      status,
    });
  };

  const handleStatusUpdate = (applicationId: number, status: "submitted" | "reviewing" | "shortlisted" | "interviewing" | "offered" | "rejected" | "withdrawn", application?: any) => {
    if (status === "interviewing" && application) {
      // Open schedule interview dialog
      setSelectedApplication(application);
      setScheduleDialogOpen(true);
    } else {
      updateStatusMutation.mutate({ id: applicationId, status });
    }
  };

  const resetScheduleForm = () => {
    setInterviewType("ai-interview");
    setInterviewDate("");
    setInterviewTime("");
    setInterviewDuration("60");
    setPanelEmails("");
    setInterviewNotes("");
    setSelectedApplication(null);
  };

  const handleScheduleInterview = () => {
    if (!selectedApplication || !interviewDate || !interviewTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Combine date and time into a single datetime
    const scheduledDateTime = new Date(`${interviewDate}T${interviewTime}`);

    // Add panel emails to notes if provided
    const notesWithPanel = interviewNotes + (panelEmails ? `\n\nInterview Panel: ${panelEmails}` : '');
    
    scheduleInterviewMutation.mutate({
      applicationId: selectedApplication.id,
      candidateId: selectedApplication.candidateId,
      jobId: selectedApplication.jobId,
      type: interviewType,
      scheduledAt: scheduledDateTime.toISOString(),
      duration: parseInt(interviewDuration),
      notes: notesWithPanel || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
      pending: { variant: "outline", icon: Clock, label: "Pending" },
      reviewing: { variant: "default", icon: Search, label: "Reviewing" },
      shortlisted: { variant: "default", icon: CheckCircle2, label: "Shortlisted" },
      interview: { variant: "default", icon: Calendar, label: "Interview" },
      offered: { variant: "default", icon: CheckCircle2, label: "Offered" },
      hired: { variant: "default", icon: CheckCircle2, label: "Hired" },
      rejected: { variant: "destructive", icon: XCircle, label: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter((app: any) => app.status === "pending").length,
    reviewing: applications.filter((app: any) => app.status === "reviewing").length,
    shortlisted: applications.filter((app: any) => app.status === "shortlisted").length,
    interview: applications.filter((app: any) => app.status === "interview").length,
    offered: applications.filter((app: any) => app.status === "offered").length,
    hired: applications.filter((app: any) => app.status === "hired").length,
    rejected: applications.filter((app: any) => app.status === "rejected").length,
  };

  return (
    <RecruiterLayout title="Applications">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/recruiter/dashboard")}>
                ← Back
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Application Management</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Track and manage all candidate applications</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedJobId && filteredApplications.length >= 2 && (
                <SkillMatrixComparison
                  jobId={selectedJobId}
                  candidates={filteredApplications.map((app: any) => ({
                    id: app.candidateId,
                    name: app.candidateName || app.candidate?.fullName || "Unknown",
                    applicationId: app.id,
                  }))}
                  trigger={
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-purple-600 border-purple-300 hover:bg-purple-50">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Compare Skills</span>
                    </Button>
                  }
                />
              )}
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("all")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-600">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("pending")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("reviewing")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.reviewing}</p>
                <p className="text-xs text-gray-600">Reviewing</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("shortlisted")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.shortlisted}</p>
                <p className="text-xs text-gray-600">Shortlisted</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("interview")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{stats.interview}</p>
                <p className="text-xs text-gray-600">Interview</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("offered")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.offered}</p>
                <p className="text-xs text-gray-600">Offered</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("hired")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">{stats.hired}</p>
                <p className="text-xs text-gray-600">Hired</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("rejected")}>
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search Candidates</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Job</label>
                <Select value={selectedJobId?.toString() || "all"} onValueChange={(value) => setSelectedJobId(value === "all" ? null : parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Smart Score Filters */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">AI Score Filters</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Overall Score: {minOverallScore}%</label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={minOverallScore}
                      onChange={(e) => setMinOverallScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Domain Match: {minDomainScore}%</label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={minDomainScore}
                      onChange={(e) => setMinDomainScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Skill Match: {minSkillScore}%</label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={minSkillScore}
                      onChange={(e) => setMinSkillScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Experience: {minExperienceScore}%</label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={minExperienceScore}
                      onChange={(e) => setMinExperienceScore(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  {(minOverallScore > 0 || minDomainScore > 0 || minSkillScore > 0 || minExperienceScore > 0) && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setMinOverallScore(0);
                        setMinDomainScore(0);
                        setMinSkillScore(0);
                        setMinExperienceScore(0);
                      }}
                    >
                      Clear Score Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedApplications.length > 0 && (
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardContent className="pt-4 sm:pt-6 px-2 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox checked={true} onCheckedChange={handleSelectAll} />
                  <span className="font-medium">{selectedApplications.length} selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("reviewing")}>
                    Mark as Reviewing
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("shortlisted")}>
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate("interviewing")}>
                    Schedule Interview
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleBulkStatusUpdate("rejected")}>
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Applications ({filteredApplications.length})</CardTitle>
                <CardDescription>Manage and track candidate applications</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedApplications.length === filteredApplications.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No applications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((application: any) => (
                  <div key={application.id} className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-2 sm:gap-4">
                      <Checkbox
                        checked={selectedApplications.includes(application.id)}
                        onCheckedChange={() => handleSelectApplication(application.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row items-start justify-between mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                              {application.candidate?.fullName || "Anonymous Candidate"}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Applied for: {application.job?.title}</p>
                          </div>
                          <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                            {getStatusBadge(application.status)}
                            <p className="text-xs text-gray-500">
                              {new Date(application.appliedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                          {application.candidate?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {application.candidate.email}
                            </span>
                          )}
                          {application.candidate?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {application.candidate.phone}
                            </span>
                          )}
                        </div>

                        {application.coverLetter && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700 line-clamp-2">{application.coverLetter}</p>
                          </div>
                        )}

                        {/* Resume Statistics */}
                        {application.resumeProfile && (
                          <div className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-semibold text-gray-900">Resume Analysis</h4>
                              <Badge variant="secondary" className="text-xs">
                                Overall: {application.resumeProfile.overallScore || 0}%
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Domain Match</span>
                                  <span className="font-medium">{application.resumeProfile.domainMatchScore || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${application.resumeProfile.domainMatchScore || 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Skill Match</span>
                                  <span className="font-medium">{application.resumeProfile.skillMatchScore || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{ width: `${application.resumeProfile.skillMatchScore || 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">Experience</span>
                                  <span className="font-medium">{application.resumeProfile.experienceScore || 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${application.resumeProfile.experienceScore || 0}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Top Domains and Skills */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {application.resumeProfile.topDomains && application.resumeProfile.topDomains.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-2">Top Domains</p>
                                  <div className="flex flex-wrap gap-1">
                                    {application.resumeProfile.topDomains.slice(0, 3).map((domain: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {domain.name} {domain.percentage}%
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {application.resumeProfile.topSkills && application.resumeProfile.topSkills.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-2">Top Skills</p>
                                  <div className="flex flex-wrap gap-1">
                                    {application.resumeProfile.topSkills.slice(0, 3).map((skill: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {skill.name} {skill.percentage}%
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Skill Matrix Display */}
                        {application.skillRatings && application.skillRatings.length > 0 && (
                          <div className="mb-3">
                            <SkillMatrixDisplay ratings={application.skillRatings} compact />
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                          {application.resumeProfileId ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                const videoParam = application.videoIntroductionId ? `?videoId=${application.videoIntroductionId}` : '';
                                setLocation(`/recruiter/candidate-resume/${application.resumeProfileId}${videoParam}`);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Resume Details
                            </Button>
                          ) : application.resumeUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedResumeUrl(application.resumeUrl!);
                                setSelectedResumeFilename(application.resumeFilename || 'resume.pdf');
                                setResumeViewerOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Resume
                            </Button>
                          )}
                          {application.videoIntroduction && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedVideoUrl(application.videoIntroduction.videoUrl);
                                setSelectedVideoDuration(application.videoIntroduction.duration);
                                setVideoDialogOpen(true);
                              }}
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Watch Video
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-1" />
                            Share with Client
                          </Button>
                          <Select
                            value={application.status}
                            onValueChange={(value) => handleStatusUpdate(application.id, value as any, application)}
                          >
                            <SelectTrigger className="w-[150px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewing">Reviewing</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="interviewing">Schedule Interview</SelectItem>
                              <SelectItem value="offered">Offered</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Interview Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Schedule an interview for {selectedApplication?.candidate?.fullName || "this candidate"} - {selectedApplication?.job?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Interview Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Interview Type</Label>
              <RadioGroup value={interviewType} onValueChange={(value: any) => setInterviewType(value)}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent" onClick={() => setInterviewType("ai-interview")}>
                    <RadioGroupItem value="ai-interview" id="ai-interview" />
                    <Label htmlFor="ai-interview" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold">AI Bot Interview</p>
                        <p className="text-xs text-gray-500">Automated AI-powered interview</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent" onClick={() => setInterviewType("video")}>
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold">Video Interview</p>
                        <p className="text-xs text-gray-500">Live video call interview</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent" onClick={() => setInterviewType("phone")}>
                    <RadioGroupItem value="phone" id="phone" />
                    <Label htmlFor="phone" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold">Phone Interview</p>
                        <p className="text-xs text-gray-500">Traditional phone call</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-accent" onClick={() => setInterviewType("in-person")}>
                    <RadioGroupItem value="in-person" id="in-person" />
                    <Label htmlFor="in-person" className="flex items-center gap-2 cursor-pointer flex-1">
                      <User className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-semibold">In-Person Interview</p>
                        <p className="text-xs text-gray-500">Face-to-face meeting</p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interview-date">Interview Date</Label>
                <Input
                  id="interview-date"
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interview-time">Interview Time</Label>
                <Input
                  id="interview-time"
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={interviewDuration} onValueChange={setInterviewDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Panel Emails (for non-AI interviews) */}
            {interviewType !== "ai-interview" && (
              <div className="space-y-2">
                <Label htmlFor="panel-emails">Interview Panel Emails</Label>
                <Textarea
                  id="panel-emails"
                  placeholder="Enter email addresses separated by commas\ne.g., john@company.com, sarah@company.com"
                  value={panelEmails}
                  onChange={(e) => setPanelEmails(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">These interviewers will receive calendar invitations</p>
              </div>
            )}

            {/* Interview Notes */}
            <div className="space-y-2">
              <Label htmlFor="interview-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="interview-notes"
                placeholder="Add any special instructions or notes for the interview..."
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* AI Interview Info */}
            {interviewType === "ai-interview" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 mb-1">AI Interview Features:</p>
                    <ul className="text-blue-800 space-y-1 list-disc list-inside">
                      <li>Automated question generation based on job requirements</li>
                      <li>Video recording with real-time fraud detection</li>
                      <li>Automatic transcription and AI evaluation</li>
                      <li>Comprehensive evaluation reports for recruiters</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleInterview} disabled={!interviewDate || !interviewTime}>
              <Send className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Viewer Dialog */}
      <ResumeViewer
        resumeUrl={selectedResumeUrl}
        resumeFilename={selectedResumeFilename}
        open={resumeViewerOpen}
        onClose={() => setResumeViewerOpen(false)}
      />

      {/* Video Introduction Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Candidate Video Introduction</DialogTitle>
            <DialogDescription>
              Duration: {Math.floor(selectedVideoDuration / 60)}:{(selectedVideoDuration % 60).toString().padStart(2, '0')} minutes
            </DialogDescription>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={selectedVideoUrl}
              controls
              className="w-full h-full"
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </RecruiterLayout>
  );
}
