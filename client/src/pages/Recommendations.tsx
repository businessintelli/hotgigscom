import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Sparkles,
  Building2,
  Search,
  Filter,
  ChevronRight,
  Heart,
  Share2,
  ExternalLink,
} from "lucide-react";

export default function Recommendations() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("match");
  const [savedJobs, setSavedJobs] = useState<number[]>([]);

  // Get candidate's profile to understand their skills
  const { data: profile } = trpc.candidate.getProfile.useQuery();
  
  // Get all jobs and filter based on candidate's skills
  const { data: jobs, isLoading } = trpc.job.list.useQuery();

  // Calculate match score based on skills overlap
  const calculateMatchScore = (job: any) => {
    if (!profile?.skills || !job.requirements) return 50;
    const candidateSkills = profile.skills.toLowerCase().split(",").map((s: string) => s.trim());
    const jobRequirements = job.requirements.toLowerCase();
    let matchCount = 0;
    candidateSkills.forEach((skill: string) => {
      if (jobRequirements.includes(skill)) matchCount++;
    });
    return Math.min(95, Math.round(50 + (matchCount / candidateSkills.length) * 45));
  };

  // Get recommended jobs with match scores
  const recommendedJobs = jobs?.map((job: any) => ({
    ...job,
    matchScore: calculateMatchScore(job),
  })).sort((a: any, b: any) => {
    if (sortBy === "match") return b.matchScore - a.matchScore;
    if (sortBy === "salary") return (b.salaryMax || 0) - (a.salaryMax || 0);
    if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  }).filter((job: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return job.title.toLowerCase().includes(query) || 
           job.company?.toLowerCase().includes(query) ||
           job.location?.toLowerCase().includes(query);
  }) || [];

  const toggleSaveJob = (jobId: number) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-orange-600 bg-orange-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/candidate-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Job Recommendations</h1>
              <p className="text-slate-500">AI-powered job matches based on your profile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Total Matches</p>
                  <p className="text-2xl font-bold">{recommendedJobs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-green-100 text-sm">High Matches (80%+)</p>
                  <p className="text-2xl font-bold">{recommendedJobs.filter((j: any) => j.matchScore >= 80).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-purple-100 text-sm">Saved Jobs</p>
                  <p className="text-2xl font-bold">{savedJobs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-orange-100 text-sm">Avg Match Score</p>
                  <p className="text-2xl font-bold">
                    {recommendedJobs.length > 0 
                      ? Math.round(recommendedJobs.reduce((acc: number, j: any) => acc + j.matchScore, 0) / recommendedJobs.length)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by job title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Best Match</SelectItem>
                  <SelectItem value="salary">Highest Salary</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Job Recommendations */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recommendedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No recommendations yet</h3>
              <p className="text-slate-500 mb-4">Complete your profile to get personalized job recommendations</p>
              <Button onClick={() => setLocation("/candidate-dashboard")}>
                Update Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recommendedJobs.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Company Logo Placeholder */}
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                    
                    {/* Job Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                              onClick={() => setLocation(`/jobs/${job.id}`)}>
                            {job.title}
                          </h3>
                          <p className="text-slate-600">{job.company || "Company"}</p>
                        </div>
                        <Badge className={`${getMatchColor(job.matchScore)} border-0`}>
                          <Star className="h-3 w-3 mr-1" />
                          {job.matchScore}% Match
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location || "Remote"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.type || "Full-time"}
                        </span>
                        {job.salaryMin && job.salaryMax && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                        {job.description?.substring(0, 200)}...
                      </p>
                      
                      {/* Skills Match */}
                      {job.requirements && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.requirements.split(",").slice(0, 5).map((skill: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button onClick={() => setLocation(`/jobs/${job.id}/apply`)}>
                          Apply Now
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                        <Button variant="outline" onClick={() => setLocation(`/jobs/${job.id}`)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleSaveJob(job.id)}
                          className={savedJobs.includes(job.id) ? "text-red-500" : ""}
                        >
                          <Heart className={`h-4 w-4 ${savedJobs.includes(job.id) ? "fill-current" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
