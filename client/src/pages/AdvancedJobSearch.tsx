import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  Briefcase, MapPin, DollarSign, Clock, Search, Loader2, Building2, 
  Filter, X, SlidersHorizontal, Home, Wifi, MapPinned 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdvancedJobSearch() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Search filters
  const [keyword, setKeyword] = useState("");
  const [location, setLocationFilter] = useState("");
  const [employmentType, setEmploymentType] = useState<string>("all");
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 300000]);
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [remoteOption, setRemoteOption] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(true);

  // Debounced search
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  const [debouncedLocation, setDebouncedLocation] = useState(location);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location);
    }, 300);
    return () => clearTimeout(timer);
  }, [location]);

  // Fetch jobs with filters
  const { data: jobs, isLoading, refetch } = trpc.job.search.useQuery({
    keyword: debouncedKeyword || undefined,
    location: debouncedLocation || undefined,
    employmentType: employmentType !== "all" ? employmentType as any : undefined,
    salaryMin: salaryRange[0],
    salaryMax: salaryRange[1],
    experienceLevel: experienceLevel !== "all" ? experienceLevel as any : undefined,
    remoteOption: remoteOption !== "all" ? remoteOption as any : undefined,
  });

  // Fetch candidate profile
  const { data: candidate } = trpc.candidate.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

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

    setLocation(`/apply/${jobId}`);
  };

  const clearFilters = () => {
    setKeyword("");
    setLocationFilter("");
    setEmploymentType("all");
    setSalaryRange([0, 300000]);
    setExperienceLevel("all");
    setRemoteOption("all");
  };

  const activeFilterCount = [
    keyword,
    location,
    employmentType !== "all",
    salaryRange[0] > 0 || salaryRange[1] < 300000,
    experienceLevel !== "all",
    remoteOption !== "all"
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setLocation("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              HG
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">HotGigs</h1>
              <p className="text-xs text-gray-500">Advanced Job Search</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setLocation("/candidate-dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </CardTitle>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Keyword Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Keyword</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Job title, skills..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="City, state, or country"
                      value={location}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Separator />

                {/* Remote Option */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Wifi className="w-4 h-4" />
                    Work Location
                  </label>
                  <Select value={remoteOption} onValueChange={setRemoteOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Options</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employment Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Employment Type
                  </label>
                  <Select value={employmentType} onValueChange={setEmploymentType}>
                    <SelectTrigger>
                      <SelectValue />
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

                <Separator />

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Experience Level</label>
                  <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                      <SelectItem value="mid">Mid Level (2-5 years)</SelectItem>
                      <SelectItem value="senior">Senior (5+ years)</SelectItem>
                      <SelectItem value="lead">Lead/Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Salary Range
                  </label>
                  <div className="space-y-2">
                    <Slider
                      value={salaryRange}
                      onValueChange={(value) => setSalaryRange(value as [number, number])}
                      min={0}
                      max={300000}
                      step={10000}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>${(salaryRange[0] / 1000).toFixed(0)}k</span>
                      <span>${(salaryRange[1] / 1000).toFixed(0)}k+</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isLoading ? "Searching..." : `${jobs?.length || 0} Jobs Found`}
              </h2>
              <p className="text-gray-600 mt-1">
                Showing results for your search criteria
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                          <CardDescription className="flex flex-wrap gap-3 text-base">
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                            )}
                            {job.employmentType && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {job.employmentType}
                              </span>
                            )}
                            {job.salaryMin && job.salaryMax && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-4">
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {job.description}
                      </p>
                      {job.requirements && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-900 mb-1">Requirements:</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{job.requirements}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={() => handleApply(job.id)}>
                          Apply Now
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLocation(`/jobs/${job.id}`)}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
