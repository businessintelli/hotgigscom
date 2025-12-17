import { useAuth } from "@/_core/hooks/useAuth";
import CandidateLayout from "@/components/CandidateLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Briefcase, MapPin, DollarSign, Clock, Search, Loader2, Building2, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import { JobShareButton } from "@/components/JobShareButton";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function JobBrowser() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useLocalStorage("jobBrowser_searchQuery", "");
  const [locationFilter, setLocationFilter] = useLocalStorage("jobBrowser_locationFilter", "");
  const [typeFilter, setTypeFilter] = useLocalStorage("jobBrowser_typeFilter", "all");

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

    const matchesType = !typeFilter || typeFilter === "all" || job.employmentType === typeFilter;

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
    <CandidateLayout title="Browse Jobs">
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">

      <div className="container mx-auto px-4 py-8">
        {user && (
          <Button 
            onClick={() => setLocation('/candidate/dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Next Opportunity</CardTitle>
            <CardDescription>Browse and filter through available positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">Use filters below or try our advanced search for more options</p>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/jobs/search")}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Advanced Search
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="text-xl font-semibold">{job.title}</h3>
                            <DeadlineBadge deadline={job.applicationDeadline} />
                          </div>
                          <p className="text-gray-600 mb-3">{job.companyName || 'Company Not Specified'}</p>

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
                      <BookmarkButton
                        jobId={job.id}
                        candidateId={candidate?.id}
                        variant="outline"
                      />
                      <JobShareButton
                        jobId={job.id}
                        jobTitle={job.title}
                        companyName={job.companyName || undefined}
                        variant="outline"
                      />
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
    </CandidateLayout>
  );
}
