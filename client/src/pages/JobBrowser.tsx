import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Briefcase, MapPin, DollarSign, Clock, Search, Loader2, Building2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function JobBrowser() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Fetch all public jobs
  const { data: jobs, isLoading } = trpc.job.list.useQuery();

  // Fetch candidate profile to check if they have a resume
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Filter jobs based on search and filters
  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter || job.location?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesType = !typeFilter || job.employmentType === typeFilter;

    return matchesSearch && matchesLocation && matchesType;
  });

  const handleApply = (jobId: number) => {
    if (!user) {
      toast.error("Please sign in to apply for jobs");
      setLocation("/");
      return;
    }

    if (!candidate) {
      toast.error("Please complete your profile first");
      setLocation("/candidate-dashboard");
      return;
    }

    if (!candidate.resumeUrl) {
      toast.error("Please upload your resume before applying");
      setLocation("/candidate-dashboard");
      return;
    }

    // Navigate to application page
    setLocation(`/apply/${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              HG
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HotGigs
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <Button variant="outline" onClick={() => setLocation("/candidate-dashboard")}>
                Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={() => setLocation("/")}>
              {user ? "Logout" : "Sign In"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Next Opportunity</CardTitle>
            <CardDescription>Browse and filter through available positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search jobs by title or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Input
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div className="space-y-4">
          {filteredJobs && filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
                          <p className="text-gray-600 mb-3">Company Name</p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            {job.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                            )}
                            {job.employmentType && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                <span className="capitalize">{job.employmentType}</span>
                              </div>
                            )}
                            {job.salaryMin && job.salaryMax && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {job.salaryCurrency || "$"}
                                  {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {job.description && (
                            <p className="text-gray-700 line-clamp-2 mb-4">{job.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {job.requirements &&
                              job.requirements
                                .split(",")
                                .slice(0, 5)
                                .map((req, index) => (
                                  <span
                                    key={index}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                  >
                                    {req.trim()}
                                  </span>
                                ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button onClick={() => handleApply(job.id)} className="whitespace-nowrap">
                        Apply Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/jobs/${job.id}`)}
                        className="whitespace-nowrap"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-gray-600">
                  {searchQuery || locationFilter || typeFilter
                    ? "Try adjusting your search filters"
                    : "No jobs are currently available"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Summary */}
        {filteredJobs && filteredJobs.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            Showing {filteredJobs.length} of {jobs?.length || 0} jobs
          </div>
        )}
      </div>
    </div>
  );
}
