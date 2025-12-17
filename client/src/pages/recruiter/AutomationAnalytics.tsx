import { useState } from "react";
import RecruiterLayout from "@/components/RecruiterLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Download, TrendingUp, TrendingDown, Minus, Target, Mail, Calendar, Brain } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AutomationAnalytics() {
  const [dateRange, setDateRange] = useState("30");
  
  // Fetch automation analytics data
  const { data: analytics, isLoading } = trpc.recruiter.getAutomationAnalytics.useQuery({
    days: parseInt(dateRange)
  });

  if (isLoading) {
    return (
      <RecruiterLayout title="Automation Analytics">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  const handleExport = () => {
    if (!analytics) return;
    
    const csvContent = [
      ["Metric", "Value"],
      ["Total Candidates Sourced", analytics.sourcing.totalCandidates],
      ["Cost Per Candidate", `$${analytics.sourcing.costPerCandidate}`],
      ["Sourcing Conversion Rate", `${analytics.sourcing.conversionRate}%`],
      ["Email Campaigns Sent", analytics.email.totalCampaigns],
      ["Total Recipients", analytics.email.totalRecipients],
      ["Open Rate", `${analytics.email.openRate}%`],
      ["Reply Rate", `${analytics.email.replyRate}%`],
      ["Click Rate", `${analytics.email.clickRate}%`],
      ["Auto-Scheduled Interviews", analytics.autoScheduling.totalScheduled],
      ["Interviews Completed", analytics.autoScheduling.completed],
      ["Attendance Rate", `${analytics.autoScheduling.attendanceRate}%`],
      ["Prediction Accuracy", `${analytics.predictions.accuracy}%`],
      ["Total Predictions", analytics.predictions.totalPredictions]
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `automation-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <RecruiterLayout title="Automation Analytics">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automation Analytics</h1>
            <p className="text-gray-500 mt-1">Track the performance of your AI-powered recruitment automation</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Candidates Sourced</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.sourcing.totalCandidates || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                ${analytics?.sourcing.costPerCandidate || 0} per candidate
              </p>
              <div className="flex items-center mt-2 text-xs">
                {analytics?.sourcing.trend === "up" ? (
                  <><TrendingUp className="w-3 h-3 text-green-600 mr-1" /> <span className="text-green-600">+{analytics?.sourcing.trendPercent}%</span></>
                ) : analytics?.sourcing.trend === "down" ? (
                  <><TrendingDown className="w-3 h-3 text-red-600 mr-1" /> <span className="text-red-600">-{analytics?.sourcing.trendPercent}%</span></>
                ) : (
                  <><Minus className="w-3 h-3 text-gray-400 mr-1" /> <span className="text-gray-400">No change</span></>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Campaign Performance</CardTitle>
              <Mail className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.email.openRate || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">
                Open rate • {analytics?.email.totalRecipients || 0} recipients
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-gray-600">Reply: {analytics?.email.replyRate || 0}%</span>
                <span className="text-gray-600">Click: {analytics?.email.clickRate || 0}%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Auto-Scheduled Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.autoScheduling.totalScheduled || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.autoScheduling.attendanceRate || 0}% attendance rate
              </p>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-gray-600">{analytics?.autoScheduling.completed || 0} completed</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
              <Brain className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.predictions.accuracy || 0}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {analytics?.predictions.totalPredictions || 0} predictions made
              </p>
              <div className="flex items-center mt-2 text-xs">
                {analytics?.predictions.improving ? (
                  <><TrendingUp className="w-3 h-3 text-green-600 mr-1" /> <span className="text-green-600">Improving</span></>
                ) : (
                  <><Minus className="w-3 h-3 text-gray-400 mr-1" /> <span className="text-gray-400">Stable</span></>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sourcing Campaign ROI */}
          <Card>
            <CardHeader>
              <CardTitle>Sourcing Campaign ROI</CardTitle>
              <CardDescription>Conversion rate from sourced to hired</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics?.sourcing.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="sourced" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Sourced" />
                  <Area type="monotone" dataKey="applied" stackId="1" stroke="#10b981" fill="#10b981" name="Applied" />
                  <Area type="monotone" dataKey="hired" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Hired" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Email Campaign Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Email Campaign Metrics</CardTitle>
              <CardDescription>Engagement rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.email.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="openRate" stroke="#3b82f6" name="Open Rate %" />
                  <Line type="monotone" dataKey="clickRate" stroke="#10b981" name="Click Rate %" />
                  <Line type="monotone" dataKey="replyRate" stroke="#f59e0b" name="Reply Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auto-Scheduling Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Auto-Scheduling Performance</CardTitle>
              <CardDescription>Interview booking and attendance trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.autoScheduling.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="noShow" fill="#ef4444" name="No Show" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Prediction Accuracy Trends */}
          <Card>
            <CardHeader>
              <CardTitle>AI Prediction Accuracy</CardTitle>
              <CardDescription>Model performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.predictions.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2} name="Accuracy %" />
                  <Line type="monotone" dataKey="precision" stroke="#3b82f6" name="Precision %" />
                  <Line type="monotone" dataKey="recall" stroke="#10b981" name="Recall %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sourcing Channel Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sourcing Channel Distribution</CardTitle>
            <CardDescription>Where your best candidates come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.sourcing.channelBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(analytics?.sourcing.channelBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-4">
                {(analytics?.sourcing.channelBreakdown || []).map((channel, index) => (
                  <div key={channel.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{channel.value}</div>
                      <div className="text-xs text-gray-500">${channel.costPerHire} per hire</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Key Insights & Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions to improve your automation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics?.insights || []).map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    insight.type === 'success' ? 'bg-green-100' :
                    insight.type === 'warning' ? 'bg-amber-100' :
                    'bg-blue-100'
                  }`}>
                    {insight.type === 'success' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                     insight.type === 'warning' ? <TrendingDown className="w-4 h-4 text-amber-600" /> :
                     <Brain className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                    {insight.action && (
                      <Button variant="link" className="px-0 mt-2 h-auto">
                        {insight.action} →
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </RecruiterLayout>
  );
}
