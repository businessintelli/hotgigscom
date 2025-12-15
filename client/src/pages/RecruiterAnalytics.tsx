import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, Users, Clock, Target, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function RecruiterAnalytics() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90" | "365">("30");
  
  const { data: analytics, isLoading } = trpc.recruiter.getAnalytics.useQuery({
    days: parseInt(timeRange),
  });

  const handleExportCSV = () => {
    if (!analytics) return;

    // Create CSV content
    const csvRows = [
      ["Metric", "Value"],
      ["Total Jobs Posted", analytics.totalJobs],
      ["Active Jobs", analytics.activeJobs],
      ["Total Applications", analytics.totalApplications],
      ["Average Applications per Job", analytics.avgApplicationsPerJob.toFixed(2)],
      ["Application Conversion Rate", `${analytics.conversionRate.toFixed(2)}%`],
      ["Total Interviews", analytics.totalInterviews],
      ["Interview Completion Rate", `${analytics.interviewCompletionRate.toFixed(2)}%`],
      ["Average Time to Hire (days)", analytics.avgTimeToHire.toFixed(1)],
      ["Fastest Hire (days)", analytics.fastestHire],
      ["Slowest Hire (days)", analytics.slowestHire],
      [""],
      ["Top Performing Jobs", "Applications"],
      ...analytics.topJobs.map(job => [job.title, job.applicationCount]),
      [""],
      ["Application Status Distribution", "Count"],
      ...Object.entries(analytics.applicationsByStatus).map(([status, count]) => [status, count]),
    ];

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `recruiter-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Analytics data exported to CSV successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">No analytics data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <Button 
        onClick={() => setLocation('/recruiter/dashboard')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruiter Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive recruitment metrics and insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalJobs}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.activeJobs} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.avgApplicationsPerJob.toFixed(1)} avg per job
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Job views to applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgTimeToHire.toFixed(0)} days</div>
            <p className="text-xs text-muted-foreground">
              Fastest: {analytics.fastestHire}d, Slowest: {analytics.slowestHire}d
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interview Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Interview Performance</CardTitle>
            <CardDescription>Interview scheduling and completion metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total Interviews</span>
              <span className="text-2xl font-bold">{analytics.totalInterviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Completion Rate</span>
              <span className="text-2xl font-bold">{analytics.interviewCompletionRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="text-sm">{analytics.completedInterviews}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Scheduled</span>
              <span className="text-sm">{analytics.scheduledInterviews}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
            <CardDescription>Distribution of application statuses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(analytics.applicationsByStatus).map(([status, count]: [string, any]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${((count as number) / analytics.totalApplications) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Jobs</CardTitle>
          <CardDescription>Jobs with the most applications in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topJobs.map((job, index) => (
              <div key={job.id} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{job.title}</div>
                  <div className="text-sm text-muted-foreground">{job.location}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{job.applicationCount}</div>
                  <div className="text-xs text-muted-foreground">applications</div>
                </div>
              </div>
            ))}
            {analytics.topJobs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No job data available for this period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Candidate Source Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Source Tracking</CardTitle>
          <CardDescription>Where your applicants are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.candidateSources.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{source.source}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(source.count / analytics.totalApplications) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold w-16 text-right">
                    {source.count} ({((source.count / analytics.totalApplications) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            {analytics.candidateSources.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No source data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
