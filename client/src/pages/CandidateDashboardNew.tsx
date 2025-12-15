import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  CheckSquare,
  Bell,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  DollarSign,
  MapPin,
  Building,
  Filter,
  Star,
  Eye,
  Heart,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { NotificationBell } from "@/components/NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type DashboardView = "overview" | "calendar" | "applications" | "actions" | "notifications" | "jobs" | "resumes";

export default function CandidateDashboardNew() {
  return (
    <EmailVerificationGuard>
      <CandidateDashboardContent />
    </EmailVerificationGuard>
  );
}

function CandidateDashboardContent() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardView>("overview");

  // Fetch candidate data
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  const { data: stats } = trpc.candidate.getStats.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  const { data: applications } = trpc.application.getByCandidate.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  const { data: interviews } = trpc.interview.listByCandidate.useQuery(
    undefined,
    { enabled: !!candidate?.id }
  );

  const { data: jobs } = trpc.job.list.useQuery();
  const savedJobs: any[] = []; // TODO: Implement saved jobs API

  const menuItems = [
    { id: "overview" as DashboardView, icon: LayoutDashboard, label: "Dashboard", badge: null },
    { id: "calendar" as DashboardView, icon: Calendar, label: "Calendar", badge: interviews?.filter((i: any) => new Date(i.scheduledAt) > new Date()).length || null },
    { id: "applications" as DashboardView, icon: Briefcase, label: "My Applications", badge: applications?.length || null },
    { id: "actions" as DashboardView, icon: CheckSquare, label: "Action Items", badge: getPendingActionsCount(applications, interviews) },
    { id: "notifications" as DashboardView, icon: Bell, label: "Notifications", badge: 0 },
    { id: "jobs" as DashboardView, icon: Search, label: "Browse Jobs", badge: null },
    { id: "resumes" as DashboardView, icon: FileText, label: "My Resumes", badge: null },
  ];

  const handleLogout = async () => {
    await logout();
    setLocation("/");
    toast.success("Logged out successfully");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <h1 className="font-bold text-xl text-primary">HotGigs</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                currentView === item.id
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  {item.badge !== null && item.badge > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          {!sidebarCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {candidate?.fullName?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{candidate?.fullName || user?.email}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation("/candidate/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/candidate/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {candidate?.fullName?.[0] || user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation("/candidate/profile")}>
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/candidate/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div>
            <h2 className="text-2xl font-bold">
              {menuItems.find(item => item.id === currentView)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {currentView === "overview" && <DashboardOverview stats={stats} applications={applications} interviews={interviews} />}
          {currentView === "calendar" && <CalendarView interviews={interviews} />}
          {currentView === "applications" && <ApplicationsPipeline applications={applications} />}
          {currentView === "actions" && <ActionItems applications={applications} interviews={interviews} />}
          {currentView === "notifications" && <NotificationsView />}
          {currentView === "jobs" && <JobsList jobs={jobs} savedJobs={savedJobs} candidateId={candidate?.id} />}
          {currentView === "resumes" && <ResumesView candidateId={candidate?.id} />}
        </div>
      </main>
    </div>
  );
}

// Helper function
function getPendingActionsCount(applications: any[] | undefined, interviews: any[] | undefined) {
  let count = 0;
  
  // Count pending interview responses
  if (interviews) {
    count += interviews.filter((i: any) => 
      i.status === "scheduled" && new Date(i.scheduledAt) > new Date()
    ).length;
  }
  
  // Count offers pending response
  if (applications) {
    count += applications.filter((a: any) => a.status === "offered").length;
  }
  
  return count;
}

// Dashboard Overview Component
function DashboardOverview({ stats, applications, interviews }: any) {
  const upcomingInterviews = interviews?.filter((i: any) => new Date(i.scheduledAt) > new Date()).slice(0, 3) || [];
  const recentApplications = applications?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Applications</CardTitle>
            <Briefcase className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {applications?.filter((a: any) => a.status === "pending").length || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.interviews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingInterviews.length} upcoming
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Offers</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.offers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {applications?.filter((a: any) => a.status === "offered").length || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.profileViews || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map((interview: any) => (
                <div key={interview.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{interview.job?.title}</h4>
                      <p className="text-sm text-gray-600">{interview.job?.company}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(interview.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge>{interview.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentApplications.map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{app.job?.title}</h4>
                  <p className="text-sm text-gray-600">{app.job?.company}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied {new Date(app.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={getStatusVariant(app.status)}>{app.status}</Badge>
              </div>
            ))}
            {recentApplications.length === 0 && (
              <p className="text-center text-gray-500 py-8">No applications yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Calendar View Component
function CalendarView({ interviews }: any) {
  const upcomingInterviews = interviews?.filter((i: any) => new Date(i.scheduledAt) > new Date()) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Events</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingInterviews.length > 0 ? (
            <div className="space-y-4">
              {upcomingInterviews.map((interview: any) => (
                <div key={interview.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex flex-col items-center justify-center bg-primary text-white rounded-lg p-3 min-w-[60px]">
                    <span className="text-2xl font-bold">
                      {new Date(interview.scheduledAt).getDate()}
                    </span>
                    <span className="text-xs">
                      {new Date(interview.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{interview.job?.title}</h4>
                        <p className="text-gray-600">{interview.job?.company}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(interview.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {interview.location || "Online"}
                          </span>
                        </div>
                      </div>
                      <Badge>{interview.type}</Badge>
                    </div>
                    {interview.notes && (
                      <p className="text-sm text-gray-600 mt-2">{interview.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming events</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Applications Pipeline Component
function ApplicationsPipeline({ applications }: any) {
  const stages = [
    { id: "pending", label: "Applied", color: "bg-blue-100 text-blue-800" },
    { id: "screening", label: "Screening", color: "bg-yellow-100 text-yellow-800" },
    { id: "interview_scheduled", label: "Interview", color: "bg-purple-100 text-purple-800" },
    { id: "offered", label: "Offer", color: "bg-green-100 text-green-800" },
    { id: "hired", label: "Hired", color: "bg-emerald-100 text-emerald-800" },
    { id: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  ];

  const groupedApps = stages.map(stage => ({
    ...stage,
    applications: applications?.filter((a: any) => a.status === stage.id) || [],
  }));

  return (
    <div className="space-y-6">
      {groupedApps.map(stage => (
        <Card key={stage.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{stage.label}</CardTitle>
              <Badge className={stage.color}>{stage.applications.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {stage.applications.length > 0 ? (
              <div className="space-y-3">
                {stage.applications.map((app: any) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Building className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{app.job?.title}</h4>
                        <p className="text-sm text-gray-600">{app.job?.company}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied {new Date(app.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">No applications in this stage</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Action Items Component
function ActionItems({ applications, interviews }: any) {
  const pendingOffers = applications?.filter((a: any) => a.status === "offered") || [];
  const upcomingInterviews = interviews?.filter((i: any) => 
    i.status === "scheduled" && new Date(i.scheduledAt) > new Date()
  ) || [];

  return (
    <div className="space-y-6">
      {/* Pending Offers */}
      {pendingOffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pending Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOffers.map((app: any) => (
                <div key={app.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{app.job?.title}</h4>
                      <p className="text-gray-600">{app.job?.company}</p>
                    </div>
                    <Badge variant="default">Offer Received</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Accept Offer</Button>
                    <Button size="sm" variant="outline" className="flex-1">Negotiate Salary</Button>
                    <Button size="sm" variant="destructive" className="flex-1">Decline</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Actions */}
      {upcomingInterviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Interview Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map((interview: any) => (
                <div key={interview.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{interview.job?.title}</h4>
                      <p className="text-gray-600">{interview.job?.company}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(interview.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge>{interview.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">Confirm Attendance</Button>
                    <Button size="sm" variant="outline" className="flex-1">Reschedule</Button>
                    <Button size="sm" variant="ghost" className="flex-1">Cancel</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingOffers.length === 0 && upcomingInterviews.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending actions</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Notifications View Component
function NotificationsView() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No new notifications</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Jobs List Component
function JobsList({ jobs, savedJobs, candidateId }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [showRecommended, setShowRecommended] = useState(false);

  const filteredJobs = jobs?.filter((job: any) => {
    if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (locationFilter !== "all" && job.location !== locationFilter) return false;
    if (experienceFilter !== "all" && job.experienceLevel !== experienceFilter) return false;
    if (jobTypeFilter !== "all" && job.type !== jobTypeFilter) return false;
    return true;
  }) || [];

  const savedJobIds = new Set(savedJobs?.map((sj: any) => sj.jobId) || []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={experienceFilter} onValueChange={setExperienceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <Button
              variant={showRecommended ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRecommended(!showRecommended)}
            >
              <Star className="h-4 w-4 mr-2" />
              Recommended Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job: any) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Building className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.company}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </Badge>
                        <Badge variant="outline">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {job.type}
                        </Badge>
                        <Badge variant="outline">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {job.salaryRange}
                        </Badge>
                        <DeadlineBadge deadline={job.applicationDeadline} />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <Button size="sm">Apply Now</Button>
                  <Button size="sm" variant="outline">View Details</Button>
                  <BookmarkButton jobId={job.id} candidateId={candidateId} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredJobs.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No jobs found matching your criteria</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Resumes View Component
function ResumesView({ candidateId }: any) {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>My Resumes</CardTitle>
          <Button onClick={() => setLocation("/candidate/resumes")}>
            Manage Resumes
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Manage your resumes and video introductions</p>
          <Button onClick={() => setLocation("/candidate/resumes")}>
            Go to My Resumes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function for status badge variants
function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "offered":
    case "hired":
      return "default";
    case "rejected":
      return "destructive";
    case "interview_scheduled":
      return "secondary";
    default:
      return "outline";
  }
}
