import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, TrendingUp, Users, Eye, Download, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";

type DateRange = "7d" | "30d" | "90d";

export default function CompanyAdminAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<number | null>(null);

  const { data: companyUsers } = trpc.companyAdmin.getCompanyUsers.useQuery();
  const recruiters = companyUsers?.filter((u: any) => u.role === "recruiter") || [];

  const { data: topJobs } = trpc.job.getTopPerformingJobs.useQuery(
    { companyId: user?.companyId || 0, limit: 20 },
    { enabled: !!user?.companyId }
  );

  const handleExport = () => {
    toast.info("Export functionality coming soon!");
  };

  const filteredJobs = selectedRecruiterId
    ? topJobs?.filter((job: any) => job.recruiterId === selectedRecruiterId)
    : topJobs;

  return (
    <CompanyAdminLayout>
      <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Company Analytics</h1>
            <p className="text-muted-foreground">
              Company-wide recruitment metrics and performance insights
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Recruiter Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Filter by Recruiter
          </CardTitle>
          <CardDescription>View analytics for specific recruiters or company-wide</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedRecruiterId?.toString() || "all"}
            onValueChange={(v) => setSelectedRecruiterId(v === "all" ? null : parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Recruiters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Recruiters</SelectItem>
              {recruiters.map((recruiter: any) => (
                <SelectItem key={recruiter.id} value={recruiter.id.toString()}>
                  {recruiter.name || recruiter.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Company-Wide Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topJobs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {recruiters.length} recruiter{recruiters.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topJobs?.reduce((sum: number, job: any) => sum + parseInt(job.totalViews || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all job postings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topJobs?.reduce((sum: number, job: any) => sum + parseInt(job.totalApplications || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all job postings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {selectedRecruiterId ? "Recruiter's Top Jobs" : "Company Top Performing Jobs"}
          </CardTitle>
          <CardDescription>
            Jobs ranked by views, applications, and conversion rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Recruiter</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Applications</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs && filteredJobs.length > 0 ? (
                filteredJobs.map((job: any) => (
                  <TableRow key={job.jobId}>
                    <TableCell className="font-medium">{job.jobTitle}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {recruiters.find((r: any) => r.id === job.recruiterId)?.name || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{job.totalViews || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{job.totalApplications || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={parseFloat(job.conversionRate || 0) > 5 ? "default" : "secondary"}>
                        {parseFloat(job.conversionRate || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recruiter Performance Comparison */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recruiter Performance
          </CardTitle>
          <CardDescription>Compare performance across your recruitment team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recruiters.map((recruiter: any) => {
              const recruiterJobs = topJobs?.filter((job: any) => job.recruiterId === recruiter.id) || [];
              const totalViews = recruiterJobs.reduce((sum: number, job: any) => sum + parseInt(job.totalViews || 0), 0);
              const totalApplications = recruiterJobs.reduce((sum: number, job: any) => sum + parseInt(job.totalApplications || 0), 0);
              const avgConversion = recruiterJobs.length > 0
                ? recruiterJobs.reduce((sum: number, job: any) => sum + parseFloat(job.conversionRate || 0), 0) / recruiterJobs.length
                : 0;

              return (
                <div key={recruiter.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{recruiter.name || recruiter.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {recruiterJobs.length} job{recruiterJobs.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold">{totalViews}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{totalApplications}</div>
                      <div className="text-muted-foreground">Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{avgConversion.toFixed(1)}%</div>
                      <div className="text-muted-foreground">Avg Conversion</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {recruiters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recruiters found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </CompanyAdminLayout>
  );
}
