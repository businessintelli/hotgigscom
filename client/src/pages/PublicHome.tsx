import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase, DollarSign, Clock, Building2, Target, Grid3x3, List, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RoleSelectionDialog } from "@/components/RoleSelectionDialog";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function PublicHome() {
  const [, setLocation] = useLocation();
  const [keyword, setKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  useEffect(() => {
    // Check for error in URL query parameters
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
      // Clear the error from URL after 10 seconds
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
        setErrorMessage(null);
      }, 10000);
    }
  }, []);
  const [location, setLocationFilter] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch latest jobs
  const { data: jobs, isLoading } = trpc.job.search.useQuery({
    keyword: keyword || undefined,
    location: location || undefined,
  });

  const handleSearch = () => {
    // Search is automatic via tRPC query
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Top Navigation */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">{APP_TITLE}</h1>
              <div className="hidden md:flex gap-6">
                <button className="text-gray-700 hover:text-blue-600 font-medium">
                  Home
                </button>
                <button 
                  onClick={() => setLocation("/about")}
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  About Us
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.location.href = getLoginUrl()}>
                Sign In
              </Button>
              <Button onClick={() => setShowRoleDialog(true)}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Error Alert */}
      {errorMessage && (
        <div className="container mx-auto px-4 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section with Search */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Find Your Dream Job Today
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Connect with top employers and discover opportunities that match your skills
          </p>

          {/* Search Bar */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Job title, keywords, or company"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-10 h-12"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="City, state, or remote"
                    value={location}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-10 h-12"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} size="lg" className="h-12 px-8">
                  Search Jobs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{jobs?.length || 0}+</div>
              <div className="text-gray-600">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">10K+</div>
              <div className="text-gray-600">Candidates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>

            <Select value={experienceLevel} onValueChange={setExperienceLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Experience Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="entry">Entry Level</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior Level</SelectItem>
                <SelectItem value="lead">Lead/Manager</SelectItem>
              </SelectContent>
            </Select>

            {(keyword || location || jobType || experienceLevel) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setKeyword("");
                  setLocationFilter("");
                  setJobType("");
                  setExperienceLevel("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-gray-900">
              {keyword || location ? "Search Results" : "Latest Job Openings"}
            </h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {jobs.map((job) => (
                <Card 
                  key={job.id} 
                  className={`hover:shadow-lg transition-shadow cursor-pointer ${viewMode === "list" ? "flex" : ""}`}
                  onClick={() => setLocation(`/jobs/${job.id}`)}
                >
                  <CardHeader className={viewMode === "list" ? "flex-1" : ""}>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {job.companyName || "Company"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={`space-y-3 ${viewMode === "list" ? "flex-1 flex items-center gap-6" : ""}`}>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    {(job.salaryMin || job.salaryMax) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="h-4 w-4" />
                      {job.employmentType || "Full-time"}
                    </div>
                    {job.employmentType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Target className="h-4 w-4" />
                        {job.employmentType}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                    {job.requirements && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="secondary">
                          View Requirements
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className={viewMode === "list" ? "ml-auto" : ""}>
                    <Button className={viewMode === "list" ? "" : "w-full"}>View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setKeyword("");
                  setLocationFilter("");
                  setJobType("");
                  setExperienceLevel("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">{APP_TITLE}</h4>
              <p className="text-gray-400">
                AI-Powered Recruitment Platform for Modern Hiring
              </p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Browse Jobs</a></li>
                <li><a href="#" className="hover:text-white">Career Advice</a></li>
                <li><a href="#" className="hover:text-white">Resume Tips</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">For Employers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Post a Job</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Role Selection Dialog */}
      <RoleSelectionDialog 
        open={showRoleDialog} 
        onOpenChange={setShowRoleDialog}
      />
    </div>
  );
}
