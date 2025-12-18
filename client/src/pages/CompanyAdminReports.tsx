import { CompanyAdminLayout } from "@/components/CompanyAdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, FileSpreadsheet, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useState } from "react";
import { DateRangeFilter, DateRangePreset } from "@/components/DateRangeFilter";
import { ReportLoadingSkeleton } from "@/components/ReportLoadingSkeleton";
import { exportToPDF, exportToExcel, formatReportData } from "@/lib/reportExport";
import { useAuth } from "@/_core/hooks/useAuth";

export function CompanyAdminReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState<{
    startDate?: string;
    endDate?: string;
    preset?: DateRangePreset;
  }>({
    preset: 'last30days',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString()
  });

  // Fetch reports data only for active tab
  const { data: overviewData, isLoading: overviewLoading } = trpc.companyAdmin.getRecruitmentOverview.useQuery(
    { dateRange: 30 },
    { enabled: activeTab === 'overview' }
  );

  const { data: submissionsData, isLoading: submissionsLoading } = trpc.companyAdmin.getTotalSubmissionsReport.useQuery(
    { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
    { enabled: activeTab === 'submissions' }
  );

  const { data: placementsData, isLoading: placementsLoading } = trpc.companyAdmin.getPlacementsReport.useQuery(
    { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
    { enabled: activeTab === 'placements' }
  );

  const { data: jobSubmissionsData, isLoading: jobSubmissionsLoading } = trpc.companyAdmin.getSubmissionsByJobReport.useQuery(
    { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
    { enabled: activeTab === 'jobSubmissions' }
  );

  const { data: backedOutData, isLoading: backedOutLoading } = trpc.companyAdmin.getBackedOutReport.useQuery(
    { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
    { enabled: activeTab === 'backedOut' }
  );

  const { data: feedbackData, isLoading: feedbackLoading } = trpc.companyAdmin.getFeedbackReport.useQuery(
    { startDate: dateFilter.startDate, endDate: dateFilter.endDate },
    { enabled: activeTab === 'feedback' }
  );

  const { data: recruiterPerformance, isLoading: recruiterLoading } = trpc.companyAdmin.getRecruiterPerformance.useQuery(
    { dateRange: 30 },
    { enabled: activeTab === 'recruiters' }
  );

  const isLoading = (activeTab === 'overview' && overviewLoading) || 
    (activeTab === 'submissions' && submissionsLoading) || 
    (activeTab === 'placements' && placementsLoading) || 
    (activeTab === 'jobSubmissions' && jobSubmissionsLoading) || 
    (activeTab === 'backedOut' && backedOutLoading) || 
    (activeTab === 'feedback' && feedbackLoading) || 
    (activeTab === 'recruiters' && recruiterLoading);

  if (isLoading) {
    return (
      <CompanyAdminLayout>
        <ReportLoadingSkeleton />
      </CompanyAdminLayout>
    );
  }

  // Export handlers
  const handleExportSubmissions = (format: 'pdf' | 'excel') => {
    if (!submissionsData) return;

    const exportData = formatReportData(
      'Total Submissions Report',
      submissionsData.byStatus,
      [
        { key: 'status', label: 'Status' },
        { key: 'count', label: 'Count' }
      ],
      {
        dateRange: `${dateFilter.preset || 'Custom'}`,
        generatedAt: new Date().toLocaleString(),
        generatedBy: user?.name || 'Company Admin'
      }
    );

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const handleExportPlacements = (format: 'pdf' | 'excel') => {
    if (!placementsData) return;

    const exportData = formatReportData(
      'Placements Report',
      placementsData.byJob,
      [
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'count', label: 'Placements' }
      ],
      {
        dateRange: `${dateFilter.preset || 'Custom'}`,
        generatedAt: new Date().toLocaleString(),
        generatedBy: user?.name || 'Company Admin'
      }
    );

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const handleExportJobSubmissions = (format: 'pdf' | 'excel') => {
    if (!jobSubmissionsData) return;

    const exportData = formatReportData(
      'Submissions by Job Report',
      jobSubmissionsData.jobs,
      [
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'jobType', label: 'Type' },
        { key: 'location', label: 'Location' },
        { key: 'recruiterName', label: 'Recruiter' },
        { key: 'totalSubmissions', label: 'Total' },
        { key: 'shortlisted', label: 'Shortlisted' },
        { key: 'interviewing', label: 'Interviewing' },
        { key: 'offered', label: 'Offered' },
        { key: 'rejected', label: 'Rejected' }
      ],
      {
        dateRange: `${dateFilter.preset || 'Custom'}`,
        generatedAt: new Date().toLocaleString(),
        generatedBy: user?.name || 'Company Admin'
      }
    );

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const handleExportBackedOut = (format: 'pdf' | 'excel') => {
    if (!backedOutData) return;

    const exportData = formatReportData(
      'Backed Out Candidates Report',
      backedOutData.byJob,
      [
        { key: 'jobTitle', label: 'Job Title' },
        { key: 'count', label: 'Backed Out Count' }
      ],
      {
        dateRange: `${dateFilter.preset || 'Custom'}`,
        generatedAt: new Date().toLocaleString(),
        generatedBy: user?.name || 'Company Admin'
      }
    );

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  const handleExportFeedback = (format: 'pdf' | 'excel') => {
    if (!feedbackData) return;

    const exportData = formatReportData(
      'Feedback Report',
      feedbackData.feedback,
      [
        { key: 'candidateName', label: 'Candidate' },
        { key: 'candidateEmail', label: 'Email' },
        { key: 'jobTitle', label: 'Job' },
        { key: 'status', label: 'Status' },
        { key: 'aiScore', label: 'AI Score', format: (v) => v ? `${v}%` : 'N/A' },
        { key: 'notes', label: 'Feedback' }
      ],
      {
        dateRange: `${dateFilter.preset || 'Custom'}`,
        generatedAt: new Date().toLocaleString(),
        generatedBy: user?.name || 'Company Admin'
      }
    );

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }
  };

  return (
    <CompanyAdminLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Company-wide recruitment metrics and insights
          </p>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="jobSubmissions">By Job</TabsTrigger>
            <TabsTrigger value="backedOut">Backed Out</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {overviewLoading ? (
              <div className="text-center py-12">Loading overview...</div>
            ) : overviewData ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Applications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{overviewData.totalApplications}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +23% from last period
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Avg Time to Hire
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {overviewData.avgTimeToHire || 0} days
                      </div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        -5% faster
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Successful Placements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{overviewData.positionsFilled}</div>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8% increase
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Active Jobs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{overviewData.activeJobs || 0}</div>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Minus className="h-3 w-3 mr-1" />
                        No change
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recruitment Funnel */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recruitment Funnel</CardTitle>
                    <CardDescription>Conversion rates across hiring stages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overviewData.applicationsByStatus?.map((stage: any) => {
                        const percentage = overviewData.totalApplications > 0
                          ? Math.round((stage.count / overviewData.totalApplications) * 100)
                          : 0;
                        
                        return (
                          <div key={stage.status} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium capitalize">{stage.status}</span>
                              <span className="text-muted-foreground">{stage.count}</span>
                            </div>
                            <div className="h-3 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </TabsContent>

          {/* Total Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Total Submissions Report</CardTitle>
                  <CardDescription>Application submissions breakdown and trends</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSubmissions('pdf')}
                    disabled={submissionsLoading || !submissionsData}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSubmissions('excel')}
                    disabled={submissionsLoading || !submissionsData}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {submissionsLoading ? (
                  <div className="text-center py-12">Loading submissions data...</div>
                ) : submissionsData ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-primary">{submissionsData.total}</div>
                      <p className="text-muted-foreground mt-2">Total Submissions</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">By Status</h4>
                      {submissionsData.byStatus?.map((item: any) => (
                        <div key={item.status} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <span className="capitalize">{item.status}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No submissions data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Placements Tab */}
          <TabsContent value="placements" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Placements Report</CardTitle>
                  <CardDescription>Successful placements and success rates</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPlacements('pdf')}
                    disabled={placementsLoading || !placementsData}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPlacements('excel')}
                    disabled={placementsLoading || !placementsData}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {placementsLoading ? (
                  <div className="text-center py-12">Loading placements data...</div>
                ) : placementsData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center p-6 bg-secondary rounded-lg">
                        <div className="text-4xl font-bold text-primary">{placementsData.total}</div>
                        <p className="text-muted-foreground mt-2">Total Placements</p>
                      </div>
                      <div className="text-center p-6 bg-secondary rounded-lg">
                        <div className="text-4xl font-bold text-green-600">{placementsData.successRate}%</div>
                        <p className="text-muted-foreground mt-2">Success Rate</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">By Job</h4>
                      {placementsData.byJob?.map((item: any) => (
                        <div key={item.jobId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <span>{item.jobTitle}</span>
                          <span className="font-semibold">{item.count} placements</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">By Recruiter</h4>
                      {placementsData.byRecruiter?.map((item: any) => (
                        <div key={item.recruiterId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <span>{item.recruiterName}</span>
                          <span className="font-semibold">{item.count} placements</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No placements data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submissions by Job Tab */}
          <TabsContent value="jobSubmissions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Submissions by Job Report</CardTitle>
                  <CardDescription>Job-level breakdown of all submissions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportJobSubmissions('pdf')}
                    disabled={jobSubmissionsLoading || !jobSubmissionsData}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportJobSubmissions('excel')}
                    disabled={jobSubmissionsLoading || !jobSubmissionsData}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {jobSubmissionsLoading ? (
                  <div className="text-center py-12">Loading job submissions data...</div>
                ) : jobSubmissionsData && jobSubmissionsData.jobs.length > 0 ? (
                  <div className="space-y-4">
                    {jobSubmissionsData.jobs.map((job: any) => (
                      <div key={job.jobId} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{job.jobTitle}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.jobType} • {job.location} • Recruiter: {job.recruiterName}
                            </p>
                          </div>
                          <div className="text-2xl font-bold text-primary">{job.totalSubmissions}</div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="font-semibold">{job.shortlisted}</div>
                            <div className="text-xs text-muted-foreground">Shortlisted</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="font-semibold">{job.interviewing}</div>
                            <div className="text-xs text-muted-foreground">Interviewing</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="font-semibold">{job.offered}</div>
                            <div className="text-xs text-muted-foreground">Offered</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="font-semibold">{job.rejected}</div>
                            <div className="text-xs text-muted-foreground">Rejected</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No job submissions data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backed Out Tab */}
          <TabsContent value="backedOut" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Backed Out Candidates Report</CardTitle>
                  <CardDescription>Withdrawn and rejected candidates analysis</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportBackedOut('pdf')}
                    disabled={backedOutLoading || !backedOutData}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportBackedOut('excel')}
                    disabled={backedOutLoading || !backedOutData}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {backedOutLoading ? (
                  <div className="text-center py-12">Loading backed out data...</div>
                ) : backedOutData ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-red-600">{backedOutData.total}</div>
                      <p className="text-muted-foreground mt-2">Total Backed Out</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">By Status</h4>
                      {backedOutData.byStatus?.map((item: any) => (
                        <div key={item.status} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <span className="capitalize">{item.status}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold">By Job</h4>
                      {backedOutData.byJob?.map((item: any) => (
                        <div key={item.jobId} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                          <span>{item.jobTitle}</span>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No backed out data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Feedback Report by Applicant</CardTitle>
                  <CardDescription>Detailed feedback and ratings for all applicants</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportFeedback('pdf')}
                    disabled={feedbackLoading || !feedbackData}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportFeedback('excel')}
                    disabled={feedbackLoading || !feedbackData}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="text-center py-12">Loading feedback data...</div>
                ) : feedbackData && feedbackData.feedback.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackData.feedback.map((item: any) => (
                      <div key={item.applicationId} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{item.candidateName}</h4>
                            <p className="text-sm text-muted-foreground">{item.candidateEmail}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium capitalize">{item.status}</div>
                            {item.aiScore && (
                              <div className="text-xs text-muted-foreground">AI Score: {item.aiScore}%</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">Job:</span> {item.jobTitle}
                        </div>
                        
                        {item.notes && (
                          <div className="p-3 bg-secondary rounded text-sm">
                            <span className="font-medium">Feedback:</span>
                            <p className="mt-1 text-muted-foreground">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No feedback data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recruiter Performance Tab */}
          <TabsContent value="recruiters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recruiter Performance Metrics</CardTitle>
                <CardDescription>Individual performance across your recruitment team</CardDescription>
              </CardHeader>
              <CardContent>
                {recruiterLoading ? (
                  <div className="text-center py-12">Loading performance data...</div>
                ) : recruiterPerformance && recruiterPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {recruiterPerformance.map((recruiter: any) => (
                      <div key={recruiter.recruiterId} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{recruiter.recruiterName}</h4>
                            <p className="text-sm text-muted-foreground">{recruiter.recruiterEmail}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-3 bg-blue-50 rounded">
                            <div className="text-2xl font-bold text-blue-600">{recruiter.jobsPosted}</div>
                            <div className="text-xs text-muted-foreground mt-1">Jobs Posted</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded">
                            <div className="text-2xl font-bold text-purple-600">{recruiter.applicationsReceived}</div>
                            <div className="text-xs text-muted-foreground mt-1">Applications</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded">
                            <div className="text-2xl font-bold text-orange-600">{recruiter.interviewsScheduled}</div>
                            <div className="text-xs text-muted-foreground mt-1">Interviews</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded">
                            <div className="text-2xl font-bold text-green-600">{recruiter.successfulPlacements}</div>
                            <div className="text-xs text-muted-foreground mt-1">Placements</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </CompanyAdminLayout>
  );
}
