import { useAuth } from "@/_core/hooks/useAuth";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Download, TrendingUp, TrendingDown, Users, Clock, CheckCircle, XCircle, BarChart3, Brain, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function BotInterviewAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("30");
  const [selectedJobId, setSelectedJobId] = useState<string>("all");

  // Fetch recruiter profile
  const { data: recruiter } = trpc.recruiter.getProfile.useQuery(
    undefined,
    { enabled: !!user?.id }
  );

  // Fetch jobs for filter
  const { data: jobs = [] } = trpc.job.list.useQuery(undefined, {
    enabled: !!recruiter?.id,
  });

  // Fetch analytics data
  const { data: analytics, isLoading } = trpc.botInterview.getAnalytics.useQuery(
    {
      dateRange: parseInt(dateRange),
      jobId: selectedJobId === "all" ? undefined : parseInt(selectedJobId),
    },
    { enabled: !!recruiter?.id }
  );

  const handleExport = () => {
    if (!analytics) return;

    const csvData = [
      ["Bot Interview Analytics Report"],
      ["Date Range", `Last ${dateRange} days`],
      [""],
      ["Metric", "Value"],
      ["Total Interviews", analytics.totalInterviews],
      ["Completed Interviews", analytics.completedInterviews],
      ["In Progress", analytics.inProgressInterviews],
      ["Not Started", analytics.notStartedInterviews],
      ["Completion Rate", `${analytics.completionRate}%`],
      ["Average Overall Score", analytics.avgOverallScore?.toFixed(1) || "N/A"],
      ["Average Technical Score", analytics.avgTechnicalScore?.toFixed(1) || "N/A"],
      ["Average Behavioral Score", analytics.avgBehavioralScore?.toFixed(1) || "N/A"],
      ["Average Communication Score", analytics.avgCommunicationScore?.toFixed(1) || "N/A"],
      ["Average Time to Complete", `${analytics.avgTimeToComplete} minutes`],
      [""],
      ["Hiring Recommendations"],
      ["Strong Yes", analytics.recommendations?.strongYes || 0],
      ["Yes", analytics.recommendations?.yes || 0],
      ["Maybe", analytics.recommendations?.maybe || 0],
      ["No", analytics.recommendations?.no || 0],
      ["Strong No", analytics.recommendations?.strongNo || 0],
    ];

    const csv = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bot-interview-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Analytics exported successfully");
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bot Interview Analytics</h1>
            <p className="text-gray-500 mt-1">AI-powered interview performance metrics and insights</p>
          </div>
          <Button onClick={handleExport} disabled={!analytics}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Interviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{analytics.totalInterviews}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {analytics.completedInterviews} completed
                      </p>
                    </div>
                    <Users className="h-10 w-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{analytics.completionRate}%</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {analytics.inProgressInterviews} in progress
                      </p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg Overall Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">
                        {analytics.avgOverallScore ? analytics.avgOverallScore.toFixed(1) : "N/A"}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">Out of 100</p>
                    </div>
                    <Target className="h-10 w-10 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg Time to Complete</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold">{analytics.avgTimeToComplete}</p>
                      <p className="text-sm text-gray-500 mt-1">minutes</p>
                    </div>
                    <Clock className="h-10 w-10 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Average Scores by Category</CardTitle>
                  <CardDescription>Performance across different evaluation criteria</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Technical Skills</span>
                      <span className="text-sm font-bold">
                        {analytics.avgTechnicalScore ? analytics.avgTechnicalScore.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${analytics.avgTechnicalScore || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Behavioral</span>
                      <span className="text-sm font-bold">
                        {analytics.avgBehavioralScore ? analytics.avgBehavioralScore.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${analytics.avgBehavioralScore || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Communication</span>
                      <span className="text-sm font-bold">
                        {analytics.avgCommunicationScore ? analytics.avgCommunicationScore.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${analytics.avgCommunicationScore || 0}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Problem Solving</span>
                      <span className="text-sm font-bold">
                        {analytics.avgProblemSolvingScore ? analytics.avgProblemSolvingScore.toFixed(1) : "N/A"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${analytics.avgProblemSolvingScore || 0}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hiring Recommendations</CardTitle>
                  <CardDescription>AI-generated hiring recommendations distribution</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                        {analytics.recommendations?.strongYes || 0}
                      </div>
                      <div>
                        <p className="font-semibold">Strong Yes</p>
                        <p className="text-sm text-gray-500">Highly recommended</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      {analytics.totalInterviews > 0
                        ? Math.round(((analytics.recommendations?.strongYes || 0) / analytics.totalInterviews) * 100)
                        : 0}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {analytics.recommendations?.yes || 0}
                      </div>
                      <div>
                        <p className="font-semibold">Yes</p>
                        <p className="text-sm text-gray-500">Recommended</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-blue-600">
                      {analytics.totalInterviews > 0
                        ? Math.round(((analytics.recommendations?.yes || 0) / analytics.totalInterviews) * 100)
                        : 0}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-600 flex items-center justify-center text-white font-bold">
                        {analytics.recommendations?.maybe || 0}
                      </div>
                      <div>
                        <p className="font-semibold">Maybe</p>
                        <p className="text-sm text-gray-500">Needs review</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-yellow-600">
                      {analytics.totalInterviews > 0
                        ? Math.round(((analytics.recommendations?.maybe || 0) / analytics.totalInterviews) * 100)
                        : 0}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                        {(analytics.recommendations?.no || 0) + (analytics.recommendations?.strongNo || 0)}
                      </div>
                      <div>
                        <p className="font-semibold">No / Strong No</p>
                        <p className="text-sm text-gray-500">Not recommended</p>
                      </div>
                    </div>
                    <Badge variant="destructive">
                      {analytics.totalInterviews > 0
                        ? Math.round((((analytics.recommendations?.no || 0) + (analytics.recommendations?.strongNo || 0)) / analytics.totalInterviews) * 100)
                        : 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Interview Status Distribution</CardTitle>
                <CardDescription>Current status of all bot interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{analytics.completedInterviews}</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{analytics.inProgressInterviews}</p>
                      <p className="text-sm text-gray-500">In Progress</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{analytics.notStartedInterviews}</p>
                      <p className="text-sm text-gray-500">Not Started</p>
                    </div>
                    <XCircle className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Jobs */}
            {analytics.topPerformingJobs && analytics.topPerformingJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Jobs</CardTitle>
                  <CardDescription>Jobs with highest average interview scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topPerformingJobs.map((job: any, index: number) => (
                      <div key={job.jobId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{job.jobTitle}</p>
                            <p className="text-sm text-gray-500">{job.interviewCount} interviews</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{job.avgScore.toFixed(1)}</p>
                          <p className="text-sm text-gray-500">Avg Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!analytics && !isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No interview data available for the selected period</p>
            </CardContent>
          </Card>
        )}
      </div>
    </RecruiterLayout>
  );
}
