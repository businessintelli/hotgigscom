import { useState } from 'react';
import { trpc } from '../lib/trpc';
import RecruiterLayout from '@/components/RecruiterLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Clock, Users, Target, Lightbulb } from 'lucide-react';

export default function PredictiveAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('90'); // days

  const endDate = new Date().toISOString();
  const startDate = new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString();

  const { data: hiringTrends, isLoading: trendsLoading } = trpc.analytics.getHiringTrends.useQuery({ startDate, endDate });
  const { data: timeToHire, isLoading: timeLoading } = trpc.analytics.getPredictiveTimeToHire.useQuery({ startDate, endDate });
  const { data: pipelineHealth, isLoading: pipelineLoading } = trpc.analytics.getPipelineHealth.useQuery();
  const { data: successPrediction, isLoading: predictionLoading } = trpc.analytics.getSuccessRatePrediction.useQuery({ historicalMonths: 6 });

  const isLoading = trendsLoading || timeLoading || pipelineLoading || predictionLoading;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'high') return 'destructive';
    if (severity === 'medium') return 'default';
    return 'secondary';
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Predictive Analytics</h1>
          <p className="text-muted-foreground">AI-powered insights and predictions for your recruitment pipeline</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="30">Last 30 days</option>
          <option value="60">Last 60 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
        </select>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hiringTrends?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground">
              {hiringTrends?.totalHires || 0} hires ({hiringTrends?.conversionRate.toFixed(1)}% conversion)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeToHire?.overall.averageDays || 0} days</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(timeToHire?.trend || 'stable')}
              <span className="capitalize">{timeToHire?.trend || 'stable'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Health</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineHealth?.healthScore || 0}%</div>
            <Progress value={pipelineHealth?.healthScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Hires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successPrediction?.predictedHiresNextMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next month ({successPrediction?.confidence || 0}% confidence)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Hiring Trends</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Health</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Hiring Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Applications & Hires Over Time</CardTitle>
                <CardDescription>Monthly breakdown of applications and successful hires</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={hiringTrends?.applicationsByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="applications" stroke="#3b82f6" name="Applications" />
                    <Line type="monotone" dataKey="hires" stroke="#10b981" name="Hires" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Jobs</CardTitle>
                <CardDescription>Jobs with highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hiringTrends?.topPerformingJobs.slice(0, 5).map((job, index) => (
                    <div key={job.jobId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{job.jobTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.applicationsCount} applications → {job.hiresCount} hires
                        </p>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {job.conversionRate.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                  {(!hiringTrends?.topPerformingJobs || hiringTrends.topPerformingJobs.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Time to Hire Analysis</CardTitle>
              <CardDescription>Average days to hire by job type and stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-4">By Job Type</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={timeToHire?.byJobType || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jobType" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="averageDays" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-4">Prediction</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Current Average</p>
                        <p className="text-2xl font-bold">{timeToHire?.overall.averageDays || 0} days</p>
                      </div>
                      {getTrendIcon(timeToHire?.trend || 'stable')}
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                      <div>
                        <p className="text-sm font-medium">Predicted Next Month</p>
                        <p className="text-2xl font-bold">{timeToHire?.prediction.nextMonthAverage || 0} days</p>
                      </div>
                      <Badge>{timeToHire?.prediction.confidence || 0}% confidence</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Health Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Candidates by Stage</CardTitle>
                <CardDescription>Distribution across recruitment pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pipelineHealth?.byStage.filter(s => !['rejected', 'withdrawn'].includes(s.stage)) || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.stage}: ${entry.count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {pipelineHealth?.byStage.map((entry, index) => (
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
                <CardTitle>Stage Conversion Rates</CardTitle>
                <CardDescription>Percentage moving between stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipelineHealth?.conversionRates.map((rate, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{rate.fromStage} → {rate.toStage}</span>
                        <span className="font-medium">{rate.rate}%</span>
                      </div>
                      <Progress value={rate.rate} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {pipelineHealth && pipelineHealth.bottlenecks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Pipeline Bottlenecks
                </CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pipelineHealth.bottlenecks.map((bottleneck, index) => (
                    <Alert key={index} variant={getSeverityColor(bottleneck.severity) as any}>
                      <AlertTitle className="flex items-center justify-between">
                        <span className="capitalize">{bottleneck.stage} Stage</span>
                        <Badge variant={getSeverityColor(bottleneck.severity) as any}>
                          {bottleneck.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="mb-2">{bottleneck.issue}</p>
                        <p className="text-sm"><strong>Recommendation:</strong> {bottleneck.recommendation}</p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Success Rate Prediction</CardTitle>
              <CardDescription>Based on last 6 months of data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-6 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Current Success Rate</p>
                  <p className="text-4xl font-bold text-primary">{successPrediction?.overallSuccessRate.toFixed(1)}%</p>
                </div>
                <div className="text-center p-6 border rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground mb-2">Predicted Hires Next Month</p>
                  <p className="text-4xl font-bold">{successPrediction?.predictedHiresNextMonth || 0}</p>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Prediction Confidence</p>
                  <p className="text-4xl font-bold text-green-600">{successPrediction?.confidence || 0}%</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-4">Contributing Factors</h4>
                <div className="space-y-3">
                  {successPrediction?.factors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {factor.impact === 'positive' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {factor.impact === 'negative' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {factor.impact === 'neutral' && <Minus className="h-5 w-5 text-gray-500" />}
                        <span className="font-medium">{factor.factor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={factor.weight} className="w-24" />
                        <span className="text-sm text-muted-foreground">{factor.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>Actionable insights to improve your recruitment process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {successPrediction?.recommendations.map((rec, index) => (
                  <div key={index} className="flex gap-3 p-4 border rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>
                    <p className="flex-1">{rec}</p>
                  </div>
                ))}
                {(!successPrediction?.recommendations || successPrediction.recommendations.length === 0) && (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-medium">Great job!</p>
                    <p className="text-sm">Your recruitment process is performing well. Keep up the good work!</p>
                  </div>
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
