import { useAuth } from "@/_core/hooks/useAuth";
import { EmailVerificationGuard } from "@/components/EmailVerificationGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import RecruiterOnboarding from "@/components/RecruiterOnboarding";
import { NotificationBell } from "@/components/NotificationBell";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { SessionInfo } from "@/components/SessionInfo";
import { Menu, X } from "lucide-react";

export default function RecruiterDashboard() {
  return (
    <EmailVerificationGuard>
      <RecruiterDashboardContent />
    </EmailVerificationGuard>
  );
}

function RecruiterDashboardContent() {
  const { user, loading: authLoading, logout } = useAuth();
  
  // Debug logging
  console.log('[RecruiterDashboard] Auth state:', { user, authLoading, hasToken: !!localStorage.getItem('auth_token') });
  const [, setLocation] = useLocation();
  const { data: dashboardData, isLoading } = trpc.recruiter.getDashboardStats.useQuery();
  const { data: profile } = trpc.recruiter.getProfile.useQuery();
  const { data: completionStatus } = trpc.profileCompletion.getStatus.useQuery();
  const { data: pendingReschedules } = (trpc as any).reschedule?.getPendingRequests?.useQuery() || { data: [] };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Don't redirect if we have a token - wait for auth to resolve
    const hasToken = localStorage.getItem('auth_token');
    if (!authLoading && !hasToken && !user) {
      // No token and no user - redirect to login
      setLocation('/');
    } else if (!authLoading && user && user.role !== 'recruiter') {
      // User exists but wrong role - redirect to home
      setLocation('/');
    }
  }, [authLoading, user, setLocation]);

  // Show onboarding if profile is incomplete
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

  const statCards = [
    { title: 'Active Jobs', value: stats.activeJobs, change: '+2 this week', icon: '💼', color: 'bg-blue-500', link: '/recruiter/jobs' },
    { title: 'Total Applications', value: stats.totalApplications, change: '+23 this week', icon: '📄', color: 'bg-green-500', link: '/recruiter/applications' },
    { title: 'AI Matches', value: stats.aiMatches, change: '+15 this week', icon: '🤖', color: 'bg-purple-500', link: '/recruiter/ai-matching' },
    { title: 'Submitted to Clients', value: stats.submittedToClients, change: '+8 this week', icon: '📧', color: 'bg-orange-500', link: '/recruiter/submissions' },
  ];

  return (
    <>
      <RecruiterOnboarding 
        open={showOnboarding} 
        onComplete={() => setShowOnboarding(false)} 
      />
      
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setLocation('/recruiter/dashboard')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">HG</span>
                </div>
                <span className="text-xl font-bold hidden sm:inline">HotGigs</span>
              </div>
              {/* Desktop Navigation */}
              <div className="hidden lg:flex ml-10 space-x-8">
                <button onClick={() => setLocation('/recruiter/dashboard')} className="px-3 py-2 rounded-md text-sm font-medium bg-blue-700">📊 Dashboard</button>
                <button onClick={() => setLocation('/recruiter/jobs/create')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">💼 Jobs</button>
                <button onClick={() => setLocation('/recruiter/search-candidates')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🔍 Candidates</button>
                <button onClick={() => setLocation('/recruiter/interview-playback')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🎥 AI Interviews</button>
                <button onClick={() => setLocation('/recruiter/customers')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🏢 Clients</button>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationBell />
              <span className="text-sm hidden md:inline">Welcome, {user?.name}!</span>
              <Badge variant="secondary" className="hidden sm:inline-flex">Recruiter</Badge>
              <Button variant="ghost" size="sm" onClick={() => logout()} className="text-blue-200 hover:text-white hover:bg-blue-500 hidden sm:inline-flex">Sign Out</Button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md hover:bg-blue-500"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              <button onClick={() => { setLocation('/recruiter/dashboard'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium bg-blue-700">📊 Dashboard</button>
              <button onClick={() => { setLocation('/recruiter/jobs/create'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">💼 Jobs</button>
              <button onClick={() => { setLocation('/recruiter/search-candidates'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🔍 Candidates</button>
              <button onClick={() => { setLocation('/recruiter/interview-playback'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🎥 AI Interviews</button>
              <button onClick={() => { setLocation('/recruiter/customers'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🏢 Clients</button>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500 border-t border-blue-500 mt-2 pt-2">🚪 Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {/* Profile Completion Banner */}
        {completionStatus && completionStatus.percentage !== undefined && completionStatus.percentage < 100 && (
          <ProfileCompletionBanner 
            percentage={completionStatus.percentage} 
            role="recruiter"
          />
        )}
        
        {/* Session Info */}
        <div className="mt-4">
          <SessionInfo />
        </div>
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 sm:p-6 text-white mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="opacity-90 text-sm sm:text-base">Here's what's happening with your recruitment activities today.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {statCards.map((stat, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setLocation(stat.link)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Streamline your recruitment workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={() => setLocation('/recruiter/advanced-search')} className="h-20 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">🔍</span>
                    Advanced Search
                  </div>
                  <div className="text-xs opacity-90">Boolean operators & smart filters</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/ai-matching')} className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">🎯</span>
                    AI Matching
                  </div>
                  <div className="text-xs opacity-90">View matched candidates</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/customers')} className="h-20 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">🏢</span>
                    Customers
                  </div>
                  <div className="text-xs opacity-90">Manage client companies</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/applications')} className="h-20 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📋</span>
                    Applications
                  </div>
                  <div className="text-xs opacity-90">Track and manage applications</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/jobs/create')} className="h-20 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">🤖</span>
                    Create New Job
                  </div>
                  <div className="text-xs opacity-90">Manual, AI-powered, or Excel import</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/interviews')} className="h-20 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📅</span>
                    Interviews
                  </div>
                  <div className="text-xs opacity-90">Schedule and manage interviews</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/interview-calendar')} className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📆</span>
                    Calendar View
                  </div>
                  <div className="text-xs opacity-90">Drag & drop to reschedule</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/reschedule-requests')} className="h-20 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white relative">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">🔄</span>
                    Reschedule Requests
                  </div>
                  <div className="text-xs opacity-90">Manage panelist requests</div>
                </div>
                {pendingReschedules && pendingReschedules.filter((r: any) => r.status === 'pending').length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    {pendingReschedules.filter((r: any) => r.status === 'pending').length}
                  </Badge>
                )}
              </Button>
              <Button onClick={() => setLocation('/recruiter/search-candidates')} className="h-20 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold">🔍 Search Candidates</div>
                  <div className="text-xs opacity-90">Find candidates by skills</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/customers')} className="h-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold">🏢 Manage Clients</div>
                  <div className="text-xs opacity-90">Add and manage clients</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/resume-ranking')} className="h-20 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📊</span>
                    Resume Ranking
                  </div>
                  <div className="text-xs opacity-90">AI-powered candidate ranking</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/bulk-upload')} className="h-20 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📦</span>
                    Bulk Upload
                  </div>
                  <div className="text-xs opacity-90">Upload multiple resumes at once</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/email-templates')} className="h-20 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📧</span>
                    Email Templates
                  </div>
                  <div className="text-xs opacity-90">Create reusable email templates</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/recruiter/campaigns')} className="h-20 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📬</span>
                    Email Campaigns
                  </div>
                  <div className="text-xs opacity-90">Bulk email with tracking</div>
                </div>
              </Button>
              <Button onClick={() => setLocation('/analytics')} className="h-20 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">📊</span>
                    Analytics Dashboard
                  </div>
                  <div className="text-xs opacity-90">Hiring metrics & insights</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your latest job postings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.length > 0 ? recentJobs.map(job => (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/jobs/${job.id}`)}
                >
                  <div>
                    <h4 className="font-semibold">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.location}</p>
                    <p className="text-xs text-gray-500">Posted {new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">{job.status}</Badge>
                    <p className="text-sm font-medium">0 applications</p>
                  </div>
                </div>
              )) : (
                <p className="text-center text-gray-500 py-4">No recent jobs. Create your first job!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
