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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Bell
} from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import CandidateOnboarding from "@/components/CandidateOnboarding";
import VideoIntroduction from "@/components/VideoIntroduction";
import { NotificationBell } from "@/components/NotificationBell";
import { formatDistanceToNow } from "date-fns";

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
  { icon: Search, label: "Browse Jobs", path: "/jobs", badge: null },
  { icon: Briefcase, label: "My Applications", path: "/my-applications", badge: null },
  { icon: Heart, label: "Saved Jobs", path: "/saved-jobs", badge: null },
  { icon: FileText, label: "My Resumes", path: "/candidate/my-resumes", badge: null },
  { icon: Video, label: "AI Interview", path: "/ai-interview", badge: null },
  { icon: Calendar, label: "Interviews", path: "/my-interviews", badge: null },
  { icon: Star, label: "Recommendations", path: "/recommendations", badge: null },
  { icon: BookOpen, label: "Career Resources", path: "/resources", badge: null },
];

function CandidateDashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    { candidateId: candidate?.id || 0, limit: 3 },
    { enabled: !!candidate?.id }
  );

  // Fetch video introduction
  const { data: videoIntroduction, refetch: refetchVideo } = trpc.resumeProfile.getVideoIntroduction.useQuery(
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
                const isActive = location === item.path;
                return (
                  <Tooltip key={item.path} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setLocation(item.path)}
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
                  const isActive = location === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setLocation(item.path);
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
                        onClick={() => setLocation('/candidate/onboarding')}
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
                  <DropdownMenuItem onClick={() => setLocation('/candidate/onboarding')} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Edit Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/candidate/my-resumes')} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    My Resumes
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

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                {/* Profile Section */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Your Profile</CardTitle>
                        <CardDescription>Manage your professional information</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        {isEditingProfile ? "Cancel" : "Edit Profile"}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditingProfile ? (
                      <>
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
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Name:</span>
                          <span className="text-sm">{candidate?.fullName || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Email:</span>
                          <span className="text-sm">{candidate?.email || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Phone:</span>
                          <span className="text-sm">{candidate?.phone || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Location:</span>
                          <span className="text-sm">{candidate?.location || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Experience:</span>
                          <span className="text-sm">{candidate?.experienceYears || 0} years</span>
                        </div>
                        {candidate?.skills && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {candidate.skills.split(",").map((skill: string, index: number) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                                >
                                  {skill.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resume Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resume</CardTitle>
                    <CardDescription>Upload and manage your resume</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>

                {/* Video Introduction */}
                {candidate?.id && (
                  <VideoIntroduction
                    candidateId={candidate.id}
                    existingVideo={videoIntroduction ? {
                      id: videoIntroduction.id,
                      videoUrl: videoIntroduction.videoUrl,
                      duration: videoIntroduction.duration,
                      uploadedAt: videoIntroduction.createdAt
                    } : null}
                    onUploadSuccess={() => refetchVideo()}
                  />
                )}

                {/* Recommended Jobs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Recommended Jobs
                    </CardTitle>
                    <CardDescription>Jobs matching your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recommendedJobs && recommendedJobs.length > 0 ? (
                      <div className="space-y-4">
                        {recommendedJobs.map((job: any) => (
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
              </div>

              {/* Sidebar Column */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Quick Upload Resume
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation("/candidate/my-resumes")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      My Resumes
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
                    <Button variant="secondary" className="w-full">
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
    </>
  );
}
