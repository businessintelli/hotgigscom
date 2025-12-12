import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Award, Briefcase, GraduationCap, Target, CheckCircle, Eye, Calendar, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Progress } from "@/components/ui/progress";
import { ResumeViewer } from "@/components/ResumeViewer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ResumeRankingDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [resumeViewerOpen, setResumeViewerOpen] = useState(false);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState("");
  const [selectedResumeFilename, setSelectedResumeFilename] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);

  // Export mutations
  const exportToExcelMutation = trpc.export.exportToExcel.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const blob = new Blob([Uint8Array.from(atob(data.data), c => c.charCodeAt(0))], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel file downloaded successfully!');
    },
    onError: () => {
      toast.error('Failed to export to Excel');
    },
  });

  const exportToCSVMutation = trpc.export.exportToCSV.useMutation({
    onSuccess: (data) => {
      // Create blob and download
      const blob = new Blob([data.data], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV file downloaded successfully!');
    },
    onError: () => {
      toast.error('Failed to export to CSV');
    },
  });

  const handleExportExcel = () => {
    if (!selectedJobId) {
      toast.error('Please select a job first');
      return;
    }
    exportToExcelMutation.mutate({
      jobId: selectedJobId,
      includeRankings: true,
      includeSkills: true,
      includeExperience: true,
      includeEducation: true,
    });
  };

  const handleExportCSV = () => {
    if (!selectedJobId) {
      toast.error('Please select a job first');
      return;
    }
    exportToCSVMutation.mutate({
      jobId: selectedJobId,
      includeRankings: true,
      includeSkills: true,
      includeExperience: true,
      includeEducation: true,
    });
  };

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch all jobs
  const { data: jobs = [] } = trpc.job.list.useQuery(undefined, {
    enabled: !!recruiter?.id,
  });

  // Fetch ranked candidates for selected job
  const { data: rankedCandidates = [], isLoading: rankingLoading } = trpc.ranking.getTopCandidates.useQuery(
    { jobId: selectedJobId!, limit: 20 },
    { enabled: !!selectedJobId }
  );

  if (authLoading) {
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

  function getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  }

  function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Resume Ranking Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered candidate ranking based on skill match, experience, and education
        </p>
      </div>

      {/* Job Selection */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Job Position</CardTitle>
          <CardDescription>
            Choose a job to view ranked candidates based on resume analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedJobId?.toString() || ""}
            onValueChange={(value) => setSelectedJobId(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a job position..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  {job.title} - {job.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Loading State */}
      {rankingLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Ranked Candidates List */}
      {selectedJobId && !rankingLoading && rankedCandidates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Ranked Candidates</h2>
              <p className="text-muted-foreground text-sm">Top candidates ranked by AI-powered resume analysis</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={exportToCSVMutation.isPending}
              >
                {exportToCSVMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export CSV
              </Button>
              <Button
                variant="default"
                onClick={handleExportExcel}
                disabled={exportToExcelMutation.isPending}
              >
                {exportToExcelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Excel
              </Button>
            </div>
          </div>
          <div>
            <Badge variant="outline" className="text-sm">
              Sorted by Overall Score
            </Badge>
          </div>

          {rankedCandidates.map((item, index) => {
            const { candidate, ranking } = item;
            
            return (
              <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>

                      {/* Candidate Info */}
                      <div>
                        <h3 className="text-xl font-semibold mb-1">
                          {candidate.fullName || "Candidate"}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {candidate.email}
                        </p>
                        {candidate.location && (
                          <p className="text-sm text-muted-foreground">
                            📍 {candidate.location}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(ranking.overallScore)}`}>
                        {Math.round(ranking.overallScore)}
                      </div>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Skill Match */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          Skill Match
                        </span>
                        <span className="font-semibold">{Math.round(ranking.matchPercentage)}%</span>
                      </div>
                      <Progress value={ranking.matchPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {ranking.matchedSkillsCount} of {ranking.totalSkillsCount} skills matched
                      </p>
                    </div>

                    {/* Experience Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-green-600" />
                          Experience
                        </span>
                        <span className="font-semibold">{Math.round(ranking.experienceScore)}</span>
                      </div>
                      <Progress value={ranking.experienceScore} className="h-2" />
                    </div>

                    {/* Education Score */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-purple-600" />
                          Education
                        </span>
                        <span className="font-semibold">{Math.round(ranking.educationScore)}</span>
                      </div>
                      <Progress value={ranking.educationScore} className="h-2" />
                    </div>
                  </div>

                  {/* Matched Skills */}
                  {ranking.skillMatches && ranking.skillMatches.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Matched Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ranking.skillMatches.slice(0, 10).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {skill.skill}
                            {skill.strength && (
                              <span className="ml-1 text-xs">
                                ({Math.round(skill.strength * 100)}%)
                              </span>
                            )}
                          </Badge>
                        ))}
                        {ranking.skillMatches.length > 10 && (
                          <Badge variant="outline">
                            +{ranking.skillMatches.length - 10} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    {candidate.resumeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedResumeUrl(candidate.resumeUrl!);
                          setSelectedResumeFilename(candidate.resumeFilename || 'resume.pdf');
                          setResumeViewerOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Resume
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/recruiter/applications?candidateId=${candidate.id}`)}
                    >
                      View Applications
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setSelectedCandidateId(candidate.id);
                        setScheduleDialogOpen(true);
                      }}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule Interview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/recruiter/applications?candidateId=${candidate.id}`)}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Shortlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {selectedJobId && !rankingLoading && rankedCandidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Candidates Found</h3>
            <p className="text-muted-foreground">
              No candidates have applied to this position yet, or no resumes have been parsed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Job Selected State */}
      {!selectedJobId && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Job Position</h3>
            <p className="text-muted-foreground">
              Choose a job from the dropdown above to view ranked candidates
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resume Viewer Dialog */}
      <ResumeViewer
        resumeUrl={selectedResumeUrl}
        resumeFilename={selectedResumeFilename}
        open={resumeViewerOpen}
        onClose={() => setResumeViewerOpen(false)}
      />

      {/* Schedule Interview Dialog */}
      <ScheduleInterviewDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        candidateId={selectedCandidateId}
        jobId={selectedJobId}
      />
    </div>
  );
}

// Schedule Interview Dialog Component
function ScheduleInterviewDialog({
  open,
  onClose,
  candidateId,
  jobId,
}: {
  open: boolean;
  onClose: () => void;
  candidateId: number | null;
  jobId: number | null;
}) {
  const [interviewType, setInterviewType] = useState<'ai-interview' | 'video' | 'phone' | 'in-person'>('ai-interview');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [panelEmails, setPanelEmails] = useState('');

  const createInterviewMutation = trpc.interview.create.useMutation({
    onSuccess: () => {
      toast.success('Interview scheduled successfully!');
      onClose();
      // Reset form
      setScheduledDate('');
      setScheduledTime('');
      setNotes('');
      setPanelEmails('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to schedule interview');
    },
  });

  const handleSchedule = () => {
    if (!candidateId || !jobId) {
      toast.error('Missing candidate or job information');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

    createInterviewMutation.mutate({
      applicationId: 0, // TODO: Get actual application ID
      candidateId,
      jobId,
      type: interviewType,
      scheduledAt: scheduledAt.toISOString(),
      duration: parseInt(duration),
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview for this candidate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Interview Type */}
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={interviewType === 'ai-interview' ? 'default' : 'outline'}
                onClick={() => setInterviewType('ai-interview')}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <div className="text-lg">🤖</div>
                  <div className="text-sm font-medium">AI Bot Interview</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={interviewType === 'video' ? 'default' : 'outline'}
                onClick={() => setInterviewType('video')}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <div className="text-lg">📹</div>
                  <div className="text-sm font-medium">Video Interview</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={interviewType === 'phone' ? 'default' : 'outline'}
                onClick={() => setInterviewType('phone')}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <div className="text-lg">📞</div>
                  <div className="text-sm font-medium">Phone Interview</div>
                </div>
              </Button>
              <Button
                type="button"
                variant={interviewType === 'in-person' ? 'default' : 'outline'}
                onClick={() => setInterviewType('in-person')}
                className="h-auto py-3"
              >
                <div className="text-center">
                  <div className="text-lg">👤</div>
                  <div className="text-sm font-medium">In-Person</div>
                </div>
              </Button>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Interview Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Interview Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Panel Emails (for non-AI interviews) */}
          {interviewType !== 'ai-interview' && (
            <div className="space-y-2">
              <Label htmlFor="panelEmails">Interview Panel Emails</Label>
              <Textarea
                id="panelEmails"
                placeholder="Enter email addresses separated by commas\ne.g., john@company.com, sarah@company.com"
                value={panelEmails}
                onChange={(e) => setPanelEmails(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                These interviewers will receive calendar invitations
              </p>
            </div>
          )}

          {/* AI Interview Info */}
          {interviewType === 'ai-interview' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                🤖 AI Interview Features:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Automated question generation based on job requirements</li>
                <li>• Video recording with real-time fraud detection</li>
                <li>• Automatic transcription and AI evaluation</li>
                <li>• Comprehensive evaluation reports for recruiters</li>
              </ul>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or notes for this interview"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={createInterviewMutation.isPending}
          >
            {createInterviewMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
