import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  FileText, 
  Video,
  Download,
  Calendar,
  BarChart3,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState<string>("30");
  
  const { data: analytics, isLoading } = trpc.admin.getAnalytics.useQuery({
    days: parseInt(timeRange),
  });

  const handleExportReport = () => {
    // In production, this would generate and download a CSV/PDF report
    toast.success("Report export started");
  };

  if (isLoading) {
    return (
      <AdminLayout title="Analytics">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">
      <Button 
        onClick={() => setLocation('/admin/dashboard')}
        variant="ghost"
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            Usage Analytics & Reporting
          </h1>
          <p className="text-gray-600 mt-1">Platform performance and growth metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">User Growth</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.userGrowth?.total || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-4 h-4 ${(analytics?.userGrowth?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              <span className={`text-sm font-medium ${(analytics?.userGrowth?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(analytics?.userGrowth?.change || 0) >= 0 ? '+' : ''}{analytics?.userGrowth?.change || 0}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Job Postings</CardTitle>
            <Briefcase className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.jobPostings?.total || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-4 h-4 ${(analytics?.jobPostings?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              <span className={`text-sm font-medium ${(analytics?.jobPostings?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(analytics?.jobPostings?.change || 0) >= 0 ? '+' : ''}{analytics?.jobPostings?.change || 0}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Applications</CardTitle>
            <FileText className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.applications?.total || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-4 h-4 ${(analytics?.applications?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              <span className={`text-sm font-medium ${(analytics?.applications?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(analytics?.applications?.change || 0) >= 0 ? '+' : ''}{analytics?.applications?.change || 0}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
            <Video className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.interviews?.total || 0}</div>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className={`w-4 h-4 ${(analytics?.interviews?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} />
              <span className={`text-sm font-medium ${(analytics?.interviews?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(analytics?.interviews?.change || 0) >= 0 ? '+' : ''}{analytics?.interviews?.change || 0}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {analytics?.conversionRates?.applicationRate || 0}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Jobs viewed → Applications submitted
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Job Views</span>
                <span className="font-semibold">{analytics?.conversionRates?.jobViews || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Applications</span>
                <span className="font-semibold">{analytics?.conversionRates?.applications || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {analytics?.conversionRates?.interviewCompletionRate || 0}%
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Interviews scheduled → Completed
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Scheduled</span>
                <span className="font-semibold">{analytics?.conversionRates?.scheduledInterviews || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed</span>
                <span className="font-semibold">{analytics?.conversionRates?.completedInterviews || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Time to Hire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600">
              {analytics?.timeToHire?.average || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">days</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fastest</span>
                <span className="font-semibold">{analytics?.timeToHire?.fastest || 0} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Slowest</span>
                <span className="font-semibold">{analytics?.timeToHire?.slowest || 0} days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Candidates</span>
                  <span className="text-sm font-semibold">{analytics?.userDistribution?.candidates || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(analytics?.userDistribution?.candidates || 0) / (analytics?.userDistribution?.total || 1) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Recruiters</span>
                  <span className="text-sm font-semibold">{analytics?.userDistribution?.recruiters || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(analytics?.userDistribution?.recruiters || 0) / (analytics?.userDistribution?.total || 1) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Admins</span>
                  <span className="text-sm font-semibold">{analytics?.userDistribution?.admins || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${(analytics?.userDistribution?.admins || 0) / (analytics?.userDistribution?.total || 1) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.topJobs && analytics.topJobs.length > 0 ? (
                analytics.topJobs.map((job: any, index: number) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.applications} applications</p>
                    </div>
                    <Badge variant="secondary">{job.conversionRate}%</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics?.trends?.dailySignups || 0}</div>
              <p className="text-sm text-gray-600 mt-1">Daily Signups</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics?.trends?.dailyJobPosts || 0}</div>
              <p className="text-sm text-gray-600 mt-1">Daily Job Posts</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{analytics?.trends?.dailyApplications || 0}</div>
              <p className="text-sm text-gray-600 mt-1">Daily Applications</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{analytics?.trends?.dailyInterviews || 0}</div>
              <p className="text-sm text-gray-600 mt-1">Daily Interviews</p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "secondary" }) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = variant === "secondary" 
    ? "bg-gray-100 text-gray-800" 
    : "bg-blue-100 text-blue-800";
  
  return <span className={`${baseClasses} ${variantClasses}`}>{children}</span>;
}
