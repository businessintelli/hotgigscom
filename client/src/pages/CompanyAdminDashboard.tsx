import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Briefcase, UserCheck, TrendingUp } from "lucide-react";

export function CompanyAdminDashboard() {
  const { data: stats, isLoading } = trpc.companyAdmin.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <CompanyAdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Loading your company overview...
            </p>
          </div>
        </div>
      </CompanyAdminLayout>
    );
  }

  const metrics = [
    {
      title: "Team Members",
      value: stats?.totalRecruiters || 0,
      description: "Active recruiters",
      icon: Users,
      trend: "+2 this month"
    },
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      description: "Open positions",
      icon: Briefcase,
      trend: "+5 this week"
    },
    {
      title: "Candidates",
      value: stats?.totalCandidates || 0,
      description: "In pipeline",
      icon: UserCheck,
      trend: "+12 this week"
    },
    {
      title: "InMail Credits",
      value: stats?.remainingCredits || 0,
      description: "Available this month",
      icon: TrendingUp,
      trend: `${stats?.creditsUsed || 0} used`
    }
  ];

  return (
    <CompanyAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Company Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your recruitment operations
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {metric.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                  <p className="text-xs text-green-600 mt-2">{metric.trend}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

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
                stats.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.user}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity to display
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </CompanyAdminLayout>
  );
}
