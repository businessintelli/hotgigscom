import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  Briefcase, 
  FileText, 
  Video, 
  TrendingUp, 
  AlertCircle,
  Activity,
  Database,
  Mail
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.admin.getPlatformStats.useQuery();
  const { data: recentActivity } = trpc.admin.getRecentActivity.useQuery({ limit: 10 });
  const { data: systemHealth } = trpc.admin.getSystemHealth.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      change: stats?.userGrowth || 0,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      change: stats?.jobGrowth || 0,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Applications",
      value: stats?.totalApplications || 0,
      change: stats?.applicationGrowth || 0,
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Interviews",
      value: stats?.totalInterviews || 0,
      change: stats?.interviewGrowth || 0,
      icon: Video,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform management and monitoring</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users">
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/health">
            <Button variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              System Health
            </Button>
          </Link>
        </div>
      </div>

      {/* System Health Alert */}
      {systemHealth && !systemHealth.healthy && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">System Health Warning</p>
                <p className="text-sm text-red-700">{systemHealth.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isPositive = metric.change >= 0;
          
          return (
            <Card key={metric.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metric.value.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp 
                    className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'} ${!isPositive && 'rotate-180'}`} 
                  />
                  <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href="/admin/health">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                System Health
              </Button>
            </Link>
            <Link href="/admin/email-settings">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Email Settings
              </Button>
            </Link>
            <Link href="/admin/database">
              <Button variant="outline" className="w-full justify-start">
                <Database className="w-4 h-4 mr-2" />
                Database Management
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recruiters</span>
                <span className="font-semibold">{stats?.recruiterCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Candidates</span>
                <span className="font-semibold">{stats?.candidateCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Admins</span>
                <span className="font-semibold">{stats?.adminCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{stats?.pendingApplications || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reviewed</span>
                <span className="font-semibold text-blue-600">{stats?.reviewedApplications || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Accepted</span>
                <span className="font-semibold text-green-600">{stats?.acceptedApplications || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Scheduled</span>
                <span className="font-semibold text-blue-600">{stats?.scheduledInterviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{stats?.completedInterviews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="font-semibold text-red-600">{stats?.cancelledInterviews || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'user_signup':
      return <Users className="w-4 h-4" />;
    case 'job_created':
      return <Briefcase className="w-4 h-4" />;
    case 'application_submitted':
      return <FileText className="w-4 h-4" />;
    case 'interview_scheduled':
      return <Video className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'user_signup':
      return 'bg-blue-50 text-blue-600';
    case 'job_created':
      return 'bg-green-50 text-green-600';
    case 'application_submitted':
      return 'bg-purple-50 text-purple-600';
    case 'interview_scheduled':
      return 'bg-orange-50 text-orange-600';
    default:
      return 'bg-gray-50 text-gray-600';
  }
}
