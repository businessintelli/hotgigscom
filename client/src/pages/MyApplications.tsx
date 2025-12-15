import { useAuth } from "@/_core/hooks/useAuth";
import CandidateLayout from "@/components/CandidateLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Briefcase, Calendar, Clock, FileText, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

const statusColors = {
  submitted: "bg-blue-100 text-blue-700",
  reviewing: "bg-yellow-100 text-yellow-700",
  shortlisted: "bg-green-100 text-green-700",
  interviewing: "bg-purple-100 text-purple-700",
  offered: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

export default function MyApplications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Get candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Get applications with job details
  const { data: applications, isLoading } = trpc.application.getCandidateApplications.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  if (isLoading) {
    return (
      <CandidateLayout title="My Applications">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your applications...</p>
          </div>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout title="My Applications">
      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-gray-600">
            Track the status of your job applications and upcoming interviews
          </p>
        </div>

        {!applications || applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
              <p className="text-gray-600 mb-6">
                Start applying to jobs to see your applications here
              </p>
              <Button onClick={() => setLocation("/jobs")}>
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {applications.map((app: any) => (
              <Card key={app.id} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{app.job?.title}</CardTitle>
                      <CardDescription className="text-base">
                        {app.job?.companyName || 'Company Not Specified'}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[app.status as keyof typeof statusColors]}>
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Application Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Application Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Submitted:</span>
                            <span className="font-medium">
                              {new Date(app.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-medium">
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {app.aiScore && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">AI Match Score:</span>
                              <span className="font-medium text-green-600">{app.aiScore}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {app.coverLetter && (
                        <div>
                          <h4 className="font-semibold mb-2">Cover Letter</h4>
                          <p className="text-sm text-gray-700 line-clamp-3">{app.coverLetter}</p>
                        </div>
                      )}
                    </div>

                    {/* Interview & Feedback */}
                    <div className="space-y-4">
                      {app.interviews && app.interviews.length > 0 ? (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Interviews
                          </h4>
                          <div className="space-y-3">
                            {app.interviews.map((interview: any) => (
                              <div
                                key={interview.id}
                                className="p-3 bg-gray-50 rounded-lg border"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-sm capitalize">
                                    {interview.type} Interview
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {interview.status}
                                  </Badge>
                                </div>
                                {interview.scheduledAt && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-3 h-3" />
                                    {new Date(interview.scheduledAt).toLocaleString()}
                                  </div>
                                )}
                                {interview.overallScore && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-gray-600">Score: </span>
                                    <span className="font-medium">{interview.overallScore}%</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No interviews scheduled yet</p>
                        </div>
                      )}

                      {app.notes && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Recruiter Notes
                          </h4>
                          <p className="text-sm text-gray-700 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            {app.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setLocation(`/jobs/${app.job?.id}`)}
                    >
                      View Job Details
                    </Button>
                    {app.status === "submitted" && (
                      <Button variant="outline" className="text-red-600 hover:text-red-700">
                        Withdraw Application
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CandidateLayout>
  );
}
