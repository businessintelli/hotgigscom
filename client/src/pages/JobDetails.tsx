import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Building2, Users, FileCheck, Video, Gift, CheckCircle, XCircle, UserX, Edit, Eye, TrendingUp, Calendar } from "lucide-react";
import { JobShareButton } from "@/components/JobShareButton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useLocation, useRoute } from "wouter";
import { useEffect } from "react";
import { trackJobView } from "@/lib/trackJobView";

export default function JobDetails() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Try both route patterns
  const [matchJobs, paramsJobs] = useRoute("/jobs/:id");
  const [matchRecruiter, paramsRecruiter] = useRoute("/recruiter/jobs/:id");
  
  const params = matchJobs ? paramsJobs : paramsRecruiter;
  const jobId = parseInt(params?.id || "0");
  // Show recruiter layout if user is a recruiter, regardless of URL
  const isRecruiterView = user?.role === "recruiter" || user?.role === "company_admin";

  const { data: job, isLoading } = trpc.job.getById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
  );

  const { data: stats } = trpc.recruiter.getJobApplicationStats.useQuery(
    { jobId },
    { enabled: !!jobId && isRecruiterView }
  );
  
  const { data: analytics } = trpc.job.getJobAnalytics.useQuery(
    { jobId },
    { enabled: !!jobId && isRecruiterView }
  );
  
  // Track job view when page loads
  useEffect(() => {
    if (jobId && job) {
      trackJobView({ jobId, userId: user?.id }, trpc);
    }
  }, [jobId, job, user?.id]);

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
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: isRecruiterView ? "/recruiter/dashboard" : "/candidate-dashboard" },
            { label: "Jobs", href: isRecruiterView ? "/recruiter/jobs" : "/jobs" },
            { label: job.title }
          ]}
        />

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
              <div className="flex items-center gap-2">
                {isRecruiterView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/recruiter/jobs/${job.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Job
                  </Button>
                )}
                <JobShareButton
                  jobId={job.id}
                  jobTitle={job.title}
                  companyName={job.companyName || undefined}
                  variant="outline"
                  size="sm"
                />
                <Badge variant={job.status === "active" ? "default" : "secondary"}>
                  {job.status}
                </Badge>
              </div>
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

            {/* Job Performance Analytics (only for recruiters) */}
            {isRecruiterView && analytics && (
              <div className="border-t border-gray-200 py-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Job Performance Analytics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <p className="text-xs text-gray-600">Total Views</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{analytics.viewCount}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <p className="text-xs text-gray-600">Applications</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{analytics.applicationCount}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <p className="text-xs text-gray-600">Conversion Rate</p>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{analytics.conversionRate}%</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      <p className="text-xs text-gray-600">Time to Fill</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {analytics.timeToFill ? `${analytics.timeToFill} days` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Application Stats Bar (only for recruiters) */}
            {isRecruiterView && stats && (
              <div className="border-b border-gray-200 py-4">
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
