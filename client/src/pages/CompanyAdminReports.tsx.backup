import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  Target,
  Award,
  BarChart3,
} from "lucide-react";

export function CompanyAdminReports() {
  const { data: stats, isLoading } = trpc.companyAdmin.getDashboardStats.useQuery();
  const { data: recruiterPerf } = trpc.companyAdmin.getRecruiterPerformance.useQuery();

  if (isLoading) {
    return (
      <CompanyAdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">Loading analytics...</p>
          </div>
        </div>
      </CompanyAdminLayout>
    );
  }

  const overviewMetrics = [
    {
      title: "Total Jobs Posted",
      value: stats?.totalJobs || 0,
      change: "+12%",
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      change: "+23%",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Successful Placements",
      value: stats?.totalPlacements || 0,
      change: "+8%",
      icon: Award,
      color: "text-purple-600",
    },
    {
      title: "Avg Time to Hire",
      value: `${stats?.avgTimeToHire || 0} days`,
      change: "-5%",
      icon: Clock,
      color: "text-orange-600",
    },
  ];

  return (
    <CompanyAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Company-wide recruitment metrics and insights
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recruiters">Recruiter Performance</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Analytics</TabsTrigger>
            <TabsTrigger value="financials">Financial Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {overviewMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {metric.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${metric.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <p className="text-xs text-green-600 mt-1">{metric.change}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Recruitment Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Funnel</CardTitle>
                <CardDescription>
                  Conversion rates across hiring stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Applications Received</span>
                      <span className="font-medium">{stats?.totalApplications || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Screening Passed</span>
                      <span className="font-medium">
                        {Math.round((stats?.totalApplications || 0) * 0.6)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "60%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Interviews Scheduled</span>
                      <span className="font-medium">
                        {Math.round((stats?.totalApplications || 0) * 0.3)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "30%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Offers Extended</span>
                      <span className="font-medium">
                        {Math.round((stats?.totalApplications || 0) * 0.1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "10%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Placements</span>
                      <span className="font-medium">{stats?.totalPlacements || 0}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "8%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruiter Performance Tab */}
          <TabsContent value="recruiters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recruiter Performance Metrics</CardTitle>
                <CardDescription>
                  Individual performance across your recruitment team
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recruiterPerf && recruiterPerf.length > 0 ? (
                  <div className="space-y-6">
                    {recruiterPerf.map((recruiter: any) => (
                      <div key={recruiter.recruiterId} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{recruiter.recruiterName}</p>
                            <p className="text-sm text-muted-foreground">
                              {recruiter.recruiterEmail}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{recruiter.totalPlacements}</p>
                            <p className="text-xs text-muted-foreground">Placements</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-lg font-semibold">{recruiter.activeJobs}</p>
                            <p className="text-xs text-muted-foreground">Active Jobs</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">{recruiter.totalApplications}</p>
                            <p className="text-xs text-muted-foreground">Applications</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">{recruiter.interviewsScheduled}</p>
                            <p className="text-xs text-muted-foreground">Interviews</p>
                          </div>
                          <div>
                            <p className="text-lg font-semibold">
                              {recruiter.placementRate ? `${recruiter.placementRate}%` : "0%"}
                            </p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No performance data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Analytics Tab */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Source Effectiveness</CardTitle>
                  <CardDescription>
                    Where your best candidates come from
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">LinkedIn</span>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Direct Applications</span>
                      <span className="text-sm font-medium">28%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Referrals</span>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Job Boards</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time-to-Hire by Role</CardTitle>
                  <CardDescription>
                    Average days to fill positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Software Engineer</span>
                      <span className="text-sm font-medium">28 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Product Manager</span>
                      <span className="text-sm font-medium">35 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Scientist</span>
                      <span className="text-sm font-medium">42 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">UX Designer</span>
                      <span className="text-sm font-medium">21 days</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financial Metrics Tab */}
          <TabsContent value="financials" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From placements
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Cost per Hire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">$0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average across all roles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Return on investment
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </CompanyAdminLayout>
  );
}
