import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw
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

type DateRange = "7days" | "30days" | "90days" | "1year";

const COLORS = ["#667eea", "#764ba2", "#f093fb", "#4facfe", "#43e97b"];

export default function AdminLLMCostTracking() {
  const [dateRange, setDateRange] = useState<DateRange>("30days");
  
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
      case "1year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Queries
  const { data: totalCost, isLoading: loadingTotal } = trpc.llmManagement.getTotalCost.useQuery({
    startDate,
    endDate,
  });

  const { data: projectedCost, isLoading: loadingProjection } = trpc.llmManagement.projectMonthlyCost.useQuery({});

  const { data: costByProvider, isLoading: loadingProvider } = trpc.llmManagement.getCostByProvider.useQuery({
    startDate,
    endDate,
  });

  const { data: costByFeature, isLoading: loadingFeature } = trpc.llmManagement.getCostByFeature.useQuery({
    startDate,
    endDate,
  });

  const { data: dailyTrend, isLoading: loadingTrend } = trpc.llmManagement.getDailyCostTrend.useQuery({
    startDate,
    endDate,
  });

  const { data: providerHealth } = trpc.llmManagement.getProviderHealth.useQuery();

  const utils = trpc.useUtils();

  const refreshData = () => {
    utils.llmManagement.invalidate();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">LLM Cost Tracking</h1>
          <p className="text-muted-foreground mt-1">
            System-wide AI usage analytics and cost management
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
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refreshData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
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
                  {dateRange === "1year" && "Past year"}
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
                  Based on current usage
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providerHealth?.filter(p => p.enabled && p.isHealthy).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {providerHealth?.filter(p => !p.isHealthy).length || 0} unhealthy
            </p>
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
                  Across all providers
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trend">Cost Trend</TabsTrigger>
          <TabsTrigger value="provider">By Provider</TabsTrigger>
          <TabsTrigger value="feature">By Feature</TabsTrigger>
          <TabsTrigger value="health">Provider Health</TabsTrigger>
        </TabsList>

        {/* Cost Trend Chart */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Daily Cost Trend</CardTitle>
              <CardDescription>
                LLM spending over time
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

        {/* Cost by Provider */}
        <TabsContent value="provider">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Provider</CardTitle>
                <CardDescription>
                  Distribution of spending across LLM providers
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
                <CardTitle>Provider Statistics</CardTitle>
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

        {/* Cost by Feature */}
        <TabsContent value="feature">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Feature</CardTitle>
              <CardDescription>
                Which features consume the most AI resources
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

        {/* Provider Health */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Provider Health Status</CardTitle>
              <CardDescription>
                Real-time health monitoring and fallback configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providerHealth?.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${provider.isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium capitalize">
                          {provider.provider}
                          {!provider.enabled && <Badge variant="secondary" className="ml-2">Disabled</Badge>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Priority: {provider.priority} | Failures: {provider.failureCount}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={provider.isHealthy ? "default" : "destructive"}>
                        {provider.isHealthy ? "Healthy" : "Unhealthy"}
                      </Badge>
                      {provider.lastFailureAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last failure: {new Date(provider.lastFailureAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
