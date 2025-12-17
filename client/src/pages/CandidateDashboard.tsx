import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Briefcase, 
  FileText, 
  Eye, 
  TrendingUp, 
  Upload, 
  Search, 
  Users, 
  MessageSquare, 
  Loader2, 
  Heart,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Clock,
  Shield,
  User,
  Video,
  Calendar,
  Star,
  BookOpen,
  Bell,
  ArrowUpDown,
  CalendarDays,
  ChevronDown,
  X,
  Mail,
  HelpCircle
} from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import CandidateOnboarding from "@/components/CandidateOnboarding";
// VideoIntroduction moved to dedicated page
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { formatDistanceToNow, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";

export default function CandidateDashboard() {
  return (
    <EmailVerificationGuard>
      <CandidateDashboardContent />
    </EmailVerificationGuard>
  );
}

// Sidebar navigation items for candidates
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/candidate-dashboard", badge: null },
  { icon: FileText, label: "My Resume", path: "/candidate/my-resumes", badge: null },
  { icon: Video, label: "Video Introduction", path: "/candidate/video-intro", badge: null },
  { icon: Search, label: "Browse Jobs", path: "/jobs", badge: null },
  { icon: Briefcase, label: "My Applications", path: "/my-applications", badge: null },
  { icon: Heart, label: "Saved Jobs", path: "/saved-jobs", badge: null },
  { icon: CalendarDays, label: "Calendar", path: null, badge: null, isCalendar: true },
  { icon: Users, label: "Associates", path: "/candidate/associates", badge: null },
  { icon: MessageSquare, label: "AI Career Coach", path: "/candidate/career-coach", badge: null },
  { icon: Star, label: "Recommendations", path: "/recommendations", badge: null },
  { icon: BookOpen, label: "Career Resources", path: "/resources", badge: null },
  { icon: Mail, label: "Messages", path: "/candidate/messages", badge: null },
  { icon: Settings, label: "Settings", path: "/candidate/settings", badge: null },
  { icon: HelpCircle, label: "Help & Support", path: "/help", badge: null },
];

type SortOption = 'date_desc' | 'date_asc' | 'match_desc' | 'match_asc' | 'salary_desc' | 'salary_asc';

// Helper function to get missing profile fields
function getMissingFields(candidate: any): string[] {
  const missing: string[] = [];
  if (!candidate) return missing;
  
  if (!candidate.title) missing.push('Job Title');
  if (!candidate.phoneNumber) missing.push('Phone Number');
  if (!candidate.location) missing.push('Location');
  if (!candidate.skills) missing.push('Skills');
  if (!candidate.experience) missing.push('Experience');
  if (!candidate.bio) missing.push('Bio/Summary');
  if (!candidate.availability) missing.push('Availability');
  if (!candidate.expectedSalaryMin) missing.push('Expected Salary');
  if (!candidate.resumeUrl) missing.push('Resume');
  
  return missing;
}

function CandidateDashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch candidate profile
  const { data: candidate, isLoading: candidateLoading, refetch: refetchCandidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch profile completion status
  const { data: completionStatus } = trpc.profileCompletion.getStatus.useQuery();

  // Fetch candidate statistics
  const { data: stats } = trpc.candidate.getStats.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Fetch AI-powered recommended jobs
  const { data: recommendedJobs } = trpc.candidate.getRecommendedJobs.useQuery(
    { candidateId: candidate?.id || 0, limit: 6 },
    { enabled: !!candidate?.id }
  );

  // Video introduction moved to dedicated page at /candidate/video-intro

  // Fetch interviews for calendar
  const { data: interviews } = trpc.interview.getByCandidate.useQuery(
    { candidateId: candidate?.id || 0 },
    { enabled: !!candidate?.id }
  );

  // Mutations
  const updateProfileMutation = trpc.candidate.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
      refetchCandidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const uploadResumeMutation = trpc.candidate.uploadResume.useMutation({
    onSuccess: () => {
      toast.success("Resume uploaded successfully");
      refetchCandidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to upload resume: ${error.message}`);
    },
  });

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    skills: "",
    experience: "",
    bio: "",
  });

  // Initialize form when candidate data loads
  useEffect(() => {
    if (candidate) {
      setProfileForm({
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        phone: candidate.phone || "",
        location: candidate.location || "",
        skills: candidate.skills || "",
        experience: candidate.experienceYears?.toString() || "",
        bio: candidate.bio || "",
      });
    }
  }, [candidate]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      await uploadResumeMutation.mutateAsync({
        candidateId: candidate?.id || 0,
        fileName: file.name,
        fileData: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = () => {
    if (!candidate?.id) return;
    
    updateProfileMutation.mutate({
      id: candidate.id,
      fullName: profileForm.fullName,
      email: profileForm.email,
      phone: profileForm.phone,
      location: profileForm.location,
      skills: profileForm.skills,
      experienceYears: parseInt(profileForm.experience) || 0,
      bio: profileForm.bio,
    });
  };

  // Show onboarding if profile is incomplete
  useEffect(() => {
    if (candidate && !candidate.title) {
      setShowOnboarding(true);
    }
  }, [candidate]);

  // Redirect if not authenticated or not a candidate
  useEffect(() => {
    const hasToken = localStorage.getItem('auth_token');
    if (!authLoading && !hasToken && !user) {
      setLocation('/');
    } else if (!authLoading && user && user.role !== 'candidate') {
      setLocation('/');
    }
  }, [authLoading, user, setLocation]);

  // Sort recommended jobs
  const sortedJobs = useMemo(() => {
    if (!recommendedJobs) return [];
    const jobs = [...recommendedJobs];
    
    switch (sortBy) {
      case 'date_desc':
        return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'date_asc':
        return jobs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'match_desc':
        return jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      case 'match_asc':
        return jobs.sort((a, b) => (a.matchScore || 0) - (b.matchScore || 0));
      case 'salary_desc':
        return jobs.sort((a, b) => (b.salaryMax || 0) - (a.salaryMax || 0));
      case 'salary_asc':
        return jobs.sort((a, b) => (a.salaryMin || 0) - (b.salaryMin || 0));
      default:
        return jobs;
    }
  }, [recommendedJobs, sortBy]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const interviewsByDate = useMemo(() => {
    if (!interviews) return {};
    const map: Record<string, any[]> = {};
    interviews.forEach((interview: any) => {
      if (!interview.scheduledAt) return;
      const date = new Date(interview.scheduledAt);
      if (isNaN(date.getTime())) return; // Skip invalid dates
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(interview);
    });
    return map;
  }, [interviews]);

  if (authLoading || candidateLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">HG</span>
          </div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const profilePercentage = completionStatus?.percentage || 0;
  const sessionExpiry = (user as any)?.sessionExpiry ? new Date((user as any).sessionExpiry) : null;
  const rememberMe = (user as any)?.rememberMe;

  const statCards = [
    { title: 'Applications', value: stats?.totalApplications || 0, description: 'Total submitted', icon: Briefcase, color: 'bg-blue-500' },
    { title: 'Interviews', value: stats?.interviews || 0, description: 'Scheduled', icon: Users, color: 'bg-green-500' },
    { title: 'Profile Views', value: stats?.profileViews || 0, description: 'By recruiters', icon: Eye, color: 'bg-purple-500' },
    { title: 'Resume Score', value: `${stats?.resumeScore || 0}%`, description: 'ATS compatibility', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <>
      <CandidateOnboarding 
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
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
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
            <nav className="px-2 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = item.path ? location === item.path : false;
                return (
                  <Tooltip key={item.label} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          if (item.isCalendar) {
                            setShowCalendar(true);
                          } else if (item.path) {
                            setLocation(item.path);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left text-sm">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="h-16 flex items-center px-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HG</span>
                </div>
                <SheetTitle className="font-bold text-gray-900">HotGigs</SheetTitle>
              </div>
            </SheetHeader>
            <ScrollArea className="flex-1 py-4">
              <nav className="px-2 space-y-1">
                {sidebarItems.map((item) => {
                  const isActive = item.path ? location === item.path : false;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.isCalendar) {
                          setShowCalendar(true);
                        } else if (item.path) {
                          setLocation(item.path);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-emerald-50 text-emerald-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-emerald-600' : ''}`} />
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search jobs, companies..." 
                  className="pl-9 bg-gray-50 border-gray-200"
                  onClick={() => setLocation('/jobs')}
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 lg:gap-4">
              <NotificationBell />
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <Avatar className="h-8 w-8 border-2 border-emerald-200">
                      <AvatarFallback className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium">
                        {candidate?.fullName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'C'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{candidate?.fullName || user?.name}</p>
                      <p className="text-xs text-gray-500">Candidate</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {/* Profile Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-emerald-200">
                        <AvatarFallback className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-lg font-medium">
                          {candidate?.fullName?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{candidate?.fullName || user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">Candidate</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  {profilePercentage < 100 && (
                    <div className="p-4 border-b bg-emerald-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-900">Profile Completion</span>
                        <span className="text-sm font-bold text-emerald-600">{profilePercentage}%</span>
                      </div>
                      <Progress value={profilePercentage} className="h-2" />
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="mt-2 p-0 h-auto text-emerald-600"
                        onClick={() => setShowProfileSettings(true)}
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
                  <DropdownMenuItem onClick={() => setShowProfileSettings(true)} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile & Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCalendar(true)} className="cursor-pointer">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info('Settings coming soon')} className="cursor-pointer">
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
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white mb-6">
              <h1 className="text-2xl font-bold mb-2">Welcome back, {candidate?.fullName || user?.name}! 👋</h1>
              <p className="opacity-90">Track your job applications and discover new opportunities.</p>
            </div>

            {/* Profile Completion Banner */}
            {profilePercentage < 100 && completionStatus && (
              <ProfileCompletionBanner 
                percentage={profilePercentage}
                role="candidate"
                missingFields={getMissingFields(candidate)}
              />
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {statCards.map((stat, index) => (
                <Card key={index} className="hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-xl lg:text-2xl font-bold mt-1">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-1 hidden sm:block">{stat.description}</p>
                      </div>
                      <div className={`w-10 h-10 lg:w-12 lg:h-12 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                        <stat.icon className="h-5 w-5 lg:h-6 lg:w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recommended Jobs with Sorting */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          Recommended Jobs
                        </CardTitle>
                        <CardDescription>Jobs matching your profile</CardDescription>
                      </div>
                      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                        <SelectTrigger className="w-[180px]">
                          <ArrowUpDown className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date_desc">Newest First</SelectItem>
                          <SelectItem value="date_asc">Oldest First</SelectItem>
                          <SelectItem value="match_desc">Highest Match</SelectItem>
                          <SelectItem value="match_asc">Lowest Match</SelectItem>
                          <SelectItem value="salary_desc">Highest Salary</SelectItem>
                          <SelectItem value="salary_asc">Lowest Salary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {sortedJobs && sortedJobs.length > 0 ? (
                      <div className="space-y-4">
                        {sortedJobs.map((job: any) => (
                          <div
                            key={job.id}
                            className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setLocation(`/jobs/${job.id}`)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.companyName || 'Company Not Specified'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                  {job.matchScore || 85}% Match
                                </span>
                                <DeadlineBadge deadline={job.applicationDeadline} />
                                <BookmarkButton
                                  jobId={job.id}
                                  candidateId={candidate?.id}
                                  variant="ghost"
                                  size="sm"
                                />
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{job.location}</p>
                            <div className="flex gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {job.type}
                              </span>
                              {job.salaryMin && job.salaryMax && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  ${job.salaryMin.toLocaleString()}-${job.salaryMax.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-8">
                        No recommendations yet. Complete your profile to get personalized job matches!
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Video Introduction - Moved to dedicated page at /candidate/video-intro */}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                {/* Gamification - Badges and Points */}
                <BadgeDisplay />

                {/* Upcoming Interviews */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      Upcoming Interviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interviews && interviews.length > 0 ? (
                      <div className="space-y-3">
                        {interviews.slice(0, 3).map((interview: any) => (
                          <div key={interview.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-sm">{interview.job?.title || 'Interview'}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(interview.scheduledAt), 'MMM d, yyyy h:mm a')}
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {interview.type}
                            </Badge>
                          </div>
                        ))}
                        <Button 
                          variant="link" 
                          className="w-full text-emerald-600"
                          onClick={() => setShowCalendar(true)}
                        >
                          View Calendar →
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No upcoming interviews
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/my-resume")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Resume
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowProfileSettings(true)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/jobs")}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search Jobs
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/my-applications")}
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      My Applications
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/saved-jobs")}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Saved Jobs
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowCalendar(true)}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Calendar View
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/recommendations")}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Recommendations
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/resources")}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Career Resources
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/candidate/career-coach")}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      AI Career Coach
                    </Button>
                  </CardContent>
                </Card>

                {/* AI Career Coach */}
                <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                  <CardHeader>
                    <CardTitle>AI Career Coach</CardTitle>
                    <CardDescription className="text-emerald-100">
                      Get personalized career advice 24/7
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={() => setLocation("/candidate/career-coach")}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Chat with Orion
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Profile Settings Dialog */}
      <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profile & Resume Settings</DialogTitle>
            <DialogDescription>Manage your profile information and resume</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="resume">Resume</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  placeholder="e.g., JavaScript, React, Node.js"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </TabsContent>
            
            <TabsContent value="resume" className="space-y-4 mt-4">
              {candidate?.resumeUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-emerald-600" />
                      <div>
                        <p className="font-medium">Resume uploaded</p>
                        <p className="text-sm text-gray-600">
                          Last updated: {new Date(candidate.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Replace
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-600">PDF, DOC, or DOCX (max 5MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Interview Calendar
            </DialogTitle>
            <DialogDescription>View and manage your scheduled interviews</DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 flex gap-6">
            {/* Calendar Section */}
            <div className="flex-1">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(subMonths(calendarDate, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {format(calendarDate, 'MMMM yyyy')}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCalendarDate(new Date())}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Today
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setCalendarDate(addMonths(calendarDate, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before the first of the month */}
                {Array.from({ length: calendarDays[0]?.getDay() || 0 }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 bg-gray-50 rounded-lg" />
                ))}
                
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayInterviews = interviewsByDate[dateKey] || [];
                  const hasInterviews = dayInterviews.length > 0;
                  
                  return (
                    <div
                      key={dateKey}
                      className={`h-20 p-1 border rounded-lg transition-all hover:shadow-md cursor-pointer ${
                        isToday(day) ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200' : 'border-gray-200 hover:border-emerald-300'
                      } ${!isSameMonth(day, calendarDate) ? 'opacity-50' : ''}`}
                    >
                      <div className={`text-sm font-medium ${
                        isToday(day) ? 'text-emerald-600 bg-emerald-100 w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      {hasInterviews && (
                        <div className="mt-1 space-y-0.5">
                          {dayInterviews.slice(0, 2).map((interview: any) => (
                            <div
                              key={interview.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${
                                interview.type === 'ai-interview' 
                                  ? 'bg-purple-100 text-purple-700'
                                  : interview.type === 'video'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-emerald-100 text-emerald-700'
                              }`}
                              title={interview.job?.title}
                            >
                              {format(new Date(interview.scheduledAt), 'h:mm a')}
                            </div>
                          ))}
                          {dayInterviews.length > 2 && (
                            <div className="text-xs text-gray-500 font-medium">
                              +{dayInterviews.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Interviews Sidebar */}
            <div className="w-72 border-l pl-6">
              <h4 className="font-semibold text-gray-900 mb-4">Upcoming Interviews</h4>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {(interviews || []).filter((i: any) => new Date(i.scheduledAt) >= new Date()).slice(0, 10).map((interview: any) => (
                    <div key={interview.id} className="p-3 border rounded-lg hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className={`text-xs ${
                          interview.type === 'ai-interview' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : interview.type === 'video'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {interview.type === 'ai-interview' ? 'AI Interview' : interview.type === 'video' ? 'Video' : 'In-Person'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(interview.scheduledAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate">{interview.job?.title || 'Interview'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(interview.scheduledAt), 'EEE, MMM d • h:mm a')}
                      </p>
                      {interview.meetingLink && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2 text-xs"
                          onClick={() => window.open(interview.meetingLink, '_blank')}
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Join Meeting
                        </Button>
                      )}
                    </div>
                  ))}
                  {(!interviews || interviews.filter((i: any) => new Date(i.scheduledAt) >= new Date()).length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No upcoming interviews</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200" />
              <span>AI Interview</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
              <span>Video Call</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" />
              <span>In-Person</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
