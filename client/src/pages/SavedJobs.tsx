import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Briefcase, MapPin, DollarSign, Clock, Loader2, Building2, Bookmark, Trash2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function SavedJobs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch saved jobs
  const { data: savedJobs, isLoading, refetch } = trpc.candidate.getSavedJobs.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Unsave job mutation
  const unsaveJobMutation = trpc.candidate.unsaveJob.useMutation({
    onSuccess: () => {
      toast.success("Job removed from saved list");
      refetch();
    },
    onError: () => {
      toast.error("Failed to remove job");
    },
  });

  const handleUnsave = (jobId: number) => {
    if (!candidate?.id) return;
    unsaveJobMutation.mutate({ candidateId: candidate.id, jobId });
  };

  const handleApply = (jobId: number) => {
    setLocation(`/apply/${jobId}`);
  };

  const handleViewDetails = (jobId: number) => {
    setLocation(`/jobs/${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button 
        onClick={() => setLocation('/candidate/dashboard')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Saved Jobs</h1>
        <p className="text-muted-foreground">
          Jobs you've bookmarked for later review
        </p>
      </div>

      {!savedJobs || savedJobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No saved jobs yet</h3>
            <p className="text-muted-foreground mb-4">
              Start bookmarking jobs you're interested in to review them later
            </p>
            <Button onClick={() => setLocation("/jobs")}>
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {savedJobs.map(({ savedJob, job }) => (
            <Card key={savedJob.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {job.companyName && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{job.companyName}</span>
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                      )}
                      {(job.salaryMin || job.salaryMax) && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {job.salaryMin && job.salaryMax
                              ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                              : job.salaryMin
                              ? `$${job.salaryMin.toLocaleString()}+`
                              : `Up to $${job.salaryMax?.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnsave(job.id)}
                    disabled={unsaveJobMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {job.employmentType && (
                      <Badge variant="secondary">
                        <Briefcase className="w-3 h-3 mr-1" />
                        {job.employmentType}
                      </Badge>
                    )}

                  </div>

                  {job.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      Saved {new Date(savedJob.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => handleApply(job.id)} className="flex-1">
                      Apply Now
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(job.id)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
