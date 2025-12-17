import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Building2, Users, FileCheck, Video, Gift, CheckCircle, XCircle, UserX } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function JobDetails() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Try both route patterns
  const [matchJobs, paramsJobs] = useRoute("/jobs/:id");
  const [matchRecruiter, paramsRecruiter] = useRoute("/recruiter/jobs/:id");
  
  const params = matchJobs ? paramsJobs : paramsRecruiter;
  const jobId = parseInt(params?.id || "0");
  const isRecruiterView = matchRecruiter;

  const { data: job, isLoading } = trpc.job.getById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  const { data: stats } = trpc.recruiter.getJobApplicationStats.useQuery(
    { jobId },
    { enabled: !!jobId && isRecruiterView }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/jobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  const handleStatClick = (status: string) => {
    setLocation(`/recruiter/applications?jobId=${jobId}&status=${status}`);
  };

  const statItems = stats ? [
    { label: "Applied", value: stats.submitted, icon: Users, color: "text-blue-600", bgColor: "bg-blue-50", status: "submitted" },
    { label: "Screening", value: stats.reviewing, icon: FileCheck, color: "text-yellow-600", bgColor: "bg-yellow-50", status: "reviewing" },
    { label: "Interview", value: stats.interviewing, icon: Video, color: "text-purple-600", bgColor: "bg-purple-50", status: "interviewing" },
    { label: "Shortlisted", value: stats.shortlisted, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", status: "shortlisted" },
    { label: "Offered", value: stats.offered, icon: Gift, color: "text-indigo-600", bgColor: "bg-indigo-50", status: "offered" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-red-600", bgColor: "bg-red-50", status: "rejected" },
    { label: "Withdrawn", value: stats.withdrawn, icon: UserX, color: "text-gray-600", bgColor: "bg-gray-50", status: "withdrawn" },
  ] : [];

  const content = (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-5xl py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation(isRecruiterView ? "/recruiter/jobs" : "/jobs")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                {job.companyName && (
                  <CardDescription className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {job.companyName}
                  </CardDescription>
                )}
              </div>
              <Badge variant={job.status === "active" ? "default" : "secondary"}>
                {job.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Job Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{job.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm capitalize">{job.employmentType}</span>
              </div>
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Application Stats Bar (only for recruiters) */}
            {isRecruiterView && stats && (
              <div className="border-t border-b border-gray-200 py-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Application Pipeline</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {statItems.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <button
                        key={stat.status}
                        onClick={() => handleStatClick(stat.status)}
                        className={`${stat.bgColor} rounded-lg p-3 text-center transition-all hover:shadow-md hover:scale-105 cursor-pointer`}
                      >
                        <Icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Requirements */}
            {job.requirements && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Responsibilities</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{job.responsibilities}</p>
              </div>
            )}

            {/* Apply Button */}
            <div className="pt-4 border-t">
              {user?.role === 'recruiter' ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => setLocation(`/apply/${job.id}`)}
                  >
                    Apply for this Position
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation(`/recruiter/apply-on-behalf/${job.id}`)}
                  >
                    Apply on Behalf of Candidate
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full md:w-auto"
                  onClick={() => setLocation(`/apply/${job.id}`)}
                >
                  Apply for this Position
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Wrap with RecruiterLayout only for recruiter view
  if (isRecruiterView) {
    return <RecruiterLayout title={job.title}>{content}</RecruiterLayout>;
  }

  return content;
}
