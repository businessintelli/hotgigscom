import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import {
  Database,
  Table,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Clock,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  Server
} from "lucide-react";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Database tables with their descriptions
const databaseTables = [
  { name: "users", description: "User accounts and authentication", icon: "👤" },
  { name: "recruiters", description: "Recruiter profiles and settings", icon: "🎯" },
  { name: "candidates", description: "Candidate profiles and information", icon: "👥" },
  { name: "jobs", description: "Job postings and requirements", icon: "💼" },
  { name: "applications", description: "Job applications from candidates", icon: "📝" },
  { name: "interviews", description: "Interview schedules and records", icon: "🎥" },
  { name: "interview_questions", description: "Interview question bank", icon: "❓" },
  { name: "interview_responses", description: "Candidate interview responses", icon: "💬" },
  { name: "customers", description: "Client companies", icon: "🏢" },
  { name: "customer_contacts", description: "Client contact persons", icon: "📞" },
  { name: "resume_profiles", description: "Parsed resume data", icon: "📄" },
  { name: "video_introductions", description: "Candidate video intros", icon: "🎬" },
  { name: "saved_searches", description: "Saved search queries", icon: "🔍" },
  { name: "saved_jobs", description: "Bookmarked jobs by candidates", icon: "⭐" },
  { name: "fraud_detection_events", description: "Security and fraud logs", icon: "🛡️" },
  { name: "associates", description: "Team members and associates", icon: "👔" },
  { name: "onboarding_processes", description: "Employee onboarding workflows", icon: "🚀" },
  { name: "onboarding_tasks", description: "Onboarding task definitions", icon: "✅" },
  { name: "task_assignments", description: "Task assignments to users", icon: "📋" },
  { name: "task_reminders", description: "Task reminder schedules", icon: "⏰" },
  { name: "task_templates", description: "Reusable task templates", icon: "📑" },
  { name: "application_feedback", description: "Feedback on applications", icon: "💭" },
  { name: "reschedule_requests", description: "Interview reschedule requests", icon: "📅" },
  { name: "job_skill_requirements", description: "Required skills per job", icon: "🎓" },
  { name: "candidate_skill_ratings", description: "Candidate skill assessments", icon: "⭐" },
  { name: "interview_panelists", description: "Interview panel members", icon: "👨‍💼" },
  { name: "panelist_feedback", description: "Feedback from panelists", icon: "📊" },
  { name: "notifications", description: "User notifications", icon: "🔔" },
  { name: "candidate_profile_shares", description: "Shared candidate profiles", icon: "🔗" },
  { name: "environment_variables", description: "System configuration", icon: "⚙️" },
  { name: "application_logs", description: "Application event logs", icon: "📜" },
];

export default function AdminDatabase() {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get database info
  const dbInfoQuery = trpc.admin.getDatabaseInfo.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dbInfoQuery.refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Database information updated",
      });
    }, 1000);
  };

  const copyConnectionInfo = () => {
    toast({
      title: "Connection Info",
      description: "Database connection details are available in Settings → Secrets panel",
    });
  };

  const connectionStatus = dbInfoQuery.data?.connectionStatus || "checking";

  return (
    <AdminLayout title="Database Management">
      <div className="space-y-6">
        {/* Connection Status */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Connection Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {connectionStatus === "connected" ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-lg font-semibold text-green-600">Connected</span>
                      </>
                    ) : connectionStatus === "checking" ? (
                      <>
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        <span className="text-lg font-semibold text-blue-600">Checking...</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-lg font-semibold text-red-600">Disconnected</span>
                      </>
                    )}
                  </div>
                </div>
                <Database className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Database Type</p>
                  <p className="text-lg font-semibold">TiDB (MySQL Compatible)</p>
                </div>
                <Server className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Tables</p>
                  <p className="text-2xl font-bold">{databaseTables.length}</p>
                </div>
                <Table className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Status
              </Button>
              <Button variant="outline" onClick={copyConnectionInfo}>
                <Copy className="h-4 w-4 mr-2" />
                View Connection Info
              </Button>
              <Button variant="outline" asChild>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: "Database UI",
                      description: "Access the Database panel from the Management UI sidebar for full CRUD operations",
                    });
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Database UI
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Database Tables */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5 text-blue-600" />
                  Database Tables
                </CardTitle>
                <CardDescription>
                  Overview of all database tables in the system
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {databaseTables.length} tables
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <UITable>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {databaseTables.map((table) => (
                    <TableRow key={table.name} className="hover:bg-gray-50">
                      <TableCell className="text-center text-lg">
                        {table.icon}
                      </TableCell>
                      <TableCell>
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {table.name}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {table.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: `Table: ${table.name}`,
                              description: "Use the Database panel in Management UI to view and edit records",
                            });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </UITable>
            </div>
          </CardContent>
        </Card>

        {/* Database Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Database Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Connection String Location</p>
                <p className="font-medium">Settings → Secrets → DATABASE_URL</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">SSL Required</p>
                <p className="font-medium">Yes (Enable SSL in connection settings)</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">ORM</p>
                <p className="font-medium">Drizzle ORM</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Migration Command</p>
                <code className="bg-gray-200 px-2 py-1 rounded text-sm">pnpm db:push</code>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> For full database management including viewing records, 
                running queries, and editing data, use the <strong>Database panel</strong> in 
                the Management UI (accessible from the right sidebar).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
