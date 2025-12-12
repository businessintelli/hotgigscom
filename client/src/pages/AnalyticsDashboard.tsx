import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Clock, Mail, Target, Download, Calendar } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch all analytics data
  const { data: funnelData, isLoading: funnelLoading } = trpc.analytics.getFunnelMetrics.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });

  const { data: timeToHireData, isLoading: timeLoading } = trpc.analytics.getTimeToHireMetrics.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });

  const { data: interviewData, isLoading: interviewLoading } = trpc.analytics.getInterviewMetrics.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });

  const { data: emailData, isLoading: emailLoading } = trpc.analytics.getEmailMetrics.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });

  const { data: aiMatchingData, isLoading: aiLoading } = trpc.analytics.getAIMatchingMetrics.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined
  });

  const { data: topJobsData, isLoading: topJobsLoading } = trpc.analytics.getTopJobs.useQuery({
    limit: 10
  });

  const isLoading = funnelLoading || timeLoading || interviewLoading || emailLoading || aiLoading || topJobsLoading;

  // Prepare funnel chart data
  const funnelChartData = funnelData ? [
    { name: 'Submitted', value: funnelData.metrics.submitted, fill: COLORS[0] },
    { name: 'Reviewing', value: funnelData.metrics.reviewing, fill: COLORS[1] },
    { name: 'Shortlisted', value: funnelData.metrics.shortlisted, fill: COLORS[2] },
    { name: 'Interviewing', value: funnelData.metrics.interviewing, fill: COLORS[3] },
    { name: 'Offered', value: funnelData.metrics.offered, fill: COLORS[4] },
  ] : [];

  // Prepare interview status pie chart
  const interviewChartData = interviewData ? [
    { name: 'Completed', value: interviewData.metrics.completed },
    { name: 'Scheduled', value: interviewData.metrics.scheduled },
    { name: 'Cancelled', value: interviewData.metrics.cancelled },
    { name: 'No Show', value: interviewData.metrics.noShow },
  ] : [];

  // Prepare AI matching chart
  const aiMatchingChartData = aiMatchingData ? [
    { name: 'Offered', score: aiMatchingData.averageScores.offered },
    { name: 'In Progress', score: aiMatchingData.averageScores.inProgress },
    { name: 'Rejected', score: aiMatchingData.averageScores.rejected },
  ] : [];

  const handleExportCSV = () => {
    if (!funnelData || !timeToHireData || !interviewData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Applications', funnelData.total],
      ['Submitted', funnelData.metrics.submitted],
      ['Reviewing', funnelData.metrics.reviewing],
      ['Shortlisted', funnelData.metrics.shortlisted],
      ['Interviewing', funnelData.metrics.interviewing],
      ['Offered', funnelData.metrics.offered],
      ['Overall Conversion Rate', `${funnelData.conversionRates.overallConversion.toFixed(2)}%`],
      ['Average Time to Hire', `${timeToHireData.average} days`],
      ['Median Time to Hire', `${timeToHireData.median} days`],
      ['Interview Completion Rate', `${interviewData.completionRate.toFixed(2)}%`],
      ['Interview No-Show Rate', `${interviewData.noShowRate.toFixed(2)}%`],
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive hiring metrics and insights</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{funnelData?.total || 0}</div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {funnelData?.conversionRates.overallConversion.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Time to Hire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{timeToHireData?.average || 0}</div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">days (median: {timeToHireData?.median || 0})</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Interview Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{interviewData?.completionRate.toFixed(0) || 0}%</div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {interviewData?.metrics.noShow || 0} no-shows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Email Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{emailData?.rates.openRate.toFixed(0) || 0}%</div>
              <Mail className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {emailData?.rates.clickRate.toFixed(1) || 0}% click rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Application Funnel</CardTitle>
          <CardDescription>Candidate journey through the hiring process</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6">
                {funnelChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Submitted → Reviewing</p>
              <p className="font-bold">{funnelData?.conversionRates.submittedToReviewing.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-600">Reviewing → Shortlisted</p>
              <p className="font-bold">{funnelData?.conversionRates.reviewingToShortlisted.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-600">Shortlisted → Interviewing</p>
              <p className="font-bold">{funnelData?.conversionRates.shortlistedToInterviewing.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-gray-600">Interviewing → Offered</p>
              <p className="font-bold">{funnelData?.conversionRates.interviewingToOffered.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Status & AI Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Interview Status</CardTitle>
            <CardDescription>Distribution of interview outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={interviewChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {interviewChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Matching Accuracy</CardTitle>
            <CardDescription>Average AI scores by application outcome</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={aiMatchingChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm">
              <p className="text-gray-600">
                Prediction Accuracy: <span className="font-bold">{aiMatchingData?.accuracy}%</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {aiMatchingData?.highScoreApplications} applications with AI score ≥ 80
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Jobs</CardTitle>
          <CardDescription>Jobs with the most applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topJobsData?.map((job, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold">{job.jobTitle || 'Unknown Job'}</p>
                  <p className="text-sm text-gray-600">
                    {job.totalApplications} applications • {job.offeredCount} offers • Avg AI Score: {job.avgAIScore}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">#{index + 1}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Campaign Performance */}
      {emailData && emailData.totals.sent > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email Campaign Performance</CardTitle>
            <CardDescription>Aggregate metrics across all campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{emailData.totals.sent}</p>
                <p className="text-sm text-gray-600">Sent</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{emailData.rates.openRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Open Rate</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{emailData.rates.clickRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Click Rate</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{emailData.rates.bounceRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
