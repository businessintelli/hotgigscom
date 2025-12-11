import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Briefcase, MapPin, DollarSign, Clock, Building2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const jobId = parseInt(params?.id || "0");

  const { data: job, isLoading } = trpc.job.getById.useQuery(
    { id: jobId },
    { enabled: !!jobId }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/jobs")}
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
              <Button
                size="lg"
                className="w-full md:w-auto"
                onClick={() => setLocation(`/apply/${job.id}`)}
              >
                Apply for this Position
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
