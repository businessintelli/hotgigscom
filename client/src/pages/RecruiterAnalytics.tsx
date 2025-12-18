import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, Users, Clock, Target, ArrowLeft, Eye, Monitor, Smartphone, Tablet, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function RecruiterAnalytics() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90" | "365">("30");
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  
  const { data: analytics, isLoading } = trpc.recruiter.getAnalytics.useQuery({
    days: parseInt(timeRange),
  });
  
  const { data: myJobs } = trpc.job.getMyJobs.useQuery();
  const { data: topPerformingJobs } = trpc.job.getTopPerformingJobs.useQuery(
    { companyId: user?.companyId || 0, limit: 10 },
    { enabled: !!user?.companyId }
  );
  
  const { data: viewTrends } = trpc.job.getJobViewTrends.useQuery(
    { jobId: selectedJobId || 0, days: parseInt(timeRange) },
    { enabled: !!selectedJobId }
  );
  
  const { data: sourceAttribution } = trpc.job.getSourceAttribution.useQuery(
    { jobId: selectedJobId || 0 },
    { enabled: !!selectedJobId }
  );
  
  const { data: deviceAnalytics } = trpc.job.getDeviceAnalytics.useQuery(
    { jobId: selectedJobId || 0 },
    { enabled: !!selectedJobId }
  );
  
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

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
      
      {/* Job Selector for Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Detailed Job Analytics
          </CardTitle>
          <CardDescription>Select a job to view detailed view tracking and source analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedJobId?.toString() || ""}
            onValueChange={(v) => setSelectedJobId(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a job..." />
            </SelectTrigger>
            <SelectContent>
              {myJobs?.map((job: any) => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  {job.title} - {job.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {selectedJobId && (
        <>
          {/* View Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                View Trends
              </CardTitle>
              <CardDescription>Daily job views over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {viewTrends && viewTrends.length > 0 ? (
                <div className="space-y-2">
                  {viewTrends.map((trend: any) => (
                    <div key={trend.date} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span className="text-sm">{format(new Date(trend.date), "MMM d, yyyy")}</span>
                      <Badge variant="secondary">{trend.views} views</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No view data available for this period
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Source Attribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Traffic Sources
              </CardTitle>
              <CardDescription>Where your job views are coming from</CardDescription>
            </CardHeader>
            <CardContent>
              {sourceAttribution && sourceAttribution.length > 0 ? (
                <div className="space-y-3">
                  {sourceAttribution.map((source: any) => {
                    const total = sourceAttribution.reduce((sum: number, s: any) => sum + parseInt(s.views || 0), 0);
                    const percentage = total > 0 ? ((parseInt(source.views || 0) / total) * 100).toFixed(1) : "0";
                    
                    return (
                      <div key={source.source} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium capitalize">{source.source || "Unknown"}</span>
                          <span className="text-muted-foreground">{source.views} views ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No source data available
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Device Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Device Breakdown
              </CardTitle>
              <CardDescription>Devices used to view your job posting</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceAnalytics && deviceAnalytics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deviceAnalytics.map((device: any) => (
                    <Card key={device.deviceType}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(device.deviceType)}
                            <span className="font-medium capitalize">{device.deviceType || "Unknown"}</span>
                          </div>
                          <Badge variant="secondary">{device.views} views</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No device data available
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
