import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Building2,
  UserCheck,
  Clock,
  Target,
  Mail,
  Video,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminReports() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  
  // Fetch platform stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.admin.getPlatformStats.useQuery();
  
  // Calculate percentage changes
  const formatChange = (value: number) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {isPositive ? '+' : ''}{value}%
      </span>
    );
  };

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Platform Reports
            </h1>
            <p className="text-gray-500 mt-1">
              Comprehensive analytics across all recruiters and candidates
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetchStats()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
            <TabsTrigger value="jobs">Jobs & Applications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Users</p>
                      <p className="text-3xl font-bold text-blue-900">{stats?.totalUsers?.toLocaleString() || 0}</p>
                      {formatChange(stats?.userGrowth || 0)}
                    </div>
                    <div className="h-14 w-14 bg-blue-200 rounded-full flex items-center justify-center">
                      <Users className="h-7 w-7 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Active Jobs</p>
                      <p className="text-3xl font-bold text-green-900">{stats?.activeJobs?.toLocaleString() || 0}</p>
                      {formatChange(stats?.jobGrowth || 0)}
                    </div>
                    <div className="h-14 w-14 bg-green-200 rounded-full flex items-center justify-center">
                      <Briefcase className="h-7 w-7 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Applications</p>
                      <p className="text-3xl font-bold text-purple-900">{stats?.totalApplications?.toLocaleString() || 0}</p>
                      {formatChange(stats?.applicationGrowth || 0)}
                    </div>
                    <div className="h-14 w-14 bg-purple-200 rounded-full flex items-center justify-center">
                      <FileText className="h-7 w-7 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Interviews</p>
                      <p className="text-3xl font-bold text-orange-900">{stats?.totalInterviews?.toLocaleString() || 0}</p>
                      {formatChange(stats?.interviewGrowth || 0)}
                    </div>
                    <div className="h-14 w-14 bg-orange-200 rounded-full flex items-center justify-center">
                      <Video className="h-7 w-7 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">User Distribution</CardTitle>
                  <CardDescription>Breakdown by user type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Recruiters</p>
                          <p className="text-sm text-gray-500">Active hiring managers</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{stats?.recruiterCount || 0}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Candidates</p>
                          <p className="text-sm text-gray-500">Job seekers</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{stats?.candidateCount || 0}</p>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium">Admins</p>
                          <p className="text-sm text-gray-500">Platform administrators</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-amber-600">{stats?.adminCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Pipeline</CardTitle>
                  <CardDescription>Current application status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">Pending Review</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {stats?.pendingApplications || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Under Review</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {stats?.reviewedApplications || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Accepted</span>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {stats?.acceptedApplications || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Rejected</span>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {stats?.rejectedApplications || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Statistics</CardTitle>
                <CardDescription>Platform-wide interview metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{stats?.scheduledInterviews || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Scheduled</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{stats?.completedInterviews || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{stats?.cancelledInterviews || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Cancelled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruiters Tab */}
          <TabsContent value="recruiters" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Recruiters</p>
                      <p className="text-2xl font-bold">{stats?.recruiterCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jobs Posted</p>
                      <p className="text-2xl font-bold">{stats?.activeJobs || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email Campaigns</p>
                      <p className="text-2xl font-bold">-</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recruiter Activity Summary</CardTitle>
                <CardDescription>Aggregate metrics across all recruiters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.activeJobs || 0}</p>
                      <p className="text-sm text-gray-500">Active Jobs</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                      <p className="text-sm text-gray-500">Applications Received</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalInterviews || 0}</p>
                      <p className="text-sm text-gray-500">Interviews Scheduled</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.acceptedApplications || 0}</p>
                      <p className="text-sm text-gray-500">Offers Made</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Candidates</p>
                      <p className="text-2xl font-bold">{stats?.candidateCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Applications Submitted</p>
                      <p className="text-2xl font-bold">{stats?.totalApplications || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Offers Received</p>
                      <p className="text-2xl font-bold">{stats?.acceptedApplications || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Candidate Activity Summary</CardTitle>
                <CardDescription>Aggregate metrics across all candidates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.candidateCount || 0}</p>
                      <p className="text-sm text-gray-500">Registered Candidates</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.totalApplications || 0}</p>
                      <p className="text-sm text-gray-500">Total Applications</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.completedInterviews || 0}</p>
                      <p className="text-sm text-gray-500">Interviews Completed</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats?.acceptedApplications || 0}</p>
                      <p className="text-sm text-gray-500">Placements</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs & Applications Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Jobs</p>
                      <p className="text-2xl font-bold">{stats?.activeJobs || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Pending Apps</p>
                      <p className="text-2xl font-bold">{stats?.pendingApplications || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Under Review</p>
                      <p className="text-2xl font-bold">{stats?.reviewedApplications || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Accepted</p>
                      <p className="text-2xl font-bold">{stats?.acceptedApplications || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Application Funnel</CardTitle>
                <CardDescription>Conversion rates through the hiring pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Applications Received</span>
                        <span className="text-sm text-gray-500">{stats?.totalApplications || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Reviewed</span>
                        <span className="text-sm text-gray-500">{stats?.reviewedApplications || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-purple-600 h-3 rounded-full" 
                          style={{ width: `${stats?.totalApplications ? ((stats?.reviewedApplications || 0) / stats.totalApplications * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Interviewed</span>
                        <span className="text-sm text-gray-500">{stats?.completedInterviews || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-orange-600 h-3 rounded-full" 
                          style={{ width: `${stats?.totalApplications ? ((stats?.completedInterviews || 0) / stats.totalApplications * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Offers Made</span>
                        <span className="text-sm text-gray-500">{stats?.acceptedApplications || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full" 
                          style={{ width: `${stats?.totalApplications ? ((stats?.acceptedApplications || 0) / stats.totalApplications * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
