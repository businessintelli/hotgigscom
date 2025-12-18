import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  BarChart3,
  Calendar,
  RefreshCw,
  Info
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

type DateRange = "7days" | "30days" | "90days";

const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe"];

export default function CompanyLLMCostTracking() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  const [companyId, setCompanyId] = useState<number | null>(null);

  // Get user's company ID
  const { data: recruiterProfile } = trpc.getRecruiterProfile.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (recruiterProfile?.companyId) {
      setCompanyId(recruiterProfile.companyId);
    }
  }, [recruiterProfile]);

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Queries (only run if we have companyId)
  const { data: totalCost, isLoading: loadingTotal } = trpc.llmManagement.getTotalCost.useQuery(
    { startDate, endDate, companyId: companyId! },
    { enabled: !!companyId }
  );

  const { data: projectedCost, isLoading: loadingProjection } = trpc.llmManagement.projectMonthlyCost.useQuery(
    { companyId: companyId! },
    { enabled: !!companyId }
  );

  const { data: costByProvider, isLoading: loadingProvider } = trpc.llmManagement.getCostByProvider.useQuery(
    { startDate, endDate, companyId: companyId! },
    { enabled: !!companyId }
  );

  const { data: costByFeature, isLoading: loadingFeature } = trpc.llmManagement.getCostByFeature.useQuery(
    { startDate, endDate, companyId: companyId! },
    { enabled: !!companyId }
  );

  const { data: dailyTrend, isLoading: loadingTrend } = trpc.llmManagement.getDailyCostTrend.useQuery(
    { startDate, endDate, companyId: companyId! },
    { enabled: !!companyId }
  );

  const utils = trpc.useUtils();

  const refreshData = () => {
    utils.llmManagement.invalidate();
  };

  if (!companyId) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Loading company information...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <CompanyAdminLayout>
      <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Usage & Costs</h1>
          <p className="text-muted-foreground mt-1">
            Track your company's AI spending and optimize usage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refreshData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          These costs represent your company's usage of AI features like resume parsing, candidate matching, and interview analysis. 
          Optimize by adjusting usage patterns or configuring alerts for cost thresholds.
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Period Spend</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingTotal ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${totalCost?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dateRange === "7days" && "Past 7 days"}
                  {dateRange === "30days" && "Past 30 days"}
                  {dateRange === "90days" && "Past 90 days"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Projection</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingProjection ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${projectedCost?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated for this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingProvider ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {costByProvider?.reduce((sum, p) => sum + p.requestCount, 0).toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI API calls
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Request</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingProvider ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(costByProvider?.reduce((sum, p) => sum + (p.avgCostPerRequest || 0), 0) / (costByProvider?.length || 1)).toFixed(4) || "0.0000"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per API call
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trend">Spending Trend</TabsTrigger>
          <TabsTrigger value="feature">By Feature</TabsTrigger>
          <TabsTrigger value="provider">By Provider</TabsTrigger>
        </TabsList>

        {/* Cost Trend Chart */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Daily Spending Trend</CardTitle>
              <CardDescription>
                Your company's AI costs over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTrend ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(4)}`}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalCost" 
                      stroke="#667eea" 
                      strokeWidth={2}
                      name="Cost ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost by Feature */}
        <TabsContent value="feature">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Feature</CardTitle>
              <CardDescription>
                Which AI features your company uses most
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFeature ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={costByFeature || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
                    <Legend />
                    <Bar dataKey="totalCost" fill="#667eea" name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost by Provider */}
        <TabsContent value="provider">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Distribution</CardTitle>
                <CardDescription>
                  AI providers used by your company
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingProvider ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={costByProvider || []}
                        dataKey="totalCost"
                        nameKey="provider"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.provider}: $${entry.totalCost.toFixed(2)}`}
                      >
                        {(costByProvider || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                    </RePieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Provider Details</CardTitle>
                <CardDescription>
                  Detailed breakdown by provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingProvider ? (
                    <>
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </>
                  ) : (
                    costByProvider?.map((provider) => (
                      <div key={provider.provider} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{provider.provider}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.requestCount.toLocaleString()} requests
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${provider.totalCost.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            ${provider.avgCostPerRequest.toFixed(4)}/req
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Cost Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Set up usage alerts to monitor spending thresholds and avoid unexpected costs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Review which features consume the most AI resources and optimize usage patterns</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Consider batch processing for resume parsing instead of individual uploads</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use AI matching strategically for high-priority positions to maximize ROI</span>
            </li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </CompanyAdminLayout>
  );
}
