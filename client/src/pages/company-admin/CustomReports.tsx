import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, FileText, Trash2, Calendar, Edit } from "lucide-react";
import { format } from "date-fns";

export default function CustomReports() {
  const { data: reports, isLoading, refetch } = trpc.companyAdmin.getCustomReports.useQuery();

  const deleteReportMutation = trpc.companyAdmin.deleteCustomReport.useMutation({
    onSuccess: () => {
      toast.success("Report deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });

  const handleDelete = (reportId: number, reportName: string) => {
    if (confirm(`Are you sure you want to delete "${reportName}"?`)) {
      deleteReportMutation.mutate({ reportId });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage custom reports with your preferred fields and filters
          </p>
        </div>
        <Link href="/company-admin/custom-reports/new">
          <Button>
          <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reports && reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {report.name}
                    </CardTitle>
                    {report.description && (
                      <CardDescription className="mt-2">{report.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">
                      {Array.isArray(report.selectedFields) ? report.selectedFields.length : 0} fields
                    </Badge>
                    {report.filters && Array.isArray(report.filters) && report.filters.length > 0 && (
                      <Badge variant="outline">{report.filters.length} filters</Badge>
                    )}
                  </div>
                  
                  {report.groupBy && (
                    <div className="text-sm text-muted-foreground">
                      Grouped by: <span className="font-medium">{report.groupBy}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Created {format(new Date(report.createdAt), "MMM d, yyyy")}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Link href={`/company-admin/custom-reports/${report.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(report.id, report.name)}
                    disabled={deleteReportMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Custom Reports Yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first custom report to analyze recruitment data with your preferred fields and filters
            </p>
            <Link href="/company-admin/custom-reports/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
