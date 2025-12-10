import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function RecruiterDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: dashboardData, isLoading } = trpc.recruiter.getDashboardStats.useQuery();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'recruiter')) {
      setLocation('/');
    }
  }, [authLoading, user, setLocation]);

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
    { title: 'Active Jobs', value: stats.activeJobs, change: '+2 this week', icon: '💼', color: 'bg-blue-500' },
    { title: 'Total Applications', value: stats.totalApplications, change: '+23 this week', icon: '📄', color: 'bg-green-500' },
    { title: 'AI Matches', value: stats.aiMatches, change: '+15 this week', icon: '🤖', color: 'bg-purple-500' },
    { title: 'Submitted to Clients', value: stats.submittedToClients, change: '+8 this week', icon: '📧', color: 'bg-orange-500' },
  ];

  return (
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
                <span className="text-xl font-bold">HotGigs</span>
              </div>
              <div className="ml-10 flex space-x-8">
                <button onClick={() => setLocation('/recruiter/dashboard')} className="px-3 py-2 rounded-md text-sm font-medium bg-blue-700">📊 Dashboard</button>
                <button onClick={() => setLocation('/recruiter/jobs/create')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">💼 Jobs</button>
                <button onClick={() => setLocation('/recruiter/customers')} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-500">🏢 Clients</button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">Welcome, {user?.name}!</span>
              <Badge variant="secondary">Recruiter</Badge>
              <Button variant="ghost" size="sm" onClick={() => logout()} className="text-blue-200 hover:text-white hover:bg-blue-500">Sign Out</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name}! 👋</h1>
          <p className="opacity-90">Here's what's happening with your recruitment activities today.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map((stat, index) => (
            <Card key={index}>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button onClick={() => setLocation('/recruiter/ai-matching')} className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                <div className="text-center">
                  <div className="text-lg font-semibold flex items-center justify-center">
                    <span className="mr-2">🎯</span>
                    AI Matching
                  </div>
                  <div className="text-xs opacity-90">View matched candidates</div>
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
              <Button className="h-20 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
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
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
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
  );
}
