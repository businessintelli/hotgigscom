import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import RecruiterOnboarding from "@/components/RecruiterOnboarding";
import { NotificationBell } from "@/components/NotificationBell";
import { formatDistanceToNow } from "date-fns";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Video, 
  Building2, 
  FileText, 
  Calendar, 
  Search, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Plus, 
  Filter, 
  Clock, 
  Shield,
  User,
  BarChart3,
  Mail,
  Upload,
  Target,
  RefreshCw,
  Sparkles,
  MapPin,
  DollarSign,
  Eye
} from "lucide-react";

export default function RecruiterDashboard() {
  return (
    <EmailVerificationGuard>
      <RecruiterDashboardContent />
    </EmailVerificationGuard>
  );
}

// Sidebar navigation items
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/recruiter/dashboard", badge: null },
  { icon: Briefcase, label: "Jobs", path: "/recruiter/jobs", badge: null },
  { icon: Users, label: "Candidates", path: "/recruiter/search-candidates", badge: null },
  { icon: FileText, label: "Applications", path: "/recruiter/applications", badge: null },
  { icon: Calendar, label: "Interviews", path: "/recruiter/interviews", badge: null },
  { icon: Video, label: "AI Interviews", path: "/recruiter/interview-playback", badge: null },
  { icon: Target, label: "AI Matching", path: "/recruiter/ai-matching", badge: null },
  { icon: Building2, label: "Clients", path: "/recruiter/customers", badge: null },
  { icon: Upload, label: "Bulk Upload", path: "/recruiter/bulk-upload", badge: null },
  { icon: Mail, label: "Email Campaigns", path: "/recruiter/campaigns", badge: null },
  { icon: BarChart3, label: "Analytics", path: "/analytics", badge: null },
  { icon: RefreshCw, label: "Reschedule Requests", path: "/recruiter/reschedule-requests", badge: "pending" },
];

function RecruiterDashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { data: dashboardData, isLoading } = trpc.recruiter.getDashboardStats.useQuery();
  const { data: profile } = trpc.recruiter.getProfile.useQuery();
  const { data: completionStatus } = trpc.profileCompletion.getStatus.useQuery();
  const { data: pendingReschedules } = (trpc as any).reschedule?.getPendingRequests?.useQuery() || { data: [] };
  const { data: allJobs } = trpc.job.getMyJobs.useQuery();
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Jobs panel state
  const [jobsFilter, setJobsFilter] = useState<"all" | "mine" | "others">("all");
  const [jobsSearch, setJobsSearch] = useState("");
  const [jobsStatus, setJobsStatus] = useState<"all" | "active" | "closed" | "draft">("all");

  useEffect(() => {
    const hasToken = localStorage.getItem('auth_token');
    if (!authLoading && !hasToken && !user) {
      setLocation('/');
    } else if (!authLoading && user && user.role !== 'recruiter') {
      setLocation('/');
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (profile && !profile.companyName) {
      setShowOnboarding(true);
    }
  }, [profile]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">HG</span>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    activeJobs: 0,
    totalApplications: 0,
    aiMatches: 0,
    submittedToClients: 0,
  };

  const recentJobs = dashboardData?.recentJobs || [];
  const pendingCount = pendingReschedules?.filter((r: any) => r.status === 'pending').length || 0;
  const profilePercentage = completionStatus?.percentage || 0;

  // Filter jobs
  const filteredJobs = (allJobs || []).filter((job: any) => {
    // Filter by ownership
    if (jobsFilter === "mine" && job.recruiterId !== user?.id) return false;
    if (jobsFilter === "others" && job.recruiterId === user?.id) return false;
    
    // Filter by status
    if (jobsStatus !== "all" && job.status !== jobsStatus) return false;
    
    // Filter by search
    if (jobsSearch) {
      const search = jobsSearch.toLowerCase();
      return (
        job.title?.toLowerCase().includes(search) ||
        job.location?.toLowerCase().includes(search) ||
        job.companyName?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const statCards = [
    { title: 'Active Jobs', value: stats.activeJobs, change: '+2 this week', icon: Briefcase, color: 'bg-blue-500', link: '/recruiter/jobs' },
    { title: 'Total Applications', value: stats.totalApplications, change: '+23 this week', icon: FileText, color: 'bg-green-500', link: '/recruiter/applications' },
    { title: 'AI Matches', value: stats.aiMatches, change: '+15 this week', icon: Sparkles, color: 'bg-purple-500', link: '/recruiter/ai-matching' },
    { title: 'Submitted to Clients', value: stats.submittedToClients, change: '+8 this week', icon: Building2, color: 'bg-orange-500', link: '/recruiter/submissions' },
  ];

  // Session info for profile dropdown
  const sessionExpiry = (user as any)?.sessionExpiry ? new Date((user as any).sessionExpiry) : null;
  const rememberMe = (user as any)?.rememberMe;

  return (
    <>
      <RecruiterOnboarding 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      
      <div className="min-h-screen bg-gray-50 flex">
        {/* Desktop Sidebar */}
        <aside 
          className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HG</span>
                </div>
                <span className="font-bold text-gray-900">HotGigs</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Sidebar Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-2">
              {sidebarItems.map((item) => {
                const isActive = location === item.path || (item.path !== '/recruiter/dashboard' && location.startsWith(item.path));
                const badgeCount = item.badge === "pending" ? pendingCount : null;
                
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : ''}`} />
                        {!sidebarCollapsed && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                        {badgeCount && badgeCount > 0 && (
                          <Badge 
                            className={`${sidebarCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full`}
                          >
                            {badgeCount}
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">
                        {item.label}
                        {badgeCount && badgeCount > 0 && ` (${badgeCount})`}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer - Quick Actions */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <Button 
                onClick={() => setLocation('/recruiter/jobs/create')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">HG</span>
                      </div>
                      HotGigs
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-2">
                      {sidebarItems.map((item) => {
                        const isActive = location === item.path;
                        const badgeCount = item.badge === "pending" ? pendingCount : null;
                        
                        return (
                          <button
                            key={item.path}
                            onClick={() => {
                              setLocation(item.path);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                              isActive 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : ''}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                            {badgeCount && badgeCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-xs">
                                {badgeCount}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </nav>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <Button 
                      onClick={() => {
                        setLocation('/recruiter/jobs/create');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Dashboard</h1>
            </div>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-blue-200">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'R'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">Recruiter</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {/* Profile Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-blue-200">
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-medium">
                          {user?.name?.charAt(0).toUpperCase() || 'R'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">Recruiter</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  {profilePercentage < 100 && (
                    <div className="p-4 border-b bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Profile Completion</span>
                        <span className="text-sm font-bold text-blue-600">{profilePercentage}%</span>
                      </div>
                      <Progress value={profilePercentage} className="h-2" />
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2 p-0 h-auto text-blue-600"
                        onClick={() => setLocation('/recruiter/onboarding')}
                      >
                        Complete Profile →
                      </Button>
                    </div>
                  )}

                  {/* Session Info */}
                  {sessionExpiry && (
                    <div className="p-4 border-b bg-gray-50">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="text-xs text-gray-600">
                          {rememberMe ? (
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              <span>Staying signed in • Expires {formatDistanceToNow(sessionExpiry, { addSuffix: true })}</span>
                            </div>
                          ) : (
                            <span>Session expires {formatDistanceToNow(sessionExpiry, { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <DropdownMenuLabel className="text-xs text-gray-500 uppercase tracking-wider">Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setLocation('/recruiter/onboarding')} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/recruiter/notification-preferences')} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-6">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
              <p className="opacity-90">Here's what's happening with your recruitment activities today.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {statCards.map((stat, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5"
                  onClick={() => setLocation(stat.link)}
                >
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-xl lg:text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-xs text-green-600 mt-1 hidden sm:block">{stat.change}</p>
                      </div>
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                        <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Jobs Panel */}
            <Card className="mb-6">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                      Jobs
                    </CardTitle>
                    <CardDescription>Manage and track all job postings</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setLocation('/recruiter/jobs/create')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4 pb-4 border-b">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      value={jobsSearch}
                      onChange={(e) => setJobsSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={jobsFilter} onValueChange={(v: any) => setJobsFilter(v)}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="mine">My Jobs</SelectItem>
                      <SelectItem value="others">Team Jobs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={jobsStatus} onValueChange={(v: any) => setJobsStatus(v)}>
                    <SelectTrigger className="w-full sm:w-36">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Jobs List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredJobs.length > 0 ? filteredJobs.slice(0, 10).map((job: any) => (
                    <div 
                      key={job.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-blue-200"
                      onClick={() => setLocation(`/jobs/${job.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{job.title}</h4>
                          {job.recruiterId === user?.id && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Mine
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {job.companyName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />
                              {job.companyName}
                            </span>
                          )}
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                          )}
                          {(job.salaryMin || job.salaryMax) && (
                            <span className="flex items-center gap-1 hidden md:flex">
                              <DollarSign className="h-3.5 w-3.5" />
                              {job.salaryMin && job.salaryMax 
                                ? `$${(job.salaryMin/1000).toFixed(0)}k - $${(job.salaryMax/1000).toFixed(0)}k`
                                : job.salaryMin 
                                  ? `From $${(job.salaryMin/1000).toFixed(0)}k`
                                  : `Up to $${(job.salaryMax/1000).toFixed(0)}k`
                              }
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge 
                          variant="outline" 
                          className={`${
                            job.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                            job.status === 'closed' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {job.status}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No jobs found matching your criteria</p>
                      <Button 
                        variant="link" 
                        onClick={() => {
                          setJobsFilter("all");
                          setJobsStatus("all");
                          setJobsSearch("");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>

                {filteredJobs.length > 10 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => setLocation('/recruiter/jobs')}>
                      View All {filteredJobs.length} Jobs
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Streamline your recruitment workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <Button 
                    onClick={() => setLocation('/recruiter/advanced-search')} 
                    className="h-20 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white flex-col gap-1"
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs">Advanced Search</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/ai-matching')} 
                    className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex-col gap-1"
                  >
                    <Target className="h-5 w-5" />
                    <span className="text-xs">AI Matching</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/interview-calendar')} 
                    className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white flex-col gap-1"
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Calendar View</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/resume-ranking')} 
                    className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white flex-col gap-1"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Resume Ranking</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/bulk-upload')} 
                    className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white flex-col gap-1"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="text-xs">Bulk Upload</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/email-templates')} 
                    className="h-20 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white flex-col gap-1"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="text-xs">Email Templates</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/recruiter/pipeline')} 
                    className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white flex-col gap-1"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-xs">Pipeline View</span>
                  </Button>
                  <Button 
                    onClick={() => setLocation('/analytics')} 
                    className="h-20 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white flex-col gap-1"
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-xs">Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}
