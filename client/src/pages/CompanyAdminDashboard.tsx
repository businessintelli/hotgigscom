import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Linkedin,
  Mail,
  Target,
} from "lucide-react";

export function CompanyAdminDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.companyAdmin.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <CompanyAdminLayout>
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Loading your company overview...
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CompanyAdminLayout>
    );
  }

  const primaryMetrics = [
    {
      title: "Total Jobs Posted",
      value: stats?.totalJobs || 0,
      description: `${stats?.activeJobs || 0} active, ${stats?.closedJobs || 0} closed`,
      icon: Briefcase,
      trend: stats?.jobsTrend || 0,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      onClick: () => setLocation("/company-admin/jobs"),
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      description: `${stats?.pendingApplications || 0} pending review`,
      icon: FileText,
      trend: stats?.applicationsTrend || 0,
      color: "text-green-600",
      bgColor: "bg-green-50",
      onClick: () => setLocation("/company-admin/applications"),
    },
    {
      title: "Active Recruiters",
      value: stats?.activeRecruiters || 0,
      description: `${stats?.totalRecruiters || 0} total team members`,
      icon: Users,
      trend: stats?.recruitersTrend || 0,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      onClick: () => setLocation("/company-admin/team-members"),
    },
    {
      title: "Interviews Scheduled",
      value: stats?.interviewsScheduled || 0,
      description: `${stats?.interviewsCompleted || 0} completed this month`,
      icon: Calendar,
      trend: stats?.interviewsTrend || 0,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      onClick: () => setLocation("/company-admin/interviews"),
    },
  ];

  const secondaryMetrics = [
    {
      title: "Placement Rate",
      value: `${stats?.placementRate || 0}%`,
      description: "Offers accepted vs total offers",
      icon: Target,
      color: "text-emerald-600",
    },
    {
      title: "Avg. Time to Hire",
      value: `${stats?.avgTimeToHire || 0} days`,
      description: "From application to offer",
      icon: Clock,
      color: "text-indigo-600",
    },
    {
      title: "LinkedIn InMail Credits",
      value: stats?.linkedinCreditsRemaining || 0,
      description: `${stats?.linkedinCreditsUsed || 0} used this month`,
      icon: Linkedin,
      color: "text-sky-600",
    },
    {
      title: "Email Campaigns",
      value: stats?.activeCampaigns || 0,
      description: `${stats?.campaignResponseRate || 0}% response rate`,
      icon: Mail,
      color: "text-pink-600",
    },
  ];

  return (
    <CompanyAdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Overview of your recruitment operations
            </p>
          </div>
          <Button onClick={() => setLocation("/company-admin/team-members")}>
            <Users className="h-4 w-4 mr-2" />
            Manage Team
          </Button>
        </div>

        {/* Primary Metrics - Clickable Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {primaryMetrics.map((metric) => {
            const Icon = metric.icon;
            const isPositiveTrend = metric.trend >= 0;
            
            return (
              <Card
                key={metric.title}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={metric.onClick}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{metric.value}</div>
                    {metric.trend !== 0 && (
                      <div className={`flex items-center text-sm ${
                        isPositiveTrend ? "text-green-600" : "text-red-600"
                      }`}>
                        {isPositiveTrend ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(metric.trend)}%
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metric.description}
                  </p>
                  <div className="flex items-center text-xs text-blue-600 mt-3 font-medium">
                    View details
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {secondaryMetrics.map((metric) => {
            const Icon = metric.icon;
            
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Performing Recruiters */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Recruiters</CardTitle>
              <CardDescription>
                Based on placements this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topRecruiters && stats.topRecruiters.length > 0 ? (
                  stats.topRecruiters.map((recruiter: any, index: number) => (
                    <div key={recruiter.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{recruiter.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {recruiter.jobsAssigned} jobs assigned
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {recruiter.placements} placements
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {recruiter.interviewsScheduled} interviews
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recruiter data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions from your recruitment team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        activity.type === "hire" ? "bg-green-50" :
                        activity.type === "interview" ? "bg-blue-50" :
                        activity.type === "application" ? "bg-purple-50" :
                        "bg-gray-50"
                      }`}>
                        {activity.type === "hire" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {activity.type === "interview" && <Calendar className="h-4 w-4 text-blue-600" />}
                        {activity.type === "application" && <FileText className="h-4 w-4 text-purple-600" />}
                        {activity.type === "rejection" && <XCircle className="h-4 w-4 text-red-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* LinkedIn Integration Status */}
        {stats?.linkedinConnected && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    LinkedIn Integration Active
                  </CardTitle>
                  <CardDescription>
                    Connected as {stats.linkedinAccountName}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/company-admin/linkedin-settings")}
                >
                  Manage Settings
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.linkedinCreditsRemaining}
                  </p>
                  <p className="text-xs text-muted-foreground">InMail Credits Left</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.linkedinCampaignsActive}
                  </p>
                  <p className="text-xs text-muted-foreground">Active Campaigns</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.linkedinResponseRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CompanyAdminLayout>
  );
}
