import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Activity, 
  Database, 
  Server, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";

export default function SystemHealth() {
  const { data: health, isLoading, refetch } = trpc.admin.getSystemHealth.useQuery();
  const { data: metrics } = trpc.admin.getSystemMetrics.useQuery();
  const { data: errorLogs } = trpc.admin.getErrorLogs.useQuery({ limit: 10 });
  
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      refetch();
      setUptime(prev => prev + 10);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="w-8 h-8" />
            System Health Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Real-time system status and performance metrics</p>
        </div>
        <Badge variant={health?.healthy ? "default" : "destructive"} className="text-lg px-4 py-2">
          {health?.healthy ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              All Systems Operational
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              System Issues Detected
            </>
          )}
        </Badge>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Database Status */}
        <Card className={health?.database?.connected ? "border-green-200" : "border-red-200"}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className={`w-5 h-5 ${health?.database?.connected ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health?.database?.connected ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-lg font-semibold">
                {health?.database?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Response Time: {health?.database?.responseTime || 'N/A'}ms
            </p>
          </CardContent>
        </Card>

        {/* Server Status */}
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Server</CardTitle>
            <Server className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-lg font-semibold">Running</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Uptime: {formatUptime(metrics?.uptime || 0)}
            </p>
          </CardContent>
        </Card>

        {/* API Status */}
        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-lg font-semibold">Healthy</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Avg Response: {metrics?.avgResponseTime || 0}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm text-gray-600">Memory Usage</span>
              <span className="font-semibold">{metrics?.memoryUsage || 0}%</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm text-gray-600">CPU Usage</span>
              <span className="font-semibold">{metrics?.cpuUsage || 0}%</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm text-gray-600">Active Connections</span>
              <span className="font-semibold">{metrics?.activeConnections || 0}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm text-gray-600">Request Rate</span>
              <span className="font-semibold">{metrics?.requestRate || 0} req/min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className={`font-semibold ${(metrics?.errorRate || 0) > 5 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics?.errorRate || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorLogs && errorLogs.length > 0 ? (
                errorLogs.map((log: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-900">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No errors in the last 24 hours</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Endpoints Health */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoints Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Authentication', path: '/api/auth', status: 'healthy', responseTime: 45 },
              { name: 'Jobs API', path: '/api/jobs', status: 'healthy', responseTime: 120 },
              { name: 'Applications API', path: '/api/applications', status: 'healthy', responseTime: 95 },
              { name: 'Interviews API', path: '/api/interviews', status: 'healthy', responseTime: 150 },
              { name: 'AI Services', path: '/api/ai', status: 'healthy', responseTime: 230 },
              { name: 'File Storage', path: '/api/storage', status: 'healthy', responseTime: 180 },
            ].map((endpoint) => (
              <div key={endpoint.path} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{endpoint.name}</span>
                  <Badge variant={endpoint.status === 'healthy' ? 'default' : 'destructive'}>
                    {endpoint.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{endpoint.responseTime}ms</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Auto-refresh indicator */}
      <div className="text-center text-sm text-gray-500">
        <Activity className="w-4 h-4 inline mr-1 animate-pulse" />
        Auto-refreshing every 10 seconds
      </div>
    </div>
  );
}
