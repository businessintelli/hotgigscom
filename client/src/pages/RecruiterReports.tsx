import { useState } from "react";
import { trpc } from "@/lib/trpc";
import RecruiterLayout from "@/components/RecruiterLayout";
import { ReportLoadingSkeleton } from "@/components/ReportLoadingSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#22c55e', '#ef4444', '#6b7280'];

// Export helper function
const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

type Period = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'ytd' | 'custom';

export default function RecruiterReports() {
  const [period, setPeriod] = useState<Period>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Queries
  const dashboardQuery = trpc.reports.getDashboardSummary.useQuery({ period });
  const submissionsQuery = trpc.reports.getSubmissionsReport.useQuery({ 
    period, 
    customStart: period === 'custom' ? customStart : undefined,
    customEnd: period === 'custom' ? customEnd : undefined
  });
  const placementsQuery = trpc.reports.getPlacementsReport.useQuery({ 
    period,
    customStart: period === 'custom' ? customStart : undefined,
    customEnd: period === 'custom' ? customEnd : undefined
  });
  const pipelineQuery = trpc.reports.getPipelineReport.useQuery({ 
    period,
    customStart: period === 'custom' ? customStart : undefined,
    customEnd: period === 'custom' ? customEnd : undefined
  });
  const timeToHireQuery = trpc.reports.getTimeToHireReport.useQuery({ 
    period,
    customStart: period === 'custom' ? customStart : undefined,
    customEnd: period === 'custom' ? customEnd : undefined
  });
  const jobPerformanceQuery = trpc.reports.getJobPerformanceReport.useQuery({ 
    period,
    customStart: period === 'custom' ? customStart : undefined,
    customEnd: period === 'custom' ? customEnd : undefined
  });

  const isLoading = dashboardQuery.isLoading || submissionsQuery.isLoading;

  const refetchAll = () => {
    dashboardQuery.refetch();
    submissionsQuery.refetch();
    placementsQuery.refetch();
    pipelineQuery.refetch();
    timeToHireQuery.refetch();
    jobPerformanceQuery.refetch();
  };

  const formatPeriodLabel = (p: Period) => {
    const labels: Record<Period, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'Last 7 Days',
      month: 'Last 30 Days',
      quarter: 'Last 90 Days',
      ytd: 'Year to Date',
      custom: 'Custom Range'
    };
    return labels[p];
  };

  const renderChangeIndicator = (change: number) => {
    if (change === 0) return null;
    const isPositive = change > 0;
    return (
      <span className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(change)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <RecruiterLayout title="Reports">
        <ReportLoadingSkeleton />
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout title="Reports">
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Recruitment Reports
          </h1>
          <p className="text-gray-500 mt-1">
            Track your recruitment performance and metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => {
              const reportData = {
                submissions: submissionsQuery.data,
                placements: placementsQuery.data,
                pipeline: pipelineQuery.data,
                timeToHire: timeToHireQuery.data,
                jobPerformance: jobPerformanceQuery.data
              };
              const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `recruitment_report_${period}_${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="icon" onClick={refetchAll}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Custom Date Range */}
      {period === 'custom' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
              <Button onClick={refetchAll}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Submissions</p>
                <p className="text-2xl font-bold">{dashboardQuery.data?.submissions.current || 0}</p>
                {renderChangeIndicator(dashboardQuery.data?.submissions.change || 0)}
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Offers Made</p>
                <p className="text-2xl font-bold">{dashboardQuery.data?.offers.current || 0}</p>
                {renderChangeIndicator(dashboardQuery.data?.offers.change || 0)}
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Interviews</p>
                <p className="text-2xl font-bold">{dashboardQuery.data?.interviews.current || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-2xl font-bold">{dashboardQuery.data?.activeJobs.current || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="time-to-hire">Time to Hire</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Submissions Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                  Submissions Trend
                </CardTitle>
                <CardDescription>Daily application submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {submissionsQuery.isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={submissionsQuery.data?.trend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pipeline Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Pipeline Distribution
                </CardTitle>
                <CardDescription>Candidates by stage</CardDescription>
              </CardHeader>
              <CardContent>
                {pipelineQuery.isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={pipelineQuery.data?.stages.filter(s => s.count > 0) || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="label"
                      >
                        {(pipelineQuery.data?.stages || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Job Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-600" />
                Job Performance
              </CardTitle>
              <CardDescription>Applications and offers by job</CardDescription>
            </CardHeader>
            <CardContent>
              {jobPerformanceQuery.isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={jobPerformanceQuery.data?.jobs.slice(0, 10) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="applications" name="Applications" fill="#6366f1" />
                    <Bar dataKey="offers" name="Offers" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Submissions</p>
                  <p className="text-4xl font-bold text-indigo-600">{submissionsQuery.data?.summary.total || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Under Review</p>
                  <p className="text-4xl font-bold text-yellow-600">
                    {(submissionsQuery.data?.summary.byStatus?.reviewing || 0) + 
                     (submissionsQuery.data?.summary.byStatus?.submitted || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Shortlisted</p>
                  <p className="text-4xl font-bold text-green-600">
                    {submissionsQuery.data?.summary.byStatus?.shortlisted || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Submissions by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(submissionsQuery.data?.summary.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ 
                            width: `${submissionsQuery.data?.summary.total 
                              ? (count / submissionsQuery.data.summary.total) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Jobs by Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissionsQuery.data?.topJobs.map((job, index) => (
                  <div key={job.jobId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <span className="font-medium">{job.title}</span>
                    </div>
                    <Badge>{job.count} submissions</Badge>
                  </div>
                ))}
                {(!submissionsQuery.data?.topJobs || submissionsQuery.data.topJobs.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No submissions data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placements Tab */}
        <TabsContent value="placements" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Offers</p>
                  <p className="text-4xl font-bold text-green-600">{placementsQuery.data?.summary.offers || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Rejections</p>
                  <p className="text-4xl font-bold text-red-600">{placementsQuery.data?.summary.rejections || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Decisions</p>
                  <p className="text-4xl font-bold text-gray-600">{placementsQuery.data?.summary.total || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Offer Rate</p>
                  <p className="text-4xl font-bold text-indigo-600">{placementsQuery.data?.summary.offerRate || 0}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placements Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Placements Trend</CardTitle>
              <CardDescription>Offers vs Rejections over time</CardDescription>
            </CardHeader>
            <CardContent>
              {placementsQuery.isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={placementsQuery.data?.trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="offers" name="Offers" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="rejections" name="Rejections" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Conversion Funnel
              </CardTitle>
              <CardDescription>Candidate progression through stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipelineQuery.data?.stages.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-gray-500">{stage.count} candidates</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div 
                        className="h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-medium"
                        style={{ 
                          width: `${pipelineQuery.data?.total 
                            ? Math.max((stage.count / pipelineQuery.data.total) * 100, 5) 
                            : 5}%`,
                          backgroundColor: stage.color
                        }}
                      >
                        {pipelineQuery.data?.total 
                          ? Math.round((stage.count / pipelineQuery.data.total) * 100) 
                          : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline by Job */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Job</th>
                      <th className="text-center py-2">Submitted</th>
                      <th className="text-center py-2">Reviewing</th>
                      <th className="text-center py-2">Shortlisted</th>
                      <th className="text-center py-2">Interviewing</th>
                      <th className="text-center py-2">Offered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipelineQuery.data?.byJob.map((job) => (
                      <tr key={job.jobId} className="border-b">
                        <td className="py-2 font-medium">{job.title}</td>
                        <td className="text-center">{job.stages.submitted || 0}</td>
                        <td className="text-center">{job.stages.reviewing || 0}</td>
                        <td className="text-center">{job.stages.shortlisted || 0}</td>
                        <td className="text-center">{job.stages.interviewing || 0}</td>
                        <td className="text-center">{job.stages.offered || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!pipelineQuery.data?.byJob || pipelineQuery.data.byJob.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No pipeline data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time to Hire Tab */}
        <TabsContent value="time-to-hire" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Average Days</p>
                  <p className="text-4xl font-bold text-indigo-600">{timeToHireQuery.data?.summary.avgDays || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Fastest Hire</p>
                  <p className="text-4xl font-bold text-green-600">{timeToHireQuery.data?.summary.minDays || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Slowest Hire</p>
                  <p className="text-4xl font-bold text-red-600">{timeToHireQuery.data?.summary.maxDays || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Hires</p>
                  <p className="text-4xl font-bold text-gray-600">{timeToHireQuery.data?.summary.totalHires || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Time to Hire Distribution
              </CardTitle>
              <CardDescription>Number of hires by time range</CardDescription>
            </CardHeader>
            <CardContent>
              {timeToHireQuery.isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeToHireQuery.data?.distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" name="Hires" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* By Job */}
          <Card>
            <CardHeader>
              <CardTitle>Time to Hire by Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeToHireQuery.data?.byJob.map((job) => (
                  <div key={job.jobId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.hires} hires</p>
                    </div>
                    <Badge variant="outline" className="text-lg">
                      {job.avgDays} days avg
                    </Badge>
                  </div>
                ))}
                {(!timeToHireQuery.data?.byJob || timeToHireQuery.data.byJob.length === 0) && (
                  <p className="text-center text-gray-500 py-4">No hire data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </RecruiterLayout>
  );
}
